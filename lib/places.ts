
import { CATEGORIES, CategoryId, ServiceCategory } from "./categories";
import { haversineMeters } from "./distance";

export interface Place {
  id: string;
  name: string;
  categoryId: CategoryId;
  lat: number;
  lng: number;
  distance: number; // metres from user
  phone?: string;
  address?: string;
  emergency?: boolean;
  openingHours?: string;
}
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

const REQUEST_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string, body: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}


function buildCombinedQuery(lat: number, lng: number, radius: number): string {
  const around = `(around:${radius},${lat},${lng})`;
  const parts: string[] = [];
  for (const cat of CATEGORIES) {
    for (const [k, v] of cat.osm) {
      const filter = v === "*" ? `["${k}"]` : `["${k}"="${v}"]`;
      parts.push(`node${filter}${around};`);
      parts.push(`way${filter}${around};`);
    }
  }
  return `[out:json][timeout:60];(${parts.join("")});out center tags;`;
}

function matchCategory(tags: Record<string, string>): ServiceCategory | null {
  for (const cat of CATEGORIES) {
    for (const [k, v] of cat.osm) {
      if (tags[k] && (v === "*" || tags[k] === v)) return cat;
    }
  }
  return null;
}

function buildAddress(tags: Record<string, string>): string | undefined {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"] || tags["addr:neighbourhood"],
    tags["addr:city"] || tags["addr:town"] || tags["addr:village"],
    tags["addr:postcode"],
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

// Run one combined query against ALL mirrors at once and take whichever
// responds first with data. Racing (rather than trying mirrors one-by-one) is
// far more resilient on slow mobile networks — a single slow or down mirror
// can't stall the whole request. Throws only if every mirror fails.
async function fetchElements(query: string): Promise<OverpassElement[]> {
  const body = "data=" + encodeURIComponent(query);
  const attempts = OVERPASS_ENDPOINTS.map(async (endpoint) => {
    const res = await fetchWithTimeout(endpoint, body);
    if (!res.ok) throw new Error(`Overpass ${res.status}`);
    const data = (await res.json()) as { elements?: OverpassElement[]; remark?: string };
    const elements = data.elements ?? [];
    if (!elements.length) throw new Error(data.remark || "Empty Overpass result");
    return elements;
  });
  // First mirror to return a non-empty result wins.
  return Promise.any(attempts);
}

// Radii (metres) tried in order. In dense areas the first radius already
// returns plenty and we stop; sparse rural areas widen automatically so the
// nearest police / pharmacy / tyre shop in the next town still show up.
const SEARCH_RADII = [8000, 30000, 60000];

export async function fetchNearbyPlaces(lat: number, lng: number): Promise<Place[]> {
  let places: Place[] = [];
  let gotAny = false;

  for (let i = 0; i < SEARCH_RADII.length; i++) {
    try {
      const elements = await fetchElements(buildCombinedQuery(lat, lng, SEARCH_RADII[i]));
      places = parseElements(elements, lat, lng);
      gotAny = true;
    } catch (err) {
      if (!gotAny) throw err; // nothing at all → caller falls back to cache
      break; // an expansion failed; keep what we already have
    }

    const distinctCategories = new Set(places.map((p) => p.categoryId)).size;
    // Stop once results are diverse/dense enough, or we've widened to the max.
    if (distinctCategories >= 5 || places.length >= 80 || i === SEARCH_RADII.length - 1) {
      break;
    }
  }

  return places;
}

function parseElements(
  elements: OverpassElement[],
  userLat: number,
  userLng: number
): Place[] {
  const seen = new Set<string>();
  const places: Place[] = [];

  for (const el of elements) {
    const tags = el.tags ?? {};
    const cat = matchCategory(tags);
    if (!cat) continue;

    const plat = el.lat ?? el.center?.lat;
    const plng = el.lon ?? el.center?.lon;
    if (plat == null || plng == null) continue;

    const name =
      tags.name ||
      tags["name:en"] ||
      tags.operator ||
      tags.brand ||
      cat.label.replace(/s$/, "");

    // De-dupe by name + rough location.
    const key = `${name}@${plat.toFixed(4)},${plng.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    places.push({
      id: `${el.type}/${el.id}`,
      name,
      categoryId: cat.id,
      lat: plat,
      lng: plng,
      distance: haversineMeters(userLat, userLng, plat, plng),
      phone: tags.phone || tags["contact:phone"] || tags["contact:mobile"],
      address: buildAddress(tags),
      emergency: tags.emergency === "yes" || tags.emergency === "ambulance_station",
      openingHours: tags.opening_hours,
    });
  }

  places.sort((a, b) => a.distance - b.distance);
  return places;
}

export interface GeoContext {
  countryCode?: string;
  countryName?: string;
  displayName?: string;
}

// Reverse-geocode the user's coordinates to a country (for emergency numbers).
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeoContext> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    const data = await res.json();
    return {
      countryCode: data.address?.country_code?.toUpperCase(),
      countryName: data.address?.country,
      displayName:
        [data.address?.city, data.address?.town, data.address?.village, data.address?.state]
          .filter(Boolean)
          .join(", ") || data.display_name,
    };
  } catch {
    return {};
  } finally {
    clearTimeout(timer);
  }
}

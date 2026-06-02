
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
// All third-party calls go through our own same-origin API routes (see
// app/api/overpass and app/api/geocode) so browser shields, carrier blocking
// and CORS can never break them in production.
const CLIENT_TIMEOUT_MS = 28000;


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

// Send the query to our own /api/overpass route, which races the mirrors
// server-side and returns the elements. Same-origin → never blocked client-side.
async function fetchElements(query: string): Promise<OverpassElement[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  try {
    const res = await fetch("/api/overpass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Overpass proxy ${res.status}`);
    const data = (await res.json()) as { elements?: OverpassElement[] };
    const elements = data.elements ?? [];
    if (!elements.length) throw new Error("Empty Overpass result");
    return elements;
  } finally {
    clearTimeout(timer);
  }
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

// Reverse-geocode via our own /api/geocode route (server sets the User-Agent
// Nominatim requires, and same-origin avoids client-side blocking).
export async function reverseGeocode(lat: number, lng: number): Promise<GeoContext> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  try {
    const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`, { signal: controller.signal });
    if (!res.ok) return {};
    return (await res.json()) as GeoContext;
  } catch {
    return {};
  } finally {
    clearTimeout(timer);
  }
}

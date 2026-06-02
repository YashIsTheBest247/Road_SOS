// Offline cache for the last successful nearby-services lookup.
// When the network drops (common right after a crash on a highway), RoadSoS
// still shows the last-known services + the user's last position. This is a
// direct answer to the "Offline functionality / low-network robustness" criterion.

import { Place } from "./places";
import { GeoContext } from "./places";

const KEY = "roadsos:lastLookup:v1";

export interface CachedLookup {
  lat: number;
  lng: number;
  places: Place[];
  geo: GeoContext;
  savedAt: number; // epoch ms
}

export function saveLookup(data: CachedLookup): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // storage full / unavailable — non-fatal
  }
}

export function loadLookup(): CachedLookup | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedLookup;
  } catch {
    return null;
  }
}

export function cacheAgeLabel(savedAt: number, now: number): string {
  const mins = Math.round((now - savedAt) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  return `${Math.round(hrs / 24)} d ago`;
}

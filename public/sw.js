// RoadSoS service worker — minimal & safe.
// Goal: enable offline RELOAD of the app shell (so "toggle offline + reload"
// still works) WITHOUT touching cross-origin requests. Map tiles, Overpass and
// Nominatim go straight to the network exactly as they do on localhost — the SW
// never intercepts them, so it can't break the live map.

const CACHE = "roadsos-v2";
const SHELL = ["/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // ONLY handle same-origin requests. Everything cross-origin (OSM tiles,
  // Overpass, Nominatim, Gemini) passes through untouched to the network.
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first, fall back to the cached shell only when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/").then((r) => r || fetch(request)))
    );
    return;
  }

  // Same-origin static assets (hashed JS/CSS, icons): cache-first with a network
  // fallback that also fills the cache — needed for offline reload.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request)
          .then((res) => {
            if (res && res.status === 200 && res.type === "basic") {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
            }
            return res;
          })
          .catch(() => cached)
    )
  );
});

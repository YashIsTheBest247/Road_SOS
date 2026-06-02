// RoadSoS service worker — app-shell + runtime caching for offline robustness.
// Strategy:
//   • App shell & static assets: cache-first (instant offline launch).
//   • Navigations: network-first, fall back to cached shell when offline.
//   • Map tiles & API data: stale-while-revalidate so the last view survives
//     a dropped connection (critical right after a crash).

const CACHE = "roadsos-v1";
const SHELL = ["/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
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

function staleWhileRevalidate(request) {
  return caches.open(CACHE).then((cache) =>
    cache.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200) cache.put(request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Navigations: network-first with offline shell fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/").then((r) => r || caches.match(request)))
    );
    return;
  }

  // Map tiles + geo/services APIs: keep the last successful response usable offline.
  const runtimeHosts = [
    "tile.openstreetmap.org",
    "overpass-api.de",
    "overpass.kumi.systems",
    "nominatim.openstreetmap.org",
  ];
  if (runtimeHosts.some((h) => url.hostname.endsWith(h))) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Same-origin static assets: cache-first.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || staleWhileRevalidate(request))
    );
  }
});

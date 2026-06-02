"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Place, fetchNearbyPlaces, reverseGeocode, GeoContext } from "@/lib/places";
import { CategoryId } from "@/lib/categories";
import { getEmergencyNumbers } from "@/lib/emergencyNumbers";
import { saveLookup, loadLookup, cacheAgeLabel } from "@/lib/cache";
import SiteHeader from "@/components/SiteHeader";
import EmergencyBar from "@/components/EmergencyBar";
import GoldenHourTimer from "@/components/GoldenHourTimer";
import ServiceList from "@/components/ServiceList";
import SosOverlay from "@/components/SosOverlay";
import FirstAidAssistant from "@/components/FirstAidAssistant";
import AccidentChecklist from "@/components/AccidentChecklist";
import FloatingChat from "@/components/FloatingChat";
import LocationModal from "@/components/LocationModal";
import InstallPrompt from "@/components/InstallPrompt";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted">Loading map…</div>
  ),
});

// Fallback demo location (central Delhi) — used if a judge denies GPS permission,
// so the app is always demoable.
const DEMO = { lat: 28.6139, lng: 77.209 };

// TODO(developer): replace with your exact GitHub URL — this is a guess.
const GITHUB_URL = "https://github.com/YashIsTheBest247";

type Status = "idle" | "locating" | "fetching" | "ready" | "error";
type Tab = "services" | "assistant" | "checklist";

export default function Home() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  // Default to India so the emergency numbers are useful immediately; this is
  // replaced with the user's real country once location is detected.
  const [geo, setGeo] = useState<GeoContext>({ countryCode: "IN", countryName: "India" });
  const [places, setPlaces] = useState<Place[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [cacheAt, setCacheAt] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryId | "all">("all");
  const [tab, setTab] = useState<Tab>("services");
  const [sosOpen, setSosOpen] = useState(false);
  const [goldenStart, setGoldenStart] = useState<number | null>(null);
  const [focusPlace, setFocusPlace] = useState<Place | null>(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const mapColRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pendingMapScroll, setPendingMapScroll] = useState(false);

  // "Find help near me": locate, then (once results/map are ready) scroll to map.
  function findHelp() {
    setPendingMapScroll(true);
    locate(false);
  }

  // Scroll the tab panel so its bottom (the chat typing area) is in view.
  // Two rAFs so it runs after the conditionally-rendered panel has laid out.
  function scrollPanelToEnd() {
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        panelRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
      )
    );
  }

  // Switch tab; when opening the First-Aid AI, scroll its typing area into view.
  function selectTab(id: Tab) {
    setTab(id);
    if (id === "assistant") scrollPanelToEnd();
  }

  const loadServices = useCallback(async (lat: number, lng: number) => {
    setStatus("fetching");
    setError(null);
    try {
      const [found, geoCtx] = await Promise.all([
        fetchNearbyPlaces(lat, lng),
        reverseGeocode(lat, lng),
      ]);
      setPlaces(found);
      setGeo(geoCtx);
      setStatus("ready");
      setOffline(false);
      setCacheAt(null);
      saveLookup({ lat, lng, places: found, geo: geoCtx, savedAt: Date.now() });
    } catch {
      const cached = loadLookup();
      if (cached) {
        setCoords({ lat: cached.lat, lng: cached.lng });
        setPlaces(cached.places);
        setGeo(cached.geo);
        setCacheAt(cached.savedAt);
        setOffline(true);
        setStatus("ready");
      } else {
        setStatus("error");
        setError("Couldn't reach the services network and no offline data is saved yet.");
      }
    }
  }, []);

  const useCached = useCallback(() => {
    const cached = loadLookup();
    if (!cached) return false;
    setCoords({ lat: cached.lat, lng: cached.lng });
    setPlaces(cached.places);
    setGeo(cached.geo);
    setCacheAt(cached.savedAt);
    setOffline(true);
    setStatus("ready");
    return true;
  }, []);

  const locate = useCallback(
    (demo = false) => {
      if (demo || !("geolocation" in navigator)) {
        setCoords(DEMO);
        loadServices(DEMO.lat, DEMO.lng);
        return;
      }
      setStatus("locating");
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(c);
          loadServices(c.lat, c.lng);
        },
        () => {
          // Location off / denied → show the enable-location popup (fall back to
          // cached data first if we have it).
          if (!useCached()) {
            setStatus("idle");
            setLocationModalOpen(true);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    },
    [loadServices, useCached]
  );

  // Connectivity → offline banner.
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // Note any cached lookup on first paint so the app is useful instantly offline.
  useEffect(() => {
    const cached = loadLookup();
    if (cached) setCacheAt(cached.savedAt);
  }, []);

  // Let the header's "First-Aid" / "Services" links also switch the active tab,
  // and for First-Aid scroll all the way to the chat typing area.
  useEffect(() => {
    const onHash = () => {
      const h = location.hash;
      if (h === "#firstaid") {
        setTab("assistant");
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            panelRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
          )
        );
      } else if (h === "#services") {
        setTab("services");
      }

      // Helplines / Services / Map depend on the user's real location to replace
      // the India default. Fetch it the first time they visit one of these.
      const needsLocation = h === "#numbers" || h === "#services" || h === "#map";
      if (needsLocation && !coords && status !== "locating" && status !== "fetching") {
        if (h === "#map") setPendingMapScroll(true);
        locate(false);
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [locate, coords, status]);

  // After "Find help near me", scroll to the map once it exists (coords set).
  useEffect(() => {
    if (pendingMapScroll && coords) {
      setPendingMapScroll(false);
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          mapColRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        )
      );
    }
  }, [pendingMapScroll, coords]);

  function triggerSOS() {
    if (goldenStart == null) setGoldenStart(Date.now());
    setSosOpen(true);
    if (!coords) locate();
  }

  function focusOnMap(p: Place) {
    setFocusPlace(p);
    mapColRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const em = getEmergencyNumbers(geo.countryCode);
  const nearest = places[0];
  const busy = status === "locating" || status === "fetching";

  // Markers to draw on the map. When a category is selected, show ALL of that
  // category. For "All", guarantee the nearest of every category is included so
  // sparse types (police, tyre repair) aren't crowded off by dense ones.
  const mapPlaces = useMemo(() => {
    if (activeCategory !== "all") {
      return places.filter((p) => p.categoryId === activeCategory).slice(0, 200);
    }
    const PER_CAT = 14;
    const chosen: Place[] = [];
    const ids = new Set<string>();
    const perCount: Record<string, number> = {};
    for (const p of places) {
      const n = perCount[p.categoryId] ?? 0;
      if (n < PER_CAT) {
        perCount[p.categoryId] = n + 1;
        chosen.push(p);
        ids.add(p.id);
      }
    }
    for (const p of places) {
      if (chosen.length >= 160) break;
      if (!ids.has(p.id)) {
        chosen.push(p);
        ids.add(p.id);
      }
    }
    return chosen;
  }, [places, activeCategory]);

  return (
    <>
      <SiteHeader offline={offline} location={geo.displayName} />

      <main id="top" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-16">
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="pt-3 sm:pt-5">
          <h1 className="display text-[2.3rem] leading-[0.95] sm:text-[5.5rem] sm:leading-[0.9] lg:text-[7rem]">
            Found fast.
            <br />
            Saved faster<span className="text-emergency">.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-ink-soft sm:text-lg">
            The nearest trauma centre, ambulance, police and rescue — pulled from live maps in one
            tap. Built for the golden hour, and it keeps working <span className="font-semibold text-ink">offline,
            anywhere in the world.</span>
          </p>

          {/* Primary actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={triggerSOS}
              className="group flex items-center justify-center gap-2 rounded-full bg-emergency px-7 py-4 text-lg font-black uppercase tracking-wide text-white shadow-lg shadow-emergency/25 transition hover:-translate-y-0.5 active:scale-95"
              style={{ animation: "rsos-pulse 2.2s infinite" }}
            >
              SOS — get help now
            </button>
            <button
              onClick={findHelp}
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-full border-2 border-ink bg-transparent px-7 py-4 text-lg font-bold uppercase tracking-wide text-ink transition hover:bg-ink hover:text-paper active:scale-95 disabled:opacity-50"
            >
              {status === "locating"
                ? "Locating…"
                : status === "fetching"
                ? " Searching…"
                : status === "ready"
                ? `${places.length} services found`
                : "Find help near me"}
            </button>
          </div>

          {/* Stat strip */}
          <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
            {[
              ["8", "Service types"],
              ["50+", "Countries"],
              ["Live", "Map data"],
              ["AI+Offline", "First-aid help"],
            ].map(([n, l]) => (
              <div key={l} className="bg-paper px-3 py-5 sm:px-4">
                <dt className="display text-2xl leading-none text-ink sm:text-4xl">{n}</dt>
                <dd className="eyebrow mt-1.5 text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </section>

        <InstallPrompt />

        {offline && cacheAt && (
          <div className="mt-8 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
            You&apos;re offline. Showing the last saved services ({cacheAgeLabel(cacheAt, Date.now())}) and
            built-in emergency numbers — these still work without a network.
          </div>
        )}

        {/* ── EMERGENCY + GOLDEN HOUR ──────────────────────────── */}
        <section id="numbers" className="mt-10 scroll-mt-24 grid gap-3 sm:grid-cols-2">
          <EmergencyBar
            countryCode={geo.countryCode}
            countryName={geo.countryName}
            locationKnown={!!coords}
            onLocate={findHelp}
          />
          {goldenStart != null ? (
            <GoldenHourTimer startedAt={goldenStart} />
          ) : (
            <button
              onClick={triggerSOS}
              className="flex flex-col items-start justify-center rounded-2xl border border-dashed border-line-strong bg-card p-4 text-left transition hover:border-emergency"
            >
              <span className="eyebrow text-emergency-ink">⏱ Golden hour</span>
              <span className="mt-1 text-sm text-ink-soft">
                In an accident? Tap to start the survival countdown and open the SOS panel.
              </span>
            </button>
          )}
        </section>

        {error && (
          <div className="mt-4 rounded-2xl border border-emergency/40 bg-emergency/10 p-4 text-sm text-emergency-ink">
            <p>{error}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {coords ? (
                <button
                  onClick={() => loadServices(coords.lat, coords.lng)}
                  disabled={busy}
                  className="rounded-full bg-emergency px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white disabled:opacity-60"
                >
                  {busy ? "Retrying…" : "Try again"}
                </button>
              ) : (
                <button
                  onClick={() => locate(false)}
                  disabled={busy}
                  className="rounded-full bg-emergency px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white disabled:opacity-60"
                >
                  Try again
                </button>
              )}
              <button
                onClick={() => locate(true)}
                className="rounded-full border border-emergency/50 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-emergency-ink"
              >
                Use demo location
              </button>
            </div>
          </div>
        )}

        {/* ── MAP ──────────────────────────────────────────────── */}
        {coords && (
          <section id="map" className="mt-10 scroll-mt-20">
            <SectionTitle index="" title="Live map" sub="Tap a marker for details & directions" />
            <div
              ref={mapColRef}
              className="mt-4 scroll-mt-24 overflow-hidden rounded-3xl border border-line shadow-sm"
              style={{ height: 340 }}
            >
              <MapView
                lat={focusPlace?.lat ?? coords.lat}
                lng={focusPlace?.lng ?? coords.lng}
                places={mapPlaces}
                onSelect={(p) => setFocusPlace(p)}
              />
            </div>
            {nearest && (
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-line bg-card px-4 py-3 text-sm">
                <span className="eyebrow text-emergency-ink">Nearest help</span>
                <span className="font-bold text-ink">{nearest.name}</span>
                <span className="text-muted">· {(nearest.distance / 1000).toFixed(1)} km</span>
              </div>
            )}
          </section>
        )}

        {/* ── SERVICES / AI / CHECKLIST ────────────────────────── */}
        <section id="services" className="mt-12 scroll-mt-20">
          <span id="firstaid" className="block -translate-y-20" />
          <SectionTitle index="" title="Help around you" sub="Hospitals, police, towing, tyre repair & more" />

          <div className="mt-4 flex gap-1 rounded-full border border-line bg-paper-2 p-1">
            {(
              [
                ["services", "Services"],
                ["assistant", "First-Aid AI"],
                ["checklist", "Checklist"],
              ] as [Tab, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => selectTab(id)}
                className={`flex-1 whitespace-nowrap rounded-full px-1 py-2.5 text-[0.7rem] font-bold uppercase tracking-wide transition sm:text-sm sm:tracking-wide ${
                  tab === id ? "bg-ink text-paper shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div ref={panelRef} className="mt-4 min-h-[20rem] scroll-mt-4 rounded-3xl border border-line bg-paper-2/40 p-4">
            {tab === "services" &&
              (places.length > 0 ? (
                <ServiceList
                  places={places}
                  activeCategory={activeCategory}
                  onCategory={setActiveCategory}
                  onFocus={focusOnMap}
                />
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted">
                    Tap <span className="font-bold text-ink">Find help near me</span> to load nearby hospitals,
                    police, towing, tyre repair and more.
                  </p>
                  <button
                    onClick={findHelp}
                    disabled={busy}
                    className="mt-4 rounded-full bg-ink px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-paper disabled:opacity-50"
                  >
                    Find help near me
                  </button>
                </div>
              ))}

            {tab === "assistant" && (
              <div className="h-[28rem]">
                <FirstAidAssistant />
              </div>
            )}

            {tab === "checklist" && <AccidentChecklist />}
          </div>
        </section>

        <footer className="mt-16 border-t border-line pt-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            {/* Left — brand & copyright */}
            <div>
              <p className="display text-base tracking-tight text-ink">
                ROAD<span className="text-emergency">SOS</span>
              </p>
              <p className="mt-1 text-xs text-muted">© 2026 RoadSoS · All Rights Reserved</p>
            </div>

            {/* Right — connect with developer */}
            <div className="sm:text-right">
              <p className="eyebrow text-muted">Connect with the developer</p>
              <div className="mt-2 flex gap-3 sm:justify-end">
                <a
                  href="https://yash-munshi.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-bold text-ink transition hover:border-emergency hover:text-emergency"
                >
                  Portfolio
                  <span aria-hidden>↗</span>
                </a>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-bold text-ink transition hover:border-emergency hover:text-emergency"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2 0-.4-.5-1.6.2-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17 4.7 18 5 18 5c.7 1.6.2 2.8.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.5.3.8 1 .8 2v3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z" />
                  </svg>
                  GitHub
                  <span aria-hidden>↗</span>
                </a>
              </div>
            </div>
          </div>

          
        </footer>
      </main>

      <SosOverlay
        open={sosOpen}
        onClose={() => setSosOpen(false)}
        lat={coords?.lat ?? null}
        lng={coords?.lng ?? null}
        ambulance={em.ambulance}
        placeName={geo.displayName}
      />

      <FloatingChat />

      <LocationModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onRetry={() => locate(false)}
        onDemo={() => locate(true)}
      />
    </>
  );
}

function SectionTitle({ index, title, sub }: { index: string; title: string; sub: string }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-line pb-3">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-sm font-bold text-emergency">{index}</span>
        <h2 className="display text-2xl sm:text-3xl">{title}</h2>
      </div>
      <p className="hidden text-right text-xs text-muted sm:block">{sub}</p>
    </div>
  );
}

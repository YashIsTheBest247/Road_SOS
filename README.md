# 🆘 RoadSoS — Emergency Help on the Road, Anywhere

**Road Safety Hackathon 2026 · Problem Statement 1.3 — RoadSoS**

A location-based emergency companion for the moments right after a road accident.
In the **golden hour**, every second counts — RoadSoS finds the nearest trauma
centres, ambulances, police, towing and tyre repair, shows the correct local
emergency numbers, and guides bystanders through first aid with a real AI
chatbot — **even with no network**.

> Built with Next.js 16 + React 19 + Tailwind v4. Live map data from
> OpenStreetMap (no API key). Live AI chat via Google Gemini, with a full
> offline fallback. Installable, offline-capable PWA.

---

## Criteria + Functions

| Criterion | What RoadSoS does |
|---|---|
| **Reliability & data accuracy** | Live data from the **OpenStreetMap Overpass API** with 3 mirror endpoints, per-request abort timeouts, and an **auto-expanding search radius** (8 → 30 → 60 km) so even sparse rural areas return results. Curated, offline emergency-number DB for ~50 countries (112 universal fallback). |
| **Number of contacts fetched** | One lookup returns **8 service categories** — hospitals/clinics/trauma, police, pharmacies, fire, fuel, **towing, puncture/tyre, car showrooms** — distance-sorted, with tap-to-call phone numbers and addresses. |
| **Offline functionality** | Full **PWA + service worker**, last lookup cached to `localStorage`, built-in emergency numbers, and an **AI first-aid assistant that runs entirely offline** via a deterministic intent engine. The app stays useful with zero bars. |
| **Innovation & additional features** | One-tap **SOS** (call + live-location share + **flash & siren beacon**), a **golden-hour countdown**, a **floating Gemini AI chatbot** (the hackathon's AI-chatbot theme), an enable-location prompt, and an at-the-scene checklist. |
| **Information integration across countries** | Country auto-detected from GPS → correct ambulance/police/fire numbers (India by default before a fix); OSM data is worldwide, so the *same app works in any country*. |

---

## Key features

- **📍 Find help near me** — nearest hospitals/clinics, police, ambulance, fire,
  fuel, towing, tyre/puncture and showrooms, distance-sorted with **tap-to-call**
  and **directions**. The map respects the active category filter and guarantees
  the nearest of every category is shown.
- **☎️ Emergency numbers + Helplines** — the correct ambulance/police/fire/112
  numbers for your country (India by default, auto-updating on location). One tap
  opens the **phone dialer** (numbers are sanitised so even messy OSM numbers
  dial cleanly).
- **🆘 SOS panel** — call the ambulance, **share your live location** (native
  share / clipboard), and a **flash + siren beacon** (screen flash + a siren
  synthesised live via the Web Audio API — no audio file, works offline) so the
  victim is *seen and heard*.
- **⏱ Golden-hour timer** — a live countdown that makes the critical first hour
  tangible.
- **🤖 AI First-Aid Assistant** — a **floating red chatbot** (and a First-Aid
  tab). Ask "someone is bleeding", "not breathing", "trapped in the car"; get
  calm, numbered steps. Powered by **Google Gemini** when a key is set, with a
  **deterministic offline engine** fallback — so it *always* answers, even with
  no network or exhausted quota.
- **📍 Enable-location popup** — if location is off/blocked, a modal explains how
  to enable it, with retry and demo-location fallbacks so it's never a dead end.
- **✅ At-the-scene checklist** — the right actions, in the right order.

---

## Run it

```bash
cd roadsos
npm install
npm run dev          # http://localhost:3000
```

Build for production:

```bash
npm run build && npm start
```

### Enable the live Gemini AI chatbot

The floating chatbot and First-Aid tab work offline out of the box. To enable
**live Google Gemini** answers, create `.env.local`:

```
GEMINI_API_KEY=your_key_here
# optional — defaults to gemini-2.5-flash
GEMINI_MODEL=gemini-2.5-flash
```

Get a free key at https://aistudio.google.com/apikey, then restart the dev
server (`.env.local` is only read at startup). The `/api/assistant` route calls
Gemini and **gracefully falls back to the offline engine** on any error, missing
key, or rate limit — so the demo never breaks.

### Deploy (Vercel)

Push to GitHub → import at vercel.com (Next.js auto-detected) → add the
`GEMINI_API_KEY` (and optional `GEMINI_MODEL`) environment variables → Deploy.
You get an **HTTPS** URL — required for geolocation on mobile. `.env.local` is
git-ignored and never deployed; set the key in Vercel's dashboard instead.

---

## How to Use:

1. Open the app. The **emergency numbers** show India by default and tap-to-dial.
2. Tap **Find help near me** → allow location → services + map populate. (Deny it
   and the **enable-location popup** appears with a demo-location fallback.)
3. Tap a **category chip** (e.g. Towing, Tyre) — the list *and* map filter to it.
4. Tap **🆘 SOS** → show **Call ambulance**, **Share live location**, and the
   **flash + siren beacon**. The **golden-hour timer** starts counting down.
5. Open the **floating red chatbot** → ask *"the driver is unconscious"* → live
   Gemini answer (tagged "Gemini AI · live").
6. Open DevTools → **toggle Offline** → reload. Cached services, emergency
   numbers and the assistant still work — **the offline criterion, live.**

---

## Architecture

```
app/
  page.tsx            Orchestrator: geolocation, fetch, offline fallback, layout
  layout.tsx          Metadata, Archivo font, theme, PWA manifest + SW registration
  manifest.ts         PWA manifest (/manifest.webmanifest)
  icon.svg            Branded favicon (App Router auto-icon)
  globals.css         Premium cream/ink editorial theme
  api/assistant/route.ts   First-aid AI — Google Gemini, offline fallback
components/
  SiteHeader          Sticky segmented pill nav + scroll-spy
  EmergencyBar        Country emergency numbers (tap-to-call)
  ServiceList         Category chips + distance-sorted results
  MapView             Leaflet map (free OSM tiles), category-aware markers
  GoldenHourTimer     Live golden-hour countdown
  SosOverlay          Call · share location · flash + siren beacon
  FirstAidAssistant   Chat UI (Gemini live / offline fallback)
  FloatingChat        Always-on red chatbot FAB + panel
  LocationModal       Enable-location prompt
  AccidentChecklist   At-the-scene checklist
  RegisterSW          Service-worker registration
lib/
  places.ts           Adaptive-radius Overpass query + parse + reverse-geocode
  categories.ts       8 service categories → OSM tags
  emergencyNumbers.ts Global emergency-number DB (~50 countries)
  firstAid.ts         Offline first-aid knowledge + intent matcher
  phone.ts            tel: link sanitiser (reliable mobile dialling)
  cache.ts            Offline lookup cache
  distance.ts         Haversine + drive-time ETA
public/
  sw.js               Service worker (app shell + runtime caching)
  icon.svg            PWA / home-screen icon
```

**Costs nothing to run the map.** OpenStreetMap (Overpass + Nominatim) and
built-in data only. The only optional key is Gemini (free tier), and the app
works fully without it.

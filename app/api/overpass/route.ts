// Server-side proxy for the OpenStreetMap Overpass API.
// The browser calls THIS route (same-origin), and the server fetches Overpass.
// This sidesteps every client-side failure mode that breaks the live site but
// not localhost: browser shields (Brave), mobile-carrier domain blocking, CORS
// quirks, and referer filtering. The server can also send a proper User-Agent.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
const TIMEOUT_MS = 20000;

async function fetchOne(endpoint: string, body: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "RoadSoS/1.0 (Road Safety Hackathon 2026)",
      },
      body,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Overpass ${res.status}`);
    const data = (await res.json()) as { elements?: unknown[]; remark?: string };
    const elements = data.elements ?? [];
    if (!elements.length) throw new Error(data.remark || "Empty result");
    return elements;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: NextRequest) {
  let query = "";
  try {
    query = String((await req.json()).query ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

  const body = "data=" + encodeURIComponent(query);
  try {
    // Race all mirrors — first one with data wins.
    const elements = await Promise.any(ENDPOINTS.map((e) => fetchOne(e, body)));
    return NextResponse.json({ elements });
  } catch {
    return NextResponse.json({ error: "All Overpass mirrors failed" }, { status: 502 });
  }
}

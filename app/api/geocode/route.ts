// Server-side proxy for Nominatim reverse-geocoding (coords → country).
// Nominatim's usage policy requires a valid User-Agent, which we can only set
// reliably server-side. Proxying also avoids client-side blocking (Brave, etc.).

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  if (!lat || !lng) return NextResponse.json({}, { status: 400 });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "RoadSoS/1.0 (Road Safety Hackathon 2026)",
        "Accept-Language": "en",
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    const data = await res.json();
    return NextResponse.json({
      countryCode: data.address?.country_code?.toUpperCase(),
      countryName: data.address?.country,
      displayName:
        [data.address?.city, data.address?.town, data.address?.village, data.address?.state]
          .filter(Boolean)
          .join(", ") || data.display_name,
    });
  } catch {
    return NextResponse.json({});
  } finally {
    clearTimeout(timer);
  }
}

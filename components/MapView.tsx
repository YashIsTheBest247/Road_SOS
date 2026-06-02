"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Place } from "@/lib/places";
import { CATEGORY_MAP } from "@/lib/categories";
import { formatDistance } from "@/lib/distance";
import { telHref } from "@/lib/phone";

function coloredIcon(emoji: string, color: string, pulse = false) {
  return L.divIcon({
    className: "",
    html: `<div style="
      background:${color};width:30px;height:30px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 6px rgba(0,0,0,.4);border:2px solid #fff;
      ${pulse ? "animation:rsos-pulse 1.5s infinite;" : ""}">
      <span style="transform:rotate(45deg);font-size:15px;line-height:1;">${emoji}</span>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  });
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom() < 13 ? 14 : map.getZoom());
  }, [lat, lng, map]);
  return null;
}

interface Props {
  lat: number;
  lng: number;
  places: Place[];
  onSelect?: (p: Place) => void;
}

export default function MapView({ lat, lng, places, onSelect }: Props) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={lat} lng={lng} />

      {/* User location */}
      <Circle center={[lat, lng]} radius={120} pathOptions={{ color: "#22d3ee", fillColor: "#22d3ee", fillOpacity: 0.25 }} />
      <Marker position={[lat, lng]} icon={coloredIcon("📍", "#06b6d4", true)}>
        <Popup>You are here</Popup>
      </Marker>

      {places.slice(0, 250).map((p) => {
        const cat = CATEGORY_MAP[p.categoryId];
        return (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={coloredIcon(cat.emoji, cat.color)}
            eventHandlers={{ click: () => onSelect?.(p) }}
          >
            <Popup>
              <strong>{p.name}</strong>
              <br />
              {cat.label} · {formatDistance(p.distance)}
              {p.phone && (
                <>
                  <br />
                  <a href={telHref(p.phone)}>{p.phone}</a>
                </>
              )}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

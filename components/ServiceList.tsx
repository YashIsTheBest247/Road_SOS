"use client";

import { useMemo } from "react";
import { Place } from "@/lib/places";
import { CATEGORIES, CATEGORY_MAP, CategoryId } from "@/lib/categories";
import { formatDistance, estimateDriveMinutes } from "@/lib/distance";
import { telHref } from "@/lib/phone";

interface Props {
  places: Place[];
  activeCategory: CategoryId | "all";
  onCategory: (c: CategoryId | "all") => void;
  onFocus: (p: Place) => void;
}

function directionsUrl(p: Place) {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
}

export default function ServiceList({ places, activeCategory, onCategory, onFocus }: Props) {
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of places) c[p.categoryId] = (c[p.categoryId] ?? 0) + 1;
    return c;
  }, [places]);

  const filtered = useMemo(
    () => (activeCategory === "all" ? places : places.filter((p) => p.categoryId === activeCategory)),
    [places, activeCategory]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Category filter chips with live counts */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => onCategory("all")}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold uppercase tracking-wide transition ${
            activeCategory === "all"
              ? "border-ink bg-ink text-paper"
              : "border-line bg-card text-muted hover:border-line-strong hover:text-ink"
          }`}
        >
          All · {places.length}
        </button>
        {CATEGORIES.map((cat) => {
          const on = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategory(cat.id)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                on ? "text-white" : "border-line bg-card text-ink-soft hover:border-line-strong"
              }`}
              style={on ? { background: cat.color, borderColor: cat.color } : undefined}
            >
              {cat.emoji} {cat.short} · {counts[cat.id] ?? 0}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-6 text-center text-sm text-muted">
          No results in this category nearby. Try a different category or widen the search.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {filtered.slice(0, 50).map((p) => {
          const cat = CATEGORY_MAP[p.categoryId];
          return (
            <li
              key={p.id}
              className="rounded-2xl border border-line bg-card p-3 transition hover:border-line-strong hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ background: cat.color + "22" }}
                >
                  {cat.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="truncate font-bold text-ink">{p.name}</h3>
                    <span className="shrink-0 text-sm font-black tracking-tight text-emergency">
                      {formatDistance(p.distance)}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-muted">
                    {cat.short} · ~{estimateDriveMinutes(p.distance)} min drive
                    {p.emergency ? " · 🚨 24/7 emergency" : ""}
                  </p>
                  {p.address && <p className="mt-0.5 truncate text-xs text-muted/80">{p.address}</p>}

                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {p.phone && (
                      <a
                        href={telHref(p.phone)}
                        className="rounded-lg bg-ink px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-paper active:scale-95"
                      >
                        📞 Call
                      </a>
                    )}
                    <a
                      href={directionsUrl(p)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-line-strong bg-paper px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ink active:scale-95"
                    >
                      🧭 Directions
                    </a>
                    <button
                      onClick={() => onFocus(p)}
                      className="rounded-lg border border-line-strong bg-paper px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ink active:scale-95"
                    >
                      📍 On map
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

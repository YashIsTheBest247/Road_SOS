"use client";

import { useEffect, useState } from "react";

const NAV = [
  { id: "top", label: "Home" },
  { id: "numbers", label: "Helplines" },
  { id: "services", label: "Services" },
  { id: "firstaid", label: "First-Aid" },
  { id: "map", label: "Map" },
];

interface Props {
  offline: boolean;
  location?: string;
}

export default function SiteHeader({ offline, location }: Props) {
  const [active, setActive] = useState("top");

  // Lightweight scroll-spy so the active pill follows the section in view.
  useEffect(() => {
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    if (!sections.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        {/* Brand */}
        <a href="#top" className="flex shrink-0 items-baseline gap-0.5">
          <span className="display text-xl tracking-tighter">ROAD</span>
          <span className="display text-xl tracking-tighter text-emergency">SOS</span>
        </a>

        {/* Segmented pill nav */}
        <nav className="hidden rounded-full border border-line bg-paper-2 p-1 sm:flex">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              onClick={() => setActive(n.id)}
              className={`rounded-full px-4 py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.14em] transition ${
                active === n.id
                  ? "bg-card text-ink shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              {n.label}
            </a>
          ))}
        </nav>

        {/* Right side: location, plus an offline badge only when actually offline */}
        <div className="flex shrink-0 items-center gap-2 text-right">
          {location && (
            <span className="hidden max-w-[10rem] truncate text-xs text-muted md:block">📍 {location}</span>
          )}
          {offline && (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Offline
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

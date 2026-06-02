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
  const [menuOpen, setMenuOpen] = useState(false);

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
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        {/* Brand */}
        <a href="#top" onClick={() => setMenuOpen(false)} className="flex shrink-0 items-baseline gap-0.5">
          <span className="display text-xl tracking-tighter">ROAD</span>
          <span className="display text-xl tracking-tighter text-emergency">SOS</span>
        </a>

        {/* Segmented pill nav — desktop only */}
        <nav className="hidden rounded-full border border-line bg-paper-2 p-1 sm:flex">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              onClick={() => setActive(n.id)}
              className={`rounded-full px-4 py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.14em] transition ${
                active === n.id ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {n.label}
            </a>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex shrink-0 items-center gap-2 text-right">
          {location && (
            <span className="hidden max-w-[10rem] truncate text-xs text-muted md:block">📍 {location}</span>
          )}
          {offline && (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Offline
            </span>
          )}

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-ink sm:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <nav className="border-t border-line bg-paper px-4 pb-3 pt-1 sm:hidden">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              onClick={() => {
                setActive(n.id);
                setMenuOpen(false);
              }}
              className={`block rounded-xl px-3 py-2.5 text-sm font-semibold uppercase tracking-wide transition ${
                active === n.id ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-2"
              }`}
            >
              {n.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

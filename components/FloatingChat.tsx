"use client";

import { useState } from "react";
import FirstAidAssistant from "./FirstAidAssistant";

// Always-available floating First-Aid chatbot (bottom-right).
// Red to match the emergency theme; live Gemini answers with an offline
// fallback so it works in low-network conditions.
export default function FloatingChat() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Chat panel */}
      <div
        className={`fixed bottom-24 right-4 z-40 w-[min(92vw,24rem)] origin-bottom-right transition-all duration-200 sm:right-6 ${
          open ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0"
        }`}
      >
        <div className="flex h-[32rem] max-h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-3xl border border-line bg-paper shadow-2xl shadow-black/30">
          {/* Header */}
          <div className="flex items-center justify-between bg-emergency px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <ChatIcon className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-black uppercase tracking-wide">First-Aid AI</p>
                <p className="flex items-center gap-1 text-[0.65rem] text-white/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Live · works offline too
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Chat body */}
          <div className="min-h-0 flex-1 bg-paper-2/40 p-3">
            <FirstAidAssistant />
          </div>
        </div>
      </div>

      {/* Floating action button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close First-Aid AI" : "Open First-Aid AI"}
        className="group fixed bottom-5 right-4 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-emergency text-white shadow-xl shadow-emergency/40 transition hover:scale-105 active:scale-95 sm:right-6"
        style={{ animation: open ? undefined : "rsos-pulse 2.4s infinite" }}
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        ) : (
          <ChatIcon className="h-7 w-7" />
        )}
        {!open && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[0.7rem] font-black text-emergency shadow">
            AI
          </span>
        )}
      </button>
    </>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8A8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

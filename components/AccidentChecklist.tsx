"use client";

import { useState } from "react";

// A calm, ordered checklist of what to do at an accident scene.
// Works fully offline; ticking persists for the session.
const STEPS = [
  "Stop safely. Switch on hazard lights.",
  "Check for danger: fire, fuel, oncoming traffic.",
  "Move to a safe spot if the vehicle could be hit.",
  "Call emergency services (numbers at the top).",
  "Check the injured: are they responsive and breathing?",
  "Control heavy bleeding with firm pressure.",
  "Do NOT move anyone with a suspected neck/spine injury.",
  "Keep injured people warm, still and reassured.",
  "Note location, vehicle numbers, and take photos if safe.",
  "Guide responders to your exact location.",
];

export default function AccidentChecklist() {
  const [done, setDone] = useState<boolean[]>(() => STEPS.map(() => false));
  const completed = done.filter(Boolean).length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="eyebrow text-muted">At-the-scene checklist</span>
        <span className="text-sm font-black tracking-tight text-ink">
          {completed}
          <span className="text-muted">/{STEPS.length}</span>
        </span>
      </div>
      <ul className="space-y-1">
        {STEPS.map((s, i) => (
          <li key={i}>
            <button
              onClick={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))}
              className="flex w-full items-start gap-3 rounded-xl p-2 text-left transition hover:bg-paper-2/60"
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs transition ${
                  done[i]
                    ? "border-accent bg-accent text-white"
                    : "border-line-strong text-transparent"
                }`}
              >
                ✓
              </span>
              <span className={`text-sm ${done[i] ? "text-muted line-through" : "text-ink-soft"}`}>
                <span className="font-bold text-ink">{i + 1}.</span> {s}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

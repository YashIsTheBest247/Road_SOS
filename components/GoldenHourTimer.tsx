"use client";

import { useEffect, useState } from "react";

// The "golden hour" — the ~60 minutes after a trauma in which prompt care most
// improves survival. This timer makes that window tangible and creates urgency.
const GOLDEN_HOUR_MS = 60 * 60 * 1000;

export default function GoldenHourTimer({ startedAt }: { startedAt: number | null }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (startedAt == null) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (startedAt == null || now == null) return null;

  const elapsed = now - startedAt;
  const remaining = Math.max(0, GOLDEN_HOUR_MS - elapsed);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const pct = Math.min(100, (elapsed / GOLDEN_HOUR_MS) * 100);
  const danger = remaining < 15 * 60 * 1000;

  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="eyebrow text-emergency-ink">⏱ Golden hour</span>
        <span
          className={`font-mono text-2xl font-black tracking-tight ${
            danger ? "text-emergency" : "text-ink"
          }`}
        >
          {mins}:{secs.toString().padStart(2, "0")}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-2">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${pct}%`,
            background: danger ? "#d63a2f" : "#16140f",
          }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">
        Survival is highest when treatment starts within the first hour after a crash.
      </p>
    </div>
  );
}

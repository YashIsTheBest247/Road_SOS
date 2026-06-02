"use client";

import { getEmergencyNumbers } from "@/lib/emergencyNumbers";
import { telHref } from "@/lib/phone";

interface Props {
  countryCode?: string;
  countryName?: string;
  /** true once the user's real location has been detected */
  locationKnown?: boolean;
  /** triggers a location lookup ("Find help near me") */
  onLocate?: () => void;
}

function CallChip({ label, number, accent }: { label: string; number?: string; accent: string }) {
  if (!number) return null;
  return (
    <a
      href={telHref(number)}
      className="group flex flex-1 flex-col items-center rounded-xl border border-line bg-card px-2 py-2.5 text-center transition hover:-translate-y-0.5 hover:shadow-md active:scale-95"
    >
      <span className="eyebrow text-[0.6rem] text-muted">{label}</span>
      <span className="text-2xl font-black tracking-tight" style={{ color: accent }}>
        {number}
      </span>
    </a>
  );
}

export default function EmergencyBar({ countryCode, countryName, locationKnown, onLocate }: Props) {
  const e = getEmergencyNumbers(countryCode);
  const name = countryName || e.country;

  return (
    <div className="rounded-2xl border border-line bg-paper-2/60 p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="eyebrow text-muted">Emergency numbers</span>
        <span className="text-xs font-medium text-ink-soft">
          {countryCode ? `${countryCode} · ` : ""}
          {name}
        </span>
      </div>
      <div className="flex gap-2">
        <CallChip label="Ambulance" number={e.ambulance} accent="#d63a2f" />
        <CallChip label="Police" number={e.police} accent="#1d4ed8" />
        <CallChip label="Fire" number={e.fire} accent="#ea580c" />
        <CallChip label="General" number={e.general} accent="#1f6f6b" />
      </div>

      {!locationKnown && (
        <p className="mt-2 px-1 text-[11px] text-muted">
          📍 Showing India defaults — grant location access to update.{" "}
          <button
            onClick={onLocate}
            className="font-semibold text-emergency underline underline-offset-2"
          >
            Find help near me
          </button>
        </p>
      )}
    </div>
  );
}

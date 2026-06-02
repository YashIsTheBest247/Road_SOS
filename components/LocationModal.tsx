"use client";

interface Props {
  open: boolean;
  onClose: () => void;
  onRetry: () => void;
  onDemo: () => void;
}

// Shown when the browser/device location is off or permission was denied.
// We can't force the OS prompt, so we explain how to enable it, plus offer a
// retry and a demo-location fallback so the app is never a dead end.
export default function LocationModal({ open, onClose, onRetry, onDemo }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[900] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-line bg-paper p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emergency/10 text-3xl">
          📍
        </div>
        <h2 className="mt-4 text-center text-xl font-black tracking-tight text-ink">
          Turn on location
        </h2>
        <p className="mt-2 text-center text-sm text-ink-soft">
          RoadSoS needs your location to find the nearest hospitals, police and rescue around you.
          It looks like location is turned off or blocked.
        </p>

        <div className="mt-4 rounded-2xl border border-line bg-card p-3 text-xs text-muted">
          <p className="mb-1 font-bold uppercase tracking-wide text-ink-soft">How to enable</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>Turn on your device&apos;s GPS / Location services.</li>
            <li>
              Tap the <span className="font-semibold">🔒 / ⓘ icon</span> in the address bar →{" "}
              <span className="font-semibold">Location</span> → <span className="font-semibold">Allow</span>.
            </li>
            <li>Then tap “Try again” below.</li>
          </ul>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={() => {
              onClose();
              onRetry();
            }}
            className="rounded-full bg-emergency py-3 text-sm font-black uppercase tracking-wide text-white active:scale-95"
          >
            Try again
          </button>
          <button
            onClick={() => {
              onClose();
              onDemo();
            }}
            className="rounded-full border-2 border-ink bg-transparent py-2.5 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-ink hover:text-paper active:scale-95"
          >
            Use demo location instead
          </button>
          <button
            onClick={onClose}
            className="py-1 text-xs font-semibold text-muted hover:text-ink"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

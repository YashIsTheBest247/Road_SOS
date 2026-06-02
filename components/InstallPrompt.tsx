"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "roadsos:installDismissed";

// Encourages installing RoadSoS to the home screen so it works as a fast,
// offline app — important for an emergency tool used where the network is poor.
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return; // already installed
    if (localStorage.getItem(DISMISS_KEY)) return; // user dismissed before

    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    if (ios) {
      setIsIOS(true);
      setShow(true);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    const onInstalled = () => setShow(false);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="mt-8 flex items-center gap-3 rounded-2xl border border-emergency/30 bg-emergency/5 px-4 py-3">
      <span className="text-2xl">📲</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">Install RoadSoS for offline use</p>
        {isIOS ? (
          <p className="text-xs text-muted">
            Tap the <span className="font-semibold">Share</span> icon, then{" "}
            <span className="font-semibold">“Add to Home Screen”</span>.
          </p>
        ) : (
          <p className="text-xs text-muted">Add it to your home screen — works without a network.</p>
        )}
      </div>
      {!isIOS && (
        <button
          onClick={install}
          className="shrink-0 rounded-full bg-emergency px-4 py-2 text-xs font-black uppercase tracking-wide text-white active:scale-95"
        >
          Install
        </button>
      )}
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 text-muted hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

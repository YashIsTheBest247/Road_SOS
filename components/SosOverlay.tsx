"use client";

import { useEffect, useRef, useState } from "react";
import { telHref } from "@/lib/phone";

interface Props {
  open: boolean;
  onClose: () => void;
  lat: number | null;
  lng: number | null;
  ambulance?: string;
  placeName?: string;
}

export default function SosOverlay({ open, onClose, lat, lng, ambulance, placeName }: Props) {
  const [flash, setFlash] = useState(false);
  const [shared, setShared] = useState<string | null>(null);

  // Web Audio siren — synthesised at runtime (no audio file), so it works fully
  // offline. Two detuned oscillators run through a limiter (DynamicsCompressor)
  // and a maxed master gain so it's as LOUD as the device will allow. A website
  // can't raise the phone's hardware volume, but this drives the siren to full.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sirenRef = useRef<{ nodes: OscillatorNode[]; gain: GainNode } | null>(null);

  function startSiren() {
    if (sirenRef.current) return;
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audioCtxRef.current ?? new Ctx();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") ctx.resume();

      // Master gain → maxed.
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      gain.gain.exponentialRampToValueAtTime(1.0, ctx.currentTime + 0.06);

      // Limiter so the maxed gain stays loud without harsh clipping.
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -6;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.002;
      limiter.release.value = 0.2;

      gain.connect(limiter).connect(ctx.destination);

      // Pitch sweep shared by both oscillators.
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.6; // ~1.6s per up-down cycle
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 380; // sweep depth (Hz)
      lfo.connect(lfoGain);

      const osc1 = ctx.createOscillator();
      osc1.type = "sawtooth";
      osc1.frequency.value = 780;
      const osc2 = ctx.createOscillator();
      osc2.type = "square";
      osc2.frequency.value = 780;
      osc2.detune.value = 7; // slight detune → fuller, louder tone

      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);
      osc1.connect(gain);
      osc2.connect(gain);

      lfo.start();
      osc1.start();
      osc2.start();
      sirenRef.current = { nodes: [lfo, osc1, osc2], gain };
    } catch {
      /* audio unsupported — non-fatal */
    }
  }

  function stopSiren() {
    const s = sirenRef.current;
    const ctx = audioCtxRef.current;
    if (!s || !ctx) return;
    try {
      s.gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      setTimeout(() => {
        s.nodes.forEach((n) => {
          try {
            n.stop();
          } catch {
            /* already stopped */
          }
        });
      }, 150);
    } catch {
      /* ignore */
    }
    sirenRef.current = null;
  }

  // Screen-flash beacon: alternating high-contrast colours so rescuers / passing
  // traffic can spot the victim at night. Pure CSS, works fully offline.
  useEffect(() => {
    if (!flash) return;
    const id = setInterval(() => {
      document.body.dataset.flashState = document.body.dataset.flashState === "a" ? "b" : "a";
    }, 450);
    return () => {
      clearInterval(id);
      delete document.body.dataset.flashState;
    };
  }, [flash]);

  // Siren follows the beacon, and always stops when the overlay closes/unmounts.
  useEffect(() => {
    if (open && flash) startSiren();
    else stopSiren();
    return () => stopSiren();
  }, [flash, open]);

  if (!open) return null;

  const mapLink = lat != null && lng != null ? `https://maps.google.com/?q=${lat},${lng}` : null;
  const message =
    `🚨 ROAD ACCIDENT EMERGENCY 🚨\nI need help. ` +
    (placeName ? `Near ${placeName}. ` : "") +
    (mapLink ? `My live location: ${mapLink}` : "Location unavailable.");

  async function shareLocation() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Road accident emergency", text: message });
        setShared("Shared ✓");
        return;
      } catch {
        /* user cancelled / unsupported */
      }
    }
    try {
      await navigator.clipboard.writeText(message);
      setShared("Copied to clipboard ✓ — paste into any message");
    } catch {
      setShared("Copy this:\n" + message);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-red-700/95 p-5 text-white backdrop-blur-sm">
      {flash && <div id="rsos-flash" className="pointer-events-none fixed inset-0 z-[-1]" />}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight">SOS</h2>
        <button
          onClick={() => {
            setFlash(false);
            onClose();
          }}
          className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold"
        >
          Close
        </button>
      </div>

      <p className="mt-2 text-sm text-white/80">
        Stay calm. Do these now, in order.
      </p>

      <div className="mt-5 flex flex-1 flex-col justify-center gap-3">
        {ambulance && (
          <a
            href={telHref(ambulance)}
            className="flex items-center justify-center gap-3 rounded-2xl bg-white py-5 text-xl font-black text-red-700 shadow-lg active:scale-95"
          >
            📞 Call Ambulance {ambulance}
          </a>
        )}

        <button
          onClick={shareLocation}
          className="flex items-center justify-center gap-3 rounded-2xl bg-black/30 py-4 text-lg font-bold text-white active:scale-95"
        >
           Share my live location
        </button>

        <button
          onClick={() => setFlash((f) => !f)}
          className="flex items-center justify-center gap-3 rounded-2xl bg-black/30 py-4 text-lg font-bold text-white active:scale-95"
        >
          {flash ? "🔇 Stop beacon & siren" : "🚨 Flash + siren beacon (be seen & heard)"}
        </button>

        {shared && (
          <p className="whitespace-pre-wrap rounded-xl bg-black/30 p-3 text-center text-sm">
            {shared}
          </p>
        )}

        {mapLink && (
          <p className="text-center text-xs text-white/70">
            Your coordinates: {lat?.toFixed(5)}, {lng?.toFixed(5)}
          </p>
        )}
      </div>
    </div>
  );
}

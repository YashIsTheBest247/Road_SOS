"use client";

import { useRef, useState } from "react";
import { FIRST_AID_TOPICS, answerFirstAid } from "@/lib/firstAid";

interface Msg {
  role: "user" | "assistant";
  text: string;
  source?: "gemini" | "offline" | "local";
}

const GREETING: Msg = {
  role: "assistant",
  text:
    "I'm your First-Aid Assistant. Tell me what's happening — e.g. \"someone is bleeding\", \"not breathing\", \"trapped in the car\" — and I'll guide you step by step. For anything serious, call the emergency number at the top first.",
  source: "local",
};

function localAnswer(q: string): Msg {
  const a = answerFirstAid(q);
  const text = [a.intro, "", ...a.steps.map((s, i) => `${i + 1}. ${s}`)]
    .concat(a.warning ? ["", `⚠️ ${a.warning}`] : [])
    .join("\n");
  return { role: "assistant", text, source: "local" };
}

export default function FirstAidAssistant() {
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollDown() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setBusy(true);
    scrollDown();

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.answer, source: data.source }]);
    } catch {
      // Offline / server down → deterministic local first-aid engine.
      setMessages((m) => [...m, localAnswer(q)]);
    } finally {
      setBusy(false);
      scrollDown();
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`w-fit max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ${
              m.role === "user"
                ? "ml-auto bg-ink text-paper"
                : "border border-line bg-card text-ink-soft"
            }`}
          >
            {m.text}
            {m.role === "assistant" && m.source && (
              <div className="eyebrow mt-1.5 text-[0.58rem] text-muted">
                {m.source === "gemini" ? "Gemini AI · live" : "Offline guide"}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="text-xs text-muted">Assistant is typing…</div>}
      </div>

      {/* Quick topic buttons */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {FIRST_AID_TOPICS.slice(0, 6).map((t) => (
          <button
            key={t.id}
            onClick={() => ask(t.title)}
            disabled={busy}
            className="rounded-full border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:border-line-strong disabled:opacity-50"
          >
            {t.emoji} {t.title}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="mt-2 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe the situation…"
          className="flex-1 rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-ink"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-emergency px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

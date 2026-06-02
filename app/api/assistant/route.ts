import { NextRequest, NextResponse } from "next/server";
import { answerFirstAid, FIRST_AID_TOPICS } from "@/lib/firstAid";

export const runtime = "nodejs";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const SYSTEM_PROMPT = `You are the RoadSoS First-Aid Assistant, helping a bystander or victim at a road accident.
Rules:
- Be extremely concise and calm. Lives may depend on speed.
- Always tell them to call emergency services first if the situation is serious.
- Give clear, numbered, do-this-now steps. No medical jargon.
- Never give a diagnosis or medication doses.
- If unsure, give safe general accident first-aid and urge professional help.
Ground your advice in standard first-aid protocol.`;

function knowledgeContext(): string {
  return FIRST_AID_TOPICS.map(
    (t) => `${t.title}: ${t.steps.join(" ")}${t.warning ? " WARNING: " + t.warning : ""}`
  ).join("\n");
}

export async function POST(req: NextRequest) {
  let question = "";
  try {
    const body = await req.json();
    question = String(body.question ?? "").slice(0, 1000);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!question.trim()) {
    return NextResponse.json({ error: "Empty question" }, { status: 400 });
  }

  // Offline / no-key fallback — deterministic, instant, always available.
  const offline = answerFirstAid(question);
  const offlineAnswer = [offline.intro, "", ...offline.steps.map((s, i) => `${i + 1}. ${s}`)]
    .concat(offline.warning ? ["", `⚠️ ${offline.warning}`] : [])
    .join("\n");

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ answer: offlineAnswer, source: "offline" });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT + "\n\nReference protocols:\n" + knowledgeContext() }],
        },
        contents: [{ role: "user", parts: [{ text: question }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.3 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("")
      .trim();
    if (!text) throw new Error("No content");
    return NextResponse.json({ answer: text, source: "gemini" });
  } catch {
    // Any failure → graceful offline answer.
    return NextResponse.json({ answer: offlineAnswer, source: "offline" });
  }
}

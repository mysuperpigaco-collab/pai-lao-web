import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const PROMPTS: Record<string, string> = {
  overall:
    "คุณเป็นนักเขียนท่องเที่ยวภาษาไทยที่เชี่ยวชาญ\n" +
    "เกลาข้อความบรรยายทริปต่อไปนี้ให้อ่านง่าย น่าสนใจ และเชิญชวน\n" +
    "รักษาความหมายและความยาวใกล้เคียงเดิม ใช้ภาษาไทยธรรมชาติ ไม่เป็นทางการเกินไป\n" +
    "ตอบเฉพาะข้อความที่เกลาแล้ว ไม่ต้องมีคำอธิบายเพิ่มเติม\n\nข้อความ:\n",

  stop:
    "คุณเป็นนักเขียนท่องเที่ยวภาษาไทยที่เชี่ยวชาญ\n" +
    "เกลาคำอธิบายจุดเช็คอินนี้ให้อ่านง่าย มีชีวิตชีวา ถ่ายทอดบรรยากาศได้ดี\n" +
    "รักษาความหมายเดิม ความยาวใกล้เคียงเดิม ใช้ภาษาไทยธรรมชาติ\n" +
    "ตอบเฉพาะข้อความที่เกลาแล้ว ไม่ต้องมีคำอธิบายเพิ่มเติม\n\nข้อความ:\n",
};

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = checkRateLimit(`ai:${session.userId}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "ใช้ AI บ่อยเกินไป กรุณารอสักครู่" }, { status: 429 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith("วางคีย์")) {
    return NextResponse.json({ error: "GEMINI_API_KEY ยังไม่ได้ตั้งค่า" }, { status: 503 });
  }

  const { text, mode } = await req.json() as { text: string; mode?: string };
  if (!text?.trim()) return NextResponse.json({ error: "ไม่มีข้อความ" }, { status: 400 });
  if (text.trim().length < 10) return NextResponse.json({ error: "ข้อความสั้นเกินไป" }, { status: 400 });

  const prompt = (PROMPTS[mode ?? "overall"] ?? PROMPTS.overall) + text.trim();

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.65, maxOutputTokens: 800 },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini error:", errText);
      let msg = "Gemini API error";
      try {
        const j = JSON.parse(errText);
        const m = j?.error?.message;
        if (m) msg = m.length > 120 ? m.slice(0, 120) + "…" : m;
      } catch {}
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const data = await res.json();
    const polished: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!polished) return NextResponse.json({ error: "AI ไม่ตอบกลับ" }, { status: 502 });

    return NextResponse.json({ polished: polished.trim() });
  } catch (e) {
    console.error("polish-text error:", e);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

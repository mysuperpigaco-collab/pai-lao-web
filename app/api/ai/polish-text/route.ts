import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

// gemini-2.0-flash ถูกปลดระวาง (มี.ค. 2026) → ใช้ 2.5-flash (ฟรีเทียร์)
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// 3 สำนวนให้ผู้ใช้เลือก (คำสั่งวางไว้ล่วงหน้า)
const TONES = [
  { key: "concise", label: "กระชับ",       hint: "กระชับ ได้ใจความ ตัดน้ำออก อ่านเร็ว" },
  { key: "vivid",   label: "มีชีวิตชีวา",   hint: "บรรยายมีสีสัน ถ่ายทอดบรรยากาศและอารมณ์ ชวนให้อยากไป" },
  { key: "polite",  label: "สุภาพ",         hint: "สุภาพ เรียบร้อย เป็นทางการเล็กน้อย น่าเชื่อถือ" },
] as const;

const CONTEXT: Record<string, string> = {
  overall: "ข้อความบรรยายภาพรวมทริปท่องเที่ยว",
  stop:    "ข้อความบรรยายจุดเช็คอิน/จุดแวะในทริป",
};

function buildPrompt(text: string, mode: string) {
  const ctx = CONTEXT[mode] ?? CONTEXT.overall;
  return (
    `คุณเป็นนักเขียนท่องเที่ยวภาษาไทยที่เชี่ยวชาญ\n` +
    `ช่วยเกลา${ctx}ต่อไปนี้เป็น 3 สำนวนตามโทนที่กำหนด โดยรักษาความหมายเดิมและความยาวใกล้เคียงเดิม ใช้ภาษาไทยธรรมชาติ\n` +
    `โทน:\n` +
    TONES.map((t, i) => `${i + 1}) ${t.key} = ${t.hint}`).join("\n") +
    `\n\nตอบกลับเป็น JSON เท่านั้น รูปแบบ: {"concise":"...","vivid":"...","polite":"..."}\n` +
    `ห้ามมีข้อความอื่นนอกจาก JSON และห้ามใส่ markdown code fence\n\n` +
    `ข้อความต้นฉบับ:\n${text}`
  );
}

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

  const { text, mode } = (await req.json()) as { text: string; mode?: string };
  if (!text?.trim()) return NextResponse.json({ error: "ไม่มีข้อความ" }, { status: 400 });
  if (text.trim().length < 10) return NextResponse.json({ error: "ข้อความสั้นเกินไป (อย่างน้อย 1–2 ประโยค)" }, { status: 400 });
  if (text.length > 5000) return NextResponse.json({ error: "ข้อความยาวเกินไป" }, { status: 400 });

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(text.trim(), mode ?? "overall") }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500, responseMimeType: "application/json" },
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
    const raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!raw) return NextResponse.json({ error: "AI ไม่ตอบกลับ" }, { status: 502 });

    // parse JSON (เผื่อมี text ห่อ ก็ดึงเฉพาะ {...})
    let parsed: Record<string, string> | null = null;
    try { parsed = JSON.parse(raw); }
    catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch {} }
    }
    if (!parsed) return NextResponse.json({ error: "AI ตอบกลับไม่ถูกรูปแบบ ลองใหม่อีกครั้ง" }, { status: 502 });

    const options = TONES
      .map(t => ({ key: t.key, label: t.label, text: (parsed![t.key] ?? "").trim() }))
      .filter(o => o.text);

    if (options.length === 0) return NextResponse.json({ error: "AI ไม่ตอบกลับ" }, { status: 502 });

    return NextResponse.json({ options });
  } catch (e) {
    console.error("polish-text error:", e);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

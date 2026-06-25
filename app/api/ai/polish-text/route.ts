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

  const rl = await checkRateLimit(`ai:${session.userId}`, 20, 60_000);
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
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
          // ปิด "thinking" ของ gemini-2.5-flash ไม่งั้น thinking กิน token จนข้อความจริงถูกตัด → JSON ขาด
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini error:", res.status, errText.slice(0, 300));
      let geminiMsg = "";
      try { geminiMsg = JSON.parse(errText)?.error?.message ?? ""; } catch {}
      const thaiMsg =
        res.status === 503 || /high demand|overload|unavailable/i.test(geminiMsg)
          ? "AI ยุ่งมากอยู่ครับ กรุณาลองใหม่สักครู่"
          : res.status === 429 || /quota|rate.?limit/i.test(geminiMsg)
          ? "เกินโควต้า API กรุณารอสักครู่แล้วลองใหม่"
          : res.status === 400 || /api.?key|invalid/i.test(geminiMsg)
          ? "API Key ไม่ถูกต้อง"
          : "Gemini ตอบสนองผิดพลาด กรุณาลองใหม่";
      return NextResponse.json({ error: thaiMsg }, { status: 502 });
    }

    const data = await res.json();
    const cand = data.candidates?.[0];
    const finish = cand?.finishReason;
    const raw: string = cand?.content?.parts?.[0]?.text ?? "";
    if (!raw) {
      console.error("polish-text empty output. finishReason:", finish, JSON.stringify(data).slice(0, 400));
      return NextResponse.json({ error: finish === "SAFETY" ? "เนื้อหาถูกบล็อกโดยตัวกรอง ลองปรับข้อความ" : "AI ไม่ตอบกลับ" }, { status: 502 });
    }

    // parse JSON (เผื่อมี text ห่อ ก็ดึงเฉพาะ {...})
    let parsed: Record<string, string> | null = null;
    try { parsed = JSON.parse(raw); }
    catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch {} }
    }
    if (!parsed) {
      console.error("polish-text parse fail. finishReason:", finish, "raw:", raw.slice(0, 300));
      const msg = finish === "MAX_TOKENS" ? "ข้อความยาวเกินไป ลองย่อแล้วลองใหม่ (v2)" : "AI ตอบกลับไม่ถูกรูปแบบ ลองใหม่อีกครั้ง (v2)";
      return NextResponse.json({ error: msg, _debug: { finishReason: finish, rawHead: raw.slice(0, 200) } }, { status: 502 });
    }

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

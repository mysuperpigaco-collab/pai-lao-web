import sharp from "sharp";

// ── สร้าง LQIP data-URI จาก URL รูปปก (server only) ──────────
// ใช้ตอนบันทึก coverUrl ลง DB — fetch รูป → ย่อ 32px → webp คุณภาพต่ำ → base64
// คืน null ทุกกรณีที่ทำไม่ได้ (รูป external/seed, fetch พัง, sharp พัง) → การ์ด/hero
// จะ fallback ไปกล่องเทาเดิม ไม่มีทางทำให้ write ล้ม (fail-open เสมอ)

export async function blurFromUrl(url?: string | null): Promise<string | null> {
  if (!url || typeof url !== "string") return null;
  // เฉพาะรูปใน Supabase storage ของเรา — external/seed URL ข้าม (ทำ LQIP ไม่คุ้ม/CORS)
  if (!url.includes("/storage/v1/object/public/")) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const input = Buffer.from(await res.arrayBuffer());
    const out = await sharp(input)
      .resize({ width: 32, height: 32, fit: "inside" })
      .webp({ quality: 40 })
      .toBuffer();
    // จำกัดความยาวกันเผลอบวม (ปกติ ~400-700 ตัว) — เกินถือว่าผิดปกติ ทิ้ง
    const uri = `data:image/webp;base64,${out.toString("base64")}`;
    return uri.length <= 2000 ? uri : null;
  } catch {
    return null;
  }
}

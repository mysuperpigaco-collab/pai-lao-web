import crypto from "crypto";

/**
 * hashToken — แฮช token ก่อนเก็บลง DB (กัน DB หลุดแล้วเอา token ไปใช้ได้)
 * ใช้ SHA-256 เพราะ token เป็นค่าสุ่ม entropy สูง (randomBytes 32 = 256-bit)
 * จึงไม่ต้องใช้ bcrypt (ไม่มีโอกาส brute-force)
 *
 * หมายเหตุ: ใช้ใน API routes (Node runtime) เท่านั้น — ห้าม import เข้า middleware/edge
 * เก็บ token ดิบไว้ส่งในอีเมล แล้วเก็บ hashToken(raw) ลง DB
 * ตอนตรวจสอบให้ hash ค่าที่รับมาก่อนแล้วค่อย lookup
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

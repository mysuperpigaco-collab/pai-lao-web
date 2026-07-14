// ── URL รูปย่อสำหรับการ์ด ────────────────────────────────────
// อัปโหลดรอบใหม่ (หลังฟีเจอร์ thumbnail) ตั้งชื่อไฟล์ `<ts>t.webp` และมี
// `<ts>t_thumb.webp` (640px) คู่กันเสมอ — marker "t" คือสัญญาว่า thumb มีจริง
//
// กติกา cardThumb:
// 1. ไม่ใช่รูปใน Supabase storage ของเรา → คืน URL เดิม (รูป external/seed)
// 2. ไม่มี marker (รูปเก่าทั้งหมด, GIF, ไฟล์ fallback) → คืน URL เดิม
// 3. มี marker → ชี้ไป thumb
// ผลลัพธ์: รูปเก่าไม่ถูกแตะและไม่มี request หา thumb ที่ไม่มีจริง (ไม่มี 404)

export function cardThumb(url?: string | null): string {
  if (!url) return "";
  if (!url.includes("/storage/v1/object/public/")) return url;
  if (!/\d{13,}t\.webp$/.test(url)) return url;
  return url.replace(/t\.webp$/, "t_thumb.webp");
}

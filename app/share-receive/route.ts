import { NextResponse } from "next/server";

// ── Fallback ของ Web Share Target ───────────────────────────
// ปกติ sw.js ดัก POST /share-receive ก่อนถึงเซิร์ฟเวอร์ (เก็บรูปใน Cache แล้ว redirect)
// route นี้ทำงานเฉพาะกรณี SW ไม่ active (ไม่ควรเกิด เพราะ share target มากับ PWA ที่ติดตั้งแล้ว)
// → redirect เข้าฟอร์มเฉย ๆ (รูปหาย แต่ไม่ error)

export async function POST() {
  return NextResponse.redirect(
    new URL("/trips/create", process.env.NEXT_PUBLIC_SITE_URL || "https://pai-lao.com"),
    303
  );
}

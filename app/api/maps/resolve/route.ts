import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { googleUrlToLatLng } from "@/lib/maps";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // Rate limit: 20 ครั้ง/นาที ต่อ user — route นี้ทำให้เซิร์ฟเวอร์ fetch ลิงก์ภายนอก
  const rl = await checkRateLimit(`maps-resolve:${session.userId}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ message: "เรียกบ่อยเกินไป กรุณารอสักครู่" }, { status: 429 });
  }

  const { url } = await req.json();
  if (!url || typeof url !== "string" || url.length > 2048) {
    return NextResponse.json({ coord: null });
  }
  return NextResponse.json({ coord: await googleUrlToLatLng(url) });
}

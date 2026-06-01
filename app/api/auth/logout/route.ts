import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  try {
    const session   = await getCurrentUser();
    const ip        = getIp(request);
    const userAgent = request.headers.get("user-agent") || undefined;

    await clearAuthCookie();

    // ── บันทึก logout (พ.ร.บ. คอมพิวเตอร์ มาตรา 26) ────────
    if (session) {
      await prisma.loginLog.create({
        data: {
          userId:   session.userId,
          username: session.username,
          action:   "LOGOUT",
          ip,
          userAgent,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ message: "ออกจากระบบแล้ว" });
  } catch (error) {
    console.error("POST /api/auth/logout:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

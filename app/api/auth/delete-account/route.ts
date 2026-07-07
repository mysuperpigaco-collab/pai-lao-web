import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { logActivity, getClientIp } from "@/lib/activityLogger";

// ── ลบบัญชีแบบมีระยะเปลี่ยนใจ 7 วัน (PDPA self-service) ─────
// POST   = ขอลบ (ต้องพิมพ์ username ยืนยัน) → ตั้ง deletionRequestedAt
// DELETE = ยกเลิกการลบ → ล้าง deletionRequestedAt
// ลบจริง: cron /api/cron/purge-deleted-accounts (หลังครบ 7 วัน)

const GRACE_DAYS = 7;

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    // แอดมินห้ามลบตัวเองผ่านช่องทางนี้ (กันล็อกระบบ — ให้ SUPERADMIN จัดการ)
    if (session.role === "ADMIN" || session.role === "SUPERADMIN") {
      return NextResponse.json({ message: "บัญชีแอดมินไม่สามารถลบผ่านช่องทางนี้ได้" }, { status: 403 });
    }

    const rl = await checkRateLimit(`del-acct:${session.userId}`, 5, 10 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ message: "ลองใหม่ภายหลัง" }, { status: 429 });
    }

    const { confirmUsername } = await request.json();
    if (typeof confirmUsername !== "string" || confirmUsername.trim() !== session.username) {
      return NextResponse.json({ message: "พิมพ์ username ไม่ตรง กรุณาลองใหม่" }, { status: 400 });
    }

    const requestedAt = new Date();
    await prisma.user.update({
      where: { id: session.userId },
      data: { deletionRequestedAt: requestedAt },
    });

    await logActivity({
      userId: session.userId, username: session.username,
      action: "ACCOUNT_DELETE_REQUEST",
      ip: getClientIp(request), userAgent: request.headers.get("user-agent"),
    }).catch(() => {});

    const purgeAt = new Date(requestedAt.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);
    return NextResponse.json({
      message: `บัญชีจะถูกลบถาวรใน ${GRACE_DAYS} วัน ยกเลิกได้ตลอดช่วงนี้`,
      deletionRequestedAt: requestedAt.toISOString(),
      purgeAt: purgeAt.toISOString(),
    });
  } catch (e) {
    console.error("POST /api/auth/delete-account:", e);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    await prisma.user.update({
      where: { id: session.userId },
      data: { deletionRequestedAt: null },
    });

    await logActivity({
      userId: session.userId, username: session.username,
      action: "ACCOUNT_DELETE_CANCEL",
      ip: getClientIp(request), userAgent: request.headers.get("user-agent"),
    }).catch(() => {});

    return NextResponse.json({ message: "ยกเลิกการลบบัญชีแล้ว" });
  } catch (e) {
    console.error("DELETE /api/auth/delete-account:", e);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

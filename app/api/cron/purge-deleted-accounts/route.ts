import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── Vercel Cron: ลบบัญชีที่ขอลบไว้เกิน 7 วัน (รันวันละครั้ง ดู vercel.json) ──
// Vercel ยิง GET พร้อม header Authorization: Bearer <CRON_SECRET>
// ลบด้วย prisma.user.delete → ลูก cascade อัตโนมัติ (แบบเดียวกับ scripts/delete-users.ts)

const GRACE_DAYS = 7;

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000);
    const due = await prisma.user.findMany({
      where: {
        deletionRequestedAt: { not: null, lte: cutoff },
        role: { notIn: ["ADMIN", "SUPERADMIN"] }, // กันเหนียว — แอดมินไม่ควรมีค่านี้อยู่แล้ว
      },
      select: { id: true, username: true, email: true },
      take: 100, // เพดานต่อรอบ — วันถัดไปเก็บต่อ
    });

    const purged: string[] = [];
    for (const u of due) {
      try {
        await prisma.user.delete({ where: { id: u.id } });
        purged.push(u.username);
        await prisma.adminLog.create({
          data: {
            adminId: "00000000-0000-0000-0000-000000000000", // system
            action: "ACCOUNT_PURGED",
            targetType: "USER",
            targetId: u.id,
            detail: `purged after ${GRACE_DAYS}d grace: ${u.username} <${u.email}>`,
          },
        }).catch(() => {});
      } catch (e) {
        console.error(`[purge] delete failed for ${u.username}:`, e);
      }
    }

    return NextResponse.json({ ok: true, checked: due.length, purged });
  } catch (e) {
    console.error("GET /api/cron/purge-deleted-accounts:", e);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/logs?type=admin|login&page=&limit=&action=&userId=
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "SUPERADMIN" && session.role !== "ADMIN")) {
      return NextResponse.json({ message: "ต้องการสิทธิ์ ADMIN ขึ้นไป" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type    = searchParams.get("type") || "admin"; // "admin" | "login"
    const page    = parseInt(searchParams.get("page") || "1");
    const limit   = parseInt(searchParams.get("limit") || "30");
    const skip    = (page - 1) * limit;
    const action  = searchParams.get("action") || "";
    const userId  = searchParams.get("userId") || "";
    const ip      = searchParams.get("ip") || "";

    // ── Admin action logs ─────────────────────────────────────
    if (type === "admin") {
      const where: any = {};
      if (action)  where.action  = { contains: action, mode: "insensitive" };
      if (userId)  where.adminId = userId;

      const [logs, total] = await Promise.all([
        prisma.adminLog.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
        prisma.adminLog.count({ where }),
      ]);

      const adminIds   = [...new Set(logs.map(l => l.adminId))];
      const adminUsers = await prisma.user.findMany({
        where: { id: { in: adminIds } },
        select: { id: true, username: true, displayName: true, firstName: true, avatarUrl: true, role: true },
      });
      const adminMap = Object.fromEntries(adminUsers.map(u => [u.id, u]));
      const enriched = logs.map(l => ({ ...l, admin: adminMap[l.adminId] || null }));

      return NextResponse.json({ logs: enriched, total, page, pages: Math.ceil(total / limit) });
    }

    // ── Login/Logout logs (พ.ร.บ. คอมพิวเตอร์) ──────────────
    if (type === "login") {
      const where: any = {};
      if (action) where.action   = action;
      if (userId) where.userId   = userId;
      if (ip)     where.ip       = { contains: ip };

      const [logs, total] = await Promise.all([
        prisma.loginLog.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
        prisma.loginLog.count({ where }),
      ]);

      return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) });
    }

    // ── User activity logs ────────────────────────────────────
    if (type === "activity") {
      const where: any = {};
      if (action) where.action   = action;
      if (userId) where.userId   = userId;
      if (ip)     where.ip       = { contains: ip };

      const [logs, total] = await Promise.all([
        prisma.userActivityLog.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
        prisma.userActivityLog.count({ where }),
      ]);

      return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) });
    }

    return NextResponse.json({ message: "type ไม่ถูกต้อง (admin | login | activity)" }, { status: 400 });
  } catch (error) {
    console.error("GET /api/admin/logs:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE /api/admin/logs — ลบ LoginLog เก่ากว่า 90 วัน (SUPERADMIN only)
// เรียกได้ manual หรือตั้ง cron job
export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ message: "ต้องการสิทธิ์ SUPERADMIN" }, { status: 403 });
    }

    const retentionDays = 90; // พ.ร.บ. กำหนดขั้นต่ำ 90 วัน
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const [loginResult, activityResult] = await Promise.all([
      prisma.loginLog.deleteMany({ where: { createdAt: { lt: cutoff } } }),
      prisma.userActivityLog.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    ]);

    const totalDeleted = loginResult.count + activityResult.count;

    await prisma.adminLog.create({
      data: {
        adminId:    session.userId,
        action:     "CLEANUP_LOGS",
        targetType: "SYSTEM",
        detail:     `ลบ log เก่ากว่า ${retentionDays} วัน: LoginLog ${loginResult.count} + ActivityLog ${activityResult.count} รายการ`,
      },
    });

    return NextResponse.json({
      message: `ลบ log เก่ากว่า ${retentionDays} วันสำเร็จ`,
      deleted: { loginLog: loginResult.count, activityLog: activityResult.count, total: totalDeleted },
      cutoffDate: cutoff.toISOString(),
    });
  } catch (error) {
    console.error("DELETE /api/admin/logs:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

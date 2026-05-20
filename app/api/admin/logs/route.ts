import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/logs?adminId=&action=&page=&limit=
export async function GET(request: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== "SUPERADMIN") {
    return NextResponse.json({ message: "ต้องการสิทธิ์ SUPERADMIN" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const adminId = searchParams.get("adminId") || "";
  const action  = searchParams.get("action") || "";
  const page    = parseInt(searchParams.get("page") || "1");
  const limit   = parseInt(searchParams.get("limit") || "30");
  const skip    = (page - 1) * limit;

  const where: any = {};
  if (adminId) where.adminId = adminId;
  if (action)  where.action  = { contains: action, mode: "insensitive" };

  const [logs, total] = await Promise.all([
    prisma.adminLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.adminLog.count({ where }),
  ]);

  // Enrich with admin user info
  const adminIds = [...new Set(logs.map(l => l.adminId))];
  const adminUsers = await prisma.user.findMany({
    where: { id: { in: adminIds } },
    select: { id: true, username: true, displayName: true, firstName: true, lastName: true, avatarUrl: true, role: true },
  });
  const adminMap = Object.fromEntries(adminUsers.map(u => [u.id, u]));

  const enriched = logs.map(l => ({ ...l, admin: adminMap[l.adminId] || null }));

  return NextResponse.json({ logs: enriched, total, page, pages: Math.ceil(total / limit) });
}

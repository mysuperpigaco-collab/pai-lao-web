import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function adminGuard(session: Awaited<ReturnType<typeof getCurrentUser>>) {
  return session && (session.role === "ADMIN" || session.role === "SUPERADMIN");
}

// GET /api/admin/promotions
export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!adminGuard(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "PENDING";

  const promotions = await prisma.promotion.findMany({
    where: { status },
    include: {
      business: { select: { id: true, businessName: true, logoUrl: true } },
      place: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ promotions });
}

// PUT /api/admin/promotions — approve / reject
export async function PUT(req: NextRequest) {
  const session = await getCurrentUser();
  if (!adminGuard(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { promotionId, action, adminNote } = await req.json();
  if (!promotionId || !action) return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });

  const newStatus = action === "APPROVE" ? "ACTIVE" : "REJECTED";
  const updated = await prisma.promotion.update({
    where: { id: promotionId },
    data: { status: newStatus, adminNote: adminNote || null },
  });
  return NextResponse.json({ ok: true, promotion: updated });
}

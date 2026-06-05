import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function isAdmin(role: string) { return role === "ADMIN" || role === "SUPERADMIN"; }

// GET /api/admin/place-claims — list all claims (with filter ?status=PENDING)
export async function GET(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "PENDING";

    const claims = await (prisma as any).placeClaim.findMany({
      where: status === "ALL" ? {} : status === "ACTIVE" ? { status: { in: ["PENDING", "DISPUTED"] } } : { status },
      orderBy: { createdAt: "desc" },
      include: {
        place: {
          select: {
            id: true, slug: true, title: true, coverUrl: true,
            province: true, district: true, category: true,
          },
        },
        business: {
          select: {
            id: true, businessName: true, logoUrl: true, phone: true,
            email: true, lineId: true, isVerified: true,
            user: { select: { username: true, displayName: true, avatarUrl: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({ claims });
  } catch (err) {
    console.error("GET /api/admin/place-claims:", err);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// POST /api/admin/place-claims — approve or reject a claim
export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });
    }

    const { claimId, action, adminNote } = await req.json();
    if (!claimId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบ" }, { status: 400 });
    }

    const claim = await (prisma as any).placeClaim.findUnique({
      where: { id: claimId },
      include: { business: { select: { id: true } }, place: { select: { id: true, title: true, businessId: true } } },
    });
    if (!claim) return NextResponse.json({ message: "ไม่พบคำขอ" }, { status: 404 });
    if (claim.status !== "PENDING") {
      return NextResponse.json({ message: "คำขอนี้ถูกดำเนินการแล้ว" }, { status: 409 });
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
    const isDispute = claim.status === "DISPUTED";

    // Update claim
    await (prisma as any).placeClaim.update({
      where: { id: claimId },
      data: { status: newStatus, adminNote: adminNote?.trim() || null },
    });

    if (action === "APPROVE") {
      if (isDispute) {
        // โอนความเป็นเจ้าของจากเจ้าของเดิมไปยังผู้โต้แย้ง
        await prisma.place.update({
          where: { id: claim.place.id },
          data: { businessId: claim.business.id },
        });
        // reject claim/dispute อื่นๆ ทั้งหมดของ place นี้
        await (prisma as any).placeClaim.updateMany({
          where: { placeId: claim.place.id, id: { not: claimId }, status: { in: ["PENDING", "DISPUTED", "APPROVED"] } },
          data: { status: "REJECTED", adminNote: "สิทธิ์ความเป็นเจ้าของถูกโอนให้ผู้โต้แย้งรายใหม่" },
        });
      } else if (!claim.place.businessId) {
        // claim ปกติ: link place กับ business
        await prisma.place.update({
          where: { id: claim.place.id },
          data: { businessId: claim.business.id },
        });
        // reject pending/disputed claims อื่นๆ
        await (prisma as any).placeClaim.updateMany({
          where: { placeId: claim.place.id, status: { in: ["PENDING", "DISPUTED"] }, id: { not: claimId } },
          data: { status: "REJECTED", adminNote: "มีเจ้าของอนุมัติแล้ว" },
        });
      }
    }

    await prisma.adminLog.create({
      data: {
        adminId: session.userId,
        action: action === "APPROVE" ? "APPROVE_CLAIM" : "REJECT_CLAIM",
        targetId: claim.place.id,
        targetType: "PLACE",
        detail: `${action} ownership claim for place: ${claim.place.title}`,
      },
    }).catch(() => {});

    return NextResponse.json({ message: action === "APPROVE" ? "อนุมัติสำเร็จ" : "ปฏิเสธสำเร็จ" });
  } catch (err) {
    console.error("POST /api/admin/place-claims:", err);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

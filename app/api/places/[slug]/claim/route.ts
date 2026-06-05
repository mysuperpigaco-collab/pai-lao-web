import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: Promise<{ slug: string }> };

// POST /api/places/[slug]/claim — ส่งคำขอ claim รอแอดมินอนุมัติ
export async function POST(req: Request, { params }: Params) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    if (session.role !== "BUSINESS") {
      return NextResponse.json({ message: "เฉพาะเจ้าของธุรกิจเท่านั้น" }, { status: 403 });
    }

    const { slug } = await params;
    const place = await prisma.place.findUnique({
      where: { slug },
      select: { id: true, businessId: true, title: true },
    });
    if (!place) return NextResponse.json({ message: "ไม่พบสถานที่" }, { status: 404 });

    const business = await prisma.business.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (!business) return NextResponse.json({ message: "ไม่พบข้อมูลธุรกิจ" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const message = (body as any)?.message?.trim() || null;
    const isDispute = !!place.businessId; // สถานที่มีเจ้าของอยู่แล้ว → เป็น dispute

    if (isDispute) {
      // ต้องมีเหตุผลประกอบการโต้แย้ง
      if (!message || message.length < 10) {
        return NextResponse.json({ message: "กรุณาระบุเหตุผลในการโต้แย้ง (อย่างน้อย 10 ตัวอักษร)" }, { status: 400 });
      }
      // เช็คว่าเคย dispute รอผลอยู่แล้วหรือไม่
      const existingDispute = await (prisma as any).placeClaim.findFirst({
        where: { placeId: place.id, businessId: business.id, status: "DISPUTED" },
      });
      if (existingDispute) {
        return NextResponse.json({ message: "คุณมีคำขอโต้แย้งที่รอผลอยู่แล้ว" }, { status: 409 });
      }
      // ห้าม dispute สถานที่ตัวเองเป็นเจ้าของอยู่แล้ว
      if (place.businessId === business.id) {
        return NextResponse.json({ message: "คุณเป็นเจ้าของสถานที่นี้อยู่แล้ว" }, { status: 409 });
      }
    } else {
      // claim ปกติ — เช็คว่ามีคำขอ pending อยู่แล้วหรือไม่
      const existing = await (prisma as any).placeClaim.findFirst({
        where: { placeId: place.id, businessId: business.id, status: "PENDING" },
      });
      if (existing) {
        return NextResponse.json({ message: "คุณมีคำขอรอการอนุมัติอยู่แล้ว" }, { status: 409 });
      }
    }

    // เช็คว่ามีธุรกิจอื่น claim/dispute อยู่แล้วหรือไม่
    const competingCount = await (prisma as any).placeClaim.count({
      where: { placeId: place.id, status: { in: ["PENDING", "DISPUTED"] }, businessId: { not: business.id } },
    });

    // สร้าง PlaceClaim
    await (prisma as any).placeClaim.create({
      data: {
        placeId:    place.id,
        businessId: business.id,
        status:     isDispute ? "DISPUTED" : "PENDING",
        message,
      },
    });

    await prisma.adminLog.create({
      data: {
        adminId:    session.userId,
        action:     isDispute ? "REQUEST_DISPUTE_PLACE" : "REQUEST_CLAIM_PLACE",
        targetId:   place.id,
        targetType: "PLACE",
        detail:     `Business ${isDispute ? "disputed" : "requested claim"}: ${place.title}`,
      },
    }).catch(() => {});

    return NextResponse.json({
      message: isDispute ? "ส่งคำขอโต้แย้งเรียบร้อย รอแอดมินตรวจสอบ" : "ส่งคำขอเรียบร้อย รอแอดมินอนุมัติ",
      pending: true,
      isDispute,
      hasCompetition: !isDispute && competingCount > 0,
      competingCount: !isDispute ? competingCount : 0,
    });
  } catch (err) {
    console.error("POST /api/places/[slug]/claim:", err);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE /api/places/[slug]/claim — ยกเลิกคำขอ claim ที่ยังรออยู่
export async function DELETE(req: Request, { params }: Params) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    if (session.role !== "BUSINESS") {
      return NextResponse.json({ message: "เฉพาะเจ้าของธุรกิจเท่านั้น" }, { status: 403 });
    }

    const { slug } = await params;
    const place = await prisma.place.findUnique({ where: { slug }, select: { id: true } });
    if (!place) return NextResponse.json({ message: "ไม่พบสถานที่" }, { status: 404 });

    const business = await prisma.business.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (!business) return NextResponse.json({ message: "ไม่พบข้อมูลธุรกิจ" }, { status: 404 });

    const claim = await (prisma as any).placeClaim.findFirst({
      where: { placeId: place.id, businessId: business.id, status: { in: ["PENDING", "REJECTED"] } },
    });
    if (!claim) return NextResponse.json({ message: "ไม่พบคำขอที่สามารถยกเลิกได้" }, { status: 404 });

    await (prisma as any).placeClaim.delete({ where: { id: claim.id } });

    return NextResponse.json({ message: "ยกเลิกคำขอเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("DELETE /api/places/[slug]/claim:", err);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

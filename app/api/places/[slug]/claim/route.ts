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
    if (place.businessId) {
      return NextResponse.json({ message: "สถานที่นี้มีเจ้าของแล้ว" }, { status: 409 });
    }

    const business = await prisma.business.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (!business) return NextResponse.json({ message: "ไม่พบข้อมูลธุรกิจ" }, { status: 404 });

    // เช็คว่ามีคำขอ pending อยู่แล้วหรือไม่
    const existing = await (prisma as any).placeClaim.findFirst({
      where: { placeId: place.id, businessId: business.id, status: "PENDING" },
    });
    if (existing) {
      return NextResponse.json({ message: "คุณมีคำขอรอการอนุมัติอยู่แล้ว" }, { status: 409 });
    }

    const body = await req.json().catch(() => ({}));
    const message = (body as any)?.message?.trim() || null;

    // สร้าง PlaceClaim รอแอดมินอนุมัติ (ไม่ set businessId ทันที)
    await (prisma as any).placeClaim.create({
      data: {
        placeId:    place.id,
        businessId: business.id,
        status:     "PENDING",
        message,
      },
    });

    await prisma.adminLog.create({
      data: {
        adminId:    session.userId,
        action:     "REQUEST_CLAIM_PLACE",
        targetId:   place.id,
        targetType: "PLACE",
        detail:     `Business requested claim: ${place.title}`,
      },
    }).catch(() => {});

    return NextResponse.json({ message: "ส่งคำขอเรียบร้อย รอแอดมินอนุมัติ", pending: true });
  } catch (err) {
    console.error("POST /api/places/[slug]/claim:", err);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

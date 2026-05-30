import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/promotions — list active promotions (public)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get("placeId");
  const province = searchParams.get("province");
  const district = searchParams.get("district");
  const now = new Date();

  const promotions = await prisma.promotion.findMany({
    where: {
      status: "ACTIVE",
      startDate: { lte: now },
      endDate: { gt: now },
      ...(placeId ? { placeId } : {}),
      ...(province || district ? {
        place: {
          ...(province ? { province: { contains: province, mode: "insensitive" } } : {}),
          ...(district ? { district: { contains: district, mode: "insensitive" } } : {}),
        },
      } : {}),
    },
    include: {
      place: { select: { id: true, title: true, slug: true, coverUrl: true, province: true, district: true } },
      business: { select: { id: true, businessName: true, logoUrl: true } },
    },
    orderBy: { endDate: "asc" },
    take: 50,
  });
  return NextResponse.json({ promotions });
}

// POST /api/promotions — business ขอสร้างโปรโมชั่น
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    if (session.role !== "BUSINESS") {
      return NextResponse.json({ error: "เฉพาะเจ้าของธุรกิจเท่านั้น" }, { status: 403 });
    }

    const business = await prisma.business.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (!business) return NextResponse.json({ error: "ไม่พบข้อมูลธุรกิจ" }, { status: 404 });

    const { title, description, coverUrl, placeId, discount, condition, startDate, endDate } = await req.json();
    if (!title || !description || !startDate || !endDate) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
    }
    if (new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json({ error: "วันหมดอายุต้องหลังวันเริ่ม" }, { status: 400 });
    }

    const promo = await prisma.promotion.create({
      data: {
        businessId: business.id,
        placeId: placeId || null,
        title, description,
        coverUrl: coverUrl || null,
        discount: discount || null,
        condition: condition || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "PENDING",
      },
    });
    return NextResponse.json({ ok: true, promotion: promo }, { status: 201 });
  } catch (e) {
    console.error("POST /api/promotions:", e);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

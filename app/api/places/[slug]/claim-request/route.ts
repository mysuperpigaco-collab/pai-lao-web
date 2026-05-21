import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST /api/places/[slug]/claim-request — BUSINESS submits ownership claim (requires admin approval)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    if (session.role !== "BUSINESS") {
      return NextResponse.json({ message: "เฉพาะเจ้าของธุรกิจเท่านั้น" }, { status: 403 });
    }

    const { slug } = await params;
    const { message } = await req.json().catch(() => ({ message: "" }));

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

    // Check if already submitted
    const existing = await (prisma as any).placeClaim.findUnique({
      where: { placeId_businessId: { placeId: place.id, businessId: business.id } },
    });
    if (existing) {
      return NextResponse.json({ message: "คุณส่งคำขอนี้แล้ว", status: existing.status }, { status: 200 });
    }

    const claim = await (prisma as any).placeClaim.create({
      data: {
        placeId: place.id,
        businessId: business.id,
        message: message?.trim() || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ message: "ส่งคำขอสำเร็จ รอแอดมินอนุมัติ", claimId: claim.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/places/[slug]/claim-request:", err);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// GET /api/places/[slug]/claim-request — check current business's claim status for this place
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "BUSINESS") {
      return NextResponse.json({ claim: null });
    }

    const { slug } = await params;
    const place = await prisma.place.findUnique({ where: { slug }, select: { id: true } });
    if (!place) return NextResponse.json({ claim: null });

    const business = await prisma.business.findUnique({
      where: { userId: session.userId }, select: { id: true },
    });
    if (!business) return NextResponse.json({ claim: null });

    const claim = await (prisma as any).placeClaim.findUnique({
      where: { placeId_businessId: { placeId: place.id, businessId: business.id } },
      select: { id: true, status: true, adminNote: true, createdAt: true },
    });

    return NextResponse.json({ claim });
  } catch {
    return NextResponse.json({ claim: null });
  }
}

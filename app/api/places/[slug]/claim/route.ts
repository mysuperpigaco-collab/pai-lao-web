import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST /api/places/[slug]/claim — business owner claims an unclaimed place
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
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

    // Claim: link place to this business
    await prisma.place.update({
      where: { slug },
      data: { businessId: business.id },
    });

    await prisma.adminLog.create({
      data: {
        adminId: session.userId,
        action: "CLAIM_PLACE",
        targetId: place.id,
        targetType: "PLACE",
        detail: `Business claimed place: ${place.title}`,
      },
    }).catch(() => {});

    return NextResponse.json({ message: "เชื่อมสถานที่สำเร็จ" });
  } catch (err) {
    console.error("POST /api/places/[slug]/claim:", err);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

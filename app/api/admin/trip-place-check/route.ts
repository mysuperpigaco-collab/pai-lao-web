import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/trip-place-check?tripId=xxx
// Returns timeline stops that have PENDING places or are unlinked (no placeId)
export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN"))
      return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");
    if (!tripId) return NextResponse.json({ message: "ต้องระบุ tripId" }, { status: 400 });

    const stops = await prisma.timelineStop.findMany({
      where: { tripId },
      orderBy: { order: "asc" },
      select: {
        id: true, placeName: true, placeId: true, order: true,
        province: true, district: true,
        place: {
          select: {
            id: true, slug: true, title: true, approvalStatus: true,
            coverUrl: true, province: true, district: true, category: true,
            lat: true, lng: true, googleMapsUrl: true,
          },
        },
      },
    });

    const flagged = stops
      .filter(s => {
        if (!s.placeId) return true; // unlinked — พิมพ์เองไม่เลือกจาก DB
        if (s.place?.approvalStatus === "PENDING") return true; // linked แต่สถานที่ยังไม่ผ่าน
        return false;
      })
      .map(s => ({
        stopId:    s.id,
        order:     s.order,
        placeName: s.placeName || s.place?.title || "-",
        province:  s.province || s.place?.province || "",
        district:  s.district || s.place?.district || "",
        placeId:   s.placeId,
        status:    !s.placeId ? "UNLINKED" : "PENDING",
        place:     s.place ?? null,
      }));

    return NextResponse.json({ flagged, total: flagged.length });
  } catch (err) {
    console.error("GET /api/admin/trip-place-check:", err);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function slugify(text: string) {
  return text.toLowerCase()
    .replace(/[฀-๿]/g, c => c.charCodeAt(0).toString(36))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) + "-" + Date.now().toString(36);
}

const CAT_MAP: Record<string, string> = {
  NATURE:"NATURE", CAFE:"CAFE", ACCOMMODATION:"ACCOMMODATION", CAMPING:"CAMPING",
  FOOD:"FOOD", TEMPLE:"TEMPLE", BEACH:"BEACH", MARKET:"MARKET",
  ADVENTURE:"ADVENTURE", MUSEUM:"MUSEUM",
};

// POST /api/places/suggest — any logged-in user can suggest an unclaimed landmark
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    if (session.role === "BUSINESS") {
      return NextResponse.json({ message: "เจ้าของธุรกิจกรุณาเพิ่มสถานที่ผ่านหน้าแดชบอร์ด" }, { status: 403 });
    }

    const { title, province, district, category, googleMapsUrl } = await request.json();
    if (!title?.trim()) return NextResponse.json({ message: "กรุณาระบุชื่อสถานที่" }, { status: 400 });
    if (!province)      return NextResponse.json({ message: "กรุณาระบุจังหวัด" }, { status: 400 });

    // ── ถ้ามีสถานที่ชื่อเดียวกันในจังหวัดเดียวกันอยู่แล้ว → link ไปเลย ไม่สร้างซ้ำ ──
    const existing = await prisma.place.findFirst({
      where: {
        title:    { equals: title.trim(), mode: "insensitive" },
        province: { equals: province,     mode: "insensitive" },
      },
      select: { id: true, slug: true, title: true, approvalStatus: true },
    });
    if (existing) {
      // ถ้ามี googleMapsUrl ใหม่และ place ยังไม่มี → อัปเดตแบบ silent (ไม่ต้องรออนุมัติ เป็น metadata)
      if (googleMapsUrl?.trim()) {
        await prisma.place.updateMany({
          where: { id: existing.id, googleMapsUrl: null },
          data:  { googleMapsUrl: googleMapsUrl.trim() },
        });
      }
      return NextResponse.json({ place: { id: existing.id, slug: existing.slug, title: existing.title }, existing: true });
    }

    const catEnum = CAT_MAP[category] ?? "NATURE";
    const slug    = slugify(title.trim());

    const place = await prisma.place.create({
      data: {
        slug,
        title:          title.trim(),
        province:       province ?? "",
        district:       district ?? "",
        category:       catEnum as any,
        coverUrl:       "",
        gallery:        [],
        amenities:      [],
        tags:           [],
        description:    "สถานที่แนะนำโดยนักท่องเที่ยว ยังไม่มีเจ้าของ",
        approvalStatus: "PENDING",
        businessId:     null,
        ...(googleMapsUrl?.trim() ? { googleMapsUrl: googleMapsUrl.trim() } : {}),
      },
    });

    return NextResponse.json({ place: { id: place.id, slug: place.slug, title: place.title } }, { status: 201 });
  } catch (err) {
    console.error("POST /api/places/suggest:", err);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

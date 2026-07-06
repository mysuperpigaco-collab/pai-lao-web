import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ username: string }> };

// GET /api/users/[username]/photos — รวมรูปจากทุกทริปที่อนุมัติแล้วของผู้ใช้ (แท็บแกลเลอรีหน้าโปรไฟล์)
export async function GET(_req: Request, { params }: Params) {
  try {
    const { username } = await params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, profilePrivacy: true },
    });
    if (!user) return NextResponse.json({ message: "ไม่พบผู้ใช้" }, { status: 404 });
    if (user.profilePrivacy === "PRIVATE") return NextResponse.json({ photos: [] });

    const trips = await prisma.trip.findMany({
      where: { authorId: user.id, isPublished: true, approvalStatus: "APPROVED", isDraft: false },
      orderBy: { createdAt: "desc" },
      select: {
        slug: true, title: true, coverUrl: true, gallery: true,
        timeline: { select: { images: true }, orderBy: { order: "asc" } },
      },
    });

    // เรียง: ปก → แกลเลอรี → รูปจุดแวะ ต่อทริป · กรองรูป default + ซ้ำ · cap 300 กัน payload บวม
    const seen = new Set<string>();
    const photos: { url: string; tripSlug: string; tripTitle: string }[] = [];
    for (const t of trips) {
      const urls = [t.coverUrl, ...(t.gallery ?? []), ...t.timeline.flatMap(s => s.images ?? [])];
      for (const url of urls) {
        if (!url || url.includes("default-place.svg") || seen.has(url)) continue;
        seen.add(url);
        photos.push({ url, tripSlug: t.slug, tripTitle: t.title });
        if (photos.length >= 300) break;
      }
      if (photos.length >= 300) break;
    }

    return NextResponse.json({ photos, total: photos.length });
  } catch (error) {
    console.error("GET /api/users/[username]/photos:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

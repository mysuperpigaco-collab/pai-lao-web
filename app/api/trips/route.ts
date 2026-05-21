import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ── GET /api/trips ─────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page     = Number(searchParams.get("page")  ?? 1);
    const limit    = Number(searchParams.get("limit") ?? 12);
    const mood     = searchParams.get("mood")     ?? undefined;
    const authorId = searchParams.get("authorId") ?? undefined;
    const mine     = searchParams.get("mine")     === "1";
    const province = searchParams.get("province") ?? undefined;
    const district = searchParams.get("district") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const sort     = searchParams.get("sort")     ?? "recent";
    const q        = searchParams.get("q")        ?? undefined;
    const skip     = (page - 1) * limit;

    // ถ้าส่ง mine=1 จะดึงเฉพาะทริปของ user ที่ login (รวมทั้ง unpublished)
    let resolvedAuthorId = authorId;
    let includeUnpublished = false;
    if (mine) {
      const session = await getCurrentUser();
      if (session) { resolvedAuthorId = session.userId; includeUnpublished = true; }
    }

    const where: any = {
      ...(!includeUnpublished ? { isPublished: true, approvalStatus: "APPROVED" } : {}),
      ...(mood             ? { mood }                       : {}),
      ...(resolvedAuthorId ? { authorId: resolvedAuthorId } : {}),
      ...(province ? { timeline: { some: { province: { contains: province, mode: "insensitive" } } } } : {}),
      ...(district ? { timeline: { some: { district: { contains: district, mode: "insensitive" } } } } : {}),
      ...(category ? { mood: { contains: category, mode: "insensitive" } } : {}),
      ...(q ? { OR: [
        { title:    { contains: q, mode: "insensitive" } },
        { subtitle: { contains: q, mode: "insensitive" } },
        { timeline: { some: { province: { contains: q, mode: "insensitive" } } } },
      ]} : {}),
    };

    const orderBy: any = sort === "popular"
      ? { bookmarks: { _count: "desc" } }
      : { createdAt: "desc" };

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true, slug: true, title: true, subtitle: true,
          coverUrl: true, mood: true, budget: true, location: true,
          tags: true, createdAt: true, isPublished: true,
          approvalStatus: true, rejectionReason: true,
          author: { select: { id: true, username: true, displayName: true, firstName: true, avatarUrl: true } },
          _count: { select: { reviews: true, bookmarks: true, likes: true } },
          reviews: { select: { rating: true } },
          timeline: { select: { province: true, district: true }, take: 1, orderBy: { order: "asc" } },
        },
      }),
      prisma.trip.count({ where }),
    ]);

    // flatten province/district + compute avgRating
    const tripsFlat = trips.map(({ timeline, reviews, ...t }) => {
      const ratings = (reviews ?? []).map((r: { rating: number }) => r.rating).filter(Boolean);
      const avgRating = ratings.length ? ratings.reduce((s: number, r: number) => s + r, 0) / ratings.length : null;
      return {
        ...t,
        avgRating,
        province: timeline?.[0]?.province ?? null,
        district: timeline?.[0]?.district ?? null,
      };
    });

    return NextResponse.json({ trips: tripsFlat, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("GET /api/trips:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// ── POST /api/trips — สร้างทริปใหม่ ──────────────────────
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    // เช็คว่าถูกแบนโพสอยู่หรือไม่
    const userCheck = await prisma.user.findUnique({ where: { id: session.userId }, select: { postBannedUntil: true, bannedUntil: true } });
    const now = new Date();
    if (userCheck?.bannedUntil && userCheck.bannedUntil > now) {
      return NextResponse.json({ message: "บัญชีของคุณถูกระงับ ไม่สามารถดำเนินการได้" }, { status: 403 });
    }
    if (userCheck?.postBannedUntil && userCheck.postBannedUntil > now) {
      const until = new Date(userCheck.postBannedUntil);
      const isPermanent = until.getFullYear() >= 2099;
      const dateStr = isPermanent ? "ถาวร" : until.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
      return NextResponse.json({ message: `คุณถูกห้ามโพสจนถึงวันที่ ${dateStr}` }, { status: 403 });
    }

    const body = await request.json();
    const { title, subtitle, description, coverUrl, gallery, mood, budget, location, tags, timeline,
            youtubeUrl, tiktokUrl, durationDays, tripStyle, transportMode } = body;

    if (!title || !description || !coverUrl) {
      return NextResponse.json({ message: "กรุณากรอก ชื่อ คำอธิบาย และรูปปก" }, { status: 400 });
    }

    const slug = `${title.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").toLowerCase()}-${Date.now()}`;

    const trip = await prisma.trip.create({
      data: {
        slug,
        title,
        subtitle:    subtitle    ?? "",
        description,
        coverUrl,
        gallery:     gallery     ?? [],
        mood:        mood        ?? "ทั่วไป",
        budget:      budget      ? Number(budget) : null,
        location:    location    ?? "",
        tags:        tags        ?? [],
        youtubeUrl:    youtubeUrl    ?? null,
        tiktokUrl:     tiktokUrl     ?? null,
        durationDays:  durationDays  ? Number(durationDays) : null,
        tripStyle:     tripStyle     ?? null,
        transportMode: transportMode ?? null,
        isPublished:     false,
        approvalStatus:  "PENDING",
        authorId:        session.userId,
        timeline: timeline?.length ? {
          create: (timeline as any[]).map((stop: any, index: number) => ({
            order:       index,
            date:        stop.date        ?? "",
            time:        stop.time        ?? "",
            placeName:   stop.place       ?? stop.placeName ?? "",
            province:    stop.province    ?? "",
            district:    stop.district    ?? "",
            description: stop.description ?? "",
            transport:   stop.transport   ?? null,
            duration:    stop.duration    ?? null,
            cost:        stop.cost          ?? null,
            images:      stop.images        ?? (stop.image ? [stop.image] : []),
            stopType:      stop.stopType      ?? null,
            googleMapsUrl: stop.googleMapsUrl ?? null,
            tips:          stop.tips          ?? null,
          })),
        } : undefined,
      },
      include: { timeline: true },
    });

    return NextResponse.json({ message: "สร้างทริปสำเร็จ", trip }, { status: 201 });
  } catch (error) {
    console.error("POST /api/trips:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

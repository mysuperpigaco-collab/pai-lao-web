import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity, getClientIp } from "@/lib/activityLogger";
import { sanitizeServerHtml } from "@/lib/sanitize-server";

// สร้าง review อัตโนมัติจาก timeline stops ที่ shareToPlace=true
// เรียกหลัง trip/timeline ถูก save เสร็จสมบูรณ์แล้วเท่านั้น
// หมายเหตุ: รีวิวนี้เป็นของ "สถานที่" เท่านั้น (placeId) ห้ามผูก tripId
// ไม่งั้นมันจะไปโผล่ในส่วนคอมเมนต์ของทริปด้วย
async function autoPlaceReviews(
  stops: { shareToPlace: boolean; placeId: string | null; description: string; rating?: number | null; }[],
  authorId: string,
) {
  const eligible = stops.filter(
    (s) => s.shareToPlace && s.placeId && s.description?.trim(),
  );
  for (const stop of eligible) {
    const existing = await prisma.review.findFirst({
      where: { authorId, placeId: stop.placeId! },
      select: { id: true },
    });
    if (!existing) {
      await prisma.review.create({
        data: {
          authorId,
          placeId: stop.placeId!,
          rating: stop.rating ?? 5,
          text: stop.description.trim(),
        },
      });
    }
  }
}

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
    let session = mine ? await getCurrentUser() : null;
    if (session) { resolvedAuthorId = session.userId; includeUnpublished = true; }

    const where: any = {
      ...(!includeUnpublished ? { isPublished: true, approvalStatus: "APPROVED", isDraft: false } : { isDraft: false }),
      ...(mood             ? { AND: [{ OR: [{ mood }, { moods: { has: mood } }] }] } : {}),
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

    // ── Shared select for scored sorts ───────────────────────
    const scoredSelect = {
      id: true, slug: true, title: true, subtitle: true,
      coverUrl: true, mood: true, moods: true, budget: true, location: true,
      tags: true, createdAt: true, isPublished: true, viewCount: true,
      approvalStatus: true, rejectionReason: true,
      author: { select: { id: true, username: true, displayName: true, firstName: true, avatarUrl: true } },
      _count: { select: { reviews: true, bookmarks: true, likes: true } },
      reviews: { select: { rating: true } },
      timeline: { select: { province: true, district: true }, take: 1, orderBy: { order: "asc" as const } },
    };

    const computeScore = (t: any) =>
      (t._count.likes     ?? 0) * 3 +
      (t._count.bookmarks ?? 0) * 5 +
      (t.viewCount        ?? 0) * 1;

    const flattenTrip = ({ timeline, reviews, ...t }: any) => {
      const ratings = (reviews ?? []).map((r: any) => r.rating).filter(Boolean);
      const avgRating = ratings.length ? ratings.reduce((s: number, r: number) => s + r, 0) / ratings.length : null;
      return { ...t, avgRating, province: timeline?.[0]?.province ?? null, district: timeline?.[0]?.district ?? null, hasPendingEdit: false };
    };

    // ── Trending: เฉพาะทริปอายุ ≤ 90 วัน เรียงด้วย composite score ──
    if (sort === "trending") {
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const trips = await prisma.trip.findMany({
        where: { ...where, createdAt: { gte: since } },
        select: scoredSelect,
      });
      const scored = trips
        .map((t: any) => ({ ...t, _score: computeScore(t) }))
        .sort((a: any, b: any) => b._score - a._score);
      const total = scored.length;
      const page_trips = scored.slice(skip, skip + limit).map(({ _score, ...t }: any) => flattenTrip(t));
      return NextResponse.json({ trips: page_trips, total, page, totalPages: Math.ceil(total / limit) });
    }

    // ── Popular: ทุกทริปไม่จำกัดอายุ เรียงด้วย composite score all-time ──
    if (sort === "popular") {
      const trips = await prisma.trip.findMany({
        where,
        select: scoredSelect,
      });
      const scored = trips
        .map((t: any) => ({ ...t, _score: computeScore(t) }))
        .sort((a: any, b: any) => b._score - a._score);
      const total = scored.length;
      const page_trips = scored.slice(skip, skip + limit).map(({ _score, ...t }: any) => flattenTrip(t));
      return NextResponse.json({ trips: page_trips, total, page, totalPages: Math.ceil(total / limit) });
    }

    const orderBy: any = { createdAt: "desc" };

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true, slug: true, title: true, subtitle: true,
          coverUrl: true, mood: true, moods: true, budget: true, location: true,
          tags: true, createdAt: true, isPublished: true, viewCount: true,
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

    // ถ้าเป็น mine=1 ให้ตรวจว่ามี PendingEdit รออยู่สำหรับทริปไหนบ้าง
    let pendingEditTripIds = new Set<string>();
    if (mine) {
      const tripIds = tripsFlat.map((t: any) => t.id).filter(Boolean);
      if (tripIds.length > 0) {
        const pending = await (prisma as any).pendingEdit.findMany({
          where: {
            targetType: "TRIP",
            targetId: { in: tripIds },
            status: "PENDING",
            ...(session ? { submittedById: session.userId } : {}),
          },
          select: { targetId: true },
        });
        pending.forEach((p: any) => pendingEditTripIds.add(p.targetId));
      }
    }

    const tripsWithPending = tripsFlat.map((t: any) => ({
      ...t,
      hasPendingEdit: pendingEditTripIds.has(t.id),
    }));

    return NextResponse.json({ trips: tripsWithPending, total, page, totalPages: Math.ceil(total / limit) });
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
    const { title, subtitle, description, coverUrl, gallery, mood, moods, budget, location, tags, timeline,
            youtubeUrl, tiktokUrl, durationDays, tripStyle, transportMode, isDraft } = body;

    if (isDraft) {
      // Draft: ต้องการแค่ชื่อ
      if (!title?.trim()) {
        return NextResponse.json({ message: "กรุณากรอกชื่อทริป" }, { status: 400 });
      }
      // จำกัด 1 draft ต่อคน
      const existingDraft = await (prisma as any).trip.findFirst({ where: { authorId: session.userId, isDraft: true } });
      if (existingDraft) {
        return NextResponse.json({ message: "คุณมีบันทึกทริปที่ยังไม่เสร็จอยู่แล้ว กรุณาทำให้เสร็จก่อน", draftId: existingDraft.id, draftSlug: existingDraft.slug }, { status: 409 });
      }
    } else {
      if (!title || !description || !coverUrl) {
        return NextResponse.json({ message: "กรุณากรอก ชื่อ คำอธิบาย และรูปปก" }, { status: 400 });
      }
    }

    // slug: keep Thai + alphanumeric, collapse dashes, strip leading/trailing dashes
    const titleSlug = title
      .replace(/[^a-zA-Z0-9฀-๿]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "trip";
    const slug = `${titleSlug}-${Date.now()}`;

    const trip = await (prisma as any).trip.create({
      data: {
        slug,
        title,
        subtitle:    subtitle    ?? "",
        description: sanitizeServerHtml(description ?? ""),
        coverUrl:    coverUrl    ?? "",
        gallery:     gallery     ?? [],
        mood:        mood        ?? "ทั่วไป",
        moods:       Array.isArray(moods) ? moods : [],
        budget:      budget      ? Math.round(Number(budget)) : null,
        location:    location    ?? "",
        tags:        tags        ?? [],
        youtubeUrl:    youtubeUrl    ?? null,
        tiktokUrl:     tiktokUrl     ?? null,
        durationDays:  durationDays  ? Number(durationDays) : null,
        tripStyle:     tripStyle     ?? null,
        transportMode: transportMode ?? null,
        isDraft:         isDraft ? true : false,
        isPublished:     false,
        approvalStatus:  isDraft ? null : "PENDING",
        authorId:        session.userId,
        timeline: timeline?.length ? {
          create: (timeline as any[]).map((stop: any, index: number) => ({
            order:         index,
            date:          stop.date          ?? "",
            time:          stop.time          ?? "",
            placeName:     stop.place         ?? stop.placeName ?? "",
            province:      stop.province      ?? "",
            district:      stop.district      ?? "",
            description:   stop.description   ?? "",
            transport:     stop.transport     ?? null,
            duration:      stop.duration      ?? null,
            cost:          stop.cost          ?? null,
            images:        stop.images        ?? (stop.image ? [stop.image] : []),
            stopType:      stop.stopType      ?? null,
            googleMapsUrl: stop.googleMapsUrl ?? null,
            tips:          stop.tips          ?? null,
            shareToPlace:  stop.shareToPlace  ?? false,
            rating:        stop.rating        ? Number(stop.rating) : null,
            placeId:       stop.placeId       ?? null,
            lat:           stop.lat           ?? null,
            lng:           stop.lng           ?? null,
          })),
        } : undefined,
      },
      include: { timeline: true },
    });

    await logActivity({
      userId: session.userId, username: session.username,
      action: "CREATE_TRIP",
      ip: getClientIp(request as NextRequest),
      userAgent: (request as NextRequest).headers.get("user-agent"),
      targetId: trip.id, targetType: "TRIP",
      detail: trip.title,
    }).catch(() => {});

    // สร้าง review อัตโนมัติจาก timeline stops ที่ shareToPlace=true (เฉพาะ non-draft)
    if (!isDraft && trip.timeline?.length) {
      await autoPlaceReviews(trip.timeline, session.userId).catch(() => {});
    }

    return NextResponse.json({ message: "สร้างทริปสำเร็จ", trip }, { status: 201 });
  } catch (error) {
    console.error("POST /api/trips:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

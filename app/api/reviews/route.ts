import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity, getClientIp } from "@/lib/activityLogger";

// ── GET /api/reviews?tripId=|placeId=&skip=&take= — โหลดรีวิวแบบแบ่งหน้า ──
// ใช้โดย infinite scroll หน้า trip/place (หน้าแรก SSR มากับ page 20 ตัว)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId  = searchParams.get("tripId")  ?? undefined;
    const placeId = searchParams.get("placeId") ?? undefined;
    if (!tripId === !placeId) {
      return NextResponse.json({ message: "ต้องระบุ tripId หรือ placeId อย่างใดอย่างหนึ่ง" }, { status: 400 });
    }
    const rawSkip = Number(searchParams.get("skip") ?? 0);
    const rawTake = Number(searchParams.get("take") ?? 20);
    const skip = Number.isFinite(rawSkip) ? Math.max(0, Math.floor(rawSkip)) : 0;
    const take = Number.isFinite(rawTake) ? Math.min(50, Math.max(1, Math.floor(rawTake))) : 20;

    const reviews = await prisma.review.findMany({
      where: tripId ? { tripId } : { placeId },
      orderBy: { createdAt: "desc" },
      skip, take,
      include: {
        author: { select: { id: true, username: true, firstName: true, displayName: true, avatarUrl: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, username: true, firstName: true, displayName: true, avatarUrl: true } } },
        },
      },
    });

    // mask ตัวตนรีวิวนิรนาม — endpoint สาธารณะ ห้ามหลุด author จริงใน JSON
    const safe = reviews.map((r) =>
      r.isAnonymous
        ? { ...r, author: { id: "anonymous", username: "", firstName: "ผู้ใช้นิรนาม", displayName: null, avatarUrl: null } }
        : r
    );
    return NextResponse.json({ reviews: safe, hasMore: reviews.length === take });
  } catch (e) {
    console.error("GET /api/reviews:", e);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// ── POST /api/reviews — เขียนรีวิว ───────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    // เช็ค role — แอดมินห้ามรีวิว
    if (session.role === "ADMIN" || session.role === "SUPERADMIN") {
      return NextResponse.json({ message: "แอดมินไม่สามารถให้คะแนนหรือรีวิวเนื้อหาได้" }, { status: 403 });
    }

    // เช็ค ban
    const userCheck = await prisma.user.findUnique({ where: { id: session.userId }, select: { postBannedUntil: true, bannedUntil: true } });
    const now = new Date();
    if (userCheck?.bannedUntil && userCheck.bannedUntil > now)
      return NextResponse.json({ message: "บัญชีของคุณถูกระงับ" }, { status: 403 });
    if (userCheck?.postBannedUntil && userCheck.postBannedUntil > now) {
      const until = new Date(userCheck.postBannedUntil);
      return NextResponse.json({ message: `คุณถูกห้ามโพสจนถึงวันที่ ${until.toLocaleDateString("th-TH")}` }, { status: 403 });
    }

    const { tripId, placeId, rating, text, isAnonymous } = await request.json();

    if (!rating || !text) {
      return NextResponse.json({ message: "กรุณากรอกคะแนนและความคิดเห็น" }, { status: 400 });
    }
    // จำกัดความยาว — กัน DB bloat จากข้อความยักษ์
    if (typeof text !== "string" || text.trim().length === 0 || text.length > 2000) {
      return NextResponse.json({ message: "ความคิดเห็นต้องยาวไม่เกิน 2,000 ตัวอักษร" }, { status: 400 });
    }
    if (!tripId && !placeId) {
      return NextResponse.json({ message: "ต้องระบุ tripId หรือ placeId" }, { status: 400 });
    }
    // XOR: ห้ามมีทั้งคู่ — review ที่มีทั้ง tripId+placeId จะโผล่ทั้งคอมเมนต์ทริปและรีวิวสถานที่พร้อมกัน
    if (tripId && placeId) {
      return NextResponse.json({ message: "ระบุได้อย่างใดอย่างหนึ่ง: tripId หรือ placeId" }, { status: 400 });
    }
    // rating ต้องเป็นจำนวนเต็ม 1-5 (กัน "abc" หลุดไปพัง 500 / กันทศนิยม)
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ message: "คะแนนต้องเป็นจำนวนเต็ม 1-5" }, { status: 400 });
    }

    // ── ตรวจสอบว่าเคยรีวิวแล้วหรือยัง (1 user = 1 review per trip/place) ──
    const existing = await prisma.review.findFirst({
      where: {
        authorId: session.userId,
        ...(tripId  ? { tripId }  : {}),
        ...(placeId ? { placeId } : {}),
      },
    });
    if (existing) {
      return NextResponse.json(
        { message: "คุณได้รีวิวแล้ว · You have already reviewed this", alreadyReviewed: true },
        { status: 409 }
      );
    }

    const review = await prisma.review.create({
      data: {
        authorId: session.userId,
        tripId:   tripId  ?? null,
        placeId:  placeId ?? null,
        rating:      ratingNum,
        text,
        isAnonymous: !!isAnonymous,
      },
      include: {
        author: { select: { id: true, username: true, displayName: true, firstName: true, avatarUrl: true } },
      },
    });

    await logActivity({
      userId: session.userId, username: session.username,
      action: "POST_REVIEW",
      ip: getClientIp(request), userAgent: request.headers.get("user-agent"),
      targetId: tripId ?? placeId, targetType: tripId ? "TRIP" : "PLACE",
      detail: `rating: ${rating}`,
    }).catch(() => {});

    return NextResponse.json({ message: "รีวิวสำเร็จ", review }, { status: 201 });
  } catch (error) {
    console.error("POST /api/reviews:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity, getClientIp } from "@/lib/activityLogger";

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

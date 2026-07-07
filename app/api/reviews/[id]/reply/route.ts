import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/activityLogger";

// ── POST /api/reviews/[id]/reply — ตอบกลับรีวิว (ทุก user ที่ login แล้ว)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    // ── Rate limit: 20 replies / นาที ต่อ user ──────────────
    const rl = await checkRateLimit(`reply:${session.userId}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ message: "ส่งความคิดเห็นบ่อยเกินไป กรุณารอสักครู่" }, { status: 429 });
    }

    // ── Ban check ──────────────────────────────────────────
    const userCheck = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { bannedUntil: true, postBannedUntil: true },
    });
    const now = new Date();
    if (userCheck?.bannedUntil && userCheck.bannedUntil > now) {
      return NextResponse.json({ message: "บัญชีของคุณถูกระงับ ไม่สามารถดำเนินการได้" }, { status: 403 });
    }
    if (userCheck?.postBannedUntil && userCheck.postBannedUntil > now) {
      const until = new Date(userCheck.postBannedUntil);
      const isPermanent = until.getFullYear() >= 2099;
      const dateStr = isPermanent ? "ถาวร" : until.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
      return NextResponse.json({ message: `คุณถูกจำกัดสิทธิ์จนถึงวันที่ ${dateStr}` }, { status: 403 });
    }

    const { id: reviewId } = await params;
    const { text } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json({ message: "กรุณากรอกข้อความตอบกลับ" }, { status: 400 });
    }
    if (typeof text !== "string" || text.length > 2000) {
      return NextResponse.json({ message: "ข้อความต้องยาวไม่เกิน 2,000 ตัวอักษร" }, { status: 400 });
    }

    if (text.trim().length > 1000) {
      return NextResponse.json({ message: "ข้อความยาวเกินไป (สูงสุด 1,000 ตัวอักษร)" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true },
    });

    if (!review) {
      return NextResponse.json({ message: "ไม่พบรีวิว" }, { status: 404 });
    }

    const reply = await prisma.reviewReply.create({
      data: {
        reviewId,
        authorId: session.userId,
        text: text.trim(),
      },
      include: {
        author: {
          select: { id: true, username: true, firstName: true, displayName: true, avatarUrl: true, role: true },
        },
      },
    });

    return NextResponse.json({ message: "ตอบกลับสำเร็จ", reply }, { status: 201 });
  } catch (error) {
    console.error("POST /api/reviews/[id]/reply:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

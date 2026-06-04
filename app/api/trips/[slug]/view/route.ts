import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ slug: string }> };

// POST /api/trips/[slug]/view — increment viewCount (fire-and-forget จาก client)
export async function POST(_req: Request, { params }: Params) {
  try {
    const { slug } = await params;
    await prisma.trip.updateMany({
      where: { slug, isPublished: true, approvalStatus: "APPROVED" },
      data:  { viewCount: { increment: 1 } },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

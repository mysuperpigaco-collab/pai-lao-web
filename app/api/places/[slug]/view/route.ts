import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ slug: string }> };

// POST /api/places/[slug]/view — increment viewCount
export async function POST(_req: Request, { params }: Params) {
  try {
    const { slug } = await params;
    await prisma.place.updateMany({
      where: { slug, approvalStatus: "APPROVED" },
      data:  { viewCount: { increment: 1 } },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

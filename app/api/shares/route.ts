import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tripId, placeId } = body as { tripId?: string; placeId?: string };

    if (!tripId && !placeId) {
      return NextResponse.json({ error: "tripId or placeId required" }, { status: 400 });
    }

    if (tripId) {
      const updated = await prisma.trip.update({
        where: { id: tripId },
        data: { shareCount: { increment: 1 } },
        select: { shareCount: true },
      });
      return NextResponse.json({ shareCount: updated.shareCount });
    }

    if (placeId) {
      const updated = await prisma.place.update({
        where: { id: placeId },
        data: { shareCount: { increment: 1 } },
        select: { shareCount: true },
      });
      return NextResponse.json({ shareCount: updated.shareCount });
    }
  } catch (err) {
    console.error("[POST /api/shares]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

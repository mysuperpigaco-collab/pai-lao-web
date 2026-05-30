import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { placeId, coverUrl } = await req.json();
  if (!placeId || !coverUrl) return NextResponse.json({ message: "Missing fields" }, { status: 400 });
  const place = await prisma.place.update({
    where: { id: placeId },
    data: { coverUrl },
    select: { id: true, coverUrl: true },
  });
  return NextResponse.json({ place });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  if (!q) return NextResponse.json({ places: [] });

  const places = await prisma.place.findMany({
    where: {
      OR: [
        { title:    { contains: q, mode: "insensitive" } },
        { province: { contains: q, mode: "insensitive" } },
        { district: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, title: true, province: true, district: true, slug: true },
    take: 10,
    orderBy: { title: "asc" },
  });

  return NextResponse.json({ places });
}

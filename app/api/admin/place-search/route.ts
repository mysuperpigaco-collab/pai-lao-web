import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const q = req.nextUrl.searchParams.get("q") ?? "";
    if (!q.trim()) return NextResponse.json({ places: [] });

    const places = await prisma.place.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { province: { contains: q, mode: "insensitive" } },
          { district: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, province: true, district: true, slug: true },
      take: 10,
    });
    return NextResponse.json({ places });
  } catch (e) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const plans = await (prisma as any).tripPlan.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: "desc" },
    include: {
      stops: { orderBy: { order: "asc" }, include: { place: { select: { slug: true, title: true, coverUrl: true } } } },
    },
  });
  return NextResponse.json({ plans });
}

export async function POST(request: Request) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { title, description, startDate, endDate, province } = await request.json();
  if (!title?.trim()) return NextResponse.json({ message: "กรุณากรอกชื่อแผน" }, { status: 400 });

  const plan = await (prisma as any).tripPlan.create({
    data: {
      userId: session.userId,
      title: title.trim(),
      description: description?.trim() || null,
      startDate: startDate || null,
      endDate: endDate || null,
      province: province || null,
      isPublic: false,
    },
    include: { stops: true },
  });
  return NextResponse.json({ plan }, { status: 201 });
}

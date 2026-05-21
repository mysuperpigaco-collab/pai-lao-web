import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const plan = await (prisma as any).tripPlan.findUnique({
    where: { id },
    include: {
      user: { select: { displayName: true, firstName: true, username: true, avatarUrl: true } },
      stops: {
        orderBy: { order: "asc" },
        include: { place: { select: { id: true, slug: true, title: true, province: true, district: true, coverUrl: true, googleMapsUrl: true } } },
      },
    },
  });
  if (!plan) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const session = await getCurrentUser();
  const isOwner = session?.userId === plan.userId;
  if (!plan.isPublic && !isOwner) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  return NextResponse.json({ plan });
}

export async function PUT(request: Request, { params }: Params) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { action } = body;

  const plan = await (prisma as any).tripPlan.findUnique({ where: { id } });
  if (!plan || plan.userId !== session.userId)
    return NextResponse.json({ message: "Not found" }, { status: 404 });

  // ── Add stop ──
  if (action === "add-stop") {
    const { name, province, district, notes, googleMapsUrl, stopType, placeId } = body;
    const count = await (prisma as any).tripPlanStop.count({ where: { planId: id } });
    const stop = await (prisma as any).tripPlanStop.create({
      data: {
        planId: id,
        order: count,
        name: name?.trim() || "จุดที่ไม่มีชื่อ",
        province: province || null,
        district: district || null,
        notes: notes?.trim() || null,
        googleMapsUrl: googleMapsUrl?.trim() || null,
        stopType: stopType || "ATTRACTION",
        placeId: placeId || null,
      },
      include: { place: { select: { id: true, slug: true, title: true, province: true, district: true, coverUrl: true, googleMapsUrl: true } } },
    });
    return NextResponse.json({ stop });
  }

  // ── Remove stop ──
  if (action === "remove-stop") {
    const { stopId } = body;
    await (prisma as any).tripPlanStop.delete({ where: { id: stopId } });
    // Re-number remaining stops
    const remaining = await (prisma as any).tripPlanStop.findMany({ where: { planId: id }, orderBy: { order: "asc" } });
    for (let i = 0; i < remaining.length; i++) {
      await (prisma as any).tripPlanStop.update({ where: { id: remaining[i].id }, data: { order: i } });
    }
    return NextResponse.json({ ok: true });
  }

  // ── Move stop up/down ──
  if (action === "move-stop") {
    const { stopId, direction } = body; // direction: "up" | "down"
    const stops = await (prisma as any).tripPlanStop.findMany({ where: { planId: id }, orderBy: { order: "asc" } });
    const idx = stops.findIndex((s: any) => s.id === stopId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= stops.length) return NextResponse.json({ ok: true });
    await (prisma as any).tripPlanStop.update({ where: { id: stops[idx].id }, data: { order: swapIdx } });
    await (prisma as any).tripPlanStop.update({ where: { id: stops[swapIdx].id }, data: { order: idx } });
    return NextResponse.json({ ok: true });
  }

  // ── Update stop notes ──
  if (action === "update-stop") {
    const { stopId, notes, googleMapsUrl } = body;
    const stop = await (prisma as any).tripPlanStop.update({
      where: { id: stopId },
      data: { notes: notes?.trim() || null, googleMapsUrl: googleMapsUrl?.trim() || null },
    });
    return NextResponse.json({ stop });
  }

  // ── Update plan meta ──
  if (action === "update-meta") {
    const { title, description, startDate, endDate, province } = body;
    const updated = await (prisma as any).tripPlan.update({
      where: { id },
      data: { title: title?.trim() || plan.title, description: description?.trim() || null, startDate: startDate || null, endDate: endDate || null, province: province || null },
    });
    return NextResponse.json({ plan: updated });
  }

  // ── Toggle public ──
  if (action === "toggle-public") {
    const updated = await (prisma as any).tripPlan.update({ where: { id }, data: { isPublic: !plan.isPublic } });
    return NextResponse.json({ plan: updated });
  }

  return NextResponse.json({ message: "Unknown action" }, { status: 400 });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const plan = await (prisma as any).tripPlan.findUnique({ where: { id } });
  if (!plan || plan.userId !== session.userId)
    return NextResponse.json({ message: "Not found" }, { status: 404 });

  await (prisma as any).tripPlan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

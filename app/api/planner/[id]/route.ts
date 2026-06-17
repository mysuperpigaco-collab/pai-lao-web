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
        include: { place: { select: { id: true, slug: true, title: true, province: true, district: true, coverUrl: true, googleMapsUrl: true, lat: true, lng: true } } },
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
    const { name, province, district, notes, googleMapsUrl, stopType, placeId, arrivalTime, duration, day } = body;
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
        day: day ? Number(day) : 1,
        arrivalTime: arrivalTime?.trim() || null,
        duration: duration ? Number(duration) : null,
        placeId: placeId || null,
      },
      include: { place: { select: { id: true, slug: true, title: true, province: true, district: true, coverUrl: true, googleMapsUrl: true } } },
    });
    return NextResponse.json({ stop });
  }

  // ── Remove stop ──
  if (action === "remove-stop") {
    const { stopId } = body;
    await (prisma as any).tripPlanStop.deleteMany({ where: { id: stopId, planId: id } });
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

  // ── Reorder stops by drag-and-drop (ordered IDs for one day) ──
  if (action === "reorder-stops") {
    const { orderedIds } = body as { orderedIds: string[] };
    // Get all stops so we can keep cross-day order intact
    const allStops = await (prisma as any).tripPlanStop.findMany({ where: { planId: id }, orderBy: { order: "asc" } });
    // Compute new global order: stops NOT in orderedIds keep their relative order before the day's stops
    const dayStopIds = new Set(orderedIds);
    const otherStops = allStops.filter((s: any) => !dayStopIds.has(s.id));
    // Assign new order values
    let i = 0;
    for (const s of otherStops) {
      await (prisma as any).tripPlanStop.update({ where: { id: s.id }, data: { order: i++ } });
    }
    for (const sid of orderedIds) {
      await (prisma as any).tripPlanStop.update({ where: { id: sid }, data: { order: i++ } });
    }
    return NextResponse.json({ ok: true });
  }

  // ── Update stop notes ──
  if (action === "update-stop") {
    const { stopId, notes, googleMapsUrl, arrivalTime, duration, day } = body;
    const owned = await (prisma as any).tripPlanStop.findFirst({ where: { id: stopId, planId: id } });
    if (!owned) return NextResponse.json({ message: "Not found" }, { status: 404 });
    const stop = await (prisma as any).tripPlanStop.update({
      where: { id: stopId },
      data: { notes: notes?.trim() || null, googleMapsUrl: googleMapsUrl?.trim() || null, arrivalTime: arrivalTime?.trim() || null, duration: duration !== undefined ? (duration ? Number(duration) : null) : undefined, ...(day !== undefined ? { day: Number(day) } : {}) },
    });
    return NextResponse.json({ stop });
  }

  // ── Update plan meta ──
  if (action === "update-meta") {
    const { title, description, startDate, endDate, province, coverUrl } = body;
    const updated = await (prisma as any).tripPlan.update({
      where: { id },
      data: { title: title?.trim() || plan.title, description: description?.trim() || null, startDate: startDate || null, endDate: endDate || null, province: province || null, ...(coverUrl !== undefined ? { coverUrl: coverUrl || null } : {}) },
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

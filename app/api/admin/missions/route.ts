import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function adminGuard(session: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) return false;
  return true;
}

// GET /api/admin/missions
export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!adminGuard(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") || "missions"; // missions | submissions

  if (tab === "submissions") {
    const submissions = await prisma.missionParticipant.findMany({
      where: { status: "SUBMITTED" },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        mission: { select: { id: true, title: true, rewardPoints: true, badgeLabel: true } },
      },
      orderBy: { submittedAt: "asc" },
    });
    return NextResponse.json({ submissions });
  }

  const missions = await prisma.mission.findMany({
    include: {
      place: { select: { id: true, title: true, slug: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ missions });
}

// POST /api/admin/missions — สร้างภารกิจ
export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!adminGuard(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { title, description, coverUrl, placeId, province, reward, rewardPoints, badgeLabel, startDate, endDate, maxSlots } = body;
  if (!title || !description || !startDate || !endDate) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  }

  const mission = await prisma.mission.create({
    data: {
      title, description, coverUrl: coverUrl || null,
      placeId: placeId || null, province: province || null,
      reward: reward || null, rewardPoints: rewardPoints || 0,
      badgeLabel: badgeLabel || null,
      startDate: new Date(startDate), endDate: new Date(endDate),
      maxSlots: maxSlots ? Number(maxSlots) : null,
      status: "ACTIVE",
      createdById: session!.userId,
    },
  });
  return NextResponse.json({ ok: true, mission }, { status: 201 });
}

// PUT /api/admin/missions — อนุมัติ/ปฏิเสธผลงาน
export async function PUT(req: NextRequest) {
  const session = await getCurrentUser();
  if (!adminGuard(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { participantId, action, adminNote } = await req.json();
  if (!participantId || !action) return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });

  const participant = await prisma.missionParticipant.findUnique({
    where: { id: participantId },
    include: { mission: { select: { rewardPoints: true } } },
  });
  if (!participant) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

  if (action === "APPROVE") {
    await prisma.missionParticipant.update({
      where: { id: participantId },
      data: { status: "APPROVED", adminNote: adminNote || null, approvedAt: new Date() },
    });
    // ให้แต้ม
    if (participant.mission.rewardPoints > 0) {
      await prisma.user.update({
        where: { id: participant.userId },
        data: { points: { increment: participant.mission.rewardPoints } },
      });
    }
    return NextResponse.json({ ok: true, action: "APPROVED" });
  } else if (action === "REJECT") {
    await prisma.missionParticipant.update({
      where: { id: participantId },
      data: { status: "REJECTED", adminNote: adminNote || null },
    });
    return NextResponse.json({ ok: true, action: "REJECTED" });
  }
  return NextResponse.json({ error: "action ไม่ถูกต้อง" }, { status: 400 });
}

// PATCH /api/admin/missions — toggle mission status ACTIVE <-> INACTIVE
export async function PATCH(req: NextRequest) {
  const session = await getCurrentUser();
  if (!adminGuard(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { missionId } = await req.json();
  if (!missionId) return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });

  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission) return NextResponse.json({ error: "ไม่พบภารกิจ" }, { status: 404 });

  const newStatus = mission.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  const updated = await prisma.mission.update({
    where: { id: missionId },
    data: { status: newStatus },
  });
  return NextResponse.json({ ok: true, status: updated.status });
}

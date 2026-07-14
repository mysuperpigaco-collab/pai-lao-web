import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ── ตั้งค่าลายน้ำหลายเลเยอร์ (traveler + business) ────────────
// GET = ดึงค่า + defaultText · PUT = validate/clamp ทุกเลเยอร์ก่อนเก็บ

const KINDS = ["text", "tiled", "badge", "image"];
const MAX_LAYERS = 12;
const clamp = (n: unknown, lo: number, hi: number, dflt: number) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : dflt;
};
const hex = (c: unknown) => (typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c)) ? c : "#ffffff";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const u = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { watermarkSettings: true, displayName: true, firstName: true, username: true },
  });
  return NextResponse.json({
    settings: u?.watermarkSettings ?? null,
    defaultText: u?.displayName || u?.firstName || u?.username || "",
  });
}

export async function PUT(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const b = (body?.settings ?? {}) as Record<string, unknown>;
  const rawLayers = Array.isArray(b.layers) ? b.layers : [];

  const layers = rawLayers.slice(0, MAX_LAYERS).map((r: any) => {
    const kind = KINDS.includes(r?.kind) ? r.kind : "text";
    const layer: any = {
      kind,
      x: clamp(r?.x, -30, 130, 50), // เผื่อทแยงเลื่อนทะลุขอบ
      y: clamp(r?.y, -30, 130, 50),
      rot: clamp(r?.rot, -180, 180, 0),
      size: clamp(r?.size, 1, 20, 4),
      color: hex(r?.color),
      opacity: clamp(r?.opacity, 0.05, 1, 0.8),
      bold: !!r?.bold, italic: !!r?.italic, outline: !!r?.outline, pill: !!r?.pill,
      gap: clamp(r?.gap, 0.6, 2.6, 1.3),
      reps: Math.round(clamp(r?.reps, 2, 10, 5)),
    };
    if (kind === "image") {
      // เฉพาะรูปใน Supabase storage ของเรา (กันฝัง URL ภายนอก)
      layer.imageUrl = (typeof r?.imageUrl === "string" && r.imageUrl.includes("/storage/v1/object/public/")) ? r.imageUrl : "";
    } else {
      layer.text = (typeof r?.text === "string" ? r.text : "").replace(/\s+/g, " ").trim().slice(0, 40);
    }
    return layer;
  }).filter((L: any) => L.kind === "image" ? L.imageUrl : true);

  const settings = { enabled: !!b.enabled && layers.length > 0, layers };

  await prisma.user.update({ where: { id: session.userId }, data: { watermarkSettings: settings } });
  return NextResponse.json({ ok: true, settings });
}

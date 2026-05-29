import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const DEFAULTS: Record<string, string> = {
  missionsEnabled:    "false",
  promotionsEnabled:  "false",
};

function adminGuard(s: Awaited<ReturnType<typeof getCurrentUser>>) {
  return s && (s.role === "ADMIN" || s.role === "SUPERADMIN");
}

// GET /api/admin/settings — admin only, returns all settings
export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!adminGuard(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.siteSetting.findMany();
  const settings: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) settings[r.key] = r.value;
  return NextResponse.json({ settings });
}

// PUT /api/admin/settings — upsert one or many keys
export async function PUT(req: NextRequest) {
  const session = await getCurrentUser();
  if (!adminGuard(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body: Record<string, string> = await req.json();
  for (const [key, value] of Object.entries(body)) {
    await prisma.siteSetting.upsert({
      where:  { key },
      create: { key, value },
      update: { value },
    });
  }
  return NextResponse.json({ ok: true });
}

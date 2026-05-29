import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULTS: Record<string, string> = {
  missionsEnabled:   "false",
  promotionsEnabled: "false",
};

export async function GET() {
  try {
    const rows = await prisma.siteSetting.findMany();
    const settings: Record<string, string> = { ...DEFAULTS };
    for (const r of rows) settings[r.key] = r.value;
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ settings: DEFAULTS });
  }
}

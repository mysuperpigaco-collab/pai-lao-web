import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { googleUrlToLatLng } from "@/lib/maps";

export async function POST(req: Request) {
  if (!(await getCurrentUser())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { url } = await req.json();
  if (!url) return NextResponse.json({ coord: null });
  return NextResponse.json({ coord: await googleUrlToLatLng(url) });
}

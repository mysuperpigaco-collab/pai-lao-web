import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const RADIUS_M = 50;
const SIM_THRESHOLD = 0.6; // แสดงถ้าชื่อคล้ายกัน >= 60%

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i || j)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function nameSimilarity(a: string, b: string): number {
  const clean = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");
  const ca = clean(a), cb = clean(b);
  if (ca === cb) return 1;
  if (ca.includes(cb) || cb.includes(ca)) return 0.92;
  const dist = levenshtein(ca, cb);
  return 1 - dist / Math.max(ca.length, cb.length);
}

// GET /api/admin/nearby-places?placeId=xxx
export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN"))
      return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get("placeId");
    if (!placeId) return NextResponse.json({ message: "ต้องระบุ placeId" }, { status: 400 });

    const target = await prisma.place.findUnique({
      where: { id: placeId },
      select: { id: true, title: true, lat: true, lng: true, province: true, district: true },
    });
    if (!target) return NextResponse.json({ nearby: [] });
    if (!target.lat || !target.lng) return NextResponse.json({ nearby: [], noCoords: true });

    // bounding box ±0.0005° ≈ ±55m เพื่อลด records ที่ต้องตรวจ
    const δ = 0.0005;
    const candidates = await prisma.place.findMany({
      where: {
        id: { not: placeId },
        approvalStatus: "APPROVED",
        lat: { gte: target.lat - δ, lte: target.lat + δ },
        lng: { gte: target.lng - δ, lte: target.lng + δ },
      },
      select: {
        id: true, slug: true, title: true, titleEn: true,
        coverUrl: true, province: true, district: true, category: true,
        lat: true, lng: true, googleMapsUrl: true,
        _count: { select: { reviews: true, bookmarks: true } },
      },
    });

    const nearby = candidates
      .map(p => {
        const dist = haversine(target.lat!, target.lng!, p.lat!, p.lng!);
        const sim  = nameSimilarity(target.title, p.title);
        return { ...p, distanceM: Math.round(dist), similarity: Math.round(sim * 100) };
      })
      .filter(p => p.distanceM <= RADIUS_M && p.similarity >= SIM_THRESHOLD * 100)
      .sort((a, b) => a.distanceM - b.distanceM);

    return NextResponse.json({ nearby, targetTitle: target.title });
  } catch (err) {
    console.error("GET /api/admin/nearby-places:", err);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

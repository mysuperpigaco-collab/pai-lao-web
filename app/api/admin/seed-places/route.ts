import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import placesData from "@/data/places_seed.json";

// ─────────────────────────────────────────────────────────────────
//  POST /api/admin/seed-places
//  Insert 2190 places from places_seed.json via Prisma createMany
//  Header required: x-seed-secret: <ADMIN_SEED_SECRET>
// ─────────────────────────────────────────────────────────────────

const SEED_SECRET = process.env.ADMIN_SEED_SECRET || "";

export async function POST(request: Request) {
  if (!SEED_SECRET || SEED_SECRET.length < 8) {
    return NextResponse.json({ message: "ไม่ได้ตั้ง ADMIN_SEED_SECRET" }, { status: 503 });
  }
  const secret = request.headers.get("x-seed-secret");
  if (secret !== SEED_SECRET) {
    return NextResponse.json({ message: "Secret ไม่ถูกต้อง" }, { status: 401 });
  }

  try {
    // Insert in batches of 200 to avoid Prisma timeout
    const BATCH = 200;
    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < placesData.length; i += BATCH) {
      const batch = placesData.slice(i, i + BATCH).map((p: any) => ({
        id:             p.id,
        slug:           p.slug,
        title:          p.title,
        province:       p.province,
        district:       p.district,
        address:        p.address       || null,
        description:    p.description   || null,
        openHours:      p.openHours     || null,
        phone:          p.phone         || null,
        category:       p.category      as any,
        coverUrl:       p.coverUrl,
        gallery:        [],
        tags:           [],
        approvalStatus: "APPROVED"      as any,
        isVerified:     false,
        shareCount:     0,
        viewCount:      0,
      }));

      const result = await prisma.place.createMany({
        data: batch,
        skipDuplicates: true,
      });

      inserted += result.count;
      skipped  += BATCH - result.count;
    }

    return NextResponse.json({
      message: "✅ Seed places สำเร็จ",
      inserted,
      skipped,
      total: placesData.length,
    });
  } catch (err: any) {
    console.error("seed-places error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

/**
 * ทดสอบ autoPlaceReviews สำหรับสถานที่ที่ระบุ
 * Usage: npx tsx scripts/test-auto-review.ts <place-slug>
 * ถ้าไม่ใส่ slug จะดึงทุก timeline stop ที่มี shareToPlace=true และยังไม่มี review
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes("--execute");
const slugArg = process.argv.slice(2).find(a => a !== "--execute");
const slug = slugArg ?? null;

async function main() {
  // หาสถานที่
  const place = slug
    ? await prisma.place.findUnique({ where: { slug }, select: { id: true, title: true } })
    : null;

  if (slug && !place) { console.error("ไม่พบสถานที่ slug:", slug); process.exit(1); }

  const where: any = {
    shareToPlace: true,
    placeId: { not: null },
    description: { not: "" },
    ...(place ? { placeId: place.id } : {}),
  };

  const stops = await prisma.timelineStop.findMany({
    where,
    select: {
      id: true,
      placeId: true,
      description: true,
      trip: { select: { id: true, title: true, authorId: true, author: { select: { username: true } } } },
      place: { select: { title: true } },
    },
  });

  console.log(`\nพบ ${stops.length} stop(s) ที่มี shareToPlace=true\n`);

  let created = 0, skipped = 0;
  for (const stop of stops) {
    const existing = await prisma.review.findFirst({
      where: { authorId: stop.trip.authorId, placeId: stop.placeId! },
      select: { id: true, text: true },
    });
    if (existing) {
      console.log(`[SKIP] "${stop.place?.title}" — มี review อยู่แล้ว: "${existing.text?.slice(0, 40)}..."`);
      skipped++;
    } else {
      console.log(`[${DRY_RUN ? "DRY" : "CREATE"}] "${stop.place?.title}" by @${stop.trip.author.username}`);
      console.log(`  ข้อความ: "${stop.description.slice(0, 80)}"`);
      if (!DRY_RUN) {
        await prisma.review.create({
          data: {
            authorId: stop.trip.authorId,
            placeId:  stop.placeId!,
            tripId:   stop.trip.id,
            rating:   5,
            text:     stop.description.trim(),
          },
        });
        console.log("  → สร้าง review แล้ว ✅");
      }
      created++;
    }
  }

  console.log(`\nสรุป: สร้าง=${created} skip=${skipped}`);
  if (DRY_RUN && created > 0) console.log("ใช้ --execute เพื่อสร้างจริง");
}

main().catch(console.error).finally(() => prisma.$disconnect());

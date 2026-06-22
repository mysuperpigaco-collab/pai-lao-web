// One-off cleanup: ตัด tripId ออกจากรีวิวที่เป็น autoPlaceReview เก่า
// (รีวิวที่มีทั้ง placeId และ tripId = รีวิว timeline ที่หลุดไปโผล่ในคอมเมนต์ทริป)
// รันครั้งเดียว:  node scripts/fix-timeline-reviews.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const leaked = await prisma.review.findMany({
    where: { placeId: { not: null }, tripId: { not: null } },
    select: { id: true, placeId: true, tripId: true },
  });
  console.log(`พบรีวิวที่ผูกทั้ง place+trip: ${leaked.length} รายการ`);

  if (leaked.length === 0) {
    console.log("ไม่มีอะไรต้องแก้ ✅");
    return;
  }

  const res = await prisma.review.updateMany({
    where: { placeId: { not: null }, tripId: { not: null } },
    data: { tripId: null },
  });
  console.log(`ตัด tripId ออกแล้ว ${res.count} รายการ — รีวิวยังอยู่ที่หน้าสถานที่เหมือนเดิม ✅`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

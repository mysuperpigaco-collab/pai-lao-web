import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Converting Place.category from enum to TEXT...");

  await prisma.$executeRaw`ALTER TABLE "Place" ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT`;
  console.log("✅ Column converted to TEXT");

  try {
    await prisma.$executeRaw`DROP TYPE IF EXISTS "PlaceCategory"`;
    console.log("✅ Enum type dropped");
  } catch (e: any) {
    console.log("ℹ️  Drop type:", e.message);
  }

  // Show any places with non-standard categories
  const places = await prisma.$queryRaw<{ id: string; title: string; category: string; slug: string }[]>`
    SELECT id, title, category, slug FROM "Place"
    WHERE category NOT IN ('NATURE','CAFE','ACCOMMODATION','CAMPING','FOOD','TEMPLE','BEACH','MARKET','ADVENTURE','MUSEUM')
    ORDER BY "createdAt" DESC
  `;

  if (places.length > 0) {
    console.log(`\n⚠️  Found ${places.length} place(s) with non-standard category:`);
    places.forEach(p => console.log(`  - [${p.category}] ${p.title} (${p.slug})`));
  } else {
    console.log("\n✅ All categories are standard.");
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

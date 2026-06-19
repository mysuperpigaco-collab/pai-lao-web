/**
 * scripts/run-sql.ts
 * รัน SQL file เข้า DB ผ่าน Prisma $executeRawUnsafe
 * Usage: npx tsx scripts/run-sql.ts <file.sql>
 */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

async function main() {
  const sqlFile = process.argv[2];
  if (!sqlFile) { console.error("Usage: npx tsx scripts/run-sql.ts <file.sql>"); process.exit(1); }

  const filePath = path.resolve(process.cwd(), sqlFile);
  if (!fs.existsSync(filePath)) { console.error(`ไม่พบไฟล์: ${filePath}`); process.exit(1); }

  const sql = fs.readFileSync(filePath, "utf-8");
  console.log(`📄 ไฟล์: ${filePath}`);
  console.log(`📏 ขนาด: ${sql.length} ตัวอักษร`);

  // ตรวจ DB target
  const dbUrl = process.env.DATABASE_URL ?? "";
  const host  = dbUrl.match(/@([^:/]+)/)?.[1] ?? "(unknown)";
  console.log(`🗄️  DB: ${host}`);

  if (!dbUrl.includes("supabase")) {
    console.error("❌ DATABASE_URL ไม่ใช่ Supabase — หยุด");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    // นับก่อน
    const before = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Place" WHERE slug LIKE 'lm-%'
    `;
    console.log(`\n📊 ก่อนรัน: Place slug LIKE 'lm-%' = ${before[0].count}`);

    // รัน SQL ใน transaction
    console.log("\n⏳ รัน SQL...");
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(sql);

      // ตรวจนับใน transaction เดียวกัน
      const rows = await tx.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM "Place" WHERE slug LIKE 'lm-%'
      `;
      const count = Number(rows[0].count);
      console.log(`✅ หลังรัน: Place slug LIKE 'lm-%' = ${count}`);

      if (count < 32) {
        throw new Error(`ได้ ${count} rows — คาด 32 → ROLLBACK`);
      }
      console.log("✅ ได้ครบ 32 rows → COMMIT");
    });

    // ยืนยันหลัง commit
    const after = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Place" WHERE slug LIKE 'lm-%'
    `;
    console.log(`\n🎉 สำเร็จ — DB มี lm- places: ${after[0].count}`);

  } catch (e) {
    console.error(`\n❌ ล้มเหลว (ROLLBACK): ${(e as Error).message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

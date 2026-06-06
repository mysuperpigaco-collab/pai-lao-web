/**
 * PAI-LAO Database Cleanup Tool
 * ─────────────────────────────
 * ขั้นตอน: count → backup JSON → confirm → delete
 *
 * วิธีรัน:
 *   npx tsx scripts/db-cleanup.ts
 *
 * ต้องมีไฟล์ .env ที่มี DATABASE_URL / DIRECT_URL
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import readline from "readline";

const prisma = new PrismaClient();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string): Promise<string> =>
  new Promise(resolve => rl.question(q, resolve));

async function main() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║   PAI-LAO Database Cleanup Tool          ║");
  console.log("╚══════════════════════════════════════════╝\n");

  // ─── STEP 1: COUNT ───────────────────────────────────────────
  console.log("📊 STEP 1 — นับจำนวน users แต่ละ role\n");

  const roleCounts = await prisma.user.groupBy({
    by: ["role"],
    _count: { id: true },
    orderBy: { role: "asc" },
  });

  let totalToDelete = 0;
  for (const r of roleCounts) {
    const marker = ["ADMIN", "SUPERADMIN"].includes(r.role) ? "✅ คงไว้" : "🗑️  จะลบ";
    console.log(`  ${marker}  ${r.role.padEnd(12)} : ${r._count.id} คน`);
    if (!["ADMIN", "SUPERADMIN"].includes(r.role)) totalToDelete += r._count.id;
  }

  console.log(`\n  รวมจะถูกลบ: ${totalToDelete} accounts\n`);

  if (totalToDelete === 0) {
    console.log("✅ ไม่มีข้อมูลที่ต้องลบ\n");
    rl.close();
    await prisma.$disconnect();
    return;
  }

  // ─── STEP 2: SUMMARY OF CONTENT ──────────────────────────────
  console.log("📋 STEP 2 — สรุปข้อมูลที่เชื่อมอยู่กับ users เหล่านั้น\n");

  const [tripCount, reviewCount, businessCount, planCount, missionPartCount] =
    await Promise.all([
      prisma.trip.count({ where: { author: { role: { in: ["TRAVELER", "BUSINESS"] } } } }),
      prisma.review.count({ where: { author: { role: { in: ["TRAVELER", "BUSINESS"] } } } }),
      prisma.business.count({ where: { user: { role: "BUSINESS" } } }),
      prisma.tripPlan.count({ where: { user: { role: { in: ["TRAVELER", "BUSINESS"] } } } }),
      prisma.missionParticipant.count({ where: { user: { role: { in: ["TRAVELER", "BUSINESS"] } } } }),
    ]);

  console.log(`  🗺️  Trips          : ${tripCount}`);
  console.log(`  ⭐  Reviews        : ${reviewCount}`);
  console.log(`  🏢  Businesses     : ${businessCount}`);
  console.log(`  📅  Trip Plans     : ${planCount}`);
  console.log(`  🎯  Mission Joins  : ${missionPartCount}`);
  console.log(`  (Bookmarks, Likes, Follows, Reports — cascade ลบอัตโนมัติ)\n`);

  // ─── STEP 3: BACKUP ──────────────────────────────────────────
  const answer1 = await ask("💾 STEP 3 — Export backup ก่อนลบ? (y/n): ");
  if (answer1.toLowerCase() === "y") {
    console.log("\n⏳ กำลัง export...");

    const users = await prisma.user.findMany({
      where: { role: { in: ["TRAVELER", "BUSINESS"] } },
      include: {
        trips: {
          include: { timeline: true },
        },
        reviews: true,
        business: {
          include: { places: true, promotions: true },
        },
        tripPlans: { include: { stops: true } },
        bookmarks: true,
        tripLikes: true,
        placeLikes: true,
        following: true,
        followers: true,
        reports: true,
        missionParticipations: true,
      },
    });

    const backupData = {
      exportedAt: new Date().toISOString(),
      totalUsers: users.length,
      users,
    };

    const filename = `pai-lao-backup-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.json`;
    const filepath = path.join(process.cwd(), filename);
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2), "utf-8");

    const sizeKB = Math.round(fs.statSync(filepath).size / 1024);
    console.log(`✅ Backup บันทึกที่: ${filename} (${sizeKB} KB)\n`);
  } else {
    console.log("⏭️  ข้ามขั้นตอน backup\n");
  }

  // ─── STEP 4: CONFIRM DELETE ───────────────────────────────────
  console.log("⚠️  STEP 4 — ยืนยันการลบ (ย้อนกลับไม่ได้)");
  console.log(`   จะลบ ${totalToDelete} users + ข้อมูลที่เชื่อมอยู่ทั้งหมด`);
  console.log(`   คงเหลือเฉพาะ ADMIN และ SUPERADMIN\n`);

  const answer2 = await ask('พิมพ์ "DELETE" เพื่อยืนยัน หรือ Enter เพื่อยกเลิก: ');

  if (answer2 !== "DELETE") {
    console.log("\n❌ ยกเลิก — ไม่มีข้อมูลถูกลบ\n");
    rl.close();
    await prisma.$disconnect();
    return;
  }

  // ─── STEP 5: DELETE ───────────────────────────────────────────
  console.log("\n⏳ กำลังลบข้อมูล...");

  const deleted = await prisma.user.deleteMany({
    where: { role: { in: ["TRAVELER", "BUSINESS"] } },
  });

  console.log(`\n✅ ลบสำเร็จ! ลบ ${deleted.count} users`);
  console.log("   (Trips, Reviews, Businesses, Bookmarks, Likes ถูกลบ cascade อัตโนมัติ)\n");

  // Verify remaining
  const remaining = await prisma.user.findMany({
    select: { id: true, username: true, email: true, role: true },
  });

  console.log(`📋 Users ที่เหลืออยู่ (${remaining.length} คน):`);
  for (const u of remaining) {
    console.log(`   ${u.role.padEnd(12)} | ${u.username.padEnd(20)} | ${u.email}`);
  }
  console.log();

  rl.close();
  await prisma.$disconnect();
}

main().catch(async e => {
  console.error("❌ Error:", e);
  rl.close();
  await prisma.$disconnect();
  process.exit(1);
});

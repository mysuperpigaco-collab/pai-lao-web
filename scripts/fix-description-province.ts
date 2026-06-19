/**
 * fix-description-province.ts
 * ─────────────────────────────────────────────────────────────
 * แก้ description อัตโนมัติที่อ้าง "ชื่อจังหวัดผิด"
 * (เพราะ refill แก้ field province/district ให้ถูกแล้ว แต่ข้อความ description ยังค้างจังหวัดเก่า)
 *
 * แตะเฉพาะ description ที่เป็น template ที่ระบบสร้าง:
 *   "{title} ตั้งอยู่ใน{X} เป็นสถานที่ที่น่าสนใจ"
 * (description จริงจาก OSM จะไม่ลงท้ายด้วยวลีนี้ → ไม่ถูกแตะ)
 *
 * Usage:
 *   npx tsx scripts/fix-description-province.ts            # dry-run (ดูจำนวน + ตัวอย่าง)
 *   npx tsx scripts/fix-description-province.ts --apply    # เขียนจริง
 *   (ถ้าหา DATABASE_URL ไม่เจอ:  npx tsx --env-file=.env scripts/fix-description-province.ts)
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SUFFIX = "เป็นสถานที่ที่น่าสนใจ"; // ลายเซ็นของ template ที่ระบบสร้าง

async function main() {
  const apply = process.argv.includes("--apply");

  const places = await prisma.place.findMany({
    where: { description: { contains: SUFFIX } },
    select: { id: true, title: true, province: true, district: true, description: true },
  });
  console.log(`พบ description แบบ template ระบบ: ${places.length}`);

  // สร้างข้อความที่ถูกต้องจากจังหวัด+อำเภอปัจจุบัน (ยึด address เป็นหลัก)
  const fixes: { id: string; from: string; to: string }[] = [];
  for (const p of places) {
    const loc = (p.district && p.district !== p.province)
      ? `อำเภอ${p.district} จังหวัด${p.province}`
      : `จังหวัด${p.province}`;
    const want = `${p.title} ตั้งอยู่ที่${loc} เป็นสถานที่ที่น่าสนใจ`;
    if (p.description !== want) fixes.push({ id: p.id, from: p.description!, to: want });
  }
  console.log(`ต้องแก้ (ข้อความไม่ตรงจังหวัด/อำเภอปัจจุบัน): ${fixes.length}\n`);
  fixes.slice(0, 10).forEach(f => console.log(`  • ${f.from}\n      → ${f.to}\n`));

  if (!apply) {
    console.log(`💡 ตรวจแล้วโอเค → รันใหม่ด้วย --apply เพื่อเขียนจริง`);
    await prisma.$disconnect();
    return;
  }

  let n = 0;
  const CHUNK = 50;
  for (let i = 0; i < fixes.length; i += CHUNK) {
    const batch = fixes.slice(i, i + CHUNK);
    await Promise.all(batch.map(f =>
      prisma.place.update({ where: { id: f.id }, data: { description: f.to } })
    ));
    n += batch.length;
    process.stdout.write(`\r  อัปเดต ${n}/${fixes.length}`);
  }
  console.log(`\n✅ แก้ description แล้ว ${n} รายการ`);
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });

/**
 * วินิจฉัยว่าสถานที่ (เช่น "บ้านเคหะ") ถูกสร้าง/อนุมัติหรือยัง และทำไมไม่โผล่ใน /place
 *
 * Usage:
 *   npx tsx scripts/diagnose-place.ts                 # ค่าเริ่มต้นค้นหา "บ้านเคหะ"
 *   npx tsx scripts/diagnose-place.ts "ชื่อสถานที่"   # ค้นหาชื่ออื่น
 *
 * อ่านอย่างเดียว ไม่แก้ข้อมูล
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const nameArg = process.argv.slice(2).find(a => !a.startsWith("--")) ?? "บ้านเคหะ";

async function main() {
  console.log(`\n=== วินิจฉัยสถานที่: "${nameArg}" ===\n`);

  // 1) Place ที่ชื่อใกล้เคียง (ทุกสถานะ)
  const places = await prisma.place.findMany({
    where: { title: { contains: nameArg, mode: "insensitive" } },
    select: {
      id: true, slug: true, title: true, province: true, district: true,
      approvalStatus: true, businessId: true, category: true,
      coverUrl: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`--- Place ที่ตรงชื่อ (${places.length}) ---`);
  if (places.length === 0) {
    console.log("  ❌ ไม่พบ Place ชื่อนี้เลย → แปลว่าตอนเซฟทริป 'ไม่ได้สร้างสถานที่' (resolveNewPlaces ไม่ทำงาน/ไม่ติ๊กสร้าง)");
  }
  for (const p of places) {
    const inListing = p.approvalStatus === "APPROVED";
    const inAdminTab = p.approvalStatus === "PENDING" || p.approvalStatus === "REJECTED";
    console.log(`  • "${p.title}" [${p.province}/${p.district}]`);
    console.log(`    id=${p.id} slug=${p.slug}`);
    console.log(`    approvalStatus=${p.approvalStatus} · businessId=${p.businessId ?? "null(ไม่มีเจ้าของ)"} · category=${p.category}`);
    console.log(`    → โชว์ในหน้า /place ? ${inListing ? "✅ ใช่" : "❌ ไม่ (ต้อง APPROVED)"}`);
    console.log(`    → โผล่ในแท็บ 'สถานที่รอตรวจ' ? ${inAdminTab ? "✅ ใช่" : "❌ ไม่"}`);
    console.log("");
  }

  // 2) Timeline stop ที่ชื่อสถานที่นี้ — ดูว่าผูก placeId ไหม + ทริปอนุมัติยัง
  const stops = await prisma.timelineStop.findMany({
    where: { placeName: { contains: nameArg, mode: "insensitive" } },
    select: {
      id: true, placeName: true, placeId: true, province: true,
      trip: { select: { slug: true, title: true, approvalStatus: true, isPublished: true } },
      place: { select: { approvalStatus: true, slug: true } },
    },
  });

  console.log(`--- Timeline stop ที่ชื่อ "${nameArg}" (${stops.length}) ---`);
  for (const s of stops) {
    console.log(`  • stop ในทริป "${s.trip?.title}" (${s.trip?.approvalStatus}${s.trip?.isPublished ? "+pub" : ""})`);
    console.log(`    placeName="${s.placeName}" · placeId=${s.placeId ?? "null (ยังไม่ผูกสถานที่!)"}`);
    if (s.place) console.log(`    place ที่ผูก: approvalStatus=${s.place.approvalStatus} slug=${s.place.slug}`);
    console.log("");
  }

  // 3) สรุปวินิจฉัย
  console.log("=== สรุป ===");
  if (places.length === 0) {
    console.log("สถานที่ไม่ถูกสร้าง → ตอนสร้าง/แก้ทริปต้องกด '+ สร้างเป็นสถานที่' ที่จุดแวะ แล้วค่อยบันทึก");
  } else if (places.every(p => p.approvalStatus === "APPROVED")) {
    console.log("สถานที่ APPROVED แล้ว → ควรโชว์ใน /place (ลองล้างแคช/รีเฟรช หรือเช็กตัวกรองหมวด/จังหวัด)");
  } else {
    console.log("สถานที่ยังเป็น PENDING/REJECTED → ไปอนุมัติที่ Admin → แท็บ 'สถานที่รอตรวจ' (/admin/places เลือกตัวกรอง 'รอตรวจ')");
    console.log("ถ้าแท็บนั้นยังว่าง อาจเป็นบั๊กตัวกรองหน้า admin — แจ้งผมพร้อมผลสคริปต์นี้");
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

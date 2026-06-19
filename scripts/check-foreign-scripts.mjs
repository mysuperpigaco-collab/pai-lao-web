import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function stripScripts(t) {
  t = t.replace(/[຀-໿]/g, "");   // ลาว
  t = t.replace(/[က-႟]/g, "");   // พม่า
  t = t.replace(/[ក-៿]/g, "");   // เขมร
  t = t.replace(/[Ѐ-ӿ]/g, "");   // ซีริลลิก
  t = t.replace(/[぀-ヿ]/g, "");  // ญี่ปุ่น
  t = t.replace(/[一-鿿]/g, "");  // จีน CJK
  t = t.replace(/[가-힯]/g, "");  // เกาหลี
  // strip zero-width spaces that may remain
  t = t.replace(/[​‌‍﻿]/g, "");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

const places = await prisma.place.findMany({
  select: { id: true, title: true, province: true, district: true, lat: true, lng: true },
});

const toUpdate = [];
const toDelete = [];

for (const p of places) {
  const cleaned = stripScripts(p.title);
  if (cleaned === p.title) continue;

  if (cleaned.length < 2) {
    toDelete.push({ ...p, cleaned });
  } else {
    toUpdate.push({ ...p, cleaned });
  }
}

console.log(`\n${"=".repeat(70)}`);
console.log(`จะอัปเดต ${toUpdate.length} รายการ — ตัดอักษรต่างชาติออก`);
console.log("=".repeat(70));
console.log(`${"#".padEnd(4)} ${"จังหวัด".padEnd(18)} ${"อำเภอ".padEnd(20)} ${"coords".padEnd(8)} ชื่อเดิม → ชื่อใหม่`);
console.log("-".repeat(120));

toUpdate.forEach((p, i) => {
  const hasProv = p.province ? "✓" : "✗";
  const hasDist = p.district ? "✓" : "✗";
  const hasCoords = (p.lat != null && p.lng != null) ? "✓" : "✗";
  const prov = (p.province || "(ว่าง)").padEnd(18);
  const dist = (p.district || "(ว่าง)").padEnd(20);
  const coordStr = `${hasProv}ปจ ${hasDist}อ ${hasCoords}좌`;
  console.log(`${String(i + 1).padEnd(4)} ${prov} ${dist} ${hasCoords}coords  "${p.title}" → "${p.cleaned}"`);
});

console.log(`\n${"=".repeat(70)}`);
console.log(`จะลบ ${toDelete.length} รายการ — title ว่างหลังตัดอักษร`);
console.log("=".repeat(70));
console.log(`${"#".padEnd(4)} ${"จังหวัด".padEnd(18)} ${"อำเภอ".padEnd(20)} ${"coords".padEnd(8)} ชื่อเดิม`);
console.log("-".repeat(100));

toDelete.forEach((p, i) => {
  const hasProv = p.province ? "✓" : "✗";
  const hasDist = p.district ? "✓" : "✗";
  const hasCoords = (p.lat != null && p.lng != null) ? "✓" : "✗";
  const prov = (p.province || "(ว่าง)").padEnd(18);
  const dist = (p.district || "(ว่าง)").padEnd(20);
  console.log(`${String(i + 1).padEnd(4)} ${prov} ${dist} ${hasCoords}coords  ${p.id}  "${p.title}"`);
});

// Summary stats
const updateMissingProv = toUpdate.filter(p => !p.province).length;
const updateMissingDist = toUpdate.filter(p => !p.district).length;
const updateMissingCoords = toUpdate.filter(p => p.lat == null || p.lng == null).length;
const deleteMissingProv = toDelete.filter(p => !p.province).length;
const deleteMissingDist = toDelete.filter(p => !p.district).length;

console.log(`\n${"=".repeat(70)}`);
console.log("สรุป UPDATE:");
console.log(`  ขาด province: ${updateMissingProv}`);
console.log(`  ขาด district: ${updateMissingDist}`);
console.log(`  ขาด lat/lng:  ${updateMissingCoords}`);
console.log("\nสรุป DELETE:");
console.log(`  ขาด province: ${deleteMissingProv}`);
console.log(`  ขาด district: ${deleteMissingDist}`);

await prisma.$disconnect();

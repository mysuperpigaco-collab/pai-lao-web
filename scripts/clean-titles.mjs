import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function cleanTitle(raw) {
  let t = raw;

  // 1. strip zero-width / invisible chars
  t = t.replace(/[​‌‍﻿­\u200E\u200F]/g, "");

  // 2. normalize curly quotes / dashes
  t = t.replace(/[‘’ʼ＇]/g, "'");
  t = t.replace(/[“”]/g, '"');
  t = t.replace(/[–—―]/g, "-");

  // 3. strip unwanted scripts
  t = t.replace(/[က-႟ႚ-ႝ]/g, "");  // Burmese
  t = t.replace(/[ក-៿᧠-᧿]/g, ""); // Khmer
  t = t.replace(/[Ѐ-ӿ]/g, "");               // Cyrillic (Russian etc.)
  t = t.replace(/[一-鿿㐀-䶿豈-﫿 0-⩭F]/g, ""); // CJK / Chinese
  t = t.replace(/[぀-ヿㇰ-ㇿ]/g, "");  // Hiragana / Katakana / Japanese ext
  t = t.replace(/[　-〿]/g, "");               // CJK symbols/punct

  // 4. collapse spaces & trim
  t = t.replace(/\s+/g, " ").trim();

  return t;
}

const places = await prisma.place.findMany({
  select: { id: true, title: true },
});

const toUpdate = [];
const toDelete = [];

for (const p of places) {
  const cleaned = cleanTitle(p.title);
  if (cleaned === p.title) continue; // no change

  if (cleaned.length < 2) {
    toDelete.push({ id: p.id, original: p.title });
  } else {
    toUpdate.push({ id: p.id, original: p.title, cleaned });
  }
}

console.log("=== จะอัปเดต", toUpdate.length, "รายการ ===");
toUpdate.forEach(r => console.log(" ", JSON.stringify(r.original), "→", JSON.stringify(r.cleaned)));

console.log("\n=== จะลบ (title ว่างหลังล้าง)", toDelete.length, "รายการ ===");
toDelete.forEach(r => console.log(" ", r.id, "|", JSON.stringify(r.original)));

// ── Execute ──────────────────────────────────────────────────────────
console.log("\nกำลังดำเนินการ...");

for (const r of toUpdate) {
  await prisma.place.update({ where: { id: r.id }, data: { title: r.cleaned } });
  console.log(" ✓ อัปเดต:", JSON.stringify(r.cleaned));
}

for (const r of toDelete) {
  await prisma.place.delete({ where: { id: r.id } });
  console.log(" 🗑 ลบ:", r.id, JSON.stringify(r.original));
}

console.log("\nเสร็จสิ้น — อัปเดต", toUpdate.length, "| ลบ", toDelete.length);
await prisma.$disconnect();

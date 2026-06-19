import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const places = await prisma.place.findMany({ select: { id: true, title: true, province: true } });

const lao    = places.filter(p => /[຀-໿]/.test(p.title));
const accent = places.filter(p => /[À-ÿ]/.test(p.title) && !/[຀-໿]/.test(p.title));
const zwsp   = places.filter(p => /[​‌‍﻿ ]/.test(p.title));
// other = ไม่ใช่ ASCII+ไทย+ลาว+latin-extended
const other  = places.filter(p =>
  [...p.title].some(c => {
    const cp = c.codePointAt(0);
    return cp > 0x7E && !(cp >= 0x0E00 && cp <= 0x0E7F) && !(cp >= 0x0E80 && cp <= 0x0EFF) && !(cp >= 0x00C0 && cp <= 0x024F) && cp !== 0x200B && cp !== 0x00A0;
  })
);

console.log("=== ลาว", lao.length, "รายการ ===");
lao.slice(0, 8).forEach(p => console.log(" ", p.title, "|", p.province));
if (lao.length > 8) console.log("  ...อีก", lao.length - 8);

console.log("\n=== accent/Latin-ext (Café ฯลฯ)", accent.length, "รายการ ===");
const uniq = [...new Map(accent.map(p => [p.title, p])).values()];
uniq.slice(0, 10).forEach(p => console.log(" ", p.title, "|", p.province));
if (uniq.length > 10) console.log("  ...อีก", uniq.length - 10);

console.log("\n=== zero-width / nbsp", zwsp.length, "รายการ ===");
zwsp.forEach(p => console.log(" ", JSON.stringify(p.title), "|", p.province));

console.log("\n=== อักขระนอกเหนือทั้งหมด (น่าสงสัยมากที่สุด)", other.length, "รายการ ===");
other.slice(0, 20).forEach(p => {
  const chars = [...new Set([...p.title].filter(c => {
    const cp = c.codePointAt(0);
    return cp > 0x7E && !(cp >= 0x0E00 && cp <= 0x0E7F) && !(cp >= 0x0E80 && cp <= 0x0EFF) && !(cp >= 0x00C0 && cp <= 0x024F);
  }))];
  console.log(" ", p.title, "| จังหวัด:", p.province, "| chars:", chars.join(""), "| id:", p.id);
});

await prisma.$disconnect();

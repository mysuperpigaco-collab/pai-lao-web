// สร้างไอคอน PWA — ค่าเริ่มต้นใช้โลโก้ทางการ public/icons/icon.svg (แบบ F หนังสือเดินทาง)
// วิธีใช้ (PowerShell):
//   node scripts/generate-pwa-icons.mjs            ← ใช้ icon.svg
//   node scripts/generate-pwa-icons.mjs logo.png   ← หรือระบุไฟล์อื่น (จัตุรัส ≥512px)
// ได้ไฟล์: public/icons/icon-192.png, icon-512.png, icon-maskable-512.png (มีขอบกันโดนครอปมุมกลม)
import sharp from "sharp";
import { mkdirSync } from "fs";

const src = process.argv[2] || "public/icons/icon.svg";

mkdirSync("public/icons", { recursive: true });

await sharp(src, { density: 300 }).resize(192, 192).png().toFile("public/icons/icon-192.png");
await sharp(src, { density: 300 }).resize(512, 512).png().toFile("public/icons/icon-512.png");
// maskable: icon.svg พื้นเต็มขอบ + เนื้อหาหลักอยู่ใน safe zone กลาง 80% แล้ว → ใช้ full-bleed ตรง ๆ
// (Android ครอปวงกลม/มุมมนได้โดยหนังสือไม่โดนตัด)
await sharp(src, { density: 300 }).resize(512, 512).png().toFile("public/icons/icon-maskable-512.png");

console.log("สร้างไอคอนเสร็จ: public/icons/icon-192.png, icon-512.png, icon-maskable-512.png");

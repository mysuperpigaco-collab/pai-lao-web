// สร้างไอคอน PWA จากไฟล์โลโก้ (ต้องเป็นรูปจัตุรัส ≥512px จะคมสุด)
// วิธีใช้ (PowerShell):
//   node scripts/generate-pwa-icons.mjs path\to\logo.png
// ได้ไฟล์: public/icons/icon-192.png, icon-512.png, icon-maskable-512.png (มีขอบกันโดนครอปมุมกลม)
import sharp from "sharp";
import { mkdirSync } from "fs";

const src = process.argv[2];
if (!src) {
  console.error("ระบุไฟล์โลโก้: node scripts/generate-pwa-icons.mjs <logo.png>");
  process.exit(1);
}

mkdirSync("public/icons", { recursive: true });

await sharp(src).resize(192, 192).png().toFile("public/icons/icon-192.png");
await sharp(src).resize(512, 512).png().toFile("public/icons/icon-512.png");
// maskable: ย่อโลโก้เหลือ 80% วางกลางพื้นสีแบรนด์ (Android ครอปเป็นวงกลม/มุมมนได้ไม่โดนตัด)
const inner = await sharp(src).resize(410, 410).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: "#10b981" } })
  .composite([{ input: inner, gravity: "center" }])
  .png().toFile("public/icons/icon-maskable-512.png");

console.log("สร้างไอคอนเสร็จ: public/icons/icon-192.png, icon-512.png, icon-maskable-512.png");

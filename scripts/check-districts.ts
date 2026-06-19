/**
 * check-districts.ts — นับคุณภาพ "อำเภอ" ในไฟล์ seed-data/*.json ก่อน import
 *   • dist==prov         = อำเภอยังเป็นชื่อจังหวัดตัวเอง (placeholder ที่ revgeo แก้ไม่ได้)
 *   • dist=otherProvName = อำเภอเป็น "ชื่อจังหวัดอื่น" (น่าจะผิด)
 *   • ok                 = อำเภอเป็นชื่ออำเภอจริง
 * Usage: npx tsx scripts/check-districts.ts
 */
import fs from "fs";
import path from "path";

const PROVS = new Set(
  ("เชียงใหม่ เชียงราย แม่ฮ่องสอน น่าน พะเยา ลำปาง ลำพูน แพร่ อุตรดิตถ์ ตาก สุโขทัย พิษณุโลก กำแพงเพชร พิจิตร เพชรบูรณ์ " +
   "กรุงเทพมหานคร นนทบุรี ปทุมธานี นครปฐม สมุทรสาคร สมุทรสงคราม สมุทรปราการ อ่างทอง สิงห์บุรี ชัยนาท สระบุรี นครสวรรค์ ลพบุรี พระนครศรีอยุธยา อุทัยธานี " +
   "ชลบุรี ระยอง จันทบุรี ตราด ฉะเชิงเทรา ปราจีนบุรี สระแก้ว นครนายก " +
   "กาญจนบุรี ราชบุรี เพชรบุรี ประจวบคีรีขันธ์ สุพรรณบุรี " +
   "นครราชสีมา ขอนแก่น อุดรธานี หนองคาย หนองบัวลำภู บึงกาฬ สกลนคร นครพนม มุกดาหาร อุบลราชธานี ยโสธร ศรีสะเกษ สุรินทร์ บุรีรัมย์ ชัยภูมิ ร้อยเอ็ด มหาสารคาม กาฬสินธุ์ อำนาจเจริญ เลย " +
   "สุราษฎร์ธานี ภูเก็ต กระบี่ พังงา ระนอง ชุมพร นครศรีธรรมราช สงขลา สตูล ตรัง พัทลุง ยะลา ปัตตานี นราธิวาส").split(/\s+/)
);

const dir = path.join(__dirname, "seed-data");
const files = fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort();
let TOT = 0, EQ = 0, OTHER = 0;
console.log(`ไฟล์ | total | dist==prov | dist=ชื่อจว.อื่น | ok`);
for (const fn of files) {
  const arr = JSON.parse(fs.readFileSync(path.join(dir, fn), "utf-8"));
  let eq = 0, other = 0;
  for (const p of arr) {
    const prov = p.province, dist = p.district;
    if (dist === prov) eq++;
    else if (PROVS.has(dist)) other++;
  }
  const n = arr.length, ok = n - eq - other;
  TOT += n; EQ += eq; OTHER += other;
  console.log(`${fn.padEnd(16)} ${String(n).padStart(5)} | ${String(eq).padStart(5)} (${Math.round(eq*100/n)}%) | ${String(other).padStart(4)} | ${ok}`);
}
console.log(`\nรวม total=${TOT}  dist==prov=${EQ} (${Math.round(EQ*100/TOT)}%)  dist=ชื่อจว.อื่น=${OTHER} (${Math.round(OTHER*100/TOT)}%)`);
console.log(`อำเภอที่ดูถูกต้อง ≈ ${Math.round((TOT-EQ-OTHER)*100/TOT)}%`);

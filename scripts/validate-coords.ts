/**
 * validate-coords.ts — ตรวจสถานที่ใน DB ว่า lat/lng อยู่ในกรอบจังหวัดจริงไหม
 * ตัวที่หลุดกรอบ = พิกัดผิด (เช่น คาเฟ่กรุงเทพถูกติดป้ายกำแพงเพชร) → รายงาน/ลบ
 *
 * Usage:
 *   npx tsx scripts/validate-coords.ts              # รายงานอย่างเดียว (ไม่ลบ)
 *   npx tsx scripts/validate-coords.ts --delete     # ลบตัวที่หลุดกรอบ
 *   npx tsx scripts/validate-coords.ts --province เชียงใหม่   # เฉพาะจังหวัด
 *   (ถ้าหา DATABASE_URL ไม่เจอ ใช้:  npx tsx --env-file=.env scripts/validate-coords.ts)
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const M = 0.1; // margin องศา (~11 กม.) เผื่อขอบจังหวัด
// [latMin, latMax, lngMin, lngMax] โดยประมาณ (กว้างเผื่อไว้ — จับเฉพาะพิกัดผิดชัด ๆ)
const BBOX: Record<string, [number, number, number, number]> = {
  // เหนือ
  "เชียงใหม่":[17.3,20.3,97.8,99.6],"เชียงราย":[19.0,20.5,99.2,100.5],"แม่ฮ่องสอน":[17.4,19.9,97.3,98.8],
  "น่าน":[17.8,19.5,100.2,101.5],"พะเยา":[18.6,19.7,99.6,100.5],"ลำปาง":[17.2,19.5,98.9,100.0],
  "ลำพูน":[17.6,18.9,98.5,99.4],"แพร่":[17.5,18.9,99.5,100.6],"อุตรดิตถ์":[17.3,18.3,99.6,101.2],
  "ตาก":[15.5,17.9,97.9,99.6],"สุโขทัย":[16.6,17.85,99.2,100.3],"พิษณุโลก":[16.2,17.9,99.8,101.3],
  "กำแพงเพชร":[15.8,16.9,98.8,100.0],"พิจิตร":[15.9,16.7,100.0,100.8],"เพชรบูรณ์":[15.3,17.25,100.3,101.8],
  // กลาง
  "กรุงเทพมหานคร":[13.5,14.0,100.3,100.95],"นนทบุรี":[13.8,14.1,100.2,100.6],"ปทุมธานี":[13.85,14.2,100.4,100.95],
  "นครปฐม":[13.6,14.2,99.8,100.4],"สมุทรสาคร":[13.4,13.7,100.1,100.45],"สมุทรสงคราม":[13.2,13.5,99.8,100.1],
  "สมุทรปราการ":[13.4,13.7,100.5,100.9],"อ่างทอง":[14.4,14.8,100.2,100.6],"สิงห์บุรี":[14.7,15.1,100.2,100.6],
  "ชัยนาท":[14.9,15.4,99.8,100.4],"สระบุรี":[14.2,15.0,100.6,101.3],"นครสวรรค์":[15.2,16.3,99.0,100.7],
  "ลพบุรี":[14.6,15.6,100.3,101.4],"พระนครศรีอยุธยา":[14.1,14.6,100.2,100.9],"อุทัยธานี":[14.9,15.8,99.2,100.3],
  // ตะวันออก (ขยายเผื่อเกาะ: เสม็ด/ล้าน/ช้าง/กูด)
  "ชลบุรี":[12.4,13.6,100.7,101.6],"ระยอง":[12.3,13.1,101.0,102.0],"จันทบุรี":[12.1,13.2,101.5,102.6],
  "ตราด":[11.5,12.7,102.1,103.0],"ฉะเชิงเทรา":[13.0,14.05,100.85,102.15],"ปราจีนบุรี":[13.8,14.4,101.1,102.1],
  "สระแก้ว":[13.3,14.3,101.6,102.95],"นครนายก":[14.0,14.5,100.9,101.5],
  // ตะวันตก
  "กาญจนบุรี":[13.8,15.7,98.2,99.9],"ราชบุรี":[13.0,14.0,99.1,100.1],"เพชรบุรี":[12.4,13.4,99.2,100.2],
  "ประจวบคีรีขันธ์":[11.0,12.7,99.1,100.1],"สุพรรณบุรี":[13.9,15.2,99.2,100.4],
  // อีสาน
  "นครราชสีมา":[14.1,15.8,101.1,103.0],"ขอนแก่น":[15.7,17.1,101.7,103.3],"อุดรธานี":[16.9,18.2,102.1,103.4],
  "หนองคาย":[17.6,18.4,102.2,103.2],"หนองบัวลำภู":[16.9,17.6,101.9,102.7],"บึงกาฬ":[17.8,18.5,103.2,104.2],
  "สกลนคร":[16.7,17.9,103.3,104.5],"นครพนม":[16.7,18.0,104.0,104.9],"มุกดาหาร":[16.0,16.9,104.2,104.9],
  "อุบลราชธานี":[14.3,16.1,104.3,105.7],"ยโสธร":[15.4,16.3,104.0,104.7],"ศรีสะเกษ":[14.4,15.5,103.9,104.9],
  "สุรินทร์":[14.4,15.5,103.0,104.1],"บุรีรัมย์":[14.2,15.7,102.5,103.5],"ชัยภูมิ":[15.3,16.6,101.4,102.6],
  "ร้อยเอ็ด":[15.5,16.5,103.2,104.3],"มหาสารคาม":[15.6,16.7,102.7,103.5],"กาฬสินธุ์":[16.1,17.2,103.0,104.2],
  "อำนาจเจริญ":[15.5,16.3,104.3,105.1],"เลย":[16.8,18.1,100.7,102.3],
  // ใต้ (ขยายเผื่อเกาะ: สมุย/เต่า/พีพี/ลันตา/หลีเป๊ะ/ตะรุเตา/สิมิลัน)
  "สุราษฎร์ธานี":[8.2,10.3,98.3,100.1],"ภูเก็ต":[7.6,8.3,98.2,98.5],"กระบี่":[7.2,8.7,98.5,99.4],
  "พังงา":[7.7,9.6,97.4,98.8],"ระนอง":[9.2,11.0,98.3,99.0],"ชุมพร":[9.7,11.1,98.7,99.6],
  "นครศรีธรรมราช":[7.7,9.4,99.3,100.4],"สงขลา":[6.3,7.9,100.0,101.1],"สตูล":[6.3,7.2,99.0,100.3],
  "ตรัง":[6.8,8.1,99.0,100.0],"พัทลุง":[7.0,7.9,99.8,100.4],"ยะลา":[5.6,6.8,100.7,101.6],
  "ปัตตานี":[6.5,7.0,101.0,101.7],"นราธิวาส":[5.7,6.6,101.4,102.1],
};

function inBox(prov: string, lat: number, lng: number): boolean | null {
  const b = BBOX[prov];
  if (!b) return null; // ไม่มี bbox จังหวัดนี้ → ข้าม (ไม่ตัดสิน)
  return lat >= b[0]-M && lat <= b[1]+M && lng >= b[2]-M && lng <= b[3]+M;
}

// ขอบประเทศไทยแบบหลวม ๆ (เผื่อมาก จับเฉพาะที่อยู่นอกไทยชัด ๆ — ในลาว/พม่า/กัมพูชา/มาเลย์)
// ไทยจริง: lat 5.6–20.46, lng 97.34–105.64 → ใช้กรอบกว้างกว่านี้กันพลาด
const TH = { latMin: 5.0, latMax: 20.7, lngMin: 96.8, lngMax: 105.9 };
function outsideThailand(lat: number, lng: number): boolean {
  return lat < TH.latMin || lat > TH.latMax || lng < TH.lngMin || lng > TH.lngMax;
}

// 77 จังหวัดไทย (เท่ากับ key ของ BBOX)
const KNOWN77 = new Set(Object.keys(BBOX));
// ตัดวงเล็บอังกฤษ/ช่องว่างท้าย เช่น "เพชรบุรี (Phetchaburi)" → "เพชรบุรี"
function normProv(p: string): string {
  return (p || "").replace(/\s*\(.*?\)\s*$/, "").trim();
}

async function main() {
  const del = process.argv.includes("--delete");
  const pi = process.argv.indexOf("--province");
  const onlyProv = pi >= 0 ? process.argv[pi+1] : null;

  const where: any = { lat: { not: null }, lng: { not: null } };
  if (onlyProv) where.province = onlyProv;
  const places = await prisma.place.findMany({ where, select: { id:true, title:true, province:true, lat:true, lng:true } });
  console.log(`ตรวจ ${places.length} สถานที่ (ที่มีพิกัด)\n`);

  const bad: typeof places = [];           // ในไทยแต่หลุดกรอบจังหวัด
  const outside: typeof places = [];        // พิกัดหลุดขอบประเทศไทยชัด ๆ
  const foreignProv: typeof places = [];    // province ไม่ใช่ 1 ใน 77 จังหวัดไทย (ต่างประเทศ/เพี้ยน)
  for (const p of places) {
    const prov = normProv(p.province);
    if (!KNOWN77.has(prov)) { foreignProv.push(p); continue; }   // จังหวัดต่างประเทศ/ไม่รู้จัก
    if (outsideThailand(p.lat!, p.lng!)) { outside.push(p); continue; }
    const r = inBox(prov, p.lat!, p.lng!);
    if (r === false) bad.push(p);
  }

  // ── province ไม่ใช่จังหวัดไทย (ต่างประเทศ) ──
  const fpByProv: Record<string, number> = {};
  for (const p of foreignProv) fpByProv[p.province] = (fpByProv[p.province]||0)+1;
  console.log(`🌏 province ไม่ใช่ 77 จังหวัดไทย (ต่างประเทศ/เพี้ยน): ${foreignProv.length}`);
  Object.entries(fpByProv).sort((a,b)=>b[1]-a[1]).forEach(([prov,n]) => console.log(`   "${prov}": ${n}`));

  // ── พิกัดหลุดขอบประเทศไทย ──
  console.log(`\n🗺️  พิกัดหลุดขอบประเทศไทย: ${outside.length}`);
  outside.slice(0,10).forEach(p => console.log(`     • ${p.title} [${p.province}] (${p.lat!.toFixed(3)}, ${p.lng!.toFixed(3)})`));

  // ── ในไทยแต่หลุดกรอบจังหวัด ──
  const byProv: Record<string, number> = {};
  for (const p of bad) byProv[p.province] = (byProv[p.province]||0)+1;
  console.log(`\n📍 พิกัดหลุดกรอบจังหวัด (น่าจะผิดจังหวัด): ${bad.length}`);
  Object.entries(byProv).sort((a,b)=>b[1]-a[1]).forEach(([prov,n]) => console.log(`   ${prov}: ${n}`));
  bad.slice(0,10).forEach(p => console.log(`     • ${p.title} [${p.province}] (${p.lat!.toFixed(3)}, ${p.lng!.toFixed(3)})`));

  const toDelete = [...foreignProv, ...outside, ...bad];
  console.log(`\nรวมจะลบ: ต่างประเทศ ${foreignProv.length} + นอกขอบไทย ${outside.length} + หลุดกรอบจังหวัด ${bad.length} = ${toDelete.length}`);

  if (del && toDelete.length) {
    const ids = toDelete.map(p => p.id);
    const res = await prisma.place.deleteMany({ where: { id: { in: ids } } });
    console.log(`\n🗑️  ลบแล้ว: ${res.count} รายการ`);
  } else if (toDelete.length) {
    console.log(`\n💡 ตรวจรายการแล้วโอเค → รันใหม่ด้วย --delete เพื่อลบจริง`);
  }
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });

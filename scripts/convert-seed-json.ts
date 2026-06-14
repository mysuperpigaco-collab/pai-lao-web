/**
 * convert-seed-json.ts
 * ─────────────────────────────────────────────────────────────
 * แปลง data/places_seed.json (รูปแบบเก่า) → scripts/seed-data/{region}.json
 * ดึงพิกัดจาก address field ถ้ามี (เช่น "https://google.com14.212,100.415")
 *
 * Usage:
 *   npx tsx scripts/convert-seed-json.ts
 */

import fs   from "fs";
import path from "path";

const INPUT_FILE = path.join(process.cwd(), "data", "places_seed.json");
const OUT_DIR    = path.join(process.cwd(), "scripts", "seed-data");

// ── Province → region map ─────────────────────────────────────
const PROV_TO_REGION: Record<string, string> = {
  "เชียงใหม่": "north","เชียงราย": "north","แม่ฮ่องสอน": "north",
  "น่าน": "north","พะเยา": "north","ลำปาง": "north","ลำพูน": "north",
  "แพร่": "north","อุตรดิตถ์": "north","ตาก": "north",
  "สุโขทัย": "north","พิษณุโลก": "north","กำแพงเพชร": "north",
  "พิจิตร": "north","เพชรบูรณ์": "north",

  "กรุงเทพมหานคร": "central","นนทบุรี": "central","ปทุมธานี": "central",
  "นครปฐม": "central","สมุทรสาคร": "central","สมุทรสงคราม": "central",
  "สมุทรปราการ": "central","อ่างทอง": "central","สิงห์บุรี": "central",
  "ชัยนาท": "central","สระบุรี": "central","นครสวรรค์": "central",
  "ลพบุรี": "central","พระนครศรีอยุธยา": "central","อุทัยธานี": "central",

  "ชลบุรี": "east","ระยอง": "east","จันทบุรี": "east","ตราด": "east",
  "ฉะเชิงเทรา": "east","ปราจีนบุรี": "east","สระแก้ว": "east","นครนายก": "east",

  "กาญจนบุรี": "west","ราชบุรี": "west","เพชรบุรี": "west",
  "ประจวบคีรีขันธ์": "west","สุพรรณบุรี": "west",

  "นครราชสีมา": "northeast","ขอนแก่น": "northeast","อุดรธานี": "northeast",
  "หนองคาย": "northeast","หนองบัวลำภู": "northeast","บึงกาฬ": "northeast",
  "สกลนคร": "northeast","นครพนม": "northeast","มุกดาหาร": "northeast",
  "อุบลราชธานี": "northeast","ยโสธร": "northeast","ศรีสะเกษ": "northeast",
  "สุรินทร์": "northeast","บุรีรัมย์": "northeast","ชัยภูมิ": "northeast",
  "ร้อยเอ็ด": "northeast","มหาสารคาม": "northeast","กาฬสินธุ์": "northeast",
  "อำนาจเจริญ": "northeast","เลย": "northeast",

  "สุราษฎร์ธานี": "south","ภูเก็ต": "south","กระบี่": "south",
  "พังงา": "south","ระนอง": "south","ชุมพร": "south",
  "นครศรีธรรมราช": "south","สงขลา": "south","สตูล": "south",
  "ตรัง": "south","พัทลุง": "south","ยะลา": "south",
  "ปัตตานี": "south","นราธิวาส": "south",
};

// ── Helpers ───────────────────────────────────────────────────

function extractCoords(addr: string | undefined): { lat: number|null, lng: number|null } {
  if (!addr) return { lat: null, lng: null };
  // match patterns like: 14.2120,100.4150 or ?q=14.21,100.41
  const m = addr.match(/([0-9]{1,2}\.[0-9]+)\s*,\s*([0-9]{2,3}\.[0-9]+)/);
  if (m) {
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    // sanity: Thailand bbox ~5-21°N, 97-106°E
    if (lat >= 5 && lat <= 21 && lng >= 97 && lng <= 106) {
      return { lat, lng };
    }
  }
  return { lat: null, lng: null };
}

// ── Main ──────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ ไม่พบ ${INPUT_FILE}`);
    process.exit(1);
  }

  console.log(`📖 อ่าน ${INPUT_FILE}...`);
  const raw: any[] = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8"));
  console.log(`   ${raw.length} records`);

  const grouped: Record<string, any[]> = {};
  let skipped = 0, coordsFound = 0;

  for (const r of raw) {
    const region = PROV_TO_REGION[r.province];
    if (!region) { skipped++; continue; }

    const { lat, lng } = extractCoords(r.address);
    if (lat) coordsFound++;

    const place = {
      title:       r.title,
      titleEn:     r.titleEn || null,
      province:    r.province,
      district:    r.district || r.province,
      address:     (r.address && !r.address.startsWith("http")) ? r.address : null,
      googleMapsUrl: lat ? `https://www.google.com/maps?q=${lat},${lng}` : null,
      lat,
      lng,
      category:    r.category,
      tags:        r.tags || [],
      description: r.description || `${r.title} ตั้งอยู่ใน${r.province}`,
      openHours:   r.openHours  || null,
      closedDays:  r.closedDays || null,
      entryFee:    r.entryFee   || null,
      phone:       r.phone      || null,
      website:     r.website    || null,
      amenities:   r.amenities  || [],
      petPolicy:   r.petPolicy  || null,
      coverUrl:    r.coverUrl   || "",
    };

    grouped[region] = grouped[region] || [];
    grouped[region].push(place);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let total = 0;
  for (const [region, places] of Object.entries(grouped)) {
    const outFile = path.join(OUT_DIR, `${region}.json`);
    // merge with existing if file already exists
    let existing: any[] = [];
    if (fs.existsSync(outFile)) {
      existing = JSON.parse(fs.readFileSync(outFile, "utf-8"));
    }
    const merged = [...existing, ...places];
    fs.writeFileSync(outFile, JSON.stringify(merged, null, 2), "utf-8");
    console.log(`  ✅ ${region}.json — ${places.length} records (รวม: ${merged.length})`);
    total += places.length;
  }

  console.log(`\n📊 สรุป:`);
  console.log(`   แปลงสำเร็จ: ${total}`);
  console.log(`   มีพิกัด: ${coordsFound}`);
  console.log(`   ข้าม (ไม่รู้ภาค): ${skipped}`);
  console.log(`\n▶  รันต่อ: npm run seed:import all --dry-run`);
}

main();

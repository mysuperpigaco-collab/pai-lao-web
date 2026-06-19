# นำเข้าสถานที่จาก Excel/CSV → DB — pai-lao-web

> เทมเพลต: `docs/places-import-template.csv` (เปิดใน Excel ได้, Save As .xlsx ได้)
> Flow: กรอกข้อมูล + วางลิงก์ Google Maps → รัน importer → script ดึง lat/lng จากลิงก์ + สร้าง slug + เช็คซ้ำ + บันทึกลง DB

---

## ⚠️ เรื่อง "ดึงจาก Google" ต้องเข้าใจก่อน
- **ดึงข้อมูลสถานที่จาก Google เป็นชุดใหญ่อัตโนมัติไม่ได้** (scrape ผิด ToS, Places API เสียเงิน + ห้ามเก็บถาวร)
- วิธีที่ใช้จริง: คนกรอกข้อมูลที่รู้ + **วางลิงก์ Google Maps (share link) ของแต่ละที่** → importer ดึง `lat`/`lng` จากลิงก์ให้เอง (ใช้ `googleUrlToLatLng` จาก `lib/maps.ts`)
- ลิงก์เต็ม (`.../@lat,lng` หรือ `!3d!4d`) ดึงได้ทันที; ลิงก์สั้น `maps.app.goo.gl` script จะ resolve redirect ให้

---

## คอลัมน์ในเทมเพลต (ตรงกับ model `Place`)

| คอลัมน์ | จำเป็น? | หมายเหตุ |
|---|---|---|
| `title` | ✅ | ชื่อสถานที่ (ไทย) |
| `titleEn` | – | ชื่ออังกฤษ |
| `province` | ✅ | จังหวัด |
| `district` | ✅ | อำเภอ/เขต |
| `category` | ✅ | โค้ดหมวด (ดูด้านล่าง) |
| `googleMapsUrl` | แนะนำ | วางลิงก์ Google → ดึง lat/lng อัตโนมัติ |
| `lat`,`lng` | – | ใส่เองได้ ถ้าใส่จะใช้ค่านี้ก่อน (ไม่ต้องพึ่งลิงก์) |
| `address` | – | ที่อยู่ |
| `coverUrl` | ✅ | URL รูปปก (ต้องมี — schema บังคับ) |
| `gallery` | – | หลาย URL คั่นด้วย `|` |
| `description` | ✅ | คำอธิบาย |
| `descriptionShort` | – | คำอธิบายสั้น |
| `tags` | – | คั่นด้วย `|` |
| `openHours`,`closedDays`,`entryFee` | – | เวลาเปิด/วันหยุด/ค่าเข้า |
| `phone`,`website`,`lineId` | – | ติดต่อ |
| `amenities` | – | โค้ดสิ่งอำนวยความสะดวก คั่นด้วย `|` |
| `petPolicy` | – | `ALLOWED` / `NOT_ALLOWED` / `CONDITIONS` |
| `approvalStatus` | – | `APPROVED` (default สำหรับนำเข้าโดยแอดมิน) / `PENDING` / `REJECTED` |
| `slug` | – | เว้นว่าง = สร้างอัตโนมัติจาก title |

**โค้ด `category`:** ใช้ให้ตรงกับที่แอปใช้อยู่ — ตรวจจากฟอร์มสร้าง place หรือข้อมูลเดิมใน DB (เช่น `NATURE`, `CAFE`, `BEACH`, `STAY`, `FOOD`, `TEMPLE`, `ADVENTURE`, `MARKET`, `MUSEUM`, `CAMPING`)
**โค้ด `amenities`:** `PARKING`, `WIFI`, `RESTROOM`, `AIRCON`, `ACCESSIBLE`, `CREDIT_CARD`, `RESTAURANT`, `CAFE`, `CHARGING`, `ELEVATOR`, `POOL`, `PHOTO_SPOT`

> ⚠️ array (gallery/tags/amenities) ใช้ `|` คั่น **ไม่ใช่ comma** (กันชนกับ CSV)
> ลบ 2 แถวตัวอย่างในเทมเพลตออกก่อนใช้จริง

---

## Importer script — `scripts/import-places.ts`

ติดตั้ง CSV parser (เล็ก):
```bash
npm i -D csv-parse
```

```ts
// scripts/import-places.ts
import fs from "fs";
import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/prisma";              // ถ้า @/ ไม่ resolve ให้ใช้ relative
import { googleUrlToLatLng, googleMapsPoint } from "@/lib/maps";
import { haversine, nameSimilarity, DUP_RADIUS_M, DUP_SIM_THRESHOLD, DUP_BBOX } from "@/lib/geo";

const FILE = process.argv[2] || "docs/places-import-template.csv";
const DRY = process.argv.includes("--dry");        // ดูผลก่อน ไม่เขียนจริง

const arr = (s?: string) => (s?.trim() ? s.split("|").map(x => x.trim()).filter(Boolean) : []);
const slugify = (t: string) =>
  t.replace(/[^a-zA-Z0-9฀-๿]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "place";

async function uniqueSlug(base: string): Promise<string> {
  let s = base, i = 2;
  while (await prisma.place.findUnique({ where: { slug: s }, select: { id: true } })) s = `${base}-${i++}`;
  return s;
}

async function findDuplicate(lat: number, lng: number, title: string) {
  const δ = DUP_BBOX;
  const cands = await prisma.place.findMany({
    where: { lat: { gte: lat - δ, lte: lat + δ }, lng: { gte: lng - δ, lte: lng + δ } },
    select: { title: true, lat: true, lng: true, slug: true },
  });
  return cands.find(c =>
    haversine(lat, lng, c.lat!, c.lng!) <= DUP_RADIUS_M &&
    nameSimilarity(title, c.title) >= DUP_SIM_THRESHOLD);
}

async function main() {
  const rows: any[] = parse(fs.readFileSync(FILE), { columns: true, skip_empty_lines: true, bom: true, trim: true });
  let created = 0, skipped = 0, dup = 0;

  for (const [n, r] of rows.entries()) {
    const line = n + 2; // +header +1-index
    if (!r.title || !r.province || !r.district || !r.category || !r.coverUrl || !r.description) {
      console.warn(`บรรทัด ${line}: ข้ามเพราะข้อมูลจำเป็นไม่ครบ (title/province/district/category/coverUrl/description)`);
      skipped++; continue;
    }

    // lat/lng: ใช้ที่กรอกมาก่อน ไม่งั้นดึงจากลิงก์ Google
    let lat = r.lat ? Number(r.lat) : null;
    let lng = r.lng ? Number(r.lng) : null;
    if ((lat == null || Number.isNaN(lat) || lng == null || Number.isNaN(lng)) && r.googleMapsUrl) {
      const c = await googleUrlToLatLng(r.googleMapsUrl);
      if (c) { lat = c.lat; lng = c.lng; }
    }
    // มีพิกัดแต่ไม่มีลิงก์ → สร้างลิงก์จากพิกัด
    let googleMapsUrl = r.googleMapsUrl || (lat != null && lng != null ? googleMapsPoint(lat, lng) : null);

    // เช็คซ้ำ (ถ้ามีพิกัด)
    if (lat != null && lng != null) {
      const d = await findDuplicate(lat, lng, r.title);
      if (d) { console.warn(`บรรทัด ${line}: ⚠️ คล้าย "${d.title}" (/place/${d.slug}) — ข้าม`); dup++; continue; }
    }

    const slug = r.slug?.trim() ? await uniqueSlug(slugify(r.slug)) : await uniqueSlug(slugify(r.title));
    const data = {
      slug, title: r.title, titleEn: r.titleEn || null,
      province: r.province, district: r.district, address: r.address || null,
      googleMapsUrl, lat, lng,
      category: r.category, tags: arr(r.tags),
      coverUrl: r.coverUrl, gallery: arr(r.gallery),
      description: r.description, descriptionShort: r.descriptionShort || null,
      openHours: r.openHours || null, closedDays: r.closedDays || null, entryFee: r.entryFee || null,
      phone: r.phone || null, website: r.website || null, lineId: r.lineId || null,
      amenities: arr(r.amenities), petPolicy: r.petPolicy || null,
      approvalStatus: r.approvalStatus || "APPROVED",
    };

    if (DRY) { console.log(`บรรทัด ${line}: (dry) จะสร้าง ${data.title} [${slug}] lat=${lat} lng=${lng}`); created++; continue; }
    await prisma.place.create({ data });
    created++;
  }

  console.log(`\nเสร็จ: สร้าง ${created}, ข้าม(ไม่ครบ) ${skipped}, ข้าม(ซ้ำ) ${dup}, รวม ${rows.length} แถว`);
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
```

## วิธีรัน
```bash
# 1) ดูผลก่อน (ไม่เขียน DB)
npx tsx scripts/import-places.ts docs/places-import-template.csv --dry

# 2) นำเข้าจริง
npx tsx scripts/import-places.ts docs/places-import-template.csv
```
> 🛠️ ถ้า `@/` alias ไม่ resolve ตอน tsx ให้ import แบบ relative หรือ `npx tsx -r tsconfig-paths/register ...`; ต้องมี `DATABASE_URL` ใน env
> 📸 **backup DB ก่อนรันจริง**

## เกณฑ์ตรวจรับ
- `--dry` แสดงรายการที่จะสร้าง + lat/lng ที่ดึงจากลิงก์ ครบทุกแถวที่ข้อมูลถูกต้อง
- รันจริงแล้ว place โผล่ในเว็บ, หน้า place มีหมุดบน OSM ตรงตำแหน่ง (เพราะ lat/lng ถูกเติม)
- แถวที่ใกล้ของเดิม + ชื่อคล้าย → ถูกข้ามพร้อม log เตือน (กันซ้ำ)
- แถวข้อมูลไม่ครบ → ถูกข้ามพร้อมบอกบรรทัด

## หมายเหตุ
- ต้องทำ PHASE A ของแผนที่ก่อน (มี `lib/maps.ts`) และ PHASE B.1 (มี `lib/geo.ts`) — importer ใช้ทั้งสอง
- ถ้าจะนำเข้าซ้ำหลายรอบ เปลี่ยน `prisma.place.create` เป็น `upsert` (key = slug) เพื่อกันสร้างซ้ำ

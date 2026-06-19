# PAI-LAO — สรุปสถานะ & กฎเหล็ก (อ่านไฟล์นี้ก่อนทำงานต่อ)

อัปเดตล่าสุด: 2026-06-15 · โปรเจกต์: Next.js 16 + Prisma + Supabase (Postgres) + TS/React 19

---

## 🔌 ข้อมูลอยู่ที่ไหน / แก้ยังไง (อ่านก่อน — สำคัญ)
- ข้อมูลสถานที่ (Place) ทั้งหมดอยู่ใน **Supabase (Postgres)** เข้าผ่าน **Prisma** — **ไม่มีไฟล์ export/CSV/DB ในเครื่อง** อย่าขอให้ผู้ใช้อัปโหลดไฟล์ข้อมูล
- โฟลเดอร์โปรเจกต์ = **โค้ด Next.js** (ไม่ใช่ที่เก็บข้อมูล place) — ข้อมูลอยู่ใน DB
- **แก้/ตรวจข้อมูล** ได้ 2 ทาง: (1) เขียนสคริปต์ `npx tsx scripts/*.ts` ที่ใช้ `PrismaClient` (2) รัน SQL ใน **Supabase SQL Editor**
- `DATABASE_URL` อยู่ใน `.env` (gitignored) — ถ้าสคริปต์หาไม่เจอ ใช้ `npx tsx --env-file=.env scripts/x.ts`

---

## ⚠️ กฎเหล็ก (ห้ามพลาด)
1. **ใช้ `prisma db push` เท่านั้น** — ห้าม `migrate dev`/`migrate reset` (โปรเจกต์ไม่มีโฟลเดอร์ migrations → จะรีเซ็ต DB = ข้อมูลหาย)
2. **API routes / Server Components** ใช้ `sanitizeServerHtml` จาก `@/lib/sanitize-server` — **ห้าม** import `@/lib/sanitize` (DOMPurify/jsdom) ฝั่ง server (ทำให้ /api พัง)
3. Server Components import **`MapView`** เท่านั้น ห้าม import `LeafletMap` ตรง ๆ (window is not defined)
4. แผนที่ใช้ **OpenStreetMap + react-leaflet** (ฟรี ไม่ใช้ Google Maps API) + ปุ่ม "เปิดใน Google Maps"
5. พิกัดเป็น **WGS84 lat/lng** (Google/OSM ตรงกันในไทย ไม่มี offset)
6. **Backup DB ก่อนทำ SQL/import ที่เป็น destructive** เสมอ
7. ห้าม scrape Google Maps (ToS)

---

## ✅ งานข้อมูลสถานที่ (เสร็จสมบูรณ์)
**DB ปัจจุบัน ~18,404 ที่ ในไทยล้วน — อำเภอ+จังหวัดถูก พิกัดตรง 10 หมวด**

Pipeline ที่ใช้ (ทำผ่าน Google Colab เพราะ Python เครื่อง local เข้า Overpass/Nominatim ไม่ได้):
1. `scripts/colab_fetch_places.py` — ดึง OSM 1 query/จังหวัด (bbox) → จัดหมวดในโค้ด (10 หมวด)
2. `scripts/colab_fill_district.py` — reverse-geocode เติมอำเภอ+แก้จังหวัด (zoom 10)
3. `scripts/colab_refill_district.py` — refill เฉพาะตัวที่ยังเพี้ยน (zoom 14, อ่านหลายฟิลด์, ปฏิเสธชื่อจังหวัด)
4. `scripts/import-places.ts` — dedup (Haversine 80m + sim 0.55) → import APPROVED; **ข้ามตัวที่ district==province** (`--keep-no-district` ถ้าอยากเอาเข้า)
5. `scripts/validate-coords.ts` — ตรวจ 3 กลุ่ม: province ไม่ใช่ 77 จังหวัด (ต่างประเทศ) / หลุดขอบไทย / หลุดกรอบจังหวัด; `--delete` เพื่อลบ
6. `scripts/check-districts.ts` — นับคุณภาพอำเภอในไฟล์ seed ก่อน import
7. `scripts/fix-description-province.ts` — แก้ข้อความ description ที่ค้างจังหวัดเก่า (refill แก้ field แล้วแต่ description ไม่ตาม); `--apply` เพื่อเขียนจริง

รันสคริปต์ TS ด้วย **`npx tsx`** (ไม่ใช่ ts-node) — เช่น `npx tsx scripts/import-places.ts all --dry-run`

ประวัติ: ลบ placeholder เก่า 2,712 → import 19,397 → ลบต่างประเทศ (ลาว/พม่า/มาเลย์) 1,374 → เหลือ ~18,404
- ข้าม "หาอำเภอไม่เจอ" ตอน import = 686 ที่ (จุดห่างไกล/เกาะที่ OSM ไม่มีข้อมูลอำเภอ)
- ทุกที่จาก OSM ใช้ `coverUrl = "/images/default-place.svg"` (ไม่มีรูป → card โชว์ไอคอนหมวดบนพื้นไล่สี = ปกติ)

หมวดที่ใช้ได้ (code): NATURE, BEACH, TEMPLE, CAFE, FOOD, ACCOMMODATION, MARKET, MUSEUM, ADVENTURE, CAMPING

---

## 📁 ไฟล์/สคีมาสำคัญ
- `prisma/schema.prisma` — Place: lat/lng/googleMapsUrl/category(String)/amenities[]/approvalStatus; TimelineStop มี lat/lng แล้ว
- `lib/geo.ts` (haversine, nameSimilarity) · `lib/maps.ts` (googleUrlToLatLng ฯลฯ)
- `data/thailand.ts` — PROVINCES + getDistricts() (รูปแบบ "เมืองเชียงใหม่ (Mueang...)", dropdown value = ตัดวงเล็บ)
- `app/place/page.tsx` — หน้า search (client, ดึง /api/places)

---

## 📌 งานที่เหลือ/ทางเลือก (ยังไม่ทำ — มี spec ใน docs/)
- `docs/FIX-INSTRUCTIONS.md` — security FIX 1–6 (sanitize split, CSP, upload MIME, admin priv, delete trip, AI rate limit)
- `docs/SEO-INSTRUCTIONS.md` — metadataBase, JSON-LD (AggregateRating/WebSite/Org/Breadcrumb), canonical
- `docs/MAP-FEATURE-INSTRUCTIONS.md` — PHASE 0/A/1/2/B/3/C (PHASE 1,3 เสร็จแล้ว)
- เติมรูปภาพจริงให้สถานที่ (ตอนนี้เป็น default svg)
- (เคยเจอ) หน้า search โชว์ card ทั้งที่ "พบ 0" — ตอนนั้นยังไม่ import จริง อาจหายแล้ว ถ้ายังเจอให้ดูโค้ด app/place/page.tsx

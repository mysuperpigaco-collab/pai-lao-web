# 📋 คู่มืองาน pai-lao-web (สำหรับ Claude Code)

เอกสารสั่งงานทั้งหมดอยู่ในโฟลเดอร์ `docs/` นี้ แต่ละไฟล์มีโค้ดเต็ม + เกณฑ์ตรวจรับ + แผน rollback

| ไฟล์ | งาน | แตะ DB |
|---|---|---|
| `docs/FIX-INSTRUCTIONS.md` | แก้ความปลอดภัย + บัค (XSS, CSP, upload, สิทธิ์ admin, ฯลฯ) | ❌ |
| `docs/MAP-FEATURE-INSTRUCTIONS.md` | แผนที่ OpenStreetMap + ปุ่ม Google Maps + picker + GPS | เฉพาะ PHASE 3 |
| `docs/SEO-INSTRUCTIONS.md` | SEO (metadataBase, ดาวรีวิว, canonical, schema) | ❌ |

---

## ⚠️ กฎเหล็ก 4 ข้อ (บอก Claude Code ทุกครั้ง)

1. **ใช้ `prisma db push` เท่านั้น** ห้าม `prisma migrate dev` / `migrate reset` — โปรเจกต์นี้ไม่มี migrations folder ถ้าใช้ migrate จะขอ reset DB = ข้อมูลหาย
2. **ฝั่ง API ใช้ `sanitizeServerHtml` (regex)** ห้าม import `@/lib/sanitize` (DOMPurify) เข้า server — ทำให้ /api crash
3. **Server Component import `MapView` เท่านั้น** ห้าม import `LeafletMap` ตรง ๆ (กัน `window is not defined`)
4. **ทำทีละเฟส commit แยก หยุดให้เทสต์ก่อนขึ้นเฟสถัดไป** อย่าทำรวดเดียวทุกเฟส

---

## 🟢 คำสั่งพร้อมวาง (ก๊อปส่ง Claude Code ทีละอัน)

### A) ความปลอดภัย (ทำก่อน — สำคัญสุด)
```
อ่าน docs/FIX-INSTRUCTIONS.md แล้วทำ FIX 1 ก่อนอย่างเดียว:
แยก lib/sanitize-server.ts (regex, ใช้ใน API) กับ lib/sanitize.ts (DOMPurify, client).
ฝั่ง API ใช้ sanitizeServerHtml เท่านั้น ห้าม import @/lib/sanitize เข้า server route.
เสร็จแล้วรันเช็คว่า GET /api/trips คืน 200 และ npm run build ผ่าน แล้วหยุดให้ผมเทสต์
```
หลังเทสต์ผ่าน:
```
ทำ FIX 2–6 ใน docs/FIX-INSTRUCTIONS.md ทีละข้อ commit แยก ตามเกณฑ์ตรวจรับในไฟล์
```

### B) แผนที่ (ทำเป็นเฟส)
```
อ่าน docs/MAP-FEATURE-INSTRUCTIONS.md แล้วทำ PHASE 0 + PHASE A:
ติดตั้ง react-leaflet/leaflet, สร้าง lib/maps.ts lib/geo.ts lib/leafletIcon.ts components/maps/*,
สร้างและรัน scripts/backfill-coords.ts (backup DB ก่อน).
ใช้ db push เท่านั้น. Server Component import MapView เท่านั้น.
เสร็จแล้วหยุดให้ผมเทสต์
```
ทำต่อทีละเฟส:
```
ทำ PHASE 2 (แผนที่เส้นทางหน้าทริป) ใน docs/MAP-FEATURE-INSTRUCTIONS.md commit แยก
```
```
ทำ PHASE B (place picker + กันซ้ำ + GPS ปุ่ม) ใน docs/MAP-FEATURE-INSTRUCTIONS.md
อย่าลืมแก้ Permissions-Policy เป็น geolocation=(self) สำหรับ GPS
```
```
ทำ PHASE 3 (พิกัดต่อ stop + picker ทริป) ใน docs/MAP-FEATURE-INSTRUCTIONS.md
ใช้ prisma db push (ห้าม migrate dev) และแก้ครบทั้ง 5 block ที่ map timeline ตามที่ระบุในไฟล์
```

### C) SEO (ทำเมื่อไหร่ก็ได้ ไม่กระทบ logic)
```
อ่าน docs/SEO-INSTRUCTIONS.md แล้วทำ SEO 1–6 ทีละข้อ commit แยก ตามเกณฑ์ตรวจรับในไฟล์
(STEP 0 เป็นงานนอกโค้ดบน Vercel/Search Console ผมทำเอง)
```

---

## สถานะปัจจุบัน
- ✅ PHASE 1 (แผนที่หน้า place) ทำแล้ว
- ⏭️ ถัดไปแนะนำ: FIX 1 (ความปลอดภัย) → MAP PHASE 0/A → PHASE 2 → PHASE B → PHASE 3

## ปิดแผนที่ฉุกเฉิน (ถ้าพัง)
ตั้ง env `NEXT_PUBLIC_ENABLE_MAPS=false` บน Vercel แล้ว redeploy → แผนที่หายทุกหน้าโดยโค้ดยังอยู่

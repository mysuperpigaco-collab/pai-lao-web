# ชุดคำสั่ง VS Code — เร่งหน้ารายละเอียดสถานที่ให้เร็วขึ้น

อัปเดต: 2026-06-20

## ผลวัดจริง (จากแถบ admin บนหน้า)
`session 103 · place 2253 · batch 1245 · total 3601ms`

วินิจฉัย:
- `getCurrentUser` **ไม่แตะ DB** (verify JWT เฉย ๆ) → query แรกที่ชน DB คือ `place`
- **`place` 2253ms** = ส่วนใหญ่คือ **ค่าเชื่อมต่อ DB ครั้งแรก (cold/ไม่ pooled)** เพราะหน้าตัวอย่างข้อมูลแทบว่างแต่ยังกิน 2 วิ
- **`batch` 1245ms** = query `TimelineStop` (รูปจากนักเดินทาง) **สแกนทั้งตาราง** เพราะไม่มี index ที่ `placeId`/`placeName`

---

## แก้แล้วในโค้ด (②) — เพิ่ม index + ปรับ query
- `prisma/schema.prisma` → `TimelineStop` เพิ่ม `@@index([placeId])` + `@@index([placeName])`
- `app/place/[slug]/page.tsx` → เปลี่ยน `placeName` จาก match แบบ insensitive (สแกนทั้งตาราง) เป็น **exact match** (ภาษาไทยไม่มีตัวพิมพ์เล็ก/ใหญ่ ผลเหมือนเดิม แต่ index ทำงาน)

### Deploy ② (มี db push เพราะเพิ่ม index)
```bash
# 1) สร้าง index ใน Supabase (db push เท่านั้น ห้าม migrate)
npx prisma db push

# 2) push โค้ด
git add prisma/schema.prisma "app/place/[slug]/page.tsx" docs/INSTRUCTIONS-place-detail-perf.md
git commit -m "perf(place): index TimelineStop(placeId, placeName) + exact name match"
git push
```
> `db push` จะสร้าง index เพิ่ม ไม่ลบข้อมูล (non-destructive) ปลอดภัย

คาดว่า `batch` จะลดจาก ~1245ms → หลักสิบ–ร้อย ms

---

## ① ค่าเชื่อมต่อ DB (place 1.5–2 วิ) — DB อยู่โตเกียว, Vercel ต้องตามไป

ผลทดสอบ F5 ซ้ำ: `place` ไม่ลด (1225–1841ms ทุกครั้ง) = **ไม่ใช่ cold start** แต่จ่ายค่าเชื่อมต่อ/วิ่งข้ามโซนทุก request
Supabase region = **`ap-northeast-1` (โตเกียว)** → ถ้า Vercel รันที่ US (`iad1`) ทุก query วิ่งข้ามแปซิฟิก

### ①a ตั้งโซน Vercel = โตเกียว (แก้ในโค้ดแล้ว)
- เพิ่มไฟล์ `vercel.json` → `"regions": ["hnd1"]` (hnd1 = โตเกียว)
- ⚠️ **ถ้า Vercel เป็นแพลน Hobby/ฟรี อาจเปลี่ยน region ไม่ได้** (ล็อกที่ iad1) — ถ้า deploy แล้ว region ไม่เปลี่ยน ให้ข้ามข้อนี้ แล้วพึ่ง ①b เป็นหลัก (หรืออัป Vercel Pro)
- เช็กหลัง deploy: Vercel → Deployment → Functions ว่าโชว์ภูมิภาค Tokyo

### ①b DATABASE_URL ต้องเป็น pooled (6543) — สำคัญสุด ทำได้ทุกแพลน
จากแท็บ **ORM** ใน Supabase Connect จะได้ 2 ค่า เอาไปใส่ Vercel → Settings → Environment Variables:
- **`DATABASE_URL`** = pooler **6543** + ต่อท้าย `?pgbouncer=true&connection_limit=1`
  `postgresql://...@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`
- **`DIRECT_URL`** = session/direct **5432** (ใช้แค่ตอน `prisma db push`)
- Redeploy

> ถ้า `DATABASE_URL` ตอนนี้เป็น `:5432` อยู่ → นั่นคือเหตุผลที่ `place` ไม่ลดตอน F5 (ต่อใหม่ทุกครั้ง) สลับเป็น 6543 แล้ว connection จะถูกใช้ซ้ำ เร็วขึ้นมาก

---

## หลังแก้ทั้งสอง — คาดการณ์
`total ~3600ms` → เหลือ **~400–800ms** (เชื่อมต่อเร็วขึ้น + ไม่สแกนตาราง)

## อย่าลืม (ภายหลัง)
ถอดแถบจับเวลา admin + `console.log("[place timing]"...)` ออกจาก `app/place/[slug]/page.tsx` เมื่อพอใจกับความเร็วแล้ว (บอกผมได้ เดี๋ยวถอดให้)

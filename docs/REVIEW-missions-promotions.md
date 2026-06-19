# รีวิวหลังแก้ description + เปิดมิชชัน/โปรโมชั่น

วันที่: 2026-06-15 · รีวิวแบบ static (อ่านโค้ด ไม่ได้รันแอป — sandbox สตาร์ทไม่ขึ้น)

ขอบเขต: ผลกระทบจากการแก้ description, ระบบ Mission, ระบบ Promotion, feature toggle, และ UX/UI

---

## 🟥 บั๊กที่ควรแก้ก่อน (functional)

### 1. อนุมัติผลงานซ้ำ = ได้แต้มซ้ำ
ไฟล์: `app/api/admin/missions/route.ts` (PUT, action `APPROVE`)

โค้ดอนุมัติไม่เช็คสถานะปัจจุบันของ participant ก่อนบวกแต้ม:
```ts
if (action === "APPROVE") {
  await prisma.missionParticipant.update({ ... status: "APPROVED" ... });
  if (participant.mission.rewardPoints > 0) {
    await prisma.user.update({ data: { points: { increment: ... } } });
  }
}
```
ถ้าแอดมินกดอนุมัติซ้ำ (หรือ request ถูกส่งซ้ำ) บน participant ที่ `APPROVED` อยู่แล้ว → ผู้ใช้ได้แต้ม **ซ้ำทุกครั้ง**

แก้: เช็ค `if (participant.status === "APPROVED") return ...` ก่อน และครอบ update สถานะ + บวกแต้มไว้ใน `prisma.$transaction` เดียวกัน

### 2. ส่งผลงานข้ามลิมิต maxSlots ได้
ไฟล์: `app/api/missions/[id]/submit/route.ts`

route `join` เช็ค `maxSlots` แต่ route `submit` ใช้ `upsert` สร้าง participant ตรง ๆ โดยไม่เช็ค `maxSlots` → คนที่ไม่ได้ join สามารถ submit เข้ามาเกินจำนวนที่กำหนดได้ ทำให้ `_count.participants` เกิน `maxSlots`

แก้: ก่อน upsert (เฉพาะกรณีสร้างใหม่) ให้เช็คจำนวน participant ปัจจุบันเทียบ `maxSlots` เหมือน route join

---

## 🟧 ผลกระทบจากการ "เปิด/ปิด" มิชชัน-โปรโมชั่น (สำคัญ)

**Feature toggle ทำงานแค่ฝั่ง client เท่านั้น** — ตัว API และบางหน้าไม่ได้เช็ค flag:

- `GET /api/missions` และ `GET /api/promotions` **ไม่เช็ค** `missionsEnabled` / `promotionsEnabled` → ยิง API ตรง ๆ ยังได้ข้อมูลแม้ปิดฟีเจอร์
- หน้า `app/place/[slug]/page.tsx` ดึง active missions ของสถานที่และโชว์ `MissionSubmitBox` โดย **ไม่เช็ค** `missionsEnabled` → ผู้ใช้ที่ล็อกอินยังส่งผลงานภารกิจผ่านหน้าสถานที่ได้ แม้แอดมินปิดระบบมิชชันไว้

ผลคือ การกด "ปิด" ในแอดมินแค่ซ่อน UI (หน้า list, section หน้าแรก, ลิงก์ navbar) แต่ฟังก์ชันจริงยังเข้าถึงได้

แก้ (ถ้าต้องการให้ปิดแล้วปิดจริง): เช็ค SiteSetting ใน GET ของทั้งสอง API และใน place page ก่อน query/แสดง MissionSubmitBox — ถ้าปิดให้คืน list ว่าง / ไม่แสดงกล่อง

---

## 🟨 UX / UI

### 3. ลิงก์ Missions/Promotions บน navbar ไม่ขึ้นสำหรับผู้ที่ไม่ล็อกอิน (เฉพาะ desktop)
ไฟล์: `components/layout/Navbar.tsx`

บน desktop ลิงก์ภารกิจ/โปรโมชั่น (บรรทัด ~299–300) อยู่ใน block `user ? (...)` → **เฉพาะคนล็อกอินถึงเห็น** แต่บนมือถือ (เมนู ~351–352) โชว์ให้ทุกคนรวมถึง guest

โปรโมชั่นเป็นฟีเจอร์สาธารณะ (GET ไม่ต้องล็อกอิน) ดังนั้นผู้ใช้ที่ยังไม่ล็อกอินบน desktop **จะหาโปรโมชั่นไม่เจอ** — ไม่สอดคล้องกัน ควรย้ายลิงก์ทั้งสองออกมานอก block `user` ให้เห็นเหมือนกันทุกสถานะ

### 4. หน้า /missions แสดง "ไม่มีภารกิจ" เมื่อโหลด settings ล้มเหลว
ไฟล์: `app/missions/page.tsx` (useEffect `.catch`)

กรณี `/api/settings` error → ตั้ง `enabled=true` + `loading=false` แต่ไม่ยิง `/api/missions` → ผู้ใช้เห็น "ยังไม่มีภารกิจ" ทั้งที่จริงอาจมี ควร fetch missions ใน catch ด้วย

### 5. โค้ดตาย (dead code / lint) ใน `app/missions/page.tsx`
`user` (จาก useAuth), `showToast`, component `Toast`, และ `expiredMissions` ถูกประกาศแต่ไม่ถูกใช้ — ควรลบหรือเอามาใช้ (เช่น แสดง expired missions / toast)

---

## 🟦 จุดเล็กน้อย / ตรวจเพิ่ม

### 6. ตรวจ `descriptionShort` หลังแก้ description
สคริปต์ `fix-description-province.ts` แก้เฉพาะฟิลด์ `description` แต่ `generateMetadata` และ JSON-LD ใน place page ใช้ `descriptionShort` ก่อน (`place.descriptionShort || ...`) ถ้ามีสถานที่ไหนที่ `descriptionShort` ถูกตั้งค่าด้วยชื่อจังหวัดเก่า → SEO/meta/โครงสร้างข้อมูลจะยังโชว์จังหวัดผิด

เช็คเร็ว ๆ ใน Supabase:
```sql
SELECT count(*) FROM "Place"
WHERE "descriptionShort" IS NOT NULL
  AND "descriptionShort" LIKE '%ตั้งอยู่%';
```
(สถานที่จาก OSM ส่วนใหญ่ `descriptionShort` น่าจะเป็น null อยู่แล้ว — ถ้าผลเป็น 0 ก็สบายใจได้)

### 7. สถานะ "INACTIVE" ของ Promotion ไม่อยู่ใน enum ที่ documented
`app/api/admin/promotions/route.ts` (PATCH) สลับเป็น `INACTIVE` แต่ comment ใน schema ระบุ `PENDING | ACTIVE | REJECTED | EXPIRED` — ทำงานได้ (เพราะ public GET กรองเฉพาะ ACTIVE) แต่ควรอัปเดต comment/เอกสารให้ตรง

### 8. `PUT /api/admin/settings` เขียน key อะไรก็ได้
ไม่มี whitelist key — เสี่ยงต่ำเพราะ admin-only แต่ควร validate key อยู่ในชุดที่อนุญาต และ value เป็น string

---

## สรุปลำดับความสำคัญ
1. แก้ #1 (แต้มซ้ำ) — กระทบความถูกต้องของแต้ม
2. แก้ #2 (ข้าม maxSlots)
3. ตัดสินใจเรื่อง #ผลกระทบ toggle — ถ้าต้องการให้ "ปิดแล้วปิดจริง" ต้องเช็ค flag ใน API + place page
4. แก้ UX #3 (navbar guest)
5. ที่เหลือเป็น polish

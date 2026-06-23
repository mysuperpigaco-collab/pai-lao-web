# คู่มือส่งมอบงาน · pai-lao (ไปเล่า)

> เปิดไฟล์นี้ตอนเริ่มแชทใหม่ แล้วบอกผู้ช่วยว่า "อ่าน HANDOFF.md ก่อน แล้วทำตามกฎในนั้น"

---

## 1. โปรเจกต์คืออะไร

**pai-lao (ไปเล่า / www.pai-lao.com)** — เว็บคอมมูนิตี้ท่องเที่ยวไทย ผู้ใช้เขียน "ทริป" (เรื่องเล่าการเดินทาง พร้อม timeline จุดแวะ) และค้นหา "สถานที่" ทั่วไทย

**Stack:** Next.js 16 (App Router) · React 19 · Prisma 5.22 · Supabase (Postgres) · TypeScript · styled-jsx · Lenis (smooth scroll) · Leaflet (แผนที่)

---

## 2. กฎการทำงานกับผม (Jim) — สำคัญสุด อ่านก่อน

1. **ตอบไทย กระชับ ตรงประเด็น** ตัดคำฟุ่มเฟือย
2. **ฐานข้อมูล: ใช้ `npx prisma db push` เท่านั้น ห้าม `migrate`** (ไม่มีโฟลเดอร์ migrations → migrate/reset = ข้อมูลหาย)
3. **ผม deploy เอง** — sandbox build ไม่ได้ (error EXDEV) ผู้ช่วย **เขียนโค้ดให้เสร็จ + เขียนชุดคำสั่ง git/deploy** ให้ผมรันเอง
4. **คำสั่ง deploy เป็น PowerShell** — ห้ามใช้ `&&` (ใช้ทีละบรรทัด) ทุกครั้งที่แก้โค้ดเสร็จให้แปะชุดคำสั่ง deploy ให้เลย
5. **งานภาพ/อนิเมชัน/เลย์เอาท์ใหม่ → ทำ PREVIEW ก่อน** (วิดเจ็ต visualize) ให้ผมดูและอนุมัติ ก่อนลงโค้ดจริงเสมอ
6. **เช็คมือถือทุกครั้ง** — ทุกการแก้ UI ดูผลกระทบทั้ง desktop และมือถือ (media query)
7. **งานใหญ่ที่แตะหลายไฟล์/backend/เส้นทางเซฟ → ยืนยันแนวทางกับผมก่อนลงมือ** (ใช้ตัวเลือกให้ผมเลือก)
8. ผม `npx tsc --noEmit` เอง (sandbox รันไม่ได้) — ผู้ช่วย **รีวิวด้วยมือ** + ระวัง type ของ state ที่ประกาศ explicit (ต้องเพิ่ม field ใหม่ในชนิดด้วย)
9. หลังแก้ → สรุปสั้น ๆ ว่าแก้ไฟล์ไหน เพราะอะไร + เช็คผลกระทบหน้าอื่น (โดยเฉพาะการ์ดทุกหน้า + มือถือ)
10. **อย่าเปิด path ภายใน `/sessions/...` ให้ผมเห็น** · ถ้า WebFetch โดนบล็อก อย่าเลี่ยงด้วย curl/bash

## 3. กับดักทางเทคนิคที่ต้องระวัง (เคยพลาดมาแล้ว)

- **Lenis จับ wheel ทั้งจอ** → กล่อง `overflow:auto` ต้องใส่ `data-lenis-prevent`
- scroll ใช้ `lenis.scroll` ไม่ใช่ `window.scrollY` · เลื่อนด้วย `lenis.scrollTo(y,{immediate:true,force:true})`
- **"ม่านโหลด"** = `app/loading.tsx` + `NavTransition.tsx` (event `pai-lao:curtain-open`) · หน้า detail re-export ม่านกลาง
- **View Transitions / morph ถอดออกหมดแล้ว** — ชนกับม่านโหลด อย่าเอากลับมา
- **Server Components import `MapView` เท่านั้น** (ไม่ใช่ `LeafletMap`)
- **API routes ใช้ `sanitizeServerHtml` จาก `@/lib/sanitize-server`**
- **Gemini AI:** `gemini-2.5-flash` + `thinkingBudget: 0`
- **Supabase pooler:** port 6543, `pgbouncer=true`, `connection_limit=1`, user `postgres.cxyhiavxgiraitgvuroj`, region ap-northeast-1, Vercel hnd1 · รหัสมี `@` ต้อง URL-encode (`%40`)
- **styled-jsx เป็น scoped** → คอมโพเนนต์ลูกไม่ได้ class ของหน้าแม่ (เช่น `.form-control`) ต้องใส่สไตล์ในคอมโพเนนต์เอง
- **Glob ที่ path มี `[slug]` (วงเล็บเหลี่ยม) มักหาไม่เจอ** → ใช้ Grep หรือ path ตรง ๆ แทน
- **รีวิวของ "สถานที่" ห้ามใส่ `tripId`** (จะไปโผล่ในคอมเมนต์ของทริป) — review ที่เป็น place review ต้องมีแค่ `placeId`

## 4. โมเดล/แนวคิดหลัก

- **Trip** — `mood` (หลัก = moods[0]) + `moods String[]` · `titleStyle String?` (สไตล์ฟอนต์หัวข้อ: none/normal/bold/serif) · `approvalStatus` (PENDING/APPROVED/REJECTED) · `isPublished` · `isDraft` · `timeline`
- **TimelineStop** — `placeId` + relation `place` · `shareToPlace` (แชร์รูป+รีวิวไปหน้าสถานที่) · `rating`
- **Place** — `approvalStatus` + `rejectionReason` · สถานที่ที่ผู้ใช้เสนอ = PENDING (businessId null)
- **PendingEdit** — แก้ทริปที่ approved แล้วจะสร้าง PendingEdit ให้แอดมินตรวจ
- **Review** — `placeId` XOR `tripId` (place review ห้ามมี tripId)
- **TRIP_MOODS** อยู่ `data/tripMoods.ts` · **titleStyle helper** อยู่ `lib/titleStyle.ts`

### Lifecycle ทริป + การแชร์ไปหน้าสถานที่ (สำคัญ — เพิ่งรื้อ)
- ทริป **PENDING/REJECTED** เจ้าของแก้ → อัปเดตตรง + กลับเป็น **PENDING** (ไม่สร้าง PendingEdit) + ล้าง PendingEdit เก่า → แอดมินอนุมัติที่แท็บ "ทริปใหม่" (ตั้ง `isPublished:true`)
- ทริป **APPROVED** เจ้าของแก้ → สร้าง **PendingEdit** · หน้าแก้ไขโหลด pendingEdit มาโชว์ (GET `/api/trips/[slug]` คืน `pendingEdit` ให้เจ้าของ) · อนุมัติ PendingEdit ต้องตั้ง `isPublished:true` ด้วย
- **รูป/รีวิว shareToPlace แสดงหน้าสถานที่เฉพาะเมื่อ "ทริป + สถานที่ อนุมัติทั้งคู่"** — สร้างรีวิวตอนอนุมัติทริป (`lib/sharedReviews.ts` → `syncSharedReviewsForTrip`) ไม่ใช่ตอน submit · query รูป community (หน้า detail + `/api/places` การ์ด) กรอง `shareToPlace:true` + `trip approved`
- **สร้างสถานที่จากทริป**: กด "สร้าง" = ทำเครื่องหมาย (`createPlace` flag) ยังไม่ยิง · ตอนกดบันทึก `resolveNewPlaces` ค่อยยิง `/api/places/suggest` (dedup ตามชื่อ+จังหวัด) แล้วผูก placeId · ใช้ช่อง "ปักหมุดพิกัด" (googleMapsUrl) อันเดียว
- **แอดมินอนุมัติสถานที่จากทริป** ได้ 3 ทาง: modal ทริปใหม่, modal แก้ไขทริป (TripPlaceCheckWarning มีปุ่ม ✓/✕), และแท็บ **"สถานที่รอตรวจ"** (`/api/admin/places?approval=UNAPPROVED` = PENDING+REJECTED)

## 5. ไฟล์/จุดสำคัญที่แตะบ่อย

- ฟอร์มสร้างทริป: `app/trips/create/page.tsx`
- ฟอร์มแก้ไขทริป (ตัวจริง): `app/trips/[slug]/edit/page.tsx` · **`EditTripForm.tsx` เป็นไฟล์เก่าไม่ได้ใช้**
- คอมโพเนนต์ตกแต่งหัวข้อ (ใช้ร่วม 2 ฟอร์ม): `components/trips/TitleDecorator.tsx` + `lib/titleStyle.ts`
- การ์ดแดชบอร์ด: `components/dashboard/StoryCard.tsx` (ป้ายสถานะเช็ค approvalStatus ก่อน isPublished)
- หน้าทริป: `app/trips/[slug]/page.tsx` · หน้าสถานที่: `app/place/[slug]/page.tsx`
- API ทริป: `app/api/trips/route.ts`, `app/api/trips/[slug]/route.ts`
- API แอดมิน: `app/api/admin/trips`, `app/api/admin/places`, `app/api/admin/pending-edits`, `app/api/admin/trip-place-check`
- แผนที่: `lib/maps.ts` (`googleUrlToLatLng` สแกนพิกัดจาก body) + `app/api/maps/resolve`
- titleStyleCss ใช้ render หัวข้อทุกการ์ด: home (`app/page.tsx`, `TripSlider`, `AutoGridSection`), `/trips`, `/search`, StoryCard, user profile, planner, hero+related

## 6. สถานะล่าสุด (เซสชันนี้ — ทำเสร็จหมดแล้ว ควร deploy ครบ)

แก้ทั้งหมดและสร้างชุดคำสั่ง deploy ให้แล้ว (Jim ทยอย deploy):
1. รีวิวไทม์ไลน์ไม่หลุดไปคอมเมนต์ทริป (เอา tripId ออกจาก place review ทุกที่)
2. navbar จัดกลุ่มเมนูกลางแถบ (`justify-content:center`) สมดุล · มือถือ space-between
3. mood เป็นกริด 3 คอลัมน์ + ปุ่ม "ทุกสไตล์" · budget+tags อยู่แถวเดียว
4. ตกแต่ง title: อิโมจิ + แบบตัวอักษร (ปกติ 500 / ตัวหนา 900 / คลาสสิก serif italic) — เอาสีออกแล้ว (เหลือฟอนต์)
5. ปักหมุด Google Maps ลิงก์ย่อ (resolver สแกน body)
6. เลื่อนสร้างสถานที่ไปตอนเซฟ + รวมช่องหมุดเดียว
7. หน้าแก้ไขโหลด pending edit ของเจ้าของ (ค่าล่าสุดไม่หาย)
8. ทริป REJECTED แก้แล้วกลับเป็น PENDING · อนุมัติ PendingEdit ตั้ง isPublished
9. แอดมินอนุมัติ/ปฏิเสธสถานที่จากทริปได้ 3 ทาง + แท็บ "สถานที่รอตรวจ"
10. ป้ายสถานะแดชบอร์ดถูกต้อง (approvalStatus ก่อน isPublished)
11. แชร์รูป/รีวิวไปหน้าสถานที่ + การ์ด เฉพาะทริปอนุมัติแล้ว
12. แจ้งเตือน "แสดงเฉพาะรีวิวแรก" ใต้ toggle shareToPlace

**ค้าง/ติดตามผล:**
- ข้อมูลเก่าที่รั่วก่อนแก้ (รีวิว/รูปจากทริปที่ไม่อนุมัติ) ยังค้างใน DB — ถ้าจะล้างต้องเขียนสคริปต์ (Jim ยังไม่ขอ)
- มีตัวเลือกค้างถาม Jim: "อนุมัติทริปแล้วให้อนุมัติสถานที่ PENDING ที่ลิงก์อัตโนมัติด้วยไหม" (ตอนนี้ยังต้องกดแยก)

**คำสั่ง deploy มาตรฐาน (PowerShell):**
```powershell
npx prisma db push   # เฉพาะตอนมีคอลัมน์ใหม่ (เช่น titleStyle เพิ่มไปแล้ว)
npx tsc --noEmit
git add -A
git commit -m "..."
git push
```

---
*อัปเดตล่าสุด: สรุปงานเซสชันใหญ่ (รื้อ flow อนุมัติทริป+สถานที่, ตกแต่ง title, mood grid, navbar) — อัปเดตไฟล์นี้ทุกครั้งที่มีงานใหม่*

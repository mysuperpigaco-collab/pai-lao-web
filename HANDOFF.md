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
- **โดเมนมี 2 ตัวแปร env** — `NEXT_PUBLIC_SITE_URL` (sitemap/OG/แชร์/canonical + redirect_uri ของ Google) และ `NEXT_PUBLIC_BASE_URL` (ลิงก์ในอีเมล) · fallback ในโค้ดทุกจุดเป็น **non-www** `https://pai-lao.com` · เว็บจริงใช้ทั้ง www และ non-www (ลงทะเบียน redirect URI ทั้งคู่ใน Google) — ถ้าจะบังคับ canonical ต้องตั้ง env ทั้งสองตัว + redirect non-www↔www
- **Google OAuth redirect_uri ต้องตรงเป๊ะกับที่ลงทะเบียนใน Google Cloud** (www vs non-www, http/https, ห้าม `/` ท้าย) — derive จาก `NEXT_PUBLIC_SITE_URL || origin`
- **styled-jsx `[data-theme="dark"]` ต้องห่อ `:global(...)`** เมื่ออยู่ใน `<style jsx>` ไม่งั้น selector ดาร์กโหมดไม่ทำงาน

## 4. โมเดล/แนวคิดหลัก

- **Trip** — `mood` (หลัก = moods[0]) + `moods String[]` · `titleStyle String?` (สไตล์ฟอนต์หัวข้อ: none/normal/bold/serif) · `approvalStatus` (PENDING/APPROVED/REJECTED) · `isPublished` · `isDraft` · `timeline`
- **TimelineStop** — `placeId` + relation `place` · `shareToPlace` (แชร์รูป+รีวิวไปหน้าสถานที่) · `rating`
- **Place** — `approvalStatus` + `rejectionReason` · สถานที่ที่ผู้ใช้เสนอ = PENDING (businessId null)
- **PendingEdit** — แก้ทริปที่ approved แล้วจะสร้าง PendingEdit ให้แอดมินตรวจ
- **Review** — `placeId` XOR `tripId` (place review ห้ามมี tripId)
- **User (auth)** — `email`/`username` unique (1 อีเมล = 1 บัญชี) · `password`/`phone` เป็น **optional** (บัญชี Google ไม่มี) · `googleId String? @unique` · `authProvider` (LOCAL/GOOGLE) · login บังคับ `emailVerified` (ยกเว้น admin) · บัญชี Google ตั้ง emailVerified=true อัตโนมัติ
- **Place** — มี `descriptionShort` (จุดเด่น/คำโปรย) แสดงบน PlaceCard · `description` (เต็ม, บังคับ)
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
- **Auth (Google login):** `app/api/auth/google/route.ts` (เริ่ม + state), `app/api/auth/google/callback/route.ts` (แลก code, find/create/link, signToken, onboarding redirect), `components/auth/GoogleLoginButton.tsx` (ปุ่ม + ดัก in-app LINE) · ปุ่มอยู่หน้า `/login` + `/signup`
- **บัญชี/รหัสผ่าน:** `app/api/auth/me` (GET คืน `hasPassword`+`authProvider`; PUT แก้ username + ตั้งรหัสผ่านแบบไม่ต้องมีรหัสเดิมถ้ายังไม่มี) · `app/api/business/me` (logic รหัสผ่านเดียวกัน) · หน้าแก้ไข `app/dashboard/edit-profile/page.tsx` (ช่อง username + ส่วนรหัสผ่านมีเงื่อนไข + แบนเนอร์ `?welcome=google`)
- **hover-link แผนที่↔การ์ด:** `components/maps/RouteHoverContext.tsx` (context กลาง, default no-op = หน้าอื่นไม่กระทบ) · ใช้ใน `LeafletMap`/`NearbyMap`/`TripTimeline`/`PlaceCard` (prop `linkOnHover`) · ครอบ `RouteHoverProvider` ที่หน้าทริป + ExplorerSection
- **สคริปต์ลบผู้ใช้:** `scripts/delete-users.ts` (dry-run default, `--execute`, ข้าม ADMIN/SUPERADMIN, cascade ลบลูกอัตโนมัติ)

## 6. สถานะล่าสุด (เซสชันนี้ — deploy ครบบน prod แล้ว ✅)

ยืนยันจาก Vercel: ทุก commit ขึ้น Production (Ready) แล้ว ไม่มีโค้ดค้าง

**งานที่ทำเสร็จเซสชันนี้:**
1. **หมุดทริปบนแผนที่ + ไทม์ไลน์** — หมุดมีเลขลำดับ + สี (ROUTE_COLORS) บอกไทม์ไลน์ · วงเลขในไทม์ไลน์สีตรงกับหมุด · เส้นเชื่อมหมุดแบบเส้นประ + ขอบขาว
2. **hover-link การ์ด↔หมุด** — ชี้การ์ด/หมุดแล้วอีกฝั่งไฮไลต์ (หน้าทริป + หน้าค้นหาใกล้ฉัน) ผ่าน `RouteHoverContext` (default no-op หน้าอื่นไม่กระทบ)
3. **PlaceCard แสดง "จุดเด่น" (`descriptionShort`)** + ให้ API nearby ส่งฟิลด์นี้มาด้วย
4. **Google OAuth login** — ปุ่มหน้า login/signup · find/create/link บัญชี (อีเมลซ้ำ = ลิงก์เข้าด้วยกัน) · กัน CSRF ด้วย state · ดัก in-app browser LINE
5. **DB schema:** `password`/`phone` → optional · เพิ่ม `googleId`, `authProvider` (push แล้ว)
6. **แก้ username ได้เอง** (เช็ครูปแบบ + ซ้ำ) + **ตั้งรหัสผ่าน** สำหรับบัญชี Google (ไม่ต้องมีรหัสเดิมถ้ายังไม่มี) ในหน้าแก้ไขโปรไฟล์
7. **Onboarding** — ผู้ใช้ Google ครั้งแรกเด้งไปหน้าแก้ไขโปรไฟล์ + แบนเนอร์ต้อนรับให้ตั้งชื่อ/รหัสผ่าน
8. `scripts/delete-users.ts` (ลบบัญชีเทสต์ — รันแล้ว)

**ข้อตกลงเชิงนโยบาย (ที่คุยกันเซสชันนี้):**
- **แยกบัญชีผู้รีวิว (TRAVELER) กับร้าน (BUSINESS)** — 1 อีเมล = 1 บัญชี · จะเป็นร้านให้แอดมินกด "→ BUSINESS" (ยังไม่ทำ self-service upgrade)

**ค้าง/ควรทำ (ไม่เร่ง ไม่บล็อก):**
- ตั้ง `NEXT_PUBLIC_SITE_URL=https://www.pai-lao.com` + `NEXT_PUBLIC_BASE_URL=...` บน Vercel ให้เป็น canonical เดียว (ตอนนี้ login ใช้ได้เพราะลงทะเบียน redirect ทั้ง www/non-www)
- **Resend (`RESEND_API_KEY`) ยังว่าง** — ต้องตั้ง + verify domain `pai-lao.com` ถึงจะส่งอีเมลยืนยันสมัคร/รีเซ็ตรหัส/ฟอร์มติดต่อได้ (Google login ไม่ต้องใช้)
- บั๊กเล็กที่รู้แล้ว: หน้าแก้ไขโปรไฟล์บังคับ `lastName` (Google บางบัญชีไม่ส่งนามสกุล) · เปลี่ยน username ชนกันแบบ race จะขึ้น error 500 ทั่วไป (DB กันให้อยู่)
- ของเก่ายังค้าง: ตัวเลือก "อนุมัติทริปแล้วอนุมัติสถานที่ PENDING อัตโนมัติไหม" (ยังกดแยก)

**ไอเดียที่เสนอไว้ ยังไม่ทำ:** ระยะ+เวลาเดินทางระหว่างจุด, สรุปงบทริป, ก๊อปทริปไปวางแผน, trending, แจ้งเตือนผู้ใช้, ISR หน้า place/trip (ติดที่หน้าใช้ session), สถานที่ใกล้เคียง, lazy map, บีบอัดรูปก่อนอัปโหลด

**คำสั่ง deploy มาตรฐาน (PowerShell):**
```powershell
npx prisma db push   # เฉพาะตอนมีคอลัมน์ใหม่
npx tsc --noEmit
git add -A
git commit -m "..."
git push
```

---
*อัปเดตล่าสุด: เซสชัน Google login (OAuth + onboarding + แก้ username/รหัสผ่าน) + หมุดทริป/ไทม์ไลน์สี + hover-link + descriptionShort — อัปเดตไฟล์นี้ทุกครั้งที่มีงานใหม่*

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
- **scrollbar ถูกซ่อนทั้งเว็บ** (globals `*::-webkit-scrollbar{display:none}`) → กล่อง overflow ที่อยากให้เห็นแถบเลื่อนใช้ class **`.pl-scroll-y`** (คู่กับ `data-lenis-prevent` เสมอ ไม่งั้น Lenis ยึด wheel เลื่อนไม่ได้)
- **Rate limit ใช้ Upstash Redis** (`lib/rateLimit.ts`, `checkRateLimit` เป็น **async** ต้อง await) env `KV_REST_API_URL/KV_REST_API_TOKEN` · IP เชื่อ `x-real-ip` ก่อน (กันสปูฟ) · **fail-open** ถ้า Redis ล่ม
- **Onboarding gate:** JWT มี `onb` (มาจาก `isProfileComplete` ใน `lib/auth`) · `middleware.ts` เด้ง onb=false กลับ edit-profile (matcher ครอบทุกหน้า) · **onb เป็น derived ไม่มี column ใน DB** · token เก่าที่ไม่มี onb = ถือว่าผ่าน · ทุกที่ที่ signToken ต้องคำนวณ onb ให้ครบ
- **email verify/reset token เก็บเป็น SHA-256** (`lib/tokens.ts` → `hashToken`) — เทียบตอน verify ต้อง `hashToken(input)` ก่อน lookup ห้ามเทียบ plaintext
- **sanitize-server เป็น regex (หลุด `<svg/onload>` ได้)** — ถ้าจะอัปเกรดใช้ **`sanitize-html` เท่านั้น** ห้าม isomorphic-dompurify ฝั่ง server (jsdom ทำ /api crash)
- **logout ต้องเคลียร์ cookie ลง response (maxAge 0)** + client ใช้ `window.location` ไม่ใช่ router.push (ไม่งั้น onb gate เด้งกลับ ติดกับดัก)
- **timeline nested create มี 6 จุด** (POST trips, PUT admin, PUT PENDING/REJECTED, draft save, draft finalize, pending-edits approve) — เพิ่ม field ใหม่ใน TimelineStop ต้องเติม**ให้ครบทุกจุด** (เคยตก rating/lat/lng ที่ approve และ transport/cost/tips ที่ draft)
- **Prisma `where.OR` ทับกันได้** — ถ้ามีสองเงื่อนไข OR (เช่น ค้นหา + สถานะ) ต้องห่อ `AND: [{OR:...},{OR:...}]` (เคยพังที่ค้นหาแท็บรออนุมัติ)
- **CSP ใน next.config.ts บล็อกเงียบ** — เพิ่ม third-party ใหม่ (สคริปต์/รูป/iframe/fetch) ต้องเติมโดเมนใน directive ที่ตรง (script-src/img-src/frame-src/connect-src) เคยบล็อก GA + avatar Google + YouTube embed มาแล้ว · เช็คได้จาก Console บน prod (error `Refused to ...`) · `ERR_BLOCKED_BY_CLIENT` = adblock ฝั่งผู้ใช้ ไม่ใช่บั้คเรา
- **รีวิวอัตโนมัติ (shareToPlace) มีโค้ด 2 ชุดซ้ำกัน** — `lib/sharedReviews.ts` (ตอนอนุมัติทริป/แก้ไข) + `autoReviewsForApprovedPlace` ใน `admin/places/route.ts` (ตอนอนุมัติสถานที่ทีหลัง) — แก้อะไรต้องแก้คู่กัน
- **คอมโพเนนต์เดียวห้ามมี `<style jsx>` ซ้อน 2 ก้อน** — dev ไม่ฟ้อง แต่ Turbopack **fail ทั้ง build** ตอน deploy → CSS ใหม่ให้เติมในก้อนหลักท้ายไฟล์
- **OG image: ห้ามใส่ `images` ใน generateMetadata** ของหน้าที่มี `opengraph-image.tsx` — จะ override การ์ดที่ generate ทิ้ง
- **satori (ImageResponse) ไม่รองรับ webp + render ตัวอักษรไม่ได้ถ้าไม่มีฟอนต์** — รูปปกต้อง fetch แล้วแปลง JPEG data URI ด้วย sharp ก่อน · ฟอนต์ไทยโหลด subset จาก Google Fonts (ดู loadThaiFont ใน opengraph-image.tsx) · ทุกไฟล์ og ต้องมี fallback ตอนฟอนต์/รูปพัง
- **แก้ `public/sw.js` ต้อง bump `VERSION`** (pl-sw-v1 → v2) ไม่งั้นผู้ใช้ติดแคชเก่า · ปิด PWA ฉุกเฉิน = ก๊อป `scripts/sw-kill.js` ทับ sw.js แล้ว deploy
- **lightbox ทั้งเว็บใช้ตัวกลางตัวเดียว** `components/common/ImageLightbox.tsx` (รับ `src` เดี่ยว หรือ `images[]+startIndex+captions`) — ห้ามเขียน lightbox ใหม่ในหน้าไหนอีก · ยกเว้น avatar lightbox หน้า user (แบบพิเศษ จงใจแยก)

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
- **Security/onboarding (เซสชันล่าสุด):** `lib/rateLimit.ts` (Upstash) · `lib/tokens.ts` (`hashToken`) · `middleware.ts` (onb gate + role-based redirect) · `isProfileComplete` ใน `lib/auth`
- **Google signup 2 ทาง:** `components/auth/GoogleLoginButton.tsx` (prop `intent`) · `/api/auth/google` เก็บ `pl_oauth_intent` cookie · `/api/auth/google/callback` แยก business/user + สร้าง Business record · `/login` มีสองแท็บ
- **ค้นหาสถานที่ในไทม์ไลน์:** `searchPlaces` เรียก `/api/places?q=..&limit=100` · dropdown สูง maxHeight 480 (~8 แถว) + `data-lenis-prevent` + `.pl-scroll-y`
- **Lightbox กลาง:** `components/common/ImageLightbox.tsx` (จุดเดียวทั้งเว็บ) · **OG cards:** `opengraph-image.tsx` ใน trips/place/user segment · **PWA:** `public/sw.js` + `components/PwaRegister.tsx` + `public/icons/icon.svg`

## 6. สถานะล่าสุด (เซสชัน bug-hunt + features ใหญ่ — deploy เป็นช่วง ๆ แล้ว)

**ช่วงสอง — features (ทำต่อจาก bug-hunt วันเดียวกัน):**
1. **Lightbox รวมศูนย์** — ยุบ 5 ชุดเหลือ `common/ImageLightbox.tsx` ตัวเดียว (ปัด/ลูกศร/ESC/ตัวนับ/จุด/ดับเบิลแตะซูม/caption/pointer-capture/data-lenis-prevent/reduced-motion) · จุดเรียก: TripTimeline, TripRichContent, PlaceHero, PlaceGallery×3, PlaceGalleryGrid, CommunityPhotosGallery, แกลเลอรีโปรไฟล์
2. **บีบอัดรูปตอนอัปโหลด (sharp)** — `/api/upload`: หมุนตาม EXIF → ย่อ ≤1920px → WebP q82 → **strip EXIF/GPS** (ปิดงาน privacy ค้าง) · GIF ผ่านตรง · fail-open · **ต้อง `npm install sharp`** · จับตา: ปกใหม่เป็น .webp
3. **OG share cards อัตโนมัติ 3 แบบ** — `opengraph-image.tsx` ใน trips/[slug], place/[slug], user/[username] (PNG 1200×630, ฟอนต์ Chakra Petch, รูปแปลง JPEG ผ่าน sharp, place ไม่มีปกใช้รูป community, กัน leak ของที่ยังไม่อนุมัติ) + `metadataBase` ใน layout
4. **ShareButton อัปเกรด** — ปุ่ม Facebook + prop `text` + ช่องลิงก์+ปุ่มคัดลอก + **fix บั้ค URL ว่าง** (อ่าน location ตอน render บน SSR → ย้ายเข้า useEffect+state, sync prop url ที่มาทีหลัง)
5. **โปรไฟล์นักรีวิว** — แท็บ "แกลเลอรี" (API ใหม่ `/api/users/[username]/photos`, masonry 3/2 คอลัมน์, lazy load, lightbox+caption) + การ์ดแชร์โปรไฟล์ย้ายไว้ล่างสุดใต้ทุกแท็บ (URL สะอาดตัด ?preview=true) + แท็บเป็น segmented แคปซูล 3 ช่อง
6. **PWA เฟสแรก** — `public/sw.js` (network-first, ไม่แตะ /api, kill-switch ใน `scripts/sw-kill.js`), `PwaRegister.tsx` (ปุ่มติดตั้ง dismiss ได้), `/offline`, manifest+icons ครบ, ไอคอนแอปแบบ "หนังสือเดินทาง" (`public/icons/icon.svg` + `scripts/generate-pwa-icons.mjs` รันด้วย node ครั้งเดียว)
7. UI เสนอไว้ยังไม่ทำ: ทิศทางสี A-D (quiet luxury / aurora / dark luxe / bento) + ลูกเล่น (blur-up, route วาดเอง, like burst, scrollytelling) — มี preview ในแชทเก่าแล้ว รอเลือก

## 5.5 เซสชัน re-audit (2026-07-07 บ่าย/เย็น) — แก้ security 5 จุด · ยังไม่ deploy

**งานที่ทำเสร็จเซสชันนี้ (ไม่แตะ DB schema — deploy ไม่ต้อง `prisma db push`):**
1. **SSRF `/api/maps/resolve`** — `lib/maps.ts` เดิมเช็คลิงก์ย่อด้วย regex "มีคำใน string" (`https://evil.com/?maps.app.goo.gl` ผ่าน แล้ว server fetch ตาม) → เปลี่ยนเป็น parse `new URL()` เช็ค **hostname ตรงตัว** + บังคับ `https:` (allowlist: maps.app.goo.gl / goo.gl / g.co) · route เพิ่ม `checkRateLimit(maps-resolve:userId, 20/min)` + จำกัด url ≤ 2048
2. **`/api/contact` rate limit ข้ามได้** — เดิมจำกัดตาม "อีเมลที่ผู้ส่งกรอกเอง" (เปลี่ยนอีเมล = ส่งไม่จำกัด เปลือง Resend) → เพิ่ม `checkRateLimit(contact:ip, 3/10min)` + จำกัด message ≤ 5000, name/email/subject มีเพดาน
3. **`/api/shares` ปั่นได้** — เพิ่ม `checkRateLimit(share:userId, 30/min)` + เปลี่ยนเป็น `updateMany` เงื่อนไข **approved เท่านั้น** (กัน increment ของที่ยังไม่ public)
4. **clamp `limit`/`page`** ใน GET `/api/trips` (เพดาน 50) + `/api/places` (เพดาน **100** เพราะ timeline dropdown ใช้ limit=100) — กัน `limit=999999` ดึงทั้ง DB, `limit=abc`→NaN→500, `page=-1`→skip ติดลบ
5. **จำกัดความยาว text** — รีวิว (`/api/reviews`) + reply (`/api/reviews/[id]/reply`) ≤ 2000 ตัว (กัน DB bloat)

**ต่อด้วย features 2 ตัว (เซสชันเดียวกัน):**
6. **pg_trgm search index** — `prisma/schema.prisma`: เปิด `previewFeatures=["postgresqlExtensions"]` + `extensions=[pg_trgm]` + GIN trgm index ที่คอลัมน์ที่ q ค้นจริง: Place(title/description/province), Trip(title/subtitle), TimelineStop(province) · **deploy รอบนี้ต้อง `npx prisma db push`** (สร้าง extension+index อย่างเดียว ไม่แตะข้อมูล) · ผลการค้นหาเหมือนเดิม แค่เร็วขึ้น
7. **Web Share Target (แชร์รูปจากมือถือเข้าฟอร์มสร้างทริป)** — เฉพาะ PWA ติดตั้งแล้วบน Android/Chrome (iOS ไม่รองรับ):
   - `public/manifest.json` เพิ่ม `share_target` (POST /share-receive, files name="images")
   - `public/sw.js` **bump VERSION v1→v2** + `handleShareTarget` ดัก POST /share-receive → เก็บรูป (สูงสุด 10) ใน cache `*-share` ที่ path `/__pl-share/<n>` → redirect 303 เข้า /trips/create
   - `lib/shareInbox.ts` (ใหม่) — `readSharedFiles()` อ่านรูปจาก share cache แล้วลบทิ้ง (อ่านครั้งเดียวหาย)
   - `app/trips/create/page.tsx` — useEffect ตอน mount เรียก readSharedFiles → append เข้า `galleryFiles`+previews (เข้า upload pipeline เดิม: sharp/EXIF strip/rate limit) · เช็คทุก mount ไม่พึ่ง ?share=1 (กันเคสโดนเด้ง login ก่อน query หาย แต่รูปยังอยู่)
   - `app/share-receive/route.ts` (ใหม่) — fallback ถ้า SW ไม่ active: redirect เข้าฟอร์มเฉย ๆ
   - **เทสบนมือถือ:** ติดตั้ง PWA → แกลเลอรี → แชร์รูป → เลือก "ไปเล่า" → รูปต้องโผล่ในช่องแกลเลอรีของฟอร์ม

**ต่ออีก 2 features (เซสชันเดียวกัน):**
8. **ลบบัญชี self-service + เปลี่ยนใจได้ 7 วัน (PDPA)** —
   - schema: `User.deletionRequestedAt DateTime?` (**ต้อง db push**)
   - `app/api/auth/delete-account/route.ts` — POST ขอลบ (ต้องพิมพ์ username ยืนยัน, แอดมินห้ามใช้, rate limit 5/10นาที) · DELETE ยกเลิก
   - `app/api/cron/purge-deleted-accounts/route.ts` — ลบจริงหลังครบ 7 วัน (cascade เหมือน scripts/delete-users.ts) เช็ค `Authorization: Bearer CRON_SECRET` · เพดาน 100 บัญชี/รอบ · log ACCOUNT_PURGED
   - `vercel.json` เพิ่ม cron `0 20 * * *` (ตี 3 ไทย) — **ต้องตั้ง env `CRON_SECRET` ใน Vercel** (สุ่มยาว ๆ) ไม่ตั้ง = cron ยิงแล้วได้ 401 เฉย ๆ ไม่ลบอะไร
   - UI: `components/account/DeleteAccountSection.tsx` (self-contained, fetch /api/auth/me เอง) ใส่ท้ายหน้า `dashboard/edit-profile` + `business/edit-profile` · โซนแดง → modal พิมพ์ username → แบนเนอร์ส้มนับถอยหลัง + ปุ่มยกเลิก · ระหว่างรอ 7 วันบัญชียังใช้งานได้ปกติ
   - `auth/me` GET เพิ่ม `deletionRequestedAt` ใน response
9. **ปุ่มติดตั้งแอปย้ายเข้าการ์ดแชร์โปรไฟล์** —
   - `PwaRegister.tsx` รื้อ popup ลอยออก (ไม่เด้งกวนอีกแล้ว) เหลือหน้าที่: ลงทะเบียน SW + ดัก `beforeinstallprompt` เก็บใน `window.__plInstallEvt` + ยิง event `pl-install-ready`/`pl-install-done`
   - `components/common/InstallAppButton.tsx` (ใหม่) — โชว์เฉพาะติดตั้งได้จริง (มี event + ไม่ได้อยู่ใน standalone) กดแล้ว prompt ทันที
   - ใส่ใน `.up-share-card` หน้า `user/[username]` (ทุกโปรไฟล์) คู่กับ ShareButton (`.up-share-actions` flex wrap — มือถือปุ่มตกบรรทัดเอง)
   - localStorage key เก่า `pl-pwa-dismissed` ไม่ใช้แล้ว (ทิ้งไว้เฉย ๆ ไม่มีผล)

10. **Planner scroll fix** — กล่องเลื่อน 4 จุดใน `app/planner/page.tsx` (sidebar รายการแผน, คอลัมน์กลาง timeline, แผงขวา places/bookmarks) มี `data-lenis-prevent` แต่ตกหล่น `.pl-scroll-y` → สกอลบาร์ถูกซ่อน ผู้ใช้ไม่รู้ว่าเลื่อนในกล่องได้ + เลื่อนสุดแล้ว scroll ทะลุไปเลื่อนทั้งหน้า (แผงหายขึ้นไปใต้ navbar) → เติม `.pl-scroll-y` ครบ 4 จุด + `overscrollBehavior:"contain"` ที่คอลัมน์กลาง
11. **fix type:** เพิ่ม `ACCOUNT_DELETE_REQUEST`/`ACCOUNT_DELETE_CANCEL` เข้า union `ActivityAction` (lib/activityLogger.ts) — หน้า admin/logs ใช้ `Record<string,...>` + fallback อยู่แล้ว ไม่กระทบ
12. **Card thumbnail (เฉพาะอัปโหลดรอบใหม่ — รูปเก่าไม่แตะ)** — Supabase render/image ใช้ไม่ได้ (Pro plan เท่านั้น) เลยใช้ sharp ทำเองตอนอัปโหลด:
   - `/api/upload`: สร้าง thumb 640px q78 คู่กับไฟล์หลัก · **marker ในชื่อไฟล์**: ไฟล์หลัก `<ts>t.webp` + thumb `<ts>t_thumb.webp` — อัปโหลด thumb ก่อน ถ้าพังตัด marker ทิ้ง (ไฟล์หลักไม่มีวันชี้หา thumb ที่ไม่มีจริง) · GIF ไม่มี thumb
   - `lib/imageUrl.ts` (ใหม่) — `cardThumb(url)`: สลับเป็น `_thumb` เฉพาะ URL storage เราที่มี marker `t` — **รูปเก่า/external/seed ผ่านค่าเดิมเป๊ะ ไม่มี request หา thumb ไม่มี 404**
   - ใช้ที่การ์ด 5 จุด: PlaceCard, StoryCard, AutoGridSection (trip+place), TripSlider (เฉพาะ thumbnail strip — สไลด์ hero ใช้รูปเต็มเหมือนเดิม), BusinessPlaceCard
   - **ห้ามใช้ cardThumb กับ**: OG images, lightbox, hero, หน้า detail (ต้องรูปเต็ม)
   - ผลพลอยได้: การ์ดคอนเทนต์ใหม่โหลดเบาลง ~10 เท่า · thumb กำพร้าเมื่อลบรูปหลัก = ยอมรับ (ขยะชิ้นเล็ก ไม่มีผลการทำงาน)
13. **รีวิว infinite scroll (fix perf: เดิมโหลดรีวิวทั้งหมดทั้งสองหน้า detail)** —
   - หน้า trip + place: `reviews take: 20` + `avgRating` เปลี่ยนเป็น `prisma.review.aggregate` (เดิมเฉลี่ยจากที่โหลด ถ้าตัด 20 จะเพี้ยน) + ส่ง `total={_count.reviews}`
   - **GET `/api/reviews`** (ใหม่) — `?tripId=|placeId=&skip=&take=` (clamp ≤50) + **mask author รีวิวนิรนาม** ก่อนส่ง JSON
   - `TripComments` + `PlaceReviews`: ใช้ `useInfiniteScroll` (hook เดิม, rootMargin 240px) + sentinel ท้ายลิสต์ → เลื่อนใกล้สุดโหลด 20 ถัดไปเอง · dedupe by id (กันรีวิวใหม่ที่เพิ่งโพสต์ทำ offset เขยื้อน) · โหลดพลาด = หยุดเงียบ ไม่พังหน้า
   - **fix บั้คแฝง:** SSR หน้า trip ไม่ได้ส่ง `isAnonymous` → รีวิวนิรนามเคยโชว์ชื่อ/รูปจริง (เติมใน map แล้ว) · หมายเหตุ: JSON props ฝั่ง SSR ยังมี author จริงอยู่ใน HTML source (UI ซ่อนแล้ว) ถ้าจะ mask ระดับ SSR ด้วยเป็นงานรอบหน้า

**Deploy แล้วทั้งชุด (2026-07-14)** — db push (pg_trgm + deletionRequestedAt) + ตั้ง env `CRON_SECRET` ใน Vercel เรียบร้อย

14. **Ambient glow (แสงเรืองสีตามรูปปกหลัง hero)** — `components/common/AmbientGlow.tsx` (client, zero backend) อ่านสีเด่นจากรูปด้วย canvas → radial-gradient เบลอหลัง hero · ทำงานกับรูปเก่าทุกใบ · canvas อ่านข้าม origin ไม่ได้ = ไม่โชว์ (graceful) · ใส่ที่: hero ทริป (`trips/[slug]`), hero สถานที่ (`place/[slug]`), hero โปรไฟล์ (`user/[username]`) — วางเป็น child แรกใน wrapper `position:relative` + hero ได้ `zIndex:1`
15. **Blur placeholder / LQIP (เบลอทันทีก่อนรูปโหลด)** — **db push** (เพิ่ม `Trip.coverBlur` + `Place.coverBlur` nullable):
   - `lib/blurGen.ts` — `blurFromUrl(url)`: server fetch รูป → sharp 32px webp q40 → base64 data-URI · เฉพาะรูป Supabase เรา · fail-open → null (write ไม่มีวันล้ม) · timeout 5s
   - **คำนวณฝั่ง server ตอนบันทึก coverUrl** (ไม่แตะฟอร์ม/typed state client เลย): POST `/api/trips` (create), PUT `trips/[slug]` (admin/finalize/immediate-cover ของ approved), PATCH `admin/places/cover`
   - render: **เลเยอร์ `<img>` เบลอวางหลังรูปจริง** (ไม่ใช้ BlurImage สลับ DOM — กัน overlay เพี้ยน) ที่ hero ทริป+สถานที่ + การ์ด StoryCard/PlaceCard/AutoGridSection(trip+place)/TripSlider · เพิ่ม `coverBlur:true` ใน select ของ `/api/trips` (scored+recent) + `/api/places` · การ์ดรับ `coverBlur?` optional
   - **nullable + fallback:** รูปเก่า/ทุก path ที่ไม่ได้แตะ/blur=null → กล่องเทาเดิม (พฤติกรรมวันนี้) ไม่มีทางแตก · CSP img-src มี `data:` แล้ว
   - `components/common/BlurImage.tsx` มีอยู่ (เผื่อใช้อนาคต) แต่ตอนนี้ทุกจุดใช้เลเยอร์ inline
   - **ยังไม่ครอบ:** `User.coverBlur` (โปรไฟล์ใช้ glow อย่างเดียว), gallery/timeline images, place ที่เสนอโดย user (coverUrl="")

---

## 6.0 (เช้าวันเดียวกัน) เซสชัน bug-hunt: audit ทั้งระบบ + แก้ 8 จุด — deploy แล้ว

**งานที่ทำเสร็จเซสชันนี้ (แก้จาก audit หาบั้คทั้งระบบ):**
1. **pending-edits approve** — เติม `rating`/`lat`/`lng` ที่หายตอนอนุมัติ (หมุดแผนที่+คะแนนจุดแวะเคยหายทั้งทริป) + ห่อ `$transaction` (timeline ไม่หายถ้า update ล้ม) + deleteMany เฉพาะ record `createdAt <= อันที่ตัดสิน` (กัน race ลบการแก้ใหม่ที่ยังไม่ถูกตรวจ) + sanitize `description` ตอน apply
2. **draft save/finalize** — เติม `transport`/`duration`/`cost`/`tips` ที่เคยถูกทิ้ง (ทริปจาก draft เสียข้อมูล 4 field)
3. **CSP (next.config.ts)** — เพิ่ม `*.googleusercontent.com` (avatar Google), `frame-src` YouTube, โดเมน GA4 (script/connect/img) — ก่อนแก้ CSP บล็อก GA ทั้งเว็บ (ไม่เก็บสถิติเลย) + avatar Google + YouTube embed พังเงียบ
4. **shared auto-review ใช้คะแนนจริง** — เดิม hardcode 5 ดาวทั้งสองชุด → ใช้ `stop.rating ?? 5` (Jim เลือก: ไม่ให้คะแนน = 5 เหมือนเดิม) · รีวิว 5 ดาว auto เก่าใน DB ยังค้าง (ไม่มี flag แยก)
5. **POST /api/reviews** — บังคับ XOR `tripId`/`placeId` ฝั่ง server (กันรีวิวลูกผสมโผล่ 2 หน้า) + rating ต้องเป็น integer 1-5 (เดิม `"abc"` ทำ 500)
6. **admin/trips GET** — ค้นหาในแท็บรออนุมัติใช้ได้แล้ว (ย้าย q OR เข้า `AND` ไม่ทับ OR สถานะ)
7. **places/suggest** — อัปเดต `googleMapsUrl` เงียบได้เฉพาะ place ไร้เจ้าของ (`businessId: null`) กันคนสุ่มย้ายหมุดธุรกิจคนอื่น · ส่วน dedup เจอ place REJECTED = ระบบเดิมรองรับแล้ว (TripPlaceCheckWarning ให้ re-approve ได้) ไม่ต้องแก้
8. ผลพลอยได้: `description: null` ใน PendingEdit ไม่ทำ approve พัง 500 อีก (sanitize แปลงเป็น "")

**เซสชันนี้ไม่แตะ DB schema — deploy ไม่ต้อง `prisma db push`**

**จุดเสี่ยงที่เจอจาก audit แต่ยังไม่แก้ (เรียงตามคุ้ม):**
- **ปั่น trending ได้** — `POST /trips|places/[slug]/view` ไม่มี dedup/rate limit + viewCount เข้า trending score
- **owner-edit paths ยังไม่มี transaction** (deleteMany timeline → update ใน `trips/[slug]` 3 จุด — ถ้า update ล้ม timeline หาย เหมือนที่แก้ไปแล้วใน pending-edits)
- **ไม่มี rate limit**: สร้างทริป / รีวิว / suggest place / likes
- **trending/popular ดึงทุกแถวเข้า memory ทุก request** + `GET /api/trips` limit ไม่มีเพดาน → cap + cache
- **ไม่มี unique constraint** `(authorId, placeId)`/`(authorId, tripId)` บน Review (กดรัว = dup ได้)
- **เปลี่ยน coverUrl ทริป approved มีผลทันทีไม่ผ่านตรวจ** (จงใจไว้ — ตัดสินใจเชิง product)
- reset-password เช็คแค่ยาว ≥8 (ไม่บังคับตัวอักษร+เลข เหมือน auth/me) + ไม่ตัด session เดิม → รวมกับงาน token-version

## 6.1 สถานะเซสชันก่อน (security + Google business signup — deploy แล้ว)

**งานที่ทำเสร็จเซสชันนี้:**
1. **Rate limiting → Upstash Redis** — จาก in-memory เป็น sliding window (นับข้าม instance, fail-open) · IP เชื่อ `x-real-ip` (กันสปูฟ) · login เพิ่มลิมิตรายบัญชี · `lib/rateLimit.ts` (async) + 7 route · env `KV_REST_API_URL/KV_REST_API_TOKEN` (Vercel Upstash integration · AWS Tokyo · free)
2. **Google signup แยกสองทาง** — ปุ่ม Google ส่ง `intent` (นักรีวิว=user / เจ้าของสถานที่=business) ผ่าน cookie → callback สร้าง TRAVELER หรือ BUSINESS+Business record (prefill ชื่อ/อีเมล/รูปจาก Google) · `/login` เพิ่มสองแท็บ · `/signup` แท็บเดิม · intent มีผลเฉพาะ**สมัครใหม่** (คนเดิมใช้ role เดิม)
3. **Onboarding gate (บังคับเต็ม) — ไม่มี field ใน DB** — JWT เพิ่ม `onb` + `isProfileComplete` (`lib/auth`) derive จาก phone+gender (traveler) / businessName+phone (business) · `middleware.ts` เด้ง onb=false กลับ edit-profile ตาม role (ยกเว้น onboarding/auth/policy) · ปลดล็อกเมื่อ `auth/me` หรือ `business/me` บันทึกครบ (ออก token ใหม่)
4. **หน้า onboarding บังคับข้อมูล** — `dashboard/edit-profile` บังคับ phone (เลข 9-10) + gender · `business/edit-profile` บังคับ businessName + phone + welcome banner + prefill · `/signup` กันตัวเลขในชื่อ/นามสกุล + เบอร์เลขล้วน + คำแปล EN ใน placeholder
5. **Hash token** — `emailVerifyToken` + `resetToken` เก็บเป็น SHA-256 (`lib/tokens.ts`) · register/resend-verify/forgot เก็บ hash · verify-email/reset-password เทียบด้วย hash (อีเมลส่ง token ดิบ)
6. **Logout fix** — เคลียร์ cookie ลง response (maxAge 0) + `AuthContext.logout` ใช้ `window.location` (หลุด onb gate ไม่เด้งกลับ)
7. **Dark theme + UI** — `policy` + `about` ใช้ CSS var แทนสีตายตัว (การ์ด about ย้ายสีพาสเทลไปชิปไอคอน) · อีเมลติดต่อ → `supportpailao@gmail.com` (policy, faq)
8. **Scroll fix (Lenis)** — dropdown ค้นหาสถานที่ (create+edit) + modals/lists หลายจุด (business dashboard/notifications, user profile, admin approvals/places/missions/sidebar) เติม `data-lenis-prevent` + `.pl-scroll-y` · timeline ค้นหาแสดง ~8 แถว (maxHeight 480) ดึงผลถึง 100 รายการ เลื่อนดูที่เหลือ

**เซสชันนี้ไม่แตะ DB schema** (onb เป็น derived) — deploy ไม่ต้อง `prisma db push`

**ค้าง/ควรทำ (จาก security audit — ยังไม่ทำ, เรียงตามคุ้ม):**
- **#1 แบน/ถอดสิทธิ์ให้มีผลทันที** — ตอนนี้เช็คแบนแค่ตอน login → คนโดนแบน/แอดมินถูกถอดสิทธิ์ยังใช้ token เดิมได้ถึง 7 วัน · JWT มี `onb` + middleware อ่าน token แล้ว → เพิ่ม token-version หรือ ban-check รูปแบบเดียวกันได้ง่ายขึ้น
- **EXIF/GPS strip ตอนอัปโหลดรูป** (privacy — upload เซฟ buffer ดิบ, รูปมือถือมีพิกัด) ต้องลง `sharp`
- **sanitize-server regex → `sanitize-html`** (หลุด `<svg/onload>` ได้ · ตอนนี้กันชั้น render ด้วย DOMPurify ฝั่ง client) — **ห้าม isomorphic-dompurify ฝั่ง server (jsdom ทำ /api crash)**
- **validate ชื่อ (ห้ามเลข)/เบอร์ ฝั่ง server** (ตอนนี้กันแค่ UI)
- ~~security headers~~ → มีครบใน next.config.ts แล้ว (เซสชัน bug-hunt เติมโดเมนที่ CSP บล็อกผิด)
- **self-service ลบบัญชี/ขอข้อมูล (PDPA)** — policy รับรองไว้แต่ยังไม่มี UI
- **เก็บกวาด Business record `businessName=""`** (Google business ที่ทิ้งกลางทาง)
- ของเดิม: ตั้ง env canonical www + ตั้ง Resend (`RESEND_API_KEY`) + verify domain `pai-lao.com`

**ไอเดียเดิม ยังไม่ทำ:** ระยะ+เวลาเดินทางระหว่างจุด, สรุปงบทริป, ก๊อปทริปไปวางแผน, trending, แจ้งเตือนผู้ใช้, ISR place/trip, สถานที่ใกล้เคียง, lazy map, บีบอัดรูป

**คำสั่ง deploy มาตรฐาน (PowerShell):**
```powershell
npx prisma db push   # เฉพาะตอนมีคอลัมน์ใหม่
npx tsc --noEmit
git add -A
git commit -m "..."
git push
```

---
*อัปเดตล่าสุด: 2026-07-14 — re-audit แก้ security 5 จุด + pg_trgm + Web Share Target + ลบบัญชี 7 วัน (Cron+CRON_SECRET) + ปุ่มติดตั้งแอปในการ์ดแชร์ + planner scroll fix + card thumbnails (marker t) + รีวิว infinite scroll/fix นิรนาม — deploy แล้วทั้งชุด · อัปเดตไฟล์นี้ทุกครั้งที่มีงานใหม่*

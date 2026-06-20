# HANDOFF — บริบทโปรเจกต์ & วิธีทำงาน (อ่านไฟล์นี้ก่อน)

> สำหรับ session ใหม่: อ่านไฟล์นี้ + `docs/PROGRESS.md` ก่อนเริ่มงานเสมอ

---

## 1) โปรเจกต์
- **ไปเล่า (Pai-Lao)** — ชุมชนท่องเที่ยวไทย: สถานที่ (~18,400), เรื่องเล่าทริป, วางแผนทริป (Planner), ภารกิจ (Missions), โปรโมชั่น
- Stack: **Next.js 16 (App Router) + TS/React 19 + Prisma + Supabase (Postgres)**, แผนที่ **Leaflet/OSM**, smooth scroll **Lenis**, AI **Google Gemini**
- Deploy: **Vercel** (push git → auto build/deploy), โดเมนจริง **www.pai-lao.com**

## 2) สภาพแวดล้อมการทำงาน (สำคัญมาก — อ่านก่อน)
- **แก้โค้ดได้ตรง ๆ** ด้วย file tools (Read/Write/Edit/Grep/Glob) บน `G:\Project\pai-lao-web` — ใช้ได้เสมอ
- **Linux sandbox (bash) มักพัง** (error `EXDEV`) → **รัน `npm run build`/`tsc`/`python`/ประมวลผลรูป ไม่ได้** จากฝั่งผม
  - ดังนั้น: เขียน/แก้โค้ดได้, แต่ **build, deploy, รันสคริปต์ DB, ลบพื้นหลังรูป = ผู้ใช้ทำเอง**
- **ข้อมูลอยู่ใน Supabase/Postgres ผ่าน Prisma** — ไม่มีไฟล์ data ในเครื่อง อย่าขอให้อัปโหลดไฟล์ข้อมูล
  - แก้/ตรวจ DB: เขียนสคริปต์ `npx tsx scripts/*.ts` (ผู้ใช้รัน) หรือ SQL ใน Supabase
  - **ใช้ `prisma db push` เท่านั้น** ห้าม `migrate` (ไม่มีโฟลเดอร์ migrations → reset = ข้อมูลหาย)
- **ผู้ใช้เทสบน production เป็นหลัก** (pai-lao.com) → โค้ดที่แก้ในเครื่องต้อง **git push → Vercel deploy** ก่อนถึงจะเห็นผล; localhost ต้องล็อกอินแยก (cookie คนละโดเมน)
- env: `.env` ในเครื่อง (gitignored) + ต้องตั้งซ้ำใน **Vercel → Environment Variables** สำหรับ production

## 3) วิธีทำงานกับผู้ใช้ (โทน/กระบวนการ)
- ตอบ **ภาษาไทย กระชับ ตรงประเด็น** ไม่ยืดเยื้อ
- ผู้ใช้ไม่ได้เป็นสายโค้ดลึก → **ผมเขียนโค้ดให้** แล้ว **สรุปเป็น "ชุดคำสั่งให้ VS Code" (handoff doc)** สำหรับสเต็ปที่ผมทำเองไม่ได้ (build/deploy/รันสคริปต์/ใส่ env) — ผู้ใช้ชอบรูปแบบนี้มาก ("ขอพร้อมให้ vscode ทำต่อ")
- ทำงานแบบ **iterative + ส่งสกรีนช็อต** ผู้ใช้มักแปะภาพหน้าจอ/error มา → ผมวิเคราะห์จากภาพ
- งานที่เป็น **ภาพ/แอนิเมชัน** ผู้ใช้ชอบให้ **ทำพรีวิวให้ดูก่อน** (ใช้ visualize widget) แล้วค่อยลงโค้ดจริง
- **เคาะ requirement ก่อนงานใหญ่** ด้วยคำถามสั้น ๆ (ผู้ใช้ตอบเร็ว) แล้วค่อยลงมือ
- **proactive เรื่อง security/bug** — รีวิวแล้วทำเป็นรายงาน + ชุดคำสั่งแก้
- เวลาแนะนำของใหม่/ราคา/ฟรีเทียร์ → **ค้นเว็บก่อน** (ข้อมูลเปลี่ยนบ่อย)

## 4) กฎเหล็ก/บทเรียนเฉพาะโปรเจกต์ (กันพลาดซ้ำ)
- **Lenis กิน wheel ทั้งหน้า** → กล่อง `overflow:auto` ภายในต้องใส่ `data-lenis-prevent` ไม่งั้นเลื่อนไม่ได้
- **Gemini**: ใช้ `gemini-2.5-flash` (2.0 ปลดระวางแล้ว) + ต้อง `generationConfig.thinkingConfig.thinkingBudget: 0` ไม่งั้น thinking กิน token จนผลลัพธ์ถูกตัด; ฟรีเทียร์ ~1,500 req/วัน
- **Server Components** import `MapView` เท่านั้น ห้าม `LeafletMap` ตรง ๆ (window undefined); client component ใช้ `dynamic(..., {ssr:false})` ได้
- **API routes** ใช้ `sanitizeServerHtml` ห้าม import `@/lib/sanitize` ฝั่ง server
- พิกัด WGS84 lat/lng; แผนที่ฟรี OSM ไม่ใช้ Google Maps API
- เก็บพิกัดจุดแวะ planner ใน `googleMapsUrl` (helper `extractLatLngFromGoogleUrl` / `googleMapsPoint`) — ไม่แตะ schema

## 5) งานที่ทำเสร็จใน session ที่ผ่านมา
- **ข้อมูล**: รัน `fix-description-province` แก้ description ค้างจังหวัดเก่า
- **ค้นหาใกล้ฉัน**: API `app/api/places/nearby` + `components/maps/NearbyMap.tsx` (หมุดลาก) + แท็บใน `ExplorerSection` + โหลดการ์ดเพิ่ม (infinite + ปุ่ม) ทั้งสองแท็บ
- **ฉากโหลด**: `components/SplashScreen.tsx` (เวทีนีออน + แมว 2 ตัววิ่ง→ม่านเปิด) mount ใน `layout.tsx`; ใช้รูปแมว `public/images/splash/` (mix-blend หรือ PNG โปร่ง); `scripts/cut-cat-frames.py` สำหรับตัด/ลบพื้น
- **Planner**: แก้สกรอลล์ (data-lenis-prevent) + แผนที่จุดแวะ `components/maps/StopMap.tsx` (สถานที่จริง=ล็อก, จุดแวะเอง=ลากได้) ทั้ง edit modal + ฟอร์ม + หน้าแชร์
- **Security fixes**: validate `googleMapsUrl` (`safeMapUrl` + MapsButton), escape JSON-LD, แก้ Missions แต้มซ้ำ/maxSlots
- **AI เกลาคำ**: `app/api/ai/polish-text` คืน 3 สำนวน (กระชับ/มีชีวิตชีวา/สุภาพ) + `components/common/AIPolish.tsx` ต่อในหน้า `trips/create` — **ทำงานได้แล้ว** ✅

## 6) งานค้าง / ถัดไป (option)
- ต่อ AI เกลาคำในหน้า **แก้ไขทริป** + **แต่ละจุดแวะ** (`<AIPolish mode="stop">`)
- backfill พิกัดจุดแวะเก่า (สคริปต์อยู่ใน HANDOFF-planner-stop-map.md)
- ฟีเจอร์ใหม่ที่คุยไว้: AI วางแผนทริปอัตโนมัติ, หน้าสำรวจบนแผนที่ (clustering), PWA ออฟไลน์, semantic search (pgvector)
- mobile polish: ฉากโหลดจอแคบ (มี media query แล้ว ควรเทสจริง)

## 7) เอกสารในโปรเจกต์ (docs/)
- `PROGRESS.md` — สถานะ+กฎเหล็กเดิม
- `HANDOFF-context.md` — ไฟล์นี้
- `REVIEW-security-mobile.md`, `REVIEW-missions-promotions.md` — รายงานรีวิว
- `INSTRUCTIONS-security-fixes.md`, `INSTRUCTIONS-enable-ai.md`, `INSTRUCTIONS-deploy.md` — ชุดคำสั่ง VS Code
- `HANDOFF-nearby-search.md`, `HANDOFF-planner-stop-map.md`, `HANDOFF-splash-kittens.md` — ส่งมอบรายฟีเจอร์

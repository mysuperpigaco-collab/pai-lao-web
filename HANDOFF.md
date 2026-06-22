# คู่มือส่งมอบงาน · pai-lao (ไปเล่า)

> เปิดไฟล์นี้ตอนเริ่มแชทใหม่ แล้วบอกผู้ช่วยว่า "อ่าน HANDOFF.md ก่อน"

---

## 1. โปรเจกต์คืออะไร

**pai-lao (ไปเล่า / www.pai-lao.com)** — เว็บคอมมูนิตี้ท่องเที่ยวไทย ผู้ใช้เขียน "ทริป" (เรื่องเล่าการเดินทาง พร้อม timeline จุดแวะ) และค้นหา "สถานที่" ทั่วไทย

**Stack:** Next.js 16 (App Router) · React 19.2.4 · Prisma 5.22 · Supabase (Postgres) · TypeScript · styled-jsx · Lenis (smooth scroll)

---

## 2. กฎการทำงานกับผม (Jim) — สำคัญสุด อ่านก่อน

1. **ตอบไทย กระชับ ตรงประเด็น** ตัดคำฟุ่มเฟือย
2. **ฐานข้อมูล: ใช้ `npx prisma db push` เท่านั้น ห้าม `migrate`** (ไม่มีโฟลเดอร์ migrations → migrate/reset = ข้อมูลหาย)
3. **ผม deploy เอง** — sandbox build ไม่ได้ (error EXDEV) ผู้ช่วย **เขียนโค้ดให้เสร็จ + เขียนชุดคำสั่ง git/deploy** ให้ผมรันใน VS Code terminal เอง
4. **งานภาพ/อนิเมชัน/เลย์เอาท์ใหม่ → ทำ PREVIEW ก่อน** (วิดเจ็ต visualize) ให้ผมดูและอนุมัติ ก่อนลงโค้ดจริงเสมอ
5. **เช็คมือถือทุกครั้ง** — ทุกการแก้ UI ต้องดูผลกระทบทั้ง desktop และมือถือ
6. ก่อนงานใหญ่ที่แตะหลายไฟล์ ให้ทำทีละสเต็ป + verify ว่าข้อมูลไม่เพี้ยน
7. ก่อน push ผมจะรัน `npx tsc --noEmit` เอง (sandbox รันไม่ได้) — ผู้ช่วยรีวิวด้วยมือแทน

## 3. กับดักทางเทคนิคที่ต้องระวัง (เคยพลาดมาแล้ว)

- **Lenis จับ wheel ทั้งจอ** → กล่องที่มี `overflow:auto` ต้องใส่ `data-lenis-prevent` ไม่งั้นเลื่อนข้างในไม่ได้
- **scroll position ใช้ `lenis.scroll` ไม่ใช่ `window.scrollY`** · เลื่อนด้วย `lenis.scrollTo(y,{immediate:true,force:true})`
- **"ม่านโหลด" (curtain)** = `app/loading.tsx` + `NavTransition.tsx` (dispatch event `pai-lao:curtain-open`) · หน้า detail re-export ม่านกลาง: `export { default } from "../../loading";`
- **View Transitions / morph เคยลองแล้วถอดออกหมด** — ชนกับม่านโหลด อย่าเอากลับมาเว้นแต่ผมขอ
- **Server Components import `MapView` เท่านั้น** (ไม่ใช่ `LeafletMap`)
- **API routes ใช้ `sanitizeServerHtml` จาก `@/lib/sanitize-server`** (ไม่ใช่ `@/lib/sanitize`)
- **Gemini AI:** ใช้ `gemini-2.5-flash` + `thinkingBudget: 0`
- **Supabase pooler:** port 6543, `pgbouncer=true`, `connection_limit=1`, username ต้องเป็น `postgres.<projectref>` (postgres.cxyhiavxgiraitgvuroj), region ap-northeast-1 (Tokyo), Vercel region hnd1 · ถ้ารหัสมี `@` ต้อง URL-encode (`%40`)
- **styled-jsx scope keyframe** → ถ้าอ้าง animation จาก inline style ให้ฉีด `<style>{\`@keyframes ...\`}</style>` แบบ plain (unscoped) แทน
- **อย่าเปิด path ภายใน `/sessions/...` ให้ผมเห็น** · ถ้า WebFetch โดนบล็อก อย่าเลี่ยงด้วย curl/bash

## 4. โมเดล/แนวคิดหลักในระบบ

- **Trip** — มี `mood` (สไตล์หลัก = moods[0]) + `moods String[]` (multi-select; ถ้าไม่เลือก = ทุกสไตล์) · `approvalStatus` (PENDING/APPROVED/REJECTED) · `timeline` (TimelineStop[])
- **TimelineStop** — มี `placeId` + relation `place` · `shareToPlace` (แชร์รูป/รีวิวไปหน้าสถานที่)
- **Place** — `approvalStatus` + `rejectionReason` · สถานที่ที่ผู้ใช้เสนอผ่าน `/api/places/suggest` จะเป็น PENDING
- **PendingEdit** — แก้ทริปที่ approved แล้วจะสร้าง PendingEdit ให้แอดมินตรวจ (PUT ทริปลบ PendingEdit เก่าก่อนสร้างใหม่ = กันซ้ำซ้อนอยู่แล้ว)
- **ระบบแจ้งเตือนเป็นแบบ derive** (ไม่มี Notification model) — คำนวณสดจากข้อมูล เช่น `/api/reviews/notifications`
- **TRIP_MOODS** อยู่ที่ `data/tripMoods.ts` (แหล่งกลาง ใช้ทั้งฟอร์มและฟิลเตอร์)

## 5. สถานะล่าสุด (ณ ส่งมอบ)

**เพิ่งทำเสร็จ — รอ push (โค้ดเสร็จ, tsc ผ่าน):**
- ระบบ**แจ้งเตือนสถานที่ในทริปถูกปฏิเสธ**:
  - (A) การ์ดแจ้งเตือนในแดชบอร์ด ลิงก์ไปหน้าแก้ไขทริป
  - (B) หน้าแก้ไขทริป: จุด stop ที่ลิงก์สถานที่ถูกปฏิเสธ → การ์ดสีเหลือง + ! กระพริบ กดดูเหตุผล
  - (C) การ์ดทริปในแดชบอร์ด: ! กระพริบมุมซ้ายบน (เลี่ยงป้ายสถานะมุมขวาบน) + hover tooltip
  - (D) กันแก้ซ้ำซ้อน — มีอยู่แล้วในระบบ
  - ไฟล์: `api/trips/[slug]/route.ts`, `api/reviews/notifications/route.ts`, `app/dashboard/page.tsx`, `components/dashboard/StoryCard.tsx`, `app/trips/[slug]/edit/page.tsx`
- **เติมคำแปลอังกฤษ** navbar (+เมนูมือถือ), dashboard, ลิสต์จังหวัด/อำเภอ (place, promotions, search, ProvinceSelect/DistrictSelect) · navbar ซ่อนช่องค้นหา inline ที่ ≤1024px กัน overflow ตอนเปิด promo+mission

**คำสั่ง deploy:**
```bash
npx tsc --noEmit
git add -A && git commit -m "..." && git push
# prisma db push เฉพาะตอนมีคอลัมน์ใหม่เท่านั้น
```

**ค้างเดิม:** ชุด multi-mood (`moods String[]`) ถ้ายังไม่เคยขึ้น ต้อง `npx prisma db push` ก่อน (มีคอลัมน์ใหม่)

## 6. งานใหญ่ที่ทำไปแล้วก่อนหน้า (อ้างอิง)

ปรับ performance หน้า detail (3.6s→275ms ด้วย parallelize queries + index) · restore-on-back หน้าค้นหา (จำ filter+การ์ด+scroll) · ปุ่ม back อัจฉริยะ · sticky filter ใต้ navbar · ExplorerSection ปิด auto-load + ปุ่มโหลดเพิ่ม · redesign หน้า /search · multi-mood ทริป · category chips เต็มแถวพอดี

---
*ไฟล์นี้สร้างเพื่อส่งต่อ context ให้แชทใหม่ — อัปเดตได้เมื่อมีงานใหม่*

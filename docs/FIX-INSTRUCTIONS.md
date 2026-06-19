# คำสั่งแก้ไขความปลอดภัย/บัค สำหรับ Claude Code — pai-lao-web

> เอกสารนี้เขียนให้ AI coding agent (Claude Code ใน VSCode) ทำตามได้ทันที
> แต่ละข้อมี: ไฟล์ + บรรทัด, ปัญหา, โค้ดเดิม, โค้ดใหม่, เกณฑ์ตรวจรับ
> ทำตามลำดับ FIX 1 → 6 (เรียงตามความสำคัญ)

---

## FIX 1 — 🔴 Stored XSS: sanitize เนื้อหาทริปก่อน render และก่อนบันทึก

**สาเหตุ:** `description` เป็น HTML จาก editor ถูก render ด้วย `dangerouslySetInnerHTML` โดยไม่ sanitize และ API เก็บ HTML ดิบลง DB. แพ็กเกจ `isomorphic-dompurify` ติดตั้งแล้วแต่ไม่ถูกใช้

**กลยุทธ์:** sanitize 2 ชั้น — (A) ตอน render ฝั่ง **client** ด้วย DOMPurify, (B) ตอนรับเข้า API ฝั่ง **server** ด้วย regex

> ⚠️ **สำคัญมาก — แยกเป็น 2 ไฟล์:** `isomorphic-dompurify` จะ initialize `jsdom` ตอนถูก import บน server แค่ `import` ที่บรรทัดบนสุดของ API route ก็ทำให้ทั้ง module crash → GET ส่ง 500 (เคยทำให้ `/api/trips` พังมาแล้ว หน้าบ้านไม่มีข้อมูล)
> **กฎเหล็ก:** ห้ามให้ไฟล์ฝั่ง server (API route / Server Component) import `lib/sanitize.ts` เด็ดขาด — ใช้ได้เฉพาะไฟล์ `"use client"`

### 1A-server. สร้าง `lib/sanitize-server.ts` (ใช้ใน API routes — ไม่มี DOM)
```ts
// lib/sanitize-server.ts — ห้าม import อะไรที่แตะ DOM/jsdom
export function sanitizeServerHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")                          // ตัด script ทั้ง block
    .replace(/<\/?(script|iframe|object|embed|style|link|meta|base|form)\b[^>]*>/gi, "") // tag อันตราย
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")                              // event handler on*="..."
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');// javascript: URI
}
```

### 1A-client. สร้าง `lib/sanitize.ts` (ใช้เฉพาะใน client component `"use client"`)
```ts
import DOMPurify from "isomorphic-dompurify";

export function sanitizeRichHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "hr", "h2", "h3", "strong", "em", "u", "s",
      "ul", "ol", "li", "blockquote", "a", "img",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt"],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/)/i, // กัน javascript:, data: (ยกเว้นรูป)
  });
}
```

### 1B. แก้ฝั่ง render — `components/trips/TripRichContent.tsx`
```tsx
import { sanitizeRichHtml } from "@/lib/sanitize";

export default function TripRichContent({ html }: Props) {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const safeHtml = sanitizeRichHtml(html);
  ...
      <div
        className="trip-rich-content"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
        onClick={handleClick}
      />
```

### 1C. แก้หน้า preview — `app/trips/create/page.tsx` บรรทัด 923
เปลี่ยนเป็น (import helper ไว้บนสุดไฟล์):
```tsx
? <div className="pv-main-content trip-rich-content" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(content) }} />
```

### 1D. แก้ฝั่ง server — sanitize ก่อนเขียน DB
ใน `app/api/trips/route.ts` (POST) และ `app/api/trips/[slug]/route.ts` (PUT, ทุกจุดที่ set `description`):
```ts
import { sanitizeServerHtml } from "@/lib/sanitize-server";  // ⚠️ ห้าม import จาก "@/lib/sanitize"
// ...
const safeDescription = description ? sanitizeServerHtml(description) : description;
// แล้วใช้ safeDescription แทน description ในทุก prisma create/update
```
ทำเหมือนกันกับ `app/api/trips/draft/route.ts` ถ้ามีการรับ `description`

**เกณฑ์ตรวจรับ:**
- GET `/api/trips` ต้องคืน **200** (ไม่ใช่ 500) และหน้าแรก/Spotlight มีข้อมูล ← เช็คตัวนี้ก่อน เพราะ import ผิดไฟล์เคยทำพังมาแล้ว
- POST `/api/trips` ด้วย `description: "<img src=x onerror=alert(1)>"` → ค่าที่บันทึกใน DB ต้องไม่มี `onerror`
- หน้า trip detail แสดง `<strong>`, `<img>`, `<a>` ปกติ แต่ event handler/`<script>` หายไป
- `npm run build` ผ่าน

---

## FIX 2 — 🟠 เพิ่ม Content-Security-Policy

**ไฟล์:** `next.config.ts` (array `securityHeaders` บรรทัด 3)

เพิ่ม object นี้เข้าไปใน array:
```ts
{
  key: "Content-Security-Policy",
  value: [
    "default-src 'self'",
    "img-src 'self' https://*.supabase.co https://images.unsplash.com https://picsum.photos https://*.tile.openstreetmap.org data: blob:",
    "script-src 'self' 'unsafe-inline'",   // 'unsafe-inline' จำเป็นชั่วคราวสำหรับ JSON-LD; ดูหมายเหตุ
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
}
```
> 🗺️ เพิ่ม `https://*.tile.openstreetmap.org` ใน img-src ไว้แล้ว (จำเป็นถ้าทำฟีเจอร์แผนที่ ไม่งั้น tile โดนบล็อก)
> หมายเหตุ: ถ้าอยากตัด `'unsafe-inline'` ออกจาก script-src (ปลอดภัยกว่า) ต้องเปลี่ยน JSON-LD ใน `app/trips/[slug]/page.tsx:196` และ `app/place/[slug]/page.tsx:240` ให้ใช้ nonce — ทำทีหลังได้ ไม่บังคับ

**เกณฑ์ตรวจรับ:** เปิดเว็บแล้วดู response header มี `Content-Security-Policy`; รูปจาก supabase/unsplash ยังโหลดได้; หน้าเว็บไม่พัง

---

## FIX 3 — 🟠 Upload: บล็อก SVG และไม่เชื่อ MIME จาก client

**ไฟล์:** `app/api/upload/route.ts` บรรทัด 28

โค้ดเดิม:
```ts
// ตรวจประเภทไฟล์
if (!file.type.startsWith("image/")) {
  return NextResponse.json({ message: "อนุญาตเฉพาะไฟล์รูปภาพ" }, { status: 400 });
}
```
เปลี่ยนเป็น (whitelist เฉพาะ raster image, ตัด svg):
```ts
// ตรวจประเภทไฟล์ — whitelist เฉพาะ raster image (ตัด svg เพราะฝัง script ได้)
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
if (!ALLOWED_MIME.includes(file.type)) {
  return NextResponse.json({ message: "อนุญาตเฉพาะ JPG, PNG, WEBP, GIF, AVIF" }, { status: 400 });
}

// ตรวจ magic bytes กันการปลอม MIME (อ่าน 12 byte แรก)
const head = Buffer.from(await file.slice(0, 12).arrayBuffer());
const isJpeg = head[0] === 0xff && head[1] === 0xd8;
const isPng  = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
const isGif  = head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46;
const isWebp = head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50; // "WEBP"
const isAvif = head.toString("latin1", 4, 8) === "ftyp";
if (!(isJpeg || isPng || isGif || isWebp || isAvif)) {
  return NextResponse.json({ message: "ไฟล์ไม่ใช่รูปภาพที่ถูกต้อง" }, { status: 400 });
}
```
> หมายเหตุ: ฟังก์ชันรับ `await file.arrayBuffer()` อยู่แล้วในบรรทัด 43 — โค้ดข้างบนอ่านเฉพาะ 12 byte แรกก่อน ไม่กระทบของเดิม

**เกณฑ์ตรวจรับ:** อัปโหลด `.svg` หรือไฟล์ที่เปลี่ยนนามสกุลเป็น `.jpg` แต่เนื้อในเป็น html → ถูกปฏิเสธ 400; อัปโหลด jpg/png ปกติ → ผ่าน

---

## FIX 4 — 🟠 ปิดช่องโหว่สิทธิ์ใน admin/users

**ไฟล์:** `app/api/admin/users/route.ts` ฟังก์ชัน `PUT` (หลังบรรทัด 84 ที่เช็ค `userId`)

**ปัญหา:** ADMIN ธรรมดาสามารถลดขั้น/แบน SUPERADMIN หรือ ADMIN คนอื่น และทำกับตัวเองได้

เพิ่มบล็อกนี้ **หลัง** `if (!userId) ...` และ **ก่อน** logic changeRole/ban:
```ts
// ห้ามกระทำกับตัวเอง
if (userId === session.userId) {
  return NextResponse.json({ message: "ไม่สามารถดำเนินการกับบัญชีตัวเองได้" }, { status: 403 });
}

// ดึง role ปัจจุบันของเป้าหมาย
const target = await prisma.user.findUnique({
  where: { id: userId },
  select: { role: true },
});
if (!target) return NextResponse.json({ message: "ไม่พบผู้ใช้" }, { status: 404 });

// การกระทำใด ๆ ต่อ ADMIN/SUPERADMIN ต้องเป็น SUPERADMIN เท่านั้น
if ((target.role === "ADMIN" || target.role === "SUPERADMIN") && session.role !== "SUPERADMIN") {
  return NextResponse.json({ message: "ต้องการสิทธิ์ SUPERADMIN เพื่อจัดการบัญชีแอดมิน" }, { status: 403 });
}
```
(เก็บการเช็คเดิมบรรทัด 87 ที่กันการ "เลื่อนขึ้น" เป็น ADMIN/SUPERADMIN ไว้ตามเดิม)

**เกณฑ์ตรวจรับ:** login เป็น ADMIN → เรียก PUT changeRole/banAccount ใส่ userId ของ SUPERADMIN → ได้ 403; login เป็น SUPERADMIN → ทำได้

---

## FIX 5 — 🐞 DELETE trip ให้ SUPERADMIN ลบได้

**ไฟล์:** `app/api/trips/[slug]/route.ts` บรรทัด 313

โค้ดเดิม:
```ts
if (trip.authorId !== session.userId && session.role !== "ADMIN") {
  return NextResponse.json({ message: "ไม่มีสิทธิ์ลบ" }, { status: 403 });
}
```
เปลี่ยนเป็น:
```ts
const isAdmin = session.role === "ADMIN" || session.role === "SUPERADMIN";
if (trip.authorId !== session.userId && !isAdmin) {
  return NextResponse.json({ message: "ไม่มีสิทธิ์ลบ" }, { status: 403 });
}
```

**เกณฑ์ตรวจรับ:** SUPERADMIN ลบทริปของผู้ใช้อื่นได้

---

## FIX 6 — 🟡 เพิ่ม rate limit ที่ AI endpoint

**ไฟล์:** `app/api/ai/polish-text/route.ts` (หลังเช็ค session บรรทัด 23)

เพิ่ม:
```ts
import { checkRateLimit } from "@/lib/rateLimit";
// ...หลัง if (!session) ...
const rl = checkRateLimit(`ai:${session.userId}`, 20, 60_000); // 20 ครั้ง/นาที/คน
if (!rl.allowed) {
  return NextResponse.json({ error: "ใช้ AI บ่อยเกินไป กรุณารอสักครู่" }, { status: 429 });
}
```

**เกณฑ์ตรวจรับ:** ยิง endpoint เกิน 20 ครั้ง/นาที → ได้ 429

---

## หมายเหตุเพิ่มเติม (ไม่บังคับ แต่แนะนำ)

- **Rate limiter (`lib/rateLimit.ts`)** เป็น in-memory แยกตาม serverless instance → กัน brute-force login ได้ไม่เต็มที่บน Vercel. ระยะยาวควรย้ายไป Upstash Redis (`@upstash/ratelimit`) เฉพาะ endpoint auth
- **Gemini API key** ส่งเป็น `?key=` ใน URL (`polish-text` บรรทัด 37) อาจติด log — เปลี่ยนไปใช้ header `x-goog-api-key` แทนได้
- ตรวจ git history ว่า `.env` ไม่เคยถูก commit: `git log --all --full-history -- .env` (ปัจจุบัน gitignore ถูกต้องแล้ว)

## ลำดับทดสอบหลังแก้ทั้งหมด
```bash
npm run lint
npm run build
npm run test       # ถ้ามี test ครอบคลุม
```

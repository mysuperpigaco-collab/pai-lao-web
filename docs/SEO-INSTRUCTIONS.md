# คำสั่งปรับ SEO สำหรับ Claude Code — pai-lao-web

> เขียนให้ AI coding agent ทำตามได้ทันที: ไฟล์ + บรรทัด, ปัญหา, โค้ด, จุดที่ต้องเทสต์
> ฐาน SEO เดิมดีอยู่แล้ว (sitemap.ts, robots.ts, metadata, GA4, JSON-LD) — นี่คือส่วนเสริมให้สมบูรณ์
> ⚠️ ทั้งหมดเป็น metadata/markup ที่ "มองไม่เห็น" — ไม่กระทบ logic/UI/auth ของเว็บ

ลำดับแนะนำ: STEP 0 (นอกโค้ด) → SEO 1 → 6

---

## STEP 0 — งานนอกโค้ด (สำคัญสุด ทำก่อน)

1. **ตั้ง env `NEXT_PUBLIC_SITE_URL` บน Vercel** ให้เป็นโดเมนจริง (เช่น `https://pai-lao.com`)
   - ⚠️ เป็น `NEXT_PUBLIC_` → ต้อง **redeploy** ถึงมีผล
   - กระทบ: sitemap, canonical, OG, **และลิงก์ในอีเมล** (reset/verify) — ตรวจให้ถูกก่อน
2. **Google Search Console** (search.google.com/search-console): เพิ่ม property → verify (DNS TXT หรือ meta) → Sitemaps → ส่ง `sitemap.xml` → URL Inspection กด Request Indexing หน้าหลัก
3. **Bing Webmaster Tools**: import จาก GSC ได้เลย (ครอบคลุม Bing + ChatGPT Search)

---

## SEO 1 — เพิ่ม `metadataBase` (กัน canonical/OG เพี้ยน)

**ไฟล์:** `app/layout.tsx` ใน object `metadata` (บรรทัด 20)

เพิ่มบรรทัดแรกใน object:
```ts
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://pai-lao-web.vercel.app"),
  title: "ไปเล่า | PAI-LAO EXPERIENCE",
  // ...ของเดิม...
};
```
**เทสต์:** ดู view-source หน้าใด ๆ → `<meta property="og:url">` และ canonical เป็น absolute URL โดเมนจริง

---

## SEO 2 — ⭐ AggregateRating ใน JSON-LD ทริป (ได้ดาวใน Google)

**ไฟล์:** `app/trips/[slug]/page.tsx` object `jsonLd` (บรรทัด 174)

`avgRating` คำนวณไว้แล้ว (บรรทัด 157) แต่ไม่ได้ใส่ลง schema. เพิ่ม field นี้ต่อท้าย object (ก่อนปิด `}`):
```ts
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  // ...ของเดิมทั้งหมด...
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/trips/${slug}` },
  ...(trip.reviews.length > 0 && {
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avgRating.toFixed(1),
      reviewCount: trip.reviews.length,
      bestRating: 5,
      worstRating: 1,
    },
  }),
};
```
> หมายเหตุ: Google ต้องการให้ rating "มองเห็นได้บนหน้า" ด้วย — หน้าทริปมีแสดงดาว/คะแนนอยู่แล้วจึงผ่านเกณฑ์

**เทสต์:** วาง URL หน้าทริป (ที่มีรีวิว) ใน Google Rich Results Test (search.google.com/test/rich-results) → ต้องเจอ "Review snippet" ไม่มี error

---

## SEO 3 — ทำ AggregateRating แบบเดียวกันที่หน้าสถานที่

**ไฟล์:** `app/place/[slug]/page.tsx` object `jsonLd` (บรรทัด ~240)

ทำเหมือน SEO 2 แต่:
- ถ้า `@type` เป็น `TouristAttraction` หรือ `Place` ให้ใส่ `aggregateRating` ได้เลย (รองรับ)
- ใช้ค่า avgRating/จำนวนรีวิวของ place
- ถ้ายังไม่มีก็เพิ่ม `address`, `geo` (lat/lng) ถ้ามีข้อมูลพิกัด เพื่อ rich result แผนที่ (Place มี lat/lng อยู่แล้ว)

**เทสต์:** Rich Results Test เจอ rating ของ place

---

## SEO 4 — canonical ต่อหน้า (กัน duplicate content)

ใน `generateMetadata` ของ `app/trips/[slug]/page.tsx` และ `app/place/[slug]/page.tsx` เพิ่ม field `alternates`:
```ts
return {
  title: ...,
  description: ...,
  alternates: { canonical: `${SITE_URL}/trips/${slug}` },  // place ใช้ /place/${slug}
  openGraph: {
    // ...
    images: trip.coverUrl ? [{ url: trip.coverUrl }] : undefined,  // OG image ต่อหน้า
  },
};
```
**เทสต์:** view-source เจอ `<link rel="canonical">` ชี้ URL หน้านั้น และ `og:image` เป็นรูปปกของทริป

---

## SEO 5 — Schema หน้าแรก: WebSite + Organization

**ไฟล์:** `app/page.tsx` — เพิ่ม `<script type="application/ld+json">` ในหน้า (แบบเดียวกับหน้าทริป)

```tsx
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pai-lao-web.vercel.app";

const homeJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ไปเล่า PAI-LAO EXPERIENCE",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={query}` },
      "query-input": "required name=query",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ไปเล่า PAI-LAO EXPERIENCE",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,           // ปรับ path โลโก้จริง
    sameAs: [                               // ใส่โซเชียลจริงถ้ามี
      // "https://www.facebook.com/...",
      // "https://www.tiktok.com/@...",
    ],
  },
];
```
แล้ว render:
```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
```
> ตรวจ path `/search?q=` ให้ตรงกับ route จริงของหน้าค้นหา (`app/search/page.tsx`)

**ผลที่ได้:** sitelinks search box + ข้อมูล Organization (knowledge panel)

---

## SEO 6 — BreadcrumbList ในหน้าทริป/สถานที่

เพิ่มอีก JSON-LD ในหน้าทริป:
```ts
const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "หน้าแรก", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "ทริป", item: `${SITE_URL}/trips` },
    { "@type": "ListItem", position: 3, name: trip.title, item: `${SITE_URL}/trips/${slug}` },
  ],
};
```
render เป็น `<script type="application/ld+json">` เพิ่มอีกตัว (มีหลาย JSON-LD ในหน้าเดียวได้)

**ผล:** Google แสดง breadcrumb แทน URL ดิบใน SERP

---

## ระยะยาว (ไม่บังคับ)

- **sitemap cap 1000:** `app/sitemap.ts` จำกัด `take: 1000` ต่อ type — ถ้าคอนเทนต์โตเกิน ใช้ `generateSitemaps()` ทำ sitemap index
- **เพิ่มโปรไฟล์ public ลง sitemap:** query user ที่ profilePrivacy = PUBLIC เพิ่มใน sitemap.ts (เพิ่ม DB query เล็กน้อย ไม่กระทบหน้าเว็บ)
- **IndexNow:** เวลา publish ทริป/สถานที่ใหม่ ส่ง ping ไป `https://www.bing.com/indexnow?url=...&key=...` ให้เก็บ index เร็วขึ้น
- **Core Web Vitals:** Lenis (smooth scroll) + framer-motion กระทบ LCP/INP ได้ — วัดด้วย PageSpeed Insights, พิจารณา lazy-load ส่วนที่หนัก

## เทสต์รวมหลังทำ
1. `npm run build` ผ่าน
2. Google Rich Results Test ผ่านทั้งหน้าทริป/สถานที่/หน้าแรก
3. view-source เช็ค canonical + og:image ถูกโดเมน
4. หลัง deploy: GSC → URL Inspection ดูว่า index ได้

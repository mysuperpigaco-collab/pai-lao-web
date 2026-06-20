# คำสั่งให้ VS Code ทำต่อ — Security / Bug / Mobile fixes

ทำตามลำดับ แก้ทีละข้อ แล้วรัน `npm run build` ปิดท้าย
(อ้างอิงรายงาน: `docs/REVIEW-security-mobile.md`)

---

## TASK 1 — [Security] validate googleMapsUrl (กัน javascript:/ฟิชชิ่งบนแผนสาธารณะ)

### 1a. ฝั่ง API — `app/api/planner/[id]/route.ts`
เพิ่ม helper บนสุดของไฟล์ (ใต้ import):
```ts
// รับเฉพาะ URL http(s) เท่านั้น (กัน javascript:/data:/ลิงก์แปลก)
function safeMapUrl(u: unknown): string | null {
  if (typeof u !== "string") return null;
  const s = u.trim();
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : null;
}
```
แล้วในส่วน `action === "add-stop"` เปลี่ยน:
```ts
googleMapsUrl: googleMapsUrl?.trim() || null,
```
เป็น:
```ts
googleMapsUrl: safeMapUrl(googleMapsUrl),
```
และในส่วน `action === "update-stop"` เปลี่ยน `googleMapsUrl: googleMapsUrl?.trim() || null,` เป็น `googleMapsUrl: safeMapUrl(googleMapsUrl),` เช่นกัน

### 1b. ฝั่ง component — `components/common/MapsButton.tsx`
ในฟังก์ชัน `handleOpen` เปลี่ยน:
```ts
const handleOpen = () => {
  window.open(url, "_blank", "noopener,noreferrer");
  setOpen(false);
};
```
เป็น:
```ts
const handleOpen = () => {
  if (/^https?:\/\//i.test(url)) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  setOpen(false);
};
```

---

## TASK 2 — [Security] JSON-LD injection (escape `</script>`)

แก้ 2 ไฟล์: `app/trips/[slug]/page.tsx` และ `app/place/[slug]/page.tsx`
หาบรรทัด:
```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
```
เปลี่ยน `__html` เป็น:
```tsx
__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c")
```
(escape `<` กัน title/description ที่ผู้ใช้พิมพ์หลุดออกจาก script tag)

---

## TASK 3 — [Mobile] การ์ดฉากโหลดล้นจอแคบ

ไฟล์ `components/SplashScreen.tsx` ในบล็อก `<style>{` ... `}</style>` เพิ่มท้าย ๆ (ก่อน `@media (prefers-reduced-motion`):
```css
@media (max-width: 380px){
  .sp-card{ padding:24px 22px 20px; }
  .sp-name{ font-size:28px; letter-spacing:3px; }
  .sp-mark{ width:64px; height:64px; font-size:28px; }
  .sp-bar{ width:160px; }
}
```

---

## TASK 4 — [Feature] ปุ่ม "เปิดใน Google Maps" ใต้แผนที่ (ผู้ใช้ขอ)

ไฟล์ `app/planner/page.tsx` — ใน Edit Stop modal ใต้ `<StopMap .../>` (ในบล็อก IIFE ของแผนที่) เพิ่ม:
```tsx
<div style={{ marginTop: 8 }}>
  <MapsButton url={editMaps || googleMapsPoint(center.lat, center.lng)} placeName={editStop.name} variant="text" />
</div>
```
(`MapsButton` กับ `googleMapsPoint` import อยู่แล้วในไฟล์นี้)

---

## TASK 5 — [Feature] แผนที่ในหน้าแชร์ planner สาธารณะ (option)

1. `app/planner/[id]/page.tsx` — แก้ select ของ place ใน stops ให้มีพิกัด:
```ts
place: { select: { id: true, slug: true, title: true, coverUrl: true, googleMapsUrl: true, lat: true, lng: true } },
```
2. ใน `app/planner/[id]/PlanShareView.tsx` — import StopMap (dynamic ssr:false) + `extractLatLngFromGoogleUrl` แล้วเรนเดอร์แผนที่ view-only ต่อจุดที่มีพิกัด:
```tsx
{(() => {
  const c = extractLatLngFromGoogleUrl(stop.googleMapsUrl ?? "")
    ?? (stop.place?.lat != null && stop.place?.lng != null ? { lat: stop.place.lat, lng: stop.place.lng } : null);
  return c ? <StopMap lat={c.lat} lng={c.lng} draggable={false} height={160} /> : null;
})()}
```

---

## TASK 6 — [Bug ค้างจากรอบก่อน] Missions (ดู docs/REVIEW-missions-promotions.md)
- `app/api/admin/missions/route.ts` (PUT APPROVE): กันอนุมัติซ้ำ = แต้มซ้ำ → เช็ค `participant.status === "APPROVED"` ก่อนบวกแต้ม และครอบ update+increment ใน `prisma.$transaction`
- `app/api/missions/[id]/submit/route.ts`: เช็ค `maxSlots` ก่อน upsert (ตอนสร้างใหม่) กันส่งเกินจำนวน

---

## ปิดท้าย
- รัน `npm run build` ให้ผ่าน
- (option) backfill พิกัดจุดแวะเก่า: ดูสคริปต์ใน `docs/HANDOFF-planner-stop-map.md`
- ทดสอบ: planner เพิ่มสถานที่/จุดแวะเอง, เปิดลิงก์แชร์, ฉากโหลดบนมือถือ, ทุกแผงเลื่อนล้อเมาส์ได้

ลำดับความสำคัญ: TASK 1 → 2 (security) → 4 → 3 → 5 → 6

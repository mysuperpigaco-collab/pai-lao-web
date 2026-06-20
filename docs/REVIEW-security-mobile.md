# รีวิว: บั๊ก / Security / มือถือ / ส่วนควรเพิ่ม

รีวิวแบบ static (อ่านโค้ด — sandbox build ไม่ได้) เน้นส่วนที่แตะล่าสุด (planner + map) และจุดเสี่ยงทั่วเว็บ

---

## 🟥 SECURITY (ควรแก้)

### S1. `googleMapsUrl` ของจุดแวะไม่ถูก validate → เสี่ยงลิงก์อันตรายบนแผนสาธารณะ
ผู้ใช้พิมพ์ URL เองได้ใน Edit Stop / ฟอร์มจุดแวะ แล้วบันทึกตรง ๆ (`app/api/planner/[id]/route.ts` add-stop/update-stop — `googleMapsUrl?.trim()` ไม่กรอง scheme)
เมื่อแผนเป็น **สาธารณะ** (`/planner/[id]`) คนอื่นกดปุ่ม "ดูบน Google Maps" → `MapsButton` เรียก `window.open(url)` (`components/common/MapsButton.tsx`)
- เสี่ยง: เจ้าของแผนใส่ `javascript:` / `data:` / ลิงก์ฟิชชิ่ง — dialog บอกว่า "เปิด Google Maps" แต่จริง ๆ เปิด URL อะไรก็ได้
แก้:
- ฝั่ง server (add-stop/update-stop): รับเฉพาะ `http(s)://` (reject `javascript:`/`data:`) ก่อนบันทึก; ดีสุดจำกัด host เป็น google maps / goo.gl
- ฝั่ง `MapsButton`: เช็ค `url.startsWith("http")` ก่อน `window.open`

### S2. JSON-LD injection (เสี่ยง stored XSS จาก title/description ที่ผู้ใช้สร้าง)
`app/trips/[slug]/page.tsx` (บรรทัด ~210) และ `app/place/[slug]/page.tsx` ฝัง:
```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
```
`JSON.stringify` **ไม่ escape** `</script>` → ถ้า trip title/description (ผู้ใช้พิมพ์) มี `</script><script>…` จะหลุดออกจาก ld+json แล้วรันสคริปต์ได้
แก้: escape ก่อนฝัง เช่น
```ts
JSON.stringify(jsonLd).replace(/</g, "\\u003c")
```

### ✅ ที่ตรวจแล้วโอเค
- `app/api/planner/[id]` PUT/DELETE เช็ค `plan.userId !== session.userId` ครบ — **ไม่มี IDOR**
- เนื้อหา rich ของทริป (`TripRichContent`) ผ่าน `sanitizeRichHtml` แล้ว
- `description` ของ place/notes ของ stop เรนเดอร์เป็น text (React escape) — ปลอดภัย
- StopMap/Nearby ใช้ url แค่ parse พิกัด ไม่ได้เอาไปเป็น href

---

## 🟧 บั๊ก / ความถูกต้อง

### B1. จุดแวะเก่าไม่มีพิกัด (ทราบแล้ว)
จุดที่เพิ่มก่อนฟีเจอร์แผนที่ → `googleMapsUrl` ว่าง → Edit ขึ้น "ไม่มีพิกัด"
แก้: ลบ+เพิ่มใหม่ หรือสคริปต์ backfill (มีใน HANDOFF-planner-stop-map.md)

### B2. หน้าแชร์ planner สาธารณะยังไม่โชว์แผนที่
`app/planner/[id]/page.tsx` select ของ place ไม่มี `googleMapsUrl/lat/lng` และ `PlanShareView` ไม่มีแผนที่ — คนเปิดลิงก์แชร์เลยไม่เห็นพิกัด (เห็นแค่ใน editor)
ควรเพิ่ม StopMap (view-only) ในหน้าแชร์ด้วยถ้าต้องการให้ครบ

---

## 📱 มือถือ

### M1. การ์ดโลโก้ฉากโหลดอาจล้นจอแคบ
`SplashScreen` การ์ด padding `32px 46px` + แบรนด์ 36px/letter-spacing 5 → จอ ~320px อาจล้นแนวนอน (ถูก clip ด้วย overflow:hidden)
ควรเพิ่ม media query ลด padding/font เมื่อจอแคบ

### M2. แผนที่ใน modal บนมือถือ
`StopMap` มี `invalidateSize` แล้ว + modal `data-lenis-prevent` → ลาก/ซูมบนทัชน่าจะโอเค ควรเทสจริง: เปิด Edit Stop บนมือถือ ลากหมุด (custom) ว่าลื่นไหม ไม่ชนกับ scroll ของ modal

### ✅ โอเค
- หน้า planner มี media query 3 ระดับ (1100/900/640) ปรับ grid เป็นคอลัมน์เดียวบนมือถือแล้ว
- แท็บ "ใกล้ฉัน" / ExplorerSection ใช้ `useColumns` ปรับจำนวนคอลัมน์ตามจอ

---

## 💡 ส่วนควรเพิ่ม
1. ปุ่ม "เปิดใน Google Maps" ใต้ StopMap (ผู้ใช้เคยถาม) — ใช้ `<MapsButton url={googleMapsPoint(lat,lng)} />`
2. แผนที่ในหน้าแชร์ planner (B2)
3. ปุ่ม "นำทางทั้งทริป" (route ผ่านทุกจุดในวัน) — มี `googleMapsRoute()` ใน lib/maps อยู่แล้ว
4. แก้บั๊ก Missions ที่ค้างจากรอบก่อน (แต้มซ้ำเมื่ออนุมัติซ้ำ / ข้าม maxSlots) — ดู `docs/REVIEW-missions-promotions.md`
5. Rate-limit endpoint ที่เขียนข้อมูล (planner add/update) กัน spam

---

## ลำดับแนะนำ
1. S1 + S2 (security ที่ผู้ใช้คนอื่นกระทบได้)
2. B2 / ปุ่มเปิด Google Maps (ให้ฟีเจอร์แผนที่ครบ)
3. M1 (polish ฉากโหลดมือถือ)
4. บั๊ก Missions ค้าง

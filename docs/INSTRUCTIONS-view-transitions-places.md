# View Transitions (morph) — REMOVED · ม่านโหลดคืนแล้ว

อัปเดต: 2026-06-21 · สถานะ: **เอา morph ออกทั้งหมด, คืนม่านโหลด**

## ทำไมเอาออก
morph การ์ด→รายละเอียด ต้องปิดม่านโหลด (`loading.tsx` คืน null) ที่ route หน้ารายละเอียด
→ ทำให้ **ทุก flow ที่เข้าหน้ารายละเอียดหายม่านโหลด** (dashboard แก้ไข/ดู, spotlight, ดูสถานที่)
ม่านโหลด กับ morph อยู่ร่วมบน route เดียวไม่ได้ → เลือกม่านโหลด (ใช้หลาย flow มากกว่า)

## คืนค่าแล้ว
- `app/place/[slug]/loading.tsx` + `app/trips/[slug]/loading.tsx` → re-export ม่านโหลดเดิม (`export { default } from "../../loading"`)
- ลบ morph wiring ทุกการ์ด: PlaceCard, PlaceHero, hero หน้าทริป, TripCard (/trips), การ์ด /search, AutoGridSection
- การ์ดหน้าแรกกลับเป็น **เปิดแท็บใหม่**: ExplorerSection, AutoGridSection, Spotlight, TripSlider
- ลบ CSS `::view-transition-*` ใน globals.css
- `lib/viewTransition.ts` ยังพักไว้ (ไม่มีใคร import = ไม่ถูก bundle)

## เก็บไว้ (ของดีที่ไม่ชนกับม่าน)
- ✅ **จำสถานะตอน Back** ที่ /place และ /trips (ตัวกรอง + การ์ดที่โหลด + ตำแหน่งเลื่อน) — `lib/placeSearchCache.ts`, `lib/searchStateCache.ts`
  - การ์ด /place, /trips, /search = **แท็บเดิม** (จำเป็นต่อ Back/restore) — มีม่านโหลดคั่นตอนเข้าหน้ารายละเอียดปกติ
- ✅ **ปุ่มย้อนกลับฉลาด** หน้ารายละเอียดสถานที่ (`router.back()` → กลับจุดที่มาจริง)
- ✅ **dropdown จังหวัด/อำเภอเลื่อนได้** (`data-lenis-prevent`)
- ✅ **แถบกรอง sticky ใต้ navbar** (`top:60px`) ที่ /place และ /trips
- ✅ perf หน้ารายละเอียด (Promise.all + index TimelineStop + pooled DB + โซนโตเกียว)

## Deploy
```bash
npx tsc --noEmit
git add -A
git commit -m "revert: remove card morph, restore loading curtain; keep restore-on-back/back/dropdown/sticky"
git push
```

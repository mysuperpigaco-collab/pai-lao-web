# ส่งมอบ: แผนที่จุดแวะในหน้า Planner + แก้สกรอลล์ Lenis

## A) แก้บั๊กสกรอลล์ในหน้า Planner (เสร็จแล้ว)
อาการ: แผงต่าง ๆ ในหน้า `/planner` เลื่อนด้วยล้อเมาส์ไม่ได้
สาเหตุ: `components/SmoothScrollProvider.tsx` ใช้ Lenis โหมด `root` → ดักล้อเมาส์ทั้งหน้า กล่อง `overflow:auto` ภายในเลยไม่เลื่อน
แก้แล้ว: ใส่ `data-lenis-prevent` ที่กล่องสกรอลล์ภายในหน้า planner (รายการแผน, itinerary, แผงค้นหา, แผง bookmarks, modal Edit Stop)

แนวทางให้ VS Code ทำต่อ (ถ้าเจอจุดอื่นทั่วเว็บเลื่อนไม่ได้):
- หา element ที่ตั้ง `overflow:auto/scroll` แล้วเป็นกล่องสกรอลล์ภายใน (ไม่ใช่ทั้งหน้า)
- เพิ่ม attribute `data-lenis-prevent` ที่ element นั้น
- เคสที่พบบ่อย: modal เนื้อหายาว, dropdown สกรอลล์ได้, sidebar, ตารางสกรอลล์แนวตั้ง

## B) แผนที่จุดแวะ (เสร็จแล้ว — ไม่แตะ DB)
**ดีไซน์:** เก็บพิกัดในฟิลด์ `googleMapsUrl` เดิม (ไม่แก้ schema / ไม่ต้อง `prisma db push`)
- helper: `extractLatLngFromGoogleUrl(url)` อ่านพิกัด, `googleMapsPoint(lat,lng)` สร้างลิงก์ (อยู่ใน `lib/maps.ts`)
- สถานที่จริง (มี `placeId`): กด "เพิ่มในแผน" → เก็บ `googleMapsPoint(lat,lng)` ลง `googleMapsUrl` → Edit Stop โชว์แผนที่ **หมุดล็อก ซูม/เลื่อนได้ ลากไม่ได้**
- จุดแวะสร้างเอง: แผนที่ **หมุดลากได้** → บันทึกกลับ `googleMapsUrl`

**ไฟล์ที่เปลี่ยน**
- สร้าง `components/maps/StopMap.tsx` — props: `lat,lng,draggable,onMove,height`; มี `invalidateSize` กันช่องเทาใน modal; จำกัดหมุดในเขตไทย
- แก้ `app/planner/page.tsx`:
  - import `dynamic`, `StopMap` (ssr:false), `extractLatLngFromGoogleUrl`, `googleMapsPoint`, ค่าคงที่ `TH_CENTER`
  - `PlaceResult` เพิ่ม `lat,lng`
  - ปุ่ม "เพิ่มในแผน" (สถานที่จริง) เก็บพิกัดลง googleMapsUrl
  - Edit Stop modal: บล็อกแผนที่ (place=ล็อก, custom=ลาก, ไม่มีพิกัด=ข้อความบอก) + modal `maxHeight:90vh; overflowY:auto` + `data-lenis-prevent`
  - ฟอร์มจุดแวะเอง: แผนที่ลากหมุด

## งานที่เหลือ / ควรทำต่อ (ให้ VS Code)
1. **รัน `npm run build`** ยืนยัน type ทั้งหมด (ฝั่งที่สร้างรัน build ไม่ได้ — sandbox พัง)
2. **จุดแวะเก่า** ที่เพิ่มก่อนอัปเดตนี้จะไม่มีพิกัด (ตอนนั้นไม่ได้เก็บ) → ใน Edit จะขึ้น "ไม่มีพิกัด"
   - ทางแก้ผู้ใช้: ลบแล้วเพิ่มสถานที่ใหม่
   - ทางเลือก (ถ้าต้องการ backfill): เขียนสคริปต์ `scripts/*.ts` วน TripPlanStop ที่ `placeId != null && googleMapsUrl == null` → ดึง place.lat/lng → set `googleMapsUrl = googleMapsPoint(lat,lng)` (รันด้วย `npx tsx`)
3. ทดสอบบน `/planner`:
   - เพิ่มสถานที่จริง → กดแก้ไข → เห็นแผนที่ หมุดล็อก ซูม/เลื่อนได้ ลากหมุดไม่ได้
   - เพิ่มจุดแวะเอง → ลากหมุดได้ → Save → เปิดแก้ไขอีกครั้ง หมุดอยู่ตำแหน่งเดิม
   - แผงทุกคอลัมน์เลื่อนด้วยล้อเมาส์ได้

## ปุ่มจูน
- ความสูงแผนที่: prop `height` ของ `<StopMap>` (เริ่ม 190/180)
- ค่าซูมเริ่มต้น: `zoom={15}` ใน `StopMap.tsx`
- ขอบเขตไทย (clamp หมุด): ค่า `TH` ใน `StopMap.tsx`
- จุดเริ่มจุดแวะเอง: `TH_CENTER` ใน `app/planner/page.tsx`

## (ออปชันที่ผู้ใช้ถาม) เพิ่มปุ่ม "เปิดใน Google Maps" ใต้แผนที่
ใช้ `<MapsButton url={...} />` (มี import อยู่แล้วในหน้า planner) วางใต้ `<StopMap>` โดยส่ง `googleMapsPoint(lat,lng)` หรือ `editMaps`

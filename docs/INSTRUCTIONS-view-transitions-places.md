# View Transitions (หน้าค้นหาสถานที่ → รายละเอียด) — ACTIVE

อัปเดต: 2026-06-20 · สถานะ: **เปิดใช้แล้ว** (หลังเร่งหน้ารายละเอียดเหลือ ~275ms)

## ทำอะไร
คลิกการ์ดในหน้า `/place` → รูปปกการ์ด **ไหลขยายเป็นรูป hero** ในหน้า `/place/[slug]` (shared-element morph)
ใช้ **native View Transitions API ของเบราว์เซอร์** (ไม่พึ่ง React experimental → build ผ่านบน React 19.2.4 stable)

> รอบแรกที่ทำเคยเจอ "จอว่าง" เพราะหน้ารายละเอียดช้า 4 วิ ตอนนี้แก้ให้เหลือ ~275ms แล้ว มอร์ฟเลยลื่น

## ไฟล์ที่เกี่ยวข้อง
- `lib/viewTransition.ts` — helper ครอบ `document.startViewTransition()` เอง (ตั้งชื่อรูปที่คลิก → นำทาง → รอ hero ขึ้น → ลบชื่อ) มี fallback ครบ
- `components/places/PlaceCard.tsx` — prop `vtName`, ref รูปปก, `onClick` เรียก helper (ทำงานเฉพาะเมื่อมี `vtName`)
- `components/places/PlaceHero.tsx` — prop `vtName` → ใส่ `view-transition-name` + `data-vt` ที่รูป hero/gradient
- `app/place/page.tsx` — การ์ดส่ง `vtName` และ **เปิดแท็บเดิม** (เอา `newTab` ออก — จำเป็นต่อ VT)
- `app/place/[slug]/page.tsx` — ส่ง `vtName` ให้ `<PlaceHero>`
- `app/place/[slug]/loading.tsx` — คืน `null` (ไม่ให้ม่านบังมอร์ฟ; หน้าเร็วแล้ว ช่วงว่าง ~300ms เล็กน้อย และตอนคลิกการ์ดมอร์ฟทับอยู่ ไม่เห็นจอว่าง)
- `app/globals.css` — ปิด crossfade ทั้งหน้า (ให้เฉพาะรูปปกไหล) + duration 0.42s + เคารพ reduced-motion

## Deploy
```bash
npx tsc --noEmit     # เช็ก type ก่อน
git add -A
git commit -m "feat(place): shared-element View Transitions (search → detail)"
git push
```

## เช็กลิสต์เทส (หลัง deploy)
- [ ] เดสก์ท็อป Chrome/Edge: คลิกการ์ด → รูปไหลขยายเป็น hero (ไม่กระโดด)
- [ ] มือถือ Chrome/Safari 18+: คลิก → รูปไหลเต็มจอ
- [ ] ปุ่ม Back: ย้อนกลับ `/place` ได้ปกติ
- [ ] การ์ดเปิดแท็บเดิม (เมื่อก่อนเปิดแท็บใหม่ — ตั้งใจ)
- [ ] Firefox: คลิกแล้วเปลี่ยนหน้าปกติ ไม่พัง
- [ ] Reduced motion เปิด: เปลี่ยนหน้าทันที ไม่มีมอร์ฟ
- [ ] โหลดหน้ารายละเอียดตรง ๆ (refresh): ไม่มีม่าน เห็นเนื้อหาเร็ว (ช่วงว่างสั้น ~300ms)

## จำสถานะการค้นหาตอนกด Back (เพิ่มใหม่)
ปัญหา: กด Back กลับ `/place` แล้วรีเซ็ตตัวกรอง + จำนวนการ์ดที่โหลด (infinite scroll) + ตำแหน่งเลื่อน
แก้: `lib/placeSearchCache.ts` เก็บสถานะลง `sessionStorage` แล้ว `app/place/page.tsx` คืนค่าตอน mount
- เก็บ: ตัวกรอง (หมวด/จังหวัด/อำเภอ/เรียง/คำค้น) + การ์ดที่โหลดมาทั้งหมด + หน้า + ตำแหน่งเลื่อน
- ตำแหน่งเลื่อนเก็บแยก key เล็ก ๆ (เขียนทุกเฟรมแบบไม่หน่วง) และคืนด้วย `useLenis().scrollTo(y, {immediate:true})` **หลัง** SmoothScrollProvider รีเซ็ตเป็น 0
- อายุ snapshot 30 นาที, ผูกกับ session (ปิดแท็บ = ล้าง)

พฤติกรรม: กลับมาหน้านี้ (Back หรือเมนู) จะจำการค้นหาล่าสุด — กดปุ่ม "ล้างตัวกรอง" หรือเปิดแท็บใหม่ = เริ่มใหม่
(ถ้าอยากให้กดเมนู "สถานที่" รีเซ็ตเสมอ บอกได้ จะ `clearPlaceSearch()` ตอนคลิกเมนู)

แก้บั๊ก "การ์ดยาว ๆ แล้วโหลดใหม่":
- สาเหตุ: คืน scroll ลงลึก → infinite-scroll sentinel เข้า viewport → ยิง loadMore ทันที → หน้าโตต่อ
- แก้: ปิด infinite-scroll ไว้หลัง restore จนกว่าผู้ใช้จะ **เลื่อนเอง** (wheel/touch/key) — scroll ที่คืนแบบ programmatic ไม่ติดทริกเกอร์ (`armInfinite` state)
- กัน quota เผื่อไว้: เก็บเฉพาะ field ที่การ์ดเรนเดอร์ (`trimPlaceForCache`) เล็กลง 2-3 เท่า

## ปรับได้
- ความเร็วมอร์ฟ: `animation-duration` ใน `globals.css` (ส่วน `::view-transition-group(*)`)
- timeout รอ hero: 700ms ใน `lib/viewTransition.ts` (หน้าเร็ว ~275ms อยู่ใต้ค่านี้สบาย)

## ถ้าอยากปิด
ใน `app/place/page.tsx` ให้การ์ดกลับไป `newTab` และไม่ส่ง `vtName` → VT หยุดทำงานทันที

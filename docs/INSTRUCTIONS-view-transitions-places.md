# ชุดคำสั่ง VS Code — View Transitions (หน้าสถานที่)

> เป้าหมาย: คลิกการ์ดในหน้าค้นหาสถานที่ `/place` → **รูปปกไหลขยาย** ไปเป็นรูป hero ในหน้ารายละเอียด `/place/[slug]` (เหมือนเปิดแอป) แทนที่จะกระโดดเปลี่ยนหน้า · ทำเฉพาะหน้านี้ก่อน

อัปเดต: 2026-06-20

---

## โค้ดแก้เสร็จแล้ว (ผมแก้ให้ในเครื่องแล้ว — คุณแค่ push)

ไฟล์ที่เปลี่ยน:

1. **`lib/viewTransition.ts`** (ใหม่) — helper ครอบ `document.startViewTransition()` เอง: ใส่ `view-transition-name` ให้รูปการ์ดที่คลิก, นำทาง, รอ hero ขึ้นจอ, แล้วลบชื่อทิ้ง · มี fallback ครบ (เบราว์เซอร์ไม่รองรับ / reduced-motion / คลิกเปิดแท็บใหม่ → นำทางปกติ)
2. **`components/places/PlaceCard.tsx`** — เพิ่ม prop `vtName`, ref รูปปก, และ `onClick` เรียก helper (ทำงานเฉพาะตอนมี `vtName`)
3. **`components/places/PlaceHero.tsx`** — เพิ่ม prop `vtName` → ใส่ `view-transition-name` + `data-vt` ที่รูป hero (และพื้นหลัง gradient กรณีไม่มีรูป)
4. **`app/place/page.tsx`** — การ์ดส่ง `vtName={`place-cover-${slug}`}` และ **เลิกเปิดแท็บใหม่** (เอา `newTab` ออก)
5. **`app/place/[slug]/page.tsx`** — ส่ง `vtName={`place-cover-${slug}`}` ให้ `<PlaceHero>`
6. **`app/place/[slug]/loading.tsx`** (ใหม่) — คืน `null` เพื่อ **ปิดม่านโหลด (curtain)** เฉพาะหน้านี้ ไม่งั้นม่านจะบังทรานสิชัน (route อื่นยังมีม่านปกติ)
7. **`app/globals.css`** — ปิด crossfade ของทั้งหน้า (ให้ "เฉพาะรูปปก" ที่ไหล), ตั้ง duration 0.42s, และเคารพ `prefers-reduced-motion`

> ⚠️ ไม่ได้แตะ schema / DB / dependencies — ไม่ต้อง `npm install` หรือ `db push`

---

## ทำไมไม่ใช้ `experimental.viewTransition` ของ Next
ลองแล้วแต่ **React 19.2.4 (stable) ที่โปรเจกต์ใช้ ไม่มี `unstable_ViewTransition`** (ทั้ง runtime และ `@types/react`) → ถ้า import จะ **build บน Vercel พัง** เลยใช้ **native View Transitions API ของเบราว์เซอร์** แทน ซึ่งทำงานบน React stable ได้เลย ไม่ต้องอัปเกรด dependency

---

## ขั้นตอน deploy (ทำใน VS Code)

```bash
# 1) ดูไฟล์ที่เปลี่ยน
git status

# 2) (แนะนำ) เช็ก type ก่อน — ถ้าผ่านค่อย push
npx tsc --noEmit

# 3) commit + push (Vercel จะ auto build/deploy)
git add lib/viewTransition.ts \
        components/places/PlaceCard.tsx \
        components/places/PlaceHero.tsx \
        app/place/page.tsx \
        "app/place/[slug]/page.tsx" \
        "app/place/[slug]/loading.tsx" \
        app/globals.css \
        docs/INSTRUCTIONS-view-transitions-places.md
git commit -m "feat(place): shared-element View Transitions (search → detail)"
git push
```

---

## เช็กลิสต์เทสหลัง deploy (บน pai-lao.com)
- [ ] **เดสก์ท็อป Chrome/Edge**: คลิกการ์ดในหน้า `/place` → รูปปกไหลขยายเป็น hero (ไม่กระโดด)
- [ ] **มือถือ (Chrome Android / Safari iOS 18+)**: คลิกการ์ด → รูปไหลเต็มจอ
- [ ] **ปุ่ม Back ของเบราว์เซอร์**: ย้อนกลับมาหน้า `/place` ได้ปกติ (ไม่ค้าง)
- [ ] **การ์ดเปิดแท็บเดิม** แล้ว (เมื่อก่อนเปิดแท็บใหม่) — ตั้งใจให้เป็นแบบนี้เพื่อให้ทรานสิชันทำงาน
- [ ] **Firefox** (ยังไม่รองรับ): คลิกแล้วเปลี่ยนหน้าปกติ ไม่พัง
- [ ] **เปิด Reduced Motion** (ตั้งค่าระบบ): คลิกแล้วเปลี่ยนหน้าทันที ไม่มีแอนิเมชัน
- [ ] route อื่น ๆ (หน้าแรก, ทริป) ยัง **มีม่านโหลดเหมือนเดิม**
- [ ] Lenis: เลื่อนหน้ารายละเอียดหลังทรานสิชันได้ลื่น ไม่กระตุก

---

## จุดที่อาจต้องปรับ (ถ้าเทสแล้วไม่ถูกใจ)
- **คลิกแล้วรอแป๊บก่อนรูปไหล** (โดยเฉพาะตอน DB ช้า): เพราะเอาม่านโหลดออก หน้าเดิมจะค้างจนหน้ารายละเอียดพร้อม ถ้าหน่วงเกินไป → บอกผม จะใส่ progress bar บาง ๆ ที่ไม่บังรูป หรือปรับ timeout (ตอนนี้ 700ms ใน `lib/viewTransition.ts`)
- **ความเร็ว/ความรู้สึกของการไหล**: ปรับ `animation-duration` ใน `globals.css` (ส่วน `::view-transition-group(*)`)

## วิธี rollback (ถ้าอยากปิดชั่วคราว)
แก้ `app/place/page.tsx` ให้การ์ดกลับไป `newTab` และไม่ส่ง `vtName` — ทรานสิชันจะหยุดทำงานทันที โดยไม่ต้องแตะไฟล์อื่น

---

## ถัดไป (option)
- ขยายไปหน้าอื่น: การ์ดทริป → หน้าทริป (ใช้ helper ตัวเดิม แค่ใส่ `vtName` + `data-vt` ที่รูปปกทริปกับ hero)
- เฟดเปลี่ยนหน้าทั้งเว็บแบบนุ่ม (ต้องคุยเรื่องม่านโหลดเดิมก่อน)

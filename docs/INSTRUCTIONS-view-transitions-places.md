# View Transitions (หน้าสถานที่) — REVERTED + บันทึกบทเรียน

อัปเดต: 2026-06-20 · สถานะ: **ย้อนกลับแล้ว (ปิดฟีเจอร์)**

## เกิดอะไรขึ้น
ลองทำ shared-element morph (การ์ด `/place` → รูป hero `/place/[slug]`) ด้วย native View Transitions API
แต่ **หน้ารายละเอียดโหลดช้า** (server component query หนักหลายตัวต่อกัน) ทำให้:
- ต้องเอาม่านโหลด (`loading.tsx`) ออกเพื่อไม่ให้บังมอร์ฟ → ช่วงรอกลายเป็น **จอว่าง** (navbar+footer แต่กลางว่าง)
- โหลดช้าเกิน timeout ของมอร์ฟ (700ms) → จับภาพ "จอว่าง" แทนรูป → ไม่เหมือนตัวอย่าง

**สรุป: มอร์ฟข้ามหน้าจะสวยได้ก็ต่อเมื่อหน้าปลายทางขึ้นเร็ว** หน้านี้ยังช้าเกินไป

## ย้อนกลับแล้ว (ทุกไฟล์กลับสถานะเดิม)
- `app/place/page.tsx` — การ์ดกลับไปเปิดแท็บใหม่ (`newTab`) เหมือนเดิม
- `app/place/[slug]/page.tsx`, `PlaceHero.tsx`, `PlaceCard.tsx`, `globals.css` — ลบโค้ด VT ออกหมด
- `app/place/[slug]/loading.tsx` — re-export ม่านโหลดเดิม (`export { default } from "../../loading"`) → ม่านกลับมาปกติ
- `lib/viewTransition.ts` — ยัง "พัก" ไว้ (ไม่มีใครเรียกใช้ = ไม่ถูก bundle) เผื่อรื้อมาทำใหม่

> ต้อง **push** เพื่อให้ production กลับมาปกติ (ตอนนี้ pai-lao.com ยังเป็นเวอร์ชันจอว่างถ้า deploy ไปแล้ว)

```bash
git add -A
git commit -m "revert: View Transitions on place page (slow detail render caused blank flash)"
git push
```

## ทางที่ถูกต้องถ้าจะทำ VT ใหม่ (ต้องทำตามลำดับ)
1. **เร่งหน้ารายละเอียดก่อน** — `app/place/[slug]/page.tsx` มี `await` หลายตัวเรียงกัน (findUnique include ลึก + placeLike.count + timelineStop.findMany take 100 + mission.findMany)
   → รวมเป็น `Promise.all` / ตัด include ที่ไม่ต้องโชว์ทันที / ใช้ `loading.tsx` เป็น skeleton เฉพาะส่วน
2. พอหน้าขึ้นเร็ว (<300–400ms) ค่อยกลับมาทำมอร์ฟ — มี `lib/viewTransition.ts` รออยู่
3. หรือทำ VT ในจุดที่หน้าปลายทาง **เบา/เร็ว** อยู่แล้วแทน (เช่นภายในหน้าเดียว)

## บทเรียน (กันพลาดซ้ำ)
- อย่าเอา `loading.tsx` ออกเพื่อทำ VT ถ้าหน้าปลายทางช้า → จอว่าง
- มอร์ฟข้ามหน้า = สัญญาว่าหน้าปลายทางเร็ว ต้องวัด TTFB/เวลา query ก่อน

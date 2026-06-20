# คำสั่งให้ VS Code: Deploy ขึ้น production (Vercel)

> สรุป: โค้ดที่แก้ในรอบนี้อยู่บนเครื่องแล้ว แต่ **เว็บจริง (pai-lao.com) ยังรันโค้ดเก่า**
> ต้อง commit + push → Vercel จะ build/deploy ให้อัตโนมัติ

## 0) ตรวจ Environment Variable บน Vercel (สำคัญ)
ก่อน deploy ให้แน่ใจว่า Vercel มี env เหล่านี้ (Project → Settings → Environment Variables, scope = Production):
- `GEMINI_API_KEY` = คีย์ใหม่ (ที่สร้างแทนตัวที่หลุด)
- `DATABASE_URL`, `DIRECT_URL` (เดิม)
- ตัวแปร auth อื่น ๆ ที่เคยตั้ง (เดิม)

ถ้าเพิ่งเพิ่ม/แก้ env ต้อง **Redeploy** ถึงจะมีผล

## 1) ดูว่ามีไฟล์อะไรจะขึ้นบ้าง
```bash
git status
```
(รอบนี้รวมหลายฟีเจอร์: AI เกลาคำ 3 สำนวน, ค้นหาใกล้ฉัน, แผนที่จุดแวะ planner, SplashScreen แมว, แก้ security, แก้สกรอลล์ Lenis ฯลฯ)

## 2) Commit + Push
```bash
git add -A
git commit -m "feat: AI polish (3 styles) + nearby search + planner stop map + splash + security/scroll fixes"
git push
```
Vercel จะเริ่ม build/deploy อัตโนมัติ (~1–3 นาที) ดูสถานะที่ vercel.com → โปรเจกต์

## 3) ถ้า build fail บน Vercel
เปิด build log บน Vercel อ่าน error (มักเป็น TypeScript) แล้วแก้ — จุดที่ควรเช็ก:
- `PlanShareView.tsx` ใช้ `stop.place?.lat/lng` — type ของ place ต้องมี lat/lng
- import/ใช้งานที่เพิ่มใหม่ครบไหม
รันในเครื่องก่อนได้: `npm run build`

## 4) ยืนยันหลัง deploy
1. เปิด `https://www.pai-lao.com/trips/create` (ล็อกอินอยู่แล้ว)
2. พิมพ์เนื้อหา 1–2 ประโยค → กด "✨ เกลาคำด้วย AI"
3. ควรได้ 3 สำนวน
   - ถ้ายัง error: error จะลงท้าย **"(v2)"** = โค้ดใหม่ขึ้นแล้ว และเปิด DevTools → Network → `polish-text` → Response จะมี `_debug { finishReason, rawHead }` → ส่ง 2 ค่านี้มาให้ผมไล่ต่อ
   - ถ้า error **ไม่มี "(v2)"** = ยังเป็นโค้ดเก่า (deploy ยังไม่เสร็จ/ยังไม่ได้ push)

## หมายเหตุ
- ครั้งต่อ ๆ ไปแค่ `git add -A && git commit -m "..." && git push` Vercel จะ deploy ให้เอง
- ทดสอบบน localhost ต้องล็อกอินแยก (cookie คนละโดเมนกับ pai-lao.com) — ถ้าจะใช้ localhost: เปิด `localhost:3000/login` ล็อกอินก่อน

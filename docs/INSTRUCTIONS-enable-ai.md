# คำสั่งให้ VS Code: เปิดใช้งาน AI เกลาคำ (Gemini)

ฟีเจอร์: ปุ่ม "✨ เกลาคำด้วย AI" ในหน้าเขียนทริป → คืน 3 สำนวน (กระชับ/มีชีวิตชีวา/สุภาพ) ให้เลือก

## โค้ดที่ทำเสร็จแล้ว (ไม่ต้องแก้)
- `app/api/ai/polish-text/route.ts` — ใช้ `gemini-2.5-flash`, คืน `options[]` 3 สำนวน (JSON), มี auth + rate-limit
- `components/common/AIPolish.tsx` — ปุ่ม + การ์ดเลือกสำนวน
- `app/trips/create/page.tsx` — ต่อ `<AIPolish value={content} onApply={setContent} mode="overall" />` ใต้ RichTextEditor แล้ว

---

## ขั้นตอนเปิดใช้งาน (ทำตามลำดับ)

### 1) ใส่ API key ลง .env  ← จำเป็น
สร้าง/แก้ไฟล์ `.env` ที่รากโปรเจกต์ เพิ่มบรรทัด (ใช้คีย์ใหม่จาก aistudio.google.com):
```
GEMINI_API_KEY=คีย์ของคุณ
```
- ⚠️ คีย์เดิมที่เคยแคปหน้าจอ/แชร์ออกไป ให้ Delete แล้วสร้างใหม่ (ถือว่าหลุดแล้ว)
- ตรวจว่า `.env` อยู่ใน `.gitignore` (ปกติอยู่แล้ว) — ห้าม commit คีย์

### 2) รีสตาร์ท dev server
```
# หยุด process เดิม (Ctrl+C) แล้ว
npm run dev
```
(env ใหม่ต้องสตาร์ทใหม่เสมอ ไม่งั้นยังอ่านค่าเดิม)

### 3) ทดสอบในแอป
1. ล็อกอินเข้าเว็บ (endpoint ต้องล็อกอิน)
2. ไปหน้า **เขียนทริป** → ช่อง "เรื่องเล่าโดยรวม" พิมพ์ 1–2 ประโยค เช่น
   `ไปเชียงใหม่ 3 วัน อากาศดี กินคาเฟ่เยอะ`
3. กดปุ่ม **"✨ เกลาคำด้วย AI"** → ควรได้การ์ด 3 สำนวน → กด "ใช้อันนี้"

---

## Troubleshooting (เปิด DevTools → Network → ดู request `polish-text`)
| ขึ้นว่า (status) | สาเหตุ / แก้ |
|---|---|
| GEMINI_API_KEY ยังไม่ได้ตั้งค่า (503) | คีย์ยังไม่เข้า / ยังไม่รีสตาร์ท / ชื่อ env ไม่ใช่ `GEMINI_API_KEY` |
| Unauthorized (401) | ยังไม่ได้ล็อกอิน |
| ใช้ AI บ่อยเกินไป (429) | rate-limit ตัวเอง 20/นาที — รอสักครู่ |
| error จาก Gemini (502) | คีย์ผิด/โควต้าหมด (ฟรี 1,500/วัน) — เทสคีย์แยกด้านล่าง |
| AI ตอบกลับไม่ถูกรูปแบบ (502) | นาน ๆ ครั้ง โมเดลตอบไม่เป็น JSON — กด "🔄 ลองใหม่" |

### เทสคีย์แยก (ยืนยันว่าคีย์ดี โดยไม่พึ่งแอป) — PowerShell
```powershell
$key  = "ใส่คีย์"
$body = '{"contents":[{"parts":[{"text":"hello"}]}]}'
$r = Invoke-RestMethod -Method Post -ContentType "application/json" -Body $body -Uri "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$key"
$r.candidates[0].content.parts[0].text
```
พ่นข้อความตอบกลับ = คีย์ใช้ได้

---

## งานต่อ (option — ให้ AI ครบทุกจุด)
1. **หน้าแก้ไขทริป** `app/trips/[slug]/edit/page.tsx` — ใต้ RichTextEditor เพิ่ม
   `<AIPolish value={content} onApply={setContent} mode="overall" />` (import เหมือนหน้า create)
2. **แต่ละจุดแวะ (timeline)** — ใต้ textarea ของ stop เพิ่ม
   `<AIPolish value={item.description} onApply={(t)=>updateTimeline(idx,"description",t)} mode="stop" />`
   (mode `stop` ใช้ prompt บริบทจุดแวะ)
3. รัน `npm run build` ยืนยัน type

## หมายเหตุ
- "ใช้อันนี้" แทนเนื้อหาเดิมด้วยข้อความที่เกลา (รูปที่แทรกในเนื้อหลักจะถูกแทนด้วยข้อความ)
- โควต้าฟรี ~1,500 ครั้ง/วัน รวมทุกผู้ใช้ — ถ้าใช้เยอะค่อยพิจารณา cache หรือ pay-as-you-go

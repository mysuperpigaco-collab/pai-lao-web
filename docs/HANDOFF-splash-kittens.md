# ส่งมอบ: ฉากโหลดแมว (SplashScreen) — งานที่เหลือให้ทำต่อ

ฟีเจอร์: ฉากโหลดเปิดเว็บแบบเวทีนีออน — แมว 2 ตัววิ่งวนรอบโลโก้ "ไปเล่า" ระหว่างโหลด
แล้วม่านเปิด แมววิ่งออกพ้นจอ เผยหน้าเว็บ (โผล่ทุกครั้งที่รีโหลดหน้า)

## โค้ดที่ทำเสร็จแล้ว (ไม่ต้องแก้)
- `components/SplashScreen.tsx` — overlay ฉากโหลดทั้งหมด (เวที, ม่าน, การ์ดโลโก้, แมว, แอนิเมชัน)
- `app/layout.tsx` — mount `<SplashScreen />` ครอบทับเนื้อหาแล้ว
- `scripts/cut-cat-frames.py` — สคริปต์ตัด/ลบพื้นหลังรูปแมว (ออปชัน)

รูปแมวอ้างอิงในโค้ด (`components/SplashScreen.tsx`):
```ts
const CAT_FRAMES: string[][] = [
  ["/images/splash/kitty_1.jpg"], // แมวส้ม (หันขวา)
  ["/images/splash/kitty_2.jpg"], // แมวขาวหัวส้ม (หันขวา)
];
const CAT_BLEND: "screen" | "normal" = "screen"; // screen = ใช้รูปพื้นดำได้เลย
```
ถ้าหาไฟล์ไม่เจอ จะ fallback เป็นแมว SVG อัตโนมัติ (ไม่พัง)

---

## งานที่ต้องทำต่อ (สำหรับ VS Code)

### 1) ย้ายไฟล์รูปแมวเข้า public  ← จำเป็น
ไฟล์อยู่ที่ `scripts/kitty_1.jpg`, `scripts/kitty_2.jpg` ต้องย้ายไป `public/images/splash/`
(โฟลเดอร์ public คือที่ Next serve เป็น URL — โฟลเดอร์ scripts ไม่ถูก serve)

PowerShell:
```powershell
New-Item -ItemType Directory -Force -Path "public\images\splash"
Move-Item "scripts\kitty_1.jpg" "public\images\splash\kitty_1.jpg"
Move-Item "scripts\kitty_2.jpg" "public\images\splash\kitty_2.jpg"
```
จากนั้นเปิด `http://localhost:3000` แล้ว Ctrl+F5 — ควรเห็นแมวจริงในฉากโหลด

### 2) (แนะนำ) ลบพื้นหลังให้คมและพอดีตัว
JPG พื้นยังไม่โปร่ง → ใช้ `mix-blend-mode: screen` ช่วยกลบพื้นเข้มได้ แต่:
- พื้นเทาของ kitty_1 อาจเห็นกล่องจางๆ
- ตัวแมวมีขอบว่างรอบเยอะ → ดูเล็กบนเวที

ทำให้คม/พอดี เลือกอย่างใดอย่างหนึ่ง:

ก. ใช้ remove.bg / Photoshop ลบพื้น + ครอปติดตัวแมว → เซฟเป็น PNG โปร่ง
   ตั้งชื่อ `cat-orange-1.png`, `cat-white-1.png` ใน `public/images/splash/`
   แล้วแก้ใน `SplashScreen.tsx`:
   - `CAT_FRAMES` → ชี้ไฟล์ `.png` ใหม่
   - `CAT_BLEND` → `"normal"`

ข. หรือรันสคริปต์ในเครื่อง (ต้องมี Python):
```powershell
pip install pillow numpy rembg
python scripts/cut-cat-frames.py public/images/splash/kitty_1.jpg --no-mirror --thresh 80
python scripts/cut-cat-frames.py public/images/splash/kitty_2.jpg --no-mirror --thresh 80
```
แล้ว rename ไฟล์ผลลัพธ์เป็น `cat-orange-1.png` / `cat-white-1.png` + แก้ `CAT_FRAMES`/`CAT_BLEND` เหมือนข้อ ก.

### 3) (ออปชัน) ทำขาเดิน (วอล์กไซเคิล)
ใส่หลายเฟรมต่อตัว แล้วโค้ดจะสลับเฟรมอัตโนมัติ:
```ts
const CAT_FRAMES = [
  ["/images/splash/cat-orange-1.png","/images/splash/cat-orange-2.png","/images/splash/cat-orange-3.png"],
  ["/images/splash/cat-white-1.png","/images/splash/cat-white-2.png","/images/splash/cat-white-3.png"],
];
```

---

## ปุ่มจูน (ในไฟล์ SplashScreen.tsx)
- `MIN_SHOW_MS` (2200) — เวลาโชว์ฉากโหลดขั้นต่ำ
- `OPEN_MS` (1600) — ความเร็วม่านเปิด/แมววิ่งออก
- `FRAME_MS` (130) — ความเร็วสลับเฟรมขาเดิน
- ขนาด/ตำแหน่งแมว: CSS `.sp-kit { width / height / margin }`, รัศมีวงวิ่ง `translateX(176px)` ใน `@keyframes sp-orbA/sp-orbB`
- ทิศหันแมว: `.sp-kit-A .cat-img{transform:scaleX(-1)}` (ตัวซ้าย) — ถ้ารูปหันผิดด้านให้ย้าย flip ไป `.sp-kit-B`
- มุมเอียงผนัง: `.sp-wall-l/-r { rotateY(33deg) }`

## เช็กผ่าน
- เปิด `localhost:3000` → เห็นฉากโหลด แมว 2 ตัววิ่งวน → ~2 วิ ม่านเปิด แมววิ่งออกพ้นจอ → เห็นหน้าเว็บ
- รีโหลดหน้า (Ctrl+F5) → ฉากเล่นใหม่ทุกครั้ง
- `npm run build` ผ่าน (สำคัญ — ฝั่งที่สร้างยังรัน build ไม่ได้ ต้องเช็กตรงนี้)

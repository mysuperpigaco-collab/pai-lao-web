"""
cut-cat-frames.py
─────────────────────────────────────────────────────────────
ตัดสไปรท์ชีตแมว (พื้นดำ) ออกเป็นเฟรมเดี่ยว ๆ พื้นหลังโปร่ง สำหรับฉากโหลด (SplashScreen)

ใช้:
  pip install pillow numpy rembg            # rembg = ตัดพื้นหลังแม่นสุด (แนะนำ)
  python scripts/cut-cat-frames.py INPUT.png

ผลลัพธ์: public/images/splash/frame_r{แถว}_c{คอลัมน์}.png (พื้นโปร่ง, หันขวา)
จากนั้นเลือกเฟรมที่สวยที่สุด แล้วเปลี่ยนชื่อเป็น:
  cat-orange-1.png cat-orange-2.png cat-orange-3.png   (แมวส้ม)
  cat-white-1.png  cat-white-2.png  cat-white-3.png    (แมวขาวหัวส้ม)

ออปชัน:
  --no-mirror   ไม่ต้องพลิกซ้าย→ขวา (ถ้าต้นฉบับหันขวาอยู่แล้ว)
  --thresh 28   ค่าความสว่างที่ถือว่าเป็น "พื้นดำ" (0-255, ยิ่งสูงยิ่งลบเยอะ)
"""
import sys, os
import numpy as np
from PIL import Image

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "images", "splash")


def split_bands(mask, axis):
    """หาช่วงที่ 'ไม่ดำ' ตามแกน (axis=1 → แถว, axis=0 → คอลัมน์) คืน list ของ (start,end)"""
    present = mask.any(axis=axis)
    bands, run = [], None
    for i, v in enumerate(present):
        if v and run is None:
            run = i
        elif not v and run is not None:
            if i - run > 8:           # ตัดสัญญาณรบกวนเล็ก ๆ
                bands.append((run, i))
            run = None
    if run is not None:
        bands.append((run, len(present)))
    return bands


def cutout_black(rgb, thresh):
    """ลบพื้นดำที่ 'ติดขอบภาพ' ออก (flood fill จากขอบ) เพื่อกันเจาะรูที่ตา/เงาในตัวแมว"""
    lum = rgb.convert("L")
    arr = np.asarray(lum)
    dark = arr < thresh
    h, w = dark.shape
    from collections import deque
    bg = np.zeros_like(dark, dtype=bool)
    dq = deque()
    for x in range(w):
        for y in (0, h - 1):
            if dark[y, x]:
                dq.append((y, x)); bg[y, x] = True
    for y in range(h):
        for x in (0, w - 1):
            if dark[y, x]:
                dq.append((y, x)); bg[y, x] = True
    while dq:
        y, x = dq.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and dark[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True; dq.append((ny, nx))
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    out = rgb.convert("RGBA")
    out.putalpha(Image.fromarray(alpha))
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        print("ใช้: python scripts/cut-cat-frames.py INPUT.png"); return
    inp = args[0]
    mirror = "--no-mirror" not in sys.argv
    thresh = 28
    if "--thresh" in sys.argv:
        thresh = int(sys.argv[sys.argv.index("--thresh") + 1])

    os.makedirs(OUT_DIR, exist_ok=True)
    img = Image.open(inp).convert("RGB")
    arr = np.asarray(img.convert("L"))
    mask = arr >= thresh                       # ไม่ดำ = ตัวแมว

    try:
        from rembg import remove
        use_rembg = True
    except Exception:
        use_rembg = False
        print("• ไม่พบ rembg → ใช้วิธีลบพื้นดำแบบ flood fill (ติดตั้ง rembg เพื่อผลลัพธ์ดีสุด)")

    rows = split_bands(mask, axis=1)
    n = 0
    for ri, (y0, y1) in enumerate(rows, 1):
        band_mask = mask[y0:y1]
        cols = split_bands(band_mask, axis=0)
        for ci, (x0, x1) in enumerate(cols, 1):
            pad = 6
            cx0, cy0 = max(0, x0 - pad), max(0, y0 - pad)
            cx1, cy1 = min(img.width, x1 + pad), min(img.height, y1 + pad)
            crop = img.crop((cx0, cy0, cx1, cy1))
            cut = remove(crop) if use_rembg else cutout_black(crop, thresh)
            bbox = cut.getbbox()
            if bbox:
                cut = cut.crop(bbox)
            if mirror:
                cut = cut.transpose(Image.FLIP_LEFT_RIGHT)
            fn = os.path.join(OUT_DIR, f"frame_r{ri}_c{ci}.png")
            cut.save(fn)
            n += 1
            print(f"  ✓ {fn}  ({cut.width}x{cut.height})")
    print(f"\nเสร็จ {n} เฟรม → {OUT_DIR}")
    print("เลือกท่าที่สวย แล้ว rename เป็น cat-orange-1..3.png / cat-white-1..3.png")


if __name__ == "__main__":
    main()

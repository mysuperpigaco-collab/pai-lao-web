# ════════════════════════════════════════════════════════════════
#  Colab — เติม "อำเภอ" จริง (+ แก้ "จังหวัด" ที่หลุดขอบ) ด้วย reverse geocode
#  ใช้กับไฟล์ seed-data/{region}.json ที่ได้จาก colab_fetch_places.py
#
#  วิธีใช้:
#   1) ใน Colab อัปโหลด 6 ไฟล์ json เข้าโฟลเดอร์ seed-data/  (หรือถ้าเป็น session เดิมที่เพิ่ง fetch ก็มีอยู่แล้ว)
#      - กดไอคอนโฟลเดอร์ (ซ้าย) → สร้างโฟลเดอร์ seed-data → ลากไฟล์ json เข้าไป
#   2) วางไฟล์นี้ทั้งหมดในเซลล์ → Run
#   3) รอจนเสร็จ (มี cache ~2.5กม. แต่ทั้งประเทศก็ยังนาน ~1-3 ชม. — เปิดทิ้งไว้ อย่าปิดแท็บ)
#   4) ได้ seed-data-fixed.zip ดาวน์โหลด → แตกไปวางทับใน scripts/seed-data/ → import ได้เลย
#
#  ▶ หมายเหตุ: บันทึกไฟล์หลังจบ "แต่ละภาค" ถ้า Colab หลุดกลางทาง ภาคที่เสร็จแล้วจะถูกเซฟไว้
# ════════════════════════════════════════════════════════════════
import json, time, re, urllib.request, urllib.parse, os, zipfile, glob

DIR  = "seed-data"
GRID = 0.025          # ขนาดช่อง cache (~2.5 กม.) — ยิ่งใหญ่ ยิ่งเร็ว แต่ขอบอำเภออาจคลาดนิด
SLEEP = 1.1           # Nominatim policy: 1 req/วิ
_cache = {}

def clean(s, prefix):
    if not s: return None
    s = re.sub(rf"^({prefix})\s*", "", str(s).strip())
    return s if re.search(r"[ก-๙]", s) else None

def revgeo(lat, lng):
    # cache ตามช่อง grid (ปัดพิกัดเข้าใจกลางช่อง)
    cy = round(lat/GRID)*GRID; cx = round(lng/GRID)*GRID
    key = (round(cy,4), round(cx,4))
    if key in _cache: return _cache[key]
    url = "https://nominatim.openstreetmap.org/reverse?" + urllib.parse.urlencode(
        {"lat":lat,"lon":lng,"format":"json","accept-language":"th","zoom":"10","addressdetails":"1"})
    req = urllib.request.Request(url, headers={"User-Agent":"PAI-LAO/3.0 (admin@pai-lao.com)"})
    prov=dist=None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                a = json.loads(r.read()).get("address", {})
            prov = clean(a.get("province") or a.get("state"), "จังหวัด")
            dist = clean(a.get("county") or a.get("city_district") or a.get("district") or a.get("state_district"), "อำเภอ|อ\\.|เขต")
            break
        except Exception as e:
            time.sleep(5)
    time.sleep(SLEEP)
    _cache[key] = (prov, dist)
    return _cache[key]

files = sorted(glob.glob(os.path.join(DIR, "*.json")))
print("ไฟล์ที่จะเติมอำเภอ:", [os.path.basename(f) for f in files], flush=True)
written = []
for fn in files:
    data = json.load(open(fn, encoding="utf-8"))
    print(f"\n=== {os.path.basename(fn)} : {len(data)} ที่ ===", flush=True)
    fixedDist = fixedProv = 0
    for i, p in enumerate(data):
        lat, lng = p.get("lat"), p.get("lng")
        if lat is None or lng is None: continue
        prov, dist = revgeo(lat, lng)
        if dist and dist != p.get("district"):
            p["district"] = dist; fixedDist += 1
        if prov and prov != p.get("province"):
            p["province"] = prov; fixedProv += 1
        if (i+1) % 200 == 0:
            print(f"   {i+1}/{len(data)}  (อำเภอแก้ {fixedDist}, จังหวัดแก้ {fixedProv}, cache {len(_cache)})", flush=True)
    json.dump(data, open(fn,"w",encoding="utf-8"), ensure_ascii=False, indent=2)
    written.append(fn)
    print(f"   ✅ เซฟ {os.path.basename(fn)} — อำเภอแก้ {fixedDist}, จังหวัดแก้ {fixedProv}", flush=True)

z = "seed-data-fixed.zip"
with zipfile.ZipFile(z,"w") as zf:
    for f in written: zf.write(f)
print(f"\nเสร็จ! ดาวน์โหลด {z}", flush=True)
try:
    from google.colab import files; files.download(z)
except Exception: print("(ไม่ใช่ Colab — ไฟล์อยู่ใน seed-data/)")

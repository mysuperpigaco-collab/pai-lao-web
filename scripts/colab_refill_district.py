# ════════════════════════════════════════════════════════════════
#  Colab — RE-FILL เฉพาะอำเภอที่ยังไม่ถูก (อำเภอ=จังหวัดตัวเอง / อำเภอ=ชื่อจังหวัดอื่น)
#  ใช้ต่อจาก colab_fill_district.py — ไฟล์ส่วนใหญ่ถูกแล้ว เหลือ ~2,100 ตัวที่ต้องเติมให้ดีขึ้น
#
#  ทำไมแม่นขึ้น:
#   • zoom=14 (เดิม zoom=10 ได้แค่ระดับจังหวัด → กรุงเทพ/นนทบุรี/ปทุมธานี เลยไม่ลงเขต/อำเภอ)
#   • อ่านหลายฟิลด์: county / city_district / state_district / district / municipality / town / suburb
#   • ปฏิเสธค่าที่เป็น "ชื่อจังหวัด" (กันอำเภอ=ชื่อจังหวัดอื่น) → ถ้าหาไม่ได้จริง ค่อย fallback = จังหวัด
#   • แก้ "จังหวัด" ให้ด้วย ถ้า revgeo มั่นใจ (กันที่ติดขอบ/เกาะถูกป้ายผิดจังหวัด)
#
#  วิธีใช้:
#   1) อัปโหลด 6 ไฟล์ json เข้าโฟลเดอร์ seed-data/  (ชุดที่ผ่าน fill รอบแรกแล้ว)
#   2) วางไฟล์นี้ทั้งหมดในเซลล์เดียว → Run  (เติมแค่ตัวที่ยังไม่ถูก ~40 นาที)
#   3) ได้ seed-data-refilled.zip → แตกทับใน scripts/seed-data/ → check แล้ว import
# ════════════════════════════════════════════════════════════════
import json, time, re, urllib.request, urllib.parse, os, zipfile, glob

DIR   = "seed-data"
GRID  = 0.01          # ~1 กม. (ตัวน้อย รันได้ ไม่ต้องเร็วมาก)
SLEEP = 1.1           # Nominatim: 1 req/วิ
ZOOM  = "14"
_cache = {}

PROVS = set((
 "เชียงใหม่ เชียงราย แม่ฮ่องสอน น่าน พะเยา ลำปาง ลำพูน แพร่ อุตรดิตถ์ ตาก สุโขทัย พิษณุโลก กำแพงเพชร พิจิตร เพชรบูรณ์ "
 "กรุงเทพมหานคร นนทบุรี ปทุมธานี นครปฐม สมุทรสาคร สมุทรสงคราม สมุทรปราการ อ่างทอง สิงห์บุรี ชัยนาท สระบุรี นครสวรรค์ ลพบุรี พระนครศรีอยุธยา อุทัยธานี "
 "ชลบุรี ระยอง จันทบุรี ตราด ฉะเชิงเทรา ปราจีนบุรี สระแก้ว นครนายก "
 "กาญจนบุรี ราชบุรี เพชรบุรี ประจวบคีรีขันธ์ สุพรรณบุรี "
 "นครราชสีมา ขอนแก่น อุดรธานี หนองคาย หนองบัวลำภู บึงกาฬ สกลนคร นครพนม มุกดาหาร อุบลราชธานี ยโสธร ศรีสะเกษ สุรินทร์ บุรีรัมย์ ชัยภูมิ ร้อยเอ็ด มหาสารคาม กาฬสินธุ์ อำนาจเจริญ เลย "
 "สุราษฎร์ธานี ภูเก็ต กระบี่ พังงา ระนอง ชุมพร นครศรีธรรมราช สงขลา สตูล ตรัง พัทลุง ยะลา ปัตตานี นราธิวาส").split())

def clean(s, prefix):
    if not s: return None
    s = re.sub(rf"^({prefix})\s*", "", str(s).strip())
    s = s.strip()
    return s if re.search(r"[ก-๙]", s) else None

DIST_PREF = r"อำเภอ|อ\.|กิ่งอำเภอ|เขต|เทศบาลนคร|เทศบาลเมือง|เทศบาลตำบล|เทศบาล"

def pick_district(a, prov):
    # ไล่ฟิลด์จากระดับ "อำเภอ/เขต" ก่อน แล้วค่อยลงตำบล/แขวงเป็นทางเลือกสุดท้าย
    for k in ("county","city_district","state_district","district","municipality","town","city"):
        v = clean(a.get(k), DIST_PREF)
        if v and v != prov and v not in PROVS:   # ห้ามเป็นชื่อจังหวัด
            return v
    # สุดท้ายจริง ๆ ค่อยรับ suburb (อาจเป็นแขวง/ตำบล)
    v = clean(a.get("suburb"), DIST_PREF)
    if v and v != prov and v not in PROVS:
        return v
    return None

def pick_province(a):
    return clean(a.get("province") or a.get("state"), "จังหวัด")

def revgeo(lat, lng):
    cy = round(lat/GRID)*GRID; cx = round(lng/GRID)*GRID
    key = (round(cy,4), round(cx,4))
    if key in _cache: return _cache[key]
    url = "https://nominatim.openstreetmap.org/reverse?" + urllib.parse.urlencode(
        {"lat":lat,"lon":lng,"format":"json","accept-language":"th","zoom":ZOOM,"addressdetails":"1"})
    req = urllib.request.Request(url, headers={"User-Agent":"PAI-LAO/3.1 (admin@pai-lao.com)"})
    a = {}
    for _ in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                a = json.loads(r.read()).get("address", {})
            break
        except Exception:
            time.sleep(5)
    time.sleep(SLEEP)
    _cache[key] = a
    return a

def needs_refill(p):
    prov, dist = p.get("province"), p.get("district")
    return (not dist) or (dist == prov) or (dist in PROVS)

files = sorted(glob.glob(os.path.join(DIR, "*.json")))
print("ไฟล์:", [os.path.basename(f) for f in files], flush=True)
written = []
for fn in files:
    data = json.load(open(fn, encoding="utf-8"))
    todo = [i for i,p in enumerate(data) if needs_refill(p)]
    print(f"\n=== {os.path.basename(fn)} : {len(data)} ที่ | ต้อง refill {len(todo)} ===", flush=True)
    fixedD = fixedP = stillBad = 0
    for n, i in enumerate(todo):
        p = data[i]
        lat, lng = p.get("lat"), p.get("lng")
        if lat is None or lng is None: continue
        a = revgeo(lat, lng)
        newProv = pick_province(a)
        if newProv and newProv != p.get("province"):
            p["province"] = newProv; fixedP += 1
        prov = p.get("province")
        newDist = pick_district(a, prov)
        if newDist:
            if newDist != p.get("district"): fixedD += 1
            p["district"] = newDist
        else:
            p["district"] = prov   # หาไม่ได้จริง → ใช้จังหวัดเป็น placeholder (ดีกว่าโชว์จังหวัดอื่นผิด)
            stillBad += 1
        if (n+1) % 100 == 0:
            print(f"   {n+1}/{len(todo)}  (อำเภอแก้ {fixedD}, จังหวัดแก้ {fixedP}, ยังหาไม่ได้ {stillBad})", flush=True)
    json.dump(data, open(fn,"w",encoding="utf-8"), ensure_ascii=False, indent=2)
    written.append(fn)
    print(f"   ✅ {os.path.basename(fn)} — อำเภอแก้ {fixedD}, จังหวัดแก้ {fixedP}, ยังหาไม่ได้(=จังหวัด) {stillBad}", flush=True)

z = "seed-data-refilled.zip"
with zipfile.ZipFile(z,"w") as zf:
    for f in written: zf.write(f)
print(f"\nเสร็จ! ดาวน์โหลด {z}", flush=True)
try:
    from google.colab import files; files.download(z)
except Exception:
    print("(ไม่ใช่ Colab — ไฟล์อยู่ใน seed-data/)")

"""
fetch_places_osm.py
────────────────────────────────────────────────────────────────
ดึงข้อมูลสถานที่ท่องเที่ยวไทยจาก OpenStreetMap (Overpass API)
แล้วสร้าง SQL seed file สำหรับ PAI-LAO database

หมวดหมู่ที่ดึง:
  NATURE       → natural=*, tourism=viewpoint/national_park
  TEMPLE       → amenity=place_of_worship (buddhist/hindu)
  CAFE         → amenity=cafe
  FOOD         → amenity=restaurant/food_court
  ACCOMMODATION→ tourism=hotel/motel/hostel/guest_house
  BEACH        → natural=beach
  MARKET       → amenity=marketplace / shop=mall
  ADVENTURE    → tourism=attraction / sport=*
  MUSEUM       → tourism=museum/gallery
  CAMPING      → tourism=camp_site/caravan_site

Usage:
  python scripts/fetch_places_osm.py
Output:
  scripts/output/places_osm.sql
"""

import json
import time
import uuid
import re
import os
import urllib.request
import urllib.parse
from datetime import datetime

# ── Config ────────────────────────────────────────────────────
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
OUTPUT_DIR   = os.path.join(os.path.dirname(__file__), "output")
OUTPUT_FILE  = os.path.join(OUTPUT_DIR, "places_osm.sql")
DEFAULT_IMG  = "/images/default-place.svg"
DELAY_SEC    = 3   # delay ระหว่าง request (ป้องกัน rate limit)
MAX_PER_CAT  = 300 # จำนวนสูงสุดต่อหมวดหมู่

# ── Province list (77 จังหวัด) ────────────────────────────────
PROVINCES = [
    "กรุงเทพมหานคร","กระบี่","กาญจนบุรี","กาฬสินธุ์","กำแพงเพชร",
    "ขอนแก่น","จันทบุรี","ฉะเชิงเทรา","ชลบุรี","ชัยนาท",
    "ชัยภูมิ","ชุมพร","เชียงราย","เชียงใหม่","ตรัง",
    "ตราด","ตาก","นครนายก","นครปฐม","นครพนม",
    "นครราชสีมา","นครศรีธรรมราช","นครสวรรค์","นนทบุรี","นราธิวาส",
    "น่าน","บึงกาฬ","บุรีรัมย์","ปทุมธานี","ประจวบคีรีขันธ์",
    "ปราจีนบุรี","ปัตตานี","พระนครศรีอยุธยา","พะเยา","พังงา",
    "พัทลุง","พิจิตร","พิษณุโลก","เพชรบุรี","เพชรบูรณ์",
    "แพร่","ภูเก็ต","มหาสารคาม","มุกดาหาร","แม่ฮ่องสอน",
    "ยโสธร","ยะลา","ร้อยเอ็ด","ระนอง","ระยอง",
    "ราชบุรี","ลพบุรี","ลำปาง","ลำพูน","เลย",
    "ศรีสะเกษ","สกลนคร","สงขลา","สตูล","สมุทรปราการ",
    "สมุทรสงคราม","สมุทรสาคร","สระแก้ว","สระบุรี","สิงห์บุรี",
    "สุโขทัย","สุพรรณบุรี","สุราษฎร์ธานี","สุรินทร์","หนองคาย",
    "หนองบัวลำภู","อ่างทอง","อำนาจเจริญ","อุดรธานี","อุตรดิตถ์",
    "อุทัยธานี","อุบลราชธานี",
]

# ── Overpass queries per category ─────────────────────────────
QUERIES = {
    "TEMPLE": """
[out:json][timeout:60];
area["name"="ประเทศไทย"]["admin_level"="2"]->.th;
(
  node["amenity"="place_of_worship"]["religion"="buddhist"]["name"~"วัด|เจดีย์|พระ",i](area.th);
  node["amenity"="place_of_worship"]["religion"="hindu"]["name"](area.th);
  node["historic"="temple"]["name"](area.th);
);
out body {MAX};
""",
    "NATURE": """
[out:json][timeout:60];
area["name"="ประเทศไทย"]["admin_level"="2"]->.th;
(
  node["tourism"="viewpoint"]["name"](area.th);
  node["tourism"="national_park"]["name"](area.th);
  node["leisure"="nature_reserve"]["name"](area.th);
  node["natural"="waterfall"]["name"](area.th);
  node["natural"="cave_entrance"]["name"](area.th);
  node["tourism"="attraction"]["natural"]["name"](area.th);
);
out body {MAX};
""",
    "BEACH": """
[out:json][timeout:60];
area["name"="ประเทศไทย"]["admin_level"="2"]->.th;
(
  node["natural"="beach"]["name"](area.th);
  way["natural"="beach"]["name"](area.th);
);
out center body {MAX};
""",
    "CAFE": """
[out:json][timeout:60];
area["name"="ประเทศไทย"]["admin_level"="2"]->.th;
(
  node["amenity"="cafe"]["name"](area.th);
);
out body {MAX};
""",
    "FOOD": """
[out:json][timeout:60];
area["name"="ประเทศไทย"]["admin_level"="2"]->.th;
(
  node["amenity"="restaurant"]["name"](area.th);
  node["amenity"="food_court"]["name"](area.th);
);
out body {MAX};
""",
    "ACCOMMODATION": """
[out:json][timeout:60];
area["name"="ประเทศไทย"]["admin_level"="2"]->.th;
(
  node["tourism"="hotel"]["name"](area.th);
  node["tourism"="motel"]["name"](area.th);
  node["tourism"="hostel"]["name"](area.th);
  node["tourism"="guest_house"]["name"](area.th);
  node["tourism"="resort"]["name"](area.th);
);
out body {MAX};
""",
    "MARKET": """
[out:json][timeout:60];
area["name"="ประเทศไทย"]["admin_level"="2"]->.th;
(
  node["amenity"="marketplace"]["name"](area.th);
  node["shop"="mall"]["name"](area.th);
  node["shop"="market"]["name"](area.th);
);
out body {MAX};
""",
    "MUSEUM": """
[out:json][timeout:60];
area["name"="ประเทศไทย"]["admin_level"="2"]->.th;
(
  node["tourism"="museum"]["name"](area.th);
  node["tourism"="gallery"]["name"](area.th);
  node["historic"="monument"]["name"](area.th);
);
out body {MAX};
""",
    "ADVENTURE": """
[out:json][timeout:60];
area["name"="ประเทศไทย"]["admin_level"="2"]->.th;
(
  node["tourism"="theme_park"]["name"](area.th);
  node["leisure"="water_park"]["name"](area.th);
  node["tourism"="zoo"]["name"](area.th);
  node["tourism"="aquarium"]["name"](area.th);
  node["leisure"="climbing"]["name"](area.th);
);
out body {MAX};
""",
    "CAMPING": """
[out:json][timeout:60];
area["name"="ประเทศไทย"]["admin_level"="2"]->.th;
(
  node["tourism"="camp_site"]["name"](area.th);
  node["tourism"="caravan_site"]["name"](area.th);
);
out body {MAX};
""",
}

# ── Helpers ───────────────────────────────────────────────────
def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9-]", "-", text.lower()).strip("-")

def esc(s: str) -> str:
    """escape single quotes for SQL"""
    return s.replace("'", "''") if s else ""

def get_tag(tags: dict, *keys) -> str:
    for k in keys:
        if k in tags and tags[k]:
            return str(tags[k])
    return ""

# ── Reverse geocoding cache (Nominatim) ──────────────────────
_geo_cache: dict = {}

def reverse_geocode(lat: float, lng: float) -> tuple[str, str]:
    """ดึงจังหวัด+อำเภอจาก lat/lng ผ่าน Nominatim (cache ไว้)"""
    key = f"{lat:.3f},{lng:.3f}"
    if key in _geo_cache:
        return _geo_cache[key]

    url = (f"https://nominatim.openstreetmap.org/reverse"
           f"?lat={lat}&lon={lng}&format=json&accept-language=th")
    req = urllib.request.Request(url, headers={
        "User-Agent": "PAI-LAO/1.0 (place seed script)"
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        addr = data.get("address", {})
        # จังหวัด
        prov = (addr.get("state") or addr.get("province") or
                addr.get("county") or "ไม่ระบุ")
        # ตัด "จังหวัด" ออกจากต้น
        prov = re.sub(r"^จังหวัด", "", prov).strip()
        # อำเภอ
        dist = (addr.get("city_district") or addr.get("suburb") or
                addr.get("town") or addr.get("city") or prov)
        dist = re.sub(r"^(อำเภอ|เขต)", "", dist).strip()
        _geo_cache[key] = (prov, dist)
        time.sleep(0.5)  # Nominatim rate limit: 1 req/sec
        return prov, dist
    except Exception:
        _geo_cache[key] = ("ไม่ระบุ", "ไม่ระบุ")
        return "ไม่ระบุ", "ไม่ระบุ"

def guess_province(tags: dict, lat: float, lng: float) -> str:
    """ดึงชื่อจังหวัดจาก tags ของ OSM ก่อน ถ้าไม่มีค่อย reverse geocode"""
    for key in ["addr:province", "province", "addr:state"]:
        val = get_tag(tags, key)
        if val:
            for prov in PROVINCES:
                if prov in val or val in prov:
                    return prov
    return "ไม่ระบุ"  # จะ fallback ใน make_sql_row

def fetch_overpass(query: str, max_results: int) -> list:
    q = query.replace("{MAX}", str(max_results * 3))  # fetch more, filter later
    data = urllib.parse.urlencode({"data": q}).encode()
    req  = urllib.request.Request(OVERPASS_URL, data=data,
                                   headers={"User-Agent": "PAI-LAO/1.0 (place seed script)"})
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            return json.loads(resp.read())["elements"]
    except Exception as e:
        print(f"  ⚠️  Overpass error: {e}")
        return []

def make_sql_row(place: dict, category: str, counter: list) -> str | None:
    tags = place.get("tags", {})
    name = get_tag(tags, "name", "name:th", "name:en")
    if not name or len(name) < 3:
        return None

    # skip names ที่เป็น English เท่านั้น ถ้า category เป็น temple
    if category == "TEMPLE" and not any('฀' <= c <= '๿' for c in name):
        return None

    name_en = get_tag(tags, "name:en", "int_name")
    lat = place.get("lat") or (place.get("center", {}).get("lat"))
    lng = place.get("lon") or (place.get("center", {}).get("lon"))
    if not lat or not lng:
        return None

    province = guess_province(tags, lat, lng)
    district = get_tag(tags, "addr:district", "addr:subdistrict", "addr:city") or ""

    # ถ้าไม่มีจังหวัด → ใช้ reverse geocoding จาก lat/lng
    if province == "ไม่ระบุ":
        province, geo_dist = reverse_geocode(lat, lng)
        if not district:
            district = geo_dist
    if not district:
        district = province
    address  = get_tag(tags, "addr:full", "addr:street") or ""
    phone    = get_tag(tags, "phone", "contact:phone", "addr:phone")
    website  = get_tag(tags, "website", "contact:website", "url")
    open_hrs = get_tag(tags, "opening_hours")
    maps_url = f"https://www.google.com/maps?q={lat},{lng}"
    desc     = get_tag(tags, "description", "description:th") or \
               f"สถานที่ {name} ตั้งอยู่ใน{province}"

    counter[0] += 1
    pid  = str(uuid.uuid4())
    slug = f"osm-{place['id']}"
    now  = "NOW()"

    name_val    = esc(name)
    name_en_val = esc(name_en) if name_en else "NULL"
    prov_val    = esc(province)
    dist_val    = esc(district)
    addr_val    = esc(address)
    desc_val    = esc(desc)
    open_val    = esc(open_hrs) if open_hrs else "NULL"
    phone_val   = esc(phone) if phone else "NULL"
    web_val     = esc(website) if website else "NULL"
    maps_val    = esc(maps_url)

    return (
        f"INSERT INTO \"Place\" "
        f"(id,slug,title,\"titleEn\",province,district,address,description,"
        f"\"openHours\",phone,website,\"googleMapsUrl\",lat,lng,category,\"coverUrl\","
        f"gallery,tags,amenities,\"approvalStatus\",\"isVerified\","
        f"\"shareCount\",\"viewCount\",\"createdAt\",\"updatedAt\") VALUES ("
        f"'{pid}','{slug}','{name_val}',"
        f"{'NULL' if not name_en else chr(39)+name_en_val+chr(39)},"
        f"'{prov_val}','{dist_val}',"
        f"{'NULL' if not address else chr(39)+addr_val+chr(39)},"
        f"'{desc_val}',"
        f"{'NULL' if not open_hrs else chr(39)+open_val+chr(39)},"
        f"{'NULL' if not phone else chr(39)+phone_val+chr(39)},"
        f"{'NULL' if not website else chr(39)+web_val+chr(39)},"
        f"'{maps_val}',{lat},{lng},"
        f"'{category}'::\"PlaceCategory\","
        f"'{DEFAULT_IMG}',ARRAY[]::TEXT[],ARRAY[]::TEXT[],ARRAY[]::TEXT[],"
        f"'APPROVED',false,0,0,{now},{now}"
        f") ON CONFLICT (slug) DO NOTHING;"
    )

# ── Main ──────────────────────────────────────────────────────
def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    total_count = 0
    slugs_seen  = set()
    rows        = []

    print("🌏 PAI-LAO — ดึงข้อมูลสถานที่จาก OpenStreetMap")
    print(f"   Output: {OUTPUT_FILE}\n")

    for category, query in QUERIES.items():
        print(f"📍 {category} — กำลังดึงข้อมูล...")
        elements = fetch_overpass(query, MAX_PER_CAT)
        print(f"   ได้ {len(elements)} elements จาก Overpass API")

        counter  = [0]
        cat_rows = []
        for elem in elements:
            slug = f"osm-{elem.get('id', '')}"
            if slug in slugs_seen:
                continue
            slugs_seen.add(slug)
            row = make_sql_row(elem, category, counter)
            if row:
                cat_rows.append(row)
            if len(cat_rows) >= MAX_PER_CAT:
                break

        rows.extend(cat_rows)
        total_count += len(cat_rows)
        print(f"   ✅ เพิ่ม {len(cat_rows)} สถานที่\n")
        time.sleep(DELAY_SEC)

    # ── เขียน SQL ─────────────────────────────────────────────
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    header  = f"""-- ============================================================
--  PAI-LAO Places Seed — จาก OpenStreetMap (Overpass API)
--  สร้างเมื่อ: {now_str}
--  จำนวนสถานที่: {total_count}
--  หมายเหตุ: รัน psql หรือ Supabase SQL editor
-- ============================================================

"""
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(header)
        for row in rows:
            f.write(row + "\n")

    print(f"🎉 เสร็จแล้ว! รวม {total_count} สถานที่")
    print(f"   ไฟล์: {OUTPUT_FILE}")
    print(f"\n📋 วิธีนำเข้า:")
    print(f"   เปิด Supabase Dashboard → SQL Editor")
    print(f"   copy เนื้อหาจาก {OUTPUT_FILE} แล้ว Run")

if __name__ == "__main__":
    main()

"""
fetch_places_osm_v2.py — query OSM ทีละจังหวัด (เร็ว + ไม่ต้อง reverse geocode)
Usage: python scripts/fetch_places_osm_v2.py [north|central|east|west|northeast|south|all]
Output: scripts/seed-data/{region}.json
"""
import json, time, math, re, os, sys, urllib.request, urllib.parse
from typing import Optional

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

OVERPASS_SERVERS = [
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
_server_idx = 0

OUT_DIR     = os.path.join(os.path.dirname(__file__), "seed-data")
os.makedirs(OUT_DIR, exist_ok=True)

MAX_PER_PROV = 150   # ต่อหมวดต่อจังหวัด
DUP_DIST_M   = 80
DUP_SIM      = 0.55
DELAY_SEC    = 6     # ระหว่าง request
DEFAULT_IMG  = "/images/default-place.svg"

# ── Region / Province ─────────────────────────────────────────
REGIONS: dict[str, list[str]] = {
    "north": [
        "เชียงใหม่","เชียงราย","แม่ฮ่องสอน","น่าน","พะเยา",
        "ลำปาง","ลำพูน","แพร่","อุตรดิตถ์","ตาก",
        "สุโขทัย","พิษณุโลก","กำแพงเพชร","พิจิตร","เพชรบูรณ์",
    ],
    "central": [
        "กรุงเทพมหานคร","นนทบุรี","ปทุมธานี","นครปฐม",
        "สมุทรสาคร","สมุทรสงคราม","สมุทรปราการ",
        "อ่างทอง","สิงห์บุรี","ชัยนาท","สระบุรี",
        "นครสวรรค์","ลพบุรี","พระนครศรีอยุธยา","อุทัยธานี",
    ],
    "east": [
        "ชลบุรี","ระยอง","จันทบุรี","ตราด",
        "ฉะเชิงเทรา","ปราจีนบุรี","สระแก้ว","นครนายก",
    ],
    "west": [
        "กาญจนบุรี","ราชบุรี","เพชรบุรี","ประจวบคีรีขันธ์","สุพรรณบุรี",
    ],
    "northeast": [
        "นครราชสีมา","ขอนแก่น","อุดรธานี","หนองคาย","หนองบัวลำภู",
        "บึงกาฬ","สกลนคร","นครพนม","มุกดาหาร","อุบลราชธานี",
        "ยโสธร","ศรีสะเกษ","สุรินทร์","บุรีรัมย์","ชัยภูมิ",
        "ร้อยเอ็ด","มหาสารคาม","กาฬสินธุ์","อำนาจเจริญ","เลย",
    ],
    "south": [
        "สุราษฎร์ธานี","ภูเก็ต","กระบี่","พังงา","ระนอง",
        "ชุมพร","นครศรีธรรมราช","สงขลา","สตูล","ตรัง",
        "พัทลุง","ยะลา","ปัตตานี","นราธิวาส",
    ],
}

REGION_LABEL = {
    "north":"ภาคเหนือ","central":"ภาคกลาง","east":"ภาคตะวันออก",
    "west":"ภาคตะวันตก","northeast":"ภาคอีสาน","south":"ภาคใต้",
}

# ── Category queries (per-province area) ─────────────────────
# {PROV} จะถูกแทนด้วยชื่อจังหวัดภาษาไทย
# {MAX}  จะถูกแทนด้วย MAX_PER_PROV

CATEGORY_QUERIES: dict[str, str] = {
    "TEMPLE": """
[out:json][timeout:30];
area["name"="{PROV}"]["admin_level"="4"]->.a;
(
  node["amenity"="place_of_worship"](area.a);
  node["historic"="temple"](area.a);
  node["historic"="ruins"]["name"~"วัด|เจดีย์",i](area.a);
);
out body {MAX};
""",
    "NATURE": """
[out:json][timeout:30];
area["name"="{PROV}"]["admin_level"="4"]->.a;
(
  node["natural"="waterfall"](area.a);
  node["natural"="cave_entrance"](area.a);
  node["tourism"="viewpoint"](area.a);
  node["leisure"="nature_reserve"](area.a);
  node["tourism"="attraction"]["name"~"ดอย|ภู|น้ำตก|ถ้ำ|อุทยาน|หน้าผา|แก่ง",i](area.a);
  node["natural"="peak"]["name"](area.a);
);
out body {MAX};
""",
    "BEACH": """
[out:json][timeout:30];
area["name"="{PROV}"]["admin_level"="4"]->.a;
(
  node["natural"="beach"](area.a);
  way["natural"="beach"](area.a);
  node["tourism"="attraction"]["name"~"หาด|อ่าว|เกาะ|ชายหาด",i](area.a);
  node["leisure"="beach_resort"](area.a);
);
out center body {MAX};
""",
    "MUSEUM": """
[out:json][timeout:30];
area["name"="{PROV}"]["admin_level"="4"]->.a;
(
  node["tourism"="museum"](area.a);
  node["tourism"="gallery"](area.a);
  node["historic"="archaeological_site"](area.a);
  node["historic"="monument"](area.a);
  node["tourism"="attraction"]["name"~"พิพิธภัณฑ์|อนุสาวรีย์|อนุสรณ์|ประวัติ|โบราณ",i](area.a);
);
out body {MAX};
""",
    "MARKET": """
[out:json][timeout:30];
area["name"="{PROV}"]["admin_level"="4"]->.a;
(
  node["amenity"="marketplace"](area.a);
  node["shop"="mall"](area.a);
  node["tourism"="attraction"]["name"~"ตลาด|ถนนคนเดิน|ไนท์|บาซาร์|ช้อปปิ้ง",i](area.a);
  node["landuse"="retail"]["name"~"ตลาด",i](area.a);
);
out body {MAX};
""",
    "ADVENTURE": """
[out:json][timeout:30];
area["name"="{PROV}"]["admin_level"="4"]->.a;
(
  node["tourism"="theme_park"](area.a);
  node["leisure"="water_park"](area.a);
  node["tourism"="zoo"](area.a);
  node["tourism"="aquarium"](area.a);
  node["tourism"="attraction"]["name"~"สวนสนุก|สวนน้ำ|กาชาด|ซาฟารี|สวนสัตว์",i](area.a);
);
out body {MAX};
""",
    "CAMPING": """
[out:json][timeout:30];
area["name"="{PROV}"]["admin_level"="4"]->.a;
(
  node["tourism"="camp_site"](area.a);
  node["tourism"="attraction"]["name"~"แคมป์|แคมปิ้ง|กางเต็นท์",i](area.a);
);
out body {MAX};
""",
}

CAT_TAGS: dict[str, list[str]] = {
    "TEMPLE":    ["วัด","ศาสนา","ไหว้พระ"],
    "NATURE":    ["ธรรมชาติ","ท่องเที่ยว","วิว"],
    "BEACH":     ["ทะเล","ชายหาด","ว่ายน้ำ"],
    "MUSEUM":    ["พิพิธภัณฑ์","ประวัติศาสตร์","วัฒนธรรม"],
    "MARKET":    ["ตลาด","ช้อปปิ้ง","ของฝาก"],
    "ADVENTURE": ["ผจญภัย","สนุก","ครอบครัว"],
    "CAMPING":   ["แคมปิ้ง","ธรรมชาติ","กางเต็นท์"],
}

# ── Helpers ───────────────────────────────────────────────────
def haversine(lat1, lng1, lat2, lng2):
    R = 6371000
    p1,p2 = math.radians(lat1),math.radians(lat2)
    dp = math.radians(lat2-lat1); dl = math.radians(lng2-lng1)
    a = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return R*2*math.atan2(math.sqrt(a),math.sqrt(1-a))

def levenshtein(a, b):
    n,m = len(a),len(b)
    dp = list(range(m+1))
    for i in range(1,n+1):
        prev=dp[0]; dp[0]=i
        for j in range(1,m+1):
            tmp=dp[j]; dp[j]=prev if a[i-1]==b[j-1] else 1+min(dp[j],dp[j-1],prev); prev=tmp
    return dp[m]

def sim(a, b):
    a = re.sub(r"\s+","",a.lower()); b = re.sub(r"\s+","",b.lower())
    if a==b: return 1.0
    if a in b or b in a: return 0.85
    mx = max(len(a),len(b))
    return 0.0 if mx==0 else 1-levenshtein(a,b)/mx

def get_tag(tags, *keys):
    for k in keys:
        v = tags.get(k,"")
        if v: return str(v)
    return ""

def completeness(p):
    s = 0
    if p.get("description") and len(p["description"])>50: s+=3
    if p.get("lat"): s+=2
    if p.get("titleEn"): s+=1
    if p.get("openHours"): s+=1
    if p.get("phone"): s+=1
    if p.get("website"): s+=1
    return s

def dedup(places):
    out = []
    for p in places:
        fi = -1
        for i,e in enumerate(out):
            if haversine(p["lat"],p["lng"],e["lat"],e["lng"])<=DUP_DIST_M and sim(p["title"],e["title"])>=DUP_SIM:
                fi=i; break
        if fi==-1: out.append(p)
        elif completeness(p)>completeness(out[fi]): out[fi]=p
    return out

# ── Overpass fetch (rotate servers + retry) ───────────────────
def fetch(query: str) -> list:
    global _server_idx
    data = urllib.parse.urlencode({"data": query}).encode()
    for attempt in range(len(OVERPASS_SERVERS) * 2):
        url = OVERPASS_SERVERS[_server_idx % len(OVERPASS_SERVERS)]
        _server_idx += 1
        req = urllib.request.Request(url, data=data,
              headers={"User-Agent":"PAI-LAO/2.0","Content-Type":"application/x-www-form-urlencoded"})
        try:
            with urllib.request.urlopen(req, timeout=45) as r:
                return json.loads(r.read())["elements"]
        except urllib.error.HTTPError as e:
            if e.code in (429, 503, 504):
                wait = 15 * (attempt + 1)
                print(f"    ⚠️  {e.code} — รอ {wait}s แล้วลองใหม่", flush=True)
                time.sleep(wait)
            else:
                print(f"    ⚠️  HTTP {e.code}", flush=True)
                return []
        except Exception as e:
            print(f"    ⚠️  {e}", flush=True)
            time.sleep(10)
    return []

# ── Build place from OSM element ──────────────────────────────
def build(elem, province, district, category):
    tags = elem.get("tags",{})
    title = get_tag(tags,"name","name:th")
    if not title or len(title)<2: return None

    lat = elem.get("lat") or (elem.get("center",{}) or {}).get("lat")
    lng = elem.get("lon") or (elem.get("center",{}) or {}).get("lon")
    if not lat or not lng: return None

    desc = (get_tag(tags,"description","description:th")
            or f"{title} ตั้งอยู่ใน{province} เป็นสถานที่ที่น่าสนใจ")

    return {
        "title":         title,
        "titleEn":       get_tag(tags,"name:en","int_name") or None,
        "province":      province,
        "district":      district,
        "address":       get_tag(tags,"addr:full","addr:street") or None,
        "googleMapsUrl": f"https://www.google.com/maps?q={lat},{lng}",
        "lat":           float(lat),
        "lng":           float(lng),
        "category":      category,
        "tags":          CAT_TAGS.get(category,[]),
        "description":   desc,
        "openHours":     get_tag(tags,"opening_hours") or None,
        "phone":         get_tag(tags,"phone","contact:phone") or None,
        "website":       get_tag(tags,"website","contact:website") or None,
        "amenities":     [],
        "coverUrl":      DEFAULT_IMG,
    }

# ── Main ──────────────────────────────────────────────────────
def main():
    arg = (sys.argv[1] if len(sys.argv)>1 else "all").lstrip("-")
    todo = list(REGIONS.keys()) if arg=="all" else ([arg] if arg in REGIONS else [])
    if not todo:
        print(f"ไม่รู้จัก: {arg}. ใช้: {', '.join(REGIONS)}, all"); return

    for region in todo:
        label = REGION_LABEL[region]
        provinces = REGIONS[region]
        out_file = os.path.join(OUT_DIR, f"{region}.json")

        print(f"\n{'='*55}", flush=True)
        print(f"{label} ({region}) — {len(provinces)} จังหวัด", flush=True)
        print(f"{'='*55}", flush=True)

        all_places: list[dict] = []

        for prov in provinces:
            print(f"\n  -- {prov} --", flush=True)
            prov_places: list[dict] = []

            for cat, q_tmpl in CATEGORY_QUERIES.items():
                q = q_tmpl.replace("{PROV}", prov).replace("{MAX}", str(MAX_PER_PROV))
                elems = fetch(q)
                count = 0
                for elem in elems:
                    p = build(elem, prov, prov, cat)
                    if p:
                        prov_places.append(p)
                        count += 1
                    if count >= MAX_PER_PROV: break
                if count: print(f"     {cat}: {count}", flush=True)
                time.sleep(DELAY_SEC)

            before = len(prov_places)
            prov_places = dedup(prov_places)
            print(f"     รวม: {before} → dedup → {len(prov_places)}", flush=True)
            all_places.extend(prov_places)

        # dedup ข้ามจังหวัด (สถานที่ชายแดน)
        all_places = dedup(all_places)
        print(f"\n  รวม {label}: {len(all_places)} สถานที่", flush=True)

        with open(out_file,"w",encoding="utf-8") as f:
            json.dump(all_places, f, ensure_ascii=False, indent=2)
        print(f"  บันทึก: {out_file}", flush=True)

    print("\nเสร็จแล้ว! รัน import: npm run seed:import all --dry-run", flush=True)

if __name__ == "__main__":
    main()

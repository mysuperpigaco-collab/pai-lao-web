"""
fetch_places_wikidata.py — ดึงสถานที่ท่องเที่ยวไทยจาก Wikidata SPARQL
Query ครั้งเดียวต่อ category ทั้งประเทศ → assign province จาก bounding box
ไม่ต้องใช้ API key, delay 65s ระหว่าง query เพื่อไม่โดน rate limit

Usage: python scripts/fetch_places_wikidata.py [all|north|central|east|west|northeast|south]
Output: scripts/seed-data/{region}.json
"""
import json, time, math, re, os, sys, urllib.request, urllib.parse
from typing import Optional

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

SPARQL_URL  = "https://query.wikidata.org/sparql"
OUT_DIR     = os.path.join(os.path.dirname(__file__), "seed-data")
os.makedirs(OUT_DIR, exist_ok=True)

DUP_DIST_M  = 80
DUP_SIM     = 0.55
DEFAULT_IMG = "/images/default-place.svg"
DELAY_SEC   = 65   # Wikidata: max 1 req/min สำหรับ automated scripts

# ── Province centers + bounding boxes ────────────────────────
# (province, region, center_lat, center_lng, bbox: s,w,n,e)
PROVINCE_BBOX: list[tuple] = [
    # ภาคเหนือ
    ("เชียงใหม่",    "north",    18.78, 98.98,  17.5,97.5,20.5,99.9),
    ("เชียงราย",     "north",    19.90, 99.83,  19.0,99.0,20.5,100.8),
    ("แม่ฮ่องสอน",   "north",    19.30, 97.96,  17.5,97.2,20.5,98.7),
    ("น่าน",         "north",    18.78, 100.77, 17.9,100.1,19.6,101.5),
    ("พะเยา",        "north",    19.16, 100.20, 18.8,99.7,19.8,100.8),
    ("ลำปาง",        "north",    18.28, 99.49,  17.4,98.8,19.0,100.1),
    ("ลำพูน",        "north",    18.57, 98.99,  18.1,98.5,19.0,99.5),
    ("แพร่",         "north",    18.14, 100.14, 17.7,99.5,18.8,100.7),
    ("อุตรดิตถ์",    "north",    17.62, 100.10, 17.0,99.5,18.3,101.0),
    ("ตาก",          "north",    16.88, 98.86,  15.5,97.8,18.0,99.5),
    ("สุโขทัย",      "north",    17.00, 99.82,  16.5,99.1,17.6,100.3),
    ("พิษณุโลก",     "north",    16.82, 100.26, 16.2,99.5,17.5,101.2),
    ("กำแพงเพชร",    "north",    16.47, 99.52,  15.8,98.8,17.0,100.0),
    ("พิจิตร",       "north",    16.44, 100.35, 15.9,99.8,16.9,100.7),
    ("เพชรบูรณ์",    "north",    16.42, 101.16, 15.6,100.4,17.2,101.8),
    # ภาคกลาง
    ("กรุงเทพมหานคร","central", 13.75, 100.52, 13.4,100.3,14.0,100.9),
    ("นนทบุรี",      "central", 13.86, 100.52, 13.7,100.4,14.0,100.7),
    ("ปทุมธานี",     "central", 14.02, 100.53, 13.9,100.4,14.2,100.7),
    ("นครปฐม",      "central", 13.82, 100.06, 13.5,99.7,14.1,100.4),
    ("สมุทรสาคร",   "central", 13.55, 100.27, 13.4,99.9,13.8,100.5),
    ("สมุทรสงคราม", "central", 13.41, 99.99,  13.3,99.8,13.6,100.2),
    ("สมุทรปราการ", "central", 13.60, 100.60, 13.4,100.4,13.8,101.0),
    ("อ่างทอง",     "central", 14.59, 100.46, 14.4,100.3,14.8,100.7),
    ("สิงห์บุรี",    "central", 14.89, 100.40, 14.7,100.2,15.1,100.6),
    ("ชัยนาท",      "central", 15.18, 100.12, 15.0,99.9,15.4,100.4),
    ("สระบุรี",      "central", 14.53, 100.91, 14.3,100.5,14.8,101.3),
    ("นครสวรรค์",   "central", 15.70, 100.14, 15.3,99.5,16.0,100.7),
    ("ลพบุรี",       "central", 14.80, 100.65, 14.5,100.3,15.3,101.2),
    ("พระนครศรีอยุธยา","central",14.36, 100.58,14.1,100.3,14.6,100.9),
    ("อุทัยธานี",    "central", 15.38, 100.02, 14.9,99.4,15.8,100.6),
    # ภาคตะวันออก
    ("ชลบุรี",       "east",    13.36, 100.98, 12.7,100.6,13.9,101.5),
    ("ระยอง",        "east",    12.68, 101.27, 12.3,101.0,13.2,102.0),
    ("จันทบุรี",     "east",    12.61, 102.10, 12.0,101.5,13.2,103.0),
    ("ตราด",         "east",    12.24, 102.52, 11.5,102.0,12.8,103.0),
    ("ฉะเชิงเทรา",   "east",    13.69, 101.08, 13.3,100.7,14.1,101.7),
    ("ปราจีนบุรี",   "east",    14.05, 101.37, 13.6,101.0,14.6,102.2),
    ("สระแก้ว",      "east",    13.82, 102.06, 13.2,101.5,14.5,103.0),
    ("นครนายก",      "east",    14.20, 101.21, 13.9,100.9,14.5,101.8),
    # ภาคตะวันตก
    ("กาญจนบุรี",    "west",    14.00, 99.53,  12.9,98.0,15.5,100.0),
    ("ราชบุรี",      "west",    13.54, 99.82,  13.2,99.3,14.0,100.2),
    ("เพชรบุรี",     "west",    13.11, 99.94,  12.5,99.5,13.6,100.2),
    ("ประจวบคีรีขันธ์","west",  11.81, 99.80, 10.5,99.1,12.6,100.0),
    ("สุพรรณบุรี",   "west",    14.47, 100.12, 14.0,99.5,15.1,100.6),
    # ภาคอีสาน
    ("นครราชสีมา",   "northeast",14.97,102.10,14.0,101.2,16.0,103.0),
    ("ขอนแก่น",      "northeast",16.43,102.83,15.6,101.8,17.2,103.5),
    ("อุดรธานี",     "northeast",17.41,102.79,16.8,101.9,18.1,103.6),
    ("หนองคาย",      "northeast",17.86,102.74,17.4,102.0,18.3,103.4),
    ("หนองบัวลำภู",  "northeast",17.20,102.44,16.7,101.7,17.7,103.0),
    ("บึงกาฬ",       "northeast",18.36,103.65,17.8,103.0,18.8,104.3),
    ("สกลนคร",       "northeast",17.15,104.14,16.7,103.3,17.9,104.9),
    ("นครพนม",       "northeast",17.39,104.78,16.9,104.1,18.0,105.0),
    ("มุกดาหาร",     "northeast",16.54,104.72,15.9,104.0,17.2,105.1),
    ("อุบลราชธานี",  "northeast",15.23,104.85,14.3,104.0,16.1,105.5),
    ("ยโสธร",        "northeast",15.79,104.14,15.2,103.5,16.3,104.8),
    ("ศรีสะเกษ",     "northeast",15.12,104.32,14.4,103.7,15.7,105.0),
    ("สุรินทร์",     "northeast",14.88,103.49,14.2,102.8,15.5,104.2),
    ("บุรีรัมย์",    "northeast",14.99,102.98,14.3,102.0,15.7,103.9),
    ("ชัยภูมิ",      "northeast",15.81,101.92,15.0,101.1,16.7,102.8),
    ("ร้อยเอ็ด",     "northeast",16.05,103.66,15.5,103.0,16.7,104.4),
    ("มหาสารคาม",    "northeast",16.18,103.30,15.7,102.7,16.7,104.0),
    ("กาฬสินธุ์",    "northeast",16.43,103.51,16.0,103.0,17.0,104.2),
    ("อำนาจเจริญ",   "northeast",15.85,104.63,15.3,104.0,16.4,105.1),
    ("เลย",          "northeast",17.49,101.72,16.7,100.9,18.3,102.5),
    # ภาคใต้
    ("ชุมพร",        "south",    10.49,99.18,  9.5,98.6,11.2,99.6),
    ("ระนอง",        "south",    9.96, 98.64,  9.1,98.0,10.9,99.0),
    ("สุราษฎร์ธานี", "south",    9.13, 99.33,  8.2,98.5,9.9,100.1),
    ("พังงา",        "south",    8.45, 98.53,  7.7,97.9,9.2,99.1),
    ("ภูเก็ต",       "south",    7.89, 98.37,  7.6,98.2,8.2,98.6),
    ("กระบี่",       "south",    8.09, 98.91,  7.5,98.3,8.8,99.5),
    ("นครศรีธรรมราช","south",   8.43, 99.96,  7.7,99.2,9.2,100.5),
    ("ตรัง",         "south",    7.56, 99.61,  7.0,99.0,8.1,100.1),
    ("พัทลุง",       "south",    7.62, 100.07, 6.9,99.6,7.8,100.6),
    ("สงขลา",        "south",    7.19, 100.59, 6.5,99.9,7.6,101.0),
    ("สตูล",         "south",    6.62, 100.07, 6.1,99.7,7.1,100.4),
    ("ยะลา",         "south",    6.54, 101.28, 5.8,100.7,7.1,101.9),
    ("ปัตตานี",      "south",    6.87, 101.25, 6.4,101.0,7.3,101.7),
    ("นราธิวาส",     "south",    6.43, 101.82, 5.6,101.4,6.9,102.2),
]

REGION_LABEL = {"north":"ภาคเหนือ","central":"ภาคกลาง","east":"ภาคตะวันออก",
                "west":"ภาคตะวันตก","northeast":"ภาคอีสาน","south":"ภาคใต้"}

CAT_TAGS = {
    "TEMPLE":["วัด","ศาสนา","ไหว้พระ"],"NATURE":["ธรรมชาติ","ท่องเที่ยว","วิว"],
    "BEACH":["ทะเล","ชายหาด","ว่ายน้ำ"],"MUSEUM":["พิพิธภัณฑ์","ประวัติศาสตร์","วัฒนธรรม"],
    "MARKET":["ตลาด","ช้อปปิ้ง","ของฝาก"],"ADVENTURE":["ผจญภัย","สนุก","ครอบครัว"],
    "CAMPING":["แคมปิ้ง","ธรรมชาติ","กางเต็นท์"],"CAFE":["คาเฟ่","กาแฟ"],
    "FOOD":["อาหาร","ร้านอาหาร"],"ACCOMMODATION":["ที่พัก","โรงแรม"],
}

# Wikidata type QIDs → category (ใช้ P31 instance of)
CATEGORY_QUERIES: dict[str, str] = {
    "TEMPLE": "wd:Q44539,wd:Q105190680,wd:Q19600,wd:Q160742,wd:Q1144661",
    "NATURE": "wd:Q23413,wd:Q35509,wd:Q46169,wd:Q179049,wd:Q46359,wd:Q1322707",
    "BEACH":  "wd:Q40080,wd:Q4022,wd:Q39816",
    "MUSEUM": "wd:Q33506,wd:Q207694,wd:Q839954,wd:Q1261352",
    "MARKET": "wd:Q24354,wd:Q11315,wd:Q1257098",
    "ADVENTURE": "wd:Q22746,wd:Q1137809,wd:Q43501",
    "CAMPING": "wd:Q2087526,wd:Q1130697",
}

# ── Helpers ───────────────────────────────────────────────────
def haversine(lat1,lng1,lat2,lng2):
    R=6371000; p1,p2=math.radians(lat1),math.radians(lat2)
    dp=math.radians(lat2-lat1); dl=math.radians(lng2-lng1)
    a=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return R*2*math.atan2(math.sqrt(a),math.sqrt(1-a))

def lev(a,b):
    n,m=len(a),len(b); dp=list(range(m+1))
    for i in range(1,n+1):
        prev=dp[0]; dp[0]=i
        for j in range(1,m+1):
            tmp=dp[j]; dp[j]=prev if a[i-1]==b[j-1] else 1+min(dp[j],dp[j-1],prev); prev=tmp
    return dp[m]

def sim(a,b):
    a=re.sub(r"\s+","",a.lower()); b=re.sub(r"\s+","",b.lower())
    if a==b: return 1.0
    if a in b or b in a: return 0.85
    mx=max(len(a),len(b)); return 0.0 if mx==0 else 1-lev(a,b)/mx

def completeness(p):
    s=0
    if p.get("description") and len(p["description"])>50: s+=3
    if p.get("lat"): s+=2
    if p.get("titleEn"): s+=1
    return s

def dedup(places):
    out=[]
    for p in places:
        fi=-1
        for i,e in enumerate(out):
            if haversine(p["lat"],p["lng"],e["lat"],e["lng"])<=DUP_DIST_M and sim(p["title"],e["title"])>=DUP_SIM:
                fi=i; break
        if fi==-1: out.append(p)
        elif completeness(p)>completeness(out[fi]): out[fi]=p
    return out

def parse_coord(val: str) -> Optional[tuple[float,float]]:
    m = re.match(r"Point\(([0-9.\-]+)\s+([0-9.\-]+)\)", val)
    if not m: return None
    lng,lat = float(m.group(1)),float(m.group(2))
    return (lat,lng) if 5<=lat<=21 and 97<=lng<=106 else None

def assign_province(lat: float, lng: float) -> Optional[tuple[str,str]]:
    """คืน (province, region) โดย bounding box + nearest center"""
    candidates = []
    for prov,region,clat,clng,s,w,n,e in PROVINCE_BBOX:
        if s<=lat<=n and w<=lng<=e:
            dist = haversine(lat,lng,clat,clng)
            candidates.append((dist,prov,region))
    if not candidates: return None
    candidates.sort()
    return candidates[0][1], candidates[0][2]

# ── SPARQL fetch ──────────────────────────────────────────────
def sparql_fetch(category: str, type_qids: str, offset: int = 0) -> list:
    q = f"""
SELECT DISTINCT ?item ?labelTh ?labelEn ?coord ?desc WHERE {{
  VALUES ?type {{ {' '.join('wd:'+q for q in type_qids.replace('wd:','').split(','))} }}
  ?item wdt:P31/wdt:P279* ?type .
  ?item wdt:P17 wd:Q869 .
  ?item wdt:P625 ?coord .
  ?item rdfs:label ?labelTh . FILTER(LANG(?labelTh)="th")
  OPTIONAL {{ ?item rdfs:label ?labelEn . FILTER(LANG(?labelEn)="en") }}
  OPTIONAL {{ ?item schema:description ?desc . FILTER(LANG(?desc)="th") }}
}}
LIMIT 2000 OFFSET {offset}
"""
    params = urllib.parse.urlencode({"query": q, "format": "json"})
    req = urllib.request.Request(
        f"{SPARQL_URL}?{params}",
        headers={"User-Agent":"PAI-LAO/2.0 (mysuperpigaco@gmail.com)","Accept":"application/sparql-results+json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())["results"]["bindings"]
    except urllib.error.HTTPError as e:
        if e.code == 429:
            print(f"  ⚠️  429 rate limit — รอ 90s", flush=True)
            time.sleep(90)
            return sparql_fetch(category, type_qids, offset)
        print(f"  ⚠️  HTTP {e.code}", flush=True); return []
    except Exception as e:
        print(f"  ⚠️  {e}", flush=True); return []

# ── Main ──────────────────────────────────────────────────────
def main():
    arg = (sys.argv[1] if len(sys.argv)>1 else "all").lstrip("-")
    target_regions = set(REGION_LABEL.keys()) if arg=="all" else {arg}

    # โหลดข้อมูลเดิมทุกภาค
    region_data: dict[str,list] = {}
    for r in target_regions:
        f = os.path.join(OUT_DIR, f"{r}.json")
        region_data[r] = json.load(open(f,encoding="utf-8")) if os.path.exists(f) else []
        print(f"{REGION_LABEL.get(r,r)}: {len(region_data[r])} รายการเดิม", flush=True)

    total_new = 0

    for category, type_qids in CATEGORY_QUERIES.items():
        print(f"\n{'='*55}", flush=True)
        print(f"หมวด: {category}", flush=True)
        print(f"{'='*55}", flush=True)

        offset = 0
        while True:
            print(f"  ดึง offset={offset}...", end=" ", flush=True)
            rows = sparql_fetch(category, type_qids, offset)
            print(f"{len(rows)} rows", flush=True)
            if not rows: break

            for row in rows:
                label_th = row.get("labelTh",{}).get("value","")
                if not label_th or not any("฀"<=c<="๿" for c in label_th): continue
                coord_val = row.get("coord",{}).get("value","")
                coords = parse_coord(coord_val)
                if not coords: continue
                lat,lng = coords

                result = assign_province(lat, lng)
                if not result: continue
                province, region = result
                if region not in target_regions: continue

                label_en = row.get("labelEn",{}).get("value") or None
                desc     = row.get("desc",{}).get("value") or f"{label_th} ตั้งอยู่ใน{province}"
                item_id  = row.get("item",{}).get("value","").split("/")[-1]

                place = {
                    "wikidata_id":   item_id,
                    "title":         label_th,
                    "titleEn":       label_en,
                    "province":      province,
                    "district":      province,
                    "googleMapsUrl": f"https://www.google.com/maps?q={lat},{lng}",
                    "lat":           lat,
                    "lng":           lng,
                    "category":      category,
                    "tags":          CAT_TAGS.get(category,[]),
                    "description":   desc,
                    "openHours":     None,
                    "phone":         None,
                    "website":       f"https://www.wikidata.org/wiki/{item_id}" if item_id else None,
                    "amenities":     [],
                    "coverUrl":      DEFAULT_IMG,
                }
                region_data[region].append(place)
                total_new += 1

            if len(rows) < 2000: break
            offset += 2000
            print(f"  รอ {DELAY_SEC}s...", flush=True)
            time.sleep(DELAY_SEC)

        print(f"  รอ {DELAY_SEC}s ก่อน query ถัดไป...", flush=True)
        time.sleep(DELAY_SEC)

    # dedup + save per region
    print(f"\n{'='*55}", flush=True)
    print(f"บันทึกและ dedup...", flush=True)
    for region in target_regions:
        before = len(region_data[region])
        deduped = dedup(region_data[region])
        out_file = os.path.join(OUT_DIR, f"{region}.json")
        with open(out_file,"w",encoding="utf-8") as f:
            json.dump(deduped, f, ensure_ascii=False, indent=2)
        print(f"  {REGION_LABEL.get(region,region)}: {before} → dedup → {len(deduped)} → บันทึก {out_file}", flush=True)

    print(f"\nเสร็จแล้ว! รวมใหม่ {total_new} รายการ", flush=True)
    print("รัน import: npm run seed:import all --dry-run", flush=True)

if __name__=="__main__":
    main()

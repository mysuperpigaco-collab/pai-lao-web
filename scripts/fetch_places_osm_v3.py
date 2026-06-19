"""
fetch_places_osm_v3.py — ดึงสถานที่จาก OSM ทีละจังหวัด (ต่อยอดจาก v2)
สิ่งที่เพิ่มจาก v2:
  1) ครบ 10 หมวดของแอป: TEMPLE NATURE BEACH MUSEUM MARKET ADVENTURE CAMPING + CAFE FOOD ACCOMMODATION
  2) อำเภอจริง: อ่านจาก tag addr:district / is_in:district (เดิม v2 ใส่ชื่อจังหวัดซ้ำ)
  3) โหมด --reverse: เติมอำเภอที่ขาดด้วย Nominatim reverse geocode (แม่นสุด แต่ช้าลง)

Usage:
  python scripts/fetch_places_osm_v3.py [north|central|east|west|northeast|south|all] [--reverse]
Output: scripts/seed-data/{region}.json  (ฟอร์แมตเดียวกับ v2 → ใช้ import-places.ts ได้เลย)
"""
import json, time, math, re, os, sys, urllib.request, urllib.parse

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

OVERPASS_SERVERS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]
HTTP_TIMEOUT = 120   # วินาที — query area + regex หนัก ใช้เวลานานได้
_server_idx = 0

OUT_DIR     = os.path.join(os.path.dirname(__file__), "seed-data")
os.makedirs(OUT_DIR, exist_ok=True)

MAX_PER_PROV = 150                                   # ต่อหมวดต่อจังหวัด (default)
MAX_OVERRIDE = {"FOOD": 60, "CAFE": 60, "ACCOMMODATION": 60}  # หมวดที่ noise เยอะ จำกัดน้อยลง
DUP_DIST_M   = 80
DUP_SIM      = 0.55
DELAY_SEC    = 6                                     # ระหว่าง Overpass request
NOMINATIM_DELAY = 1.1                                # reverse geocode (ตาม usage policy 1 req/วิ)
DEFAULT_IMG  = "/images/default-place.svg"
USE_REVERSE  = "--reverse" in sys.argv

# ── Region / Province ─────────────────────────────────────────
REGIONS = {
    "north": ["เชียงใหม่","เชียงราย","แม่ฮ่องสอน","น่าน","พะเยา","ลำปาง","ลำพูน","แพร่","อุตรดิตถ์","ตาก","สุโขทัย","พิษณุโลก","กำแพงเพชร","พิจิตร","เพชรบูรณ์"],
    "central": ["กรุงเทพมหานคร","นนทบุรี","ปทุมธานี","นครปฐม","สมุทรสาคร","สมุทรสงคราม","สมุทรปราการ","อ่างทอง","สิงห์บุรี","ชัยนาท","สระบุรี","นครสวรรค์","ลพบุรี","พระนครศรีอยุธยา","อุทัยธานี"],
    "east": ["ชลบุรี","ระยอง","จันทบุรี","ตราด","ฉะเชิงเทรา","ปราจีนบุรี","สระแก้ว","นครนายก"],
    "west": ["กาญจนบุรี","ราชบุรี","เพชรบุรี","ประจวบคีรีขันธ์","สุพรรณบุรี"],
    "northeast": ["นครราชสีมา","ขอนแก่น","อุดรธานี","หนองคาย","หนองบัวลำภู","บึงกาฬ","สกลนคร","นครพนม","มุกดาหาร","อุบลราชธานี","ยโสธร","ศรีสะเกษ","สุรินทร์","บุรีรัมย์","ชัยภูมิ","ร้อยเอ็ด","มหาสารคาม","กาฬสินธุ์","อำนาจเจริญ","เลย"],
    "south": ["สุราษฎร์ธานี","ภูเก็ต","กระบี่","พังงา","ระนอง","ชุมพร","นครศรีธรรมราช","สงขลา","สตูล","ตรัง","พัทลุง","ยะลา","ปัตตานี","นราธิวาส"],
}
REGION_LABEL = {"north":"ภาคเหนือ","central":"ภาคกลาง","east":"ภาคตะวันออก","west":"ภาคตะวันตก","northeast":"ภาคอีสาน","south":"ภาคใต้"}

# ── Category queries ──────────────────────────────────────────
CATEGORY_QUERIES = {
    "TEMPLE": """
[out:json][timeout:90];
area["name"="{PROV}"]["admin_level"="4"]->.a;
(node["amenity"="place_of_worship"](area.a);
 node["historic"="temple"](area.a););
out body {MAX};""",
    "NATURE": """
[out:json][timeout:90];
area["name"="{PROV}"]["admin_level"="4"]->.a;
(node["natural"="waterfall"](area.a);
 node["natural"="cave_entrance"](area.a);
 node["tourism"="viewpoint"](area.a);
 node["leisure"="nature_reserve"](area.a);
 node["boundary"="national_park"](area.a);
 node["natural"="peak"]["name"](area.a););
out body {MAX};""",
    "BEACH": """
[out:json][timeout:90];
area["name"="{PROV}"]["admin_level"="4"]->.a;
(node["natural"="beach"](area.a);
 way["natural"="beach"](area.a);
 node["leisure"="beach_resort"](area.a););
out center body {MAX};""",
    "MUSEUM": """
[out:json][timeout:90];
area["name"="{PROV}"]["admin_level"="4"]->.a;
(node["tourism"="museum"](area.a);
 node["tourism"="gallery"](area.a);
 node["historic"="archaeological_site"](area.a);
 node["historic"="monument"](area.a););
out body {MAX};""",
    "MARKET": """
[out:json][timeout:90];
area["name"="{PROV}"]["admin_level"="4"]->.a;
(node["amenity"="marketplace"](area.a);
 node["shop"="mall"](area.a););
out body {MAX};""",
    "ADVENTURE": """
[out:json][timeout:90];
area["name"="{PROV}"]["admin_level"="4"]->.a;
(node["tourism"="theme_park"](area.a);
 node["leisure"="water_park"](area.a);
 node["tourism"="zoo"](area.a);
 node["tourism"="aquarium"](area.a););
out body {MAX};""",
    "CAMPING": """
[out:json][timeout:90];
area["name"="{PROV}"]["admin_level"="4"]->.a;
(node["tourism"="camp_site"](area.a););
out body {MAX};""",
    # ── หมวดใหม่ (ต้องมี name เพื่อลด noise) ──
    "CAFE": """
[out:json][timeout:90];
area["name"="{PROV}"]["admin_level"="4"]->.a;
(node["amenity"="cafe"]["name"](area.a);
 node["shop"="coffee"]["name"](area.a););
out body {MAX};""",
    "FOOD": """
[out:json][timeout:90];
area["name"="{PROV}"]["admin_level"="4"]->.a;
(node["amenity"="restaurant"]["name"](area.a);
 node["amenity"="food_court"]["name"](area.a););
out body {MAX};""",
    "ACCOMMODATION": """
[out:json][timeout:90];
area["name"="{PROV}"]["admin_level"="4"]->.a;
(node["tourism"="hotel"]["name"](area.a);
 node["tourism"="resort"]["name"](area.a);
 node["tourism"="guest_house"]["name"](area.a););
out body {MAX};""",
}

CAT_TAGS = {
    "TEMPLE":["วัด","ศาสนา","ไหว้พระ"], "NATURE":["ธรรมชาติ","ท่องเที่ยว","วิว"],
    "BEACH":["ทะเล","ชายหาด","ว่ายน้ำ"], "MUSEUM":["พิพิธภัณฑ์","ประวัติศาสตร์","วัฒนธรรม"],
    "MARKET":["ตลาด","ช้อปปิ้ง","ของฝาก"], "ADVENTURE":["ผจญภัย","สนุก","ครอบครัว"],
    "CAMPING":["แคมปิ้ง","ธรรมชาติ","กางเต็นท์"], "CAFE":["คาเฟ่","กาแฟ","นั่งชิล"],
    "FOOD":["ร้านอาหาร","ของกิน","อร่อย"], "ACCOMMODATION":["ที่พัก","โรงแรม","รีสอร์ท"],
}

# ── Helpers ───────────────────────────────────────────────────
def haversine(lat1,lng1,lat2,lng2):
    R=6371000; p1,p2=math.radians(lat1),math.radians(lat2)
    dp=math.radians(lat2-lat1); dl=math.radians(lng2-lng1)
    a=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return R*2*math.atan2(math.sqrt(a),math.sqrt(1-a))

def levenshtein(a,b):
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
    mx=max(len(a),len(b)); return 0.0 if mx==0 else 1-levenshtein(a,b)/mx

def get_tag(tags,*keys):
    for k in keys:
        v=tags.get(k,"")
        if v: return str(v)
    return ""

def clean_district(d, province):
    """ทำให้อำเภอตรงรูปแบบ data/thailand.ts (ไทยเต็ม ไม่มี prefix) ; ถ้าไม่ใช่ไทย/ว่าง → ใช้จังหวัด"""
    if not d: return province
    d = d.strip()
    d = re.sub(r"^(อำเภอ|อ\.|เขต)\s*", "", d)
    if not d or not re.search(r"[ก-๙]", d):   # อังกฤษ/ว่าง → fallback
        return province
    return d

def completeness(p):
    s=0
    if p.get("description") and len(p["description"])>50: s+=3
    if p.get("lat"): s+=2
    if p.get("titleEn"): s+=1
    if p.get("openHours"): s+=1
    if p.get("phone"): s+=1
    if p.get("website"): s+=1
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

# ── Overpass fetch (rotate + retry) ───────────────────────────
def fetch(query):
    global _server_idx
    data=urllib.parse.urlencode({"data":query}).encode()
    for attempt in range(len(OVERPASS_SERVERS)*2):
        url=OVERPASS_SERVERS[_server_idx%len(OVERPASS_SERVERS)]; _server_idx+=1
        req=urllib.request.Request(url,data=data,headers={"User-Agent":"PAI-LAO/3.0","Content-Type":"application/x-www-form-urlencoded"})
        try:
            with urllib.request.urlopen(req,timeout=HTTP_TIMEOUT) as r:
                return json.loads(r.read())["elements"]
        except urllib.error.HTTPError as e:
            if e.code in (429,503,504):
                wait=15*(attempt+1); print(f"    ⚠️  {e.code} — รอ {wait}s",flush=True); time.sleep(wait)
            else:
                print(f"    ⚠️  HTTP {e.code}",flush=True); return []
        except Exception as e:
            print(f"    ⚠️  {e}",flush=True); time.sleep(10)
    return []

# ── Nominatim reverse (เติมอำเภอที่ขาด) ──────────────────────
_rev_cache = {}
def reverse_district(lat,lng,province):
    key=(round(lat,3),round(lng,3))
    if key in _rev_cache: return _rev_cache[key]
    url="https://nominatim.openstreetmap.org/reverse?"+urllib.parse.urlencode(
        {"lat":lat,"lon":lng,"format":"json","accept-language":"th","zoom":"10"})
    req=urllib.request.Request(url,headers={"User-Agent":"PAI-LAO/3.0 (admin@pai-lao.com)"})
    d=province
    try:
        with urllib.request.urlopen(req,timeout=30) as r:
            addr=json.loads(r.read()).get("address",{})
        d=clean_district(addr.get("county") or addr.get("city_district") or addr.get("state_district") or "", province)
    except Exception as e:
        print(f"      reverse fail: {e}",flush=True)
    time.sleep(NOMINATIM_DELAY)
    _rev_cache[key]=d
    return d

# ── Build place ───────────────────────────────────────────────
def build(elem, province, category):
    tags=elem.get("tags",{})
    title=get_tag(tags,"name","name:th")
    if not title or len(title)<2: return None
    lat=elem.get("lat") or (elem.get("center",{}) or {}).get("lat")
    lng=elem.get("lon") or (elem.get("center",{}) or {}).get("lon")
    if not lat or not lng: return None
    lat,lng=float(lat),float(lng)

    district=clean_district(get_tag(tags,"addr:district","is_in:district","addr:county"), province)
    if district==province and USE_REVERSE:           # ขาดอำเภอ → reverse geocode
        district=reverse_district(lat,lng,province)

    desc=(get_tag(tags,"description","description:th") or f"{title} ตั้งอยู่ใน{province} เป็นสถานที่ที่น่าสนใจ")
    return {
        "title":title, "titleEn":get_tag(tags,"name:en","int_name") or None,
        "province":province, "district":district,
        "address":get_tag(tags,"addr:full","addr:street") or None,
        "googleMapsUrl":f"https://www.google.com/maps?q={lat},{lng}",
        "lat":lat, "lng":lng, "category":category, "tags":CAT_TAGS.get(category,[]),
        "description":desc, "openHours":get_tag(tags,"opening_hours") or None,
        "phone":get_tag(tags,"phone","contact:phone") or None,
        "website":get_tag(tags,"website","contact:website") or None,
        "amenities":[], "coverUrl":DEFAULT_IMG,
    }

# ── Main ──────────────────────────────────────────────────────
def main():
    args=[a for a in sys.argv[1:] if not a.startswith("--")]
    arg=(args[0] if args else "all")
    todo=list(REGIONS.keys()) if arg=="all" else ([arg] if arg in REGIONS else [])
    if not todo:
        print(f"ไม่รู้จัก: {arg}. ใช้: {', '.join(REGIONS)}, all [--reverse]"); return
    if USE_REVERSE: print("🌍 โหมด --reverse: เติมอำเภอด้วย Nominatim (ช้าลง แต่อำเภอแม่นกว่า)\n",flush=True)

    for region in todo:
        label=REGION_LABEL[region]; provinces=REGIONS[region]
        out_file=os.path.join(OUT_DIR,f"{region}.json")
        print(f"\n{'='*55}\n{label} ({region}) — {len(provinces)} จังหวัด\n{'='*55}",flush=True)
        all_places=[]
        for prov in provinces:
            print(f"\n  -- {prov} --",flush=True); prov_places=[]
            for cat,q_tmpl in CATEGORY_QUERIES.items():
                cat_max=MAX_OVERRIDE.get(cat,MAX_PER_PROV)
                q=q_tmpl.replace("{PROV}",prov).replace("{MAX}",str(cat_max))
                elems=fetch(q); count=0
                for elem in elems:
                    p=build(elem,prov,cat)
                    if p: prov_places.append(p); count+=1
                    if count>=cat_max: break
                if count: print(f"     {cat}: {count}",flush=True)
                time.sleep(DELAY_SEC)
            before=len(prov_places); prov_places=dedup(prov_places)
            print(f"     รวม: {before} → dedup → {len(prov_places)}",flush=True)
            all_places.extend(prov_places)
        all_places=dedup(all_places)
        print(f"\n  รวม {label}: {len(all_places)} สถานที่",flush=True)
        with open(out_file,"w",encoding="utf-8") as f:
            json.dump(all_places,f,ensure_ascii=False,indent=2)
        print(f"  บันทึก: {out_file}",flush=True)

    print("\nเสร็จ! รัน import: npx ts-node scripts/import-places.ts all --dry-run",flush=True)

if __name__=="__main__":
    main()

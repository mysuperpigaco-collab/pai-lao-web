# ════════════════════════════════════════════════════════════════
#  Colab — ดึงดิบ 1 query/จังหวัด (bbox) แล้วจัดหมวดในโค้ด (เร็วสุด)
#  วิธีใช้: colab.research.google.com → New notebook → วางทั้งไฟล์ในเซลล์เดียว →
#          แก้ REGIONS_TODO → Run → ได้ seed-data.zip → แตกไปวางใน scripts/seed-data/ →
#          npx ts-node scripts/import-places.ts all --dry-run
# ════════════════════════════════════════════════════════════════
import json, time, math, re, urllib.request, urllib.parse, os, zipfile

REGIONS_TODO = "north"          # "north"/"central"/"east"/"west"/"northeast"/"south"/"all"
CAP_PER_CAT  = {"FOOD":80,"CAFE":80,"ACCOMMODATION":80,"_default":200}  # จำกัดต่อหมวด/จังหวัด
DELAY_SEC    = 2
OUT_DIR      = "seed-data"; os.makedirs(OUT_DIR, exist_ok=True)
OVERPASS = ["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter"]
_si = 0

REGIONS = {
 "north":["เชียงใหม่","เชียงราย","แม่ฮ่องสอน","น่าน","พะเยา","ลำปาง","ลำพูน","แพร่","อุตรดิตถ์","ตาก","สุโขทัย","พิษณุโลก","กำแพงเพชร","พิจิตร","เพชรบูรณ์"],
 "central":["กรุงเทพมหานคร","นนทบุรี","ปทุมธานี","นครปฐม","สมุทรสาคร","สมุทรสงคราม","สมุทรปราการ","อ่างทอง","สิงห์บุรี","ชัยนาท","สระบุรี","นครสวรรค์","ลพบุรี","พระนครศรีอยุธยา","อุทัยธานี"],
 "east":["ชลบุรี","ระยอง","จันทบุรี","ตราด","ฉะเชิงเทรา","ปราจีนบุรี","สระแก้ว","นครนายก"],
 "west":["กาญจนบุรี","ราชบุรี","เพชรบุรี","ประจวบคีรีขันธ์","สุพรรณบุรี"],
 "northeast":["นครราชสีมา","ขอนแก่น","อุดรธานี","หนองคาย","หนองบัวลำภู","บึงกาฬ","สกลนคร","นครพนม","มุกดาหาร","อุบลราชธานี","ยโสธร","ศรีสะเกษ","สุรินทร์","บุรีรัมย์","ชัยภูมิ","ร้อยเอ็ด","มหาสารคาม","กาฬสินธุ์","อำนาจเจริญ","เลย"],
 "south":["สุราษฎร์ธานี","ภูเก็ต","กระบี่","พังงา","ระนอง","ชุมพร","นครศรีธรรมราช","สงขลา","สตูล","ตรัง","พัทลุง","ยะลา","ปัตตานี","นราธิวาส"],
}
CAT_TAGS = {"TEMPLE":["วัด","ศาสนา","ไหว้พระ"],"NATURE":["ธรรมชาติ","ท่องเที่ยว","วิว"],"BEACH":["ทะเล","ชายหาด","ว่ายน้ำ"],"MUSEUM":["พิพิธภัณฑ์","ประวัติศาสตร์","วัฒนธรรม"],"MARKET":["ตลาด","ช้อปปิ้ง","ของฝาก"],"ADVENTURE":["ผจญภัย","สนุก","ครอบครัว"],"CAMPING":["แคมปิ้ง","ธรรมชาติ","กางเต็นท์"],"CAFE":["คาเฟ่","กาแฟ","นั่งชิล"],"FOOD":["ร้านอาหาร","ของกิน","อร่อย"],"ACCOMMODATION":["ที่พัก","โรงแรม","รีสอร์ท"]}

# ── จัดหมวดจาก tag (เรียงตามลำดับความสำคัญ) ──
def categorize(t):
    am=t.get("amenity",""); to=t.get("tourism",""); na=t.get("natural","")
    hi=t.get("historic",""); le=t.get("leisure",""); sh=t.get("shop","")
    if am=="place_of_worship" or hi=="temple": return "TEMPLE"
    if na=="beach" or le=="beach_resort": return "BEACH"
    if to=="museum" or to=="gallery" or hi in ("archaeological_site","monument","ruins","memorial","castle"): return "MUSEUM"
    if to=="camp_site": return "CAMPING"
    if to in ("theme_park","zoo","aquarium") or le=="water_park": return "ADVENTURE"
    if to in ("hotel","resort","guest_house","hostel","motel","chalet"): return "ACCOMMODATION"
    if am=="cafe" or sh=="coffee": return "CAFE"
    if am in ("restaurant","food_court"): return "FOOD"
    if am=="marketplace" or sh=="mall": return "MARKET"
    if na in ("waterfall","cave_entrance","peak","spring","hot_spring") or to in ("viewpoint","attraction") or le=="nature_reserve" or t.get("boundary")=="national_park": return "NATURE"
    return None

def hav(a,b,c,d):
    R=6371000;p=math.radians(a);q=math.radians(c);dp=math.radians(c-a);dl=math.radians(d-b)
    x=math.sin(dp/2)**2+math.cos(p)*math.cos(q)*math.sin(dl/2)**2;return R*2*math.atan2(math.sqrt(x),math.sqrt(1-x))
def lev(a,b):
    n,m=len(a),len(b);dp=list(range(m+1))
    for i in range(1,n+1):
        pv=dp[0];dp[0]=i
        for j in range(1,m+1):
            tt=dp[j];dp[j]=pv if a[i-1]==b[j-1] else 1+min(dp[j],dp[j-1],pv);pv=tt
    return dp[m]
def sim(a,b):
    a=re.sub(r"\s+","",a.lower());b=re.sub(r"\s+","",b.lower())
    if a==b:return 1.0
    if a in b or b in a:return .85
    mx=max(len(a),len(b));return 0 if mx==0 else 1-lev(a,b)/mx
def gt(t,*k):
    for x in k:
        v=t.get(x,"")
        if v:return str(v)
    return ""
def cd(d,prov):
    if not d:return prov
    d=re.sub(r"^(อำเภอ|อ\.|เขต)\s*","",d.strip())
    return d if re.search(r"[ก-๙]",d) else prov
def dedup(P):
    o=[]
    for p in P:
        f=-1
        for i,e in enumerate(o):
            if hav(p["lat"],p["lng"],e["lat"],e["lng"])<=80 and sim(p["title"],e["title"])>=.55:f=i;break
        if f<0:o.append(p)
    return o

_bbox={}
def province_bbox(prov):
    # ⚠️ ต้องเลือก "ขอบเขตจังหวัด" จริง ไม่ใช่ถนนชื่อเดียวกันในกรุงเทพ (เช่น ถนนกำแพงเพชร/พิษณุโลก)
    if prov in _bbox:return _bbox[prov]
    url="https://nominatim.openstreetmap.org/search?"+urllib.parse.urlencode({"q":f"จังหวัด{prov}","format":"json","limit":"8","accept-language":"th","countrycodes":"th"})
    req=urllib.request.Request(url,headers={"User-Agent":"PAI-LAO/3.0 (admin@pai-lao.com)"})
    _bbox[prov]=None
    try:
        with urllib.request.urlopen(req,timeout=60) as r:arr=json.loads(r.read())
        for it in arr:
            bb=it.get("boundingbox")
            if not bb:continue
            S,N,W,E=float(bb[0]),float(bb[1]),float(bb[2]),float(bb[3])
            # ต้องเป็น boundary การปกครอง + ใหญ่พอเป็นจังหวัด (กันถนน/จุดเดี่ยวที่กรอบเล็ก)
            if it.get("class")=="boundary" and (N-S)>=0.12 and (E-W)>=0.12:
                _bbox[prov]=(S,W,N,E);break
        if not _bbox[prov]:print(f"   ⚠️ bbox จังหวัด {prov} ไม่เจอขอบเขตที่ถูกต้อง — ข้าม",flush=True)
    except Exception as e:
        print(f"   bbox fail {prov}: {e}",flush=True)
    time.sleep(1.1);return _bbox[prov]

def fetch(q):
    global _si
    data=urllib.parse.urlencode({"data":q}).encode()
    for att in range(6):
        url=OVERPASS[_si%len(OVERPASS)];_si+=1
        try:
            req=urllib.request.Request(url,data=data,headers={"User-Agent":"PAI-LAO/3.0","Content-Type":"application/x-www-form-urlencoded"})
            with urllib.request.urlopen(req,timeout=180) as r:return json.loads(r.read())["elements"]
        except Exception as e:
            print("    retry:",e,flush=True);time.sleep(10)
    return []

todo=list(REGIONS) if REGIONS_TODO=="all" else [REGIONS_TODO]
written=[]
for region in todo:
    provs=REGIONS[region];allp=[]
    print(f"\n===== {region} ({len(provs)} จังหวัด) =====",flush=True)
    for prov in provs:
        bb=province_bbox(prov)
        if not bb:print(f"  -- {prov}: ข้าม --",flush=True);continue
        S,W,N,E=bb;BB=f"{S},{W},{N},{E}"
        # query เดียว: ดึงทุก key ที่สนใจในกรอบจังหวัด
        q=(f'[out:json][timeout:120];('
           f'node["tourism"]({BB});node["historic"]({BB});node["natural"]({BB});'
           f'node["amenity"~"place_of_worship|marketplace|cafe|restaurant|food_court"]({BB});'
           f'node["leisure"~"nature_reserve|water_park|beach_resort"]({BB});'
           f'node["shop"~"mall|coffee"]({BB});way["natural"="beach"]({BB}););out center body;')
        els=fetch(q)
        cnt={}; pp=[]
        for el in els:
            t=el.get("tags",{}); title=gt(t,"name","name:th")
            if not title or len(title)<2: continue
            cat=categorize(t)
            if not cat: continue
            cap=CAP_PER_CAT.get(cat,CAP_PER_CAT["_default"])
            if cnt.get(cat,0)>=cap: continue
            lat=el.get("lat") or (el.get("center",{}) or {}).get("lat")
            lng=el.get("lon") or (el.get("center",{}) or {}).get("lng") or (el.get("center",{}) or {}).get("lon")
            if not lat or not lng: continue
            lat,lng=float(lat),float(lng)
            pp.append({"title":title,"titleEn":gt(t,"name:en","int_name") or None,"province":prov,
                "district":cd(gt(t,"addr:district","is_in:district","addr:county"),prov),
                "address":gt(t,"addr:full","addr:street") or None,"googleMapsUrl":f"https://www.google.com/maps?q={lat},{lng}",
                "lat":lat,"lng":lng,"category":cat,"tags":CAT_TAGS.get(cat,[]),
                "description":gt(t,"description","description:th") or f"{title} ตั้งอยู่ใน{prov} เป็นสถานที่ที่น่าสนใจ",
                "openHours":gt(t,"opening_hours") or None,"phone":gt(t,"phone","contact:phone") or None,
                "website":gt(t,"website","contact:website") or None,"amenities":[],"coverUrl":"/images/default-place.svg"})
            cnt[cat]=cnt.get(cat,0)+1
        pp=dedup(pp);allp.extend(pp)
        print(f"  -- {prov}: {len(pp)}  {dict(cnt)}",flush=True)
        time.sleep(DELAY_SEC)
    allp=dedup(allp)
    fn=os.path.join(OUT_DIR,f"{region}.json")
    json.dump(allp,open(fn,"w",encoding="utf-8"),ensure_ascii=False,indent=2)
    written.append(fn);print(f"  ✅ {region}: {len(allp)} → {fn}",flush=True)

zname="seed-data.zip"
with zipfile.ZipFile(zname,"w") as z:
    for f in written:z.write(f)
print(f"\nเสร็จ! ดาวน์โหลด {zname}",flush=True)
try:
    from google.colab import files; files.download(zname)
except Exception: print("(ไม่ใช่ Colab — ไฟล์อยู่ใน seed-data/)")

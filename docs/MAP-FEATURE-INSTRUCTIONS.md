# คำสั่งเพิ่มแผนที่ OpenStreetMap — pai-lao-web

> สำหรับ Claude Code: ใช้ **react-leaflet + OpenStreetMap** (ฟรี ไม่ต้องมี API key) แสดงแผนที่ในเว็บ + ปุ่มเปิด Google Maps ภายนอก
> ทำเป็นเฟส: PHASE 0 (setup) → 1 (หน้า place) → 2 (หน้าทริป) → 3 (map picker, ต้องแก้ schema)
> 🔁 **มีแผน rollback ทุกเฟสท้ายเอกสาร — อ่านก่อนเริ่ม**

---

## หลักการกัน rollback ยุ่งยาก (ทำก่อนแตะโค้ด)

1. **แตก branch ใหม่:** `git checkout -b feat/osm-maps` — ทำงานบนนี้ทั้งหมด commit แยกทีละเฟส
2. **Feature flag:** ใช้ env `NEXT_PUBLIC_ENABLE_MAPS` คุมการแสดงแผนที่ — ถ้ามีปัญหาบน production ตั้งเป็น `false` แล้ว redeploy = ปิดแผนที่ทันทีโดยโค้ดยังอยู่
3. ทุกเฟสออกแบบให้เป็น **additive** (เพิ่มไฟล์ใหม่ + แทรกโค้ดจุดเล็ก ๆ) → revert ง่าย
4. PHASE 1–2 **ไม่แตะ database** เลย (ใช้พิกัดจาก Place ที่มีอยู่แล้ว) — ปลอดภัยสุด ทำ 2 เฟสนี้ก่อน

---

## PHASE 0 — Setup (ไลบรารี + helper + component กลาง)

### 0.1 ติดตั้ง
```bash
npm i leaflet react-leaflet
npm i -D @types/leaflet
```
> ⚠️ โปรเจกต์ใช้ React 19 — ถ้าเจอ peer-dependency error ให้ใช้ react-leaflet เวอร์ชันที่รองรับ React 19 (v5+). ทางสุดท้ายค่อยใช้ `--legacy-peer-deps`
> 🔗 **ข้ามเอกสาร — ถ้าทำ FIX 2 (CSP) ใน FIX-INSTRUCTIONS แล้ว:** ต้องเพิ่ม tile ของ OSM ใน `img-src` ของ CSP ไม่งั้นแผนที่จะขึ้นจอเทา → เพิ่ม `https://*.tile.openstreetmap.org` (และคง `data: blob:` ไว้สำหรับไอคอนหมุด)

### 0.2 helper ลิงก์ Google Maps — `lib/maps.ts` (ไม่มี DOM ใช้ที่ไหนก็ได้)
```ts
// lib/maps.ts
export function googleMapsPoint(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

// เส้นทางหลายจุด (waypoints ฟรีได้ ~9 จุด)
export function googleMapsRoute(points: { lat: number; lng: number }[]): string {
  if (points.length === 0) return "#";
  if (points.length === 1) return googleMapsPoint(points[0].lat, points[0].lng);
  const origin = points[0];
  const dest = points[points.length - 1];
  const mid = points.slice(1, -1).slice(0, 9).map(p => `${p.lat},${p.lng}`).join("|");
  const qs = new URLSearchParams({
    api: "1",
    origin: `${origin.lat},${origin.lng}`,
    destination: `${dest.lat},${dest.lng}`,
  });
  if (mid) qs.set("waypoints", mid);
  return `https://www.google.com/maps/dir/?api=1&${qs.toString()}`;
}

export const MAPS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MAPS !== "false"; // default เปิด

// ── ปุ่ม "เปิดใน Google Maps" — ใช้ลิงก์ต้นฉบับก่อน (ได้ชื่อ/รีวิว) แล้ว fallback พิกัด ──
export function googleMapsOpen(o: { url?: string | null; lat?: number | null; lng?: number | null }): string {
  if (o.url) return o.url;
  if (o.lat != null && o.lng != null) return googleMapsPoint(o.lat, o.lng);
  return "#";
}

// ── ดึง lat/lng จากลิงก์ Google Maps (URL เต็ม) — sync, ใช้ที่ไหนก็ได้ ──
export function extractLatLngFromGoogleUrl(url: string): { lat: number; lng: number } | null {
  if (!url) return null;
  let m =
    url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||   // 1) หมุดจริงของสถานที่ (แม่นสุด)
    url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||       // 2) จุดกึ่งกลางจอ
    url.match(/[?&](?:q|query|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/); // 3) q=/query=/destination=
  if (!m) return null;
  const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

// ── ลิงก์สั้น (maps.app.goo.gl / goo.gl/maps) ต้อง resolve redirect ก่อน — ⚠️ server only ──
export async function googleUrlToLatLng(url: string): Promise<{ lat: number; lng: number } | null> {
  if (!url) return null;
  const direct = extractLatLngFromGoogleUrl(url);
  if (direct) return direct;
  if (/(maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(url)) {
    try {
      const res = await fetch(url, { redirect: "follow" }); // res.url = ปลายทางหลัง redirect
      return extractLatLngFromGoogleUrl(res.url || "");
    } catch { return null; }
  }
  return null;
}
```

### 0.3 component แผนที่จริง — `components/maps/LeafletMap.tsx` (`"use client"`)
```tsx
"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "@/lib/leafletIcon"; // icon fix (PHASE 0.5)

export interface MapPoint { lat: number; lng: number; label?: string; href?: string; }

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(points.map(p => [p.lat, p.lng]) as [number, number][], { padding: [30, 30] });
    }
  }, [points, map]);
  return null;
}

export default function LeafletMap({
  points, showRoute = false, height = 360, zoom = 13,
}: { points: MapPoint[]; showRoute?: boolean; height?: number; zoom?: number }) {
  if (!points.length) return null;
  const center: [number, number] = [points[0].lat, points[0].lng];
  const line = points.map(p => [p.lat, p.lng]) as [number, number][];
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={false}
      style={{ height, width: "100%", borderRadius: 16 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {showRoute && line.length > 1 && <Polyline positions={line} />}
      {points.map((p, i) => (
        <Marker key={i} position={[p.lat, p.lng]}>
          {p.label && <Popup>{p.href ? <a href={p.href}>{p.label}</a> : p.label}</Popup>}
        </Marker>
      ))}
      <FitBounds points={points} />
    </MapContainer>
  );
}
```

### 0.4 ตัวห่อกัน SSR พัง — `components/maps/MapView.tsx` (`"use client"`)
Leaflet ใช้ `window` → ต้อง render เฉพาะ client ด้วย `dynamic({ ssr: false })`
```tsx
"use client";
import dynamic from "next/dynamic";
import type { MapPoint } from "./LeafletMap";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div style={{ height: 360, borderRadius: 16, background: "#e2e8f0" }} />,
});

export type { MapPoint };
export default function MapView(props: {
  points: MapPoint[]; showRoute?: boolean; height?: number; zoom?: number;
}) {
  return <LeafletMap {...props} />;
}
```
> Server Component (หน้า place/trip) import **`MapView`** เท่านั้น (ห้าม import `LeafletMap` ตรง ๆ)

### 0.5 ไอคอนหมุด Leaflet ใช้ร่วม — `lib/leafletIcon.ts`
สร้างไฟล์นี้ แล้ว `import "@/lib/leafletIcon";` ทั้งใน `LeafletMap.tsx` (PHASE 0.3) และ `PlacePicker.tsx` (PHASE B.3) — ไม่งั้นหมุดจะหาย
```ts
// lib/leafletIcon.ts
import L from "leaflet";
import i2x from "leaflet/dist/images/marker-icon-2x.png";
import i1x from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({
  iconRetinaUrl: (i2x as any).src, iconUrl: (i1x as any).src, shadowUrl: (shadow as any).src,
});
```

**เกณฑ์ตรวจรับ PHASE 0:** `npm run build` ผ่าน, ไม่มี error เรื่อง `window is not defined`, แผนที่ขึ้นหมุดได้ (ไอคอนไม่หาย)

---

## PHASE A — เตรียมพิกัดจากลิงก์ Google (ทำให้ของเก่ามีหมุด)

> เป้าหมาย: เอา `googleMapsUrl` ที่กรอกมาแล้ว → ดึง lat/lng → เก็บลงคอลัมน์ `lat`/`lng` ของ Place (มีอยู่แล้ว ไม่ต้องแก้ schema)
> ทำ 2 ทาง: (A1) backfill ของเก่าทั้งหมดครั้งเดียว, (A2) ดึงอัตโนมัติตอนกรอก/แก้ไขใหม่

### A1. สคริปต์ backfill — `scripts/backfill-coords.ts`
```ts
import { prisma } from "@/lib/prisma";
import { googleUrlToLatLng } from "@/lib/maps";

async function main() {
  const rows = await prisma.place.findMany({
    where: { googleMapsUrl: { not: null }, OR: [{ lat: null }, { lng: null }] },
    select: { id: true, googleMapsUrl: true },
  });
  let ok = 0;
  for (const r of rows) {
    const c = await googleUrlToLatLng(r.googleMapsUrl!);
    if (c) {
      await prisma.place.update({ where: { id: r.id }, data: { lat: c.lat, lng: c.lng } });
      ok++;
    }
    await new Promise(res => setTimeout(res, 200)); // กัน rate-limit ตอน resolve ลิงก์สั้น
  }
  console.log(`Backfill: ${ok}/${rows.length} places`);
  await prisma.$disconnect();
}
main();
```
รัน: `npx tsx scripts/backfill-coords.ts`
> 📸 **ก่อนรัน: snapshot/backup DB ก่อน** (สคริปต์เขียนทับเฉพาะแถวที่ lat/lng ว่างอยู่แล้ว ความเสี่ยงต่ำ แต่กันไว้)
> 🛠️ ถ้า `@/` alias ไม่ resolve ตอนรันด้วย tsx ให้ใช้ import แบบ relative (`../lib/prisma`, `../lib/maps`) หรือรัน `npx tsx -r tsconfig-paths/register scripts/backfill-coords.ts`; และต้องมี `DATABASE_URL` ใน env ตอนรัน (โหลด `.env` ผ่าน dotenv ถ้าจำเป็น)
> ลิงก์เต็มดึงได้ทันที; ลิงก์สั้น `maps.app.goo.gl` จะถูก fetch ตาม redirect ให้อัตโนมัติ; แถวที่ดึงไม่ได้จะถูกข้าม (lat/lng คงเป็น null)

### A2. ดึงอัตโนมัติตอนกรอก/แก้ไขสถานที่
ใน API ที่ create/update place (เช่น `app/api/places/route.ts` หรือ admin places) — เมื่อมี `googleMapsUrl` แต่ไม่มี lat/lng ที่ส่งมา ให้ดึงก่อนบันทึก:
```ts
import { googleUrlToLatLng } from "@/lib/maps";
// ...
let { lat, lng, googleMapsUrl } = body;
if ((lat == null || lng == null) && googleMapsUrl) {
  const c = await googleUrlToLatLng(googleMapsUrl);
  if (c) { lat = c.lat; lng = c.lng; }
}
// แล้วบันทึก lat, lng ลง DB ตามปกติ
```

**เกณฑ์ตรวจรับ PHASE A:**
- รัน backfill แล้ว Place ที่เคยมีแต่ลิงก์ มี lat/lng ขึ้น (เช็คใน DB)
- สร้างสถานที่ใหม่โดยวางลิงก์ Google (ทั้งเต็มและลิงก์สั้น) → lat/lng ถูกเติมอัตโนมัติ
- หมุดบน OSM ตรงกับตำแหน่งใน Google

---

## PHASE 1 — หน้าสถานที่ `app/place/[slug]/page.tsx` (ไม่แตะ DB) — ✅ ทำแล้ว

1. ตรวจ prisma query ของหน้านี้ให้ **select `lat`, `lng`** ของ place ออกมาด้วย (ถ้าใช้ `select`)
2. หาส่วนแสดงที่อยู่/ข้อมูลติดต่อของสถานที่ แล้วแทรกใต้ส่วนนั้น:
```tsx
import MapView from "@/components/maps/MapView";
import { googleMapsOpen, MAPS_ENABLED } from "@/lib/maps";
// ...
{MAPS_ENABLED && place.lat != null && place.lng != null && (
  <section style={{ marginTop: 24 }}>
    <h3>แผนที่</h3>
    <MapView points={[{ lat: place.lat, lng: place.lng, label: place.title }]} height={320} />
    <a href={googleMapsOpen({ url: place.googleMapsUrl, lat: place.lat, lng: place.lng })}
       target="_blank" rel="noopener noreferrer"
       style={{ display: "inline-block", marginTop: 12, padding: "10px 20px", background: "#10b981", color: "#fff", borderRadius: 10, textDecoration: "none", fontWeight: 700 }}>
      🧭 นำทางด้วย Google Maps
    </a>
  </section>
)}
```
> `googleMapsOpen` ใช้ `googleMapsUrl` ต้นฉบับก่อน (เปิดแล้วเห็นชื่อร้าน/รีวิว) ถ้าไม่มีค่อย fallback เป็นพิกัด — ถ้า place ไม่มีทั้งพิกัดและลิงก์ ส่วนนี้จะไม่แสดง

**เกณฑ์ตรวจรับ:** เปิดหน้า place ที่มีพิกัด → เห็นแผนที่ + หมุดถูกตำแหน่ง + ปุ่มเปิด Google Maps ตรงจุดเดียวกัน; หน้า place ที่ไม่มีพิกัด → ไม่พัง

---

## PHASE 2 — หน้าทริป `app/trips/[slug]/page.tsx` (ไม่แตะ DB, ใช้พิกัดจาก Place ที่ผูก)

1. ตอน fetch timeline stops ให้ include พิกัดจาก place ที่ผูกไว้:
```ts
timeline: {
  orderBy: { order: "asc" },
  include: { place: { select: { lat: true, lng: true, title: true, slug: true } } },
},
```
2. สร้างลิสต์จุดที่มีพิกัด แล้ววางแผนที่ในส่วน timeline/เส้นทาง:
```tsx
import MapView from "@/components/maps/MapView";
import { googleMapsRoute, MAPS_ENABLED } from "@/lib/maps";
// ...
const routePoints = trip.timeline
  .filter((s: any) => s.place?.lat != null && s.place?.lng != null)
  .map((s: any) => ({
    lat: s.place.lat, lng: s.place.lng,
    label: s.placeName || s.place.title,
    href: s.place.slug ? `${SITE_URL}/place/${s.place.slug}` : undefined,
  }));
// ...
{MAPS_ENABLED && routePoints.length > 0 && (
  <section style={{ margin: "24px 0" }}>
    <h3>เส้นทางทริป</h3>
    <MapView points={routePoints} showRoute height={400} />
    {routePoints.length > 1 && (
      <a href={googleMapsRoute(routePoints)} target="_blank" rel="noopener noreferrer"
         style={{ display: "inline-block", marginTop: 12, padding: "10px 20px", background: "#2563eb", color: "#fff", borderRadius: 10, textDecoration: "none", fontWeight: 700 }}>
        🧭 นำทางทั้งเส้นทางด้วย Google Maps
      </a>
    )}
  </section>
)}
```
> วางเป็นแท็บสลับ "ไทม์ไลน์ / แผนที่" ก็ได้ถ้าอยากให้เนียน

**เกณฑ์ตรวจรับ:** ทริปที่มีจุดผูก place → เห็นหมุดทุกจุด + เส้นเชื่อม + ปุ่มนำทางทั้งเส้นทางเปิด Google Maps ครบจุด; ทริปที่ไม่มีจุดผูก place → ส่วนแผนที่ไม่แสดง ไม่พัง

---

## PHASE B — Place map picker + กันสถานที่ซ้ำ (duplicate-aware) — ไม่แตะ schema

> Place มี `lat`/`lng` อยู่แล้ว → ใส่ picker ได้เลยไม่ต้อง migration (ปลอดภัยกว่า PHASE 3 ของทริป)
> ⚠️ **ของสำคัญ:** ระบบกันซ้ำที่มีอยู่ (`/api/admin/nearby-places`, `/api/admin/duplicate-places`) ทำงานด้วย **lat/lng ล้วน** (Haversine รัศมี 50m + ชื่อคล้าย ≥ 60%) — งานนี้คือเชื้อเพลิงของมันโดยตรง picker ที่ปักแม่นจะทำให้กันซ้ำได้ผลจริง

### B.1 รวม helper เรขาคณิตที่ซ้ำกัน → `lib/geo.ts`
ตอนนี้ `haversine` / `levenshtein` / `nameSimilarity` **ถูกก๊อปซ้ำในทั้ง 2 ไฟล์** (`nearby-places`, `duplicate-places`) — ย้ายมาที่เดียว:
```ts
// lib/geo.ts
export const DUP_RADIUS_M = 50;
export const DUP_SIM_THRESHOLD = 0.6;
export const DUP_BBOX = 0.0005; // ±~55m

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const φ1 = (lat1*Math.PI)/180, φ2 = (lat2*Math.PI)/180;
  const Δφ = ((lat2-lat1)*Math.PI)/180, Δλ = ((lng2-lng1)*Math.PI)/180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
export function levenshtein(a: string, b: string): number {
  const m=a.length, n=b.length;
  const dp:number[][]=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i||j));
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)
    dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}
export function nameSimilarity(a: string, b: string): number {
  const clean=(s:string)=>s.trim().toLowerCase().replace(/\s+/g,"");
  const ca=clean(a), cb=clean(b);
  if(ca===cb) return 1;
  if(ca.includes(cb)||cb.includes(ca)) return 0.92;
  return 1 - levenshtein(ca,cb)/Math.max(ca.length,cb.length);
}
```
แล้วใน `nearby-places/route.ts` + `duplicate-places/route.ts` ลบฟังก์ชันซ้ำออก เปลี่ยนเป็น `import { haversine, nameSimilarity, DUP_RADIUS_M, DUP_SIM_THRESHOLD, DUP_BBOX } from "@/lib/geo";` (พฤติกรรมเดิมเป๊ะ แค่ไม่ซ้ำโค้ด)

### B.2 endpoint เช็คซ้ำตอนสร้าง (ใหม่) — `app/api/places/nearby-check/route.ts`
ของเดิมเป็น admin-only + ต้องมี placeId (ใช้กับ place ที่สร้างแล้ว) — create-time ต้องมีตัวที่รับ lat/lng+ชื่อ และให้คนสร้าง place เรียกได้:
```ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { haversine, nameSimilarity, DUP_RADIUS_M, DUP_SIM_THRESHOLD, DUP_BBOX } from "@/lib/geo";

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { lat, lng, name, excludeId } = await req.json();
  if (lat == null || lng == null || !name?.trim()) return NextResponse.json({ nearby: [] });
  const δ = DUP_BBOX;
  const candidates = await prisma.place.findMany({
    where: {
      approvalStatus: "APPROVED",
      ...(excludeId ? { id: { not: excludeId } } : {}),
      lat: { gte: lat - δ, lte: lat + δ },
      lng: { gte: lng - δ, lte: lng + δ },
    },
    select: { id:true, slug:true, title:true, province:true, district:true, lat:true, lng:true },
  });
  const nearby = candidates
    .map(p => ({ ...p,
      distanceM: Math.round(haversine(lat,lng,p.lat!,p.lng!)),
      similarity: Math.round(nameSimilarity(name,p.title)*100) }))
    .filter(p => p.distanceM <= DUP_RADIUS_M && p.similarity >= DUP_SIM_THRESHOLD*100)
    .sort((a,b)=>a.distanceM-b.distanceM);
  return NextResponse.json({ nearby });
}
```

### B.3 component picker — `components/maps/PlacePicker.tsx` (`"use client"`)
```tsx
"use client";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "@/lib/leafletIcon"; // icon fix ใช้ร่วม (PHASE 0.5)

function ClickCapture({ onPick }: { onPick: (lat:number,lng:number)=>void }) {
  useMapEvents({ click(e){ onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}
export default function PlacePicker({ value, onChange, height = 360 }: {
  value: { lat: number|null; lng: number|null };
  onChange: (lat: number, lng: number) => void;
  height?: number;
}) {
  const center: [number,number] =
    value.lat!=null && value.lng!=null ? [value.lat, value.lng] : [13.736, 100.523]; // กทม. default
  return (
    <MapContainer center={center} zoom={13} style={{ height, width:"100%", borderRadius:16 }}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickCapture onPick={onChange} />
      {/* LocateButton (GPS) จาก B.7 วางตรงนี้ */}
      {value.lat!=null && value.lng!=null && <Marker position={[value.lat, value.lng]} />}
    </MapContainer>
  );
}
```
> import เข้าฟอร์มผ่าน `dynamic(() => import("@/components/maps/PlacePicker"), { ssr:false })` เหมือน MapView (กัน `window is not defined`)

### B.4 ใส่ picker ในหน้า + เตือนซ้ำก่อนบันทึก
หน้าที่ต้องใส่:
- `app/business/places/create/page.tsx`
- `app/business/places/[slug]/edit/page.tsx` (และ `app/business/places/edit/page.tsx` ถ้ามี)
- `app/admin/places/page.tsx` (ถ้ามีฟอร์ม create/edit)

logic ในฟอร์ม: เก็บ `lat`/`lng` ใน state → พอปักหมุด (และมีชื่อแล้ว) ให้ **debounce ~500ms เรียก `/api/places/nearby-check`** แล้วโชว์ banner เตือน:
```tsx
// pseudo
useEffect(() => {
  if (lat == null || lng == null || !name.trim()) return;
  const t = setTimeout(async () => {
    const r = await fetch("/api/places/nearby-check", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ lat, lng, name, excludeId }), // excludeId = id ตอน edit
    });
    const { nearby } = await r.json();
    setDupWarning(nearby); // ถ้ามี → แสดง "⚠️ ใกล้กับ: <ชื่อ> (ห่าง Xm, คล้าย Y%)"
  }, 500);
  return () => clearTimeout(t);
}, [lat, lng, name]);
```
> เตือนอย่างเดียว ไม่บล็อก (ให้คนตัดสินใจ) — หรือจะบังคับยืนยันก่อนบันทึกก็ได้

### B.5 ฝั่ง server: picker มาก่อน + เก็บพิกัดย้อนเป็น googleMapsUrl
ใน API create/update place — ลำดับ: ปักหมุด/GPS มาก่อน → ไม่มีพิกัดค่อยดึงจากลิงก์ → **มีพิกัดแต่ไม่มีลิงก์ ให้สร้าง `googleMapsUrl` จากพิกัด** (ปุ่ม "เปิด Google Maps" จะใช้ได้เสมอแม้ผู้ใช้ไม่ได้วางลิงก์มา):
```ts
import { googleUrlToLatLng, googleMapsPoint } from "@/lib/maps";

let { lat, lng, googleMapsUrl } = body;

// 1) ปักหมุด/GPS มาก่อน — ถ้าไม่มีพิกัดแต่มีลิงก์ ค่อยดึงจากลิงก์ (PHASE A2)
if ((lat == null || lng == null) && googleMapsUrl) {
  const c = await googleUrlToLatLng(googleMapsUrl);
  if (c) { lat = c.lat; lng = c.lng; }
}

// 2) มีพิกัดแต่ไม่มีลิงก์ → สร้าง googleMapsUrl จากพิกัด (ให้ปุ่มเปิด Google Maps ใช้ได้เสมอ)
if (lat != null && lng != null && !googleMapsUrl) {
  googleMapsUrl = googleMapsPoint(lat, lng);
}

// บันทึก lat, lng, googleMapsUrl ลง DB ทั้งสามค่า
```
> ผลลัพธ์: ไม่ว่าผู้ใช้จะ (ก) วางลิงก์ Google, (ข) ปักหมุดเอง, หรือ (ค) กด GPS — สุดท้าย Place จะมีครบทั้ง `lat`/`lng` (ไว้ขึ้น OSM) และ `googleMapsUrl` (ไว้กดเปิด Google Maps)

### B.6 เช็กลิสต์หลัง backfill (PHASE A)
หลังรัน backfill พิกัดจะเต็มขึ้นเยอะ → หน้า `admin/duplicates` จะเจอคู่ซ้ำที่เคยซ่อนอยู่ **โผล่มาทีเดียวเยอะ** เป็นเรื่องปกติ:
1. รัน backfill
2. เข้า `admin/duplicates` รีวิว/merge คู่ที่ซ้ำจริง
3. คู่ที่ระยะใกล้แต่คนละที่ (เช่น ร้านในห้างเดียวกัน) = false positive ปล่อยได้

### B.7 ปุ่ม GPS (ใช้ตำแหน่งปัจจุบัน) — Geolocation API
ใช้ของในตัวเบราว์เซอร์ ไม่ต้องมี key/ไลบรารี แต่ต้องเตรียม 3 อย่าง:

**(1) ⚠️ แก้ `next.config.ts` — ตอนนี้บล็อก GPS อยู่**
ค่าเดิม `geolocation=()` = ปิดทุก origin รวมเว็บตัวเอง → เปลี่ยนเป็น `geolocation=(self)`:
```ts
{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" }
```

**(2) ต้องเสิร์ฟผ่าน HTTPS** (โดเมนจริงผ่านอยู่แล้ว; localhost ก็ใช้ได้)

**(3) ปุ่มเรียก `getCurrentPosition`** — วางใน `<MapContainer>` ของ `PlacePicker` (ใช้ `useMap`):
```tsx
import { useMap } from "react-leaflet";
import { useState } from "react";

function LocateButton({ onLocate }: { onLocate: (lat: number, lng: number) => void }) {
  const map = useMap();
  const [loading, setLoading] = useState(false);
  function locate() {
    if (!navigator.geolocation) { alert("เบราว์เซอร์ไม่รองรับ GPS"); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onLocate(latitude, longitude);        // set ลง state เดียวกับ picker
        map.setView([latitude, longitude], 17);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        alert(err.code === err.PERMISSION_DENIED
          ? "กรุณาอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์"
          : "ระบุตำแหน่งไม่สำเร็จ ลองใหม่หรือปักเอง");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }
  return (
    <button type="button" onClick={locate} disabled={loading}
      style={{ position:"absolute", zIndex:1000, top:10, right:10, padding:"8px 12px",
               background:"#fff", border:"1px solid #cbd5e1", borderRadius:8, fontWeight:700 }}>
      {loading ? "กำลังหา…" : "📍 ใช้ตำแหน่งปัจจุบัน"}
    </button>
  );
}
```
แล้ววาง `<LocateButton onLocate={onChange} />` ไว้ใน `<MapContainer>` ของ `PlacePicker` (B.3)
> GPS แค่เซ็ตค่าลง state เดียวกับการคลิกปักหมุด → ไหลเข้า B.5 และถูกแปลงเป็น `googleMapsUrl` อัตโนมัติเหมือนกัน

**⚠️ ความแม่น (เกี่ยวกับกันซ้ำ 50m โดยตรง):** มือถือ GPS ~5–20m (ดี) แต่เดสก์ท็อปที่ระบุจาก WiFi/IP อาจคลาด 100m+ → อย่าใช้ค่า GPS ดื้อ ๆ ให้ผู้ใช้**ลากปรับหมุดยืนยัน**ก่อนบันทึกเสมอ (ไม่งั้นชนรัศมีกันซ้ำผิด)

**เกณฑ์ตรวจรับ PHASE B:**
- ปักหมุด/กด GPS ในฟอร์มสร้าง place → lat/lng ถูกบันทึก, หน้า place แสดงหมุดตรงจุด
- place ที่ปัก/GPS โดยไม่วางลิงก์ Google → มี `googleMapsUrl` ที่สร้างจากพิกัด ปุ่ม "เปิด Google Maps" ใช้ได้
- ปักใกล้สถานที่เดิมชื่อคล้ายกัน (< 50m, ชื่อ ≥ 60%) → ขึ้น banner เตือนก่อนบันทึก
- ปุ่ม GPS ทำงาน (หลังแก้ `Permissions-Policy=geolocation=(self)`) และจัดการเคสปฏิเสธสิทธิ์ได้
- `nearby-places`/`duplicate-places` ยังทำงานเหมือนเดิมหลัง refactor `lib/geo.ts`

**Rollback PHASE B:** เป็นไฟล์ใหม่ + แทรกโค้ด ไม่แตะ schema → `git revert` ได้ทันที; refactor `lib/geo.ts` ถ้าจะย้อนก็แค่ก๊อปฟังก์ชันกลับเข้า 2 ไฟล์เดิม; ส่วน `Permissions-Policy` ถ้าจะปิด GPS กลับเป็น `geolocation=()` ได้

---

## PHASE 3 — (ทำทีหลัง) เพิ่มพิกัดให้ทุกจุดในทริป + map picker ⚠️ แตะ schema

### 3.1 แก้ schema — `prisma/schema.prisma` model `TimelineStop`
เพิ่ม 2 ฟิลด์ (nullable เพื่อไม่กระทบข้อมูลเดิม):
```prisma
lat Float?
lng Float?
```
อัปเดต DB:
```bash
npx prisma db push   # ⚠️ ใช้ db push — โปรเจกต์นี้ไม่มี migrations folder (sync ตรง)
```
> ⚠️ **ห้ามใช้ `prisma migrate dev`** — โปรเจกต์นี้ไม่มี migration history (`prisma/migrations/` ว่าง) `migrate dev` จะตรวจเจอ drift แล้ว**อาจขอ reset DB = ข้อมูลหาย**
> `db push` เพิ่มคอลัมน์ nullable แบบ additive ไม่ลบข้อมูล — ของเก่าได้ค่า null
> 🚀 **ตอน deploy ต้องรัน `npx prisma db push` กับ DB จริง (Supabase) ด้วย** ไม่งั้น API เขียน lat/lng แล้ว error "column does not exist"

### 3.2 รับ/บันทึก lat,lng ใน API — ⚠️ มี 5 จุด ต้องแก้ครบทุกจุด
ทุก block ที่ `.create` timeline ต้องเพิ่ม `lat: stop.lat ?? null, lng: stop.lng ?? null` — พลาดจุดใด = แก้ทริปผ่าน path นั้นแล้วพิกัดหาย:
- `app/api/trips/route.ts` ~บรรทัด 232 (POST สร้างทริป)
- `app/api/trips/[slug]/route.ts` ~บรรทัด 107 (admin แก้)
- `app/api/trips/[slug]/route.ts` ~บรรทัด 163 (draft finalize)
- `app/api/trips/[slug]/route.ts` ~บรรทัด 201 (draft update)
- `app/api/trips/[slug]/route.ts` ~บรรทัด 241 (เจ้าของแก้ตอน PENDING)

### 3.3 map picker ใน `app/trips/create/page.tsx` + `app/trips/[slug]/edit/page.tsx`
เพิ่ม `PlacePicker` (จาก B.3) แบบคลิกปักหมุดในเอดิเตอร์แต่ละ stop เก็บค่าลง state ของ stop นั้น

### 3.4 ให้ PHASE 2 ใช้พิกัดของ stop ก่อน แล้ว fallback ไป place
```ts
const lat = s.lat ?? s.place?.lat;
const lng = s.lng ?? s.place?.lng;
```

**เกณฑ์ตรวจรับ:** สร้างทริปใหม่ปักหมุดเองได้ → หน้าทริปแสดงครบทุกจุด แม้จุดที่ไม่ได้ผูก place

---

## PHASE C — auto-pin: เชื่อม place / ใส่ลิงก์ Google แล้วหมุดเด้งทันที (ไม่แตะ schema)

> ปัญหาปัจจุบัน: ในหน้าสร้างทริป เมื่อ "เชื่อมสถานที่" หรือวางลิงก์ Google แล้ว หมุดบนแผนที่ **ยังไม่ขึ้นเอง** ต้องคลิก/กด GPS เอง
> เป้าหมาย: ตั้ง `lat`/`lng` ของ stop อัตโนมัติจาก (1) place ที่เชื่อม หรือ (2) ลิงก์ Google → PlacePicker ปักหมุด + เลื่อนแผนที่มาให้เห็นทันที
> ใช้กับ `app/trips/create/page.tsx` และ `app/trips/[slug]/edit/page.tsx` (และนำไปใช้กับ place picker ใน PHASE B ได้ด้วย)

### C.1 ให้ PlacePicker เลื่อนแผนที่ตามค่าที่เปลี่ยน
ตอนนี้ `<MapContainer center>` ตั้งแค่ตอน mount → ถ้า set lat/lng จากภายนอก หมุดขึ้นแต่แผนที่ไม่เลื่อนมาให้เห็น
ใน `components/maps/PlacePicker.tsx` เพิ่ม component ย่อย:
```tsx
import { useMap } from "react-leaflet";
import { useEffect } from "react";

function Recenter({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}
```
แล้ววางใน `<MapContainer>`:
```tsx
<Recenter lat={value.lat} lng={value.lng} />
```

### C.2 เชื่อม place → เติม lat/lng ของ place
**ขั้นแรก: ให้ API ค้นหา place คืน lat/lng** — ใน `app/api/places/route.ts` (GET ค้นหา) และ `app/api/places/suggest/route.ts` เพิ่ม `lat: true, lng: true` ใน `select` (ตอนนี้ส่วนใหญ่ยังไม่ส่งมา จึงเป็นเหตุที่เชื่อมแล้วหมุดไม่ขึ้น)

จากนั้นในหน้าสร้าง/แก้ทริป ตรงฟังก์ชันที่เลือก/เชื่อม place (ที่ตั้ง `placeId`) เพิ่ม:
```ts
updateTimeline(idx, "lat", place.lat ?? null);
updateTimeline(idx, "lng", place.lng ?? null);
// (ถ้ามีข้อมูลด้วย ก็เติม province/district จาก place ได้เลย)
```
> ผล: พอกด "เชื่อมสถานที่" → lat/lng ไหลเข้า state → PlacePicker (C.1) ปักหมุด + เลื่อนมาให้เห็นทันที

### C.3 ใส่ลิงก์ Google → ดึงพิกัดอัตโนมัติ
ตรง input `googleMapsUrl` ของแต่ละ stop เพิ่ม handler ตอนพิมพ์/วางลิงก์:
```ts
import { extractLatLngFromGoogleUrl } from "@/lib/maps";

function onMapsUrlChange(idx: number, url: string) {
  updateTimeline(idx, "googleMapsUrl", url);
  const c = extractLatLngFromGoogleUrl(url);   // ลิงก์เต็ม: ได้ทันที (ไม่ยิงเน็ต)
  if (c) { updateTimeline(idx, "lat", c.lat); updateTimeline(idx, "lng", c.lng); }
}
```
- **ลิงก์เต็ม** (`@lat,lng` / `!3d!4d` / `?q=lat,lng`) → ดึงในเบราว์เซอร์ได้ทันที
- **ลิงก์สั้น** `maps.app.goo.gl` → ต้อง resolve ฝั่ง server: ทำ endpoint เล็ก ๆ
  ```ts
  // app/api/maps/resolve/route.ts
  import { NextResponse } from "next/server";
  import { getCurrentUser } from "@/lib/auth";
  import { googleUrlToLatLng } from "@/lib/maps";
  export async function POST(req: Request) {
    if (!(await getCurrentUser())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const { url } = await req.json();
    return NextResponse.json({ coord: await googleUrlToLatLng(url) });
  }
  ```
  แล้วฝั่ง client ถ้า `extractLatLngFromGoogleUrl` คืน null และเป็นลิงก์สั้น → POST ไป `/api/maps/resolve` เอาพิกัดมา set (มี loading นิดหน่อย)

**เกณฑ์ตรวจรับ PHASE C:**
- เชื่อม place ที่มีพิกัด → หมุดเด้งขึ้น + แผนที่เลื่อนมาที่จุดนั้นทันที
- วางลิงก์ Google เต็ม → หมุดเด้งทันที
- วางลิงก์สั้น → หมุดเด้งหลัง resolve เสร็จ
- ลากปรับหมุดเองยังทำได้ (override ค่าที่ auto มา)

**Rollback PHASE C:** เป็นการแทรกโค้ด/ไฟล์ใหม่ ไม่แตะ schema → `git revert` ได้ทันที

---

## 🔁 แผน ROLLBACK

### ปิดด่วนบน production (ไม่ต้องแก้โค้ด)
ตั้ง env `NEXT_PUBLIC_ENABLE_MAPS=false` บน Vercel → redeploy → แผนที่หายทุกหน้า (เพราะทุกจุด gate ด้วย `MAPS_ENABLED`)

### Revert ตามเฟส
- **PHASE A (backfill — เขียนข้อมูล ไม่แก้ schema):**
  - ก่อนรันต้อง **snapshot/backup DB** ไว้ → ถ้าผิดพลาด restore กลับได้
  - สคริปต์เขียนทับเฉพาะแถวที่ lat/lng ว่างอยู่แล้ว ไม่กระทบแถวที่มีพิกัดอยู่
  - ถ้าอยากย้อนเฉพาะที่ backfill: ก่อนรันให้บันทึก list ของ id ที่แก้ แล้ว set lat/lng = null กลับ (หรือ restore จาก backup)
  - ส่วน A2 (ดึงตอนกรอก) เป็นโค้ด → `git revert` ได้ปกติ
- **PHASE 0–2 (ไม่แตะ DB):** revert ง่าย เพราะเป็นไฟล์ใหม่ + แทรกโค้ด
  - `git revert <commit>` ของเฟสนั้น หรือถ้ายังไม่ merge ก็ทิ้ง branch `feat/osm-maps`
  - ถอนไลบรารี (ถ้าต้องการ): `npm uninstall leaflet react-leaflet @types/leaflet`
  - ลบโฟลเดอร์ `components/maps/`, ไฟล์ `lib/maps.ts`, และบล็อก `<MapView>` ที่แทรกในหน้า place/trip
- **PHASE 3 (แตะ DB ด้วย `db push`):**
  - คอลัมน์ `lat`/`lng` เป็น nullable + additive → ไม่มี data loss แม้ทิ้งไว้
  - **ทางที่แนะนำ: ปล่อยคอลัมน์ไว้** (ไม่กระทบอะไร) แล้ว `git revert` เฉพาะโค้ด — ปลอดภัยสุด
  - ถ้าจะลบคอลัมน์จริง ๆ: เอา 2 ฟิลด์ออกจาก `schema.prisma` แล้ว `npx prisma db push` (จะ drop คอลัมน์ → เสียเฉพาะค่า lat/lng ของ stop ที่เพิ่งปัก ซึ่ง fallback กลับไป place ได้)
  - ⚠️ **ห้าม `prisma migrate reset`** (ล้างทั้ง DB) — โปรเจกต์นี้ใช้ db push

### จุดสังเกตว่ามีปัญหา (ให้ rollback)
- `npm run build` fail เรื่อง `window is not defined` → แปลว่ามีที่ import `LeafletMap` ตรง ๆ แทน `MapView` (แก้ก่อน ไม่ต้อง rollback)
- หน้า place/trip 500 หรือจอขาว → ปิด flag ทันที แล้วหาสาเหตุ
- หมุดเพี้ยน → เช็คว่าใช้พิกัดชุดเดียวกันทั้งแสดงผลและลิงก์ Google (อย่า geocode ซ้ำคนละเจ้า)

## ลำดับลงมือแนะนำ
PHASE 0 → A → 1 (✅) → 2 → ทดสอบ/commit → B → ทดสอบ/commit → 3 (ทีหลัง)

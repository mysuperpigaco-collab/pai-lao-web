export function googleMapsPoint(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

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
  return `https://www.google.com/maps/dir/?${qs.toString()}`;
}

export const MAPS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MAPS !== "false";

// ── ปุ่ม "เปิดใน Google Maps" — ใช้ URL ต้นฉบับก่อน (เห็นชื่อ/รีวิว) แล้ว fallback พิกัด ──
export function googleMapsOpen(o: {
  url?: string | null;
  lat?: number | null;
  lng?: number | null;
}): string {
  if (o.url) return o.url;
  if (o.lat != null && o.lng != null) return googleMapsPoint(o.lat, o.lng);
  return "#";
}

// ── ดึง lat/lng จากลิงก์ Google Maps (sync, ใช้ที่ไหนก็ได้) ──
export function extractLatLngFromGoogleUrl(
  url: string,
): { lat: number; lng: number } | null {
  if (!url) return null;
  const m =
    url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
    url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
    url.match(/[?&](?:q|query|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

// ── resolve ลิงก์สั้น (maps.app.goo.gl / goo.gl/maps) — ⚠️ server only ──
export async function googleUrlToLatLng(
  url: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!url) return null;
  const direct = extractLatLngFromGoogleUrl(url);
  if (direct) return direct;
  if (/(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)/i.test(url)) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PaiLaoBot/1.0)" },
      });
      // 1) ลองจาก URL ปลายทางหลัง redirect ก่อน
      const fromUrl = extractLatLngFromGoogleUrl(res.url || "");
      if (fromUrl) return fromUrl;
      // 2) ถ้าลิงก์ย่อไม่ redirect ตรง ๆ (เสิร์ฟ HTML) → สแกนพิกัดจากเนื้อหาหน้า
      const body = await res.text();
      return extractLatLngFromGoogleUrl(body);
    } catch {
      return null;
    }
  }
  return null;
}

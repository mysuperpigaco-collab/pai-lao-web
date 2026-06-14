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

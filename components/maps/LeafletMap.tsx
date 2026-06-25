"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useRouteHover } from "./RouteHoverContext";

// แก้ปัญหา icon หายเมื่อ bundle — ใช้ CDN ผ่าน OSM tile domain เดียวกัน
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface MapPoint {
  id?: string;     // ไอดีจุด — ใช้โยง hover ระหว่างการ์ดไทม์ไลน์กับหมุด
  lat: number;
  lng: number;
  label?: string;
  href?: string;
  color?: string;
  num?: number;
  icon?: string;   // emoji ตามหมวด (เช่น ☕ 🌿) — แสดงกลางหมุดเมื่อไม่มีเลข
}

// หมุดทรงหยดน้ำสวย ๆ — รองรับ เลข (เส้นทาง) / อิโมจิ (หมวด) / จุดสีล้วน (ดีฟอลต์)
// active=true → หมุดใหญ่ขึ้น + เงาเรืองแสง เมื่อชี้การ์ดที่ตรงกัน
function makePin(color: string, opts: { num?: number; emoji?: string; active?: boolean } = {}): L.DivIcon {
  const inner =
    opts.num != null
      ? `<text x="14" y="15.8" text-anchor="middle" fill="${color}" font-weight="900" font-size="9" font-family="system-ui,sans-serif">${opts.num}</text>`
      : opts.emoji
        ? `<text x="14" y="16.5" text-anchor="middle" font-size="11">${opts.emoji}</text>`
        : `<circle cx="14" cy="12" r="3.2" fill="${color}"/>`;
  const w = opts.active ? 42 : 30;
  const h = opts.active ? 56 : 40;
  const shadow = opts.active
    ? `drop-shadow(0 0 6px ${color}) drop-shadow(0 4px 6px rgba(0,0,0,0.45))`
    : `drop-shadow(0 2px 3px rgba(0,0,0,0.35))`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 28 36" style="filter:${shadow};transition:all .12s ease">
    <path d="M14 1C7.925 1 3 5.925 3 12c0 6 11 23 11 23s11-17 11-23C25 5.925 20.075 1 14 1z"
      fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="14" cy="12" r="6.6" fill="white" opacity="0.95"/>
    ${inner}
  </svg>`;
  return L.divIcon({ html: svg, iconSize: [w, h], iconAnchor: [w / 2, h], popupAnchor: [0, -h], className: "" });
}

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(
        points.map(p => [p.lat, p.lng]) as [number, number][],
        { padding: [30, 30] }
      );
    }
  }, [points, map]);
  return null;
}

export default function LeafletMap({
  points,
  showRoute = false,
  height = 360,
  zoom = 13,
}: {
  points: MapPoint[];
  showRoute?: boolean;
  height?: number;
  zoom?: number;
}) {
  const { activeId, setActiveId } = useRouteHover();
  if (!points.length) return null;
  const center: [number, number] = [points[0].lat, points[0].lng];
  const line = points.map(p => [p.lat, p.lng]) as [number, number][];

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ height, width: "100%", borderRadius: 16 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {showRoute && line.length > 1 && (
        <>
          {/* เส้นขอบขาว — ให้เส้นทางเด่นบนพื้นแผนที่ */}
          <Polyline positions={line} color="#ffffff" weight={7} opacity={0.85} />
          <Polyline positions={line} color="#2563eb" weight={3.5} opacity={0.95} dashArray="1 9" lineCap="round" />
        </>
      )}
      {points.map((p, i) => {
        const isActive = p.id != null && p.id === activeId;
        return (
          <Marker
            key={i}
            position={[p.lat, p.lng]}
            icon={makePin(p.color ?? "#2563eb", { num: p.num, emoji: p.icon, active: isActive })}
            zIndexOffset={isActive ? 1000 : 0}
            eventHandlers={p.id != null ? {
              mouseover: () => setActiveId(p.id!),
              mouseout: () => setActiveId(null),
            } : undefined}
          >
            {p.label && (
              <Popup>
                {p.href ? <a href={p.href}>{p.label}</a> : p.label}
              </Popup>
            )}
          </Marker>
        );
      })}
      {points.length > 1 && <FitBounds points={points} />}
    </MapContainer>
  );
}

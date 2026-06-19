"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// แก้ปัญหา icon หายเมื่อ bundle — ใช้ CDN ผ่าน OSM tile domain เดียวกัน
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
  href?: string;
  color?: string;
  num?: number;
}

function makeColoredIcon(color: string, num: number): L.DivIcon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 1C7.925 1 3 5.925 3 12c0 6 11 23 11 23s11-17 11-23C25 5.925 20.075 1 14 1z"
      fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="14" cy="12" r="6.5" fill="white" opacity="0.92"/>
    <text x="14" y="16" text-anchor="middle" fill="${color}" font-weight="900" font-size="9"
      font-family="system-ui,sans-serif">${num}</text>
  </svg>`;
  return L.divIcon({ html: svg, iconSize: [28, 36], iconAnchor: [14, 36], popupAnchor: [0, -38], className: "" });
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
        <Polyline positions={line} color="#2563eb" weight={3} opacity={0.7} />
      )}
      {points.map((p, i) => (
        <Marker
          key={i}
          position={[p.lat, p.lng]}
          {...(p.color != null && p.num != null ? { icon: makeColoredIcon(p.color, p.num) } : {})}
        >
          {p.label && (
            <Popup>
              {p.href ? <a href={p.href}>{p.label}</a> : p.label}
            </Popup>
          )}
        </Marker>
      ))}
      {points.length > 1 && <FitBounds points={points} />}
    </MapContainer>
  );
}

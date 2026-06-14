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
        <Marker key={i} position={[p.lat, p.lng]}>
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

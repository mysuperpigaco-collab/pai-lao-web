"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// แก้ปัญหา icon หายเมื่อ bundle (เหมือน LeafletMap)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ขอบเขตไทย — ต้องตรงกับฝั่ง API
const TH = { minLat: 5.5, maxLat: 20.6, minLng: 97.3, maxLng: 105.7 };
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export interface NearbyResult {
  id: string;
  slug: string;
  title: string;
  lat: number | null;
  lng: number | null;
  distanceM: number;
}

function radiusToZoom(radius: number) {
  if (radius <= 500) return 15;
  if (radius <= 1000) return 14;
  if (radius <= 3000) return 13;
  return 12;
}

// recenter เฉพาะตอน recenterKey เปลี่ยน (กดหาตำแหน่ง/เปลี่ยนระยะ) — ไม่ snap ตอนลากหมุด
function Recenter({ lat, lng, zoom, recenterKey }: { lat: number; lng: number; zoom: number; recenterKey: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom, { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterKey]);
  return null;
}

export default function NearbyMap({
  lat,
  lng,
  radius,
  results,
  onMove,
  recenterKey = 0,
  height = 320,
}: {
  lat: number;
  lng: number;
  radius: number;
  results: NearbyResult[];
  onMove: (lat: number, lng: number) => void;
  recenterKey?: number;
  height?: number;
}) {
  const zoom = radiusToZoom(radius);

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ height, width: "100%", borderRadius: 16 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* วงรัศมีค้นหา */}
      <Circle
        center={[lat, lng]}
        radius={radius}
        pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.08, weight: 1.5 }}
      />

      {/* หมุดผลลัพธ์ */}
      {results.map((p) =>
        p.lat != null && p.lng != null ? (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={6}
            pathOptions={{ color: "#1d4ed8", fillColor: "#3b82f6", fillOpacity: 0.9, weight: 1.5 }}
          >
            <Popup>
              <a href={`/place/${p.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, color: "#1d4ed8" }}>
                {p.title}
              </a>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                {p.distanceM < 1000 ? `${p.distanceM} ม.` : `${(p.distanceM / 1000).toFixed(1)} กม.`}
              </div>
            </Popup>
          </CircleMarker>
        ) : null
      )}

      {/* หมุดตำแหน่งฉัน (ลากได้ จำกัดในไทย) */}
      <Marker
        position={[lat, lng]}
        draggable
        eventHandlers={{
          dragend: (e) => {
            const m = (e.target as L.Marker).getLatLng();
            onMove(clamp(m.lat, TH.minLat, TH.maxLat), clamp(m.lng, TH.minLng, TH.maxLng));
          },
        }}
      >
        <Popup>📍 ตำแหน่งของคุณ (ลากเพื่อย้ายได้)</Popup>
      </Marker>

      <Recenter lat={lat} lng={lng} zoom={zoom} recenterKey={recenterKey} />
    </MapContainer>
  );
}

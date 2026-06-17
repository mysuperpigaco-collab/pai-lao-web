"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// แก้แผนที่เป็นช่องเทาเมื่อเปิดใน modal (container เพิ่งมีขนาดหลัง mount)
function FixSize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

// icon fix (เหมือน LeafletMap/NearbyMap)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ขอบเขตไทย — จำกัดหมุดที่ลากได้ให้อยู่ในประเทศ
const TH = { minLat: 5.5, maxLat: 20.6, minLng: 97.3, maxLng: 105.7 };
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * StopMap — แผนที่จุดแวะในแผนเที่ยว
 *  draggable=false → หมุดล็อก ซูม/เลื่อน(pan)ได้ ลากหมุดไม่ได้ (สำหรับสถานที่จริง)
 *  draggable=true  → ลากหมุดเลือกพิกัดได้ (สำหรับจุดแวะที่สร้างเอง)
 */
export default function StopMap({
  lat,
  lng,
  draggable = false,
  onMove,
  height = 200,
}: {
  lat: number;
  lng: number;
  draggable?: boolean;
  onMove?: (lat: number, lng: number) => void;
  height?: number;
}) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom
      style={{ height, width: "100%", borderRadius: 12 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FixSize />
      <Marker
        position={[lat, lng]}
        draggable={draggable}
        eventHandlers={
          draggable && onMove
            ? {
                dragend: (e) => {
                  const m = (e.target as L.Marker).getLatLng();
                  onMove(clamp(m.lat, TH.minLat, TH.maxLat), clamp(m.lng, TH.minLng, TH.maxLng));
                },
              }
            : undefined
        }
      />
    </MapContainer>
  );
}

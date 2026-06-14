"use client";
import { useRef, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function LocateButton({ onLocate }: { onLocate: (lat: number, lng: number) => void }) {
  const map = useMap();
  const [loading, setLoading] = useState(false);

  function locate() {
    if (!navigator.geolocation) { alert("เบราว์เซอร์ไม่รองรับ GPS"); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        onLocate(lat, lng);
        map.setView([lat, lng], 17);
        setLoading(false);
      },
      err => {
        setLoading(false);
        alert(err.code === err.PERMISSION_DENIED
          ? "กรุณาอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์"
          : "ระบุตำแหน่งไม่สำเร็จ ลองใหม่หรือปักเอง");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  return (
    <button type="button" onClick={locate} disabled={loading}
      style={{ position: "absolute", zIndex: 1000, top: 10, right: 10,
               padding: "7px 12px", background: "#fff", border: "1px solid #cbd5e1",
               borderRadius: 8, fontWeight: 700, fontSize: 12,
               cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
      {loading ? "⏳ กำลังหา..." : "📍 ใช้ตำแหน่งปัจจุบัน"}
    </button>
  );
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({ click: e => onChange(e.latlng.lat, e.latlng.lng) });
  return null;
}

// Fly to coords once — on first non-null value only (for edit page load)
function FlyOnce({ lat, lng }: { lat: number; lng: number }) {
  const map  = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}

export default function PlacePicker({
  value,
  onChange,
  height = 320,
}: {
  value: { lat: number | null; lng: number | null };
  onChange: (lat: number, lng: number) => void;
  height?: number;
}) {
  const hasCoords = value.lat != null && value.lng != null;
  const center: [number, number] = hasCoords
    ? [value.lat!, value.lng!]
    : [13.0, 101.0]; // Thailand center

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "2px dashed #93c5fd" }}>
      <MapContainer
        center={center}
        zoom={hasCoords ? 15 : 6}
        scrollWheelZoom
        style={{ height, width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocateButton onLocate={onChange} />
        <ClickHandler onChange={onChange} />
        {hasCoords && <Marker position={[value.lat!, value.lng!]} />}
        {hasCoords && <FlyOnce lat={value.lat!} lng={value.lng!} />}
      </MapContainer>
    </div>
  );
}

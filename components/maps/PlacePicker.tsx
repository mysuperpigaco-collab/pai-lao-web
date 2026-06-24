"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// หมุดทรงหยดน้ำสวย ๆ สำหรับจุดที่เลือก
const PIN_ICON = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 28 36"><path d="M14 1C7.925 1 3 5.925 3 12c0 6 11 23 11 23s11-17 11-23C25 5.925 20.075 1 14 1z" fill="#10b981" stroke="white" stroke-width="2"/><circle cx="14" cy="12" r="4" fill="white"/></svg>`,
  iconSize: [32, 42], iconAnchor: [16, 42], popupAnchor: [0, -42], className: "",
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

// Re-centers map every time lat/lng changes — fires on place selection from parent
function Recenter({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}

export default function PlacePicker({
  value,
  onChange,
  height = 320,
  disabled = false,
}: {
  value: { lat: number | null; lng: number | null };
  onChange: (lat: number, lng: number) => void;
  height?: number;
  disabled?: boolean;
}) {
  const hasCoords = value.lat != null && value.lng != null;
  const center: [number, number] = hasCoords
    ? [value.lat!, value.lng!]
    : [13.0, 101.0];

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: `2px dashed ${disabled ? "#e2e8f0" : "#93c5fd"}` }}>
      <MapContainer
        center={center}
        zoom={hasCoords ? 15 : 6}
        scrollWheelZoom={!disabled}
        style={{ height, width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!disabled && <LocateButton onLocate={onChange} />}
        {!disabled && <ClickHandler onChange={onChange} />}
        {hasCoords && <Marker position={[value.lat!, value.lng!]} icon={PIN_ICON} />}
        <Recenter lat={value.lat} lng={value.lng} />
      </MapContainer>
    </div>
  );
}

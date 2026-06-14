"use client";
import { useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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
        <ClickHandler onChange={onChange} />
        {hasCoords && <Marker position={[value.lat!, value.lng!]} />}
        {hasCoords && <FlyOnce lat={value.lat!} lng={value.lng!} />}
      </MapContainer>
    </div>
  );
}

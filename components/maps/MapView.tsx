"use client";
import dynamic from "next/dynamic";
import type { MapPoint } from "./LeafletMap";

// ssr: false — Leaflet ใช้ window ไม่ได้รันบน server
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 360,
        borderRadius: 16,
        background: "#e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#94a3b8",
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      กำลังโหลดแผนที่…
    </div>
  ),
});

export type { MapPoint };

export default function MapView(props: {
  points: MapPoint[];
  showRoute?: boolean;
  height?: number;
  zoom?: number;
}) {
  return <LeafletMap {...props} />;
}

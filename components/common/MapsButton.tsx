"use client";

/**
 * MapsButton — ปุ่มเปิด Google Maps พร้อม dialog ยืนยัน
 * ใช้แทนทุก <a href={googleMapsUrl} target="_blank"> ในโปรเจค
 *
 * Usage:
 *   <MapsButton url={place.googleMapsUrl} placeName={place.title} />
 *   <MapsButton url={url} placeName="ชื่อสถานที่" variant="icon" />
 *   <MapsButton url={url} placeName="ชื่อสถานที่" variant="text" />
 */

import { useState } from "react";

interface Props {
  url:        string;
  placeName?: string;
  variant?:   "button" | "icon" | "text"; // default = "button"
  className?: string;
  style?:     React.CSSProperties;
}

export default function MapsButton({
  url, placeName = "สถานที่นี้", variant = "button", className, style,
}: Props) {
  const [open, setOpen] = useState(false);

  if (!url) return null;

  const handleOpen = () => {
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  return (
    <>
      {/* ── ปุ่มหลัก ── */}
      {variant === "button" && (
        <button onClick={() => setOpen(true)} className={className} style={style}>
          🗺️ ดูบน Google Maps
        </button>
      )}
      {variant === "icon" && (
        <button onClick={() => setOpen(true)} className={className} style={style}
          title="ดูบน Google Maps" aria-label="ดูบน Google Maps">
          📍
        </button>
      )}
      {variant === "text" && (
        <span onClick={() => setOpen(true)} className={className} style={{
          cursor: "pointer", color: "#2563eb", textDecoration: "underline", ...style,
        }}>
          ดูบน Google Maps
        </span>
      )}

      {/* ── Dialog ── */}
      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
          padding: "20px",
        }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div style={{
            background: "white", borderRadius: 24, padding: "28px 24px",
            maxWidth: 360, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            textAlign: "center",
          }}>
            {/* Icon */}
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "linear-gradient(135deg,#4facfe,#43e97b)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, margin: "0 auto 16px",
            }}>
              🗺️
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
              เปิด Google Maps?
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px", lineHeight: 1.6 }}>
              ต้องการเปิดแผนที่สำหรับ<br />
              <strong style={{ color: "#0f172a" }}>{placeName}</strong><br />
              บน Google Maps ใช่ไหม?
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12,
                  border: "1.5px solid #e2e8f0", background: "white",
                  fontSize: 14, fontWeight: 700, color: "#64748b",
                  cursor: "pointer",
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleOpen}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg,#4facfe,#43e97b)",
                  fontSize: 14, fontWeight: 700, color: "white",
                  cursor: "pointer",
                }}
              >
                เปิด Maps ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

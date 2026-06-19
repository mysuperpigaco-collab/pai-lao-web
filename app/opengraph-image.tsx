import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ไปเล่า PAI-LAO EXPERIENCE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #0f766e 100%)",
          position: "relative",
        }}
      >
        {/* Background pattern */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle at 20% 50%, rgba(16,185,129,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(6,182,212,0.1) 0%, transparent 40%)",
          display: "flex",
        }} />

        {/* Logo icon */}
        <div style={{
          width: 110,
          height: 110,
          borderRadius: "50%",
          border: "3px solid rgba(16,185,129,0.6)",
          background: "rgba(16,185,129,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 52,
          marginBottom: 28,
        }}>
          🗺️
        </div>

        {/* Brand name */}
        <div style={{
          fontSize: 80,
          fontWeight: 900,
          color: "white",
          letterSpacing: 6,
          marginBottom: 12,
          display: "flex",
        }}>
          ไปเล่า
        </div>

        <div style={{
          fontSize: 22,
          fontWeight: 400,
          color: "rgba(255,255,255,0.5)",
          letterSpacing: 12,
          marginBottom: 40,
          display: "flex",
        }}>
          PAI · LAO
        </div>

        {/* Divider */}
        <div style={{
          width: 200,
          height: 2,
          background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.6), transparent)",
          marginBottom: 32,
          display: "flex",
        }} />

        {/* Tagline */}
        <div style={{
          fontSize: 26,
          color: "rgba(255,255,255,0.8)",
          fontWeight: 400,
          display: "flex",
        }}>
          ชุมชนนักท่องเที่ยวไทย · แบ่งปันเรื่องเล่าการเดินทาง
        </div>

        {/* URL */}
        <div style={{
          position: "absolute",
          bottom: 32,
          right: 48,
          fontSize: 16,
          color: "rgba(255,255,255,0.3)",
          display: "flex",
        }}>
          {(process.env.NEXT_PUBLIC_SITE_URL || "pai-lao.com").replace("https://", "")}
        </div>
      </div>
    ),
    { ...size }
  );
}

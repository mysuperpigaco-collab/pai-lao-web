import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a, #0f766e)",
        borderRadius: 40,
      }}>
        <div style={{
          width: 110,
          height: 110,
          borderRadius: "50%",
          border: "3px solid rgba(16,185,129,0.7)",
          background: "rgba(16,185,129,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 60,
        }}>
          🗺️
        </div>
      </div>
    ),
    { ...size }
  );
}

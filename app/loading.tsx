"use client";
import { useState } from "react";

export default function Loading() {
  const [o1, setO1] = useState(false);
  const [o2, setO2] = useState(false);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#0a1628",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 28,
    }}>
      {/* Subtle grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
      }} />

      {/* Cats */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-end", gap: 16 }}>
        <img
          src="/images/splash/cat-orange-1.png"
          alt=""
          onLoad={() => setO1(true)}
          style={{
            width: 110, height: 110, objectFit: "contain",
            opacity: o1 ? 1 : 0,
            transform: o1 ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
            filter: "drop-shadow(0 0 18px rgba(232,154,82,0.55))",
          }}
        />
        <img
          src="/images/splash/cat-white-1.png"
          alt=""
          onLoad={() => setO2(true)}
          style={{
            width: 100, height: 100, objectFit: "contain",
            opacity: o2 ? 1 : 0,
            transform: o2 ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s",
            filter: "drop-shadow(0 0 14px rgba(242,239,233,0.45))",
          }}
        />
      </div>

      {/* Logo + bar */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{
          fontSize: 32, fontWeight: 900,
          background: "linear-gradient(100deg, #10b981 0%, #06b6d4 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          letterSpacing: 4, lineHeight: 1,
        }}>
          ไปเล่า
        </div>
        <div style={{ width: 140, height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            background: "linear-gradient(90deg, #10b981, #06b6d4)",
            borderRadius: 999,
            animation: "lbar 1.6s ease-in-out infinite",
          }} />
        </div>
      </div>

      <style>{`
        @keyframes lbar {
          0%   { width: 0%;   margin-left: 0; }
          55%  { width: 100%; margin-left: 0; }
          56%  { width: 0%;   margin-left: 100%; }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}

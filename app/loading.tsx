"use client";
import { useEffect, useState } from "react";

export default function Loading() {
  const [width, setWidth] = useState(12);

  useEffect(() => {
    // เลื่อน progress bar ช้าๆ แบบ realistic (ไม่เต็ม 100% จนกว่า content จะมา)
    const t1 = setTimeout(() => setWidth(40), 80);
    const t2 = setTimeout(() => setWidth(65), 400);
    const t3 = setTimeout(() => setWidth(82), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <>
      {/* Top progress bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 99999, height: 3 }}>
        <div
          style={{
            height: "100%",
            width: `${width}%`,
            background: "linear-gradient(90deg, #10b981, #06b6d4)",
            borderRadius: "0 2px 2px 0",
            boxShadow: "0 0 10px rgba(16,185,129,.6)",
            transition: "width 0.4s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>

      {/* Minimal center spinner */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "3px solid rgba(16,185,129,.18)",
              borderTopColor: "#10b981",
              animation: "spin 0.75s linear infinite",
            }}
          />
          <span style={{ fontSize: 13, color: "#10b981", fontWeight: 700, letterSpacing: 0.5 }}>
            ไปเล่า
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

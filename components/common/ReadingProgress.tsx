"use client";

import { useEffect, useState } from "react";

export default function ReadingProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop || document.body.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setPct(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0,
      height: 3, zIndex: 9998, pointerEvents: "none",
      background: "rgba(255,255,255,0.08)",
    }}>
      <div style={{
        height: "100%",
        width: pct + "%",
        background: "linear-gradient(to right, #4facfe, #43e97b)",
        transition: "width 0.1s linear",
        boxShadow: "0 0 8px rgba(79,172,254,0.6)",
      }} />
    </div>
  );
}

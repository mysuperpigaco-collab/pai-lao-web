"use client";

import { useEffect, useState } from "react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      data-no-ripple
      aria-label="กลับด้านบน"
      style={{
        position: "fixed", bottom: 28, right: 24, zIndex: 999,
        width: 44, height: 44, borderRadius: "50%",
        background: "linear-gradient(135deg, #4facfe, #43e97b)",
        border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 20px rgba(79,172,254,0.4)",
        animation: "bttFadeIn 0.25s ease",
        color: "#fff", fontSize: 18,
      }}
    >
      ↑
      <style>{`@keyframes bttFadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </button>
  );
}

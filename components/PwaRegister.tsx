"use client";

import { useEffect, useState } from "react";

// ลงทะเบียน service worker (production เท่านั้น) + ปุ่มชวนติดตั้งแอปแบบไม่รบกวน
// ปิดเองถาวรได้ (จำใน localStorage) · ไม่ render อะไรเลยถ้าเบราว์เซอร์ไม่รองรับ
export default function PwaRegister() {
  const [installEvt, setInstallEvt] = useState<Event | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {});

    const onPrompt = (e: Event) => {
      e.preventDefault();
      try {
        if (localStorage.getItem("pl-pwa-dismissed")) return;
      } catch {}
      setInstallEvt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!visible || !installEvt) return null;

  const install = async () => {
    setVisible(false);
    try {
      await (installEvt as any).prompt();
    } catch {}
  };

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem("pl-pwa-dismissed", "1"); } catch {}
  };

  return (
    <div style={{
      position: "fixed", left: "50%", transform: "translateX(-50%)",
      bottom: "calc(16px + env(safe-area-inset-bottom))", zIndex: 9000,
      display: "flex", alignItems: "center", gap: 10,
      background: "rgba(15,23,42,0.92)", backdropFilter: "blur(8px)",
      borderRadius: 999, padding: "8px 8px 8px 18px",
      boxShadow: "0 10px 32px rgba(0,0,0,0.35)", maxWidth: "calc(100vw - 32px)",
    }}>
      <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
        📲 ติดตั้ง "ไปเล่า" ลงเครื่อง
      </span>
      <button onClick={install} style={{
        border: "none", borderRadius: 999, padding: "8px 18px", cursor: "pointer",
        background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff",
        fontSize: 13, fontWeight: 800, fontFamily: "inherit", whiteSpace: "nowrap",
      }}>ติดตั้ง</button>
      <button onClick={dismiss} aria-label="ปิด" style={{
        border: "none", background: "rgba(255,255,255,0.14)", color: "#fff",
        width: 32, height: 32, borderRadius: "50%", cursor: "pointer",
        fontSize: 14, lineHeight: 1, flexShrink: 0,
      }}>✕</button>
    </div>
  );
}

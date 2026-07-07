"use client";

import { useEffect, useState } from "react";

// ── ปุ่มติดตั้งแอป PWA (อยู่ในการ์ดแชร์โปรไฟล์) ─────────────
// แสดงเฉพาะเมื่อ: เบราว์เซอร์รองรับ + ยังไม่ได้ติดตั้ง (มี event ค้างอยู่)
// event มาจาก PwaRegister (window.__plInstallEvt) — ถ้าไม่มี = ไม่ render อะไรเลย

export default function InstallAppButton() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    // ติดตั้งแล้ว (เปิดจากไอคอนแอป) ไม่ต้องโชว์
    if (typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches) return;

    const check = () => setAvailable(!!(window as any).__plInstallEvt);
    check(); // เผื่อ event มาก่อนหน้านี้แล้ว
    window.addEventListener("pl-install-ready", check);
    const onDone = () => setAvailable(false);
    window.addEventListener("pl-install-done", onDone);
    return () => {
      window.removeEventListener("pl-install-ready", check);
      window.removeEventListener("pl-install-done", onDone);
    };
  }, []);

  if (!available) return null;

  const install = async () => {
    const evt = (window as any).__plInstallEvt;
    if (!evt) { setAvailable(false); return; }
    try {
      await evt.prompt();
      const choice = await evt.userChoice;
      if (choice?.outcome === "accepted") setAvailable(false);
    } catch {}
    (window as any).__plInstallEvt = null;
    setAvailable(false); // prompt ใช้ได้ครั้งเดียว — ซ่อนปุ่มรอ event รอบใหม่
  };

  return (
    <>
      <button type="button" className="iab-btn" onClick={install}>
        📲 ติดตั้งแอป &quot;ไปเล่า&quot;
      </button>
      <style jsx>{`
        .iab-btn {
          border: none;
          border-radius: var(--pl-radius-btn, 16px);
          padding: 10px 20px;
          cursor: pointer;
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          font-family: inherit;
          white-space: nowrap;
        }
        .iab-btn:active { transform: scale(0.98); }
      `}</style>
    </>
  );
}

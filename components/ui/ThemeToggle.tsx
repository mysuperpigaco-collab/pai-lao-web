"use client";

import { useEffect, useState } from "react";

/**
 * ปุ่มสลับโหมดสว่าง/มืด
 * - อ่าน/เขียน data-theme บน <html> + จำค่าใน localStorage ("pl-theme")
 * - ค่าเริ่มต้นถูกตั้งโดย inline script ใน layout (กัน flash) แล้ว component นี้แค่ sync state
 * - variant="icon" สำหรับ navbar, variant="row" สำหรับเมนูมือถือ
 */
export default function ThemeToggle({ variant = "icon" }: { variant?: "icon" | "row" }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    const el = document.documentElement;
    if (next) el.setAttribute("data-theme", "dark");
    else el.removeAttribute("data-theme");
    try { localStorage.setItem("pl-theme", next ? "dark" : "light"); } catch {}
  };

  // กัน mismatch ตอน hydrate — โชว์ไอคอนกลาง ๆ ก่อน mount
  const isDark = mounted && dark;
  const label = isDark ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด";

  const Icon = isDark ? (
    // sun
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ) : (
    // moon
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );

  if (variant === "row") {
    return (
      <button onClick={toggle} className="nb-m-link" aria-label={label}
        style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.12)", width: "100%", textAlign: "left", font: "inherit", cursor: "pointer" }}>
        {Icon}
        <span>{isDark ? "โหมดสว่าง · Light" : "โหมดมืด · Dark"}</span>
      </button>
    );
  }

  return (
    <button onClick={toggle} aria-label={label} title={label}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 38, height: 38, flexShrink: 0,
        background: "rgba(255,255,255,0.15)",
        border: "1.5px solid rgba(255,255,255,0.35)",
        borderRadius: 10, color: "#fff", cursor: "pointer",
        backdropFilter: "blur(4px)",
      }}>
      {Icon}
    </button>
  );
}

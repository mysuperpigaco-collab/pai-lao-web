"use client";
import { useState } from "react";

// ดักเบราว์เซอร์ในแอป (LINE / Facebook / IG) ที่ Google มักบล็อก OAuth
function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /\bLine\b|FBAN|FBAV|FB_IAB|Instagram|; wv\)/i.test(ua);
}

export default function GoogleLoginButton({
  label = "เข้าสู่ระบบด้วย Google",
  intent,
}: {
  label?: string;
  intent?: "user" | "business";
}) {
  const [warn, setWarn] = useState(false);
  const href = intent ? `/api/auth/google?intent=${intent}` : "/api/auth/google";

  const handleClick = (e: React.MouseEvent) => {
    if (isInAppBrowser()) {
      e.preventDefault();
      setWarn(true);
    }
  };

  return (
    <div style={{ marginTop: 18 }}>
      {/* เส้นคั่น "หรือ" */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0 16px" }}>
        <span style={{ flex: 1, height: 1, background: "var(--pl-border)" }} />
        <span style={{ fontSize: 12, color: "var(--pl-text-muted)", fontWeight: 600 }}>หรือ</span>
        <span style={{ flex: 1, height: 1, background: "var(--pl-border)" }} />
      </div>

      <a
        href={href}
        onClick={handleClick}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          width: "100%", padding: "14px", borderRadius: 50,
          border: "1.5px solid var(--pl-border)", background: "var(--pl-white)",
          color: "var(--pl-text-primary)", fontWeight: 700, fontSize: 15,
          textDecoration: "none", cursor: "pointer", boxSizing: "border-box",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22 22-9.8 22-22c0-1.3-.1-2.3-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.1 29.6 2 24 2 16.3 2 9.7 6.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 46c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5c-2 1.5-4.7 2.5-7.6 2.5-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.6 41.6 16.2 46 24 46z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.5 5.5C41.4 36.3 44 30.6 44 24c0-1.3-.1-2.3-.4-3.5z"/>
        </svg>
        {label}
      </a>

      {warn && (
        <div style={{
          marginTop: 12, background: "#fffbeb", border: "1.5px solid #fde68a",
          color: "#92400e", fontSize: 13, fontWeight: 600, padding: "10px 14px",
          borderRadius: 12, textAlign: "left", lineHeight: 1.6,
        }}>
          ⚠️ คุณกำลังเปิดในแอป (เช่น LINE) ซึ่ง Google ไม่อนุญาตให้ล็อกอิน<br />
          กรุณากดเมนู ⋯ มุมขวาบน แล้วเลือก <strong>"เปิดในเบราว์เซอร์"</strong> (Chrome/Safari) แล้วลองใหม่
        </div>
      )}
    </div>
  );
}

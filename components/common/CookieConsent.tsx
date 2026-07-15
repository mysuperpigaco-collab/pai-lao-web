"use client";

import { useEffect, useState } from "react";

// ── Cookie consent (PDPA) ────────────────────────────────────
// โชว์ครั้งแรกครั้งเดียว · เก็บใน localStorage `pl-cookie-consent`
// { analytics: boolean, ts: number } · กด "ยอมรับทั้งหมด" → ยิง event
// `pl-consent-analytics` ให้ Analytics.tsx โหลด GA4 ทันที (ไม่ต้องรีเฟรช)
// เปิด banner ใหม่จากที่อื่น (หน้า policy): dispatch event `pl-consent-open`

export const CONSENT_KEY = "pl-cookie-consent";

export function getConsent(): { analytics: boolean } | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return typeof v?.analytics === "boolean" ? { analytics: v.analytics } : null;
  } catch { return null; }
}

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!getConsent()) setShow(true);
    const open = () => setShow(true);
    window.addEventListener("pl-consent-open", open);
    return () => window.removeEventListener("pl-consent-open", open);
  }, []);

  function decide(analytics: boolean) {
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics, ts: Date.now() })); } catch {}
    setShow(false);
    if (analytics) window.dispatchEvent(new Event("pl-consent-analytics"));
  }

  if (!show) return null;

  return (
    <div className="cc-wrap" role="dialog" aria-label="การใช้คุกกี้">
      <div className="cc-card">
        <div className="cc-text">
          <p className="cc-title">🍪 เราใช้คุกกี้เพื่อพัฒนาประสบการณ์ของคุณ</p>
          <p className="cc-desc">
            คุกกี้จำเป็นสำหรับการเข้าสู่ระบบ + คุกกี้วิเคราะห์ (Google Analytics) เพื่อปรับปรุงเว็บ ·{" "}
            <a href="/policy?tab=privacy" className="cc-link">นโยบายความเป็นส่วนตัว</a>
          </p>
        </div>
        <div className="cc-actions">
          <button type="button" className="cc-btn cc-btn-ghost" onClick={() => decide(false)}>
            จำเป็นเท่านั้น
          </button>
          <button type="button" className="cc-btn cc-btn-accept" onClick={() => decide(true)}>
            ยอมรับทั้งหมด
          </button>
        </div>
      </div>
      <style jsx>{`
        .cc-wrap {
          position: fixed; left: 0; right: 0; bottom: 0; z-index: 9500;
          padding: 0; pointer-events: none;
        }
        .cc-card {
          pointer-events: auto;
          background: #1e293b; border-top: 1px solid rgba(16, 185, 129, 0.35);
          padding: 14px 22px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
          animation: cc-up 0.35s ease both;
        }
        @keyframes cc-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .cc-text { flex: 1; min-width: 220px; }
        .cc-title { margin: 0; font-size: 13.5px; font-weight: 600; color: #f1f5f9; }
        .cc-desc { margin: 2px 0 0; font-size: 12px; color: #94a3b8; line-height: 1.5; }
        .cc-link { color: #34d399; text-decoration: underline; }
        .cc-actions { display: flex; gap: 8px; }
        .cc-btn {
          border-radius: 999px; padding: 8px 18px; font-size: 12.5px; font-weight: 600;
          cursor: pointer; font-family: inherit; white-space: nowrap;
        }
        .cc-btn-ghost { background: transparent; border: 1px solid #475569; color: #cbd5e1; }
        .cc-btn-ghost:hover { border-color: #94a3b8; color: #f1f5f9; }
        .cc-btn-accept { background: #10b981; border: 1px solid #10b981; color: #04342c; }
        .cc-btn-accept:hover { background: #34d399; border-color: #34d399; }
        @media (max-width: 640px) {
          .cc-wrap { padding: 0 10px 10px; }
          .cc-card {
            border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 16px;
            padding: 14px; display: block;
          }
          .cc-actions { flex-direction: column-reverse; gap: 6px; margin-top: 10px; }
          .cc-btn { width: 100%; padding: 9px 0; }
        }
      `}</style>
    </div>
  );
}

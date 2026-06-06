"use client";

import { useState } from "react";
import MapsButton from "@/components/common/MapsButton";
import QRModal from "@/components/common/QRModal";

const STOP_LABELS: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  ATTRACTION: { icon: "🏞️", label: "ที่เที่ยว",  color: "#3b82f6", bg: "#eff6ff" },
  EAT:        { icon: "🍽️", label: "ร้านอาหาร", color: "#f59e0b", bg: "#fffbeb" },
  SLEEP:      { icon: "🏨", label: "ที่พัก",     color: "#8b5cf6", bg: "#f5f3ff" },
  ACTIVITY:   { icon: "🎯", label: "กิจกรรม",   color: "#10b981", bg: "#ecfdf5" },
  TRANSPORT:  { icon: "🚌", label: "เดินทาง",   color: "#64748b", bg: "#f8fafc" },
};
const ST = (v?: string) => STOP_LABELS[v ?? ""] ?? STOP_LABELS.ATTRACTION;

interface Stop {
  id: string;
  order: number;
  name: string;
  day: number;
  province?: string;
  district?: string;
  notes?: string;
  googleMapsUrl?: string;
  stopType?: string;
  arrivalTime?: string;
  duration?: number;
  place?: { slug: string; title: string; coverUrl?: string };
}

interface Plan {
  id: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  province?: string;
  isPublic: boolean;
  stops: Stop[];
  user?: { displayName?: string; firstName?: string; username?: string; avatarUrl?: string };
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
  } catch { return d; }
}

function getDateLabel(startDate: string | undefined, dayNum: number): string | null {
  if (!startDate) return null;
  try {
    const d = new Date(startDate);
    d.setDate(d.getDate() + dayNum - 1);
    return d.toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long" });
  } catch { return null; }
}

function fmtDuration(min: number) {
  if (min < 60) return `${min} นาที`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h} ชม. ${m} นาที` : `${h} ชม.`;
}

const QRIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/>
    <path d="M14 14h3M14 18h3M17 14v7M21 14v3M21 21h-4"/>
  </svg>
);

export default function PlanShareView({ plan, shareUrl }: { plan: Plan; shareUrl: string }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);


  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;
  const fbUrl   = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const savePdf = () => window.print();

  const authorName = plan.user?.displayName || plan.user?.firstName || plan.user?.username || "ผู้วางแผน";

  // Group stops by day
  const maxDay = plan.stops.reduce((m, s) => Math.max(m, s.day ?? 1), 1);
  const days: number[] = Array.from({ length: maxDay }, (_, i) => i + 1);

  return (
    <div className="pv-root">
      {/* ── Top bar (screen only) ── */}
      <div className="pv-topbar no-print">
        <div className="pv-topbar-left">
          <a href="/planner" className="pv-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            วางแผนเที่ยว
          </a>
          <span className="pv-topbar-title">{plan.title}</span>
        </div>
        <div className="pv-topbar-actions">
          <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="pv-share-btn pv-line-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
            <span>LINE</span>
          </a>
          <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="pv-share-btn pv-fb-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <span>Facebook</span>
          </a>
          <button onClick={copyLink} className={`pv-share-btn pv-copy-btn ${copied ? "copied" : ""}`}>
            {copied ? (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>คัดลอกแล้ว!</>
            ) : (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>คัดลอกลิงก์</>
            )}
          </button>
          <button onClick={() => setShowQR(true)} className="pv-share-btn pv-qr-btn">
            <QRIcon /><span>QR Code</span>
          </button>
          <button onClick={savePdf} className="pv-share-btn pv-pdf-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
            <span>บันทึก PDF</span>
          </button>
        </div>
      </div>

      {/* ── Printable page ── */}
      <div className="pv-page">
        {/* Brand header — position:fixed in print, repeats every page */}
        <div className="pv-print-header">
          <div className="pv-print-logo-box">🗺️</div>
          <div className="pv-print-logo-text">
            <span className="pv-print-logo-name">ไปเล่า</span>
            <span className="pv-print-logo-sub">PAI · LAO · Trip Planner</span>
          </div>
          <div className="pv-print-logo-right">
            <div className="pv-print-logo-url">{shareUrl}</div>
          </div>
        </div>
        <div className="pv-print-content">

        {/* Hero header */}
        <div className="pv-hero">
          <div className="pv-hero-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7M9 20l6-3M9 20V7m6 13l5.447-2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7M15 20V7M9 7l6-3"/></svg>
            ไปเล่า · Trip Planner
          </div>
          <h1 className="pv-hero-title">{plan.title}</h1>
          {plan.description && <p className="pv-hero-desc">{plan.description}</p>}
          <div className="pv-hero-meta">
            <div className="pv-hero-meta-chip">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {authorName}
            </div>
            {plan.startDate && (
              <div className="pv-hero-meta-chip">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {formatDate(plan.startDate)}{plan.endDate ? ` – ${formatDate(plan.endDate)}` : ""}
              </div>
            )}
            {plan.province && (
              <div className="pv-hero-meta-chip">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                {plan.province}
              </div>
            )}
            <div className="pv-hero-meta-chip">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
              {plan.stops.length} จุดหมาย · {maxDay} วัน
            </div>
          </div>
        </div>

        {/* Day sections */}
        <div className="pv-itinerary">
          {days.map(dayNum => {
            const dayStops = plan.stops.filter(s => (s.day ?? 1) === dayNum);
            if (dayStops.length === 0) return null;
            const dateLabel = getDateLabel(plan.startDate, dayNum);
            return (
              <div key={dayNum} className="pv-day-section">
                <div className="pv-day-header">
                  <div className="pv-day-pill">วันที่ {dayNum}</div>
                  {dateLabel && <span className="pv-day-date">{dateLabel}</span>}
                </div>
                <div className="pv-timeline">
                  {dayStops.map((stop, idx) => {
                    const meta = ST(stop.stopType);
                    const isLast = idx === dayStops.length - 1;
                    return (
                      <div key={stop.id} className="pv-timeline-item">
                        {/* Line */}
                        {!isLast && <div className="pv-timeline-line" />}
                        {/* Dot */}
                        <div className="pv-timeline-dot" style={{ background: meta.color }}>
                          <span>{meta.icon}</span>
                        </div>
                        {/* Card */}
                        <div className="pv-stop-card">
                          <div className="pv-stop-card-header">
                            <div className="pv-stop-order" style={{ color: meta.color }}>{idx + 1}</div>
                            <div className="pv-stop-info">
                              <div className="pv-stop-name">{stop.name}</div>
                              {(stop.province || stop.district) && (
                                <div className="pv-stop-loc">
                                  📍 {[stop.district, stop.province].filter(Boolean).join(", ")}
                                </div>
                              )}
                            </div>
                            <span className="pv-stop-badge" style={{ background: meta.bg, color: meta.color }}>
                              {meta.icon} {meta.label}
                            </span>
                          </div>
                          {(stop.arrivalTime || stop.duration) && (
                            <div className="pv-stop-timing">
                              {stop.arrivalTime && (
                                <span className="pv-timing-chip">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                                  ถึง {stop.arrivalTime}
                                </span>
                              )}
                              {stop.duration && (
                                <span className="pv-timing-chip">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                                  {fmtDuration(stop.duration)}
                                </span>
                              )}
                            </div>
                          )}
                          {stop.notes && <p className="pv-stop-notes">{stop.notes}</p>}
                          {stop.googleMapsUrl && (
                            <MapsButton url={stop.googleMapsUrl} placeName={stop.name} className="pv-maps-link no-print" variant="text" />
                          )}
                          {stop.googleMapsUrl && (
                            <div className="pv-maps-print print-only">
                              🗺️ {stop.googleMapsUrl}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Share section (screen only) */}
        <div className="pv-share-section no-print">
          <div className="pv-share-title">📤 แชร์แผนเที่ยวนี้</div>
          <div className="pv-share-url-box">
            <span className="pv-share-url-text">{shareUrl}</span>
            <button onClick={copyLink} className="pv-share-url-copy">
              {copied ? "✓ คัดลอกแล้ว" : "คัดลอก"}
            </button>
          </div>
          <div className="pv-share-buttons">
            <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="pv-share-big-btn pv-line-big">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
              แชร์ใน LINE
            </a>
            <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="pv-share-big-btn pv-fb-big">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              แชร์ใน Facebook
            </a>
            <button onClick={savePdf} className="pv-share-big-btn pv-pdf-big">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
              บันทึกเป็น PDF
            </button>
            <button onClick={() => setShowQR(true)} className="pv-share-big-btn pv-qr-big">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/>
                <path d="M14 14h3M14 18h3M17 14v7M21 14v3M21 21h-4"/>
              </svg>
              แสดง QR Code
            </button>
          </div>
        </div>

        {/* Travel wishes closing */}
        <div className="pv-wishes">
          <div className="pv-wishes-icon">✈️</div>
          <div className="pv-wishes-th">ขอให้เดินทางปลอดภัย พักผ่อนให้เต็มที่ และเก็บความทรงจำดีๆ ไว้มากมาย</div>
          <div className="pv-wishes-en">Wishing you a safe journey, wonderful memories, and adventures that last a lifetime.</div>
          <div className="pv-wishes-sig">— ทีมงาน ไปเล่า · PAI LAO Team 🗺️</div>
        </div>

        {/* Footer */}
        <div className="pv-footer">
          <span className="pv-footer-brand">ไปเล่า · Pai Lao</span>
          <span className="pv-footer-url">{shareUrl}</span>
        </div>
        </div>
      </div>

      {showQR && <QRModal url={shareUrl} title={plan.title} onClose={() => setShowQR(false)} />}
    </div>
  );
}

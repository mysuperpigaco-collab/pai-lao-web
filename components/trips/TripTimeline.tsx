"use client";

import { useState } from "react";
import type { Trip, TimelineStop } from "@/data/mockTrips";

type Props = {
  timeline: Trip["timeline"];
};

type LightboxState = {
  stopIdx: number;
  imgIdx: number;
} | null;

// Group stops by date
function groupByDate(timeline: TimelineStop[]) {
  const groups: { date: string; stops: { stop: TimelineStop; origIdx: number }[] }[] = [];
  timeline.forEach((stop, origIdx) => {
    const last = groups[groups.length - 1];
    if (last && last.date === stop.date) {
      last.stops.push({ stop, origIdx });
    } else {
      groups.push({ date: stop.date, stops: [{ stop, origIdx }] });
    }
  });
  return groups;
}

const TRANSPORT_ICON: Record<string, string> = {
  "รถทัวร์": "🚌",
  "เครื่องบิน": "✈️",
  "รถเช่า": "🚗",
  "เดินเที่ยว": "🚶",
  "เดิน": "🚶",
  "เดิน/ปีน": "🥾",
  "เล่นน้ำ": "🏊",
  "อาหาร": "🍽️",
};

export default function TripTimeline({ timeline }: Props) {
  const [showPhotos, setShowPhotos] = useState(true);
  const [lb, setLb] = useState<LightboxState>(null);

  const groups = groupByDate(timeline);
  const totalStops = timeline.length;
  const days = groups.length;

  // flat photo list per stop for lightbox navigation
  const openLb = (stopIdx: number, imgIdx: number) => setLb({ stopIdx, imgIdx });
  const closeLb = () => setLb(null);

  const lbMove = (dir: number) => {
    if (!lb) return;
    const photos = timeline[lb.stopIdx].images;
    const next = (lb.imgIdx + dir + photos.length) % photos.length;
    setLb({ ...lb, imgIdx: next });
  };

  const lbPhoto = lb ? timeline[lb.stopIdx].images[lb.imgIdx] : null;
  const lbCaption = lb ? `${timeline[lb.stopIdx].place} · รูปที่ ${lb.imgIdx + 1}` : "";

  return (
    <>
      {/* ─── SECTION HEADER ─── */}
      <div className="tl-section-hdr">
        <div className="tl-section-title">
          <span className="tl-route-icon">🗺️</span>
          เส้นทางการเดินทาง
          <span className="tl-meta-pill">{totalStops} จุด · {days} วัน</span>
        </div>

        <div className="tl-controls">
          <label className="tl-toggle-wrap" title="แสดง/ซ่อนรูปภาพ">
            <input
              type="checkbox"
              checked={showPhotos}
              onChange={(e) => setShowPhotos(e.target.checked)}
            />
            <span className="tl-track" />
            <span className="tl-thumb" />
            <span className="tl-toggle-label">📷 รูปภาพ</span>
          </label>
        </div>
      </div>

      {/* ─── TIMELINE ─── */}
      <div className="tl-root">
        <div className="tl-line" />

        {groups.map((group, gi) => (
          <div key={gi}>
            {/* Day separator */}
            <div className="tl-day-sep">
              <div className="tl-day-chip">
                วันที่ {gi + 1} · {group.date}
              </div>
            </div>

            {group.stops.map(({ stop, origIdx }, si) => {
              const isFirst = gi === 0 && si === 0;
              const isLast =
                gi === groups.length - 1 &&
                si === group.stops.length - 1;
              const hasPhotos = stop.images.length > 0;

              return (
                <div className="tl-item" key={origIdx}>
                  {/* Dot */}
                  <div
                    className={`tl-dot ${isFirst ? "tl-dot-first" : isLast ? "tl-dot-last" : ""}`}
                  >
                    {isFirst ? "🚩" : isLast ? "🏁" : "📍"}
                  </div>

                  {/* Card */}
                  <div className="tl-card">
                    <div className="tl-card-body">
                      {/* Time + label */}
                      <div className="tl-row-meta">
                        <span className={`tl-time-badge ${isLast ? "tl-time-badge-green" : ""}`}>
                          🕐 {stop.time || "--:--"}
                        </span>
                        {isFirst && <span className="tl-label-pill tl-label-blue">จุดเริ่มต้น</span>}
                        {isLast && <span className="tl-label-pill tl-label-green">จุดสิ้นสุด</span>}
                        {!isFirst && !isLast && (
                          <span className="tl-label-pill">จุดแวะ</span>
                        )}
                      </div>

                      {/* Place name */}
                      <div className="tl-place-name">📍 {stop.place}</div>

                      {/* Location */}
                      <div className="tl-location">
                        🏙️ {stop.province}
                        {stop.district ? ` · ${stop.district}` : ""}
                      </div>

                      {/* Description */}
                      <p className="tl-desc">{stop.description}</p>
                    </div>

                    {/* Stats */}
                    {(stop.transport || stop.duration || stop.cost) && (
                      <div className="tl-stats">
                        {stop.transport && (
                          <span className="tl-stat">
                            {TRANSPORT_ICON[stop.transport] ?? "🚗"} {stop.transport}
                          </span>
                        )}
                        {stop.duration && (
                          <>
                            <span className="tl-stat-dot">·</span>
                            <span className="tl-stat">⏱ {stop.duration}</span>
                          </>
                        )}
                        {stop.cost && (
                          <>
                            <span className="tl-stat-dot">·</span>
                            <span className="tl-stat">💰 {stop.cost}</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Photos */}
                    {hasPhotos && showPhotos && (
                      <div className="tl-photos">
                        {stop.images.map((src, ii) => (
                          <button
                            key={ii}
                            className="tl-thumb-btn"
                            onClick={() => openLb(origIdx, ii)}
                            aria-label={`ดูรูปที่ ${ii + 1} ของ ${stop.place}`}
                          >
                            <img src={src} alt={stop.place} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ─── LIGHTBOX ─── */}
      {lb && lbPhoto && (
        <div
          className="lb-overlay"
          onClick={(e) => e.target === e.currentTarget && closeLb()}
          role="dialog"
          aria-modal="true"
          aria-label="ดูรูปภาพ"
        >
          <button className="lb-close" onClick={closeLb} aria-label="ปิด">✕</button>

          <img className="lb-img" src={lbPhoto} alt={lbCaption} />

          <div className="lb-nav">
            <button
              className="lb-nav-btn"
              onClick={() => lbMove(-1)}
              aria-label="รูปก่อนหน้า"
            >
              ‹
            </button>
            <span className="lb-counter">
              {lb.imgIdx + 1} / {timeline[lb.stopIdx].images.length}
            </span>
            <button
              className="lb-nav-btn"
              onClick={() => lbMove(1)}
              aria-label="รูปถัดไป"
            >
              ›
            </button>
          </div>

          <div className="lb-caption">{lbCaption}</div>
        </div>
      )}

      <style jsx>{`
        /* ─── HEADER ─── */
        .tl-section-hdr {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .tl-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
        }
        .tl-route-icon { font-size: 22px; }
        .tl-meta-pill {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 3px 10px;
          border-radius: 999px;
        }

        /* Toggle */
        .tl-toggle-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          position: relative;
        }
        .tl-toggle-wrap input { position: absolute; opacity: 0; width: 0; height: 0; }
        .tl-track {
          display: inline-block;
          width: 42px;
          height: 24px;
          border-radius: 999px;
          background: #cbd5e1;
          border: 1.5px solid #94a3b8;
          transition: 0.25s;
          position: relative;
          flex-shrink: 0;
        }
        .tl-toggle-wrap input:checked ~ .tl-track {
          background: #3b82f6;
          border-color: #2563eb;
        }
        .tl-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          transition: 0.25s;
          pointer-events: none;
        }
        .tl-toggle-wrap input:checked ~ .tl-track ~ .tl-thumb {
          left: 21px;
        }
        .tl-toggle-label { font-size: 13px; font-weight: 700; color: #475569; }
        .tl-controls { display: flex; align-items: center; gap: 12px; }

        /* ─── TIMELINE ROOT ─── */
        .tl-root {
          position: relative;
          padding-left: 40px;
        }
        .tl-line {
          position: absolute;
          left: 14px;
          top: 10px;
          bottom: 10px;
          width: 2px;
          background: linear-gradient(to bottom, #bfdbfe, #e2e8f0, #bbf7d0);
          border-radius: 999px;
        }

        /* Day separator */
        .tl-day-sep {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0 20px -40px;
        }
        .tl-day-sep::before,
        .tl-day-sep::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }
        .tl-day-chip {
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 999px;
          padding: 5px 16px;
          font-size: 12px;
          font-weight: 800;
          color: #64748b;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        /* Item */
        .tl-item {
          position: relative;
          margin-bottom: 24px;
        }
        .tl-item:last-child { margin-bottom: 0; }

        /* Dot */
        .tl-dot {
          position: absolute;
          left: -40px;
          top: 12px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: white;
          border: 2px solid #bfdbfe;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          z-index: 2;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .tl-dot-first { border-color: #3b82f6; background: #eff6ff; }
        .tl-dot-last  { border-color: #10b981; background: #ecfdf5; }

        /* Card */
        .tl-card {
          background: white;
          border: 1.5px solid #f1f5f9;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.04);
          transition: box-shadow 0.2s, border-color 0.2s;
        }
        .tl-card:hover {
          border-color: #dbeafe;
          box-shadow: 0 8px 28px rgba(59,130,246,0.08);
        }
        .tl-card-body { padding: 18px 20px 0; }

        /* Meta row */
        .tl-row-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }
        .tl-time-badge {
          font-size: 11px;
          font-weight: 800;
          color: #2563eb;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          padding: 4px 10px;
          border-radius: 999px;
        }
        .tl-time-badge-green {
          color: #059669;
          background: #ecfdf5;
          border-color: #a7f3d0;
        }
        .tl-label-pill {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 3px 9px;
          border-radius: 999px;
        }
        .tl-label-blue { color: #3b82f6; background: #eff6ff; border-color: #bfdbfe; }
        .tl-label-green { color: #059669; background: #ecfdf5; border-color: #a7f3d0; }

        /* Place */
        .tl-place-name {
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .tl-location {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 600;
          margin-bottom: 10px;
        }
        .tl-desc {
          font-size: 14px;
          line-height: 1.85;
          color: #475569;
          padding-bottom: 14px;
        }

        /* Stats */
        .tl-stats {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          padding: 10px 20px;
          border-top: 1px solid #f1f5f9;
          background: #fafbfc;
        }
        .tl-stat { font-size: 12px; color: #64748b; font-weight: 700; }
        .tl-stat-dot { color: #cbd5e1; font-size: 12px; }

        /* Photos */
        .tl-photos {
          display: flex;
          gap: 8px;
          padding: 12px 20px 16px;
          overflow-x: auto;
          scrollbar-width: none;
          border-top: 1px solid #f1f5f9;
        }
        .tl-photos::-webkit-scrollbar { display: none; }
        .tl-thumb-btn {
          width: 100px;
          height: 76px;
          border-radius: 14px;
          overflow: hidden;
          border: 1.5px solid #e2e8f0;
          flex-shrink: 0;
          cursor: pointer;
          padding: 0;
          background: none;
          transition: transform 0.2s, border-color 0.2s;
        }
        .tl-thumb-btn:hover {
          transform: scale(1.05);
          border-color: #93c5fd;
        }
        .tl-thumb-btn img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* ─── LIGHTBOX ─── */
        .lb-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.9);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 16px;
          padding: 24px;
        }
        .lb-close {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.12);
          color: white;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s;
        }
        .lb-close:hover { background: rgba(255,255,255,0.22); }
        .lb-img {
          max-width: min(780px, 100%);
          max-height: 65vh;
          object-fit: contain;
          border-radius: 20px;
        }
        .lb-nav {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .lb-nav-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.12);
          color: white;
          font-size: 26px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s;
          line-height: 1;
        }
        .lb-nav-btn:hover { background: rgba(255,255,255,0.22); }
        .lb-counter { font-size: 13px; color: rgba(255,255,255,0.5); min-width: 50px; text-align: center; }
        .lb-caption { font-size: 13px; color: rgba(255,255,255,0.6); text-align: center; }

        @media (max-width: 768px) {
          .tl-section-title { font-size: 18px; }
          .tl-thumb-btn { width: 84px; height: 64px; }
          .lb-img { border-radius: 12px; }
        }
      `}</style>
    </>
  );
}

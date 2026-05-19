"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TripSlider from "@/components/home/TripSlider";
import ExplorerSection from "@/components/home/ExplorerSection";
import AutoGridSection from "@/components/home/AutoGridSection";
import { useAuth } from "@/context/AuthContext";

interface Trip {
  slug: string;
  title: string;
  coverUrl?: string | null;
  province?: string | null;
  author?: { displayName?: string | null; firstName?: string } | null;
  createdAt: string;
}

const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

export default function HomePage() {
  const { user } = useAuth();
  const [showArchive, setShowArchive] = useState(false);
  const [archiveTrips, setArchiveTrips] = useState<Trip[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archivePage, setArchivePage] = useState(1);
  const [archiveTotal, setArchiveTotal] = useState(0);
  const PAGE_SIZE = 12;

  useEffect(() => {
    if (!showArchive) return;
    setArchiveLoading(true);
    fetch(`/api/trips?limit=${PAGE_SIZE}&page=${archivePage}&sort=recent`)
      .then(r => r.json())
      .then(d => {
        setArchiveTrips(d.trips ?? []);
        setArchiveTotal(d.total ?? d.trips?.length ?? 0);
        setArchiveLoading(false);
      })
      .catch(() => setArchiveLoading(false));
  }, [showArchive, archivePage]);

  const totalPages = Math.ceil(archiveTotal / PAGE_SIZE);

  return (
    <main className="hp-container">

      {/* ─── Spotlight ─── */}
      <div className="hp-section-hdr">
        <div>
          <h2 className="hp-title">✨ เรื่องเล่า <span>Spotlight</span></h2>
          <p className="hp-sub">เรื่องเล่าการเดินทางล่าสุด · Latest travel stories</p>
        </div>
        {user ? (
          <Link href={user.role === "BUSINESS" ? "/business/dashboard" : "/dashboard"} className="hp-see-all">
            👤 ข้อมูลส่วนตัว →
          </Link>
        ) : (
          <Link href="/trips" className="hp-see-all">ดูทั้งหมด · See all →</Link>
        )}
      </div>
      <TripSlider />

      {/* ─── Story Archive ─── */}
      <div style={{ margin: "36px 0" }}>
        <button className={`hp-archive-btn${showArchive ? " open" : ""}`} onClick={() => setShowArchive(v => !v)}>
          <span>📂 คลังเรื่องเล่าทั้งหมด · Story Archive</span>
          <span className="hp-archive-arrow"><IconArrow /></span>
        </button>

        {showArchive && (
          <div className="hp-archive-panel fade-in">
            {archiveLoading ? (
              <div className="hp-archive-loading">⏳ กำลังโหลด...</div>
            ) : archiveTrips.length === 0 ? (
              <div className="hp-archive-loading">📭 ยังไม่มีเรื่องเล่า</div>
            ) : (
              <>
                <p className="hp-archive-count">พบ <strong>{archiveTotal}</strong> เรื่องเล่า · {archiveTotal} stories</p>
                <div className="hp-archive-grid">
                  {archiveTrips.map(trip => (
                    <Link key={trip.slug} href={`/trips/${trip.slug}`} className="hp-acard">
                      <div className="hp-acard-img">
                        {trip.coverUrl
                          ? <img src={trip.coverUrl} alt={trip.title} loading="lazy" />
                          : <div className="hp-acard-ph">🏞️</div>}
                      </div>
                      <div className="hp-acard-body">
                        <h4>{trip.title}</h4>
                        <div className="hp-acard-meta">
                          {trip.province && <span>📍 {trip.province}</span>}
                          <span>{new Date(trip.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                        {trip.author && <p className="hp-acard-author">โดย {trip.author.displayName || trip.author.firstName}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="hp-pagination">
                    <button className="hp-page-btn" onClick={() => setArchivePage(p => Math.max(1, p - 1))} disabled={archivePage === 1}>← ก่อนหน้า</button>
                    <span className="hp-page-info">หน้า {archivePage} / {totalPages}</span>
                    <button className="hp-page-btn" onClick={() => setArchivePage(p => Math.min(totalPages, p + 1))} disabled={archivePage === totalPages}>ถัดไป →</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ─── Explorer ─── */}
      <ExplorerSection />

      {/* ─── Must-See ─── */}
      <div className="hp-section-hdr" style={{ marginTop: "48px" }}>
        <div>
          <h2 className="hp-title">📺 Must-See <span>ไฮไลต์สัปดาห์นี้</span></h2>
          <p className="hp-sub">คัดมาให้แล้ว เรื่องราวน่าสนใจประจำสัปดาห์ · Curated weekly highlights</p>
        </div>
      </div>
      <AutoGridSection />

      <style jsx>{`
        .hp-container { max-width: 1200px; margin: 0 auto; padding: 36px 20px 80px; }

        .hp-section-hdr { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 18px; gap: 12px; flex-wrap: wrap; }
        .hp-title { font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 4px; }
        .hp-title span { color: #2563eb; }
        .hp-sub { font-size: 13px; color: #64748b; margin: 0; }
        .hp-see-all { font-size: 13px; font-weight: 700; color: #2563eb; text-decoration: none; white-space: nowrap; }
        .hp-see-all:hover { text-decoration: underline; }

        .hp-archive-btn { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 14px 22px; background: white; border: 1.5px solid #e2e8f0; border-radius: 14px; font-size: 14px; font-weight: 700; color: #334155; cursor: pointer; font-family: inherit; transition: 0.2s; }
        .hp-archive-btn:hover { background: #f8fafc; border-color: #4facfe; color: #2563eb; }
        .hp-archive-btn.open { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; border-radius: 14px 14px 0 0; }
        .hp-archive-arrow { transition: transform 0.3s; display: flex; }
        .hp-archive-btn.open .hp-archive-arrow { transform: rotate(180deg); }

        .hp-archive-panel { background: white; border: 1.5px solid #bfdbfe; border-top: none; border-radius: 0 0 14px 14px; padding: 22px; }
        .hp-archive-loading { text-align: center; padding: 40px; color: #94a3b8; font-size: 15px; }
        .hp-archive-count { font-size: 13px; color: #64748b; margin: 0 0 16px; }
        .hp-archive-count strong { color: #1e293b; }

        .hp-archive-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .hp-acard { background: #f8fafc; border-radius: 16px; overflow: hidden; text-decoration: none; color: inherit; border: 1px solid #f1f5f9; transition: 0.2s; display: block; }
        .hp-acard:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(15,23,42,0.08); }
        .hp-acard-img { height: 130px; overflow: hidden; background: #e2e8f0; }
        .hp-acard-img img { width: 100%; height: 100%; object-fit: cover; }
        .hp-acard-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 32px; }
        .hp-acard-body { padding: 12px 14px; }
        .hp-acard-body h4 { font-size: 13px; font-weight: 700; color: #1e293b; margin: 0 0 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hp-acard-meta { display: flex; gap: 8px; flex-wrap: wrap; font-size: 11px; color: #94a3b8; margin-bottom: 4px; }
        .hp-acard-author { font-size: 11px; color: #64748b; margin: 0; font-style: italic; }

        .hp-pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 22px; }
        .hp-page-btn { padding: 8px 18px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: white; font-size: 13px; font-weight: 700; cursor: pointer; color: #334155; font-family: inherit; transition: 0.2s; }
        .hp-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .hp-page-btn:not(:disabled):hover { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; }
        .hp-page-info { font-size: 13px; color: #64748b; font-weight: 600; }

        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 900px) { .hp-archive-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .hp-archive-grid { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  );
}

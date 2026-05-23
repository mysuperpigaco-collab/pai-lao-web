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
  avgRating?: number | null;
  _count?: { reviews: number; bookmarks: number; likes: number };
}

const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const RANK_STYLE: Record<number, { border: string; bg: string; badge: string; label: string }> = {
  0: { border: "#f59e0b", bg: "linear-gradient(135deg,#fefce8,#fef3c7)", badge: "🥇", label: "อันดับ 1" },
  1: { border: "#94a3b8", bg: "linear-gradient(135deg,#f8fafc,#f1f5f9)", badge: "🥈", label: "อันดับ 2" },
};

export default function HomePage() {
  const { user } = useAuth();
  const [showArchive, setShowArchive] = useState(false);
  const [archiveTrips, setArchiveTrips] = useState<Trip[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);

  useEffect(() => {
    if (!showArchive || archiveTrips.length > 0) return;
    setArchiveLoading(true);
    fetch(`/api/trips?limit=10&sort=popular`)
      .then(r => r.json())
      .then(d => {
        setArchiveTrips(d.trips ?? []);
        setArchiveLoading(false);
      })
      .catch(() => setArchiveLoading(false));
  }, [showArchive]);

  return (
    <main className="hp-container">

      {/* ─── Spotlight ─── */}
      <div className="hp-section-hdr">
        <div>
          <h2 className="hp-title">✨ เรื่องเล่า <span>Spotlight</span></h2>
          <p className="hp-sub">เรื่องเล่าการเดินทางยอดนิยม · Most popular travel stories</p>
        </div>
        {user ? (
          <Link href={user.role === "BUSINESS" ? "/business/dashboard" : "/dashboard"} style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "9px 18px", borderRadius: 999,
            background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
            color: "#fff", fontWeight: 800, fontSize: 13,
            textDecoration: "none", whiteSpace: "nowrap",
            boxShadow: "0 4px 14px rgba(16,185,129,0.28)",
          }}>
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt="" style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(255,255,255,0.6)" }} />
              : <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900 }}>
                  {(user.displayName || user.firstName || "").slice(0, 1).toUpperCase()}
                </span>
            }
            {user.displayName || user.firstName}
          </Link>
        ) : (
          <Link href="/trips" className="hp-see-all">ดูทั้งหมด · See all →</Link>
        )}
      </div>
      <TripSlider />

      {/* ─── Story Archive ─── */}
      <div style={{ margin: "36px 0" }}>
        <button className={`hp-archive-btn${showArchive ? " open" : ""}`} onClick={() => setShowArchive(v => !v)}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span>🏆</span>
            <div>
              <div>คลังเรื่องเล่ายอดนิยม · Top Stories</div>
              <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.65, marginTop: 1 }}>10 อันดับที่คนบุ๊กมาร์คมากที่สุด · Most bookmarked</div>
            </div>
          </div>
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
                <p className="hp-archive-hdr">🏆 10 เรื่องเล่ายอดนิยม · Most Bookmarked Stories</p>

                {/* Rank 1 & 2 — featured row */}
                <div className="hp-top2">
                  {archiveTrips.slice(0, 2).map((trip, i) => {
                    const rs = RANK_STYLE[i];
                    return (
                      <Link key={trip.slug} href={`/trips/${trip.slug}`} className="hp-top-card" style={{ background: rs.bg, borderColor: rs.border }}>
                        <div className="hp-top-img">
                          {trip.coverUrl
                            ? <img src={trip.coverUrl} alt={trip.title} loading="lazy" />
                            : <div className="hp-acard-ph">🏞️</div>}
                          <span className="hp-top-badge">{rs.badge} {rs.label}</span>
                          {(trip._count?.bookmarks ?? 0) > 0 && (
                            <span className="hp-bm-pill">🔖 {trip._count!.bookmarks}</span>
                          )}
                        </div>
                        <div className="hp-top-body">
                          <h3>{trip.title}</h3>
                          <div className="hp-top-meta">
                            {trip.province && <span>📍 {trip.province}</span>}
                            {trip.author && <span>โดย {trip.author.displayName || trip.author.firstName}</span>}
                          </div>
                          <div className="hp-top-stats">
                            {trip.avgRating != null && trip.avgRating > 0 && (
                              <span className="hp-stat-pill hp-stat-gold">⭐ {trip.avgRating.toFixed(1)}</span>
                            )}
                            {(trip._count?.likes ?? 0) > 0 && (
                              <span className="hp-stat-pill hp-stat-red">❤️ {trip._count!.likes}</span>
                            )}
                            {(trip._count?.reviews ?? 0) > 0 && (
                              <span className="hp-stat-pill hp-stat-blue">💬 {trip._count!.reviews}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Rank 3–10 — normal grid */}
                {archiveTrips.length > 2 && (
                  <div className="hp-archive-grid">
                    {archiveTrips.slice(2).map((trip, i) => (
                      <Link key={trip.slug} href={`/trips/${trip.slug}`} className="hp-acard">
                        <div className="hp-acard-img">
                          {trip.coverUrl
                            ? <img src={trip.coverUrl} alt={trip.title} loading="lazy" />
                            : <div className="hp-acard-ph">🏞️</div>}
                          <span className="hp-rank-num">#{i + 3}</span>
                          {(trip._count?.bookmarks ?? 0) > 0 && (
                            <span className="hp-bm-sm">🔖 {trip._count!.bookmarks}</span>
                          )}
                        </div>
                        <div className="hp-acard-body">
                          <h4>{trip.title}</h4>
                          <div className="hp-acard-meta">
                            {trip.province && <span>📍 {trip.province}</span>}
                            {trip.avgRating != null && trip.avgRating > 0 && <span>⭐ {trip.avgRating.toFixed(1)}</span>}
                            {(trip._count?.likes ?? 0) > 0 && <span>❤️ {trip._count!.likes}</span>}
                            {(trip._count?.reviews ?? 0) > 0 && <span>💬 {trip._count!.reviews}</span>}
                          </div>
                          {trip.author && <p className="hp-acard-author">โดย {trip.author.displayName || trip.author.firstName}</p>}
                        </div>
                      </Link>
                    ))}
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
          <h2 className="hp-title">🗺️ ไฮไลต์สถานที่ <span>Explore Places</span></h2>
          <p className="hp-sub">เรื่องเล่าล่าสุดและสถานที่น่าสนใจจากทุกหมวด · Latest stories & places by category</p>
        </div>
      </div>
      <AutoGridSection />

      <style jsx>{`
        .hp-container { max-width: 1200px; margin: 0 auto; padding: 36px 20px 80px; }
        @media (max-width: 640px) { .hp-container { padding: 16px 12px 60px; } }

        .hp-section-hdr { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 18px; gap: 12px; flex-wrap: wrap; }
        .hp-title { font-size: 26px; font-weight: 900; color: #0f172a; margin: 0 0 6px; }
        .hp-title span { color: #2563eb; }
        .hp-sub { font-size: 15px; color: #64748b; margin: 0; }
        .hp-see-all { font-size: 14px; font-weight: 700; color: #2563eb; text-decoration: none; white-space: nowrap; }
        .hp-see-all:hover { text-decoration: underline; }

        /* Archive toggle button */
        .hp-archive-btn {
          width: 100%; display: flex; justify-content: space-between; align-items: center;
          padding: 14px 22px; background: white; border: 1.5px solid #e2e8f0;
          border-radius: 14px; font-size: 15px; font-weight: 700; color: #334155;
          cursor: pointer; font-family: inherit; transition: 0.2s; text-align: left;
        }
        .hp-archive-btn:hover { background: #f8fafc; border-color: #f59e0b; color: #92400e; }
        .hp-archive-btn.open { background: #fffbeb; border-color: #fde68a; color: #92400e; border-radius: 14px 14px 0 0; }
        .hp-archive-arrow { transition: transform 0.3s; display: flex; flex-shrink: 0; }
        .hp-archive-btn.open .hp-archive-arrow { transform: rotate(180deg); }

        /* Archive panel */
        .hp-archive-panel { background: white; border: 1.5px solid #fde68a; border-top: none; border-radius: 0 0 14px 14px; padding: 24px; }
        .hp-archive-loading { text-align: center; padding: 40px; color: #94a3b8; font-size: 15px; }
        .hp-archive-hdr { font-size: 15px; font-weight: 800; color: #1e293b; margin: 0 0 18px; }

        /* Top 2 featured */
        .hp-top2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .hp-top-card {
          border-radius: 20px; overflow: hidden; text-decoration: none;
          color: inherit; display: block; border: 2px solid;
          transition: 0.2s; box-shadow: 0 4px 16px rgba(15,23,42,0.07);
        }
        .hp-top-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(15,23,42,0.12); }
        .hp-top-img { position: relative; height: 200px; overflow: hidden; background: #e2e8f0; }
        .hp-top-img img { width: 100%; height: 100%; object-fit: cover; }
        .hp-top-badge {
          position: absolute; top: 12px; left: 12px;
          background: rgba(0,0,0,0.55); backdrop-filter: blur(6px);
          color: white; font-size: 12px; font-weight: 800;
          padding: 4px 12px; border-radius: 999px;
        }
        .hp-bm-pill {
          position: absolute; bottom: 10px; right: 10px;
          background: rgba(245,158,11,0.9); color: white;
          font-size: 11px; font-weight: 800;
          padding: 3px 10px; border-radius: 999px; backdrop-filter: blur(4px);
        }
        .hp-top-body { padding: 14px 18px 18px; }
        .hp-top-body h3 { font-size: 18px; font-weight: 900; color: #0f172a; margin: 0 0 6px; }
        .hp-top-meta { display: flex; gap: 12px; font-size: 12px; color: #64748b; flex-wrap: wrap; margin-bottom: 6px; }
        .hp-top-reviews { font-size: 12px; color: #059669; font-weight: 700; }

        /* Normal grid (rank 3-10) */
        .hp-archive-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .hp-acard { background: #f8fafc; border-radius: 16px; overflow: hidden; text-decoration: none; color: inherit; border: 1px solid #f1f5f9; transition: 0.2s; display: block; }
        .hp-acard:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(15,23,42,0.08); }
        .hp-acard-img { position: relative; height: 130px; overflow: hidden; background: #e2e8f0; }
        .hp-acard-img img { width: 100%; height: 100%; object-fit: cover; }
        .hp-acard-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 32px; }
        .hp-rank-num {
          position: absolute; top: 8px; left: 8px;
          background: rgba(15,23,42,0.7); color: white;
          font-size: 10px; font-weight: 800;
          padding: 2px 7px; border-radius: 999px;
        }
        .hp-bm-sm {
          position: absolute; bottom: 6px; right: 6px;
          background: rgba(0,0,0,0.55); color: white;
          font-size: 10px; font-weight: 700;
          padding: 2px 7px; border-radius: 999px;
        }
        .hp-acard-body { padding: 11px 13px; }
        .hp-acard-body h4 { font-size: 14px; font-weight: 700; color: #1e293b; margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hp-acard-meta { display: flex; gap: 8px; flex-wrap: wrap; font-size: 11px; color: #94a3b8; margin-bottom: 3px; }
        .hp-acard-author { font-size: 11px; color: #64748b; margin: 0; font-style: italic; }

        /* Stat pills */
        .hp-top-stats { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
        .hp-stat-pill { font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 999px; }
        .hp-stat-gold { background: #fef3c7; color: #92400e; }
        .hp-stat-red  { background: #fee2e2; color: #991b1b; }
        .hp-stat-blue { background: #dbeafe; color: #1e40af; }

        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 900px) {
          .hp-top2 { grid-template-columns: 1fr; }
          .hp-archive-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .hp-archive-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .hp-top-img { height: 160px; }
          .hp-top2 { grid-template-columns: 1fr; }
          .hp-section-hdr { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </main>
  );
}

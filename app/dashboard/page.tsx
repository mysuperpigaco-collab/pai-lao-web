"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import StoryCard from "@/components/dashboard/StoryCard";
import { useAuth } from "@/context/AuthContext";

type TripItem = {
  slug: string;
  title: string;
  coverUrl: string | null;
  createdAt: string;
  isPublished: boolean;
};

type BookmarkItem = {
  trip?: { slug: string; title: string; coverUrl: string | null; createdAt: string } | null;
  place?: { slug: string; title: string; coverUrl: string | null; createdAt: string } | null;
};

const WRITE_BTN: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "12px",
  padding: "10px 20px 10px 10px", borderRadius: "14px",
  background: "linear-gradient(135deg, #4facfe 0%, #43e97b 100%)",
  color: "#ffffff", textDecoration: "none", border: "none",
  cursor: "pointer", boxShadow: "0 6px 18px rgba(79,172,254,0.30)", fontFamily: "inherit",
};
const WRITE_ICON: React.CSSProperties = { width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const WRITE_TEXT_WRAP: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "3px", textAlign: "left", lineHeight: 1 };
const WRITE_STRONG: React.CSSProperties = { fontSize: "14px", fontWeight: 900, color: "#ffffff", display: "block" };
const WRITE_SMALL: React.CSSProperties = { fontSize: "10px", fontWeight: 400, color: "rgba(255,255,255,0.82)", display: "block" };

const IconWrite = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 5H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.375 2.625a1.875 1.875 0 1 1 2.65 2.65L12 14.25l-4 1 1-4 9.375-8.625Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"my-stories" | "saved">("my-stories");

  const [myTrips, setMyTrips]       = useState<TripItem[]>([]);
  const [bookmarks, setBookmarks]   = useState<BookmarkItem[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingBm, setLoadingBm]   = useState(false);

  // load my trips
  useEffect(() => {
    setLoadingTrips(true);
    fetch("/api/trips?mine=1&limit=50")
      .then(r => r.json())
      .then(d => { setMyTrips(d.trips ?? []); setLoadingTrips(false); })
      .catch(() => setLoadingTrips(false));
  }, []);

  // load bookmarks when tab is selected
  useEffect(() => {
    if (activeTab !== "saved") return;
    setLoadingBm(true);
    fetch("/api/bookmarks")
      .then(r => r.json())
      .then(d => { setBookmarks(d.bookmarks ?? []); setLoadingBm(false); })
      .catch(() => setLoadingBm(false));
  }, [activeTab]);

  const handleTripDeleted = (slug: string) =>
    setMyTrips(prev => prev.filter(t => t.slug !== slug));

  // saved trips (from bookmarks — only trip bookmarks for now)
  const savedTrips = bookmarks
    .filter(b => b.trip)
    .map(b => b.trip!);

  const profileUser = user ? {
    username:       `@${user.username}`,
    displayName:    user.displayName || `${user.firstName}`,
    avatarUrl:      user.avatarUrl || undefined,
    storiesCount:   myTrips.length,
    likesCount:     "—",
    followingCount: 0,
    interests:      [],
  } : undefined;

  const isLoading = activeTab === "my-stories" ? loadingTrips : loadingBm;
  const stories   = activeTab === "my-stories" ? myTrips : savedTrips;

  return (
    <div className="dp-page">
      <div className="dp-container">

        <ProfileHeader isOwner={true} user={profileUser} />

        <div className="dp-grid">

          {/* ── SIDEBAR ── */}
          <aside className="dp-sidebar">

            <div className="dp-card">
              <h3 className="sb-title">สถิติ <small>Statistics</small></h3>
              <div className="stats-row">
                <div className="stat-card">
                  <strong style={{ color: "#2563eb" }}>{myTrips.length}</strong>
                  <span>เรื่องเล่า <small>Stories</small></span>
                </div>
                <div className="stat-card">
                  <strong style={{ color: "#22a06b" }}>{bookmarks.length || "—"}</strong>
                  <span>บันทึกไว้ <small>Saved</small></span>
                </div>
              </div>
            </div>

            <div className="dp-card">
              <h3 className="sb-title">ข้อมูล <small>Account</small></h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#475569" }}>
                {user?.email && <span>📧 {user.email}</span>}
                {user?.role === "TRAVELER" && <span>🎒 Traveler Account</span>}
              </div>
            </div>

          </aside>

          {/* ── MAIN ── */}
          <main className="dp-main">
            <div className="dp-card main-card">

              <div className="tab-bar">
                <div className="tabs">
                  {(["my-stories", "saved"] as const).map((id) => (
                    <button
                      key={id}
                      className={`tab-btn ${activeTab === id ? "active" : ""}`}
                      onClick={() => setActiveTab(id)}
                    >
                      {id === "my-stories" ? "เรื่องเล่าของฉัน · My Stories" : "บันทึกไว้ · Saved"}
                    </button>
                  ))}
                </div>

                <Link href="/trips/create" style={WRITE_BTN}>
                  <span style={WRITE_ICON}><IconWrite /></span>
                  <span style={WRITE_TEXT_WRAP}>
                    <strong style={WRITE_STRONG}>เขียนเรื่องใหม่</strong>
                    <small style={WRITE_SMALL}>แชร์ประสบการณ์การเดินทาง</small>
                  </span>
                </Link>
              </div>

              {isLoading ? (
                <p style={{ color: "#94a3b8", padding: "40px 0", textAlign: "center" }}>⏳ กำลังโหลด...</p>
              ) : stories.length > 0 ? (
                <>
                  <p className="info-row">พบ <strong>{stories.length}</strong> รายการ</p>
                  <div className="story-grid">
                    {stories.map((story) => (
                      <StoryCard
                        key={story.slug}
                        story={story}
                        isOwner={activeTab === "my-stories"}
                        onDeleted={activeTab === "my-stories" ? handleTripDeleted : undefined}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <span>📭</span>
                  <p>
                    {activeTab === "my-stories"
                      ? "ยังไม่มีเรื่องเล่า · No stories yet"
                      : "ยังไม่มีรายการที่บันทึกไว้ · No saved items"}
                  </p>
                  {activeTab === "my-stories" && (
                    <Link href="/trips/create" style={{ ...WRITE_BTN, marginTop: "16px" }}>
                      <span style={WRITE_ICON}><IconWrite /></span>
                      <span style={WRITE_TEXT_WRAP}>
                        <strong style={WRITE_STRONG}>เขียนเรื่องแรก</strong>
                        <small style={WRITE_SMALL}>Start writing</small>
                      </span>
                    </Link>
                  )}
                </div>
              )}

            </div>
          </main>

        </div>
      </div>

      <style jsx>{`
        .dp-page { min-height: 100vh; background: #f8fafc; padding: 36px 0 80px; }
        .dp-container { max-width: 1280px; margin: 0 auto; padding: 0 20px; }

        .dp-grid { display: grid; grid-template-columns: 280px 1fr; gap: 28px; align-items: start; }

        .dp-card { background: white; border-radius: 28px; padding: 28px; border: 1px solid #f1f5f9; box-shadow: 0 2px 12px rgba(15,23,42,0.04); margin-bottom: 20px; }
        .dp-card:last-child { margin-bottom: 0; }

        .dp-sidebar { position: sticky; top: 100px; }

        .sb-title { font-size: 15px; font-weight: 900; color: #1e293b; margin: 0 0 18px; }
        .sb-title small { font-size: 11px; color: #94a3b8; font-weight: 400; margin-left: 5px; }

        .stats-row { display: flex; gap: 10px; }
        .stat-card { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; padding: 16px 12px; background: #f8fafc; border-radius: 16px; }
        .stat-card strong { font-size: 24px; font-weight: 900; line-height: 1; }
        .stat-card span { font-size: 12px; color: #64748b; text-align: center; }
        .stat-card small { color: #94a3b8; font-size: 10px; }

        .main-card { padding: 32px; }

        .tab-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 22px; }
        .tabs { display: flex; gap: 4px; }
        .tab-btn { padding: 10px 18px; border-radius: 10px; border: none; background: transparent; font-size: 14px; font-weight: 700; color: #94a3b8; cursor: pointer; transition: 0.2s; }
        .tab-btn.active { background: #eff6ff; color: #2563eb; }
        .tab-btn:hover:not(.active) { background: #f8fafc; color: #64748b; }

        .info-row { font-size: 13px; color: #94a3b8; margin: 0 0 22px; }
        .info-row strong { color: #1e293b; }

        .story-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 22px; }

        .empty-state { text-align: center; padding: 60px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .empty-state > span { font-size: 48px; }
        .empty-state > p    { color: #94a3b8; font-size: 15px; margin: 0; }

        @media (max-width: 1100px) { .dp-grid { grid-template-columns: 1fr; } .dp-sidebar { position: static; } }
        @media (max-width: 640px) { .story-grid { grid-template-columns: 1fr; } .main-card { padding: 20px; } .tab-btn { font-size: 12px; padding: 8px 12px; } }
      `}</style>
    </div>
  );
}

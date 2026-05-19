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
  trip?:  { slug: string; title: string; coverUrl: string | null; createdAt: string } | null;
  place?: { slug: string; title: string; coverUrl: string | null; createdAt: string } | null;
};

type Notice = { id: string; type: "info" | "tip" | "success" | "warning"; icon: string; title: string; body: string; action?: { label: string; href: string } };

const IconWrite = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>
    <path d="M18.375 2.625a1.875 1.875 0 1 1 2.65 2.65L12 14.25l-4 1 1-4 9.375-8.625Z"/>
  </svg>
);

const NOTICE_STYLE: Record<Notice["type"], { bg: string; border: string; icon_bg: string; title: string }> = {
  info:    { bg: "#eff6ff", border: "#bfdbfe", icon_bg: "#2563eb", title: "#1e40af" },
  tip:     { bg: "#f0fdf4", border: "#bbf7d0", icon_bg: "#16a34a", title: "#15803d" },
  success: { bg: "#f0fdf4", border: "#bbf7d0", icon_bg: "#22a06b", title: "#15803d" },
  warning: { bg: "#fffbeb", border: "#fde68a", icon_bg: "#d97706", title: "#92400e" },
};

function NoticeCard({ n, onDismiss }: { n: Notice; onDismiss: (id: string) => void }) {
  const s = NOTICE_STYLE[n.type];
  return (
    <div style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: "16px", padding: "16px 18px", display: "flex", gap: "14px", alignItems: "flex-start", position: "relative" }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: s.icon_bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>{n.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 800, fontSize: "14px", color: s.title, margin: "0 0 3px" }}>{n.title}</p>
        <p style={{ fontSize: "13px", color: "#475569", margin: 0, lineHeight: 1.5 }}>{n.body}</p>
        {n.action && (
          <Link href={n.action.href} style={{ display: "inline-block", marginTop: "8px", fontSize: "12px", fontWeight: 700, color: s.icon_bg, textDecoration: "none", background: "rgba(255,255,255,0.7)", padding: "4px 12px", borderRadius: "999px", border: `1px solid ${s.border}` }}>
            {n.action.label} →
          </Link>
        )}
      </div>
      <button onClick={() => onDismiss(n.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "16px", lineHeight: 1, padding: "2px 4px", flexShrink: 0 }} aria-label="ปิด">×</button>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab]   = useState<"my-stories" | "saved">("my-stories");
  const [myTrips, setMyTrips]       = useState<TripItem[]>([]);
  const [bookmarks, setBookmarks]   = useState<BookmarkItem[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingBm, setLoadingBm]   = useState(false);
  const [dismissed, setDismissed]   = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoadingTrips(true);
    fetch("/api/trips?mine=1&limit=50")
      .then(r => r.json())
      .then(d => { setMyTrips(d.trips ?? []); setLoadingTrips(false); })
      .catch(() => setLoadingTrips(false));
  }, []);

  useEffect(() => {
    if (activeTab !== "saved") return;
    setLoadingBm(true);
    fetch("/api/bookmarks")
      .then(r => r.json())
      .then(d => { setBookmarks(d.bookmarks ?? []); setLoadingBm(false); })
      .catch(() => setLoadingBm(false));
  }, [activeTab]);

  const handleTripDeleted = (slug: string) => setMyTrips(prev => prev.filter(t => t.slug !== slug));
  const dismiss = (id: string) => setDismissed(prev => new Set([...prev, id]));

  // ─── สร้าง notices แบบ dynamic ตามข้อมูลจริง ───
  const notices: Notice[] = [];

  if (user && !user.avatarUrl) notices.push({
    id: "no-avatar", type: "tip", icon: "📸",
    title: "เพิ่มรูปโปรไฟล์ของคุณ",
    body: "รูปโปรไฟล์ช่วยให้คนอื่นจดจำคุณได้ง่ายขึ้น · Add a photo to stand out",
    action: { label: "อัปโหลดรูปเลย", href: "/dashboard/edit-profile" },
  });

  if (!loadingTrips && myTrips.length === 0) notices.push({
    id: "no-stories", type: "info", icon: "✍️",
    title: "เริ่มเขียนเรื่องเล่าแรกของคุณ",
    body: "แชร์ประสบการณ์การเดินทางให้นักเดินทางทั่วไทยได้อ่าน · Share your first adventure",
    action: { label: "เขียนเรื่องเลย", href: "/trips/create" },
  });

  if (myTrips.length >= 3) notices.push({
    id: "milestone-3", type: "success", icon: "🏆",
    title: `ยอดเยี่ยม! คุณมีเรื่องเล่าแล้ว ${myTrips.length} เรื่อง`,
    body: "ยิ่งเขียนมาก ยิ่งมีคนติดตาม — ไปต่อได้เลย · Keep sharing, keep inspiring!",
  });

  const visibleNotices = notices.filter(n => !dismissed.has(n.id));

  const savedTrips = bookmarks.filter(b => b.trip).map(b => b.trip!);
  const isLoading  = activeTab === "my-stories" ? loadingTrips : loadingBm;
  const stories    = activeTab === "my-stories" ? myTrips : savedTrips;

  const profileUser = user ? {
    username:       `@${user.username}`,
    displayName:    user.displayName || user.firstName,
    avatarUrl:      user.avatarUrl || undefined,
    storiesCount:   myTrips.length,
    likesCount:     "—",
    followingCount: 0,
    interests:      [],
  } : undefined;

  return (
    <div className="dp-page">
      <div className="dp-container">

        {/* ─── Page header ─── */}
        <div className="dp-page-header">
          <div>
            <h1 className="dp-greeting">
              สวัสดี{user ? `, ${user.displayName || user.firstName}` : ""} 👋
            </h1>
            <p className="dp-subheading">จัดการโปรไฟล์ เรื่องเล่า และกิจกรรมทั้งหมดของคุณ</p>
          </div>
          <Link href="/trips/create" className="dp-write-btn">
            <span className="dp-write-icon"><IconWrite /></span>
            <span className="dp-write-text">
              <strong>เขียนเรื่องใหม่</strong>
              <small>แชร์ประสบการณ์</small>
            </span>
          </Link>
        </div>

        {/* ─── Notification boxes ─── */}
        {visibleNotices.length > 0 && (
          <div className="dp-notices">
            {visibleNotices.map(n => <NoticeCard key={n.id} n={n} onDismiss={dismiss} />)}
          </div>
        )}

        {/* ─── Main grid ─── */}
        <div className="dp-grid">

          {/* ── Sidebar ── */}
          <aside className="dp-sidebar">
            <ProfileHeader isOwner={true} user={profileUser} />

            <div className="dp-card" style={{ marginTop: "16px" }}>
              <h3 className="sb-title">บัญชีของฉัน <small>My Account</small></h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569" }}>
                  <span>ประเภท</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>🎒 Traveler</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569" }}>
                  <span>บันทึกไว้</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{bookmarks.length || 0} รายการ</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569" }}>
                  <span>เรื่องเล่า</span>
                  <span style={{ fontWeight: 700, color: "#2563eb" }}>{myTrips.length} เรื่อง</span>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="dp-main">
            <div className="dp-card main-card">
              <div className="tab-bar">
                <div className="tabs">
                  {(["my-stories", "saved"] as const).map(id => (
                    <button key={id} className={`tab-btn${activeTab === id ? " active" : ""}`} onClick={() => setActiveTab(id)}>
                      {id === "my-stories" ? `เรื่องเล่าของฉัน (${myTrips.length})` : `บันทึกไว้ (${savedTrips.length})`}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                  <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
                  <p style={{ margin: 0 }}>กำลังโหลด...</p>
                </div>
              ) : stories.length > 0 ? (
                <>
                  <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 20px" }}>
                    พบ <strong style={{ color: "#1e293b" }}>{stories.length}</strong> รายการ
                  </p>
                  <div className="story-grid">
                    {stories.map(story => (
                      <StoryCard key={story.slug} story={story} isOwner={activeTab === "my-stories"} onDeleted={activeTab === "my-stories" ? handleTripDeleted : undefined} />
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>
                    {activeTab === "my-stories" ? "📭" : "🔖"}
                  </div>
                  <p style={{ color: "#94a3b8", fontSize: "15px", margin: "0 0 20px" }}>
                    {activeTab === "my-stories" ? "ยังไม่มีเรื่องเล่า · No stories yet" : "ยังไม่มีรายการที่บันทึกไว้ · Nothing saved"}
                  </p>
                  {activeTab === "my-stories" && (
                    <Link href="/trips/create" className="dp-write-btn" style={{ display: "inline-flex" }}>
                      <span className="dp-write-icon"><IconWrite /></span>
                      <span className="dp-write-text">
                        <strong>เขียนเรื่องแรก</strong>
                        <small>Start writing</small>
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

        .dp-page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 28px; }
        .dp-greeting { font-size: 28px; font-weight: 900; color: #0f172a; margin: 0 0 4px; }
        .dp-subheading { font-size: 14px; color: #64748b; margin: 0; }

        .dp-write-btn { display: inline-flex; align-items: center; gap: 12px; padding: 10px 20px 10px 10px; border-radius: "14px"; background: linear-gradient(135deg, #4facfe 0%, #43e97b 100%); color: #fff; text-decoration: none; border: none; cursor: pointer; box-shadow: 0 6px 18px rgba(79,172,254,0.30); font-family: inherit; border-radius: 14px; }
        .dp-write-icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.22); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .dp-write-text { display: flex; flex-direction: column; gap: 2px; text-align: left; line-height: 1; }
        .dp-write-text strong { font-size: 14px; font-weight: 900; color: #fff; display: block; }
        .dp-write-text small { font-size: 10px; font-weight: 400; color: rgba(255,255,255,0.82); display: block; }

        .dp-notices { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }

        .dp-grid { display: grid; grid-template-columns: 290px 1fr; gap: 28px; align-items: start; }
        .dp-sidebar { position: sticky; top: 100px; }

        .dp-card { background: white; border-radius: 24px; padding: 22px; border: 1px solid #f1f5f9; box-shadow: 0 2px 12px rgba(15,23,42,0.04); }
        .sb-title { font-size: 14px; font-weight: 900; color: #1e293b; margin: 0 0 14px; }
        .sb-title small { font-size: 11px; color: #94a3b8; font-weight: 400; margin-left: 5px; }

        .main-card { padding: 28px; }
        .tab-bar { border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 22px; }
        .tabs { display: flex; gap: 4px; }
        .tab-btn { padding: 9px 18px; border-radius: 10px; border: none; background: transparent; font-size: 13px; font-weight: 700; color: #94a3b8; cursor: pointer; transition: 0.2s; font-family: inherit; }
        .tab-btn.active { background: #eff6ff; color: #2563eb; }
        .tab-btn:hover:not(.active) { background: #f8fafc; color: #64748b; }

        .story-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }

        @media (max-width: 1100px) { .dp-grid { grid-template-columns: 1fr; } .dp-sidebar { position: static; } }
        @media (max-width: 640px) { .story-grid { grid-template-columns: 1fr; } .main-card { padding: 18px; } .dp-greeting { font-size: 22px; } }
      `}</style>
    </div>
  );
}

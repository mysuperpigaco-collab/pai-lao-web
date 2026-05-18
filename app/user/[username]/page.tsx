"use client";

import { useState } from "react";
import Link from "next/link";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import StoryCard from "@/components/dashboard/StoryCard";

/* ── Mock data ── */
const MY_STORIES = [
  { slug: "doi-inthanon", title: "หนีร้อนไปพึ่งเย็นที่ดอยอินทนนท์", createdAt: "2024-05-12", coverUrl: "https://picsum.photos/seed/story21/600/400", isPublished: true },
  { slug: "ari-cafe",     title: "คาเฟ่เปิดใหม่ย่านอารีย์ ห้ามพลาด!", createdAt: "2024-05-05", coverUrl: "https://picsum.photos/seed/story22/600/400", isPublished: false },
  { slug: "amphawa",      title: "เดินตลาดน้ำอัมพวา หาของกินเพลิน",  createdAt: "2024-04-28", coverUrl: "https://picsum.photos/seed/story23/600/400", isPublished: false },
];

const SAVED_STORIES = [
  { slug: "koh-samui", title: "ทริปเกาะสมุย 3 วัน 2 คืน งบไม่เกิน 5,000", createdAt: "2024-05-01", coverUrl: "https://picsum.photos/seed/story24/600/400", isPublished: true },
];

const NOTIFICATIONS = [
  { id: 1, icon: "✅", text: "เรื่องเล่า 'ดอยอินทนนท์' ได้รับการอนุมัติแล้ว",   time: "2 ชม. ที่แล้ว" },
  { id: 2, icon: "❤️", text: "สมหญิง และอีก 5 คน ถูกใจเรื่องเล่าของคุณ",        time: "5 ชม. ที่แล้ว" },
  { id: 3, icon: "💬", text: "มีความคิดเห็นใหม่ในเรื่อง 'ตลาดน้ำอัมพวา'",        time: "เมื่อวาน" },
];

/* ── Stat card (sidebar) ── */
function StatCard({ label, labelEn, value, color }: { label: string; labelEn: string; value: string | number; color?: string }) {
  return (
    <div className="stat-card">
      <strong style={{ color: color ?? "#0f172a" }}>{value}</strong>
      <span>{label}<small> {labelEn}</small></span>
      <style jsx>{`
        .stat-card {
          display: flex; flex-direction: column; align-items: center;
          gap: 4px; flex: 1; padding: 16px 12px;
          background: #f8fafc; border-radius: 16px;
        }
        strong { font-size: 24px; font-weight: 900; line-height: 1; }
        span { font-size: 12px; color: #64748b; text-align: center; }
        small { color: #94a3b8; font-size: 10px; }
      `}</style>
    </div>
  );
}

/* ── Interest tag ── */
function InterestTag({ label }: { label: string }) {
  return (
    <span className="itag">
      {label}
      <style jsx>{`
        .itag {
          display: inline-block; padding: 7px 14px; border-radius: 999px;
          background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe;
          font-size: 12px; font-weight: 600;
        }
      `}</style>
    </span>
  );
}

/* ── Main Page ── */
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"my-stories" | "saved">("my-stories");
  const stories = activeTab === "my-stories" ? MY_STORIES : SAVED_STORIES;

  return (
    <div className="dp-page">
      <div className="dp-container">

        {/* ── Profile Header ── */}
        <ProfileHeader isOwner={true} />

        {/* ── Grid ── */}
        <div className="dp-grid">

          {/* ── SIDEBAR ── */}
          <aside className="dp-sidebar">

            {/* Notifications */}
            <div className="dp-card">
              <div className="noti-hdr">
                <h3>การแจ้งเตือน <small>Notifications</small></h3>
                <span className="noti-badge">{NOTIFICATIONS.length}</span>
              </div>
              <div className="noti-list">
                {NOTIFICATIONS.map((n) => (
                  <div className="noti-item" key={n.id}>
                    <span className="noti-icon">{n.icon}</span>
                    <div>
                      <p>{n.text}</p>
                      <span>{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="dp-card">
              <h3 className="sb-title">สถิติคนเล่า <small>Statistics</small></h3>
              <div className="stats-row">
                <StatCard label="เรื่องเล่า" labelEn="Stories"  value={MY_STORIES.length} color="#2563eb" />
                <StatCard label="ถูกใจ"     labelEn="Likes"     value="1.2k"               color="#22a06b" />
                <StatCard label="ติดตาม"    labelEn="Following" value={142} />
              </div>
            </div>

            {/* Interests */}
            <div className="dp-card">
              <h3 className="sb-title">สิ่งที่สนใจ <small>Interests</small></h3>
              <div className="int-wrap">
                {["☕ Café", "⛰️ Trekking", "📸 Photo", "🍲 Foodie", "🌊 Sea & Island"].map((t) => (
                  <InterestTag key={t} label={t} />
                ))}
              </div>
            </div>

          </aside>

          {/* ── MAIN CONTENT ── */}
          <main className="dp-main">
            <div className="dp-card main-card">

              {/* Tab bar */}
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
                <Link href="/trips/create" className="btn-new">
                  + เขียนเรื่องใหม่
                </Link>
              </div>

              {/* Info row */}
              <p className="info-row">
                พบ <strong>{stories.length}</strong> รายการ
              </p>

              {/* Story grid */}
              {stories.length > 0 ? (
                <div className="story-grid">
                  {stories.map((story) => (
                    <StoryCard key={story.slug} story={story} isOwner={true} />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span>📭</span>
                  <p>ยังไม่มีเรื่องเล่า · No stories yet</p>
                  <Link href="/trips/create" className="btn-new inline">+ เขียนเรื่องแรก</Link>
                </div>
              )}

            </div>
          </main>

        </div>
      </div>

      <style jsx>{`
        /* ── Page ── */
        .dp-page {
          min-height: 100vh;
          background: #f8fafc;
          padding: 36px 0 80px;
        }
        .dp-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* ── Grid ── */
        .dp-grid {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 28px;
          align-items: start;
        }

        /* ── Card base ── */
        .dp-card {
          background: white;
          border-radius: 28px;
          padding: 28px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 2px 12px rgba(15,23,42,0.04);
          margin-bottom: 20px;
        }
        .dp-card:last-child { margin-bottom: 0; }

        /* ── Sidebar ── */
        .dp-sidebar { position: sticky; top: 100px; }

        /* Notifications */
        .noti-hdr {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 20px;
        }
        .noti-hdr h3 {
          font-size: 15px; font-weight: 900; color: #1e293b; margin: 0;
        }
        .noti-hdr small { font-size: 11px; color: #94a3b8; font-weight: 400; margin-left: 5px; }
        .noti-badge {
          background: #ef4444; color: white;
          font-size: 10px; font-weight: 800;
          padding: 2px 8px; border-radius: 999px;
        }
        .noti-list { display: flex; flex-direction: column; gap: 14px; }
        .noti-item { display: flex; gap: 12px; font-size: 13px; }
        .noti-icon { font-size: 18px; flex-shrink: 0; margin-top: 2px; }
        .noti-item p { margin: 0; color: #475569; line-height: 1.5; }
        .noti-item span { font-size: 11px; color: #94a3b8; }

        /* Sidebar titles */
        .sb-title {
          font-size: 15px; font-weight: 900; color: #1e293b;
          margin: 0 0 18px;
        }
        .sb-title small { font-size: 11px; color: #94a3b8; font-weight: 400; margin-left: 5px; }

        /* Stats */
        .stats-row { display: flex; gap: 10px; }

        /* Interests */
        .int-wrap { display: flex; flex-wrap: wrap; gap: 8px; }

        /* ── Main ── */
        .main-card { padding: 32px; }

        /* Tab bar */
        .tab-bar {
          display: flex; justify-content: space-between;
          align-items: center; flex-wrap: wrap; gap: 12px;
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 16px; margin-bottom: 22px;
        }
        .tabs { display: flex; gap: 4px; }
        .tab-btn {
          padding: 10px 18px; border-radius: 10px;
          border: none; background: transparent;
          font-size: 14px; font-weight: 700;
          color: #94a3b8; cursor: pointer; transition: 0.2s;
        }
        .tab-btn.active {
          background: #eff6ff; color: #2563eb;
        }
        .tab-btn:hover:not(.active) { background: #f8fafc; color: #64748b; }

        /* New story button */
        .btn-new {
          display: inline-flex; align-items: center;
          padding: 10px 20px; border-radius: 12px;
          background: linear-gradient(to right, #4facfe, #43e97b);
          color: white; font-size: 13px; font-weight: 800;
          text-decoration: none; border: none; cursor: pointer;
          box-shadow: 0 6px 16px rgba(79,172,254,0.25);
          transition: 0.2s;
        }
        .btn-new:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(79,172,254,0.3); }
        .btn-new.inline { margin-top: 16px; }

        /* Info row */
        .info-row { font-size: 13px; color: #94a3b8; margin: 0 0 22px; }
        .info-row strong { color: #1e293b; }

        /* Story grid 2 col */
        .story-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 22px;
        }

        /* Empty state */
        .empty-state {
          text-align: center; padding: 60px 20px;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .empty-state span { font-size: 48px; }
        .empty-state p { color: #94a3b8; font-size: 15px; }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .dp-grid { grid-template-columns: 1fr; }
          .dp-sidebar { position: static; }
        }
        @media (max-width: 640px) {
          .story-grid { grid-template-columns: 1fr; }
          .main-card  { padding: 20px; }
          .tab-btn    { font-size: 12px; padding: 8px 12px; }
        }
      `}</style>
    </div>
  );
}

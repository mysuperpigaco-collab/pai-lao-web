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
  avgRating?: number | null;
  _count?: { reviews: number; bookmarks: number; likes: number };
};

type TripOwnerNotif = {
  id: string;
  text: string;
  rating?: number | null;
  createdAt: string;
  trip: { slug: string; title: string };
  author: { displayName?: string | null; firstName: string; avatarUrl?: string | null };
  replies: { id: string }[];
};

type BookmarkItem = {
  trip?:  { slug: string; title: string; coverUrl: string | null; createdAt: string } | null;
  place?: { slug: string; title: string; coverUrl: string | null; createdAt: string } | null;
};

type Notice = { id: string; type: "info" | "tip" | "success" | "warning"; icon: string; title: string; body: string; action?: { label: string; href: string } };

type ReplyNotif = {
  id: string;
  text: string;
  place?: { slug: string; title: string } | null;
  trip?:  { slug: string; title: string } | null;
  replies: { id: string; text: string; createdAt: string; author: { displayName?: string | null; firstName: string; role?: string } }[];
};

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
  const [activeTab, setActiveTab]   = useState<"my-stories" | "saved" | "saved-places">("my-stories");
  const [myTrips, setMyTrips]       = useState<TripItem[]>([]);
  const [bookmarks, setBookmarks]   = useState<BookmarkItem[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingBm, setLoadingBm]   = useState(false);
  const [dismissed, setDismissed]   = useState<Set<string>>(new Set());
  const [replyNotifs, setReplyNotifs]   = useState<ReplyNotif[]>([]);
  const [tripReviews, setTripReviews]   = useState<TripOwnerNotif[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  useEffect(() => {
    setLoadingTrips(true);
    fetch("/api/trips?mine=1&limit=50")
      .then(r => r.json())
      .then(d => { setMyTrips(d.trips ?? []); setLoadingTrips(false); })
      .catch(() => setLoadingTrips(false));
  }, []);

  useEffect(() => {
    fetch("/api/reviews/notifications")
      .then(r => r.json())
      .then(d => { setReplyNotifs(d.reviews ?? []); setTripReviews(d.tripReviews ?? []); setLoadingNotifs(false); })
      .catch(() => setLoadingNotifs(false));
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

  const savedTrips   = bookmarks.filter(b => b.trip).map(b => b.trip!);
  const savedPlaces  = bookmarks.filter(b => b.place).map(b => b.place!);
  const isLoading    = activeTab === "my-stories" ? loadingTrips : loadingBm;
  const stories      = activeTab === "my-stories" ? myTrips : savedTrips;

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
          <Link href="/trips/create" style={{
            display: "inline-flex", alignItems: "center", gap: "10px",
            padding: "11px 22px 11px 12px", borderRadius: "14px",
            background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
            color: "#fff", textDecoration: "none",
            boxShadow: "0 6px 18px rgba(16,185,129,0.30)",
            flexShrink: 0,
          }}>
            <span style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <IconWrite />
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: "1px", lineHeight: 1 }}>
              <strong style={{ fontSize: "14px", fontWeight: 900, color: "#fff" }}>เขียนเรื่องใหม่</strong>
              <small style={{ fontSize: "10px", fontWeight: 400, color: "rgba(255,255,255,0.85)" }}>แชร์ประสบการณ์</small>
            </span>
          </Link>
        </div>

        {/* ─── Notification boxes ─── */}
        {visibleNotices.length > 0 && (
          <div className="dp-notices">
            {visibleNotices.map(n => <NoticeCard key={n.id} n={n} onDismiss={dismiss} />)}
          </div>
        )}

        {/* ─── Notifications (reply + trip-owner) ─── */}
        {!loadingNotifs && (replyNotifs.length > 0 || tripReviews.length > 0) && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              🔔 การแจ้งเตือน · Notifications
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: "#e11d48", padding: "2px 8px", borderRadius: 999 }}>{replyNotifs.length + tripReviews.length}</span>
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tripReviews.map(notif => {
                const reviewerName = notif.author.displayName || notif.author.firstName || "ผู้ใช้";
                const alreadyReplied = notif.replies.length > 0;
                const stars = notif.rating ? "⭐".repeat(Math.round(notif.rating)) : "";
                return (
                  <div key={notif.id} style={{ background: "#fff", border: "1.5px solid #fde68a", borderRadius: 16, padding: "14px 18px", display: "flex", gap: 14, alignItems: "flex-start", boxShadow: "0 2px 8px rgba(245,158,11,0.07)" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>✍️</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: "0 0 2px" }}>{reviewerName} รีวิวเรื่องของคุณ {stars}</p>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 4px" }}>📖 {notif.trip.title}</p>
                      <p style={{ fontSize: 12, color: "#374151", margin: "0 0 8px", fontStyle: "italic", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>
                        &ldquo;{notif.text}&rdquo;
                      </p>
                      <Link href={`/trips/${notif.trip.slug}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: alreadyReplied ? "#64748b" : "#2563eb", textDecoration: "none", background: alreadyReplied ? "#f8fafc" : "#eff6ff", padding: "5px 12px", borderRadius: 999, border: `1px solid ${alreadyReplied ? "#e2e8f0" : "#bfdbfe"}` }}>
                        {alreadyReplied ? "✓ ตอบแล้ว" : "💬 ตอบกลับ"} →
                      </Link>
                    </div>
                  </div>
                );
              })}
              {replyNotifs.map(notif => {
                const dest = notif.place ? `/place/${notif.place.slug}` : notif.trip ? `/trips/${notif.trip.slug}` : "#";
                const destTitle = notif.place?.title ?? notif.trip?.title ?? "สถานที่";
                const latestReply = notif.replies[0];
                const replierName = latestReply?.author.displayName || latestReply?.author.firstName || "ผู้ใช้";
                const isOwnerReply = latestReply?.author.role === "BUSINESS";
                return (
                  <Link key={notif.id} href={dest} style={{ textDecoration: "none" }}>
                    <div style={{ background: "#fff", border: "1.5px solid #e0f2fe", borderRadius: 16, padding: "14px 18px", display: "flex", gap: 14, alignItems: "flex-start", boxShadow: "0 2px 8px rgba(14,165,233,0.06)" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: isOwnerReply ? "#dcfce7" : "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                        {isOwnerReply ? "🏢" : "💬"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: "0 0 2px" }}>{replierName} {isOwnerReply ? "(เจ้าของ) " : ""}ตอบกลับรีวิวของคุณ</p>
                        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 4px" }}>📍 {destTitle}</p>
                        <p style={{ fontSize: 12, color: "#374151", margin: 0, fontStyle: "italic", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>&ldquo;{latestReply?.text}&rdquo;</p>
                      </div>
                      <span style={{ fontSize: 16, color: "#94a3b8" }}>→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
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
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{savedTrips.length + savedPlaces.length} รายการ</span>
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
                  {([
                    ["my-stories", `✍️ เรื่องเล่าของฉัน (${myTrips.length})`],
                    ["saved",        `🗺️ ทริปที่บันทึก (${savedTrips.length})`],
                    ["saved-places", `📍 สถานที่บันทึก (${savedPlaces.length})`],
                  ] as [string, string][]).map(([id, label]) => (
                    <button key={id} className={`tab-btn${activeTab === id ? " active" : ""}`} onClick={() => setActiveTab(id as any)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Tab: saved places ── */}
              {activeTab === "saved-places" ? (
                isLoading ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                    <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
                    <p style={{ margin: 0 }}>กำลังโหลด...</p>
                  </div>
                ) : savedPlaces.length > 0 ? (
                  <>
                    <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 20px" }}>
                      บันทึกสถานที่ไว้ <strong style={{ color: "#1e293b" }}>{savedPlaces.length}</strong> แห่ง
                    </p>
                    <div className="story-grid">
                      {savedPlaces.map((p: any) => (
                        <Link key={p.slug} href={`/place/${p.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 2px 10px rgba(15,23,42,0.05)", transition: "transform 0.2s, box-shadow 0.2s" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(15,23,42,0.1)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 10px rgba(15,23,42,0.05)"; }}
                          >
                            <div style={{ height: 140, overflow: "hidden", background: "#e2e8f0", position: "relative" }}>
                              {p.coverUrl
                                ? <img src={p.coverUrl} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>📍</div>
                              }
                              <span style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(15,23,42,0.65)", backdropFilter: "blur(6px)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999 }}>
                                {p.category}
                              </span>
                            </div>
                            <div style={{ padding: "12px 14px" }}>
                              <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
                              <div style={{ fontSize: 11, color: "#94a3b8" }}>📍 สถานที่บันทึก</div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>📍</div>
                    <p style={{ color: "#94a3b8", fontSize: "15px", margin: "0 0 20px" }}>ยังไม่มีสถานที่ที่บันทึกไว้</p>
                    <Link href="/place" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, background: "linear-gradient(135deg,#10b981,#06b6d4)", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
                      🗺️ ค้นหาสถานที่
                    </Link>
                  </div>
                )
              ) : isLoading ? (
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
                      <div key={story.slug}>
                        <StoryCard story={story} isOwner={activeTab === "my-stories"} onDeleted={activeTab === "my-stories" ? handleTripDeleted : undefined} />
                        {activeTab === "my-stories" && (story as TripItem)._count && (
                          <div style={{ display: "flex", gap: 8, padding: "6px 4px 2px", flexWrap: "wrap" }}>
                            {((story as TripItem)._count?.likes ?? 0) > 0 && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#e11d48", background: "#fff1f2", padding: "3px 8px", borderRadius: 999, border: "1px solid #fecdd3" }}>❤️ {(story as TripItem)._count!.likes} ไลค์</span>
                            )}
                            {((story as TripItem)._count?.reviews ?? 0) > 0 && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "3px 8px", borderRadius: 999, border: "1px solid #bfdbfe" }}>💬 {(story as TripItem)._count!.reviews} รีวิว</span>
                            )}
                            {(story as TripItem).avgRating != null && (story as TripItem).avgRating! > 0 && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#d97706", background: "#fffbeb", padding: "3px 8px", borderRadius: 999, border: "1px solid #fde68a" }}>⭐ {(story as TripItem).avgRating!.toFixed(1)}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>
                    {activeTab === "my-stories" ? "📭" : "🔖"}
                  </div>
                  <p style={{ color: "#94a3b8", fontSize: "15px", margin: "0 0 20px" }}>
                    {activeTab === "my-stories" ? "ยังไม่มีเรื่องเล่า · No stories yet" : "ยังไม่มีทริปที่บันทึกไว้"}
                  </p>
                  {activeTab === "my-stories" && (
                    <Link href="/trips/create" style={{
                      display: "inline-flex", alignItems: "center", gap: "10px",
                      padding: "11px 22px 11px 12px", borderRadius: "14px",
                      background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
                      color: "#fff", textDecoration: "none",
                      boxShadow: "0 6px 18px rgba(16,185,129,0.30)",
                    }}>
                      <span style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <IconWrite />
                      </span>
                      <span style={{ display: "flex", flexDirection: "column", gap: "1px", lineHeight: 1 }}>
                        <strong style={{ fontSize: "14px", fontWeight: 900, color: "#fff" }}>เขียนเรื่องแรก</strong>
                        <small style={{ fontSize: "10px", color: "rgba(255,255,255,0.85)" }}>Start writing</small>
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

        .dp-write-btn { display: inline-flex; align-items: center; gap: 12px; padding: 10px 20px 10px 10px; border-radius: 14px; background: linear-gradient(135deg, #4facfe 0%, #43e97b 100%); color: #fff; text-decoration: none; border: none; cursor: pointer; box-shadow: 0 6px 18px rgba(79,172,254,0.30); font-family: inherit; }
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

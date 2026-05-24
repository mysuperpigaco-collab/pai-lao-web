"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface PublicUser {
  id: string; username: string; displayName?: string; firstName: string;
  avatarUrl?: string; coverUrl?: string; bio?: string; role: string;
  email?: string; phone?: string; lineId?: string; facebook?: string;
  instagram?: string; tiktok?: string; birthDate?: string;
  createdAt?: string; isPrivate?: boolean;
  _count?: { followers: number; following: number; trips: number };
}
interface TripCard {
  id: string; slug: string; title: string; coverUrl: string;
  mood: string; location?: string; createdAt: string;
  _count: { likes: number; bookmarks: number };
}
interface FollowUser {
  id: string; username: string; displayName?: string; firstName: string;
  avatarUrl?: string; role: string;
}
interface ReviewItem {
  id: string; rating: number; text: string; createdAt: string;
  isAnonymous: boolean; isHidden: boolean; likes: number;
  trip?: { slug: string; title: string; coverUrl: string } | null;
  place?: { slug: string; title: string; coverUrl: string } | null;
}

// ── Followers / Following Modal ──────────────────────────────
function UserListModal({ title, users, onClose }: { title: string; users: FollowUser[]; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 420, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "10px 12px" }}>
          {users.length === 0 ? (
            <p style={{ textAlign: "center", color: "#94a3b8", padding: "24px 0", fontSize: 14 }}>ยังไม่มีรายชื่อ</p>
          ) : users.map(u => {
            const name = u.displayName || u.firstName;
            const initial = name.charAt(0).toUpperCase();
            return (
              <Link key={u.id} href={`/user/${u.username}`} onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderRadius: 12, textDecoration: "none", color: "inherit", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f8fafc"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                {u.avatarUrl
                  ? <img src={u.avatarUrl} alt={name} style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  : <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>{initial}</div>
                }
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{name}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>@{u.username}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Stars ────────────────────────────────────────────────────
function Stars({ n }: { n: number }) {
  return <span style={{ color: "#f59e0b", letterSpacing: 1 }}>{"★".repeat(n)}{"☆".repeat(5 - n)}</span>;
}

export default function UserProfilePage() {
  const { user: me } = useAuth();
  const params = useParams();
  const username = params?.username as string;

  const [user, setUser]       = useState<PublicUser | null>(null);
  const [trips, setTrips]     = useState<TripCard[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsOwn, setReviewsOwn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"trips" | "reviews">("trips");

  // Followers / following modal
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);
  const [followUsers, setFollowUsers] = useState<FollowUser[]>([]);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetch(`/api/users/${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then(data => {
        if (!data.user) { setNotFound(true); setLoading(false); return; }
        setUser(data.user);
        setTrips(data.trips ?? []);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [username]);

  // Load reviews when tab switches to "reviews"
  useEffect(() => {
    if (activeTab !== "reviews" || !username) return;
    fetch(`/api/users/${encodeURIComponent(username)}/reviews`)
      .then(r => r.json())
      .then(data => { setReviews(data.reviews ?? []); setReviewsOwn(data.isOwn ?? false); })
      .catch(() => {});
  }, [activeTab, username]);

  const openFollowModal = async (type: "followers" | "following") => {
    setFollowModal(type);
    setFollowLoading(true);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}/followers?type=${type}`);
      const data = await res.json();
      setFollowUsers(data.users ?? []);
    } catch {}
    setFollowLoading(false);
  };

  const toggleReviewHidden = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/hide`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, isHidden: data.isHidden } : r));
      }
    } catch {}
  };

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 16 }}>
      ⏳ กำลังโหลด...
    </div>
  );
  if (notFound || !user) return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
      <div style={{ fontSize: 48 }}>🔍</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>ไม่พบผู้ใช้นี้</h2>
      <p style={{ color: "#64748b" }}>@{username} ไม่มีในระบบ</p>
      <Link href="/" style={{ color: "#10b981", fontWeight: 700 }}>← กลับหน้าแรก</Link>
    </div>
  );

  const displayName = user.displayName || user.firstName;
  const initial = displayName.charAt(0).toUpperCase();
  const joinYear = user.createdAt ? new Date(user.createdAt).getFullYear() : "";
  const isOwnProfile = me?.username === user.username;

  return (
    <div className="up-page">
      {/* Follow modal */}
      {followModal && (
        <UserListModal
          title={followModal === "followers" ? `ผู้ติดตาม · Followers (${user._count?.followers ?? 0})` : `กำลังติดตาม · Following (${user._count?.following ?? 0})`}
          users={followLoading ? [] : followUsers}
          onClose={() => { setFollowModal(null); setFollowUsers([]); }}
        />
      )}

      {/* Cover */}
      <div className="up-cover">
        {user.coverUrl
          ? <img src={user.coverUrl} alt="cover" className="up-cover-img" />
          : <div className="up-cover-placeholder" />
        }
      </div>

      <div className="up-body">
        {/* Avatar + Name row */}
        <div className="up-avatar-row">
          <div className="up-avatar-wrap">
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt={displayName} className="up-avatar" />
              : <div className="up-avatar-circle">{initial}</div>
            }
          </div>
          <div className="up-name-col">
            <h1 className="up-displayname">{displayName}</h1>
            <span className="up-username">@{user.username}</span>
            {joinYear && <span className="up-since">สมาชิกตั้งแต่ {joinYear}</span>}
          </div>
          {isOwnProfile && (
            <Link href="/dashboard/edit-profile" style={{ marginLeft: "auto", marginBottom: 6, padding: "8px 16px", borderRadius: 12, background: "#f1f5f9", border: "1.5px solid #e2e8f0", color: "#475569", fontWeight: 700, fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              ✏️ แก้ไขโปรไฟล์
            </Link>
          )}
        </div>

        {user.isPrivate ? (
          <div className="up-private-box">
            <div style={{ fontSize: 36 }}>🔒</div>
            <h3>โปรไฟล์ส่วนตัว</h3>
            <p>ผู้ใช้นี้ตั้งค่าโปรไฟล์เป็นส่วนตัว · This profile is private</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            {user._count && (
              <div className="up-stats">
                <div className="up-stat">
                  <strong>{user._count.trips}</strong>
                  <span>ทริป · Trips</span>
                </div>
                <button className="up-stat up-stat-btn" onClick={() => openFollowModal("followers")}>
                  <strong>{user._count.followers}</strong>
                  <span>ผู้ติดตาม · Followers</span>
                </button>
                <button className="up-stat up-stat-btn" onClick={() => openFollowModal("following")}>
                  <strong>{user._count.following}</strong>
                  <span>กำลังติดตาม · Following</span>
                </button>
              </div>
            )}

            {user.bio && <p className="up-bio">{user.bio}</p>}

            {/* Contact info */}
            <div className="up-contact">
              {user.email     && <a href={`mailto:${user.email}`} className="up-contact-item">📧 {user.email}</a>}
              {user.phone     && <span className="up-contact-item">📞 {user.phone}</span>}
              {user.lineId    && <span className="up-contact-item">💬 LINE: {user.lineId}</span>}
              {user.facebook  && <a href={user.facebook.startsWith("http") ? user.facebook : `https://facebook.com/${user.facebook}`} target="_blank" rel="noopener" className="up-contact-item">📘 {user.facebook}</a>}
              {user.instagram && <a href={`https://instagram.com/${user.instagram.replace("@","")}`} target="_blank" rel="noopener" className="up-contact-item">📸 {user.instagram}</a>}
              {user.tiktok    && <a href={`https://tiktok.com/@${user.tiktok.replace("@","")}`} target="_blank" rel="noopener" className="up-contact-item">🎵 {user.tiktok}</a>}
            </div>

            {/* Tab bar */}
            <div className="up-tab-bar">
              <button className={`up-tab${activeTab === "trips" ? " active" : ""}`} onClick={() => setActiveTab("trips")}>
                ✈️ ทริป <span className="up-tab-count">{trips.length}</span>
              </button>
              <button className={`up-tab${activeTab === "reviews" ? " active" : ""}`} onClick={() => setActiveTab("reviews")}>
                💬 รีวิวที่เขียน
              </button>
            </div>

            {/* ── Trips tab ── */}
            {activeTab === "trips" && (
              trips.length > 0 ? (
                <div className="up-trips-grid">
                  {trips.map(t => (
                    <Link key={t.id} href={`/trips/${t.slug}`} className="up-trip-card">
                      <div className="up-trip-img-wrap">
                        <img src={t.coverUrl} alt={t.title} className="up-trip-img" />
                        <span className="up-trip-mood">{t.mood}</span>
                      </div>
                      <div className="up-trip-info">
                        <h3>{t.title}</h3>
                        {t.location && <p>📍 {t.location}</p>}
                        <div className="up-trip-meta">
                          <span>❤️ {t._count.likes}</span>
                          <span>🔖 {t._count.bookmarks}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>✈️</div>
                  <p style={{ fontSize: 15 }}>ยังไม่มีทริป</p>
                </div>
              )
            )}

            {/* ── Reviews tab ── */}
            {activeTab === "reviews" && (
              <div>
                {reviewsOwn && (
                  <div style={{ fontSize: 12, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", marginBottom: 16 }}>
                    💡 กด <strong>ซ่อน/แสดง</strong> เพื่อควบคุมว่าคนอื่นจะเห็นรีวิวนี้ในโปรไฟล์ของคุณหรือไม่
                  </div>
                )}
                {reviews.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
                    <p style={{ fontSize: 15 }}>ยังไม่มีรีวิว</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {reviews.map(rv => {
                      const dest = rv.trip ? `/trips/${rv.trip.slug}` : rv.place ? `/place/${rv.place.slug}` : "#";
                      const destTitle = rv.trip?.title ?? rv.place?.title ?? "เนื้อหา";
                      const coverUrl = rv.trip?.coverUrl ?? rv.place?.coverUrl ?? null;
                      return (
                        <div key={rv.id} style={{ background: rv.isHidden ? "#f8fafc" : "white", border: `1.5px solid ${rv.isHidden ? "#e2e8f0" : "#f1f5f9"}`, borderRadius: 16, overflow: "hidden", opacity: rv.isHidden ? 0.6 : 1, transition: "all 0.2s" }}>
                          <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
                            {coverUrl && (
                              <div style={{ width: 80, flexShrink: 0, overflow: "hidden" }}>
                                <img src={coverUrl} alt={destTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            )}
                            <div style={{ flex: 1, padding: "12px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                                <Link href={dest} style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", textDecoration: "none" }}>{destTitle}</Link>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                  {rv.isHidden && <span style={{ fontSize: 10, fontWeight: 800, background: "#fef2f2", color: "#b91c1c", padding: "2px 8px", borderRadius: 999 }}>ซ่อนอยู่</span>}
                                  {reviewsOwn && (
                                    <button onClick={() => toggleReviewHidden(rv.id)} style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, border: `1px solid ${rv.isHidden ? "#bbf7d0" : "#fecaca"}`, background: rv.isHidden ? "#f0fdf4" : "#fff5f5", color: rv.isHidden ? "#15803d" : "#b91c1c", cursor: "pointer", fontFamily: "inherit" }}>
                                      {rv.isHidden ? "👁️ แสดง" : "🙈 ซ่อน"}
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div style={{ marginBottom: 4 }}><Stars n={rv.rating} /></div>
                              {!rv.isAnonymous && rv.text && (
                                <p style={{ fontSize: 13, color: "#374151", margin: "0 0 4px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>
                                  {rv.text}
                                </p>
                              )}
                              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                                {rv.isAnonymous && <span style={{ marginRight: 8 }}>👤 ไม่ระบุชื่อ</span>}
                                {new Date(rv.createdAt).toLocaleDateString("th-TH")}
                                {rv.likes > 0 && <span style={{ marginLeft: 8 }}>❤️ {rv.likes}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .up-page { min-height: 100vh; background: #f8fafc; padding-bottom: 60px; }
        .up-cover { width: 100%; height: 200px; position: relative; background: linear-gradient(135deg, #10b981, #06b6d4); overflow: hidden; }
        .up-cover-img { width: 100%; height: 100%; object-fit: cover; }
        .up-cover-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%); }
        .up-body { max-width: 860px; margin: 0 auto; padding: 0 20px; }
        .up-avatar-row { display: flex; align-items: flex-end; gap: 16px; margin-top: -44px; margin-bottom: 20px; flex-wrap: wrap; }
        .up-avatar-wrap { flex-shrink: 0; }
        .up-avatar, .up-avatar-circle { width: 96px; height: 96px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
        .up-avatar { object-fit: cover; display: block; }
        .up-avatar-circle { background: linear-gradient(135deg, #10b981, #3b82f6); display: flex; align-items: center; justify-content: center; color: white; font-size: 34px; font-weight: 900; }
        .up-name-col { padding-bottom: 8px; flex: 1; min-width: 0; }
        .up-displayname { font-size: 24px; font-weight: 900; color: #0f172a; margin: 0 0 2px; }
        .up-username { font-size: 14px; color: #64748b; font-weight: 600; display: block; }
        .up-since { font-size: 12px; color: #94a3b8; display: block; margin-top: 2px; }

        .up-stats { display: flex; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin-bottom: 20px; background: white; }
        .up-stat { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 16px; border-right: 1px solid #e2e8f0; }
        .up-stat:last-child { border-right: none; }
        .up-stat strong { font-size: 22px; font-weight: 900; color: #0f172a; }
        .up-stat span { font-size: 12px; color: #64748b; margin-top: 2px; text-align: center; }
        .up-stat-btn { background: none; border: none; cursor: pointer; font-family: inherit; transition: background 0.15s; }
        .up-stat-btn:hover { background: #f0fdf4; }
        .up-stat-btn:hover strong { color: #10b981; }

        .up-bio { font-size: 15px; color: #334155; line-height: 1.7; margin-bottom: 16px; padding: 14px 16px; background: #f1f5f9; border-radius: 12px; }
        .up-contact { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 24px; }
        .up-contact-item { display: flex; align-items: center; gap: 6px; padding: 7px 13px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 999px; font-size: 13px; color: #334155; font-weight: 600; text-decoration: none; }
        .up-contact-item:hover { background: #f0fdf4; border-color: #a7f3d0; }

        .up-tab-bar { display: flex; gap: 4px; border-bottom: 2px solid #f1f5f9; margin-bottom: 20px; }
        .up-tab { padding: 9px 18px; border-radius: 10px 10px 0 0; border: none; background: transparent; font-size: 13px; font-weight: 700; color: #94a3b8; cursor: pointer; font-family: inherit; transition: 0.15s; display: flex; align-items: center; gap: 6px; }
        .up-tab.active { color: #2563eb; border-bottom: 2px solid #2563eb; background: #eff6ff; }
        .up-tab:hover:not(.active) { background: #f8fafc; color: #64748b; }
        .up-tab-count { font-size: 11px; background: #e2e8f0; color: #475569; padding: 1px 7px; border-radius: 999px; font-weight: 800; }

        .up-private-box { text-align: center; padding: 60px 20px; background: white; border-radius: 20px; border: 1px solid #e2e8f0; margin: 24px 0; }
        .up-private-box h3 { font-size: 20px; font-weight: 800; color: #1e293b; margin: 12px 0 6px; }
        .up-private-box p { color: #64748b; font-size: 14px; }

        .up-trips-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
        .up-trip-card { text-decoration: none; color: #1e293b; background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; transition: box-shadow 0.2s, transform 0.2s; display: block; }
        .up-trip-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.1); transform: translateY(-2px); }
        .up-trip-img-wrap { position: relative; height: 160px; overflow: hidden; }
        .up-trip-img { width: 100%; height: 100%; object-fit: cover; }
        .up-trip-mood { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.55); color: white; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
        .up-trip-info { padding: 12px 14px; }
        .up-trip-info h3 { font-size: 14px; font-weight: 700; color: #1e293b; margin: 0 0 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-decoration: none; }
        .up-trip-info p { font-size: 12px; color: #64748b; margin: 0 0 8px; text-decoration: none; }
        .up-trip-meta { display: flex; gap: 12px; font-size: 12px; color: #94a3b8; font-weight: 600; }
        .up-trip-meta span { color: #94a3b8; }

        @media (max-width: 640px) {
          .up-cover { height: 150px; }
          .up-avatar-row { margin-top: -36px; gap: 12px; }
          .up-avatar, .up-avatar-circle { width: 72px; height: 72px; font-size: 28px; }
          .up-displayname { font-size: 18px; }
          .up-trips-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}

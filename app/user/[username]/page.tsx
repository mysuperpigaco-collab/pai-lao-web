"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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

export default function UserProfilePage() {
  const params = useParams();
  const username = params?.username as string;
  const [user, setUser] = useState<PublicUser | null>(null);
  const [trips, setTrips] = useState<TripCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
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

  return (
    <div className="up-page">
      {/* Cover */}
      <div className="up-cover">
        {user.coverUrl
          ? <img src={user.coverUrl} alt="cover" className="up-cover-img" />
          : <div className="up-cover-placeholder" />
        }
      </div>

      <div className="up-body">
        {/* Avatar + Name */}
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
        </div>

        {user.isPrivate ? (
          <div className="up-private-box">
            <div style={{ fontSize: 36 }}>🔒</div>
            <h3>โปรไฟล์ส่วนตัว</h3>
            <p>ผู้ใช้นี้ตั้งค่าโปรไฟล์เป็นส่วนตัว · This profile is private</p>
          </div>
        ) : (
          <>
            {user._count && (
              <div className="up-stats">
                <div className="up-stat"><strong>{user._count.trips}</strong><span>ทริป · Trips</span></div>
                <div className="up-stat"><strong>{user._count.followers}</strong><span>ผู้ติดตาม · Followers</span></div>
                <div className="up-stat"><strong>{user._count.following}</strong><span>กำลังติดตาม · Following</span></div>
              </div>
            )}

            {user.bio && <p className="up-bio">{user.bio}</p>}

            <div className="up-contact">
              {user.email     && <a href={`mailto:${user.email}`} className="up-contact-item">📧 {user.email}</a>}
              {user.phone     && <span className="up-contact-item">📞 {user.phone}</span>}
              {user.lineId    && <span className="up-contact-item">💬 LINE: {user.lineId}</span>}
              {user.facebook  && <a href={user.facebook.startsWith("http") ? user.facebook : `https://facebook.com/${user.facebook}`} target="_blank" rel="noopener" className="up-contact-item">📘 {user.facebook}</a>}
              {user.instagram && <a href={`https://instagram.com/${user.instagram.replace("@","")}`} target="_blank" rel="noopener" className="up-contact-item">📸 {user.instagram}</a>}
              {user.tiktok    && <a href={`https://tiktok.com/@${user.tiktok.replace("@","")}`} target="_blank" rel="noopener" className="up-contact-item">🎵 {user.tiktok}</a>}
            </div>

            {trips.length > 0 && (
              <div className="up-trips-section">
                <h2 className="up-section-title">✈️ ทริปของ {displayName} <span>Stories</span></h2>
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
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .up-page { min-height: 100vh; background: #f8fafc; padding-bottom: 60px; }
        .up-cover { width: 100%; height: 260px; position: relative; background: linear-gradient(135deg, #10b981, #06b6d4); overflow: hidden; }
        .up-cover-img { width: 100%; height: 100%; object-fit: cover; }
        .up-cover-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%); }
        .up-body { max-width: 860px; margin: 0 auto; padding: 0 20px; }
        .up-avatar-row { display: flex; align-items: flex-end; gap: 20px; margin-top: -52px; margin-bottom: 20px; }
        .up-avatar-wrap { flex-shrink: 0; }
        .up-avatar, .up-avatar-circle { width: 100px; height: 100px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
        .up-avatar { object-fit: cover; }
        .up-avatar-circle { background: linear-gradient(135deg, #10b981, #3b82f6); display: flex; align-items: center; justify-content: center; color: white; font-size: 36px; font-weight: 900; }
        .up-name-col { padding-bottom: 6px; }
        .up-displayname { font-size: 24px; font-weight: 900; color: #0f172a; margin: 0 0 2px; }
        .up-username { font-size: 14px; color: #64748b; font-weight: 600; display: block; }
        .up-since { font-size: 12px; color: #94a3b8; display: block; margin-top: 2px; }
        .up-stats { display: flex; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin-bottom: 20px; }
        .up-stat { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 16px; border-right: 1px solid #e2e8f0; }
        .up-stat:last-child { border-right: none; }
        .up-stat strong { font-size: 22px; font-weight: 900; color: #0f172a; }
        .up-stat span { font-size: 12px; color: #64748b; margin-top: 2px; text-align: center; }
        .up-bio { font-size: 15px; color: #334155; line-height: 1.7; margin-bottom: 16px; padding: 14px 16px; background: #f1f5f9; border-radius: 12px; }
        .up-contact { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 28px; }
        .up-contact-item { display: flex; align-items: center; gap: 6px; padding: 7px 13px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 999px; font-size: 13px; color: #334155; font-weight: 600; text-decoration: none; }
        .up-contact-item:hover { background: #f0fdf4; border-color: #a7f3d0; }
        .up-private-box { text-align: center; padding: 60px 20px; background: white; border-radius: 20px; border: 1px solid #e2e8f0; margin: 24px 0; }
        .up-private-box h3 { font-size: 20px; font-weight: 800; color: #1e293b; margin: 12px 0 6px; }
        .up-private-box p { color: #64748b; font-size: 14px; }
        .up-section-title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 16px; }
        .up-section-title span { font-size: 13px; font-weight: 600; color: #94a3b8; margin-left: 8px; }
        .up-trips-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
        .up-trip-card { text-decoration: none; background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; transition: box-shadow 0.2s, transform 0.2s; display: block; }
        .up-trip-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.1); transform: translateY(-2px); }
        .up-trip-img-wrap { position: relative; height: 160px; overflow: hidden; }
        .up-trip-img { width: 100%; height: 100%; object-fit: cover; }
        .up-trip-mood { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.55); color: white; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
        .up-trip-info { padding: 12px 14px; }
        .up-trip-info h3 { font-size: 14px; font-weight: 700; color: #1e293b; margin: 0 0 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .up-trip-info p { font-size: 12px; color: #64748b; margin: 0 0 8px; }
        .up-trip-meta { display: flex; gap: 12px; font-size: 12px; color: #94a3b8; font-weight: 600; }
        @media (max-width: 640px) {
          .up-cover { height: 180px; }
          .up-avatar, .up-avatar-circle { width: 76px; height: 76px; }
          .up-displayname { font-size: 18px; }
          .up-trips-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}

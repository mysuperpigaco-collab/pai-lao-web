"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { uploadFile } from "@/lib/uploadHelper";

type Props = {
  isOwner: boolean;
  user?: {
    username?: string;
    displayName?: string;
    level?: string;
    avatarUrl?: string;
    coverUrl?: string;
    storiesCount?: number;
    likesCount?: string;
    followingCount?: number;
    interests?: string[];
  };
};

const DEFAULT_USER = {
  username:       "@SOMCHAI_TRAVELER",
  displayName:    "สมชาย รักการเที่ยว",
  level:          "Bronze",
  avatarUrl:      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80",
  coverUrl:       "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
  storiesCount:   5,
  likesCount:     "1.2k",
  followingCount: 142,
  interests:      ["☕ Café", "⛰️ Trekking", "📸 Photo", "🍲 Foodie"],
};

const S = {
  wrap: {
    background: "#ffffff", borderRadius: "32px", overflow: "hidden",
    boxShadow: "0 10px 40px rgba(15,23,42,0.06)", marginBottom: "32px",
    border: "1px solid #f1f5f9",
  } as React.CSSProperties,
  cover: { position: "relative" as const, height: "220px", overflow: "hidden" } as React.CSSProperties,
  coverImg: { width: "100%", height: "100%", objectFit: "cover" as const, display: "block" } as React.CSSProperties,
  coverOverlay: { position: "absolute" as const, inset: 0, background: "linear-gradient(to top, rgba(15,23,42,0.55), transparent 60%)" } as React.CSSProperties,
  strip: { display: "flex", alignItems: "flex-end", gap: "24px", padding: "0 36px 32px", marginTop: "-56px", position: "relative" as const, zIndex: 2, flexWrap: "wrap" as const } as React.CSSProperties,
  avatarWrap: { position: "relative" as const, flexShrink: 0 } as React.CSSProperties,
  avatar: { width: "130px", height: "130px", borderRadius: "50%", objectFit: "cover" as const, border: "5px solid #ffffff", boxShadow: "0 8px 24px rgba(15,23,42,0.14)", background: "#f1f5f9", display: "block" } as React.CSSProperties,
  avatarEdit: { position: "absolute" as const, bottom: "6px", right: "6px", width: "32px", height: "32px", borderRadius: "50%", background: "#2563eb", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 10px rgba(37,99,235,0.35)" } as React.CSSProperties,
  info: { flex: 1, minWidth: 0, paddingTop: "60px" } as React.CSSProperties,
  nameRow: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" as const, marginBottom: "18px" } as React.CSSProperties,
  handle: { fontSize: "13px", fontWeight: 700, color: "#4facfe", letterSpacing: "1px", margin: "0 0 4px" } as React.CSSProperties,
  name: { fontSize: "28px", fontWeight: 900, color: "#0f172a", margin: "0 0 10px" } as React.CSSProperties,
  badgeRow: { display: "flex", gap: "8px", flexWrap: "wrap" as const } as React.CSSProperties,
  badgeBlue: { padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, background: "#eff6ff", color: "#2563eb" } as React.CSSProperties,
  badgeGreen: { padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, background: "#ecfdf5", color: "#15803d" } as React.CSSProperties,
  btnRow: { display: "flex", gap: "10px", flexShrink: 0, flexWrap: "wrap" as const } as React.CSSProperties,
  btnEdit: { display: "inline-flex", alignItems: "center", gap: "10px", padding: "10px 18px 10px 10px", borderRadius: "14px", background: "#ffffff", border: "1.5px solid #dbeafe", color: "#1d4ed8", textDecoration: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" } as React.CSSProperties,
  btnEditIcon: { width: "32px", height: "32px", borderRadius: "9px", background: "#dbeafe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } as React.CSSProperties,
  btnLogout: { display: "inline-flex", alignItems: "center", gap: "10px", padding: "10px 18px 10px 10px", borderRadius: "14px", background: "#ffffff", border: "1.5px solid #fecaca", color: "#dc2626", fontSize: "13px", fontWeight: 700, cursor: "pointer" } as React.CSSProperties,
  btnLogoutIcon: { width: "32px", height: "32px", borderRadius: "9px", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } as React.CSSProperties,
  btnTextBlock: { display: "flex", flexDirection: "column" as const, gap: "2px", textAlign: "left" as const, lineHeight: 1 } as React.CSSProperties,
  btnMainLabel: { fontSize: "13px", fontWeight: 700, lineHeight: 1 } as React.CSSProperties,
  btnSubLabel: { fontSize: "10px", fontWeight: 400, opacity: 0.65 } as React.CSSProperties,
  statsRow: { display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" as const } as React.CSSProperties,
  stat: { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "2px" } as React.CSSProperties,
  statNum: { fontSize: "22px", fontWeight: 900, color: "#0f172a", lineHeight: 1 } as React.CSSProperties,
  statLabel: { fontSize: "12px", color: "#64748b", fontWeight: 500 } as React.CSSProperties,
  statDiv: { width: "1px", height: "36px", background: "#e2e8f0", flexShrink: 0 } as React.CSSProperties,
  interestRow: { display: "flex", gap: "8px", flexWrap: "wrap" as const, marginLeft: "8px" } as React.CSSProperties,
  tag: { padding: "5px 12px", borderRadius: "999px", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", fontSize: "12px", fontWeight: 600 } as React.CSSProperties,
};

const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function ProfileHeader({ isOwner, user = DEFAULT_USER }: Props) {
  const u = { ...DEFAULT_USER, ...user };
  const { logout, refresh } = useAuth();
  const router = useRouter();
  const [avatarSrc, setAvatarSrc] = useState(u.avatarUrl);
  const [uploading, setUploading] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert("รูปโปรไฟล์ต้องไม่เกิน 3MB"); return; }
    setUploading(true);
    try {
      const url = await uploadFile(file, "avatars");
      await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      setAvatarSrc(url);
      await refresh();
    } catch {
      alert("อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={S.wrap}>

      <div style={S.cover}>
        <img src={u.coverUrl} alt="cover" style={S.coverImg} />
        <div style={S.coverOverlay} />
      </div>

      <div style={S.strip}>

        <div style={S.avatarWrap}>
          <img
            src={avatarSrc}
            alt={u.displayName}
            style={{ ...S.avatar, opacity: uploading ? 0.5 : 1 }}
          />
          {isOwner && (
            <label
              style={{ ...S.avatarEdit, cursor: uploading ? "wait" : "pointer" }}
              title="เปลี่ยนรูปโปรไฟล์"
            >
              {uploading ? "⏳" : <IconPlus />}
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={uploading}
              />
            </label>
          )}
        </div>

        <div style={S.info}>
          <div style={S.nameRow}>

            <div>
              <p style={S.handle}>{u.username}</p>
              <h2 style={S.name}>{u.displayName}</h2>
              <div style={S.badgeRow}>
                <span style={S.badgeBlue}>✓ Verified Traveler</span>
                <span style={S.badgeGreen}>🥉 {u.level} Storyteller</span>
              </div>
            </div>

            {isOwner && (
              <div style={S.btnRow}>

                <Link href="/dashboard/edit-profile" style={S.btnEdit}>
                  <span style={S.btnEditIcon}><IconEdit /></span>
                  <span style={S.btnTextBlock}>
                    <span style={S.btnMainLabel}>แก้ไขโปรไฟล์</span>
                    <span style={S.btnSubLabel}>Edit Profile</span>
                  </span>
                </Link>

                <button style={S.btnLogout} onClick={handleLogout}>
                  <span style={S.btnLogoutIcon}><IconLogout /></span>
                  <span style={S.btnTextBlock}>
                    <span style={S.btnMainLabel}>ออกจากระบบ</span>
                    <span style={S.btnSubLabel}>Logout</span>
                  </span>
                </button>

              </div>
            )}
          </div>

          <div style={S.statsRow}>
            <div style={S.stat}>
              <strong style={S.statNum}>{u.storiesCount}</strong>
              <span style={S.statLabel}>เรื่องเล่า <span style={{ color: "#94a3b8", fontSize: "10px" }}>Stories</span></span>
            </div>
            <div style={S.statDiv} />
            <div style={S.stat}>
              <strong style={S.statNum}>{u.likesCount}</strong>
              <span style={S.statLabel}>ถูกใจ <span style={{ color: "#94a3b8", fontSize: "10px" }}>Likes</span></span>
            </div>
            <div style={S.statDiv} />
            <div style={S.stat}>
              <strong style={S.statNum}>{u.followingCount}</strong>
              <span style={S.statLabel}>ติดตาม <span style={{ color: "#94a3b8", fontSize: "10px" }}>Following</span></span>
            </div>
            <div style={S.interestRow}>
              {u.interests.map((tag) => (
                <span key={tag} style={S.tag}>{tag}</span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

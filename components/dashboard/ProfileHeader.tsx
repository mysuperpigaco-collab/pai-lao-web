"use client";

import { useState } from "react";
import Link from "next/link";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { useAuth } from "@/context/AuthContext";
import { uploadFile } from "@/lib/uploadHelper";

type Props = {
  isOwner: boolean;
  loading?: boolean;
  user?: {
    username?: string;
    displayName?: string;
    level?: string;
    avatarUrl?: string;
    storiesCount?: number;
    likesCount?: string;
    followingCount?: number;
    interests?: string[];
    bio?: string;
  };
};

const DEFAULT_USER = {
  username:       "@traveler",
  displayName:    "traveler",
  level:          "Bronze",
  avatarUrl:      "",
  storiesCount:   0,
  likesCount:     "0",
  followingCount: 0,
  interests:      [] as string[],
  bio:            "",
};

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/>
  </svg>
);
const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconCamera = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);
const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const shimmerStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",
  backgroundSize: "200% 100%",
  animation: "_phsh 1.5s ease infinite",
};

function Shim({ delay = 0 }: { delay?: number }) {
  return <div style={{ ...shimmerStyle, animationDelay: delay + "s" }} />;
}

export default function ProfileHeader({ isOwner, loading, user = DEFAULT_USER }: Props) {
  const u = { ...DEFAULT_USER, ...user };
  const { logout, refresh } = useAuth();
  const stories   = useAnimatedCounter(u.storiesCount ?? 0);
  const following = useAnimatedCounter(u.followingCount ?? 0);
  const [avatarSrc, setAvatarSrc] = useState(u.avatarUrl);
  const [uploading, setUploading] = useState(false);

  const handleLogout = async () => { await logout(); };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert("รูปโปรไฟล์ต้องไม่เกิน 3MB"); return; }
    setUploading(true);
    try {
      const url = await uploadFile(file, "avatars");
      await fetch("/api/auth/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatarUrl: url }) });
      setAvatarSrc(url);
      await refresh();
    } catch { alert("อัปโหลดรูปไม่สำเร็จ"); }
    finally { setUploading(false); }
  };

  const initials = u.displayName?.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  if (loading) {
    return (
      <div style={{ background: "#fff", borderRadius: "28px", overflow: "hidden", border: "1px solid #f1f5f9", boxShadow: "0 4px 24px rgba(15,23,42,0.07)" }}>
        <style>{`@keyframes _phsh{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div style={{ height: "110px", background: "linear-gradient(135deg,#667eea 0%,#4facfe 50%,#43e97b 100%)", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.15) 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
          <div style={{ position: "absolute", bottom: "-44px", left: "50%", transform: "translateX(-50%)" }}>
            <div style={{ width: "88px", height: "88px", borderRadius: "50%", border: "4px solid #fff", boxShadow: "0 8px 20px rgba(15,23,42,0.15)", background: "#e2e8f0", overflow: "hidden", position: "relative" }}>
              <Shim />
            </div>
          </div>
        </div>
        <div style={{ padding: "56px 22px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
          <div style={{ height: "10px", width: "64px", borderRadius: "999px", background: "#f1f5f9", overflow: "hidden", position: "relative", marginBottom: "8px" }}><Shim /></div>
          <div style={{ height: "16px", width: "120px", borderRadius: "999px", background: "#f1f5f9", overflow: "hidden", position: "relative", marginBottom: "16px" }}><Shim delay={0.05} /></div>
          <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "20px" }}>
            <div style={{ height: "22px", width: "64px", borderRadius: "999px", background: "#f1f5f9", overflow: "hidden", position: "relative" }}><Shim delay={0.1} /></div>
            <div style={{ height: "22px", width: "72px", borderRadius: "999px", background: "#f1f5f9", overflow: "hidden", position: "relative" }}><Shim delay={0.18} /></div>
          </div>
          <div style={{ height: "1px", background: "#f1f5f9", width: "100%", margin: "0 0 20px" }} />
          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", width: "100%", marginBottom: "20px" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <div style={{ height: "20px", width: "36px", borderRadius: "6px", background: "#f1f5f9", overflow: "hidden", position: "relative" }}><Shim delay={i * 0.1} /></div>
                <div style={{ height: "9px", width: "44px", borderRadius: "999px", background: "#f1f5f9", overflow: "hidden", position: "relative" }}><Shim delay={i * 0.1 + 0.15} /></div>
              </div>
            ))}
          </div>
          <div style={{ height: "1px", background: "#f1f5f9", width: "100%", margin: "0 0 16px" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
            {[0.05, 0.15, 0.25].map((d, i) => (
              <div key={i} style={{ height: "40px", borderRadius: "12px", background: "#f1f5f9", overflow: "hidden", position: "relative" }}><Shim delay={d} /></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderRadius: "28px", overflow: "hidden", border: "1px solid #f1f5f9", boxShadow: "0 4px 24px rgba(15,23,42,0.07)" }}>
      <div style={{ height: "110px", background: "linear-gradient(135deg,#667eea 0%,#4facfe 50%,#43e97b 100%)", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.15) 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
        <div style={{ position: "absolute", bottom: "-44px", left: "50%", transform: "translateX(-50%)" }}>
          <div style={{ position: "relative", width: "88px", height: "88px" }}>
            {avatarSrc ? (
              <img src={avatarSrc} alt={u.displayName} style={{ width: "88px", height: "88px", borderRadius: "50%", objectFit: "cover", border: "4px solid #fff", boxShadow: "0 8px 20px rgba(15,23,42,0.15)", opacity: uploading ? 0.5 : 1, display: "block", background: "#f1f5f9" }} />
            ) : (
              <div style={{ width: "88px", height: "88px", borderRadius: "50%", border: "4px solid #fff", boxShadow: "0 8px 20px rgba(15,23,42,0.15)", background: "linear-gradient(135deg,#667eea,#4facfe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 900, color: "#fff" }}>
                {initials}
              </div>
            )}
            {isOwner && (
              <label style={{ position: "absolute", bottom: "2px", right: "2px", width: "28px", height: "28px", borderRadius: "50%", background: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: uploading ? "wait" : "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.25)", border: "2px solid #fff" }}>
                {uploading ? <span style={{ fontSize: "10px" }}>⏳</span> : <IconCamera />}
                <input hidden type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploading} />
              </label>
            )}
          </div>
          {isOwner && !avatarSrc && (
            <Link href="/dashboard/edit-profile" style={{ display: "inline-flex", alignItems: "center", gap: "5px", marginTop: "6px", fontSize: "11px", fontWeight: 700, color: "#fff", background: "rgba(0,0,0,0.32)", backdropFilter: "blur(4px)", padding: "4px 10px", borderRadius: "999px", textDecoration: "none", border: "1px solid rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>
              📸 เพิ่มรูปโปรไฟล์ · Add photo
            </Link>
          )}
        </div>
      </div>

      <div style={{ padding: "56px 22px 24px", textAlign: "center" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#4facfe", letterSpacing: "1.2px", textTransform: "uppercase", margin: "0 0 4px" }}>{u.username}</p>
        <h2 style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", margin: "0 0 12px", lineHeight: 1.2 }}>{u.displayName}</h2>

        <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, background: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: "999px" }}>✓ Traveler</span>
          <span style={{ fontSize: "11px", fontWeight: 700, background: "#fefce8", color: "#a16207", padding: "4px 10px", borderRadius: "999px" }}>{u.level}</span>
        </div>

        {u.bio && (
          <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 16px", lineHeight: 1.6, fontStyle: "italic" }}>{u.bio}</p>
        )}

        <div style={{ height: "1px", background: "#f1f5f9", margin: "0 0 16px" }} />

        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ textAlign: "center" }}>
            <strong ref={stories.ref} style={{ display: "block", fontSize: "20px", fontWeight: 900, color: "#2563eb", lineHeight: 1 }}>{stories.value}</strong>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>เรื่องเล่า</span>
          </div>
          <div style={{ width: "1px", height: "32px", background: "#f1f5f9" }} />
          <div style={{ textAlign: "center" }}>
            <strong style={{ display: "block", fontSize: "20px", fontWeight: 900, color: "#22a06b", lineHeight: 1 }}>{u.likesCount}</strong>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>Likes</span>
          </div>
          <div style={{ width: "1px", height: "32px", background: "#f1f5f9" }} />
          <div style={{ textAlign: "center" }}>
            <strong ref={following.ref} style={{ display: "block", fontSize: "20px", fontWeight: 900, color: "#7c3aed", lineHeight: 1 }}>{following.value}</strong>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>ติดตาม</span>
          </div>
        </div>

        {u.interests.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center", marginBottom: "20px" }}>
            {u.interests.map((tag: string) => (
              <span key={tag} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "999px", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>{tag}</span>
            ))}
          </div>
        )}

        <div style={{ height: "1px", background: "#f1f5f9", margin: "0 0 16px" }} />

        {isOwner && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Link href="/dashboard/edit-profile" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 16px", borderRadius: "12px", background: "#eff6ff", color: "#2563eb", textDecoration: "none", fontSize: "13px", fontWeight: 700, border: "1.5px solid #dbeafe" }}>
              <IconEdit /> แก้ไขโปรไฟล์ · Edit Profile
            </Link>
            <Link href={"/user/" + u.username.replace("@", "") + "?preview=true"} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 16px", borderRadius: "12px", background: "#f0fdf4", color: "#059669", textDecoration: "none", fontSize: "13px", fontWeight: 700, border: "1.5px solid #bbf7d0" }}>
              <IconEye /> โปรไฟล์สาธารณะ · Public Profile
            </Link>
            <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 16px", borderRadius: "12px", background: "#fff5f5", color: "#dc2626", fontSize: "13px", fontWeight: 700, border: "1.5px solid #fecaca", cursor: "pointer", width: "100%", fontFamily: "inherit" }}>
              <IconLogout /> ออกจากระบบ · Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

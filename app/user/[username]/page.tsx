"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface PublicUser {
  id: string; username: string; displayName?: string; firstName: string;
  avatarUrl?: string; coverUrl?: string; profileCovers?: string[]; bio?: string; role: string;
  email?: string; phone?: string; lineId?: string; facebook?: string;
  instagram?: string; tiktok?: string; birthDate?: string;
  createdAt?: string; isPrivate?: boolean;
  _count?: { followers: number; following: number; trips: number };
}
interface TripCard {
  id: string; slug: string; title: string; coverUrl: string;
  mood: string; province?: string; location?: string; createdAt: string;
  viewCount?: number;
  _count: { likes: number; bookmarks: number; reviews?: number };
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

function resizeImage(file: File, maxW = 1920, maxH = 800, quality = 0.82): Promise<File> {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width: w, height: h } = img;
      const ratio = Math.min(maxW / w, maxH / h, 1);
      w = Math.round(w * ratio); h = Math.round(h * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        if (!blob) { resolve(file); return; }
        resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
      }, "image/jpeg", quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

// ── Cover Slideshow ─────────────────────────────────────────
function CoverSlideshow({ images, defaultCover }: { images: string[]; defaultCover?: string }) {
  const all = images.length > 0 ? images : (defaultCover ? [defaultCover] : ["/images/hero-bg.png"]);
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goTo = useCallback((i: number) => {
    setFade(false);
    setTimeout(() => { setIdx(i); setFade(true); }, 300);
  }, []);
  useEffect(() => {
    if (all.length <= 1) return;
    timerRef.current = setTimeout(() => goTo((idx + 1) % all.length), 4000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [idx, all.length, goTo]);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <img key={idx} src={all[idx]} alt="cover" style={{
        width: "100%", height: "100%", objectFit: "cover", display: "block",
        opacity: fade ? 1 : 0, transition: "opacity 0.35s ease"
      }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.52) 100%)", pointerEvents: "none" }} />
      {all.length > 1 && (
        <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
          {all.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{
              width: i === idx ? 22 : 8, height: 8, borderRadius: 999, border: "none", cursor: "pointer",
              background: i === idx ? "#fff" : "rgba(255,255,255,0.42)", padding: 0, transition: "all 0.25s"
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cover Manager panel overlay ──────────────────────────────
function CoverManagerPanel({ username, covers, onUpdate, onClose }: {
  username: string; covers: string[]; onUpdate: (c: string[]) => void; onClose: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const resized = await resizeImage(file, 1920, 800, 0.82);
      const fd = new FormData();
      fd.append("file", resized);
      const res = await fetch("/api/users/" + username + "/covers", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) onUpdate(data.profileCovers ?? []);
      else alert(data.message ?? "Upload failed");
    } catch { alert("Error uploading"); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const remove = async (url: string) => {
    if (!confirm("ลบรูปนี้ออกจากสไลด์โชว์?")) return;
    const res = await fetch("/api/users/" + username + "/covers", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }),
    });
    if (res.ok) onUpdate((await res.json()).profileCovers ?? []);
  };

  return (
    <>
      {preview && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,cursor:"pointer"}} onClick={() => setPreview(null)}>
          <img src={preview} alt="preview" style={{maxWidth:"92vw",maxHeight:"82vh",borderRadius:12,objectFit:"contain",boxShadow:"0 20px 60px rgba(0,0,0,0.4)",cursor:"default"}} onClick={e=>e.stopPropagation()} />
          <button style={{position:"fixed",top:20,right:24,background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:16,width:38,height:38,borderRadius:"50%",cursor:"pointer",fontWeight:900,fontFamily:"inherit"}} onClick={() => setPreview(null)}>✕</button>
        </div>
      )}
      <div style={{position:"fixed",inset:0,zIndex:200}} onClick={onClose} />
      <div style={{
        position:"absolute", bottom:0, left:0, right:0, zIndex:201,
        background:"rgba(10,18,32,0.92)", backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)",
        borderTop:"1px solid rgba(255,255,255,0.1)", padding:"18px 20px 22px",
        borderRadius:"0 0 22px 22px",
      }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <span style={{color:"#fff",fontWeight:800,fontSize:14}}>📸 รูปสไลด์โชว์ปก ({covers.length}/5)</span>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",width:28,height:28,borderRadius:"50%",cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:"inherit"}}>✕</button>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          {covers.map((url, i) => (
            <div key={i} style={{position:"relative",width:110,height:68,borderRadius:10,overflow:"hidden",border:"2px solid rgba(255,255,255,0.18)",flexShrink:0}}
              onMouseEnter={e=>{const ov=e.currentTarget.querySelector(".cm-ov") as HTMLElement; if(ov) ov.style.opacity="1";}}
              onMouseLeave={e=>{const ov=e.currentTarget.querySelector(".cm-ov") as HTMLElement; if(ov) ov.style.opacity="0";}}>
              <img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} />
              <div className="cm-ov" style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",gap:5,opacity:0,transition:"opacity 0.18s"}}>
                <button onClick={() => setPreview(url)} style={{border:"none",borderRadius:7,fontSize:10,padding:"4px 8px",cursor:"pointer",fontWeight:700,background:"rgba(255,255,255,0.9)",color:"#1e293b",fontFamily:"inherit"}}>ดู</button>
                <button onClick={() => remove(url)} style={{border:"none",borderRadius:7,fontSize:10,padding:"4px 8px",cursor:"pointer",fontWeight:700,background:"rgba(239,68,68,0.88)",color:"white",fontFamily:"inherit"}}>ลบ</button>
              </div>
            </div>
          ))}
          {covers.length < 5 && (
            <label style={{width:110,height:68,borderRadius:10,border:"2px dashed rgba(167,243,208,0.55)",background:"rgba(16,185,129,0.08)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#6ee7b7",fontWeight:700,flexShrink:0,fontFamily:"inherit"}}>
              {uploading ? <span>⏳</span> : <><span style={{fontSize:22}}>+</span><span style={{fontSize:11,marginTop:2}}>เพิ่มรูป</span></>}
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={upload} disabled={uploading} />
            </label>
          )}
        </div>
        <p style={{fontSize:11,color:"rgba(255,255,255,0.38)",margin:"10px 0 0"}}>สลับอัตโนมัติทุก 4 วินาที · สูงสุด 5 รูป · แนะนำ 1920×800px</p>
      </div>
    </>
  );
}

// ── Follow Modal ─────────────────────────────────────────────
function UserListModal({ title, users, onClose }: { title: string; users: FollowUser[]; onClose: () => void }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"white",borderRadius:20,width:"100%",maxWidth:420,maxHeight:"80vh",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"18px 20px 14px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <h3 style={{fontWeight:800,fontSize:16,color:"#0f172a",margin:0}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94a3b8",fontFamily:"inherit"}}>✕</button>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"10px 12px"}}>
          {users.length === 0
            ? <p style={{textAlign:"center",color:"#94a3b8",padding:"24px 0",fontSize:14}}>ยังไม่มีรายชื่อ</p>
            : users.map(u => {
                const name = u.displayName || u.firstName;
                return (
                  <Link key={u.id} href={"/user/" + u.username} onClick={onClose}
                    style={{display:"flex",alignItems:"center",gap:12,padding:"10px 8px",borderRadius:12,textDecoration:"none",color:"inherit"}}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="#f8fafc"}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}>
                    {u.avatarUrl
                      ? <img src={u.avatarUrl} alt={name} style={{width:42,height:42,borderRadius:"50%",objectFit:"cover",flexShrink:0}} />
                      : <div style={{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:16,flexShrink:0}}>{name.charAt(0).toUpperCase()}</div>}
                    <div>
                      <div style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>{name}</div>
                      <div style={{fontSize:12,color:"#94a3b8"}}>@{u.username}</div>
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return <>{Array.from({length:5}).map((_,i) => <span key={i} style={{color: i<n ? "#f59e0b" : "#e2e8f0", fontSize:15}}>★</span>)}</>;
}
function fmt(n?: number) { return n == null ? 0 : n >= 1000 ? (n/1000).toFixed(1)+"k" : n; }

// ── Modern Trip Card ──────────────────────────────────────────
function ModernTripCard({ trip, ownerAvatar, ownerName }: { trip: TripCard; ownerAvatar?: string; ownerName: string }) {
  const [hovered, setHovered] = useState(false);
  const province = trip.province?.split(" (")[0] ?? trip.location?.split(",").pop()?.trim() ?? "";
  return (
    <Link href={"/trips/" + trip.slug}
      style={{
        display:"flex", flexDirection:"column", borderRadius:20, overflow:"hidden",
        background:"rgba(255,255,255,0.88)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
        textDecoration:"none", color:"inherit",
        boxShadow: hovered ? "0 16px 36px rgba(15,23,42,.15)" : "0 2px 12px rgba(15,23,42,.06)",
        border:"1px solid rgba(226,232,240,0.6)",
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
        transition:"transform .22s ease, box-shadow .22s ease",
      }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{position:"relative", height:164, overflow:"hidden", background:"#e2e8f0", flexShrink:0}}>
        <img src={trip.coverUrl} alt={trip.title} loading="lazy"
          style={{width:"100%", height:"100%", objectFit:"cover", display:"block",
            transform: hovered ? "scale(1.06)" : "scale(1)", transition:"transform .35s ease"}} />
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top, rgba(15,23,42,.55) 0%, transparent 55%)",pointerEvents:"none"}} />
        {province && <span style={{position:"absolute",top:10,left:10,background:"rgba(255,255,255,.88)",color:"#0f172a",fontSize:11,fontWeight:800,padding:"4px 10px",borderRadius:999,backdropFilter:"blur(6px)"}}>
          {province}
        </span>}
        {trip.mood && <span style={{position:"absolute",bottom:10,left:10,background:"rgba(99,102,241,.85)",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:999}}>
          {trip.mood}
        </span>}
      </div>
      <div style={{padding:"12px 14px 13px", flex:1, display:"flex", flexDirection:"column", gap:6}}>
        <h4 style={{fontSize:14, fontWeight:800, color:"#1e293b", margin:0, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any, lineHeight:1.35}}>
          {trip.title}
        </h4>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:6, marginTop:"auto", paddingTop:6, borderTop:"1px solid rgba(241,245,249,0.8)"}}>
          <div style={{display:"flex", alignItems:"center", gap:6, minWidth:0, overflow:"hidden"}}>
            {ownerAvatar
              ? <img src={ownerAvatar} alt={ownerName} style={{width:22,height:22,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"1.5px solid #e2e8f0"}} />
              : <div style={{width:22,height:22,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#06b6d4)",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{ownerName.charAt(0)}</div>}
            <span style={{fontSize:11,fontWeight:700,color:"#475569",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ownerName}</span>
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0,fontSize:11,fontWeight:700,color:"#94a3b8"}}>
            {(trip.viewCount ?? 0) > 0 && <span>👁 {fmt(trip.viewCount)}</span>}
            <span>❤️ {fmt(trip._count.likes)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Main ──────────────────────────────────────────────────────
function UserProfileInner() {
  const { user: me } = useAuth();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = params?.username as string;
  const isPreviewMode = searchParams.get("preview") === "true";

  const [user, setUser]       = useState<PublicUser | null>(null);
  const [covers, setCovers]   = useState<string[]>([]);
  const [trips, setTrips]     = useState<TripCard[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsOwn, setReviewsOwn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"trips"|"reviews">("trips");
  const [followModal, setFollowModal] = useState<"followers"|"following"|null>(null);
  const [followUsers, setFollowUsers] = useState<FollowUser[]>([]);
  const [followLoading, setFollowLoading] = useState(false);
  const [showCoverMgr, setShowCoverMgr] = useState(false);

  useEffect(() => {
    if (me?.username && username && me.username === username && !isPreviewMode) {
      router.replace("/dashboard");
    }
  }, [me?.username, username, isPreviewMode, router]);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetch("/api/users/" + encodeURIComponent(username))
      .then(r => r.json())
      .then(data => {
        if (!data.user) { setNotFound(true); setLoading(false); return; }
        setUser(data.user);
        setCovers(data.user.profileCovers ?? []);
        setTrips(data.trips ?? []);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [username]);

  useEffect(() => {
    if (activeTab !== "reviews" || !username) return;
    fetch("/api/users/" + encodeURIComponent(username) + "/reviews")
      .then(r => r.json())
      .then(data => { setReviews(data.reviews ?? []); setReviewsOwn(data.isOwn ?? false); })
      .catch(() => {});
  }, [activeTab, username]);

  const openFollowModal = async (type: "followers"|"following") => {
    setFollowModal(type); setFollowLoading(true);
    try {
      const res = await fetch("/api/users/" + encodeURIComponent(username) + "/followers?type=" + type);
      setFollowUsers((await res.json()).users ?? []);
    } catch {}
    setFollowLoading(false);
  };

  const toggleReviewHidden = async (reviewId: string) => {
    try {
      const res = await fetch("/api/reviews/" + reviewId + "/hide", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, isHidden: data.isHidden } : r));
      }
    } catch {}
  };

  if (me?.username && username && me.username === username && !isPreviewMode) return null;

  if (loading) return (
    <div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#94a3b8",fontSize:16}}>Loading...</div>
  );
  if (notFound || !user) return (
    <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
      <div style={{fontSize:48}}>404</div>
      <h2 style={{fontSize:20,fontWeight:800,color:"#1e293b"}}>ไม่พบผู้ใช้</h2>
      <Link href="/" style={{color:"#10b981",fontWeight:700,textDecoration:"none"}}>กลับหน้าแรก</Link>
    </div>
  );

  const displayName = user.displayName || user.firstName;
  const joinYear = user.createdAt ? new Date(user.createdAt).getFullYear() : "";
  const isOwnProfile = me?.username === user.username;

  return (
    <div className="up-page">

      {/* Preview Banner — thin top strip */}
      {isPreviewMode && (
        <div style={{
          background:"linear-gradient(90deg,#7c3aed,#4f46e5)",
          color:"#fff", padding:"9px 20px",
          display:"flex", alignItems:"center", gap:10,
          boxShadow:"0 2px 12px rgba(99,102,241,0.3)"
        }}>
          <span style={{fontSize:16}}>👁</span>
          <span style={{fontWeight:700,fontSize:13}}>โหมดพรีวิว — นี่คือสิ่งที่คนอื่นเห็นโปรไฟล์ของคุณ</span>
        </div>
      )}

      {followModal && (
        <UserListModal
          title={followModal === "followers" ? "ผู้ติดตาม (" + (user._count?.followers ?? 0) + ")" : "กำลังติดตาม (" + (user._count?.following ?? 0) + ")"}
          users={followLoading ? [] : followUsers}
          onClose={() => { setFollowModal(null); setFollowUsers([]); }}
        />
      )}

      {/* ── Hero Cover — card style, not full-width ── */}
      <div className="up-hero-wrapper">
        <div className="up-hero">
          <CoverSlideshow images={covers} defaultCover={user.coverUrl} />

          {/* Edit cover button */}
          {isOwnProfile && (
            <button
              onClick={() => setShowCoverMgr(v => !v)}
              style={{
                position:"absolute", bottom:14, right:16, zIndex:10,
                display:"flex", alignItems:"center", gap:7,
                background: showCoverMgr ? "rgba(16,185,129,0.9)" : "rgba(10,18,32,0.60)",
                backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
                border: showCoverMgr ? "1.5px solid rgba(52,211,153,0.6)" : "1.5px solid rgba(255,255,255,0.18)",
                color:"#fff", fontSize:12, fontWeight:700, padding:"7px 14px", borderRadius:999,
                cursor:"pointer", transition:"all 0.2s", fontFamily:"inherit",
              }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              {showCoverMgr ? "ปิด" : "จัดการรูปปก (" + covers.length + "/5)"}
            </button>
          )}

          {isOwnProfile && showCoverMgr && (
            <CoverManagerPanel
              username={username} covers={covers}
              onUpdate={setCovers} onClose={() => setShowCoverMgr(false)}
            />
          )}
        </div>
      </div>

      {/* ── Avatar row ── */}
      <div className="up-avatar-row">
        <div className="up-avatar-wrap">
          {user.avatarUrl
            ? <img src={user.avatarUrl} alt={displayName} className="up-avatar" />
            : <div className="up-avatar-circle">{displayName.charAt(0).toUpperCase()}</div>}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="up-body">

        {/* Name row — NO edit button here anymore */}
        <div style={{marginBottom:18}}>
          <h1 className="up-displayname">{displayName}</h1>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginTop:4}}>
            <span className="up-username">@{user.username}</span>
            {joinYear && <span className="up-since">· สมาชิกตั้งแต่ {joinYear}</span>}
          </div>
        </div>

        {/* Bio */}
        {!user.isPrivate && user.bio && (
          <div className="up-bio-card">
            <div className="up-bio-label">เกี่ยวกับฉัน</div>
            <p className="up-bio-text">{user.bio}</p>
          </div>
        )}

        {/* Stats */}
        {!user.isPrivate && user._count && (
          <div className="up-stats">
            <div className="up-stat">
              <strong>{user._count.trips}</strong>
              <span>ทริป</span>
            </div>
            <button className="up-stat up-stat-btn" onClick={() => openFollowModal("followers")}>
              <strong>{user._count.followers}</strong>
              <span>ผู้ติดตาม</span>
            </button>
            <button className="up-stat up-stat-btn" onClick={() => openFollowModal("following")}>
              <strong>{user._count.following}</strong>
              <span>กำลังติดตาม</span>
            </button>
          </div>
        )}

        {user.isPrivate ? (
          <div className="up-private-box">
            <div style={{fontSize:36,marginBottom:10}}>🔒</div>
            <h3 style={{fontWeight:800,fontSize:18,color:"#334155",margin:"0 0 8px"}}>โปรไฟล์ส่วนตัว</h3>
            <p style={{margin:0}}>ผู้ใช้นี้ตั้งโปรไฟล์เป็นส่วนตัว</p>
          </div>
        ) : (
          <>
            {(user.email || user.phone || user.lineId || user.facebook || user.instagram || user.tiktok) && (
              <div className="up-contact">
                {user.email     && <a href={"mailto:"+user.email} className="up-contact-item">📧 {user.email}</a>}
                {user.phone     && <span className="up-contact-item">📞 {user.phone}</span>}
                {user.lineId    && <span className="up-contact-item">💬 LINE: {user.lineId}</span>}
                {user.facebook  && <a href={user.facebook.startsWith("http")?user.facebook:"https://facebook.com/"+user.facebook} target="_blank" rel="noopener" className="up-contact-item">📘 {user.facebook}</a>}
                {user.instagram && <a href={"https://instagram.com/"+user.instagram.replace("@","")} target="_blank" rel="noopener" className="up-contact-item">📷 {user.instagram}</a>}
                {user.tiktok    && <a href={"https://tiktok.com/@"+user.tiktok.replace("@","")} target="_blank" rel="noopener" className="up-contact-item">🎵 {user.tiktok}</a>}
              </div>
            )}

            <div className="up-tab-bar">
              <button className={"up-tab"+(activeTab==="trips"?" active":"")} onClick={() => setActiveTab("trips")}>
                ✈️ ทริป <span className="up-tab-count">{trips.length}</span>
              </button>
              <button className={"up-tab"+(activeTab==="reviews"?" active":"")} onClick={() => setActiveTab("reviews")}>
                ⭐ รีวิว
              </button>
            </div>

            {activeTab === "trips" && (
              trips.length > 0 ? (
                <div className="up-trips-grid">
                  {trips.map(t => (
                    <ModernTripCard key={t.id} trip={t} ownerAvatar={user.avatarUrl} ownerName={displayName} />
                  ))}
                </div>
              ) : (
                <div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8"}}>
                  <div style={{fontSize:44,marginBottom:12}}>✈️</div>
                  <p style={{fontSize:15,fontWeight:600}}>ยังไม่มีทริป</p>
                </div>
              )
            )}

            {activeTab === "reviews" && (
              <div>
                {reviewsOwn && (
                  <div style={{fontSize:12,color:"#64748b",background:"rgba(248,250,252,0.9)",border:"1px solid #e2e8f0",borderRadius:10,padding:"8px 14px",marginBottom:14}}>
                    กดซ่อน/แสดงเพื่อควบคุมว่ารีวิวไหนแสดงในโปรไฟล์
                  </div>
                )}
                {reviews.length === 0 ? (
                  <div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8"}}>
                    <div style={{fontSize:44,marginBottom:12}}>⭐</div>
                    <p style={{fontSize:15,fontWeight:600}}>ยังไม่มีรีวิว</p>
                  </div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    {reviews.map(rv => {
                      const dest = rv.trip ? "/trips/"+rv.trip.slug : rv.place ? "/place/"+rv.place.slug : "#";
                      const destTitle = rv.trip?.title ?? rv.place?.title ?? "Content";
                      const coverUrl = rv.trip?.coverUrl ?? rv.place?.coverUrl ?? null;
                      const isHidden = rv.isHidden;
                      return (
                        <div key={rv.id} className={"up-rv-card"+(isHidden?" up-rv-hidden":"")}>
                          {coverUrl && (
                            <Link href={dest} style={{display:"block",width:"100%",height:100,overflow:"hidden",borderRadius:"14px 14px 0 0",flexShrink:0,textDecoration:"none"}}>
                              <div style={{position:"relative",width:"100%",height:"100%"}}>
                                <img src={coverUrl} alt={destTitle} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} />
                                <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(15,23,42,0.6) 0%,transparent 60%)"}} />
                                <div style={{position:"absolute",bottom:10,left:14,right:14}}>
                                  <p style={{fontSize:13,fontWeight:800,color:"#fff",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{destTitle}</p>
                                </div>
                              </div>
                            </Link>
                          )}
                          <div style={{padding:"12px 16px 14px"}}>
                            {!coverUrl && (
                              <Link href={dest} style={{fontWeight:800,fontSize:14,color:"#1e293b",textDecoration:"none",display:"block",marginBottom:8}}>{destTitle}</Link>
                            )}
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:8}}>
                              <div style={{display:"flex",alignItems:"center",gap:6}}>
                                <Stars n={rv.rating} />
                                <span style={{fontSize:12,fontWeight:700,color:"#f59e0b"}}>{rv.rating}/5</span>
                              </div>
                              <div style={{display:"flex",alignItems:"center",gap:6}}>
                                {isHidden && <span style={{fontSize:10,fontWeight:800,background:"#fef2f2",color:"#b91c1c",padding:"2px 8px",borderRadius:999}}>ซ่อน</span>}
                                {reviewsOwn && (
                                  <button onClick={() => toggleReviewHidden(rv.id)} style={{fontSize:11,fontWeight:700,padding:"4px 11px",borderRadius:999,border:"1px solid "+(isHidden?"#bbf7d0":"#fecaca"),background:isHidden?"#f0fdf4":"#fff5f5",color:isHidden?"#15803d":"#b91c1c",cursor:"pointer",fontFamily:"inherit"}}>
                                    {isHidden ? "แสดง" : "ซ่อน"}
                                  </button>
                                )}
                              </div>
                            </div>
                            {!rv.isAnonymous && rv.text && (
                              <p style={{fontSize:13,color:"#475569",margin:"0 0 8px",lineHeight:1.6,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical" as any,overflow:"hidden"}}>
                                "{rv.text}"
                              </p>
                            )}
                            {rv.isAnonymous && <p style={{fontSize:12,color:"#94a3b8",margin:"0 0 8px",fontStyle:"italic"}}>รีวิวแบบไม่ระบุชื่อ</p>}
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:11,color:"#94a3b8"}}>
                              <span>{new Date(rv.createdAt).toLocaleDateString("th-TH",{year:"numeric",month:"short",day:"numeric"})}</span>
                              {rv.likes > 0 && <span>❤️ {rv.likes} คนถูกใจ</span>}
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

        {/* Bottom spacer for sticky bar */}
        {isOwnProfile && <div style={{height:80}} />}
      </div>

      {/* ── Sticky Bottom Action Bar — owner only ── */}
      {isOwnProfile && (
        <div style={{
          position:"fixed", bottom:0, left:0, right:0, zIndex:200,
          background:"rgba(255,255,255,0.95)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
          borderTop:"1px solid #e2e8f0",
          padding:"12px 20px",
          display:"flex", alignItems:"center", justifyContent:"center", gap:12,
          boxShadow:"0 -4px 24px rgba(15,23,42,0.08)",
        }}>
          <Link href="/dashboard" style={{
            display:"inline-flex", alignItems:"center", justifyContent:"center",
            padding:"10px 28px", borderRadius:999,
            background:"#f8fafc", border:"1.5px solid #e2e8f0",
            color:"#475569", fontWeight:700, fontSize:14,
            textDecoration:"none", transition:"all 0.15s",
          }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="#f1f5f9"}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="#f8fafc"}>
            ยกเลิก
          </Link>
          <Link href="/dashboard/edit-profile" style={{
            display:"inline-flex", alignItems:"center", justifyContent:"center", gap:7,
            padding:"10px 28px", borderRadius:999,
            background:"linear-gradient(135deg,#10b981,#059669)",
            color:"#fff", fontWeight:700, fontSize:14,
            textDecoration:"none",
            boxShadow:"0 4px 14px rgba(16,185,129,0.35)",
            transition:"all 0.15s",
          }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.opacity="0.88"}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.opacity="1"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/>
            </svg>
            แก้ไขโปรไฟล์
          </Link>
        </div>
      )}

      <style jsx>{`
        .up-page { min-height: 100vh; background: transparent; padding-bottom: 0; }

        /* Hero wrapper — adds side padding for card effect */
        .up-hero-wrapper {
          max-width: 900px; margin: 0 auto; padding: 18px 20px 0;
        }
        /* Hero card — rounded, contained */
        .up-hero {
          width: 100%; height: 280px; position: relative; overflow: hidden;
          border-radius: 22px; background: #1a3a2a;
          box-shadow: 0 8px 32px rgba(15,23,42,0.18);
        }

        /* Avatar row */
        .up-avatar-row {
          max-width: 900px; margin: 0 auto; padding: 0 28px;
          height: 0; display: flex; align-items: flex-start;
        }
        .up-avatar-wrap { margin-top: -50px; position: relative; z-index: 10; }
        .up-avatar, .up-avatar-circle {
          width: 96px; height: 96px; border-radius: 50%;
          border: 4px solid white; box-shadow: 0 6px 24px rgba(0,0,0,0.22); display: block;
        }
        .up-avatar { object-fit: cover; background: #e2e8f0; }
        .up-avatar-circle {
          background: linear-gradient(135deg, #10b981, #3b82f6);
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 34px; font-weight: 900;
        }

        /* Body */
        .up-body { max-width: 900px; margin: 0 auto; padding: 62px 20px 0; }

        .up-displayname { font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; line-height: 1.2; }
        .up-username { font-size: 13px; color: #64748b; font-weight: 600; }
        .up-since { font-size: 12px; color: #94a3b8; }

        .up-bio-card {
          background: rgba(255,255,255,0.88); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          border: 1.5px solid rgba(226,232,240,0.6); border-radius: 18px;
          padding: 18px 20px; margin-bottom: 20px;
          box-shadow: 0 2px 12px rgba(15,23,42,0.05);
        }
        .up-bio-label { font-size: 11px; font-weight: 800; color: #10b981; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
        .up-bio-text { font-size: 15px; color: #334155; line-height: 1.75; margin: 0; white-space: pre-wrap; }

        .up-stats {
          display: flex; border: 1px solid rgba(226,232,240,0.6); border-radius: 18px; overflow: hidden;
          margin-bottom: 20px; background: rgba(255,255,255,0.88);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          box-shadow: 0 2px 12px rgba(15,23,42,0.05);
        }
        .up-stat { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 18px 12px; border-right: 1px solid #e2e8f0; }
        .up-stat:last-child { border-right: none; }
        .up-stat strong { font-size: 24px; font-weight: 900; color: #0f172a; }
        .up-stat span { font-size: 12px; color: #64748b; margin-top: 3px; }
        .up-stat-btn { background: none; border: none; cursor: pointer; font-family: inherit; transition: background 0.15s; }
        .up-stat-btn:hover { background: rgba(240,253,244,0.8); }
        .up-stat-btn:hover strong { color: #10b981; }

        .up-contact { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 24px; }
        .up-contact-item {
          display: flex; align-items: center; gap: 6px; padding: 7px 13px;
          background: rgba(255,255,255,0.82); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
          border: 1px solid #e2e8f0; border-radius: 999px;
          font-size: 13px; color: #334155; font-weight: 600; text-decoration: none;
        }
        .up-contact-item:hover { background: rgba(240,253,244,0.9); border-color: #a7f3d0; }

        .up-tab-bar { display: flex; gap: 4px; border-bottom: 2px solid rgba(241,245,249,0.8); margin-bottom: 20px; }
        .up-tab {
          padding: 10px 20px; border-radius: 10px 10px 0 0; border: none;
          background: transparent; font-size: 13px; font-weight: 700; color: #94a3b8;
          cursor: pointer; font-family: inherit; transition: 0.15s;
          display: flex; align-items: center; gap: 6px;
        }
        .up-tab.active { color: #2563eb; border-bottom: 2px solid #2563eb; background: rgba(239,246,255,0.8); }
        .up-tab:hover:not(.active) { background: rgba(248,250,252,0.7); color: #64748b; }
        .up-tab-count { font-size: 11px; background: #e2e8f0; color: #475569; padding: 1px 7px; border-radius: 999px; font-weight: 800; }

        .up-private-box {
          text-align: center; padding: 64px 20px;
          background: rgba(255,255,255,0.88); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          border-radius: 20px; border: 1px solid #e2e8f0; margin: 24px 0; color: #64748b; font-size: 14px;
        }

        .up-trips-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }

        .up-rv-card {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          border: 1.5px solid rgba(226,232,240,0.7); border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(15,23,42,0.06);
          transition: box-shadow 0.18s, transform 0.18s;
        }
        .up-rv-card:hover { box-shadow: 0 8px 28px rgba(15,23,42,0.11); transform: translateY(-2px); }
        .up-rv-hidden { opacity: 0.55; border-style: dashed; }

        @media (max-width: 640px) {
          .up-hero-wrapper { padding: 12px 12px 0; }
          .up-hero { height: 200px; border-radius: 16px; }
          .up-avatar-row { padding: 0 20px; }
          .up-avatar-wrap { margin-top: -42px; position: relative; z-index: 10; }
          .up-avatar, .up-avatar-circle { width: 80px; height: 80px; font-size: 28px; border-width: 3px; }
          .up-body { padding-top: 52px; padding-left: 12px; padding-right: 12px; }
          .up-displayname { font-size: 19px; }
          .up-trips-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <Suspense fallback={<div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#94a3b8"}}>Loading...</div>}>
      <UserProfileInner />
    </Suspense>
  );
}

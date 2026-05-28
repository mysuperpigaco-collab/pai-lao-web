"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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

// ── ลดขนาดรูปก่อน upload ────────────────────────────────────
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
  // fallback chain: slideshow → coverUrl → hero-bg
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
      {/* dark overlay for text readability */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.28) 100%)", pointerEvents: "none" }} />
      {all.length > 1 && (
        <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
          {all.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{
              width: i === idx ? 22 : 8, height: 8, borderRadius: 999, border: "none", cursor: "pointer",
              background: i === idx ? "#fff" : "rgba(255,255,255,0.5)", padding: 0, transition: "all 0.25s"
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cover Manager (เจ้าของเท่านั้น) ─────────────────────────
function CoverManager({ username, covers, onUpdate }: {
  username: string; covers: string[]; onUpdate: (c: string[]) => void;
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
      const res = await fetch(`/api/users/${username}/covers`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) onUpdate(data.profileCovers ?? []);
      else alert(data.message ?? "Upload failed");
    } catch { alert("Error uploading"); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const remove = async (url: string) => {
    if (!confirm("Remove this photo from slideshow?")) return;
    const res = await fetch(`/api/users/${username}/covers`, {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (res.ok) onUpdate(data.profileCovers ?? []);
  };

  return (
    <div className="up-cover-manager">
      {preview && (
        <div className="up-preview-overlay" onClick={() => setPreview(null)}>
          <img src={preview} alt="preview" className="up-preview-img" onClick={e => e.stopPropagation()} />
          <button className="up-preview-close" onClick={() => setPreview(null)}>x</button>
        </div>
      )}
      <div className="up-cm-header">
        <span>Slideshow Cover Photos ({covers.length}/5)</span>
      </div>
      <div className="up-cm-thumbs">
        {covers.map((url, i) => (
          <div key={i} className="up-cm-thumb">
            <img src={url} alt="" className="up-cm-thumb-img" onClick={() => setPreview(url)} />
            <div className="up-cm-thumb-overlay">
              <button onClick={() => setPreview(url)} className="up-cm-eye">Preview</button>
              <button onClick={() => remove(url)} className="up-cm-del">Remove</button>
            </div>
          </div>
        ))}
        {covers.length < 5 && (
          <label className="up-cm-add">
            {uploading ? <span className="up-cm-spin">...</span> : <><span style={{fontSize:22}}>+</span><span style={{fontSize:11,marginTop:2}}>Add photo</span></>}
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={upload} disabled={uploading} />
          </label>
        )}
      </div>
      <p className="up-cm-hint">Click a photo to preview · auto-rotates every 4s · max 5 photos</p>
    </div>
  );
}

// ── Followers / Following Modal ──────────────────────────────
function UserListModal({ title, users, onClose }: { title: string; users: FollowUser[]; onClose: () => void }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"white",borderRadius:20,width:"100%",maxWidth:420,maxHeight:"80vh",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"18px 20px 14px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <h3 style={{fontWeight:800,fontSize:16,color:"#0f172a",margin:0}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94a3b8"}}>x</button>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"10px 12px"}}>
          {users.length === 0
            ? <p style={{textAlign:"center",color:"#94a3b8",padding:"24px 0",fontSize:14}}>No users yet</p>
            : users.map(u => {
                const name = u.displayName || u.firstName;
                return (
                  <Link key={u.id} href={`/user/${u.username}`} onClick={onClose}
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
  return <span style={{color:"#f59e0b",letterSpacing:1}}>{"★".repeat(n)}{"☆".repeat(5-n)}</span>;
}

function fmt(n?: number) { return n == null ? 0 : n >= 1000 ? (n/1000).toFixed(1)+"k" : n; }

// ── Modern Trip Card (same style as homepage) ─────────────────
function ModernTripCard({ trip, ownerAvatar, ownerName }: { trip: TripCard; ownerAvatar?: string; ownerName: string }) {
  const [hovered, setHovered] = useState(false);
  const province = trip.province?.split(" (")[0] ?? trip.location?.split(",").pop()?.trim() ?? "";
  return (
    <Link href={`/trips/${trip.slug}`}
      style={{
        display:"flex", flexDirection:"column", borderRadius:20, overflow:"hidden",
        background:"rgba(255,255,255,0.88)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
        textDecoration:"none", color:"inherit",
        boxShadow: hovered ? "0 16px 36px rgba(15,23,42,.15)" : "0 2px 12px rgba(15,23,42,.06)",
        border:"1px solid rgba(226,232,240,0.6)",
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
        transition:"transform .22s ease, box-shadow .22s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      {/* Image */}
      <div style={{position:"relative", height:164, overflow:"hidden", background:"#e2e8f0", flexShrink:0}}>
        <img src={trip.coverUrl} alt={trip.title} loading="lazy"
          style={{width:"100%", height:"100%", objectFit:"cover", display:"block",
            transform: hovered ? "scale(1.06)" : "scale(1)", transition:"transform .35s ease"}} />
        {/* gradient overlay */}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top, rgba(15,23,42,.55) 0%, transparent 55%)",pointerEvents:"none"}} />
        {/* chips */}
        {province && <span style={{position:"absolute",top:10,left:10,background:"rgba(255,255,255,.88)",color:"#0f172a",fontSize:11,fontWeight:800,padding:"4px 10px",borderRadius:999,backdropFilter:"blur(6px)"}}>
          {province}
        </span>}
        {trip.mood && <span style={{position:"absolute",bottom:10,left:10,background:"rgba(99,102,241,.85)",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:999,backdropFilter:"blur(4px)"}}>
          {trip.mood}
        </span>}
      </div>
      {/* Body */}
      <div style={{padding:"12px 14px 13px", flex:1, display:"flex", flexDirection:"column", gap:6}}>
        <h4 style={{fontSize:14, fontWeight:800, color:"#1e293b", margin:0, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any, lineHeight:1.35}}>
          {trip.title}
        </h4>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:6, marginTop:"auto", paddingTop:6, borderTop:"1px solid rgba(241,245,249,0.8)"}}>
          {/* author */}
          <div style={{display:"flex", alignItems:"center", gap:6, minWidth:0, overflow:"hidden"}}>
            {ownerAvatar
              ? <img src={ownerAvatar} alt={ownerName} style={{width:22,height:22,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"1.5px solid #e2e8f0"}} />
              : <div style={{width:22,height:22,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#06b6d4)",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {ownerName.charAt(0)}
                </div>}
            <span style={{fontSize:11,fontWeight:700,color:"#475569",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ownerName}</span>
          </div>
          {/* stats */}
          <div style={{display:"flex",gap:6,flexShrink:0,fontSize:11,fontWeight:700,color:"#94a3b8"}}>
            {(trip.viewCount ?? 0) > 0 && <span>👁 {fmt(trip.viewCount)}</span>}
            <span>❤️ {fmt(trip._count.likes)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function UserProfilePage() {
  const { user: me } = useAuth();
  const params = useParams();
  const username = params?.username as string;

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

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetch(`/api/users/${encodeURIComponent(username)}`)
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
    fetch(`/api/users/${encodeURIComponent(username)}/reviews`)
      .then(r => r.json())
      .then(data => { setReviews(data.reviews ?? []); setReviewsOwn(data.isOwn ?? false); })
      .catch(() => {});
  }, [activeTab, username]);

  const openFollowModal = async (type: "followers"|"following") => {
    setFollowModal(type); setFollowLoading(true);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}/followers?type=${type}`);
      setFollowUsers((await res.json()).users ?? []);
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
    <div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#94a3b8",fontSize:16}}>
      Loading...
    </div>
  );
  if (notFound || !user) return (
    <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
      <div style={{fontSize:48}}>404</div>
      <h2 style={{fontSize:20,fontWeight:800,color:"#1e293b"}}>User not found</h2>
      <Link href="/" style={{color:"#10b981",fontWeight:700}}>Back to home</Link>
    </div>
  );

  const displayName = user.displayName || user.firstName;
  const joinYear = user.createdAt ? new Date(user.createdAt).getFullYear() : "";
  const isOwnProfile = me?.username === user.username;

  return (
    <div className="up-page">
      {followModal && (
        <UserListModal
          title={followModal === "followers"
            ? `Followers (${user._count?.followers ?? 0})`
            : `Following (${user._count?.following ?? 0})`}
          users={followLoading ? [] : followUsers}
          onClose={() => { setFollowModal(null); setFollowUsers([]); }}
        />
      )}

      {/* Cover Slideshow */}
      <div className="up-cover">
        <CoverSlideshow images={covers} defaultCover={user.coverUrl} />
      </div>

      <div className="up-body">
        {/* Avatar */}
        <div className="up-avatar-wrap">
          {user.avatarUrl
            ? <img src={user.avatarUrl} alt={displayName} className="up-avatar" />
            : <div className="up-avatar-circle">{displayName.charAt(0).toUpperCase()}</div>}
        </div>

        {/* Name row */}
        <div className="up-name-row">
          <div className="up-name-col">
            <h1 className="up-displayname">{displayName}</h1>
            <span className="up-username">@{user.username}</span>
            {joinYear && <span className="up-since">Member since {joinYear}</span>}
          </div>
          {isOwnProfile && (
            <Link href="/dashboard/edit-profile" className="up-edit-btn">Edit Profile</Link>
          )}
        </div>

        {isOwnProfile && (
          <CoverManager username={username} covers={covers} onUpdate={setCovers} />
        )}

        {user.isPrivate ? (
          <div className="up-private-box">
            <div style={{fontSize:36}}>Private Profile</div>
            <p>This user has set their profile to private.</p>
          </div>
        ) : (
          <>
            {user._count && (
              <div className="up-stats">
                <div className="up-stat">
                  <strong>{user._count.trips}</strong>
                  <span>Trips</span>
                </div>
                <button className="up-stat up-stat-btn" onClick={() => openFollowModal("followers")}>
                  <strong>{user._count.followers}</strong>
                  <span>Followers</span>
                </button>
                <button className="up-stat up-stat-btn" onClick={() => openFollowModal("following")}>
                  <strong>{user._count.following}</strong>
                  <span>Following</span>
                </button>
              </div>
            )}

            {user.bio && <p className="up-bio">{user.bio}</p>}

            <div className="up-contact">
              {user.email     && <a href={`mailto:${user.email}`} className="up-contact-item">Email: {user.email}</a>}
              {user.phone     && <span className="up-contact-item">Tel: {user.phone}</span>}
              {user.lineId    && <span className="up-contact-item">LINE: {user.lineId}</span>}
              {user.facebook  && <a href={user.facebook.startsWith("http")?user.facebook:`https://facebook.com/${user.facebook}`} target="_blank" rel="noopener" className="up-contact-item">FB: {user.facebook}</a>}
              {user.instagram && <a href={`https://instagram.com/${user.instagram.replace("@","")}`} target="_blank" rel="noopener" className="up-contact-item">IG: {user.instagram}</a>}
              {user.tiktok    && <a href={`https://tiktok.com/@${user.tiktok.replace("@","")}`} target="_blank" rel="noopener" className="up-contact-item">TikTok: {user.tiktok}</a>}
            </div>

            <div className="up-tab-bar">
              <button className={`up-tab${activeTab==="trips"?" active":""}`} onClick={() => setActiveTab("trips")}>
                Trips <span className="up-tab-count">{trips.length}</span>
              </button>
              <button className={`up-tab${activeTab==="reviews"?" active":""}`} onClick={() => setActiveTab("reviews")}>
                Reviews
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
                <div style={{textAlign:"center",padding:"48px 20px",color:"#94a3b8"}}>
                  <div style={{fontSize:40,marginBottom:10}}>No trips yet</div>
                </div>
              )
            )}

            {activeTab === "reviews" && (
              <div>
                {reviewsOwn && (
                  <div style={{fontSize:12,color:"#64748b",background:"rgba(248,250,252,0.9)",border:"1px solid #e2e8f0",borderRadius:10,padding:"8px 14px",marginBottom:16}}>
                    Click hide/show to control visibility of your reviews on your profile.
                  </div>
                )}
                {reviews.length === 0 ? (
                  <div style={{textAlign:"center",padding:"48px 20px",color:"#94a3b8"}}>
                    <p style={{fontSize:15}}>No reviews yet</p>
                  </div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    {reviews.map(rv => {
                      const dest = rv.trip ? `/trips/${rv.trip.slug}` : rv.place ? `/place/${rv.place.slug}` : "#";
                      const destTitle = rv.trip?.title ?? rv.place?.title ?? "Content";
                      const coverUrl = rv.trip?.coverUrl ?? rv.place?.coverUrl ?? null;
                      return (
                        <div key={rv.id} style={{background:rv.isHidden?"rgba(248,250,252,0.88)":"rgba(255,255,255,0.88)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:`1.5px solid ${rv.isHidden?"#e2e8f0":"#f1f5f9"}`,borderRadius:16,overflow:"hidden",opacity:rv.isHidden?0.6:1}}>
                          <div style={{display:"flex",alignItems:"stretch"}}>
                            {coverUrl && <div style={{width:80,flexShrink:0,overflow:"hidden"}}><img src={coverUrl} alt={destTitle} style={{width:"100%",height:"100%",objectFit:"cover"}} /></div>}
                            <div style={{flex:1,padding:"12px 14px"}}>
                              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:4}}>
                                <Link href={dest} style={{fontSize:13,fontWeight:700,color:"#1e293b",textDecoration:"none"}}>{destTitle}</Link>
                                <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                                  {rv.isHidden && <span style={{fontSize:10,fontWeight:800,background:"#fef2f2",color:"#b91c1c",padding:"2px 8px",borderRadius:999}}>Hidden</span>}
                                  {reviewsOwn && (
                                    <button onClick={() => toggleReviewHidden(rv.id)} style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999,border:`1px solid ${rv.isHidden?"#bbf7d0":"#fecaca"}`,background:rv.isHidden?"#f0fdf4":"#fff5f5",color:rv.isHidden?"#15803d":"#b91c1c",cursor:"pointer",fontFamily:"inherit"}}>
                                      {rv.isHidden ? "Show" : "Hide"}
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div style={{marginBottom:4}}><Stars n={rv.rating} /></div>
                              {!rv.isAnonymous && rv.text && (
                                <p style={{fontSize:13,color:"#374151",margin:"0 0 4px",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden"}}>{rv.text}</p>
                              )}
                              <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>
                                {rv.isAnonymous && <span style={{marginRight:8}}>Anonymous</span>}
                                {new Date(rv.createdAt).toLocaleDateString("th-TH")}
                                {rv.likes > 0 && <span style={{marginLeft:8}}>Liked {rv.likes}</span>}
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
        .up-page { min-height: 100vh; background: transparent; padding-bottom: 60px; }

        .up-cover { width: 100%; height: 240px; position: relative; overflow: hidden; background: #1a3a2a; }

        .up-body { max-width: 860px; margin: 0 auto; padding: 20px 20px 0; }

        .up-avatar-wrap { margin-bottom: 0; }
        .up-avatar, .up-avatar-circle {
          width: 96px; height: 96px; border-radius: 50%;
          border: 4px solid white; box-shadow: 0 4px 20px rgba(0,0,0,0.22); display: block;
        }
        .up-avatar { object-fit: cover; }
        .up-avatar-circle {
          background: linear-gradient(135deg, #10b981, #3b82f6);
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 34px; font-weight: 900;
        }

        .up-name-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-top: 14px; margin-bottom: 16px; flex-wrap: wrap; }
        .up-name-col { flex: 1; min-width: 0; }
        .up-displayname { font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 2px; }
        .up-username { font-size: 13px; color: #64748b; font-weight: 600; display: block; }
        .up-since { font-size: 12px; color: #94a3b8; display: block; margin-top: 2px; }
        .up-edit-btn {
          padding: 7px 16px; border-radius: 10px;
          background: rgba(255,255,255,0.88); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          border: 1.5px solid #e2e8f0; color: #475569; font-weight: 700; font-size: 13px;
          text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
          flex-shrink: 0; white-space: nowrap;
        }
        .up-edit-btn:hover { background: white; }

        /* Cover Manager */
        .up-cover-manager {
          background: rgba(255,255,255,0.88); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          border: 1.5px solid rgba(16,185,129,0.2); border-radius: 16px;
          padding: 14px 16px 12px; margin-bottom: 20px;
        }
        .up-cm-header { font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 12px; }
        .up-cm-thumbs { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .up-cm-thumb {
          position: relative; width: 110px; height: 70px; border-radius: 10px;
          overflow: hidden; border: 2px solid #e2e8f0; flex-shrink: 0; cursor: pointer;
        }
        .up-cm-thumb-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .up-cm-thumb-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.52);
          display: flex; align-items: center; justify-content: center; gap: 5px;
          opacity: 0; transition: opacity 0.18s;
        }
        .up-cm-thumb:hover .up-cm-thumb-overlay { opacity: 1; }
        .up-cm-eye, .up-cm-del {
          border: none; border-radius: 8px; font-size: 10px; padding: 4px 8px;
          cursor: pointer; font-family: inherit; font-weight: 700;
        }
        .up-cm-eye { background: rgba(255,255,255,0.92); color: #1e293b; }
        .up-cm-del { background: rgba(239,68,68,0.9); color: white; }
        .up-cm-add {
          width: 110px; height: 70px; border-radius: 10px;
          border: 2px dashed #a7f3d0; background: rgba(240,253,244,0.7);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          cursor: pointer; color: #059669; font-weight: 700; transition: background 0.15s; flex-shrink: 0;
        }
        .up-cm-add:hover { background: rgba(209,250,229,0.9); }
        .up-cm-spin { font-size: 18px; }
        .up-cm-hint { font-size: 11px; color: #94a3b8; margin: 8px 0 0; }

        /* Preview overlay */
        .up-preview-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.82); z-index: 9999;
          display: flex; align-items: center; justify-content: center; padding: 20px; cursor: pointer;
        }
        .up-preview-img {
          max-width: 92vw; max-height: 82vh; border-radius: 12px;
          object-fit: contain; box-shadow: 0 20px 60px rgba(0,0,0,0.4); cursor: default;
        }
        .up-preview-close {
          position: fixed; top: 20px; right: 24px;
          background: rgba(255,255,255,0.15); border: none; color: white; font-size: 16px;
          width: 38px; height: 38px; border-radius: 50%; cursor: pointer; font-weight: 900;
        }

        /* Stats */
        .up-stats {
          display: flex; border: 1px solid rgba(226,232,240,0.6); border-radius: 16px; overflow: hidden;
          margin-bottom: 20px; background: rgba(255,255,255,0.88);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        }
        .up-stat { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 16px; border-right: 1px solid #e2e8f0; }
        .up-stat:last-child { border-right: none; }
        .up-stat strong { font-size: 22px; font-weight: 900; color: #0f172a; }
        .up-stat span { font-size: 12px; color: #64748b; margin-top: 2px; text-align: center; }
        .up-stat-btn { background: none; border: none; cursor: pointer; font-family: inherit; transition: background 0.15s; }
        .up-stat-btn:hover { background: #f0fdf4; }
        .up-stat-btn:hover strong { color: #10b981; }

        .up-bio {
          font-size: 15px; color: #334155; line-height: 1.7; margin-bottom: 16px;
          padding: 14px 16px; background: rgba(255,255,255,0.82);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          border-radius: 12px; border: 1px solid rgba(226,232,240,0.5);
        }
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
          padding: 9px 18px; border-radius: 10px 10px 0 0; border: none;
          background: transparent; font-size: 13px; font-weight: 700; color: #94a3b8;
          cursor: pointer; font-family: inherit; transition: 0.15s;
          display: flex; align-items: center; gap: 6px;
        }
        .up-tab.active { color: #2563eb; border-bottom: 2px solid #2563eb; background: rgba(239,246,255,0.8); }
        .up-tab:hover:not(.active) { background: rgba(248,250,252,0.7); color: #64748b; }
        .up-tab-count { font-size: 11px; background: #e2e8f0; color: #475569; padding: 1px 7px; border-radius: 999px; font-weight: 800; }

        .up-private-box {
          text-align: center; padding: 60px 20px;
          background: rgba(255,255,255,0.88); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          border-radius: 20px; border: 1px solid #e2e8f0; margin: 24px 0;
          color: #64748b; font-size: 14px;
        }

        /* Trip grid */
        .up-trips-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }

        @media (max-width: 640px) {
          .up-cover { height: 170px; }
          .up-avatar, .up-avatar-circle { width: 72px; height: 72px; font-size: 26px; }
          .up-displayname { font-size: 17px; }
          .up-trips-grid { grid-template-columns: 1fr 1fr; }
          .up-cm-thumb, .up-cm-add { width: 86px; height: 56px; }
        }
      `}</style>
    </div>
  );
}

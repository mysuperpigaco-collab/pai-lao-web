"use client";

import { useState, useEffect, CSSProperties } from "react";
import Link from "next/link";
import TripSlider from "@/components/home/TripSlider";
import ExplorerSection from "@/components/home/ExplorerSection";
import AutoGridSection from "@/components/home/AutoGridSection";
import { useAuth } from "@/context/AuthContext";

interface Trip {
  slug: string;
  title: string;
  coverUrl?: string | null;
  province?: string | null;
  mood?: string | null;
  author?: { displayName?: string | null; firstName?: string; avatarUrl?: string | null } | null;
  createdAt: string;
  avgRating?: number | null;
  _count?: { reviews: number; bookmarks: number; likes: number };
}

// ── Rank config ──────────────────────────────────────────────────────────────
const RANK_META: Record<number, { emoji: string; color: string; glow: string }> = {
  0: { emoji: "🥇", color: "#f59e0b", glow: "0 0 20px rgba(245,158,11,0.35)" },
  1: { emoji: "🥈", color: "#94a3b8", glow: "0 0 20px rgba(148,163,184,0.25)" },
  2: { emoji: "🥉", color: "#cd7c2f", glow: "0 0 20px rgba(205,124,47,0.25)" },
};

// ── Hero Card (rank 1) ───────────────────────────────────────────────────────
function HeroCard({ trip }: { trip: Trip }) {
  const [hovered, setHovered] = useState(false);
  const bm = trip._count?.bookmarks ?? 0;
  const likes = trip._count?.likes ?? 0;
  const reviews = trip._count?.reviews ?? 0;

  return (
    <Link
      href={`/trips/${trip.slug}`}
      style={{
        display: "block",
        position: "relative",
        borderRadius: 24,
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        height: 320,
        boxShadow: hovered
          ? "0 20px 50px rgba(15,23,42,0.22), " + RANK_META[0].glow
          : "0 6px 24px rgba(15,23,42,0.10)",
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
        transition: "box-shadow 0.3s, transform 0.3s",
        border: `2.5px solid ${RANK_META[0].color}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      {trip.coverUrl ? (
        <img
          src={trip.coverUrl}
          alt={trip.title}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover",
            transform: hovered ? "scale(1.04)" : "scale(1)",
            transition: "transform 0.4s",
          }}
          loading="lazy"
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, background: "linear-gradient(135deg,#1e293b,#334155)" }}>🏞️</div>
      )}

      {/* Gradient overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,10,20,0.88) 0%, rgba(5,10,20,0.4) 50%, transparent 100%)" }} />

      {/* Rank badge */}
      <div style={{
        position: "absolute", top: 16, left: 16, zIndex: 2,
        display: "flex", alignItems: "center", gap: 6,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
        padding: "5px 14px", borderRadius: 999,
        border: `1.5px solid ${RANK_META[0].color}`,
      }}>
        <span style={{ fontSize: 18 }}>{RANK_META[0].emoji}</span>
        <span style={{ fontSize: 12, fontWeight: 900, color: RANK_META[0].color }}>อันดับ 1</span>
      </div>

      {/* Bookmark pill */}
      {bm > 0 && (
        <div style={{
          position: "absolute", top: 16, right: 16, zIndex: 2,
          background: "rgba(245,158,11,0.9)", color: "white",
          fontSize: 12, fontWeight: 800, padding: "4px 12px", borderRadius: 999,
        }}>
          🔖 {bm}
        </div>
      )}

      {/* Bottom content */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2, padding: "24px 24px 22px" }}>
        <h3 style={{ fontSize: 26, fontWeight: 900, color: "white", margin: "0 0 8px", lineHeight: 1.3, textShadow: "0 2px 6px rgba(0,0,0,0.5)" }}>
          {trip.title}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          {trip.province && (
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: 4 }}>
              📍 {trip.province}
            </span>
          )}
          {trip.author && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
              {trip.author.avatarUrl
                ? <img src={trip.author.avatarUrl} alt="" style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(255,255,255,0.5)" }} />
                : <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>
                    {(trip.author.displayName || trip.author.firstName || "").slice(0,1).toUpperCase()}
                  </span>
              }
              โดย {trip.author.displayName || trip.author.firstName}
            </span>
          )}
        </div>
        {/* Stats */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(trip.avgRating ?? 0) > 0 && (
            <span style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.5)", color: "#fde68a", fontSize: 12, fontWeight: 800, padding: "3px 10px", borderRadius: 999, backdropFilter: "blur(4px)" }}>
              ⭐ {trip.avgRating!.toFixed(1)}
            </span>
          )}
          {likes > 0 && (
            <span style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5", fontSize: 12, fontWeight: 800, padding: "3px 10px", borderRadius: 999, backdropFilter: "blur(4px)" }}>
              ❤️ {likes}
            </span>
          )}
          {reviews > 0 && (
            <span style={{ background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.4)", color: "#93c5fd", fontSize: 12, fontWeight: 800, padding: "3px 10px", borderRadius: 999, backdropFilter: "blur(4px)" }}>
              💬 {reviews}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Medium Card (rank 2–3) ────────────────────────────────────────────────────
function MedCard({ trip, rank }: { trip: Trip; rank: number }) {
  const [hovered, setHovered] = useState(false);
  const meta = RANK_META[rank] ?? RANK_META[2];
  const bm = trip._count?.bookmarks ?? 0;
  const likes = trip._count?.likes ?? 0;
  const reviews = trip._count?.reviews ?? 0;

  return (
    <Link
      href={`/trips/${trip.slug}`}
      style={{
        display: "block",
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        height: 220,
        boxShadow: hovered ? "0 14px 36px rgba(15,23,42,0.16)" : "0 4px 16px rgba(15,23,42,0.08)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "box-shadow 0.25s, transform 0.25s",
        border: `2px solid ${meta.color}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {trip.coverUrl ? (
        <img
          src={trip.coverUrl}
          alt={trip.title}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover",
            transform: hovered ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.35s",
          }}
          loading="lazy"
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, background: "linear-gradient(135deg,#1e293b,#334155)" }}>🏞️</div>
      )}

      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,10,20,0.85) 0%, rgba(5,10,20,0.3) 55%, transparent 100%)" }} />

      {/* Rank badge */}
      <div style={{
        position: "absolute", top: 12, left: 12, zIndex: 2,
        display: "flex", alignItems: "center", gap: 5,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
        padding: "4px 11px", borderRadius: 999,
        border: `1.5px solid ${meta.color}`,
      }}>
        <span style={{ fontSize: 15 }}>{meta.emoji}</span>
        <span style={{ fontSize: 11, fontWeight: 900, color: meta.color }}>อันดับ {rank + 1}</span>
      </div>

      {bm > 0 && (
        <div style={{
          position: "absolute", top: 12, right: 12, zIndex: 2,
          background: "rgba(245,158,11,0.85)", color: "white",
          fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 999,
        }}>
          🔖 {bm}
        </div>
      )}

      {/* Bottom content */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2, padding: "14px 16px 14px" }}>
        <h4 style={{ fontSize: 16, fontWeight: 900, color: "white", margin: "0 0 6px", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
          {trip.title}
        </h4>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {trip.province && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>📍 {trip.province}</span>}
          {(trip.avgRating ?? 0) > 0 && <span style={{ fontSize: 11, color: "#fde68a", fontWeight: 700 }}>⭐ {trip.avgRating!.toFixed(1)}</span>}
          {likes > 0 && <span style={{ fontSize: 11, color: "#fca5a5", fontWeight: 700 }}>❤️ {likes}</span>}
          {reviews > 0 && <span style={{ fontSize: 11, color: "#93c5fd", fontWeight: 700 }}>💬 {reviews}</span>}
        </div>
      </div>
    </Link>
  );
}

// ── Small Card (rank 4–10) ────────────────────────────────────────────────────
function SmallCard({ trip, rank }: { trip: Trip; rank: number }) {
  const [hovered, setHovered] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const bm = trip._count?.bookmarks ?? 0;
  const likes = trip._count?.likes ?? 0;
  const reviews = trip._count?.reviews ?? 0;

  return (
    <Link
      href={`/trips/${trip.slug}`}
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: 16,
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        boxShadow: hovered ? "0 10px 28px rgba(15,23,42,0.13)" : "0 2px 10px rgba(15,23,42,0.06)",
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
        transition: "box-shadow 0.25s, transform 0.25s",
        border: "1px solid #f1f5f9",
        background: "white",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div style={{ position: "relative", paddingBottom: "62%", background: "#e2e8f0", overflow: "hidden", flexShrink: 0 }}>
        {trip.coverUrl && !imgErr ? (
          <img
            src={trip.coverUrl}
            alt={trip.title}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover",
              transform: hovered ? "scale(1.06)" : "scale(1)",
              transition: "transform 0.35s",
            }}
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, background: "linear-gradient(135deg,#e2e8f0,#cbd5e1)" }}>🏞️</div>
        )}
        {/* Gradient */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,20,0.65) 0%, transparent 55%)" }} />
        {/* Rank num */}
        <div style={{
          position: "absolute", top: 8, left: 8, zIndex: 2,
          background: "rgba(15,23,42,0.72)", backdropFilter: "blur(4px)",
          color: "white", fontSize: 10, fontWeight: 900,
          padding: "2px 8px", borderRadius: 999,
        }}>
          #{rank + 1}
        </div>
        {bm > 0 && (
          <div style={{
            position: "absolute", top: 8, right: 8, zIndex: 2,
            background: "rgba(0,0,0,0.55)", color: "white",
            fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
          }}>
            🔖 {bm}
          </div>
        )}
        {/* Title overlay */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2, padding: "8px 10px" }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "white", margin: 0, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
            {trip.title}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", borderTop: "1px solid #f1f5f9" }}>
        {trip.province && <span style={{ fontSize: 10, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "50%" }}>📍 {trip.province}</span>}
        <span style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          {(trip.avgRating ?? 0) > 0 && <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700 }}>⭐{trip.avgRating!.toFixed(1)}</span>}
          {likes > 0 && <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 700 }}>❤️{likes}</span>}
          {reviews > 0 && <span style={{ fontSize: 10, color: "#3b82f6", fontWeight: 700 }}>💬{reviews}</span>}
        </span>
      </div>
    </Link>
  );
}


// ── Invite Card (fills empty grid slots) ─────────────────────────────────────
function InviteCard({ user }: { user: { role?: string } | null }) {
  const [hovered, setHovered] = useState(false);
  const href = user
    ? (user.role === "BUSINESS" ? "/business/dashboard" : "/trips/create")
    : "/signup";

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 16,
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        border: "2px dashed " + (hovered ? "#10b981" : "#cbd5e1"),
        background: hovered
          ? "linear-gradient(135deg,#ecfdf5,#d1fae5)"
          : "linear-gradient(135deg,#f8fafc,#f1f5f9)",
        transition: "all 0.25s",
        boxShadow: hovered ? "0 8px 24px rgba(16,185,129,0.15)" : "none",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        cursor: "pointer",
        padding: "20px 12px",
        textAlign: "center",
        minHeight: 160,
        gap: 10,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: 52, height: 52, borderRadius: "50%",
        background: hovered
          ? "linear-gradient(135deg,#10b981,#06b6d4)"
          : "linear-gradient(135deg,#e2e8f0,#cbd5e1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, transition: "all 0.25s",
        boxShadow: hovered ? "0 4px 14px rgba(16,185,129,0.35)" : "none",
      }}>
        ✍️
      </div>
      <p style={{
        fontSize: 13, fontWeight: 800,
        color: hovered ? "#065f46" : "#475569",
        margin: 0, lineHeight: 1.4,
        transition: "color 0.25s",
      }}>
        {user ? "เขียนเรื่องเล่าของคุณ" : "เข้าร่วมและเล่าเรื่อง"}
      </p>
      <p style={{ fontSize: 11, color: hovered ? "#059669" : "#94a3b8", margin: 0, lineHeight: 1.5, transition: "color 0.25s" }}>
        {user ? "แชร์ประสบการณ์การท่องเที่ยว\nให้คนอื่นได้แรงบันดาลใจ" : "สมัครฟรี · Join for free"}
      </p>
      <span style={{
        marginTop: 4,
        display: "inline-flex", alignItems: "center", gap: 5,
        background: hovered ? "linear-gradient(135deg,#10b981,#06b6d4)" : "#e2e8f0",
        color: hovered ? "white" : "#64748b",
        fontSize: 11, fontWeight: 800,
        padding: "5px 14px", borderRadius: 999,
        transition: "all 0.25s",
        boxShadow: hovered ? "0 3px 10px rgba(16,185,129,0.3)" : "none",
      }}>
        {user ? "เขียนเลย →" : "สมัครเลย →"}
      </span>
    </Link>
  );
}

// ── Responsive columns hook ──────────────────────────────────────────────────
function useSmallCols() {
  const [cols, setCols] = useState(4);
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setCols(w <= 540 ? 2 : w <= 860 ? 3 : 4);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return cols;
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user } = useAuth();
  const [showArchive, setShowArchive] = useState(false);
  const [archiveTrips, setArchiveTrips] = useState<Trip[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const smallCols = useSmallCols();

  useEffect(() => {
    if (!showArchive || archiveTrips.length > 0) return;
    setArchiveLoading(true);
    fetch(`/api/trips?limit=10&sort=popular`)
      .then(r => r.json())
      .then(d => { setArchiveTrips(d.trips ?? []); setArchiveLoading(false); })
      .catch(() => setArchiveLoading(false));
  }, [showArchive]);

  const [btnHovered, setBtnHovered] = useState(false);

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 20px 80px" }}>

      {/* ─── Spotlight header ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", margin: "0 0 6px" }}>
            ✨ เรื่องเล่า <span style={{ color: "#2563eb" }}>Spotlight</span>
          </h2>
          <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>เรื่องเล่าการเดินทางยอดนิยม · Most popular travel stories</p>
        </div>
        {user ? (
          <Link href={user.role === "BUSINESS" ? "/business/dashboard" : "/dashboard"} style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "9px 18px", borderRadius: 999,
            background: "linear-gradient(135deg,#10b981,#06b6d4)",
            color: "#fff", fontWeight: 800, fontSize: 13,
            textDecoration: "none", whiteSpace: "nowrap",
            boxShadow: "0 4px 14px rgba(16,185,129,0.28)",
          }}>
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt="" style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(255,255,255,0.6)" }} />
              : <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900 }}>
                  {(user.displayName || user.firstName || "").slice(0,1).toUpperCase()}
                </span>
            }
            {user.displayName || user.firstName}
          </Link>
        ) : (
          <Link href="/trips" style={{ fontSize: 14, fontWeight: 700, color: "#2563eb", textDecoration: "none" }}>ดูทั้งหมด · See all →</Link>
        )}
      </div>

      <TripSlider />

      {/* ─── Top Stories Archive ─── */}
      <div style={{ margin: "36px 0" }}>

        {/* Toggle button */}
        <button
          onClick={() => setShowArchive(v => !v)}
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 22px",
            background: showArchive
              ? "linear-gradient(135deg,#fffbeb,#fef3c7)"
              : btnHovered ? "#f8fafc" : "white",
            border: showArchive ? "1.5px solid #fde68a" : "1.5px solid #e2e8f0",
            borderRadius: showArchive ? "18px 18px 0 0" : 18,
            fontFamily: "inherit",
            cursor: "pointer",
            transition: "all 0.2s",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🏆</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: showArchive ? "#92400e" : "#334155" }}>
                คลังเรื่องเล่ายอดนิยม · Top Stories
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, color: showArchive ? "#b45309" : "#94a3b8", marginTop: 2 }}>
                10 อันดับที่คนบุ๊กมาร์คมากที่สุด · Most bookmarked stories
              </div>
            </div>
          </div>
          <span style={{
            display: "flex",
            transform: showArchive ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s",
            color: showArchive ? "#b45309" : "#94a3b8",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </span>
        </button>

        {/* Panel */}
        {showArchive && (
          <div style={{
            background: "white",
            border: "1.5px solid #fde68a",
            borderTop: "none",
            borderRadius: "0 0 18px 18px",
            padding: "24px",
            animation: "fadeSlide 0.3s ease",
          }}>
            {archiveLoading ? (
              <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8", fontSize: 15 }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                  {Array.from({ length:3 }).map((_,i) => (
                    <div key={i} style={{ borderRadius:16, overflow:"hidden", border:"1px solid #f1f5f9", background:"white" }}>
                      <div style={{ position:"relative", paddingBottom:"65%", background:"#f1f5f9", overflow:"hidden" }}>
                        <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)", backgroundSize:"200% 100%", animation:`_sh 1.5s ease infinite ${(i*0.1).toFixed(1)}s` }}/>
                      </div>
                      <div style={{ padding:"8px 12px", display:"flex", flexDirection:"column", gap:6 }}>
                        <div style={{ position:"relative", height:9, borderRadius:5, background:"#f1f5f9", overflow:"hidden" }}>
                          <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)", backgroundSize:"200% 100%", animation:`_sh 1.5s ease infinite ${(i*0.1+0.2).toFixed(1)}s` }}/>
                        </div>
                        <div style={{ position:"relative", height:7, width:"55%", borderRadius:4, background:"#f1f5f9", overflow:"hidden" }}>
                          <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)", backgroundSize:"200% 100%", animation:`_sh 1.5s ease infinite ${(i*0.1+0.3).toFixed(1)}s` }}/>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <style>{"@keyframes _sh{0%{background-position:200% 0}100%{background-position:-200% 0}}"}</style>
              </div>
            ) : archiveTrips.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8", fontSize: 15 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                ยังไม่มีเรื่องเล่า
              </div>
            ) : (
              <>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#1e293b", margin: "0 0 18px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🏆</span> 10 เรื่องเล่ายอดนิยม · Most Bookmarked Stories
                </p>

                {/* Hero — rank 1 */}
                {archiveTrips[0] && (
                  <div style={{ marginBottom: 16 }}>
                    <HeroCard trip={archiveTrips[0]} />
                  </div>
                )}

                {/* Medium — rank 2 & 3 */}
                {archiveTrips.length > 1 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 16 }}>
                    {archiveTrips.slice(1, 3).map((trip, i) => (
                      <MedCard key={trip.slug} trip={trip} rank={i + 1} />
                    ))}
                  </div>
                )}

                {/* Small — rank 4–10 + invite card */}
                {archiveTrips.length > 3 && (() => {
                  const smallTrips = archiveTrips.slice(3);
                  const remainder = smallTrips.length % smallCols;
                  const fillCount = remainder === 0 ? 0 : smallCols - remainder;
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${smallCols},1fr)`, gap: 12 }}>
                      {smallTrips.map((trip, i) => (
                        <SmallCard key={trip.slug} trip={trip} rank={i + 3} />
                      ))}
                      {Array.from({ length: fillCount }).map((_, i) => (
                        <InviteCard key={`invite-${i}`} user={user} />
                      ))}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}
      </div>

      {/* ─── Explorer ─── */}
      <ExplorerSection />

      {/* ─── Must-See ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 48, marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", margin: "0 0 6px" }}>
            🗺️ ไฮไลต์สถานที่ <span style={{ color: "#2563eb" }}>Explore Places</span>
          </h2>
          <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>
            เรื่องเล่าล่าสุดและสถานที่น่าสนใจจากทุกหมวด · Latest stories & places by category
          </p>
        </div>
      </div>
      <AutoGridSection />

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          main { padding: 16px 12px 60px !important; }
        }
      `}</style>
    </main>
  );
}

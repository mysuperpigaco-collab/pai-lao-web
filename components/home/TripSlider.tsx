"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { use3DTilt } from "@/hooks/use3DTilt";

interface Trip {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  coverUrl?: string | null;
  province?: string | null;
  location?: string | null;
  mood?: string | null;
  budget?: number | null;
  author: { displayName?: string | null; firstName: string; avatarUrl?: string | null };
  _count?: { reviews: number; bookmarks: number; likes: number };
}

type TabKey = "popular" | "trending";

const TABS: { key: TabKey; label: string; icon: string; desc: string }[] = [
  { key: "popular",  label: "ยอดนิยมตลอดกาล", icon: "🏆", desc: "วัดจากยอด Bookmark" },
  { key: "trending", label: "มาแรงล่าสุด",     icon: "🔥", desc: "ไลค์สูงใน 90 วัน"  },
];

interface TripSliderProps {
  activeTab:    TabKey;
  onTabChange:  (tab: TabKey) => void;
}

export default function TripSlider({ activeTab, onTabChange }: TripSliderProps) {
  const [current,   setCurrent  ] = useState(0);
  const [cache,     setCache    ] = useState<Record<TabKey, Trip[]>>({ popular: [], trending: [] });
  const [loadedTab, setLoadedTab] = useState<Record<TabKey, boolean>>({ popular: false, trending: false });
  const [loading,   setLoading  ] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const trips = cache[activeTab];

  const fetchTab = useCallback((tab: TabKey) => {
    setLoading(true);
    fetch(`/api/trips?limit=10&sort=${tab}`)
      .then(r => r.json())
      .then(d => {
        setCache(prev => ({ ...prev, [tab]: d.trips ?? [] }));
        setLoadedTab(prev => ({ ...prev, [tab]: true }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // load popular on mount
  useEffect(() => { fetchTab("popular"); }, [fetchTab]);

  const switchTab = (tab: TabKey) => {
    if (tab === activeTab) return;
    onTabChange(tab);
    setCurrent(0);
    if (!loadedTab[tab]) fetchTab(tab);
  };

  const restartTimer = useCallback((len: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (len <= 1) return;
    timerRef.current = setInterval(() => setCurrent(p => (p + 1) % len), 5000);
  }, []);

  useEffect(() => {
    restartTimer(trips.length);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [trips.length, activeTab, restartTimer]);

  const go   = (dir: number) => { setCurrent(p => (p + dir + trips.length) % trips.length); restartTimer(trips.length); };
  const goTo = (i: number)   => { setCurrent(i); restartTimer(trips.length); };

  // must be before any early returns (React hooks rule)
  const tilt = use3DTilt(6);

  // ── Tabs ──────────────────────────────────────────────────
  const TabBar = () => (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr",
      background: "#f1f5f9", borderRadius: 16, padding: 4,
      border: "1.5px solid #e2e8f0", marginBottom: 14,
    }}>
      {TABS.map(t => {
        const isActive = t.key === activeTab;
        const isTrending = t.key === "trending";
        return (
          <button key={t.key} onClick={() => switchTab(t.key)} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer",
            fontFamily: "inherit", fontWeight: 700, fontSize: 14, transition: "all 0.25s",
            background: isActive
              ? isTrending
                ? "linear-gradient(135deg,#f97316,#ef4444)"
                : "linear-gradient(135deg,#0ea5e9,#2563eb)"
              : "transparent",
            color: isActive ? "#fff" : "#64748b",
            boxShadow: isActive ? "0 4px 14px rgba(0,0,0,0.14)" : "none",
          }}>
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );

  // ── Skeleton ──────────────────────────────────────────────
  if (loading && trips.length === 0) {
    return (
      <div>
        <TabBar />
        <div style={{ position: "relative", height: 320, borderRadius: 24, overflow: "hidden", background: "#e2e8f0", marginBottom: 32 }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#e2e8f0 0%,#f1f5f9 45%,#e2e8f0 90%)", backgroundSize: "200% 100%", animation: "slshimmer 1.6s ease infinite" }} />
          <style>{`@keyframes slshimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div>
        <TabBar />
        <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: 24, color: "#94a3b8", fontSize: 15, marginBottom: 32 }}>
          {activeTab === "trending" ? "ยังไม่มีทริปมาแรงในช่วงนี้" : "ยังไม่มีเรื่องเล่า — เป็นคนแรกที่เล่าให้ฟัง!"}
        </div>
      </div>
    );
  }

  const trip = trips[current];
  const authorName    = trip.author?.displayName || trip.author?.firstName || "ไม่ระบุ";
  const authorInitial = authorName.slice(0, 1).toUpperCase();

  return (
    <div style={{ marginBottom: 32 }}>
      <TabBar />

      {/* ── Main Card ── */}
      <div
        ref={tilt.ref}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        className="pl-tilt"
        style={{ position: "relative" }}
      >
        <Link href={`/trips/${trip.slug}`} style={{ display: "block", textDecoration: "none", borderRadius: 24, overflow: "hidden", position: "relative", height: 320, boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}>
          {trip.coverUrl
            ? <img key={trip.slug} src={trip.coverUrl} alt={trip.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", animation: "sl-enter 0.55s cubic-bezier(0.22,1,0.36,1) both" }} />
            : <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#10b981,#06b6d4)" }} />
          }
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,15,30,0.85) 0%, rgba(5,15,30,0.3) 55%, transparent 100%)" }} />

          {/* Top badges */}
          <div key={`badges-${trip.slug}`} style={{ position: "absolute", top: 18, left: 20, display: "flex", gap: 8 }}>
            {activeTab === "trending" && (
              <span style={{ background: "linear-gradient(135deg,rgba(249,115,22,0.85),rgba(239,68,68,0.85))", backdropFilter: "blur(8px)", color: "#fff", fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 999, animation: "pl-badge-pop 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
                🔥 มาแรง
              </span>
            )}
            {activeTab === "popular" && (
              <span style={{ background: "rgba(14,165,233,0.75)", backdropFilter: "blur(8px)", color: "#fff", fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 999, animation: "pl-badge-pop 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
                🏆 ยอดนิยม
              </span>
            )}
            {trip.mood && (
              <span style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.25)" }}>
                {trip.mood}
              </span>
            )}
            {trip.province && (
              <span style={{ background: "rgba(16,185,129,0.75)", backdropFilter: "blur(8px)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999 }}>
                📍 {trip.province}
              </span>
            )}
          </div>

          {/* Slide counter */}
          <div style={{ position: "absolute", top: 18, right: 20, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)", color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999 }}>
            {current + 1} / {trips.length}
          </div>

          {/* Bottom content */}
          <div key={`content-${trip.slug}`} style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 24px 22px", animation: "fadeSlide 0.45s cubic-bezier(0.22,1,0.36,1) both" }}>
            <h3 style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: "0 0 6px", lineHeight: 1.3, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
              {trip.title}
            </h3>
            {trip.subtitle && (
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, margin: "0 0 10px", lineHeight: 1.4 }}>
                {trip.subtitle}
              </p>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {trip.author?.avatarUrl
                  ? <img src={trip.author.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.6)" }} />
                  : <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12, border: "2px solid rgba(255,255,255,0.6)" }}>{authorInitial}</div>
                }
                <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 700 }}>โดย {authorName}</span>
              </div>
              {trip.budget && (
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>💰 ~{Number(trip.budget).toLocaleString()} ฿</span>
              )}
              {trip._count && trip._count.reviews > 0 && (
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>💬 {trip._count.reviews} รีวิว</span>
              )}
              {activeTab === "trending" && trip._count && trip._count.likes > 0 && (
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>❤️ {trip._count.likes} ไลค์</span>
              )}
              {activeTab === "popular" && trip._count && trip._count.bookmarks > 0 && (
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>🔖 {trip._count.bookmarks} บันทึก</span>
              )}
            </div>
          </div>
        </Link>

        {/* Arrow buttons */}
        {trips.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="ก่อนหน้า" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.95)", border: "none", cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 12px rgba(0,0,0,0.2)", color: "#1e293b", zIndex: 10, fontWeight: 700, backdropFilter: "blur(4px)" }}>‹</button>
            <button onClick={() => go(1)}  aria-label="ถัดไป"   style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.95)", border: "none", cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 12px rgba(0,0,0,0.2)", color: "#1e293b", zIndex: 10, fontWeight: 700, backdropFilter: "blur(4px)" }}>›</button>
          </>
        )}
      </div>

      {/* Dot nav */}
      {trips.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14 }}>
          {trips.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`สไลด์ ${i + 1}`} style={{ width: i === current ? 24 : 8, height: 8, borderRadius: 4, border: "none", cursor: "pointer", padding: 0, background: i === current ? (activeTab === "trending" ? "#f97316" : "#10b981") : "#d1d5db", transition: "all 0.3s" }} />
          ))}
        </div>
      )}

      {/* Thumbnail strip */}
      {trips.length > 1 && (
        <div style={{ display: "flex", gap: 10, marginTop: 12, overflowX: "auto", paddingBottom: 4 }}>
          {trips.map((t, i) => (
            <button key={t.slug} onClick={() => goTo(i)} style={{ flexShrink: 0, width: 80, height: 56, borderRadius: 12, overflow: "hidden", border: i === current ? `2.5px solid ${activeTab === "trending" ? "#f97316" : "#10b981"}` : "2.5px solid transparent", cursor: "pointer", padding: 0, background: "none", position: "relative", opacity: i === current ? 1 : 0.6, transition: "all 0.25s" }}>
              {t.coverUrl
                ? <img src={t.coverUrl} alt={t.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#10b981,#06b6d4)" }} />
              }
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

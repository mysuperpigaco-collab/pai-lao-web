"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

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
  _count?: { reviews: number; bookmarks: number };
}

export default function TripSlider() {
  const [current, setCurrent] = useState(0);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/trips?limit=6&sort=recent")
      .then(r => r.json())
      .then(d => {
        if (d.trips?.length) { setTrips(d.trips); }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const restartTimer = useCallback((len: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (len <= 1) return;
    timerRef.current = setInterval(() => setCurrent(p => (p + 1) % len), 5000);
  }, []);

  useEffect(() => {
    restartTimer(trips.length);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [trips.length, restartTimer]);

  const go = (dir: number) => {
    setCurrent(p => (p + dir + trips.length) % trips.length);
    restartTimer(trips.length);
  };
  const goTo = (i: number) => { setCurrent(i); restartTimer(trips.length); };

  if (!loaded) {
    return (
      <div style={{ height: 320, background: "linear-gradient(135deg,#f0fdf4,#ecfeff)", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 14 }}>
        ⏳ กำลังโหลด...
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: 24, color: "#94a3b8", fontSize: 15 }}>
        ยังไม่มีเรื่องเล่า — เป็นคนแรกที่เล่าให้ฟัง!
      </div>
    );
  }

  const trip = trips[current];
  const authorName = trip.author?.displayName || trip.author?.firstName || "ไม่ระบุ";
  const authorInitial = authorName.slice(0, 1).toUpperCase();

  return (
    <div style={{ position: "relative", marginBottom: 32 }}>
      {/* ── Main Card ── */}
      <Link href={`/trips/${trip.slug}`} style={{ display: "block", textDecoration: "none", borderRadius: 24, overflow: "hidden", position: "relative", height: 320, boxShadow: "0 12px 40px rgba(0,0,0,0.14)" }}>
        {/* Background image */}
        {trip.coverUrl
          ? <img src={trip.coverUrl} alt={trip.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s ease" }} />
          : <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#10b981,#06b6d4)" }} />
        }
        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,15,30,0.85) 0%, rgba(5,15,30,0.3) 55%, transparent 100%)" }} />

        {/* Top badges */}
        <div style={{ position: "absolute", top: 18, left: 20, display: "flex", gap: 8 }}>
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
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 24px 22px" }}>
          <h3 style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: "0 0 6px", lineHeight: 1.3, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
            {trip.title}
          </h3>
          {trip.subtitle && (
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, margin: "0 0 10px", lineHeight: 1.4 }}>
              {trip.subtitle}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {/* Author */}
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
          </div>
        </div>
      </Link>

      {/* ── Arrow buttons ── */}
      {trips.length > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="ก่อนหน้า" style={{ position: "absolute", left: -16, top: "50%", transform: "translateY(-50%)", width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.95)", border: "none", cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 12px rgba(0,0,0,0.2)", color: "#1e293b", zIndex: 10, fontWeight: 700, backdropFilter: "blur(4px)" }}>‹</button>
          <button onClick={() => go(1)} aria-label="ถัดไป" style={{ position: "absolute", right: -16, top: "50%", transform: "translateY(-50%)", width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.95)", border: "none", cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 12px rgba(0,0,0,0.2)", color: "#1e293b", zIndex: 10, fontWeight: 700, backdropFilter: "blur(4px)" }}>›</button>
        </>
      )}

      {/* ── Dot nav ── */}
      {trips.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14 }}>
          {trips.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`สไลด์ ${i + 1}`} style={{ width: i === current ? 24 : 8, height: 8, borderRadius: 4, border: "none", cursor: "pointer", padding: 0, background: i === current ? "#10b981" : "#d1d5db", transition: "all 0.3s" }} />
          ))}
        </div>
      )}

      {/* ── Thumbnail strip ── */}
      {trips.length > 1 && (
        <div style={{ display: "flex", gap: 10, marginTop: 12, overflowX: "auto", paddingBottom: 4 }}>
          {trips.map((t, i) => (
            <button key={t.slug} onClick={() => goTo(i)} style={{ flexShrink: 0, width: 80, height: 56, borderRadius: 12, overflow: "hidden", border: i === current ? "2.5px solid #10b981" : "2.5px solid transparent", cursor: "pointer", padding: 0, background: "none", position: "relative", opacity: i === current ? 1 : 0.6, transition: "all 0.25s" }}>
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

"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useSearchParams } from "next/navigation";
import { useLenis } from "lenis/react";
import Link from "next/link";
import { PROVINCES, getDistricts } from "@/data/thailand";
import { useTiltCard } from "@/hooks/useTiltCard";
import { readSearchState, saveSearchState, patchSearchScroll, type SearchState } from "@/lib/searchStateCache";

/* ─── Types ──────────────────────────────────────────────── */
interface Trip {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  coverUrl?: string | null;
  mood?: string | null;
  province?: string | null;
  district?: string | null;
  createdAt?: string;
  author?: { id: string; displayName?: string | null; firstName: string; avatarUrl?: string | null };
  _count?: { reviews: number; bookmarks: number };
}

/* ─── Constants ──────────────────────────────────────────── */
// id = ค่าที่เก็บจริงใน DB (Trip.mood / moods) ให้ตัวกรอง match ถูก, label = ป้ายสั้น
const MOODS = [
  { id: "",                   icon: "🌐", label: "ทั้งหมด",   en: "All" },
  { id: "Cafe Hopping",       icon: "☕", label: "คาเฟ่",     en: "Café" },
  { id: "สายลุย Adventurous",  icon: "🧗", label: "สายลุย",    en: "Adventure" },
  { id: "กินแหลก Foodie",      icon: "🍲", label: "กินแหลก",   en: "Foodie" },
  { id: "พักผ่อน Relaxing",    icon: "🏖️", label: "พักผ่อน",   en: "Relaxing" },
  { id: "ธรรมชาติ Nature",     icon: "🌿", label: "ธรรมชาติ",  en: "Nature" },
  { id: "วัฒนธรรม Culture",   icon: "🛕", label: "วัฒนธรรม", en: "Culture" },
];

const SORTS = [
  { id: "popular", icon: "🔥", label: "ยอดนิยม", en: "Popular" },
  { id: "recent",  icon: "✨", label: "ล่าสุด",  en: "Newest" },
];

const PAGE_SIZE = 16;

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
}

// Keep only the fields TripCard renders, so the cached snapshot stays small.
function trimTripForCache(t: Trip): Trip {
  return {
    id: t.id, slug: t.slug, title: t.title, subtitle: t.subtitle,
    coverUrl: t.coverUrl, mood: t.mood, province: t.province, district: t.district,
    createdAt: t.createdAt, author: t.author, _count: t._count,
  };
}

/* ─── Default export wrapped in Suspense ────────────────── */
export default function TripsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f8fafc" }} />}>
      <TripsInner />
    </Suspense>
  );
}

function TripsInner() {
  const searchParams = useSearchParams();
  const lenis = useLenis();
  useLenis((l) => { if (l) patchSearchScroll("trips", l.scroll); });

  // Restore previous search state (filters + loaded cards + scroll) on Back.
  const snapRef = useRef<SearchState<Trip> | null | undefined>(undefined);
  if (snapRef.current === undefined) snapRef.current = readSearchState<Trip>("trips");
  const snap = snapRef.current;
  const f = snap?.filters ?? {};

  const [trips,       setTrips      ] = useState<Trip[]>(() => snap?.items ?? []);
  const [total,       setTotal      ] = useState(() => snap?.total ?? 0);
  const [page,        setPage       ] = useState(() => snap?.page ?? 1);
  const [loading,     setLoading    ] = useState(() => !snap);
  const [loadingMore, setLoadingMore] = useState(false);

  const [mood,     setMood    ] = useState(() => f.mood     ?? (searchParams.get("mood")     ?? ""));
  const [province, setProvince] = useState(() => f.province ?? (searchParams.get("province") ?? ""));
  const [district, setDistrict] = useState(() => f.district ?? (searchParams.get("district") ?? ""));
  const [sort,     setSort    ] = useState(() => f.sort     ?? (searchParams.get("sort")     ?? "popular"));
  const initQ = searchParams.get("q") ?? "";
  const [q,        setQ       ] = useState(() => f.q      ?? initQ);
  const [inputQ,   setInputQ  ] = useState(() => f.inputQ ?? initQ);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipInitialFetch = useRef(!!snap);
  const didRestoreScroll = useRef(false);
  const [armInfinite, setArmInfinite] = useState(() => !snap);
  const totalPages  = Math.ceil(total / PAGE_SIZE);

  /* fetch ─────────────────────────────────────────────────── */
  const fetch_ = useCallback(async (p: number, append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(p), sort });
    if (mood)     params.set("mood",     mood);
    if (province) params.set("province", province.split(" (")[0]);
    if (district) params.set("district", district);
    if (q)        params.set("q",        q);

    try {
      const res  = await fetch(`/api/trips?${params}`);
      const data = await res.json();
      const list: Trip[] = data.trips ?? [];
      setTrips(prev => append ? [...prev, ...list] : list);
      setTotal(data.total ?? 0);
    } catch {}
    append ? setLoadingMore(false) : setLoading(false);
  }, [mood, province, district, sort, q]);

  useEffect(() => {
    if (skipInitialFetch.current) { skipInitialFetch.current = false; return; }
    setPage(1); fetch_(1, false);
  }, [fetch_]);

  /* Persist search state so Back restores filters + loaded cards + scroll */
  useEffect(() => {
    saveSearchState<Trip>("trips", {
      filters: { mood, province, district, sort, q, inputQ },
      items: trips.map(trimTripForCache), total, page,
      scrollY: lenis?.scroll ?? (typeof window !== "undefined" ? window.scrollY : 0),
    });
  }, [mood, province, district, sort, q, inputQ, trips, total, page, lenis]);

  /* After a restore, arm infinite-scroll only once the user genuinely scrolls */
  useEffect(() => {
    if (armInfinite) return;
    const arm = () => setArmInfinite(true);
    window.addEventListener("wheel", arm, { passive: true, once: true });
    window.addEventListener("touchmove", arm, { passive: true, once: true });
    window.addEventListener("keydown", arm, { once: true });
    return () => {
      window.removeEventListener("wheel", arm);
      window.removeEventListener("touchmove", arm);
      window.removeEventListener("keydown", arm);
    };
  }, [armInfinite]);

  /* Restore scroll once Lenis is ready, after the route-change reset to 0 */
  useEffect(() => {
    if (didRestoreScroll.current) return;
    const y = snap?.scrollY;
    if (!y) { didRestoreScroll.current = true; return; }
    if (!lenis) return;
    didRestoreScroll.current = true;
    const apply = () => lenis.scrollTo(y, { immediate: true, force: true });
    const r = requestAnimationFrame(() => requestAnimationFrame(apply));
    const t1 = setTimeout(apply, 120);
    const t2 = setTimeout(apply, 350);
    return () => { cancelAnimationFrame(r); clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lenis]);

  const handleSearchInput = (v: string) => {
    setInputQ(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setQ(v), 420);
  };

  const loadMore = () => { const next = page + 1; setPage(next); fetch_(next, true); };
  const sentinelRef = useInfiniteScroll(loadMore, armInfinite && !loadingMore && !loading && page < totalPages);

  const changeFilter = (setter: (v: string) => void, val: string) => {
    setter(val); setPage(1);
  };

  return (
    <div className="tp-page">

      {/* ── Hero ── */}
      <div className="tp-hero">
        <div className="tp-hero-inner">
          <p className="tp-hero-tag">TRAVEL STORIES</p>
          <h1 className="tp-hero-title">
            เรื่องเล่าการเดินทาง<span> Trip Stories</span>
          </h1>
          <p className="tp-hero-sub">
            แรงบันดาลใจจากนักเดินทางทั่วไทย · เรื่องราว เส้นทาง และประสบการณ์จริง<br />
            Real travel stories, routes and experiences from across Thailand
          </p>

          {/* Search bar */}
          <div className="tp-search-wrap">
            <span className="tp-search-icon">🔍</span>
            <input
              className="tp-search"
              value={inputQ}
              onChange={e => handleSearchInput(e.target.value)}
              placeholder="ค้นหาทริป จังหวัด... Search trips, provinces..."
            />
            {inputQ && (
              <button className="tp-search-clear" onClick={() => { setInputQ(""); setQ(""); }}>✕</button>
            )}
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="tp-filters-wrap">
        <div className="tp-filters">

          {/* Mood tabs */}
          <div className="tp-moods">
            {MOODS.map(m => (
              <button
                key={m.id}
                onClick={() => changeFilter(setMood, m.id)}
                className={`tp-mood${mood === m.id ? " tp-mood-active" : ""}`}
              >
                <span className="tp-mood-icon">{m.icon}</span>
                <span className="tp-mood-th">{m.label}</span>
                <span className="tp-mood-en">{m.en}</span>
              </button>
            ))}
          </div>

          {/* Province + District + Sort row */}
          <div className="tp-filter-row">
            <div className="tp-select-wrap">
              <span className="tp-select-icon">🗾</span>
              <select
                className="tp-select"
                value={province}
                onChange={e => { changeFilter(setProvince, e.target.value); setDistrict(""); }}
              >
                <option value="">ทุกจังหวัด · All Provinces</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="tp-select-wrap">
              <span className="tp-select-icon">🏘️</span>
              <select
                className="tp-select"
                value={district}
                onChange={e => changeFilter(setDistrict, e.target.value)}
                disabled={!province}
              >
                <option value="">{province ? "ทุกอำเภอ" : "เลือกจังหวัดก่อน"}</option>
                {getDistricts(province).map(d => <option key={d} value={d.split(" (")[0]}>{d}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", gap:6, flexShrink:0 }}>
              {SORTS.map(s => (
                <button key={s.id} onClick={() => changeFilter(setSort, s.id)}
                  className={`tp-sort-chip${sort === s.id ? " tp-sort-active" : ""}`}>
                  {s.icon} {s.label} <span className="tp-sort-en">· {s.en}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      <div className="tp-results">

        {/* Result count */}
        <div className="tp-result-bar">
          <p className="tp-result-count">
            {loading ? "กำลังโหลด..." : (
              <>พบ <strong>{total.toLocaleString()}</strong> ทริป{mood ? ` · ${MOODS.find(m => m.id === mood)?.label ?? mood}` : ""}{province ? ` · ${province.split(" (")[0]}` : ""}{district ? ` · ${district}` : ""}{q ? ` · "${q}"` : ""}</>
            )}
          </p>
          {!loading && (mood || province || district || q) && (
            <button className="tp-clear-btn" onClick={() => { setMood(""); setProvince(""); setDistrict(""); setQ(""); setInputQ(""); }}>
              ✕ ล้างตัวกรอง · Clear filters
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="tp-skeleton-grid">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="tp-skeleton" />)}
          </div>
        ) : trips.length === 0 ? (
          <div className="tp-empty">
            <div className="tp-empty-anim">
              {["🗺️","📸","🏕️","🌄","🧳"].map((ic,i) => (
                <span key={i} className="tp-empty-float" style={{ animationDelay:`${i*0.4}s`, left:`${8+i*18}%`, top:`${20+(i%2)*50}%` }}>{ic}</span>
              ))}
              <div className="tp-empty-pulse" /><div className="tp-empty-pulse" style={{animationDelay:"0.5s"}} /><div className="tp-empty-pulse" style={{animationDelay:"1s"}} />
              <span className="tp-empty-icon">✈️</span>
            </div>
            <h3>ไม่พบทริป · No trips found</h3>
            <p>ลองเปลี่ยนตัวกรองหรือค้นหาคำอื่น · Try adjusting your filters or search term</p>
            <button className="tp-clear-btn" style={{ marginTop: 16 }} onClick={() => { setMood(""); setProvince(""); setQ(""); setInputQ(""); }}>
              ล้างตัวกรองทั้งหมด · Clear all filters
            </button>
          </div>
        ) : (
          <div className="tp-grid">
            {trips.map((trip, i) => (
              <ScrollReveal key={trip.slug} delay={Math.min(i, 5) * 70}>
                <TripCard trip={trip} />
              </ScrollReveal>
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} style={{ height: 1 }} />
        {loadingMore && (
          <div className="tp-loadmore-wrap">
            <div className="tp-loading-dot"><span/><span/><span/></div>
          </div>
        )}
        {!loading && trips.length > 0 && page >= totalPages && (
          <div className="tp-loadmore-wrap">
            <p style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>
              ดูครบทั้งหมดแล้ว · {total} ทริป
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .tp-page { min-height: 100vh; background: transparent; }

        /* ── Hero ── */
        .tp-hero {
          background: linear-gradient(135deg, #0f172a 0%, #7c3aed 55%, #db2777 100%);
          padding: 64px 20px 80px;
          position: relative; overflow: hidden;
        }
        .tp-hero::before {
          content: ""; position: absolute;
          width: 600px; height: 600px; border-radius: 50%;
          background: rgba(255,255,255,0.04);
          top: -200px; right: -200px; pointer-events: none;
        }
        .tp-hero::after {
          content: ""; position: absolute;
          width: 300px; height: 300px; border-radius: 50%;
          background: rgba(219,39,119,0.12);
          bottom: -100px; left: 10%; pointer-events: none;
        }
        .tp-hero-inner { max-width: 860px; margin: 0 auto; text-align: center; position: relative; z-index: 1; }
        .tp-hero-tag { font-size: 11px; letter-spacing: 3px; font-weight: 800; color: rgba(255,255,255,0.5); margin: 0 0 14px; }
        .tp-hero-title { font-size: 52px; font-weight: 900; color: white; margin: 0 0 14px; line-height: 1.1; }
        .tp-hero-title span { color: #f9a8d4; }
        .tp-hero-sub { font-size: 15px; color: rgba(255,255,255,0.65); margin: 0 0 36px; line-height: 1.8; }

        /* Search */
        .tp-search-wrap {
          display: flex; align-items: center; gap: 12px;
          background: white; border-radius: 16px; padding: 14px 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2); max-width: 640px; margin: 0 auto;
        }
        .tp-search-icon { font-size: 18px; flex-shrink: 0; }
        .tp-search {
          flex: 1; border: none; outline: none; font-size: 15px;
          color: #0f172a; background: transparent; font-family: inherit;
        }
        .tp-search::placeholder { color: #94a3b8; }
        .tp-search-clear {
          background: #f1f5f9; border: none; border-radius: 8px;
          width: 28px; height: 28px; cursor: pointer; font-size: 12px;
          color: #64748b; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        /* ── Filters ── */
        .tp-filters-wrap {
          background: white; border-bottom: 1px solid #f1f5f9;
          box-shadow: 0 4px 16px rgba(15,23,42,0.05);
          /* stick just below the 60px sticky navbar so moods aren't covered */
          position: sticky; top: 60px; z-index: 20;
        }
        .tp-filters { max-width: 1280px; margin: 0 auto; padding: 16px 20px 12px; }

        .tp-moods {
          display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px;
          scrollbar-width: none;
        }
        .tp-moods::-webkit-scrollbar { display: none; }
        .tp-mood {
          display: inline-flex; flex-direction: column; align-items: center;
          gap: 1px; padding: 8px 16px; border-radius: 14px;
          border: 1.5px solid #e2e8f0; background: #f8fafc;
          cursor: pointer; font-family: inherit; transition: all 0.18s;
          flex-shrink: 0; min-width: 68px;
        }
        .tp-mood:hover:not(.tp-mood-active) { background: #fdf4ff; border-color: #e9d5ff; }
        .tp-mood-active {
          background: linear-gradient(135deg, #7c3aed, #db2777);
          border-color: transparent; color: white;
          box-shadow: 0 4px 14px rgba(124,58,237,0.3);
        }
        .tp-mood-icon { font-size: 18px; line-height: 1; }
        .tp-mood-th { font-size: 12px; font-weight: 700; color: #334155; line-height: 1.2; }
        .tp-mood-en { font-size: 11px; font-weight: 700; color: #94a3b8; line-height: 1; }
        .tp-mood-active .tp-mood-th { color: white; }
        .tp-mood-active .tp-mood-en { color: rgba(255,255,255,0.8); }

        .tp-filter-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .tp-select-wrap {
          display: flex; align-items: center; gap: 8px;
          background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px;
          padding: 8px 14px; flex: 1; max-width: none;
        }
        .tp-select-sm { max-width: 220px; }
        .tp-select-icon { font-size: 15px; flex-shrink: 0; }
        .tp-select {
          border: none; background: transparent; font-size: 13px;
          color: #334155; font-family: inherit; outline: none; cursor: pointer; flex: 1;
        }

        /* ── Results ── */
        .tp-results { max-width: 1280px; margin: 0 auto; padding: 28px 20px 80px; }
        .tp-result-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
        .tp-result-count { font-size: 14px; color: #64748b; margin: 0; }
        .tp-result-count strong { color: #0f172a; font-weight: 800; }
        .tp-clear-btn {
          padding: 6px 14px; border-radius: 10px;
          border: 1.5px solid #e2e8f0; background: white;
          font-size: 12px; font-weight: 700; color: #ef4444;
          cursor: pointer; font-family: inherit; transition: 0.2s;
        }
        .tp-clear-btn:hover { background: #fff1f2; border-color: #fecaca; }

        .tp-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }

        /* Skeleton */
        .tp-skeleton-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
        .tp-skeleton {
          height: 300px; border-radius: 20px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* Sort chips */
        .tp-sort-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 8px 14px; border-radius: 12px;
          border: 1.5px solid #e2e8f0; background: #f8fafc;
          font-size: 13px; font-weight: 700; color: #475569;
          cursor: pointer; font-family: inherit; transition: all 0.18s; white-space: nowrap;
        }
        .tp-sort-chip:hover:not(.tp-sort-active) { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; }
        .tp-sort-active { background: linear-gradient(135deg,#0f172a,#1e3a8a); border-color: transparent; color: #fff; box-shadow: 0 4px 12px rgba(15,23,42,0.2); }
        .tp-sort-en { font-size: 11px; opacity: 0.75; font-weight: 500; }

        /* Empty state animated */
        .tp-empty { text-align: center; padding: 60px 20px 40px; }
        .tp-empty h3 { font-size: 20px; font-weight: 800; color: #1e293b; margin: 0 0 8px; }
        .tp-empty p  { font-size: 14px; color: #94a3b8; margin: 0; }
        .tp-empty-anim {
          position: relative; width: 120px; height: 120px; margin: 0 auto 20px;
          display: flex; align-items: center; justify-content: center;
        }
        .tp-empty-icon { font-size: 52px; animation: tp-bounce 2s ease-in-out infinite; position: relative; z-index: 1; }
        .tp-empty-float {
          position: absolute; font-size: 16px; opacity: 0.4;
          animation: tp-float 2.5s ease-in-out infinite alternate;
        }
        .tp-empty-pulse {
          position: absolute; border-radius: 50%; border: 1.5px solid rgba(79,172,254,0.25);
          width: 80px; height: 80px;
          animation: tp-pulse 2s ease-out infinite;
        }
        @keyframes tp-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes tp-float  { from{transform:translateY(0) rotate(-8deg)} to{transform:translateY(-14px) rotate(8deg)} }
        @keyframes tp-pulse  { 0%{transform:scale(0.7);opacity:0.8} 100%{transform:scale(1.6);opacity:0} }

        .tp-loadmore-wrap { display: flex; justify-content: center; align-items: center; margin-top: 40px; margin-bottom: 20px; }
        .tp-loading-dot { display: flex; gap: 6px; }
        .tp-loading-dot span {
          width: 8px; height: 8px; border-radius: 50%; background: #a78bfa;
          animation: tp-dot-bounce 1.2s ease-in-out infinite;
        }
        .tp-loading-dot span:nth-child(2) { animation-delay: 0.2s; }
        .tp-loading-dot span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes tp-dot-bounce { 0%,80%,100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

        /* Desktop: mood chips share the row evenly (equal width, no empty gap) */
        @media (min-width: 900px) {
          .tp-moods { overflow-x: visible; }
          .tp-mood { flex: 1 1 0; min-width: 0; padding-left: 6px; padding-right: 6px; }
          .tp-mood-en { white-space: nowrap; }
        }
        @media (max-width: 1200px) { .tp-grid, .tp-skeleton-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 900px)  { .tp-grid, .tp-skeleton-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 640px) {
          .tp-sort-chip { padding: 7px 10px; font-size: 12px; }
          .tp-sort-en { display: none; }
        }
        @media (max-width: 640px) {
          .tp-hero-title { font-size: 34px; }
          .tp-grid, .tp-skeleton-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
          .tp-mood { padding: 7px 10px; min-width: 58px; }
        }
      `}</style>
    </div>
  );
}

/* ─── Trip Card ──────────────────────────────────────────── */
function TripCard({ trip }: { trip: Trip }) {
  const { cardRef, shineRef, onMove, onLeave, shineStyle } = useTiltCard();
  const [imgLoaded, setImgLoaded] = useState(false);
  const moodIcon: Record<string, string> = {
    "Cafe Hopping": "☕",
    "สายลุย": "🧗",
    "สายลุย Adventurous": "🧗",
    "กินแหลก": "🍲",
    "กินแหลก Foodie": "🍲",
    "พักผ่อน": "🏖️",
    "พักผ่อน Relaxing": "🏖️",
    "ธรรมชาติ": "🌿",
    "ธรรมชาติ Nature": "🌿",
    "วัฒนธรรม": "🛕",
    "วัฒนธรรม Culture": "🛕",
  };
  const icon = moodIcon[trip.mood ?? ""] ?? "✈️";
  const authorName = trip.author?.displayName || trip.author?.firstName || "นักเดินทาง";

  return (
    <Link href={`/trips/${trip.slug}`} style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}>
      <div ref={cardRef} onMouseMove={onMove} onMouseLeave={onLeave} className="tc-card" style={{ position: "relative", willChange: "transform", height: "100%" }}>
        <div ref={shineRef} style={shineStyle} />
        {/* Image */}
        <div className="tc-img">
          {trip.coverUrl
            ? <img src={trip.coverUrl} alt={trip.title} loading="lazy"
                onLoad={() => setImgLoaded(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: imgLoaded ? "blur(0px)" : "blur(10px)", transform: imgLoaded ? "scale(1)" : "scale(1.06)", opacity: imgLoaded ? 1 : 0, transition: "filter 0.5s ease, transform 0.5s ease, opacity 0.4s ease" }} />
            : <div className="tc-img-ph">{icon}</div>
          }
          {/* Mood chip */}
          {trip.mood && <span className="tc-mood-chip">{icon} {trip.mood}</span>}
          {/* Bookmark count */}
          {(trip._count?.bookmarks ?? 0) > 0 && (
            <span className="tc-bm">🔖 {trip._count!.bookmarks}</span>
          )}
        </div>

        {/* Body */}
        <div className="tc-body">
          <h3 className="tc-title">{trip.title}</h3>
          {trip.subtitle && <p className="tc-subtitle">{trip.subtitle}</p>}
          <p className="tc-loc">
            📍 {trip.province || "ไทย"}
            {trip.district ? ` · ${trip.district}` : ""}
          </p>

          {/* Footer */}
          <div className="tc-footer">
            <div className="tc-author">
              {trip.author?.avatarUrl
                ? <img src={trip.author.avatarUrl} alt="" className="tc-avatar" />
                : <div className="tc-avatar-ph">{authorName.charAt(0).toUpperCase()}</div>
              }
              <span className="tc-author-name">{authorName}</span>
            </div>
            <div className="tc-stats">
              {(trip._count?.reviews ?? 0) > 0 && (
                <span className="tc-stat">💬 {trip._count!.reviews}</span>
              )}
              {trip.createdAt && (
                <span className="tc-date">{formatDate(trip.createdAt)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .tc-card {
          background: white; border-radius: 20px; overflow: hidden;
          border: 1px solid #f1f5f9; box-shadow: 0 2px 12px rgba(15,23,42,0.05);
          display: flex; flex-direction: column;
        }
        .tc-card:hover {
          border-color: #e9d5ff;
        }

        .tc-img {
          position: relative; height: 180px;
          overflow: hidden; background: #e2e8f0; flex-shrink: 0;
        }
        .tc-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s; display: block; }
        .tc-card:hover .tc-img img { transform: scale(1.05); }
        .tc-img-ph {
          width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
          font-size: 48px; background: linear-gradient(135deg, #fdf4ff, #fce7f3);
        }

        .tc-mood-chip {
          position: absolute; bottom: 10px; left: 10px;
          background: rgba(124,58,237,0.75); backdrop-filter: blur(6px);
          color: white; font-size: 11px; font-weight: 700;
          padding: 4px 10px; border-radius: 999px;
          max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .tc-bm {
          position: absolute; top: 10px; right: 10px;
          background: rgba(245,158,11,0.85); color: white;
          font-size: 10px; font-weight: 800;
          padding: 3px 8px; border-radius: 999px;
        }

        .tc-body { padding: 14px 16px 16px; flex: 1; display: flex; flex-direction: column; gap: 3px; }
        .tc-title { font-size: 15px; font-weight: 800; color: #1e293b; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tc-subtitle { font-size: 13px; color: #64748b; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tc-loc { font-size: 13px; font-weight: 600; color: #64748b; margin: 2px 0 0; }

        .tc-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 10px; flex-wrap: wrap; gap: 6px; }
        .tc-author { display: flex; align-items: center; gap: 6px; min-width: 0; }
        .tc-avatar { width: 22px; height: 22px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .tc-avatar-ph {
          width: 22px; height: 22px; border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #db2777);
          color: white; font-size: 10px; font-weight: 800;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .tc-author-name { font-size: 12px; font-weight: 700; color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tc-stats { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .tc-stat { font-size: 12px; color: #7c3aed; font-weight: 700; }
        .tc-date { font-size: 11px; color: #94a3b8; font-weight: 600; }
      `}</style>
    </Link>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PROVINCES } from "@/data/thailand";

/* ─── Types ──────────────────────────────────────────────── */
interface Place {
  id: string;
  slug: string;
  title: string;
  titleEn?: string | null;
  coverUrl: string;
  province: string;
  district: string;
  category: string;
  descriptionShort?: string | null;
  isVerified?: boolean;
  _count?: { reviews: number; bookmarks: number; likes?: number };
  avgRating?: number | null;
  shareCount?: number;
  business?: { businessName: string; isVerified?: boolean } | null;
}

/* ─── Constants ──────────────────────────────────────────── */
const CATS = [
  { id: "",             icon: "🌐", label: "ทั้งหมด",     en: "All" },
  { id: "NATURE",       icon: "🌿", label: "ธรรมชาติ",    en: "Nature" },
  { id: "CAFE",         icon: "☕", label: "คาเฟ่",       en: "Café" },
  { id: "BEACH",        icon: "🏖️", label: "ชายหาด",     en: "Beach" },
  { id: "ACCOMMODATION",icon: "🏨", label: "ที่พัก",      en: "Stay" },
  { id: "FOOD",         icon: "🍲", label: "อาหาร",       en: "Food" },
  { id: "TEMPLE",       icon: "🛕", label: "วัด",         en: "Temple" },
  { id: "ADVENTURE",    icon: "🧗", label: "ผจญภัย",      en: "Adventure" },
  { id: "MARKET",       icon: "🛍️", label: "ตลาด",       en: "Market" },
  { id: "MUSEUM",       icon: "🏛️", label: "พิพิธภัณฑ์", en: "Museum" },
  { id: "CAMPING",      icon: "⛺", label: "แคมปิ้ง",    en: "Camping" },
];

const SORTS = [
  { id: "popular", label: "ยอดนิยม · Popular" },
  { id: "recent",  label: "ล่าสุด · Newest" },
];

const PAGE_SIZE = 16;

const CAT_LABEL: Record<string, string> = Object.fromEntries(
  CATS.filter(c => c.id).map(c => [c.id, c.label])
);

/* ─── Default export wrapped in Suspense ────────────────── */
export default function PlacesPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f8fafc" }} />}>
      <PlacesInner />
    </Suspense>
  );
}

function PlacesInner() {
  const searchParams = useSearchParams();

  const [places,   setPlaces  ] = useState<Place[]>([]);
  const [total,    setTotal   ] = useState(0);
  const [page,     setPage    ] = useState(1);
  const [loading,  setLoading ] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Initialize from URL query params (e.g. /place?category=NATURE&province=เชียงใหม่&sort=popular)
  const [cat,      setCat     ] = useState(() => searchParams.get("category") ?? "");
  const [province, setProvince] = useState(() => searchParams.get("province") ?? "");
  const [sort,     setSort    ] = useState(() => searchParams.get("sort") ?? "popular");
  const initQ = searchParams.get("q") ?? "";
  const [q,        setQ       ] = useState(initQ);
  const [inputQ,   setInputQ  ] = useState(initQ);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  /* fetch ─────────────────────────────────────────────────── */
  const fetch_ = useCallback(async (p: number, append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE), page: String(p), sort,
    });
    if (cat)      params.set("category", cat);
    if (province) params.set("province", province.split(" (")[0]);
    if (q)        params.set("q", q);

    try {
      const res  = await fetch(`/api/places?${params}`);
      const data = await res.json();
      const list: Place[] = data.places ?? [];
      setPlaces(prev => append ? [...prev, ...list] : list);
      setTotal(data.total ?? 0);
    } catch {}
    append ? setLoadingMore(false) : setLoading(false);
  }, [cat, province, sort, q]);

  /* reset page + fetch when filters change */
  useEffect(() => {
    setPage(1);
    fetch_(1, false);
  }, [fetch_]);

  /* debounced search */
  const handleSearchInput = (v: string) => {
    setInputQ(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setQ(v), 420);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetch_(next, true);
  };

  /* reset when cat/province/sort changes */
  const changeFilter = (setter: (v: string) => void, val: string) => {
    setter(val); setPage(1);
  };

  return (
    <div className="pl-page">

      {/* ── Hero ── */}
      <div className="pl-hero">
        <div className="pl-hero-inner">
          <p className="pl-hero-tag">DISCOVER THAILAND</p>
          <h1 className="pl-hero-title">
            สำรวจสถานที่<span> Explore Places</span>
          </h1>
          <p className="pl-hero-sub">
            ค้นหาสถานที่ท่องเที่ยว ร้านอาหาร ที่พัก และอีกมากมายทั่วประเทศไทย<br />
            Find attractions, restaurants, stays and more across Thailand
          </p>

          {/* Search bar */}
          <div className="pl-search-wrap">
            <span className="pl-search-icon">🔍</span>
            <input
              className="pl-search"
              value={inputQ}
              onChange={e => handleSearchInput(e.target.value)}
              placeholder="ค้นหาสถานที่... Search places, provinces..."
            />
            {inputQ && (
              <button className="pl-search-clear" onClick={() => { setInputQ(""); setQ(""); }}>✕</button>
            )}
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="pl-filters-wrap">
        <div className="pl-filters">

          {/* Category tabs */}
          <div className="pl-cats" style={{display:"flex",flexWrap:"nowrap",overflowX:"auto",WebkitOverflowScrolling:"touch",gap:8,paddingBottom:6,scrollbarWidth:"none"}}>
            {CATS.map(c => (
              <button
                key={c.id}
                onClick={() => changeFilter(setCat, c.id)}
                className={`pl-cat${cat === c.id ? " pl-cat-active" : ""}`}
              >
                <span className="pl-cat-icon">{c.icon}</span>
                <span className="pl-cat-th">{c.label}</span>
                <span className="pl-cat-en">{c.en}</span>
              </button>
            ))}
          </div>

          {/* Province + Sort row */}
          <div className="pl-filter-row">
            <div className="pl-select-wrap">
              <span className="pl-select-icon">🗾</span>
              <select
                className="pl-select"
                value={province}
                onChange={e => changeFilter(setProvince, e.target.value)}
              >
                <option value="">ทุกจังหวัด · All Provinces</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="pl-select-wrap pl-select-sm">
              <span className="pl-select-icon">📊</span>
              <select
                className="pl-select"
                value={sort}
                onChange={e => changeFilter(setSort, e.target.value)}
              >
                {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      <div className="pl-results">

        {/* Result count */}
        <div className="pl-result-bar">
          <p className="pl-result-count">
            {loading ? "กำลังโหลด..." : (
              <>พบ <strong>{total.toLocaleString()}</strong> สถานที่{cat ? ` · ${CAT_LABEL[cat] ?? ""}` : ""}{province ? ` · ${province.split(" (")[0]}` : ""}{q ? ` · "${q}"` : ""}</>
            )}
          </p>
          {!loading && (cat || province || q) && (
            <button className="pl-clear-btn" onClick={() => { setCat(""); setProvince(""); setQ(""); setInputQ(""); }}>
              ✕ ล้างตัวกรอง · Clear filters
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="pl-skeleton-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="pl-skeleton" />
            ))}
          </div>
        ) : places.length === 0 ? (
          <div className="pl-empty">
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
            <h3>ไม่พบสถานที่ · No places found</h3>
            <p>ลองเปลี่ยนตัวกรองหรือค้นหาคำอื่น · Try adjusting your filters or search term</p>
            <button className="pl-clear-btn" style={{ marginTop: 16 }} onClick={() => { setCat(""); setProvince(""); setQ(""); setInputQ(""); }}>
              ล้างตัวกรองทั้งหมด · Clear all filters
            </button>
          </div>
        ) : (
          <div className="pl-grid">
            {places.map(place => <PlaceCard key={place.slug} place={place} />)}
          </div>
        )}

        {/* Load more */}
        {!loading && places.length > 0 && page < totalPages && (
          <div className="pl-loadmore-wrap">
            <button className="pl-loadmore-btn" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "⏳ กำลังโหลด..." : `โหลดเพิ่ม · Load more (${places.length} / ${total})`}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        /* ── Page ── */
        .pl-page { min-height: 100vh; background: #f8fafc; overflow-x: clip; }

        /* ── Hero ── */
        .pl-hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f766e 100%);
          padding: 64px 20px 80px;
          position: relative; overflow: hidden;
        }
        .pl-hero::before {
          content: ""; position: absolute;
          width: 600px; height: 600px; border-radius: 50%;
          background: rgba(255,255,255,0.04);
          top: -200px; right: -200px; pointer-events: none;
        }
        .pl-hero::after {
          content: ""; position: absolute;
          width: 300px; height: 300px; border-radius: 50%;
          background: rgba(16,185,129,0.1);
          bottom: -100px; left: 10%; pointer-events: none;
        }
        .pl-hero-inner { max-width: 860px; margin: 0 auto; text-align: center; position: relative; z-index: 1; }
        .pl-hero-tag { font-size: 11px; letter-spacing: 3px; font-weight: 800; color: rgba(255,255,255,0.5); margin: 0 0 14px; }
        .pl-hero-title { font-size: 52px; font-weight: 900; color: white; margin: 0 0 14px; line-height: 1.1; }
        .pl-hero-title span { color: #34d399; }
        .pl-hero-sub { font-size: 15px; color: rgba(255,255,255,0.65); margin: 0 0 36px; line-height: 1.8; }

        /* Search */
        .pl-search-wrap {
          display: flex; align-items: center; gap: 12px;
          background: white; border-radius: 16px; padding: 14px 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2); max-width: 640px; margin: 0 auto;
        }
        .pl-search-icon { font-size: 18px; flex-shrink: 0; }
        .pl-search {
          flex: 1; border: none; outline: none; font-size: 15px;
          color: #0f172a; background: transparent; font-family: inherit;
        }
        .pl-search::placeholder { color: #94a3b8; }
        .pl-search-clear {
          background: #f1f5f9; border: none; border-radius: 8px;
          width: 28px; height: 28px; cursor: pointer; font-size: 12px;
          color: #64748b; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        /* ── Filters ── */
        .pl-filters-wrap {
          background: white; border-bottom: 1px solid #f1f5f9;
          box-shadow: 0 4px 16px rgba(15,23,42,0.05);
          position: sticky; top: 0; z-index: 20;
        }
        .pl-filters { max-width: 1280px; margin: 0 auto; padding: 16px 20px 12px; }

        /* Category chips */
        .pl-cats {
          display: flex; flex-wrap: nowrap; gap: 8px; overflow-x: auto; padding-bottom: 12px; -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .pl-cats::-webkit-scrollbar { display: none; }
        .pl-cat {
          display: inline-flex; flex-direction: column; align-items: center;
          gap: 1px; padding: 8px 16px; border-radius: 14px;
          border: 1.5px solid #e2e8f0; background: #f8fafc;
          cursor: pointer; font-family: inherit; transition: all 0.18s;
          flex-shrink: 0; min-width: 68px;
        }
        .pl-cat:hover:not(.pl-cat-active) { background: #eff6ff; border-color: #bfdbfe; }
        .pl-cat-active {
          background: linear-gradient(135deg, #0f172a, #1e3a8a);
          border-color: transparent; color: white;
          box-shadow: 0 4px 14px rgba(15,23,42,0.25);
        }
        .pl-cat-icon { font-size: 18px; line-height: 1; }
        .pl-cat-th { font-size: 11px; font-weight: 700; color: #334155; line-height: 1.2; }
        .pl-cat-en { font-size: 9px; font-weight: 500; color: #94a3b8; line-height: 1; }
        .pl-cat-active .pl-cat-th { color: white; }
        .pl-cat-active .pl-cat-en { color: rgba(255,255,255,0.65); }

        /* Province + Sort row */
        .pl-filter-row { display: flex; gap: 12px; flex-wrap: wrap; padding: 0 20px; box-sizing: border-box; }
        .pl-select-wrap {
          display: flex; align-items: center; gap: 8px;
          background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px;
          padding: 8px 14px; flex: 1; max-width: 340px;
        }
        .pl-select-sm { max-width: 220px; }
        .pl-select-icon { font-size: 15px; flex-shrink: 0; }
        .pl-select {
          border: none; background: transparent; font-size: 13px;
          color: #334155; font-family: inherit; outline: none; cursor: pointer; flex: 1;
        }

        /* ── Results ── */
        .pl-results { max-width: 1280px; margin: 0 auto; padding: 28px 20px 80px; }
        .pl-result-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
        .pl-result-count { font-size: 14px; color: #64748b; margin: 0; }
        .pl-result-count strong { color: #0f172a; font-weight: 800; }
        .pl-clear-btn {
          padding: 6px 14px; border-radius: 10px;
          border: 1.5px solid #e2e8f0; background: white;
          font-size: 12px; font-weight: 700; color: #ef4444;
          cursor: pointer; font-family: inherit; transition: 0.2s;
        }
        .pl-clear-btn:hover { background: #fff1f2; border-color: #fecaca; }

        /* Grid */
        .pl-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }

        /* Skeleton */
        .pl-skeleton-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .pl-skeleton {
          height: 300px; border-radius: 20px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* Empty */
        .pl-empty { text-align: center; padding: 80px 20px; }
        .pl-empty h3 { font-size: 20px; font-weight: 800; color: #1e293b; margin: 0 0 8px; }
        .pl-empty p { font-size: 14px; color: #94a3b8; margin: 0; }

        /* Load more */
        .pl-loadmore-wrap { display: flex; justify-content: center; margin-top: 40px; }
        .pl-loadmore-btn {
          padding: 14px 40px; border-radius: 14px; font-size: 14px; font-weight: 800;
          background: white; border: 2px solid #e2e8f0; color: #334155;
          cursor: pointer; font-family: inherit; transition: 0.2s;
        }
        .pl-loadmore-btn:hover:not(:disabled) { background: #f8fafc; border-color: #4facfe; color: #2563eb; }
        .pl-loadmore-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Responsive */
        @media (max-width: 1200px) { .pl-grid, .pl-skeleton-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 900px)  { .pl-grid, .pl-skeleton-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px)  {
          /* Hero */
          .pl-hero { padding: 36px 16px 48px; }
          .pl-hero-title { font-size: 28px; }
          .pl-hero-sub { font-size: 13px; margin-bottom: 20px; }
          .pl-search-wrap { padding: 10px 14px; border-radius: 14px; }
          .pl-search { font-size: 14px; }

          /* Filter bar */
          .pl-filters { padding: 10px 0 8px; }

          /* Category chips — full-width horizontal scroll edge-to-edge */
          .pl-cats {
            padding-left: 16px; padding-right: 16px;
            gap: 6px; padding-bottom: 8px;
            /* force single row scroll */
            display: flex; flex-wrap: nowrap; overflow-x: auto;
          }
          .pl-cat {
            padding: 6px 10px; min-width: 56px; border-radius: 12px;
            flex-shrink: 0;
          }
          .pl-cat-icon { font-size: 16px; }
          .pl-cat-th { font-size: 10px; }
          .pl-cat-en { font-size: 8px; }

          /* Province / district row */
          .pl-filter-row { padding: 0 16px; gap: 8px; }
          .pl-select-wrap { padding: 7px 10px; border-radius: 10px; }
          .pl-select-sm { max-width: none; }

          /* Results */
          .pl-results { padding: 16px 12px 60px; }
          .pl-result-bar { margin-bottom: 14px; }
          .pl-grid, .pl-skeleton-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          /* Place card on small screen */
          .plc-img { height: 160px; }
          .plc-body { padding: 12px 14px 14px; }
          .plc-title { font-size: 13px; }
          .plc-desc { -webkit-line-clamp: 2; font-size: 11px; }
          .plc-loc { font-size: 10px; }
        }

        @media (max-width: 380px) {
          .pl-grid, .pl-skeleton-grid { grid-template-columns: 1fr; gap: 10px; }
          .plc-img { height: 200px; }
        }
      `}</style>
    </div>
  );
}

/* ─── Place Card ─────────────────────────────────────────── */
function PlaceCard({ place }: { place: Place }) {
  const catIcon: Record<string, string> = {
    NATURE:"🌿",CAFE:"☕",ACCOMMODATION:"🏨",CAMPING:"⛺",
    FOOD:"🍲",TEMPLE:"🛕",BEACH:"🏖️",MARKET:"🛍️",ADVENTURE:"🧗",MUSEUM:"🏛️",
  };
  const catLabel: Record<string, string> = {
    NATURE:"ธรรมชาติ",CAFE:"คาเฟ่",ACCOMMODATION:"ที่พัก",CAMPING:"แคมปิ้ง",
    FOOD:"อาหาร",TEMPLE:"วัด",BEACH:"ชายหาด",MARKET:"ตลาด",ADVENTURE:"ผจญภัย",MUSEUM:"พิพิธภัณฑ์",
  };
  const catColor: Record<string, string> = {
    NATURE:"#16a34a",CAFE:"#92400e",ACCOMMODATION:"#1d4ed8",CAMPING:"#15803d",
    FOOD:"#b91c1c",TEMPLE:"#7c3aed",BEACH:"#0369a1",MARKET:"#b45309",ADVENTURE:"#c2410c",MUSEUM:"#6b21a8",
  };

  const icon  = catIcon[place.category]  ?? "📍";
  const label = catLabel[place.category] ?? place.category;
  const color = catColor[place.category] ?? "#0f172a";
  const avg   = place.avgRating;
  const likes = place._count?.likes ?? 0;
  const revs  = place._count?.reviews ?? 0;
  const bms   = place._count?.bookmarks ?? 0;

  return (
    <Link href={`/place/${place.slug}`} className="plc-card">
      {/* ── Image area ── */}
      <div className="plc-img">
        {place.coverUrl
          ? <img src={place.coverUrl} alt={place.title} loading="lazy"
              onError={(e) => {
                const el = e.currentTarget;
                el.style.display = "none";
                const ph = el.nextElementSibling as HTMLElement | null;
                if (ph) ph.style.display = "flex";
              }}
            />
          : null
        }
        <div className="plc-img-ph" style={{ background: `linear-gradient(135deg, ${color}22, ${color}44)`, display: place.coverUrl ? "none" : "flex" }}>
          <span style={{ fontSize: 52 }}>{icon}</span>
        </div>

        {/* Gradient overlay */}
        <div className="plc-overlay" />

        {/* Top row: verified + owner badge + rating */}
        <div className="plc-top-row">
          {place.business?.isVerified && (
            <span className="plc-verified">✓ Verified</span>
          )}
          {place.business
            ? <span className="plc-owner-badge">🏢 มีเจ้าของ</span>
            : <span className="plc-unowned-badge">⭕ ยังไม่มีเจ้าของ</span>
          }
          {avg != null && avg > 0 && (
            <span className="plc-rating-pill">
              <span style={{ color: "#fbbf24", fontSize: 13 }}>★</span>
              <b>{avg.toFixed(1)}</b>
              {revs > 0 && <span className="plc-rev-count">{revs} รีวิว</span>}
            </span>
          )}
        </div>

        {/* Bottom: category chip on image */}
        <div className="plc-img-footer">
          <span className="plc-cat-chip" style={{ background: color }}>
            {icon} {label}
          </span>
          {(likes > 0 || bms > 0) && (
            <div className="plc-img-stats">
              {likes > 0 && <span>❤️ {likes}</span>}
              {bms > 0 && <span>🔖 {bms}</span>}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="plc-body">
        <h3 className="plc-title">{place.title}</h3>
        {place.titleEn && <p className="plc-title-en">{place.titleEn}</p>}

        <div className="plc-loc-row">
          <span className="plc-loc">📍 {[place.district, place.province].filter(Boolean).join(", ")}</span>
        </div>

        {place.descriptionShort && (
          <p className="plc-desc">{place.descriptionShort}</p>
        )}

        {/* Footer: business + arrow */}
        <div className="plc-footer">
          {place.business?.businessName
            ? <span className="plc-biz">🏪 {place.business.businessName}</span>
            : <span />
          }
          <span className="plc-cta">ดูรายละเอียด →</span>
        </div>
      </div>

      <style jsx>{`
        .plc-card {
          background: white; border-radius: 24px; overflow: hidden;
          text-decoration: none; color: inherit; display: flex; flex-direction: column;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 16px rgba(15,23,42,0.07);
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .plc-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 48px rgba(15,23,42,0.14);
          border-color: #c7d2fe;
        }

        /* Image */
        .plc-img {
          position: relative; height: 210px;
          overflow: hidden; background: #e2e8f0; flex-shrink: 0;
        }
        .plc-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; display: block; }
        .plc-card:hover .plc-img img { transform: scale(1.07); }
        .plc-img-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }

        /* Overlay */
        .plc-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(10,18,35,0.75) 0%, rgba(10,18,35,0.1) 50%, transparent 100%);
          pointer-events: none;
        }

        /* Top row (verified + rating) */
        .plc-top-row {
          position: absolute; top: 12px; left: 12px; right: 12px;
          display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;
        }
        .plc-verified {
          background: #dcfce7; color: #15803d;
          font-size: 10px; font-weight: 800;
          padding: 4px 10px; border-radius: 999px;
          border: 1px solid #a7f3d0; backdrop-filter: blur(4px);
        }
        .plc-owner-badge {
          background: rgba(16,185,129,0.85); color: #fff;
          font-size: 10px; font-weight: 800;
          padding: 4px 10px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(4px);
        }
        .plc-unowned-badge {
          background: rgba(100,116,139,0.75); color: #fff;
          font-size: 10px; font-weight: 700;
          padding: 4px 10px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(4px);
        }
        .plc-rating-pill {
          display: flex; align-items: center; gap: 4px;
          background: rgba(15,23,42,0.75); backdrop-filter: blur(8px);
          color: white; font-size: 13px; font-weight: 800;
          padding: 5px 10px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.15);
          margin-left: auto;
        }
        .plc-rating-pill b { font-weight: 900; }
        .plc-rev-count { font-size: 10px; color: rgba(255,255,255,0.6); font-weight: 500; margin-left: 2px; }

        /* Image footer */
        .plc-img-footer {
          position: absolute; bottom: 12px; left: 12px; right: 12px;
          display: flex; justify-content: space-between; align-items: flex-end; gap: 8px;
        }
        .plc-cat-chip {
          color: white; font-size: 12px; font-weight: 800;
          padding: 5px 12px; border-radius: 999px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .plc-img-stats {
          display: flex; gap: 6px;
        }
        .plc-img-stats span {
          background: rgba(15,23,42,0.7); backdrop-filter: blur(6px);
          color: white; font-size: 11px; font-weight: 700;
          padding: 4px 9px; border-radius: 999px;
        }

        /* Body */
        .plc-body { padding: 16px 18px 18px; flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .plc-title { font-size: 15px; font-weight: 900; color: #0f172a; margin: 0; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .plc-title-en { font-size: 11px; color: #94a3b8; font-style: italic; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .plc-loc-row { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
        .plc-loc { font-size: 12px; color: #64748b; font-weight: 600; }
        .plc-desc { font-size: 12px; color: #64748b; margin: 6px 0 0; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .plc-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 12px; border-top: 1px solid #f8fafc; }
        .plc-biz { font-size: 11px; color: #94a3b8; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60%; }
        .plc-cta { font-size: 12px; font-weight: 800; color: #2563eb; white-space: nowrap; transition: gap 0.2s; }
        .plc-card:hover .plc-cta { color: #1d4ed8; }
      `}</style>
    </Link>
  );
}

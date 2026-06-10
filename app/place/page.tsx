"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ProvinceSelect from "@/components/ui/ProvinceSelect";
import DistrictSelect from "@/components/ui/DistrictSelect";

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
  communityCover?: string | null;
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
  { id: "popular", icon: "🔥", label: "ยอดนิยม", en: "Popular" },
  { id: "recent",  icon: "✨", label: "ล่าสุด",  en: "Newest" },
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
  const [district, setDistrict] = useState(() => searchParams.get("district") ?? "");
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
    if (district) params.set("district", district);
    if (q)        params.set("q", q);

    try {
      const res  = await fetch(`/api/places?${params}`);
      const data = await res.json();
      const list: Place[] = data.places ?? [];
      setPlaces(prev => append ? [...prev, ...list] : list);
      setTotal(data.total ?? 0);
    } catch {}
    append ? setLoadingMore(false) : setLoading(false);
  }, [cat, province, district, sort, q]);

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
  const sentinelRef = useInfiniteScroll(loadMore, !loadingMore && !loading && page < totalPages);

  /* reset when cat/province/sort changes */
  const changeFilter = (setter: (v: string) => void, val: string) => {
    setter(val); setPage(1);
  };

  return (
    <div className="pl-page">

      {/* ── Hero ── */}
      <div style={{overflowX:"hidden"}}>
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

          {/* Province + District + Sort row */}
          <div className="pl-filter-row">
            <div className="pl-select-wrap">
              <span className="pl-select-icon">🗾</span>
              <ProvinceSelect
                value={province}
                onChange={v => { changeFilter(setProvince, v); setDistrict(""); }}
                placeholder="ทุกจังหวัด · All Provinces"
                style={{ borderRadius: 20, padding: "8px 14px", minHeight: 40, fontSize: 14 }}
              />
            </div>
            <div className="pl-select-wrap">
              <DistrictSelect
                province={province.split(" (")[0]}
                value={district}
                onChange={v => changeFilter(setDistrict, v)}
                placeholder="ทุกอำเภอ"
              />
            </div>
            {/* Sort chips */}
            <div style={{ display:"flex", gap:6, flexShrink:0 }}>
              {SORTS.map(s => (
                <button key={s.id} onClick={() => changeFilter(setSort, s.id)}
                  className={`pl-sort-chip${sort === s.id ? " pl-sort-active" : ""}`}>
                  {s.icon} {s.label} <span className="pl-sort-en">· {s.en}</span>
                </button>
              ))}
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
              <>พบ <strong>{total.toLocaleString()}</strong> สถานที่{cat ? ` · ${CAT_LABEL[cat] ?? ""}` : ""}{province ? ` · ${province.split(" (")[0]}` : ""}{district ? ` · ${district}` : ""}{q ? ` · "${q}"` : ""}</>
            )}
          </p>
          {!loading && (cat || province || district || q) && (
            <button className="pl-clear-btn" onClick={() => { setCat(""); setProvince(""); setDistrict(""); setQ(""); setInputQ(""); }}>
              ✕ ล้างตัวกรอง · Clear filters
            </button>
          )}
        </div>

        {/* Grid */}
        <div style={{overflowX:"hidden"}}>
      {loading ? (
          <div className="pl-skeleton-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="pl-skeleton" />
            ))}
          </div>
        ) : places.length === 0 ? (
          <div className="pl-empty">
            <div className="pl-empty-anim">
              {["🗺️","📍","🏔️","🌊","☕"].map((ic,i) => (
                <span key={i} className="pl-empty-float" style={{ animationDelay:`${i*0.4}s`, left:`${8+i*18}%`, top:`${20+(i%2)*50}%` }}>{ic}</span>
              ))}
              <div className="pl-empty-pulse" /><div className="pl-empty-pulse" style={{animationDelay:"0.5s"}} /><div className="pl-empty-pulse" style={{animationDelay:"1s"}} />
              <span className="pl-empty-icon">🔍</span>
            </div>
            <h3>ไม่พบสถานที่ · No places found</h3>
            <p>ลองเปลี่ยนตัวกรองหรือค้นหาคำอื่น · Try adjusting your filters or search term</p>
            <button className="pl-clear-btn" style={{ marginTop: 16 }} onClick={() => { setCat(""); setProvince(""); setDistrict(""); setQ(""); setInputQ(""); }}>
              ล้างตัวกรองทั้งหมด · Clear all filters
            </button>
          </div>
        ) : (
          <div className="pl-grid">
            {places.map(place => <PlaceCard key={place.slug} place={place} />)}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} style={{ height: 1 }} />
        {loadingMore && (
          <div className="pl-loadmore-wrap">
            <div className="pl-loading-dot"><span/><span/><span/></div>
          </div>
        )}
        {!loading && places.length > 0 && page >= totalPages && (
          <div className="pl-loadmore-wrap">
            <p style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>
              ดูครบทั้งหมดแล้ว · {total} สถานที่
            </p>
          </div>
        )}
      </div>
      </div>

      <style jsx>{`
        /* ── Page ── */
        .pl-page { min-height: 100vh; background: transparent; }

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
        .pl-cat-th { font-size: 12px; font-weight: 700; color: #334155; line-height: 1.2; }
        .pl-cat-en { font-size: 11px; font-weight: 700; color: #94a3b8; line-height: 1; }
        .pl-cat-active .pl-cat-th { color: white; }
        .pl-cat-active .pl-cat-en { color: rgba(255,255,255,0.8); }

        /* Sort chips */
        .pl-sort-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 8px 14px; border-radius: 12px;
          border: 1.5px solid #e2e8f0; background: #f8fafc;
          font-size: 13px; font-weight: 700; color: #475569;
          cursor: pointer; font-family: inherit; transition: all 0.18s; white-space: nowrap;
        }
        .pl-sort-chip:hover:not(.pl-sort-active) { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; }
        .pl-sort-active { background: linear-gradient(135deg,#0f172a,#1e3a8a); border-color: transparent; color: #fff; box-shadow: 0 4px 12px rgba(15,23,42,0.2); }
        .pl-sort-en { font-size: 11px; opacity: 0.75; font-weight: 500; }

        /* Empty state animated */
        .pl-empty { text-align: center; padding: 60px 20px 40px; }
        .pl-empty h3 { font-size: 20px; font-weight: 800; color: #1e293b; margin: 0 0 8px; }
        .pl-empty p { font-size: 14px; color: #94a3b8; margin: 0; }
        .pl-empty-anim {
          position: relative; width: 120px; height: 120px; margin: 0 auto 20px;
          display: flex; align-items: center; justify-content: center;
        }
        .pl-empty-icon { font-size: 52px; animation: es-bounce 2s ease-in-out infinite; position: relative; z-index: 1; }
        .pl-empty-float {
          position: absolute; font-size: 16px; opacity: 0.4;
          animation: es-float 2.5s ease-in-out infinite alternate;
        }
        .pl-empty-pulse {
          position: absolute; border-radius: 50%; border: 1.5px solid rgba(79,172,254,0.25);
          width: 80px; height: 80px;
          animation: es-pulse 2s ease-out infinite;
        }
        @keyframes es-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes es-float { from{transform:translateY(0) rotate(-8deg)} to{transform:translateY(-14px) rotate(8deg)} }
        @keyframes es-pulse { 0%{transform:scale(0.7);opacity:0.8} 100%{transform:scale(1.6);opacity:0} }

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

        /* Infinite scroll */
        .pl-loadmore-wrap { display: flex; justify-content: center; align-items: center; margin-top: 40px; margin-bottom: 20px; }
        .pl-loading-dot { display: flex; gap: 6px; }
        .pl-loading-dot span {
          width: 8px; height: 8px; border-radius: 50%; background: #4facfe;
          animation: pl-dot-bounce 1.2s ease-in-out infinite;
        }
        .pl-loading-dot span:nth-child(2) { animation-delay: 0.2s; }
        .pl-loading-dot span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pl-dot-bounce { 0%,80%,100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

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

          /* Sort chips — hide English label on mobile */
          .pl-sort-en { display: none; }

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
  const [hovered, setHovered] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);

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
  const revs  = place._count?.reviews ?? 0;
  const bms   = place._count?.bookmarks ?? 0;
  const likes = place._count?.likes ?? 0;
  const prov  = place.province?.split(" (")[0] ?? place.province ?? "";
  // Unclaimed places: prefer community photo (matches detail page logic)
  const displayImg = (!place.business && place.communityCover)
    ? place.communityCover
    : ((place.coverUrl && place.coverUrl !== "/images/default-place.svg") ? place.coverUrl : (place.communityCover || null));
  const showImg = !!displayImg && !imgError;

  return (
    <Link
      href={`/place/${place.slug}`}
      style={{
        display: "flex", flexDirection: "column",
        borderRadius: 20, overflow: "hidden",
        background: "#fff", textDecoration: "none", color: "inherit",
        boxShadow: hovered ? "0 16px 36px rgba(15,23,42,.13)" : "0 2px 12px rgba(15,23,42,.06)",
        border: "1px solid #f1f5f9",
        transform: hovered ? "translateY(-6px)" : "none",
        transition: "transform .22s ease, box-shadow .22s ease",
        minWidth: 0,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Image area ── */}
      <div style={{ position: "relative", height: 164, overflow: "hidden", background: "#e2e8f0", flexShrink: 0 }}>
        {showImg
          ? <img
              src={displayImg!}
              alt={place.title}
              loading="lazy"
              onError={() => setImgError(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
                transform: hovered ? "scale(1.06)" : "scale(1)", transition: "transform .35s ease" }}
            />
          : <div style={{
              width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              background: `linear-gradient(135deg, ${color}18, ${color}38)`,
            }}>
              <span style={{ fontSize: 48 }}>{icon}</span>
            </div>
        }

        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(15,23,42,.65) 0%, transparent 55%)",
          pointerEvents: "none" }} />

        {/* Top row */}
        <div style={{ position: "absolute", top: 10, left: 10, right: 10,
          display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
          {prov && (
            <span style={{
              background: "rgba(255,255,255,.88)", color: "#0f172a",
              fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999,
              backdropFilter: "blur(6px)", boxShadow: "0 2px 6px rgba(0,0,0,.12)",
              maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{prov}</span>
          )}
          <div style={{ display: "flex", gap: 5, marginLeft: "auto", flexDirection: "column", alignItems: "flex-end" }}>
            {place.business?.isVerified && (
              <span style={{ background: "#dcfce7", color: "#15803d", fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 999 }}>✓ Verified</span>
            )}
            {avg != null && avg > 0 && (
              <span style={{
                display: "flex", alignItems: "center", gap: 3,
                background: "rgba(15,23,42,.75)", backdropFilter: "blur(8px)",
                color: "white", fontSize: 12, fontWeight: 800,
                padding: "4px 9px", borderRadius: 999,
                border: "1px solid rgba(255,255,255,.15)",
              }}>
                <span style={{ color: "#fbbf24" }}>★</span>
                {avg.toFixed(1)}
                {revs > 0 && <span style={{ fontSize: 10, color: "rgba(255,255,255,.6)", fontWeight: 500 }}>{revs}</span>}
              </span>
            )}
          </div>
        </div>

        {/* Bottom row: category + stats */}
        <div style={{ position: "absolute", bottom: 10, left: 10, right: 10,
          display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 6 }}>
          <span style={{
            background: color, color: "white",
            fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999,
            boxShadow: "0 2px 8px rgba(0,0,0,.2)",
          }}>{icon} {label}</span>
          <div style={{ display: "flex", gap: 5 }}>
            {place.business
              ? <span style={{ background: "rgba(16,185,129,.85)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 999 }}>🏢 มีเจ้าของ</span>
              : <span style={{ background: "rgba(100,116,139,.75)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999 }}>⭕ ยังไม่มี</span>
            }
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "12px 14px 13px", flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1e293b", margin: 0,
          overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          lineHeight: 1.35 } as React.CSSProperties}>{place.title}</h3>
        {place.titleEn && (
          <p style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic", margin: 0,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{place.titleEn}</p>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: "auto", paddingTop: 8, borderTop: "1px solid #f1f5f9" }}>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
            📍 {[place.district, prov].filter(Boolean).join(", ")}
          </span>
          <div style={{ display: "flex", gap: 6, fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>
            {likes > 0 && <span>❤️ {likes}</span>}
            {bms > 0 && <span>🔖 {bms}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

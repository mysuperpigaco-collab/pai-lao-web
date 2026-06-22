"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useSearchParams } from "next/navigation";
import { useLenis } from "lenis/react";
import { PROVINCES, getDistricts } from "@/data/thailand";
import SharedPlaceCard from "@/components/places/PlaceCard";
import { readPlaceSearch, savePlaceSearch, patchPlaceSearchScroll, type PlaceSearchSnapshot } from "@/lib/placeSearchCache";

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

// Keep only the fields PlaceCard actually renders, so the search snapshot
// stays small in sessionStorage even with hundreds of loaded cards.
function trimPlaceForCache(p: Place): Place {
  return {
    id: p.id, slug: p.slug, title: p.title, titleEn: p.titleEn,
    coverUrl: p.coverUrl, province: p.province, district: p.district,
    category: p.category, isVerified: p.isVerified, avgRating: p.avgRating,
    communityCover: p.communityCover, business: p.business, _count: p._count,
  };
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
  const lenis = useLenis();
  // Persist the live Lenis scroll offset (the real position with smooth scroll;
  // window.scrollY can lag/mismatch under Lenis).
  useLenis((l) => { if (l) patchPlaceSearchScroll(l.scroll); });

  // Restore the previous search state (filters + loaded cards + scroll) when
  // returning to this page (e.g. Back from a place detail). Read once.
  const snapRef = useRef<PlaceSearchSnapshot<Place> | null | undefined>(undefined);
  if (snapRef.current === undefined) snapRef.current = readPlaceSearch<Place>();
  const snap = snapRef.current;

  const [places,   setPlaces  ] = useState<Place[]>(() => snap?.places ?? []);
  const [total,    setTotal   ] = useState(() => snap?.total ?? 0);
  const [page,     setPage    ] = useState(() => snap?.page ?? 1);
  const [loading,  setLoading ] = useState(() => !snap);
  const [loadingMore, setLoadingMore] = useState(false);

  // Initialize from snapshot, else from URL query params
  const [cat,      setCat     ] = useState(() => snap?.cat ?? (searchParams.get("category") ?? ""));
  const [province, setProvince] = useState(() => snap?.province ?? (searchParams.get("province") ?? ""));
  const [district, setDistrict] = useState(() => snap?.district ?? (searchParams.get("district") ?? ""));
  const [sort,     setSort    ] = useState(() => snap?.sort ?? (searchParams.get("sort") ?? "popular"));
  const initQ = searchParams.get("q") ?? "";
  const [q,        setQ       ] = useState(() => snap?.q ?? initQ);
  const [inputQ,   setInputQ  ] = useState(() => snap?.inputQ ?? initQ);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipInitialFetch = useRef(!!snap);
  const didRestoreScroll = useRef(false);
  // When restoring a snapshot, keep infinite-scroll disarmed until the user
  // actually scrolls — otherwise restoring a deep scroll position immediately
  // triggers loadMore and the list keeps growing ("page changes").
  const [armInfinite, setArmInfinite] = useState(() => !snap);
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

  /* reset page + fetch when filters change (skip once if a snapshot was restored) */
  useEffect(() => {
    if (skipInitialFetch.current) { skipInitialFetch.current = false; return; }
    setPage(1);
    fetch_(1, false);
  }, [fetch_]);

  /* Persist search state so returning here restores filters + loaded cards + scroll */
  useEffect(() => {
    savePlaceSearch<Place>({
      cat, province, district, sort, q, inputQ,
      places: places.map(trimPlaceForCache), total, page,
      scrollY: lenis?.scroll ?? (typeof window !== "undefined" ? window.scrollY : 0),
    });
  }, [cat, province, district, sort, q, inputQ, places, total, page, lenis]);

  /* Restore scroll once, after Lenis is ready AND after SmoothScrollProvider
     resets to 0 on the route change. Re-apply shortly after to beat any late reset. */
  useEffect(() => {
    if (didRestoreScroll.current) return;
    const y = snap?.scrollY;
    if (!y) { didRestoreScroll.current = true; return; }
    if (!lenis) return; // wait until the Lenis instance exists
    didRestoreScroll.current = true;
    const apply = () => lenis.scrollTo(y, { immediate: true, force: true });
    const r = requestAnimationFrame(() => requestAnimationFrame(apply));
    const t1 = setTimeout(apply, 120);
    const t2 = setTimeout(apply, 350);
    return () => { cancelAnimationFrame(r); clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lenis]);

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
  const sentinelRef = useInfiniteScroll(loadMore, armInfinite && !loadingMore && !loading && page < totalPages);

  /* After a restore, arm infinite-scroll only once the user genuinely scrolls
     (wheel / touch / keys) — programmatic scroll restore won't trigger these. */
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
              <select
                className="pl-select"
                value={province}
                onChange={e => { changeFilter(setProvince, e.target.value); setDistrict(""); }}
              >
                <option value="">ทุกจังหวัด · All Provinces</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="pl-select-wrap">
              <span className="pl-select-icon">🏘️</span>
              <select
                className="pl-select"
                value={district}
                onChange={e => changeFilter(setDistrict, e.target.value)}
                disabled={!province}
              >
                <option value="">{province ? "ทุกอำเภอ · All Districts" : "เลือกจังหวัดก่อน · Select province first"}</option>
                {getDistricts(province).map(d => <option key={d} value={d.split(" (")[0]}>{d}</option>)}
              </select>
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
            {places.map((place, i) => (
              <ScrollReveal key={place.slug} delay={Math.min(i, 5) * 70}>
                <SharedPlaceCard place={place} />
              </ScrollReveal>
            ))}
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
          /* stick just below the 60px sticky navbar so categories aren't covered */
          position: sticky; top: 60px; z-index: 20;
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
          padding: 8px 14px; flex: 1; max-width: none;
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
        .pl-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }

        /* Skeleton */
        .pl-skeleton-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
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
        /* Desktop: category chips share the row evenly (equal width, no empty gap) */
        @media (min-width: 900px) {
          .pl-cats { overflow-x: visible; }
          .pl-cat { flex: 1 1 0; min-width: 0; padding-left: 6px; padding-right: 6px; }
          .pl-cat-en { white-space: nowrap; }
        }
        @media (max-width: 1200px) { .pl-grid, .pl-skeleton-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 900px)  { .pl-grid, .pl-skeleton-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
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
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          /* Place card on small screen */
          .plc-img { height: 160px; }
          .plc-body { padding: 12px 14px 14px; }
          .plc-title { font-size: 13px; }
          .plc-en { font-size: 11px; }
          .plc-loc { font-size: 11px; }
        }

        @media (max-width: 380px) {
          .pl-grid, .pl-skeleton-grid { grid-template-columns: 1fr; gap: 10px; }
          .plc-img { height: 200px; }
        }
      `}</style>
    </div>
  );
}


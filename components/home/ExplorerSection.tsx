"use client";
import { useState, useEffect, useCallback, CSSProperties } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { PROVINCES, getDistricts } from "@/data/thailand";
import SharedPlaceCard from "@/components/places/PlaceCard";
import { RouteHoverProvider } from "@/components/maps/RouteHoverContext";

// แผนที่ปักหมุด — โหลดฝั่ง client เท่านั้น (Leaflet ใช้ window)
const NearbyMap = dynamic(() => import("@/components/maps/NearbyMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 320, borderRadius: 16, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pl-text-muted)", fontSize: 14, fontWeight: 600 }}>
      กำลังโหลดแผนที่…
    </div>
  ),
});

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
  avgRating?: number | null;
  communityCover?: string | null;
  _count?: { reviews: number; bookmarks: number };
  business?: { businessName: string; isVerified?: boolean } | null;
}

const PLACE_CATS = [
  { id: "",             icon: "🗺️", label: "ทั้งหมด",      en: "All" },
  { id: "NATURE",       icon: "🌿", label: "ธรรมชาติ",      en: "Nature" },
  { id: "CAFE",         icon: "☕", label: "คาเฟ่",         en: "Café" },
  { id: "BEACH",        icon: "🏖️", label: "ชายหาด",       en: "Beach" },
  { id: "ACCOMMODATION",icon: "🏨", label: "ที่พัก",        en: "Stay" },
  { id: "FOOD",         icon: "🍲", label: "อาหาร",         en: "Food" },
  { id: "TEMPLE",       icon: "🛕", label: "วัด",           en: "Temple" },
  { id: "ADVENTURE",    icon: "🧗", label: "ผจญภัย",        en: "Adventure" },
  { id: "MARKET",       icon: "🛍️", label: "ตลาด",         en: "Market" },
  { id: "MUSEUM",       icon: "🏛️", label: "พิพิธภัณฑ์",   en: "Museum" },
  { id: "CAMPING",      icon: "⛺", label: "แคมปิ้ง",      en: "Camping" },
];

const CAT_LABEL: Record<string, string> = {
  NATURE: "ธรรมชาติ", CAFE: "คาเฟ่", BEACH: "ชายหาด",
  ACCOMMODATION: "ที่พัก", FOOD: "อาหาร", TEMPLE: "วัด",
  ADVENTURE: "ผจญภัย", MARKET: "ตลาด", MUSEUM: "พิพิธภัณฑ์", CAMPING: "แคมปิ้ง",
};

// ── Near-me config ────────────────────────────────────────────────────────────
const RADIUS_OPTIONS = [
  { v: 500,  label: "500 ม." },
  { v: 1000, label: "1 กม." },
  { v: 3000, label: "3 กม." },
  { v: 5000, label: "5 กม." },
];
const AREA_PAGE_SIZE = 12;
const TH_BOUNDS = { minLat: 5.5, maxLat: 20.6, minLng: 97.3, maxLng: 105.7 };
const inThailand = (lat: number, lng: number) =>
  lat >= TH_BOUNDS.minLat && lat <= TH_BOUNDS.maxLat && lng >= TH_BOUNDS.minLng && lng <= TH_BOUNDS.maxLng;

interface NearbyPlace {
  id: string; slug: string; title: string; titleEn?: string | null;
  category: string; province: string; district: string;
  descriptionShort?: string | null;
  coverUrl: string; communityCover?: string | null;
  lat: number | null; lng: number | null;
  isVerified?: boolean;
  business?: { businessName: string; isVerified?: boolean } | null;
  _count?: { reviews: number; bookmarks: number };
  avgRating?: number | null;
  distanceM: number;
}

// ── Responsive columns hook ──────────────────────────────────────────────────
function useColumns() {
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

// ── Main Section ─────────────────────────────────────────────────────────────
// Modern gradient "load more" pill with hover lift + bouncing arrow.
function LoadMoreButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 9,
        padding: "13px 30px 13px 16px", borderRadius: 999, border: "none",
        background: "linear-gradient(135deg,#10b981,#06b6d4)",
        color: "#fff", fontSize: 14.5, fontWeight: 800,
        cursor: "pointer", fontFamily: "inherit",
        boxShadow: hover ? "0 12px 30px rgba(16,185,129,0.42)" : "0 5px 18px rgba(16,185,129,0.30)",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        transition: "transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s ease",
      }}
    >
      <span style={{
        display: "inline-flex", width: 26, height: 26, borderRadius: "50%",
        background: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center",
        fontSize: 15, transform: hover ? "translateY(2px)" : "translateY(0)",
        transition: "transform .22s ease",
      }}>↓</span>
      {children}
    </button>
  );
}

export default function ExplorerSection() {
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [category, setCategory] = useState("");
  const [places,   setPlaces  ] = useState<Place[]>([]);
  const [loading,  setLoading ] = useState(false);
  const [total,    setTotal   ] = useState(0);
  const [areaPage, setAreaPage] = useState(1);
  const [areaTotalPages, setAreaTotalPages] = useState(1);
  const [areaLoadingMore, setAreaLoadingMore] = useState(false);
  const cols = useColumns();

  // ── Tab + near-me state ─────────────────────────────────────────────────────
  const [mode, setMode] = useState<"area" | "nearby">("area");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(1000);
  const [nearCat, setNearCat] = useState("");
  const [nearPlaces, setNearPlaces] = useState<NearbyPlace[]>([]);
  const [nearVisible, setNearVisible] = useState(12);
  const [nearLoading, setNearLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [recenterKey, setRecenterKey] = useState(0);

  const districts = province ? getDistricts(province) : [];

  const fetchArea = useCallback((page: number, append: boolean) => {
    if (!province) { setPlaces([]); setTotal(0); setAreaTotalPages(1); return; }
    append ? setAreaLoadingMore(true) : setLoading(true);
    const params = new URLSearchParams({ limit: String(AREA_PAGE_SIZE), page: String(page), sort: "popular" });
    params.set("province", province.split(" (")[0]);
    if (district) params.set("district", district.split(" (")[0]);
    if (category) params.set("category", category);
    fetch(`/api/places?${params}`)
      .then(r => r.json())
      .then(d => {
        setPlaces(prev => append ? [...prev, ...(d.places ?? [])] : (d.places ?? []));
        setTotal(d.total ?? 0);
        setAreaTotalPages(d.totalPages ?? 1);
        append ? setAreaLoadingMore(false) : setLoading(false);
      })
      .catch(() => { append ? setAreaLoadingMore(false) : setLoading(false); });
  }, [province, district, category]);

  useEffect(() => { setAreaPage(1); fetchArea(1, false); }, [fetchArea]);

  const areaLoadMore = () => { const n = areaPage + 1; setAreaPage(n); fetchArea(n, true); };
  const areaHasMore = !!province && areaPage < areaTotalPages;
  // Auto-load disabled on the home preview so the list can't trap the
  // highlight section below it — use the manual "Load more" button instead.
  const areaSentinelRef = useInfiniteScroll(areaLoadMore, false);

  const handleProvinceChange = (v: string) => { setProvince(v); setDistrict(""); setCategory(""); };

  // ── Near-me: locate, drag, fetch ────────────────────────────────────────────
  const locateMe = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGeoMsg("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }
    setLocating(true);
    setGeoMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!inThailand(latitude, longitude)) {
          setCoords({ lat: 13.7563, lng: 100.5018 }); // กลางกรุงเทพฯ ให้ลากเอง
          setGeoMsg("ตำแหน่งของคุณอยู่นอกประเทศไทย — วางหมุดไว้ที่กรุงเทพฯ ลากไปยังจุดที่ต้องการได้เลย");
        } else {
          setCoords({ lat: latitude, lng: longitude });
        }
        setRecenterKey((k) => k + 1);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setGeoMsg(
          err.code === err.PERMISSION_DENIED
            ? "ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง — เปิดสิทธิ์ตำแหน่งในเบราว์เซอร์แล้วลองใหม่"
            : "ระบุตำแหน่งไม่สำเร็จ ลองอีกครั้ง"
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handlePinMove = (lat: number, lng: number) => setCoords({ lat, lng });

  useEffect(() => {
    if (mode !== "nearby" || !coords) return;
    setNearLoading(true);
    const params = new URLSearchParams({ lat: String(coords.lat), lng: String(coords.lng), radius: String(radius) });
    if (nearCat) params.set("category", nearCat);
    const ctrl = new AbortController();
    fetch(`/api/places/nearby?${params}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => { setNearPlaces(d.places ?? []); setNearVisible(12); setNearLoading(false); })
      .catch((e) => { if (e.name !== "AbortError") setNearLoading(false); });
    return () => ctrl.abort();
  }, [mode, coords, radius, nearCat]);

  const nearShown = nearPlaces.slice(0, nearVisible);
  const nearHasMore = nearVisible < nearPlaces.length;
  const nearLoadMore = () => setNearVisible(v => v + 12);
  const nearSentinelRef = useInfiniteScroll(nearLoadMore, false);

  // ── Styles ────────────────────────────────────────────────────────────────
  const wrap: CSSProperties = {
    background: "var(--pl-white)",
    padding: "36px",
    borderRadius: 28,
    boxShadow: "var(--pl-shadow-card)",
    marginTop: 48,
    border: "1px solid var(--pl-border)",
    maxWidth: "100%",
    overflowX: "clip",
  };

  const selectBase: CSSProperties = {
    padding: "11px 14px",
    borderRadius: 12,
    border: "1.5px solid var(--pl-border)",
    fontSize: 14,
    color: "var(--pl-text-primary)",
    background: "var(--pl-white)",
    outline: "none",
    fontFamily: "inherit",
    cursor: "pointer",
    width: "100%",
  };

  const Spinner = () => (
    <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#10b981", animation: "es-spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={wrap}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--pl-text-primary)", margin: "0 0 6px" }}>
          📍 เจาะลึกรายพื้นที่{" "}
          <span style={{ color: "#2563eb" }}>Explore by Area</span>
        </h2>
        <p style={{ fontSize: 13, color: "var(--pl-text-secondary)", margin: 0 }}>
          สถานที่ยอดนิยมในจังหวัดที่คุณเลือก วัดจากยอด Bookmark · Top places by area
        </p>
      </div>

      {/* Tab toggle */}
      <div style={{ display: "inline-flex", gap: 4, padding: 4, background: "var(--pl-bg)", borderRadius: 14, marginBottom: 20 }}>
        {([
          { id: "area",   icon: "🗾", label: "เลือกพื้นที่ · Area" },
          { id: "nearby", icon: "📍", label: "ใกล้ฉัน · Nearby" },
        ] as const).map(t => {
          const active = mode === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 18px", borderRadius: 11, border: "none",
                cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 800,
                background: active ? "white" : "transparent",
                color: active ? "#0f766e" : "#64748b",
                boxShadow: active ? "0 2px 8px rgba(15,23,42,0.10)" : "none",
                transition: "all 0.18s",
              }}
            >
              <span style={{ fontSize: 16 }}>{t.icon}</span>{t.label}
            </button>
          );
        })}
      </div>
      <style>{`@keyframes es-spin{to{transform:rotate(360deg)}}`}</style>

      {mode === "area" && (<>
      {/* Filters */}
      <div style={{ display: "flex", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--pl-text-secondary)" }}>🗾 จังหวัด · Province</label>
          <select style={selectBase} value={province} onChange={e => handleProvinceChange(e.target.value)}>
            <option value="">-- เลือกจังหวัด / Select Province --</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--pl-text-secondary)" }}>📌 อำเภอ · District</label>
          <select
            style={{ ...selectBase, opacity: !province ? 0.5 : 1, cursor: !province ? "not-allowed" : "pointer", background: !province ? "var(--pl-bg)" : "var(--pl-white)" }}
            value={district}
            onChange={e => setDistrict(e.target.value)}
            disabled={!province}
          >
            <option value="">-- ทุกอำเภอ / All Districts --</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Category chips */}
      <div className="cat-row" style={{ marginBottom: 22 }}>
        {PLACE_CATS.map(c => {
          const active = category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                padding: "8px 14px",
                borderRadius: 14,
                border: active ? "1.5px solid #3b82f6" : "1.5px solid var(--pl-border)",
                background: active ? "linear-gradient(135deg,#eff6ff,#dbeafe)" : "var(--pl-bg)",
                cursor: "pointer",
                transition: "all 0.18s",
                fontFamily: "inherit",
                minWidth: 64,
                flexShrink: 0,
                boxShadow: active ? "0 2px 10px rgba(59,130,246,0.18)" : "none",
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{c.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: active ? "#1d4ed8" : "var(--pl-text-primary)", lineHeight: 1.2 }}>{c.label}</span>
              <span style={{ fontSize: 9, fontWeight: 500, color: active ? "#60a5fa" : "#94a3b8", lineHeight: 1 }}>{c.en}</span>
            </button>
          );
        })}
      </div>

      {/* Results */}
      <div style={{ minHeight: 160 }}>
        {!province ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"52px 20px 44px", gap:14, textAlign:"center", background:"linear-gradient(135deg,#f0fdf4,#eff6ff)", borderRadius:18, position:"relative", overflow:"hidden" }}>
            {/* Pulsing rings */}
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
              {[1,2,3].map(i => (
                <div key={i} style={{
                  position:"absolute", borderRadius:"50%",
                  border:`1.5px solid rgba(16,185,129,${0.18 - i*0.04})`,
                  width: i*100, height: i*100,
                  animation:`es-pulse ${1.6 + i*0.4}s ease-out infinite`,
                  animationDelay:`${i*0.3}s`,
                }} />
              ))}
            </div>
            {/* Floating icons */}
            {["✈️","📸","🏔️","☕","🌊"].map((icon, i) => (
              <span key={i} style={{
                position:"absolute", fontSize:18, opacity:0.45,
                animation:`es-float ${2.5 + i*0.4}s ease-in-out infinite alternate`,
                animationDelay:`${i*0.5}s`,
                left:`${10 + i*18}%`, top:`${15 + (i%2)*55}%`,
              }}>{icon}</span>
            ))}
            {/* Main icon */}
            <div style={{ fontSize:52, animation:"es-bounce 2s ease-in-out infinite", position:"relative", zIndex:1 }}>🗺️</div>
            <p style={{ fontSize:15, color:"#0f766e", fontWeight:800, margin:0, position:"relative", zIndex:1 }}>เลือกจังหวัดเพื่อดูสถานที่ยอดนิยม</p>
            <small style={{ fontSize:12, color:"#64748b", position:"relative", zIndex:1 }}>Select a province to explore popular places</small>
            <style>{`
              @keyframes es-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
              @keyframes es-pulse { 0%{transform:scale(0.6);opacity:0.8} 100%{transform:scale(1.4);opacity:0} }
              @keyframes es-float { from{transform:translateY(0) rotate(-5deg)} to{transform:translateY(-12px) rotate(5deg)} }
            `}</style>
          </div>
        ) : loading ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 16 }}>
              {Array.from({ length: cols * 2 }).map((_, i) => (
                <div key={i} style={{ borderRadius: 20, overflow: "hidden", border: "1px solid #f1f5f9", background: "white" }}>
                  {/* Image skeleton */}
                  <div style={{ position: "relative", paddingBottom: "65%", background: "#f1f5f9", overflow: "hidden" }}>
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 40%, #f1f5f9 80%)",
                      backgroundSize: "200% 100%",
                      animation: `shimmer 1.4s ease infinite ${i * 0.1}s`,
                    }} />
                    {/* Fake chip top-left */}
                    <div style={{ position: "absolute", top: 10, left: 10, width: 52, height: 18, borderRadius: 999, background: "#e2e8f0", overflow: "hidden" }}>
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 40%, #e2e8f0 80%)", backgroundSize: "200% 100%", animation: `shimmer 1.4s ease infinite ${i * 0.1}s` }} />
                    </div>
                  </div>
                  {/* Footer skeleton */}
                  <div style={{ padding: "10px 12px", display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ flex: 1, height: 10, borderRadius: 6, background: "#f1f5f9", overflow: "hidden", position: "relative" }}>
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 40%, #f1f5f9 80%)", backgroundSize: "200% 100%", animation: `shimmer 1.4s ease infinite ${i * 0.1 + 0.2}s` }} />
                    </div>
                    <div style={{ width: 40, height: 10, borderRadius: 6, background: "#f1f5f9", overflow: "hidden", position: "relative" }}>
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 40%, #f1f5f9 80%)", backgroundSize: "200% 100%", animation: `shimmer 1.4s ease infinite ${i * 0.1 + 0.3}s` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <style>{`
              @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
            `}</style>
          </>
        ) : places.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "52px 20px", gap: 12, textAlign: "center", background: "var(--pl-bg)", borderRadius: 18 }}>
            <span style={{ fontSize: 44 }}>📭</span>
            <p style={{ fontSize: 15, color: "var(--pl-text-secondary)", fontWeight: 700, margin: 0 }}>ยังไม่มีสถานที่ใน{province.split(" (")[0]}</p>
            <small style={{ fontSize: 12, color: "var(--pl-text-muted)" }}>No places in this area yet</small>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "var(--pl-text-secondary)", margin: "0 0 16px" }}>
              พบ <strong style={{ color: "var(--pl-text-primary)", fontWeight: 800 }}>{total}</strong> สถานที่ · {total} places
              {category ? ` · ${CAT_LABEL[category] ?? category}` : ""}
              {district ? ` · ${district}` : ""}
            </p>

            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 16, maxWidth: "100%" }}>
              {places.map((place, i) => (
                <ScrollReveal key={place.slug} delay={Math.min(i % AREA_PAGE_SIZE, 5) * 70}>
                  <SharedPlaceCard place={place} newTab={true} />
                </ScrollReveal>
              ))}
            </div>

            {/* Load more */}
            <div ref={areaSentinelRef} style={{ height: 1 }} />
            {areaLoadingMore && <Spinner />}
            {areaHasMore && !areaLoadingMore && (
              <div style={{ textAlign: "center", marginTop: 18 }}>
                <LoadMoreButton onClick={areaLoadMore}>โหลดเพิ่ม · Load more</LoadMoreButton>
              </div>
            )}
            {!areaHasMore && places.length > AREA_PAGE_SIZE && (
              <p style={{ textAlign: "center", color: "var(--pl-text-muted)", fontSize: 13, fontWeight: 600, marginTop: 18 }}>
                แสดงครบทั้ง {total} สถานที่แล้ว
              </p>
            )}

            {/* See all */}
            <div style={{ textAlign: "center", marginTop: 28 }}>
              <Link
                href={`/place?province=${encodeURIComponent(province.split(" (")[0])}${category ? `&category=${category}` : ""}&sort=popular`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "10px 24px",
                  background: "linear-gradient(135deg, #0f766e, #047857)",
                  color: "white",
                  borderRadius: 999,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  boxShadow: "0 4px 14px rgba(15,118,110,0.35)",
                }}
              >
                ดูสถานที่ทั้งหมดใน{province.split(" (")[0]} · See all →
              </Link>
            </div>
          </>
        )}
      </div>
      </>)}

      {mode === "nearby" && (
        <div>
          {/* Locate + radius */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 14 }}>
            <button
              onClick={locateMe}
              disabled={locating}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "11px 20px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #0f766e, #047857)",
                color: "white", fontSize: 14, fontWeight: 800,
                cursor: locating ? "wait" : "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 14px rgba(15,118,110,0.30)",
                opacity: locating ? 0.7 : 1,
              }}
            >
              {locating ? "⏳ กำลังหาตำแหน่ง…" : coords ? "📍 หาตำแหน่งฉันใหม่" : "📍 ค้นหาใกล้ฉัน"}
            </button>

            {coords && (
              <div style={{ display: "flex", gap: 6, flexWrap: "nowrap", overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" as any }}>
                {RADIUS_OPTIONS.map(r => {
                  const active = radius === r.v;
                  return (
                    <button
                      key={r.v}
                      onClick={() => { setRadius(r.v); setRecenterKey(k => k + 1); }}
                      style={{
                        padding: "9px 16px", borderRadius: 11, fontFamily: "inherit",
                        border: active ? "1.5px solid #10b981" : "1.5px solid var(--pl-border)",
                        background: active ? "linear-gradient(135deg,#ecfdf5,#d1fae5)" : "var(--pl-bg)",
                        color: active ? "#047857" : "#475569", fontSize: 13, fontWeight: 800,
                        cursor: "pointer", transition: "all 0.18s",
                      }}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {geoMsg && (
            <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", color: "#92400e", fontSize: 13, fontWeight: 600, padding: "10px 14px", borderRadius: 12, marginBottom: 16 }}>
              ⚠️ {geoMsg}
            </div>
          )}

          {!coords ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "52px 20px", gap: 12, textAlign: "center", background: "linear-gradient(135deg,#f0fdf4,#eff6ff)", borderRadius: 18 }}>
              <div style={{ fontSize: 52 }}>🧭</div>
              <p style={{ fontSize: 15, color: "#0f766e", fontWeight: 800, margin: 0 }}>กดปุ่ม “ค้นหาใกล้ฉัน” เพื่อเริ่ม</p>
              <small style={{ fontSize: 12, color: "var(--pl-text-secondary)", maxWidth: 360 }}>
                ระบบจะขอสิทธิ์เข้าถึงตำแหน่ง แล้วปักหมุดบนแผนที่ — คุณลากหมุดเพื่อเลือกจุดที่ต้องการได้ (เฉพาะในประเทศไทย)
              </small>
            </div>
          ) : (
            <RouteHoverProvider>
              {/* Category chips */}
              <div className="cat-row" style={{ marginBottom: 16 }}>
                {PLACE_CATS.map(c => {
                  const active = nearCat === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setNearCat(c.id)}
                      style={{
                        display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 1,
                        padding: "8px 14px", borderRadius: 14,
                        border: active ? "1.5px solid #10b981" : "1.5px solid var(--pl-border)",
                        background: active ? "linear-gradient(135deg,#ecfdf5,#d1fae5)" : "var(--pl-bg)",
                        cursor: "pointer", transition: "all 0.18s", fontFamily: "inherit",
                        minWidth: 64, flexShrink: 0,
                        boxShadow: active ? "0 2px 10px rgba(16,185,129,0.18)" : "none",
                      }}
                    >
                      <span style={{ fontSize: 18, lineHeight: 1 }}>{c.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: active ? "#047857" : "var(--pl-text-primary)", lineHeight: 1.2 }}>{c.label}</span>
                      <span style={{ fontSize: 9, fontWeight: 500, color: active ? "#34d399" : "#94a3b8", lineHeight: 1 }}>{c.en}</span>
                    </button>
                  );
                })}
              </div>

              {/* Map */}
              <div style={{ marginBottom: 8 }}>
                <NearbyMap
                  lat={coords.lat}
                  lng={coords.lng}
                  radius={radius}
                  results={nearPlaces.map(p => ({ id: p.id, slug: p.slug, title: p.title, lat: p.lat, lng: p.lng, distanceM: p.distanceM }))}
                  onMove={handlePinMove}
                  recenterKey={recenterKey}
                />
              </div>
              <p style={{ fontSize: 12, color: "var(--pl-text-muted)", margin: "0 0 18px", textAlign: "center" }}>
                ลากหมุด 📍 บนแผนที่เพื่อเปลี่ยนจุดค้นหา
              </p>

              {/* Results */}
              {nearLoading ? (
                <div style={{ display: "grid", gridTemplateColumns: cols >= 3 ? "1fr 1fr" : "1fr", gap: 12 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, background: "white", border: "1px solid #f1f5f9", borderRadius: 16, overflow: "hidden", height: 96 }}>
                      <div style={{ width: 96, background: "#f1f5f9" }} />
                      <div style={{ flex: 1, padding: "12px 12px 12px 0", display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ height: 10, width: "40%", borderRadius: 6, background: "#f1f5f9" }} />
                        <div style={{ height: 12, width: "75%", borderRadius: 6, background: "#f1f5f9" }} />
                        <div style={{ height: 10, width: "55%", borderRadius: 6, background: "#f1f5f9" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : nearPlaces.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "44px 20px", gap: 10, textAlign: "center", background: "var(--pl-bg)", borderRadius: 18 }}>
                  <span style={{ fontSize: 42 }}>🔍</span>
                  <p style={{ fontSize: 15, color: "var(--pl-text-secondary)", fontWeight: 700, margin: 0 }}>ไม่พบสถานที่ในรัศมีนี้</p>
                  <small style={{ fontSize: 12, color: "var(--pl-text-muted)" }}>ลองขยายระยะทาง หรือเปลี่ยนหมวด แล้วลากหมุดดูครับ</small>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: "var(--pl-text-secondary)", margin: "0 0 14px" }}>
                    พบ <strong style={{ color: "var(--pl-text-primary)", fontWeight: 800 }}>{nearPlaces.length}</strong> สถานที่ในรัศมี {RADIUS_OPTIONS.find(r => r.v === radius)?.label}
                    {nearCat ? ` · ${CAT_LABEL[nearCat] ?? nearCat}` : ""}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
                    {nearShown.map((p, i) => (
                      <ScrollReveal key={p.id} delay={Math.min(i % 12, 6) * 50}>
                        <SharedPlaceCard place={p} distanceM={p.distanceM} newTab={true} linkOnHover={true} />
                      </ScrollReveal>
                    ))}
                  </div>

                  {/* Load more */}
                  <div ref={nearSentinelRef} style={{ height: 1 }} />
                  {nearHasMore ? (
                    <div style={{ textAlign: "center", marginTop: 18 }}>
                      <LoadMoreButton onClick={nearLoadMore}>
                        โหลดเพิ่ม · Load more ({nearPlaces.length - nearVisible} เหลือ)
                      </LoadMoreButton>
                    </div>
                  ) : (
                    <p style={{ textAlign: "center", color: "var(--pl-text-muted)", fontSize: 13, fontWeight: 600, marginTop: 18 }}>
                      แสดงครบทั้ง {nearPlaces.length} สถานที่ในรัศมีนี้แล้ว
                    </p>
                  )}
                </>
              )}
            </RouteHoverProvider>
          )}
        </div>
      )}
    </div>
  );
}

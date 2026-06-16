"use client";
import { useState, useEffect, useCallback, CSSProperties } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTiltCard } from "@/hooks/useTiltCard";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { PROVINCES, getDistricts } from "@/data/thailand";

// แผนที่ปักหมุด — โหลดฝั่ง client เท่านั้น (Leaflet ใช้ window)
const NearbyMap = dynamic(() => import("@/components/maps/NearbyMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 320, borderRadius: 16, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 14, fontWeight: 600 }}>
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

const CAT_COLOR: Record<string, [string, string]> = {
  NATURE:        ["#d1fae5", "#065f46"],
  CAFE:          ["#fef3c7", "#92400e"],
  BEACH:         ["#e0f2fe", "#075985"],
  ACCOMMODATION: ["#ede9fe", "#5b21b6"],
  FOOD:          ["#fee2e2", "#991b1b"],
  TEMPLE:        ["#fce7f3", "#9d174d"],
  ADVENTURE:     ["#ecfdf5", "#14532d"],
  MARKET:        ["#fff7ed", "#7c2d12"],
  MUSEUM:        ["#f0f9ff", "#0c4a6e"],
  CAMPING:       ["#f7fee7", "#365314"],
};

const RANK_EMOJI = ["🥇", "🥈", "🥉"];

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
const fmtDistance = (m: number) =>
  m < 1000 ? `${m} ม.` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} กม.`;
const CAT_ICON: Record<string, string> = {
  NATURE: "🌿", CAFE: "☕", ACCOMMODATION: "🏨", CAMPING: "⛺",
  FOOD: "🍲", TEMPLE: "🛕", BEACH: "🏖️", MARKET: "🛍️", ADVENTURE: "🧗", MUSEUM: "🏛️",
};

interface NearbyPlace {
  id: string; slug: string; title: string; titleEn?: string | null;
  category: string; province: string; district: string;
  coverUrl: string; lat: number | null; lng: number | null;
  isVerified?: boolean;
  business?: { businessName: string; isVerified?: boolean } | null;
  _count?: { reviews: number; bookmarks: number };
  avgRating?: number | null;
  distanceM: number;
}

// ── Nearby result card ────────────────────────────────────────────────────────
function NearbyCard({ place }: { place: NearbyPlace }) {
  const [catBg, catFg] = CAT_COLOR[place.category] ?? ["#eff6ff", "#2563eb"];
  const [imgErr, setImgErr] = useState(false);
  const verified = place.business?.isVerified || place.isVerified;
  const src = place.coverUrl && place.coverUrl !== "/images/default-place.svg" ? place.coverUrl : "";

  return (
    <Link href={`/place/${place.slug}`} target="_blank" rel="noopener noreferrer" style={{
      display: "flex", gap: 12, alignItems: "stretch",
      background: "white", border: "1px solid #f1f5f9", borderRadius: 16,
      overflow: "hidden", textDecoration: "none", color: "inherit",
      boxShadow: "0 2px 10px rgba(15,23,42,0.05)",
    }}>
      {/* Thumb */}
      <div style={{ position: "relative", width: 96, flexShrink: 0, background: `linear-gradient(135deg, ${catBg}88, ${catBg})` }}>
        {src && !imgErr ? (
          <img src={src} alt={place.title} loading="lazy" onError={() => setImgErr(true)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>
            {CAT_ICON[place.category] ?? "📍"}
          </div>
        )}
        {/* Distance pill */}
        <span style={{ position: "absolute", bottom: 6, left: 6, background: "rgba(16,185,129,0.95)", color: "white", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 999 }}>
          {fmtDistance(place.distanceM)}
        </span>
      </div>
      {/* Body */}
      <div style={{ flex: 1, minWidth: 0, padding: "10px 12px 10px 0", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 800, background: catBg, color: catFg, padding: "2px 7px", borderRadius: 999 }}>
            {CAT_LABEL[place.category] ?? place.category}
          </span>
          {verified && <span style={{ fontSize: 10, fontWeight: 800, color: "#15803d" }}>✓ ยืนยันแล้ว</span>}
        </div>
        <p style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {place.title}
        </p>
        <div style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          📍 {[place.district, place.province].filter(Boolean).join(", ")}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
          {place.avgRating != null && <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700 }}>⭐ {place.avgRating.toFixed(1)}</span>}
          {(place._count?.reviews ?? 0) > 0 && <span style={{ fontSize: 11, color: "#64748b" }}>💬 {place._count!.reviews}</span>}
          {(place._count?.bookmarks ?? 0) > 0 && <span style={{ fontSize: 11, color: "#64748b" }}>🔖 {place._count!.bookmarks}</span>}
        </div>
      </div>
    </Link>
  );
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

// ── Place Card ───────────────────────────────────────────────────────────────
function PlaceCard({ place, rank }: { place: Place; rank: number }) {
  const { cardRef, shineRef, onMove, onLeave, shineStyle } = useTiltCard();
  const [imgError,  setImgError ] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const verified = place.business?.isVerified || place.isVerified;
  const bookmarks = place._count?.bookmarks ?? 0;
  const reviews   = place._count?.reviews   ?? 0;
  const rating    = place.avgRating;
  const [catBg, catFg] = CAT_COLOR[place.category] ?? ["#eff6ff", "#2563eb"];

  const card: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    background: "white",
    textDecoration: "none",
    color: "inherit",
    border: "1px solid #f1f5f9",
    cursor: "pointer",
    minWidth: 0,
  };

  const imgWrap: CSSProperties = {
    position: "relative",
    width: "100%",
    paddingBottom: "65%", // ~3:2
    background: "#e2e8f0",
    overflow: "hidden",
    flexShrink: 0,
  };

  const imgStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  };

  const gradient: CSSProperties = {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to top, rgba(10,10,20,0.72) 0%, rgba(10,10,20,0.18) 55%, transparent 100%)",
    zIndex: 1,
  };

  const chipCat: CSSProperties = {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 3,
    background: catBg,
    color: catFg,
    fontSize: 10,
    fontWeight: 800,
    padding: "3px 8px",
    borderRadius: 999,
    letterSpacing: 0.3,
  };

  const rankBadge: CSSProperties = {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 3,
    fontSize: 22,
    filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.4))",
  };

  const verifiedBadge: CSSProperties = {
    position: "absolute",
    top: rank < 3 ? 42 : 8,
    right: 8,
    zIndex: 3,
    background: "rgba(220,252,231,0.95)",
    color: "#15803d",
    fontSize: 10,
    fontWeight: 800,
    padding: "3px 8px",
    borderRadius: 999,
  };

  const bottomOverlay: CSSProperties = {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    padding: "10px 12px 12px",
  };

  const titleStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 800,
    color: "white",
    margin: 0,
    lineHeight: 1.35,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textShadow: "0 1px 3px rgba(0,0,0,0.5)",
  };

  const locStyle: CSSProperties = {
    fontSize: 11,
    color: "rgba(255,255,255,0.82)",
    marginTop: 3,
    display: "flex",
    alignItems: "center",
    gap: 3,
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  };

  const footer: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderTop: "1px solid #f1f5f9",
    background: "white",
  };

  const statItem: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 3,
    fontSize: 11,
    color: "#64748b",
    fontWeight: 600,
  };

  const placeholder: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 40,
    background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)",
  };

  return (
    <div ref={cardRef} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ position: "relative", willChange: "transform", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(15,23,42,0.06)" }}>
      <div ref={shineRef} style={shineStyle} />
    <Link
      href={`/place/${place.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      style={card}
    >
      {/* Image */}
      <div style={imgWrap}>
        {/* Unclaimed: prefer community photo; owned: prefer coverUrl */}
        {(() => {
          const src = (!place.business && place.communityCover)
            ? place.communityCover
            : (place.coverUrl && place.coverUrl !== "/images/default-place.svg"
               ? place.coverUrl
               : (place.communityCover || ""));
          const catIcons: Record<string,string> = {
            NATURE:"🌿",CAFE:"☕",ACCOMMODATION:"🏨",CAMPING:"⛺",
            FOOD:"🍲",TEMPLE:"🛕",BEACH:"🏖️",MARKET:"🛍️",ADVENTURE:"🧗",MUSEUM:"🏛️",
          };
          const fallbackIcon = catIcons[place.category] ?? "📍";
          return src && !imgError ? (
            <img
              src={src}
              alt={place.title}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              style={{ ...imgStyle, filter: imgLoaded ? "blur(0px)" : "blur(10px)", transform: imgLoaded ? "scale(1)" : "scale(1.06)", opacity: imgLoaded ? 1 : 0, transition: "filter 0.5s ease, transform 0.5s ease, opacity 0.4s ease" }}
            />
          ) : (
            <div style={{ ...placeholder, background: `linear-gradient(135deg, ${catBg}88, ${catBg})` }}>
              <span style={{ fontSize: 48 }}>{fallbackIcon}</span>
            </div>
          );
        })()}

        {/* Gradient overlay */}
        <div style={gradient} />

        {/* Category chip */}
        <div style={chipCat}>{CAT_LABEL[place.category] ?? place.category}</div>

        {/* Rank badge */}
        {rank < 3 && <span style={rankBadge}>{RANK_EMOJI[rank]}</span>}

        {/* Verified */}
        {verified && <span style={verifiedBadge}>✓ ยืนยันแล้ว</span>}

        {/* Bottom text overlay */}
        <div style={bottomOverlay}>
          <p style={titleStyle}>{place.title}</p>
          <div style={locStyle}>
            <span>📍</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {[place.district, place.province].filter(Boolean).join(", ")}
            </span>
          </div>
        </div>
      </div>

      {/* Footer stats */}
      <div style={footer}>
        {rating != null && (
          <span style={{ ...statItem, color: "#f59e0b" }}>
            ⭐ {rating.toFixed(1)}
          </span>
        )}
        {reviews > 0 && (
          <span style={statItem}>
            💬 {reviews} รีวิว
          </span>
        )}
        {bookmarks > 0 && (
          <span style={statItem}>
            🔖 {bookmarks}
          </span>
        )}
        {reviews === 0 && bookmarks === 0 && rating == null && (
          <span style={{ ...statItem, color: "#94a3b8", fontStyle: "italic" }}>
            ยังไม่มีรีวิว
          </span>
        )}
        {place.titleEn && (
          <span style={{ ...statItem, marginLeft: "auto", color: "#94a3b8", fontStyle: "italic", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {place.titleEn}
          </span>
        )}
      </div>
    </Link>
    </div>
  );
}

// ── Main Section ─────────────────────────────────────────────────────────────
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

  // หยุด auto-load เมื่อหัวข้อ "ไฮไลต์สถานที่" (section ถัดไป) โผล่เข้าจอ
  const [reachedHighlight, setReachedHighlight] = useState(false);
  useEffect(() => {
    const el = typeof document !== "undefined" ? document.getElementById("explore-places-heading") : null;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => setReachedHighlight(entries[0]?.isIntersecting ?? false),
      { rootMargin: "0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const districts = province ? getDistricts(province) : [];

  const fetchArea = useCallback((page: number, append: boolean) => {
    if (!province) { setPlaces([]); setTotal(0); setAreaTotalPages(1); return; }
    append ? setAreaLoadingMore(true) : setLoading(true);
    const params = new URLSearchParams({ limit: String(AREA_PAGE_SIZE), page: String(page), sort: "popular" });
    params.set("province", province.split(" (")[0]);
    if (district) params.set("district", district);
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
  const areaSentinelRef = useInfiniteScroll(
    areaLoadMore,
    mode === "area" && areaHasMore && !areaLoadingMore && !loading && !reachedHighlight
  );

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
  const nearSentinelRef = useInfiniteScroll(
    nearLoadMore,
    mode === "nearby" && nearHasMore && !nearLoading && !reachedHighlight
  );

  // ── Styles ────────────────────────────────────────────────────────────────
  const wrap: CSSProperties = {
    background: "white",
    padding: "36px",
    borderRadius: 28,
    boxShadow: "0 8px 28px rgba(15,23,42,0.06)",
    marginTop: 48,
    border: "1px solid #f1f5f9",
    maxWidth: "100%",
    overflowX: "clip",
  };

  const selectBase: CSSProperties = {
    padding: "11px 14px",
    borderRadius: 12,
    border: "1.5px solid #e2e8f0",
    fontSize: 14,
    color: "#0f172a",
    background: "white",
    outline: "none",
    fontFamily: "inherit",
    cursor: "pointer",
    width: "100%",
  };

  const loadMoreBtn: CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "11px 28px", borderRadius: 999, border: "1.5px solid #cbd5e1",
    background: "white", color: "#0f766e", fontSize: 14, fontWeight: 800,
    cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
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
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: "0 0 6px" }}>
          📍 เจาะลึกรายพื้นที่{" "}
          <span style={{ color: "#2563eb" }}>Explore by Area</span>
        </h2>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
          สถานที่ยอดนิยมในจังหวัดที่คุณเลือก วัดจากยอด Bookmark · Top places by area
        </p>
      </div>

      {/* Tab toggle */}
      <div style={{ display: "inline-flex", gap: 4, padding: 4, background: "#f1f5f9", borderRadius: 14, marginBottom: 20 }}>
        {([
          { id: "area",   icon: "🗾", label: "เลือกพื้นที่" },
          { id: "nearby", icon: "📍", label: "ใกล้ฉัน" },
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
          <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>🗾 จังหวัด · Province</label>
          <select style={selectBase} value={province} onChange={e => handleProvinceChange(e.target.value)}>
            <option value="">-- เลือกจังหวัด / Select Province --</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>📌 อำเภอ · District</label>
          <select
            style={{ ...selectBase, opacity: !province ? 0.5 : 1, cursor: !province ? "not-allowed" : "pointer", background: !province ? "#f8fafc" : "white" }}
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
      <div style={{ display: "flex", flexWrap: "nowrap", overflowX: "auto", WebkitOverflowScrolling: "touch", gap: 8, marginBottom: 22, paddingBottom: 6, scrollbarWidth: "none" }}>
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
                border: active ? "1.5px solid #3b82f6" : "1.5px solid #e2e8f0",
                background: active ? "linear-gradient(135deg,#eff6ff,#dbeafe)" : "#f8fafc",
                cursor: "pointer",
                transition: "all 0.18s",
                fontFamily: "inherit",
                minWidth: 64,
                flexShrink: 0,
                boxShadow: active ? "0 2px 10px rgba(59,130,246,0.18)" : "none",
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{c.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: active ? "#1d4ed8" : "#334155", lineHeight: 1.2 }}>{c.label}</span>
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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "52px 20px", gap: 12, textAlign: "center", background: "#f8fafc", borderRadius: 18 }}>
            <span style={{ fontSize: 44 }}>📭</span>
            <p style={{ fontSize: 15, color: "#475569", fontWeight: 700, margin: 0 }}>ยังไม่มีสถานที่ใน{province.split(" (")[0]}</p>
            <small style={{ fontSize: 12, color: "#94a3b8" }}>No places in this area yet</small>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
              พบ <strong style={{ color: "#1e293b", fontWeight: 800 }}>{total}</strong> สถานที่ · {total} places
              {category ? ` · ${CAT_LABEL[category] ?? category}` : ""}
              {district ? ` · ${district}` : ""}
            </p>

            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 16, maxWidth: "100%" }}>
              {places.map((place, i) => (
                <ScrollReveal key={place.slug} delay={Math.min(i % AREA_PAGE_SIZE, 5) * 70}>
                  <PlaceCard place={place} rank={i} />
                </ScrollReveal>
              ))}
            </div>

            {/* Load more */}
            <div ref={areaSentinelRef} style={{ height: 1 }} />
            {areaLoadingMore && <Spinner />}
            {areaHasMore && !areaLoadingMore && (
              <div style={{ textAlign: "center", marginTop: 18 }}>
                <button onClick={areaLoadMore} style={loadMoreBtn}>โหลดเพิ่ม · Load more ↓</button>
              </div>
            )}
            {!areaHasMore && places.length > AREA_PAGE_SIZE && (
              <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, fontWeight: 600, marginTop: 18 }}>
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
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {RADIUS_OPTIONS.map(r => {
                  const active = radius === r.v;
                  return (
                    <button
                      key={r.v}
                      onClick={() => { setRadius(r.v); setRecenterKey(k => k + 1); }}
                      style={{
                        padding: "9px 16px", borderRadius: 11, fontFamily: "inherit",
                        border: active ? "1.5px solid #10b981" : "1.5px solid #e2e8f0",
                        background: active ? "linear-gradient(135deg,#ecfdf5,#d1fae5)" : "#f8fafc",
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
              <small style={{ fontSize: 12, color: "#64748b", maxWidth: 360 }}>
                ระบบจะขอสิทธิ์เข้าถึงตำแหน่ง แล้วปักหมุดบนแผนที่ — คุณลากหมุดเพื่อเลือกจุดที่ต้องการได้ (เฉพาะในประเทศไทย)
              </small>
            </div>
          ) : (
            <>
              {/* Category chips */}
              <div style={{ display: "flex", flexWrap: "nowrap", overflowX: "auto", WebkitOverflowScrolling: "touch", gap: 8, marginBottom: 16, paddingBottom: 6, scrollbarWidth: "none" }}>
                {PLACE_CATS.map(c => {
                  const active = nearCat === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setNearCat(c.id)}
                      style={{
                        display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 1,
                        padding: "8px 14px", borderRadius: 14,
                        border: active ? "1.5px solid #10b981" : "1.5px solid #e2e8f0",
                        background: active ? "linear-gradient(135deg,#ecfdf5,#d1fae5)" : "#f8fafc",
                        cursor: "pointer", transition: "all 0.18s", fontFamily: "inherit",
                        minWidth: 64, flexShrink: 0,
                        boxShadow: active ? "0 2px 10px rgba(16,185,129,0.18)" : "none",
                      }}
                    >
                      <span style={{ fontSize: 18, lineHeight: 1 }}>{c.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: active ? "#047857" : "#334155", lineHeight: 1.2 }}>{c.label}</span>
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
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 18px", textAlign: "center" }}>
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
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "44px 20px", gap: 10, textAlign: "center", background: "#f8fafc", borderRadius: 18 }}>
                  <span style={{ fontSize: 42 }}>🔍</span>
                  <p style={{ fontSize: 15, color: "#475569", fontWeight: 700, margin: 0 }}>ไม่พบสถานที่ในรัศมีนี้</p>
                  <small style={{ fontSize: 12, color: "#94a3b8" }}>ลองขยายระยะทาง หรือเปลี่ยนหมวด แล้วลากหมุดดูครับ</small>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 14px" }}>
                    พบ <strong style={{ color: "#1e293b", fontWeight: 800 }}>{nearPlaces.length}</strong> สถานที่ในรัศมี {RADIUS_OPTIONS.find(r => r.v === radius)?.label}
                    {nearCat ? ` · ${CAT_LABEL[nearCat] ?? nearCat}` : ""}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: cols >= 3 ? "1fr 1fr" : "1fr", gap: 12 }}>
                    {nearShown.map((p, i) => (
                      <ScrollReveal key={p.id} delay={Math.min(i % 12, 6) * 50}>
                        <NearbyCard place={p} />
                      </ScrollReveal>
                    ))}
                  </div>

                  {/* Load more */}
                  <div ref={nearSentinelRef} style={{ height: 1 }} />
                  {nearHasMore ? (
                    <div style={{ textAlign: "center", marginTop: 18 }}>
                      <button onClick={nearLoadMore} style={loadMoreBtn}>
                        โหลดเพิ่ม · Load more ({nearPlaces.length - nearVisible} เหลือ) ↓
                      </button>
                    </div>
                  ) : (
                    <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, fontWeight: 600, marginTop: 18 }}>
                      แสดงครบทั้ง {nearPlaces.length} สถานที่ในรัศมีนี้แล้ว
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

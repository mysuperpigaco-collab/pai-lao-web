"use client";
import { useState, useEffect, CSSProperties } from "react";
import Link from "next/link";
import { PROVINCES, getDistricts } from "@/data/thailand";

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
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const verified = place.business?.isVerified || place.isVerified;
  const bookmarks = place._count?.bookmarks ?? 0;
  const reviews   = place._count?.reviews   ?? 0;
  const rating    = place.avgRating;
  const [catBg, catFg] = CAT_COLOR[place.category] ?? ["#eff6ff", "#2563eb"];

  const card: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    borderRadius: 20,
    overflow: "hidden",
    background: "white",
    textDecoration: "none",
    color: "inherit",
    boxShadow: hovered
      ? "0 16px 40px rgba(15,23,42,0.14)"
      : "0 2px 12px rgba(15,23,42,0.06)",
    transform: hovered ? "translateY(-6px)" : "translateY(0)",
    transition: "box-shadow 0.25s, transform 0.25s",
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
    transition: "transform 0.35s",
    transform: hovered ? "scale(1.06)" : "scale(1)",
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
    <Link
      href={`/place/${place.slug}`}
      style={card}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
              style={imgStyle}
              loading="lazy"
              onError={() => setImgError(true)}
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
  const cols = useColumns();

  const districts = province ? getDistricts(province) : [];

  useEffect(() => {
    if (!province) { setPlaces([]); setTotal(0); return; }
    setLoading(true);
    const params = new URLSearchParams({ limit: "12", sort: "popular" });
    params.set("province", province.split(" (")[0]);
    if (district) params.set("district", district);
    if (category) params.set("category", category);
    fetch(`/api/places?${params}`)
      .then(r => r.json())
      .then(d => { setPlaces(d.places ?? []); setTotal(d.total ?? 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, [province, district, category]);

  const handleProvinceChange = (v: string) => { setProvince(v); setDistrict(""); setCategory(""); };

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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "52px 20px", gap: 12, textAlign: "center", background: "#f8fafc", borderRadius: 18 }}>
            <span style={{ fontSize: 44 }}>🗺️</span>
            <p style={{ fontSize: 15, color: "#475569", fontWeight: 700, margin: 0 }}>เลือกจังหวัดเพื่อดูสถานที่ยอดนิยม</p>
            <small style={{ fontSize: 12, color: "#94a3b8" }}>Select a province to explore popular places</small>
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
                <PlaceCard key={place.slug} place={place} rank={i} />
              ))}
            </div>

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
    </section>
  );
}

"use client";
import { useState, useEffect, CSSProperties } from "react";
import Link from "next/link";
import { useTiltCard } from "@/hooks/useTiltCard";
import ScrollReveal from "@/components/ui/ScrollReveal";

interface Trip {
  slug: string; title: string; coverUrl?: string | null;
  province?: string | null; district?: string | null; mood?: string | null;
  author?: { displayName?: string | null; firstName: string; avatarUrl?: string | null };
  _count?: { reviews: number; bookmarks: number; likes: number };
  avgRating?: number | null; viewCount?: number; createdAt?: string;
}
interface Place {
  id: string; slug: string; title: string; titleEn?: string | null;
  coverUrl: string; province: string; district: string; category: string;
  _count?: { reviews: number; bookmarks: number };
  business?: { businessName: string; isVerified?: boolean } | null;
  communityCover?: string | null;
}

const TABS = [
  { id: "recent",        icon: "✨", label: "เพิ่งไปเล่ามา",  en: "Latest Stories", type: "trip",  param: "" },
  { id: "NATURE",        icon: "🌿", label: "ธรรมชาติ",        en: "Nature",         type: "place", param: "NATURE" },
  { id: "CAFE",          icon: "☕", label: "คาเฟ่",           en: "Café",           type: "place", param: "CAFE" },
  { id: "BEACH",         icon: "🏖️", label: "ชายหาด",         en: "Beach",          type: "place", param: "BEACH" },
  { id: "ACCOMMODATION", icon: "🏨", label: "ที่พัก",          en: "Stay",           type: "place", param: "ACCOMMODATION" },
  { id: "FOOD",          icon: "🍲", label: "อาหาร",           en: "Food",           type: "place", param: "FOOD" },
  { id: "TEMPLE",        icon: "🛕", label: "วัด",             en: "Temple",         type: "place", param: "TEMPLE" },
  { id: "ADVENTURE",     icon: "🧗", label: "ผจญภัย",         en: "Adventure",      type: "place", param: "ADVENTURE" },
  { id: "MARKET",        icon: "🛍️", label: "ตลาด",           en: "Market",         type: "place", param: "MARKET" },
  { id: "MUSEUM",        icon: "🏛️", label: "พิพิธภัณฑ์",    en: "Museum",         type: "place", param: "MUSEUM" },
  { id: "CAMPING",       icon: "⛺", label: "แคมปิ้ง",        en: "Camping",        type: "place", param: "CAMPING" },
] as const;

function fmt(n?: number) {
  if (!n) return "0";
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "K" : String(n);
}

const S: Record<string, CSSProperties> = {
  root:    { marginTop: 20, maxWidth: "100%", overflowX: "clip" },
  tabWrap: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 22, scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as CSSProperties,
  tabBase: { flexShrink: 0, display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "10px 16px", borderRadius: 14, minWidth: 72, border: "none", cursor: "pointer", fontFamily: "inherit", background: "#f1f5f9", color: "#475569", transition: "all .2s" },
  tabActive: { background: "#0f172a", color: "#fff", boxShadow: "0 4px 14px rgba(15,23,42,.25)" },
  tabIcon: { fontSize: 20, lineHeight: 1 },
  tabTh:   { fontSize: 12, fontWeight: 700 },
  tabEn:   { fontSize: 11, fontWeight: 700, opacity: 0.75 },
  empty:   { textAlign: "center", padding: 52, color: "#94a3b8", fontSize: 15 },
  grid5:   { display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 16 },
  grid4:   { display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16 },
  card:    { display: "flex", flexDirection: "column", borderRadius: 20, overflow: "hidden", background: "#fff", textDecoration: "none", color: "inherit", boxShadow: "0 2px 12px rgba(15,23,42,.06)", border: "1px solid #f1f5f9", transition: "transform .22s ease, box-shadow .22s ease", minWidth: 0 },
  imgWrap: { position: "relative", height: 164, overflow: "hidden", background: "#e2e8f0", flexShrink: 0 },
  imgEl:   { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  grad:    { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,23,42,.55) 0%, transparent 55%)", pointerEvents: "none" },
  chipProv: { position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,.88)", color: "#0f172a", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999, backdropFilter: "blur(6px)", boxShadow: "0 2px 6px rgba(0,0,0,.12)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  chipRate: { position: "absolute", top: 10, right: 10, background: "rgba(251,191,36,.92)", color: "#1e293b", fontSize: 10, fontWeight: 800, padding: "4px 9px", borderRadius: 999 },
  chipMood: { position: "absolute", bottom: 10, left: 10, background: "rgba(99,102,241,.85)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999, backdropFilter: "blur(4px)", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  chipGreen:{ position: "absolute", top: 10, right: 10, background: "#dcfce7", color: "#15803d", fontSize: 10, fontWeight: 800, padding: "4px 9px", borderRadius: 999 },
  body:    { padding: "12px 14px 13px", flex: 1, display: "flex", flexDirection: "column", gap: 6 },
  title:   { fontSize: 14, fontWeight: 800, color: "#1e293b", margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.35, height: "2.7em" } as CSSProperties,
  footer:  { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginTop: "auto", paddingTop: 6, borderTop: "1px solid #f1f5f9" },
  author:  { display: "flex", alignItems: "center", gap: 6, minWidth: 0, overflow: "hidden" },
  avatarImg: { width: 22, height: 22, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1.5px solid #e2e8f0", display: "block" },
  avatarPh:  { width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#10b981,#06b6d4)", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" },
  authorName: { fontSize: 11, fontWeight: 700, color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  stats:   { display: "flex", gap: 6, flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#94a3b8" },
  loc:     { fontSize: 11, color: "#64748b", fontWeight: 600 },
  seeAll:  { display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 14, background: "linear-gradient(135deg,#0f172a,#1e3a8a)", color: "#fff", textDecoration: "none", fontWeight: 800, fontSize: 14, boxShadow: "0 4px 14px rgba(15,23,42,.18)" },
};

function useColumns(cols5: number, cols4: number) {
  const [cols, setCols] = useState({ trip: cols5, place: cols4 });
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setCols({
        trip:  w <= 640 ? 2 : w <= 900 ? 3 : w <= 1200 ? 4 : cols5,
        place: w <= 640 ? 2 : w <= 900 ? 3 : cols4,
      });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [cols5, cols4]);
  return cols;
}

function TripCard({ trip }: { trip: Trip }) {
  const { cardRef, shineRef, onMove, onLeave, shineStyle } = useTiltCard();
  const [imgLoaded, setImgLoaded] = useState(false);
  const province = trip.province?.split(" (")[0] ?? "";
  const author   = trip.author?.displayName || trip.author?.firstName || "";
  const avatar   = trip.author?.avatarUrl;

  return (
    <div ref={cardRef} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ position: "relative", willChange: "transform", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(15,23,42,.06)" }}>
      <div ref={shineRef} style={shineStyle} />
      <Link href={`/trips/${trip.slug}`} style={{ ...S.card, boxShadow: "none" }}>
        <div style={S.imgWrap}>
          {trip.coverUrl
            ? <img src={trip.coverUrl} alt={trip.title} loading="lazy"
                onLoad={() => setImgLoaded(true)}
                style={{ ...S.imgEl, filter: imgLoaded ? "blur(0px)" : "blur(10px)", transform: imgLoaded ? "scale(1)" : "scale(1.06)", opacity: imgLoaded ? 1 : 0, transition: "filter 0.5s ease, transform 0.5s ease, opacity 0.4s ease" }} />
            : <div style={{ ...S.imgEl, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🗺️</div>
          }
          {province && <span style={S.chipProv}>{province}</span>}
          {trip.avgRating != null && trip.avgRating > 0 && <span style={S.chipRate}>⭐ {trip.avgRating.toFixed(1)}</span>}
          {trip.mood && <span style={S.chipMood}>{trip.mood}</span>}
          <div style={S.grad} />
        </div>
        <div style={S.body}>
          <h4 style={S.title}>{trip.title}</h4>
          <div style={S.footer}>
            <div style={S.author}>
              {avatar
                ? <img src={avatar} alt={author} style={S.avatarImg} />
                : <div style={S.avatarPh}>{author?.[0] ?? "?"}</div>
              }
              <span style={S.authorName}>{author}</span>
            </div>
            <div style={S.stats}>
              <span>👁 {fmt(trip.viewCount)}</span>
              <span>❤️ {fmt(trip._count?.likes)}</span>
              <span>💬 {fmt(trip._count?.reviews)}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

function PlaceCard({ place }: { place: Place }) {
  const { cardRef, shineRef, onMove, onLeave, shineStyle } = useTiltCard();
  const [imgError,  setImgError ] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const prov = place.province?.split(" (")[0] ?? place.province;
  const displayImg = (!place.business && place.communityCover)
    ? place.communityCover
    : (place.coverUrl && place.coverUrl !== "/images/default-place.svg" ? place.coverUrl : (place.communityCover || ""));
  const showImg = !!displayImg && !imgError;
  const catColors: Record<string,string> = {
    NATURE:"#16a34a",CAFE:"#92400e",ACCOMMODATION:"#1d4ed8",CAMPING:"#15803d",
    FOOD:"#b91c1c",TEMPLE:"#7c3aed",BEACH:"#0369a1",MARKET:"#b45309",ADVENTURE:"#c2410c",MUSEUM:"#6b21a8",
  };
  const catIcons: Record<string,string> = {
    NATURE:"🌿",CAFE:"☕",ACCOMMODATION:"🏨",CAMPING:"⛺",
    FOOD:"🍲",TEMPLE:"🛕",BEACH:"🏖️",MARKET:"🛍️",ADVENTURE:"🧗",MUSEUM:"🏛️",
  };
  const fallbackColor = catColors[place.category] ?? "#0f766e";
  const fallbackIcon  = catIcons[place.category]  ?? "📍";
  return (
    <div ref={cardRef} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ position: "relative", willChange: "transform", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(15,23,42,.06)" }}>
      <div ref={shineRef} style={shineStyle} />
      <Link href={`/place/${place.slug}`} style={{ ...S.card, boxShadow: "none" }}>
        <div style={S.imgWrap}>
          {showImg
            ? <img src={displayImg!} alt={place.title} loading="lazy"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                style={{ ...S.imgEl, filter: imgLoaded ? "blur(0px)" : "blur(10px)", transform: imgLoaded ? "scale(1)" : "scale(1.06)", opacity: imgLoaded ? 1 : 0, transition: "filter 0.5s ease, transform 0.5s ease, opacity 0.4s ease" }} />
            : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center",
                background:`linear-gradient(135deg, ${fallbackColor}22, ${fallbackColor}44)` }}>
                <span style={{ fontSize:52 }}>{fallbackIcon}</span>
              </div>
          }
          {prov && <span style={S.chipProv}>{prov}</span>}
          {place.business?.isVerified && <span style={S.chipGreen}>✓ Verified</span>}
          <div style={S.grad} />
        </div>
        <div style={S.body}>
          <h4 style={S.title}>{place.title}</h4>
          <p style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic", margin: 0, minHeight: "1.4em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{place.titleEn || ""}</p>
          <div style={S.footer}>
            <span style={S.loc}>📍 {[place.district, prov].filter(Boolean).join(", ")}</span>
            <div style={S.stats}>
              {(place._count?.reviews ?? 0) > 0 && <span>⭐ {place._count!.reviews}</span>}
              {(place._count?.bookmarks ?? 0) > 0 && <span>🔖 {place._count!.bookmarks}</span>}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}


// ── Skeleton Grid ─────────────────────────────────────────────────────────────
function SkeletonGrid({ cols }: { cols: number }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 16 }}>
        {Array.from({ length: cols * 2 }).map((_, i) => (
          <div key={i} style={{ borderRadius: 20, overflow: "hidden", border: "1px solid #f1f5f9", background: "white" }}>
            {/* Image area */}
            <div style={{ position: "relative", paddingBottom: "62%", background: "#f1f5f9", overflow: "hidden" }}>
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 45%, #f1f5f9 90%)",
                backgroundSize: "200% 100%",
                animation: `skshimmer 1.5s ease infinite ${(i * 0.08).toFixed(2)}s`,
              }} />
              {/* Chip placeholder */}
              <div style={{ position: "absolute", top: 10, left: 10, width: 56, height: 18, borderRadius: 999, background: "#e2e8f0", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 45%, #e2e8f0 90%)", backgroundSize: "200% 100%", animation: `skshimmer 1.5s ease infinite ${(i * 0.08 + 0.15).toFixed(2)}s` }} />
              </div>
            </div>
            {/* Footer */}
            <div style={{ padding: "9px 12px", display: "flex", alignItems: "center", gap: 8, borderTop: "1px solid #f8fafc" }}>
              <div style={{ flex: 1, height: 9, borderRadius: 6, background: "#f1f5f9", overflow: "hidden", position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 45%, #f1f5f9 90%)", backgroundSize: "200% 100%", animation: `skshimmer 1.5s ease infinite ${(i * 0.08 + 0.25).toFixed(2)}s` }} />
              </div>
              <div style={{ width: 36, height: 9, borderRadius: 6, background: "#f1f5f9", overflow: "hidden", position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 45%, #f1f5f9 90%)", backgroundSize: "200% 100%", animation: `skshimmer 1.5s ease infinite ${(i * 0.08 + 0.35).toFixed(2)}s` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes skshimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
}

export default function AutoGridSection() {
  const [activeTab, setActiveTab] = useState("recent");
  const [trips,   setTrips  ] = useState<Trip[]>([]);
  const [places,  setPlaces ] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const cols = useColumns(5, 4);

  const tab = TABS.find(t => t.id === activeTab)!;

  useEffect(() => {
    setLoading(true);
    if (tab.type === "trip") {
      fetch("/api/trips?limit=20&sort=recent")
        .then(r => r.json()).then(d => { setTrips(d.trips ?? []); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      fetch(`/api/places?limit=12&category=${tab.param}&sort=popular`)
        .then(r => r.json()).then(d => { setPlaces(d.places ?? []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [activeTab]);

  return (
    <div style={S.root}>
      {/* Tabs */}
      <div style={S.tabWrap}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ ...S.tabBase, ...(activeTab === t.id ? S.tabActive : {}) }}>
            <span style={S.tabIcon}>{t.icon}</span>
            <span style={S.tabTh}>{t.label}</span>
            <span style={{ ...S.tabEn, ...(activeTab === t.id ? { opacity: 0.9 } : {}) }}>{t.en}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonGrid cols={tab.type === "trip" ? cols.trip : cols.place} />
      ) : tab.type === "trip" ? (
        trips.length === 0 ? <div style={S.empty}>ยังไม่มีเรื่องเล่า</div> : (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols.trip},1fr)`, gap: 16 }}>
            {trips.map((t, i) => (
              <ScrollReveal key={t.slug} delay={Math.min(i, 5) * 70}>
                <TripCard trip={t} />
              </ScrollReveal>
            ))}
          </div>
        )
      ) : (
        places.length === 0 ? <div style={S.empty}>ยังไม่มีสถานที่</div> : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols.place},1fr)`, gap: 16 }}>
              {places.map((p, i) => (
                <ScrollReveal key={p.slug} delay={Math.min(i, 5) * 70}>
                  <PlaceCard place={p} />
                </ScrollReveal>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 28 }}>
              <Link href={`/place?category=${tab.param}&sort=popular`} style={S.seeAll}>
                ดูสถานที่{tab.label}ทั้งหมด · See all {tab.en} →
              </Link>
            </div>
          </>
        )
      )}
    </div>
  );
}

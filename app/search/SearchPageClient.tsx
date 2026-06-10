"use client";
import ProvinceSelect from "@/components/ui/ProvinceSelect";
import DistrictSelect from "@/components/ui/DistrictSelect";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTiltCard } from "@/hooks/useTiltCard";

// ── Types ───────────────────────────────────────────────
interface TripResult {
  slug: string; title: string; coverUrl?: string | null;
  province?: string | null; district?: string | null;
  mood?: string | null; avgRating?: number | null;
  _count?: { reviews: number; bookmarks: number; likes: number };
  author?: { displayName?: string | null; firstName: string };
  createdAt?: string;
}
interface PlaceResult {
  slug: string; title: string; titleEn?: string | null;
  coverUrl: string; province: string; district: string;
  category: string;
  communityCover?: string | null;
  _count?: { reviews: number; bookmarks: number };
  business?: { businessName: string; isVerified?: boolean } | null;
}

// ── Constants ────────────────────────────────────────────
const CATEGORIES = [
  { value:"",              label:"ทุกหมวด" },
  { value:"NATURE",        label:"🌿 ธรรมชาติ" },
  { value:"CAFE",          label:"☕ คาเฟ่" },
  { value:"BEACH",         label:"🏖️ ชายหาด" },
  { value:"ACCOMMODATION", label:"🏨 ที่พัก" },
  { value:"FOOD",          label:"🍲 อาหาร" },
  { value:"TEMPLE",        label:"🛕 วัด" },
  { value:"ADVENTURE",     label:"🧗 ผจญภัย" },
  { value:"MARKET",        label:"🛍️ ตลาด" },
  { value:"MUSEUM",        label:"🏛️ พิพิธภัณฑ์" },
  { value:"CAMPING",       label:"⛺ แคมปิ้ง" },
];

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

const CAT_ICON: Record<string,string>  = { NATURE:"🌿",CAFE:"☕",ACCOMMODATION:"🏨",CAMPING:"⛺",FOOD:"🍲",TEMPLE:"🛕",BEACH:"🏖️",MARKET:"🛍️",ADVENTURE:"🧗",MUSEUM:"🏛️" };
const CAT_LABEL: Record<string,string> = { NATURE:"ธรรมชาติ",CAFE:"คาเฟ่",ACCOMMODATION:"ที่พัก",CAMPING:"แคมปิ้ง",FOOD:"อาหาร",TEMPLE:"วัด",BEACH:"ชายหาด",MARKET:"ตลาด",ADVENTURE:"ผจญภัย",MUSEUM:"พิพิธภัณฑ์" };
const CAT_COLOR: Record<string,string> = { NATURE:"#16a34a",CAFE:"#92400e",ACCOMMODATION:"#1d4ed8",CAMPING:"#15803d",FOOD:"#b91c1c",TEMPLE:"#7c3aed",BEACH:"#0369a1",MARKET:"#b45309",ADVENTURE:"#c2410c",MUSEUM:"#6b21a8" };

function SearchPlaceCard({ place }: { place: PlaceResult }) {
  const { cardRef, shineRef, onMove, onLeave, shineStyle } = useTiltCard();
  const [imgErr, setImgErr] = useState(false);
  const icon  = CAT_ICON[place.category]  ?? "📍";
  const color = CAT_COLOR[place.category] ?? "#0f172a";
  const prov  = place.province?.split(" (")[0] ?? "";
  const displayImg = (!place.business && place.communityCover)
    ? place.communityCover
    : ((place.coverUrl && place.coverUrl !== "/images/default-place.svg") ? place.coverUrl : (place.communityCover || null));
  const showImg = !!displayImg && !imgErr;

  return (
    <Link href={`/place/${place.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div ref={cardRef} onMouseMove={onMove} onMouseLeave={onLeave}
        style={{ display: "flex", flexDirection: "column", borderRadius: 20, overflow: "hidden", background: "#fff", border: "1px solid #f1f5f9", position: "relative", willChange: "transform" }}>
        <div ref={shineRef} style={shineStyle} />

      {/* Image */}
      <div style={{ position: "relative", height: 164, overflow: "hidden", background: "#e2e8f0", flexShrink: 0 }}>
        {showImg
          ? <img src={displayImg!} alt={place.title} loading="lazy" onError={() => setImgErr(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .35s ease" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${color}18, ${color}38)` }}>
              <span style={{ fontSize: 48 }}>{icon}</span>
            </div>
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,23,42,.65) 0%, transparent 55%)", pointerEvents: "none" }} />
        {/* Province badge */}
        <div style={{ position: "absolute", top: 10, left: 10, right: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          {prov && <span style={{ background: "rgba(255,255,255,.88)", color: "#0f172a", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999, backdropFilter: "blur(6px)" }}>{prov}</span>}
          {place.business?.isVerified && <span style={{ background: "rgba(22,163,74,.88)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "4px 8px", borderRadius: 999 }}>✓</span>}
        </div>
        {/* Category badge */}
        <div style={{ position: "absolute", bottom: 10, left: 10 }}>
          <span style={{ background: "rgba(15,23,42,.7)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, backdropFilter: "blur(4px)" }}>
            {icon} {CAT_LABEL[place.category] ?? place.category}
          </span>
        </div>
        {/* Review count */}
        {(place._count?.reviews ?? 0) > 0 && (
          <span style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(15,23,42,.65)", color: "white", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999 }}>
            ⭐ {place._count!.reviews}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "12px 14px", flex: 1 }}>
        <h4 style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", margin: "0 0 3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{place.title}</h4>
        {place.titleEn && <p style={{ fontSize: 11, color: "#64748b", fontStyle: "italic", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{place.titleEn}</p>}
        <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>📍 {[place.district, place.province?.split(" (")[0]].filter(Boolean).join(", ")}</p>
      </div>
      </div>
    </Link>
  );
}

function SearchTripCard({ trip }: { trip: TripResult }) {
  const { cardRef, shineRef, onMove, onLeave, shineStyle } = useTiltCard();
  return (
    <Link href={`/trips/${trip.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div ref={cardRef} onMouseMove={onMove} onMouseLeave={onLeave}
        style={{ borderRadius: 20, overflow: "hidden", background: "#fff", border: "1px solid #f1f5f9", position: "relative", willChange: "transform" }}>
        <div ref={shineRef} style={shineStyle} />
        <div style={{ position: "relative", height: 140, background: "#e2e8f0", overflow: "hidden" }}>
          {trip.coverUrl
            ? <img src={trip.coverUrl} alt={trip.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🗺️</div>
          }
          {trip.avgRating != null && trip.avgRating > 0 && (
            <span style={{ position: "absolute", top: 8, left: 8, background: "rgba(251,191,36,0.92)", color: "#1e293b", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 999 }}>⭐ {trip.avgRating.toFixed(1)}</span>
          )}
          <div style={{ position: "absolute", bottom: 8, right: 8, display: "flex", gap: 4 }}>
            {(trip._count?.likes ?? 0) > 0 && <span style={{ background: "rgba(15,23,42,0.65)", color: "white", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999 }}>❤️ {trip._count!.likes}</span>}
            {(trip._count?.reviews ?? 0) > 0 && <span style={{ background: "rgba(15,23,42,0.65)", color: "white", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999 }}>💬 {trip._count!.reviews}</span>}
          </div>
        </div>
        <div style={{ padding: "11px 13px" }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", margin: "0 0 3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{trip.title}</h4>
          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
            {trip.province ? `📍 ${trip.province}` : ""}
            {trip.author ? ` · ${trip.author.displayName || trip.author.firstName}` : ""}
          </p>
          {trip.createdAt && <p style={{ fontSize: 10, color: "#cbd5e1", margin: "2px 0 0" }}>{formatDate(trip.createdAt)}</p>}
        </div>
      </div>
    </Link>
  );
}

export default function SearchPageClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const [q, setQ]             = useState(sp.get("q") ?? "");
  const [type, setType]       = useState(sp.get("type") ?? "all");
  const [province, setProv]   = useState(sp.get("province") ?? "");
  const [district, setDistrict] = useState(sp.get("district") ?? "");
  const [category, setCat]    = useState(sp.get("category") ?? "");
  const [sort, setSort]       = useState(sp.get("sort") ?? "recent");

  const [trips,  setTrips]  = useState<TripResult[]>([]);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [totalTrips, setTotalTrips]   = useState(0);
  const [totalPlaces, setTotalPlaces] = useState(0);
  const [searchError, setSearchError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = async (overrides?: Partial<{ q: string; type: string; province: string; district: string; category: string; sort: string }>) => {
    const fq       = overrides?.q        ?? q;
    const ftype    = overrides?.type     ?? type;
    const fprov    = overrides?.province ?? province;
    const fdist    = overrides?.district ?? district;
    const fcat     = overrides?.category ?? category;
    const fsort    = overrides?.sort     ?? sort;
    if (!fq.trim()) {
      setSearchError("กรุณาพิมพ์คำค้นหา · Please enter a search keyword");
      inputRef.current?.focus();
      return;
    }
    setSearchError("");
    setLoading(true);
    setSearched(true);

    // Update URL
    const params = new URLSearchParams();
    if (fq)              params.set("q", fq);
    if (ftype !== "all") params.set("type", ftype);
    if (fprov)           params.set("province", fprov);
    if (fdist)           params.set("district", fdist);
    if (fcat)            params.set("category", fcat);
    if (fsort !== "recent") params.set("sort", fsort);
    router.replace(`/search?${params.toString()}`, { scroll: false });

    // strip "(English)" suffix ที่ ProvinceSelect อาจส่งมา
    const cleanProv = fprov ? fprov.split(" (")[0].trim() : "";
    const provQ = cleanProv ? `&province=${encodeURIComponent(cleanProv)}` : "";
    const distQ = fdist ? `&district=${encodeURIComponent(fdist)}` : "";
    const catQ  = fcat  ? `&category=${fcat}` : "";

    const fetchers = [];
    if (ftype === "all" || ftype === "trip") {
      fetchers.push(
        fetch(`/api/trips?q=${encodeURIComponent(fq)}&limit=20&sort=${fsort}${provQ}${distQ}`)
          .then(r => r.json())
          .then(d => { setTrips(d.trips ?? []); setTotalTrips(d.total ?? 0); })
      );
    }
    if (ftype === "all" || ftype === "place") {
      fetchers.push(
        fetch(`/api/places?q=${encodeURIComponent(fq)}&limit=20&sort=${fsort}${provQ}${distQ}${catQ}`)
          .then(r => r.json())
          .then(d => { setPlaces(d.places ?? []); setTotalPlaces(d.total ?? 0); })
      );
    }
    if (ftype === "trip")  { setPlaces([]); setTotalPlaces(0); }
    if (ftype === "place") { setTrips([]);  setTotalTrips(0);  }

    await Promise.allSettled(fetchers);
    setLoading(false);
  };

  // Search on mount if q is in URL
  useEffect(() => {
    const initQ = sp.get("q");
    if (initQ) {
      setQ(initQ);
      doSearch({ q: initQ, type: sp.get("type") ?? "all", province: sp.get("province") ?? "", district: sp.get("district") ?? "", category: sp.get("category") ?? "", sort: sp.get("sort") ?? "recent" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); doSearch(); };

  const totalResults = totalTrips + totalPlaces;

  return (
    <div className="srch-page" style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 20px 80px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", margin: "0 0 6px" }}>
          🔍 ค้นหา · Search
        </h1>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
          ค้นหาทริปและสถานที่ท่องเที่ยวทั่วไทย · Find trips and places across Thailand
        </p>
      </div>

      {/* ── Search form ── */}
      <form onSubmit={handleSubmit} className="srch-form" style={{ background: "white", borderRadius: 20, padding: 22, border: "1.5px solid #e2e8f0", boxShadow: "0 4px 20px rgba(15,23,42,0.06)", marginBottom: 28 }}>
        {/* Main search row */}
        <div className="srch-row" style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", background: "#f8fafc", borderRadius: 14, border: "1.5px solid #e2e8f0", padding: "0 14px", height: 48, gap: 10 }}>
            <span style={{ color: "#94a3b8", display: "flex", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="ชื่อทริป สถานที่ หรือจังหวัด..."
              style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 15, color: "#1e293b" }}
              autoFocus
            />
            {q && (
              <button type="button" onClick={() => setQ("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 18, lineHeight: 1 }}>×</button>
            )}
          </div>
          <button type="submit" style={{ padding: "0 28px", height: 48, borderRadius: 14, border: "none", background: "linear-gradient(135deg, #10b981, #06b6d4)", color: "white", fontWeight: 800, fontSize: 15, cursor: "pointer", flexShrink: 0, fontFamily: "inherit", boxShadow: "0 4px 14px rgba(16,185,129,0.3)" }}>
            ค้นหา
          </button>
        </div>

        {/* Validation error */}
        {searchError && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: 10, padding: "10px 14px", marginBottom: 8, color: "#c2410c", fontSize: 13, fontWeight: 700 }}>
            ⚠️ {searchError}
          </div>
        )}

        {/* Filter row 1 — Type toggle */}
        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 12, padding: 4, gap: 2, marginBottom: 12, alignSelf: "flex-start" }}>
          {[{ v:"all", l:"ทั้งหมด" }, { v:"trip", l:"✈️ ทริป" }, { v:"place", l:"🗺️ สถานที่" }].map(opt => (
            <button key={opt.v} type="button" onClick={() => setType(opt.v)}
              style={{ padding: "7px 18px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: type === opt.v ? 800 : 500,
                background: type === opt.v ? "white" : "transparent",
                color: type === opt.v ? "#0f172a" : "#64748b",
                boxShadow: type === opt.v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s" }}>
              {opt.l}
            </button>
          ))}
        </div>

        {/* Filter row 2 — Location + Category + Sort */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>

          {/* Province */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "0 14px", height: 44, flex: "1 1 180px", minWidth: 160, boxSizing: "border-box" }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>🗾</span>
            <ProvinceSelect
              value={province}
              onChange={v => { setProv(v); setDistrict(""); }}
              placeholder="ทุกจังหวัด"
              style={{ border: "none", background: "transparent", fontSize: 13, height: 44, padding: "0", boxShadow: "none", display: "flex", alignItems: "center" }}
            />
          </div>

          {/* District */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "0 14px", height: 44, flex: "1 1 160px", minWidth: 140, boxSizing: "border-box" }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>🏘️</span>
            <DistrictSelect
              province={province.split(" (")[0]}
              value={district}
              onChange={v => setDistrict(v)}
              placeholder="ทุกอำเภอ"
              style={{ border: "none", background: "transparent", fontSize: 13, height: 44, padding: "0", boxShadow: "none", display: "flex", alignItems: "center" }}
            />
          </div>

          {/* Category */}
          {type !== "trip" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "6px 14px", flex: "1 1 140px" }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>🏷️</span>
              <select value={category} onChange={e => setCat(e.target.value)}
                style={{ border: "none", background: "transparent", fontSize: 13, color: "#374151", fontFamily: "inherit", cursor: "pointer", flex: 1, outline: "none", minHeight: 32 }}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          )}

          {/* Sort */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "6px 14px" }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>📊</span>
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ border: "none", background: "transparent", fontSize: 13, color: "#374151", fontFamily: "inherit", cursor: "pointer", outline: "none", minHeight: 32 }}>
              <option value="recent">🕐 ล่าสุด</option>
              <option value="popular">🔥 ยอดนิยม</option>
            </select>
          </div>

          {/* Apply */}
          {searched && (
            <button type="submit" style={{ padding: "8px 20px", height: 44, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#10b981,#06b6d4)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>
              ✓ กรอง
            </button>
          )}
        </div>
      </form>

      {/* ── Results ── */}
      {loading ? (
        <>
            <div style={{display:"grid",gridTemplateColumns:`repeat(3,1fr)`,gap:12}}>
              <div style={{borderRadius:16,overflow:"hidden",border:"1px solid #f1f5f9",background:"white"}}>
                <div style={{position:"relative",paddingBottom:"62%",background:"#f1f5f9",overflow:"hidden"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.00s`}}/>
                </div>
                <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{position:"relative",width:"70%",height:9,borderRadius:5,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.1s`}}/>
            </div>
                  <div style={{position:"relative",width:"45%",height:7,borderRadius:4,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.2s`}}/>
            </div>
                </div>
              </div>
              <div style={{borderRadius:16,overflow:"hidden",border:"1px solid #f1f5f9",background:"white"}}>
                <div style={{position:"relative",paddingBottom:"62%",background:"#f1f5f9",overflow:"hidden"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.07s`}}/>
                </div>
                <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{position:"relative",width:"70%",height:9,borderRadius:5,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.17s`}}/>
            </div>
                  <div style={{position:"relative",width:"45%",height:7,borderRadius:4,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.27s`}}/>
            </div>
                </div>
              </div>
              <div style={{borderRadius:16,overflow:"hidden",border:"1px solid #f1f5f9",background:"white"}}>
                <div style={{position:"relative",paddingBottom:"62%",background:"#f1f5f9",overflow:"hidden"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.14s`}}/>
                </div>
                <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{position:"relative",width:"70%",height:9,borderRadius:5,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.24000000000000002s`}}/>
            </div>
                  <div style={{position:"relative",width:"45%",height:7,borderRadius:4,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.34s`}}/>
            </div>
                </div>
              </div>
              <div style={{borderRadius:16,overflow:"hidden",border:"1px solid #f1f5f9",background:"white"}}>
                <div style={{position:"relative",paddingBottom:"62%",background:"#f1f5f9",overflow:"hidden"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.21s`}}/>
                </div>
                <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{position:"relative",width:"70%",height:9,borderRadius:5,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.31000000000000005s`}}/>
            </div>
                  <div style={{position:"relative",width:"45%",height:7,borderRadius:4,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.41000000000000003s`}}/>
            </div>
                </div>
              </div>
              <div style={{borderRadius:16,overflow:"hidden",border:"1px solid #f1f5f9",background:"white"}}>
                <div style={{position:"relative",paddingBottom:"62%",background:"#f1f5f9",overflow:"hidden"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.28s`}}/>
                </div>
                <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{position:"relative",width:"70%",height:9,borderRadius:5,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.38s`}}/>
            </div>
                  <div style={{position:"relative",width:"45%",height:7,borderRadius:4,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.48000000000000004s`}}/>
            </div>
                </div>
              </div>
              <div style={{borderRadius:16,overflow:"hidden",border:"1px solid #f1f5f9",background:"white"}}>
                <div style={{position:"relative",paddingBottom:"62%",background:"#f1f5f9",overflow:"hidden"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.35s`}}/>
                </div>
                <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{position:"relative",width:"70%",height:9,borderRadius:5,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.45000000000000007s`}}/>
            </div>
                  <div style={{position:"relative",width:"45%",height:7,borderRadius:4,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.55s`}}/>
            </div>
                </div>
              </div>
            </div>
            <style>{"@keyframes _sh{0%{background-position:200% 0}100%{background-position:-200% 0}}"}</style>
          </>
      ) : !searched ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontWeight: 800, color: "#1e293b", margin: "0 0 8px" }}>ค้นหาอะไรวันนี้?</h2>
          <p style={{ color: "#64748b", margin: 0 }}>พิมพ์ชื่อทริป สถานที่ หรือจังหวัดที่สนใจ</p>
          {/* Popular suggestions */}
          <div style={{ marginTop: 24, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {["เชียงใหม่","ภูเก็ต","กาญจนบุรี","เขาใหญ่","ทะเล","น้ำตก","คาเฟ่","วัด"].map(s => (
              <button key={s} onClick={() => { setQ(s); doSearch({ q: s }); }}
                style={{ padding: "8px 16px", borderRadius: 999, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : totalResults === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>😔</div>
          <h2 style={{ fontWeight: 800, color: "#1e293b", margin: "0 0 8px" }}>ไม่พบผลลัพธ์</h2>
          <p style={{ color: "#64748b", margin: "0 0 20px" }}>ลองค้นหาด้วยคำอื่น หรือปรับตัวกรอง</p>
          <button onClick={() => { setProv(""); setCat(""); setSort("recent"); doSearch({ province: "", category: "", sort: "recent" }); }}
            style={{ padding: "10px 24px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "white", color: "#374151", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      ) : (
        <div>
          {/* Result summary */}
          <div style={{ marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>
              พบ <strong style={{ color: "#0f172a" }}>{totalResults}</strong> ผลลัพธ์สำหรับ
              <strong style={{ color: "#2563eb" }}> "{q}"</strong>
              {province && <span> · {province}</span>}
            </p>
          </div>

          {/* Trips section */}
          {trips.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
                ✈️ ทริป · Trips
                <span style={{ fontSize: 12, fontWeight: 700, background: "#eff6ff", color: "#2563eb", padding: "2px 8px", borderRadius: 999 }}>{totalTrips}</span>
              </h2>
              <div className="search-result-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                {trips.map(trip => (
                  <SearchTripCard key={trip.slug} trip={trip} />
                ))}
              </div>
              {totalTrips > 20 && (
                <div style={{ textAlign: "center", marginTop: 14 }}>
                  <Link href={`/trips?q=${encodeURIComponent(q)}`} style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", textDecoration: "none" }}>ดูทริปทั้งหมด {totalTrips} รายการ →</Link>
                </div>
              )}
            </div>
          )}

          {/* Places section */}
          {places.length > 0 && (
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
                🗺️ สถานที่ · Places
                <span style={{ fontSize: 12, fontWeight: 700, background: "#f0fdf4", color: "#15803d", padding: "2px 8px", borderRadius: 999 }}>{totalPlaces}</span>
              </h2>
              <div className="search-result-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                {places.map(place => <SearchPlaceCard key={place.slug} place={place} />)}
              </div>
              {totalPlaces > 20 && (
                <div style={{ textAlign: "center", marginTop: 14 }}>
                  <Link href={`/place?q=${encodeURIComponent(q)}`} style={{ fontSize: 13, fontWeight: 700, color: "#15803d", textDecoration: "none" }}>ดูสถานที่ทั้งหมด {totalPlaces} รายการ →</Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Responsive */}
      <style jsx>{`
        :global(.srch-page) { overflow-x: hidden; box-sizing: border-box; }

        @media (max-width: 900px) {
          :global(.search-result-grid) { grid-template-columns: repeat(2, 1fr) !important; }
        }

        @media (max-width: 640px) {
          :global(.srch-page) { padding: 20px 12px 60px !important; }
          :global(.srch-form) { padding: 14px !important; border-radius: 16px !important; margin-bottom: 18px !important; }
          :global(.srch-row) { gap: 8px !important; margin-bottom: 12px !important; }
          :global(.srch-filters) { gap: 8px !important; }
          :global(.srch-filters select) {
            flex: 1 1 calc(50% - 4px);
            padding: 7px 8px !important;
            font-size: 12px !important;
            border-radius: 8px !important;
            min-width: 0;
          }
          :global(.srch-type-toggle button) {
            padding: 5px 10px !important;
            font-size: 12px !important;
          }
          :global(.search-result-grid) { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
        }

        @media (max-width: 400px) {
          :global(.search-result-grid) { grid-template-columns: 1fr !important; }
          :global(.srch-filters select) { flex: 1 1 100%; }
        }
      `}</style>
    </div>
  );
}

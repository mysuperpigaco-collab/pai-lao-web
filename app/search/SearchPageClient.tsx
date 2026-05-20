"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

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
  _count?: { reviews: number; bookmarks: number };
  business?: { businessName: string; isVerified?: boolean } | null;
}

// ── Constants ────────────────────────────────────────────
const PROVINCES = [
  "กรุงเทพมหานคร","เชียงใหม่","เชียงราย","ภูเก็ต","กระบี่","สุราษฎร์ธานี",
  "ประจวบคีรีขันธ์","ชลบุรี","ระยอง","นครราชสีมา","ขอนแก่น","อุดรธานี",
  "นครพนม","เลย","น่าน","แม่ฮ่องสอน","ตาก","กาญจนบุรี","พระนครศรีอยุธยา",
  "สุโขทัย","พิษณุโลก","อุตรดิตถ์","ลำปาง","ลำพูน","แพร่","อุทัยธานี",
  "นครสวรรค์","อ่างทอง","สิงห์บุรี","ลพบุรี","สระบุรี","นนทบุรี","ปทุมธานี",
  "สมุทรปราการ","สมุทรสาคร","นครปฐม","ราชบุรี","เพชรบุรี","สมุทรสงคราม",
  "ชัยนาท","สุพรรณบุรี","นครนายก","ปราจีนบุรี","สระแก้ว","ฉะเชิงเทรา",
  "ตราด","จันทบุรี","ระนอง","ชุมพร","พังงา","ตรัง","พัทลุง","สตูล",
  "นราธิวาส","ปัตตานี","ยะลา","สงขลา","นครศรีธรรมราช","สุรินทร์","บุรีรัมย์",
  "ศรีสะเกษ","อุบลราชธานี","ยโสธร","มุกดาหาร","กาฬสินธุ์","มหาสารคาม",
  "ร้อยเอ็ด","สกลนคร","นครพนม","หนองคาย","หนองบัวลำภู","บึงกาฬ","เพชรบูรณ์",
  "พิจิตร","กำแพงเพชร","สุโขทัย","อำนาจเจริญ",
];
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

export default function SearchPageClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const [q, setQ]           = useState(sp.get("q") ?? "");
  const [type, setType]     = useState(sp.get("type") ?? "all");
  const [province, setProv] = useState(sp.get("province") ?? "");
  const [category, setCat]  = useState(sp.get("category") ?? "");
  const [sort, setSort]     = useState(sp.get("sort") ?? "recent");

  const [trips,  setTrips]  = useState<TripResult[]>([]);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [totalTrips, setTotalTrips]   = useState(0);
  const [totalPlaces, setTotalPlaces] = useState(0);
  const [searchError, setSearchError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = async (overrides?: Partial<{ q: string; type: string; province: string; category: string; sort: string }>) => {
    const fq       = overrides?.q       ?? q;
    const ftype    = overrides?.type    ?? type;
    const fprov    = overrides?.province ?? province;
    const fcat     = overrides?.category ?? category;
    const fsort    = overrides?.sort    ?? sort;
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
    if (fq)    params.set("q", fq);
    if (ftype !== "all") params.set("type", ftype);
    if (fprov) params.set("province", fprov);
    if (fcat)  params.set("category", fcat);
    if (fsort !== "recent") params.set("sort", fsort);
    router.replace(`/search?${params.toString()}`, { scroll: false });

    const fetchers = [];
    if (ftype === "all" || ftype === "trip") {
      fetchers.push(
        fetch(`/api/trips?q=${encodeURIComponent(fq)}&limit=20&sort=${fsort}${fprov ? `&province=${encodeURIComponent(fprov)}` : ""}`)
          .then(r => r.json())
          .then(d => { setTrips(d.trips ?? []); setTotalTrips(d.total ?? 0); })
      );
    }
    if (ftype === "all" || ftype === "place") {
      fetchers.push(
        fetch(`/api/places?q=${encodeURIComponent(fq)}&limit=20&sort=${fsort}${fprov ? `&province=${encodeURIComponent(fprov)}` : ""}${fcat ? `&category=${fcat}` : ""}`)
          .then(r => r.json())
          .then(d => { setPlaces(d.places ?? []); setTotalPlaces(d.total ?? 0); })
      );
    }
    if (ftype === "trip") { setPlaces([]); setTotalPlaces(0); }
    if (ftype === "place") { setTrips([]); setTotalTrips(0); }

    await Promise.allSettled(fetchers);
    setLoading(false);
  };

  // Search on mount if q is in URL
  useEffect(() => {
    const initQ = sp.get("q");
    if (initQ) {
      setQ(initQ);
      doSearch({ q: initQ, type: sp.get("type") ?? "all", province: sp.get("province") ?? "", category: sp.get("category") ?? "", sort: sp.get("sort") ?? "recent" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); doSearch(); };

  const totalResults = totalTrips + totalPlaces;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 20px 80px" }}>

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
      <form onSubmit={handleSubmit} style={{ background: "white", borderRadius: 20, padding: 22, border: "1.5px solid #e2e8f0", boxShadow: "0 4px 20px rgba(15,23,42,0.06)", marginBottom: 28 }}>
        {/* Main search row */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
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

        {/* Filter row */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* Type */}
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 3, gap: 2 }}>
            {[{ v:"all", l:"ทั้งหมด" }, { v:"trip", l:"✈️ ทริป" }, { v:"place", l:"🗺️ สถานที่" }].map(opt => (
              <button key={opt.v} type="button" onClick={() => setType(opt.v)}
                style={{ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: type === opt.v ? 800 : 500,
                  background: type === opt.v ? "white" : "transparent",
                  color: type === opt.v ? "#0f172a" : "#64748b",
                  boxShadow: type === opt.v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s" }}>
                {opt.l}
              </button>
            ))}
          </div>

          {/* Province */}
          <select value={province} onChange={e => setProv(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", fontSize: 13, color: "#374151", fontFamily: "inherit", cursor: "pointer" }}>
            <option value="">📍 ทุกจังหวัด</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {/* Category (only for place/all) */}
          {type !== "trip" && (
            <select value={category} onChange={e => setCat(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", fontSize: 13, color: "#374151", fontFamily: "inherit", cursor: "pointer" }}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          )}

          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", fontSize: 13, color: "#374151", fontFamily: "inherit", cursor: "pointer" }}>
            <option value="recent">🕐 ล่าสุด</option>
            <option value="popular">🔥 ยอดนิยม</option>
          </select>

          {/* Apply filters btn */}
          {searched && (
            <button type="submit" style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid #d1fae5", background: "#f0fdf4", color: "#059669", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              ✓ กรองผลลัพธ์
            </button>
          )}
        </div>
      </form>

      {/* ── Results ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p style={{ margin: 0 }}>กำลังค้นหา...</p>
        </div>
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                {trips.map(trip => (
                  <Link key={trip.slug} href={`/trips/${trip.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ background: "white", borderRadius: 16, overflow: "hidden", border: "1.5px solid #f1f5f9", boxShadow: "0 2px 10px rgba(15,23,42,0.04)", transition: "all 0.2s", cursor: "pointer" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(15,23,42,0.10)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 10px rgba(15,23,42,0.04)"; }}
                    >
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                {places.map(place => (
                  <Link key={place.slug} href={`/place/${place.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ background: "white", borderRadius: 16, overflow: "hidden", border: "1.5px solid #f1f5f9", boxShadow: "0 2px 10px rgba(15,23,42,0.04)", transition: "all 0.2s", cursor: "pointer" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(15,23,42,0.10)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 10px rgba(15,23,42,0.04)"; }}
                    >
                      <div style={{ position: "relative", height: 140, background: "#e2e8f0", overflow: "hidden" }}>
                        <img src={place.coverUrl} alt={place.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        {place.business?.isVerified && (
                          <span style={{ position: "absolute", top: 8, left: 8, background: "#dcfce7", color: "#15803d", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 999 }}>✓ Verified</span>
                        )}
                        {(place._count?.reviews ?? 0) > 0 && (
                          <span style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(15,23,42,0.65)", color: "white", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999 }}>⭐ {place._count!.reviews}</span>
                        )}
                      </div>
                      <div style={{ padding: "11px 13px" }}>
                        <h4 style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{place.title}</h4>
                        {place.titleEn && <p style={{ fontSize: 11, color: "#64748b", fontStyle: "italic", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{place.titleEn}</p>}
                        <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>📍 {[place.district, place.province].filter(Boolean).join(", ")}</p>
                      </div>
                    </div>
                  </Link>
                ))}
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
        @media (max-width: 900px) {
          div[style*="repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          div[style*="repeat(4, 1fr)"] { grid-template-columns: repeat(1, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
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
  _count?: { reviews: number; bookmarks: number };
  business?: { businessName: string; isVerified?: boolean } | null;
}

const PLACE_CATS = [
  { id: "",             icon: "🗺️", label: "ทั้งหมด",               en: "All" },
  { id: "NATURE",       icon: "🌿", label: "ธรรมชาติ",               en: "Nature" },
  { id: "CAFE",         icon: "☕", label: "คาเฟ่",                  en: "Café" },
  { id: "BEACH",        icon: "🏖️", label: "ชายหาด",                en: "Beach" },
  { id: "ACCOMMODATION",icon: "🏨", label: "ที่พัก",                 en: "Stay" },
  { id: "FOOD",         icon: "🍲", label: "อาหาร",                  en: "Food" },
  { id: "TEMPLE",       icon: "🛕", label: "วัด",                    en: "Temple" },
  { id: "ADVENTURE",    icon: "🧗", label: "ผจญภัย",                 en: "Adventure" },
  { id: "MARKET",       icon: "🛍️", label: "ตลาด",                  en: "Market" },
  { id: "MUSEUM",       icon: "🏛️", label: "พิพิธภัณฑ์",            en: "Museum" },
  { id: "CAMPING",      icon: "⛺", label: "แคมปิ้ง",               en: "Camping" },
];

const CAT_LABEL: Record<string, string> = {
  NATURE: "ธรรมชาติ", CAFE: "คาเฟ่", BEACH: "ชายหาด",
  ACCOMMODATION: "ที่พัก", FOOD: "อาหาร", TEMPLE: "วัด",
  ADVENTURE: "ผจญภัย", MARKET: "ตลาด", MUSEUM: "พิพิธภัณฑ์", CAMPING: "แคมปิ้ง",
};

export default function ExplorerSection() {
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [category, setCategory] = useState("");
  const [places,   setPlaces  ] = useState<Place[]>([]);
  const [loading,  setLoading ] = useState(false);
  const [total,    setTotal   ] = useState(0);

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

  return (
    <div className="ex-wrap">
      <div className="ex-header">
        <h2 className="ex-title">📍 เจาะลึกรายพื้นที่ <span>Explore by Area</span></h2>
        <p className="ex-sub">สถานที่ยอดนิยมในจังหวัดที่คุณเลือก วัดจากยอด Bookmark · Top places by area</p>
      </div>

      {/* ── Filters ── */}
      <div className="ex-filters">
        <div className="ex-select-wrap">
          <label className="ex-label">🗾 จังหวัด · Province</label>
          <select className="ex-select" value={province} onChange={e => handleProvinceChange(e.target.value)}>
            <option value="">-- เลือกจังหวัด / Select Province --</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="ex-select-wrap">
          <label className="ex-label">📌 อำเภอ · District</label>
          <select className="ex-select" value={district} onChange={e => setDistrict(e.target.value)} disabled={!province}>
            <option value="">-- ทุกอำเภอ / All Districts --</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* ── Category chips ── */}
      <div className="ex-cats">
        {PLACE_CATS.map(c => (
          <button
            key={c.id}
            className={`ex-cat${category === c.id ? " active" : ""}`}
            onClick={() => setCategory(c.id)}
          >
            <span className="ex-cat-icon">{c.icon}</span>
            <span className="ex-cat-th">{c.label}</span>
            <span className="ex-cat-en">{c.en}</span>
          </button>
        ))}
      </div>

      {/* ── Results ── */}
      <div className="ex-results">
        {!province ? (
          <div className="ex-empty">
            <span>🗺️</span>
            <p>เลือกจังหวัดเพื่อดูสถานที่ยอดนิยม</p>
            <small>Select a province to explore popular places</small>
          </div>
        ) : loading ? (
          <div className="ex-empty"><span>⏳</span><p>กำลังโหลด... <span className="ex-en-muted">Loading...</span></p></div>
        ) : places.length === 0 ? (
          <div className="ex-empty">
            <span>📭</span>
            <p>ยังไม่มีสถานที่ใน{province.split(" (")[0]}</p>
            <small>No places in this area yet</small>
          </div>
        ) : (
          <>
            <p className="ex-count">
              พบ <strong>{total}</strong> สถานที่ · {total} places
              {category ? ` · ${CAT_LABEL[category] ?? category}` : ""}
              {district ? ` · ${district}` : ""}
            </p>
            <div className="ex-grid">
              {places.map((place, i) => (
                <Link key={place.slug} href={`/place/${place.slug}`} className="ex-card" style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="ex-img">
                    {place.coverUrl
                      ? <img src={place.coverUrl} alt={place.title} loading="lazy" onError={(e)=>{const i=e.currentTarget;i.onerror=null;i.src="/images/default-place.svg";}} />
                      : <div className="ex-img-ph">🏞️</div>
                    }
                    {/* Rank badge for top 3 */}
                    {i < 3 && (
                      <span className={`ex-rank ex-rank-${i + 1}`}>
                        {["🥇", "🥈", "🥉"][i]}
                      </span>
                    )}
                    {/* Verified */}
                    {place.business?.isVerified && (
                      <span className="ex-verified">✓</span>
                    )}
                    {/* Bookmark count */}
                    {(place._count?.bookmarks ?? 0) > 0 && (
                      <span className="ex-bm-badge">🔖 {place._count!.bookmarks}</span>
                    )}
                  </div>
                  <div className="ex-info">
                    <div className="ex-cat-tag">{CAT_LABEL[place.category] ?? place.category}</div>
                    <h4>{place.title}</h4>
                    {place.titleEn && <p className="ex-en">{place.titleEn}</p>}
                    <div className="ex-meta">
                      <span>📍 {[place.district, place.province].filter(Boolean).join(", ")}</span>
                      {(place._count?.reviews ?? 0) > 0 && (
                        <span className="ex-reviews">⭐ {place._count!.reviews} รีวิว</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {/* See all link */}
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <Link
                href={`/place?province=${encodeURIComponent(province.split(" (")[0])}${category ? `&category=${category}` : ""}&sort=popular`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 28px", borderRadius: 14,
                  background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
                  color: "white", textDecoration: "none",
                  fontWeight: 800, fontSize: 14,
                  boxShadow: "0 4px 14px rgba(15,23,42,0.2)",
                  transition: "0.2s",
                }}
              >
                ดูทั้งหมด {total} สถานที่ · See all places →
              </Link>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .ex-wrap {
          background: white;
          padding: 36px;
          border-radius: 28px;
          box-shadow: 0 8px 28px rgba(15,23,42,0.06);
          margin-top: 48px;
          border: 1px solid #f1f5f9;
        }
        .ex-header { margin-bottom: 22px; }
        .ex-title { font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 6px; }
        .ex-title span { color: #2563eb; }
        .ex-sub { font-size: 13px; color: #64748b; margin: 0; }

        /* Filters */
        .ex-filters { display: flex; gap: 16px; margin-bottom: 18px; }
        .ex-select-wrap { flex: 1; display: flex; flex-direction: column; gap: 5px; }
        .ex-label { font-size: 12px; font-weight: 700; color: #64748b; }
        .ex-select {
          padding: 11px 14px; border-radius: 12px; border: 1.5px solid #e2e8f0;
          font-size: 14px; color: #0f172a; background: white;
          outline: none; font-family: inherit; cursor: pointer;
        }
        .ex-select:focus { border-color: #4facfe; }
        .ex-select:disabled { opacity: 0.5; cursor: not-allowed; background: #f8fafc; }

        /* Category chips */
        .ex-cats {
          display: flex; flex-wrap: nowrap; gap: 8px; margin-bottom: 22px;
          overflow-x: auto; padding-bottom: 6px;
          -webkit-overflow-scrolling: touch; scrollbar-width: none;
        }
        .ex-cats::-webkit-scrollbar { display: none; }
        .ex-cat {
          display: inline-flex; flex-direction: column; align-items: center;
          gap: 1px; padding: 8px 14px; border-radius: 14px;
          border: 1.5px solid #e2e8f0; background: #f8fafc;
          cursor: pointer; transition: all 0.18s; font-family: inherit;
          min-width: 64px; flex-shrink: 0;
        }
        .ex-cat:hover:not(.active) { background: #eff6ff; border-color: #bfdbfe; }
        .ex-cat.active {
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          border-color: #3b82f6; color: #1d4ed8;
          box-shadow: 0 2px 10px rgba(59,130,246,0.18);
        }
        .ex-cat-icon { font-size: 18px; line-height: 1; }
        .ex-cat-th { font-size: 11px; font-weight: 700; color: #334155; line-height: 1.2; }
        .ex-cat-en { font-size: 9px; font-weight: 500; color: #94a3b8; line-height: 1; }
        .ex-cat.active .ex-cat-th { color: #1d4ed8; }
        .ex-cat.active .ex-cat-en { color: #60a5fa; }

        /* Results */
        .ex-results { min-height: 160px; }
        .ex-count { font-size: 13px; color: #64748b; margin: 0 0 16px; }
        .ex-count strong { color: #1e293b; font-weight: 800; }
        .ex-en-muted { font-weight: 400; color: #94a3b8; }

        /* Empty state */
        .ex-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 52px 20px; gap: 12px;
          text-align: center; background: #f8fafc; border-radius: 18px;
        }
        .ex-empty span { font-size: 44px; }
        .ex-empty p { font-size: 15px; color: #475569; font-weight: 700; margin: 0; }
        .ex-empty small { font-size: 12px; color: #94a3b8; }

        /* Grid */
        .ex-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }

        /* Card */
        .ex-card {
          background: white; border-radius: 18px; overflow: hidden;
          text-decoration: none; color: inherit; transition: all 0.2s;
          border: 1px solid #f1f5f9;
          box-shadow: 0 2px 10px rgba(15,23,42,0.04);
          display: flex; flex-direction: column;
        }
        .ex-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(15,23,42,0.1);
          border-color: #e0e7ff;
        }

        /* Card image */
        .ex-img {
          position: relative; height: 160px;
          overflow: hidden; background: #e2e8f0; flex-shrink: 0;
        }
        .ex-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
        .ex-card:hover .ex-img img { transform: scale(1.04); }
        .ex-img-ph {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center; font-size: 40px;
        }

        /* Badges on image */
        .ex-rank {
          position: absolute; top: 10px; left: 10px;
          font-size: 20px; line-height: 1;
          filter: drop-shadow(0 1px 3px rgba(0,0,0,0.3));
        }
        .ex-verified {
          position: absolute; top: 10px; right: 10px;
          background: #dcfce7; color: #15803d;
          font-size: 10px; font-weight: 800;
          padding: 3px 8px; border-radius: 999px;
        }
        .ex-bm-badge {
          position: absolute; bottom: 8px; right: 8px;
          background: rgba(15,23,42,0.65); color: white;
          font-size: 10px; font-weight: 700;
          padding: 3px 8px; border-radius: 999px;
          backdrop-filter: blur(4px);
        }

        /* Card body */
        .ex-info { padding: 13px 14px 14px; flex: 1; display: flex; flex-direction: column; gap: 3px; }
        .ex-cat-tag {
          font-size: 10px; font-weight: 700; color: #2563eb;
          background: #eff6ff; border-radius: 6px;
          padding: 2px 7px; align-self: flex-start; margin-bottom: 2px;
        }
        .ex-info h4 {
          font-size: 13px; font-weight: 800; color: #1e293b; margin: 0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ex-en {
          font-size: 11px; color: #64748b; font-style: italic; margin: 0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ex-meta { display: flex; flex-direction: column; gap: 2px; margin-top: 4px; }
        .ex-meta span { font-size: 11px; color: #94a3b8; }
        .ex-reviews { color: #f59e0b !important; font-weight: 700 !important; }

        /* Responsive */
        @media (max-width: 1100px) { .ex-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 780px)  { .ex-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) {
          .ex-wrap { padding: 18px 14px; border-radius: 18px; }
          .ex-filters { flex-direction: column; gap: 10px; }
          .ex-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .ex-cats { gap: 6px; }
          .ex-cat { padding: 6px 10px; min-width: 54px; }
          .ex-img { height: 140px; }
        }
      `}</style>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Trip {
  slug: string;
  title: string;
  coverUrl?: string | null;
  province?: string | null;
  district?: string | null;
  author?: { displayName?: string | null; firstName: string };
  _count?: { reviews: number; bookmarks: number; likes: number };
  avgRating?: number | null;
  createdAt?: string;
}

interface Place {
  id: string;
  slug: string;
  title: string;
  titleEn?: string | null;
  coverUrl: string;
  province: string;
  district: string;
  category: string;
  _count?: { reviews: number; bookmarks: number };
  business?: { businessName: string; isVerified?: boolean } | null;
}

const TABS = [
  { id: "recent",        icon: "✨", label: "เพิ่งไปเล่ามา",   en: "Latest Stories",  type: "trip",  param: "" },
  { id: "NATURE",        icon: "🌿", label: "ธรรมชาติ",         en: "Nature",          type: "place", param: "NATURE" },
  { id: "CAFE",          icon: "☕", label: "คาเฟ่",            en: "Café",            type: "place", param: "CAFE" },
  { id: "BEACH",         icon: "🏖️", label: "ชายหาด",          en: "Beach",           type: "place", param: "BEACH" },
  { id: "ACCOMMODATION", icon: "🏨", label: "ที่พัก",           en: "Stay",            type: "place", param: "ACCOMMODATION" },
  { id: "FOOD",          icon: "🍲", label: "อาหาร",            en: "Food",            type: "place", param: "FOOD" },
  { id: "TEMPLE",        icon: "🛕", label: "วัด",              en: "Temple",          type: "place", param: "TEMPLE" },
  { id: "ADVENTURE",     icon: "🧗", label: "ผจญภัย",          en: "Adventure",       type: "place", param: "ADVENTURE" },
  { id: "MARKET",        icon: "🛍️", label: "ตลาด",            en: "Market",          type: "place", param: "MARKET" },
  { id: "MUSEUM",        icon: "🏛️", label: "พิพิธภัณฑ์",     en: "Museum",          type: "place", param: "MUSEUM" },
  { id: "CAMPING",       icon: "⛺", label: "แคมปิ้ง",         en: "Camping",         type: "place", param: "CAMPING" },
] as const;

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export default function AutoGridSection() {
  const [activeTab, setActiveTab] = useState("recent");
  const [trips,  setTrips ] = useState<Trip[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  const tab = TABS.find(t => t.id === activeTab)!;

  useEffect(() => {
    setLoading(true);
    if (tab.type === "trip") {
      fetch("/api/trips?limit=20&sort=recent")
        .then(r => r.json())
        .then(d => { setTrips(d.trips ?? []); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      fetch(`/api/places?limit=12&category=${tab.param}&sort=popular`)
        .then(r => r.json())
        .then(d => { setPlaces(d.places ?? []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [activeTab]);

  return (
    <div className="ag-root">
      {/* ── Tab strip ── */}
      <div className="ag-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`ag-tab${activeTab === t.id ? " ag-tab-active" : ""}`}
          >
            <span className="ag-tab-icon">{t.icon}</span>
            <span className="ag-tab-th">{t.label}</span>
            <span className="ag-tab-en">{t.en}</span>
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="ag-loading">⏳ กำลังโหลด... <span className="ag-muted">Loading...</span></div>
      ) : tab.type === "trip" ? (
        trips.length === 0 ? (
          <div className="ag-loading">ยังไม่มีเรื่องเล่า · No stories yet</div>
        ) : (
          <div className="ag-grid ag-grid-5">
            {trips.map(trip => (
              <Link key={trip.slug} href={`/trips/${trip.slug}`} className="ag-card">
                <div className="ag-img">
                  {trip.coverUrl
                    ? <img src={trip.coverUrl} alt={trip.title} loading="lazy" />
                    : <div className="ag-img-ph">🗺️</div>
                  }
                  {trip.avgRating != null && trip.avgRating > 0 && (
                    <span className="ag-badge-rating">⭐ {trip.avgRating.toFixed(1)}</span>
                  )}
                  <div className="ag-badge-row">
                    {(trip._count?.likes ?? 0) > 0 && (
                      <span className="ag-badge-dark">❤️ {trip._count!.likes}</span>
                    )}
                    {(trip._count?.reviews ?? 0) > 0 && (
                      <span className="ag-badge-dark">💬 {trip._count!.reviews}</span>
                    )}
                  </div>
                </div>
                <div className="ag-body">
                  <h4 className="ag-title">{trip.title}</h4>
                  <p className="ag-loc">
                    {trip.province ? `📍 ${trip.province}` : ""}
                    {trip.author ? ` · ${trip.author.displayName || trip.author.firstName}` : ""}
                  </p>
                  {trip.createdAt && (
                    <p className="ag-date">{formatDate(trip.createdAt)}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        places.length === 0 ? (
          <div className="ag-loading">ยังไม่มีสถานที่ในหมวดนี้ · No places yet</div>
        ) : (
          <>
            <div className="ag-grid ag-grid-4">
              {places.map(place => (
                <Link key={place.slug} href={`/place/${place.slug}`} className="ag-card">
                  <div className="ag-img">
                    <img src={place.coverUrl} alt={place.title} loading="lazy" />
                    {place.business?.isVerified && (
                      <span className="ag-badge-green">✓ Verified</span>
                    )}
                    {(place._count?.reviews ?? 0) > 0 && (
                      <span className="ag-badge-dark">⭐ {place._count!.reviews}</span>
                    )}
                  </div>
                  <div className="ag-body">
                    <h4 className="ag-title">{place.title}</h4>
                    {place.titleEn && <p className="ag-en">{place.titleEn}</p>}
                    <p className="ag-loc">📍 {[place.district, place.province].filter(Boolean).join(", ")}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 28 }}>
              <Link
                href={`/place?category=${tab.param}&sort=popular`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 28px", borderRadius: 14,
                  background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
                  color: "white", textDecoration: "none",
                  fontWeight: 800, fontSize: 14,
                  boxShadow: "0 4px 14px rgba(15,23,42,0.18)",
                }}
              >
                ดูสถานที่{tab.label}ทั้งหมด · See all {tab.en} →
              </Link>
            </div>
          </>
        )
      )}

      <style jsx>{`
        .ag-root { margin-top: 20px; }

        /* Tabs */
        .ag-tabs {
          display: flex; gap: 8px; margin-bottom: 22px;
          overflow-x: auto; padding-bottom: 4px;
        }
        .ag-tab {
          display: inline-flex; flex-direction: column; align-items: center;
          gap: 2px; padding: 10px 16px; border-radius: 14px;
          border: none; cursor: pointer; font-family: inherit;
          background: #f1f5f9; color: #475569;
          transition: all 0.2s; flex-shrink: 0; min-width: 72px;
        }
        .ag-tab:hover:not(.ag-tab-active) { background: #e2e8f0; }
        .ag-tab-active {
          background: #0f172a; color: #fff;
          box-shadow: 0 4px 14px rgba(15,23,42,0.25);
        }
        .ag-tab-icon { font-size: 20px; line-height: 1; }
        .ag-tab-th { font-size: 12px; font-weight: 700; line-height: 1.2; }
        .ag-tab-en { font-size: 10px; opacity: 0.65; line-height: 1; }
        .ag-tab-active .ag-tab-en { opacity: 0.75; }

        /* Loading / empty */
        .ag-loading { text-align: center; padding: 52px; color: #94a3b8; font-size: 15px; }
        .ag-muted { font-weight: 400; }

        /* Grid */
        .ag-grid { display: grid; gap: 16px; }
        .ag-grid-5 { grid-template-columns: repeat(5, 1fr); }
        .ag-grid-4 { grid-template-columns: repeat(4, 1fr); }

        /* Card */
        .ag-card {
          background: white; border-radius: 18px; overflow: hidden;
          text-decoration: none; color: inherit;
          border: 1px solid #f1f5f9;
          box-shadow: 0 2px 10px rgba(15,23,42,0.04);
          display: flex; flex-direction: column;
          transition: all 0.2s;
        }
        .ag-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 28px rgba(15,23,42,0.09);
          border-color: #e0e7ff;
        }

        /* Image */
        .ag-img {
          position: relative; height: 140px;
          overflow: hidden; background: #e2e8f0; flex-shrink: 0;
        }
        .ag-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
        .ag-card:hover .ag-img img { transform: scale(1.04); }
        .ag-img-ph {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center; font-size: 32px;
        }
        .ag-badge-green {
          position: absolute; top: 8px; right: 8px;
          background: #dcfce7; color: #15803d;
          font-size: 10px; font-weight: 800;
          padding: 3px 8px; border-radius: 999px;
        }
        .ag-badge-rating {
          position: absolute; top: 8px; left: 8px;
          background: rgba(251,191,36,0.92); color: #1e293b;
          font-size: 10px; font-weight: 800;
          padding: 3px 8px; border-radius: 999px;
          backdrop-filter: blur(4px);
        }
        .ag-badge-row {
          position: absolute; bottom: 8px; right: 8px;
          display: flex; gap: 4px;
        }
        .ag-badge-dark {
          background: rgba(15,23,42,0.65); color: white;
          font-size: 10px; font-weight: 700;
          padding: 3px 8px; border-radius: 999px;
          backdrop-filter: blur(4px);
        }

        /* Body */
        .ag-body { padding: 11px 13px 13px; flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .ag-title {
          font-size: 13px; font-weight: 800; color: #1e293b; margin: 0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ag-en {
          font-size: 11px; color: #64748b; font-style: italic; margin: 0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ag-loc { font-size: 11px; color: #94a3b8; margin: 0; }
        .ag-date { font-size: 10px; color: #cbd5e1; margin: 0; margin-top: 2px; }

        /* Responsive */
        @media (max-width: 1200px) { .ag-grid-5 { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 900px)  {
          .ag-grid-5 { grid-template-columns: repeat(3, 1fr); }
          .ag-grid-4 { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 640px)  {
          .ag-grid-5, .ag-grid-4 { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .ag-tab { padding: 8px 12px; min-width: 62px; }
        }
      `}</style>
    </div>
  );
}

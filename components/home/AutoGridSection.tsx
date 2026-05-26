"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Trip {
  slug: string; title: string;
  coverUrl?: string | null;
  province?: string | null; district?: string | null;
  mood?: string | null;
  author?: { displayName?: string | null; firstName: string; avatarUrl?: string | null };
  _count?: { reviews: number; bookmarks: number; likes: number };
  avgRating?: number | null;
  viewCount?: number;
  createdAt?: string;
}

interface Place {
  id: string; slug: string; title: string; titleEn?: string | null;
  coverUrl: string; province: string; district: string; category: string;
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

function fmt(n?: number) {
  if (!n) return "0";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

function TripCard({ trip }: { trip: Trip }) {
  const province = trip.province?.split(" (")[0] ?? trip.province ?? "";
  const author   = trip.author?.displayName || trip.author?.firstName || "";
  const avatar   = trip.author?.avatarUrl;
  const likes    = trip._count?.likes    ?? 0;
  const comments = trip._count?.reviews  ?? 0;
  const views    = trip.viewCount        ?? 0;

  return (
    <Link href={`/trips/${trip.slug}`} className="tc-card">
      {/* Image */}
      <div className="tc-img">
        {trip.coverUrl
          ? <img src={trip.coverUrl} alt={trip.title} loading="lazy" />
          : <div className="tc-img-ph">🗺️</div>
        }
        {/* Province chip */}
        {province && (
          <span className="tc-chip-prov">{province}</span>
        )}
        {/* Rating badge */}
        {trip.avgRating != null && trip.avgRating > 0 && (
          <span className="tc-chip-rate">⭐ {trip.avgRating.toFixed(1)}</span>
        )}
        {/* Mood chip */}
        {trip.mood && (
          <span className="tc-chip-mood">{trip.mood}</span>
        )}
        {/* Gradient overlay */}
        <div className="tc-grad" />
      </div>

      {/* Body */}
      <div className="tc-body">
        <h4 className="tc-title">{trip.title}</h4>

        {/* Author + Stats */}
        <div className="tc-footer">
          <div className="tc-author">
            {avatar
              ? <img src={avatar} alt={author} className="tc-avatar" />
              : <div className="tc-avatar tc-avatar-ph">{author?.[0] ?? "?"}</div>
            }
            <span className="tc-author-name">{author}</span>
          </div>
          <div className="tc-stats">
            <span>👁 {fmt(views)}</span>
            <span>❤️ {fmt(likes)}</span>
            <span>💬 {fmt(comments)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function PlaceCard({ place }: { place: Place }) {
  return (
    <Link href={`/place/${place.slug}`} className="tc-card">
      <div className="tc-img">
        <img src={place.coverUrl} alt={place.title} loading="lazy"
          onError={e => { const i = e.currentTarget; i.onerror=null; i.src="/images/default-place.svg"; }} />
        <span className="tc-chip-prov">{place.province?.split(" (")[0]}</span>
        {place.business?.isVerified && (
          <span className="tc-chip-rate">✓ Verified</span>
        )}
        <div className="tc-grad" />
      </div>
      <div className="tc-body">
        <h4 className="tc-title">{place.title}</h4>
        {place.titleEn && <p className="tc-en">{place.titleEn}</p>}
        <div className="tc-footer" style={{ marginTop: "auto" }}>
          <span className="tc-loc-row">📍 {[place.district, place.province?.split(" (")[0]].filter(Boolean).join(", ")}</span>
          <div className="tc-stats">
            {(place._count?.reviews ?? 0) > 0 && <span>⭐ {place._count!.reviews}</span>}
            {(place._count?.bookmarks ?? 0) > 0 && <span>🔖 {place._count!.bookmarks}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
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
      {/* Tab strip */}
      <div className="ag-tabs">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`ag-tab${activeTab === t.id ? " ag-tab-active" : ""}`}>
            <span className="ag-ti">{t.icon}</span>
            <span className="ag-tl">{t.label}</span>
            <span className="ag-te">{t.en}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="ag-empty">⏳ กำลังโหลด...</div>
      ) : tab.type === "trip" ? (
        trips.length === 0
          ? <div className="ag-empty">ยังไม่มีเรื่องเล่า</div>
          : <div className="ag-grid ag-g5">
              {trips.map(t => <TripCard key={t.slug} trip={t} />)}
            </div>
      ) : (
        places.length === 0
          ? <div className="ag-empty">ยังไม่มีสถานที่ในหมวดนี้</div>
          : <>
              <div className="ag-grid ag-g4">
                {places.map(p => <PlaceCard key={p.slug} place={p} />)}
              </div>
              <div style={{ textAlign: "center", marginTop: 28 }}>
                <Link href={`/place?category=${tab.param}&sort=popular`} className="ag-see-all">
                  ดูสถานที่{tab.label}ทั้งหมด · See all {tab.en} →
                </Link>
              </div>
            </>
      )}

      <style jsx>{`
        .ag-root { margin-top: 20px; max-width: 100%; overflow-x: clip; }

        /* ─── Tabs ─── */
        .ag-tabs {
          display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px;
          margin-bottom: 22px; scrollbar-width: none; -webkit-overflow-scrolling: touch;
        }
        .ag-tabs::-webkit-scrollbar { display: none; }
        .ag-tab {
          flex-shrink: 0; display: inline-flex; flex-direction: column; align-items: center;
          gap: 2px; padding: 10px 16px; border-radius: 14px; min-width: 72px;
          border: none; cursor: pointer; font-family: inherit;
          background: #f1f5f9; color: #475569; transition: all .2s;
        }
        .ag-tab:hover:not(.ag-tab-active) { background: #e2e8f0; }
        .ag-tab-active { background: #0f172a; color: #fff; box-shadow: 0 4px 14px rgba(15,23,42,.25); }
        .ag-ti { font-size: 20px; line-height: 1; }
        .ag-tl { font-size: 12px; font-weight: 700; }
        .ag-te { font-size: 11px; font-weight: 700; opacity: .7; }
        .ag-tab-active .ag-te { opacity: .9; }

        /* ─── Grid ─── */
        .ag-empty { text-align: center; padding: 52px; color: #94a3b8; font-size: 15px; }
        .ag-grid { display: grid; gap: 16px; }
        .ag-g5 { grid-template-columns: repeat(5, 1fr); }
        .ag-g4 { grid-template-columns: repeat(4, 1fr); }

        /* ─── Card ─── */
        .tc-card {
          display: flex; flex-direction: column;
          border-radius: 20px; overflow: hidden;
          background: #fff; text-decoration: none; color: inherit;
          box-shadow: 0 2px 12px rgba(15,23,42,.06);
          border: 1px solid #f1f5f9;
          transition: transform .22s ease, box-shadow .22s ease;
          min-width: 0;
        }
        .tc-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 36px rgba(15,23,42,.13);
        }

        /* ─── Image ─── */
        .tc-img {
          position: relative; height: 164px; overflow: hidden;
          background: #e2e8f0; flex-shrink: 0;
        }
        .tc-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .35s ease; }
        .tc-card:hover .tc-img img { transform: scale(1.06); }
        .tc-img-ph { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:36px; }

        /* Gradient overlay */
        .tc-grad {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(15,23,42,.55) 0%, transparent 55%);
          pointer-events: none;
        }

        /* Chips */
        .tc-chip-prov {
          position: absolute; top: 10px; left: 10px;
          background: rgba(255,255,255,.88); color: #0f172a;
          font-size: 11px; font-weight: 800;
          padding: 4px 10px; border-radius: 999px;
          backdrop-filter: blur(6px);
          box-shadow: 0 2px 6px rgba(0,0,0,.12);
          white-space: nowrap; max-width: 120px;
          overflow: hidden; text-overflow: ellipsis;
        }
        .tc-chip-rate {
          position: absolute; top: 10px; right: 10px;
          background: rgba(251,191,36,.92); color: #1e293b;
          font-size: 10px; font-weight: 800;
          padding: 4px 9px; border-radius: 999px;
          backdrop-filter: blur(4px);
        }
        .tc-chip-mood {
          position: absolute; bottom: 10px; left: 10px;
          background: rgba(99,102,241,.85); color: #fff;
          font-size: 10px; font-weight: 700;
          padding: 3px 9px; border-radius: 999px;
          backdrop-filter: blur(4px);
          white-space: nowrap; max-width: 100px;
          overflow: hidden; text-overflow: ellipsis;
        }

        /* ─── Body ─── */
        .tc-body {
          padding: 12px 14px 13px; flex: 1;
          display: flex; flex-direction: column; gap: 6px;
        }
        .tc-title {
          font-size: 14px; font-weight: 800; color: #1e293b; margin: 0;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; line-height: 1.35;
        }
        .tc-en {
          font-size: 11px; color: #94a3b8; font-style: italic; margin: 0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .tc-loc-row { font-size: 11px; color: #64748b; font-weight: 600; }

        /* Footer */
        .tc-footer {
          display: flex; align-items: center; justify-content: space-between;
          gap: 6px; margin-top: auto; padding-top: 6px;
          border-top: 1px solid #f1f5f9;
        }
        .tc-author { display: flex; align-items: center; gap: 6px; min-width: 0; }
        .tc-avatar {
          width: 22px; height: 22px; border-radius: 50%;
          object-fit: cover; flex-shrink: 0;
          border: 1.5px solid #e2e8f0;
        }
        .tc-avatar-ph {
          background: linear-gradient(135deg,#10b981,#06b6d4);
          color: #fff; font-size: 11px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
        }
        .tc-author-name {
          font-size: 11px; font-weight: 700; color: #475569;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .tc-stats {
          display: flex; gap: 6px; flex-shrink: 0;
          font-size: 11px; font-weight: 700; color: #94a3b8;
        }
        .tc-stats span { white-space: nowrap; }

        /* See all button */
        .ag-see-all {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 28px; border-radius: 14px;
          background: linear-gradient(135deg, #0f172a, #1e3a8a);
          color: #fff; text-decoration: none; font-weight: 800; font-size: 14px;
          box-shadow: 0 4px 14px rgba(15,23,42,.18);
          transition: transform .2s, box-shadow .2s;
        }
        .ag-see-all:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(15,23,42,.22); }

        /* ─── Responsive ─── */
        @media (max-width: 1200px) { .ag-g5 { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 900px) {
          .ag-g5 { grid-template-columns: repeat(3, 1fr); }
          .ag-g4 { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 640px) {
          .ag-g5, .ag-g4 { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .ag-tab { padding: 7px 10px; min-width: 58px; }
          .ag-ti { font-size: 17px; }
          .ag-tl { font-size: 11px; }
          .tc-img { height: 130px; }
        }
      `}</style>
    </div>
  );
}

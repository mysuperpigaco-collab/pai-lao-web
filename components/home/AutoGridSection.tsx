"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Trip {
  slug: string;
  title: string;
  coverUrl?: string | null;
  province?: string | null;
  author?: { displayName?: string | null; firstName: string };
  _count?: { reviews: number };
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
  descriptionShort?: string | null;
  _count?: { reviews: number; bookmarks: number };
  business?: { businessName: string; isVerified: boolean } | null;
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
] as const;

const CARD: React.CSSProperties = {
  background: "white", borderRadius: 18, overflow: "hidden",
  boxShadow: "0 4px 16px rgba(0,0,0,0.05)", textDecoration: "none",
  color: "inherit", display: "block", border: "1px solid #f1f5f9",
};

export default function AutoGridSection() {
  const [activeTab, setActiveTab] = useState("recent");
  const [trips,  setTrips ] = useState<Trip[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  const tab = TABS.find(t => t.id === activeTab)!;

  useEffect(() => {
    setLoading(true);
    if (tab.type === "trip") {
      fetch("/api/trips?limit=8&sort=recent")
        .then(r => r.json())
        .then(d => { setTrips(d.trips ?? []); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      fetch(`/api/places?limit=8&category=${tab.param}`)
        .then(r => r.json())
        .then(d => { setPlaces(d.places ?? []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [activeTab]);

  const grid: React.CSSProperties = {
    display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16,
  };

  return (
    <div style={{ marginTop: 20 }}>

      {/* ── Tab strip ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 22, overflowX: "auto", paddingBottom: 8 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            display: "inline-flex", flexDirection: "column", alignItems: "center",
            padding: "8px 16px", borderRadius: 14, border: "none", cursor: "pointer",
            background: activeTab === t.id ? "#0f172a" : "#f1f5f9",
            color: activeTab === t.id ? "#fff" : "#475569",
            fontWeight: activeTab === t.id ? 800 : 600, fontSize: 13,
            whiteSpace: "nowrap", transition: "all 0.2s", fontFamily: "inherit",
            boxShadow: activeTab === t.id ? "0 4px 14px rgba(0,0,0,0.14)" : "none",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 18, marginBottom: 3 }}>{t.icon}</span>
            <span>{t.label}</span>
            <span style={{ fontSize: 10, opacity: 0.6, marginTop: 1 }}>{t.en}</span>
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>⏳ กำลังโหลด...</div>
      ) : tab.type === "trip" ? (
        trips.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>ยังไม่มีเรื่องเล่า</div>
        ) : (
          <div style={grid}>
            {trips.map(trip => (
              <Link key={trip.slug} href={`/trips/${trip.slug}`} style={CARD}>
                <div style={{ height: 150, overflow: "hidden", background: "#f0fdf4", position: "relative" }}>
                  {trip.coverUrl
                    ? <img src={trip.coverUrl} alt={trip.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🗺️</div>
                  }
                  {trip._count && trip._count.reviews > 0 && (
                    <span style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999 }}>
                      💬 {trip._count.reviews}
                    </span>
                  )}
                </div>
                <div style={{ padding: "12px 14px 14px" }}>
                  <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.title}</h4>
                  <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
                    {trip.province ? `📍 ${trip.province}` : ""}
                    {trip.author ? ` · โดย ${trip.author.displayName || trip.author.firstName}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        places.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>ยังไม่มีสถานที่ในหมวดนี้</div>
        ) : (
          <div style={grid}>
            {places.map(place => (
              <Link key={place.slug} href={`/place/${place.slug}`} style={CARD}>
                <div style={{ height: 150, overflow: "hidden", background: "#e2e8f0", position: "relative" }}>
                  <img src={place.coverUrl} alt={place.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {place.business?.isVerified && (
                    <span style={{ position: "absolute", top: 8, right: 8, background: "#dcfce7", color: "#15803d", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 999 }}>
                      ✓ Verified
                    </span>
                  )}
                  {place._count && place._count.reviews > 0 && (
                    <span style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999 }}>
                      ⭐ {place._count.reviews}
                    </span>
                  )}
                </div>
                <div style={{ padding: "12px 14px 14px" }}>
                  <h4 style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 800, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{place.title}</h4>
                  {place.titleEn && <p style={{ margin: "0 0 3px", fontSize: 11, color: "#64748b", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{place.titleEn}</p>}
                  <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>📍 {place.district}, {place.province}</p>
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      <style jsx>{`
        @media (max-width: 992px) { :global(.ag-grid) { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 600px) { :global(.ag-grid) { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

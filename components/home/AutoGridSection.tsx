"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Trip {
  slug: string;
  title: string;
  coverUrl?: string | null;
  province?: string | null;
  mood?: string | null;
}

const TABS = [
  { id: "recent", label: "✨ เพิ่งไปเล่ามา",   mood: undefined },
  { id: "nature", label: "🌿 ธรรมชาติ",         mood: "ธรรมชาติ" },
  { id: "cafe",   label: "☕ คาเฟ่ & ร้านอาหาร", mood: "คาเฟ่" },
  { id: "beach",  label: "🏖️ ชายหาด",           mood: "ชายหาด" },
];

export default function AutoGridSection() {
  const [activeTab, setActiveTab] = useState("recent");
  const [trips, setTrips]         = useState<Trip[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    const tab = TABS.find(t => t.id === activeTab);
    const url = tab?.mood
      ? `/api/trips?limit=8&mood=${encodeURIComponent(tab.mood)}`
      : `/api/trips?limit=8`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setTrips(d.trips ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeTab]);

  return (
    <div className="auto-section">
      <div className="tab-nav">
        {TABS.map(tab => (
          <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>⏳ กำลังโหลด...</div>
      ) : trips.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>ยังไม่มีเรื่องเล่าในหมวดนี้</div>
      ) : (
        <div className="grid-4">
          {trips.map(trip => (
            <Link key={trip.slug} href={`/trips/${trip.slug}`} className="grid-item">
              <div className="img-box">
                {trip.coverUrl
                  ? <img src={trip.coverUrl} alt={trip.title} />
                  : <div style={{ width: "100%", height: "100%", background: "#e2e8f0" }} />
                }
              </div>
              <div className="item-info">
                <h4>{trip.title}</h4>
                {trip.province && <p>📍 {trip.province}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        .auto-section { margin-top: 20px; }
        .tab-nav { display: flex; gap: 10px; margin-bottom: 25px; overflow-x: auto; padding-bottom: 10px; }
        .tab-btn { white-space: nowrap; padding: 10px 20px; border-radius: 50px; border: none;
          background: #f1f3f5; cursor: pointer; font-size: 14px; font-weight: 600; }
        .tab-btn.active { background: #333; color: white; }
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .grid-item { background: white; border-radius: 15px; overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: 0.3s; text-decoration: none; color: inherit; display: block; }
        .grid-item:hover { transform: translateY(-5px); }
        .img-box { height: 150px; overflow: hidden; }
        .img-box img { width: 100%; height: 100%; object-fit: cover; }
        .item-info { padding: 15px; }
        .item-info h4 { margin: 0 0 5px; font-size: 15px; color: #333;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .item-info p { margin: 0; font-size: 12px; color: #888; }
        @media (max-width: 992px) { .grid-4 { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .grid-4 { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { PROVINCES, getDistricts } from "@/data/thailand";

interface Trip {
  slug: string;
  title: string;
  coverUrl?: string | null;
  province?: string | null;
  district?: string | null;
  category?: string | null;
}

const CATEGORIES = [
  { id: "",          icon: "🗺️", label: "ทั้งหมด",          en: "All" },
  { id: "adventure", icon: "🧗", label: "Adventure",         en: "Adventure" },
  { id: "nature",    icon: "🌿", label: "ธรรมชาติ",          en: "Nature" },
  { id: "cafe",      icon: "☕", label: "คาเฟ่",             en: "Café" },
  { id: "sea",       icon: "🌊", label: "ทะเล",              en: "Sea" },
  { id: "food",      icon: "🍲", label: "อาหาร",             en: "Food" },
  { id: "stay",      icon: "🏨", label: "ที่พัก",            en: "Stay" },
  { id: "culture",   icon: "🏛️", label: "วัฒนธรรม",         en: "Culture" },
];

export default function ExplorerSection() {
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [category, setCategory] = useState("");
  const [trips,    setTrips    ] = useState<Trip[]>([]);
  const [loading,  setLoading  ] = useState(false);

  const districts = province ? getDistricts(province) : [];

  useEffect(() => {
    if (!province) { setTrips([]); return; }
    setLoading(true);
    const params = new URLSearchParams({ limit: "12" });
    // ดึงชื่อจังหวัดไทย (ตัดส่วน EN ออก)
    const provTh = province.split(" (")[0];
    params.set("province", provTh);
    if (district) params.set("district", district);
    if (category) params.set("category", category);
    fetch(`/api/trips?${params}`)
      .then(r => r.json())
      .then(d => { setTrips(d.trips ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [province, district, category]);

  const handleProvinceChange = (v: string) => { setProvince(v); setDistrict(""); };

  return (
    <div className="ex-wrap">
      <div className="ex-header">
        <h2 className="ex-title">📍 เจาะลึกรายพื้นที่ <span>Explore by Area</span></h2>
        <p className="ex-sub">เลือกจังหวัดและอำเภอเพื่อดูเรื่องเล่าจากพื้นที่นั้น · Filter stories by location</p>
      </div>

      <div className="ex-filters">
        <div className="ex-select-wrap">
          <label className="ex-label">จังหวัด · Province</label>
          <select className="ex-select" value={province} onChange={e => handleProvinceChange(e.target.value)}>
            <option value="">-- เลือกจังหวัด / Select Province --</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="ex-select-wrap">
          <label className="ex-label">อำเภอ · District</label>
          <select className="ex-select" value={district} onChange={e => setDistrict(e.target.value)} disabled={!province}>
            <option value="">-- ทุกอำเภอ / All Districts --</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="ex-cats">
        {CATEGORIES.map(c => (
          <button key={c.id} className={`ex-cat${category === c.id ? " active" : ""}`} onClick={() => setCategory(c.id)}>
            {c.icon} <span>{c.label}</span>
          </button>
        ))}
      </div>

      <div className="ex-results">
        {!province ? (
          <div className="ex-empty">
            <span>🗺️</span>
            <p>เลือกจังหวัดด้านบนเพื่อดูเรื่องเล่าจากพื้นที่นั้น</p>
            <small>Select a province to explore stories from that area</small>
          </div>
        ) : loading ? (
          <div className="ex-empty"><span>⏳</span><p>กำลังโหลด...</p></div>
        ) : trips.length === 0 ? (
          <div className="ex-empty">
            <span>📭</span>
            <p>ยังไม่มีเรื่องเล่าจาก{province.split(" (")[0]}</p>
            <small>No stories from this area yet — be the first!</small>
          </div>
        ) : (
          <div className="ex-grid">
            {trips.map(trip => (
              <Link key={trip.slug} href={`/trips/${trip.slug}`} className="ex-card">
                <div className="ex-img">
                  {trip.coverUrl ? <img src={trip.coverUrl} alt={trip.title} /> : <div className="ex-img-ph">🏞️</div>}
                </div>
                <div className="ex-info">
                  <h4>{trip.title}</h4>
                  <p>📍 {[trip.district, trip.province].filter(Boolean).join(", ")}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .ex-wrap { background: white; padding: 36px; border-radius: 28px; box-shadow: 0 8px 28px rgba(15,23,42,0.05); margin-top: 48px; border: 1px solid #f1f5f9; }
        .ex-header { margin-bottom: 22px; }
        .ex-title { font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 6px; }
        .ex-title span { color: #2563eb; }
        .ex-sub { font-size: 13px; color: #64748b; margin: 0; }
        .ex-filters { display: flex; gap: 16px; margin-bottom: 16px; }
        .ex-select-wrap { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .ex-label { font-size: 12px; font-weight: 700; color: #64748b; }
        .ex-select { padding: 10px 14px; border-radius: 12px; border: 1.5px solid #e2e8f0; font-size: 14px; color: #0f172a; background: white; outline: none; font-family: inherit; }
        .ex-select:focus { border-color: #4facfe; }
        .ex-select:disabled { opacity: 0.5; cursor: not-allowed; background: #f8fafc; }
        .ex-cats { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
        .ex-cat { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 999px; border: 1.5px solid #e2e8f0; background: white; font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; transition: 0.2s; font-family: inherit; }
        .ex-cat.active { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; }
        .ex-cat:hover:not(.active) { background: #f8fafc; }
        .ex-results { min-height: 160px; }
        .ex-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 20px; gap: 10px; text-align: center; background: #f8fafc; border-radius: 18px; }
        .ex-empty span { font-size: 40px; }
        .ex-empty p { font-size: 15px; color: #475569; font-weight: 600; margin: 0; }
        .ex-empty small { font-size: 12px; color: #94a3b8; }
        .ex-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .ex-card { background: #f8fafc; border-radius: 16px; overflow: hidden; text-decoration: none; color: inherit; transition: 0.2s; border: 1px solid #f1f5f9; display: block; }
        .ex-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(15,23,42,0.08); }
        .ex-img { height: 130px; overflow: hidden; background: #e2e8f0; }
        .ex-img img { width: 100%; height: 100%; object-fit: cover; }
        .ex-img-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 36px; }
        .ex-info { padding: 12px; }
        .ex-info h4 { font-size: 13px; font-weight: 700; color: #1e293b; margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ex-info p { font-size: 11px; color: #94a3b8; margin: 0; }
        @media (max-width: 900px) { .ex-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .ex-filters { flex-direction: column; } .ex-grid { grid-template-columns: 1fr; } .ex-wrap { padding: 22px 18px; } }
      `}</style>
    </div>
  );
}

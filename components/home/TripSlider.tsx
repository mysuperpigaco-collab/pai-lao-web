"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Trip {
  slug: string;
  title: string;
  coverUrl?: string | null;
  province?: string | null;
  author: { displayName?: string | null; firstName: string };
}

export default function TripSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trips, setTrips] = useState<Trip[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/trips?limit=6&sort=recent")
      .then(r => r.json())
      .then(d => { if (d.trips?.length) setTrips(d.trips); })
      .catch(() => {});
  }, []);

  const startTimer = (length: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrentIndex(p => (p + 1) % length), 5000);
  };

  useEffect(() => {
    if (trips.length <= 1) return;
    startTimer(trips.length);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [trips.length]);

  const moveSlide = (dir: number) => {
    const next = (currentIndex + dir + trips.length) % trips.length;
    setCurrentIndex(next);
    startTimer(trips.length);
  };

  if (trips.length === 0) {
    return (
      <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: 20, color: "#94a3b8", fontSize: 15 }}>
        ยังไม่มีเรื่องเล่า — เป็นคนแรกที่เล่าให้ฟัง!
      </div>
    );
  }

  return (
    <div className="sl-wrap">
      <button className="sl-arrow sl-left" onClick={() => moveSlide(-1)} aria-label="ก่อนหน้า">‹</button>

      <div className="sl-viewport">
        <div className="sl-track" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
          {trips.map((trip) => (
            <Link key={trip.slug} href={`/trips/${trip.slug}`} className="sl-slide">
              {trip.coverUrl
                ? <img src={trip.coverUrl} alt={trip.title} className="sl-img" />
                : <div className="sl-ph" />}
              <div className="sl-overlay" />
              <div className="sl-info">
                <div className="sl-info-inner">
                  <h3 className="sl-title">{trip.title}</h3>
                  <div className="sl-meta">
                    {trip.province && <span>📍 {trip.province}</span>}
                    <span>โดย {trip.author?.displayName || trip.author?.firstName}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <button className="sl-arrow sl-right" onClick={() => moveSlide(1)} aria-label="ถัดไป">›</button>

      {trips.length > 1 && (
        <div className="sl-dots">
          {trips.map((_, i) => (
            <button key={i} className={`sl-dot${i === currentIndex ? " active" : ""}`}
              onClick={() => { setCurrentIndex(i); startTimer(trips.length); }}
              aria-label={`สไลด์ ${i + 1}`} />
          ))}
        </div>
      )}

      <style jsx>{`
        .sl-wrap { position: relative; display: flex; align-items: center; margin-bottom: 28px; }
        .sl-viewport { width: 100%; overflow: hidden; border-radius: 20px; }
        .sl-track { display: flex; transition: transform 0.45s ease-in-out; }
        .sl-slide { min-width: 100%; height: 280px; position: relative; display: block; text-decoration: none; overflow: hidden; }
        .sl-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .sl-ph { width: 100%; height: 100%; background: #e2e8f0; }
        .sl-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,10,20,0.75) 0%, rgba(10,10,20,0.1) 60%, transparent 100%); }
        .sl-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 0 20px 18px; }
        .sl-info-inner { max-width: 680px; }
        .sl-title { color: white; font-size: 18px; font-weight: 900; margin: 0 0 5px; line-height: 1.3; text-shadow: 0 1px 6px rgba(0,0,0,0.4); }
        .sl-meta { display: flex; gap: 12px; flex-wrap: wrap; }
        .sl-meta span { color: rgba(255,255,255,0.85); font-size: 12px; font-weight: 500; }

        .sl-arrow { position: absolute; z-index: 10; background: rgba(255,255,255,0.92); border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 22px; line-height: 1; box-shadow: 0 2px 10px rgba(0,0,0,0.18); color: #334155; display: flex; align-items: center; justify-content: center; transition: 0.2s; backdrop-filter: blur(4px); }
        .sl-arrow:hover { background: white; transform: scale(1.08); }
        .sl-left { left: -18px; }
        .sl-right { right: -18px; }

        .sl-dots { position: absolute; bottom: 12px; right: 16px; display: flex; gap: 6px; z-index: 10; }
        .sl-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.45); border: none; cursor: pointer; padding: 0; transition: all 0.3s; }
        .sl-dot.active { background: white; width: 22px; border-radius: 4px; }
      `}</style>
    </div>
  );
}

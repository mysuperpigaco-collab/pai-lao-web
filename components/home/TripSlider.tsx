"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Trip {
  slug: string;
  title: string;
  coverUrl?: string | null;
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

  // auto-advance ทุก 5 วินาที
  useEffect(() => {
    if (trips.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % trips.length);
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [trips.length]);

  // เมื่อคลิก arrow — รีเซ็ต timer แล้วเลื่อน
  const moveSlide = (direction: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentIndex(prev => (prev + direction + trips.length) % trips.length);
    // เริ่ม timer ใหม่หลังคลิก
    timerRef.current = setInterval(() => {
      setCurrentIndex(p => (p + 1) % trips.length);
    }, 5000);
  };

  if (trips.length === 0) {
    return (
      <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center",
        background: "#f8fafc", borderRadius: 20, color: "#94a3b8", fontSize: 16 }}>
        ยังไม่มีเรื่องเล่า — เป็นคนแรกที่เล่าให้ฟัง!
      </div>
    );
  }

  return (
    <div className="slider-wrapper">
      <button className="arrow left" onClick={() => moveSlide(-1)} aria-label="ก่อนหน้า">❮</button>
      <div className="slider-viewport">
        <div className="slider-container" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
          {trips.map((trip) => (
            <Link key={trip.slug} href={`/trips/${trip.slug}`} className="slide-card">
              {trip.coverUrl
                ? <img src={trip.coverUrl} alt={trip.title} />
                : <div style={{ width: "100%", height: 400, background: "#e2e8f0" }} />
              }
              <div className="slide-info">
                <h3>{trip.title}</h3>
                <p>โดย {trip.author?.displayName || trip.author?.firstName}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <button className="arrow right" onClick={() => moveSlide(1)} aria-label="ถัดไป">❯</button>

      {/* dot indicators */}
      {trips.length > 1 && (
        <div className="dots">
          {trips.map((_, i) => (
            <button
              key={i}
              className={`dot${i === currentIndex ? " active" : ""}`}
              onClick={() => moveSlide(i - currentIndex)}
              aria-label={`สไลด์ที่ ${i + 1}`}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .slider-wrapper { position: relative; display: flex; align-items: center; }
        .slider-viewport { width: 100%; overflow: hidden; border-radius: 20px; }
        .slider-container { display: flex; transition: transform 0.5s ease-in-out; }
        .slide-card { min-width: 100%; position: relative; display: block; text-decoration: none; }
        .slide-card img { width: 100%; height: 400px; object-fit: cover; display: block; }
        .slide-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 40px 20px;
          background: linear-gradient(transparent, rgba(0,0,0,0.8)); color: white; }
        .slide-info h3 { margin: 0 0 6px; font-size: 22px; }
        .slide-info p { margin: 0; opacity: 0.85; font-size: 14px; }
        .arrow { position: absolute; z-index: 10; background: white; border: none; width: 40px;
          height: 40px; border-radius: 50%; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          font-size: 14px; }
        .left { left: -20px; } .right { right: -20px; }
        .dots { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 8px; z-index: 10; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.5);
          border: none; cursor: pointer; padding: 0; transition: all 0.3s; }
        .dot.active { background: white; width: 24px; border-radius: 4px; }
      `}</style>
    </div>
  );
}

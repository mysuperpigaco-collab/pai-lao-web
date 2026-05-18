"use client";
import { useState, useEffect } from "react";
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

  useEffect(() => {
    fetch("/api/trips?limit=6&sort=recent")
      .then(r => r.json())
      .then(d => { if (d.trips?.length) setTrips(d.trips); })
      .catch(() => {});
  }, []);

  const moveSlide = (direction: number) => {
    setCurrentIndex(prev =>
      direction === 1
        ? Math.min(prev + 1, trips.length - 1)
        : Math.max(prev - 1, 0)
    );
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
      <button className="arrow left" onClick={() => moveSlide(-1)}>❮</button>
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
      <button className="arrow right" onClick={() => moveSlide(1)}>❯</button>

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
          height: 40px; border-radius: 50%; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        .left { left: -20px; } .right { right: -20px; }
      `}</style>
    </div>
  );
}

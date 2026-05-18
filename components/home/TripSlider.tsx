"use client";
import { useState } from "react";

export default function TripSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // สมมติข้อมูลเรื่องเล่า
  const trips = [
    { id: 1, title: "หนีร้อนไปพึ่งดอยที่เชียงใหม่", img: "https://picsum.photos", author: "สมชาย" },
    { id: 2, title: "ล่องใต้ดูปะการังน้ำใสที่กระบี่", img: "https://picsum.photos", author: "สายใจ" },
    { id: 3, title: "คาเฟ่ลับย่านพระนคร", img: "https://picsum.photos", author: "ก้อง" },
    { id: 4, title: "แคมป์ปิ้งริมน้ำตกที่สระบุรี", img: "https://picsum.photos", author: "เป้" },
  ];

  const moveSlide = (direction: number) => {
    if (direction === 1 && currentIndex < trips.length - 1) setCurrentIndex(currentIndex + 1);
    if (direction === -1 && currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  return (
    <div className="slider-wrapper">
      <button className="arrow left" onClick={() => moveSlide(-1)}>❮</button>
      <div className="slider-viewport">
        <div className="slider-container" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
          {trips.map((trip) => (
            <div key={trip.id} className="slide-card">
              <img src={trip.img} alt={trip.title} />
              <div className="slide-info">
                <h3>{trip.title}</h3>
                <p>โดย {trip.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button className="arrow right" onClick={() => moveSlide(1)}>❯</button>

      <style jsx>{`
        .slider-wrapper { position: relative; display: flex; align-items: center; }
        .slider-viewport { width: 100%; overflow: hidden; border-radius: 20px; }
        .slider-container { display: flex; transition: transform 0.5s ease-in-out; }
        .slide-card { min-width: 100%; position: relative; }
        .slide-card img { width: 100%; height: 400px; object-fit: cover; }
        .slide-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 40px 20px; background: linear-gradient(transparent, rgba(0,0,0,0.8)); color: white; }
        .arrow { position: absolute; z-index: 10; background: white; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        .left { left: -20px; } .right { right: -20px; }
      `}</style>
    </div>
  );
}

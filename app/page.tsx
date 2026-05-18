"use client";

import { useState } from "react";
import TripSlider from "@/components/home/TripSlider";
import ExplorerSection from "@/components/home/ExplorerSection";
import AutoGridSection from "@/components/home/AutoGridSection";

export default function HomePage() {
  const [showAllReviews, setShowAllReviews] = useState(false);

  return (
    <main className="container">
      {/* --- Spotlight Section --- */}
      <div className="header-section">
        <h2 className="section-title">✨ เรื่องเล่า <span>Spotlight</span></h2>
      </div>

      <div className="slider-section-wrapper">
        <TripSlider />
      </div>

      <button 
        onClick={() => setShowAllReviews(!showAllReviews)} 
        className="view-all-btn"
      >
        {showAllReviews ? "📂 ปิดคลังเรื่องเล่า" : "📂 เปิดคลังเรื่องเล่าทั้งหมด 10 รายการ"}
      </button>

      {showAllReviews && (
        <div id="reviewPanel" className="fade-in">
          <div className="review-grid">
            {/* รายการ Review ทั้งหมดจะมาใส่ตรงนี้ */}
            <p className="empty-state">กำลังโหลดเรื่องเล่าทั้งหมด...</p>
          </div>
        </div>
      )}

      {/* --- Explore Section (เจาะลึกพื้นที่) --- */}
      <ExplorerSection />

      {/* --- Must-See Section (ไฮไลต์รายสัปดาห์) --- */}
      <h2 className="section-title" style={{ marginTop: '60px' }}>
        📺 <span>Must-See</span> ไฮไลต์น่าสนใจสัปดาห์นี้
      </h2>
      <AutoGridSection />

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .section-title {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 25px;
          color: #333;
        }
        .section-title span {
          color: #3b82f6;
        }
        .view-all-btn {
          width: 100%;
          padding: 15px;
          background: #f8f9fa;
          border: 2px dashed #ddd;
          border-radius: 15px;
          color: #666;
          font-weight: 600;
          cursor: pointer;
          margin: 30px 0;
          transition: 0.3s;
        }
        .view-all-btn:hover {
          background: #f0f7ff;
          border-color: #3b82f6;
          color: #3b82f6;
        }
        .fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}

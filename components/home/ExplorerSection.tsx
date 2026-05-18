"use client";
import { useState } from "react";

export default function ExplorerSection() {
  const [province, setProvince] = useState("");
  const [category, setCategory] = useState("t");

  const categories = [
    { id: 't', icon: '🎡', label: 'จุดเช็คอินสุดคูล' },
    { id: 's', icon: '🏨', label: 'ที่พักคัดเกรด' },
    { id: 'f', icon: '🍛', label: 'ร้านเด็ดต้องลอง' },
    { id: 'r', icon: '💬', label: 'เรื่องเล่าจากพื้นที่' },
  ];

  return (
    <div className="explorer-card">
      <h2 className="explorer-title">📍 <span>Explore</span> เจาะลึกรายพื้นที่</h2>
      
      <div className="filter-row">
        <select className="styled-select" onChange={(e) => setProvince(e.target.value)}>
          <option value="">-- เลือกจังหวัด --</option>
          <option value="chiangmai">เชียงใหม่</option>
          <option value="bangkok">กรุงเทพฯ</option>
        </select>
        <select className="styled-select" disabled={!province}>
          <option value="">-- เลือกอำเภอ --</option>
          {province === "chiangmai" && <option>เมืองเชียงใหม่</option>}
          {province === "bangkok" && <option>พระนคร</option>}
        </select>
      </div>

      <div className="tab-nav">
        {categories.map((cat) => (
          <button 
            key={cat.id} 
            className={`tab-btn ${category === cat.id ? 'active' : ''}`}
            onClick={() => setCategory(cat.id)}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div className="display-area">
        {province ? (
          <div className="grid-placeholder">กำลังวาร์ปไปดู {categories.find(c => c.id === category)?.label}...</div>
        ) : (
          <p className="empty-state">เลือกพื้นที่ด้านบนเพื่อเริ่มวาร์ป...</p>
        )}
      </div>

      <style jsx>{`
        .explorer-card { background: white; padding: 40px; border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin-top: 50px; }
        .explorer-title { font-size: 24px; font-weight: 800; margin-bottom: 20px; }
        .explorer-title span { color: #3b82f6; }
        .filter-row { display: flex; gap: 15px; margin-bottom: 30px; }
        .styled-select { flex: 1; padding: 12px; border-radius: 12px; border: 1px solid #eee; outline: none; }
        .tab-nav { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 30px; }
        .tab-btn { padding: 10px 20px; border-radius: 50px; border: 1px solid #eee; background: white; cursor: pointer; transition: 0.3s; font-size: 14px; }
        .tab-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; }
        .display-area { min-height: 200px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 20px; color: #999; }
      `}</style>
    </div>
  );
}

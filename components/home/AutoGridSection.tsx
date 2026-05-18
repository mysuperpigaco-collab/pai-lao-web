"use client";
import { useState } from "react";

export default function AutoGridSection() {
  const [activeTab, setActiveTab] = useState("hot");

  const tabs = [
    { id: 'hot', label: '🔥 ยอดนิยมที่สุด' },
    { id: 'recent', label: '✨ เพิ่งไปเล่ามา' },
    { id: 'stay', label: '🏘️ ที่พักนอนฟิน' },
    { id: 'food', label: '🍛 อร่อยบอกต่อ' },
  ];

  return (
    <div className="auto-section">
      <div className="tab-nav auto-tabs">
        {tabs.map((tab) => (
          <button 
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid-4x5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <div key={item} className="grid-item">
            <div className="img-box">
               <img src={`https://picsum.photos{item+20}/300/200`} alt="thumb" />
               <span className="badge">Hot</span>
            </div>
            <div className="item-info">
              <h4>ทริปตัวอย่างสุดประทับใจ {item}</h4>
              <p>📍 จังหวัดสมมติ</p>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .auto-section { margin-top: 20px; }
        .tab-nav { display: flex; gap: 10px; margin-bottom: 25px; overflow-x: auto; padding-bottom: 10px; }
        .tab-btn { white-space: nowrap; padding: 10px 20px; border-radius: 50px; border: none; background: #f1f3f5; cursor: pointer; font-size: 14px; font-weight: 600; }
        .tab-btn.active { background: #333; color: white; }
        .grid-4x5 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .grid-item { background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: 0.3s; }
        .grid-item:hover { transform: translateY(-5px); }
        .img-box { position: relative; height: 150px; }
        .img-box img { width: 100%; height: 100%; object-fit: cover; }
        .badge { position: absolute; top: 10px; right: 10px; background: rgba(255,0,0,0.8); color: white; padding: 3px 8px; border-radius: 5px; font-size: 10px; }
        .item-info { padding: 15px; }
        .item-info h4 { margin: 0 0 5px; font-size: 15px; color: #333; }
        .item-info p { margin: 0; font-size: 12px; color: #888; }
        
        @media (max-width: 992px) { .grid-4x5 { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .grid-4x5 { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

"use client";

export default function TravelMap() {
  return (
    <section className="map-section">
      <div className="map-header">
        <h3>📍 เส้นทางเล่าเรื่อง | <small>Travel Route</small></h3>
        <span className="badge">Interactive Map Ready</span>
      </div>
      
      <div className="map-canvas">
        {/* ลายจุด (Grid) พื้นหลังแผนที่ */}
        <div className="map-grid-bg">
          {/* กราฟิกจำลองเส้นทาง (Mock Route) */}
          <svg className="route-svg" viewBox="0 0 500 200">
            <path d="M50,150 Q150,50 250,120 T450,80" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="10,8" opacity="0.4" />
            <circle cx="50" cy="150" r="6" fill="#3b82f6" />
            <circle cx="250" cy="120" r="6" fill="#3b82f6" />
            <circle cx="450" cy="80" r="6" fill="#3b82f6" />
          </svg>

          {/* กล่องข้อมูลลอยตัว (Glassmorphism Overlay) */}
          <div className="map-info-card">
            <div className="map-icon">🗺️</div>
            <h4>กำลังเตรียมการโหลดแผนที่...</h4>
            <p>ระบบกำลังประมวลผลพิกัดเพื่อปักหมุดที่แม่นยำที่สุดให้คุณ</p>
            <button className="btn-map-action">ขยายดูพื้นที่ใกล้เคียง</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .map-section { margin: 45px 0; }
        .map-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .map-header h3 { font-size: 20px; font-weight: 900; color: #1e293b; margin: 0; }
        .map-header small { font-weight: 400; color: #94a3b8; font-size: 14px; }
        .badge { font-size: 10px; background: #eff6ff; color: #3b82f6; padding: 5px 15px; border-radius: 50px; font-weight: 800; letter-spacing: 0.5px; }

        .map-canvas { 
          width: 100%; height: 380px; background: #f8fafc; border-radius: 40px; border: 2px solid #fff;
          box-shadow: inset 0 2px 15px rgba(0,0,0,0.03); overflow: hidden; position: relative;
        }

        .map-grid-bg {
          width: 100%; height: 100%; 
          background-color: #f1f5f9;
          background-image: radial-gradient(#cbd5e1 1.5px, transparent 1.5px);
          background-size: 30px 30px;
          display: flex; align-items: center; justify-content: center;
        }

        .route-svg { position: absolute; width: 80%; height: 60%; top: 20%; left: 10%; z-index: 1; }

        .map-info-card {
          position: relative; z-index: 10; text-align: center; 
          background: rgba(255,255,255,0.85); backdrop-filter: blur(12px); 
          padding: 40px; border-radius: 35px; border: 1px solid #fff;
          box-shadow: 0 15px 35px rgba(0,0,0,0.06); width: 85%; max-width: 400px;
        }
        .map-icon { font-size: 45px; margin-bottom: 12px; }
        .map-info-card h4 { margin: 0; color: #1e293b; font-weight: 800; font-size: 18px; }
        .map-info-card p { margin: 10px 0 25px; color: #64748b; font-size: 14px; line-height: 1.5; }
        
        .btn-map-action {
          background: #3b82f6; color: white; border: none; padding: 12px 30px;
          border-radius: 100px; font-size: 14px; font-weight: 800; cursor: pointer; transition: 0.3s;
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
        }
        .btn-map-action:hover { transform: translateY(-3px); background: #2563eb; box-shadow: 0 12px 25px rgba(59, 130, 246, 0.4); }
      `}</style>
    </section>
  );
}

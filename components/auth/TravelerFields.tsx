"use client";

export default function TravelerFields() {
  const interests = [
    { id: "cafe", label: "☕ คาเฟ่ & ขนมหวาน | Cafe Hopper" },
    { id: "backpack", label: "🎒 แบกเป้ลุยเดี่ยว | Solo Backpacker" },
    { id: "community", label: "🏘️ วิถีชุมชน & ท้องถิ่น | Local Lifestyle" },
    { id: "photography", label: "📸 สายแชะ & ถ่ายภาพ | Photo Enthusiast" },
    { id: "trekking", label: "⛰️ เดินป่า & ปีนเขา | Trekking & Hiking" },
    { id: "temple", label: "⛩️ ไหว้พระ & มูเตลู | Temple & Culture" },
    { id: "sea", label: "🌊 ทะเล & เกาะ | Island & Sea" },
    { id: "foodie", label: "🍲 ตระเวนกินร้านเด็ด | Foodie Guide" },
    { id: "staycation", label: "🏨 นอนหรูอยู่สบาย | Staycation & Hotel" },
    { id: "camping", label: "⛺ แคมป์ปิ้ง & กางเต็นท์ | Camping Vibes" },
    { id: "slowlife", label: "🌿 สโลว์ไลฟ์ใกล้ชิดธรรมชาติ | Slow Living" },
    { id: "ghost", label: "👻 ล่าท้าผี & สถานที่เฮี้ยน | Ghost Hunter" }, // เพิ่มตามคำขอให้ครบ 12
  ];

  return (
    <div className="full-width" style={{ marginTop: "10px" }}>
      <div className="form-group full-width">
        <label style={{ fontWeight: "bold", display: "block", marginBottom: "15px", fontSize: "16px" }}>
          คุณเป็นนักเล่าเรื่องสายไหน?{" "}
          <span className="label-en" style={{ fontSize: "0.8em", opacity: 0.6, fontWeight: "normal" }}>
            Traveler Interests
          </span>
        </label>
        
        <div className="interest-section">
          <div className="interest-grid">
            {interests.map((item) => (
              <label key={item.id} className="check-item">
                <input type="checkbox" name="interests" value={item.id} />
                <span className="check-text">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .full-width {
          grid-column: span 2;
        }
        .interest-grid {
          display: grid;
          /* บังคับให้เป็น 3 คอลัมน์เพื่อให้ได้ 4 แถวพอดี (12 ไอเทม) */
          grid-template-columns: repeat(3, 1fr); 
          gap: 12px;
          background: #fdfdfd;
          padding: 20px;
          border-radius: 15px;
          border: 1px solid #f0f0f0;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        }
        .check-item {
          display: flex;
          align-items: center;
          background: #fff;
          padding: 12px 15px;
          border-radius: 12px;
          border: 1px solid #ededed;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }
        .check-item:hover {
          border-color: #3b82f6;
          background-color: #f0f7ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
        }
        .check-item input {
          margin-right: 12px;
          width: 18px;
          height: 18px;
          accent-color: #3b82f6;
          cursor: pointer;
        }
        .check-text {
          font-size: 13px; /* ปรับขนาดฟอนต์ลงเล็กน้อยเพื่อให้พอดีใน 3 คอลัมน์ */
          color: #333;
          font-weight: 500;
          line-height: 1.2;
        }
        /* ปรับระดับหน้าจอ Tablet ให้เหลือ 2 คอลัมน์ */
        @media (max-width: 992px) {
          .interest-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        /* ปรับระดับมือถือให้เหลือ 1 คอลัมน์ */
        @media (max-width: 600px) {
          .interest-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

"use client";

export default function ProfileSidebar() {
  return (
    <div className="sidebar-container">
      {/* ความสนใจ */}
      <div className="side-card">
        <h3 className="side-title">สิ่งที่คนติดตาม | Interests</h3>
        <div className="tag-cloud">
          <span className="tag">Cafe</span>
          <span className="tag">Trekking</span>
          <span className="tag">Photo</span>
          <span className="tag">Foodie</span>
        </div>
      </div>

      {/* สถิติ */}
      <div className="side-card stats">
        <h3 className="side-title">สถิติคนเล่า | Statistics</h3>
        <div className="stat-row">
          <span>เรื่องเล่าทั้งหมด</span> <strong>3</strong>
        </div>
        <div className="stat-row">
          <span>ถูกใจได้รับ</span> <strong>1.2k</strong>
        </div>
        <div className="stat-row">
          <span>ติดตามอยู่</span> <strong>142</strong>
        </div>
      </div>

      <style jsx>{`
        .side-card { background: white; padding: 35px; border-radius: 35px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); margin-bottom: 30px; }
        .side-title { font-size: 18px; font-weight: 800; margin-bottom: 20px; color: #334155; }
        .tag-cloud { display: flex; flex-wrap: wrap; gap: 10px; }
        .tag {
          padding: 8px 15px; border-radius: 50px; background: #eff6ff;
          color: #3b82f6; font-size: 12px; font-weight: 600; border: 1px solid #dbeafe;
        }
        .stat-row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px; color: #64748b; }
        .stat-row strong { color: #1e293b; font-size: 16px; }
      `}</style>
    </div>
  );
}

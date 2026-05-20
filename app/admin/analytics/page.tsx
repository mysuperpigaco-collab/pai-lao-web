"use client";
import { useEffect, useState } from "react";

interface Stats {
  users: { total: number; traveler: number; business: number; admin: number; superadmin: number };
  trips: { total: number; published: number; draft: number };
  places: { total: number; verified: number; unverified: number };
  reviews: { total: number; replies: number };
  reports: { pending: number; total: number };
  engagement: { bookmarks: number; likes: number };
  topTrips: any[];
  topPlaces: any[];
}

function Bar({ label, val, max, color }: { label: string; val: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((val / max) * 100) : 0;
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:"0.78rem" }}>
        <span style={{ color:"#cbd5e1" }}>{label}</span>
        <span style={{ color:"#94a3b8", fontWeight:600 }}>{val.toLocaleString()}</span>
      </div>
      <div style={{ height:8, background:"#1e293b", borderRadius:99, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:99, transition:"width 0.6s ease" }} />
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); });
  }, []);

  if (loading) return <div className="adm-content"><div className="adm-empty">⏳ กำลังโหลด Analytics...</div></div>;
  if (!stats)  return <div className="adm-content"><div className="adm-empty">โหลดข้อมูลไม่สำเร็จ</div></div>;

  const { users, trips, places, reviews, engagement, topTrips, topPlaces } = stats;

  const maxTrip  = topTrips[0]?._count?.likes || 1;
  const maxPlace = topPlaces[0]?._count?.reviews || 1;

  const CAT_COLORS = ["#4facfe","#43e97b","#f59e0b","#a78bfa","#22d3ee","#f87171","#34d399","#fb923c","#c084fc","#60a5fa"];

  return (
    <>
      <div className="adm-topbar">
        <div className="adm-topbar-title">📊 Analytics & รายงาน</div>
      </div>

      <div className="adm-content">
        {/* Overview numbers */}
        <div className="adm-stats-grid" style={{ marginBottom:28 }}>
          <div className="adm-stat blue">
            <div className="adm-stat-icon">👥</div>
            <div className="adm-stat-val">{users.total.toLocaleString()}</div>
            <div className="adm-stat-label">ผู้ใช้ทั้งหมด</div>
          </div>
          <div className="adm-stat green">
            <div className="adm-stat-icon">🗺️</div>
            <div className="adm-stat-val">{trips.total.toLocaleString()}</div>
            <div className="adm-stat-label">ทริปทั้งหมด</div>
          </div>
          <div className="adm-stat cyan">
            <div className="adm-stat-icon">📍</div>
            <div className="adm-stat-val">{places.total.toLocaleString()}</div>
            <div className="adm-stat-label">สถานที่ทั้งหมด</div>
          </div>
          <div className="adm-stat amber">
            <div className="adm-stat-icon">⭐</div>
            <div className="adm-stat-val">{reviews.total.toLocaleString()}</div>
            <div className="adm-stat-label">รีวิวทั้งหมด</div>
          </div>
          <div className="adm-stat purple">
            <div className="adm-stat-icon">❤️</div>
            <div className="adm-stat-val">{engagement.likes.toLocaleString()}</div>
            <div className="adm-stat-label">ยอดถูกใจรวม</div>
          </div>
          <div className="adm-stat green">
            <div className="adm-stat-icon">🔖</div>
            <div className="adm-stat-val">{engagement.bookmarks.toLocaleString()}</div>
            <div className="adm-stat-label">บุ๊กมาร์กรวม</div>
          </div>
        </div>

        {/* User breakdown + Content health */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20, marginBottom:24 }}>
          {/* User breakdown */}
          <div className="adm-card">
            <div className="adm-card-head"><span className="adm-card-title">👥 สัดส่วนผู้ใช้</span></div>
            <div className="adm-card-body">
              <Bar label={`นักรีวิว (${users.traveler})`}  val={users.traveler}  max={users.total} color="#4facfe" />
              <Bar label={`ธุรกิจ (${users.business})`}    val={users.business}  max={users.total} color="#f59e0b" />
              <Bar label={`แอดมิน (${users.admin})`}       val={users.admin}     max={users.total} color="#2563eb" />
              <Bar label={`Superadmin (${users.superadmin})`} val={users.superadmin} max={users.total} color="#7c3aed" />
              <div style={{ marginTop:16, padding:"12px", background:"#0f172a", borderRadius:8 }}>
                <div style={{ fontSize:"0.72rem", color:"#64748b", marginBottom:8 }}>สัดส่วน</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {[
                    { label:"นักรีวิว", val: users.traveler, color:"#4facfe" },
                    { label:"ธุรกิจ",   val: users.business, color:"#f59e0b" },
                  ].map(item => (
                    <div key={item.label} style={{ fontSize:"0.78rem" }}>
                      <span style={{ color:item.color, fontWeight:700 }}>{users.total > 0 ? Math.round(item.val/users.total*100) : 0}%</span>
                      <span style={{ color:"#64748b" }}> {item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Trip health */}
          <div className="adm-card">
            <div className="adm-card-head"><span className="adm-card-title">🗺️ สถานะทริป</span></div>
            <div className="adm-card-body">
              <Bar label={`เผยแพร่ (${trips.published})`}  val={trips.published} max={trips.total} color="#43e97b" />
              <Bar label={`แบบร่าง (${trips.draft})`}      val={trips.draft}     max={trips.total} color="#475569" />
              <div style={{ marginTop:20, padding:"12px", background:"#0f172a", borderRadius:8 }}>
                <div style={{ fontSize:"0.72rem", color:"#64748b" }}>อัตราการเผยแพร่</div>
                <div style={{ fontSize:"1.8rem", fontWeight:800, color:"#43e97b", lineHeight:1.2, marginTop:4 }}>
                  {trips.total > 0 ? Math.round(trips.published / trips.total * 100) : 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Place health */}
          <div className="adm-card">
            <div className="adm-card-head"><span className="adm-card-title">📍 สถานะสถานที่</span></div>
            <div className="adm-card-body">
              <Bar label={`ยืนยันแล้ว (${places.verified})`}   val={places.verified}   max={places.total} color="#22d3ee" />
              <Bar label={`รอยืนยัน (${places.unverified})`}   val={places.unverified} max={places.total} color="#f59e0b" />
              <div style={{ marginTop:20, padding:"12px", background:"#0f172a", borderRadius:8 }}>
                <div style={{ fontSize:"0.72rem", color:"#64748b" }}>อัตราการยืนยัน</div>
                <div style={{ fontSize:"1.8rem", fontWeight:800, color:"#22d3ee", lineHeight:1.2, marginTop:4 }}>
                  {places.total > 0 ? Math.round(places.verified / places.total * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top rankings */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:24 }}>
          {/* Top Trips */}
          <div className="adm-card">
            <div className="adm-card-head"><span className="adm-card-title">🏆 Top Trips — ยอดถูกใจ</span></div>
            <div className="adm-card-body">
              {topTrips.map((t, i) => (
                <div key={t.id} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{
                      width:22, height:22, borderRadius:"50%", flexShrink:0,
                      background: i===0?"#713f12":i===1?"#334155":i===2?"#431407":"#1e293b",
                      color: i===0?"#fbbf24":i===1?"#94a3b8":i===2?"#fb923c":"#64748b",
                      fontSize:"0.68rem", fontWeight:700,
                      display:"flex", alignItems:"center", justifyContent:"center"
                    }}>{i+1}</span>
                    <span style={{ fontSize:"0.8rem", fontWeight:600, color:"#e2e8f0", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</span>
                    <span style={{ fontSize:"0.72rem", color:"#f9a8d4", whiteSpace:"nowrap" }}>❤️ {t._count.likes}</span>
                  </div>
                  <div style={{ marginLeft:30 }}>
                    <Bar label="" val={t._count.likes} max={maxTrip} color={CAT_COLORS[i % CAT_COLORS.length]} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Places */}
          <div className="adm-card">
            <div className="adm-card-head"><span className="adm-card-title">🏆 Top Places — ยอดรีวิว</span></div>
            <div className="adm-card-body">
              {topPlaces.map((p, i) => (
                <div key={p.id} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{
                      width:22, height:22, borderRadius:"50%", flexShrink:0,
                      background: i===0?"#713f12":i===1?"#334155":i===2?"#431407":"#1e293b",
                      color: i===0?"#fbbf24":i===1?"#94a3b8":i===2?"#fb923c":"#64748b",
                      fontSize:"0.68rem", fontWeight:700,
                      display:"flex", alignItems:"center", justifyContent:"center"
                    }}>{i+1}</span>
                    <span style={{ fontSize:"0.8rem", fontWeight:600, color:"#e2e8f0", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.title}</span>
                    <span style={{ fontSize:"0.72rem", color:"#fde68a", whiteSpace:"nowrap" }}>⭐ {p._count.reviews}</span>
                  </div>
                  <div style={{ marginLeft:30 }}>
                    <Bar label="" val={p._count.reviews} max={maxPlace} color={CAT_COLORS[i % CAT_COLORS.length]} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Engagement summary */}
        <div className="adm-card">
          <div className="adm-card-head"><span className="adm-card-title">📈 ภาพรวม Engagement</span></div>
          <div className="adm-card-body">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:16 }}>
              {[
                { icon:"❤️", label:"ยอดถูกใจทริป + สถานที่", val: engagement.likes, color:"#f9a8d4" },
                { icon:"🔖", label:"บุ๊กมาร์กทั้งหมด", val: engagement.bookmarks, color:"#67e8f9" },
                { icon:"⭐", label:"รีวิวทั้งหมด",    val: reviews.total,       color:"#fde68a" },
                { icon:"💬", label:"ความคิดเห็น",     val: reviews.replies,     color:"#a5f3fc" },
              ].map(item => (
                <div key={item.label} style={{ background:"#0f172a", borderRadius:10, padding:"14px 16px", borderLeft:`3px solid ${item.color}` }}>
                  <div style={{ fontSize:"1.4rem" }}>{item.icon}</div>
                  <div style={{ fontSize:"1.6rem", fontWeight:800, color:item.color, lineHeight:1.2, marginTop:6 }}>{item.val.toLocaleString()}</div>
                  <div style={{ fontSize:"0.72rem", color:"#64748b", marginTop:4 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

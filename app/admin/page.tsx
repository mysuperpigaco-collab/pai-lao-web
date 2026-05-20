"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  users: { total: number; traveler: number; business: number; admin: number; superadmin: number };
  trips: { total: number; published: number; draft: number };
  places: { total: number; verified: number; unverified: number };
  reviews: { total: number; replies: number };
  reports: { pending: number; total: number };
  engagement: { bookmarks: number; likes: number };
  recentUsers: any[];
  recentTrips: any[];
  recentReports: any[];
  topTrips: any[];
  topPlaces: any[];
}

const roleColor = (r: string) => {
  if (r === "SUPERADMIN") return "purple";
  if (r === "ADMIN")      return "blue";
  if (r === "BUSINESS")   return "amber";
  return "gray";
};
const roleLabel = (r: string) => {
  if (r === "SUPERADMIN") return "⚡ SA";
  if (r === "ADMIN")      return "🔑 Admin";
  if (r === "BUSINESS")   return "🏢 Biz";
  return "👤 Traveler";
};

export default function AdminDashboard() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => r.json())
      .then(d => {
        if (d.message && !d.users) { setError(d.message); }
        else { setStats(d); }
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="adm-content">
      <div className="adm-empty">⏳ กำลังโหลดข้อมูล...</div>
    </div>
  );

  if (error) return (
    <div className="adm-content">
      <div style={{ background:"#450a0a", color:"#fca5a5", borderRadius:10, padding:"16px 20px", fontSize:"0.85rem", lineHeight:1.6 }}>
        <strong>❌ เกิดข้อผิดพลาด:</strong><br />{error}
      </div>
    </div>
  );

  if (!stats) return <div className="adm-content"><div className="adm-empty">ไม่สามารถโหลดข้อมูลได้</div></div>;

  const { users, trips, places, reviews, reports, engagement } = stats;

  return (
    <>
      <div className="adm-topbar">
        <div className="adm-topbar-title">🏠 Dashboard</div>
        <div className="adm-topbar-right">
          {reports.pending > 0 && (
            <Link href="/admin/reports" className="adm-btn danger sm">
              🚩 {reports.pending} รายงานรอดำเนินการ
            </Link>
          )}
        </div>
      </div>

      <div className="adm-content">
        <div className="adm-stats-grid">
          <div className="adm-stat blue">
            <div className="adm-stat-icon">👥</div>
            <div className="adm-stat-val">{users.total.toLocaleString()}</div>
            <div className="adm-stat-label">ผู้ใช้งานทั้งหมด</div>
            <div className="adm-stat-sub">นักรีวิว {users.traveler} · ธุรกิจ {users.business} · แอดมิน {users.admin + users.superadmin}</div>
          </div>
          <div className="adm-stat green">
            <div className="adm-stat-icon">🗺️</div>
            <div className="adm-stat-val">{trips.total.toLocaleString()}</div>
            <div className="adm-stat-label">ทริปทั้งหมด</div>
            <div className="adm-stat-sub">เผยแพร่ {trips.published} · แบบร่าง {trips.draft}</div>
          </div>
          <div className="adm-stat cyan">
            <div className="adm-stat-icon">📍</div>
            <div className="adm-stat-val">{places.total.toLocaleString()}</div>
            <div className="adm-stat-label">สถานที่ทั้งหมด</div>
            <div className="adm-stat-sub">ยืนยันแล้ว {places.verified} · รอยืนยัน {places.unverified}</div>
          </div>
          <div className="adm-stat amber">
            <div className="adm-stat-icon">⭐</div>
            <div className="adm-stat-val">{reviews.total.toLocaleString()}</div>
            <div className="adm-stat-label">รีวิวทั้งหมด</div>
            <div className="adm-stat-sub">ความคิดเห็น {reviews.replies} รายการ</div>
          </div>
          <div className={`adm-stat ${reports.pending > 0 ? "red" : "gray"}`}>
            <div className="adm-stat-icon">🚩</div>
            <div className="adm-stat-val">{reports.pending.toLocaleString()}</div>
            <div className="adm-stat-label">รายงานรอดำเนินการ</div>
            <div className="adm-stat-sub">ทั้งหมด {reports.total} รายการ</div>
          </div>
          <div className="adm-stat purple">
            <div className="adm-stat-icon">❤️</div>
            <div className="adm-stat-val">{engagement.likes.toLocaleString()}</div>
            <div className="adm-stat-label">ยอดถูกใจทั้งหมด</div>
            <div className="adm-stat-sub">บุ๊กมาร์ก {engagement.bookmarks} ครั้ง</div>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20, marginBottom:24 }}>
          <div className="adm-card">
            <div className="adm-card-head">
              <span className="adm-card-title">👥 ผู้ใช้ใหม่ล่าสุด</span>
              <Link href="/admin/users" className="adm-btn ghost sm">ดูทั้งหมด</Link>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <tbody>
                  {stats.recentUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="adm-user-cell">
                          {u.avatarUrl
                            ? <img src={u.avatarUrl} className="adm-avatar" alt="" />
                            : <div className="adm-avatar" style={{display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.7rem",color:"#64748b"}}>👤</div>
                          }
                          <div>
                            <div className="adm-uname">{u.displayName || u.firstName}</div>
                            <div className="adm-uemail">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`adm-pill ${roleColor(u.role)}`}>{roleLabel(u.role)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="adm-card">
            <div className="adm-card-head">
              <span className="adm-card-title">🗺️ ทริปล่าสุด</span>
              <Link href="/admin/trips" className="adm-btn ghost sm">ดูทั้งหมด</Link>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <tbody>
                  {stats.recentTrips.map(t => (
                    <tr key={t.id}>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <img src={t.coverUrl} className="adm-thumb" alt="" onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                          <div>
                            <div style={{ fontSize:"0.8rem", fontWeight:600, color:"#e2e8f0", lineHeight:1.3 }}>{t.title}</div>
                            <div style={{ fontSize:"0.7rem", color:"#64748b" }}>@{t.author.username} · ❤️ {t._count.likes}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`adm-pill ${t.isPublished ? "green" : "gray"}`}>
                          {t.isPublished ? "เผยแพร่" : "แบบร่าง"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="adm-card">
            <div className="adm-card-head">
              <span className="adm-card-title">🚩 รายงานรอดำเนินการ</span>
              <Link href="/admin/reports" className="adm-btn ghost sm">ดูทั้งหมด</Link>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <tbody>
                  {stats.recentReports.length === 0 ? (
                    <tr><td className="adm-empty">ไม่มีรายงานรอดำเนินการ 🎉</td></tr>
                  ) : stats.recentReports.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontSize:"0.78rem", fontWeight:600, color:"#e2e8f0" }}>{r.targetType}</div>
                        <div style={{ fontSize:"0.7rem", color:"#64748b" }}>{r.reason}</div>
                        <div style={{ fontSize:"0.68rem", color:"#475569" }}>โดย @{r.reporter.username}</div>
                      </td>
                      <td><span className="adm-pill red">PENDING</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <div className="adm-card">
            <div className="adm-card-head"><span className="adm-card-title">🏆 ทริปยอดนิยม (Top 10)</span></div>
            <div className="adm-card-body">
              <ul className="adm-rank-list">
                {stats.topTrips.map((t, i) => (
                  <li className="adm-rank-item" key={t.id}>
                    <span className={`adm-rank-num ${i===0?"gold":i===1?"silver":i===2?"bronze":""}`}>{i+1}</span>
                    <img src={t.coverUrl} className="adm-thumb" alt="" onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                    <div className="adm-rank-info">
                      <div className="adm-rank-title">{t.title}</div>
                      <div className="adm-rank-meta">❤️ {t._count.likes} · ⭐ {t._count.reviews} · @{t.author.username}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="adm-card">
            <div className="adm-card-head"><span className="adm-card-title">🏆 สถานที่ยอดนิยม (Top 10)</span></div>
            <div className="adm-card-body">
              <ul className="adm-rank-list">
                {stats.topPlaces.map((p, i) => (
                  <li className="adm-rank-item" key={p.id}>
                    <span className={`adm-rank-num ${i===0?"gold":i===1?"silver":i===2?"bronze":""}`}>{i+1}</span>
                    <img src={p.coverUrl} className="adm-thumb" alt="" onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                    <div className="adm-rank-info">
                      <div className="adm-rank-title">{p.title}</div>
                      <div className="adm-rank-meta">⭐ {p._count.reviews} · ❤️ {p._count.likes} · {p.province}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

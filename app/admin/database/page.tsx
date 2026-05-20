"use client";
import { useEffect, useState } from "react";

interface DBData {
  tables: { name: string; count: number }[];
  recentUsers: any[];
  recentTrips: any[];
  recentPlaces: any[];
  recentReports: any[];
  recentLogs: any[];
}

const TABLE_COLORS: Record<string, string> = {
  User:"#4facfe", Business:"#f59e0b", Place:"#22d3ee", Trip:"#43e97b",
  Review:"#fde68a", ReviewReply:"#a5f3fc", TimelineStop:"#c084fc",
  Bookmark:"#67e8f9", TripLike:"#f9a8d4", PlaceLike:"#f9a8d4",
  Follow:"#a5b4fc", Report:"#fca5a5", AdminLog:"#cbd5e1",
};

export default function AdminDatabasePage() {
  const [data, setData]       = useState<DBData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("overview");

  useEffect(() => {
    fetch("/api/admin/database")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="adm-content"><div className="adm-empty">⏳ กำลังโหลดข้อมูล Database...</div></div>;
  if (!data)   return <div className="adm-content"><div className="adm-empty">โหลดข้อมูลไม่สำเร็จ</div></div>;

  const totalRows = data.tables.reduce((s, t) => s + t.count, 0);

  const TABS = [
    { val:"overview", label:"📊 ภาพรวม" },
    { val:"users",    label:"👥 Users" },
    { val:"trips",    label:"🗺️ Trips" },
    { val:"places",   label:"📍 Places" },
    { val:"reports",  label:"🚩 Reports" },
    { val:"logs",     label:"📋 Admin Logs" },
  ];

  return (
    <>
      <div className="adm-topbar">
        <div className="adm-topbar-title">🗄️ Database Overview (Superadmin)</div>
        <div className="adm-topbar-right">
          <span style={{ color:"#64748b", fontSize:"0.8rem" }}>รวม {totalRows.toLocaleString()} rows</span>
        </div>
      </div>

      <div className="adm-content">
        {/* Tab nav */}
        <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
          {TABS.map(t => (
            <button key={t.val} className={`adm-btn ${tab === t.val ? "primary" : "ghost"}`}
              onClick={() => setTab(t.val)}>{t.label}</button>
          ))}
        </div>

        {tab === "overview" && (
          <>
            {/* Table count grid */}
            <div className="adm-db-grid" style={{ marginBottom:24 }}>
              {data.tables.map(t => (
                <div key={t.name} className="adm-db-card" style={{ borderTop: `3px solid ${TABLE_COLORS[t.name] || "#334155"}` }}>
                  <div className="adm-db-name">{t.name}</div>
                  <div className="adm-db-count" style={{ color: TABLE_COLORS[t.name] || "#f1f5f9" }}>{t.count.toLocaleString()}</div>
                  <div style={{ fontSize:"0.65rem", color:"#475569", marginTop:2 }}>rows</div>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div className="adm-card">
              <div className="adm-card-head"><span className="adm-card-title">📊 จำนวน Records ต่อตาราง</span></div>
              <div className="adm-card-body">
                {[...data.tables].sort((a,b) => b.count - a.count).map(t => {
                  const pct = totalRows > 0 ? (t.count / Math.max(...data.tables.map(x=>x.count))) * 100 : 0;
                  return (
                    <div key={t.name} style={{ marginBottom:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3, fontSize:"0.78rem" }}>
                        <span style={{ color:"#cbd5e1" }}>{t.name}</span>
                        <span style={{ color:"#94a3b8", fontWeight:600 }}>{t.count.toLocaleString()}</span>
                      </div>
                      <div style={{ height:8, background:"#0f172a", borderRadius:99 }}>
                        <div style={{
                          height:"100%", width:`${pct}%`,
                          background: TABLE_COLORS[t.name] || "#4facfe",
                          borderRadius:99, transition:"width 0.5s ease",
                          minWidth: t.count > 0 ? 4 : 0
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {tab === "users" && (
          <div className="adm-card">
            <div className="adm-card-head"><span className="adm-card-title">👥 ผู้ใช้ล่าสุด 5 คน</span></div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>สมัครเมื่อ</th></tr></thead>
                <tbody>
                  {data.recentUsers.map(u => (
                    <tr key={u.id}>
                      <td style={{fontFamily:"monospace",color:"#475569",fontSize:"0.7rem"}}>{u.id.slice(0,8)}…</td>
                      <td style={{color:"#e2e8f0"}}>@{u.username}</td>
                      <td style={{color:"#64748b",fontSize:"0.78rem"}}>{u.email}</td>
                      <td><span className={`adm-pill ${u.role==="SUPERADMIN"?"purple":u.role==="ADMIN"?"blue":u.role==="BUSINESS"?"amber":"gray"}`}>{u.role}</span></td>
                      <td style={{color:"#64748b",fontSize:"0.75rem"}}>{new Date(u.createdAt).toLocaleString("th-TH")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "trips" && (
          <div className="adm-card">
            <div className="adm-card-head"><span className="adm-card-title">🗺️ ทริปล่าสุด 5 รายการ</span></div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>ID</th><th>Slug</th><th>Title</th><th>Author</th><th>สร้างเมื่อ</th></tr></thead>
                <tbody>
                  {data.recentTrips.map(t => (
                    <tr key={t.id}>
                      <td style={{fontFamily:"monospace",color:"#475569",fontSize:"0.7rem"}}>{t.id.slice(0,8)}…</td>
                      <td style={{color:"#4facfe",fontSize:"0.75rem"}}>{t.slug}</td>
                      <td style={{color:"#e2e8f0",fontSize:"0.8rem"}}>{t.title}</td>
                      <td style={{color:"#64748b",fontSize:"0.78rem"}}>@{t.author.username}</td>
                      <td style={{color:"#64748b",fontSize:"0.75rem"}}>{new Date(t.createdAt).toLocaleString("th-TH")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "places" && (
          <div className="adm-card">
            <div className="adm-card-head"><span className="adm-card-title">📍 สถานที่ล่าสุด 5 รายการ</span></div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>ID</th><th>Slug</th><th>Title</th><th>Category</th><th>สร้างเมื่อ</th></tr></thead>
                <tbody>
                  {data.recentPlaces.map(p => (
                    <tr key={p.id}>
                      <td style={{fontFamily:"monospace",color:"#475569",fontSize:"0.7rem"}}>{p.id.slice(0,8)}…</td>
                      <td style={{color:"#22d3ee",fontSize:"0.75rem"}}>{p.slug}</td>
                      <td style={{color:"#e2e8f0",fontSize:"0.8rem"}}>{p.title}</td>
                      <td><span className="adm-pill cyan" style={{fontSize:"0.65rem"}}>{p.category}</span></td>
                      <td style={{color:"#64748b",fontSize:"0.75rem"}}>{new Date(p.createdAt).toLocaleString("th-TH")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "reports" && (
          <div className="adm-card">
            <div className="adm-card-head"><span className="adm-card-title">🚩 รายงานล่าสุด 5 รายการ</span></div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>ID</th><th>TargetType</th><th>Reason</th><th>Status</th><th>วันที่</th></tr></thead>
                <tbody>
                  {data.recentReports.map(r => (
                    <tr key={r.id}>
                      <td style={{fontFamily:"monospace",color:"#475569",fontSize:"0.7rem"}}>{r.id.slice(0,8)}…</td>
                      <td style={{color:"#94a3b8"}}>{r.targetType}</td>
                      <td><span className="adm-pill red" style={{fontSize:"0.65rem"}}>{r.reason}</span></td>
                      <td><span className={`adm-pill ${r.status==="PENDING"?"red":r.status==="REVIEWED"?"green":"gray"}`} style={{fontSize:"0.65rem"}}>{r.status}</span></td>
                      <td style={{color:"#64748b",fontSize:"0.75rem"}}>{new Date(r.createdAt).toLocaleString("th-TH")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "logs" && (
          <div className="adm-card">
            <div className="adm-card-head"><span className="adm-card-title">📋 Admin Log ล่าสุด 5 รายการ</span></div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>ID</th><th>Admin ID</th><th>Action</th><th>Detail</th><th>วันที่</th></tr></thead>
                <tbody>
                  {data.recentLogs.map(l => (
                    <tr key={l.id}>
                      <td style={{fontFamily:"monospace",color:"#475569",fontSize:"0.7rem"}}>{l.id.slice(0,8)}…</td>
                      <td style={{fontFamily:"monospace",color:"#475569",fontSize:"0.7rem"}}>{l.adminId.slice(0,8)}…</td>
                      <td><span className="adm-action-pill adm-action-default" style={{fontSize:"0.65rem"}}>{l.action}</span></td>
                      <td style={{color:"#64748b",fontSize:"0.75rem"}}>{l.detail || "—"}</td>
                      <td style={{color:"#64748b",fontSize:"0.75rem"}}>{new Date(l.createdAt).toLocaleString("th-TH")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

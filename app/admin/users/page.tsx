"use client";
import { useEffect, useState, useCallback } from "react";

const ROLES = ["", "TRAVELER", "BUSINESS", "ADMIN", "SUPERADMIN"];
const roleColor = (r: string) => {
  if (r === "SUPERADMIN") return "purple";
  if (r === "ADMIN")      return "blue";
  if (r === "BUSINESS")   return "amber";
  return "gray";
};

export default function AdminUsersPage() {
  const [users, setUsers]     = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [q, setQ]             = useState("");
  const [role, setRole]       = useState("");
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<{ userId: string; username: string; newRole: string } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ q, role, page: String(page), limit: "20" });
    fetch(`/api/admin/users?${params}`)
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setTotal(d.total || 0); setPages(d.pages || 1); })
      .finally(() => setLoading(false));
  }, [q, role, page]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load(); };

  const changeRole = async () => {
    if (!confirm) return;
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: confirm.userId, role: confirm.newRole, action: "changeRole" }),
    });
    if (res.ok) { setConfirm(null); load(); }
  };

  return (
    <>
      <div className="adm-topbar">
        <div className="adm-topbar-title">👥 จัดการผู้ใช้งาน</div>
        <div className="adm-topbar-right">
          <span style={{ color:"#64748b", fontSize:"0.8rem" }}>ทั้งหมด {total.toLocaleString()} รายการ</span>
        </div>
      </div>

      <div className="adm-content">
        <div className="adm-card">
          <div className="adm-card-head">
            <form onSubmit={handleSearch} className="adm-filters">
              <input
                className="adm-input"
                placeholder="ค้นหา ชื่อ / อีเมล / username..."
                value={q}
                onChange={e => setQ(e.target.value)}
              />
              <select className="adm-select" value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
                <option value="">ทุก Role</option>
                {ROLES.filter(r => r).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button type="submit" className="adm-btn primary sm">ค้นหา</button>
            </form>
          </div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>ผู้ใช้งาน</th>
                  <th>อีเมล</th>
                  <th>Role</th>
                  <th>ทริป</th>
                  <th>รีวิว</th>
                  <th>รายงาน</th>
                  <th>ธุรกิจ</th>
                  <th>สมัครเมื่อ</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="adm-empty">⏳ กำลังโหลด...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={9} className="adm-empty">ไม่พบผู้ใช้งาน</td></tr>
                ) : users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="adm-user-cell">
                        {u.avatarUrl
                          ? <img src={u.avatarUrl} className="adm-avatar" alt="" />
                          : <div className="adm-avatar" style={{display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b"}}>👤</div>
                        }
                        <div>
                          <div className="adm-uname">{u.displayName || `${u.firstName} ${u.lastName}`}</div>
                          <div className="adm-uemail">@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color:"#64748b", fontSize:"0.78rem" }}>{u.email}</td>
                    <td><span className={`adm-pill ${roleColor(u.role)}`}>{u.role}</span></td>
                    <td style={{ color:"#94a3b8" }}>{u._count.trips}</td>
                    <td style={{ color:"#94a3b8" }}>{u._count.reviews}</td>
                    <td style={{ color: u._count.reports > 0 ? "#fca5a5" : "#64748b" }}>{u._count.reports}</td>
                    <td style={{ color:"#64748b", fontSize:"0.75rem" }}>
                      {u.business ? <span className="adm-pill amber">{u.business.businessName}</span> : "—"}
                    </td>
                    <td style={{ color:"#64748b", fontSize:"0.75rem" }}>{new Date(u.createdAt).toLocaleDateString("th-TH")}</td>
                    <td>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        <a href={`/user/${u.username}`} target="_blank" className="adm-btn ghost sm">👁️ ดู</a>
                        {ROLES.filter(r => r && r !== u.role).map(r => (
                          <button
                            key={r}
                            className={`adm-btn sm ${r === "ADMIN" || r === "SUPERADMIN" ? "amber" : r === "TRAVELER" ? "ghost" : "success"}`}
                            onClick={() => setConfirm({ userId: u.id, username: u.username, newRole: r })}
                          >
                            → {r}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="adm-pagination">
              <button className="adm-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                const p = page <= 4 ? i + 1 : page - 3 + i;
                if (p < 1 || p > pages) return null;
                return (
                  <button key={p} className={`adm-page-btn${page === p ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                );
              })}
              <button className="adm-page-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          )}
        </div>
      </div>

      {/* Confirm role change modal */}
      {confirm && (
        <div className="adm-overlay" onClick={() => setConfirm(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-title">🔄 เปลี่ยน Role</div>
            <div className="adm-modal-body">
              ยืนยันเปลี่ยน Role ของ <strong style={{color:"#e2e8f0"}}>@{confirm.username}</strong> เป็น <strong style={{color:"#e2e8f0"}}>{confirm.newRole}</strong>?
              <br /><br />การเปลี่ยนแปลงนี้ไม่สามารถย้อนกลับได้โดยอัตโนมัติ
            </div>
            <div className="adm-modal-actions">
              <button className="adm-btn ghost" onClick={() => setConfirm(null)}>ยกเลิก</button>
              <button className="adm-btn primary" onClick={changeRole}>ยืนยัน</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

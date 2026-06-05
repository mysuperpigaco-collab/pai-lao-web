"use client";
import { useEffect, useState, useCallback } from "react";

const ROLES = ["", "TRAVELER", "BUSINESS", "ADMIN", "SUPERADMIN"];
const DURATIONS = [
  { value: "1d",        label: "1 วัน" },
  { value: "7d",        label: "7 วัน" },
  { value: "30d",       label: "30 วัน" },
  { value: "permanent", label: "ถาวร" },
];

const roleColor = (r: string) => {
  if (r === "SUPERADMIN") return "purple";
  if (r === "ADMIN")      return "blue";
  if (r === "BUSINESS")   return "amber";
  return "gray";
};

const isBanned     = (u: any) => u.bannedUntil     && new Date(u.bannedUntil)     > new Date();
const isPostBanned = (u: any) => u.postBannedUntil && new Date(u.postBannedUntil) > new Date();

function formatBanDate(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (date.getFullYear() >= 2099) return "ถาวร";
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

type BanModal = {
  userId:   string;
  username: string;
  banType:  "banAccount" | "banPost";
  duration: string;
  reason:   string;
} | null;

export default function AdminUsersPage() {
  const [tab, setTab]           = useState<"all" | "banned">("all");
  const [users, setUsers]       = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [q, setQ]               = useState("");
  const [role, setRole]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [bannedCount, setBannedCount] = useState(0);
  const [confirm, setConfirm]   = useState<{ userId: string; username: string; newRole: string } | null>(null);
  const [banModal, setBanModal] = useState<BanModal>(null);
  const [banError, setBanError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ q, page: String(page), limit: "20" });
    if (tab === "all" && role) params.set("role", role);
    if (tab === "banned") params.set("banned", "1");
    fetch(`/api/admin/users?${params}`)
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setTotal(d.total || 0); setPages(d.pages || 1); })
      .finally(() => setLoading(false));
  }, [q, role, page, tab]);

  const loadBannedCount = useCallback(() => {
    fetch("/api/admin/users?banned=1&limit=1")
      .then(r => r.json())
      .then(d => setBannedCount(d.total || 0));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadBannedCount(); }, [loadBannedCount]);

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

  const submitBan = async () => {
    if (!banModal) return;
    if (!banModal.reason.trim()) { setBanError("กรุณาระบุเหตุผล"); return; }
    setBanError("");
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId:   banModal.userId,
        action:   banModal.banType,
        duration: banModal.duration,
        reason:   banModal.reason.trim(),
      }),
    });
    if (res.ok) {
      setBanModal(null);
      load();
      loadBannedCount();
    } else {
      const d = await res.json();
      setBanError(d.message || "เกิดข้อผิดพลาด");
    }
  };

  const submitUnban = async (userId: string) => {
    await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "unban" }),
    });
    load();
    loadBannedCount();
  };

  const colSpan = tab === "banned" ? 7 : 9;

  return (
    <>
      <div className="adm-topbar">
        <div className="adm-topbar-title">👥 จัดการผู้ใช้งาน</div>
        <div className="adm-topbar-right">
          <span style={{ color:"#64748b", fontSize:"0.8rem" }}>ทั้งหมด {total.toLocaleString()} รายการ</span>
        </div>
      </div>

      <div className="adm-content">
        {/* Tabs */}
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          <button
            className={`adm-btn ${tab === "all" ? "primary" : "ghost"} sm`}
            onClick={() => { setTab("all"); setPage(1); setQ(""); }}
          >
            👥 ทั้งหมด
          </button>
          <button
            className={`adm-btn ${tab === "banned" ? "primary" : "ghost"} sm`}
            onClick={() => { setTab("banned"); setPage(1); setQ(""); }}
          >
            🚫 ผู้ถูกแบน
            {bannedCount > 0 && (
              <span style={{ marginLeft:6, background:"#ef4444", color:"#fff", borderRadius:99, padding:"1px 7px", fontSize:11, fontWeight:700 }}>
                {bannedCount}
              </span>
            )}
          </button>
        </div>

        <div className="adm-card">
          <div className="adm-card-head">
            <form onSubmit={handleSearch} className="adm-filters">
              <input
                className="adm-input"
                placeholder="ค้นหา ชื่อ / อีเมล / username..."
                value={q}
                onChange={e => setQ(e.target.value)}
              />
              {tab === "all" && (
                <select className="adm-select" value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
                  <option value="">ทุก Role</option>
                  {ROLES.filter(r => r).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              )}
              <button type="submit" className="adm-btn primary sm">ค้นหา</button>
            </form>
          </div>

          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                {tab === "all" ? (
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
                ) : (
                  <tr>
                    <th>ผู้ใช้งาน</th>
                    <th>อีเมล</th>
                    <th>Role</th>
                    <th>ประเภทแบน</th>
                    <th>หมดอายุ</th>
                    <th>เหตุผล</th>
                    <th>ยกเลิก</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={colSpan} className="adm-empty">⏳ กำลังโหลด...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={colSpan} className="adm-empty">
                    {tab === "banned" ? "ไม่มีผู้ใช้ที่ถูกแบนในขณะนี้" : "ไม่พบผู้ใช้งาน"}
                  </td></tr>
                ) : users.map(u => (
                  <tr key={u.id} style={(isBanned(u) || isPostBanned(u)) ? { opacity: 0.75 } : undefined}>
                    {/* ผู้ใช้งาน */}
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

                    {/* คอลัมน์ตาม tab */}
                    {tab === "all" ? (
                      <>
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
                            {isBanned(u) || isPostBanned(u) ? (
                              <button
                                className="adm-btn ghost sm"
                                style={{ borderColor:"#22c55e", color:"#22c55e" }}
                                onClick={() => submitUnban(u.id)}
                              >
                                ✓ ยกเลิกแบน
                              </button>
                            ) : (
                              <button
                                className="adm-btn sm"
                                style={{ background:"#7f1d1d", color:"#fca5a5", border:"1px solid #991b1b" }}
                                onClick={() => setBanModal({ userId: u.id, username: u.username, banType: "banAccount", duration: "7d", reason: "" })}
                              >
                                🚫 แบน
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          {isBanned(u) && (
                            <span className="adm-pill" style={{ background:"#7f1d1d", color:"#fca5a5" }}>แบนบัญชี</span>
                          )}
                          {isPostBanned(u) && (
                            <span className="adm-pill" style={{ background:"#78350f", color:"#fde68a" }}>ห้ามโพส</span>
                          )}
                        </td>
                        <td style={{ color:"#94a3b8", fontSize:"0.78rem" }}>
                          {isBanned(u)
                            ? formatBanDate(u.bannedUntil)
                            : isPostBanned(u)
                            ? formatBanDate(u.postBannedUntil)
                            : "—"}
                        </td>
                        <td style={{ color:"#94a3b8", fontSize:"0.78rem", maxWidth:180 }}>
                          {u.banReason || "—"}
                        </td>
                        <td>
                          <button
                            className="adm-btn ghost sm"
                            style={{ borderColor:"#22c55e", color:"#22c55e" }}
                            onClick={() => submitUnban(u.id)}
                          >
                            ✓ ยกเลิกแบน
                          </button>
                        </td>
                      </>
                    )}
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

      {/* Ban modal */}
      {banModal && (
        <div className="adm-overlay" onClick={() => { setBanModal(null); setBanError(""); }}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth:420 }}>
            <div className="adm-modal-title">🚫 แบน @{banModal.username}</div>
            <div className="adm-modal-body" style={{ display:"flex", flexDirection:"column", gap:18 }}>

              {/* ประเภท */}
              <div>
                <div style={{ fontSize:"0.8rem", color:"#94a3b8", marginBottom:8, fontWeight:600 }}>ประเภทการแบน</div>
                <div style={{ display:"flex", gap:8 }}>
                  <button
                    type="button"
                    className={`adm-btn sm ${banModal.banType === "banAccount" ? "primary" : "ghost"}`}
                    onClick={() => setBanModal(m => m && ({ ...m, banType: "banAccount" }))}
                  >
                    🔒 แบนบัญชี
                  </button>
                  <button
                    type="button"
                    className={`adm-btn sm ${banModal.banType === "banPost" ? "primary" : "ghost"}`}
                    onClick={() => setBanModal(m => m && ({ ...m, banType: "banPost" }))}
                  >
                    ✏️ ห้ามโพส
                  </button>
                </div>
                <div style={{ fontSize:"0.75rem", color:"#64748b", marginTop:6 }}>
                  {banModal.banType === "banAccount"
                    ? "ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้จนกว่าจะหมดอายุ"
                    : "ผู้ใช้ยังเข้าสู่ระบบได้ แต่ไม่สามารถสร้างเนื้อหาใหม่ได้"}
                </div>
              </div>

              {/* ระยะเวลา */}
              <div>
                <div style={{ fontSize:"0.8rem", color:"#94a3b8", marginBottom:8, fontWeight:600 }}>ระยะเวลา</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {DURATIONS.map(d => (
                    <button
                      key={d.value}
                      type="button"
                      className={`adm-btn sm ${banModal.duration === d.value ? "primary" : "ghost"}`}
                      onClick={() => setBanModal(m => m && ({ ...m, duration: d.value }))}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* เหตุผล */}
              <div>
                <div style={{ fontSize:"0.8rem", color:"#94a3b8", marginBottom:8, fontWeight:600 }}>
                  เหตุผล <span style={{ color:"#ef4444" }}>*</span>
                </div>
                <input
                  className="adm-input"
                  style={{ width:"100%", boxSizing:"border-box" }}
                  placeholder="ระบุเหตุผลในการแบน..."
                  value={banModal.reason}
                  onChange={e => setBanModal(m => m && ({ ...m, reason: e.target.value }))}
                  maxLength={200}
                  autoFocus
                />
              </div>

              {banError && (
                <div style={{ color:"#fca5a5", fontSize:"0.82rem" }}>⚠️ {banError}</div>
              )}
            </div>
            <div className="adm-modal-actions">
              <button className="adm-btn ghost" onClick={() => { setBanModal(null); setBanError(""); }}>ยกเลิก</button>
              <button
                className="adm-btn"
                style={{ background:"#7f1d1d", color:"#fca5a5", border:"1px solid #991b1b" }}
                onClick={submitBan}
              >
                ยืนยันแบน
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

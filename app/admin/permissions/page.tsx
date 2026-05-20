"use client";
import { useEffect, useState, useCallback } from "react";

const ROLES = ["TRAVELER","BUSINESS","ADMIN","SUPERADMIN"];
const roleColor = (r: string) => {
  if (r === "SUPERADMIN") return "purple";
  if (r === "ADMIN")      return "blue";
  if (r === "BUSINESS")   return "amber";
  return "gray";
};

export default function AdminPermissionsPage() {
  const [admins, setAdmins]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAll]    = useState<any[]>([]);
  const [q, setQ]             = useState("");
  const [searching, setSrch]  = useState(false);
  const [confirm, setConfirm] = useState<{ userId: string; username: string; curRole: string; newRole: string } | null>(null);
  const [msg, setMsg]         = useState("");

  const loadAdmins = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/permissions")
      .then(r => r.json())
      .then(d => setAdmins(d.admins || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAdmins(); }, [loadAdmins]);

  const searchUsers = () => {
    if (!q.trim()) return;
    setSrch(true);
    fetch(`/api/admin/users?q=${encodeURIComponent(q)}&limit=10`)
      .then(r => r.json())
      .then(d => setAll(d.users || []))
      .finally(() => setSrch(false));
  };

  const changeRole = async () => {
    if (!confirm) return;
    const res = await fetch("/api/admin/permissions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: confirm.userId, role: confirm.newRole }),
    });
    const d = await res.json();
    if (res.ok) {
      setMsg(`✅ เปลี่ยน @${confirm.username} เป็น ${confirm.newRole} แล้ว`);
      setConfirm(null); loadAdmins();
      setTimeout(() => setMsg(""), 4000);
    } else {
      setMsg(`❌ ${d.message}`);
      setTimeout(() => setMsg(""), 4000);
    }
  };

  return (
    <>
      <div className="adm-topbar">
        <div className="adm-topbar-title">🔑 จัดการสิทธิ์ (Superadmin)</div>
        <div className="adm-topbar-right">
          {msg && <span style={{ fontSize:"0.8rem", fontWeight:600, color: msg.startsWith("✅") ? "#43e97b" : "#fca5a5" }}>{msg}</span>}
        </div>
      </div>

      <div className="adm-content">
        {/* Current admins */}
        <div className="adm-card" style={{ marginBottom:24 }}>
          <div className="adm-card-head"><span className="adm-card-title">⚡ แอดมินและ Superadmin ปัจจุบัน</span></div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>ผู้ใช้</th><th>อีเมล</th><th>Role</th><th>สมัครเมื่อ</th><th>เปลี่ยน Role</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="adm-empty">⏳ กำลังโหลด...</td></tr>
                ) : admins.length === 0 ? (
                  <tr><td colSpan={5} className="adm-empty">ไม่พบแอดมิน</td></tr>
                ) : admins.map(u => (
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
                    <td style={{ color:"#64748b", fontSize:"0.75rem" }}>{new Date(u.createdAt).toLocaleDateString("th-TH")}</td>
                    <td>
                      <div style={{ display:"flex", gap:6 }}>
                        {ROLES.filter(r => r !== u.role).map(r => (
                          <button key={r}
                            className={`adm-btn sm ${r==="SUPERADMIN"?"amber":r==="ADMIN"?"primary":r==="BUSINESS"?"ghost":"ghost"}`}
                            onClick={() => setConfirm({ userId: u.id, username: u.username, curRole: u.role, newRole: r })}>
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
        </div>

        {/* Promote a user */}
        <div className="adm-card">
          <div className="adm-card-head">
            <span className="adm-card-title">🔍 ค้นหาผู้ใช้เพื่อเปลี่ยน Role</span>
          </div>
          <div className="adm-card-body">
            <div style={{ display:"flex", gap:10, marginBottom:16 }}>
              <input className="adm-input" placeholder="ค้นหา username / อีเมล..." value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") searchUsers(); }}
                style={{ flex:1 }}
              />
              <button className="adm-btn primary" onClick={searchUsers} disabled={searching}>
                {searching ? "กำลังค้นหา..." : "ค้นหา"}
              </button>
            </div>

            {allUsers.length > 0 && (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr><th>ผู้ใช้</th><th>Role ปัจจุบัน</th><th>เปลี่ยนเป็น</th></tr>
                  </thead>
                  <tbody>
                    {allUsers.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div className="adm-user-cell">
                            {u.avatarUrl
                              ? <img src={u.avatarUrl} className="adm-avatar" alt="" />
                              : <div className="adm-avatar" style={{display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b"}}>👤</div>
                            }
                            <div>
                              <div className="adm-uname">{u.displayName || u.firstName}</div>
                              <div className="adm-uemail">@{u.username} · {u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className={`adm-pill ${roleColor(u.role)}`}>{u.role}</span></td>
                        <td>
                          <div style={{ display:"flex", gap:6 }}>
                            {ROLES.filter(r => r !== u.role).map(r => (
                              <button key={r}
                                className={`adm-btn sm ${r==="SUPERADMIN"?"amber":r==="ADMIN"?"primary":"ghost"}`}
                                onClick={() => setConfirm({ userId: u.id, username: u.username, curRole: u.role, newRole: r })}>
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
            )}
          </div>
        </div>
      </div>

      {confirm && (
        <div className="adm-overlay" onClick={() => setConfirm(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-title">🔄 ยืนยันเปลี่ยน Role</div>
            <div className="adm-modal-body">
              เปลี่ยน <strong style={{color:"#e2e8f0"}}>@{confirm.username}</strong> จาก <span className={`adm-pill ${roleColor(confirm.curRole)}`}>{confirm.curRole}</span> เป็น <span className={`adm-pill ${roleColor(confirm.newRole)}`}>{confirm.newRole}</span>?
              {(confirm.newRole === "ADMIN" || confirm.newRole === "SUPERADMIN") && (
                <div style={{ marginTop:12, padding:"10px 14px", background:"#451a03", borderRadius:8, color:"#fbbf24", fontSize:"0.8rem" }}>
                  ⚠️ การให้สิทธิ์ระดับสูงควรตรวจสอบให้แน่ใจก่อนดำเนินการ
                </div>
              )}
            </div>
            <div className="adm-modal-actions">
              <button className="adm-btn ghost" onClick={() => setConfirm(null)}>ยกเลิก</button>
              <button className={`adm-btn ${confirm.newRole==="SUPERADMIN"?"amber":"primary"}`} onClick={changeRole}>ยืนยัน</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

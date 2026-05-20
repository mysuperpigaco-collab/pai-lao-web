"use client";
import { useEffect, useState, useCallback } from "react";

const ACTION_COLORS: Record<string, string> = {
  DELETE_TRIP:    "adm-action-delete",
  DELETE_PLACE:   "adm-action-delete",
  CHANGE_ROLE:    "adm-action-role",
  VERIFY_PLACE:   "adm-action-verify",
  UNVERIFY_PLACE: "adm-action-verify",
  PUBLISH_TRIP:   "adm-action-publish",
  UNPUBLISH_TRIP: "adm-action-publish",
  RESOLVE_REPORT: "adm-action-report",
  DISMISS_REPORT: "adm-action-report",
};

export default function AdminLogsPage() {
  const [logs, setLogs]       = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [action, setAction]   = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ action, page: String(page), limit: "30" });
    fetch(`/api/admin/logs?${params}`)
      .then(r => r.json())
      .then(d => { setLogs(d.logs || []); setTotal(d.total || 0); setPages(d.pages || 1); })
      .finally(() => setLoading(false));
  }, [action, page]);

  useEffect(() => { load(); }, [load]);

  const actions = [
    "","DELETE_TRIP","DELETE_PLACE","CHANGE_ROLE",
    "VERIFY_PLACE","UNVERIFY_PLACE","PUBLISH_TRIP","UNPUBLISH_TRIP",
    "RESOLVE_REPORT","DISMISS_REPORT",
  ];

  return (
    <>
      <div className="adm-topbar">
        <div className="adm-topbar-title">📋 บันทึกการทำงานระบบ (Superadmin)</div>
        <div className="adm-topbar-right">
          <span style={{ color:"#64748b", fontSize:"0.8rem" }}>ทั้งหมด {total.toLocaleString()} รายการ</span>
        </div>
      </div>

      <div className="adm-content">
        <div className="adm-card">
          <div className="adm-card-head">
            <div className="adm-filters">
              <select className="adm-select" value={action} onChange={e => { setAction(e.target.value); setPage(1); }}>
                <option value="">ทุก Action</option>
                {actions.filter(a => a).map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>แอดมิน</th>
                  <th>Action</th>
                  <th>ประเภทเป้าหมาย</th>
                  <th>รายละเอียด</th>
                  <th>Target ID</th>
                  <th>วันที่-เวลา</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="adm-empty">⏳ กำลังโหลด...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={6} className="adm-empty">ยังไม่มีบันทึก</td></tr>
                ) : logs.map(l => (
                  <tr key={l.id}>
                    <td>
                      {l.admin ? (
                        <div className="adm-user-cell">
                          {l.admin.avatarUrl
                            ? <img src={l.admin.avatarUrl} className="adm-avatar" alt="" />
                            : <div className="adm-avatar" style={{display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b"}}>👤</div>
                          }
                          <div>
                            <div className="adm-uname">{l.admin.displayName || l.admin.firstName}</div>
                            <div className="adm-uemail">@{l.admin.username}</div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color:"#475569", fontSize:"0.75rem" }}>{l.adminId.slice(0,8)}…</span>
                      )}
                    </td>
                    <td>
                      <span className={`adm-action-pill ${ACTION_COLORS[l.action] || "adm-action-default"}`}>
                        {l.action}
                      </span>
                    </td>
                    <td style={{ color:"#94a3b8", fontSize:"0.78rem" }}>{l.targetType || "—"}</td>
                    <td style={{ color:"#64748b", fontSize:"0.78rem", maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {l.detail || "—"}
                    </td>
                    <td style={{ color:"#475569", fontSize:"0.7rem", fontFamily:"monospace" }}>
                      {l.targetId ? l.targetId.slice(0,8)+"…" : "—"}
                    </td>
                    <td style={{ color:"#64748b", fontSize:"0.75rem", whiteSpace:"nowrap" }}>
                      {new Date(l.createdAt).toLocaleString("th-TH")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="adm-pagination">
              <button className="adm-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                const p = page <= 4 ? i + 1 : page - 3 + i;
                if (p < 1 || p > pages) return null;
                return <button key={p} className={`adm-page-btn${page === p ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>;
              })}
              <button className="adm-page-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

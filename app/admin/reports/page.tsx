"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const TARGET_TYPES = ["","REVIEW","REPLY","TRIP","PLACE","USER"];
const REASONS = ["SPAM","INAPPROPRIATE","FAKE","HARASSMENT","OTHER"];
const REASON_LABELS: Record<string,string> = {
  SPAM:"สแปม",INAPPROPRIATE:"เนื้อหาไม่เหมาะสม",FAKE:"ข้อมูลเท็จ",HARASSMENT:"คุกคาม",OTHER:"อื่นๆ"
};
const STATUS_COLORS: Record<string,string> = { PENDING:"red", REVIEWED:"green", DISMISSED:"gray" };

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [status, setStatus]   = useState("PENDING");
  const [targetType, setTargetType] = useState("");
  const [loading, setLoading] = useState(false);
  const [detail, setDetail]   = useState<any | null>(null);
  const [msg, setMsg]         = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ status, targetType, page: String(page), limit: "20" });
    fetch(`/api/admin/reports?${params}`)
      .then(r => r.json())
      .then(d => { setReports(d.reports || []); setTotal(d.total || 0); setPages(d.pages || 1); })
      .finally(() => setLoading(false));
  }, [status, targetType, page]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (reportId: string, action: "REVIEWED" | "DISMISSED") => {
    const res = await fetch("/api/admin/reports", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, action }),
    });
    const d = await res.json();
    setMsg(action === "REVIEWED" ? "✅ ดำเนินการแล้ว" : "🚫 ยกเลิกแล้ว");
    setDetail(null);
    load();
    setTimeout(() => setMsg(""), 3000);
  };

  const getContentUrl = (r: any): string | null => {
    if (!r.targetSlug) return null;
    if (r.targetType === "TRIP")    return `/trips/${r.targetSlug}`;
    if (r.targetType === "PLACE")   return `/place/${r.targetSlug}`;
    if (r.targetType === "REVIEW")  return r.targetSlug ? (r.targetTitle ? `/trips/${r.targetSlug}` : `/place/${r.targetSlug}`) : null;
    return null;
  };

  const targetTypeIcon = (t: string) => {
    if (t === "REVIEW")  return "⭐";
    if (t === "REPLY")   return "💬";
    if (t === "TRIP")    return "🗺️";
    if (t === "PLACE")   return "📍";
    if (t === "USER")    return "👤";
    return "❓";
  };

  return (
    <>
      <div className="adm-topbar">
        <div className="adm-topbar-title">🚩 จัดการรายงาน</div>
        <div className="adm-topbar-right">
          <span style={{ color:"#64748b", fontSize:"0.8rem" }}>พบ {total.toLocaleString()} รายการ</span>
          {msg && <span style={{ color:"#43e97b", fontSize:"0.8rem", fontWeight:600 }}>{msg}</span>}
        </div>
      </div>

      <div className="adm-content">
        {/* Status summary tabs */}
        <div style={{ display:"flex", gap:10, marginBottom:20 }}>
          {[
            { val:"PENDING",  label:"⏳ รอดำเนินการ" },
            { val:"REVIEWED", label:"✅ ดำเนินการแล้ว" },
            { val:"DISMISSED",label:"🚫 ยกเลิก" },
            { val:"",         label:"📋 ทั้งหมด" },
          ].map(s => (
            <button
              key={s.val}
              className={`adm-btn ${status === s.val ? "primary" : "ghost"}`}
              onClick={() => { setStatus(s.val); setPage(1); }}
            >{s.label}</button>
          ))}
        </div>

        <div className="adm-card">
          <div className="adm-card-head">
            <div className="adm-filters">
              <select className="adm-select" value={targetType} onChange={e => { setTargetType(e.target.value); setPage(1); }}>
                <option value="">ทุกประเภท</option>
                {TARGET_TYPES.filter(t => t).map(t => <option key={t} value={t}>{targetTypeIcon(t)} {t}</option>)}
              </select>
            </div>
          </div>

          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>ประเภท</th>
                  <th>เหตุผล</th>
                  <th>รายละเอียด</th>
                  <th>ผู้รายงาน</th>
                  <th>สถานะ</th>
                  <th>วันที่</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="adm-empty">⏳ กำลังโหลด...</td></tr>
                ) : reports.length === 0 ? (
                  <tr><td colSpan={7} className="adm-empty">ไม่พบรายงาน 🎉</td></tr>
                ) : reports.map(r => (
                  <tr key={r.id}>
                    <td>
                      <span className="adm-pill cyan">{targetTypeIcon(r.targetType)} {r.targetType}</span>
                    </td>
                    <td>
                      <span className="adm-pill red">{REASON_LABELS[r.reason] || r.reason}</span>
                    </td>
                    <td style={{ color:"#94a3b8", fontSize:"0.78rem", maxWidth:200 }}>
                      {r.detail
                        ? <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"block" }}>{r.detail}</span>
                        : <span style={{ color:"#475569" }}>—</span>
                      }
                    </td>
                    <td>
                      <div className="adm-user-cell">
                        {r.reporter.avatarUrl
                          ? <img src={r.reporter.avatarUrl} className="adm-avatar" alt="" style={{width:26,height:26}} />
                          : <div style={{width:26,height:26,borderRadius:"50%",background:"#334155",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.65rem",color:"#64748b"}}>👤</div>
                        }
                        <div>
                          <div style={{ fontSize:"0.78rem", color:"#e2e8f0" }}>{r.reporter.displayName || r.reporter.username}</div>
                          <div style={{ fontSize:"0.68rem", color:"#64748b" }}>@{r.reporter.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`adm-pill ${STATUS_COLORS[r.status] || "gray"}`}>{r.status}</span>
                    </td>
                    <td style={{ color:"#64748b", fontSize:"0.75rem", whiteSpace:"nowrap" }}>
                      {new Date(r.createdAt).toLocaleDateString("th-TH")}
                    </td>
                    <td>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        <button className="adm-btn ghost sm" onClick={() => setDetail(r)}>🔍 ดู</button>
                        {getContentUrl(r) && (
                          <Link href={getContentUrl(r)!} target="_blank" className="adm-btn ghost sm" style={{ color:"#4facfe" }}>
                            🔗 เปิด
                          </Link>
                        )}
                        {r.status === "PENDING" && (
                          <>
                            <button className="adm-btn success sm" onClick={() => handleAction(r.id, "REVIEWED")}>✅ ดำเนินการ</button>
                            <button className="adm-btn ghost sm" onClick={() => handleAction(r.id, "DISMISSED")}>🚫 ยกเลิก</button>
                          </>
                        )}
                      </div>
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

      {/* Detail modal */}
      {detail && (
        <div className="adm-overlay" onClick={() => setDetail(null)}>
          <div className="adm-modal" style={{ maxWidth:480 }} onClick={e => e.stopPropagation()}>
            <div className="adm-modal-title">🔍 รายละเอียดรายงาน</div>
            <div className="adm-modal-body">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 20px", marginBottom:12 }}>
                <div><span style={{color:"#64748b",fontSize:"0.72rem"}}>ประเภทเป้าหมาย</span><br /><span style={{color:"#e2e8f0",fontWeight:600}}>{targetTypeIcon(detail.targetType)} {detail.targetType}</span></div>
                <div>
                  <span style={{color:"#64748b",fontSize:"0.72rem"}}>เนื้อหาที่ถูกรายงาน</span><br />
                  {getContentUrl(detail) ? (
                    <Link href={getContentUrl(detail)!} target="_blank"
                      style={{ color:"#4facfe", fontWeight:600, fontSize:"0.82rem", textDecoration:"none" }}>
                      🔗 {detail.targetTitle || detail.targetType} ↗
                    </Link>
                  ) : (
                    <span style={{color:"#94a3b8",fontSize:"0.72rem",wordBreak:"break-all"}}>{detail.targetId}</span>
                  )}
                </div>
                <div><span style={{color:"#64748b",fontSize:"0.72rem"}}>เหตุผล</span><br /><span style={{color:"#fca5a5",fontWeight:600}}>{REASON_LABELS[detail.reason] || detail.reason}</span></div>
                <div><span style={{color:"#64748b",fontSize:"0.72rem"}}>สถานะ</span><br /><span className={`adm-pill ${STATUS_COLORS[detail.status]}`}>{detail.status}</span></div>
                <div><span style={{color:"#64748b",fontSize:"0.72rem"}}>ผู้รายงาน</span><br /><span style={{color:"#e2e8f0"}}>@{detail.reporter.username}</span></div>
                <div><span style={{color:"#64748b",fontSize:"0.72rem"}}>วันที่</span><br /><span style={{color:"#94a3b8"}}>{new Date(detail.createdAt).toLocaleString("th-TH")}</span></div>
              </div>
              {detail.detail && (
                <div style={{ background:"#0f172a", borderRadius:8, padding:"12px 14px", fontSize:"0.82rem", color:"#cbd5e1", lineHeight:1.6 }}>
                  <div style={{ color:"#64748b", fontSize:"0.7rem", marginBottom:4 }}>รายละเอียดเพิ่มเติม:</div>
                  {detail.detail}
                </div>
              )}
            </div>
            <div className="adm-modal-actions">
              <button className="adm-btn ghost" onClick={() => setDetail(null)}>ปิด</button>
              {detail.status === "PENDING" && (
                <>
                  <button className="adm-btn ghost" onClick={() => handleAction(detail.id, "DISMISSED")}>🚫 ยกเลิก</button>
                  <button className="adm-btn success" onClick={() => handleAction(detail.id, "REVIEWED")}>✅ ดำเนินการแล้ว</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

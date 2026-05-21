"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

/* ─── Constants ──────────────────────────────────────────── */
const TARGET_TYPES = ["","REVIEW","REPLY","TRIP","PLACE","USER"];
const REASON_LABELS: Record<string,string> = {
  SPAM:"สแปม", INAPPROPRIATE:"เนื้อหาไม่เหมาะสม",
  FAKE:"ข้อมูลเท็จ", HARASSMENT:"คุกคาม", OTHER:"อื่นๆ",
};
const STATUS_COLORS: Record<string,string> = { PENDING:"red", REVIEWED:"green", DISMISSED:"gray" };
const STATUS_LABELS: Record<string,string> = { PENDING:"⏳ รอดำเนินการ", REVIEWED:"✅ ดำเนินการแล้ว", DISMISSED:"🚫 ยกเลิก" };

const DURATION_OPTS = [
  { value: 1,    label: "1 วัน" },
  { value: 3,    label: "3 วัน" },
  { value: 7,    label: "7 วัน" },
  { value: 14,   label: "14 วัน" },
  { value: 30,   label: "30 วัน" },
  { value: 90,   label: "90 วัน" },
  { value: null, label: "ถาวร" },
];

/* ─── Enforcement Modal ──────────────────────────────────── */
function EnforcementModal({ report, onClose, onDone }: {
  report: any; onClose: () => void; onDone: (msg: string) => void;
}) {
  const [removeContent, setRemoveContent] = useState(false);
  const [punishment, setPunishment] = useState<"NONE"|"WARN"|"POST_BAN"|"ACCOUNT_BAN">("NONE");
  const [duration, setDuration] = useState<number|null>(7);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const canRemove = ["REVIEW","REPLY","TRIP","PLACE"].includes(report.targetType);
  const canPunish = !!report.reportedUserId;
  const hasBan = punishment === "POST_BAN" || punishment === "ACCOUNT_BAN";

  async function submit() {
    setLoading(true);
    const res = await fetch("/api/admin/reports", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportId: report.id,
        removeContent: removeContent && canRemove,
        punishment,
        duration: hasBan ? duration : undefined,
        note,
      }),
    });
    const d = await res.json();
    setLoading(false);
    if (res.ok) onDone(`✅ ดำเนินการแล้ว: ${d.actions?.join(", ") || "บันทึกสำเร็จ"}`);
    else onDone(`❌ ${d.message}`);
  }

  async function dismiss() {
    setLoading(true);
    const res = await fetch("/api/admin/reports", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: report.id, dismiss: true, note }),
    });
    setLoading(false);
    onDone(res.ok ? "🚫 ยกเลิกรายงานแล้ว" : "❌ เกิดข้อผิดพลาด");
  }

  const punishOpts = [
    { value:"NONE",        icon:"🔍", label:"ตรวจสอบแล้ว",          desc:"บันทึกว่าดำเนินการแล้ว ไม่มีโทษเพิ่มเติม" },
    { value:"WARN",        icon:"⚠️", label:"คำเตือน (Warn)",        desc:"ส่งคำเตือนให้ผู้ใช้ บันทึกในระบบ" },
    { value:"POST_BAN",    icon:"🔇", label:"ห้ามโพส (Mute)",        desc:"ระงับการสร้างเนื้อหา/รีวิว ตามระยะเวลา" },
    { value:"ACCOUNT_BAN", icon:"🚫", label:"ระงับบัญชี (Suspend)",  desc:"ผู้ใช้ไม่สามารถเข้าสู่ระบบได้ ตามระยะเวลา" },
  ];

  // current ban status
  const now = new Date();
  const postBanned = report.reportedUser?.postBannedUntil && new Date(report.reportedUser.postBannedUntil) > now;
  const accBanned  = report.reportedUser?.bannedUntil     && new Date(report.reportedUser.bannedUntil) > now;

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal" style={{ maxWidth:560, width:"100%" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ marginBottom:20 }}>
          <div className="adm-modal-title" style={{ fontSize:"1.1rem" }}>⚖️ บังคับใช้มาตรการ</div>
          <div style={{ fontSize:"0.8rem", color:"#64748b", marginTop:4 }}>
            รายงาน: <strong style={{ color:"#f1f5f9" }}>{REASON_LABELS[report.reason] || report.reason}</strong>
            {" "}· {report.targetType}
            {report.targetTitle && <> · <span style={{ color:"#4facfe" }}>{report.targetTitle}</span></>}
          </div>
        </div>

        {/* Reported user info */}
        {report.reportedUser && (
          <div style={{
            background:"#0f172a", borderRadius:10, padding:"12px 14px", marginBottom:16,
            display:"flex", alignItems:"center", gap:10,
          }}>
            <div style={{
              width:36, height:36, borderRadius:"50%", flexShrink:0,
              background: report.reportedUser.avatarUrl ? "transparent" : "#334155",
              overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"0.8rem", color:"#64748b",
            }}>
              {report.reportedUser.avatarUrl
                ? <img src={report.reportedUser.avatarUrl} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />
                : "👤"}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ color:"#f1f5f9", fontWeight:600, fontSize:"0.85rem" }}>
                {report.reportedUser.displayName || report.reportedUser.username}
                <span style={{ color:"#64748b", fontWeight:400 }}> @{report.reportedUser.username}</span>
              </div>
              <div style={{ display:"flex", gap:8, marginTop:3, flexWrap:"wrap" }}>
                {postBanned && <span style={{ fontSize:"0.68rem", color:"#f59e0b", background:"#451a0333", padding:"1px 6px", borderRadius:4 }}>🔇 ถูกห้ามโพสอยู่</span>}
                {accBanned  && <span style={{ fontSize:"0.68rem", color:"#ef4444", background:"#450a0a33", padding:"1px 6px", borderRadius:4 }}>🚫 ถูกระงับบัญชีอยู่</span>}
                {!postBanned && !accBanned && <span style={{ fontSize:"0.68rem", color:"#22c55e" }}>ปกติ</span>}
              </div>
            </div>
          </div>
        )}

        {/* Reported content preview */}
        {report.reportedContent && (
          <div style={{
            background:"#0f172a", borderRadius:10, padding:"10px 14px", marginBottom:16,
            borderLeft:"3px solid #ef4444",
          }}>
            <div style={{ fontSize:"0.68rem", color:"#64748b", marginBottom:4 }}>
              📋 เนื้อหาที่ถูกรายงาน
              {report.reportedContentType && <span style={{ marginLeft:6, background:"#1e293b", color:"#94a3b8", padding:"1px 6px", borderRadius:4 }}>{report.reportedContentType}</span>}
            </div>
            <div style={{ fontSize:"0.8rem", color:"#e2e8f0", lineHeight:1.6, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
              {report.reportedContent.slice(0, 300)}{report.reportedContent.length > 300 ? "…" : ""}
            </div>
          </div>
        )}

        {/* Step 1: Remove content */}
        {canRemove && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:"0.75rem", fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>
              1. เนื้อหา
            </div>
            <label style={{
              display:"flex", alignItems:"center", gap:10, cursor:"pointer",
              background: removeContent ? "#450a0a" : "#1e293b",
              border: `1px solid ${removeContent ? "#ef4444" : "#334155"}`,
              borderRadius:10, padding:"12px 14px", transition:"all 0.15s",
            }}>
              <input type="checkbox" checked={removeContent} onChange={e => setRemoveContent(e.target.checked)}
                style={{ width:16, height:16, accentColor:"#ef4444" }} />
              <div>
                <div style={{ color:"#f1f5f9", fontWeight:600, fontSize:"0.85rem" }}>🗑️ ลบเนื้อหาที่ถูกรายงาน</div>
                <div style={{ color:"#64748b", fontSize:"0.75rem" }}>ลบ {report.targetType} นี้ออกจากระบบ (ไม่สามารถกู้คืนได้)</div>
              </div>
            </label>
          </div>
        )}

        {/* Step 2: Punishment */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:"0.75rem", fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>
            {canRemove ? "2." : "1."} โทษสำหรับผู้ใช้
            {!canPunish && <span style={{ color:"#475569", fontWeight:400, marginLeft:6 }}>(ไม่สามารถระบุผู้ใช้ได้)</span>}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {punishOpts.map(opt => (
              <label key={opt.value} style={{
                display:"flex", alignItems:"flex-start", gap:10, cursor: canPunish ? "pointer" : "not-allowed",
                background: punishment === opt.value ? "#162032" : "#1e293b",
                border: `1px solid ${punishment === opt.value ? "#4facfe" : "#334155"}`,
                borderRadius:10, padding:"10px 12px", transition:"all 0.15s",
                opacity: canPunish ? 1 : 0.4,
              }}>
                <input type="radio" name="punishment" value={opt.value}
                  checked={punishment === opt.value}
                  disabled={!canPunish}
                  onChange={() => setPunishment(opt.value as any)}
                  style={{ marginTop:2, accentColor:"#4facfe" }} />
                <div>
                  <div style={{ color:"#f1f5f9", fontWeight:600, fontSize:"0.82rem" }}>{opt.icon} {opt.label}</div>
                  <div style={{ color:"#64748b", fontSize:"0.7rem", marginTop:2 }}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Duration selector */}
          {hasBan && (
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:"0.72rem", color:"#64748b", marginBottom:6 }}>ระยะเวลา:</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {DURATION_OPTS.map(opt => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => setDuration(opt.value)}
                    style={{
                      padding:"5px 12px", borderRadius:8, cursor:"pointer",
                      fontSize:"0.78rem", fontWeight:700, transition:"all 0.15s",
                      background: duration === opt.value
                        ? (opt.value === null ? "#7f1d1d" : "#1e3a5f")
                        : "#1e293b",
                      color: duration === opt.value
                        ? (opt.value === null ? "#fca5a5" : "#93c5fd")
                        : "#64748b",
                      outline: "none",
                      boxShadow: `inset 0 0 0 1px ${duration === opt.value ? (opt.value === null ? "#ef4444" : "#4facfe") : "#334155"}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Note */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:"0.75rem", fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>
            หมายเหตุ (ไม่บังคับ)
          </div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="เหตุผลหรือรายละเอียดเพิ่มเติม..."
            rows={2}
            style={{
              width:"100%", boxSizing:"border-box", background:"#0f172a",
              border:"1px solid #334155", borderRadius:8, padding:"8px 12px",
              color:"#f1f5f9", fontSize:"0.82rem", fontFamily:"inherit",
              resize:"none", outline:"none",
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", flexWrap:"wrap" }}>
          <button className="adm-btn ghost" onClick={onClose} disabled={loading}>ยกเลิก</button>
          <button className="adm-btn ghost" onClick={dismiss} disabled={loading}
            style={{ color:"#94a3b8" }}>🚫 ยกเลิกรายงาน</button>
          <button className="adm-btn primary" onClick={submit} disabled={loading}
            style={{ minWidth:140 }}>
            {loading ? "⏳ กำลังดำเนินการ..." : "⚖️ ยืนยันมาตรการ"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function AdminReportsPage() {
  const [reports, setReports]   = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [status, setStatus]     = useState("PENDING");
  const [targetType, setTargetType] = useState("");
  const [loading, setLoading]   = useState(false);
  const [enforce, setEnforce]   = useState<any|null>(null);
  const [detail, setDetail]     = useState<any|null>(null);
  const [msg, setMsg]           = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ status, targetType, page: String(page), limit: "20" });
    fetch(`/api/admin/reports?${params}`)
      .then(r => r.json())
      .then(d => { setReports(d.reports || []); setTotal(d.total || 0); setPages(d.pages || 1); })
      .finally(() => setLoading(false));
  }, [status, targetType, page]);

  useEffect(() => { load(); }, [load]);

  function showMsg(m: string) {
    setMsg(m); setTimeout(() => setMsg(""), 4000);
  }

  function handleDone(m: string) {
    setEnforce(null); setDetail(null);
    showMsg(m); load();
  }

  const getContentUrl = (r: any): string | null => {
    if (!r.targetSlug) return null;
    if (r.targetType === "TRIP")  return `/trips/${r.targetSlug}`;
    if (r.targetType === "PLACE") return `/place/${r.targetSlug}`;
    if (r.targetType === "REVIEW" || r.targetType === "REPLY") return r.targetSlug ? `/trips/${r.targetSlug}` : null;
    return null;
  };

  const typeIcon = (t: string) =>
    ({ REVIEW:"⭐", REPLY:"💬", TRIP:"🗺️", PLACE:"📍", USER:"👤" } as Record<string,string>)[t] ?? "❓";

  return (
    <>
      <div className="adm-topbar">
        <div className="adm-topbar-title">🚩 จัดการรายงาน</div>
        <div className="adm-topbar-right">
          <span style={{ color:"#64748b", fontSize:"0.8rem" }}>พบ {total.toLocaleString()} รายการ</span>
          {msg && <span style={{ fontWeight:600, fontSize:"0.82rem",
            color: msg.startsWith("✅") ? "#22c55e" : msg.startsWith("🚫") ? "#94a3b8" : "#ef4444" }}>{msg}</span>}
        </div>
      </div>

      <div className="adm-content">
        {/* Tabs */}
        <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
          {Object.entries({ PENDING:"⏳ รอดำเนินการ", REVIEWED:"✅ ดำเนินการแล้ว", DISMISSED:"🚫 ยกเลิก", "":"📋 ทั้งหมด" }).map(([val, label]) => (
            <button key={val} className={`adm-btn ${status === val ? "primary" : "ghost"}`}
              onClick={() => { setStatus(val); setPage(1); }}>{label}</button>
          ))}
        </div>

        <div className="adm-card">
          <div className="adm-card-head">
            <div className="adm-filters">
              <select className="adm-select" value={targetType} onChange={e => { setTargetType(e.target.value); setPage(1); }}>
                <option value="">ทุกประเภท</option>
                {TARGET_TYPES.filter(t => t).map(t => <option key={t} value={t}>{typeIcon(t)} {t}</option>)}
              </select>
            </div>
          </div>

          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>ประเภท</th>
                  <th>เหตุผล</th>
                  <th>เนื้อหา / ผู้ถูกรายงาน</th>
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
                  <tr><td colSpan={7} className="adm-empty">🎉 ไม่มีรายงานในสถานะนี้</td></tr>
                ) : reports.map(r => {
                  const url = getContentUrl(r);
                  const now = new Date();
                  const isBanned = r.reportedUser?.bannedUntil && new Date(r.reportedUser.bannedUntil) > now;
                  const isPostBanned = r.reportedUser?.postBannedUntil && new Date(r.reportedUser.postBannedUntil) > now;
                  return (
                    <tr key={r.id}>
                      <td><span className="adm-pill cyan">{typeIcon(r.targetType)} {r.targetType}</span></td>
                      <td><span className="adm-pill red">{REASON_LABELS[r.reason] || r.reason}</span></td>
                      <td>
                        <div style={{ maxWidth:220 }}>
                          {url ? (
                            <Link href={url} target="_blank" style={{ color:"#4facfe", fontSize:"0.78rem", textDecoration:"none", display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              🔗 {r.targetTitle || r.targetType}
                            </Link>
                          ) : <span style={{ color:"#475569", fontSize:"0.75rem" }}>—</span>}
                          {r.reportedContent && (
                            <div style={{
                              marginTop:4, padding:"5px 8px",
                              background:"#1e293b", borderLeft:"2px solid #475569",
                              borderRadius:"0 6px 6px 0", fontSize:"0.68rem",
                              color:"#94a3b8", lineHeight:1.4,
                              overflow:"hidden", display:"-webkit-box",
                              WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any,
                              maxHeight:48,
                            }}>
                              {r.reportedContent.slice(0, 120)}{r.reportedContent.length > 120 ? "…" : ""}
                            </div>
                          )}
                          {r.reportedUser && (
                            <div style={{ fontSize:"0.68rem", color:"#64748b", marginTop:3, display:"flex", gap:4, alignItems:"center" }}>
                              <span style={{ color:"#94a3b8" }}>เจ้าของ:</span>
                              <span>{r.reportedUser.displayName || r.reportedUser.username}</span>
                              <span>@{r.reportedUser.username}</span>
                              {isBanned    && <span style={{ color:"#ef4444" }}>🚫</span>}
                              {isPostBanned && <span style={{ color:"#f59e0b" }}>🔇</span>}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize:"0.78rem", color:"#e2e8f0" }}>{r.reporter.displayName || r.reporter.username}</div>
                        <div style={{ fontSize:"0.68rem", color:"#64748b" }}>@{r.reporter.username}</div>
                      </td>
                      <td><span className={`adm-pill ${STATUS_COLORS[r.status] || "gray"}`}>{STATUS_LABELS[r.status] || r.status}</span></td>
                      <td style={{ color:"#64748b", fontSize:"0.75rem", whiteSpace:"nowrap" }}>
                        {new Date(r.createdAt).toLocaleDateString("th-TH")}
                      </td>
                      <td>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          <button className="adm-btn ghost sm" onClick={() => setDetail(r)}>🔍 ดู</button>
                          {r.status === "PENDING" && (
                            <button className="adm-btn amber sm" onClick={() => setEnforce(r)}>⚖️ จัดการ</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
      {detail && !enforce && (
        <div className="adm-overlay" onClick={() => setDetail(null)}>
          <div className="adm-modal" style={{ maxWidth:500 }} onClick={e => e.stopPropagation()}>
            <div className="adm-modal-title">🔍 รายละเอียดรายงาน</div>
            <div className="adm-modal-body">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 20px", marginBottom:14 }}>
                <div>
                  <div style={{ color:"#64748b", fontSize:"0.72rem" }}>ประเภท</div>
                  <span style={{ color:"#e2e8f0", fontWeight:600 }}>{typeIcon(detail.targetType)} {detail.targetType}</span>
                </div>
                <div>
                  <div style={{ color:"#64748b", fontSize:"0.72rem" }}>เนื้อหาที่ถูกรายงาน</div>
                  {getContentUrl(detail) ? (
                    <Link href={getContentUrl(detail)!} target="_blank"
                      style={{ color:"#4facfe", fontWeight:600, fontSize:"0.82rem", textDecoration:"none" }}>
                      🔗 {detail.targetTitle || detail.targetType} ↗
                    </Link>
                  ) : <span style={{ color:"#94a3b8", fontSize:"0.75rem" }}>{detail.targetId}</span>}
                </div>
                <div>
                  <div style={{ color:"#64748b", fontSize:"0.72rem" }}>เหตุผล</div>
                  <span style={{ color:"#fca5a5", fontWeight:600 }}>{REASON_LABELS[detail.reason] || detail.reason}</span>
                </div>
                <div>
                  <div style={{ color:"#64748b", fontSize:"0.72rem" }}>สถานะ</div>
                  <span className={`adm-pill ${STATUS_COLORS[detail.status]}`}>{STATUS_LABELS[detail.status] || detail.status}</span>
                </div>
                {detail.reportedUser && (
                  <div style={{ gridColumn:"1/-1" }}>
                    <div style={{ color:"#64748b", fontSize:"0.72rem", marginBottom:4 }}>ผู้ถูกรายงาน</div>
                    <span style={{ color:"#e2e8f0" }}>@{detail.reportedUser.username}</span>
                    {detail.reportedUser.bannedUntil && new Date(detail.reportedUser.bannedUntil) > new Date() &&
                      <span style={{ marginLeft:8, fontSize:"0.72rem", color:"#ef4444" }}>🚫 ถูกระงับบัญชีอยู่</span>}
                    {detail.reportedUser.postBannedUntil && new Date(detail.reportedUser.postBannedUntil) > new Date() &&
                      <span style={{ marginLeft:8, fontSize:"0.72rem", color:"#f59e0b" }}>🔇 ถูกห้ามโพสอยู่</span>}
                  </div>
                )}
              </div>
              {/* Reported content quote */}
              {detail.reportedContent && (
                <div style={{ background:"#0f172a", borderRadius:8, padding:"12px 14px", marginBottom:12 }}>
                  <div style={{ color:"#64748b", fontSize:"0.7rem", marginBottom:6, display:"flex", alignItems:"center", gap:6 }}>
                    📋 เนื้อหาที่ถูกรายงาน
                    {detail.reportedContentType && (
                      <span style={{ background:"#1e293b", color:"#94a3b8", padding:"1px 7px", borderRadius:4, fontSize:"0.65rem" }}>
                        {detail.reportedContentType}
                      </span>
                    )}
                  </div>
                  <div style={{
                    borderLeft:"3px solid #ef4444", paddingLeft:10,
                    fontSize:"0.82rem", color:"#e2e8f0", lineHeight:1.7,
                    whiteSpace:"pre-wrap", wordBreak:"break-word",
                  }}>
                    {detail.reportedContent}
                  </div>
                </div>
              )}
              {detail.detail && (
                <div style={{ background:"#0f172a", borderRadius:8, padding:"10px 14px", fontSize:"0.82rem", color:"#cbd5e1", lineHeight:1.6 }}>
                  <div style={{ color:"#64748b", fontSize:"0.7rem", marginBottom:4 }}>รายละเอียดจากผู้รายงาน:</div>
                  {detail.detail}
                </div>
              )}
            </div>
            <div className="adm-modal-actions">
              <button className="adm-btn ghost" onClick={() => setDetail(null)}>ปิด</button>
              {detail.status === "PENDING" && (
                <button className="adm-btn amber" onClick={() => setEnforce(detail)}>⚖️ จัดการ</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enforcement modal */}
      {enforce && (
        <EnforcementModal
          report={enforce}
          onClose={() => setEnforce(null)}
          onDone={handleDone}
        />
      )}
    </>
  );
}

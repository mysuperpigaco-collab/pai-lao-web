"use client";
import { useState } from "react";

const REPORT_TYPES = [
  { value: "SPAM",          label: "สแปม · Spam" },
  { value: "INAPPROPRIATE", label: "เนื้อหาไม่เหมาะสม · Inappropriate" },
  { value: "FAKE",          label: "ข้อมูลเท็จ · Fake/Misleading" },
  { value: "HARASSMENT",    label: "การคุกคาม · Harassment" },
  { value: "OTHER",         label: "อื่นๆ · Other" },
];

interface Props {
  targetId: string;
  targetType: "TRIP" | "PLACE" | "REVIEW" | "REPLY" | "USER";
  currentUserId?: string | null;   // ผู้ใช้ที่ login อยู่
  ownerId?: string | null;         // เจ้าของเนื้อหา — ถ้าตรงกับ currentUserId ไม่แสดงปุ่ม
  label?: string;                  // ข้อความปุ่ม
  compact?: boolean;               // แสดงแค่ icon
}

export default function ReportButton({
  targetId, targetType, currentUserId, ownerId, label, compact = false,
}: Props) {
  const [open, setOpen]         = useState(false);
  const [reason, setReason]     = useState("SPAM");
  const [detail, setDetail]     = useState("");
  const [submitting, setSubmit] = useState(false);
  const [done, setDone]         = useState(false);

  // ไม่แสดงถ้าไม่ได้ login หรือเป็นเจ้าของตัวเอง
  if (!currentUserId) return null;
  if (ownerId && currentUserId === ownerId) return null;

  async function handleSubmit() {
    setSubmit(true);
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, targetType, reason, detail }),
      });
      setDone(true);
    } catch {}
    setSubmit(false);
  }

  function handleClose() {
    setOpen(false);
    setTimeout(() => { setDone(false); setReason("SPAM"); setDetail(""); }, 300);
  }

  const btnLabel = label ?? (
    targetType === "TRIP"  ? "🚩 รายงานทริปนี้" :
    targetType === "PLACE" ? "🚩 รายงานสถานที่นี้" :
    "🚩 รายงาน"
  );

  return (
    <>
      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex", alignItems: "center", gap: compact ? 0 : 5,
          background: "none", border: "1.5px solid #fecdd3", borderRadius: 10,
          padding: compact ? "6px 8px" : "7px 14px",
          color: "#f43f5e", fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "#fff1f2";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#f43f5e";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "none";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#fecdd3";
        }}
      >
        {compact ? "🚩" : btnLabel}
      </button>

      {/* ── Modal ── */}
      {open && (
        <div
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:9999,
            display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
          onClick={handleClose}
        >
          <div
            style={{ background:"#fff", borderRadius:20, padding:28, width:"100%", maxWidth:440,
              boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}
            onClick={e => e.stopPropagation()}
          >
            {done ? (
              <div style={{ textAlign:"center", padding:"20px 0" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
                <h3 style={{ fontWeight:800, color:"#0f172a", margin:"0 0 8px" }}>ส่งรายงานแล้ว</h3>
                <p style={{ color:"#64748b", fontSize:14, margin:"0 0 20px" }}>
                  ขอบคุณที่แจ้งเรา ทีมงานจะตรวจสอบโดยเร็วที่สุด
                </p>
                <button onClick={handleClose} style={{
                  padding:"10px 28px", borderRadius:12, border:"none",
                  background:"#0f172a", color:"#fff", fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                }}>ปิด</button>
              </div>
            ) : (
              <>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                  <h3 style={{ fontWeight:800, fontSize:16, color:"#0f172a", margin:0 }}>
                    🚩 รายงานเนื้อหา · Report
                  </h3>
                  <button onClick={handleClose} style={{
                    background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#94a3b8", lineHeight:1,
                  }}>×</button>
                </div>

                {/* Type label */}
                <div style={{ marginBottom:14, padding:"8px 12px", background:"#f8fafc",
                  borderRadius:10, fontSize:12, color:"#64748b", fontWeight:600 }}>
                  ประเภท: <span style={{ color:"#374151" }}>
                    {targetType === "TRIP" ? "🗺️ ทริป" :
                     targetType === "PLACE" ? "📍 สถานที่" :
                     targetType === "REVIEW" ? "⭐ รีวิว" :
                     targetType === "REPLY" ? "💬 ความคิดเห็น" : targetType}
                  </span>
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                  {REPORT_TYPES.map(rt => (
                    <label key={rt.value} style={{
                      display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:12,
                      background: reason === rt.value ? "#fff0f0" : "#f8fafc",
                      border: `1.5px solid ${reason === rt.value ? "#fca5a5" : "#e2e8f0"}`,
                      cursor:"pointer", transition:"all 0.15s",
                    }}>
                      <input type="radio" name="report-reason" value={rt.value}
                        checked={reason === rt.value} onChange={() => setReason(rt.value)}
                        style={{ accentColor:"#e11d48" }} />
                      <span style={{ fontSize:13, fontWeight: reason === rt.value ? 700 : 500,
                        color: reason === rt.value ? "#be123c" : "#374151" }}>
                        {rt.label}
                      </span>
                    </label>
                  ))}
                </div>

                <textarea
                  value={detail}
                  onChange={e => setDetail(e.target.value)}
                  placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)..."
                  rows={3}
                  style={{ width:"100%", borderRadius:10, border:"1.5px solid #e2e8f0",
                    padding:"10px 12px", fontSize:13, resize:"none", fontFamily:"inherit",
                    boxSizing:"border-box", marginBottom:16, outline:"none" }}
                />

                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={handleClose} style={{
                    flex:1, padding:"10px", borderRadius:12, border:"1.5px solid #e2e8f0",
                    background:"#fff", color:"#475569", fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                  }}>ยกเลิก</button>
                  <button onClick={handleSubmit} disabled={submitting} style={{
                    flex:1, padding:"10px", borderRadius:12, border:"none",
                    background:"#e11d48", color:"#fff", fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                    opacity: submitting ? 0.7 : 1,
                  }}>
                    {submitting ? "⏳ กำลังส่ง..." : "🚩 ส่งรายงาน"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

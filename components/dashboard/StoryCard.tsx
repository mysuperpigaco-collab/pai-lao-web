"use client";

import Link from "next/link";
import { useState } from "react";

interface TripItem {
  slug:            string;
  title:           string;
  coverUrl?:       string | null;
  createdAt:       string;
  isPublished?:    boolean;
  approvalStatus?: string; // PENDING | APPROVED | REJECTED | null (draft)
  hasPendingEdit?: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

export default function StoryCard({
  story,
  isOwner,
  onDeleted,
}: {
  story:      TripItem;
  isOwner:    boolean;
  onDeleted?: (slug: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirm,  setConfirm ] = useState(false);

  const published   = story.isPublished === true;
  const pendingEdit = story.hasPendingEdit === true;
  const imgSrc    = story.coverUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800";

  const handleDelete = async () => {
    if (!confirm) { setConfirm(true); return; }
    setDeleting(true);
    try {
      const res = await fetch(`/api/trips/${story.slug}`, { method: "DELETE" });
      if (res.ok) { onDeleted?.(story.slug); }
      else { const d = await res.json(); alert(d.message || "ลบไม่สำเร็จ"); setDeleting(false); setConfirm(false); }
    } catch { alert("ไม่สามารถเชื่อมต่อระบบได้"); setDeleting(false); setConfirm(false); }
  };

  return (
    <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 2px 12px rgba(15,23,42,0.05)", opacity: deleting ? 0.5 : 1, transition: "box-shadow 0.2s, transform 0.2s", display: "flex", flexDirection: "column" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 10px 28px rgba(15,23,42,0.1)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(15,23,42,0.05)"; }}
    >
      {/* Cover */}
      <div style={{ position: "relative", height: "170px", overflow: "hidden", background: "#f1f5f9", flexShrink: 0 }}>
        <img src={imgSrc} alt={story.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
        {/* Status badge */}
        <span style={{
          position: "absolute", top: "10px", right: "10px",
          display: "inline-flex", alignItems: "center", gap: "5px",
          padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700,
          background: pendingEdit ? "#fffbeb" : published || story.approvalStatus === "APPROVED" ? "#dcfce7" : story.approvalStatus === "PENDING" ? "#eff6ff" : story.approvalStatus === "REJECTED" ? "#fef2f2" : "#f1f5f9",
          color:      pendingEdit ? "#92400e" : published || story.approvalStatus === "APPROVED" ? "#15803d" : story.approvalStatus === "PENDING" ? "#1d4ed8" : story.approvalStatus === "REJECTED" ? "#b91c1c" : "#475569",
          backdropFilter: "blur(4px)",
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: pendingEdit ? "#f59e0b" : published || story.approvalStatus === "APPROVED" ? "#22c55e" : story.approvalStatus === "PENDING" ? "#3b82f6" : story.approvalStatus === "REJECTED" ? "#ef4444" : "#94a3b8", flexShrink: 0 }} />
          {pendingEdit ? "รออนุมัติการแก้ไข · Pending" : published || story.approvalStatus === "APPROVED" ? "เผยแพร่แล้ว · Published" : story.approvalStatus === "PENDING" ? "รออนุมัติ · Pending" : story.approvalStatus === "REJECTED" ? "ถูกปฏิเสธ · Rejected" : "ฉบับร่าง · Draft"}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b", margin: 0, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>
          {story.title}
        </h4>
        <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>📅 {formatDate(story.createdAt)}</p>
      </div>

      {/* Action row */}
      <div style={{ padding: "0 12px 14px", display: "flex", flexDirection: "column", gap: "6px" }}>
        {/* Normal actions */}
        {!confirm && (
          <div style={{ display: "grid", gridTemplateColumns: isOwner ? "1fr 1fr 1fr" : "1fr", gap: "6px" }}>
            <Link href={`/trips/${story.slug}`} style={btnStyle("view")}>
              <IconEye />
              <span style={labelStyle}><span style={{ fontSize: "12px", fontWeight: 700 }}>ดู</span><span style={{ fontSize: "9px", opacity: 0.7 }}>View</span></span>
            </Link>
            {isOwner && (
              <Link href={`/trips/${story.slug}/edit`} style={btnStyle("edit")}>
                <IconEdit />
                <span style={labelStyle}><span style={{ fontSize: "12px", fontWeight: 700 }}>แก้ไข</span><span style={{ fontSize: "9px", opacity: 0.7 }}>Edit</span></span>
              </Link>
            )}
            {isOwner && (
              <button onClick={handleDelete} style={{ ...btnStyle("del"), cursor: "pointer", fontFamily: "inherit" }}>
                <IconTrash />
                <span style={labelStyle}><span style={{ fontSize: "12px", fontWeight: 700 }}>ลบ</span><span style={{ fontSize: "9px", opacity: 0.7 }}>Delete</span></span>
              </button>
            )}
          </div>
        )}

        {/* Confirm delete row */}
        {confirm && isOwner && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            <button onClick={handleDelete} disabled={deleting} style={{
              padding: "10px", borderRadius: "10px", border: "none",
              background: "#dc2626", color: "#fff", fontSize: "12px", fontWeight: 800,
              cursor: deleting ? "wait" : "pointer", fontFamily: "inherit",
            }}>
              {deleting ? "⏳ กำลังลบ..." : "🗑 ยืนยันลบ"}
            </button>
            <button onClick={() => setConfirm(false)} style={{
              padding: "10px", borderRadius: "10px", border: "1.5px solid #e2e8f0",
              background: "#f8fafc", color: "#64748b", fontSize: "12px", fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              ยกเลิก
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared button styles ─────────────────────────────────────────────────────
const BASE_BTN: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  gap: "4px", padding: "9px 4px", borderRadius: "10px",
  textDecoration: "none", border: "1.5px solid", textAlign: "center",
  transition: "background 0.15s",
};
const VARIANT = {
  view: { background: "#f8fafc", borderColor: "#e2e8f0", color: "#475569" },
  edit: { background: "#eff6ff", borderColor: "#dbeafe", color: "#2563eb" },
  del:  { background: "#fff8f8", borderColor: "#fecaca", color: "#dc2626" },
};
function btnStyle(variant: "view" | "edit" | "del"): React.CSSProperties {
  return { ...BASE_BTN, ...VARIANT[variant] };
}
const labelStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "1px", lineHeight: 1,
};

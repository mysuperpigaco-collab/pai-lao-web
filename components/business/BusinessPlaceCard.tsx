"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  slug: string;
  title: string;
  province: string;
  district: string;
  coverUrl: string;
  category: string;
  avgRating?: number | null;
  isVerified?: boolean;
  reviewCount?: number;
  bookmarkCount?: number;
  onDeleted?: (slug: string) => void;
  approvalStatus?: string;
  rejectionReason?: string | null;
  claimStatus?: string | null;
  claimNote?: string | null;
};

const CAT_ICON: Record<string, string> = {
  NATURE:"🌿", CAFE:"☕", ACCOMMODATION:"🏨", CAMPING:"⛺",
  FOOD:"🍲", TEMPLE:"🛕", BEACH:"🏖️", MARKET:"🛍️", ADVENTURE:"🧗", MUSEUM:"🏛️",
};

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

const BASE_BTN: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  gap: "4px", padding: "9px 4px", borderRadius: "10px",
  textDecoration: "none", border: "1.5px solid", textAlign: "center",
  transition: "background 0.15s", cursor: "pointer", fontFamily: "inherit",
};
const VARIANT = {
  view: { background: "#f8fafc", borderColor: "#e2e8f0", color: "#475569" },
  edit: { background: "#eff6ff", borderColor: "#dbeafe", color: "#2563eb" },
  del:  { background: "#fff8f8", borderColor: "#fecaca", color: "#dc2626" },
};
function btnStyle(v: "view" | "edit" | "del"): React.CSSProperties {
  return { ...BASE_BTN, ...VARIANT[v] };
}
const labelStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "1px", lineHeight: 1,
};

export default function BusinessPlaceCard({
  slug, title, province, district, coverUrl,
  category, avgRating, isVerified, reviewCount, bookmarkCount, onDeleted,
  approvalStatus = "APPROVED", rejectionReason,
  claimStatus, claimNote,
}: Props) {
  const icon = CAT_ICON[category] ?? "📍";
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm) { setConfirm(true); return; }
    setDeleting(true);
    try {
      const res = await fetch(`/api/places/${slug}`, { method: "DELETE" });
      if (res.ok) onDeleted?.(slug);
      else { alert("ไม่สามารถลบได้"); setDeleting(false); setConfirm(false); }
    } catch {
      alert("เกิดข้อผิดพลาด"); setDeleting(false); setConfirm(false);
    }
  }

  return (
    <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 2px 12px rgba(15,23,42,0.05)", display: "flex", flexDirection: "column", opacity: deleting ? 0.5 : 1, transition: "box-shadow 0.2s, transform 0.2s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 10px 28px rgba(15,23,42,0.1)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(15,23,42,0.05)"; }}
    >
      {/* Cover */}
      <div style={{ position: "relative", height: 180, overflow: "hidden", background: "#e2e8f0", flexShrink: 0 }}>
        {coverUrl
          ? <img src={coverUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, background: "linear-gradient(135deg,#f0fdf4,#ecfeff)" }}>{icon}</div>
        }
        <span style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(15,23,42,0.65)", backdropFilter: "blur(6px)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999 }}>
          {icon} {category}
        </span>
        {isVerified && (
          <span style={{ position: "absolute", top: 10, right: 10, background: "#dcfce7", color: "#15803d", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 999, border: "1px solid #bbf7d0" }}>
            ✓ Verified
          </span>
        )}
        {/* Claim status badge (แสดงแทน approval badge เมื่อเป็น claim place) */}
        {claimStatus === "PENDING" && (
          <span style={{ position: "absolute", top: isVerified ? 36 : 10, right: 10, background: "#eff6ff", color: "#1d4ed8", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 999, border: "1px solid #bfdbfe" }}>
            ⏳ รอยืนยันความเป็นเจ้าของ
          </span>
        )}
        {claimStatus === "REJECTED" && (
          <span style={{ position: "absolute", top: isVerified ? 36 : 10, right: 10, background: "#fee2e2", color: "#991b1b", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 999, border: "1px solid #fecaca" }}>
            ✗ คำขอถูกปฏิเสธ
          </span>
        )}
        {/* Approval status badge (แสดงเฉพาะสถานที่ที่เป็นเจ้าของแล้ว ไม่ใช่ claim) */}
        {!claimStatus && approvalStatus === "PENDING" && (
          <span style={{ position: "absolute", top: isVerified ? 36 : 10, right: 10, background: "#fef9c3", color: "#854d0e", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 999, border: "1px solid #fde68a" }}>
            ⏳ รอตรวจสอบ
          </span>
        )}
        {!claimStatus && approvalStatus === "APPROVED" && (
          <span style={{ position: "absolute", top: isVerified ? 36 : 10, right: 10, background: "#dcfce7", color: "#15803d", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 999, border: "1px solid #bbf7d0" }}>
            ✓ อนุมัติแล้ว
          </span>
        )}
        {!claimStatus && approvalStatus === "REJECTED" && (
          <span style={{ position: "absolute", top: isVerified ? 36 : 10, right: 10, background: "#fee2e2", color: "#991b1b", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 999, border: "1px solid #fecaca" }}>
            ✗ ไม่อนุมัติ
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px 4px", flex: 1 }}>
        <h4 style={{ fontSize: 14, fontWeight: 800, color: "#1e293b", margin: "0 0 4px", lineHeight: 1.4 }}>{title}</h4>
        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px" }}>📍 {province} · {district}</p>
        {claimStatus === "PENDING" && (
          <p style={{ fontSize: 11, color: "#1d4ed8", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "5px 8px", margin: "0 0 8px" }}>
            📋 คำขอยืนยันความเป็นเจ้าของกำลังรอแอดมินอนุมัติ
          </p>
        )}
        {claimStatus === "REJECTED" && (
          <p style={{ fontSize: 11, color: "#dc2626", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 6, padding: "5px 8px", margin: "0 0 8px" }}>
            ❌ {claimNote ? `เหตุผล: ${claimNote}` : "คำขอถูกปฏิเสธ"}
          </p>
        )}
        {!claimStatus && approvalStatus === "REJECTED" && rejectionReason && (
          <p style={{ fontSize: 11, color: "#dc2626", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 6, padding: "5px 8px", margin: "0 0 8px" }}>
            ❌ เหตุผล: {rejectionReason}
          </p>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {avgRating != null && avgRating > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b" }}>{"★".repeat(Math.round(avgRating))} {avgRating.toFixed(1)}</span>
          )}
          {reviewCount != null && reviewCount > 0 && (
            <span style={{ fontSize: 11, color: "#94a3b8" }}>💬 {reviewCount}</span>
          )}
          {bookmarkCount != null && bookmarkCount > 0 && (
            <span style={{ fontSize: 11, color: "#94a3b8" }}>🔖 {bookmarkCount}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "10px 12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Claim place — แค่ดูสถานที่ได้ ยังแก้ไข/ลบไม่ได้ */}
        {claimStatus ? (
          <Link href={`/place/${slug}`} style={{ ...btnStyle("view"), flexDirection: "row", justifyContent: "center", gap: 6, padding: "10px" }}>
            <IconEye />
            <span style={{ fontSize: 12, fontWeight: 700 }}>ดูสถานที่</span>
          </Link>
        ) : !confirm ? (
          <div style={{ display: "grid", gridTemplateColumns: onDeleted ? "1fr 1fr 1fr" : "1fr 1fr", gap: 6 }}>
            <Link href={`/place/${slug}`} style={btnStyle("view")}>
              <IconEye />
              <span style={labelStyle}><span style={{ fontSize: 12, fontWeight: 700 }}>ดู</span><span style={{ fontSize: 9, opacity: 0.7 }}>View</span></span>
            </Link>
            <Link href={`/business/places/${slug}/edit`} style={btnStyle("edit")}>
              <IconEdit />
              <span style={labelStyle}><span style={{ fontSize: 12, fontWeight: 700 }}>แก้ไข</span><span style={{ fontSize: 9, opacity: 0.7 }}>Edit</span></span>
            </Link>
            {onDeleted && (
              <button onClick={handleDelete} style={{ ...btnStyle("del"), border: "1.5px solid #fecaca" }}>
                <IconTrash />
                <span style={labelStyle}><span style={{ fontSize: 12, fontWeight: 700 }}>ถอน</span><span style={{ fontSize: 9, opacity: 0.7 }}>Unclaim</span></span>
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <p style={{ fontSize: 11, color: "#64748b", margin: 0, textAlign: "center", padding: "4px 0" }}>
              สถานที่จะยังอยู่ในระบบ แต่คุณจะไม่ใช่เจ้าของอีกต่อไป
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <button onClick={handleDelete} disabled={deleting} style={{ padding: 10, borderRadius: 10, border: "none", background: "#dc2626", color: "#fff", fontSize: 12, fontWeight: 800, cursor: deleting ? "wait" : "pointer", fontFamily: "inherit" }}>
                {deleting ? "⏳ กำลังถอน..." : "✓ ยืนยันถอน"}
              </button>
              <button onClick={() => setConfirm(false)} style={{ padding: 10, borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                ยกเลิก
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

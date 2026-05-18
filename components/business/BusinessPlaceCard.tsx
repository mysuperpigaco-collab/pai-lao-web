"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  slug:         string;
  title:        string;
  province:     string;
  district?:    string;
  coverUrl:     string;
  category?:    string;
  avgRating?:   number | null;
  isVerified?:  boolean;
  reviewCount?: number;
  bookmarkCount?: number;
  onDeleted?:   (slug: string) => void;
};

const STATUS_MAP = {
  verified:   { text: "ยืนยันแล้ว · Verified", bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  pending:    { text: "รอตรวจสอบ · Pending",   bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
};

const CATEGORY_ICON: Record<string, string> = {
  "ธรรมชาติ":"🌿","คาเฟ่":"☕","ที่พัก":"🏨","แคมปิ้ง":"⛺","อาหาร":"🍲",
  "วัด / ศาสนสถาน":"🛕","ชายหาด":"🏖️","ตลาด / ช้อปปิ้ง":"🛍️",
  "กีฬา / ผจญภัย":"🧗","พิพิธภัณฑ์ / ประวัติศาสตร์":"🏛️",
};

export default function BusinessPlaceCard({
  slug, title, province, district, coverUrl,
  category = "สถานที่ท่องเที่ยว",
  avgRating, isVerified = false,
  reviewCount = 0, bookmarkCount = 0,
  onDeleted,
}: Props) {
  const [deleting, setDeleting] = useState(false);
  const st = STATUS_MAP[isVerified ? "verified" : "pending"];
  const icon = CATEGORY_ICON[category] ?? "📍";

  const handleDelete = async () => {
    if (!confirm(`ลบ "${title}" ออกจากระบบใช่ไหม? · Delete this place?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/places/${slug}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted?.(slug);
      } else {
        const data = await res.json();
        alert(data.message || "ลบไม่สำเร็จ");
        setDeleting(false);
      }
    } catch {
      alert("ไม่สามารถเชื่อมต่อระบบได้");
      setDeleting(false);
    }
  };

  const card: React.CSSProperties = {
    background: "#ffffff", borderRadius: "28px", overflow: "hidden",
    border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(15,23,42,0.05)",
    display: "flex", flexDirection: "column", opacity: deleting ? 0.5 : 1, transition: "opacity 0.2s",
  };

  const btnView: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
    flex: 1, padding: "11px 10px", borderRadius: "12px",
    background: "#eff6ff", color: "#2563eb", textDecoration: "none",
    fontSize: "13px", fontWeight: 800, border: "none", cursor: "pointer", whiteSpace: "nowrap" as const,
  };

  const btnEdit: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
    flex: 1, padding: "11px 10px", borderRadius: "12px",
    background: "linear-gradient(135deg, #4facfe 0%, #43e97b 100%)",
    color: "#ffffff", textDecoration: "none", fontSize: "13px", fontWeight: 800,
    border: "none", cursor: "pointer", whiteSpace: "nowrap" as const,
    boxShadow: "0 4px 12px rgba(79,172,254,0.22)",
  };

  const btnDel: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: "44px", flexShrink: 0, padding: "11px 0", borderRadius: "12px",
    background: "#fff5f5", color: "#dc2626", fontSize: "16px",
    border: "1px solid #fecaca", cursor: deleting ? "not-allowed" : "pointer",
  };

  return (
    <div style={card}>
      {/* ── Image ── */}
      <div style={{ position: "relative", height: "220px", overflow: "hidden", flexShrink: 0 }}>
        <img
          src={coverUrl || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800"}
          alt={title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          loading="lazy"
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,23,42,0.65), transparent 55%)" }} />

        {/* Category pill */}
        <span style={{ position: "absolute", bottom: "14px", left: "14px", background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", color: "#ffffff", padding: "5px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: 800, border: "1px solid rgba(255,255,255,0.25)" }}>
          {icon} {category}
        </span>

        {/* Status badge */}
        <span style={{ position: "absolute", top: "14px", right: "14px", display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 12px", borderRadius: "999px", background: st.bg, color: st.color, fontSize: "11px", fontWeight: 800, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: st.dot, flexShrink: 0 }} />
          {st.text}
        </span>

        {/* Rating badge */}
        {avgRating != null && (
          <span style={{ position: "absolute", top: "14px", left: "14px", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", color: "#f59e0b", padding: "5px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 800 }}>
            ⭐ {avgRating}
          </span>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "20px 22px 14px", flex: 1 }}>
        <h3 style={{ fontSize: "19px", fontWeight: 900, color: "#0f172a", margin: "0 0 5px", lineHeight: 1.3 }}>
          {title}
        </h3>
        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px" }}>
          📍 {district ? `${district}, ` : ""}{province}
        </p>

        {/* Stats */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 14px", background: "#f8fafc", borderRadius: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", flex: 1 }}>
            <strong style={{ fontSize: "17px", fontWeight: 900, color: "#0f172a" }}>{reviewCount.toLocaleString()}</strong>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Reviews</span>
          </div>
          <div style={{ width: "1px", height: "28px", background: "#e2e8f0" }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", flex: 1 }}>
            <strong style={{ fontSize: "17px", fontWeight: 900, color: "#0f172a" }}>{bookmarkCount.toLocaleString()}</strong>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Bookmarks</span>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div style={{ display: "flex", gap: "8px", padding: "12px 22px 22px" }}>
        <Link href={`/place/${slug}`} style={btnView}>👁 ดูหน้าเพจ</Link>
        <Link href={`/business/places/${slug}/edit`} style={btnEdit}>✏️ แก้ไข</Link>
        <button style={btnDel} title="ลบสถานที่" onClick={handleDelete} disabled={deleting}>
          {deleting ? "⏳" : "🗑"}
        </button>
      </div>
    </div>
  );
}

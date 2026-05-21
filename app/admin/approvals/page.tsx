"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

/* ─── Types ─────────────────────────────────────────────── */
interface TripItem {
  id: string; slug: string; title: string; coverUrl: string;
  mood: string; location: string | null; createdAt: string;
  approvalStatus: string; rejectionReason: string | null;
  author: { id: string; username: string; displayName: string | null; firstName: string; avatarUrl: string | null };
  _count: { likes: number; reviews: number; bookmarks: number };
}

/* ─── Helpers ────────────────────────────────────────────── */
const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:  { label: "⏳ รอตรวจสอบ", color: "#f59e0b", bg: "#451a03" },
  APPROVED: { label: "✅ อนุมัติ",    color: "#22c55e", bg: "#052e16" },
  REJECTED: { label: "❌ ปฏิเสธ",    color: "#ef4444", bg: "#450a0a" },
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/* ─── Modal ──────────────────────────────────────────────── */
function RejectModal({ trip, onClose, onConfirm }: {
  trip: TripItem; onClose: () => void; onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="adm-modal-backdrop">
      <div className="adm-modal" style={{ maxWidth: 440 }}>
        <div className="adm-modal-title">❌ ปฏิเสธทริป</div>
        <div className="adm-modal-body">
          <strong style={{ color: "#f1f5f9" }}>"{trip.title}"</strong> จะถูกปฏิเสธ<br />
          กรุณาระบุเหตุผล (แสดงให้เจ้าของทริปเห็น)
        </div>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="เช่น เนื้อหาไม่เหมาะสม, ข้อมูลไม่ครบถ้วน..."
          rows={3}
          style={{
            width: "100%", boxSizing: "border-box",
            background: "#0f172a", border: "1px solid #334155", borderRadius: 8,
            padding: "8px 12px", color: "#f1f5f9", fontSize: "0.82rem",
            fontFamily: "inherit", resize: "none", marginBottom: 16, outline: "none",
          }}
        />
        <div className="adm-modal-actions">
          <button className="adm-btn ghost" onClick={onClose}>ยกเลิก</button>
          <button className="adm-btn danger" onClick={() => onConfirm(reason)}>ยืนยันปฏิเสธ</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Trip Preview Card ──────────────────────────────────── */
function TripCard({ trip, onApprove, onReject }: {
  trip: TripItem;
  onApprove: (id: string) => void;
  onReject: (trip: TripItem) => void;
}) {
  const meta = STATUS_META[trip.approvalStatus] ?? STATUS_META.PENDING;
  const authorName = trip.author.displayName || trip.author.firstName;

  return (
    <div style={{
      background: "#1e293b", border: "1px solid #334155", borderRadius: 14,
      overflow: "hidden", display: "flex", flexDirection: "column",
    }}>
      {/* Cover */}
      <div style={{ position: "relative", height: 180, flexShrink: 0 }}>
        <img src={trip.coverUrl} alt={trip.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, transparent 40%, rgba(15,23,42,0.95))",
        }} />
        {/* Status badge */}
        <span style={{
          position: "absolute", top: 10, right: 10,
          background: meta.bg, color: meta.color,
          borderRadius: 99, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700,
          border: `1px solid ${meta.color}44`,
        }}>
          {meta.label}
        </span>
        {/* Title */}
        <div style={{ position: "absolute", bottom: 10, left: 12, right: 12 }}>
          <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: "0.95rem", lineHeight: 1.3 }}>
            {trip.title}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 2 }}>
            {trip.mood}{trip.location ? ` · ${trip.location}` : ""}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Author */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
            background: trip.author.avatarUrl ? "transparent" : "linear-gradient(135deg,#2563eb,#4facfe)",
            overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.7rem", fontWeight: 800, color: "#fff",
          }}>
            {trip.author.avatarUrl
              ? <img src={trip.author.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : authorName[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "#cbd5e1", fontWeight: 600 }}>{authorName}</div>
            <div style={{ fontSize: "0.68rem", color: "#64748b" }}>@{trip.author.username} · {fmt(trip.createdAt)}</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 12, fontSize: "0.72rem", color: "#64748b" }}>
          <span>❤️ {trip._count.likes}</span>
          <span>⭐ {trip._count.reviews}</span>
          <span>🔖 {trip._count.bookmarks}</span>
        </div>

        {/* Rejection reason */}
        {trip.approvalStatus === "REJECTED" && trip.rejectionReason && (
          <div style={{
            background: "#450a0a", border: "1px solid #991b1b", borderRadius: 8,
            padding: "8px 10px", fontSize: "0.75rem", color: "#fca5a5",
          }}>
            <strong>เหตุผล:</strong> {trip.rejectionReason}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 4 }}>
          <Link href={`/trips/${trip.slug}`} target="_blank"
            className="adm-btn ghost sm" style={{ flex: 1, justifyContent: "center" }}>
            👁️ ดูทริป
          </Link>
          {trip.approvalStatus === "PENDING" && (
            <>
              <button className="adm-btn success sm" style={{ flex: 1 }}
                onClick={() => onApprove(trip.id)}>✅ อนุมัติ</button>
              <button className="adm-btn danger sm" style={{ flex: 1 }}
                onClick={() => onReject(trip)}>❌ ปฏิเสธ</button>
            </>
          )}
          {trip.approvalStatus === "APPROVED" && (
            <button className="adm-btn ghost sm" style={{ flex: 1, color: "#f59e0b" }}
              onClick={() => onReject(trip)}>🔄 ยกเลิกอนุมัติ</button>
          )}
          {trip.approvalStatus === "REJECTED" && (
            <button className="adm-btn success sm" style={{ flex: 1 }}
              onClick={() => onApprove(trip.id)}>🔄 อนุมัติใหม่</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function AdminApprovalsPage() {
  const [trips, setTrips]         = useState<TripItem[]>([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [page, setPage]           = useState(1);
  const [approval, setApproval]   = useState("PENDING");
  const [q, setQ]                 = useState("");
  const [loading, setLoading]     = useState(true);
  const [rejectTrip, setRejectTrip] = useState<TripItem | null>(null);
  const [toast, setToast]         = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const load = useCallback((p = 1, ap = approval, query = q) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "12" });
    if (ap) params.set("approval", ap);
    if (query) params.set("q", query);
    fetch(`/api/admin/trips?${params}`)
      .then(r => r.json())
      .then(d => {
        setTrips(d.trips || []);
        setTotal(d.total || 0);
        setPages(d.pages || 1);
        setPage(p);
        setLoading(false);
      });
  }, [approval, q]);

  // load pending count badge
  useEffect(() => {
    fetch("/api/admin/trips?approval=PENDING&limit=1")
      .then(r => r.json())
      .then(d => setPendingCount(d.total || 0));
  }, []);

  useEffect(() => { load(1, approval, q); }, [approval]);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleApprove(tripId: string) {
    const res = await fetch("/api/admin/trips", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId, action: "approve" }),
    });
    if (res.ok) { showToast("success", "อนุมัติทริปสำเร็จ"); load(page); }
    else showToast("error", "เกิดข้อผิดพลาด");
  }

  async function handleReject(tripId: string, reason: string) {
    const res = await fetch("/api/admin/trips", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId, action: "reject", rejectionReason: reason }),
    });
    setRejectTrip(null);
    if (res.ok) { showToast("success", "ปฏิเสธทริปสำเร็จ"); load(page); }
    else showToast("error", "เกิดข้อผิดพลาด");
  }

  const TABS = [
    { key: "PENDING",  label: "รอตรวจสอบ", color: "#f59e0b" },
    { key: "APPROVED", label: "อนุมัติแล้ว", color: "#22c55e" },
    { key: "REJECTED", label: "ถูกปฏิเสธ",  color: "#ef4444" },
    { key: "",         label: "ทั้งหมด",    color: "#94a3b8" },
  ];

  return (
    <div style={{ padding: "32px 24px 80px" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 24, zIndex: 9999,
          background: toast.type === "success" ? "#166534" : "#991b1b",
          color: "#fff", borderRadius: 10, padding: "10px 18px",
          fontSize: "0.82rem", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}>
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f1f5f9", margin: 0 }}>
            อนุมัติทริป
          </h1>
          {pendingCount > 0 && (
            <span style={{
              background: "#f59e0b", color: "#000", borderRadius: 99,
              padding: "2px 10px", fontSize: "0.75rem", fontWeight: 800,
            }}>
              {pendingCount} รอตรวจสอบ
            </span>
          )}
        </div>
        <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 4 }}>
          ตรวจสอบและอนุมัติทริปก่อนเผยแพร่บนแพลตฟอร์ม
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#1e293b", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setApproval(tab.key); setPage(1); }}
            style={{
              padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: "0.8rem", fontWeight: 700, transition: "all 0.15s",
              background: approval === tab.key ? "#0f172a" : "transparent",
              color: approval === tab.key ? tab.color : "#64748b",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="adm-filters" style={{ marginBottom: 20 }}>
        <input
          className="adm-input"
          placeholder="ค้นหาชื่อทริป, สถานที่, ผู้เขียน..."
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load(1, approval, q)}
        />
        <button className="adm-btn primary" onClick={() => load(1, approval, q)}>ค้นหา</button>
      </div>

      {/* Count */}
      <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: 16 }}>
        ทั้งหมด {total} ทริป
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>กำลังโหลด...</div>
      ) : trips.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
          {approval === "PENDING" ? "🎉 ไม่มีทริปรอตรวจสอบ" : "ไม่พบทริป"}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}>
          {trips.map(trip => (
            <TripCard
              key={trip.id}
              trip={trip}
              onApprove={handleApprove}
              onReject={setRejectTrip}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="adm-pagination" style={{ marginTop: 24 }}>
          <button className="adm-page-btn" disabled={page === 1} onClick={() => load(page - 1)}>‹</button>
          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter(n => Math.abs(n - page) <= 2)
            .map(n => (
              <button
                key={n}
                className={`adm-page-btn${n === page ? " active" : ""}`}
                onClick={() => load(n)}
              >{n}</button>
            ))}
          <button className="adm-page-btn" disabled={page === pages} onClick={() => load(page + 1)}>›</button>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTrip && (
        <RejectModal
          trip={rejectTrip}
          onClose={() => setRejectTrip(null)}
          onConfirm={reason => handleReject(rejectTrip.id, reason)}
        />
      )}
    </div>
  );
}

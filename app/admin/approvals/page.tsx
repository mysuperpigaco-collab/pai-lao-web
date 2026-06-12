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
interface PlaceItem {
  id: string; slug: string; title: string; coverUrl: string;
  province: string; district: string; category: string;
  approvalStatus: string; rejectionReason: string | null; createdAt: string;
  description: string;
  business: { businessName: string; userId: string; user: { username: string; displayName: string | null; avatarUrl: string | null } } | null;
  _count: { reviews: number };
}
interface EditItem {
  id: string; targetType: string; targetId: string; targetTitle: string | null;
  targetSlug: string | null; originalData: Record<string, any>;
  pendingData: Record<string, any>; status: string; createdAt: string;
  submittedBy: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
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

/* ─── Reject Modal ───────────────────────────────────────── */
function RejectModal({ title, onClose, onConfirm }: {
  title: string; onClose: () => void; onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="adm-modal-title">❌ ปฏิเสธ</div>
        <div className="adm-modal-body">
          <p style={{ color: "#94a3b8", marginBottom: 12 }}>เนื้อหา: <strong style={{ color: "#f1f5f9" }}>{title}</strong></p>
          <textarea value={reason} onChange={e => setReason(e.target.value)}
            placeholder="ระบุเหตุผลที่ปฏิเสธ..." rows={3}
            style={{ width: "100%", boxSizing: "border-box", background: "#0f172a", border: "1px solid #334155",
              borderRadius: 8, padding: "8px 12px", color: "#f1f5f9", fontFamily: "inherit", resize: "none", outline: "none" }} />
        </div>
        <div className="adm-modal-actions">
          <button className="adm-btn ghost" onClick={onClose}>ยกเลิก</button>
          <button className="adm-btn" style={{ background: "#dc2626" }} onClick={() => onConfirm(reason || "ไม่ผ่านเกณฑ์การตรวจสอบ")}>
            ❌ ยืนยันปฏิเสธ
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Diff View Component ────────────────────────────────── */
const TRIP_FIELDS: [string, string][] = [
  ["title", "ชื่อทริป"], ["subtitle", "คำโปรย"], ["description", "เนื้อหา"],
  ["mood", "สไตล์ทริป"], ["budget", "งบประมาณ"], ["location", "สถานที่"],
  ["youtubeUrl", "YouTube URL"], ["tiktokUrl", "TikTok URL"],
];
const PLACE_FIELDS: [string, string][] = [
  ["title", "ชื่อสถานที่"], ["titleEn", "ชื่อ EN"], ["description", "คำอธิบาย"],
  ["descriptionShort", "คำอธิบายสั้น"], ["province", "จังหวัด"], ["district", "อำเภอ"],
  ["address", "ที่อยู่"], ["category", "ประเภท"], ["openHours", "เวลาเปิด"],
  ["closedDays", "วันปิด"], ["entryFee", "ค่าเข้าชม"], ["phone", "โทรศัพท์"],
  ["website", "เว็บไซต์"], ["lineId", "Line ID"],
];

function DiffView({ edit }: { edit: EditItem }) {
  const fields = edit.targetType === "TRIP" ? TRIP_FIELDS : PLACE_FIELDS;
  const changed = fields.filter(([key]) => {
    const ov = edit.originalData[key];
    const nv = edit.pendingData[key];
    return nv !== undefined && JSON.stringify(ov) !== JSON.stringify(nv);
  });

  if (changed.length === 0) {
    return (
      <p style={{ color: "#64748b", fontSize: 13, padding: "12px 0" }}>
        ไม่พบการเปลี่ยนแปลงในฟิลด์หลัก (อาจมีการเปลี่ยนรูปภาพ)
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {changed.map(([key, label]) => {
        const oldVal = edit.originalData[key];
        const newVal = edit.pendingData[key];
        const isLong = typeof newVal === "string" && newVal.length > 100;
        return (
          <div key={key} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #334155" }}>
            <div style={{ background: "#1e293b", padding: "6px 12px", fontSize: 11,
              fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {label}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <div style={{ background: "#450a0a22", borderRight: "1px solid #334155", padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, marginBottom: 4 }}>เดิม · OLD</div>
                <div style={{ fontSize: 13, color: "#fca5a5", lineHeight: 1.5,
                  maxHeight: isLong ? 120 : "none", overflow: "hidden",
                  display: isLong ? "-webkit-box" : "block",
                  WebkitLineClamp: isLong ? 5 : undefined,
                  WebkitBoxOrient: isLong ? "vertical" as any : undefined,
                }}>
                  {oldVal != null ? String(oldVal) : <em style={{ color: "#475569" }}>ไม่มีข้อมูล</em>}
                </div>
              </div>
              <div style={{ background: "#05260e22", padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 700, marginBottom: 4 }}>ใหม่ · NEW</div>
                <div style={{ fontSize: 13, color: "#86efac", lineHeight: 1.5,
                  maxHeight: isLong ? 120 : "none", overflow: "hidden",
                  display: isLong ? "-webkit-box" : "block",
                  WebkitLineClamp: isLong ? 5 : undefined,
                  WebkitBoxOrient: isLong ? "vertical" as any : undefined,
                }}>
                  {newVal != null ? String(newVal) : <em style={{ color: "#475569" }}>ไม่มีข้อมูล</em>}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* cover image diff */}
      {edit.pendingData.coverUrl && edit.pendingData.coverUrl !== edit.originalData.coverUrl && (
        <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #334155" }}>
          <div style={{ background: "#1e293b", padding: "6px 12px", fontSize: 11,
            fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>รูปปก · Cover</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ background: "#450a0a22", padding: 12, borderRight: "1px solid #334155" }}>
              <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, marginBottom: 6 }}>เดิม · OLD</div>
              {edit.originalData.coverUrl
                ? <img src={edit.originalData.coverUrl} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8 }} alt="old" />
                : <div style={{ color: "#475569", fontSize: 12 }}>ไม่มีรูป</div>}
            </div>
            <div style={{ background: "#05260e22", padding: 12 }}>
              <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 700, marginBottom: 6 }}>ใหม่ · NEW</div>
              <img src={edit.pendingData.coverUrl} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8 }} alt="new" />
            </div>
          </div>
        </div>
      )}

      {/* tags diff */}
      {edit.pendingData.tags && JSON.stringify(edit.pendingData.tags) !== JSON.stringify(edit.originalData.tags) && (
        <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #334155" }}>
          <div style={{ background: "#1e293b", padding: "6px 12px", fontSize: 11,
            fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>แท็ก · Tags</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ background: "#450a0a22", padding: "10px 12px", borderRight: "1px solid #334155" }}>
              <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, marginBottom: 4 }}>เดิม · OLD</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {(edit.originalData.tags || []).map((t: string) => (
                  <span key={t} style={{ background: "#1e293b", color: "#94a3b8", padding: "2px 8px", borderRadius: 99, fontSize: 11 }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ background: "#05260e22", padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 700, marginBottom: 4 }}>ใหม่ · NEW</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {(edit.pendingData.tags || []).map((t: string) => (
                  <span key={t} style={{ background: "#052e16", color: "#86efac", padding: "2px 8px", borderRadius: 99, fontSize: 11 }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Edit Detail Modal ──────────────────────────────────── */
function EditDetailModal({ edit, onClose, onApprove, onReject }: {
  edit: EditItem; onClose: () => void;
  onApprove: () => void; onReject: () => void;
}) {
  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal" style={{ maxWidth: 680, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div className="adm-modal-title" style={{ marginBottom: 4 }}>
              🔄 การแก้ไข{edit.targetType === "TRIP" ? "ทริป" : "สถานที่"}
            </div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>
              {edit.targetTitle && (
                <>
                  <Link href={edit.targetType === "TRIP" ? `/trips/${edit.targetSlug}` : `/place/${edit.targetSlug}`}
                    target="_blank" style={{ color: "#4facfe", textDecoration: "none" }}>
                    🔗 {edit.targetTitle}
                  </Link>
                  {" · "}
                </>
              )}
              โดย @{edit.submittedBy.username} · {fmt(edit.createdAt)}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase",
            letterSpacing: "0.06em", marginBottom: 12 }}>
            📊 เปรียบเทียบการเปลี่ยนแปลง · Changes Diff
          </div>
          <DiffView edit={edit} />
        </div>

        <div className="adm-modal-actions">
          <button className="adm-btn ghost" onClick={onClose}>ปิด</button>
          <button className="adm-btn" style={{ background: "#dc2626" }} onClick={onReject}>❌ ปฏิเสธ</button>
          <button className="adm-btn primary" onClick={onApprove}>✅ อนุมัติการแก้ไข</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Nearby Place Warning ───────────────────────────────── */
function NearbyPlaceWarning({ placeId }: { placeId: string }) {
  const [nearby, setNearby] = useState<any[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/nearby-places?placeId=${placeId}`)
      .then(r => r.json())
      .then(d => setNearby(d.nearby || []))
      .catch(() => setNearby([]));
  }, [placeId]);

  if (!nearby || nearby.length === 0) return null;

  return (
    <div style={{ margin: "10px 0", borderRadius: 10, overflow: "hidden",
      border: "1px solid #78350f", background: "#1c1003" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer",
          padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14 }}>⚠️</span>
        <span style={{ color: "#fbbf24", fontWeight: 800, fontSize: 13 }}>
          พบสถานที่ใกล้เคียง {nearby.length} แห่ง (อาจซ้ำ)
        </span>
        <span style={{ marginLeft: "auto", color: "#78350f", fontSize: 13 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ borderTop: "1px solid #78350f", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {nearby.map((p: any) => (
            <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "flex-start",
              background: "#0f0a00", borderRadius: 8, padding: 10 }}>
              {p.coverUrl && (
                <img src={p.coverUrl} alt="" style={{ width: 56, height: 48, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: "#fef3c7", fontSize: 13, marginBottom: 2 }}>{p.title}</div>
                <div style={{ color: "#92400e", fontSize: 11 }}>
                  📍 {p.distanceM}ม. · คล้าย {p.similarity}% · {p.category}
                  {p.province && ` · ${p.province}`}
                </div>
                <div style={{ color: "#78350f", fontSize: 11, marginTop: 2 }}>
                  ⭐ {p._count?.reviews ?? 0} รีวิว · 🔖 {p._count?.bookmarks ?? 0}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <a href={`/place/${p.slug}`} target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, color: "#fbbf24", textDecoration: "none",
                      background: "#1c1003", border: "1px solid #78350f", borderRadius: 6, padding: "2px 8px" }}>
                    ดูสถานที่
                  </a>
                  {p.googleMapsUrl && (
                    <a href={p.googleMapsUrl} target="_blank" rel="noreferrer"
                      style={{ fontSize: 11, color: "#fbbf24", textDecoration: "none",
                        background: "#1c1003", border: "1px solid #78350f", borderRadius: 6, padding: "2px 8px" }}>
                      Google Maps
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Trip Place Check Warning ───────────────────────────── */
function TripPlaceCheckWarning({ tripId }: { tripId: string }) {
  const [flagged, setFlagged] = useState<any[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/trip-place-check?tripId=${tripId}`)
      .then(r => r.json())
      .then(d => setFlagged(d.flagged || []))
      .catch(() => setFlagged([]));
  }, [tripId]);

  if (!flagged || flagged.length === 0) return null;

  return (
    <div style={{ margin: "10px 0", borderRadius: 10, overflow: "hidden",
      border: "1px solid #1e3a5f", background: "#07111f" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer",
          padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14 }}>⚠️</span>
        <span style={{ color: "#60a5fa", fontWeight: 800, fontSize: 13 }}>
          มีจุดแวะที่รอตรวจสอบ {flagged.length} จุด
        </span>
        <span style={{ marginLeft: "auto", color: "#1e3a5f", fontSize: 13 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ borderTop: "1px solid #1e3a5f", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {flagged.map((s: any) => (
            <div key={s.stopId} style={{ background: "#060e1c", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "#475569", fontWeight: 700 }}>จุดที่ {s.order}</span>
                <span style={{
                  fontSize: 10, fontWeight: 800, borderRadius: 99, padding: "1px 7px",
                  background: s.status === "PENDING" ? "#451a03" : "#1e293b",
                  color: s.status === "PENDING" ? "#fbbf24" : "#94a3b8",
                }}>
                  {s.status === "PENDING" ? "⏳ PENDING" : "🔗 ไม่ได้ลิงก์"}
                </span>
              </div>
              <div style={{ fontWeight: 700, color: "#bfdbfe", fontSize: 13 }}>{s.placeName}</div>
              {(s.province || s.district) && (
                <div style={{ color: "#1d4ed8", fontSize: 11, marginTop: 2 }}>
                  📍 {[s.province, s.district].filter(Boolean).join(" · ")}
                </div>
              )}
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                {s.placeId && s.place?.slug && (
                  <a href={`/place/${s.place.slug}`} target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, color: "#60a5fa", textDecoration: "none",
                      background: "#07111f", border: "1px solid #1e3a5f", borderRadius: 6, padding: "2px 8px" }}>
                    ดูสถานที่
                  </a>
                )}
                {s.place?.googleMapsUrl && (
                  <a href={s.place.googleMapsUrl} target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, color: "#60a5fa", textDecoration: "none",
                      background: "#07111f", border: "1px solid #1e3a5f", borderRadius: 6, padding: "2px 8px" }}>
                    Google Maps
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════ */
type TabKey = "trips" | "places" | "edit-trips" | "edit-places" | "claims";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "trips",       label: "ทริปใหม่",      icon: "🗺️" },
  { key: "places",      label: "สถานที่ใหม่",   icon: "📍" },
  { key: "edit-trips",  label: "แก้ไขทริป",    icon: "✏️" },
  { key: "edit-places", label: "แก้ไขสถานที่", icon: "🏢" },
  { key: "claims",       label: "ยืนยันเจ้าของ",  icon: "🔑" },
];

export default function AdminApprovalsPage() {
  const [tab, setTab]             = useState<TabKey>("trips");
  const [trips, setTrips]         = useState<TripItem[]>([]);
  const [places, setPlaces]       = useState<PlaceItem[]>([]);
  const [editTrips, setEditTrips] = useState<EditItem[]>([]);
  const [editPlaces, setEditPlaces] = useState<EditItem[]>([]);
  const [claims, setClaims]         = useState<any[]>([]);
  const [counts, setCounts]       = useState({ trips: 0, places: 0, editTrips: 0, editPlaces: 0, claims: 0 });
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState("");

  // modals
  const [rejectTarget, setRejectTarget]   = useState<{ id: string; title: string; type: "trip"|"place"|"edit" } | null>(null);
  const [detailEdit, setDetailEdit]       = useState<EditItem | null>(null);
  const [pendingApproveEdit, setPendingApproveEdit] = useState<EditItem | null>(null);
  const [claimActionTarget, setClaimActionTarget] = useState<{ id: string; action: "APPROVE"|"REJECT"; title: string } | null>(null);
  const [claimNote, setClaimNote] = useState("");

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const loadCounts = useCallback(async () => {
    const [t, p, et, ep, cl] = await Promise.all([
      fetch("/api/admin/trips?approval=PENDING&limit=1").then(r => r.json()).then(d => d.total ?? 0).catch(() => 0),
      fetch("/api/admin/places?approval=PENDING&limit=1").then(r => r.json()).then(d => d.total ?? 0).catch(() => 0),
      fetch("/api/admin/pending-edits?type=TRIP&limit=1").then(r => r.json()).then(d => d.total ?? 0).catch(() => 0),
      fetch("/api/admin/pending-edits?type=PLACE&limit=1").then(r => r.json()).then(d => d.total ?? 0).catch(() => 0),
      fetch("/api/admin/place-claims?status=PENDING").then(r => r.json()).then(d => (d.claims ?? []).length).catch(() => 0),
    ]);
    setCounts({ trips: t, places: p, editTrips: et, editPlaces: ep, claims: cl });
  }, []);

  const loadTab = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "trips") {
        const d = await fetch("/api/admin/trips?approval=PENDING&limit=50").then(r => r.json());
        setTrips(d.trips || []);
      } else if (tab === "places") {
        const d = await fetch("/api/admin/places?approval=PENDING&limit=50").then(r => r.json());
        setPlaces(d.places || []);
      } else if (tab === "edit-trips") {
        const d = await fetch("/api/admin/pending-edits?type=TRIP&limit=50").then(r => r.json());
        setEditTrips(d.edits || []);
      } else if (tab === "edit-places") {
        const d = await fetch("/api/admin/pending-edits?type=PLACE&limit=50").then(r => r.json());
        setEditPlaces(d.edits || []);
      } else if (tab === "claims") {
        const d = await fetch("/api/admin/place-claims?status=PENDING").then(r => r.json());
        setClaims(d.claims || []);
      }
    } finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { loadCounts(); }, [loadCounts]);
  useEffect(() => { loadTab(); }, [loadTab]);

  /* ── Trip actions ── */
  async function approveTrip(id: string) {
    const res = await fetch("/api/admin/trips", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId: id, action: "approve" }),
    });
    const d = await res.json();
    showMsg(res.ok ? "✅ " + d.message : "❌ " + d.message);
    loadTab(); loadCounts();
  }
  async function rejectTrip(id: string, reason: string) {
    await fetch("/api/admin/trips", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId: id, action: "reject", rejectionReason: reason }),
    });
    showMsg("❌ ปฏิเสธแล้ว"); setRejectTarget(null);
    loadTab(); loadCounts();
  }

  /* ── Place actions ── */
  async function approvePlace(id: string) {
    const res = await fetch("/api/admin/places", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId: id, action: "approve" }),
    });
    const d = await res.json();
    showMsg(res.ok ? "✅ " + d.message : "❌ " + d.message);
    loadTab(); loadCounts();
  }
  async function rejectPlace(id: string, reason: string) {
    await fetch("/api/admin/places", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId: id, action: "reject", rejectionReason: reason }),
    });
    showMsg("❌ ปฏิเสธแล้ว"); setRejectTarget(null);
    loadTab(); loadCounts();
  }

  /* ── Edit actions ── */
  async function approveEdit(id: string) {
    const res = await fetch("/api/admin/pending-edits", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editId: id, action: "approve" }),
    });
    const d = await res.json();
    showMsg(res.ok ? "✅ " + d.message : "❌ " + d.message);
    setPendingApproveEdit(null); setDetailEdit(null);
    loadTab(); loadCounts();
  }
  async function rejectEdit(id: string, reason: string) {
    await fetch("/api/admin/pending-edits", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editId: id, action: "reject", rejectionReason: reason }),
    });
    showMsg("❌ ปฏิเสธการแก้ไขแล้ว");
    setRejectTarget(null); setDetailEdit(null);
    loadTab(); loadCounts();
  }

  /* ── Claim actions ── */
  async function actionClaim(claimId: string, action: "APPROVE"|"REJECT", note: string) {
    const res = await fetch("/api/admin/place-claims", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId, action, adminNote: note }),
    });
    const d = await res.json();
    showMsg(res.ok ? "✅ " + d.message : "❌ " + d.message);
    setClaimActionTarget(null); setClaimNote("");
    loadTab(); loadCounts();
  }

  const currentEdits = tab === "edit-trips" ? editTrips : editPlaces;
  const totalPending = counts.trips + counts.places + counts.editTrips + counts.editPlaces + counts.claims;

  return (
    <>
      {/* ── Topbar ── */}
      <div className="adm-topbar">
        <div className="adm-topbar-title">
          🔍 รออนุมัติทั้งหมด
          {totalPending > 0 && (
            <span style={{ marginLeft: 10, background: "#dc2626", color: "#fff",
              fontSize: 11, fontWeight: 800, borderRadius: 99, padding: "2px 8px" }}>
              {totalPending}
            </span>
          )}
        </div>
        <div className="adm-topbar-right">
          {msg && <span style={{ fontWeight: 700, fontSize: 13,
            color: msg.startsWith("✅") ? "#22c55e" : "#ef4444" }}>{msg}</span>}
        </div>
      </div>

      <div className="adm-content">
        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {TABS.map(t => {
            const count = counts[t.key === "edit-trips" ? "editTrips" : t.key === "edit-places" ? "editPlaces" : t.key as keyof typeof counts] ?? 0;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`adm-btn ${tab === t.key ? "primary" : "ghost"}`}
                style={{ position: "relative", paddingRight: count > 0 ? 32 : undefined }}>
                {t.icon} {t.label}
                {count > 0 && (
                  <span style={{ position: "absolute", top: -6, right: -6,
                    background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 800,
                    borderRadius: 99, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>⏳ กำลังโหลด...</div>
        ) : (

          /* ════ TAB: ทริปใหม่ ════ */
          tab === "trips" ? (
            <div>
              {trips.length === 0
                ? <div className="adm-card" style={{ textAlign: "center", padding: 60, color: "#64748b" }}>🎉 ไม่มีทริปรออนุมัติ</div>
                : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
                    {trips.map(trip => (
                      <div key={trip.id} className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
                        <div style={{ position: "relative" }}>
                          <img src={trip.coverUrl} alt={trip.title}
                            style={{ width: "100%", height: 160, objectFit: "cover" }} />
                          <div style={{ position: "absolute", top: 10, right: 10 }}>
                            <span style={{ ...STATUS_META[trip.approvalStatus],
                              fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>
                              {STATUS_META[trip.approvalStatus]?.label}
                            </span>
                          </div>
                        </div>
                        <div style={{ padding: 16 }}>
                          <h3 style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 15, margin: "0 0 6px" }}>{trip.title}</h3>
                          <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>
                            {trip.mood && <span style={{ marginRight: 8 }}>{trip.mood}</span>}
                            {trip.location && <span>📍 {trip.location}</span>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            {trip.author.avatarUrl
                              ? <img src={trip.author.avatarUrl} style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} alt="" />
                              : <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#334155",
                                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#94a3b8" }}>
                                  {(trip.author.displayName || trip.author.firstName || "?").slice(0, 1)}
                                </div>}
                            <span style={{ fontSize: 12, color: "#94a3b8" }}>@{trip.author.username}</span>
                            <span style={{ fontSize: 11, color: "#475569", marginLeft: "auto" }}>{fmt(trip.createdAt)}</span>
                          </div>
                          <TripPlaceCheckWarning tripId={trip.id} />
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <Link href={`/trips/${trip.slug}`} target="_blank" className="adm-btn ghost sm">🔗 ดูทริป</Link>
                            <button className="adm-btn primary sm" onClick={() => approveTrip(trip.id)}>✅ อนุมัติ</button>
                            <button className="adm-btn sm" style={{ background: "#7f1d1d" }}
                              onClick={() => setRejectTarget({ id: trip.id, title: trip.title, type: "trip" })}>
                              ❌ ปฏิเสธ
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>}
            </div>

          /* ════ TAB: สถานที่ใหม่ ════ */
          ) : tab === "places" ? (
            <div>
              {places.length === 0
                ? <div className="adm-card" style={{ textAlign: "center", padding: 60, color: "#64748b" }}>🎉 ไม่มีสถานที่รออนุมัติ</div>
                : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
                    {places.map(place => (
                      <div key={place.id} className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
                        <div style={{ position: "relative" }}>
                          <img src={place.coverUrl} alt={place.title}
                            style={{ width: "100%", height: 160, objectFit: "cover" }} />
                          <div style={{ position: "absolute", top: 10, right: 10 }}>
                            <span style={{ ...STATUS_META[place.approvalStatus],
                              fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>
                              {STATUS_META[place.approvalStatus]?.label}
                            </span>
                          </div>
                        </div>
                        <div style={{ padding: 16 }}>
                          <h3 style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 15, margin: "0 0 4px" }}>{place.title}</h3>
                          <div style={{ color: "#64748b", fontSize: 12, marginBottom: 8 }}>
                            📍 {place.province} · {place.district} · {place.category}
                          </div>
                          {place.business && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                              {place.business.user.avatarUrl
                                ? <img src={place.business.user.avatarUrl} style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} alt="" />
                                : <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#334155",
                                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#94a3b8" }}>
                                    {place.business.businessName.slice(0, 1)}
                                  </div>}
                              <div>
                                <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>{place.business.businessName}</div>
                                <div style={{ fontSize: 11, color: "#64748b" }}>@{place.business.user.username}</div>
                              </div>
                              <span style={{ fontSize: 11, color: "#475569", marginLeft: "auto" }}>{fmt(place.createdAt)}</span>
                            </div>
                          )}
                          <NearbyPlaceWarning placeId={place.id} />
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <Link href={`/place/${place.slug}`} target="_blank" className="adm-btn ghost sm">🔗 ดูสถานที่</Link>
                            <button className="adm-btn primary sm" onClick={() => approvePlace(place.id)}>✅ อนุมัติ</button>
                            <button className="adm-btn sm" style={{ background: "#7f1d1d" }}
                              onClick={() => setRejectTarget({ id: place.id, title: place.title, type: "place" })}>
                              ❌ ปฏิเสธ
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>}
            </div>

          /* ════ TAB: แก้ไขทริป / แก้ไขสถานที่ ════ */
          ) : (tab === "edit-trips" || tab === "edit-places") ? (
            <div>
              {currentEdits.length === 0
                ? <div className="adm-card" style={{ textAlign: "center", padding: 60, color: "#64748b" }}>🎉 ไม่มีการแก้ไขรออนุมัติ</div>
                : <div className="adm-card" style={{ padding: 0 }}>
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th>เนื้อหา</th>
                          <th>ผู้แก้ไข</th>
                          <th>การเปลี่ยนแปลง</th>
                          <th>วันที่</th>
                          <th>การจัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentEdits.map(edit => {
                          const fields = tab === "edit-trips" ? TRIP_FIELDS : PLACE_FIELDS;
                          const changedCount = fields.filter(([k]) =>
                            edit.pendingData[k] !== undefined &&
                            JSON.stringify(edit.originalData[k]) !== JSON.stringify(edit.pendingData[k])
                          ).length;
                          const hasCover = edit.pendingData.coverUrl && edit.pendingData.coverUrl !== edit.originalData.coverUrl;
                          return (
                            <tr key={edit.id}>
                              <td>
                                <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 14 }}>
                                  {edit.targetTitle || edit.targetId}
                                </div>
                                {edit.targetSlug && (
                                  <Link href={tab === "edit-trips" ? `/trips/${edit.targetSlug}` : `/place/${edit.targetSlug}`}
                                    target="_blank" style={{ color: "#4facfe", fontSize: 12, textDecoration: "none" }}>
                                    🔗 ดูต้นฉบับ
                                  </Link>
                                )}
                              </td>
                              <td>
                                <div style={{ fontSize: 13, color: "#e2e8f0" }}>
                                  {edit.submittedBy.displayName || edit.submittedBy.username}
                                </div>
                                <div style={{ fontSize: 11, color: "#64748b" }}>@{edit.submittedBy.username}</div>
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  {changedCount > 0 && (
                                    <span style={{ background: "#1e293b", color: "#94a3b8", padding: "2px 8px", borderRadius: 6, fontSize: 11 }}>
                                      📝 {changedCount} ฟิลด์
                                    </span>
                                  )}
                                  {hasCover && (
                                    <span style={{ background: "#1e3a5f", color: "#93c5fd", padding: "2px 8px", borderRadius: 6, fontSize: 11 }}>
                                      🖼️ รูปปก
                                    </span>
                                  )}
                                  {edit.pendingData.gallery && (
                                    <span style={{ background: "#1e3a5f", color: "#93c5fd", padding: "2px 8px", borderRadius: 6, fontSize: 11 }}>
                                      📷 Gallery
                                    </span>
                                  )}
                                  {edit.pendingData.timeline && (
                                    <span style={{ background: "#1e293b", color: "#94a3b8", padding: "2px 8px", borderRadius: 6, fontSize: 11 }}>
                                      🗺️ Timeline
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>
                                {fmt(edit.createdAt)}
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  <button className="adm-btn ghost sm" onClick={() => setDetailEdit(edit)}>
                                    🔍 ดู Diff
                                  </button>
                                  <button className="adm-btn primary sm" onClick={() => approveEdit(edit.id)}>
                                    ✅ อนุมัติ
                                  </button>
                                  <button className="adm-btn sm" style={{ background: "#7f1d1d" }}
                                    onClick={() => setRejectTarget({ id: edit.id, title: edit.targetTitle || "การแก้ไขนี้", type: "edit" })}>
                                    ❌
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>}
            </div>
          ) : tab === "claims" ? (
            /* ════ TAB: ยืนยันเจ้าของ ════ */
            <div>
              {claims.length === 0
                ? <div className="adm-card" style={{ textAlign: "center", padding: 60, color: "#64748b" }}>🎉 ไม่มีคำขอยืนยันเจ้าของ</div>
                : <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {claims.map((claim: any) => (
                      <div key={claim.id} className="adm-card" style={{ padding: 20 }}>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                          {/* Place info */}
                          <div style={{ flex: "0 0 120px" }}>
                            {claim.place.coverUrl
                              ? <img src={claim.place.coverUrl} alt="" style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 10 }} />
                              : <div style={{ width: 120, height: 80, borderRadius: 10, background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📍</div>
                            }
                          </div>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                              <a href={`/place/${claim.place.slug}`} target="_blank" rel="noreferrer"
                                style={{ fontWeight: 800, fontSize: 16, color: "#38bdf8", textDecoration: "none" }}>
                                {claim.place.title}
                              </a>
                              <span style={{ fontSize: 11, color: "#64748b" }}>{claim.place.province} · {claim.place.district}</span>
                            </div>

                            {/* Business info */}
                            <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: "#f1f5f9", marginBottom: 4 }}>
                                🏢 {claim.business.businessName}
                                {claim.business.isVerified && (
                                  <span style={{ marginLeft: 8, background: "#dcfce7", color: "#15803d", fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 99 }}>✓ Verified</span>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", flexDirection: "column", gap: 2 }}>
                                <span>👤 {claim.business.user?.displayName || claim.business.user?.username}</span>
                                {claim.business.phone && <span>📞 {claim.business.phone}</span>}
                                {claim.business.email && <span>📧 {claim.business.email}</span>}
                                {claim.business.lineId && <span>💬 Line: {claim.business.lineId}</span>}
                                {claim.business.user?.email && <span>✉️ {claim.business.user.email}</span>}
                              </div>
                            </div>

                            {claim.message && (
                              <div style={{ background: "#1e293b", borderLeft: "3px solid #38bdf8", borderRadius: "0 8px 8px 0", padding: "8px 12px", fontSize: 13, color: "#cbd5e1", marginBottom: 10, fontStyle: "italic" }}>
                                "{claim.message}"
                              </div>
                            )}

                            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>{fmt(claim.createdAt)}</div>

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <button className="adm-btn primary sm"
                                onClick={() => setClaimActionTarget({ id: claim.id, action: "APPROVE", title: claim.place.title })}>
                                ✅ อนุมัติ
                              </button>
                              <button className="adm-btn sm" style={{ background: "#7f1d1d" }}
                                onClick={() => setClaimActionTarget({ id: claim.id, action: "REJECT", title: claim.place.title })}>
                                ❌ ปฏิเสธ
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          ) : null
        )}
      </div>

      {/* ── Claim Action Modal ── */}
      {claimActionTarget && (
        <div className="adm-modal-backdrop" onClick={() => { setClaimActionTarget(null); setClaimNote(""); }}>
          <div className="adm-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="adm-modal-title">
              {claimActionTarget.action === "APPROVE" ? "✅ อนุมัติคำขอ" : "❌ ปฏิเสธคำขอ"}
            </div>
            <div className="adm-modal-body">
              <p style={{ color: "#94a3b8", marginBottom: 12 }}>
                สถานที่: <strong style={{ color: "#f1f5f9" }}>{claimActionTarget.title}</strong>
              </p>
              <textarea value={claimNote} onChange={e => setClaimNote(e.target.value)}
                placeholder={claimActionTarget.action === "APPROVE" ? "หมายเหตุ (ไม่บังคับ)" : "ระบุเหตุผลที่ปฏิเสธ..."}
                rows={3}
                style={{ width: "100%", boxSizing: "border-box", background: "#0f172a", border: "1px solid #334155",
                  borderRadius: 8, padding: "8px 12px", color: "#f1f5f9", fontFamily: "inherit", resize: "none", outline: "none" }} />
            </div>
            <div className="adm-modal-actions">
              <button className="adm-btn ghost" onClick={() => { setClaimActionTarget(null); setClaimNote(""); }}>ยกเลิก</button>
              <button className="adm-btn"
                style={{ background: claimActionTarget.action === "APPROVE" ? "#16a34a" : "#dc2626" }}
                onClick={() => actionClaim(claimActionTarget.id, claimActionTarget.action, claimNote)}>
                {claimActionTarget.action === "APPROVE" ? "✅ ยืนยันอนุมัติ" : "❌ ยืนยันปฏิเสธ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Diff Detail Modal ── */}
      {detailEdit && !rejectTarget && (
        <EditDetailModal
          edit={detailEdit}
          onClose={() => setDetailEdit(null)}
          onApprove={() => approveEdit(detailEdit.id)}
          onReject={() => {
            setRejectTarget({ id: detailEdit.id, title: detailEdit.targetTitle || "การแก้ไขนี้", type: "edit" });
          }}
        />
      )}

      {/* ── Reject Modal ── */}
      {rejectTarget && (
        <RejectModal
          title={rejectTarget.title}
          onClose={() => setRejectTarget(null)}
          onConfirm={reason => {
            if (rejectTarget.type === "trip")  rejectTrip(rejectTarget.id, reason);
            else if (rejectTarget.type === "place") rejectPlace(rejectTarget.id, reason);
            else rejectEdit(rejectTarget.id, reason);
          }}
        />
      )}
    </>
  );
}

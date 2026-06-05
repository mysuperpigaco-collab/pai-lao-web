"use client";

// ── Feature flag: แอดมินเปิด/ปิด Promotion ─────────────────────
const PROMOTION_ENABLED = true;

// ── PromotionModal ────────────────────────────────────────────────
type Place = { id: string; slug: string; title: string };

function PromotionModal({ places, onClose, onSuccess }: {
  places: Place[]; onClose: () => void; onSuccess: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = React.useState({
    placeId: places[0]?.id ?? "",
    title: "", description: "", discount: "",
    startDate: "", startTime: "00:00",
    endDate:   "", endTime:   "23:59",
  });
  const [conditions, setConditions] = React.useState<string[]>([""]);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");

  const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none", background: "white" };
  const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5 };

  const addCondition    = () => setConditions(c => [...c, ""]);
  const removeCondition = (i: number) => setConditions(c => c.filter((_, idx) => idx !== i));
  const updateCondition = (i: number, v: string) => setConditions(c => c.map((x, idx) => idx === i ? v : x));

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.startDate || !form.endDate || !form.placeId) {
      setErr("กรุณากรอกข้อมูลที่จำเป็นให้ครบ"); return;
    }
    setSaving(true); setErr("");
    const payload = {
      ...form,
      startDate: form.startDate && form.startTime ? `${form.startDate}T${form.startTime}` : form.startDate,
      endDate:   form.endDate   && form.endTime   ? `${form.endDate}T${form.endTime}`     : form.endDate,
      conditions: conditions.filter(c => c.trim()),
    };
    const res = await fetch("/api/promotions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (res.ok) { onSuccess(); onClose(); }
    else { setErr(data.error || "เกิดข้อผิดพลาด"); }
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "white", borderRadius: 24, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(15,23,42,0.2)" }}>

        {/* Modal header */}
        <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "white", zIndex: 1, borderRadius: "24px 24px 0 0" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 17, color: "#0f172a" }}>🎁 เพิ่มโปรโมชั่น</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>ส่งคำขอโปรโมชั่น รอแอดมินอนุมัติ</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: "#f1f5f9", cursor: "pointer", fontSize: 18, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>×</button>
        </div>

        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Place selector */}
          {places.length > 1 && (
            <div>
              <label style={lbl}>📍 สถานที่ *</label>
              <select value={form.placeId} onChange={e => setForm(p => ({ ...p, placeId: e.target.value }))} style={{ ...inp }}>
                {places.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          )}
          {places.length === 1 && (
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13 }}>📍</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>{places[0].title}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label style={lbl}>ชื่อโปรโมชั่น *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="เช่น โปรซัมเมอร์ ลด 20%" style={inp} />
          </div>

          {/* Description */}
          <div>
            <label style={lbl}>รายละเอียด *</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="อธิบายโปรโมชั่นให้ชัดเจน..." rows={3} style={{ ...inp, resize: "vertical" }} />
          </div>

          {/* Discount */}
          <div>
            <label style={lbl}>ส่วนลด</label>
            <input value={form.discount} onChange={e => setForm(p => ({ ...p, discount: e.target.value }))} placeholder="เช่น ลด 20% หรือ ซื้อ 1 แถม 1" style={inp} />
          </div>

          {/* Date + Time range */}
          <div>
            <label style={lbl}>📅 ช่วงเวลาโปรโมชั่น *</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>วันเริ่ม</div>
                <input type="date" value={form.startDate} min={today} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} style={inp} />
                <input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} style={{ ...inp, marginTop: 6 }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>วันหมดอายุ</div>
                <input type="date" value={form.endDate} min={form.startDate || today} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} style={inp} />
                <input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} style={{ ...inp, marginTop: 6 }} />
              </div>
            </div>
          </div>

          {/* Conditions list */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <label style={{ ...lbl, margin: 0 }}>📋 ข้อกำหนดและเงื่อนไข</label>
              <button onClick={addCondition} style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#2563eb", cursor: "pointer", fontFamily: "inherit" }}>+ เพิ่มข้อ</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {conditions.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
                  <input value={c} onChange={e => updateCondition(i, e.target.value)} placeholder={`เงื่อนไขข้อที่ ${i + 1} เช่น ซื้อขั้นต่ำ 200 บาท`}
                    style={{ ...inp, flex: 1 }} />
                  {conditions.length > 1 && (
                    <button onClick={() => removeCondition(i)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: 14, fontFamily: "inherit", flexShrink: 0 }}>×</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {err && <div style={{ background: "#fef2f2", color: "#dc2626", fontSize: 13, fontWeight: 700, padding: "10px 14px", borderRadius: 10, border: "1px solid #fecaca" }}>⚠️ {err}</div>}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>ยกเลิก</button>
            <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: saving ? "#e2e8f0" : "linear-gradient(135deg,#f59e0b,#ef4444)", color: saving ? "#94a3b8" : "white", fontWeight: 800, fontSize: 14, cursor: saving ? "wait" : "pointer", fontFamily: "inherit" }}>
              {saving ? "⏳ กำลังส่ง..." : "📤 ส่งคำขอโปรโมชั่น"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PromotionBar — แสดงใต้ profile card ─────────────────────────
function PromotionBar({ places }: { places: Place[] }) {
  if (!PROMOTION_ENABLED) return null;
  const [showModal, setShowModal] = React.useState(false);
  const [promos, setPromos] = React.useState<any[]>([]);

  const load = () => fetch("/api/promotions").then(r => r.json()).then(d => setPromos(d.promotions || []));
  React.useEffect(() => { load(); }, []);

  return (
    <>
      {/* Bar */}
      <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #fde68a", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 28 }}>🎁</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#92400e" }}>โปรโมชั่นของร้าน</div>
            <div style={{ fontSize: 12, color: "#b45309" }}>
              {promos.length > 0 ? `${promos.length} โปรโมชั่นที่กำลังแสดง` : "ยังไม่มีโปรโมชั่น · ดึงดูดลูกค้าด้วยโปรโมชั่น"}
            </div>
          </div>
          {promos.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {promos.slice(0, 2).map(p => (
                <span key={p.id} style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}>{p.title}</span>
              ))}
              {promos.length > 2 && <span style={{ fontSize: 11, color: "#94a3b8" }}>+{promos.length - 2}</span>}
            </div>
          )}
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "white", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>
          + เพิ่มโปรโมชั่น
        </button>
      </div>

      {showModal && (
        <PromotionModal places={places} onClose={() => setShowModal(false)} onSuccess={load} />
      )}
    </>
  );
}

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ProvinceSelect from "@/components/ui/ProvinceSelect";
import DistrictSelect from "@/components/ui/DistrictSelect";
import BusinessProfileCard from "@/components/business/BusinessProfileCard";
import BusinessPlaceCard from "@/components/business/BusinessPlaceCard";
import BusinessNotifications from "@/components/business/BusinessNotifications";
import PageLoading from "@/components/ui/PageLoading";

type BusinessData = {
  business: {
    id: string;
    businessName: string;
    logoUrl: string | null;
    coverUrl: string | null;
    phone: string | null;
    lineId: string | null;
    isVerified: boolean;
  };
  places: {
    id: string;
    slug: string;
    title: string;
    province: string;
    district: string;
    category: string;
    coverUrl: string;
    isVerified: boolean;
    avgRating: number | null;
    reviewCount: number;
    bookmarkCount: number;
    approvalStatus?: string;
    rejectionReason?: string | null;
    claimStatus?: string | null;
    claimNote?: string | null;
    isClaimedPlace?: boolean;
    editStatus?: string | null;
    editRejectionReason?: string | null;
  }[];
  stats: {
    totalPlaces: number;
    totalReviews: number;
    overallAvg: number | null;
  };
};

function StatCard({ value, label, labelEn, color, bg }: {
  value: string; label: string; labelEn: string; color: string; bg: string;
}) {
  return (
    <div style={{ borderRadius: "24px", padding: "26px 28px", background: bg, display: "flex", flexDirection: "column", gap: "6px" }}>
      <strong style={{ fontSize: "40px", fontWeight: 900, color, lineHeight: 1 }}>{value}</strong>
      <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{label}</span>
      <small style={{ fontSize: "11px", color: "#64748b" }}>{labelEn}</small>
    </div>
  );
}

function DisputeButton({ slug, claimingSlug, onDispute }: { slug: string; claimingSlug: string | null; onDispute: (slug: string, reason?: string) => void }) {
  const [showForm, setShowForm] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const isClaiming = claimingSlug === slug;

  if (!showForm) {
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <a href={`/place/${slug}`} target="_blank" rel="noreferrer"
          style={{ flex: 1, padding: "8px 0", textAlign: "center", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
          ดูสถานที่
        </a>
        <button onClick={() => setShowForm(true)}
          style={{ flex: 2, padding: "8px 0", borderRadius: 10, border: "none", background: "#f59e0b", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
          ⚔️ โต้แย้งความเป็นเจ้าของ
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="ระบุเหตุผล เช่น ฉันเป็นเจ้าของที่แท้จริง มีเอกสารยืนยัน... (ขั้นต่ำ 10 ตัวอักษร)"
        rows={3}
        style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #fde68a", fontSize: 12, fontFamily: "inherit", resize: "none", boxSizing: "border-box", outline: "none" }}
      />
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => setShowForm(false)}
          style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          ยกเลิก
        </button>
        <button
          onClick={() => { onDispute(slug, reason); setShowForm(false); setReason(""); }}
          disabled={isClaiming || reason.length < 10}
          style={{ flex: 2, padding: "8px 0", borderRadius: 10, border: "none", background: isClaiming || reason.length < 10 ? "#e2e8f0" : "#dc2626", color: isClaiming || reason.length < 10 ? "#94a3b8" : "#fff", fontSize: 12, fontWeight: 800, cursor: isClaiming || reason.length < 10 ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
          {isClaiming ? "⏳ กำลังส่ง..." : "⚔️ ส่งคำขอโต้แย้ง"}
        </button>
      </div>
    </div>
  );
}

export default function BusinessDashboardPage() {
  const [data, setData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Claim place search state
  const [claimQuery, setClaimQuery] = useState("");
  const [claimProvince, setClaimProvince] = useState("");
  const [claimDistrict, setClaimDistrict] = useState("");
  const [claimCategory, setClaimCategory] = useState("");
  const [claimResults, setClaimResults] = useState<any[]>([]);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimingSlug, setClaimingSlug] = useState<string | null>(null);
  const [claimMessage, setClaimMessage] = useState("");

  const fetchData = () => {
    setLoading(true);
    fetch("/api/business/me")
      .then(r => r.json())
      .then(d => {
        if (d.message) { setError(d.message); }
        else { setData(d); currentBizIdRef.current = d.business?.id ?? null; }
        setLoading(false);
      })
      .catch(() => { setError("ไม่สามารถโหลดข้อมูลได้"); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const handlePlaceDeleted = (slug: string) => {
    setData(prev => {
      if (!prev) return prev;
      const places = prev.places.filter(p => p.slug !== slug);
      return { ...prev, places, stats: { ...prev.stats, totalPlaces: places.length } };
    });
  };

  const claimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentBizIdRef = useRef<string | null>(null);
  const runClaimSearch = (q: string, province: string, district: string, category: string) => {
    if (claimTimerRef.current) clearTimeout(claimTimerRef.current);
    if (!q.trim() || q.length < 2) { setClaimResults([]); return; }
    claimTimerRef.current = setTimeout(async () => {
      setClaimLoading(true);
      try {
        const params = new URLSearchParams({ q, limit: "12" });
        if (province) params.set("province", province.split(" (")[0]);
        if (district) params.set("district", district);
        if (category) params.set("category", category);
        const res = await fetch(`/api/places?${params}`);
        const placeData = await res.json();
        // แสดงทั้งสถานที่ไม่มีเจ้าของ และที่มีเจ้าของอื่น (สำหรับ dispute) ยกเว้นของตัวเอง
        setClaimResults(prev => {
          const currentBizId = currentBizIdRef.current;
          return (placeData.places ?? []).filter((p: any) =>
            !p.business || (currentBizId && p.business.id !== currentBizId)
          );
        });
      } catch {}
      setClaimLoading(false);
    }, 400);
  };
  const searchUnclaimedPlaces = (q: string) => {
    setClaimQuery(q);
    runClaimSearch(q, claimProvince, claimDistrict, claimCategory);
  };
  const claimPlace = async (slug: string, reason?: string) => {
    setClaimingSlug(slug);
    setClaimMessage("");
    try {
      const res = await fetch(`/api/places/${slug}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reason ?? null }),
      });
      const d = await res.json();
      if (res.ok) {
        const msg = d.isDispute
          ? `✅ ${d.message}`
          : d.hasCompetition
          ? `✅ ${d.message} · ⚠️ มีธุรกิจอื่นขอ claim อยู่ ${d.competingCount} ราย แอดมินจะเป็นคนตัดสิน`
          : `✅ ${d.message}`;
        setClaimMessage(msg);
        setClaimResults(prev => prev.filter(p => p.slug !== slug));
        fetchData();
      } else {
        setClaimMessage(`❌ ${d.message}`);
      }
    } catch { setClaimMessage("❌ เกิดข้อผิดพลาด"); }
    setClaimingSlug(null);
  };

  if (loading) return <PageLoading text="กำลังโหลดข้อมูล..." />;

  if (error) return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
      <p style={{ color: "#dc2626", fontSize: "16px" }}>⚠️ {error}</p>
      <button onClick={fetchData} style={{ padding: "10px 24px", borderRadius: "12px", border: "none", background: "#3b82f6", color: "white", fontWeight: 700, cursor: "pointer" }}>
        ลองใหม่
      </button>
    </div>
  );

  const biz    = data!.business;
  const stats  = data!.stats;
  const places = data!.places;

  return (
    <div className="dashboard-page">

      {/* ── HERO ── */}
      <section className="dashboard-hero">
        <p className="dashboard-tag">BUSINESS DASHBOARD</p>
        <h1>จัดการสถานที่ของคุณ</h1>
        <span>จัดการข้อมูล โปรไฟล์ รีวิว และสถานที่ทั้งหมดได้ในที่เดียว · Manage all your places in one place</span>
      </section>

      {/* ── PROFILE CARD ── */}
      <BusinessProfileCard
        businessName={biz.businessName}
        phone={biz.phone ?? undefined}
        lineId={biz.lineId ?? undefined}
        logoUrl={biz.logoUrl ?? undefined}
        isVerified={biz.isVerified}
      />

      {/* ── PROMOTION BAR ── */}
      <PromotionBar places={places.map(p => ({ id: p.id, slug: p.slug, title: p.title }))} />

      {/* ── STATS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "32px" }}>
        <StatCard
          value={String(stats.totalPlaces)}
          label="สถานที่ทั้งหมด" labelEn="Total Places"
          color="#2563eb" bg="#eff6ff"
        />
        <StatCard
          value={stats.overallAvg != null ? String(stats.overallAvg) : "—"}
          label="คะแนนเฉลี่ย" labelEn="Average Rating"
          color="#15803d" bg="#dcfce7"
        />
        <StatCard
          value={stats.totalReviews > 0 ? String(stats.totalReviews) : "0"}
          label="รีวิวทั้งหมด" labelEn="Total Reviews"
          color="#9333ea" bg="#faf5ff"
        />
      </div>

      {/* ── NOTIFICATIONS ── */}
      <BusinessNotifications />

      {/* ── PLACES HEADER ── */}
      <div className="section-header" style={{ marginTop: 32 }}>
        <div>
          <h2 className="section-title">สถานที่ของคุณ</h2>
          <p className="section-sub">{places.length} สถานที่ · จัดการและแก้ไขข้อมูลได้ที่นี่</p>
        </div>
        <Link href="/business/places/create" style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "12px 20px", borderRadius: "14px",
          background: "linear-gradient(135deg, #4facfe, #43e97b)",
          color: "white", textDecoration: "none", fontWeight: 800, fontSize: "14px",
          boxShadow: "0 4px 12px rgba(79,172,254,0.3)",
        }}>
          + เพิ่มสถานที่ใหม่
        </Link>
      </div>

      {/* ── PLACES GRID ── */}
      {places.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,0.82)", borderRadius: "24px" }}>
          <p style={{ fontSize: "40px", marginBottom: "12px" }}>🏞️</p>
          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#334155" }}>ยังไม่มีสถานที่</h3>
          <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>เพิ่มสถานที่แรกของคุณเพื่อให้นักท่องเที่ยวค้นพบ</p>
          <Link href="/business/places/create" style={{
            display: "inline-flex", padding: "12px 28px", borderRadius: "999px",
            background: "#3b82f6", color: "white", fontWeight: 800, textDecoration: "none",
          }}>
            + เพิ่มสถานที่ใหม่
          </Link>
        </div>
      ) : (
        <section className="manage-grid">
          {places.map(p => (
            <BusinessPlaceCard
              key={p.slug}
              slug={p.slug}
              title={p.title}
              province={p.province}
              district={p.district}
              coverUrl={p.coverUrl}
              category={p.category}
              avgRating={p.avgRating}
              isVerified={p.isVerified}
              reviewCount={p.reviewCount}
              bookmarkCount={p.bookmarkCount}
              onDeleted={handlePlaceDeleted}
              approvalStatus={p.approvalStatus}
              rejectionReason={p.rejectionReason}
              claimStatus={p.claimStatus}
              claimNote={p.claimNote}
              isClaimedPlace={p.isClaimedPlace}
              editStatus={p.editStatus}
              editRejectionReason={p.editRejectionReason}
            />
          ))}
        </section>
      )}

      {/* ── Claim unclaimed places ───────────────────────────── */}
      <section style={{ marginTop: 40, background: "rgba(255,255,255,0.92)", borderRadius: 20, border: "1.5px solid #f1f5f9", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "22px 28px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 className="section-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              🏢 ค้นหาและยืนยันความเป็นเจ้าของสถานที่
            </h2>
            <p className="section-sub">Claim Place · สถานที่ที่นักท่องเที่ยวเพิ่มไว้ที่ยังไม่มีเจ้าของ</p>
          </div>
          {claimResults.length > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, background: "#f0fdf4", color: "#15803d", padding: "4px 12px", borderRadius: 999, border: "1px solid #bbf7d0" }}>
              พบ {claimResults.length} สถานที่
            </span>
          )}
        </div>

        {/* Search + filter bar */}
        <div style={{ padding: "16px 28px 20px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* Search input */}
          <div style={{ flex: "2 1 220px", display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "0 14px", height: 44 }}>
            <span style={{ color: "#94a3b8", flexShrink: 0, display: "flex" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input
              type="text"
              value={claimQuery}
              onChange={e => searchUnclaimedPlaces(e.target.value)}
              placeholder="ชื่อสถานที่..."
              style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 14, fontFamily: "inherit", color: "#1e293b" }}
            />
            {claimLoading && <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>กำลังค้นหา...</span>}
            {claimQuery && !claimLoading && (
              <button type="button" onClick={() => { setClaimQuery(""); setClaimResults([]); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, lineHeight: 1, flexShrink: 0 }}>×</button>
            )}
          </div>

          {/* Province filter */}
          <div style={{ flex: "1 1 150px", display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "0 12px", height: 44, boxSizing: "border-box" }}>
            <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1 }}>🗾</span>
            <ProvinceSelect
              value={claimProvince}
              onChange={v => { setClaimProvince(v); setClaimDistrict(""); runClaimSearch(claimQuery, v, "", claimCategory); }}
              placeholder="ทุกจังหวัด"
              style={{ border: "none", background: "transparent", fontSize: 13, height: 44, padding: "0", boxShadow: "none", display: "flex", alignItems: "center" }}
            />
          </div>

          {/* District filter */}
          <div style={{ flex: "1 1 140px", display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "0 12px", height: 44, boxSizing: "border-box" }}>
            <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1 }}>🏘️</span>
            <DistrictSelect
              province={claimProvince.split(" (")[0]}
              value={claimDistrict}
              onChange={v => { setClaimDistrict(v); runClaimSearch(claimQuery, claimProvince, v, claimCategory); }}
              placeholder="ทุกอำเภอ"
              style={{ border: "none", background: "transparent", fontSize: 13, height: 44, padding: "0", boxShadow: "none", display: "flex", alignItems: "center" }}
            />
          </div>

          {/* Category filter */}
          <div style={{ flex: "1 1 130px", display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "0 12px", height: 44, boxSizing: "border-box" }}>
            <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1 }}>🏷️</span>
            <select value={claimCategory}
              onChange={e => { setClaimCategory(e.target.value); runClaimSearch(claimQuery, claimProvince, claimDistrict, e.target.value); }}
              style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, color: "#374151", fontFamily: "inherit", cursor: "pointer", outline: "none", height: 44 }}>
              <option value="">ทุกหมวด</option>
              {[["NATURE","🌿 ธรรมชาติ"],["CAFE","☕ คาเฟ่"],["BEACH","🏖️ ชายหาด"],["ACCOMMODATION","🏨 ที่พัก"],["FOOD","🍲 อาหาร"],["TEMPLE","🛕 วัด"],["ADVENTURE","🧗 ผจญภัย"],["MARKET","🛍️ ตลาด"],["MUSEUM","🏛️ พิพิธภัณฑ์"],["CAMPING","⛺ แคมปิ้ง"]].map(([v,l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Message */}
        {claimMessage && (
          <div style={{ margin: "0 28px 16px", padding: "10px 14px", borderRadius: 10, background: claimMessage.startsWith("✅") ? "#f0fdf4" : "#fef2f2", color: claimMessage.startsWith("✅") ? "#15803d" : "#dc2626", fontSize: 13, fontWeight: 700, border: `1px solid ${claimMessage.startsWith("✅") ? "#bbf7d0" : "#fecaca"}` }}>
            {claimMessage}
          </div>
        )}

        {/* Results */}
        {claimResults.length > 0 && (
          <div style={{ padding: "0 28px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {claimResults.map(p => {
              const cover = p.communityCover || (p.coverUrl && p.coverUrl !== "/images/default-place.svg" ? p.coverUrl : null);
              return (
                <div key={p.slug} style={{ background: "white", border: "1.5px solid #f1f5f9", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(15,23,42,0.05)", transition: "box-shadow 0.2s" }}>
                  {/* Cover */}
                  <div style={{ height: 120, background: "#e2e8f0", position: "relative", overflow: "hidden" }}>
                    {cover
                      ? <img src={cover} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#e2e8f0,#f1f5f9)", fontSize: 32 }}>🏞️</div>
                    }
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,23,42,0.6) 0%, transparent 50%)", pointerEvents: "none" }} />
                    {p.province && (
                      <span style={{ position: "absolute", top: 8, left: 8, background: "rgba(255,255,255,0.9)", color: "#0f172a", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 999 }}>
                        {p.province?.split(" (")[0]}
                      </span>
                    )}
                    {p.business ? (
                      <span style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(245,158,11,0.85)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999 }}>
                        🏢 มีเจ้าของ
                      </span>
                    ) : (
                      <span style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(15,23,42,0.7)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999 }}>
                        ⭕ ไม่มีเจ้าของ
                      </span>
                    )}
                    {!p.business && (p.pendingClaimCount ?? 0) > 0 && (
                      <span style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(245,158,11,0.9)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999 }}>
                        🔥 {p.pendingClaimCount} คำขอ
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#1e293b", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: p.business ? 6 : 10 }}>📍 {[p.district, p.province?.split(" (")[0]].filter(Boolean).join(", ")}</div>
                    {p.business && (
                      <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, marginBottom: 8 }}>🏢 {p.business.businessName}</div>
                    )}
                    {p.business && p.business.id !== currentBizIdRef.current ? (
                      <DisputeButton slug={p.slug} claimingSlug={claimingSlug} onDispute={claimPlace} />
                    ) : !p.business ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <a href={`/place/${p.slug}`} target="_blank" rel="noreferrer"
                          style={{ flex: 1, padding: "8px 0", textAlign: "center", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                          ดูสถานที่
                        </a>
                        <button onClick={() => claimPlace(p.slug)} disabled={claimingSlug === p.slug}
                          style={{ flex: 2, padding: "8px 0", borderRadius: 10, border: "none", background: claimingSlug === p.slug ? "#e2e8f0" : "#10b981", color: claimingSlug === p.slug ? "#94a3b8" : "#fff", fontSize: 12, fontWeight: 800, cursor: claimingSlug === p.slug ? "wait" : "pointer", fontFamily: "inherit" }}>
                          {claimingSlug === p.slug ? "⏳ กำลังยืนยัน..." : "🏢 เป็นเจ้าของ"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!claimLoading && claimQuery.length >= 2 && claimResults.length === 0 && (
          <div style={{ padding: "32px 28px", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>ไม่พบสถานที่ที่ยังไม่มีเจ้าของ</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>ลองเปลี่ยนคำค้นหาหรือลองใหม่อีกครั้ง</div>
          </div>
        )}

        {!claimQuery && (
          <div style={{ padding: "24px 28px 28px", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 13 }}>พิมพ์ชื่อสถานที่เพื่อค้นหา</div>
          </div>
        )}
      </section>

      <style jsx>{`
        .dashboard-page { width: 100%; max-width: 1100px; margin: 0 auto; padding: 36px 24px 80px; }

        .dashboard-hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #0f766e 100%);
          border-radius: 28px; padding: 40px 48px; color: white;
          margin-bottom: 24px; position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: space-between; gap: 20px;
        }
        .dashboard-hero::before {
          content: ""; position: absolute; width: 320px; height: 320px;
          background: rgba(255,255,255,0.05); border-radius: 999px;
          top: -100px; right: -80px; pointer-events: none;
        }
        .dashboard-tag { font-size: 10px; letter-spacing: 3px; font-weight: 800; color: rgba(255,255,255,0.5); margin: 0 0 10px; text-transform: uppercase; }
        .dashboard-hero h1 { font-size: 36px; font-weight: 900; margin: 0 0 8px; line-height: 1.15; color: #ffffff; }
        .dashboard-hero span { display: block; color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.7; max-width: 520px; }

        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 12px; }
        .section-title { font-size: 18px; font-weight: 900; margin: 0; color: #0f172a; }
        .section-sub { font-size: 12px; color: #64748b; margin: 3px 0 0; }

        .manage-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }

        .claim-card { display: flex; align-items: center; gap: 14px; background: white; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 12px 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: box-shadow 0.2s; }
        .claim-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }

        @media (max-width: 768px) {
          .dashboard-page { padding: 20px 16px 60px; }
          .dashboard-hero { padding: 28px 24px; border-radius: 22px; flex-direction: column; align-items: flex-start; }
          .dashboard-hero h1 { font-size: 28px; }
        }
      `}</style>
    </div>
  );
}

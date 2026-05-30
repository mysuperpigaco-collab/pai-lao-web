"use client";
// ── PromotionSection ────────────────────────────────────────────
function PromotionSection() {
  const [promos, setPromos] = React.useState<any[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", description: "", discount: "", condition: "", startDate: "", endDate: "", coverUrl: "" });
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    fetch("/api/promotions").then(r => r.json()).then(d => setPromos(d.promotions || []));
  }, []);

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.startDate || !form.endDate) { setMsg("กรุณากรอกข้อมูลให้ครบ"); return; }
    setSaving(true); setMsg("");
    const res = await fetch("/api/promotions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (res.ok) { setMsg("✅ ส่งคำขอเรียบร้อย รอแอดมินอนุมัติ"); setShowForm(false); setForm({ title: "", description: "", discount: "", condition: "", startDate: "", endDate: "", coverUrl: "" }); }
    else setMsg("❌ " + (data.error || "เกิดข้อผิดพลาด"));
    setSaving(false);
  };

  return (
    <section style={{ marginTop: 48 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 900, margin: 0 }}>โปรโมชั่นของร้าน</h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>ขอเพิ่มโปรโมชั่นเพื่อดึงดูดลูกค้า</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#fff", borderRadius: "12px", fontWeight: 700, fontSize: "13px", border: "none", cursor: "pointer" }}>
          {showForm ? "ยกเลิก" : "+ ขอเพิ่มโปรโมชั่น"}
        </button>
      </div>
      {msg && <p style={{ fontWeight: 700, color: msg.startsWith("✅") ? "#15803d" : "#dc2626", marginBottom: 12 }}>{msg}</p>}
      {showForm && (
        <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1.5px solid #e2e8f0", marginBottom: "20px", maxWidth: "600px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 16px" }}>ข้อมูลโปรโมชั่น</h3>
          {[
            { label: "ชื่อโปรโมชั่น *", key: "title", placeholder: "เช่น โปรซัมเมอร์ ลด 20%" },
            { label: "รายละเอียด *", key: "description", placeholder: "รายละเอียดโปรโมชั่น" },
            { label: "ส่วนลด", key: "discount", placeholder: "เช่น ลด 20% หรือ ซื้อ 1 แถม 1" },
            { label: "เงื่อนไข", key: "condition", placeholder: "เช่น เมื่อซื้อขั้นต่ำ 200 บาท" },
          ].map(({ label, key, placeholder }) => (
            <div key={key} style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>{label}</label>
              {key === "description" ? (
                <textarea value={form[key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} rows={3} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "13px", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              ) : (
                <input value={form[key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "13px", boxSizing: "border-box" }} />
              )}
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>วันเริ่ม *</label>
              <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "13px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>วันหมดอายุ *</label>
              <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "13px", boxSizing: "border-box" }} />
            </div>
          </div>
          <button onClick={handleSubmit} disabled={saving} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#fff", borderRadius: "12px", fontWeight: 700, fontSize: "14px", border: "none", cursor: saving ? "wait" : "pointer" }}>
            {saving ? "กำลังส่ง..." : "ส่งคำขอโปรโมชั่น"}
          </button>
        </div>
      )}
      {promos.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "600px" }}>
          {promos.slice(0, 3).map((p: any) => (
            <div key={p.id} style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: "12px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>{p.title}</div>
                {p.discount && <div style={{ fontSize: "12px", color: "#ef4444", fontWeight: 600 }}>{p.discount}</div>}
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>{new Date(p.startDate).toLocaleDateString("th-TH")} – {new Date(p.endDate).toLocaleDateString("th-TH")}</div>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, background: "#f0fdf4", color: "#059669", padding: "3px 10px", borderRadius: "999px" }}>กำลังแสดง</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import BusinessProfileCard from "@/components/business/BusinessProfileCard";
import BusinessPlaceCard from "@/components/business/BusinessPlaceCard";
import BusinessNotifications from "@/components/business/BusinessNotifications";

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

export default function BusinessDashboardPage() {
  const [data, setData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Claim place search state
  const [claimQuery, setClaimQuery] = useState("");
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
        else { setData(d); }
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
  const searchUnclaimedPlaces = (q: string) => {
    setClaimQuery(q);
    if (claimTimerRef.current) clearTimeout(claimTimerRef.current);
    if (!q.trim() || q.length < 2) { setClaimResults([]); return; }
    claimTimerRef.current = setTimeout(async () => {
      setClaimLoading(true);
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(q)}&limit=8`);
        const data = await res.json();
        setClaimResults((data.places ?? []).filter((p: any) => !p.business));
      } catch {}
      setClaimLoading(false);
    }, 400);
  };
  const claimPlace = async (slug: string) => {
    setClaimingSlug(slug);
    setClaimMessage("");
    try {
      const res = await fetch(`/api/places/${slug}/claim`, { method: "POST" });
      const d = await res.json();
      setClaimMessage(res.ok ? `✅ ${d.message}` : `❌ ${d.message}`);
      if (res.ok) {
        setClaimResults(prev => prev.filter(p => p.slug !== slug));
        fetchData(); // refresh dashboard
      }
    } catch { setClaimMessage("❌ เกิดข้อผิดพลาด"); }
    setClaimingSlug(null);
  };

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:"60px 20px"}}>
        <div style={{width:52,height:52,borderRadius:"50%",border:"3px solid #e2e8f0",borderTopColor:"#10b981",animation:"_spin 0.8s linear infinite"}}/>
        <p style={{fontSize:14,color:"#94a3b8",margin:0}}>กำลังโหลดข้อมูล...</p>
        <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 900, margin: 0 }}>สถานที่ของคุณ</h2>
          <p style={{ color: "#64748b", fontSize: "13px", margin: "4px 0 0" }}>
            {places.length} สถานที่ · จัดการและแก้ไขข้อมูลได้ที่นี่
          </p>
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
            />
          ))}
        </section>
      )}

      {/* ── Claim unclaimed places ───────────────────────────── */}
      <section style={{ marginTop: 48 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 900, margin: 0 }}>ค้นหาและยืนยันความเป็นเจ้าของสถานที่</h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>
              Claim Place · สถานที่ที่นักท่องเที่ยวเพิ่มไว้ที่ยังไม่มีเจ้าของ
            </p>
          </div>
        </div>
        <div style={{ position: "relative", maxWidth: 520 }}>
          <input
            type="text"
            value={claimQuery}
            onChange={e => searchUnclaimedPlaces(e.target.value)}
            placeholder="🔍 ค้นหาชื่อสถานที่..."
            style={{
              width: "100%", padding: "12px 16px", fontSize: 14, borderRadius: 12,
              border: "1.5px solid #e2e8f0", outline: "none", fontFamily: "inherit",
              boxSizing: "border-box", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          />
          {claimLoading && (
            <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#94a3b8" }}>🔍...</span>
          )}
        </div>
        {claimMessage && (
          <p style={{ marginTop: 10, fontSize: 13, fontWeight: 700,
            color: claimMessage.startsWith("✅") ? "#15803d" : "#dc2626" }}>
            {claimMessage}
          </p>
        )}
        {claimResults.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10, maxWidth: 640 }}>
            {claimResults.map(p => (
              <div key={p.slug} style={{
                display: "flex", alignItems: "center", gap: 14, background: "#fff",
                border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "12px 16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}>
                {p.coverUrl && (
                  <img src={p.coverUrl} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#1e293b" }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>📍 {p.district}, {p.province}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>⭕ ยังไม่มีเจ้าของ</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <a href={`/place/${p.slug}`} target="_blank" rel="noreferrer"
                    style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                    ดู
                  </a>
                  <button
                    onClick={() => claimPlace(p.slug)}
                    disabled={claimingSlug === p.slug}
                    style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: claimingSlug === p.slug ? 0.7 : 1 }}>
                    {claimingSlug === p.slug ? "⏳..." : "🏢 เป็นเจ้าของ"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!claimLoading && claimQuery.length >= 2 && claimResults.length === 0 && (
          <p style={{ marginTop: 12, fontSize: 13, color: "#94a3b8" }}>
            ไม่พบสถานที่ที่ยังไม่มีเจ้าของ หรือสถานที่นั้นมีเจ้าของแล้ว
          </p>
        )}
      </section>

      {/* ── Promotion Request Section ───────────────────────────── */}
      <PromotionSection />

      <style jsx>{`
        .dashboard-page { width: 100%; max-width: 1440px; margin: 0 auto; padding: 40px 24px 80px; }

        .dashboard-hero {
          background: linear-gradient(135deg, #0f172a, #1e3a8a, #0f766e);
          border-radius: 36px; padding: 48px; color: white;
          margin-bottom: 24px; position: relative; overflow: hidden;
        }
        .dashboard-hero::before {
          content: ""; position: absolute; width: 400px; height: 400px;
          background: rgba(255,255,255,0.06); border-radius: 999px;
          top: -120px; right: -120px;
        }
        .dashboard-tag { font-size: 11px; letter-spacing: 2.5px; font-weight: 800; color: rgba(255,255,255,0.6); margin: 0 0 12px; }
        .dashboard-hero h1 { font-size: 44px; font-weight: 900; margin: 0 0 12px; line-height: 1.1; color: #ffffff; }
        .dashboard-hero span { display: block; color: rgba(255,255,255,0.75); font-size: 15px; line-height: 1.7; max-width: 640px; }

        .manage-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }

        @media (max-width: 768px) {
          .dashboard-page { padding: 24px 16px 60px; }
          .dashboard-hero { padding: 32px 24px; border-radius: 28px; }
          .dashboard-hero h1 { font-size: 32px; }
        }
      `}</style>
    </div>
  );
}

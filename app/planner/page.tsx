"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { PROVINCES, getDistricts } from "@/data/thailand";

interface PlanStop {
  id: string; order: number; name: string;
  province?: string; district?: string;
  notes?: string; googleMapsUrl?: string; stopType?: string;
  placeId?: string;
  place?: { id: string; slug: string; title: string; province?: string; district?: string; coverUrl?: string; googleMapsUrl?: string };
}
interface Plan {
  id: string; title: string; description?: string;
  startDate?: string; endDate?: string; province?: string; isPublic: boolean;
  stops: PlanStop[];
}
interface PlaceResult {
  id: string; slug: string; title: string; province: string;
  district?: string; category: string; coverUrl?: string; googleMapsUrl?: string;
}
interface BmTrip {
  id: string; slug: string; title: string; coverUrl?: string;
  timeline: {
    id: string; order: number; placeName: string; province: string;
    district?: string; description?: string; googleMapsUrl?: string;
    stopType?: string; placeId?: string;
  }[];
}

const STOP_TYPES = [
  { v: "ATTRACTION", label: "ที่เที่ยว", icon: "🏞️", color: "#3b82f6" },
  { v: "EAT",        label: "ร้านอาหาร", icon: "🍽️", color: "#f59e0b" },
  { v: "SLEEP",      label: "ที่พัก",    icon: "🏨", color: "#8b5cf6" },
  { v: "ACTIVITY",   label: "กิจกรรม",  icon: "🎯", color: "#10b981" },
  { v: "TRANSPORT",  label: "เดินทาง",  icon: "🚌", color: "#64748b" },
];
const ST = (v?: string) => STOP_TYPES.find(t => t.v === v) ?? STOP_TYPES[0];

const si: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0",
  background: "#f8fafc", fontSize: 13, fontFamily: "inherit", outline: "none",
  boxSizing: "border-box" as const, color: "#1e293b",
};
const ib: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 8, border: "1.5px solid #e2e8f0",
  background: "#f8fafc", color: "#64748b", fontWeight: 700, fontSize: 13,
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  fontFamily: "inherit",
};

export default function PlannerPage() {
  const { user } = useAuth();
  const router   = useRouter();

  useEffect(() => {
    if (user === null) router.replace("/login");
    if (user && (user.role === "ADMIN" || user.role === "SUPERADMIN")) router.replace("/admin");
  }, [user, router]);

  // ── Plans state ────────────────────────────────────────
  const [plans,        setPlans       ] = useState<Plan[]>([]);
  const [activePlan,   setActivePlan  ] = useState<Plan | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // ── New plan form ──────────────────────────────────────
  const [showNew,  setShowNew ] = useState(false);
  const [nTitle,   setNTitle  ] = useState("");
  const [nDesc,    setNDesc   ] = useState("");
  const [nStart,   setNStart  ] = useState("");
  const [nEnd,     setNEnd    ] = useState("");
  const [nProv,    setNProv   ] = useState("");
  const [creating, setCreating] = useState(false);

  // ── Right panel ────────────────────────────────────────
  const [rightTab, setRightTab] = useState<"search"|"bookmarks">("search");

  // ── Place search ───────────────────────────────────────
  const [sQ,   setSQ  ] = useState("");
  const [sProv, setSProv] = useState("");
  const [sDist, setSDist] = useState("");
  const [sCat,  setSCat ] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Bookmarks ──────────────────────────────────────────
  const [bmTrips,      setBmTrips    ] = useState<BmTrip[]>([]);
  const [loadingBm,    setLoadingBm  ] = useState(false);
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);

  // ── Stop edit ──────────────────────────────────────────
  const [editStop,   setEditStop  ] = useState<PlanStop | null>(null);
  const [editNotes,  setEditNotes ] = useState("");
  const [editMaps,   setEditMaps  ] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // ── Add-stop type picker (for custom stops) ───────────
  const [addingCustom, setAddingCustom] = useState(false);
  const [customName,   setCustomName  ] = useState("");
  const [customProv,   setCustomProv  ] = useState("");
  const [customDist,   setCustomDist  ] = useState("");
  const [customType,   setCustomType  ] = useState("ATTRACTION");
  const [customMaps,   setCustomMaps  ] = useState("");

  // ── Load plans ─────────────────────────────────────────
  const loadPlans = useCallback(async () => {
    setLoadingPlans(true);
    try {
      const res = await fetch("/api/planner");
      if (res.ok) {
        const d = await res.json();
        setPlans(d.plans ?? []);
        if (d.plans?.length > 0 && !activePlan) setActivePlan(d.plans[0]);
      }
    } catch {}
    setLoadingPlans(false);
  }, []); // eslint-disable-line

  useEffect(() => { if (user) loadPlans(); }, [user]); // eslint-disable-line

  const reloadPlan = async (id: string) => {
    const res = await fetch(`/api/planner/${id}`);
    if (res.ok) {
      const d = await res.json();
      setActivePlan(d.plan);
      setPlans(prev => prev.map(p => p.id === id ? d.plan : p));
    }
  };

  // ── Create plan ────────────────────────────────────────
  const createPlan = async () => {
    if (!nTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/planner", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nTitle, description: nDesc, startDate: nStart, endDate: nEnd, province: nProv }),
      });
      if (res.ok) {
        const d = await res.json();
        setPlans(prev => [d.plan, ...prev]);
        setActivePlan(d.plan);
        setShowNew(false);
        setNTitle(""); setNDesc(""); setNStart(""); setNEnd(""); setNProv("");
      }
    } catch {}
    setCreating(false);
  };

  const deletePlan = async (id: string) => {
    if (!confirm("ลบแผนนี้?")) return;
    await fetch(`/api/planner/${id}`, { method: "DELETE" });
    const remaining = plans.filter(p => p.id !== id);
    setPlans(remaining);
    setActivePlan(activePlan?.id === id ? (remaining[0] ?? null) : activePlan);
  };

  const togglePublic = async () => {
    if (!activePlan) return;
    const res = await fetch(`/api/planner/${activePlan.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle-public" }),
    });
    if (res.ok) { const d = await res.json(); setActivePlan(p => p ? { ...p, isPublic: d.plan.isPublic } : p); }
  };

  const addStop = async (stop: { name: string; province?: string; district?: string; googleMapsUrl?: string; stopType?: string; placeId?: string }) => {
    if (!activePlan) return;
    const res = await fetch(`/api/planner/${activePlan.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add-stop", ...stop }),
    });
    if (res.ok) reloadPlan(activePlan.id);
  };

  const removeStop = async (stopId: string) => {
    if (!activePlan) return;
    await fetch(`/api/planner/${activePlan.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove-stop", stopId }),
    });
    reloadPlan(activePlan.id);
  };

  const moveStop = async (stopId: string, direction: "up"|"down") => {
    if (!activePlan) return;
    await fetch(`/api/planner/${activePlan.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "move-stop", stopId, direction }),
    });
    reloadPlan(activePlan.id);
  };

  const saveStopEdit = async () => {
    if (!editStop || !activePlan) return;
    setSavingEdit(true);
    await fetch(`/api/planner/${activePlan.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-stop", stopId: editStop.id, notes: editNotes, googleMapsUrl: editMaps }),
    });
    setSavingEdit(false); setEditStop(null);
    reloadPlan(activePlan.id);
  };

  const addCustomStop = async () => {
    if (!customName.trim()) return;
    await addStop({ name: customName, province: customProv, district: customDist, googleMapsUrl: customMaps, stopType: customType });
    setCustomName(""); setCustomProv(""); setCustomDist(""); setCustomMaps(""); setCustomType("ATTRACTION");
    setAddingCustom(false);
  };

  // ── Search places ──────────────────────────────────────
  const doSearch = useCallback(async () => {
    if (!sQ.trim() && !sProv) { setPlaceResults([]); return; }
    setSearching(true);
    try {
      const p = new URLSearchParams();
      if (sQ)    p.set("q",        sQ);
      if (sProv) p.set("province", sProv);
      if (sDist) p.set("district", sDist);
      if (sCat)  p.set("category", sCat);
      p.set("limit", "20");
      const res = await fetch(`/api/places?${p}`);
      if (res.ok) { const d = await res.json(); setPlaceResults(d.places ?? []); }
    } catch {}
    setSearching(false);
  }, [sQ, sProv, sDist, sCat]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(doSearch, 400);
  }, [doSearch]);

  // ── Load bookmarks ─────────────────────────────────────
  useEffect(() => {
    if (rightTab !== "bookmarks") return;
    if (bmTrips.length > 0) return;
    setLoadingBm(true);
    fetch("/api/planner/bookmarks")
      .then(r => r.json())
      .then(d => setBmTrips(d.trips ?? []))
      .catch(() => {})
      .finally(() => setLoadingBm(false));
  }, [rightTab]); // eslint-disable-line

  const shareUrl = typeof window !== "undefined" && activePlan?.isPublic
    ? `${window.location.origin}/planner/${activePlan.id}` : null;

  const copyLink = () => { if (shareUrl) { navigator.clipboard.writeText(shareUrl); alert("คัดลอกลิงก์แล้ว! · Link copied!"); } };

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
      {/* ── Sticky header ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 20px",
        display: "flex", alignItems: "center", gap: 12, height: 60,
        position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/dashboard" style={{ color: "#64748b", textDecoration: "none", fontSize: 22 }}>←</Link>
        <span style={{ fontWeight: 900, fontSize: 17, color: "#1e293b", flex: 1 }}>
          📅 วางแผนเที่ยว · Trip Planner
        </span>
        {activePlan && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={togglePublic} style={{ padding: "6px 14px", borderRadius: 10, border: "1.5px solid",
              borderColor: activePlan.isPublic ? "#10b981" : "#e2e8f0",
              background: activePlan.isPublic ? "#ecfdf5" : "#f8fafc",
              color: activePlan.isPublic ? "#065f46" : "#64748b",
              fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              {activePlan.isPublic ? "🌐 สาธารณะ" : "🔒 ส่วนตัว"}
            </button>
            {activePlan.isPublic && shareUrl && (
              <button onClick={copyLink} style={{ padding: "6px 14px", borderRadius: 10,
                border: "1.5px solid #3b82f6", background: "#eff6ff", color: "#1d4ed8",
                fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                🔗 แชร์ลิงก์
              </button>
            )}
            <Link href={`/planner/${activePlan.id}`} target="_blank"
              style={{ padding: "6px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                background: "#f8fafc", color: "#374151", fontWeight: 700, fontSize: 12,
                textDecoration: "none" }}>
              🖨️ พิมพ์ / PDF
            </Link>
          </div>
        )}
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 60px)", overflow: "hidden" }}>

        {/* ── LEFT: Plans list ── */}
        <div style={{ width: 240, borderRight: "1px solid #e2e8f0", background: "#fff",
          display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "14px 14px 10px" }}>
            <button onClick={() => setShowNew(!showNew)}
              style={{ width: "100%", padding: "10px", borderRadius: 12,
                border: "2px dashed #3b82f6", background: "#f0f7ff", color: "#3b82f6",
                fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              + สร้างแผนใหม่
            </button>
          </div>

          {showNew && (
            <div style={{ padding: "0 14px 14px", borderBottom: "1px solid #f1f5f9" }}>
              <input value={nTitle} onChange={e => setNTitle(e.target.value)}
                placeholder="ชื่อแผน *" style={{ ...si, marginBottom: 6 }} />
              <input value={nDesc} onChange={e => setNDesc(e.target.value)}
                placeholder="คำอธิบาย" style={{ ...si, marginBottom: 6 }} />
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <input type="date" value={nStart} onChange={e => setNStart(e.target.value)}
                  style={{ ...si, flex: 1 }} />
                <input type="date" value={nEnd} onChange={e => setNEnd(e.target.value)}
                  style={{ ...si, flex: 1 }} />
              </div>
              <select value={nProv} onChange={e => setNProv(e.target.value)}
                style={{ ...si, marginBottom: 8 }}>
                <option value="">จังหวัดหลัก</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={createPlan} disabled={creating || !nTitle.trim()}
                  style={{ flex: 1, padding: "8px", borderRadius: 10, border: "none",
                    background: nTitle.trim() ? "#3b82f6" : "#e2e8f0",
                    color: nTitle.trim() ? "#fff" : "#94a3b8",
                    fontWeight: 700, fontSize: 12, cursor: nTitle.trim() ? "pointer" : "not-allowed",
                    fontFamily: "inherit" }}>
                  {creating ? "⏳" : "✓ สร้าง"}
                </button>
                <button onClick={() => setShowNew(false)}
                  style={{ flex: 1, padding: "8px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                    background: "#fff", color: "#64748b", fontWeight: 700, fontSize: 12,
                    cursor: "pointer", fontFamily: "inherit" }}>
                  ยกเลิก
                </button>
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto" }}>
            {loadingPlans ? (
              <div style={{ padding: 16, color: "#94a3b8", textAlign: "center", fontSize: 13 }}>กำลังโหลด...</div>
            ) : plans.length === 0 ? (
              <div style={{ padding: 20, color: "#94a3b8", textAlign: "center", fontSize: 12, lineHeight: 1.8 }}>
                ยังไม่มีแผนเที่ยว<br />กด &ldquo;+ สร้างแผนใหม่&rdquo;
              </div>
            ) : plans.map(plan => (
              <div key={plan.id} onClick={() => setActivePlan(plan)}
                style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9", cursor: "pointer",
                  background: activePlan?.id === plan.id ? "#eff6ff" : "transparent",
                  borderLeft: activePlan?.id === plan.id ? "3px solid #3b82f6" : "3px solid transparent" }}>
                <div style={{ fontWeight: 700, fontSize: 13,
                  color: activePlan?.id === plan.id ? "#1d4ed8" : "#1e293b" }}>
                  {plan.title}
                </div>
                {(plan.startDate || plan.province) && (
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    {plan.startDate && <span>{plan.startDate}</span>}
                    {plan.province && <span> · {plan.province}</span>}
                  </div>
                )}
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                  📍 {plan.stops.length} จุด &nbsp;{plan.isPublic ? "🌐" : "🔒"}
                </div>
                {activePlan?.id === plan.id && (
                  <button onClick={e => { e.stopPropagation(); deletePlan(plan.id); }}
                    style={{ marginTop: 6, padding: "3px 10px", borderRadius: 8,
                      border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626",
                      fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    🗑️ ลบแผน
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── MIDDLE: Itinerary ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", minWidth: 0 }}>
          {!activePlan ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: "100%", gap: 16, color: "#94a3b8", textAlign: "center" }}>
              <div style={{ fontSize: 56 }}>📅</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: "#64748b" }}>เลือกหรือสร้างแผนเที่ยว</div>
              <div style={{ fontSize: 13, maxWidth: 300, lineHeight: 1.7 }}>
                ค้นหาสถานที่จากแผงขวา · ดึงจุดแวะจากทริปที่บุ๊คมาร์ค<br />จัดลำดับ · แชร์ · พิมพ์เป็น PDF
              </div>
              <button onClick={() => setShowNew(true)}
                style={{ padding: "12px 28px", borderRadius: 14, border: "none",
                  background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff",
                  fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>
                + สร้างแผนแรก
              </button>
            </div>
          ) : (
            <>
              {/* Plan header card */}
              <div style={{ background: "#fff", borderRadius: 20, padding: "18px 20px",
                marginBottom: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#1e293b" }}>
                  {activePlan.title}
                </h2>
                {activePlan.description && (
                  <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>{activePlan.description}</p>
                )}
                <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 13, color: "#64748b", flexWrap: "wrap" as const }}>
                  {activePlan.startDate && (
                    <span>📅 {activePlan.startDate}{activePlan.endDate ? ` – ${activePlan.endDate}` : ""}</span>
                  )}
                  {activePlan.province && <span>📍 {activePlan.province}</span>}
                  <span>🚩 {activePlan.stops.length} จุดหมาย</span>
                </div>
              </div>

              {/* Custom stop button */}
              <div style={{ marginBottom: 14 }}>
                {!addingCustom ? (
                  <button onClick={() => setAddingCustom(true)}
                    style={{ padding: "9px 18px", borderRadius: 12,
                      border: "2px dashed #10b981", background: "#f0fdf4",
                      color: "#059669", fontWeight: 700, fontSize: 13,
                      cursor: "pointer", fontFamily: "inherit" }}>
                    ✏️ เพิ่มจุดแวะเอง · Add Custom Stop
                  </button>
                ) : (
                  <div style={{ background: "#fff", borderRadius: 16, padding: "16px",
                    border: "1.5px solid #6ee7b7", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#065f46", marginBottom: 10 }}>
                      ✏️ เพิ่มจุดแวะเอง
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, marginBottom: 10 }}>
                      {STOP_TYPES.map(t => (
                        <button key={t.v} type="button" onClick={() => setCustomType(t.v)}
                          style={{ padding: "5px 12px", borderRadius: 12, border: "2px solid",
                            borderColor: customType === t.v ? t.color : "#e2e8f0",
                            background: customType === t.v ? t.color + "18" : "#f8fafc",
                            color: customType === t.v ? t.color : "#64748b",
                            fontWeight: customType === t.v ? 800 : 500, fontSize: 12,
                            cursor: "pointer", fontFamily: "inherit" }}>
                          {t.icon} {t.label}
                        </button>
                      ))}
                    </div>
                    <input value={customName} onChange={e => setCustomName(e.target.value)}
                      placeholder="ชื่อสถานที่ *" style={{ ...si, marginBottom: 6 }} />
                    <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                      <select value={customProv} onChange={e => { setCustomProv(e.target.value); setCustomDist(""); }}
                        style={{ ...si, flex: 1 }}>
                        <option value="">จังหวัด</option>
                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <select value={customDist} onChange={e => setCustomDist(e.target.value)}
                        disabled={!customProv} style={{ ...si, flex: 1 }}>
                        <option value="">อำเภอ</option>
                        {getDistricts(customProv).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <input value={customMaps} onChange={e => setCustomMaps(e.target.value)}
                      placeholder="🗺️ Google Maps URL (ไม่บังคับ)" style={{ ...si, marginBottom: 10 }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={addCustomStop} disabled={!customName.trim()}
                        style={{ flex: 1, padding: "9px", borderRadius: 10, border: "none",
                          background: customName.trim() ? "#10b981" : "#e2e8f0",
                          color: customName.trim() ? "#fff" : "#94a3b8",
                          fontWeight: 700, fontSize: 13, cursor: customName.trim() ? "pointer" : "not-allowed",
                          fontFamily: "inherit" }}>
                        + เพิ่มจุดนี้
                      </button>
                      <button onClick={() => setAddingCustom(false)}
                        style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                          background: "#fff", color: "#64748b", fontWeight: 700, fontSize: 13,
                          cursor: "pointer", fontFamily: "inherit" }}>
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Stops list */}
              {activePlan.stops.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#64748b" }}>ยังไม่มีจุดหมาย</div>
                  <div style={{ fontSize: 13 }}>ค้นหาสถานที่จากแผงขวา หรือกด &ldquo;เพิ่มจุดแวะเอง&rdquo;</div>
                </div>
              ) : (
                <div>
                  {activePlan.stops.map((stop, idx) => {
                    const meta = ST(stop.stopType);
                    return (
                      <div key={stop.id} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%",
                            background: meta.color, color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                            {meta.icon}
                          </div>
                          {idx < activePlan.stops.length - 1 && (
                            <div style={{ width: 2, flex: 1, minHeight: 12, background: "#e2e8f0", margin: "4px 0" }} />
                          )}
                        </div>
                        <div style={{ flex: 1, background: "#fff", borderRadius: 16,
                          padding: "14px 16px", border: "1px solid #e2e8f0",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                                <span style={{ fontWeight: 800, fontSize: 15, color: "#1e293b" }}>{stop.name}</span>
                                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20,
                                  background: meta.color + "18", color: meta.color, fontWeight: 700, flexShrink: 0 }}>
                                  {meta.label}
                                </span>
                              </div>
                              {(stop.province || stop.district) && (
                                <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                                  📍 {[stop.province, stop.district].filter(Boolean).join(" · ")}
                                </div>
                              )}
                              {stop.notes && (
                                <p style={{ margin: "8px 0 0", fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{stop.notes}</p>
                              )}
                              {stop.googleMapsUrl && (
                                <a href={stop.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                                  style={{ display: "inline-flex", alignItems: "center", gap: 4,
                                    marginTop: 8, fontSize: 12, color: "#3b82f6", fontWeight: 700,
                                    textDecoration: "none", padding: "4px 10px", borderRadius: 8,
                                    border: "1px solid #bfdbfe", background: "#eff6ff" }}>
                                  🗺️ Google Maps
                                </a>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 4, flexShrink: 0, marginLeft: 8 }}>
                              <button onClick={() => moveStop(stop.id, "up")} disabled={idx === 0}
                                style={{ ...ib, opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                              <button onClick={() => moveStop(stop.id, "down")}
                                disabled={idx === activePlan.stops.length - 1}
                                style={{ ...ib, opacity: idx === activePlan.stops.length - 1 ? 0.3 : 1 }}>↓</button>
                              <button onClick={() => {
                                setEditStop(stop); setEditNotes(stop.notes ?? ""); setEditMaps(stop.googleMapsUrl ?? "");
                              }} style={{ ...ib, background: "#eff6ff", color: "#3b82f6" }}>✏️</button>
                              <button onClick={() => removeStop(stop.id)}
                                style={{ ...ib, background: "#fef2f2", color: "#dc2626" }}>✕</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── RIGHT: Search + Bookmarks ── */}
        <div style={{ width: 300, borderLeft: "1px solid #e2e8f0", background: "#fff",
          display: "flex", flexDirection: "column", flexShrink: 0 }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0" }}>
            {([ ["search","🔍 ค้นหาสถานที่"], ["bookmarks","🔖 ทริปบุ๊คมาร์ค"] ] as const).map(([key, label]) => (
              <button key={key} onClick={() => setRightTab(key)}
                style={{ flex: 1, padding: "12px 6px",
                  borderBottom: rightTab === key ? "3px solid #3b82f6" : "3px solid transparent",
                  border: "none", background: "none",
                  fontWeight: rightTab === key ? 800 : 500,
                  fontSize: 11.5, color: rightTab === key ? "#1d4ed8" : "#64748b",
                  cursor: "pointer", fontFamily: "inherit" }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── Search tab ── */}
          {rightTab === "search" && (
            <div style={{ padding: 12, overflowY: "auto", flex: 1 }}>
              <input value={sQ} onChange={e => setSQ(e.target.value)}
                placeholder="ชื่อสถานที่..." style={{ ...si, marginBottom: 6 }} />
              <select value={sProv} onChange={e => { setSProv(e.target.value); setSDist(""); }}
                style={{ ...si, marginBottom: 6 }}>
                <option value="">ทุกจังหวัด</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {sProv && (
                <select value={sDist} onChange={e => setSDist(e.target.value)}
                  style={{ ...si, marginBottom: 6 }}>
                  <option value="">ทุกอำเภอ</option>
                  {getDistricts(sProv).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )}
              <select value={sCat} onChange={e => setSCat(e.target.value)}
                style={{ ...si, marginBottom: 10 }}>
                <option value="">ทุกประเภท</option>
                <option value="NATURE">🌿 ธรรมชาติ</option>
                <option value="TEMPLE">🛕 วัด</option>
                <option value="CAFE">☕ คาเฟ่</option>
                <option value="FOOD">🍲 อาหาร</option>
                <option value="BEACH">🏖️ ชายหาด</option>
                <option value="MARKET">🛍️ ตลาด</option>
                <option value="ADVENTURE">🧗 ผจญภัย</option>
                <option value="MUSEUM">🏛️ พิพิธภัณฑ์</option>
                <option value="ACCOMMODATION">🏨 ที่พัก</option>
                <option value="CAMPING">⛺ แคมปิ้ง</option>
              </select>

              {searching && <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, padding: "8px 0" }}>🔍 ค้นหา...</div>}

              {!searching && placeResults.length === 0 && !sQ && !sProv && (
                <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, padding: "20px 0", lineHeight: 1.8 }}>
                  พิมพ์ชื่อสถานที่<br />หรือเลือกจังหวัด<br />เพื่อค้นหา
                </div>
              )}

              {placeResults.map(p => (
                <div key={p.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12,
                  padding: "10px", marginBottom: 8, background: "#fafafa" }}>
                  {p.coverUrl && (
                    <img src={p.coverUrl} alt="" style={{ width: "100%", height: 70,
                      objectFit: "cover", borderRadius: 8, marginBottom: 6 }} />
                  )}
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
                    📍 {p.province}{p.district ? ` · ${p.district}` : ""} · {p.category}
                  </div>
                  <button disabled={!activePlan} onClick={() => addStop({
                    name: p.title, province: p.province, district: p.district,
                    googleMapsUrl: p.googleMapsUrl, stopType: "ATTRACTION", placeId: p.id,
                  })} style={{ width: "100%", padding: "7px", borderRadius: 8, border: "none",
                    background: activePlan ? "#3b82f6" : "#e2e8f0",
                    color: activePlan ? "#fff" : "#94a3b8",
                    fontWeight: 700, fontSize: 12,
                    cursor: activePlan ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                    {activePlan ? "+ เพิ่มในแผน" : "เลือกแผนก่อน"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── Bookmarks tab ── */}
          {rightTab === "bookmarks" && (
            <div style={{ overflowY: "auto", flex: 1, padding: 12 }}>
              {loadingBm ? (
                <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, padding: "20px 0" }}>กำลังโหลด...</div>
              ) : bmTrips.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, padding: "20px 0", lineHeight: 1.8 }}>
                  ยังไม่มีทริปที่บุ๊คมาร์ค<br />ลองไปกด 🔖 ในหน้าทริปที่ชอบก่อน
                </div>
              ) : bmTrips.map(trip => (
                <div key={trip.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12,
                  marginBottom: 10, overflow: "hidden" }}>
                  {/* Trip header */}
                  <div onClick={() => setExpandedTrip(expandedTrip === trip.id ? null : trip.id)}
                    style={{ display: "flex", gap: 8, padding: "10px 12px", cursor: "pointer",
                      background: expandedTrip === trip.id ? "#eff6ff" : "#fafafa",
                      alignItems: "center" }}>
                    {trip.coverUrl && (
                      <img src={trip.coverUrl} alt="" style={{ width: 40, height: 32,
                        objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: "#1e293b",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                        {trip.title}
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{trip.timeline?.length ?? 0} จุดแวะ</div>
                    </div>
                    <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>
                      {expandedTrip === trip.id ? "▲" : "▼"}
                    </span>
                  </div>
                  {/* Stops */}
                  {expandedTrip === trip.id && trip.timeline?.map((stop, si2) => {
                    const meta = ST(stop.stopType);
                    return (
                      <div key={si2} style={{ display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 12px", borderTop: "1px solid #f1f5f9" }}>
                        <span style={{ fontSize: 14, flexShrink: 0 }}>{meta.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: "#1e293b",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                            {stop.placeName}
                          </div>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>
                            {[stop.province, stop.district].filter(Boolean).join(" · ")}
                          </div>
                        </div>
                        <button disabled={!activePlan} onClick={() => addStop({
                          name: stop.placeName, province: stop.province,
                          district: stop.district, googleMapsUrl: stop.googleMapsUrl ?? undefined,
                          stopType: stop.stopType ?? "ATTRACTION", placeId: stop.placeId ?? undefined,
                        })} style={{ flexShrink: 0, padding: "4px 10px", borderRadius: 8, border: "none",
                          background: activePlan ? "#3b82f6" : "#e2e8f0",
                          color: activePlan ? "#fff" : "#94a3b8",
                          fontWeight: 700, fontSize: 11,
                          cursor: activePlan ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                          +
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Edit stop modal ── */}
      {editStop && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 24, width: "100%", maxWidth: 440 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>
              ✏️ แก้ไข: {editStop.name}
            </h3>
            <label style={{ display: "block", fontWeight: 700, fontSize: 12, color: "#374151", marginBottom: 6 }}>
              📝 หมายเหตุ / Notes
            </label>
            <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
              style={{ ...si, height: 80, resize: "vertical" as const, marginBottom: 12 }} />
            <label style={{ display: "block", fontWeight: 700, fontSize: 12, color: "#374151", marginBottom: 6 }}>
              🗺️ Google Maps URL
            </label>
            <input value={editMaps} onChange={e => setEditMaps(e.target.value)}
              placeholder="https://maps.google.com/..." style={{ ...si, marginBottom: 16 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={saveStopEdit} disabled={savingEdit}
                style={{ flex: 1, padding: "11px", borderRadius: 12, border: "none",
                  background: "#3b82f6", color: "#fff", fontWeight: 800, fontSize: 14,
                  cursor: "pointer", fontFamily: "inherit" }}>
                {savingEdit ? "⏳..." : "✓ บันทึก"}
              </button>
              <button onClick={() => setEditStop(null)}
                style={{ flex: 1, padding: "11px", borderRadius: 12, border: "1.5px solid #e2e8f0",
                  background: "#f8fafc", color: "#374151", fontWeight: 700, fontSize: 14,
                  cursor: "pointer", fontFamily: "inherit" }}>
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { PROVINCES, getDistricts } from "@/data/thailand";

interface PlanStop {
  id: string; order: number; name: string; day: number;
  province?: string; district?: string;
  notes?: string; googleMapsUrl?: string; stopType?: string;
  arrivalTime?: string; duration?: number;
  placeId?: string;
  place?: { id: string; slug: string; title: string; coverUrl?: string; googleMapsUrl?: string };
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
  timeline: { id: string; order: number; placeName: string; province: string; district?: string; description?: string; googleMapsUrl?: string; stopType?: string; placeId?: string }[];
}

const STOP_TYPES = [
  { v: "ATTRACTION", label: "ที่เที่ยว · Attraction", icon: "🏞️", color: "#3b82f6", bg: "#eff6ff" },
  { v: "EAT",        label: "ร้านอาหาร · Eat",         icon: "🍽️", color: "#f59e0b", bg: "#fffbeb" },
  { v: "SLEEP",      label: "ที่พัก · Stay",            icon: "🏨", color: "#8b5cf6", bg: "#f5f3ff" },
  { v: "ACTIVITY",   label: "กิจกรรม · Activity",       icon: "🎯", color: "#10b981", bg: "#ecfdf5" },
  { v: "TRANSPORT",  label: "เดินทาง · Transport",      icon: "🚌", color: "#64748b", bg: "#f8fafc" },
];
const ST = (v?: string) => STOP_TYPES.find(t => t.v === v) ?? STOP_TYPES[0];

export default function PlannerPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (user === null) router.replace("/login");
    if (user && (user.role === "ADMIN" || user.role === "SUPERADMIN")) router.replace("/admin");
  }, [user, router]);

  const [plans,        setPlans       ] = useState<Plan[]>([]);
  const [activePlan,   setActivePlan  ] = useState<Plan | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [showNew,      setShowNew     ] = useState(false);
  const [nTitle,  setNTitle ] = useState("");
  const [nDesc,   setNDesc  ] = useState("");
  const [nStart,  setNStart ] = useState("");
  const [nEnd,    setNEnd   ] = useState("");
  const [nProv,   setNProv  ] = useState("");
  const [creating,     setCreating    ] = useState(false);
  const [rightTab,     setRightTab    ] = useState<"search"|"bookmarks">("search");
  const [sQ,    setSQ   ] = useState("");
  const [sProv, setSProv] = useState("");
  const [sDist, setSDist] = useState("");
  const [sCat,  setSCat ] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [searching,    setSearching   ] = useState(false);
  const [bmTrips,      setBmTrips     ] = useState<BmTrip[]>([]);
  const [loadingBm,    setLoadingBm   ] = useState(false);
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const [editStop,    setEditStop   ] = useState<PlanStop | null>(null);
  const [editNotes,   setEditNotes  ] = useState("");
  const [editMaps,    setEditMaps   ] = useState("");
  const [editArrival, setEditArrival] = useState("");
  const [editDuration,setEditDuration] = useState("");
  const [editDay,     setEditDay     ] = useState(1);
  const [selectedDay, setSelectedDay ] = useState(1);
  const [customDay,   setCustomDay   ] = useState(1);
  const [savingEdit, setSavingEdit] = useState(false);
  const [addingCustom, setAddingCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customProv, setCustomProv] = useState("");
  const [customDist, setCustomDist] = useState("");
  const [customType, setCustomType] = useState("ATTRACTION");
  const [customMaps, setCustomMaps] = useState("");
  const [addingToStop, setAddingToStop] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPlans = useCallback(async () => {
    setLoadingPlans(true);
    try {
      const res = await fetch("/api/planner");
      if (res.ok) {
        const d = await res.json();
        setPlans(d.plans ?? []);
        if (d.plans?.length > 0) setActivePlan(d.plans[0]);
      }
    } catch {}
    setLoadingPlans(false);
  }, []);

  useEffect(() => { if (user) loadPlans(); }, [user]); // eslint-disable-line

  const reloadPlan = async (id: string) => {
    const res = await fetch(`/api/planner/${id}`);
    if (res.ok) {
      const d = await res.json();
      setActivePlan(d.plan);
      setPlans(prev => prev.map(p => p.id === id ? d.plan : p));
    }
  };

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
    if (!confirm("ลบแผนนี้? · Delete this plan?")) return;
    await fetch(`/api/planner/${id}`, { method: "DELETE" });
    const rest = plans.filter(p => p.id !== id);
    setPlans(rest);
    setActivePlan(activePlan?.id === id ? (rest[0] ?? null) : activePlan);
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
    setAddingToStop(stop.name);
    const res = await fetch(`/api/planner/${activePlan.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add-stop", day: selectedDay, ...stop }),
    });
    if (res.ok) await reloadPlan(activePlan.id);
    setAddingToStop(null);
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
      body: JSON.stringify({ action: "update-stop", stopId: editStop.id, notes: editNotes, googleMapsUrl: editMaps, arrivalTime: editArrival, duration: editDuration ? Number(editDuration) : null, day: editDay }),
    });
    setSavingEdit(false); setEditStop(null);
    reloadPlan(activePlan.id);
  };

  const addCustomStop = async () => {
    if (!customName.trim()) return;
    await addStop({ name: customName, province: customProv, district: customDist, googleMapsUrl: customMaps, stopType: customType, day: customDay });
    setCustomName(""); setCustomProv(""); setCustomDist(""); setCustomMaps(""); setCustomType("ATTRACTION");
    setAddingCustom(false);
  };

  const doSearch = useCallback(async () => {
    if (!sQ.trim() && !sProv) { setPlaceResults([]); return; }
    setSearching(true);
    try {
      const p = new URLSearchParams();
      if (sQ)    p.set("q", sQ);
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

  useEffect(() => {
    if (rightTab !== "bookmarks" || bmTrips.length > 0) return;
    setLoadingBm(true);
    fetch("/api/planner/bookmarks").then(r => r.json()).then(d => setBmTrips(d.trips ?? [])).catch(() => {}).finally(() => setLoadingBm(false));
  }, [rightTab]); // eslint-disable-line

  const shareUrl = typeof window !== "undefined" && activePlan?.isPublic
    ? `${window.location.origin}/planner/${activePlan.id}` : null;

  const copyLink = () => {
    if (shareUrl) { navigator.clipboard.writeText(shareUrl); alert("คัดลอกลิงก์แล้ว! · Copied!"); }
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>

      {/* ════ HEADER ════ */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #e2e8f0",
        padding: "0 24px", display: "flex", alignItems: "center", gap: 16,
        height: 56, position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
      }}>
        <Link href="/dashboard" style={{ color: "#64748b", textDecoration: "none", fontSize: 20, lineHeight: 1, padding: "4px 8px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>←</Link>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#1e293b" }}>📅 วางแผนเที่ยว</div>
          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.5px" }}>TRIP PLANNER</div>
        </div>
        <div style={{ flex: 1 }} />
        {activePlan && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={togglePublic} style={{
              padding: "7px 16px", borderRadius: 20, border: "1.5px solid",
              borderColor: activePlan.isPublic ? "#10b981" : "#e2e8f0",
              background: activePlan.isPublic ? "#ecfdf5" : "#f8fafc",
              color: activePlan.isPublic ? "#065f46" : "#64748b",
              fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 5
            }}>
              {activePlan.isPublic ? "🌐 สาธารณะ · Public" : "🔒 ส่วนตัว · Private"}
            </button>
            {activePlan.isPublic && shareUrl && (
              <button onClick={copyLink} style={{
                padding: "7px 16px", borderRadius: 20, border: "1.5px solid #3b82f6",
                background: "#eff6ff", color: "#1d4ed8", fontWeight: 700, fontSize: 12,
                cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5
              }}>
                🔗 แชร์ · Share
              </button>
            )}
            <Link href={`/planner/${activePlan.id}`} target="_blank" style={{
              padding: "7px 16px", borderRadius: 20, border: "1.5px solid #e2e8f0",
              background: "#fff", color: "#374151", fontWeight: 700, fontSize: 12,
              textDecoration: "none", display: "flex", alignItems: "center", gap: 5
            }}>
              🖨️ พิมพ์ · Print
            </Link>
          </div>
        )}
      </div>

      {/* ════ 3-COLUMN LAYOUT ════ */}
      <div style={{ maxWidth: 1400, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "260px 1fr 320px", height: "calc(100vh - 56px)", overflow: "hidden", borderLeft: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }}>

        {/* ── COL 1: Plans sidebar ── */}
        <div style={{ borderRight: "1px solid #e2e8f0", background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px 14px", borderBottom: "1px solid #f1f5f9" }}>
            <button onClick={() => setShowNew(!showNew)} style={{
              width: "100%", padding: "11px 14px", borderRadius: 14,
              border: showNew ? "2px solid #3b82f6" : "2px dashed #93c5fd",
              background: showNew ? "#eff6ff" : "linear-gradient(135deg,#f0f9ff,#eff6ff)",
              color: "#1d4ed8", fontWeight: 800, fontSize: 13,
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 8, justifyContent: "center"
            }}>
              <span style={{ fontSize: 16 }}>＋</span>
              {showNew ? "ปิดฟอร์ม · Close" : "สร้างแผนใหม่ · New Plan"}
            </button>
          </div>

          {/* New plan form */}
          {showNew && (
            <div style={{ padding: "14px", borderBottom: "1px solid #f1f5f9", background: "#fafbff" }}>
              <div style={{ marginBottom: 8 }}>
                <label style={lbl}>ชื่อแผน · Plan Name <span style={{ color: "#ef4444" }}>*</span></label>
                <input value={nTitle} onChange={e => setNTitle(e.target.value)}
                  placeholder="เช่น: เที่ยวเชียงใหม่" style={inp} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={lbl}>คำอธิบาย · Description</label>
                <input value={nDesc} onChange={e => setNDesc(e.target.value)}
                  placeholder="รายละเอียดเพิ่มเติม..." style={inp} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={lbl}>วันเริ่ม · From</label>
                <input type="date" value={nStart} min={todayStr} onChange={e => { setNStart(e.target.value); if (nEnd && e.target.value > nEnd) setNEnd(""); }} style={inp} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={lbl}>วันสิ้นสุด · To</label>
                <input type="date" value={nEnd} min={nStart || todayStr} onChange={e => setNEnd(e.target.value)} style={inp} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>จังหวัดหลัก · Province</label>
                <select value={nProv} onChange={e => setNProv(e.target.value)} style={inp}>
                  <option value="">-- เลือกจังหวัด --</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={createPlan} disabled={creating || !nTitle.trim()} style={{
                  flex: 1, padding: "9px", borderRadius: 10, border: "none",
                  background: nTitle.trim() ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "#e2e8f0",
                  color: nTitle.trim() ? "#fff" : "#94a3b8",
                  fontWeight: 800, fontSize: 13, cursor: nTitle.trim() ? "pointer" : "not-allowed", fontFamily: "inherit"
                }}>
                  {creating ? "⏳ สร้าง..." : "✓ สร้างแผน · Create"}
                </button>
                <button onClick={() => setShowNew(false)} style={{
                  padding: "9px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                  background: "#fff", color: "#64748b", fontWeight: 700, fontSize: 12,
                  cursor: "pointer", fontFamily: "inherit"
                }}>ยกเลิก</button>
              </div>
            </div>
          )}

          {/* Plans list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {loadingPlans ? (
              <div style={{ padding: "24px 16px", textAlign: "center", color: "#94a3b8" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>กำลังโหลด...</div>
              </div>
            ) : plans.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>ยังไม่มีแผนเที่ยว</div>
                <div style={{ fontSize: 11, lineHeight: 1.7 }}>กด &ldquo;+ สร้างแผนใหม่&rdquo;<br />เพื่อเริ่มวางแผน</div>
              </div>
            ) : plans.map(plan => {
              const isActive = activePlan?.id === plan.id;
              return (
                <div key={plan.id} onClick={() => setActivePlan(plan)} style={{
                  padding: "12px 16px", cursor: "pointer", transition: "background 0.15s",
                  borderLeft: `4px solid ${isActive ? "#3b82f6" : "transparent"}`,
                  background: isActive ? "linear-gradient(90deg,#eff6ff,#f8faff)" : "transparent",
                  borderBottom: "1px solid #f8fafc"
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: isActive ? "#1d4ed8" : "#1e293b", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{plan.isPublic ? "🌐" : "📋"}</span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{plan.title}</span>
                  </div>
                  {(plan.startDate || plan.province) && (
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 3, display: "flex", gap: 8 }}>
                      {plan.startDate && <span>📅 {plan.startDate}</span>}
                      {plan.province && <span>📍 {plan.province}</span>}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>🚩 {plan.stops.length} จุดหมาย</span>
                    {isActive && (
                      <button onClick={e => { e.stopPropagation(); deletePlan(plan.id); }}
                        style={{ marginLeft: "auto", padding: "2px 8px", borderRadius: 6, border: "1px solid #fecaca",
                          background: "#fef2f2", color: "#dc2626", fontSize: 10, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit" }}>
                        ลบ
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── COL 2: Itinerary ── */}
        <div style={{ overflowY: "auto", padding: "24px 20px" }}>
          {!activePlan ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 20, textAlign: "center" }}>
              <div style={{ width: 100, height: 100, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, boxShadow: "0 20px 40px rgba(59,130,246,0.2)" }}>
                📅
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 22, color: "#1e293b", marginBottom: 8 }}>วางแผนเที่ยวของคุณ</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#3b82f6", marginBottom: 4 }}>Plan Your Next Adventure</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.8, maxWidth: 320 }}>
                  ค้นหาสถานที่จากแผงขวา · ดึงจุดแวะจากทริปที่บุ๊คมาร์ค<br />
                  จัดลำดับ · แชร์ · พิมพ์เป็น PDF
                </div>
              </div>
              <button onClick={() => setShowNew(true)} style={{
                padding: "13px 32px", borderRadius: 16, border: "none",
                background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                color: "#fff", fontWeight: 800, fontSize: 15,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 12px 32px rgba(59,130,246,0.3)"
              }}>
                + สร้างแผนแรก · Create First Plan
              </button>
            </div>
          ) : (
            <>
              {/* Plan header card */}
              <div style={{
                background: "linear-gradient(135deg,#1e293b,#334155)",
                borderRadius: 24, padding: "22px 24px", marginBottom: 20,
                color: "#fff", boxShadow: "0 8px 32px rgba(30,41,59,0.2)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "1px", marginBottom: 6 }}>
                      {activePlan.isPublic ? "🌐 แชร์ได้สาธารณะ" : "🔒 ส่วนตัว"} · ITINERARY
                    </div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#fff" }}>{activePlan.title}</h2>
                    {activePlan.description && <p style={{ margin: "6px 0 0", fontSize: 13, color: "#94a3b8" }}>{activePlan.description}</p>}
                    <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" as const }}>
                      {activePlan.startDate && (
                        <span style={{ fontSize: 12, color: "#cbd5e1", background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: 20 }}>
                          📅 {activePlan.startDate}{activePlan.endDate ? ` – ${activePlan.endDate}` : ""}
                        </span>
                      )}
                      {activePlan.province && (
                        <span style={{ fontSize: 12, color: "#cbd5e1", background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: 20 }}>
                          📍 {activePlan.province}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: "#cbd5e1", background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: 20 }}>
                        🚩 {activePlan.stops.length} จุดหมาย · stops
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add custom stop */}
              {!addingCustom ? (
                <button onClick={() => setAddingCustom(true)} style={{
                  width: "100%", padding: "12px 16px", borderRadius: 16, marginBottom: 16,
                  border: "2px dashed #10b981", background: "linear-gradient(135deg,#f0fdf4,#ecfdf5)",
                  color: "#059669", fontWeight: 700, fontSize: 13,
                  cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: 8, justifyContent: "center"
                }}>
                  <span style={{ fontSize: 18 }}>✏️</span>
                  เพิ่มจุดแวะเอง · Add Custom Stop
                </button>
              ) : (
                <div style={{ background: "#fff", borderRadius: 20, padding: "18px 20px", marginBottom: 16, border: "2px solid #6ee7b7", boxShadow: "0 4px 16px rgba(16,185,129,0.1)" }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#065f46", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>✏️</span> เพิ่มจุดแวะเอง · Custom Stop
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 12 }}>
                    {STOP_TYPES.map(t => (
                      <button key={t.v} type="button" onClick={() => setCustomType(t.v)} style={{
                        padding: "5px 12px", borderRadius: 20, border: "2px solid",
                        borderColor: customType === t.v ? t.color : "#e2e8f0",
                        background: customType === t.v ? t.bg : "#f8fafc",
                        color: customType === t.v ? t.color : "#64748b",
                        fontWeight: customType === t.v ? 800 : 500, fontSize: 12,
                        cursor: "pointer", fontFamily: "inherit"
                      }}>
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                  <input value={customName} onChange={e => setCustomName(e.target.value)}
                    placeholder="ชื่อสถานที่ · Place name *" style={{ ...inp, marginBottom: 8 }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <select value={customProv} onChange={e => { setCustomProv(e.target.value); setCustomDist(""); }} style={inp}>
                      <option value="">จังหวัด · Province</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select value={customDist} onChange={e => setCustomDist(e.target.value)} disabled={!customProv} style={inp}>
                      <option value="">อำเภอ · District</option>
                      {getDistricts(customProv).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <select value={String(customDay)} onChange={e => setCustomDay(Number(e.target.value))} style={{ ...inp }}>
                      {Array.from({ length: Math.max((activePlan.stops.reduce((m, s) => Math.max(m, s.day ?? 1), 1)), selectedDay) + 1 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>📅 วันที่ {d}</option>
                      ))}
                    </select>
                  </div>
                  <input value={customMaps} onChange={e => setCustomMaps(e.target.value)}
                    placeholder="🗺️ Google Maps URL (ไม่บังคับ)" style={{ ...inp, marginBottom: 12 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={addCustomStop} disabled={!customName.trim()} style={{
                      flex: 1, padding: "10px", borderRadius: 12, border: "none",
                      background: customName.trim() ? "linear-gradient(135deg,#10b981,#059669)" : "#e2e8f0",
                      color: customName.trim() ? "#fff" : "#94a3b8",
                      fontWeight: 800, fontSize: 13, cursor: customName.trim() ? "pointer" : "not-allowed", fontFamily: "inherit"
                    }}>+ เพิ่มจุดนี้ · Add Stop</button>
                    <button onClick={() => setAddingCustom(false)} style={{
                      padding: "10px 18px", borderRadius: 12, border: "1.5px solid #e2e8f0",
                      background: "#f8fafc", color: "#64748b", fontWeight: 700, fontSize: 13,
                      cursor: "pointer", fontFamily: "inherit"
                    }}>ยกเลิก</button>
                  </div>
                </div>
              )}

              {/* ── Day Tabs ── */}
              {(() => {
                // Compute total days
                const maxStopDay = activePlan.stops.reduce((m, s) => Math.max(m, s.day ?? 1), 1);
                const totalDays = (() => {
                  if (activePlan.startDate && activePlan.endDate) {
                    const diff = Math.round((new Date(activePlan.endDate).getTime() - new Date(activePlan.startDate).getTime()) / 86400000) + 1;
                    return Math.max(diff, maxStopDay, 1);
                  }
                  return Math.max(maxStopDay, 1);
                })();
                const getDateLabel = (dayNum: number) => {
                  if (!activePlan.startDate) return null;
                  const d = new Date(activePlan.startDate);
                  d.setDate(d.getDate() + dayNum - 1);
                  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
                };
                const stopsForDay = activePlan.stops.filter(s => (s.day ?? 1) === selectedDay);
                return (
                  <>
                    {/* Day tab bar */}
                    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 12, scrollbarWidth: "none" }}>
                      {Array.from({ length: totalDays }, (_, i) => i + 1).map(dayNum => {
                        const cnt = activePlan.stops.filter(s => (s.day ?? 1) === dayNum).length;
                        const isActive = selectedDay === dayNum;
                        const dateLabel = getDateLabel(dayNum);
                        return (
                          <button key={dayNum} onClick={() => { setSelectedDay(dayNum); setCustomDay(dayNum); }} style={{
                            flexShrink: 0, padding: "8px 14px", borderRadius: 14,
                            border: `2px solid ${isActive ? "#3b82f6" : "#e2e8f0"}`,
                            background: isActive ? "#eff6ff" : "#f8fafc",
                            color: isActive ? "#1d4ed8" : "#64748b",
                            fontWeight: isActive ? 800 : 600, fontSize: 12,
                            cursor: "pointer", fontFamily: "inherit",
                            display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 1,
                          }}>
                            <span style={{ fontSize: 11, letterSpacing: "0.3px" }}>วันที่ {dayNum}</span>
                            {dateLabel && <span style={{ fontSize: 10, color: isActive ? "#3b82f6" : "#94a3b8" }}>{dateLabel}</span>}
                            <span style={{ fontSize: 10, color: isActive ? "#3b82f6" : "#94a3b8" }}>{cnt} จุด</span>
                          </button>
                        );
                      })}
                      {/* Add day button */}
                      <button onClick={() => { const nd = totalDays + 1; setSelectedDay(nd); setCustomDay(nd); }} style={{
                        flexShrink: 0, padding: "8px 14px", borderRadius: 14,
                        border: "2px dashed #c7d2fe", background: "#f5f3ff", color: "#7c3aed",
                        fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                        display: "flex", flexDirection: "column" as const, alignItems: "center",
                      }}>
                        <span>+ เพิ่มวัน</span>
                        <span style={{ fontSize: 9, color: "#a78bfa" }}>Add Day</span>
                      </button>
                    </div>

                    {/* Day header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                      <div style={{ fontWeight: 800, fontSize: 13, color: "#3b82f6", background: "#eff6ff",
                        borderRadius: 20, padding: "4px 16px", border: "1px solid #bfdbfe",
                        display: "flex", alignItems: "center", gap: 6 }}>
                        ☀️ วันที่ {selectedDay}
                        {getDateLabel(selectedDay) && <span style={{ fontWeight: 600, color: "#60a5fa", fontSize: 11 }}>· {getDateLabel(selectedDay)}</span>}
                      </div>
                      <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                    </div>

                    {/* Stops for selected day */}
              {stopsForDay.length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px 0", color: "#94a3b8" }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>📅</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#64748b", marginBottom: 4 }}>ยังไม่มีจุดในวันที่ {selectedDay}</div>
                  <div style={{ fontSize: 12, lineHeight: 1.8 }}>เพิ่มจุดแวะจากแผงขวา<br />หรือกด &ldquo;เพิ่มจุดแวะเอง&rdquo; ด้านบน</div>
                </div>
              ) : (
                <div>
                  {stopsForDay.map((stop, idx) => {
                    const meta = ST(stop.stopType);
                    return (
                      <div key={stop.id} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                        {/* Line connector */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4 }}>
                          <div style={{ width: 38, height: 38, borderRadius: "50%", background: meta.bg, border: `2px solid ${meta.color}`, color: meta.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                            {meta.icon}
                          </div>
                          {idx < stopsForDay.length - 1 && (
                            <div style={{ width: 2, flex: 1, minHeight: 16, background: "linear-gradient(to bottom,#e2e8f0,transparent)", margin: "4px 0" }} />
                          )}
                        </div>
                        {/* Stop card */}
                        <div style={{ flex: 1, background: "#fff", borderRadius: 18, padding: "14px 18px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const, marginBottom: 4 }}>
                                <span style={{ fontWeight: 800, fontSize: 15, color: "#1e293b" }}>{stop.name}</span>
                                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: meta.bg, color: meta.color, fontWeight: 700, flexShrink: 0 }}>
                                  {meta.icon} {meta.label.split(" · ")[0]}
                                </span>
                              </div>
                              {((stop as any).arrivalTime || (stop as any).duration) && (
                                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4, flexWrap:"wrap" as const }}>
                                  {(stop as any).arrivalTime && (
                                    <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, fontWeight:700, color:"#1d4ed8", background:"#dbeafe", borderRadius:20, padding:"2px 10px" }}>
                                      🕐 ถึง {(stop as any).arrivalTime}
                                    </span>
                                  )}
                                  {(stop as any).duration && (
                                    <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, fontWeight:700, color:"#065f46", background:"#d1fae5", borderRadius:20, padding:"2px 10px" }}>
                                      ⏱ {(stop as any).duration >= 60 ? `${Math.floor((stop as any).duration/60)}ชม.${(stop as any).duration%60 ? (stop as any).duration%60+"น." : ""}` : `${(stop as any).duration} น.`}
                                    </span>
                                  )}
                                </div>
                              )}
                              {(stop.province || stop.district) && (
                                <div style={{ fontSize: 12, color: "#64748b", marginBottom: stop.notes ? 6 : 0 }}>
                                  📍 {[stop.province, stop.district].filter(Boolean).join(" · ")}
                                </div>
                              )}
                              {stop.notes && (
                                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{stop.notes}</p>
                              )}
                              {stop.googleMapsUrl && (
                                <a href={stop.googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, fontSize: 12, color: "#3b82f6", fontWeight: 700, textDecoration: "none", padding: "4px 12px", borderRadius: 20, border: "1px solid #bfdbfe", background: "#eff6ff" }}>
                                  🗺️ Google Maps
                                </a>
                              )}
                            </div>
                            {/* Action buttons */}
                            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                              <button onClick={() => moveStop(stop.id, "up")} disabled={idx === 0}
                                style={{ ...ab, opacity: idx === 0 ? 0.25 : 1 }} title="ขึ้น">▲</button>
                              <button onClick={() => moveStop(stop.id, "down")} disabled={idx === stopsForDay.length - 1}
                                style={{ ...ab, opacity: idx === stopsForDay.length - 1 ? 0.25 : 1 }} title="ลง">▼</button>
                              <button onClick={() => { setEditStop(stop); setEditNotes(stop.notes ?? ""); setEditMaps(stop.googleMapsUrl ?? ""); setEditArrival((stop as any).arrivalTime ?? ""); setEditDuration((stop as any).duration ? String((stop as any).duration) : ""); setEditDay(stop.day ?? 1); }}
                                style={{ ...ab, background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe" }} title="แก้ไข">✏️</button>
                              <button onClick={() => removeStop(stop.id)}
                                style={{ ...ab, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }} title="ลบ">✕</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
                  </>
                );
              })()}

        {/* ── COL 3: Search + Bookmarks ── */}
        <div style={{ borderLeft: "1px solid #e2e8f0", background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Tabs */}
          <div style={{ display: "flex", padding: "0 8px", borderBottom: "2px solid #f1f5f9" }}>
            {([["search","🔍","ค้นหาสถานที่","Find Places"],["bookmarks","🔖","ทริปบุ๊คมาร์ค","Bookmarked"]] as const).map(([key, icon, th, en]) => (
              <button key={key} onClick={() => setRightTab(key)} style={{
                flex: 1, padding: "14px 6px",
                borderBottom: `2px solid ${rightTab === key ? "#3b82f6" : "transparent"}`,
                border: "none", background: "none",
                fontWeight: rightTab === key ? 800 : 500,
                fontSize: 12, color: rightTab === key ? "#1d4ed8" : "#64748b",
                cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s"
              }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
                <div>{th}</div>
                <div style={{ fontSize: 9, color: "#94a3b8", letterSpacing: "0.5px" }}>{en}</div>
              </button>
            ))}
          </div>

          {/* ── SEARCH tab ── */}
          {rightTab === "search" && (
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "14px 14px 8px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ position: "relative", marginBottom: 8 }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#94a3b8" }}>🔍</span>
                  <input value={sQ} onChange={e => setSQ(e.target.value)}
                    placeholder="ชื่อสถานที่ · Place name..." style={{ ...inp, paddingLeft: 32 }} />
                </div>
                <select value={sProv} onChange={e => { setSProv(e.target.value); setSDist(""); }} style={{ ...inp, marginBottom: 6 }}>
                  <option value="">📍 ทุกจังหวัด · All Provinces</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {sProv && (
                  <select value={sDist} onChange={e => setSDist(e.target.value)} style={{ ...inp, marginBottom: 6 }}>
                    <option value="">ทุกอำเภอ · All Districts</option>
                    {getDistricts(sProv).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                )}
                <select value={sCat} onChange={e => setSCat(e.target.value)} style={inp}>
                  <option value="">🗂️ ทุกประเภท · All Types</option>
                  <option value="NATURE">🌿 ธรรมชาติ · Nature</option>
                  <option value="TEMPLE">🛕 วัด · Temple</option>
                  <option value="CAFE">☕ คาเฟ่ · Cafe</option>
                  <option value="FOOD">🍲 อาหาร · Food</option>
                  <option value="BEACH">🏖️ ชายหาด · Beach</option>
                  <option value="MARKET">🛍️ ตลาด · Market</option>
                  <option value="ADVENTURE">🧗 ผจญภัย · Adventure</option>
                  <option value="MUSEUM">🏛️ พิพิธภัณฑ์ · Museum</option>
                  <option value="ACCOMMODATION">🏨 ที่พัก · Accommodation</option>
                  <option value="CAMPING">⛺ แคมปิ้ง · Camping</option>
                </select>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
                {searching && (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize: 13 }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>🔍</div>
                    กำลังค้นหา · Searching...
                  </div>
                )}
                {!searching && placeResults.length === 0 && !sQ && !sProv && (
                  <div style={{ textAlign: "center", padding: "32px 16px", color: "#94a3b8" }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>🏞️</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#64748b", marginBottom: 4 }}>ค้นหาสถานที่</div>
                    <div style={{ fontSize: 11, lineHeight: 1.8 }}>
                      พิมพ์ชื่อ หรือเลือกจังหวัด<br />
                      แล้วกด + เพิ่มเข้าแผน
                    </div>
                  </div>
                )}
                {!searching && placeResults.length === 0 && (sQ || sProv) && !searching && (
                  <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: 13 }}>
                    ไม่พบสถานที่ · No results
                  </div>
                )}
                {placeResults.map(p => (
                  <div key={p.id} style={{ marginBottom: 12, border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", background: "#fafafa" }}>
                    {p.coverUrl && (
                      <img src={p.coverUrl} alt="" style={{ width: "100%", height: 80, objectFit: "cover" }} />
                    )}
                    <div style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 2 }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
                        📍 {p.province}{p.district ? ` · ${p.district}` : ""} &nbsp;·&nbsp; {p.category}
                      </div>
                      <button disabled={!activePlan || addingToStop === p.title} onClick={() => addStop({
                        name: p.title, province: p.province, district: p.district,
                        googleMapsUrl: p.googleMapsUrl, stopType: "ATTRACTION", placeId: p.id,
                      })} style={{
                        width: "100%", padding: "7px", borderRadius: 10, border: "none",
                        background: !activePlan ? "#e2e8f0" : addingToStop === p.title ? "#93c5fd" : "linear-gradient(135deg,#3b82f6,#6366f1)",
                        color: !activePlan ? "#94a3b8" : "#fff",
                        fontWeight: 700, fontSize: 12,
                        cursor: activePlan ? "pointer" : "not-allowed", fontFamily: "inherit"
                      }}>
                        {!activePlan ? "เลือกแผนก่อน · Select plan first" : addingToStop === p.title ? "⏳ กำลังเพิ่ม..." : "+ เพิ่มในแผน · Add to Plan"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── BOOKMARKS tab ── */}
          {rightTab === "bookmarks" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
              {loadingBm ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                  <div style={{ fontSize: 13 }}>กำลังโหลด · Loading...</div>
                </div>
              ) : bmTrips.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 16px", color: "#94a3b8" }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>🔖</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#64748b", marginBottom: 4 }}>ยังไม่มีทริปบุ๊คมาร์ค</div>
                  <div style={{ fontSize: 11, lineHeight: 1.8 }}>
                    ไปกด 🔖 ในหน้าทริปที่ชอบ<br />
                    แล้วกลับมาดึงจุดแวะได้เลย
                  </div>
                </div>
              ) : bmTrips.map(trip => (
                <div key={trip.id} style={{ marginBottom: 12, border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
                  <div onClick={() => setExpandedTrip(expandedTrip === trip.id ? null : trip.id)}
                    style={{ display: "flex", gap: 10, padding: "12px 14px", cursor: "pointer", alignItems: "center",
                      background: expandedTrip === trip.id ? "#eff6ff" : "#fafafa" }}>
                    {trip.coverUrl && (
                      <img src={trip.coverUrl} alt="" style={{ width: 48, height: 38, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{trip.title}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>📍 {trip.timeline?.length ?? 0} จุดแวะ · stops</div>
                    </div>
                    <span style={{ fontSize: 12, color: "#94a3b8", flexShrink: 0 }}>{expandedTrip === trip.id ? "▲" : "▼"}</span>
                  </div>
                  {expandedTrip === trip.id && trip.timeline?.map((stop, si) => {
                    const meta = ST(stop.stopType);
                    return (
                      <div key={si} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderTop: "1px solid #f1f5f9", background: "#fff" }}>
                        <span style={{ fontSize: 16, flexShrink: 0, width: 24, textAlign: "center" }}>{meta.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{stop.placeName}</div>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>{[stop.province, stop.district].filter(Boolean).join(" · ")}</div>
                        </div>
                        <button disabled={!activePlan || addingToStop === stop.placeName} onClick={() => addStop({
                          name: stop.placeName, province: stop.province, district: stop.district,
                          googleMapsUrl: stop.googleMapsUrl ?? undefined,
                          stopType: stop.stopType ?? "ATTRACTION", placeId: stop.placeId ?? undefined,
                        })} style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, border: "none",
                          background: !activePlan ? "#e2e8f0" : addingToStop === stop.placeName ? "#93c5fd" : "#3b82f6",
                          color: !activePlan ? "#94a3b8" : "#fff",
                          fontWeight: 900, fontSize: 16, cursor: activePlan ? "pointer" : "not-allowed",
                          fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          {addingToStop === stop.placeName ? "⏳" : "+"}
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setEditStop(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: 28, width: "100%", maxWidth: 440, boxShadow: "0 40px 80px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 24 }}>✏️</span>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16, color: "#1e293b" }}>แก้ไขจุดแวะ · Edit Stop</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{editStop.name}</div>
              </div>
            </div>
            {/* Day selector */}
            {activePlan && (() => {
              const maxDay = activePlan.stops.reduce((m, s) => Math.max(m, s.day ?? 1), 1);
              const totalEditDays = Math.max(maxDay, editDay);
              return (
                <div style={{ marginBottom:14 }}>
                  <label style={lbl}>📅 วันที่ในทริป · Trip Day</label>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" as const }}>
                    {Array.from({ length: totalEditDays + 1 }, (_, i) => i + 1).map(d => (
                      <button key={d} type="button" onClick={() => setEditDay(d)} style={{
                        padding:"6px 14px", borderRadius:20,
                        border:`2px solid ${editDay === d ? "#3b82f6" : "#e2e8f0"}`,
                        background: editDay === d ? "#eff6ff" : "#f8fafc",
                        color: editDay === d ? "#1d4ed8" : "#64748b",
                        fontWeight: editDay === d ? 800 : 600, fontSize:12,
                        cursor:"pointer", fontFamily:"inherit"
                      }}>วันที่ {d}</button>
                    ))}
                  </div>
                </div>
              );
            })()}
            {/* Arrival time + duration row */}
            <div style={{ display:"flex", gap:12, marginBottom:14 }}>
              <div style={{ flex:1 }}>
                <label style={lbl}>🕐 เวลาที่คาดว่าจะถึง · Arrival Time</label>
                <input type="time" value={editArrival} onChange={e => setEditArrival(e.target.value)}
                  style={{ ...inp, background:"#f0f9ff", border:"1.5px solid #bae6fd" }} />
              </div>
              <div style={{ flex:1 }}>
                <label style={lbl}>⏱ เวลาที่ใช้ที่จุดนี้ · Duration (นาที)</label>
                <input type="number" min="0" step="15" value={editDuration}
                  onChange={e => setEditDuration(e.target.value)}
                  placeholder="เช่น 60 = 1 ชั่วโมง"
                  style={{ ...inp, background:"#f0fdf4", border:"1.5px solid #bbf7d0" }} />
              </div>
            </div>
            <label style={lbl}>📝 หมายเหตุ / Notes</label>
            <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
              placeholder="บันทึกข้อมูลเพิ่มเติม เช่น เวลาเปิด-ปิด..."
              style={{ ...inp, height: 90, resize: "vertical" as const, marginBottom: 14 }} />
            <label style={lbl}>🗺️ Google Maps URL</label>
            <input value={editMaps} onChange={e => setEditMaps(e.target.value)}
              placeholder="https://maps.google.com/..." style={{ ...inp, marginBottom: 20 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={saveStopEdit} disabled={savingEdit} style={{
                flex: 1, padding: "12px", borderRadius: 14, border: "none",
                background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff",
                fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit"
              }}>{savingEdit ? "⏳ บันทึก..." : "✓ บันทึก · Save"}</button>
              <button onClick={() => setEditStop(null)} style={{
                flex: 1, padding: "12px", borderRadius: 14, border: "1.5px solid #e2e8f0",
                background: "#f8fafc", color: "#374151", fontWeight: 700, fontSize: 14,
                cursor: "pointer", fontFamily: "inherit"
              }}>ยกเลิก · Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = { display: "block", fontWeight: 700, fontSize: 11, color: "#64748b", marginBottom: 5, letterSpacing: "0.3px", textTransform: "uppercase" as const };
const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const, color: "#1e293b" };
const ab: React.CSSProperties  = { width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" };

"use client";

// ── Sortable stop card ──────────────────────────────────────────────────────
function SortableStopCard({ stop, idx, total, onEdit, onRemove }: {
  stop: PlanStop; idx: number; total: number;
  onEdit: () => void; onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stop.id });
  const meta = ST(stop.stopType);
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={{ ...style, display: "flex", gap: 12, marginBottom: 12 }}>
      {/* Timeline dot + line */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4 }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: meta.bg, border: `2px solid ${meta.color}`, color: meta.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
          {meta.icon}
        </div>
        {idx < total - 1 && (
          <div style={{ width: 2, flex: 1, minHeight: 16, background: "linear-gradient(to bottom,#e2e8f0,transparent)", margin: "4px 0" }} />
        )}
      </div>
      {/* Card */}
      <div style={{ flex: 1, background: "#fff", borderRadius: 18, border: `1.5px solid ${isDragging ? "#93c5fd" : "#e2e8f0"}`, boxShadow: isDragging ? "0 8px 24px rgba(59,130,246,0.18)" : "0 2px 8px rgba(0,0,0,0.04)", transition: "border-color 0.2s,box-shadow 0.2s", overflow: "hidden" }}>
        {/* Drag handle bar — full-width, easy to grab */}
        <div {...attributes} {...listeners} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: isDragging ? "#eff6ff" : "#f8fafc", borderBottom: "1px solid #f1f5f9", cursor: isDragging ? "grabbing" : "grab", userSelect: "none", touchAction: "none" }}>
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none" style={{ flexShrink: 0 }}>
            {[0,3.5,7].map(y => (
              <g key={y}>
                <circle cx="3" cy={y+1.5} r="1.5" fill="#94a3b8"/>
                <circle cx="8" cy={y+1.5} r="1.5" fill="#94a3b8"/>
                <circle cx="13" cy={y+1.5} r="1.5" fill="#94a3b8"/>
              </g>
            ))}
          </svg>
          <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.3px" }}>ลากเพื่อจัดลำดับ · Drag to reorder</span>
        </div>
        <div style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const, marginBottom: 4 }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: "#1e293b" }}>{stop.name}</span>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: meta.bg, color: meta.color, fontWeight: 700, flexShrink: 0 }}>
                {meta.icon} {meta.label.split(" · ")[0]}
              </span>
            </div>
            {(stop.arrivalTime || stop.duration) && (
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4, flexWrap:"wrap" as const }}>
                {stop.arrivalTime && (
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, fontWeight:700, color:"#1d4ed8", background:"#dbeafe", borderRadius:20, padding:"2px 10px" }}>
                    🕐 ถึง {stop.arrivalTime}
                  </span>
                )}
                {stop.duration && (
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, fontWeight:700, color:"#065f46", background:"#d1fae5", borderRadius:20, padding:"2px 10px" }}>
                    ⏱ {stop.duration >= 60 ? `${Math.floor(stop.duration/60)}ชม.${stop.duration%60 ? stop.duration%60+"น." : ""}` : `${stop.duration} น.`}
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
              <MapsButton url={stop.googleMapsUrl} placeName={stop.name} variant="text"
                style={{ marginTop: 8, fontSize: 12, display: "inline-block" }} />
            )}
          </div>
          {/* Action buttons */}
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <button onClick={onEdit}
              style={{ ...ab, background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe" }} title="แก้ไข">✏️</button>
            <button onClick={onRemove}
              style={{ ...ab, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }} title="ลบ">✕</button>
          </div>
        </div>
        </div>{/* end padding wrapper */}
      </div>
    </div>
  );
}


import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getDistricts } from "@/data/thailand";
import ProvinceSelect from "@/components/ui/ProvinceSelect";
import {
  DndContext, closestCenter,
  KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import MapsButton from "@/components/common/MapsButton";

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
  coverUrl?: string;
  stops: PlanStop[];
}
interface PlaceResult {
  id: string; slug: string; title: string; province: string;
  district?: string; category: string; coverUrl?: string; communityCover?: string | null; googleMapsUrl?: string;
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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

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
  const [customArrival, setCustomArrival] = useState("");
  const [customDuration, setCustomDuration] = useState("");
  const [addingToStop, setAddingToStop] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

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

  const addStop = async (stop: { name: string; province?: string; district?: string; googleMapsUrl?: string; stopType?: string; placeId?: string; day?: number; arrivalTime?: string; duration?: number }) => {
    if (!activePlan) return;
    setAddingToStop(stop.placeId ?? stop.name);
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
    await addStop({ name: customName, province: customProv, district: customDist, googleMapsUrl: customMaps, stopType: customType, day: customDay, arrivalTime: customArrival || undefined, duration: customDuration ? Number(customDuration) : undefined });
    setCustomName(""); setCustomProv(""); setCustomDist(""); setCustomMaps(""); setCustomType("ATTRACTION");
    setCustomArrival(""); setCustomDuration("");
    setAddingCustom(false);
  };

  const reorderStops = async (orderedIds: string[]) => {
    if (!activePlan) return;
    // Optimistic update
    const newStops = [...activePlan.stops].sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id))
      .map((s, i) => ({ ...s, order: i }));
    setActivePlan(prev => prev ? { ...prev, stops: newStops } : prev);
    setPlans(prev => prev.map(p => p.id === activePlan.id ? { ...p, stops: newStops } : p));
    // Persist
    await fetch(`/api/planner/${activePlan.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reorder-stops", orderedIds }),
    });
  };

  // ── Cover image upload ──────────────────────────────────────────────────
  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePlan) return;
    setUploadingCover(true);
    try {
      // Client-side resize to max 1200px wide
      const img = await createImageBitmap(file);
      const MAX = 1200;
      const scale = img.width > MAX ? MAX / img.width : 1;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), "image/jpeg", 0.85));
      const fd = new FormData();
      fd.append("file", new File([blob], "cover.jpg", { type: "image/jpeg" }));
      fd.append("folder", "plan-covers");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();
      // Save to plan
      const saveRes = await fetch(`/api/planner/${activePlan.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-meta", coverUrl: url }),
      });
      if (saveRes.ok) {
        setActivePlan(prev => prev ? { ...prev, coverUrl: url } : prev);
        setPlans(prev => prev.map(p => p.id === activePlan.id ? { ...p, coverUrl: url } : p));
      }
    } catch (err) { console.error(err); }
    setUploadingCover(false);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  // ── Is plan expired? ─────────────────────────────────────────────────────
  const isPastPlan = (plan: Plan): boolean => {
    const today = new Date(); today.setHours(0,0,0,0);
    if (plan.endDate) {
      const end = new Date(plan.endDate); end.setHours(0,0,0,0);
      return end < today;
    }
    // Fall back to latest stop date computed from startDate + max day
    if (plan.startDate && plan.stops.length > 0) {
      const maxDay = plan.stops.reduce((m, s) => Math.max(m, s.day ?? 1), 1);
      const lastDate = new Date(plan.startDate);
      lastDate.setDate(lastDate.getDate() + maxDay - 1);
      lastDate.setHours(0,0,0,0);
      return lastDate < today;
    }
    return false;
  };

  const doSearch = useCallback(async () => {
    if (!sQ.trim() && !sProv && !sCat) { setPlaceResults([]); return; }
    setSearching(true);
    try {
      const p = new URLSearchParams();
      if (sQ)    p.set("q", sQ);
      // Strip English suffix e.g. "กรุงเทพมหานคร (Bangkok)" → "กรุงเทพมหานคร"
      const provClean = sProv ? sProv.replace(/\s*\(.*?\)\s*$/, "").trim() : "";
      if (provClean) p.set("province", provClean);
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

  // ── Day computation (derived from activePlan) ──────────────
  const maxStopDay = activePlan ? activePlan.stops.reduce((m, s) => Math.max(m, s.day ?? 1), 1) : 1;
  const totalDays = (() => {
    if (activePlan?.startDate && activePlan?.endDate) {
      const diff = Math.round((new Date(activePlan.endDate).getTime() - new Date(activePlan.startDate).getTime()) / 86400000) + 1;
      return Math.max(diff, maxStopDay, 1);
    }
    return Math.max(maxStopDay, 1);
  })();
  const getDateLabel = (dayNum: number): { th: string; en: string } | null => {
    if (!activePlan?.startDate) return null;
    const d = new Date(activePlan.startDate);
    d.setDate(d.getDate() + dayNum - 1);
    return {
      th: d.toLocaleDateString("th-TH", { day: "numeric", month: "short" }),
      en: d.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
    };
  };
  const stopsForDay = activePlan ? activePlan.stops.filter(s => (s.day ?? 1) === selectedDay) : [];
  const maxEditDay = activePlan ? Math.max(activePlan.stops.reduce((m, s) => Math.max(m, s.day ?? 1), 1), editDay) : editDay;

  return (
    <div style={{ minHeight: "100vh", background: "transparent" }}>

      {/* ════ HEADER ════ */}
      <div className="planner-header">
        <Link href="/dashboard" style={{ color: "#64748b", textDecoration: "none", fontSize: 20, lineHeight: 1, padding: "4px 8px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", flexShrink: 0 }}>←</Link>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#1e293b", whiteSpace: "nowrap" }}>📅 วางแผนเที่ยว</div>
          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.5px" }}>TRIP PLANNER</div>
        </div>
        <div style={{ flex: 1 }} />
        {activePlan && (
          <div className="planner-header-actions">
            <button onClick={togglePublic} style={{
              padding: "7px 14px", borderRadius: 20, border: "1.5px solid",
              borderColor: activePlan.isPublic ? "#10b981" : "#e2e8f0",
              background: activePlan.isPublic ? "#ecfdf5" : "#f8fafc",
              color: activePlan.isPublic ? "#065f46" : "#64748b",
              fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 5, flexShrink: 0, whiteSpace: "nowrap"
            }}>
              {activePlan.isPublic ? "🌐 สาธารณะ" : "🔒 ส่วนตัว"}
            </button>
            {activePlan.isPublic && shareUrl && (
              <button onClick={copyLink} style={{
                padding: "7px 14px", borderRadius: 20, border: "1.5px solid #3b82f6",
                background: "#eff6ff", color: "#1d4ed8", fontWeight: 700, fontSize: 12,
                cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, flexShrink: 0, whiteSpace: "nowrap"
              }}>
                🔗 คัดลอกลิงก์
              </button>
            )}
            <Link href={`/planner/${activePlan.id}`} target="_blank" style={{
              padding: "7px 14px", borderRadius: 20, border: "1.5px solid #7c3aed",
              background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", color: "#6d28d9", fontWeight: 800, fontSize: 12,
              textDecoration: "none", display: "flex", alignItems: "center", gap: 5, flexShrink: 0, whiteSpace: "nowrap"
            }}>
              📤 แชร์
            </Link>
          </div>
        )}
      </div>

      {/* ════ 3-COLUMN LAYOUT ════ */}
      <style>{`
        .planner-header {
          background: rgba(255,255,255,0.90); border-bottom: 1px solid #e2e8f0;
          padding: 0 24px; display: flex; align-items: center; gap: 16px;
          min-height: 56px; position: sticky; top: 60px; z-index: 100;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .planner-header-actions { display:flex; gap:8px; align-items:center; }

        .planner-grid { display:grid; grid-template-columns:260px 1fr 320px; height:calc(100vh - 116px); overflow:hidden; }
        .planner-sidebar { display:flex; flex-direction:column; overflow:hidden; }
        .planner-right { overflow-y:auto; }

        @media (max-width: 900px) {
          .planner-grid { grid-template-columns:1fr; height:auto; overflow:visible; }
          .planner-sidebar { height:auto; max-height:40vh; overflow-y:auto; border-right:none !important; border-bottom:1px solid #e2e8f0; }
          .planner-right { max-height:none; border-left:none !important; }
        }
        @media (max-width: 640px) {
          .planner-sidebar { max-height:50vh; }
          .planner-header { padding: 8px 14px; flex-wrap: wrap; gap: 8px 10px; }
          .planner-header-actions {
            width: 100%; overflow-x: auto; scrollbar-width: none; padding-bottom: 4px;
          }
          .planner-header-actions::-webkit-scrollbar { display: none; }
        }
      `}</style>
      <div className="planner-grid" style={{ maxWidth: 1400, margin: "0 auto", width: "100%", borderLeft: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }}>

        {/* ── COL 1: Plans sidebar ── */}
        <div className="planner-sidebar" style={{ borderRight: "1px solid #e2e8f0", background: "rgba(255,255,255,0.90)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
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
                <ProvinceSelect value={nProv} onChange={v => setNProv(v)} style={inp} />
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
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:"1px solid #f8fafc"}}>
                <div style={{position:"relative",width:36,height:36,borderRadius:10,background:"#f1f5f9",flexShrink:0,overflow:"hidden"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.00s`}}/>
                </div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                  <div style={{position:"relative",width:"70%",height:9,borderRadius:5,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.1s`}}/>
            </div>
                  <div style={{position:"relative",width:"45%",height:7,borderRadius:4,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.2s`}}/>
            </div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:"1px solid #f8fafc"}}>
                <div style={{position:"relative",width:36,height:36,borderRadius:10,background:"#f1f5f9",flexShrink:0,overflow:"hidden"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.08s`}}/>
                </div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                  <div style={{position:"relative",width:"70%",height:9,borderRadius:5,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.18s`}}/>
            </div>
                  <div style={{position:"relative",width:"45%",height:7,borderRadius:4,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.28s`}}/>
            </div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:"1px solid #f8fafc"}}>
                <div style={{position:"relative",width:36,height:36,borderRadius:10,background:"#f1f5f9",flexShrink:0,overflow:"hidden"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.16s`}}/>
                </div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                  <div style={{position:"relative",width:"70%",height:9,borderRadius:5,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.26s`}}/>
            </div>
                  <div style={{position:"relative",width:"45%",height:7,borderRadius:4,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.36s`}}/>
            </div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:"1px solid #f8fafc"}}>
                <div style={{position:"relative",width:36,height:36,borderRadius:10,background:"#f1f5f9",flexShrink:0,overflow:"hidden"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.24s`}}/>
                </div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                  <div style={{position:"relative",width:"70%",height:9,borderRadius:5,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.33999999999999997s`}}/>
            </div>
                  <div style={{position:"relative",width:"45%",height:7,borderRadius:4,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.44s`}}/>
            </div>
                </div>
              </div>
              <style>{"@keyframes _sh{0%{background-position:200% 0}100%{background-position:-200% 0}}"}</style>
            </div>
            ) : plans.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>ยังไม่มีแผนเที่ยว</div>
                <div style={{ fontSize: 11, lineHeight: 1.7 }}>กด &ldquo;+ สร้างแผนใหม่&rdquo;<br />เพื่อเริ่มวางแผน</div>
              </div>
            ) : plans.map(plan => {
              const isActive = activePlan?.id === plan.id;
              const past = isPastPlan(plan);
              return (
                <div key={plan.id} onClick={() => setActivePlan(plan)} style={{
                  padding: "12px 16px", cursor: "pointer", transition: "background 0.15s",
                  borderLeft: `4px solid ${isActive ? (past ? "#f59e0b" : "#3b82f6") : (past ? "#fde68a" : "transparent")}`,
                  background: isActive ? (past ? "linear-gradient(90deg,#fffbeb,#fef9c3)" : "linear-gradient(90deg,#eff6ff,#f8faff)") : "transparent",
                  borderBottom: "1px solid #f8fafc",
                  opacity: past && !isActive ? 0.75 : 1,
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: isActive ? (past ? "#92400e" : "#1d4ed8") : "#1e293b", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{past ? "⏰" : plan.isPublic ? "🌐" : "📋"}</span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{plan.title}</span>
                    {past && <span style={{ fontSize: 9, fontWeight: 800, background: "#fef3c7", color: "#92400e", padding: "1px 6px", borderRadius: 999, flexShrink: 0 }}>ผ่านแล้ว</span>}
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
        <div className="planner-right" style={{ overflowY: "auto", padding: "24px 20px" }}>
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
                  จัดลำดับ · แชร์ใน LINE/Facebook · บันทึกเป็น PDF
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
              {(() => {
                const past = isPastPlan(activePlan);
                const gradient = past
                  ? "linear-gradient(135deg,#78350f,#92400e)"
                  : "linear-gradient(135deg,#1e293b,#334155)";
                return (
                  <div style={{
                    borderRadius: 24, marginBottom: 20, overflow: "hidden",
                    boxShadow: "0 8px 32px rgba(30,41,59,0.2)", position: "relative",
                  }}>
                    {/* Cover image */}
                    {activePlan.coverUrl && (
                      <div style={{ height: 140, overflow: "hidden", position: "relative" }}>
                        <img src={activePlan.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
                      </div>
                    )}
                    <div style={{ background: gradient, padding: "22px 24px", color: "#fff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" as const }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: past ? "#fcd34d" : "#94a3b8", letterSpacing: "1px" }}>
                              {activePlan.isPublic ? "🌐 สาธารณะ" : "🔒 ส่วนตัว"} · ITINERARY
                            </span>
                            {past && (
                              <span style={{ fontSize: 11, fontWeight: 800, background: "#f59e0b", color: "#fff", padding: "2px 10px", borderRadius: 999 }}>
                                ⏰ ผ่านมาแล้ว · Past Trip
                              </span>
                            )}
                          </div>
                          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#fff" }}>{activePlan.title}</h2>
                          {activePlan.description && <p style={{ margin: "6px 0 0", fontSize: 13, color: "#94a3b8" }}>{activePlan.description}</p>}
                          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" as const }}>
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
                        {/* Cover upload button */}
                        <div>
                          <input ref={coverInputRef} type="file" accept="image/*" onChange={uploadCover} style={{ display: "none" }} />
                          <button onClick={() => coverInputRef.current?.click()} disabled={uploadingCover} title="เปลี่ยนรูปปก · Change cover" style={{
                            width: 40, height: 40, borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.25)",
                            background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: 18,
                            cursor: uploadingCover ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            backdropFilter: "blur(4px)", flexShrink: 0,
                          }}>
                            {uploadingCover ? "⏳" : "🖼️"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

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
                    <ProvinceSelect value={customProv} onChange={v => { setCustomProv(v); setCustomDist(""); }} placeholder="จังหวัด · Province" style={inp} />
                    <select value={customDist} onChange={e => setCustomDist(e.target.value)} disabled={!customProv} style={inp}>
                      <option value="">อำเภอ · District</option>
                      {getDistricts(customProv).map(d => <option key={d} value={d.split(" (")[0]}>{d}</option>)}
                    </select>
                  </div>
                  <select value={String(customDay)} onChange={e => setCustomDay(Number(e.target.value))} style={{ ...inp, marginBottom: 8 }}>
                    {Array.from({ length: totalDays + 1 }, (_, i) => i + 1).map(d => {
                      const dl = getDateLabel(d);
                      return (
                        <option key={d} value={d}>
                          📅 วันที่ {d} · Day {d}{dl ? ` (${dl.en})` : ""}
                        </option>
                      );
                    })}
                  </select>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                    <div>
                      <label style={{ fontSize:10, fontWeight:700, color:"#64748b", display:"block", marginBottom:3 }}>🕐 เวลาที่คาดว่าจะถึง</label>
                      <input type="time" value={customArrival} onChange={e => setCustomArrival(e.target.value)}
                        style={{ ...inp, background:"#f0f9ff", border:"1.5px solid #bae6fd" }} />
                    </div>
                    <div>
                      <label style={{ fontSize:10, fontWeight:700, color:"#64748b", display:"block", marginBottom:3 }}>⏱ เวลาที่ใช้ (นาที)</label>
                      <input type="number" min="0" step="15" value={customDuration}
                        onChange={e => setCustomDuration(e.target.value)} placeholder="เช่น 60"
                        style={{ ...inp, background:"#f0fdf4", border:"1.5px solid #bbf7d0" }} />
                    </div>
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
              <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:8, marginBottom:12, scrollbarWidth:"none" as const }}>
                {Array.from({ length: totalDays }, (_, i) => i + 1).map(dayNum => {
                  const cnt = activePlan.stops.filter(s => (s.day ?? 1) === dayNum).length;
                  const isAct = selectedDay === dayNum;
                  const dl = getDateLabel(dayNum);
                  return (
                    <button key={dayNum} onClick={() => { setSelectedDay(dayNum); setCustomDay(dayNum); }} style={{
                      flexShrink:0, padding:"8px 14px", borderRadius:14,
                      border:`2px solid ${isAct ? "#3b82f6" : "#e2e8f0"}`,
                      background: isAct ? "#eff6ff" : "#f8fafc",
                      color: isAct ? "#1d4ed8" : "#64748b",
                      fontWeight: isAct ? 800 : 600, fontSize:12,
                      cursor:"pointer", fontFamily:"inherit",
                      display:"flex", flexDirection:"column" as const, alignItems:"center", gap:2,
                    }}>
                      <span style={{ fontSize:12, fontWeight:800 }}>วันที่ {dayNum}</span>
                      <span style={{ fontSize:9, color: isAct ? "#93c5fd" : "#94a3b8", fontWeight:600 }}>Day {dayNum}</span>
                      {dl && (
                        <span style={{ fontSize:10, color: isAct ? "#3b82f6" : "#64748b", fontWeight:700 }}>
                          {dl.th}
                        </span>
                      )}
                      {dl && (
                        <span style={{ fontSize:9, color: isAct ? "#93c5fd" : "#94a3b8" }}>{dl.en}</span>
                      )}
                      <span style={{ fontSize:10, color: isAct ? "#3b82f6" : "#94a3b8", marginTop:2 }}>🚩 {cnt} จุด</span>
                    </button>
                  );
                })}
                <button onClick={() => { const nd = totalDays + 1; setSelectedDay(nd); setCustomDay(nd); }} style={{
                  flexShrink:0, padding:"8px 14px", borderRadius:14,
                  border:"2px dashed #c7d2fe", background:"#f5f3ff", color:"#7c3aed",
                  fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit",
                  display:"flex", flexDirection:"column" as const, alignItems:"center", gap:2,
                }}>
                  <span>+ เพิ่มวัน</span>
                  <span style={{ fontSize:9, color:"#a78bfa" }}>+ Add Day</span>
                </button>
              </div>

              {/* Day header divider */}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <div style={{ flex:1, height:1, background:"#e2e8f0" }} />
                <div style={{ fontWeight:800, fontSize:13, color:"#3b82f6", background:"#eff6ff",
                  borderRadius:20, padding:"4px 16px", border:"1px solid #bfdbfe",
                  display:"flex", alignItems:"center", gap:8, flexDirection:"column" as const }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span>☀️</span>
                    <span>วันที่ {selectedDay} · Day {selectedDay}</span>
                    {getDateLabel(selectedDay) && (
                      <span style={{ fontWeight:700, color:"#3b82f6", fontSize:12 }}>
                        {getDateLabel(selectedDay)!.th}
                        <span style={{ fontWeight:500, color:"#93c5fd", marginLeft:4 }}>({getDateLabel(selectedDay)!.en})</span>
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ flex:1, height:1, background:"#e2e8f0" }} />
              </div>

              {/* Stops for selected day — drag-and-drop */}
              {stopsForDay.length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px 0", color: "#94a3b8" }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>📅</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#64748b", marginBottom: 4 }}>ยังไม่มีจุดในวันที่ {selectedDay} · No stops for Day {selectedDay}</div>
                  <div style={{ fontSize: 12, lineHeight: 1.7 }}>เพิ่มจุดแวะจากแผงขวา<br />หรือกด &ldquo;เพิ่มจุดแวะเอง&rdquo; ด้านบน</div>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event: DragEndEvent) => {
                    const { active, over } = event;
                    if (!over || active.id === over.id) return;
                    const oldIdx = stopsForDay.findIndex(s => s.id === active.id);
                    const newIdx = stopsForDay.findIndex(s => s.id === over.id);
                    const reordered = arrayMove(stopsForDay, oldIdx, newIdx);
                    // Rebuild full stop list with new order within this day
                    const otherStops = activePlan!.stops.filter(s => (s.day ?? 1) !== selectedDay);
                    const allNewStops = [...otherStops, ...reordered].sort((a, b) =>
                      a.day !== b.day ? (a.day ?? 1) - (b.day ?? 1) : a.order - b.order
                    );
                    // Persist
                    reorderStops(reordered.map(s => s.id));
                  }}
                >
                  <SortableContext items={stopsForDay.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    <div>
                      {stopsForDay.map((stop, idx) => (
                        <SortableStopCard
                          key={stop.id}
                          stop={stop}
                          idx={idx}
                          total={stopsForDay.length}
                          onEdit={() => { setEditStop(stop); setEditNotes(stop.notes ?? ""); setEditMaps(stop.googleMapsUrl ?? ""); setEditArrival((stop as any).arrivalTime ?? ""); setEditDuration((stop as any).duration ? String((stop as any).duration) : ""); setEditDay(stop.day ?? 1); }}
                          onRemove={() => removeStop(stop.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </>
          )}
        </div>

        {/* ── COL 3: Search + Bookmarks ── */}
        <div className="planner-right" style={{ borderLeft: "1px solid #e2e8f0", background: "rgba(255,255,255,0.90)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
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
                <ProvinceSelect value={sProv} onChange={v => { setSProv(v); setSDist(""); }} placeholder="📍 ทุกจังหวัด · All Provinces" style={{ ...inp, marginBottom: 6 }} />
                {sProv && (
                  <select value={sDist} onChange={e => setSDist(e.target.value)} style={{ ...inp, marginBottom: 6 }}>
                    <option value="">ทุกอำเภอ · All Districts</option>
                    {getDistricts(sProv).map(d => <option key={d} value={d.split(" (")[0]}>{d}</option>)}
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
                    {(p.communityCover || p.coverUrl) ? (
                      <img src={(p.communityCover || p.coverUrl)!} alt="" style={{ width: "100%", height: 80, objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: 80, background: "linear-gradient(135deg,#e0f2fe,#d1fae5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🏛️</div>
                    )}
                    <div style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 2 }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
                        📍 {p.province}{p.district ? ` · ${p.district}` : ""} &nbsp;·&nbsp; {p.category}
                      </div>
                      <button disabled={!activePlan || addingToStop === p.id} onClick={() => addStop({
                        name: p.title, province: p.province, district: p.district,
                        googleMapsUrl: p.googleMapsUrl, stopType: "ATTRACTION", placeId: p.id,
                      })} style={{
                        width: "100%", padding: "7px", borderRadius: 10, border: "none",
                        background: !activePlan ? "#e2e8f0" : addingToStop === p.id ? "#93c5fd" : "linear-gradient(135deg,#3b82f6,#6366f1)",
                        color: !activePlan ? "#94a3b8" : "#fff",
                        fontWeight: 700, fontSize: 12,
                        cursor: activePlan ? "pointer" : "not-allowed", fontFamily: "inherit"
                      }}>
                        {!activePlan ? "เลือกแผนก่อน · Select plan first" : addingToStop === p.id ? "⏳ กำลังเพิ่ม..." : "+ เพิ่มในแผน · Add to Plan"}
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
              <div>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:"1px solid #f8fafc"}}>
                <div style={{position:"relative",width:36,height:36,borderRadius:10,background:"#f1f5f9",flexShrink:0,overflow:"hidden"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.10s`}}/>
                </div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                  <div style={{position:"relative",width:"70%",height:9,borderRadius:5,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.2s`}}/>
            </div>
                  <div style={{position:"relative",width:"45%",height:7,borderRadius:4,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.30000000000000004s`}}/>
            </div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:"1px solid #f8fafc"}}>
                <div style={{position:"relative",width:36,height:36,borderRadius:10,background:"#f1f5f9",flexShrink:0,overflow:"hidden"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.18s`}}/>
                </div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                  <div style={{position:"relative",width:"70%",height:9,borderRadius:5,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.28s`}}/>
            </div>
                  <div style={{position:"relative",width:"45%",height:7,borderRadius:4,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.38s`}}/>
            </div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:"1px solid #f8fafc"}}>
                <div style={{position:"relative",width:36,height:36,borderRadius:10,background:"#f1f5f9",flexShrink:0,overflow:"hidden"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.26s`}}/>
                </div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                  <div style={{position:"relative",width:"70%",height:9,borderRadius:5,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.36s`}}/>
            </div>
                  <div style={{position:"relative",width:"45%",height:7,borderRadius:4,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.46s`}}/>
            </div>
                </div>
              </div>
              <style>{"@keyframes _sh{0%{background-position:200% 0}100%{background-position:-200% 0}}"}</style>
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
                        <button disabled={!activePlan || addingToStop === (stop.placeId ?? stop.placeName)} onClick={() => addStop({
                          name: stop.placeName, province: stop.province, district: stop.district,
                          googleMapsUrl: stop.googleMapsUrl ?? undefined,
                          stopType: stop.stopType ?? "ATTRACTION", placeId: stop.placeId ?? undefined,
                        })} style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, border: "none",
                          background: !activePlan ? "#e2e8f0" : addingToStop === (stop.placeId ?? stop.placeName) ? "#93c5fd" : "#3b82f6",
                          color: !activePlan ? "#94a3b8" : "#fff",
                          fontWeight: 900, fontSize: 16, cursor: activePlan ? "pointer" : "not-allowed",
                          fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          {addingToStop === (stop.placeId ?? stop.placeName) ? "⏳" : "+"}
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
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>📅 วันที่ในทริป · Trip Day</label>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" as const }}>
                {Array.from({ length: maxEditDay + 1 }, (_, i) => i + 1).map(d => (
                  <button key={d} type="button" onClick={() => setEditDay(d)} style={{
                    padding:"5px 14px", borderRadius:20,
                    border:`2px solid ${editDay === d ? "#3b82f6" : "#e2e8f0"}`,
                    background: editDay === d ? "#eff6ff" : "#f8fafc",
                    color: editDay === d ? "#1d4ed8" : "#64748b",
                    fontWeight: editDay === d ? 800 : 600, fontSize:12,
                    cursor:"pointer", fontFamily:"inherit"
                  }}>วันที่ {d}</button>
                ))}
              </div>
            </div>
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

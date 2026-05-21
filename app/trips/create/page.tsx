"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { uploadFile } from "@/lib/uploadHelper";
import { PROVINCES, getDistricts } from "@/data/thailand";

const MOODS = [
  { v: "Cafe Hopping", e: "☕" }, { v: "ธรรมชาติ", e: "🌿" }, { v: "ชายหาด", e: "🏖️" },
  { v: "วัฒนธรรม", e: "🏛️" }, { v: "ผจญภัย", e: "🧗" }, { v: "ครอบครัว", e: "👨\u200d👩\u200d👧" },
  { v: "โรแมนติก", e: "💑" }, { v: "Road Trip", e: "🚗" }, { v: "Backpacker", e: "🎒" }, { v: "ทั่วไป", e: "✈️" },
];
const TRIP_STYLES = [
  { v: "SOLO",    label: "คนเดียว · Solo",         icon: "🧍" },
  { v: "COUPLE",  label: "คู่รัก · Couple",         icon: "💑" },
  { v: "FAMILY",  label: "ครอบครัว · Family",       icon: "👨\u200d👩\u200d👧" },
  { v: "FRIENDS", label: "กลุ่มเพื่อน · Friends",  icon: "👫" },
];
const TRANSPORT_MODES = [
  { v: "รถยนต์ส่วนตัว", icon: "🚗" }, { v: "รถทัวร์", icon: "🚌" }, { v: "เครื่องบิน", icon: "✈️" },
  { v: "รถไฟ", icon: "🚆" }, { v: "มอเตอร์ไซค์", icon: "🏍️" }, { v: "เรือ", icon: "⛵" }, { v: "ผสมหลายอย่าง", icon: "🔀" },
];
const STOP_TYPES = [
  { v: "ATTRACTION", label: "ที่เที่ยว", icon: "🏞️" },
  { v: "EAT",        label: "ร้านอาหาร", icon: "🍽️" },
  { v: "SLEEP",      label: "ที่พัก",    icon: "🏨" },
  { v: "ACTIVITY",   label: "กิจกรรม",  icon: "🎯" },
  { v: "TRANSPORT",  label: "เดินทาง",  icon: "🚌" },
];
const TRANSPORT_PER_STOP = ["รถส่วนตัว","รถทัวร์","เครื่องบิน","รถไฟ","เรือ","มอเตอร์ไซค์","เดินเท้า","อื่นๆ"];

interface Stop {
  date: string; time: string; place: string; province: string; district: string;
  description: string; imageFile: File | null; imagePreview: string | null;
  placeId: string | null; placeSlug: string | null;
  stopType: string; googleMapsUrl: string; tips: string;
  transport: string; duration: string; cost: string;
}

const sectionTitle: React.CSSProperties = { fontSize: 17, fontWeight: 800, color: "#1e293b", margin: "0 0 18px" };
const labelStyle: React.CSSProperties = { display: "block", fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 6 };
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #e2e8f0",
  background: "#f8fafc", fontSize: 14, fontFamily: "inherit", outline: "none",
  boxSizing: "border-box" as const, color: "#1e293b",
};

export default function CreateTripPage() {
  const router   = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user && (user.role === "ADMIN" || user.role === "SUPERADMIN")) router.replace("/admin");
  }, [user, router]);

  if (user && (user.role === "ADMIN" || user.role === "SUPERADMIN")) return null;

  const today = new Date().toISOString().split("T")[0];

  const [coverFile,     setCoverFile    ] = useState<File | null>(null);
  const [coverPreview,  setCoverPreview ] = useState<string | null>(null);
  const [title,         setTitle        ] = useState("");
  const [subtitle,      setSubtitle     ] = useState("");
  const [description,   setDescription  ] = useState("");
  const [mood,          setMood         ] = useState("ทั่วไป");
  const [tripStyle,     setTripStyle    ] = useState("");
  const [transportMode, setTransportMode] = useState("");
  const [durationDays,  setDurationDays ] = useState("");
  const [budget,        setBudget       ] = useState("");
  const [tags,          setTags         ] = useState("");
  const [youtubeUrl,    setYoutubeUrl   ] = useState("");
  const [tiktokUrl,     setTiktokUrl    ] = useState("");
  const [timeline,      setTimeline     ] = useState<Stop[]>([
    { date: today, time: "", place: "", province: "", district: "", description: "",
      imageFile: null, imagePreview: null, placeId: null, placeSlug: null,
      stopType: "ATTRACTION", googleMapsUrl: "", tips: "", transport: "", duration: "", cost: "" }
  ]);
  const [placeSuggestions,   setPlaceSuggestions  ] = useState<Record<number, any[]>>({});
  const [placeSearchLoading, setPlaceSearchLoading] = useState<Record<number, boolean>>({});
  const [suggestForm, setSuggestForm] = useState<Record<number, { open: boolean; cat: string; saving: boolean; mapsUrl: string }>>({});
  const placeSearchTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const [isLoading,  setIsLoading ] = useState(false);
  const [error,      setError     ] = useState("");
  const [submitted,  setSubmitted ] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setCoverFile(file); setCoverPreview(URL.createObjectURL(file));
  };

  const updateStop = (index: number, field: keyof Stop, value: any) => {
    const updated = [...timeline];
    (updated[index] as any)[field] = value;
    if (field === "province") updated[index].district = "";
    if (field === "place" && !(value as string).trim()) { updated[index].placeId = null; updated[index].placeSlug = null; }
    setTimeline(updated);
  };

  const handleStopImage = (index: number, file: File | null) => {
    if (!file) return;
    updateStop(index, "imageFile", file);
    updateStop(index, "imagePreview", URL.createObjectURL(file));
  };

  const addStop = () => setTimeline([...timeline, {
    date: today, time: "", place: "", province: "", district: "", description: "",
    imageFile: null, imagePreview: null, placeId: null, placeSlug: null,
    stopType: "ATTRACTION", googleMapsUrl: "", tips: "", transport: "", duration: "", cost: "",
  }]);

  const removeStop = (i: number) => setTimeline(timeline.filter((_, idx) => idx !== i));

  const searchPlaces = (idx: number, q: string) => {
    clearTimeout(placeSearchTimers.current[idx]);
    if (!q.trim() || q.length < 2) { setPlaceSuggestions(p => ({ ...p, [idx]: [] })); return; }
    placeSearchTimers.current[idx] = setTimeout(async () => {
      setPlaceSearchLoading(l => ({ ...l, [idx]: true }));
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(q)}&limit=6`);
        const data = await res.json();
        setPlaceSuggestions(p => ({ ...p, [idx]: data.places ?? [] }));
      } catch {}
      setPlaceSearchLoading(l => ({ ...l, [idx]: false }));
    }, 350);
  };

  const selectPlace = (idx: number, p: any) => {
    const updated = [...timeline];
    updated[idx].place    = p.title;
    updated[idx].province = p.province ?? "";
    updated[idx].district = p.district ?? "";
    updated[idx].placeId  = p.id;
    updated[idx].placeSlug = p.slug;
    if (p.googleMapsUrl) updated[idx].googleMapsUrl = p.googleMapsUrl;
    setTimeline(updated);
    setPlaceSuggestions(s => ({ ...s, [idx]: [] }));
  };

  const openSuggest  = (idx: number) => setSuggestForm(f => ({ ...f, [idx]: { open: true, cat: "NATURE", saving: false, mapsUrl: "" } }));
  const closeSuggest = (idx: number) => setSuggestForm(f => ({ ...f, [idx]: { ...f[idx], open: false } }));

  const suggestPlace = async (idx: number) => {
    const form = suggestForm[idx]; const stop = timeline[idx];
    if (!stop.place.trim()) return;
    setSuggestForm(f => ({ ...f, [idx]: { ...f[idx], saving: true } }));
    try {
      const res = await fetch("/api/places/suggest", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: stop.place, province: stop.province || "ไม่ระบุ",
          district: stop.district || "ไม่ระบุ", category: form.cat, googleMapsUrl: form.mapsUrl || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = [...timeline];
        updated[idx].placeId   = data.place?.id ?? null;
        updated[idx].placeSlug = data.place?.slug ?? null;
        setTimeline(updated); closeSuggest(idx);
      }
    } catch {}
    setSuggestForm(f => ({ ...f, [idx]: { ...f[idx], saving: false } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("กรุณากรอกชื่อทริป"); return; }
    if (!coverFile)    { setError("กรุณาเลือกรูปปก");   return; }
    setIsLoading(true); setError("");
    try {
      const coverUrl = await uploadFile(coverFile, "trips");
      const stopImages = await Promise.all(
        timeline.map(s => s.imageFile ? uploadFile(s.imageFile, "trips") : Promise.resolve(null))
      );
      const body = {
        title, subtitle, description, coverUrl, mood, tripStyle, transportMode,
        durationDays: durationDays ? Number(durationDays) : null,
        budget: budget ? Number(budget) : null,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        youtubeUrl: youtubeUrl || null, tiktokUrl: tiktokUrl || null,
        timeline: timeline.map((s, i) => ({
          date: s.date, time: s.time || null, place: s.place, province: s.province, district: s.district,
          description: s.description, stopType: s.stopType, googleMapsUrl: s.googleMapsUrl || null,
          tips: s.tips || null, transport: s.transport || null, duration: s.duration || null,
          cost: s.cost || null, placeId: s.placeId ?? null, images: stopImages[i] ? [stopImages[i]] : [],
        })),
      };
      const res = await fetch("/api/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); setError(d.message || "เกิดข้อผิดพลาด"); }
      else setSubmitted(true);
    } catch { setError("เกิดข้อผิดพลาดในการบันทึก"); }
    finally { setIsLoading(false); }
  };

  const resetForm = () => {
    setSubmitted(false); setTitle(""); setSubtitle(""); setDescription(""); setMood("ทั่วไป");
    setTripStyle(""); setTransportMode(""); setDurationDays(""); setBudget(""); setTags("");
    setYoutubeUrl(""); setTiktokUrl(""); setCoverFile(null); setCoverPreview(null); setActiveStep(0);
    setTimeline([{ date: today, time: "", place: "", province: "", district: "", description: "",
      imageFile: null, imagePreview: null, placeId: null, placeSlug: null,
      stopType: "ATTRACTION", googleMapsUrl: "", tips: "", transport: "", duration: "", cost: "" }]);
  };

  if (submitted) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg,#f0f9ff,#ecfdf5)", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 32, padding: "60px 48px", maxWidth: 520,
        textAlign: "center", boxShadow: "0 30px 80px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: "#1e293b", marginBottom: 12 }}>ส่งทริปสำเร็จ!</h2>
        <p style={{ color: "#64748b", marginBottom: 8 }}>ทริปของคุณถูกส่งเพื่อรอการตรวจสอบจากแอดมิน</p>
        <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 32 }}>โดยปกติใช้เวลา 1–2 วันทำการ หลังอนุมัติจะแสดงในหน้า Trips</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/dashboard" style={{ padding: "12px 28px", borderRadius: 14, border: "2px solid #e2e8f0",
            color: "#374151", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>ไปยัง Dashboard</Link>
          <button onClick={resetForm} style={{ padding: "12px 28px", borderRadius: 14, border: "none",
            background: "linear-gradient(135deg,#3b82f6,#10b981)", color: "#fff",
            fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>+ สร้างทริปใหม่</button>
        </div>
      </div>
    </div>
  );

  const stepBtn = (label: string, i: number) => (
    <button type="button" key={i} onClick={() => setActiveStep(i)} style={{
      padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
      fontWeight: activeStep === i ? 800 : 500, fontSize: 13, fontFamily: "inherit",
      background: activeStep === i ? "#3b82f6" : "#f1f5f9",
      color: activeStep === i ? "#fff" : "#64748b" }}>{label}</button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
      {/* Sticky header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 24px",
        display: "flex", alignItems: "center", gap: 16, height: 60, position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/dashboard" style={{ color: "#64748b", textDecoration: "none", fontSize: 22 }}>←</Link>
        <span style={{ fontWeight: 900, fontSize: 18, color: "#1e293b", flex: 1 }}>✍️ เขียนทริปใหม่ · Create Trip</span>
        <div style={{ display: "flex", gap: 6 }}>
          {["📋 ข้อมูล", "📍 จุดแวะ", "👁️ Preview"].map(stepBtn)}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>

          {/* ════ STEP 0: Basic Info ════ */}
          {activeStep === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Cover */}
              <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <h3 style={sectionTitle}>🖼️ รูปปก · Cover Photo</h3>
                <label style={{ display: "block", width: "100%", height: 260, borderRadius: 18,
                  border: coverPreview ? "none" : "3px dashed #cbd5e1", background: coverPreview ? "transparent" : "#f8fafc",
                  overflow: "hidden", cursor: "pointer", position: "relative" }}>
                  {coverPreview
                    ? <img src={coverPreview} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: 12, color: "#94a3b8" }}>
                        <span style={{ fontSize: 48 }}>📷</span>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>คลิกเพื่ออัปโหลดรูปปก</span>
                        <span style={{ fontSize: 12 }}>แนะนำ 1200×630px</span>
                      </div>}
                  <input type="file" hidden accept="image/*" onChange={handleCoverUpload} />
                </label>
              </div>

              {/* Basic info */}
              <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <h3 style={sectionTitle}>📋 ข้อมูลพื้นฐาน · Basic Info</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>ชื่อทริป · Title <span style={{ color: "#ef4444" }}>*</span></label>
                    <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)}
                      placeholder="เช่น: เชียงใหม่ 3 วัน 2 คืน สายธรรมชาติ" />
                  </div>
                  <div>
                    <label style={labelStyle}>คำโปรย · Subtitle</label>
                    <input style={inputStyle} value={subtitle} onChange={e => setSubtitle(e.target.value)}
                      placeholder="ประโยคสั้นๆ ดึงดูดความสนใจ" />
                  </div>
                  <div>
                    <label style={labelStyle}>เรื่องราว · Story</label>
                    <textarea style={{ ...inputStyle, height: 120, resize: "vertical" as const }}
                      value={description} onChange={e => setDescription(e.target.value)}
                      placeholder="เล่าความประทับใจ สิ่งที่ได้เรียนรู้..." />
                  </div>
                </div>
              </div>

              {/* Style */}
              <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <h3 style={sectionTitle}>🎨 สไตล์ทริป · Trip Style</h3>
                <label style={labelStyle}>ธีม / มูด · Mood</label>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 18 }}>
                  {MOODS.map(m => (
                    <button key={m.v} type="button" onClick={() => setMood(m.v)} style={{
                      padding: "8px 16px", borderRadius: 20, border: "2px solid",
                      borderColor: mood === m.v ? "#3b82f6" : "#e2e8f0",
                      background: mood === m.v ? "#eff6ff" : "#f8fafc",
                      color: mood === m.v ? "#1d4ed8" : "#64748b",
                      fontWeight: mood === m.v ? 800 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                      {m.e} {m.v}
                    </button>
                  ))}
                </div>
                <label style={labelStyle}>รูปแบบ · Trip Type</label>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 18 }}>
                  {TRIP_STYLES.map(s => (
                    <button key={s.v} type="button" onClick={() => setTripStyle(tripStyle === s.v ? "" : s.v)} style={{
                      padding: "8px 18px", borderRadius: 20, border: "2px solid",
                      borderColor: tripStyle === s.v ? "#10b981" : "#e2e8f0",
                      background: tripStyle === s.v ? "#ecfdf5" : "#f8fafc",
                      color: tripStyle === s.v ? "#065f46" : "#64748b",
                      fontWeight: tripStyle === s.v ? 800 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
                <label style={labelStyle}>ยานพาหนะหลัก · Main Transport</label>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                  {TRANSPORT_MODES.map(t => (
                    <button key={t.v} type="button" onClick={() => setTransportMode(transportMode === t.v ? "" : t.v)} style={{
                      padding: "8px 16px", borderRadius: 20, border: "2px solid",
                      borderColor: transportMode === t.v ? "#f59e0b" : "#e2e8f0",
                      background: transportMode === t.v ? "#fffbeb" : "#f8fafc",
                      color: transportMode === t.v ? "#92400e" : "#64748b",
                      fontWeight: transportMode === t.v ? 800 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                      {t.icon} {t.v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <h3 style={sectionTitle}>💼 รายละเอียด · Details</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>จำนวนวัน · Duration (days)</label>
                    <input style={inputStyle} type="number" min="1" max="365" value={durationDays}
                      onChange={e => setDurationDays(e.target.value)} placeholder="เช่น 3" />
                  </div>
                  <div>
                    <label style={labelStyle}>งบประมาณรวม · Total Budget (฿)</label>
                    <input style={inputStyle} type="number" min="0" value={budget}
                      onChange={e => setBudget(e.target.value)} placeholder="เช่น 5000" />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={labelStyle}>แท็ก · Tags <span style={{ color: "#94a3b8", fontWeight: 400 }}>คั่นด้วยคอมมา</span></label>
                    <input style={inputStyle} value={tags} onChange={e => setTags(e.target.value)}
                      placeholder="เช่น: เชียงใหม่, ธรรมชาติ, งบน้อย" />
                  </div>
                  <div>
                    <label style={labelStyle}>🎬 YouTube URL</label>
                    <input style={inputStyle} value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)}
                      placeholder="https://youtube.com/..." />
                  </div>
                  <div>
                    <label style={labelStyle}>🎵 TikTok URL</label>
                    <input style={inputStyle} value={tiktokUrl} onChange={e => setTiktokUrl(e.target.value)}
                      placeholder="https://tiktok.com/..." />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setActiveStep(1)} style={{
                  padding: "14px 36px", borderRadius: 16, border: "none",
                  background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                  color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer", fontFamily: "inherit" }}>
                  ถัดไป: จุดแวะ →
                </button>
              </div>
            </div>
          )}

          {/* ════ STEP 1: Stops ════ */}
          {activeStep === 1 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontWeight: 900, fontSize: 22, color: "#1e293b", margin: 0 }}>
                  📍 จุดแวะระหว่างทาง · Stops ({timeline.length})
                </h2>
                <button type="button" onClick={() => setActiveStep(0)} style={{
                  padding: "8px 20px", borderRadius: 14, border: "2px solid #e2e8f0",
                  background: "#fff", color: "#64748b", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  ← ย้อนกลับ
                </button>
              </div>

              {timeline.map((stop, idx) => (
                <div key={idx} style={{ background: "#fff", borderRadius: 24, padding: 24,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 20 }}>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%",
                      background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, flexShrink: 0 }}>
                      {idx + 1}
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 17, color: "#1e293b", flex: 1 }}>จุดที่ {idx + 1} · Stop {idx + 1}</span>
                    {timeline.length > 1 && (
                      <button type="button" onClick={() => removeStop(idx)} style={{
                        width: 32, height: 32, borderRadius: "50%", border: "none",
                        background: "#fee2e2", color: "#ef4444", fontWeight: 900, fontSize: 18,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    )}
                  </div>

                  {/* Stop type */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>ประเภทจุดแวะ · Stop Type</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                      {STOP_TYPES.map(t => (
                        <button key={t.v} type="button" onClick={() => updateStop(idx, "stopType", t.v)} style={{
                          padding: "7px 14px", borderRadius: 14, border: "2px solid",
                          borderColor: stop.stopType === t.v ? "#3b82f6" : "#e2e8f0",
                          background: stop.stopType === t.v ? "#eff6ff" : "#f8fafc",
                          color: stop.stopType === t.v ? "#1d4ed8" : "#64748b",
                          fontWeight: stop.stopType === t.v ? 800 : 500, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                          {t.icon} {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date/Time */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={labelStyle}>วันที่ · Date</label>
                      <input style={inputStyle} type="date" value={stop.date} onChange={e => updateStop(idx, "date", e.target.value)} />
                    </div>
                    <div>
                      <label style={labelStyle}>เวลา · Time</label>
                      <input style={inputStyle} type="time" value={stop.time} onChange={e => updateStop(idx, "time", e.target.value)} />
                    </div>
                  </div>

                  {/* Place search */}
                  <div style={{ marginBottom: 14, position: "relative" }}>
                    <label style={labelStyle}>ชื่อสถานที่ · Place Name</label>
                    <div style={{ position: "relative" }}>
                      <input style={{ ...inputStyle, paddingLeft: stop.placeId ? 40 : 16 }}
                        value={stop.place}
                        onChange={e => { updateStop(idx, "place", e.target.value); searchPlaces(idx, e.target.value); }}
                        placeholder="ค้นหาสถานที่ในระบบ หรือพิมพ์ชื่อใหม่..." />
                      {stop.placeId && <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>✅</span>}
                    </div>
                    {(placeSuggestions[idx]?.length > 0 || placeSearchLoading[idx]) && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "#fff",
                        border: "1.5px solid #e2e8f0", borderRadius: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", overflow: "hidden", marginTop: 4 }}>
                        {placeSearchLoading[idx]
                          ? <div style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 13 }}>🔍 กำลังค้นหา...</div>
                          : placeSuggestions[idx].map((p: any) => (
                            <div key={p.id} onClick={() => selectPlace(idx, p)} style={{
                              padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f1f5f9",
                              display: "flex", gap: 10, alignItems: "center" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                              onMouseLeave={e => (e.currentTarget.style.background = "")}>
                              <span style={{ fontSize: 20 }}>📍</span>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{p.title}</div>
                                <div style={{ fontSize: 12, color: "#64748b" }}>{p.province} · {p.category}</div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    )}
                    {stop.place.trim().length >= 2 && !stop.placeId && (
                      <div style={{ marginTop: 8 }}>
                        {!suggestForm[idx]?.open ? (
                          <button type="button" onClick={() => openSuggest(idx)} style={{
                            padding: "7px 14px", borderRadius: 10, border: "1.5px dashed #10b981",
                            background: "#f0fdf4", color: "#10b981", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                            📍 สร้าง &ldquo;{stop.place}&rdquo; เป็นสถานที่ใหม่
                          </button>
                        ) : (
                          <div style={{ background: "#f0fdf4", border: "1.5px solid #6ee7b7", borderRadius: 14, padding: "14px 16px" }}>
                            <div style={{ fontWeight: 800, fontSize: 13, color: "#065f46", marginBottom: 10 }}>📍 สร้างสถานที่ใหม่: {stop.place}</div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, marginBottom: 10 }}>
                              <select value={suggestForm[idx]?.cat ?? "NATURE"}
                                onChange={e => setSuggestForm(f => ({ ...f, [idx]: { ...f[idx], cat: e.target.value } }))}
                                style={{ flex: 1, minWidth: 140, padding: "7px 10px", borderRadius: 8, border: "1.5px solid #d1fae5", fontSize: 12, fontFamily: "inherit", background: "#fff" }}>
                                <option value="NATURE">🌿 ธรรมชาติ</option>
                                <option value="TEMPLE">🛕 วัด/ศาสนสถาน</option>
                                <option value="CAFE">☕ คาเฟ่</option>
                                <option value="FOOD">🍲 อาหาร</option>
                                <option value="BEACH">🏖️ ชายหาด</option>
                                <option value="MARKET">🛍️ ตลาด</option>
                                <option value="ADVENTURE">🧗 ผจญภัย</option>
                                <option value="MUSEUM">🏛️ พิพิธภัณฑ์</option>
                                <option value="ACCOMMODATION">🏨 ที่พัก</option>
                                <option value="CAMPING">⛺ แคมปิ้ง</option>
                              </select>
                              <button type="button" onClick={() => suggestPlace(idx)} disabled={suggestForm[idx]?.saving} style={{
                                padding: "7px 16px", borderRadius: 8, border: "none", background: "#10b981",
                                color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                                {suggestForm[idx]?.saving ? "⏳" : "✓ สร้าง"}
                              </button>
                              <button type="button" onClick={() => closeSuggest(idx)} style={{
                                padding: "7px 12px", borderRadius: 8, border: "1.5px solid #d1fae5",
                                background: "#fff", color: "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>ยกเลิก</button>
                            </div>
                            <input type="url" value={suggestForm[idx]?.mapsUrl ?? ""}
                              onChange={e => setSuggestForm(f => ({ ...f, [idx]: { ...f[idx], mapsUrl: e.target.value } }))}
                              placeholder="Google Maps URL (ไม่บังคับ)"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1.5px solid #d1fae5",
                                fontSize: 12, fontFamily: "inherit", background: "#fff", boxSizing: "border-box" as const }} />
                            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#6b7280" }}>สถานที่จะแสดงหลังได้รับการอนุมัติจากแอดมิน</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Province/District */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={labelStyle}>จังหวัด · Province</label>
                      <select style={inputStyle} value={stop.province} onChange={e => updateStop(idx, "province", e.target.value)}>
                        <option value="">-- เลือกจังหวัด --</option>
                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>อำเภอ/เขต · District</label>
                      <select style={inputStyle} value={stop.district} disabled={!stop.province}
                        onChange={e => updateStop(idx, "district", e.target.value)}>
                        <option value="">-- เลือกอำเภอ --</option>
                        {getDistricts(stop.province).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Maps URL */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>🗺️ Google Maps URL</label>
                    <input style={inputStyle} type="url" value={stop.googleMapsUrl}
                      onChange={e => updateStop(idx, "googleMapsUrl", e.target.value)}
                      placeholder="https://maps.google.com/... หรือ https://goo.gl/maps/..." />
                  </div>

                  {/* Description */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>เล่าบรรยากาศ · Description</label>
                    <textarea style={{ ...inputStyle, height: 90, resize: "vertical" as const }}
                      value={stop.description} onChange={e => updateStop(idx, "description", e.target.value)}
                      placeholder="บรรยากาศที่นี่เป็นอย่างไร น่าประทับใจอะไรบ้าง..." />
                  </div>

                  {/* Tips */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>💡 เคล็ดลับ / ข้อควรรู้ · Tips</label>
                    <input style={inputStyle} value={stop.tips}
                      onChange={e => updateStop(idx, "tips", e.target.value)}
                      placeholder="เช่น: ควรมาก่อน 8 โมง ที่จอดรถไม่ค่อยมี..." />
                  </div>

                  {/* Transport/Duration/Cost */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={labelStyle}>🚌 เดินทางมาด้วย</label>
                      <select style={inputStyle} value={stop.transport} onChange={e => updateStop(idx, "transport", e.target.value)}>
                        <option value="">-- ไม่ระบุ --</option>
                        {TRANSPORT_PER_STOP.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>⏱️ เวลาที่ใช้ · Duration</label>
                      <input style={inputStyle} value={stop.duration}
                        onChange={e => updateStop(idx, "duration", e.target.value)} placeholder="เช่น 2 ชั่วโมง" />
                    </div>
                    <div>
                      <label style={labelStyle}>💰 ค่าใช้จ่าย (฿)</label>
                      <input style={inputStyle} value={stop.cost}
                        onChange={e => updateStop(idx, "cost", e.target.value)} placeholder="เช่น 150" />
                    </div>
                  </div>

                  {/* Photo */}
                  <div>
                    <label style={labelStyle}>📷 รูปที่จุดนี้ · Photo</label>
                    {stop.imagePreview ? (
                      <div style={{ position: "relative", width: 200, borderRadius: 12, overflow: "hidden" }}>
                        <img src={stop.imagePreview} alt="" style={{ width: "100%", height: 130, objectFit: "cover" }} />
                        <button type="button"
                          onClick={() => { updateStop(idx, "imageFile", null); updateStop(idx, "imagePreview", null); }}
                          style={{ position: "absolute", top: 6, right: 6, border: "none", background: "rgba(239,68,68,0.85)",
                            color: "#fff", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>ลบ</button>
                      </div>
                    ) : (
                      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px",
                        borderRadius: 12, border: "2px dashed #cbd5e1", background: "#f8fafc",
                        color: "#64748b", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                        📷 เพิ่มรูป
                        <input type="file" hidden accept="image/*" onChange={e => handleStopImage(idx, e.target.files?.[0] || null)} />
                      </label>
                    )}
                  </div>
                </div>
              ))}

              <button type="button" onClick={addStop} style={{
                width: "100%", padding: 20, borderRadius: 20, border: "2px dashed #3b82f6",
                background: "#f0f7ff", color: "#3b82f6", fontWeight: 800, fontSize: 15,
                cursor: "pointer", fontFamily: "inherit", marginBottom: 20 }}>
                + เพิ่มจุดแวะ · Add Stop
              </button>

              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setActiveStep(2)} style={{
                  flex: 1, padding: 16, borderRadius: 16, border: "2px solid #e2e8f0",
                  background: "#fff", color: "#374151", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 15 }}>
                  👁️ Preview ก่อนส่ง
                </button>
                <button type="submit" disabled={isLoading} style={{
                  flex: 2, padding: 16, borderRadius: 16, border: "none",
                  background: isLoading ? "#94a3b8" : "linear-gradient(135deg,#3b82f6,#10b981)",
                  color: "#fff", fontWeight: 800, fontSize: 16,
                  cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "inherit",
                  boxShadow: "0 8px 24px rgba(59,130,246,0.25)" }}>
                  {isLoading ? "⏳ กำลังส่ง..." : "🚀 ส่งทริปเพื่ออนุมัติ · Submit"}
                </button>
              </div>
              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12,
                  padding: "12px 16px", color: "#dc2626", fontWeight: 600, marginTop: 12 }}>⚠️ {error}</div>
              )}
            </div>
          )}

          {/* ════ STEP 2: Preview ════ */}
          {activeStep === 2 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontWeight: 900, fontSize: 22, color: "#1e293b", margin: 0 }}>👁️ Preview ทริป</h2>
                <button type="button" onClick={() => setActiveStep(1)} style={{
                  padding: "8px 20px", borderRadius: 14, border: "2px solid #e2e8f0",
                  background: "#fff", color: "#64748b", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>← แก้ไข</button>
              </div>
              <div style={{ background: "#fff", borderRadius: 24, overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.08)", marginBottom: 20 }}>
                {coverPreview && (
                  <div style={{ position: "relative", height: 300 }}>
                    <img src={coverPreview} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.8) 0%,transparent 50%)" }} />
                    <div style={{ position: "absolute", bottom: 24, left: 24, right: 24, color: "#fff" }}>
                      <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>
                        {mood}
                        {tripStyle && ` · ${TRIP_STYLES.find(s => s.v === tripStyle)?.icon} ${TRIP_STYLES.find(s => s.v === tripStyle)?.label}`}
                        {durationDays && ` · ${durationDays} วัน`}
                        {budget && ` · ฿${Number(budget).toLocaleString()}`}
                      </div>
                      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900 }}>{title || "ชื่อทริป"}</h1>
                      {subtitle && <p style={{ margin: "8px 0 0", fontSize: 14, opacity: 0.85 }}>{subtitle}</p>}
                    </div>
                  </div>
                )}
                <div style={{ padding: 24 }}>
                  {description && <p style={{ color: "#374151", lineHeight: 1.8, marginBottom: 20, whiteSpace: "pre-wrap" as const }}>{description}</p>}
                  <h3 style={{ fontWeight: 800, fontSize: 17, color: "#1e293b", marginBottom: 14 }}>🗺️ เส้นทาง</h3>
                  {timeline.map((s, i) => {
                    const st = STOP_TYPES.find(t => t.v === s.stopType);
                    return (
                      <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#3b82f6", color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{i + 1}</div>
                          {i < timeline.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 14, background: "#e2e8f0", margin: "4px 0" }} />}
                        </div>
                        <div style={{ flex: 1, background: "#f8fafc", borderRadius: 12, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                            {st && <span>{st.icon}</span>}
                            <span style={{ fontWeight: 700, fontSize: 14 }}>{s.place || `จุดที่ ${i + 1}`}</span>
                            {s.time && <span style={{ fontSize: 12, color: "#64748b" }}>🕐 {s.time}</span>}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                            {s.province && `📍 ${s.province}${s.district ? ` · ${s.district}` : ""}`}
                            {s.duration && ` · ⏱️ ${s.duration}`}
                            {s.cost && ` · 💰 ฿${s.cost}`}
                          </div>
                          {s.description && <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{s.description}</p>}
                          {s.googleMapsUrl && (
                            <a href={s.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                              style={{ display: "inline-flex", gap: 4, marginTop: 8, fontSize: 12, color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>
                              🗺️ ดูบน Google Maps
                            </a>
                          )}
                          {s.tips && (
                            <div style={{ marginTop: 8, padding: "6px 10px", background: "#fffbeb", borderRadius: 8, fontSize: 12, color: "#92400e" }}>
                              💡 {s.tips}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setActiveStep(1)} style={{
                  flex: 1, padding: 16, borderRadius: 16, border: "2px solid #e2e8f0",
                  background: "#fff", color: "#374151", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 15 }}>← แก้ไข</button>
                <button type="submit" disabled={isLoading} style={{
                  flex: 2, padding: 16, borderRadius: 16, border: "none",
                  background: isLoading ? "#94a3b8" : "linear-gradient(135deg,#3b82f6,#10b981)",
                  color: "#fff", fontWeight: 800, fontSize: 16,
                  cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "inherit",
                  boxShadow: "0 8px 24px rgba(59,130,246,0.25)" }}>
                  {isLoading ? "⏳ กำลังส่ง..." : "🚀 ส่งทริปเพื่ออนุมัติ · Submit"}
                </button>
              </div>
              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12,
                  padding: "12px 16px", color: "#dc2626", fontWeight: 600, marginTop: 12 }}>⚠️ {error}</div>
              )}
            </div>
          )}

        </div>
      </form>
    </div>
  );
}

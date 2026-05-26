"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { uploadFile, uploadFiles } from "@/lib/uploadHelper";
import { getDistricts, normalizeProvince } from "@/data/thailand";
import ProvinceSelect from "@/components/ui/ProvinceSelect";

export default function CreateStoryPage() {
  const router   = useRouter();
  const { user } = useAuth();

  // ── Guard: ADMIN/SUPERADMIN ไม่สามารถสร้างทริปได้ ──────────
  useEffect(() => {
    if (user && (user.role === "ADMIN" || user.role === "SUPERADMIN")) {
      router.replace("/admin");
    }
  }, [user, router]);

  // (create page เริ่มใหม่เสมอ ไม่โหลด draft เก่า — ดู draft ได้ที่ dashboard)

  if (user && (user.role === "ADMIN" || user.role === "SUPERADMIN")) {
    return null;
  }
  const today    = new Date().toISOString().split("T")[0];

  // ── State ────────────────────────────────────────────────
  const [coverFile,    setCoverFile   ] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const [title,      setTitle     ] = useState("");
  const [content,    setContent   ] = useState("");
  const [budget,     setBudget    ] = useState("");
  const [mood,       setMood      ] = useState("Cafe Hopping");
  const [tags,       setTags      ] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [tiktokUrl,  setTiktokUrl ] = useState("");

  const [timeline, setTimeline] = useState([
    { date: today, time: "", place: "", province: "", district: "", description: "",
      imageFile: null as File | null, imagePreview: null as string | null,
      placeId: null as string | null, placeSlug: null as string | null }
  ]);
  const [placeSuggestions, setPlaceSuggestions] = useState<Record<number, any[]>>({});
  const [placeSearchLoading, setPlaceSearchLoading] = useState<Record<number, boolean>>({});
  const [suggestForm, setSuggestForm] = useState<Record<number, { open: boolean; cat: string; saving: boolean; mapsUrl: string }>>({});
  const placeSearchTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const [showPreview,  setShowPreview ] = useState(false);
  const [isBackHover,  setIsBackHover ] = useState(false);
  const [isLoading,    setIsLoading   ] = useState(false);
  const [isSavingDraft,setIsSavingDraft] = useState(false);
  const [error,        setError       ] = useState("");
  const [submitted,    setSubmitted   ] = useState(false);
  const [draftSaved,   setDraftSaved  ] = useState(false);
  const [existingDraft, setExistingDraft] = useState<{ id: string; slug: string; title: string; _count?: { timeline: number } } | null>(null);
  const [existingCoverUrl,  setExistingCoverUrl ] = useState("");
  const [existingGallery,   setExistingGallery  ] = useState<string[]>([]);

  // ── Handlers ─────────────────────────────────────────────
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setGalleryFiles(prev => [...prev, ...files]);
    setGalleryPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const updateTimeline = (index: number, field: string, value: any) => {
    const updated = [...timeline];
    (updated[index] as any)[field] = value;
    if (field === "province") updated[index].district = "";
    setTimeline(updated);
  };

  const handleCheckpointImage = (index: number, file: File | null) => {
    if (!file) return;
    updateTimeline(index, "imageFile", file);
    updateTimeline(index, "imagePreview", URL.createObjectURL(file));
  };

  const addTimeline    = () => setTimeline([...timeline,
    { date: today, time: "", place: "", province: "", district: "", description: "", imageFile: null, imagePreview: null, placeId: null, placeSlug: null }]);
  const removeTimeline = (i: number) => setTimeline(timeline.filter((_, idx) => idx !== i));

  // ── Place search for timeline stops ──────────────────────
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
    updated[idx].province = normalizeProvince(p.province ?? "");
    updated[idx].district = p.district ?? "";
    updated[idx].placeId  = p.id;
    updated[idx].placeSlug = p.slug;
    setTimeline(updated);
    setPlaceSuggestions(prev => ({ ...prev, [idx]: [] }));
  };
  const clearPlaceLink = (idx: number) => {
    const updated = [...timeline];
    updated[idx].placeId  = null;
    updated[idx].placeSlug = null;
    setTimeline(updated);
  };

  const openSuggest = (idx: number) => setSuggestForm(f => ({ ...f, [idx]: { open: true, cat: "NATURE", saving: false, mapsUrl: "" } }));
  const closeSuggest = (idx: number) => setSuggestForm(f => ({ ...f, [idx]: { ...f[idx], open: false } }));
  const suggestPlace = async (idx: number) => {
    const item = timeline[idx];
    const form = suggestForm[idx];
    if (!item.place.trim()) return;
    setSuggestForm(f => ({ ...f, [idx]: { ...f[idx], saving: true } }));
    try {
      const res = await fetch("/api/places/suggest", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: item.place, province: item.province, district: item.district, category: form?.cat ?? "NATURE", googleMapsUrl: form?.mapsUrl || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.place) {
        const updated = [...timeline];
        updated[idx].placeId   = data.place.id;
        updated[idx].placeSlug = data.place.slug;
        setTimeline(updated);
        closeSuggest(idx);
      } else {
        alert(data.message ?? "เกิดข้อผิดพลาด");
      }
    } catch { alert("ไม่สามารถเชื่อมต่อระบบได้"); }
    setSuggestForm(f => ({ ...f, [idx]: { ...f[idx], saving: false } }));
  };

  // ── Save Draft ───────────────────────────────────────────
  const saveDraft = async () => {
    if (!user)  { setError("กรุณาเข้าสู่ระบบก่อน"); return; }
    if (!title) { setError("กรุณาใส่ชื่อทริปก่อนบันทึก"); return; }
    setError("");
    setIsSavingDraft(true);

    try {
      // 1. อัปโหลดรูปปกถ้ามีไฟล์ใหม่
      let draftCoverUrl = existingCoverUrl;
      if (coverFile) {
        draftCoverUrl = await uploadFile(coverFile, "trips/covers");
        setExistingCoverUrl(draftCoverUrl);
        setCoverPreview(draftCoverUrl);
      }

      // 2. Build timeline — upload new images, preserve existing URLs
      const timelineData = await Promise.all(
        timeline
          .filter(s => s.place || s.province || s.description || s.imagePreview)
          .map(async (stop, i) => ({
            date: stop.date, time: stop.time,
            place: stop.place, province: stop.province, district: stop.district,
            description: stop.description,
            placeId: stop.placeId ?? undefined,
            images: stop.imageFile
              ? [await uploadFile(stop.imageFile, `trips/timeline/${i}`)]
              : (stop.imagePreview ? [stop.imagePreview] : []),
          }))
      );

      const draftBody = {
        title,
        description: content,
        coverUrl: draftCoverUrl || "",
        gallery: existingGallery,
        mood,
        budget: budget || null,
        location: timeline[0]?.province || "",
        tags: tags.split(",").map((t: string) => t.trim()).filter(Boolean),
        youtubeUrl: youtubeUrl.trim() || null,
        tiktokUrl:  tiktokUrl.trim()  || null,
        timeline: timelineData,
      };

      let savedDraft: any = null;

      if (existingDraft?.slug) {
        // Draft มีอยู่แล้ว → PUT อัปเดตตรง ๆ
        const res  = await fetch(`/api/trips/${existingDraft.slug}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draftBody),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.message || "เกิดข้อผิดพลาด"); return; }
        savedDraft = data.trip;
      } else {
        // ยังไม่มี draft ในเซสชันนี้ → POST สร้างใหม่
        const res  = await fetch("/api/trips", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...draftBody, isDraft: true }),
        });
        const data = await res.json();
        if (res.status === 409) {
          // มีดราฟเต็มแล้ว (2 อัน) → แจ้งเตือน
          setError(data.message || "มีดราฟอยู่แล้ว 2 อัน กรุณาส่งหรือลบดราฟก่อนสร้างใหม่");
          return;
        } else if (!res.ok) {
          setError(data.message || "เกิดข้อผิดพลาด"); return;
        } else {
          savedDraft = data.trip;
        }
      }

      if (savedDraft) setExistingDraft({ id: savedDraft.id, slug: savedDraft.slug, title: savedDraft.title });
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "ไม่สามารถเชื่อมต่อระบบได้");
    }
    setIsSavingDraft(false);
  };

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user)       { setError("กรุณาเข้าสู่ระบบก่อน"); return; }
    if (!title)      { setError("กรุณาใส่ชื่อทริป"); return; }
    if (!content)    { setError("กรุณาเขียนเรื่องเล่าโดยรวม"); return; }
    if (!coverFile && !existingCoverUrl) { setError("กรุณาเพิ่มรูปปก"); return; }

    setError("");
    setIsLoading(true);

    try {
      // 1. อัปโหลดรูปปก (หรือใช้ URL เดิมจาก draft)
      const coverUrl = coverFile
        ? await uploadFile(coverFile, "trips/covers")
        : existingCoverUrl;

      // 2. อัปโหลด gallery ใหม่ + รวมกับ gallery เดิมจาก draft
      const newGalleryUrls = galleryFiles.length
        ? await uploadFiles(galleryFiles, "trips/gallery")
        : [];
      const galleryUrls = [...existingGallery, ...newGalleryUrls];

      // 3. อัปโหลดรูป timeline แต่ละจุด
      const timelineData = await Promise.all(
        timeline.map(async (stop, i) => ({
          placeId: stop.placeId ?? undefined,
          date:        stop.date,
          time:        stop.time,
          place:       stop.place,
          province:    stop.province,
          district:    stop.district,
          description: stop.description,
          images: stop.imageFile
            ? [await uploadFile(stop.imageFile, `trips/timeline/${i}`)]
            : (stop.imagePreview ? [stop.imagePreview] : []),
        }))
      );

      // 4. บันทึกทริป — ถ้ามี draft อยู่แล้วให้ finalize, ถ้าไม่มีให้ POST ใหม่
      const tripBody = {
        title,
        subtitle: "",
        description: content,
        coverUrl,
        gallery:  galleryUrls,
        mood,
        budget:   budget || null,
        location: timeline[0]?.province || "",
        tags:       tags.split(",").map(t => t.trim()).filter(Boolean),
        youtubeUrl: youtubeUrl.trim() || null,
        tiktokUrl:  tiktokUrl.trim()  || null,
        timeline: timelineData,
      };

      let res: Response;
      if (existingDraft?.slug) {
        // Finalize draft → PUT พร้อม finalize: true
        res = await fetch(`/api/trips/${existingDraft.slug}`, {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ ...tripBody, finalize: true }),
        });
      } else {
        // ไม่มี draft → POST สร้างทริปใหม่ตรง ๆ
        res = await fetch("/api/trips", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(tripBody),
        });
      }

      const data = await res.json();
      if (!res.ok) { setError(data.message || "เกิดข้อผิดพลาด"); setIsLoading(false); return; }

      // 5. แสดงหน้า "รอการตรวจสอบ" แทน redirect ทันที
      setSubmitted(true);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
      setIsLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────

  // หน้าสำเร็จ — รอการตรวจสอบ
  if (submitted) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg,#f0fdf4,#ecfdf5)", padding: 24,
      }}>
        <div style={{
          maxWidth: 480, width: "100%", background: "#fff", borderRadius: 24,
          padding: "48px 40px", textAlign: "center",
          boxShadow: "0 8px 40px rgba(0,0,0,0.1)", border: "1.5px solid #d1fae5",
        }}>
          <div style={{ fontSize: "4rem", marginBottom: 16 }}>📋</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#065f46", margin: "0 0 12px" }}>
            ส่งทริปสำเร็จแล้ว!
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#6b7280", lineHeight: 1.7, margin: "0 0 8px" }}>
            ทริปของคุณอยู่ระหว่าง<strong style={{ color: "#d97706" }}> รอแอดมินตรวจสอบ</strong>
          </p>
          <p style={{ fontSize: "0.85rem", color: "#9ca3af", lineHeight: 1.6, margin: "0 0 32px" }}>
            เมื่อผ่านการตรวจสอบแล้ว ทริปจะถูกเผยแพร่บนแพลตฟอร์มโดยอัตโนมัติ
            คุณสามารถดูสถานะได้ที่หน้า Dashboard
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => router.push("/dashboard")}
              style={{
                background: "linear-gradient(135deg,#10b981,#06b6d4)", color: "#fff",
                border: "none", borderRadius: 12, padding: "12px 28px",
                fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
              }}
            >
              ดูสถานะใน Dashboard
            </button>
            <button
              onClick={() => { setSubmitted(false); setTitle(""); setContent(""); setCoverFile(null); setCoverPreview(null); setGalleryFiles([]); setGalleryPreviews([]); }}
              style={{
                background: "#f1f5f9", color: "#475569",
                border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "12px 28px",
                fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
              }}
            >
              เขียนทริปใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-container">
      <div className="create-card">

        <div className="top-nav-actions">
          <Link href="/dashboard" aria-label="กลับ"
            onMouseEnter={() => setIsBackHover(true)}
            onMouseLeave={() => setIsBackHover(false)}
            style={{
              width:"100%",maxWidth:430,minHeight:84,display:"flex",alignItems:"center",
              gap:14,padding:"14px 16px",border:`1.5px solid ${isBackHover?"#bfdbfe":"#dbe7f3"}`,
              borderRadius:22,color:"#0f172a",
              background:"linear-gradient(180deg,rgba(255,255,255,0.99),rgba(248,250,252,0.96))",
              boxShadow:isBackHover?"0 18px 36px rgba(15,23,42,0.1)":"0 12px 26px rgba(15,23,42,0.06)",
              textDecoration:"none",transform:isBackHover?"translateY(-3px)":"translateY(0)",
              transition:"transform 0.22s ease,box-shadow 0.22s ease,border-color 0.22s ease",
            }}>
            <span style={{width:46,height:46,display:"flex",alignItems:"center",justifyContent:"center",
              flex:"0 0 46px",borderRadius:16,color:"#2563eb",background:"#eff6ff"}}>
              <LayoutDashboard size={20} />
            </span>
            <span style={{minWidth:0,display:"flex",flex:"1 1 auto",flexDirection:"column",lineHeight:1.15}}>
              <strong style={{color:"#0f172a",fontSize:14,fontWeight:900}}>กลับไปแดชบอร์ด</strong>
              <small style={{marginTop:5,color:"#64748b",fontSize:11,fontWeight:700}}>ดูโปรไฟล์และเรื่องเล่าของฉัน</small>
            </span>
            <span style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",
              flex:"0 0 28px",borderRadius:10,color:"#2563eb",background:"#eff6ff",
              opacity:isBackHover?1:0.35,transform:isBackHover?"translateX(0)":"translateX(-4px)",transition:"0.22s ease"}}>
              <ArrowRight size={16} />
            </span>
          </Link>
        </div>

        <div className="header-text">
          <h2>บอกเล่าประสบการณ์ใหม่ของคุณ</h2>
          <p>SHARE YOUR STORY | บันทึกการเดินทางในแบบของคุณ</p>
        </div>

        {error && (
          <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"16px",
            padding:"14px 20px",marginBottom:"24px",color:"#b91c1c",fontSize:"14px",fontWeight:600}}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 1. Cover */}
          <div className="cover-upload-area" onClick={() => document.getElementById("coverInput")?.click()}>
            {coverPreview
              ? <img src={coverPreview} alt="Cover" className="cover-preview" />
              : <div className="upload-placeholder">
                  <span className="icon-main">🖼️</span>
                  <h4>คลิกเพื่อเพิ่มรูปหน้าปกทริป</h4>
                  <p>1200 x 630px สำหรับการแสดงผลที่ดีที่สุด</p>
                </div>
            }
            <input type="file" id="coverInput" hidden accept="image/*" onChange={handleCoverUpload} />
          </div>

          {/* 2. ข้อมูลพื้นฐาน */}
          <div className="info-grid">
            <div className="form-group full-width">
              <label>หัวข้อเรื่องเล่า | <small>TITLE</small> <span>*</span></label>
              <input type="text" className="form-control" value={title}
                onChange={(e) => setTitle(e.target.value)} placeholder="ตั้งชื่อทริปให้น่าสนใจ..." required />
            </div>
            <div className="form-group full-width">
              <label>เรื่องเล่าโดยรวม | <small>OVERALL</small> <span>*</span></label>
              <textarea className="form-control text-area" value={content}
                onChange={(e) => setContent(e.target.value)} placeholder="เล่าความประทับใจในภาพรวมของทริปนี้..." required />
            </div>
            <div className="form-group">
              <label>งบประมาณ | <small>BUDGET (บาท)</small></label>
              <input type="number" className="form-control" value={budget}
                onChange={(e) => setBudget(e.target.value)} placeholder="เช่น 2500" step="1" max="2000000000" />
            </div>
            <div className="form-group">
              <label>สไตล์ทริป | <small>MOOD</small></label>
              <select className="form-control" value={mood} onChange={(e) => setMood(e.target.value)}>
                <option>Cafe Hopping</option>
                <option>สายลุย Adventurous</option>
                <option>กินแหลก Foodie</option>
                <option>พักผ่อน Relaxing</option>
                <option>ธรรมชาติ Nature</option>
                <option>วัฒนธรรม Culture</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label>แท็ก | <small>TAGS (คั่นด้วยจุลภาค)</small></label>
              <input type="text" className="form-control" value={tags}
                onChange={(e) => setTags(e.target.value)} placeholder="เช่น กาญจนบุรี, น้ำตก, วันเดียว" />
            </div>
            <div className="form-group full-width">
              <label>🎬 YouTube Video URL <small style={{color:"#94a3b8",fontWeight:500}}>(ไม่บังคับ · Optional)</small></label>
              <input type="url" className="form-control" value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... หรือ https://youtu.be/..." />
            </div>
            <div className="form-group full-width">
              <label>🎵 TikTok Video URL <small style={{color:"#94a3b8",fontWeight:500}}>(ไม่บังคับ · Optional)</small></label>
              <input type="url" className="form-control" value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@user/video/..." />
            </div>
          </div>

          {/* 3. Gallery */}
          <div className="section-box">
            <h3 className="section-label">🖼️ แกลเลอรี่ | <small>GALLERY</small></h3>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16}}>
              {galleryPreviews.map((src,i) => (
                <div key={i} style={{position:"relative",width:100,height:80}}>
                  <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:12}} />
                  <button type="button" onClick={() => {
                    setGalleryFiles(p=>p.filter((_,j)=>j!==i));
                    setGalleryPreviews(p=>p.filter((_,j)=>j!==i));
                  }} style={{position:"absolute",top:-6,right:-6,background:"#ef4444",color:"white",
                    border:"none",borderRadius:"50%",width:20,height:20,cursor:"pointer",fontSize:12}}>×</button>
                </div>
              ))}
              <label style={{width:100,height:80,border:"2px dashed #cbd5e1",borderRadius:12,
                display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
                color:"#64748b",fontSize:12,fontWeight:700}}>
                + เพิ่ม
                <input type="file" hidden accept="image/*" multiple onChange={handleGalleryUpload} />
              </label>
            </div>
          </div>

          {/* 4. Timeline */}
          <div className="section-box">
            <h3 className="section-label">🕘 เส้นทางเดินทาง | <small>TIMELINE</small></h3>
            {timeline.map((item, idx) => (
              <div key={idx} className="timeline-card">
                {/* Row 1: Date + Time + Remove */}
                <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
                  <input type="date" className="form-control" value={item.date} max={today}
                    onChange={(e) => updateTimeline(idx, "date", e.target.value)}
                    style={{ flex: "0 0 180px" }} />
                  <input type="time" className="form-control" value={item.time}
                    onChange={(e) => updateTimeline(idx, "time", e.target.value)}
                    style={{ flex: "0 0 140px" }} />
                  <div style={{ flex: 1 }} />
                  <button type="button" className="btn-remove-circle" onClick={() => removeTimeline(idx)}>×</button>
                </div>

                {/* Row 2: Place name search (full width) */}
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <input type="text" className="form-control" placeholder="🔍 ค้นหาสถานที่ หรือพิมพ์ชื่อจุดแวะ"
                    value={item.place}
                    onChange={(e) => { updateTimeline(idx, "place", e.target.value); clearPlaceLink(idx); searchPlaces(idx, e.target.value); }}
                    style={{ width: "100%", boxSizing: "border-box",
                      borderColor: item.placeId ? "#10b981" : undefined,
                      background: item.placeId ? "#f0fdf4" : undefined }} />
                  {item.placeId && (
                    <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, color: "#10b981", fontWeight: 700 }}>🔗 เชื่อมสถานที่แล้ว</span>
                      <button type="button" onClick={() => clearPlaceLink(idx)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                    </div>
                  )}
                  {(placeSuggestions[idx]?.length > 0) && (
                      <div style={{ position: "absolute", top: "110%", left: 0, right: 0, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 50, maxHeight: 240, overflowY: "auto" }}>
                        {placeSuggestions[idx].map((p: any) => (
                          <button key={p.id} type="button"
                            onClick={() => selectPlace(idx, p)}
                            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", textAlign: "left", borderBottom: "1px solid #f1f5f9", fontFamily: "inherit" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                            onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                            {p.coverUrl && <img src={p.coverUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />}
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{p.title}</div>
                              <div style={{ fontSize: 11, color: "#64748b" }}>📍 {p.district}, {p.province}</div>
                              <div style={{ fontSize: 10, color: p.business ? "#10b981" : "#94a3b8", fontWeight: 600 }}>
                                {p.business ? "🏢 มีเจ้าของ" : "⭕ ยังไม่มีเจ้าของ"}
                              </div>
                            </div>
                          </button>
                        ))}
                        <button type="button"
                          onClick={() => setPlaceSuggestions(prev => ({ ...prev, [idx]: [] }))}
                          style={{ display: "block", width: "100%", padding: "8px", border: "none", background: "#f8fafc", color: "#94a3b8", fontSize: 12, cursor: "pointer", fontFamily: "inherit", borderRadius: "0 0 12px 12px" }}>
                          ปิด
                        </button>
                      </div>
                    )}
                    {placeSearchLoading[idx] && (
                      <div style={{ position: "absolute", top: "110%", left: 0, padding: "10px 14px", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, fontSize: 12, color: "#94a3b8" }}>
                        🔍 กำลังค้นหา...
                      </div>
                    )}
                </div>

                {/* Suggest new place button */}
                {item.place.trim().length >= 2 && !item.placeId && (
                  <div style={{ marginBottom: 12 }}>
                    {!suggestForm[idx]?.open ? (
                      <button type="button" onClick={() => openSuggest(idx)}
                        style={{ padding: "7px 14px", borderRadius: 10, border: "1.5px dashed #10b981", background: "#f0fdf4", color: "#10b981", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                        📍 สร้าง &ldquo;{item.place}&rdquo; เป็นสถานที่แนะนำ
                      </button>
                    ) : (
                      <div style={{ background: "#f0fdf4", border: "1.5px solid #6ee7b7", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: "#065f46" }}>📍 สร้างสถานที่แนะนำ: <span style={{ color: "#10b981" }}>{item.place}</span></div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <label style={{ fontSize: 12, color: "#374151", fontWeight: 700, flexShrink: 0 }}>ประเภท:</label>
                          <select value={suggestForm[idx]?.cat ?? "NATURE"}
                            onChange={e => setSuggestForm(f => ({ ...f, [idx]: { ...f[idx], cat: e.target.value } }))}
                            style={{ flex: 1, minWidth: 140, padding: "7px 10px", borderRadius: 8, border: "1.5px solid #d1fae5", fontSize: 12, fontFamily: "inherit", background: "#fff" }}>
                            <option value="NATURE">🌿 ธรรมชาติ</option>
                            <option value="TEMPLE">🛕 วัด/ศาสนสถาน</option>
                            <option value="CAFE">☕ คาเฟ่</option>
                            <option value="FOOD">🍲 อาหาร</option>
                            <option value="BEACH">🏖️ ชายหาด</option>
                            <option value="MARKET">🛍️ ตลาด/ช้อปปิ้ง</option>
                            <option value="ADVENTURE">🧗 กีฬา/ผจญภัย</option>
                            <option value="MUSEUM">🏛️ พิพิธภัณฑ์</option>
                            <option value="ACCOMMODATION">🏨 ที่พัก</option>
                            <option value="CAMPING">⛺ แคมปิ้ง</option>
                          </select>
                          <button type="button" onClick={() => suggestPlace(idx)} disabled={suggestForm[idx]?.saving}
                            style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, opacity: suggestForm[idx]?.saving ? 0.7 : 1 }}>
                            {suggestForm[idx]?.saving ? "⏳..." : "✓ สร้าง"}
                          </button>
                          <button type="button" onClick={() => closeSuggest(idx)}
                            style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #d1fae5", background: "#fff", color: "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                            ยกเลิก
                          </button>
                        </div>
                        <input type="url"
                          value={suggestForm[idx]?.mapsUrl ?? ""}
                          onChange={e => setSuggestForm(f => ({ ...f, [idx]: { ...f[idx], mapsUrl: e.target.value } }))}
                          placeholder="https://maps.google.com/?q=... (ไม่บังคับ)"
                          style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1.5px solid #d1fae5", fontSize: 12, fontFamily: "inherit", background: "#fff", boxSizing: "border-box" as const }} />
                        <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>สถานที่จะแสดงต่อเมื่อได้รับการอนุมัติ และรอเจ้าของมา claim ภายหลัง</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="timeline-location-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>จังหวัด</label>
                    <ProvinceSelect
                      className="form-control"
                      value={item.province}
                      onChange={(v) => updateTimeline(idx, "province", v)}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>อำเภอ / เขต</label>
                    <select className="form-control" disabled={!item.province} value={item.district}
                      onChange={(e) => updateTimeline(idx, "district", e.target.value)}>
                      <option value="">-- เลือกอำเภอ/เขต --</option>
                      {getDistricts(item.province).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div className="timeline-detail-row">
                  <textarea className="form-control desc-area" placeholder="เล่าบรรยากาศที่จุดนี้..."
                    value={item.description} onChange={(e) => updateTimeline(idx, "description", e.target.value)} />
                  <div className="cp-upload-container">
                    {item.imagePreview ? (
                      <div className="cp-preview-box">
                        <img src={item.imagePreview} alt="checkpoint" />
                        <button type="button" onClick={() => { updateTimeline(idx,"imageFile",null); updateTimeline(idx,"imagePreview",null); }}>ลบรูป</button>
                      </div>
                    ) : (
                      <label className="cp-label">
                        <span>📷 เพิ่มรูป</span>
                        <input type="file" hidden accept="image/*"
                          onChange={(e) => handleCheckpointImage(idx, e.target.files?.[0] || null)} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="btn-add-checkpoint-premium" onClick={addTimeline}>
              <span className="plus">+</span> เพิ่มจุดเช็คอินใหม่ | Add Checkpoint
            </button>
          </div>

          {/* 5. Actions */}
          {existingDraft && (
            <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 14, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 18 }}>📝</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#92400e" }}>คุณมีบันทึกทริปที่ยังไม่เสร็จ</div>
                <div style={{ fontSize: 12, color: "#78350f" }}>ชื่อ: {existingDraft.title}</div>
              </div>
              <Link href={`/trips/${existingDraft.slug}/edit`} style={{ padding: "7px 14px", background: "#f59e0b", color: "#fff", borderRadius: 10, fontWeight: 700, fontSize: 12, textDecoration: "none" }}>
                ✏️ แก้ไขต่อ
              </Link>
            </div>
          )}
          {draftSaved && (
            <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 14, padding: "10px 16px", marginBottom: 12, fontSize: 13, fontWeight: 700, color: "#15803d", display: "flex", alignItems: "center", gap: 8 }}>
              ✅ บันทึกแบบร่างแล้ว — คุณสามารถกลับมาเพิ่มข้อมูลได้ภายหลัง
            </div>
          )}
          <div className="main-actions">
            <button type="button" className="btn-action-preview" onClick={() => setShowPreview(true)}>
              👁️ ดูตัวอย่าง | Preview
            </button>
            {!existingDraft && (
              <button type="button" onClick={saveDraft} disabled={isSavingDraft}
                style={{ padding: "13px 20px", borderRadius: 14, border: "2px solid #f59e0b", background: isSavingDraft ? "#fef3c7" : "#fffbeb", color: "#92400e", fontWeight: 800, fontSize: 14, cursor: isSavingDraft ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
                {isSavingDraft ? "⏳ กำลังบันทึก..." : "📌 บันทึกชั่วคราว"}
              </button>
            )}
            <button type="submit" className="btn-action-publish" disabled={isLoading}>
              {isLoading ? "⏳ กำลังโพสต์..." : "🚀 ลงเรื่องเล่าเลย! | Publish Now"}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowPreview(false)}>×</button>
            <div className="pv-header">
              {coverPreview && <img src={coverPreview} alt="Cover" />}
              <div className="pv-title-box">
                <span className="pv-tag">{mood}</span>
                <h1>{title || "หัวข้อเรื่องเล่า"}</h1>
                <p>โดย: {user?.displayName || user?.firstName || "คุณนักเล่าเรื่อง"} | งบ: {budget || 0} ฿</p>
              </div>
            </div>
            <div className="pv-body">
              <p className="pv-main-content">{content}</p>
              <div className="pv-timeline">
                {timeline.map((t, i) => (
                  <div key={i} className="pv-item">
                    <div className="pv-dot" />
                    <div className="pv-time"><strong>{t.time || "--:--"}</strong></div>
                    <div className="pv-info">
                      <h4>{t.place || "จุดเช็คอิน"}</h4>
                      {t.description && <p className="pv-desc">{t.description}</p>}
                      {t.imagePreview && <img src={t.imagePreview} className="pv-checkpoint-img" alt="" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .create-container{padding:50px 20px;background:#f0f4f8;min-height:100vh;display:flex;justify-content:center}
        .create-card{background:white;padding:60px;border-radius:50px;box-shadow:0 30px 80px rgba(0,0,0,0.08);width:100%;max-width:1050px;position:relative}
        .top-nav-actions{margin-bottom:30px}
        .header-text{text-align:center;margin-bottom:50px}
        .header-text h2{font-size:34px;font-weight:900;color:#1e293b;letter-spacing:-0.5px}
        .header-text p{color:#94a3b8;font-size:14px;letter-spacing:2px;text-transform:uppercase;font-weight:600;margin-top:10px}
        .cover-upload-area{width:100%;height:420px;border:3px dashed #e2e8f0;border-radius:40px;overflow:hidden;cursor:pointer;position:relative;background:#fafbfc;transition:0.4s}
        .cover-upload-area:hover{border-color:#3b82f6;background:#f0f7ff;transform:scale(1.005)}
        .upload-placeholder{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center}
        .upload-placeholder .icon-main{font-size:60px;margin-bottom:20px;display:block}
        .cover-preview{width:100%;height:100%;object-fit:cover}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:25px;margin-top:40px}
        .full-width{grid-column:span 2}
        .form-group label{display:block;font-weight:700;font-size:14px;margin-bottom:8px;color:#374151}
        .form-group label span{color:#ef4444}
        .form-control{width:100%;padding:14px 20px;border-radius:15px;border:1px solid #e2e8f0;outline:none;background:#f8fafc;font-size:15px;transition:0.3s;box-sizing:border-box}
        .form-control:focus{border-color:#3b82f6;background:white;box-shadow:0 0 0 4px rgba(59,130,246,0.1)}
        .text-area{height:140px;resize:vertical}
        .section-box{margin-top:40px;padding:35px;border-radius:40px;background:#fff;border:1px solid #f1f5f9;box-shadow:0 10px 20px rgba(0,0,0,0.01)}
        .section-label{font-weight:900;font-size:20px;margin-bottom:25px;color:#1e293b;border-left:5px solid #3b82f6;padding-left:15px}
        .timeline-card{background:#fcfcfd;border:1px solid #edf2f7;border-radius:30px;padding:30px;margin-bottom:25px;box-shadow:0 4px 10px rgba(0,0,0,0.02)}
        .timeline-top-row{display:flex;gap:15px;margin-bottom:15px}
        .timeline-location-row{display:flex;gap:15px;margin-bottom:15px}
        .timeline-detail-row{display:grid;grid-template-columns:1fr 180px;gap:20px;margin-top:15px}
        .desc-area{height:110px;border-radius:20px;resize:none;background:white!important}
        .cp-upload-container{height:110px}
        .cp-label{width:100%;height:100%;border:2px dashed #cbd5e1;border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;color:#64748b;font-size:12px;font-weight:700;transition:0.3s;background:white}
        .cp-label:hover{border-color:#3b82f6;color:#3b82f6;background:#f0f7ff}
        .cp-preview-box{position:relative;width:100%;height:100%;border-radius:20px;overflow:hidden}
        .cp-preview-box img{width:100%;height:100%;object-fit:cover}
        .cp-preview-box button{position:absolute;bottom:0;width:100%;background:rgba(239,68,68,0.85);color:white;border:none;font-size:11px;font-weight:700;padding:6px;cursor:pointer}
        .btn-remove-circle{width:36px;height:36px;border-radius:50%;border:none;background:#fee2e2;color:#ef4444;font-size:20px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center}
        .btn-add-checkpoint-premium{width:100%;padding:20px;border-radius:25px;border:2px dashed #3b82f6;color:#3b82f6;background:#f0f7ff;font-weight:800;cursor:pointer;transition:0.3s;display:flex;align-items:center;justify-content:center;gap:10px}
        .btn-add-checkpoint-premium:hover{background:#3b82f6;color:white;transform:scale(1.01);box-shadow:0 15px 30px rgba(59,130,246,0.2)}
        .btn-add-checkpoint-premium .plus{font-size:24px}
        .main-actions{display:flex;gap:25px;margin-top:60px}
        .btn-action-preview{flex:1;padding:20px;border-radius:25px;border:2px solid #3b82f6;color:#3b82f6;font-weight:800;cursor:pointer;background:white;transition:0.3s;font-size:16px}
        .btn-action-preview:hover{background:#f0f7ff;box-shadow:0 10px 20px rgba(59,130,246,0.1)}
        .btn-action-publish{flex:2;padding:20px;border-radius:25px;border:none;background:linear-gradient(135deg,#3b82f6,#10b981);color:white;font-weight:800;cursor:pointer;font-size:18px;box-shadow:0 20px 40px rgba(59,130,246,0.3);transition:0.4s}
        .btn-action-publish:hover:not(:disabled){transform:translateY(-5px);box-shadow:0 30px 60px rgba(59,130,246,0.4)}
        .btn-action-publish:disabled{opacity:0.7;cursor:not-allowed}
        .modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.9);backdrop-filter:blur(12px);z-index:3000;display:flex;justify-content:center;padding:50px 20px;overflow-y:auto}
        .modal-content{background:white;width:100%;max-width:900px;border-radius:50px;position:relative;height:fit-content;overflow:hidden;padding-bottom:60px;box-shadow:0 50px 100px rgba(0,0,0,0.5)}
        .close-btn{position:absolute;top:30px;right:30px;font-size:30px;border:none;background:rgba(255,255,255,0.9);color:#1e293b;width:50px;height:50px;border-radius:50%;cursor:pointer;z-index:10;box-shadow:0 10px 20px rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center;transition:0.3s}
        .close-btn:hover{background:#ef4444;color:white;transform:rotate(90deg)}
        .pv-header{width:100%;height:500px;position:relative}
        .pv-header img{width:100%;height:100%;object-fit:cover}
        .pv-title-box{position:absolute;bottom:0;left:0;right:0;padding:80px 50px 50px;background:linear-gradient(transparent,rgba(15,23,42,0.95));color:#fff}
        .pv-tag{background:#3b82f6;padding:6px 18px;border-radius:50px;font-size:13px;font-weight:800;text-transform:uppercase}
        .pv-title-box h1{font-size:42px;margin:15px 0;font-weight:900;line-height:1.1}
        .pv-body{padding:50px}
        .pv-main-content{line-height:2;color:#475569;font-size:18px;margin-bottom:50px;white-space:pre-wrap}
        .pv-timeline{border-left:4px solid #3b82f6;padding-left:40px;margin-left:15px}
        .pv-item{position:relative;margin-bottom:50px}
        .pv-dot{position:absolute;left:-49px;top:8px;width:18px;height:18px;background:#3b82f6;border-radius:50%;border:4px solid #fff;box-shadow:0 0 0 6px rgba(59,130,246,0.2)}
        .pv-info h4{margin:0;font-size:24px;color:#1e293b;font-weight:800}
        .pv-desc{color:#64748b;line-height:1.8;margin:15px 0;font-size:16px}
        .pv-checkpoint-img{width:100%;max-width:500px;border-radius:30px;margin-top:20px;box-shadow:0 20px 40px rgba(0,0,0,0.1)}
        @media(max-width:768px){.info-grid{grid-template-columns:1fr}.timeline-detail-row{grid-template-columns:1fr}.main-actions{flex-direction:column}.create-card{padding:30px}}@media(max-width:480px){.create-card{padding:20px;border-radius:24px}.create-container{padding:20px 12px}.timeline-card{padding:18px;border-radius:20px}.btn-action-publish{font-size:15px;padding:16px}}
      `}</style>
    </div>
  );
}
"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { uploadFile, uploadFiles } from "@/lib/uploadHelper";
import { getDistricts, normalizeProvince, PROVINCES } from "@/data/thailand";
import {
  BackButton,
  CancelButton,
  SaveButton,
  ActionBar,
  PageTag,
} from "@/components/ui/ActionButtons";
import "@/components/ui/action-buttons.css";

type Props = { params: Promise<{ slug: string }> };

export default function EditTripPage({ params }: Props) {
  const { slug } = use(params);
  const router    = useRouter();
  const { user }  = useAuth();
  const today     = new Date().toISOString().split("T")[0];

  const [isLoadingTrip, setIsLoadingTrip] = useState(true);
  const [isLoading,     setIsLoading    ] = useState(false);
  const [error,         setError        ] = useState("");
  const [submitted,     setSubmitted    ] = useState(false);
  const [notFound,      setNotFound     ] = useState(false);
  const [isDraft,       setIsDraft      ] = useState(false);
  const [draftSubmitted, setDraftSubmitted] = useState(false);
  const [isSavingTemp, setIsSavingTemp] = useState(false);
  const [tempSaved,    setTempSaved   ] = useState(false);

  // ── Form state ─────────────────────────────────────────
  const [coverFile,        setCoverFile       ] = useState<File | null>(null);
  const [coverPreview,     setCoverPreview    ] = useState<string | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState("");

  const [galleryFiles,    setGalleryFiles   ] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [existingGallery, setExistingGallery] = useState<string[]>([]);

  const [title,      setTitle     ] = useState("");
  const [content,    setContent   ] = useState("");
  const [budget,     setBudget    ] = useState("");
  const [mood,       setMood      ] = useState("Cafe Hopping");
  const [tags,       setTags      ] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [tiktokUrl,  setTiktokUrl ] = useState("");

  const [timeline, setTimeline] = useState<{
    date: string; time: string; place: string; province: string; district: string;
    description: string; imageFile: File | null; imagePreview: string | null;
    existingImage?: string; shareToPlace: boolean; placeId: string | null;
  }[]>([]);

  // ── Place search state ─────────────────────────────────
  const [placeSuggestions, setPlaceSuggestions] = useState<Record<number, any[]>>({});
  const [placeSearchLoading, setPlaceSearchLoading] = useState<Record<number, boolean>>({});
  const [suggestForm, setSuggestForm] = useState<Record<number, { open: boolean; cat: string; saving: boolean; mapsUrl: string }>>({});
  const placeSearchTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const searchPlaces = (idx: number, q: string) => {
    clearTimeout(placeSearchTimers.current[idx]);
    if (q.trim().length < 2) { setPlaceSuggestions(p => ({ ...p, [idx]: [] })); return; }
    placeSearchTimers.current[idx] = setTimeout(async () => {
      setPlaceSearchLoading(l => ({ ...l, [idx]: true }));
      const res = await fetch(`/api/places?q=${encodeURIComponent(q)}&limit=6`);
      const data = await res.json();
      setPlaceSuggestions(p => ({ ...p, [idx]: data.places ?? [] }));
      setPlaceSearchLoading(l => ({ ...l, [idx]: false }));
    }, 350);
  };
  const selectPlace = (idx: number, p: any) => {
    const updated = [...timeline];
    updated[idx].place    = p.title;
    updated[idx].province = p.province ?? updated[idx].province;
    updated[idx].district = p.district ?? updated[idx].district;
    updated[idx].placeId  = p.id;
    setTimeline(updated);
    setPlaceSuggestions(prev => ({ ...prev, [idx]: [] }));
  };
  const clearPlaceLink = (idx: number) => {
    const updated = [...timeline];
    updated[idx].placeId = null;
    setTimeline(updated);
  };
  const openSuggest  = (idx: number) => setSuggestForm(f => ({ ...f, [idx]: { open: true, cat: "NATURE", saving: false, mapsUrl: "" } }));
  const closeSuggest = (idx: number) => setSuggestForm(f => ({ ...f, [idx]: { ...f[idx], open: false } }));
  const suggestPlace = async (idx: number) => {
    const item = timeline[idx];
    const form = suggestForm[idx];
    setSuggestForm(f => ({ ...f, [idx]: { ...f[idx], saving: true } }));
    const res = await fetch("/api/places", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: item.place, province: item.province, district: item.district, category: form.cat, googleMapsUrl: form.mapsUrl || null }),
    });
    const data = await res.json();
    if (res.ok && data.place) {
      const updated = [...timeline];
      updated[idx].placeId = data.place.id;
      setTimeline(updated);
      closeSuggest(idx);
    }
    setSuggestForm(f => ({ ...f, [idx]: { ...f[idx], saving: false } }));
  };

  // ── โหลดข้อมูลทริปที่มีอยู่ ───────────────────────────
  useEffect(() => {
    fetch(`/api/trips/${slug}`)
      .then(r => r.json())
      .then(data => {
        if (!data.trip) { setNotFound(true); return; }
        const t = data.trip;
        setTitle(t.title         ?? "");
        setContent(t.description ?? "");
        setBudget(t.budget ? String(t.budget) : "");
        setMood(t.mood           ?? "Cafe Hopping");
        setTags(Array.isArray(t.tags) ? t.tags.join(", ") : "");
        setYoutubeUrl(t.youtubeUrl ?? "");
        setTiktokUrl(t.tiktokUrl   ?? "");
        setExistingCoverUrl(t.coverUrl ?? "");
        setCoverPreview(t.coverUrl ?? null);
        setExistingGallery(t.gallery ?? []);
        setIsDraft(t.isDraft ?? false);
        setTimeline((t.timeline ?? []).map((stop: any) => ({
          date:          stop.date           ?? today,
          time:          stop.time           ?? "",
          place:         stop.placeName      ?? "",
          province:      normalizeProvince(stop.province ?? ""),
          district:      stop.district       ?? "",
          description:   stop.description    ?? "",
          imageFile:     null,
          imagePreview:  stop.images?.[0]    ?? null,
          existingImage: stop.images?.[0]    ?? undefined,
          shareToPlace:  stop.shareToPlace   ?? false,
          placeId:       stop.placeId        ?? null,
        })));
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoadingTrip(false));
  }, [slug]);

  // ── Timeline helpers ───────────────────────────────────
  const updateTimeline = (index: number, field: string, value: any) => {
    const updated = [...timeline];
    (updated[index] as any)[field] = value;
    if (field === "province") updated[index].district = "";
    setTimeline(updated);
  };

  const handleCheckpointImage = (index: number, file: File | null) => {
    if (!file) return;
    const updated = [...timeline];
    updated[index].imageFile    = file;
    updated[index].imagePreview = URL.createObjectURL(file);
    setTimeline(updated);
  };

  const addStop = () => setTimeline(prev => [...prev, {
    date: today, time: "", place: "", province: "", district: "", description: "",
    imageFile: null, imagePreview: null, shareToPlace: false, placeId: null,
  }]);

  const removeStop = (i: number) => setTimeline(prev => prev.filter((_, j) => j !== i));

  // ── Cover upload ───────────────────────────────────────
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

  // ── Temp Save (บันทึกชั่วคราว) ────────────────────────────
  const saveTempDraft = async () => {
    if (!title.trim()) { setError("กรุณาใส่ชื่อทริปก่อนบันทึก"); return; }
    setError("");
    setIsSavingTemp(true);
    try {
      // อัปโหลดรูปปกใหม่ (ถ้ามี)
      let finalCoverUrl = existingCoverUrl;
      if (coverFile) {
        finalCoverUrl = await uploadFile(coverFile, "covers");
        setExistingCoverUrl(finalCoverUrl);
      }
      // อัปโหลด gallery ใหม่
      let newGalleryUrls: string[] = [];
      if (galleryFiles.length > 0) {
        newGalleryUrls = await uploadFiles(galleryFiles, "gallery");
      }
      const finalGallery = [...existingGallery, ...newGalleryUrls];
      // อัปโหลดรูป timeline
      const timelineData = await Promise.all(
        timeline.map(async (stop) => {
          let imageUrl = stop.existingImage ?? "";
          if (stop.imageFile) {
            imageUrl = await uploadFile(stop.imageFile, "checkpoints");
          }
          return {
            date: stop.date, time: stop.time,
            place: stop.place, province: stop.province, district: stop.district,
            description: stop.description,
            images: imageUrl ? [imageUrl] : [],
            shareToPlace: stop.shareToPlace ?? false,
          };
        })
      );
      const res = await fetch(`/api/trips/${slug}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: content,
          coverUrl: finalCoverUrl,
          gallery: finalGallery,
          mood,
          budget: budget || null,
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
          youtubeUrl: youtubeUrl.trim() || null,
          tiktokUrl:  tiktokUrl.trim()  || null,
          timeline: timelineData,
          // ไม่ส่ง finalize → บันทึกเป็น draft เท่านั้น
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.message || "เกิดข้อผิดพลาด");
      } else {
        setTempSaved(true);
        setTimeout(() => setTempSaved(false), 3000);
        setGalleryFiles([]);
        if (newGalleryUrls.length) setExistingGallery(finalGallery);
      }
    } catch (err: any) {
      setError(err.message || "บันทึกไม่สำเร็จ");
    } finally {
      setIsSavingTemp(false);
    }
  };

  // ── Submit ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim())   { setError("กรุณากรอกชื่อเรื่องเล่า"); return; }
    if (!content.trim()) { setError("กรุณากรอกเนื้อหา"); return; }

    setIsLoading(true);
    try {
      // อัปโหลดรูปปกใหม่ (ถ้ามี)
      let finalCoverUrl = existingCoverUrl;
      if (coverFile) {
        finalCoverUrl = await uploadFile(coverFile, "covers");
      }

      // อัปโหลดรูป gallery ใหม่
      let newGalleryUrls: string[] = [];
      if (galleryFiles.length > 0) {
        newGalleryUrls = await uploadFiles(galleryFiles, "gallery");
      }
      const finalGallery = [...existingGallery, ...newGalleryUrls];

      // อัปโหลดรูป checkpoint ใหม่
      const timelineData = await Promise.all(
        timeline.map(async (stop) => {
          let imageUrl = stop.existingImage ?? "";
          if (stop.imageFile) {
            imageUrl = await uploadFile(stop.imageFile, "checkpoints");
          }
          return {
            date:         stop.date,
            time:         stop.time,
            place:        stop.place,
            province:     stop.province,
            district:     stop.district,
            description:  stop.description,
            images:       imageUrl ? [imageUrl] : [],
            shareToPlace: stop.shareToPlace ?? false,
            placeId:      stop.placeId ?? undefined,
          };
        })
      );

      const res = await fetch(`/api/trips/${slug}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: content,
          coverUrl:    finalCoverUrl,
          gallery:     finalGallery,
          mood,
          budget:      budget || null,
          tags:        tags.split(",").map(t => t.trim()).filter(Boolean),
          youtubeUrl:  youtubeUrl.trim() || null,
          tiktokUrl:   tiktokUrl.trim()  || null,
          timeline:    timelineData,
          ...(isDraft ? { finalize: true } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");

      if (isDraft && data.pending) {
        setDraftSubmitted(true);
      } else if (data.pending) {
        setSubmitted(true);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Loading / Not Found ────────────────────────────────
  if (submitted) {
    return (
      <div className="create-container" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"24px",minHeight:"60vh"}}>
        <div style={{fontSize:"56px"}}>✅</div>
        <div style={{textAlign:"center"}}>
          <h2 style={{fontSize:"22px",fontWeight:700,color:"#1e293b",marginBottom:"8px"}}>ส่งคำขอแก้ไขแล้ว!</h2>
          <p style={{color:"#64748b",fontSize:"15px",maxWidth:"360px"}}>
            การแก้ไขทริปจะถูกตรวจสอบโดยแอดมินก่อนที่จะมีผล<br/>
            โดยปกติใช้เวลา 1–2 วันทำการ
          </p>
        </div>
        <Link href="/dashboard" style={{padding:"10px 20px",background:"#10b981",color:"#fff",borderRadius:"8px",textDecoration:"none",fontWeight:600,fontSize:"14px"}}>
          กลับหน้าแดชบอร์ด
        </Link>
      </div>
    );
  }

  if (draftSubmitted) {
    return (
      <div className="create-container" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"24px",minHeight:"60vh"}}>
        <div style={{fontSize:"64px"}}>🎉</div>
        <div style={{textAlign:"center"}}>
          <h2 style={{fontSize:"22px",fontWeight:800,color:"#1e293b",marginBottom:"8px"}}>ส่งทริปเพื่อรอการอนุมัติแล้ว!</h2>
          <p style={{color:"#64748b",fontSize:"15px",maxWidth:"380px",lineHeight:1.7}}>
            บันทึกทริปของคุณถูกส่งเพื่อรอการตรวจสอบจากแอดมิน<br/>
            โดยปกติใช้เวลา 1–2 วันทำการ
          </p>
        </div>
        <Link href="/dashboard" style={{padding:"12px 28px",background:"linear-gradient(135deg,#10b981,#06b6d4)",color:"#fff",borderRadius:"12px",textDecoration:"none",fontWeight:700,fontSize:"15px",boxShadow:"0 6px 18px rgba(16,185,129,0.3)"}}>
          กลับหน้าแดชบอร์ด
        </Link>
      </div>
    );
  }

  if (isLoadingTrip) {
    return (
      <div className="create-container">
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:"60px 20px"}}>
        <div style={{width:52,height:52,borderRadius:"50%",border:"3px solid #e2e8f0",borderTopColor:"#10b981",animation:"_spin 0.8s linear infinite"}}/>
        <p style={{fontSize:14,color:"#94a3b8",margin:0}}>กำลังโหลดข้อมูลทริป...</p>
        <style>{"@keyframes _spin{to{transform:rotate(360deg)}}"}</style>
      </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="create-container">
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 18, color: "#ef4444" }}>ไม่พบทริปนี้</p>
          <Link href="/dashboard" style={{ color: "#2563eb" }}>กลับแดชบอร์ด</Link>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="create-container">
      <div className="create-card">

        {/* Top nav */}
        <div className="top-nav-actions">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <BackButton href="/dashboard" label="Dashboard" labelTh="กลับแดชบอร์ด" />
            <PageTag label="EDIT STORY" />
          </div>
        </div>

        {/* Header */}
        <div className="header-text">
          <h2>✏️ แก้ไขเรื่องเล่า</h2>
          <p>EDIT TRIP STORY</p>
        </div>

        {isDraft && (
          <div style={{
            background: "linear-gradient(135deg,#fefce8,#fffbeb)",
            border: "2px solid #fde68a", borderRadius: 16,
            padding: "14px 18px", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>📝</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#78350f" }}>โหมดบันทึกชั่วคราว</div>
              <div style={{ fontSize: 12, color: "#92400e", lineHeight: 1.5 }}>
                กรอกข้อมูลให้ครบ แล้วกด <strong>ส่งเพื่อเผยแพร่</strong> เมื่อทริปเสร็จสิ้น
              </div>
            </div>
          </div>
        )}
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 16, padding: "16px 20px", marginBottom: 24, color: "#dc2626", fontWeight: 700 }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Cover */}
          <div className="form-group">
            <label>รูปปก | <small>COVER PHOTO</small></label>
            <label className="cover-upload-area">
              {coverPreview
                ? <img src={coverPreview} alt="Cover" className="cover-preview" />
                : (
                  <div className="upload-placeholder">
                    <span className="icon-main">🖼️</span>
                    <p style={{ fontWeight: 700, color: "#64748b" }}>คลิกเพื่อเปลี่ยนรูปปก</p>
                  </div>
                )}
              <input hidden type="file" accept="image/*" onChange={handleCoverUpload} />
            </label>
          </div>

          {/* Gallery */}
          <div className="form-group" style={{ marginTop: 30 }}>
            <label>รูปภาพเพิ่มเติม | <small>GALLERY</small></label>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              {/* รูปเดิม */}
              {existingGallery.map((url, i) => (
                <div key={`ex-${i}`} style={{ position: "relative", width: 100, height: 80, borderRadius: 12, overflow: "hidden" }}>
                  <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button type="button" onClick={() => setExistingGallery(p => p.filter((_, j) => j !== i))}
                    style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 12 }}>
                    ×
                  </button>
                </div>
              ))}
              {/* รูปใหม่ */}
              {galleryPreviews.map((src, i) => (
                <div key={`nw-${i}`} style={{ position: "relative", width: 100, height: 80, borderRadius: 12, overflow: "hidden" }}>
                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button type="button" onClick={() => {
                    setGalleryFiles(p => p.filter((_, j) => j !== i));
                    setGalleryPreviews(p => p.filter((_, j) => j !== i));
                  }} style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 12 }}>
                    ×
                  </button>
                </div>
              ))}
              <label style={{ width: 100, height: 80, border: "2px dashed #cbd5e1", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", fontSize: 11, fontWeight: 700 }}>
                + เพิ่มรูป
                <input hidden type="file" accept="image/*" multiple onChange={handleGalleryUpload} />
              </label>
            </div>
          </div>

          {/* Info grid */}
          <div className="info-grid">
            <div className="form-group">
              <label>ชื่อเรื่องเล่า | <small>TITLE</small> <span style={{ color: "#ef4444" }}>*</span></label>
              <input type="text" className="form-control" value={title}
                onChange={e => setTitle(e.target.value)} placeholder="ตั้งชื่อทริปของคุณ..." />
            </div>

            <div className="form-group">
              <label>งบประมาณ | <small>BUDGET (บาท)</small></label>
              <input type="number" className="form-control" value={budget}
                onChange={e => setBudget(e.target.value)} placeholder="0" min="0" step="1" max="2000000000" />
            </div>

            <div className="form-group">
              <label>สไตล์ทริป | <small>MOOD</small></label>
              <select className="form-control" value={mood} onChange={e => setMood(e.target.value)}>
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
                onChange={e => setTags(e.target.value)} placeholder="เช่น กาญจนบุรี, น้ำตก, วันเดียว" />
            </div>

            <div className="form-group full-width">
              <label>🎬 YouTube Video URL <small style={{color:"#94a3b8",fontWeight:500}}>(ไม่บังคับ · Optional)</small></label>
              <input type="url" className="form-control" value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... หรือ https://youtu.be/..." />
            </div>

            <div className="form-group full-width">
              <label>🎵 TikTok Video URL <small style={{color:"#94a3b8",fontWeight:500}}>(ไม่บังคับ · Optional)</small></label>
              <input type="url" className="form-control" value={tiktokUrl}
                onChange={e => setTiktokUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@user/video/..." />
            </div>

            <div className="form-group full-width">
              <label>เนื้อหา | <small>STORY CONTENT</small> <span style={{ color: "#ef4444" }}>*</span></label>
              <textarea className="form-control text-area" value={content}
                onChange={e => setContent(e.target.value)} placeholder="เล่าเรื่องราวการเดินทางของคุณ..." />
            </div>
          </div>

          {/* Timeline */}
          <div className="section-box">
            <p className="section-label">🗺️ เส้นทางการเดินทาง | TIMELINE</p>

            {timeline.map((item, idx) => (
              <div key={idx} className="timeline-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontWeight: 800, color: "#1e293b" }}>จุดที่ {idx + 1}</span>
                  {timeline.length > 1 && (
                    <button type="button" className="btn-remove-circle" onClick={() => removeStop(idx)}>×</button>
                  )}
                </div>

                <div className="timeline-top-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>วันที่</label>
                    <input type="date" className="form-control" value={item.date}
                      onChange={e => updateTimeline(idx, "date", e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>เวลา</label>
                    <input type="time" className="form-control" value={item.time}
                      onChange={e => updateTimeline(idx, "time", e.target.value)} />
                  </div>
                </div>

                {/* Place search (full width) */}
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <input type="text" className="form-control"
                    placeholder="🔍 ค้นหาสถานที่ หรือพิมพ์ชื่อจุดแวะ"
                    value={item.place}
                    onChange={e => { updateTimeline(idx, "place", e.target.value); clearPlaceLink(idx); searchPlaces(idx, e.target.value); }}
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
                        <button key={p.id} type="button" onClick={() => selectPlace(idx, p)}
                          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", textAlign: "left", borderBottom: "1px solid #f1f5f9", fontFamily: "inherit" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                          onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                          {p.coverUrl && <img src={p.coverUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />}
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{p.title}</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>📍 {p.district}, {p.province}</div>
                            <div style={{ fontSize: 10, color: p.business ? "#10b981" : "#94a3b8", fontWeight: 600 }}>{p.business ? "🏢 มีเจ้าของ" : "⭕ ยังไม่มีเจ้าของ"}</div>
                          </div>
                        </button>
                      ))}
                      <button type="button" onClick={() => setPlaceSuggestions(prev => ({ ...prev, [idx]: [] }))}
                        style={{ display: "block", width: "100%", padding: "8px", border: "none", background: "#f8fafc", color: "#94a3b8", fontSize: 12, cursor: "pointer", fontFamily: "inherit", borderRadius: "0 0 12px 12px" }}>ปิด</button>
                    </div>
                  )}
                  {placeSearchLoading[idx] && (
                    <div style={{ position: "absolute", top: "110%", left: 0, padding: "10px 14px", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, fontSize: 12, color: "#94a3b8" }}>🔍 กำลังค้นหา...</div>
                  )}
                </div>

                {/* Suggest new place */}
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
                            style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: suggestForm[idx]?.saving ? 0.7 : 1 }}>
                            {suggestForm[idx]?.saving ? "⏳..." : "✓ สร้าง"}
                          </button>
                          <button type="button" onClick={() => closeSuggest(idx)}
                            style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #d1fae5", background: "#fff", color: "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>ยกเลิก</button>
                        </div>
                        <input type="text" placeholder="Google Maps URL (ไม่บังคับ)"
                          value={suggestForm[idx]?.mapsUrl ?? ""}
                          onChange={e => setSuggestForm(f => ({ ...f, [idx]: { ...f[idx], mapsUrl: e.target.value } }))}
                          style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #d1fae5", fontSize: 12, fontFamily: "inherit", background: "#fff" }} />
                      </div>
                    )}
                  </div>
                )}

                <div className="timeline-location-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>จังหวัด</label>
                    <select className="form-control" value={item.province}
                      onChange={e => updateTimeline(idx, "province", e.target.value)}>
                      <option value="">-- เลือกจังหวัด --</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>อำเภอ</label>
                    <select className="form-control" value={item.district}
                      onChange={e => updateTimeline(idx, "district", e.target.value)}>
                      <option value="">-- เลือกอำเภอ --</option>
                      {getDistricts(item.province).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="timeline-detail-row">
                  <div className="form-group">
                    <label>รายละเอียด</label>
                    <textarea className="form-control desc-area" value={item.description}
                      onChange={e => updateTimeline(idx, "description", e.target.value)}
                      placeholder="อธิบายสถานที่นี้..." />
                  </div>
                  <div className="form-group cp-upload-container">
                    <label>รูปภาพ</label>
                    {item.imagePreview ? (
                      <div style={{ position: "relative", width: "100%", height: "110px", borderRadius: "20px", overflow: "hidden" }}>
                        <img src={item.imagePreview} alt="checkpoint" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button type="button" onClick={() => {
                          updateTimeline(idx, "imageFile", null);
                          updateTimeline(idx, "imagePreview", null);
                          updateTimeline(idx, "existingImage", undefined);
                        }} style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: "50%", background: "rgba(239,68,68,0.9)", color: "#fff", border: "none", fontSize: 14, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="cp-label">
                        <span>🖼 เพิ่มรูป</span>
                        <input hidden type="file" accept="image/*"
                          onChange={e => handleCheckpointImage(idx, e.target.files?.[0] ?? null)} />
                      </label>
                    )}
                  </div>
                </div>

                {/* Share to place toggle */}
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
                    <div style={{ position: "relative", width: 38, height: 22, flexShrink: 0 }}>
                      <input type="checkbox" checked={item.shareToPlace} onChange={e => updateTimeline(idx, "shareToPlace", e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0, position: "absolute" }} />
                      <div onClick={() => updateTimeline(idx, "shareToPlace", !item.shareToPlace)} style={{
                        width: 38, height: 22, borderRadius: 11, cursor: "pointer",
                        background: item.shareToPlace ? "#10b981" : "#cbd5e1",
                        transition: "background 0.2s", position: "relative",
                      }}>
                        <div style={{
                          position: "absolute", top: 3, left: item.shareToPlace ? 19 : 3,
                          width: 16, height: 16, borderRadius: "50%", background: "#fff",
                          transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                        }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: item.shareToPlace ? "#065f46" : "#64748b" }}>
                      {item.shareToPlace ? "✅ อนุญาตให้แสดงรูปบนหน้าสถานที่" : "อนุญาตให้แสดงรูปบนหน้าสถานที่"}
                    </span>
                  </label>
                </div>
              </div>
            ))}

            <button type="button" className="btn-add-checkpoint-premium" onClick={addStop}>
              ＋ เพิ่มจุดแวะ | Add Stop
            </button>
          </div>

          {/* Submit */}
          <ActionBar>
            <CancelButton href="/dashboard" label="ยกเลิก · Discard" />
            {isDraft && (
              <button
                type="button"
                onClick={saveTempDraft}
                disabled={isSavingTemp}
                style={{
                  padding: "12px 22px", borderRadius: 14,
                  background: tempSaved ? "#d1fae5" : "#fef3c7",
                  color: tempSaved ? "#065f46" : "#92400e",
                  border: `1.5px solid ${tempSaved ? "#6ee7b7" : "#fcd34d"}`,
                  fontWeight: 700, fontSize: 14, cursor: isSavingTemp ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 6, transition: "all .2s",
                }}
              >
                {isSavingTemp ? "⏳ กำลังบันทึก..." : tempSaved ? "✅ บันทึกแล้ว!" : "💾 บันทึกชั่วคราว"}
              </button>
            )}
            <SaveButton label={isDraft ? "🚀 ส่งเพื่อเผยแพร่ · Submit" : "💾 บันทึกการแก้ไข · Save Changes"} loading={isLoading} />
          </ActionBar>

        </form>
      </div>

      <style jsx>{`
        .create-container { padding: 50px 20px; background: #f0f4f8; min-height: 100vh; display: flex; justify-content: center; }
        .create-card { background: white; padding: 60px; border-radius: 50px; box-shadow: 0 30px 80px rgba(0,0,0,0.08); width: 100%; max-width: 1050px; position: relative; height: fit-content; }
        .top-nav-actions { margin-bottom: 20px; }
        .header-text { text-align: center; margin-bottom: 40px; }
        .header-text h2 { font-size: 34px; font-weight: 900; color: #1e293b; letter-spacing: -0.5px; }
        .header-text p { color: #94a3b8; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600; margin-top: 10px; }
        .cover-upload-area { width: 100%; height: 380px; border: 3px dashed #e2e8f0; border-radius: 40px; overflow: hidden; cursor: pointer; position: relative; background: #fafbfc; display: block; transition: 0.4s; }
        .cover-upload-area:hover { border-color: #3b82f6; background: #f0f7ff; }
        .upload-placeholder { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
        .upload-placeholder .icon-main { font-size: 60px; margin-bottom: 20px; display: block; }
        .cover-preview { width: 100%; height: 100%; object-fit: cover; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-top: 40px; }
        .full-width { grid-column: span 2; }
        .form-group label { display: block; font-weight: 700; font-size: 14px; margin-bottom: 8px; color: #374151; }
        .form-control { width: 100%; padding: 14px 20px; border-radius: 15px; border: 1px solid #e2e8f0; outline: none; background: #f8fafc; font-size: 15px; transition: 0.3s; box-sizing: border-box; }
        .form-control:focus { border-color: #3b82f6; background: white; box-shadow: 0 0 0 4px rgba(59,130,246,0.1); }
        .text-area { height: 140px; resize: vertical; }
        .section-box { margin-top: 40px; padding: 35px; border-radius: 40px; background: #fff; border: 1px solid #f1f5f9; box-shadow: 0 10px 20px rgba(0,0,0,0.01); }
        .section-label { font-weight: 900; font-size: 20px; margin-bottom: 25px; color: #1e293b; border-left: 5px solid #3b82f6; padding-left: 15px; }
        .timeline-card { background: #fcfcfd; border: 1px solid #edf2f7; border-radius: 30px; padding: 30px; margin-bottom: 25px; }
        .timeline-top-row { display: flex; gap: 15px; margin-bottom: 15px; }
        .timeline-location-row { display: flex; gap: 15px; margin-bottom: 15px; }
        .timeline-detail-row { display: grid; grid-template-columns: 1fr 180px; gap: 20px; margin-top: 15px; }
        .desc-area { height: 110px; border-radius: 20px; resize: none; background: white !important; }
        .cp-upload-container { height: 110px; }
        .cp-label { width: 100%; height: 100%; border: 2px dashed #cbd5e1; border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; color: #64748b; font-size: 12px; font-weight: 700; transition: 0.3s; background: white; }
        .cp-label:hover { border-color: #3b82f6; color: #3b82f6; background: #f0f7ff; }
        .cp-preview-box { position: relative; width: 100%; height: 110px; border-radius: 20px; overflow: hidden; }
        .cp-preview-box img { width: 100%; height: 100%; object-fit: cover; }
        .cp-preview-box button { position: absolute; bottom: 0; width: 100%; background: rgba(239,68,68,0.85); color: white; border: none; font-size: 11px; font-weight: 700; padding: 6px; cursor: pointer; }
        .btn-remove-circle { width: 36px; height: 36px; border-radius: 50%; border: none; background: #fee2e2; color: #ef4444; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .btn-add-checkpoint-premium { width: 100%; padding: 20px; border-radius: 25px; border: 2px dashed #3b82f6; color: #3b82f6; background: #f0f7ff; font-weight: 800; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .btn-add-checkpoint-premium:hover { background: #dbeafe; }
        @media (max-width: 768px) {
          .create-card { padding: 30px 20px; border-radius: 30px; }
          .info-grid { grid-template-columns: 1fr; }
          .full-width { grid-column: 1; }
          .timeline-top-row, .timeline-location-row { flex-direction: column; }
          .timeline-detail-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

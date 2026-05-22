"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PROVINCES, getDistricts } from "@/data/thailand";
import "./page.css";

type PlaceCategory =
  | "ธรรมชาติ" | "คาเฟ่" | "ที่พัก" | "แคมปิ้ง" | "อาหาร"
  | "วัด / ศาสนสถาน" | "ชายหาด" | "ตลาด / ช้อปปิ้ง"
  | "กีฬา / ผจญภัย" | "พิพิธภัณฑ์ / ประวัติศาสตร์";

type Props = { params: Promise<{ slug: string }> };

const CATEGORIES: { th: PlaceCategory; en: string; icon: string }[] = [
  { th: "ธรรมชาติ",                   en: "Nature",      icon: "🌿" },
  { th: "คาเฟ่",                      en: "Café",        icon: "☕" },
  { th: "ที่พัก",                     en: "Stay",        icon: "🏨" },
  { th: "แคมปิ้ง",                    en: "Camping",     icon: "⛺" },
  { th: "อาหาร",                      en: "Food",        icon: "🍲" },
  { th: "วัด / ศาสนสถาน",             en: "Temple",      icon: "🛕" },
  { th: "ชายหาด",                     en: "Beach",       icon: "🏖️" },
  { th: "ตลาด / ช้อปปิ้ง",            en: "Market",      icon: "🛍️" },
  { th: "กีฬา / ผจญภัย",              en: "Adventure",   icon: "🧗" },
  { th: "พิพิธภัณฑ์ / ประวัติศาสตร์", en: "Museum",      icon: "🏛️" },
];

// Reverse map: Prisma enum → Thai UI label (for loading existing place data)
const ENUM_TO_THAI: Record<string, PlaceCategory> = {
  NATURE: "ธรรมชาติ", CAFE: "คาเฟ่", ACCOMMODATION: "ที่พัก", CAMPING: "แคมปิ้ง",
  FOOD: "อาหาร", TEMPLE: "วัด / ศาสนสถาน", BEACH: "ชายหาด",
  MARKET: "ตลาด / ช้อปปิ้ง", ADVENTURE: "กีฬา / ผจญภัย", MUSEUM: "พิพิธภัณฑ์ / ประวัติศาสตร์",
};
const DAYS = [
  { th: "จันทร์",    en: "Mon" },
  { th: "อังคาร",   en: "Tue" },
  { th: "พุธ",      en: "Wed" },
  { th: "พฤหัสบดี", en: "Thu" },
  { th: "ศุกร์",    en: "Fri" },
  { th: "เสาร์",    en: "Sat" },
  { th: "อาทิตย์",  en: "Sun" },
];
const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];


const MAX_PHOTOS = 20;

async function uploadImage(file: File, folder = "places"): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "อัปโหลดรูปไม่สำเร็จ");
  }
  return (await res.json()).url as string;
}

export default function EditPlacePage({ params }: Props) {
  const { slug: rawSlug } = use(params);
  const slug = decodeURIComponent(rawSlug);
  const router = useRouter();

  // ── Loading state ──
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound]       = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [apiError, setApiError]       = useState("");
  const [submitted, setSubmitted]     = useState(false);

  // ── Cover ──
  const [coverFile, setCoverFile]       = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");

  // ── Gallery (existing URLs + new Files) ──
  const [existingGallery, setExistingGallery] = useState<string[]>([]);
  const [galleryFiles, setGalleryFiles]       = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  // ── Basic info ──
  const [title, setTitle]           = useState("");
  const [titleEn, setTitleEn]       = useState("");
  const [province, setProvince]     = useState("");
  const [district, setDistrict]     = useState("");
  const [address, setAddress]       = useState("");
  const [googleMaps, setGoogleMaps] = useState("");
  const [category, setCategory]     = useState<PlaceCategory>("ธรรมชาติ");
  const [tagInput, setTagInput]     = useState("");
  const [tags, setTags]             = useState<string[]>([]);

  // ── Description ──
  const [description, setDescription]   = useState("");
  const [descShort, setDescShort]       = useState("");

  // ── Operating ──
  const [openTime, setOpenTime]       = useState("08:00");
  const [closeTime, setCloseTime]     = useState("17:00");
  const [openAll, setOpenAll]         = useState(false);
  const [closedDaysList, setClosedDaysList] = useState<string[]>([]);
  const toggleDay = (day: string) =>
    setClosedDaysList(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  const [entryFee, setEntryFee]     = useState("");
  const [phone, setPhone]           = useState("");
  const handlePhone = (v: string) => setPhone(v.replace(/[^0-9+\-() ]/g, ""));
  const [website, setWebsite]       = useState("");
  const [lineId, setLineId]         = useState("");

  const districts = getDistricts(province);

  // ── Load place from API ──
  useEffect(() => {
    fetch(`/api/places/${slug}`)
      .then(r => r.json())
      .then(data => {
        if (!data.place) { setNotFound(true); setPageLoading(false); return; }
        const p = data.place;
        setTitle(p.title ?? "");
        setTitleEn(p.titleEn ?? "");
        setProvince(p.province ?? "");
        setDistrict(p.district ?? "");
        setAddress(p.address ?? "");
        setGoogleMaps(p.googleMapsUrl ?? "");
        setCategory(ENUM_TO_THAI[p.category] ?? p.category ?? "ธรรมชาติ");
        setTags(p.tags ?? []);
        setDescription(p.description ?? "");
        setDescShort(p.descriptionShort ?? "");
        // Parse openHours string → openTime/closeTime
        const oh = p.openHours ?? "";
        if (oh === "เปิด 24 ชั่วโมง" || oh.toLowerCase().includes("24")) {
          setOpenAll(true);
        } else {
          const m = oh.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
          if (m) { setOpenTime(m[1]); setCloseTime(m[2]); }
          else if (oh) setOpenTime(oh);
        }
        // Parse closedDays string → closedDaysList array
        const cd = p.closedDays ?? "";
        const matched = ["จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์","อาทิตย์"].filter(d => cd.includes(d));
        setClosedDaysList(matched);
        setEntryFee(p.entryFee ?? "");
        setPhone(p.phone ?? "");
        setWebsite(p.website ?? "");
        setLineId(p.lineId ?? "");
        setCoverPreview(p.coverUrl ?? "");
        setExistingGallery(p.gallery ?? []);
        setPageLoading(false);
      })
      .catch(() => { setNotFound(true); setPageLoading(false); });
  }, [slug]);

  const handleProvinceChange = (v: string) => { setProvince(v); setDistrict(""); };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("รูปปกต้องไม่เกิน 5MB"); return; }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalCurrent = existingGallery.length + galleryFiles.length;
    const remaining = MAX_PHOTOS - totalCurrent;
    const valid = files.slice(0, remaining).filter(f => f.size <= 5 * 1024 * 1024);
    setGalleryFiles(prev => [...prev, ...valid]);
    setGalleryPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))]);
  };

  const removeExisting = (i: number) => setExistingGallery(prev => prev.filter((_, j) => j !== i));
  const removeNew = (i: number) => {
    setGalleryFiles(prev => prev.filter((_, j) => j !== i));
    setGalleryPreviews(prev => prev.filter((_, j) => j !== i));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !province || !district || !description) {
      setApiError("กรุณากรอกข้อมูลที่จำเป็น (ชื่อ, จังหวัด, อำเภอ, คำอธิบาย)");
      return;
    }
    setApiError("");
    setIsLoading(true);

    try {
      // upload new cover if changed
      let coverUrl = coverPreview;
      if (coverFile) coverUrl = await uploadImage(coverFile);

      // upload new gallery files
      const newGalleryUrls = await Promise.all(galleryFiles.map(f => uploadImage(f)));
      const gallery = [...existingGallery, ...newGalleryUrls];

      const res = await fetch(`/api/places/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, titleEn:           titleEn       || undefined,
          province, district,
          address:          address       || undefined,
          googleMapsUrl:    googleMaps    || undefined,
          category, tags,
          coverUrl,
          gallery,
          description,
          descriptionShort: descShort     || undefined,
          openHours: openAll
            ? "เปิด 24 ชั่วโมง"
            : (openTime && closeTime ? `${openTime} – ${closeTime}` : openTime || undefined),
          closedDays: closedDaysList.length === 0
            ? undefined
            : closedDaysList.length === 7
              ? "ปิดทุกวัน"
              : `ปิดทุกวัน${closedDaysList.join(", ")}`,
          entryFee:         entryFee      || undefined,
          phone:            phone         || undefined,
          website:          website       || undefined,
          lineId:           lineId        || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setApiError(data.message || "เกิดข้อผิดพลาด"); setIsLoading(false); return; }

      if (data.pending) {
        setSubmitted(true);
      } else {
        router.push("/business/dashboard");
      }
    } catch (err: any) {
      setApiError(err.message || "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่");
      setIsLoading(false);
    }
  };

  const totalPhotos = existingGallery.length + galleryFiles.length;
  const usedPct = Math.round((totalPhotos / MAX_PHOTOS) * 100);
  const countState = totalPhotos >= MAX_PHOTOS ? "full" : totalPhotos >= 15 ? "warn" : "ok";

  if (pageLoading) return (
    <div className="edit-page" style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
      <p style={{color:"#94a3b8",fontSize:"16px"}}>⏳ กำลังโหลดข้อมูล...</p>
    </div>
  );

  if (submitted) return (
    <div className="edit-page" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"24px",minHeight:"60vh"}}>
      <div style={{fontSize:"56px"}}>⏳</div>
      <div style={{textAlign:"center"}}>
        <h2 style={{fontSize:"22px",fontWeight:700,color:"#1e293b",marginBottom:"8px"}}>ส่งคำขอแก้ไขแล้ว!</h2>
        <p style={{color:"#64748b",fontSize:"15px",maxWidth:"360px"}}>
          การแก้ไขข้อมูลสถานที่จะถูกตรวจสอบโดยแอดมินก่อนที่จะมีผล<br/>
          โดยปกติใช้เวลา 1–2 วันทำการ
        </p>
      </div>
      <div style={{display:"flex",gap:"12px"}}>
        <Link href="/business/dashboard" style={{padding:"10px 20px",background:"#10b981",color:"#fff",borderRadius:"8px",textDecoration:"none",fontWeight:600,fontSize:"14px"}}>
          กลับหน้าแดชบอร์ด
        </Link>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="edit-page" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px"}}>
      <p style={{fontSize:"18px",fontWeight:700}}>ไม่พบสถานที่นี้</p>
      <Link href="/business/dashboard" style={{color:"#3b82f6"}}>กลับหน้าแดชบอร์ด</Link>
    </div>
  );

  return (
    <div className="edit-page">
      <div className="edit-container">

        {/* TOP BAR */}
        <div className="top-bar">
          <Link href="/business/dashboard" className="back-btn">
            <span className="back-dot">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="back-text">กลับหน้าแดชบอร์ด <span className="back-en">Dashboard</span></span>
          </Link>
          <span className="page-badge">Edit Place</span>
        </div>

        <div className="page-header">
          <h1>แก้ไขสถานที่ <span className="en-tag">Edit Place</span></h1>
          <p className="subtitle">ปรับข้อมูล รูปภาพ และรายละเอียดของสถานที่ท่องเที่ยว <span className="subtitle-en">· Update place details</span></p>
        </div>

        {apiError && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px",
            padding: "12px 16px", marginBottom: "20px", color: "#b91c1c", fontSize: "14px" }}>
            ⚠️ {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ── 1. COVER ── */}
          <div className="section-card">
            <div className="section-hdr">
              <div>
                <h2>รูปปกหลัก <span className="en-tag sm">Cover Photo</span></h2>
                <p>ภาพที่จะแสดงในหน้าหลักและการค้นหา · Main image shown in listings</p>
              </div>
            </div>
            <label className="cover-upload">
              <input type="file" hidden accept="image/*" onChange={handleCoverUpload} />
              {coverPreview
                ? <img src={coverPreview} alt="cover" />
                : <div className="cover-empty">🖼️<span>คลิกเพื่ออัปโหลดรูปปก</span><small>PNG, JPG ไม่เกิน 5MB</small></div>
              }
              <div className="cover-overlay"><span>เปลี่ยนรูปปก</span></div>
            </label>
          </div>

          {/* ── 2. BASIC INFO ── */}
          <div className="section-card">
            <div className="section-hdr">
              <div>
                <h2>ข้อมูลพื้นฐาน <span className="en-tag sm">Basic Info</span></h2>
                <p>ชื่อ ประเภท และที่ตั้งของสถานที่ · Name, category &amp; location</p>
              </div>
            </div>
            <div className="form-grid two-col">
              <div className="field">
                <label>ชื่อสถานที่ (ภาษาไทย) · Thai Name <span className="req">*</span></label>
                <input className="form-control" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="เช่น น้ำตกเอราวัณ" required />
              </div>
              <div className="field">
                <label>ชื่อภาษาอังกฤษ · English Name</label>
                <input className="form-control" type="text" value={titleEn} onChange={e => setTitleEn(e.target.value)} placeholder="e.g. Erawan Waterfall" />
              </div>
            </div>
            <div className="field mt16">
              <label>ประเภทสถานที่ · Category <span className="req">*</span></label>
              <div className="cat-grid">
                {CATEGORIES.map(c => (
                  <button key={c.th} type="button"
                    className={"cat-btn" + (category === c.th ? " cat-active" : "")}
                    onClick={() => setCategory(c.th)}>
                    <span style={{fontSize:18}}>{c.icon}</span>
                    <span style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:1}}>
                      <span style={{fontSize:12,fontWeight:700,lineHeight:1.2}}>{c.th}</span>
                      <span style={{fontSize:10,color:"#94a3b8",fontWeight:500,lineHeight:1.2}}>{c.en}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── 3. LOCATION ── */}
          <div className="section-card">
            <div className="section-hdr">
              <div>
                <h2>ที่ตั้งสถานที่ <span className="en-tag sm">Location</span></h2>
                <p>ข้อมูลนี้ใช้สำหรับการค้นหาตามจังหวัดและอำเภอ</p>
              </div>
            </div>
            <div className="form-grid two-col">
              <div className="field">
                <label>จังหวัด · Province <span className="req">*</span></label>
                <select className="form-control" value={province} onChange={e => handleProvinceChange(e.target.value)} required>
                  <option value="">— เลือกจังหวัด / Select Province —</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="field">
                <label>อำเภอ / เขต · District <span className="req">*</span></label>
                <select className="form-control" value={district} onChange={e => setDistrict(e.target.value)} disabled={!province} required>
                  <option value="">— เลือกอำเภอ / Select District —</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {!province && <span className="field-hint">เลือกจังหวัดก่อน</span>}
              </div>
            </div>
            <div className="field mt16">
              <label>ที่อยู่เพิ่มเติม · Full Address</label>
              <input className="form-control" type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="เช่น 123 ถ.เพชรเกษม ต.ท่ากระดาน · Full street address" />
            </div>
            <div className="field mt16">
              <label>Google Maps URL</label>
              <input className="form-control" type="url" value={googleMaps} onChange={e => setGoogleMaps(e.target.value)} placeholder="https://maps.google.com/?q=..." />
              {googleMaps && (
                <a href={googleMaps} target="_blank" rel="noreferrer" className="map-preview-link">🗺️ ดูบน Google Maps</a>
              )}
            </div>
          </div>

          {/* ── 4. DESCRIPTION ── */}
          <div className="section-card">
            <div className="section-hdr">
              <div>
                <h2>คำอธิบายสถานที่ <span className="en-tag sm">Description</span></h2>
                <p>อธิบายให้นักท่องเที่ยวเข้าใจและสนใจมาเที่ยว</p>
              </div>
            </div>
            <div className="field">
              <label>คำอธิบายสั้น · Short Description <span className="hint">แสดงในการ์ดค้นหา · max 80 chars</span></label>
              <input className="form-control" type="text" value={descShort} onChange={e => setDescShort(e.target.value)}
                placeholder="เช่น น้ำตก 7 ชั้น น้ำสีมรกต ในอุทยานแห่งชาติ · Emerald waterfall in national park" maxLength={80} />
              <span className="char-count">{descShort.length}/80</span>
            </div>
            <div className="field mt16">
              <label>คำอธิบายเต็ม · Full Description <span className="req">*</span></label>
              <textarea className="form-control textarea" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="อธิบายรายละเอียด บรรยากาศ จุดเด่น และเคล็ดลับการเที่ยวชม..." rows={5} required />
            </div>
            <div className="field mt16">
              <label>แท็ก · Tags <span className="hint">ช่วยให้ค้นหาเจอง่ายขึ้น · Helps with search</span></label>
              <div className="tag-input-row">
                <input className="form-control" type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="พิมพ์แท็กแล้วกด Enter หรือปุ่ม +" />
                <button type="button" className="tag-add-btn" onClick={addTag}>+ เพิ่ม</button>
              </div>
              {tags.length > 0 && (
                <div className="tags-wrap">
                  {tags.map(t => (
                    <span key={t} className="tag-chip">
                      {t}
                      <button type="button" onClick={() => setTags(prev => prev.filter(x => x !== t))}>✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── 5. OPERATING ── */}
          <div className="section-card">
            <div className="section-hdr">
              <div>
                <h2>ข้อมูลการเปิด-ปิด และติดต่อ <span className="en-tag sm">Contact & Hours</span></h2>
                <p>ข้อมูลสำคัญที่นักท่องเที่ยวต้องการก่อนเดินทาง</p>
              </div>
            </div>
            {/* ── Opening Hours ── */}
            <div style={{
              background:"#f8fafc", borderRadius:14, padding:"18px 20px",
              border:"1px solid #e2e8f0", marginBottom:16,
            }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                marginBottom:12, flexWrap:"wrap", gap:8 }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:14, color:"#0f172a" }}>
                    🕐 เวลาเปิด-ปิด · Opening Hours
                  </div>
                  <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>เลือกช่วงเวลาที่เปิดให้บริการ</div>
                </div>
                <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer",
                  background: openAll ? "#dcfce7" : "#fff",
                  border: `1.5px solid ${openAll ? "#22c55e" : "#e2e8f0"}`,
                  borderRadius:10, padding:"6px 12px", transition:"all 0.15s" }}>
                  <input type="checkbox" checked={openAll} onChange={e => setOpenAll(e.target.checked)}
                    style={{ accentColor:"#22c55e", width:16, height:16 }} />
                  <span style={{ fontSize:13, fontWeight:700, color: openAll ? "#16a34a" : "#475569" }}>
                    เปิดตลอด 24 ชม. · Open 24 hrs
                  </span>
                </label>
              </div>
              {!openAll && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:8, alignItems:"end" }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    <label style={{ fontSize:13, fontWeight:700, color:"#334155" }}>เปิด · Opens</label>
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <select className="form-control" value={openTime.split(":")[0] || ""}
                        onChange={e => setOpenTime(`${e.target.value}:${openTime.split(":")[1] || "00"}`)}
                        style={{ flex:1 }}>
                        <option value="">ชั่วโมง</option>
                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <span style={{ color:"#94a3b8", fontWeight:800, fontSize:18 }}>:</span>
                      <select className="form-control" value={openTime.split(":")[1] || ""}
                        onChange={e => setOpenTime(`${openTime.split(":")[0] || "00"}:${e.target.value}`)}
                        style={{ flex:1 }}>
                        <option value="">นาที</option>
                        {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ paddingBottom:10, color:"#94a3b8", fontWeight:800, fontSize:20, textAlign:"center" }}>—</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    <label style={{ fontSize:13, fontWeight:700, color:"#334155" }}>ปิด · Closes</label>
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <select className="form-control" value={closeTime.split(":")[0] || ""}
                        onChange={e => setCloseTime(`${e.target.value}:${closeTime.split(":")[1] || "00"}`)}
                        style={{ flex:1 }}>
                        <option value="">ชั่วโมง</option>
                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <span style={{ color:"#94a3b8", fontWeight:800, fontSize:18 }}>:</span>
                      <select className="form-control" value={closeTime.split(":")[1] || ""}
                        onChange={e => setCloseTime(`${closeTime.split(":")[0] || "00"}:${e.target.value}`)}
                        style={{ flex:1 }}>
                        <option value="">นาที</option>
                        {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}
              <div style={{ marginTop:12, padding:"8px 12px", background:"#eff6ff",
                borderRadius:8, fontSize:13, color:"#1d4ed8", fontWeight:600 }}>
                🕐 {openAll ? "เปิด 24 ชั่วโมง · Open 24 hours"
                           : (openTime && closeTime ? `${openTime} – ${closeTime} น.` : "ยังไม่ได้ระบุเวลา")}
              </div>
            </div>

            {/* ── Closed Days ── */}
            <div style={{
              background:"#f8fafc", borderRadius:14, padding:"18px 20px",
              border:"1px solid #e2e8f0", marginBottom:16,
            }}>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontWeight:800, fontSize:14, color:"#0f172a" }}>
                  📅 วันหยุด / วันปิดทำการ · Closed Days
                </div>
                <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>
                  เลือกวันที่ปิดให้บริการ · Select days when closed
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:6 }}>
                {DAYS.map(day => {
                  const active = closedDaysList.includes(day.th);
                  return (
                    <button key={day.th} type="button" onClick={() => toggleDay(day.th)} style={{
                      padding:"10px 4px", borderRadius:10,
                      border: `2px solid ${active ? "#ef4444" : "#e2e8f0"}`,
                      background: active ? "#fef2f2" : "#fff",
                      cursor:"pointer", transition:"all 0.15s",
                      display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                    }}>
                      <span style={{ fontSize:11, fontWeight:800, color: active ? "#ef4444" : "#64748b" }}>{day.en}</span>
                      <span style={{ fontSize:11, color: active ? "#ef4444" : "#94a3b8" }}>{day.th}</span>
                      {active && <span style={{ fontSize:14 }}>✕</span>}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop:12, padding:"8px 12px", background:"#fff7ed",
                borderRadius:8, fontSize:13, fontWeight:600 }}>
                {closedDaysList.length === 0
                  ? <span style={{ color:"#16a34a" }}>✅ เปิดทุกวัน · Open every day</span>
                  : closedDaysList.length === 7
                    ? <span style={{ color:"#ef4444" }}>❌ ปิดทุกวัน</span>
                    : <span style={{ color:"#b45309" }}>🚫 ปิดทุกวัน{closedDaysList.join(", ")}</span>}
              </div>
            </div>

            <div className="form-grid two-col">
              <div className="field">
                <label>ค่าเข้าชม · Entry Fee</label>
                <input className="form-control" type="text" value={entryFee} onChange={e => setEntryFee(e.target.value)} placeholder="เช่น ฟรี / Free หรือ 50 ฿/คน" />
              </div>
              <div className="field">
                <label>เบอร์โทรศัพท์ · Phone Number</label>
                <input className="form-control" type="tel" inputMode="numeric"
                  value={phone} onChange={e => handlePhone(e.target.value)}
                  placeholder="เช่น 034-574222" pattern="[0-9+\-() ]*" />
              </div>
              <div className="field">
                <label>เว็บไซต์ · Website</label>
                <input className="form-control" type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." />
              </div>
              <div className="field">
                <label>Line ID</label>
                <input className="form-control" type="text" value={lineId} onChange={e => setLineId(e.target.value)} placeholder="@yourlineid" />
              </div>
            </div>
          </div>

          {/* ── 6. GALLERY ── */}
          <div className="section-card">
            <div className="section-hdr">
              <div>
                <h2>รูปภาพเพิ่มเติม <span className="en-tag sm">Gallery</span></h2>
                <p>เพิ่มรูปภาพได้สูงสุด {MAX_PHOTOS} รูป · Up to {MAX_PHOTOS} photos</p>
              </div>
            </div>

            <div className="gallery-toprow">
              <span className={"count-pill " + countState}>{totalPhotos} / {MAX_PHOTOS}</span>
              <label className={"add-photo-btn" + (totalPhotos >= MAX_PHOTOS ? " disabled" : "")}>
                + เพิ่มรูป
                <input type="file" hidden multiple accept="image/*" onChange={handleGalleryUpload} disabled={totalPhotos >= MAX_PHOTOS} />
              </label>
            </div>

            {totalPhotos === 0
              ? <div className="gallery-empty">🖼️<p>ยังไม่มีรูปภาพ · คลิก "+ เพิ่มรูป" เพื่ออัปโหลด</p></div>
              : (
                <div className="gallery-grid">
                  {existingGallery.map((img, i) => (
                    <div className="g-item" key={"ex-" + i}>
                      <img src={img} alt="" />
                      <button type="button" className="g-del" onClick={() => removeExisting(i)}>✕</button>
                    </div>
                  ))}
                  {galleryPreviews.map((img, i) => (
                    <div className="g-item" key={"new-" + i}>
                      <img src={img} alt="" />
                      <div style={{position:"absolute",top:6,left:6,background:"#22c55e",color:"white",fontSize:"10px",fontWeight:700,padding:"2px 6px",borderRadius:"4px"}}>NEW</div>
                      <button type="button" className="g-del" onClick={() => removeNew(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}

            <div className="progress-wrap">
              <div className={"progress-fill " + countState} style={{ width: `${usedPct}%` }} />
            </div>
          </div>

          {/* ── ACTIONS ── */}
          <div className="action-row">
            <Link href="/business/dashboard" className="btn-cancel">✕ ยกเลิก · Cancel</Link>
            <Link href={`/business/places/${slug}/preview`} className="btn-preview" target="_blank">
              👁️ ดูตัวอย่าง · Preview
            </Link>
            <button type="submit" className="btn-save" disabled={isLoading}>
              {isLoading ? "⏳ กำลังบันทึก..." : "✓ บันทึกข้อมูล · Save"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

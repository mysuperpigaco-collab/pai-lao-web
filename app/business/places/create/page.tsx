"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { uploadFile, uploadFiles } from "@/lib/uploadHelper";
import {
  BackButton, CancelButton, SaveButton, ActionBar, PageTag,
} from "@/components/ui/ActionButtons";
import { PROVINCES, getDistricts } from "@/data/thailand";
import "@/components/ui/form-card.css";
import "@/components/ui/action-buttons.css";

type PlaceCategory =
  | "ธรรมชาติ" | "คาเฟ่" | "ที่พัก" | "แคมปิ้ง" | "อาหาร"
  | "วัด / ศาสนสถาน" | "ชายหาด" | "ตลาด / ช้อปปิ้ง"
  | "กีฬา / ผจญภัย" | "พิพิธภัณฑ์ / ประวัติศาสตร์";

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

// uploadFile/uploadFiles imported from uploadHelper (includes resize)

/* ── Time picker sub-component ── */
function TimePicker({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  const [h, m] = value ? value.split(":") : ["", ""];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>{label}</label>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <select
          className="ui-input"
          value={h}
          onChange={e => onChange(`${e.target.value}:${m || "00"}`)}
          style={{ flex: 1, minWidth: 0 }}
        >
          <option value="">ชั่วโมง</option>
          {HOURS.map(hh => <option key={hh} value={hh}>{hh}</option>)}
        </select>
        <span style={{ color: "#94a3b8", fontWeight: 800, fontSize: 18 }}>:</span>
        <select
          className="ui-input"
          value={m}
          onChange={e => onChange(`${h || "00"}:${e.target.value}`)}
          style={{ flex: 1, minWidth: 0 }}
        >
          <option value="">นาที</option>
          {MINUTES.map(mm => <option key={mm} value={mm}>{mm}</option>)}
        </select>
      </div>
    </div>
  );
}

export default function CreatePlacePage() {
  const router = useRouter();
  const { user } = useAuth();

  // cover
  const [coverFile, setCoverFile]         = useState<File | null>(null);
  const [coverPreview, setCoverPreview]   = useState<string | null>(null);

  // gallery
  const [galleryFiles, setGalleryFiles]       = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  // basic info
  const [title, setTitle]       = useState("");
  const [titleEn, setTitleEn]   = useState("");
  const [category, setCategory] = useState<PlaceCategory>("ธรรมชาติ");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress]   = useState("");
  const [googleMaps, setGoogleMaps] = useState("");

  // description
  const [description, setDescription] = useState("");
  const [descShort, setDescShort]     = useState("");
  const [tagInput, setTagInput]       = useState("");
  const [tags, setTags]               = useState<string[]>([]);

  // operating hours — two separate time pickers
  const [openTime, setOpenTime]   = useState("08:00");
  const [closeTime, setCloseTime] = useState("17:00");
  const [openAll, setOpenAll]     = useState(false);   // ตลอด 24 ชั่วโมง

  // closed days — checkbox array
  const [closedDaysList, setClosedDaysList] = useState<string[]>([]);
  const toggleDay = (day: string) =>
    setClosedDaysList(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );

  // contact
  const [entryFee, setEntryFee] = useState("");
  const [phone, setPhone]       = useState("");
  const handlePhone = (v: string) => setPhone(v.replace(/[^0-9+\-() ]/g, ""));
  const [website, setWebsite]   = useState("");
  const [lineId, setLineId]     = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [petPolicy, setPetPolicy] = useState<string>("");

  const toggleAmenity = (key: string) => {
    setAmenities(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]);
  };

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError]   = useState("");

  const districts = getDistricts(province);

  const handleProvinceChange = (v: string) => {
    setProvince(v);
    setDistrict("");
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("รูปปกต้องไม่เกิน 5MB"); return; }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS - galleryFiles.length;
    const valid = files.slice(0, remaining).filter(f => f.size <= 5 * 1024 * 1024);
    setGalleryFiles(prev => [...prev, ...valid]);
    setGalleryPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))]);
  };

  const removeGallery = (i: number) => {
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
    if (!user || user.role !== "BUSINESS") {
      setApiError("เฉพาะเจ้าของธุรกิจเท่านั้น กรุณาเข้าสู่ระบบด้วยบัญชีเจ้าของสถานที่");
      return;
    }
    if (!user.business) {
      setApiError("ไม่พบข้อมูลธุรกิจของคุณ กรุณาติดต่อทีมงาน หรือสมัครใหม่เป็นเจ้าของสถานที่");
      return;
    }
    if (!coverFile) { setApiError("กรุณาอัปโหลดรูปปกสถานที่"); return; }
    if (!title || !province || !district || !description) {
      setApiError("กรุณากรอกข้อมูลที่จำเป็น (ชื่อ, จังหวัด, อำเภอ, คำอธิบาย)");
      return;
    }
    setApiError("");
    setIsLoading(true);

    // Build openHours string
    const openHoursStr = openAll
      ? "เปิด 24 ชั่วโมง"
      : (openTime && closeTime ? `${openTime} – ${closeTime}` : openTime || closeTime || undefined);

    // Build closedDays string
    const closedDaysStr = closedDaysList.length === 0
      ? undefined
      : closedDaysList.length === 7
        ? "ปิดทุกวัน"
        : `ปิดทุกวัน${closedDaysList.join(", ")}`;

    try {
      const coverUrl    = await uploadImage(coverFile);
      const galleryUrls = await Promise.all(galleryFiles.map(f => uploadImage(f)));

      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          titleEn:          titleEn     || undefined,
          province, district,
          address:          address     || undefined,
          googleMapsUrl:    googleMaps  || undefined,
          category, tags,
          coverUrl, gallery: galleryUrls,
          description,
          descriptionShort: descShort   || undefined,
          openHours:        openHoursStr,
          closedDays:       closedDaysStr,
          entryFee:         entryFee    || undefined,
          phone:            phone       || undefined,
          website:          website     || undefined,
          lineId:           lineId      || undefined,
          amenities,
          petPolicy:        petPolicy   || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setApiError(data.message || "เกิดข้อผิดพลาด"); setIsLoading(false); return; }
      router.push("/business/dashboard");
    } catch (err: any) {
      setApiError(err.message || "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่");
      setIsLoading(false);
    }
  };

  const usedPct    = Math.round((galleryFiles.length / MAX_PHOTOS) * 100);
  const countState = galleryFiles.length >= MAX_PHOTOS ? "full" : galleryFiles.length >= 15 ? "warn" : "ok";

  return (
    <div className="cp-page">
      <div className="cp-container">

        <div className="cp-topbar">
          <BackButton href="/business/dashboard" label="Dashboard" labelTh="กลับแดชบอร์ด" />
          <PageTag label="CREATE PLACE" />
        </div>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--pl-text-primary)", marginBottom: 6 }}>
            เพิ่มสถานที่ใหม่
            <span style={{ fontSize: 12, fontWeight: 700, background: "var(--pl-blue-soft)",
              color: "var(--pl-blue-dark)", padding: "3px 10px", borderRadius: 6,
              marginLeft: 12, verticalAlign: "middle" }}>Create New Place</span>
          </h1>
          <p style={{ color: "var(--pl-text-secondary)", fontSize: 15, margin: 0 }}>
            เพิ่มสถานที่ท่องเที่ยวใหม่เข้าสู่ระบบ · Add a new destination for travelers
          </p>
        </div>

        {apiError && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12,
            padding: "12px 16px", marginBottom: 20, color: "#b91c1c", fontSize: 14 }}>
            ⚠️ {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ── COVER ── */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>รูปปกหลัก <span className="ui-en-tag">Cover Photo</span> <span style={{color:"red"}}>*</span></h2>
                <p>ภาพที่จะแสดงในหน้าหลักและการค้นหา · Main image shown to travelers</p>
              </div>
            </div>
            <label className="cp-cover-upload">
              <input type="file" hidden accept="image/*" onChange={handleCoverUpload} />
              {coverPreview
                ? <img src={coverPreview} alt="cover" className="cp-cover-img" />
                : (
                  <div className="cp-cover-placeholder">
                    <span className="cp-cover-icon">🖼️</span>
                    <h3>คลิกเพื่ออัปโหลดรูปปก · Click to upload cover</h3>
                    <p>PNG, JPG ขนาดไม่เกิน 5MB</p>
                  </div>
                )}
              <div className="cp-cover-overlay"><span>เปลี่ยนรูปปก · Change cover</span></div>
            </label>
          </div>

          {/* ── BASIC INFO ── */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>ข้อมูลพื้นฐาน <span className="ui-en-tag">Basic Information</span></h2>
                <p>ชื่อและประเภทสถานที่ · Place name &amp; category</p>
              </div>
            </div>
            <div className="ui-form-grid two-col">
              <div className="ui-field">
                <label>ชื่อสถานที่ (ภาษาไทย) <span style={{color:"red"}}>*</span></label>
                <input className="ui-input" type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="เช่น น้ำตกเอราวัณ" required />
              </div>
              <div className="ui-field">
                <label>ชื่อภาษาอังกฤษ <span className="ui-hint">English Name</span></label>
                <input className="ui-input" type="text" value={titleEn} onChange={e => setTitleEn(e.target.value)}
                  placeholder="e.g. Erawan Waterfall" />
              </div>
            </div>
            <div className="ui-field" style={{marginTop:16}}>
              <label>ประเภทสถานที่ · Category <span style={{color:"red"}}>*</span></label>
              <div className="cat-grid">
                {CATEGORIES.map(c => (
                  <button key={c.th} type="button"
                    className={`cat-btn ${category === c.th ? "cat-active" : ""}`}
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

          {/* ── LOCATION ── */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>ที่ตั้งสถานที่ <span className="ui-en-tag">Location &amp; Address</span></h2>
                <p>ใช้สำหรับการค้นหาตามจังหวัดและอำเภอ · Used for province &amp; district search</p>
              </div>
            </div>
            <div className="ui-form-grid two-col">
              <div className="ui-field">
                <label>จังหวัด · Province <span style={{color:"red"}}>*</span></label>
                <select className="ui-input" value={province} onChange={e => handleProvinceChange(e.target.value)} required>
                  <option value="">— เลือกจังหวัด / Select Province —</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="ui-field">
                <label>อำเภอ / เขต · District <span style={{color:"red"}}>*</span></label>
                <select className="ui-input" value={district} onChange={e => setDistrict(e.target.value)}
                  disabled={!province} required>
                  <option value="">— เลือกอำเภอ / Select District —</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {!province && <span className="ui-hint" style={{fontSize:12,color:"#94a3b8"}}>เลือกจังหวัดก่อน</span>}
              </div>
            </div>
            <div className="ui-field" style={{marginTop:16}}>
              <label>ที่อยู่เพิ่มเติม · Full Address</label>
              <input className="ui-input" type="text" value={address} onChange={e => setAddress(e.target.value)}
                placeholder="เช่น 123 ถ.เพชรเกษม ต.ท่ากระดาน" />
            </div>
            <div className="ui-field" style={{marginTop:16}}>
              <label>Google Maps URL</label>
              <input className="ui-input" type="url" value={googleMaps} onChange={e => setGoogleMaps(e.target.value)}
                placeholder="https://maps.google.com/?q=..." />
              {googleMaps && (
                <a href={googleMaps} target="_blank" rel="noreferrer"
                  style={{color:"#3b82f6",fontSize:13,marginTop:6,display:"block"}}>
                  🗺️ ดูบน Google Maps
                </a>
              )}
            </div>
          </div>

          {/* ── DESCRIPTION ── */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>คำอธิบายสถานที่ <span className="ui-en-tag">Description &amp; Tags</span></h2>
                <p>อธิบายให้นักท่องเที่ยวเข้าใจและสนใจมาเที่ยว · Help travelers understand your place</p>
              </div>
            </div>
            <div className="ui-field">
              <label>คำอธิบายสั้น · Short Description <span className="ui-hint">แสดงในการ์ดค้นหา ไม่เกิน 80 ตัวอักษร</span></label>
              <input className="ui-input" type="text" value={descShort} onChange={e => setDescShort(e.target.value)}
                placeholder="เช่น น้ำตก 7 ชั้น น้ำสีมรกต ในอุทยานแห่งชาติ" maxLength={80} />
              <span style={{fontSize:12,color:"#94a3b8"}}>{descShort.length}/80</span>
            </div>
            <div className="ui-field" style={{marginTop:16}}>
              <label>คำอธิบายเต็ม · Full Description <span style={{color:"red"}}>*</span></label>
              <textarea className="ui-input textarea" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="อธิบายรายละเอียด บรรยากาศ จุดเด่น และเคล็ดลับการเที่ยวชม..." rows={5} required />
            </div>
            <div className="ui-field" style={{marginTop:16}}>
              <label>แท็ก · Tags <span className="ui-hint">ช่วยให้ค้นหาเจอง่ายขึ้น · Helps with search</span></label>
              <div style={{display:"flex",gap:8}}>
                <input className="ui-input" type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="พิมพ์แท็กแล้วกด Enter หรือปุ่ม +" style={{flex:1}} />
                <button type="button" onClick={addTag}
                  style={{padding:"10px 16px",borderRadius:10,border:"1px solid #e2e8f0",
                    background:"#f8fafc",cursor:"pointer",fontWeight:700,whiteSpace:"nowrap"}}>
                  + เพิ่ม
                </button>
              </div>
              {tags.length > 0 && (
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:10}}>
                  {tags.map(t => (
                    <span key={t} style={{background:"#eff6ff",color:"#3b82f6",padding:"4px 12px",
                      borderRadius:999,fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                      {t}
                      <button type="button" onClick={() => setTags(prev => prev.filter(x => x !== t))}
                        style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:14,lineHeight:1,padding:0}}>✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── OPERATING HOURS & CONTACT ── */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>เวลาทำการและการติดต่อ <span className="ui-en-tag">Hours &amp; Contact</span></h2>
                <p>ข้อมูลสำคัญที่นักท่องเที่ยวต้องการก่อนเดินทาง · Key info travelers need before visiting</p>
              </div>
            </div>

            {/* ── Opening Hours ── */}
            <div style={{
              background: "#f8fafc", borderRadius: 14, padding: "18px 20px",
              border: "1px solid #e2e8f0", marginBottom: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>
                    🕐 เวลาเปิด-ปิด · Opening Hours
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    เลือกช่วงเวลาที่เปิดให้บริการ
                  </div>
                </div>
                {/* 24hr toggle */}
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                  background: openAll ? "#dcfce7" : "#fff", border: `1.5px solid ${openAll ? "#22c55e" : "#e2e8f0"}`,
                  borderRadius: 10, padding: "6px 12px", transition: "all 0.15s" }}>
                  <input type="checkbox" checked={openAll} onChange={e => setOpenAll(e.target.checked)}
                    style={{ accentColor: "#22c55e", width: 16, height: 16 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: openAll ? "#16a34a" : "#475569" }}>
                    เปิดตลอด 24 ชม. · Open 24 hrs
                  </span>
                </label>
              </div>

              {!openAll && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "end" }}>
                  <TimePicker label="เปิด · Opens" value={openTime} onChange={setOpenTime} />
                  <div style={{ paddingBottom: 10, color: "#94a3b8", fontWeight: 800, fontSize: 20, textAlign: "center" }}>—</div>
                  <TimePicker label="ปิด · Closes" value={closeTime} onChange={setCloseTime} />
                </div>
              )}

              {/* Preview */}
              <div style={{ marginTop: 12, padding: "8px 12px", background: "#eff6ff",
                borderRadius: 8, fontSize: 13, color: "#1d4ed8", fontWeight: 600 }}>
                🕐 {openAll ? "เปิด 24 ชั่วโมง · Open 24 hours"
                           : (openTime && closeTime
                               ? `${openTime} – ${closeTime} น.`
                               : "ยังไม่ได้ระบุเวลา")}
              </div>
            </div>

            {/* ── Closed Days ── */}
            <div style={{
              background: "#f8fafc", borderRadius: 14, padding: "18px 20px",
              border: "1px solid #e2e8f0", marginBottom: 20,
            }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>
                  📅 วันหยุด / วันปิดทำการ · Closed Days
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  เลือกวันที่ปิดให้บริการ · Select days when your place is closed
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                {DAYS.map(day => {
                  const active = closedDaysList.includes(day.th);
                  return (
                    <button
                      key={day.th}
                      type="button"
                      onClick={() => toggleDay(day.th)}
                      style={{
                        padding: "10px 4px",
                        borderRadius: 10,
                        border: `2px solid ${active ? "#ef4444" : "#e2e8f0"}`,
                        background: active ? "#fef2f2" : "#fff",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 800,
                        color: active ? "#ef4444" : "#64748b" }}>{day.en}</span>
                      <span style={{ fontSize: 11, color: active ? "#ef4444" : "#94a3b8" }}>{day.th}</span>
                      {active && <span style={{ fontSize: 14 }}>✕</span>}
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: 12, padding: "8px 12px", background: "#fff7ed",
                borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                {closedDaysList.length === 0
                  ? <span style={{ color: "#16a34a" }}>✅ เปิดทุกวัน · Open every day</span>
                  : closedDaysList.length === 7
                    ? <span style={{ color: "#ef4444" }}>❌ ปิดทุกวัน</span>
                    : <span style={{ color: "#b45309" }}>
                        🚫 ปิดทุกวัน{closedDaysList.join(", ")}
                      </span>}
              </div>
            </div>

            {/* ── Other contact info ── */}
            <div className="ui-form-grid two-col">
              <div className="ui-field">
                <label>ค่าเข้าชม · Entry Fee</label>
                <input className="ui-input" type="text" value={entryFee} onChange={e => setEntryFee(e.target.value)}
                  placeholder="เช่น ฟรี / 50 ฿/คน / Free" />
              </div>
              <div className="ui-field">
                <label>เบอร์โทรศัพท์ · Phone Number</label>
                <input className="ui-input" type="tel" inputMode="numeric" value={phone}
                  onChange={e => handlePhone(e.target.value)} placeholder="เช่น 034-574222"
                  pattern="[0-9+\-() ]*" />
              </div>
              <div className="ui-field">
                <label>เว็บไซต์ · Website</label>
                <input className="ui-input" type="url" value={website} onChange={e => setWebsite(e.target.value)}
                  placeholder="https://..." />
              </div>
              <div className="ui-field">
                <label>Line ID</label>
                <input className="ui-input" type="text" value={lineId} onChange={e => setLineId(e.target.value)}
                  placeholder="@yourlineid" />
              </div>
            </div>
          </div>

          {/* ── AMENITIES & PET POLICY ── */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>สิ่งอำนวยความสะดวก <span className="ui-en-tag">Facilities & Pet Policy</span></h2>
                <p>เลือกสิ่งอำนวยความสะดวกที่มีในสถานที่ และระบุนโยบายสัตว์เลี้ยง</p>
              </div>
            </div>

            {/* Amenity grid */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 10 }}>
                🏷️ สิ่งอำนวยความสะดวก · Facilities
              </p>
              <div className="amenity-grid">
                {([
                  { key: "PARKING",     icon: "🅿️",  label: "ที่จอดรถ",       en: "Parking" },
                  { key: "WIFI",        icon: "📶",  label: "Wi-Fi ฟรี",      en: "Free Wi-Fi" },
                  { key: "RESTROOM",    icon: "🚻",  label: "ห้องน้ำ",         en: "Restroom" },
                  { key: "AIRCON",      icon: "❄️",  label: "แอร์",            en: "Air Con" },
                  { key: "ACCESSIBLE",  icon: "♿",  label: "เข้าถึงได้",      en: "Accessible" },
                  { key: "CREDIT_CARD", icon: "💳",  label: "รับบัตรเครดิต",   en: "Credit Card" },
                  { key: "RESTAURANT",  icon: "🍽️", label: "ร้านอาหาร",       en: "Restaurant" },
                  { key: "CAFE",        icon: "☕",  label: "เครื่องดื่ม",      en: "Café" },
                  { key: "CHARGING",    icon: "🔌",  label: "ที่ชาร์จ",         en: "Charging" },
                  { key: "ELEVATOR",    icon: "🛗",  label: "ลิฟต์",           en: "Elevator" },
                  { key: "POOL",        icon: "🏊",  label: "สระว่ายน้ำ",      en: "Pool" },
                  { key: "PHOTO_SPOT",  icon: "📸",  label: "จุดถ่ายรูป",      en: "Photo Spot" },
                ] as { key: string; icon: string; label: string; en: string }[]).map(a => {
                  const active = amenities.includes(a.key);
                  return (
                    <button
                      key={a.key}
                      type="button"
                      className={`amenity-btn${active ? " active" : ""}`}
                      onClick={() => toggleAmenity(a.key)}
                    >
                      <span className="amenity-icon">{a.icon}</span>
                      <span className="amenity-label">{a.label}</span>
                      <span className="amenity-en">{a.en}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pet Policy */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 10 }}>
                🐾 นโยบายสัตว์เลี้ยง · Pet Policy
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {([
                  { val: "ALLOWED",     icon: "🐾", label: "สัตว์เลี้ยงเข้าได้",       color: "#16a34a", bg: "#f0fdf4", border: "#86efac" },
                  { val: "CONDITIONS",  icon: "⚠️", label: "เข้าได้บางส่วน",           color: "#b45309", bg: "#fffbeb", border: "#fcd34d" },
                  { val: "NOT_ALLOWED", icon: "🚫", label: "ห้ามนำสัตว์เลี้ยงเข้า",    color: "#b91c1c", bg: "#fef2f2", border: "#fca5a5" },
                ] as { val: string; icon: string; label: string; color: string; bg: string; border: string }[]).map(p => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setPetPolicy(prev => prev === p.val ? "" : p.val)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 16px", borderRadius: 12, border: `2px solid`,
                      borderColor: petPolicy === p.val ? p.color : "#e2e8f0",
                      background: petPolicy === p.val ? p.bg : "#fff",
                      color: petPolicy === p.val ? p.color : "#64748b",
                      fontWeight: 700, fontSize: 13, cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>
              {!petPolicy && (
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
                  * หากไม่ระบุ จะไม่แสดงข้อมูลนโยบายสัตว์เลี้ยง
                </p>
              )}
            </div>
          </div>

          {/* ── GALLERY ── */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>รูปภาพเพิ่มเติม <span className="ui-en-tag">Photo Gallery</span></h2>
                <p>เพิ่มรูปภาพได้สูงสุด {MAX_PHOTOS} รูป · Up to {MAX_PHOTOS} photos</p>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <span className={`count-pill ${countState}`}>{galleryFiles.length} / {MAX_PHOTOS}</span>
              <label className={`add-photo-btn ${galleryFiles.length >= MAX_PHOTOS ? "disabled" : ""}`}>
                + เพิ่มรูป · Add Photos
                <input type="file" hidden multiple accept="image/*" onChange={handleGalleryUpload}
                  disabled={galleryFiles.length >= MAX_PHOTOS} />
              </label>
            </div>
            {galleryPreviews.length === 0
              ? <div className="gallery-empty">🖼️<p>ยังไม่มีรูปภาพ · คลิก "+ เพิ่มรูป" เพื่ออัปโหลด</p></div>
              : (
                <div className="gallery-grid">
                  {galleryPreviews.map((img, i) => (
                    <div className="g-item" key={i}>
                      <img src={img} alt="" />
                      <button type="button" className="g-del" onClick={() => removeGallery(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            <div className="progress-wrap">
              <div className={`progress-fill ${countState}`} style={{ width: `${usedPct}%` }} />
            </div>
          </div>

          <ActionBar>
            <CancelButton href="/business/dashboard" label="ยกเลิก · Discard" />
            <SaveButton label={isLoading ? "⏳ กำลังบันทึก..." : "🚀 บันทึกสถานที่ · Save Place"} loading={isLoading} />
          </ActionBar>

        </form>
      </div>

      <style jsx>{`
        .cp-page { min-height: 100vh; background: var(--pl-bg, #f8fafc); padding: 36px 20px 80px; }
        .cp-container { max-width: 1180px; margin: auto; }
        .cp-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }

        .cp-cover-upload { display: block; width: 100%; height: 360px; border-radius: 24px; overflow: hidden; border: 2px dashed var(--pl-border, #dbeafe); background: #f8fbff; cursor: pointer; position: relative; transition: border-color 0.2s; }
        .cp-cover-upload:hover { border-color: var(--pl-blue, #4facfe); }
        .cp-cover-img { width: 100%; height: 100%; object-fit: cover; }
        .cp-cover-placeholder { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10px; color: #64748b; }
        .cp-cover-icon { font-size: 56px; }
        .cp-cover-placeholder h3 { font-size: 16px; font-weight: 800; color: #334155; margin: 0; text-align: center; padding: 0 20px; }
        .cp-cover-placeholder p { font-size: 13px; color: #94a3b8; margin: 0; }
        .cp-cover-overlay { position: absolute; inset: 0; background: rgba(15,23,42,0.45); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.2s; }
        .cp-cover-upload:hover .cp-cover-overlay { opacity: 1; }
        .cp-cover-overlay span { color: white; font-size: 15px; font-weight: 800; background: rgba(0,0,0,0.4); padding: 10px 22px; border-radius: 999px; backdrop-filter: blur(6px); }

        .ui-form-grid.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .ui-field { display: flex; flex-direction: column; gap: 6px; }
        .ui-hint { color: #94a3b8; font-weight: 400; font-size: 12px; }

        .cat-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .cat-btn { padding: 8px 14px; border-radius: 10px; border: 1px solid #e2e8f0; background: #f8fafc; cursor: pointer; font-size: 13px; font-weight: 600; color: #475569; transition: 0.15s; }
        .cat-btn:hover { border-color: #93c5fd; background: #eff6ff; }
        .cat-active { border-color: #3b82f6 !important; background: #eff6ff !important; color: #1d4ed8 !important; }

        .count-pill { padding: 4px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; }
        .count-pill.ok { background: #dcfce7; color: #16a34a; }
        .count-pill.warn { background: #fef9c3; color: #a16207; }
        .count-pill.full { background: #fee2e2; color: #b91c1c; }

        .add-photo-btn { padding: 8px 18px; border-radius: 10px; border: 1px solid #3b82f6; background: #eff6ff; color: #3b82f6; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.15s; }
        .add-photo-btn:hover { background: #3b82f6; color: white; }
        .add-photo-btn.disabled { opacity: 0.4; pointer-events: none; }

        .gallery-empty { display: flex; flex-direction: column; align-items: center; padding: 40px; color: #94a3b8; font-size: 40px; gap: 8px; }
        .gallery-empty p { font-size: 14px; margin: 0; }

        .amenity-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
        .amenity-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 8px; border-radius: 12px; border: 2px solid #e2e8f0; background: #fff; cursor: pointer; transition: all 0.15s; }
        .amenity-btn:hover { border-color: #93c5fd; background: #f0f9ff; }
        .amenity-btn.active { border-color: #16a34a; background: #f0fdf4; }
        .amenity-icon { font-size: 22px; }
        .amenity-label { font-size: 12px; font-weight: 700; color: #334155; text-align: center; }
        .amenity-en { font-size: 10px; font-weight: 600; color: #94a3b8; text-align: center; }
        .amenity-btn.active .amenity-label { color: #15803d; }
        .amenity-btn.active .amenity-en { color: #4ade80; }

        .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-bottom: 16px; }
        .g-item { position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 1; }
        .g-item img { width: 100%; height: 100%; object-fit: cover; }
        .g-del { position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; }

        .progress-wrap { height: 6px; border-radius: 999px; background: #f1f5f9; margin-top: 12px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 999px; transition: width 0.3s; }
        .progress-fill.ok { background: #22c55e; }
        .progress-fill.warn { background: #f59e0b; }
        .progress-fill.full { background: #ef4444; }

        @media (max-width: 768px) {
          .cp-cover-upload { height: 220px; }
          .ui-form-grid.two-col { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

const CATEGORIES: PlaceCategory[] = [
  "ธรรมชาติ","คาเฟ่","ที่พัก","แคมปิ้ง","อาหาร",
  "วัด / ศาสนสถาน","ชายหาด","ตลาด / ช้อปปิ้ง",
  "กีฬา / ผจญภัย","พิพิธภัณฑ์ / ประวัติศาสตร์",
];
const CATEGORY_ICON: Record<string, string> = {
  "ธรรมชาติ":"🌿","คาเฟ่":"☕","ที่พัก":"🏨","แคมปิ้ง":"⛺","อาหาร":"🍲",
  "วัด / ศาสนสถาน":"🛕","ชายหาด":"🏖️","ตลาด / ช้อปปิ้ง":"🛍️",
  "กีฬา / ผจญภัย":"🧗","พิพิธภัณฑ์ / ประวัติศาสตร์":"🏛️",
};
const MAX_PHOTOS = 20;

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("อัปโหลดรูปไม่สำเร็จ");
  const data = await res.json();
  return data.url as string;
}

export default function CreatePlacePage() {
  const router = useRouter();

  // cover
  const [coverFile, setCoverFile]     = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // gallery
  const [galleryFiles, setGalleryFiles]     = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  // basic info
  const [title, setTitle]             = useState("");
  const [titleEn, setTitleEn]         = useState("");
  const [category, setCategory]       = useState<PlaceCategory>("ธรรมชาติ");
  const [province, setProvince]       = useState("");
  const [district, setDistrict]       = useState("");
  const [address, setAddress]         = useState("");
  const [googleMaps, setGoogleMaps]   = useState("");

  // description
  const [description, setDescription]     = useState("");
  const [descShort, setDescShort]         = useState("");
  const [tagInput, setTagInput]           = useState("");
  const [tags, setTags]                   = useState<string[]>([]);

  // operating
  const [openHours, setOpenHours]     = useState("");
  const [closedDays, setClosedDays]   = useState("");
  const [entryFee, setEntryFee]       = useState("");
  const [phone, setPhone]             = useState("");
  const [website, setWebsite]         = useState("");
  const [lineId, setLineId]           = useState("");

  const [isLoading, setIsLoading]     = useState(false);
  const [apiError, setApiError]       = useState("");

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
    if (!coverFile) { setApiError("กรุณาอัปโหลดรูปปกสถานที่"); return; }
    if (!title || !province || !district || !description) {
      setApiError("กรุณากรอกข้อมูลที่จำเป็น (ชื่อ, จังหวัด, อำเภอ, คำอธิบาย)");
      return;
    }
    setApiError("");
    setIsLoading(true);

    try {
      // 1) upload cover
      const coverUrl = await uploadImage(coverFile);

      // 2) upload gallery
      const galleryUrls = await Promise.all(galleryFiles.map(f => uploadImage(f)));

      // 3) POST to API
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, titleEn: titleEn || undefined,
          province, district,
          address:          address       || undefined,
          googleMapsUrl:    googleMaps    || undefined,
          category,
          tags,
          coverUrl,
          gallery:          galleryUrls,
          description,
          descriptionShort: descShort     || undefined,
          openHours:        openHours     || undefined,
          closedDays:       closedDays    || undefined,
          entryFee:         entryFee      || undefined,
          phone:            phone         || undefined,
          website:          website       || undefined,
          lineId:           lineId        || undefined,
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

  const usedPct = Math.round((galleryFiles.length / MAX_PHOTOS) * 100);
  const countState = galleryFiles.length >= MAX_PHOTOS ? "full" : galleryFiles.length >= 15 ? "warn" : "ok";

  return (
    <div className="cp-page">
      <div className="cp-container">

        <div className="cp-topbar">
          <BackButton href="/business/dashboard" label="Dashboard" labelTh="กลับแดชบอร์ด" />
          <PageTag label="CREATE PLACE" />
        </div>

        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 900, color: "var(--pl-text-primary)", marginBottom: "6px" }}>
            เพิ่มสถานที่ใหม่
            <span style={{ fontSize: "12px", fontWeight: 700, background: "var(--pl-blue-soft)",
              color: "var(--pl-blue-dark)", padding: "3px 10px", borderRadius: "6px",
              marginLeft: "12px", verticalAlign: "middle" }}>Create New Place</span>
          </h1>
          <p style={{ color: "var(--pl-text-secondary)", fontSize: "15px", margin: 0 }}>
            เพิ่มสถานที่ท่องเที่ยวใหม่เข้าสู่ระบบ · Add a new destination for travelers
          </p>
        </div>

        {apiError && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px",
            padding: "12px 16px", marginBottom: "20px", color: "#b91c1c", fontSize: "14px" }}>
            ⚠️ {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* COVER */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>รูปปกหลัก <span className="ui-en-tag">Cover Photo</span> <span style={{color:"red"}}>*</span></h2>
                <p>ภาพที่จะแสดงในหน้าหลักและการค้นหา · Main image shown to travelers</p>
              </div>
            </div>
            <label className="cp-cover-upload">
              <input type="file" hidden accept="image/*" onChange={handleCoverUpload} />
              {coverPreview ? (
                <img src={coverPreview} alt="cover" className="cp-cover-img" />
              ) : (
                <div className="cp-cover-placeholder">
                  <span className="cp-cover-icon">🖼️</span>
                  <h3>คลิกเพื่ออัปโหลดรูปปก</h3>
                  <p>PNG, JPG ขนาดไม่เกิน 5MB · Click to upload cover image</p>
                </div>
              )}
              <div className="cp-cover-overlay"><span>เปลี่ยนรูปปก · Change cover</span></div>
            </label>
          </div>

          {/* BASIC INFO */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>ข้อมูลพื้นฐาน <span className="ui-en-tag">Basic Info</span></h2>
                <p>ชื่อ ประเภท สถานที่ · Name and category</p>
              </div>
            </div>
            <div className="ui-form-grid two-col">
              <div className="ui-field">
                <label>ชื่อสถานที่ (ภาษาไทย) <span style={{color:"red"}}>*</span></label>
                <input className="ui-input" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="เช่น น้ำตกเอราวัณ" required />
              </div>
              <div className="ui-field">
                <label>ชื่อภาษาอังกฤษ <span className="ui-hint">English name</span></label>
                <input className="ui-input" type="text" value={titleEn} onChange={e => setTitleEn(e.target.value)} placeholder="e.g. Erawan Waterfall" />
              </div>
            </div>
            <div className="ui-field" style={{marginTop:"16px"}}>
              <label>ประเภทสถานที่ <span style={{color:"red"}}>*</span></label>
              <div className="cat-grid">
                {CATEGORIES.map(c => (
                  <button key={c} type="button"
                    className={`cat-btn ${category === c ? "cat-active" : ""}`}
                    onClick={() => setCategory(c)}>
                    {CATEGORY_ICON[c]} {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* LOCATION */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>ที่ตั้งสถานที่ <span className="ui-en-tag">Location</span></h2>
                <p>ข้อมูลนี้ใช้สำหรับการค้นหาตามจังหวัดและอำเภอ</p>
              </div>
            </div>
            <div className="ui-form-grid two-col">
              <div className="ui-field">
                <label>จังหวัด <span style={{color:"red"}}>*</span></label>
                <select className="ui-input" value={province} onChange={e => handleProvinceChange(e.target.value)} required>
                  <option value="">— เลือกจังหวัด —</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="ui-field">
                <label>อำเภอ / เขต <span style={{color:"red"}}>*</span></label>
                <select className="ui-input" value={district} onChange={e => setDistrict(e.target.value)} disabled={!province} required>
                  <option value="">— เลือกอำเภอ —</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {!province && <span className="ui-hint" style={{fontSize:"12px",color:"#94a3b8"}}>เลือกจังหวัดก่อน</span>}
              </div>
            </div>
            <div className="ui-field" style={{marginTop:"16px"}}>
              <label>ที่อยู่เพิ่มเติม <span className="ui-hint">รายละเอียดที่อยู่</span></label>
              <input className="ui-input" type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="เช่น 123 ถ.เพชรเกษม ต.ท่ากระดาน" />
            </div>
            <div className="ui-field" style={{marginTop:"16px"}}>
              <label>Google Maps URL</label>
              <input className="ui-input" type="url" value={googleMaps} onChange={e => setGoogleMaps(e.target.value)} placeholder="https://maps.google.com/?q=..." />
              {googleMaps && (
                <a href={googleMaps} target="_blank" rel="noreferrer" style={{color:"#3b82f6",fontSize:"13px",marginTop:"6px",display:"block"}}>
                  🗺️ ดูบน Google Maps
                </a>
              )}
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>คำอธิบายสถานที่ <span className="ui-en-tag">Description</span></h2>
                <p>อธิบายให้นักท่องเที่ยวเข้าใจและสนใจมาเที่ยว</p>
              </div>
            </div>
            <div className="ui-field">
              <label>คำอธิบายสั้น <span className="ui-hint">แสดงในการ์ดค้นหา ไม่เกิน 80 ตัวอักษร</span></label>
              <input className="ui-input" type="text" value={descShort} onChange={e => setDescShort(e.target.value)}
                placeholder="เช่น น้ำตก 7 ชั้น น้ำสีมรกต ในอุทยานแห่งชาติ" maxLength={80} />
              <span style={{fontSize:"12px",color:"#94a3b8"}}>{descShort.length}/80</span>
            </div>
            <div className="ui-field" style={{marginTop:"16px"}}>
              <label>คำอธิบายเต็ม <span style={{color:"red"}}>*</span> <span className="ui-hint">แสดงในหน้ารายละเอียด</span></label>
              <textarea className="ui-input textarea" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="อธิบายรายละเอียด บรรยากาศ จุดเด่น และเคล็ดลับการเที่ยวชม..." rows={5} required />
            </div>
            <div className="ui-field" style={{marginTop:"16px"}}>
              <label>แท็ก <span className="ui-hint">ช่วยให้ค้นหาเจอง่ายขึ้น</span></label>
              <div style={{display:"flex",gap:"8px"}}>
                <input className="ui-input" type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="พิมพ์แท็กแล้วกด Enter หรือปุ่ม +" style={{flex:1}} />
                <button type="button" onClick={addTag}
                  style={{padding:"10px 16px",borderRadius:"10px",border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",fontWeight:700,whiteSpace:"nowrap"}}>
                  + เพิ่ม
                </button>
              </div>
              {tags.length > 0 && (
                <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginTop:"10px"}}>
                  {tags.map(t => (
                    <span key={t} style={{background:"#eff6ff",color:"#3b82f6",padding:"4px 12px",borderRadius:"999px",fontSize:"13px",fontWeight:600,display:"flex",alignItems:"center",gap:"6px"}}>
                      {t}
                      <button type="button" onClick={() => setTags(prev => prev.filter(x => x !== t))}
                        style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:"14px",lineHeight:1,padding:0}}>✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* OPERATING */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>ข้อมูลการเปิด-ปิด และติดต่อ <span className="ui-en-tag">Contact & Hours</span></h2>
                <p>ข้อมูลสำคัญที่นักท่องเที่ยวต้องการก่อนเดินทาง</p>
              </div>
            </div>
            <div className="ui-form-grid two-col">
              <div className="ui-field">
                <label>เวลาเปิด–ปิด</label>
                <input className="ui-input" type="text" value={openHours} onChange={e => setOpenHours(e.target.value)} placeholder="เช่น 08:00 – 17:00" />
              </div>
              <div className="ui-field">
                <label>วันหยุด / วันปิดทำการ</label>
                <input className="ui-input" type="text" value={closedDays} onChange={e => setClosedDays(e.target.value)} placeholder="เช่น ปิดวันจันทร์" />
              </div>
              <div className="ui-field">
                <label>ค่าเข้าชม</label>
                <input className="ui-input" type="text" value={entryFee} onChange={e => setEntryFee(e.target.value)} placeholder="เช่น ฟรี หรือ 50 ฿/คน" />
              </div>
              <div className="ui-field">
                <label>เบอร์โทรศัพท์</label>
                <input className="ui-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="เช่น 034-574222" />
              </div>
              <div className="ui-field">
                <label>เว็บไซต์</label>
                <input className="ui-input" type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." />
              </div>
              <div className="ui-field">
                <label>Line ID</label>
                <input className="ui-input" type="text" value={lineId} onChange={e => setLineId(e.target.value)} placeholder="@yourlineid" />
              </div>
            </div>
          </div>

          {/* GALLERY */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>รูปภาพเพิ่มเติม <span className="ui-en-tag">Gallery</span></h2>
                <p>เพิ่มรูปภาพได้สูงสุด {MAX_PHOTOS} รูป</p>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
              <span className={`count-pill ${countState}`}>{galleryFiles.length} / {MAX_PHOTOS}</span>
              <label className={`add-photo-btn ${galleryFiles.length >= MAX_PHOTOS ? "disabled" : ""}`}>
                + เพิ่มรูป
                <input type="file" hidden multiple accept="image/*" onChange={handleGalleryUpload} disabled={galleryFiles.length >= MAX_PHOTOS} />
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
        .cp-cover-placeholder h3 { font-size: 18px; font-weight: 800; color: #334155; margin: 0; }
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

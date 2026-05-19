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
  const { slug } = use(params);
  const router = useRouter();

  // ── Loading state ──
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound]       = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [apiError, setApiError]       = useState("");

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
  const [openHours, setOpenHours]   = useState("");
  const [closedDays, setClosedDays] = useState("");
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
        setCategory(p.category ?? "ธรรมชาติ");
        setTags(p.tags ?? []);
        setDescription(p.description ?? "");
        setDescShort(p.descriptionShort ?? "");
        setOpenHours(p.openHours ?? "");
        setClosedDays(p.closedDays ?? "");
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

  const totalPhotos = existingGallery.length + galleryFiles.length;
  const usedPct = Math.round((totalPhotos / MAX_PHOTOS) * 100);
  const countState = totalPhotos >= MAX_PHOTOS ? "full" : totalPhotos >= 15 ? "warn" : "ok";

  if (pageLoading) return (
    <div className="edit-page" style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
      <p style={{color:"#94a3b8",fontSize:"16px"}}>⏳ กำลังโหลดข้อมูล...</p>
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
                <p>ภาพที่จะแสดงในหน้าหลักและการค้นหา</p>
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
                <p>ชื่อ ประเภท และที่ตั้งของสถานที่</p>
              </div>
            </div>
            <div className="form-grid two-col">
              <div className="field">
                <label>ชื่อสถานที่ (ภาษาไทย) <span className="req">*</span></label>
                <input className="form-control" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="เช่น น้ำตกเอราวัณ" required />
              </div>
              <div className="field">
                <label>ชื่อภาษาอังกฤษ <span className="hint">English name</span></label>
                <input className="form-control" type="text" value={titleEn} onChange={e => setTitleEn(e.target.value)} placeholder="e.g. Erawan Waterfall" />
              </div>
            </div>
            <div className="field mt16">
              <label>ประเภทสถานที่ <span className="req">*</span></label>
              <div className="cat-grid">
                {CATEGORIES.map(c => (
                  <button key={c} type="button"
                    className={"cat-btn" + (category === c ? " cat-active" : "")}
                    onClick={() => setCategory(c)}>
                    {CATEGORY_ICON[c]} {c}
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
                <label>จังหวัด <span className="req">*</span></label>
                <select className="form-control" value={province} onChange={e => handleProvinceChange(e.target.value)} required>
                  <option value="">— เลือกจังหวัด —</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="field">
                <label>อำเภอ / เขต <span className="req">*</span></label>
                <select className="form-control" value={district} onChange={e => setDistrict(e.target.value)} disabled={!province} required>
                  <option value="">— เลือกอำเภอ —</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {!province && <span className="field-hint">เลือกจังหวัดก่อน</span>}
              </div>
            </div>
            <div className="field mt16">
              <label>ที่อยู่เพิ่มเติม <span className="hint">รายละเอียดที่อยู่</span></label>
              <input className="form-control" type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="เช่น 123 ถ.เพชรเกษม ต.ท่ากระดาน" />
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
              <label>คำอธิบายสั้น <span className="hint">แสดงในการ์ดค้นหา ไม่เกิน 80 ตัวอักษร</span></label>
              <input className="form-control" type="text" value={descShort} onChange={e => setDescShort(e.target.value)}
                placeholder="เช่น น้ำตก 7 ชั้น น้ำสีมรกต ในอุทยานแห่งชาติ" maxLength={80} />
              <span className="char-count">{descShort.length}/80</span>
            </div>
            <div className="field mt16">
              <label>คำอธิบายเต็ม <span className="req">*</span> <span className="hint">แสดงในหน้ารายละเอียด</span></label>
              <textarea className="form-control textarea" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="อธิบายรายละเอียด บรรยากาศ จุดเด่น และเคล็ดลับการเที่ยวชม..." rows={5} required />
            </div>
            <div className="field mt16">
              <label>แท็ก <span className="hint">ช่วยให้ค้นหาเจอง่ายขึ้น</span></label>
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
            <div className="form-grid two-col">
              <div className="field">
                <label>เวลาเปิด–ปิด</label>
                <input className="form-control" type="text" value={openHours} onChange={e => setOpenHours(e.target.value)} placeholder="เช่น 08:00 – 17:00" />
              </div>
              <div className="field">
                <label>วันหยุด / วันปิดทำการ</label>
                <input className="form-control" type="text" value={closedDays} onChange={e => setClosedDays(e.target.value)} placeholder="เช่น ปิดวันจันทร์, เปิดทุกวัน" />
              </div>
              <div className="field">
                <label>ค่าเข้าชม</label>
                <input className="form-control" type="text" value={entryFee} onChange={e => setEntryFee(e.target.value)} placeholder="เช่น ฟรี หรือ 50 ฿/คน" />
              </div>
              <div className="field">
                <label>เบอร์โทรศัพท์ <span className="hint">Phone number</span></label>
                <input className="form-control" type="tel" inputMode="numeric"
                  value={phone} onChange={e => handlePhone(e.target.value)}
                  placeholder="เช่น 034-574222" pattern="[0-9+\-() ]*" />
              </div>
              <div className="field">
                <label>เว็บไซต์</label>
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
                <p>เพิ่มรูปภาพได้สูงสุด {MAX_PHOTOS} รูป</p>
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

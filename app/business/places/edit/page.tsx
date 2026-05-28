"use client";

import { useState } from "react";
import {
  BackButton,
  CancelButton,
  SaveButton,
  ActionBar,
  PageTag,
} from "@/components/ui/ActionButtons";

import "@/components/ui/form-card.css";
import "@/components/ui/action-buttons.css";

export default function EditPlacePage() {
  const [cover, setCover] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("รูปปกต้องไม่เกิน 5MB"); return; }
    setCover(URL.createObjectURL(file));
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map(file => URL.createObjectURL(file));
    setGallery(prev => [...prev, ...newImages]);
  };

  const removeGalleryImage = (index: number) => {
    setGallery(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("บันทึกข้อมูลสถานที่เรียบร้อย / Place updated!");
  };

  return (
    <div className="ep2-page">
      <div className="ep2-container">

        {/* TOP BAR */}
        <div className="ep2-topbar">
          <BackButton href="/business/dashboard" label="Dashboard" labelTh="กลับแดชบอร์ด" />
          <PageTag label="EDIT PLACE" />
        </div>

        {/* PAGE TITLE */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 900, color: "var(--pl-text-primary)", marginBottom: "6px" }}>
            แก้ไขข้อมูลสถานที่
            <span style={{
              fontSize: "12px", fontWeight: 700,
              background: "var(--pl-blue-soft)", color: "var(--pl-blue-dark)",
              padding: "3px 10px", borderRadius: "6px", marginLeft: "12px", verticalAlign: "middle",
            }}>Edit Place</span>
          </h1>
          <p style={{ color: "var(--pl-text-secondary)", fontSize: "15px", margin: 0 }}>
            ปรับปรุงข้อมูล รูปภาพ และรายละเอียดของสถานที่ · Update place details and images
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* COVER */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>รูปปกหลัก <span className="ui-en-tag">Cover Photo</span></h2>
                <p>ภาพที่แสดงในหน้าหลักของสถานที่ · Main image shown to travelers</p>
              </div>
            </div>

            <label className="ep2-cover-upload">
              <input type="file" hidden accept="image/*" onChange={handleCoverUpload} />
              {cover ? (
                <img src={cover} alt="cover" className="ep2-cover-img" />
              ) : (
                <div className="ep2-cover-placeholder">
                  <span>🖼️</span>
                  <h3>เพิ่มรูปปกสถานที่</h3>
                  <p>คลิกเพื่ออัปโหลดรูป · PNG, JPG ไม่เกิน 5MB</p>
                </div>
              )}
              <div className="ep2-cover-overlay">
                <span>เปลี่ยนรูปปก · Change cover</span>
              </div>
            </label>
          </div>

          {/* BASIC INFO */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>ข้อมูลสถานที่ <span className="ui-en-tag">Place Information</span></h2>
                <p>รายละเอียดที่นักท่องเที่ยวเห็น · Details visible to travelers</p>
              </div>
            </div>

            <div className="ui-form-grid">
              <div className="ui-field col-full">
                <label>ชื่อสถานที่ <span className="en">Place name</span></label>
                <input className="ui-input" type="text" defaultValue="น้ำตกเอราวัณ" />
              </div>

              <div className="ui-field">
                <label>จังหวัด <span className="en">Province</span></label>
                <select className="ui-input">
                  <option>กาญจนบุรี</option>
                  <option>เชียงใหม่</option>
                  <option>ภูเก็ต</option>
                  <option>กรุงเทพมหานคร</option>
                </select>
              </div>

              <div className="ui-field">
                <label>ประเภทสถานที่ <span className="en">Category</span></label>
                <select className="ui-input">
                  <option>🌊 ธรรมชาติ</option>
                  <option>☕ คาเฟ่</option>
                  <option>🏨 ที่พัก</option>
                  <option>⛺ แคมปิ้ง</option>
                  <option>🍲 อาหาร</option>
                </select>
              </div>

              <div className="ui-field col-full">
                <label>Google Maps URL</label>
                <input className="ui-input" type="url" placeholder="https://maps.google.com/..." />
              </div>

              <div className="ui-field">
                <label>เวลาเปิด-ปิด <span className="en">Opening hours</span></label>
                <input className="ui-input" type="text" placeholder="08:00 - 18:00" />
              </div>

              <div className="ui-field">
                <label>เบอร์ติดต่อ <span className="en">Phone</span></label>
                <input className="ui-input" type="tel" placeholder="0812345678" />
              </div>

              <div className="ui-field col-full">
                <label>รายละเอียดสถานที่ <span className="en">Description</span></label>
                <textarea className="ui-input textarea" placeholder="เล่ารายละเอียดของสถานที่..." />
              </div>
            </div>
          </div>

          {/* GALLERY */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>รูปภาพเพิ่มเติม <span className="ui-en-tag">Gallery</span></h2>
                <p>เพิ่มรูปภาพเพื่อดึงดูดนักท่องเที่ยว · Add photos to attract travelers</p>
              </div>
              <label className="ep2-add-photo-btn">
                + เพิ่มรูป
                <input type="file" hidden multiple accept="image/*" onChange={handleGalleryUpload} />
              </label>
            </div>

            {gallery.length > 0 ? (
              <div className="ep2-gallery-grid">
                {gallery.map((img, index) => (
                  <div className="ep2-gallery-item" key={index}>
                    <img src={img} alt="gallery" />
                    <button
                      type="button"
                      className="ep2-gallery-del"
                      onClick={() => removeGalleryImage(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ep2-gallery-empty">
                <span>🖼️</span>
                <p>ยังไม่มีรูปภาพ · No gallery photos yet</p>
                <p>คลิก "+ เพิ่มรูป" เพื่ออัปโหลด · Click "+ เพิ่มรูป" to upload</p>
              </div>
            )}
          </div>

          {/* ACTION FOOTER */}
          <ActionBar>
            <CancelButton href="/business/dashboard" label="ยกเลิก · Discard" />
            <SaveButton label="💾 บันทึกข้อมูลสถานที่ · Save Place" />
          </ActionBar>

        </form>
      </div>

      <style jsx>{`
        .ep2-page {
          min-height: 100vh;
          background: var(--pl-bg, #f8fafc);
          padding: 36px 20px 80px;
        }
        .ep2-container {
          max-width: 1180px;
          margin: auto;
        }
        .ep2-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 12px;
        }

        /* Cover */
        .ep2-cover-upload {
          display: block;
          width: 100%;
          height: 400px;
          border-radius: 24px;
          overflow: hidden;
          background: transparent;
          border: 2px dashed var(--pl-border, #dbe4ee);
          cursor: pointer;
          position: relative;
          transition: border-color 0.2s;
        }
        .ep2-cover-upload:hover { border-color: var(--pl-blue, #4facfe); }
        .ep2-cover-img { width: 100%; height: 100%; object-fit: cover; }
        .ep2-cover-placeholder {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          justify-content: center; align-items: center;
          gap: 10px; color: #64748b;
        }
        .ep2-cover-placeholder span { font-size: 56px; }
        .ep2-cover-placeholder h3 { font-size: 18px; font-weight: 800; color: #334155; margin: 0; }
        .ep2-cover-placeholder p  { font-size: 13px; color: #94a3b8; margin: 0; }
        .ep2-cover-overlay {
          position: absolute; inset: 0;
          background: rgba(15,23,42,0.45);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: 0.2s;
        }
        .ep2-cover-upload:hover .ep2-cover-overlay { opacity: 1; }
        .ep2-cover-overlay span {
          color: white; font-size: 15px; font-weight: 800;
          background: rgba(0,0,0,0.4); padding: 10px 22px;
          border-radius: 999px; backdrop-filter: blur(6px);
        }

        /* Gallery */
        .ep2-add-photo-btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 10px 20px; border-radius: 14px;
          background: var(--pl-blue-dark, #2563eb); color: white;
          font-size: 13px; font-weight: 800; cursor: pointer;
          transition: 0.2s; white-space: nowrap; flex-shrink: 0;
        }
        .ep2-add-photo-btn:hover { background: #1d4ed8; transform: translateY(-1px); }

        .ep2-gallery-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .ep2-gallery-item {
          position: relative; height: 160px;
          border-radius: 16px; overflow: hidden;
        }
        .ep2-gallery-item img { width: 100%; height: 100%; object-fit: cover; }
        .ep2-gallery-del {
          position: absolute; top: 8px; right: 8px;
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(185,28,28,0.85); color: white;
          border: none; font-size: 11px; font-weight: 800;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: 0.2s;
        }
        .ep2-gallery-del:hover { background: #b91c1c; transform: scale(1.1); }

        .ep2-gallery-empty {
          text-align: center; padding: 50px 20px;
          color: #94a3b8; display: flex; flex-direction: column;
          align-items: center; gap: 8px;
        }
        .ep2-gallery-empty span { font-size: 48px; }
        .ep2-gallery-empty p { margin: 0; font-size: 14px; }

        @media (max-width: 768px) {
          .ep2-cover-upload { height: 240px; }
          .ep2-gallery-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}

/*
 * app/business/edit-profile/page.tsx
 * ✅ โหลดข้อมูลจริงจาก /api/business/me
 * ✅ บันทึกผ่าน PUT /api/business/me
 */
"use client";

import { useState, useEffect } from "react";
import PageLoading from "@/components/ui/PageLoading";
import InputField from "@/components/ui/InputField";
import {
  BackButton,
  CancelButton,
  SaveButton,
  ActionBar,
  PageTag,
} from "@/components/ui/ActionButtons";
import { PROVINCES, getDistricts } from "@/data/thailand";

import "@/components/ui/form-card.css";
import "@/components/ui/action-buttons.css";

/* ── Category options ── */
const CATEGORIES = [
  { id: "adventure",  emoji: "🧗", label: "Adventure"    },
  { id: "nature",     emoji: "🌿", label: "Nature"       },
  { id: "cafe",       emoji: "☕", label: "Café"         },
  { id: "culture",    emoji: "🏛️", label: "Culture"      },
  { id: "hiking",     emoji: "⛰️", label: "Hiking"       },
  { id: "sea",        emoji: "🌊", label: "Sea & Island" },
  { id: "food",       emoji: "🍲", label: "Local Food"   },
  { id: "stay",       emoji: "🏨", label: "Accommodation"},
  { id: "photo",      emoji: "📸", label: "Photography"  },
  { id: "camping",    emoji: "⛺", label: "Camping"      },
  { id: "slowlife",   emoji: "🌸", label: "Slow Life"    },
  { id: "community",  emoji: "🏘️", label: "Community"    },
];

export default function EditBusinessProfilePage() {

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving,  setIsSaving ] = useState(false);
  const [saveMsg,   setSaveMsg  ] = useState("");

  /* ── Profile fields ── */
  const [businessName, setBusinessName] = useState("");
  const [contactName,  setContactName ] = useState("");
  const [email,        setEmail       ] = useState("");
  const [phone,        setPhone       ] = useState("");
  const [website,      setWebsite     ] = useState("");
  const [province,     setProvince    ] = useState("");
  const [district,     setDistrict    ] = useState("");
  const [country,      setCountry     ] = useState("Thailand");
  const [description,  setDescription ] = useState("");

  /* ── Derived districts ── */
  const districts = province ? getDistricts(province) : [];

  /* ── Categories ── */
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const toggleCat = (id: string) =>
    setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  /* ── Social ── */
  const [facebook,  setFacebook ] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok,    setTiktok   ] = useState("");
  const [lineId,    setLineId   ] = useState("");

  /* ── Images ── */
  const [coverImage, setCoverImage] = useState("");
  const [logoImage,  setLogoImage ] = useState("");

  /* ── Password ── */
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw    ] = useState("");
  const [pwError,   setPwError  ] = useState("");

  /* ── Phone filter — digits only ── */
  const handlePhone = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const raw = (e.target as HTMLInputElement).value;
    setPhone(raw.replace(/[^0-9+\-() ]/g, ""));
  };

  /* ── Province change — reset district ── */
  const handleProvince = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProvince(e.target.value);
    setDistrict("");
  };

  /* ── โหลดข้อมูลจริง ── */
  useEffect(() => {
    fetch("/api/business/me")
      .then(r => r.json())
      .then(data => {
        if (data.business) {
          const b = data.business;
          setBusinessName(b.businessName ?? "");
          setContactName(b.contactName  ?? "");
          setEmail(b.email              ?? "");
          setPhone(b.phone              ?? "");
          setWebsite(b.website          ?? "");
          setProvince(b.province        ?? "");
          setDistrict(b.district        ?? "");
          setCountry(b.country          ?? "Thailand");
          setDescription(b.description  ?? "");
          setFacebook(b.facebook        ?? "");
          setInstagram(b.instagram      ?? "");
          setTiktok(b.tiktok            ?? "");
          setLineId(b.lineId            ?? "");
          setCoverImage(b.coverUrl      ?? "");
          setLogoImage(b.logoUrl        ?? "");
          setSelectedCats(b.categories  ?? []);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  /* ── Image upload helpers ── */
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("รูปปกต้องไม่เกิน 5MB"); return; }
    setCoverImage(URL.createObjectURL(file));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert("โลโก้ต้องไม่เกิน 3MB"); return; }
    setLogoImage(URL.createObjectURL(file));
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setSaveMsg("");

    // Only validate password section if the user is filling it in
    const isChangingPw = !!(currentPw || newPw);
    if (isChangingPw) {
      if (!currentPw) { setPwError("กรุณากรอกรหัสผ่านปัจจุบัน"); return; }
      if (!newPw || newPw.length < 8) { setPwError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร"); return; }
      if (!/[a-zA-Z]/.test(newPw)) { setPwError("รหัสผ่านใหม่ต้องมีตัวอักษรอย่างน้อย 1 ตัว"); return; }
      if (!/[0-9]/.test(newPw)) { setPwError("รหัสผ่านใหม่ต้องมีตัวเลขอย่างน้อย 1 ตัว"); return; }
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/business/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName, contactName, email, phone, website,
          province, district, country, description,
          facebook, instagram, tiktok, lineId,
          categories: selectedCats,
          ...(isChangingPw ? { currentPw, newPw } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.message || "เกิดข้อผิดพลาด");
      } else {
        setSaveMsg("✓ บันทึกเรียบร้อยแล้ว · Saved successfully!");
        setCurrentPw(""); setNewPw("");
      }
    } catch {
      setPwError("ไม่สามารถเชื่อมต่อได้");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <PageLoading text="กำลังโหลดข้อมูลโปรไฟล์..." />;

  /* ── Render ── */
  return (
    <div className="ep-page">
      <div className="ep-container">

        {/* ─── TOP BAR ─── */}
        <div className="ep-topbar">
          <BackButton href="/business/dashboard" label="Dashboard" labelTh="กลับแดชบอร์ด" />
          <PageTag label="BUSINESS PROFILE" />
        </div>

        {saveMsg && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "14px 20px", marginBottom: "20px", color: "#15803d", fontWeight: 700 }}>
            {saveMsg}
          </div>
        )}

        {/* ─── HERO ─── */}
        <div className="ep-hero">
          <div className="ep-cover-wrap">
            {coverImage
              ? <img src={coverImage} alt="cover" className="ep-cover-img" />
              : <div className="ep-cover-placeholder">🏢 ยังไม่มีรูปปก</div>
            }
            <div className="ep-cover-overlay" />
            <label className="ep-change-cover-btn">
              เปลี่ยนภาพปก · Change cover
              <input hidden type="file" accept="image/*" onChange={handleCoverUpload} />
            </label>
          </div>

          <div className="ep-hero-content">
            <div className="ep-profile-main">
              <div className="ep-logo-wrap">
                {logoImage
                  ? <img src={logoImage} alt="logo" className="ep-logo-img" />
                  : <div className="ep-logo-placeholder">🏢</div>
                }
                <label className="ep-logo-edit-btn" title="เปลี่ยนโลโก้">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  <input hidden type="file" accept="image/*" onChange={handleLogoUpload} />
                </label>
              </div>
              <div className="ep-profile-text">
                <h1>{businessName || "ชื่อธุรกิจ"}</h1>
                <p>จัดการข้อมูลธุรกิจ รูปภาพ รายละเอียด และความปลอดภัยของบัญชี</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── FORM ─── */}
        <form onSubmit={handleSubmit}>

          {/* Section 1 — Business Information */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>ข้อมูลธุรกิจ <span className="ui-en-tag">Business Information</span></h2>
                <p>รายละเอียดหลักของธุรกิจที่นักท่องเที่ยวจะเห็น · Core details visible to travelers</p>
              </div>
            </div>
            <div className="ui-form-grid">
              <div className="ui-field">
                <label>ชื่อธุรกิจ <span className="en">Business name</span></label>
                <input className="ui-input" type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} />
              </div>
              <div className="ui-field">
                <label>ชื่อผู้ติดต่อ <span className="en">Contact name</span></label>
                <input className="ui-input" type="text" value={contactName} onChange={e => setContactName(e.target.value)} />
              </div>
              <div className="ui-field">
                <label>อีเมลธุรกิจ <span className="en">Business email</span></label>
                <input className="ui-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="ui-field">
                <label>เบอร์โทร <span className="en">Phone</span></label>
                <input className="ui-input" type="tel" inputMode="numeric" value={phone}
                  onChange={handlePhone} placeholder="เช่น 081-234-5678" pattern="[0-9+\-() ]*" />
              </div>
              <div className="ui-field col-full">
                <label>เว็บไซต์ <span className="en">Website</span></label>
                <input className="ui-input" type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." />
              </div>

              {/* Province dropdown */}
              <div className="ui-field">
                <label>จังหวัด <span className="en">Province</span></label>
                <select className="ui-input" value={province} onChange={handleProvince}>
                  <option value="">— เลือกจังหวัด —</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* District dropdown */}
              <div className="ui-field">
                <label>อำเภอ / เขต <span className="en">District</span></label>
                <select className="ui-input" value={district} onChange={e => setDistrict(e.target.value)} disabled={!province}>
                  <option value="">— เลือกอำเภอ —</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {!province && <span style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, display: "block" }}>เลือกจังหวัดก่อน</span>}
              </div>

              <div className="ui-field col-full">
                <label>รายละเอียดธุรกิจ <span className="en">Description</span></label>
                <textarea className="ui-input textarea" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section 2 — Categories */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>หมวดหมู่ธุรกิจ <span className="ui-en-tag">Business Categories</span></h2>
                <p>เลือกประเภทที่ตรงกับธุรกิจของคุณ · Pick all that apply</p>
              </div>
            </div>
            <div className="ui-chip-grid">
              {CATEGORIES.map(cat => (
                <label key={cat.id} className={`ui-chip ${selectedCats.includes(cat.id) ? "active" : ""}`}>
                  <input type="checkbox" checked={selectedCats.includes(cat.id)} onChange={() => toggleCat(cat.id)} />
                  {cat.emoji} {cat.label}
                </label>
              ))}
            </div>
          </div>

          {/* Section 3 — Social Media */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>โซเชียลมีเดีย <span className="ui-en-tag">Social Media</span></h2>
                <p>ลิงก์โซเชียลของธุรกิจ · Your business social links</p>
              </div>
            </div>
            <div className="ui-form-grid">
              <div className="ui-field">
                <label>Line ID</label>
                <div className="ui-social-row">
                  <span className="ui-social-icon">💬</span>
                  <input className="ui-input" type="text" value={lineId} onChange={e => setLineId(e.target.value)} placeholder="@yourline" />
                </div>
              </div>
              <div className="ui-field">
                <label>Facebook</label>
                <div className="ui-social-row">
                  <span className="ui-social-icon">📘</span>
                  <input className="ui-input" type="url" value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="https://facebook.com/..." />
                </div>
              </div>
              <div className="ui-field">
                <label>Instagram</label>
                <div className="ui-social-row">
                  <span className="ui-social-icon">📸</span>
                  <input className="ui-input" type="url" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/..." />
                </div>
              </div>
              <div className="ui-field">
                <label>TikTok</label>
                <div className="ui-social-row">
                  <span className="ui-social-icon">🎵</span>
                  <input className="ui-input" type="url" value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="https://tiktok.com/@..." />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 — Security */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>ความปลอดภัย <span className="ui-en-tag">Security</span></h2>
                <p>เปลี่ยนรหัสผ่านเฉพาะเมื่อต้องการ · Leave blank to keep current password</p>
              </div>
            </div>
            <div className="ui-password-box">
              <h3>🔒 เปลี่ยนรหัสผ่าน · Change Password</h3>
              <p>กรอกเฉพาะเมื่อต้องการเปลี่ยนรหัสผ่าน · Only fill in if you want to change your password</p>
              <div className="ui-password-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div>
                  <InputField label="รหัสผ่านปัจจุบัน" labelEn="Current password" type="password" value={currentPw} onChange={e => setCurrentPw((e.target as HTMLInputElement).value)} />
                </div>
                <div>
                  <InputField label="รหัสผ่านใหม่" labelEn="New password (min 8 chars)" type="password" value={newPw} onChange={e => setNewPw((e.target as HTMLInputElement).value)} />
                </div>
              </div>
              {pwError && <p className="ui-password-note">⚠️ {pwError}</p>}
            </div>
          </div>

          {/* ─── ACTION FOOTER ─── */}
          <ActionBar>
            <CancelButton href="/business/dashboard" label="ยกเลิก · Discard" />
            <SaveButton label="บันทึกข้อมูล · Save Changes" loading={isSaving} />
          </ActionBar>

        </form>
      </div>

      <style jsx>{`
        .ep-page { min-height: 100vh; background: var(--pl-bg, #f8fafc); padding: 36px 20px 80px; }
        .ep-container { max-width: 1180px; margin: auto; }
        .ep-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
        .ep-hero { border-radius: 36px; overflow: hidden; background: var(--pl-white, #fff); border: 1px solid #edf2f7; box-shadow: 0 20px 50px rgba(15,23,42,0.05); margin-bottom: 28px; }
        .ep-cover-wrap { position: relative; height: 280px; overflow: hidden; background: #e2e8f0; }
        .ep-cover-img { width: 100%; height: 100%; object-fit: cover; }
        .ep-cover-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 48px; color: #94a3b8; }
        .ep-cover-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,23,42,0.70), rgba(15,23,42,0.15)); }
        .ep-change-cover-btn { position: absolute; right: 22px; top: 22px; background: rgba(255,255,255,0.93); color: #0f172a; padding: 10px 18px; border-radius: 999px; font-size: 13px; font-weight: 700; cursor: pointer; backdrop-filter: blur(8px); }
        .ep-hero-content { position: relative; padding: 0 40px 36px; margin-top: -72px; z-index: 5; }
        .ep-profile-main { display: flex; align-items: flex-end; gap: 22px; flex-wrap: wrap; }
        .ep-logo-wrap { position: relative; flex-shrink: 0; }
        .ep-logo-img { width: 130px; height: 130px; border-radius: 28px; object-fit: cover; border: 5px solid white; box-shadow: 0 8px 24px rgba(15,23,42,0.12); background: white; }
        .ep-logo-placeholder { width: 130px; height: 130px; border-radius: 28px; border: 5px solid white; box-shadow: 0 8px 24px rgba(15,23,42,0.12); background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 48px; }
        .ep-logo-edit-btn { position: absolute; bottom: 8px; right: 8px; width: 36px; height: 36px; border-radius: 50%; background: #2563eb; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(37,99,235,0.35); }
        .ep-profile-text h1 { font-size: 32px; font-weight: 900; color: #0f172a; margin-bottom: 6px; }
        .ep-profile-text p { color: #64748b; font-size: 14px; }
        @media (max-width: 768px) { .ep-hero-content { padding: 0 22px 28px; margin-top: -60px; } .ep-cover-wrap { height: 200px; } .ep-logo-img, .ep-logo-placeholder { width: 100px; height: 100px; } .ep-profile-text h1 { font-size: 24px; } }
      `}</style>
    </div>
  );
}

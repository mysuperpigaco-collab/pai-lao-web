/*
 * ============================================================
 *  app/business/edit-profile/page.tsx
 *  ใช้ design system ใหม่ทั้งหมด — ไม่มี inline style
 * ============================================================
 */
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

/* ── Category options ── */
const CATEGORIES = [
  { id: "adventure",  emoji: "🧗", label: "Adventure"  },
  { id: "nature",     emoji: "🌿", label: "Nature"     },
  { id: "cafe",       emoji: "☕", label: "Café"       },
  { id: "culture",    emoji: "🏛️", label: "Culture"    },
  { id: "hiking",     emoji: "⛰️", label: "Hiking"     },
  { id: "sea",        emoji: "🌊", label: "Sea & Island"},
  { id: "food",       emoji: "🍲", label: "Local Food" },
  { id: "stay",       emoji: "🏨", label: "Accommodation"},
  { id: "photo",      emoji: "📸", label: "Photography"},
  { id: "camping",    emoji: "⛺", label: "Camping"    },
  { id: "slowlife",   emoji: "🌸", label: "Slow Life"  },
  { id: "community",  emoji: "🏘️", label: "Community"  },
];

/* ── Password strength ── */
function getStrength(pw: string): {
  level: "weak" | "fair" | "good" | "strong";
  label: string;
} {
  if (pw.length === 0) return { level: "weak", label: "" };
  if (pw.length < 6)   return { level: "weak",   label: "อ่อนมาก · Weak"   };
  if (pw.length < 8)   return { level: "fair",   label: "พอใช้ · Fair"     };
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw))
                       return { level: "strong", label: "แข็งแกร่ง · Strong"};
  return               { level: "good",   label: "ดี · Good"              };
}

export default function EditBusinessProfilePage() {

  /* ── Profile fields ── */
  const [businessName, setBusinessName] = useState("Pai-Lao Adventure");
  const [contactName,  setContactName ] = useState("สมชาย ใจดี");
  const [email,        setEmail       ] = useState("contact@pailao.com");
  const [phone,        setPhone       ] = useState("+66 81 234 5678");
  const [website,      setWebsite     ] = useState("https://pailao.com");
  const [province,     setProvince    ] = useState("Bangkok");
  const [country,      setCountry     ] = useState("Thailand");
  const [description,  setDescription ] = useState(
    "ผู้ให้บริการด้านการท่องเที่ยวและกิจกรรมท้องถิ่น ที่เน้นประสบการณ์จริง"
  );

  /* ── Categories ── */
  const [selectedCats, setSelectedCats] = useState<string[]>(["nature", "adventure"]);
  const toggleCat = (id: string) =>
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

  /* ── Social ── */
  const [facebook,   setFacebook  ] = useState("");
  const [instagram,  setInstagram ] = useState("");
  const [tiktok,     setTiktok    ] = useState("");

  /* ── Images ── */
  const [coverImage, setCoverImage] = useState(
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600"
  );
  const [logoImage, setLogoImage] = useState(
    "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?q=80&w=400"
  );

  /* ── Password ── */
  const [currentPw,  setCurrentPw ] = useState("");
  const [newPw,      setNewPw     ] = useState("");
  const [confirmPw,  setConfirmPw ] = useState("");
  const [pwError,    setPwError   ] = useState("");

  const strength  = getStrength(newPw);
  const pwMatch   = newPw.length > 0 && newPw === confirmPw;
  const pwNoMatch = confirmPw.length > 0 && newPw !== confirmPw;

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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");

    const isChangingPw = currentPw || newPw || confirmPw;
    if (isChangingPw) {
      if (!currentPw || !newPw || !confirmPw) {
        setPwError("กรุณากรอกรหัสผ่านให้ครบทุกช่อง"); return;
      }
      if (newPw.length < 8) {
        setPwError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร"); return;
      }
      if (newPw !== confirmPw) {
        setPwError("รหัสผ่านไม่ตรงกัน / Passwords don't match"); return;
      }
    }
    alert("บันทึกเรียบร้อย / Saved successfully!");
  };

  /* ── Render ── */
  return (
    <div className="ep-page">
      <div className="ep-container">

        {/* ─── TOP BAR ─── */}
        <div className="ep-topbar">
          <BackButton href="/business/dashboard" label="Dashboard" labelTh="กลับแดชบอร์ด" />
          <PageTag label="BUSINESS PROFILE" />
        </div>

        {/* ─── HERO ─── */}
        <div className="ep-hero">

          {/* Cover */}
          <div className="ep-cover-wrap">
            <img src={coverImage} alt="cover" className="ep-cover-img" />
            <div className="ep-cover-overlay" />
            <label className="ep-change-cover-btn">
              เปลี่ยนภาพปก · Change cover
              <input hidden type="file" accept="image/*" onChange={handleCoverUpload} />
            </label>
          </div>

          {/* Logo + name + badges */}
          <div className="ep-hero-content">
            <div className="ep-profile-main">

              {/* Logo */}
              <div className="ep-logo-wrap">
                <img src={logoImage} alt="logo" className="ep-logo-img" />
                <label className="ep-logo-edit-btn" title="เปลี่ยนโลโก้">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  <input hidden type="file" accept="image/*" onChange={handleLogoUpload} />
                </label>
              </div>

              {/* Text */}
              <div className="ep-profile-text">
                <h1>{businessName}</h1>
                <p>จัดการข้อมูลธุรกิจ รูปภาพ รายละเอียด และความปลอดภัยของบัญชี</p>
                <div className="ep-badges">
                  <span className="ep-badge">✓ Verified Business</span>
                  <span className="ep-badge">🤝 Tourism Partner</span>
                </div>
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
                <input className="ui-input" type="text" value={businessName}
                  onChange={e => setBusinessName(e.target.value)} />
              </div>

              <div className="ui-field">
                <label>ชื่อผู้ติดต่อ <span className="en">Contact name</span></label>
                <input className="ui-input" type="text" value={contactName}
                  onChange={e => setContactName(e.target.value)} />
              </div>

              <div className="ui-field">
                <label>อีเมล <span className="en">Email</span></label>
                <input className="ui-input" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} />
              </div>

              <div className="ui-field">
                <label>เบอร์โทร <span className="en">Phone</span></label>
                <input className="ui-input" type="tel" value={phone}
                  onChange={e => setPhone(e.target.value)} />
              </div>

              <div className="ui-field col-full">
                <label>เว็บไซต์ <span className="en">Website</span></label>
                <input className="ui-input" type="url" value={website}
                  onChange={e => setWebsite(e.target.value)} placeholder="https://..." />
              </div>

              <div className="ui-field">
                <label>จังหวัด <span className="en">Province</span></label>
                <input className="ui-input" type="text" value={province}
                  onChange={e => setProvince(e.target.value)} />
              </div>

              <div className="ui-field">
                <label>ประเทศ <span className="en">Country</span></label>
                <input className="ui-input" type="text" value={country}
                  onChange={e => setCountry(e.target.value)} />
              </div>

              <div className="ui-field col-full">
                <label>รายละเอียดธุรกิจ <span className="en">Description</span></label>
                <textarea className="ui-input textarea" value={description}
                  onChange={e => setDescription(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section 2 — Business Categories */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>หมวดหมู่ธุรกิจ <span className="ui-en-tag">Business Categories</span></h2>
                <p>เลือกประเภทที่ตรงกับธุรกิจของคุณ · Pick all that apply</p>
              </div>
            </div>

            <div className="ui-chip-grid">
              {CATEGORIES.map(cat => (
                <label
                  key={cat.id}
                  className={`ui-chip ${selectedCats.includes(cat.id) ? "active" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCats.includes(cat.id)}
                    onChange={() => toggleCat(cat.id)}
                  />
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
                <label>Facebook</label>
                <div className="ui-social-row">
                  <span className="ui-social-icon">📘</span>
                  <input className="ui-input" type="url" value={facebook}
                    onChange={e => setFacebook(e.target.value)}
                    placeholder="https://facebook.com/..." />
                </div>
              </div>

              <div className="ui-field">
                <label>Instagram</label>
                <div className="ui-social-row">
                  <span className="ui-social-icon">📸</span>
                  <input className="ui-input" type="url" value={instagram}
                    onChange={e => setInstagram(e.target.value)}
                    placeholder="https://instagram.com/..." />
                </div>
              </div>

              <div className="ui-field">
                <label>TikTok</label>
                <div className="ui-social-row">
                  <span className="ui-social-icon">🎵</span>
                  <input className="ui-input" type="url" value={tiktok}
                    onChange={e => setTiktok(e.target.value)}
                    placeholder="https://tiktok.com/@..." />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 — Security / Password */}
          <div className="ui-section-card">
            <div className="ui-section-hdr">
              <div>
                <h2>ความปลอดภัย <span className="ui-en-tag">Security</span></h2>
                <p>เปลี่ยนรหัสผ่านเฉพาะเมื่อต้องการ · Leave blank to keep current password</p>
              </div>
            </div>

            <div className="ui-password-box">
              <h3>🔒 เปลี่ยนรหัสผ่าน · Change Password</h3>
              <p>หากไม่ต้องการเปลี่ยน ให้เว้นว่างไว้ · Leave blank if not changing</p>

              <div className="ui-password-grid">
                <div className="ui-field">
                  <label>รหัสผ่านปัจจุบัน <span className="en">Current password</span></label>
                  <input className="ui-input" type="password" value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)} />
                </div>

                <div className="ui-field">
                  <label>รหัสผ่านใหม่ <span className="en">New password</span></label>
                  <input className="ui-input" type="password" value={newPw}
                    onChange={e => setNewPw(e.target.value)} />
                  {newPw.length > 0 && (
                    <>
                      <div className="ui-strength-bar">
                        <div className={`ui-strength-fill ${strength.level}`} />
                      </div>
                      <span className="ui-strength-label" style={{
                        color: strength.level === "strong" ? "var(--pl-green-deep)"
                             : strength.level === "good"   ? "#22c55e"
                             : strength.level === "fair"   ? "#f59e0b" : "#ef4444"
                      }}>
                        {strength.label}
                      </span>
                    </>
                  )}
                </div>

                <div className="ui-field">
                  <label>ยืนยันรหัสผ่าน <span className="en">Confirm password</span></label>
                  <input className="ui-input" type="password" value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)} />
                  {pwMatch   && <span className="ui-match-ok">✓ รหัสผ่านตรงกัน · Passwords match</span>}
                  {pwNoMatch && <span className="ui-match-err">✗ รหัสผ่านไม่ตรงกัน · Doesn't match</span>}
                </div>
              </div>

              {pwError && <p className="ui-password-note">⚠️ {pwError}</p>}
            </div>
          </div>

          {/* ─── ACTION FOOTER ─── */}
          <ActionBar>
            <CancelButton href="/business/dashboard" label="ยกเลิก · Discard" />
            <SaveButton label="บันทึกข้อมูล · Save Changes" />
          </ActionBar>

        </form>
      </div>

      <style jsx>{`
        /* Page */
        .ep-page {
          min-height: 100vh;
          background: var(--pl-bg, #f8fafc);
          padding: 36px 20px 80px;
        }
        .ep-container {
          max-width: 1180px;
          margin: auto;
        }

        /* Top bar */
        .ep-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 12px;
        }

        /* Hero */
        .ep-hero {
          border-radius: 36px;
          overflow: hidden;
          background: var(--pl-white, #fff);
          border: 1px solid #edf2f7;
          box-shadow: 0 20px 50px rgba(15,23,42,0.05);
          margin-bottom: 28px;
        }

        .ep-cover-wrap {
          position: relative;
          height: 300px;
          overflow: hidden;
        }

        .ep-cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ep-cover-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(15,23,42,0.70), rgba(15,23,42,0.15));
        }

        .ep-change-cover-btn {
          position: absolute;
          right: 22px;
          top: 22px;
          background: rgba(255,255,255,0.93);
          color: #0f172a;
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: 0.2s;
        }

        .ep-change-cover-btn:hover {
          background: white;
          transform: translateY(-1px);
        }

        .ep-hero-content {
          position: relative;
          padding: 0 40px 36px;
          margin-top: -72px;
          z-index: 5;
        }

        .ep-profile-main {
          display: flex;
          align-items: flex-end;
          gap: 22px;
          flex-wrap: wrap;
        }

        .ep-logo-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .ep-logo-img {
          width: 130px;
          height: 130px;
          border-radius: 28px;
          object-fit: cover;
          border: 5px solid white;
          box-shadow: 0 8px 24px rgba(15,23,42,0.12);
          background: white;
        }

        .ep-logo-edit-btn {
          position: absolute;
          bottom: 8px;
          right: 8px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #2563eb;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(37,99,235,0.35);
          transition: 0.2s;
        }

        .ep-logo-edit-btn:hover {
          background: #1d4ed8;
          transform: scale(1.1);
        }

        .ep-profile-text {
          padding-bottom: 4px;
        }

        .ep-profile-text h1 {
          font-size: 32px;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .ep-profile-text p {
          color: #64748b;
          font-size: 14px;
          line-height: 1.7;
        }

        .ep-badges {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          flex-wrap: wrap;
        }

        .ep-badge {
          padding: 6px 14px;
          border-radius: 999px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 12px;
          font-weight: 700;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .ep-hero-content { padding: 0 22px 28px; margin-top: -60px; }
          .ep-cover-wrap   { height: 200px; }
          .ep-logo-img     { width: 100px; height: 100px; border-radius: 22px; }
          .ep-profile-text h1 { font-size: 24px; }
        }
      `}</style>
    </div>
  );
}

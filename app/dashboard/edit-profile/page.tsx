/*
 * app/dashboard/edit-profile/page.tsx  (Traveler profile)
 * ✅ โหลดข้อมูลจริงจาก /api/auth/me
 * ✅ บันทึกผ่าน PUT /api/auth/me
 */
"use client";

import { useState, useEffect } from "react";
import InputField from "@/components/ui/InputField";
import SelectField from "@/components/ui/SelectField";
import BusinessSectionTitle from "@/components/business/BusinessSectionTitle";
import {
  BackButton,
  CancelButton,
  SaveButton,
  ActionBar,
  PageTag,
} from "@/components/ui/ActionButtons";

import "@/components/ui/form-card.css";
import "@/components/ui/action-buttons.css";

/* password strength */
function getStrength(pw: string) {
  if (!pw) return null;
  if (pw.length < 6)  return { level: "weak",   label: "อ่อนมาก · Weak",   color: "#ef4444", width: "25%" };
  if (pw.length < 8)  return { level: "fair",   label: "พอใช้ · Fair",     color: "#f59e0b", width: "50%" };
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw))
                      return { level: "strong", label: "แข็งแกร่ง · Strong", color: "#22a06b", width: "100%" };
  return              { level: "good",   label: "ดี · Good",             color: "#22c55e", width: "75%" };
}

export default function EditTravelerProfilePage() {

  const [isLoading,   setIsLoading  ] = useState(true);
  const [isSaving,    setIsSaving   ] = useState(false);
  const [saveMsg,     setSaveMsg    ] = useState("");

  /* Personal */
  const [firstName,   setFirstName  ] = useState("");
  const [lastName,    setLastName   ] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender,      setGender     ] = useState("");
  const [phone,       setPhone      ] = useState("");
  const [email,       setEmail      ] = useState("");
  const [bio,         setBio        ] = useState("");

  /* Business contacts */
  const [lineId,    setLineId   ] = useState("");
  const [facebook,  setFacebook ] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok,    setTiktok   ] = useState("");

  /* Security */
  const [newPw,      setNewPw     ] = useState("");
  const [confirmPw,  setConfirmPw ] = useState("");
  const [currentPw,  setCurrentPw ] = useState("");
  const [pwError,    setPwError   ] = useState("");

  const strength  = getStrength(newPw);
  const pwMatch   = newPw.length > 0 && newPw === confirmPw;
  const pwNoMatch = confirmPw.length > 0 && newPw !== confirmPw;

  // โหลดข้อมูลจริง
  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          const u = data.user;
          setFirstName(u.firstName   ?? "");
          setLastName(u.lastName     ?? "");
          setDisplayName(u.displayName ?? "");
          setGender((u.gender ?? "").toLowerCase());
          setPhone(u.phone           ?? "");
          setEmail(u.email           ?? "");
          setBio(u.bio               ?? "");
          setLineId(u.lineId         ?? "");
          setFacebook(u.facebook     ?? "");
          setInstagram(u.instagram   ?? "");
          setTiktok(u.tiktok         ?? "");
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setSaveMsg("");

    const isChanging = newPw || confirmPw || currentPw;
    if (isChanging) {
      if (!currentPw) { setPwError("กรุณากรอกรหัสผ่านปัจจุบัน"); return; }
      if (newPw.length < 8) { setPwError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร"); return; }
      if (newPw !== confirmPw) { setPwError("รหัสผ่านไม่ตรงกัน · Passwords don't match"); return; }
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName, lastName, displayName,
          gender: gender || null,
          phone, bio,
          lineId, facebook, instagram, tiktok,
          ...(isChanging ? { currentPw, newPw } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.message || "เกิดข้อผิดพลาด");
      } else {
        setSaveMsg("✓ บันทึกเรียบร้อยแล้ว · Saved successfully!");
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
      }
    } catch {
      setPwError("ไม่สามารถเชื่อมต่อได้");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#64748b" }}>กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="edp-page">
      <div className="edp-container">

        {/* TOP BAR */}
        <div className="edp-topbar">
          <BackButton href="/dashboard" label="Dashboard" labelTh="กลับแดชบอร์ด" />
          <PageTag label="MY PROFILE" />
        </div>

        {/* PAGE TITLE */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 900, color: "var(--pl-text-primary)", marginBottom: "6px" }}>
            แก้ไขโปรไฟล์
            <span style={{
              fontSize: "12px", fontWeight: 700,
              background: "var(--pl-blue-soft)", color: "var(--pl-blue-dark)",
              padding: "3px 10px", borderRadius: "6px", marginLeft: "12px", verticalAlign: "middle",
            }}>Edit Profile</span>
          </h1>
          <p style={{ color: "var(--pl-text-secondary)", fontSize: "15px", margin: 0 }}>
            จัดการข้อมูลปัจจุบันของคุณให้เป็นเวอร์ชันล่าสุด · Keep your info up to date
          </p>
        </div>

        {saveMsg && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "14px 20px", marginBottom: "20px", color: "#15803d", fontWeight: 700 }}>
            {saveMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ── SECTION 1: Personal Information ── */}
          <div className="ui-section-card">
            <div className="ui-form-grid">

              <BusinessSectionTitle
                title="ข้อมูลส่วนตัว"
                subtitle="Personal Information"
                description="ชื่อและข้อมูลที่แสดงในโปรไฟล์ · Your public profile details"
              />

              <InputField label="ชื่อจริง" labelEn="First name" required
                value={firstName} onChange={e => setFirstName(e.target.value)} />

              <InputField label="นามสกุล" labelEn="Last name" required
                value={lastName} onChange={e => setLastName(e.target.value)} />

              <InputField label="ชื่อที่ใช้แสดง" labelEn="Display name"
                value={displayName} onChange={e => setDisplayName(e.target.value)} />

              <SelectField
                label="เพศ" labelEn="Gender"
                value={gender}
                onChange={e => setGender(e.target.value)}
                options={[
                  { label: "-- ไม่ระบุ --",     value: ""       },
                  { label: "ชาย · Male",         value: "male"   },
                  { label: "หญิง · Female",      value: "female" },
                  { label: "อื่นๆ · Other",      value: "other"  },
                ]}
              />

              <InputField label="เบอร์โทรศัพท์" labelEn="Phone" type="tel"
                value={phone} onChange={e => setPhone(e.target.value)} />

              <div className="col-full">
                <InputField label="อีเมล" labelEn="Email address" type="email"
                  value={email} onChange={() => {}} disabled />
              </div>

              <div className="col-full">
                <div className="ui-field">
                  <label>แนะนำตัว <span className="en">Bio</span></label>
                  <textarea className="ui-input textarea" rows={3}
                    placeholder="เล่าเรื่องราวเกี่ยวกับตัวคุณ..."
                    value={bio} onChange={e => setBio(e.target.value)} />
                </div>
              </div>

            </div>
          </div>

          {/* ── SECTION 2: Social & Contacts ── */}
          <div className="ui-section-card">
            <div className="ui-form-grid">

              <BusinessSectionTitle
                title="โซเชียลมีเดีย"
                subtitle="Social Media"
                description="ช่องทางที่คนอื่นจะติดต่อหรือติดตามคุณ · Your social links"
              />

              <InputField label="ไลน์ไอดี" labelEn="Line ID"
                value={lineId} onChange={e => setLineId(e.target.value)} placeholder="@yourline" />

              <InputField label="เฟซบุ๊ก" labelEn="Facebook"
                value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="ชื่อเพจ หรือ URL" />

              <InputField label="อินสตาแกรม" labelEn="Instagram"
                value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@username" />

              <InputField label="ติ๊กต็อก" labelEn="TikTok"
                value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="@username" />

            </div>
          </div>

          {/* ── SECTION 3: Security ── */}
          <div className="ui-section-card">
            <div className="ui-form-grid">

              <BusinessSectionTitle
                title="ความปลอดภัยบัญชี"
                subtitle="Account Security"
                description="เปลี่ยนรหัสผ่านเฉพาะเมื่อต้องการ · Leave blank to keep current password"
              />

              <div className="ui-field">
                <label>รหัสผ่านใหม่ <span className="en">New password</span></label>
                <input className="ui-input" type="password"
                  placeholder="ปล่อยว่างหากไม่ต้องการเปลี่ยน"
                  value={newPw} onChange={e => setNewPw(e.target.value)} />
                {strength && (
                  <>
                    <div style={{ height: "4px", borderRadius: "999px", background: "#e2e8f0", marginTop: "8px", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "999px", background: strength.color, width: strength.width, transition: "width 0.3s" }} />
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: strength.color, marginTop: "4px" }}>
                      {strength.label}
                    </span>
                  </>
                )}
              </div>

              <div className="ui-field">
                <label>ยืนยันรหัสผ่านใหม่ <span className="en">Confirm new password</span></label>
                <input className="ui-input" type="password"
                  placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง"
                  value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                {pwMatch   && <span style={{ fontSize: "12px", color: "#22a06b", marginTop: "4px" }}>✓ รหัสผ่านตรงกัน · Passwords match</span>}
                {pwNoMatch && <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>✗ รหัสผ่านไม่ตรงกัน · Doesn't match</span>}
              </div>

              <div className="col-full">
                <div className="ui-password-box">
                  <h3>🔒 ยืนยันตัวตน · Confirm identity</h3>
                  <p>กรอกรหัสผ่านปัจจุบันเพื่อบันทึกการเปลี่ยนแปลง · Required to save any changes</p>
                  <div className="ui-password-grid" style={{ gridTemplateColumns: "1fr" }}>
                    <div className="ui-field">
                      <label>รหัสผ่านปัจจุบัน <span className="en">Current password</span> <span className="req">*</span></label>
                      <input className="ui-input" type="password"
                        placeholder="Current password"
                        value={currentPw} onChange={e => setCurrentPw(e.target.value)} />
                    </div>
                  </div>
                  {pwError && <p className="ui-password-note">⚠️ {pwError}</p>}
                </div>
              </div>

            </div>
          </div>

          {/* ── ACTION FOOTER ── */}
          <ActionBar>
            <CancelButton href="/dashboard" label="ยกเลิก · Discard" />
            <SaveButton label="บันทึกการเปลี่ยนแปลง · Save changes" loading={isSaving} />
          </ActionBar>

        </form>
      </div>

      <style jsx>{`
        .edp-page {
          min-height: 100vh;
          background: var(--pl-bg, #f8fafc);
          padding: 32px 20px 80px;
        }
        .edp-container {
          max-width: 920px;
          margin: auto;
        }
        .edp-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 12px;
        }
        textarea.ui-input { resize: vertical; }
        @media (max-width: 640px) {
          .edp-topbar { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}

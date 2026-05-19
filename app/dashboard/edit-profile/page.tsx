/*
 * app/dashboard/edit-profile/page.tsx  (Traveler profile)
 * โหลดข้อมูลจริงจาก /api/auth/me + บันทึกผ่าน PUT /api/auth/me
 */
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import InputField from "@/components/ui/InputField";
import SelectField from "@/components/ui/SelectField";
import BusinessSectionTitle from "@/components/business/BusinessSectionTitle";
import { uploadFile } from "@/lib/uploadHelper";
import {
  BackButton, CancelButton, SaveButton, ActionBar, PageTag,
} from "@/components/ui/ActionButtons";
import "@/components/ui/form-card.css";
import "@/components/ui/action-buttons.css";

function getStrength(pw: string) {
  if (!pw) return null;
  if (pw.length < 6)  return { label: "อ่อนมาก · Weak",    color: "#ef4444", width: "25%" };
  if (pw.length < 8)  return { label: "พอใช้ · Fair",       color: "#f59e0b", width: "50%" };
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw))
                      return { label: "แข็งแกร่ง · Strong", color: "#22a06b", width: "100%" };
  return              { label: "ดี · Good",               color: "#22c55e", width: "75%" };
}

const IconCamera = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

export default function EditTravelerProfilePage() {
  const { refresh } = useAuth();
  const [isLoading,        setIsLoading       ] = useState(true);
  const [isSaving,         setIsSaving        ] = useState(false);
  const [saveMsg,          setSaveMsg         ] = useState("");
  const [firstName,        setFirstName       ] = useState("");
  const [lastName,         setLastName        ] = useState("");
  const [displayName,      setDisplayName     ] = useState("");
  const [gender,           setGender          ] = useState("");
  const [phone,            setPhone           ] = useState("");
  const [email,            setEmail           ] = useState("");
  const [bio,              setBio             ] = useState("");
  const [lineId,           setLineId          ] = useState("");
  const [facebook,         setFacebook        ] = useState("");
  const [instagram,        setInstagram       ] = useState("");
  const [tiktok,           setTiktok          ] = useState("");
  const [newPw,            setNewPw           ] = useState("");
  const [confirmPw,        setConfirmPw       ] = useState("");
  const [currentPw,        setCurrentPw       ] = useState("");
  const [pwError,          setPwError         ] = useState("");
  // Image state
  const [avatarUrl,        setAvatarUrl       ] = useState("");
  const [coverUrl,         setCoverUrl        ] = useState("");
  const [uploadingAvatar,  setUploadingAvatar ] = useState(false);
  const [uploadingCover,   setUploadingCover  ] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef  = useRef<HTMLInputElement>(null);

  const strength  = getStrength(newPw);
  const pwMatch   = newPw.length > 0 && newPw === confirmPw;
  const pwNoMatch = confirmPw.length > 0 && newPw !== confirmPw;

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(data => {
      if (data.user) {
        const u = data.user;
        setFirstName(u.firstName ?? "");
        setLastName(u.lastName ?? "");
        setDisplayName(u.displayName ?? "");
        setGender((u.gender ?? "").toLowerCase());
        setPhone(u.phone ?? "");
        setEmail(u.email ?? "");
        setBio(u.bio ?? "");
        setLineId(u.lineId ?? "");
        setFacebook(u.facebook ?? "");
        setInstagram(u.instagram ?? "");
        setTiktok(u.tiktok ?? "");
        setAvatarUrl(u.avatarUrl ?? "");
        setCoverUrl(u.coverUrl ?? "");
      }
    }).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  // ── Upload handlers ───────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("รูปต้องไม่เกิน 5MB"); return; }
    setUploadingAvatar(true);
    try {
      const url = await uploadFile(file, "avatars");
      setAvatarUrl(url);
      // Auto-save avatar immediately
      await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      await refresh();
    } catch { alert("อัปโหลดรูปโปรไฟล์ไม่สำเร็จ"); }
    finally { setUploadingAvatar(false); }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { alert("รูปต้องไม่เกิน 8MB"); return; }
    setUploadingCover(true);
    try {
      const url = await uploadFile(file, "covers");
      setCoverUrl(url);
      // Auto-save cover immediately
      await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverUrl: url }),
      });
      await refresh();
    } catch { alert("อัปโหลดรูปปกไม่สำเร็จ"); }
    finally { setUploadingCover(false); }
  };

  // ── Main form submit ──────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(""); setSaveMsg("");
    const isChanging = newPw || confirmPw || currentPw;
    if (isChanging) {
      if (!currentPw) { setPwError("กรุณากรอกรหัสผ่านปัจจุบัน"); return; }
      if (newPw.length < 8) { setPwError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร"); return; }
      if (newPw !== confirmPw) { setPwError("รหัสผ่านไม่ตรงกัน"); return; }
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName, lastName, displayName,
          gender: gender || null, phone, bio,
          lineId, facebook, instagram, tiktok,
          avatarUrl, coverUrl,
          ...(isChanging ? { currentPw, newPw } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) setPwError(data.message || "เกิดข้อผิดพลาด");
      else { setSaveMsg("✓ บันทึกเรียบร้อยแล้ว"); setCurrentPw(""); setNewPw(""); setConfirmPw(""); await refresh(); }
    } catch { setPwError("ไม่สามารถเชื่อมต่อได้"); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#64748b" }}>กำลังโหลด...</p>
    </div>
  );

  // ── Profile completeness ──────────────────────────────────────
  const checks = [
    { label: "ชื่อจริง · First name",   done: !!firstName },
    { label: "รูปโปรไฟล์ · Avatar",     done: !!avatarUrl },
    { label: "เบอร์โทร · Phone",         done: !!phone },
    { label: "แนะนำตัว · Bio",           done: !!bio },
    { label: "โซเชียลมีเดีย · Social",  done: !!(lineId || facebook || instagram || tiktok) },
  ];
  const pct   = Math.round((checks.filter(c => c.done).length / checks.length) * 100);
  const color = pct === 100 ? "#22a06b" : pct >= 60 ? "#2563eb" : "#f59e0b";

  return (
    <div className="edp-page">
      <div className="edp-container">
        <div className="edp-topbar">
          <BackButton href="/dashboard" label="Dashboard" labelTh="กลับแดชบอร์ด" />
          <PageTag label="MY PROFILE" />
        </div>
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 900, color: "var(--pl-text-primary)", marginBottom: "6px" }}>
            แก้ไขโปรไฟล์
            <span style={{ fontSize: "12px", fontWeight: 700, background: "var(--pl-blue-soft)", color: "var(--pl-blue-dark)", padding: "3px 10px", borderRadius: "6px", marginLeft: "12px", verticalAlign: "middle" }}>
              Edit Profile
            </span>
          </h1>
          <p style={{ color: "var(--pl-text-secondary)", fontSize: "15px", margin: 0 }}>
            จัดการข้อมูลปัจจุบันของคุณให้เป็นเวอร์ชันล่าสุด · Keep your info up to date
          </p>
        </div>

        {/* ── Profile completeness ── */}
        <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: "16px", padding: "18px 22px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontWeight: 800, fontSize: "14px", color: "#1e293b" }}>ความสมบูรณ์โปรไฟล์ · Profile Completeness</span>
            <span style={{ fontWeight: 900, fontSize: "20px", color }}>{pct}%</span>
          </div>
          <div style={{ height: "6px", borderRadius: "999px", background: "#f1f5f9", marginBottom: "14px", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: "999px", background: color, width: `${pct}%`, transition: "width 0.4s" }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {checks.map(c => (
              <span key={c.label} style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "999px", background: c.done ? "#f0fdf4" : "#fafafa", color: c.done ? "#15803d" : "#94a3b8", border: `1px solid ${c.done ? "#bbf7d0" : "#e2e8f0"}` }}>
                {c.done ? "✓" : "○"} {c.label}
              </span>
            ))}
          </div>
        </div>

        {saveMsg && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "14px 20px", marginBottom: "20px", color: "#15803d", fontWeight: 700 }}>
            {saveMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ── Photo Section ── */}
          <div className="ui-section-card">
            <div className="ui-form-grid">
              <BusinessSectionTitle title="รูปภาพโปรไฟล์" subtitle="Profile Photos" description="รูปโปรไฟล์และรูปปกที่แสดงในหน้าโปรไฟล์ของคุณ · Your profile and cover photos" />

              {/* Avatar Upload */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <div style={{ position: "relative", width: "100px", height: "100px" }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" style={{ width: "100px", height: "100px", borderRadius: "50%", objectFit: "cover", border: "3px solid #e2e8f0", opacity: uploadingAvatar ? 0.5 : 1 }} />
                  ) : (
                    <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "linear-gradient(135deg, #667eea, #4facfe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", color: "#fff", fontWeight: 900, border: "3px solid #e2e8f0", opacity: uploadingAvatar ? 0.5 : 1 }}>
                      {(firstName[0] || "?").toUpperCase()}
                    </div>
                  )}
                  {uploadingAvatar && (
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>⏳</div>
                  )}
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b", margin: "0 0 6px" }}>รูปโปรไฟล์ · Avatar</p>
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: "0 0 10px" }}>แนะนำ 400×400px · Max 5MB</p>
                  <button type="button" className="photo-upload-btn" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}>
                    <IconCamera />
                    {uploadingAvatar ? "กำลังอัปโหลด..." : avatarUrl ? "เปลี่ยนรูป · Change" : "เพิ่มรูป · Upload"}
                  </button>
                  <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
                </div>
              </div>

              {/* Cover Upload */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ position: "relative", width: "100%", height: "120px", borderRadius: "14px", overflow: "hidden", background: "#f1f5f9", border: "1.5px dashed #e2e8f0" }}>
                  {coverUrl ? (
                    <img src={coverUrl} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: uploadingCover ? 0.5 : 1 }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #667eea 0%, #4facfe 50%, #43e97b 100%)", opacity: 0.3 }} />
                  )}
                  {uploadingCover && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>⏳</div>
                  )}
                  {!coverUrl && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "13px", fontWeight: 600, flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "24px" }}>🖼️</span>
                      ยังไม่มีรูปปก · No cover photo
                    </div>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>รูปปก · Cover Photo</p>
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: "0 0 10px" }}>แนะนำ 1600×400px · Max 8MB</p>
                  <button type="button" className="photo-upload-btn" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}>
                    <IconCamera />
                    {uploadingCover ? "กำลังอัปโหลด..." : coverUrl ? "เปลี่ยนรูปปก · Change" : "เพิ่มรูปปก · Upload"}
                  </button>
                  <input ref={coverInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverUpload} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Personal Info ── */}
          <div className="ui-section-card">
            <div className="ui-form-grid">
              <BusinessSectionTitle title="ข้อมูลส่วนตัว" subtitle="Personal Information" description="ชื่อและข้อมูลที่แสดงในโปรไฟล์ · Your public profile details" />
              <InputField label="ชื่อจริง" labelEn="First name" required value={firstName} onChange={e => setFirstName(e.target.value)} />
              <InputField label="นามสกุล" labelEn="Last name" required value={lastName} onChange={e => setLastName(e.target.value)} />
              <InputField label="ชื่อที่ใช้แสดง" labelEn="Display name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
              <SelectField label="เพศ" labelEn="Gender" value={gender} onChange={e => setGender(e.target.value)}
                options={[
                  { label: "-- ไม่ระบุ --", value: "" },
                  { label: "ชาย · Male", value: "male" },
                  { label: "หญิง · Female", value: "female" },
                  { label: "อื่นๆ · Other", value: "other" },
                ]} />
              <InputField label="เบอร์โทรศัพท์" labelEn="Phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
              <div className="col-full">
                <InputField label="อีเมล" labelEn="Email address" type="email" value={email} onChange={() => {}} disabled />
              </div>
              <div className="col-full">
                <div className="ui-field">
                  <label>แนะนำตัว <span className="en">Bio</span></label>
                  <textarea className="ui-input" rows={3} placeholder="เล่าเรื่องราวเกี่ยวกับตัวคุณ..." value={bio} onChange={e => setBio(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Social Media ── */}
          <div className="ui-section-card">
            <div className="ui-form-grid">
              <BusinessSectionTitle title="โซเชียลมีเดีย" subtitle="Social Media" description="ช่องทางที่คนอื่นจะติดต่อหรือติดตามคุณ · Your social links" />
              <InputField label="ไลน์ไอดี" labelEn="Line ID" value={lineId} onChange={e => setLineId(e.target.value)} placeholder="@yourline" />
              <InputField label="เฟซบุ๊ก" labelEn="Facebook" value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="ชื่อเพจ หรือ URL" />
              <InputField label="อินสตาแกรม" labelEn="Instagram" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@username" />
              <InputField label="ติ๊กต็อก" labelEn="TikTok" value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="@username" />
            </div>
          </div>

          {/* ── Account Security ── */}
          <div className="ui-section-card">
            <div className="ui-form-grid">
              <BusinessSectionTitle title="ความปลอดภัยบัญชี" subtitle="Account Security" description="เปลี่ยนรหัสผ่านเฉพาะเมื่อต้องการ · Leave blank to keep current password" />
              <div className="ui-field">
                <InputField label="รหัสผ่านใหม่" labelEn="New password" type="password" placeholder="ปล่อยว่างหากไม่ต้องการเปลี่ยน" value={newPw} onChange={e => setNewPw(e.target.value)} />
                {strength && (
                  <>
                    <div style={{ height: "4px", borderRadius: "999px", background: "#e2e8f0", marginTop: "6px", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "999px", background: strength.color, width: strength.width, transition: "width 0.3s" }} />
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: strength.color, marginTop: "4px", display: "block" }}>{strength.label}</span>
                  </>
                )}
              </div>
              <div className="ui-field">
                <InputField label="ยืนยันรหัสผ่านใหม่" labelEn="Confirm new password" type="password" placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                {pwMatch   && <span style={{ fontSize: "12px", color: "#22a06b", marginTop: "4px", display: "block" }}>✓ รหัสผ่านตรงกัน · Passwords match</span>}
                {pwNoMatch && <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px", display: "block" }}>✗ รหัสผ่านไม่ตรงกัน · Doesn&apos;t match</span>}
              </div>
              <div className="col-full">
                <div className="ui-password-box">
                  <h3>🔒 ยืนยันตัวตน · Confirm identity</h3>
                  <p>กรอกรหัสผ่านปัจจุบันเพื่อบันทึกการเปลี่ยนแปลง · Required to save any changes</p>
                  <div style={{ marginTop: 12 }}>
                    <InputField label="รหัสผ่านปัจจุบัน" labelEn="Current password" required type="password" placeholder="Current password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} />
                  </div>
                  {pwError && <p className="ui-password-note">⚠️ {pwError}</p>}
                </div>
              </div>
            </div>
          </div>

          <ActionBar>
            <CancelButton href="/dashboard" label="ยกเลิก · Discard" />
            <SaveButton label="บันทึกการเปลี่ยนแปลง · Save changes" loading={isSaving} />
          </ActionBar>
        </form>
      </div>
      <style jsx>{`
        .edp-page { min-height: 100vh; background: var(--pl-bg, #f8fafc); padding: 32px 20px 80px; }
        .edp-container { max-width: 920px; margin: auto; }
        .edp-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
        textarea.ui-input { resize: vertical; }
        .photo-upload-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 16px; border-radius: 10px; border: 1.5px solid #e2e8f0;
          background: #f8fafc; color: #334155; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: inherit; transition: 0.2s;
        }
        .photo-upload-btn:hover:not(:disabled) { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; }
        .photo-upload-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 640px) { .edp-topbar { flex-direction: column; align-items: flex-start; } }
      `}</style>
    </div>
  );
}

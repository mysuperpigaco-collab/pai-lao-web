"use client";

import "./edit-profile.css";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import DeleteAccountSection from "@/components/account/DeleteAccountSection";

const GENDER_OPTIONS = [
  { value: "MALE",             label: "ชาย · Male" },
  { value: "FEMALE",           label: "หญิง · Female" },
  { value: "OTHER",            label: "อื่นๆ · Other" },
  { value: "PREFER_NOT_TO_SAY",label: "ไม่ระบุ · Prefer not to say" },
];

function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: checked ? "#f0fdf4" : "#f8fafc", border: `1.5px solid ${checked ? "#86efac" : "#e2e8f0"}`, borderRadius: 12, cursor: "pointer", gap: 12, transition: "all 0.15s" }}>
      <span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#334155", display: "block" }}>{label}</span>
        {sub && <span style={{ fontSize: 12, color: "#94a3b8" }}>{sub}</span>}
      </span>
      <div
        onClick={() => onChange(!checked)}
        style={{ width: 44, height: 24, borderRadius: 999, background: checked ? "#10b981" : "#cbd5e1", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
      >
        <div style={{ position: "absolute", top: 3, left: checked ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
      </div>
    </label>
  );
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    { ok: password.length >= 8,       label: "อย่างน้อย 8 ตัวอักษร" },
    { ok: /[A-Z]/.test(password),     label: "มีตัวพิมพ์ใหญ่ (A-Z)" },
    { ok: /[0-9]/.test(password),     label: "มีตัวเลข (0-9)" },
    { ok: /[^A-Za-z0-9]/.test(password), label: "มีอักขระพิเศษ (!@#...)" },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ["#ef4444", "#f59e0b", "#eab308", "#10b981"];
  const labels = ["อ่อนมาก", "อ่อน", "ปานกลาง", "แข็งแกร่ง"];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i < score ? colors[score - 1] : "#e2e8f0", transition: "background 0.2s" }} />
        ))}
      </div>
      {score > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: colors[score - 1], marginBottom: 6 }}>{labels[score - 1]}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {checks.map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: c.ok ? "#15803d" : "#94a3b8" }}>
            <span>{c.ok ? "✓" : "○"}</span>
            <span>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EditProfilePage() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showCurPw, setShowCurPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfPw, setShowConfPw] = useState(false);

  const [hasPassword, setHasPassword] = useState(true);
  const [welcomeGoogle, setWelcomeGoogle] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", displayName: "", username: "", phone: "", gender: "",
    bio: "", lineId: "", facebook: "", instagram: "", tiktok: "",
    currentPw: "", newPw: "", confirmPw: "",
  });
  const [privacy, setPrivacy] = useState({
    profilePrivacy: "PUBLIC",
    showEmail: false, showPhone: false, showSocial: true, showBirthDate: false,
  });

  // ตรวจว่ามาจากล็อกอิน Google ครั้งแรก (?welcome=google)
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("welcome") === "google") {
      setWelcomeGoogle(true);
    }
  }, []);

  // Load from API
  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        const u = data.user;
        if (!u) return;
        setForm(f => ({
          ...f,
          firstName:   u.firstName   ?? "",
          lastName:    u.lastName    ?? "",
          displayName: u.displayName ?? "",
          username:    u.username    ?? "",
          phone:       u.phone       ?? "",
          gender:      u.gender      ?? "",
          bio:         u.bio         ?? "",
          lineId:      u.lineId      ?? "",
          facebook:    u.facebook    ?? "",
          instagram:   u.instagram   ?? "",
          tiktok:      u.tiktok      ?? "",
        }));
        setHasPassword(u.hasPassword !== false);
        setPrivacy({
          profilePrivacy: u.profilePrivacy ?? "PUBLIC",
          showEmail:      u.showEmail      ?? false,
          showPhone:      u.showPhone      ?? false,
          showSocial:     u.showSocial     ?? true,
          showBirthDate:  u.showBirthDate  ?? false,
        });
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // ชื่อจริง/นามสกุล — ห้ามตัวเลข
    const v = (name === "firstName" || name === "lastName") ? value.replace(/[0-9]/g, "") : value;
    setForm(f => ({ ...f, [name]: v }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPw && form.newPw.length < 8) {
      setApiError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร"); return;
    }
    if (form.newPw && !/[A-Z]/.test(form.newPw)) {
      setApiError("รหัสผ่านใหม่ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว (A-Z)"); return;
    }
    if (form.newPw && !/[0-9]/.test(form.newPw)) {
      setApiError("รหัสผ่านใหม่ต้องมีตัวเลขอย่างน้อย 1 ตัว (0-9)"); return;
    }
    if (form.newPw && form.newPw !== form.confirmPw) {
      setApiError("รหัสผ่านใหม่ไม่ตรงกัน"); return;
    }
    if (form.username && !/^[a-zA-Z0-9_]{3,30}$/.test(form.username.trim())) {
      setApiError("ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษ ตัวเลข หรือ _ (3-30 ตัว)"); return;
    }
    // ── ข้อมูลจำเป็น (กันข้าม onboarding) ──
    const phoneDigits = form.phone.replace(/[^0-9]/g, "");
    if (phoneDigits.length < 9 || phoneDigits.length > 10) {
      setApiError("กรุณากรอกเบอร์โทร 9-10 หลัก (ตัวเลขเท่านั้น) · Please enter a valid 9–10 digit phone number"); return;
    }
    if (!form.gender) {
      setApiError("กรุณาเลือกเพศ · Please select your gender"); return;
    }
    setIsLoading(true); setApiError("");
    try {
      const body: any = {
        firstName: form.firstName, lastName: form.lastName,
        displayName: form.displayName, username: form.username.trim(), phone: form.phone,
        gender: form.gender || undefined, bio: form.bio,
        lineId: form.lineId || undefined, facebook: form.facebook || undefined,
        instagram: form.instagram || undefined, tiktok: form.tiktok || undefined,
        ...privacy,
      };
      if (form.newPw) { if (hasPassword) body.currentPw = form.currentPw; body.newPw = form.newPw; }

      const res = await fetch("/api/auth/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setApiError(data.message || "เกิดข้อผิดพลาด"); setIsLoading(false); return; }
      await refresh();
      setIsSaved(true);
      setForm(f => ({ ...f, currentPw: "", newPw: "", confirmPw: "" }));
      // redirect to public profile after 1.2s
      setTimeout(() => {
        const username = (data.user?.username ?? user?.username);
        if (username) router.push(`/user/${username}`);
      }, 1200);
    } catch {
      setApiError("ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่");
    }
    setIsLoading(false);
  };

  const displayName = user?.displayName || user?.firstName || "";

  return (
    <div className="edit-container">
      <div className="edit-card">
        <div className="edit-header">
          <h2>แก้ไขโปรไฟล์ · Edit Profile</h2>
          <p>ข้อมูลของ {displayName}</p>
        </div>

        {welcomeGoogle && (
          <div style={{ background: "linear-gradient(135deg,#eff6ff,#ecfdf5)", border: "1px solid #bfdbfe", borderRadius: 14, padding: "14px 18px", marginBottom: 20, color: "#1e40af", fontSize: 14, lineHeight: 1.7 }}>
            🎉 <strong>ยินดีต้อนรับสู่ไปเล่า!</strong> คุณเข้าสู่ระบบด้วย Google แล้ว · Welcome!<br />
            กรุณากรอก <strong>เบอร์โทร</strong> และ <strong>เพศ</strong> ให้ครบก่อนเริ่มใช้งาน · Please complete your phone &amp; gender to continue<br />
            <span style={{ color: "#475569" }}>แนะนำให้ <strong>ตั้งชื่อผู้ใช้</strong> และ <strong>ตั้งรหัสผ่าน</strong> เพื่อใช้ล็อกอินด้วยอีเมล/ชื่อผู้ใช้ได้อีกทาง</span>
          </div>
        )}

        {apiError && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", marginBottom: 20, color: "#b91c1c", fontSize: 14 }}>
            ⚠️ {apiError}
          </div>
        )}
        {isSaved && (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: "12px 16px", marginBottom: 20, color: "#15803d", fontSize: 14 }}>
            ✅ บันทึกสำเร็จแล้ว!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">

            {/* Personal */}
            <div className="section-label full-width">👤 ข้อมูลส่วนตัว · Personal Info</div>

            <div className="form-group">
              <label>ชื่อจริง · First Name <span className="req">*</span></label>
              <input className="form-control" name="firstName" value={form.firstName} onChange={handleChange} required placeholder="ชื่อจริง" />
            </div>
            <div className="form-group">
              <label>นามสกุล · Last Name <span className="req">*</span></label>
              <input className="form-control" name="lastName" value={form.lastName} onChange={handleChange} required placeholder="นามสกุล" />
            </div>
            <div className="form-group">
              <label>ชื่อที่แสดง · Display Name <span className="req">*</span></label>
              <input className="form-control" name="displayName" value={form.displayName} onChange={handleChange} required placeholder="ชื่อฉายา" />
            </div>
            <div className="form-group">
              <label>ชื่อผู้ใช้ (สำหรับล็อกอิน) · Username <span className="req">*</span></label>
              <input className="form-control" name="username" value={form.username} onChange={handleChange} required placeholder="username" autoComplete="off" />
              <small style={{ fontSize: 11, color: "#94a3b8" }}>ใช้ล็อกอิน + เป็นลิงก์โปรไฟล์ /user/{form.username || "username"} · a-z, 0-9, _ (3-30 ตัว)</small>
            </div>
            <div className="form-group">
              <label>เพศ · Gender <span className="req">*</span></label>
              <select className="form-control" name="gender" value={form.gender} onChange={handleChange} required>
                <option value="">— เลือกเพศ · Select gender —</option>
                {GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>เบอร์โทร · Phone <span className="req">*</span></label>
              <input className="form-control" name="phone" inputMode="numeric" maxLength={10} value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/[^0-9]/g, "") }))}
                required placeholder="08XXXXXXXX (ตัวเลขเท่านั้น · digits only)" />
            </div>
            <div className="full-width form-group">
              <label>แนะนำตัว · Bio</label>
              <textarea className="form-control" name="bio" value={form.bio} onChange={handleChange} rows={3} placeholder="แนะนำตัวเองสั้นๆ..." style={{ resize: "vertical" }} />
            </div>

            {/* Social */}
            <div className="section-label full-width">🔗 โซเชียล · Social Links</div>
            <div className="form-group">
              <label>Line ID</label>
              <input className="form-control" name="lineId" value={form.lineId} onChange={handleChange} placeholder="@yourline" />
            </div>
            <div className="form-group">
              <label>Facebook</label>
              <input className="form-control" name="facebook" value={form.facebook} onChange={handleChange} placeholder="ชื่อเพจหรือ URL" />
            </div>
            <div className="form-group">
              <label>Instagram</label>
              <input className="form-control" name="instagram" value={form.instagram} onChange={handleChange} placeholder="@username" />
            </div>
            <div className="form-group">
              <label>TikTok</label>
              <input className="form-control" name="tiktok" value={form.tiktok} onChange={handleChange} placeholder="@username" />
            </div>

            {/* Privacy */}
            <div className="section-label full-width">🔒 ความเป็นส่วนตัว · Privacy Settings</div>
            <div className="full-width">
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 }}>การมองเห็นโปรไฟล์ · Profile Visibility</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {[{ v: "PUBLIC", icon: "🌐", label: "สาธารณะ · Public" }, { v: "PRIVATE", icon: "🔒", label: "ส่วนตัว · Private" }].map(opt => (
                    <button key={opt.v} type="button"
                      onClick={() => setPrivacy(p => ({ ...p, profilePrivacy: opt.v }))}
                      style={{ flex: 1, padding: "10px 16px", borderRadius: 12, border: `2px solid ${privacy.profilePrivacy === opt.v ? "#10b981" : "#e2e8f0"}`, background: privacy.profilePrivacy === opt.v ? "#f0fdf4" : "#fff", color: privacy.profilePrivacy === opt.v ? "#15803d" : "#64748b", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>ส่วนตัว = คนอื่นไม่เห็นข้อมูลและทริปของคุณ</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Toggle checked={privacy.showEmail}     onChange={v => setPrivacy(p => ({ ...p, showEmail: v }))}     label="แสดงอีเมล · Show Email"              sub="แสดงอีเมลของคุณในหน้าโปรไฟล์สาธารณะ" />
                <Toggle checked={privacy.showPhone}     onChange={v => setPrivacy(p => ({ ...p, showPhone: v }))}     label="แสดงเบอร์โทร · Show Phone"           sub="แสดงเบอร์โทรของคุณในหน้าโปรไฟล์สาธารณะ" />
                <Toggle checked={privacy.showSocial}    onChange={v => setPrivacy(p => ({ ...p, showSocial: v }))}    label="แสดงโซเชียล · Show Social Links"     sub="แสดง Line/Facebook/Instagram/TikTok" />
                <Toggle checked={privacy.showBirthDate} onChange={v => setPrivacy(p => ({ ...p, showBirthDate: v }))} label="แสดงวันเกิด · Show Birth Date"        sub="แสดงปีเกิดในหน้าโปรไฟล์" />
              </div>
            </div>

            {/* Security */}
            <div className="section-label full-width">
              🔑 {hasPassword ? "เปลี่ยนรหัสผ่าน · Change Password" : "ตั้งรหัสผ่าน · Set Password"}
            </div>
            {!hasPassword && (
              <div className="full-width" style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "10px 14px", marginBottom: 4, fontSize: 13, color: "#1e40af" }}>
                บัญชีนี้เข้าสู่ระบบด้วย Google · ตั้งรหัสผ่านเพื่อเข้าสู่ระบบด้วยอีเมล/ชื่อผู้ใช้ได้อีกทาง (ไม่ต้องกรอกรหัสเดิม)
              </div>
            )}
            {hasPassword && (
              <div className="full-width form-group">
                <label>รหัสผ่านปัจจุบัน (ต้องกรอกถ้าต้องการเปลี่ยน)</label>
                <div style={{ position: "relative" }}>
                  <input className="form-control" name="currentPw" type={showCurPw ? "text" : "password"} value={form.currentPw} onChange={handleChange} placeholder="รหัสผ่านปัจจุบัน" style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowCurPw(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, padding: 0, lineHeight: 1 }}>
                    {showCurPw ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
            )}
            <div className="form-group">
              <label>รหัสผ่านใหม่</label>
              <div style={{ position: "relative" }}>
                <input className="form-control" name="newPw" type={showNewPw ? "text" : "password"} value={form.newPw} onChange={handleChange} placeholder="รหัสผ่านใหม่" style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowNewPw(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, padding: 0, lineHeight: 1 }}>
                  {showNewPw ? "🙈" : "👁️"}
                </button>
              </div>
              <PasswordStrength password={form.newPw} />
            </div>
            <div className="form-group">
              <label>ยืนยันรหัสผ่านใหม่</label>
              <div style={{ position: "relative" }}>
                <input className="form-control" name="confirmPw" type={showConfPw ? "text" : "password"} value={form.confirmPw} onChange={handleChange} placeholder="ยืนยันอีกครั้ง" style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowConfPw(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, padding: 0, lineHeight: 1 }}>
                  {showConfPw ? "🙈" : "👁️"}
                </button>
              </div>
              {form.confirmPw && form.newPw && form.confirmPw !== form.newPw && (
                <p style={{ fontSize: 12, color: "#ef4444", margin: "4px 0 0" }}>⚠️ รหัสผ่านไม่ตรงกัน</p>
              )}
              {form.confirmPw && form.newPw && form.confirmPw === form.newPw && (
                <p style={{ fontSize: 12, color: "#15803d", margin: "4px 0 0" }}>✓ รหัสผ่านตรงกัน</p>
              )}
            </div>

          </div>

          <div className="btn-group">
            <Link href="/dashboard" className="btn-cancel">ยกเลิก</Link>
            <button type="submit" className="btn-save" disabled={isLoading}>
              {isLoading ? "⏳ กำลังบันทึก..." : "💾 บันทึกการเปลี่ยนแปลง"}
            </button>
          </div>
        </form>
        <DeleteAccountSection />
      </div>
    </div>
  );
}

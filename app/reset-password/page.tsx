"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./reset-password.module.css";
import LoadingPage from "@/app/loading";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordScore = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;
  const canSubmit = passwordScore >= 2 && password === confirmPassword && !loading;
  const strengthLabel = ["ยังไม่กรอก", "เริ่มต้น", "พอใช้", "ดี", "แข็งแรง"][passwordScore];

  if (!token) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px" }}>
        <p style={{ fontSize: 18, color: "#dc2626", fontWeight: 700 }}>ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว</p>
        <Link href="/forgot-password" style={{ display: "inline-block", marginTop: 16, color: "#2563eb", fontWeight: 700 }}>
          ขอลิงก์ใหม่
        </Link>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "เกิดข้อผิดพลาด"); return; }
      setSubmitted(true);
    } catch {
      setError("ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="reset-page">
      <div className="shell">
        <div className="panel copy-panel">
          <span className="eyebrow"><ShieldCheck size={16} /> Secure password reset</span>
          <h1>ตั้งรหัสผ่านใหม่</h1>
          <p>สร้างรหัสผ่านใหม่ที่จำง่ายสำหรับคุณ แต่เดายากสำหรับคนอื่น เพื่อให้บัญชี Pai-Lao ของคุณปลอดภัยพร้อมกลับไปเล่าเรื่องได้ต่อ</p>
          <div className="trust-list">
            <div><CheckCircle2 size={18} /> ใช้อย่างน้อย 8 ตัวอักษร</div>
            <div><CheckCircle2 size={18} /> ผสมตัวเลข ตัวพิมพ์ใหญ่ หรือสัญลักษณ์</div>
            <div><CheckCircle2 size={18} /> หลีกเลี่ยงรหัสผ่านที่เคยใช้ซ้ำ</div>
          </div>
        </div>

        <div className="panel form-panel">
          <div className="icon-box"><LockKeyhole size={30} /></div>

          {submitted ? (
            <div className="success-state">
              <CheckCircle2 size={48} />
              <h2>เปลี่ยนรหัสผ่านแล้ว</h2>
              <p>คุณสามารถกลับไปเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที</p>
              <Link href="/login" className="primary-link"><ArrowLeft size={18} /> กลับไปหน้าเข้าสู่ระบบ</Link>
            </div>
          ) : (
            <>
              <div className="form-heading">
                <span>RESET PASSWORD</span>
                <h2>สร้างรหัสผ่านใหม่</h2>
                <p>กรอกรหัสผ่านใหม่และยืนยันอีกครั้งเพื่อบันทึกการเปลี่ยนแปลง</p>
              </div>

              <form onSubmit={handleSubmit}>
                <label className="field">
                  <span>รหัสผ่านใหม่</span>
                  <div className="input-wrap">
                    <LockKeyhole size={18} />
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="อย่างน้อย 8 ตัวอักษร" required />
                    <button type="button" className="icon-button" onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>

                <div className="strength">
                  <div className="strength-track">
                    {[1, 2, 3, 4].map((i) => (<span key={i} className={i <= passwordScore ? "active" : ""} />))}
                  </div>
                  <small>ความแข็งแรง: {strengthLabel}</small>
                </div>

                <label className="field">
                  <span>ยืนยันรหัสผ่านใหม่</span>
                  <div className={`input-wrap ${!passwordsMatch ? "has-error" : ""}`}>
                    <ShieldCheck size={18} />
                    <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="พิมพ์รหัสผ่านอีกครั้ง" required />
                  </div>
                  {!passwordsMatch && <small className="error-text">รหัสผ่านทั้งสองช่องยังไม่ตรงกัน</small>}
                </label>

                {error && <p style={{ color: "#dc2626", fontSize: 13, fontWeight: 700, textAlign: "center", margin: 0 }}>{error}</p>}

                <button type="submit" className="submit-button" disabled={!canSubmit}>
                  {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
                </button>
              </form>

              <div className={styles.recoveryActions}>
                <Link href="/login" className={`${styles.recoveryButton} ${styles.loginButton}`}>
                  <span className={styles.buttonIcon}><ArrowLeft size={20} /></span>
                  <span className={styles.buttonText}><strong>กลับหน้าเข้าสู่ระบบ</strong><small>Back to Login</small></span>
                  <span className={styles.buttonCue}><ArrowRight size={16} /></span>
                </Link>
                <Link href="/signup" className={`${styles.recoveryButton} ${styles.signupButton}`}>
                  <span className={styles.buttonIcon}><UserPlus size={20} /></span>
                  <span className={styles.buttonText}><strong>สมัครสมาชิก</strong><small>Join Pai-Lao Community</small></span>
                  <span className={styles.buttonCue}><Sparkles size={16} /></span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .reset-page { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:48px 20px; background:linear-gradient(135deg,#eff6ff,#ecfdf5); }
        .shell { width:100%; max-width:1080px; display:grid; grid-template-columns:minmax(0,0.92fr) minmax(360px,1fr); gap:18px; align-items:stretch; }
        .panel { border:1px solid rgba(226,232,240,0.95); border-radius:8px; background:rgba(255,255,255,0.92); box-shadow:0 24px 60px rgba(15,23,42,0.08); }
        .copy-panel { padding:42px; display:flex; flex-direction:column; justify-content:center; background:linear-gradient(160deg,rgba(15,23,42,0.94),rgba(30,64,175,0.9)),#0f172a; color:#fff; }
        .eyebrow { width:fit-content; display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border:1px solid rgba(255,255,255,0.18); border-radius:999px; color:rgba(255,255,255,0.78); font-size:12px; font-weight:800; text-transform:uppercase; }
        h1,h2,p { margin:0; }
        .copy-panel h1 { margin-top:28px; font-size:44px; line-height:1.12; font-weight:900; }
        .copy-panel p { margin-top:18px; color:rgba(255,255,255,0.76); font-size:16px; line-height:1.8; }
        .trust-list { display:grid; gap:12px; margin-top:36px; }
        .trust-list div { display:flex; align-items:center; gap:10px; color:rgba(255,255,255,0.86); font-size:14px; font-weight:700; }
        .trust-list svg { color:#43e97b; }
        .form-panel { padding:36px; }
        .icon-box { width:62px; height:62px; display:grid; place-items:center; border-radius:8px; color:#fff; background:linear-gradient(135deg,#2563eb,#22a06b); box-shadow:0 16px 30px rgba(37,99,235,0.22); }
        .form-heading { margin-top:24px; }
        .form-heading span { color:#2563eb; font-size:12px; font-weight:900; text-transform:uppercase; }
        .form-heading h2,.success-state h2 { margin-top:8px; color:#0f172a; font-size:30px; line-height:1.2; font-weight:900; }
        .form-heading p,.success-state p { margin-top:10px; color:#64748b; font-size:14px; line-height:1.7; }
        form { display:grid; gap:18px; margin-top:28px; }
        .field { display:grid; gap:9px; color:#334155; font-size:14px; font-weight:800; }
        .input-wrap { height:56px; display:flex; align-items:center; gap:12px; padding:0 14px; border:1.5px solid #dbe7f3; border-radius:8px; background:#fff; color:#94a3b8; transition:0.2s; }
        .input-wrap:focus-within { border-color:#2563eb; box-shadow:0 0 0 4px rgba(37,99,235,0.09); }
        .input-wrap.has-error { border-color:#fca5a5; box-shadow:0 0 0 4px rgba(239,68,68,0.08); }
        input { width:100%; min-width:0; border:0; outline:0; background:transparent; color:#0f172a; font-size:15px; }
        input::placeholder { color:#94a3b8; }
        .icon-button { width:34px; height:34px; display:grid; place-items:center; flex:0 0 auto; border:0; border-radius:8px; color:#64748b; background:transparent; cursor:pointer; }
        .icon-button:hover { color:#2563eb; background:#eff6ff; }
        .strength { display:grid; gap:8px; margin-top:-8px; }
        .strength-track { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; }
        .strength-track span { height:6px; border-radius:999px; background:#e2e8f0; }
        .strength-track span.active { background:linear-gradient(90deg,#4facfe,#43e97b); }
        .strength small,.error-text { color:#64748b; font-size:12px; font-weight:700; }
        .error-text { color:#dc2626; }
        .submit-button,.primary-link { height:54px; display:inline-flex; align-items:center; justify-content:center; gap:10px; border:0; border-radius:8px; color:#fff; background:linear-gradient(135deg,#2563eb,#22a06b); box-shadow:0 14px 28px rgba(37,99,235,0.22); font-size:15px; font-weight:900; text-decoration:none; cursor:pointer; transition:0.2s; }
        .submit-button:hover:not(:disabled),.primary-link:hover { transform:translateY(-2px); box-shadow:0 18px 34px rgba(37,99,235,0.28); }
        .submit-button:disabled { cursor:not-allowed; opacity:0.48; transform:none; box-shadow:none; }
        .success-state { min-height:430px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
        .success-state > svg { color:#22a06b; }
        .success-state .primary-link { width:100%; margin-top:28px; }
        @media (max-width:860px) { .shell { grid-template-columns:1fr; max-width:560px; } .copy-panel { padding:30px; } .copy-panel h1 { font-size:36px; } }
        @media (max-width:520px) { .reset-page { padding:24px 14px; } .copy-panel,.form-panel { padding:24px; } .copy-panel h1,.form-heading h2,.success-state h2 { font-size:28px; } }
      `}</style>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

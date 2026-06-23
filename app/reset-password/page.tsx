"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { useMemo, useState, Suspense } from "react";
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
      <div className="page">
        <div className="bg" />
        <div className="card" style={{ textAlign: "center" }}>
          <div className="logo"><LockKeyhole size={36} color="#fff" /></div>
          <p style={{ color: "#dc2626", fontWeight: 700, fontSize: 16 }}>ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว</p>
          <Link href="/forgot-password" style={{ display: "inline-block", marginTop: 16, color: "#2563eb", fontWeight: 700 }}>
            ขอลิงก์ใหม่
          </Link>
        </div>
        <style jsx>{` .page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:transparent;padding:24px;position:relative;overflow:hidden;} .bg{position:absolute;inset:0;background:radial-gradient(circle at top left,rgba(37,99,235,0.15),transparent 30%),radial-gradient(circle at bottom right,rgba(16,185,129,0.15),transparent 30%);} .card{position:relative;z-index:2;width:100%;max-width:480px;background:var(--pl-white);backdrop-filter:blur(20px);border-radius:38px;padding:42px;border:1px solid var(--pl-border);box-shadow:0 25px 60px rgba(15,23,42,0.08);} .logo{width:72px;height:72px;margin:0 auto 20px;border-radius:24px;background:linear-gradient(135deg,#2563eb,#10b981);display:flex;align-items:center;justify-content:center;} `}</style>
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
    <div className="page">
      <div className="bg" />
      <div className="card">
        <div className="logo"><LockKeyhole size={36} color="#fff" /></div>
        <span className="mini">SECURE PASSWORD RESET</span>

        {submitted ? (
          <div style={{ textAlign: "center" }}>
            <CheckCircle2 size={52} color="#22a06b" style={{ margin: "0 auto 16px" }} />
            <h2>เปลี่ยนรหัสผ่านแล้ว</h2>
            <p className="desc">คุณสามารถกลับไปเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที</p>
            <Link href="/login" className="submit-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none", marginTop: 8 }}>
              <ArrowLeft size={18} /> กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        ) : (
          <>
            <h1>ตั้งรหัสผ่านใหม่</h1>
            <p className="desc">กรอกรหัสผ่านใหม่และยืนยันอีกครั้งเพื่อบันทึกการเปลี่ยนแปลง</p>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>รหัสผ่านใหม่</label>
                <div className="input-wrap">
                  <LockKeyhole size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    required
                  />
                  <button type="button" className="icon-btn" onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="strength">
                <div className="strength-track">
                  {[1, 2, 3, 4].map(i => <span key={i} className={i <= passwordScore ? "active" : ""} />)}
                </div>
                <small>ความแข็งแรง: {strengthLabel}</small>
              </div>

              <div className="input-group">
                <label>ยืนยันรหัสผ่านใหม่</label>
                <div className={`input-wrap ${!passwordsMatch ? "has-error" : ""}`}>
                  <ShieldCheck size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                    required
                  />
                </div>
                {!passwordsMatch && <small className="error-text">รหัสผ่านทั้งสองช่องยังไม่ตรงกัน</small>}
              </div>

              {error && <p className="error-msg">{error}</p>}

              <button type="submit" className="submit-btn" disabled={!canSubmit}>
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

      <style jsx>{`
        .page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:transparent; padding:24px; position:relative; overflow:hidden; }
        .bg { position:absolute; inset:0; background: radial-gradient(circle at top left,rgba(37,99,235,0.15),transparent 30%), radial-gradient(circle at bottom right,rgba(16,185,129,0.15),transparent 30%); }
        .card { position:relative; z-index:2; width:100%; max-width:480px; background:var(--pl-white); backdrop-filter:blur(20px); border-radius:38px; padding:42px; border:1px solid var(--pl-border); box-shadow:0 25px 60px rgba(15,23,42,0.08); }
        .logo { width:72px; height:72px; margin:0 auto 16px; border-radius:24px; background:linear-gradient(135deg,#2563eb,#10b981); display:flex; align-items:center; justify-content:center; }
        .mini { display:block; text-align:center; font-size:11px; font-weight:800; letter-spacing:2px; color:#94a3b8; margin-bottom:14px; }
        h1 { text-align:center; font-size:32px; font-weight:900; color:var(--pl-text-primary); margin:0 0 10px; }
        h2 { font-size:26px; font-weight:900; color:var(--pl-text-primary); margin:0 0 10px; }
        .desc { text-align:center; color:var(--pl-text-secondary); font-size:14px; line-height:1.7; margin-bottom:28px; }
        .input-group { margin-bottom:16px; }
        label { display:block; margin-bottom:8px; font-size:14px; font-weight:700; color:var(--pl-text-primary); }
        .input-wrap { height:56px; display:flex; align-items:center; gap:10px; padding:0 14px; border:1.5px solid var(--pl-border); border-radius:16px; background:var(--pl-bg); color:#94a3b8; transition:0.2s; }
        .input-wrap:focus-within { border-color:#2563eb; box-shadow:0 0 0 4px rgba(37,99,235,0.09); }
        .input-wrap.has-error { border-color:#fca5a5; }
        input { width:100%; min-width:0; border:0; outline:0; background:transparent; color:var(--pl-text-primary); font-size:15px; }
        input::placeholder { color:#94a3b8; }
        .icon-btn { width:32px; height:32px; display:flex; align-items:center; justify-content:center; border:0; background:transparent; cursor:pointer; color:var(--pl-text-secondary); border-radius:8px; }
        .icon-btn:hover { color:#2563eb; background:#eff6ff; }
        .strength { margin:-4px 0 16px; display:grid; gap:6px; }
        .strength-track { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
        .strength-track span { height:5px; border-radius:999px; background:#e2e8f0; }
        .strength-track span.active { background:linear-gradient(90deg,#4facfe,#43e97b); }
        .strength small { color:var(--pl-text-secondary); font-size:12px; font-weight:600; }
        .error-text { color:#dc2626; font-size:12px; font-weight:700; display:block; margin-top:4px; }
        .error-msg { color:#dc2626; font-size:13px; font-weight:700; text-align:center; margin:-4px 0 12px; }
        .submit-btn { width:100%; height:58px; border:none; border-radius:18px; background:linear-gradient(135deg,#2563eb,#10b981); color:white; font-size:15px; font-weight:900; cursor:pointer; transition:0.3s; box-shadow:0 14px 28px rgba(37,99,235,0.22); margin-top:8px; }
        .submit-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 20px 36px rgba(37,99,235,0.3); }
        .submit-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
        @media (max-width:520px) { .card { padding:28px 20px; border-radius:24px; } h1 { font-size:26px; } }
      `}</style>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

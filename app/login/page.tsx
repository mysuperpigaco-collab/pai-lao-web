"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import InputField from "@/components/ui/InputField";
import { useAuth } from "@/context/AuthContext";
import { useMagneticButton } from "@/hooks/useMagneticButton";

export default function LoginPage() {
  return <Suspense fallback={null}><LoginInner /></Suspense>;
}

function LoginInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { login }    = useAuth();
  const magSubmit    = useMagneticButton();

  const [formData,      setFormData     ] = useState({ identifier: "", password: "", rememberMe: false });
  const [error,         setError        ] = useState("");
  const [notice,        setNotice       ] = useState("");
  const [isLoading,     setIsLoading    ] = useState(false);
  const [unverified,    setUnverified   ] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone,    setResendDone   ] = useState(false);

  useEffect(() => {
    const v = searchParams.get("verified");
    if (v === "success") setNotice("✅ ยืนยันอีเมลสำเร็จ! เข้าสู่ระบบได้เลย");
    if (v === "invalid") setNotice("❌ ลิงก์ยืนยันหมดอายุหรือไม่ถูกต้อง");
    if (v === "error")   setNotice("❌ เกิดข้อผิดพลาด กรุณาลองใหม่");
  }, [searchParams]);

  const handleResend = async () => {
    setResendLoading(true);
    await fetch("/api/auth/resend-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrUsername: formData.identifier }),
    });
    setResendLoading(false);
    setResendDone(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const type = (e.target as HTMLInputElement).type;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(formData.identifier, formData.password);

    if (!result.ok) {
      setError(result.message);
      setUnverified(result.unverified === true);
      setIsLoading(false);
      return;
    }

    // role ถูกส่งกลับจาก login() โดยตรง ไม่ต้อง fetch /api/auth/me อีกรอบ
    const role = result.role;
    router.push(role === "SUPERADMIN" || role === "ADMIN" ? "/admin" : role === "BUSINESS" ? "/business/dashboard" : "/dashboard");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 style={{ fontWeight: 800, marginBottom: "10px", fontSize: "28px" }}>
          เข้าสู่ระบบ | <span style={{ color: "#3b82f6" }}>Login</span>
        </h2>
        <p style={{ color: "#999", marginBottom: "35px", fontSize: "14px" }}>
          ยินดีต้อนรับกลับสู่สังคมนักเดินทาง | Welcome Back
        </p>

        {notice && (
          <div style={{ background: notice.startsWith("✅") ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${notice.startsWith("✅") ? "#86efac" : "#fecaca"}`,
            borderRadius: "12px", padding: "12px 16px", marginBottom: "20px",
            color: notice.startsWith("✅") ? "#15803d" : "#b91c1c", fontSize: "14px", textAlign: "left" }}>
            {notice}
          </div>
        )}

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px",
            padding: "12px 16px", marginBottom: "20px", color: "#b91c1c", fontSize: "14px", textAlign: "left" }}>
            ⚠️ {error}
            {unverified && (
              <div style={{ marginTop: "10px" }}>
                {resendDone ? (
                  <p style={{ color: "#15803d", fontSize: "13px", margin: 0 }}>✅ ส่งลิงก์ยืนยันใหม่แล้ว กรุณาตรวจสอบอีเมล</p>
                ) : (
                  <button onClick={handleResend} disabled={resendLoading}
                    style={{ background: "none", border: "1px solid #b91c1c", borderRadius: "8px",
                      padding: "6px 14px", color: "#b91c1c", fontSize: "13px", cursor: "pointer",
                      fontWeight: 600, opacity: resendLoading ? 0.6 : 1 }}>
                    {resendLoading ? "กำลังส่ง..." : "ส่งลิงก์ยืนยันใหม่"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <InputField
            label="ชื่อผู้ใช้งาน หรือ อีเมล" labelEn="Username or Email"
            name="identifier" value={formData.identifier}
            onChange={handleChange} placeholder="username หรือ email@example.com" required
          />
          <InputField
            label="รหัสผ่าน" labelEn="Password"
            name="password" type="password" value={formData.password}
            onChange={handleChange} placeholder="รหัสผ่านของคุณ" required
          />

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" name="rememberMe" checked={formData.rememberMe} onChange={handleChange} />
              <span>จดจำฉัน | Remember me</span>
            </label>
            <Link href="/forgot-password" style={{ color: "#3b82f6", fontSize: "13px", textDecoration: "none", fontWeight: "600" }}>
              ลืมรหัสผ่าน?
            </Link>
          </div>

          <button ref={magSubmit.ref} onMouseMove={magSubmit.onMouseMove} onMouseLeave={magSubmit.onMouseLeave} type="submit" className="btn-login-submit" disabled={isLoading}>
            {isLoading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ | Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          <p>ยังไม่มีบัญชี? <Link href="/signup" className="link-signup">สมัครสมาชิก</Link></p>
        </div>
      </div>

      <style jsx>{`
        .auth-container { min-height: 85vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; background-color: transparent; }
        .auth-card { background: rgba(255,255,255,0.90); padding: 50px; border-radius: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.05); width: 100%; max-width: 480px; text-align: center; }
        .form-options { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding: 0 5px; }
        .remember-me { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: #666; }
        .remember-me input { width: 16px; height: 16px; accent-color: #3b82f6; cursor: pointer; }
        .btn-login-submit { width: 100%; padding: 16px; border-radius: 50px; border: none; background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); color: white; font-weight: 800; font-size: 16px; cursor: pointer; transition: 0.3s; opacity: ${isLoading ? 0.7 : 1}; }
        .btn-login-submit:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(59,130,246,0.2); }
        .auth-footer { margin-top: 30px; }
        .link-signup { color: #3b82f6; font-weight: 700; text-decoration: none; }
        .link-signup:hover { text-decoration: underline; }
        @media (max-width: 640px) {
          .auth-container { padding: 20px 12px; align-items: flex-start; min-height: 100svh; }
          .auth-card { padding: 28px 20px; border-radius: 24px; }
        }
      `}</style>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SignupTabs from "@/components/auth/SignupTabs";
import TravelerFields from "@/components/auth/TravelerFields";
import InputField from "@/components/ui/InputField";

export default function SignupPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState("user");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", displayName: "", birthDate: "", gender: "",
    phone: "", email: "", lineId: "", facebook: "", instagram: "", tiktok: "",
    username: "", password: "", confirmPassword: "",
    businessName: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const newErrors: Record<string, string> = {};
    const pass = formData.password;
    if (pass) {
      if (pass.length < 8) newErrors.password = "ต้องมี 8 ตัวขึ้นไป | Min 8 characters";
      else if (!/[A-Z]/.test(pass)) newErrors.password = "ต้องมีตัวพิมพ์ใหญ่ (A-Z)";
      else if (!/[0-9]/.test(pass)) newErrors.password = "ต้องมีตัวเลข (0-9)";
    }
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
    }
    setErrors(newErrors);
  }, [formData.email, formData.username, formData.password, formData.confirmPassword]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) return;
    setApiError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName:    formData.firstName,
          lastName:     formData.lastName,
          username:     formData.username,
          email:        formData.email,
          phone:        formData.phone,
          password:     formData.password,
          displayName:  formData.displayName,
          birthDate:    formData.birthDate  || undefined,
          gender:       formData.gender     || undefined,
          role:         accountType === "business" ? "BUSINESS" : "TRAVELER",
          businessName: accountType === "business" ? formData.businessName : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.message || "เกิดข้อผิดพลาด"); setIsLoading(false); return; }
      router.push(data.role === "BUSINESS" ? "/business/dashboard" : "/dashboard");
    } catch {
      setApiError("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่");
      setIsLoading(false);
    }
  };

  return (
    <div className="main-wrapper">
      <div className="signup-container-box">
        
        {/* Left Side: Banner (ปรับให้ยืดตามความสูงของฟอร์ม หรือใช้ Sticky) */}
        <div className="banner-side">
          <div className="banner-sticky-content">
            <div className="badge">🌏 Explore Together</div>
            <h2 className="banner-title">เริ่มต้น<br />การเดินทาง<br />ของคุณ</h2>
            <p className="banner-desc">แชร์ประสบการณ์ รีวิวสถานที่ และค้นพบแรงบันดาลใจใหม่ | Start your journey here.</p>
            <div className="banner-footer">
              <span>👤 +1,200 นักเล่าเรื่อง | Storytellers</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form (เอา Scroll ภายในออกแล้ว) */}
        <div className="form-side">
          <div className="form-header">
            <h2>{accountType === "user" ? "สมัครนักเล่าเรื่อง" : "สมัครเจ้าของสถานที่"} | Signup</h2>
            <p>ก้าวแรกสู่การเป็นนักเล่าเรื่อง | Step into the world of stories</p>
          </div>

          <SignupTabs accountType={accountType} setAccountType={setAccountType} />

          {apiError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px",
              padding: "12px 16px", marginBottom: "20px", color: "#b91c1c", fontSize: "14px" }}>
              ⚠️ {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="section-divider">ข้อมูลส่วนตัว | <small>Personal Info</small></div>
              <InputField label="ชื่อจริง" labelEn="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required placeholder="ระบุชื่อจริง" />
              <InputField label="นามสกุล" labelEn="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required placeholder="ระบุนามสกุล" />
              <InputField label="ชื่อที่ใช้แสดง" labelEn="Display Name" name="displayName" value={formData.displayName} onChange={handleChange} required placeholder="ฉายาของคุณ" />
              <InputField label="วันเกิด" labelEn="Birth Date" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} required max={today} />
              
              <div className="form-group">
                <label style={{fontWeight:'600', fontSize:'14px'}}>เพศ | <span style={{color:'#94a3b8', fontWeight:'400'}}>Gender</span> <span style={{color:'red'}}>*</span></label>
                <select name="gender" value={formData.gender} onChange={handleChange} required className="custom-select">
                  <option value="">เลือกเพศ | Select</option>
                  <option value="male">ชาย | Male</option>
                  <option value="female">หญิง | Female</option>
                  <option value="other">อื่นๆ | Other</option>
                </select>
              </div>
              <InputField label="เบอร์โทรศัพท์" labelEn="Phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required placeholder="08XXXXXXXX" />

              <div className="full-width"><InputField label="อีเมล" labelEn="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} required placeholder="example@mail.com" /></div>

              <InputField label="ไลน์ไอดี" labelEn="Line ID" name="lineId" value={formData.lineId} onChange={handleChange} />
              <InputField label="เฟซบุ๊ก" labelEn="Facebook" name="facebook" value={formData.facebook} onChange={handleChange} />
              <InputField label="อินสตาแกรม" labelEn="Instagram" name="instagram" value={formData.instagram} onChange={handleChange} />
              <InputField label="ติ๊กต็อก" labelEn="TikTok" name="tiktok" value={formData.tiktok} onChange={handleChange} />

              {accountType === "user" && (
                <div className="full-width traveler-box">
                  <TravelerFields />
                </div>
              )}

              <div className="section-divider">ข้อมูลบัญชี | <small>Security</small></div>
              <div className="full-width"><InputField label="ชื่อผู้ใช้งาน" labelEn="Username" name="username" value={formData.username} onChange={handleChange} error={errors.username} required /></div>
              <InputField label="รหัสผ่าน" labelEn="Password" name="password" type="password" value={formData.password} onChange={handleChange} error={errors.password} required />
              <InputField label="ยืนยันรหัสผ่าน" labelEn="Confirm" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} required />
            </div>

            <button type="submit" className={`btn-submit ${accountType}`} disabled={isLoading}>
              {isLoading ? "กำลังสมัคร..." : "ยืนยันสมัครสมาชิก | Register Now"}
            </button>
          </form>

          <p className="login-link-text">
            มีบัญชีแล้ว? <Link href="/login">เข้าสู่ระบบ | Login</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .main-wrapper { 
          min-height: 100vh; 
          background: #f1f5f9; 
          display: flex; 
          align-items: flex-start; /* เปลี่ยนจาก center เป็น flex-start เพื่อให้เลื่อนลงมาได้ */
          justify-content: center; 
          padding: 60px 20px; /* เพิ่ม padding บนล่างเพื่อให้ตัวการ์ดไม่ติดขอบจอ */
        }
        .signup-container-box { 
          display: grid; 
          grid-template-columns: 350px 1fr; 
          width: 100%; 
          max-width: 1150px; 
          background: #fff; 
          border-radius: 40px; 
          box-shadow: 0 25px 50px rgba(0,0,0,0.1); 
          overflow: hidden; /* ให้ banner และ form ตัดตามขอบโค้งมน */
        }

        .banner-side { 
          background: linear-gradient(135deg, #38bdf8, #22d3ee, #34d399); 
          padding: 50px 40px; 
          color: white; 
        }
        .banner-sticky-content {
          position: sticky;
          top: 100px; /* ให้ข้อความด้านซ้ายเลื่อนตามเวลาฟอร์มยาวๆ */
        }
        .banner-title { font-size: 36px; font-weight: 900; line-height: 1.1; margin: 20px 0; }
        .banner-desc { font-size: 15px; opacity: 0.9; line-height: 1.6; }
        .banner-footer { margin-top: 30px; font-size: 13px; opacity: 0.85; }
        
        .form-side { padding: 60px; }
        .form-header h2 { font-size: 28px; font-weight: 800; margin-bottom: 5px; }
        .form-header p { color: #64748b; font-size: 14px; margin-bottom: 30px; }
        
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; text-align: left; }
        .full-width { grid-column: span 2; }
        .section-divider { grid-column: span 2; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-top: 30px; font-weight: 800; font-size: 16px; display: flex; align-items: baseline; gap: 10px; }
        .custom-select { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; outline: none; font-size: 14px; }
        .traveler-box { background: #fdfdfd; padding: 20px; border-radius: 30px; border: 1px solid #f1f5f9; }
        
        .btn-submit { width: 100%; padding: 18px; border-radius: 50px; border: none; color: white; font-weight: bold; margin-top: 40px; cursor: pointer; transition: 0.3s; font-size: 16px; }
        .btn-submit.user { background: #0ea5e9; }
        .btn-submit.business { background: #10b981; }
        .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
        
        .login-link-text { text-align: center; margin-top: 25px; font-size: 14px; color: #64748b; }
        .login-link-text a { color: #0ea5e9; font-weight: 700; text-decoration: none; }

        @media (max-width: 1024px) {
          .signup-container-box { grid-template-columns: 1fr; }
          .banner-side { display: none; }
          .form-side { padding: 40px 25px; }
        }
      `}</style>
    </div>
  );
}

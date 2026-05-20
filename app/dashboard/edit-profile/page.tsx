"use client";

import "./edit-profile.css";
import Link from "next/link";

import InputField from "@/components/ui/InputField";
import SelectField from "@/components/ui/SelectField";

import BusinessSectionTitle from "@/components/business/BusinessSectionTitle";

export default function EditBusinessProfilePage() {
  return (
    <div className="edit-container">
      <div className="edit-card">

        <div className="edit-header">
          <h2>แก้ไขข้อมูลโปรไฟล์</h2>

          <p>
            จัดการข้อมูลปัจจุบันของคุณให้เป็นเวอร์ชันล่าสุด
          </p>
        </div>

        <form>
          <div className="form-grid">

            <BusinessSectionTitle
              title="ข้อมูลส่วนตัว"
              subtitle="PERSONAL INFORMATION"
            />

            <InputField
              label="ชื่อจริง"
              labelEn="FIRST NAME"
              required
              value="สมชาย"
            />

            <InputField
              label="นามสกุล"
              labelEn="LAST NAME"
              required
              value="สายเที่ยว"
            />

            <InputField
              label="ชื่อที่ใช้แสดง"
              labelEn="DISPLAY NAME"
              required
              value="แอดมินน้ำตกเอราวัณ"
            />

            <SelectField
              label="เพศ"
              labelEn="GENDER"
              required
              value="male"
              options={[
                {
                  label: "ชาย | Male",
                  value: "male",
                },
                {
                  label: "หญิง | Female",
                  value: "female",
                },
                {
                  label: "อื่นๆ | Other",
                  value: "other",
                },
              ]}
            />

            <InputField
              label="เบอร์โทรศัพท์"
              labelEn="PHONE"
              required
              value="08xxxxxxxx"
            />

            <div className="full-width">
              <InputField
                label="อีเมล"
                labelEn="EMAIL ADDRESS"
                required
                type="email"
                value="admin@erawan.com"
              />
            </div>

            <BusinessSectionTitle
              title="ข้อมูลการติดต่อธุรกิจ"
              subtitle="BUSINESS CONTACTS"
            />

            <InputField
              label="เบอร์โทรศัพท์ติดต่อ"
              labelEn="BOOKING & INQUIRY"
              required
              value="0812345678"
            />

            <InputField
              label="ไลน์ไอดี"
              labelEn="LINE ID"
              value="@erawan_park"
            />

            <InputField
              label="เฟซบุ๊ก"
              labelEn="FACEBOOK"
              placeholder="ชื่อเพจ หรือ URL"
            />

            <InputField
              label="อินสตาแกรม"
              labelEn="INSTAGRAM"
              placeholder="@username"
            />

            <InputField
              label="ติ๊กต็อก"
              labelEn="TIKTOK"
              placeholder="@username"
            />

            <BusinessSectionTitle
              title="ความปลอดภัยบัญชี"
              subtitle="ACCOUNT SECURITY"
            />

            <InputField
              label="รหัสผ่านใหม่"
              labelEn="NEW PASSWORD"
              type="password"
              placeholder="ปล่อยว่างหากไม่ต้องการเปลี่ยน"
            />

            <InputField
              label="ยืนยันรหัสผ่านใหม่"
              labelEn="CONFIRM NEW PASSWORD"
              type="password"
              placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง"
            />

            <div className="full-width security-box">
              <label className="security-label">
                กรุณากรอกรหัสผ่านปัจจุบันเพื่อบันทึกการเปลี่ยนแปลง
                <span className="required">*</span>
              </label>

              <input
                type="password"
                className="form-control"
                placeholder="Current Password"
              />

              <p className="security-note">
                * จำเป็นต้องระบุเพื่อยืนยันตัวตน
              </p>
            </div>

          </div>

          <div className="btn-group">

            <Link
              href="/business/dashboard"
              className="btn-cancel"
            >
              ยกเลิก
            </Link>

            <button
              type="submit"
              className="btn-save"
            >
              💾 บันทึกการเปลี่ยนแปลง
            </button>

          </div>
        </form>

      </div>
    </div>
  );
}
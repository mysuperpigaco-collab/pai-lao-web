"use client";

import Link from "next/link";
import WatermarkSettings from "@/components/account/WatermarkSettings";

export default function WatermarkPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--pl-bg, #f8fafc)", padding: "32px 20px 80px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--pl-text-secondary, #64748b)", textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
            ← กลับ · Back
          </Link>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--pl-text-primary, #0f172a)", margin: "0 0 4px" }}>🖼️ ลายน้ำกันดึงรูป</h1>
        <p style={{ fontSize: 14, color: "var(--pl-text-secondary, #64748b)", margin: "0 0 8px", lineHeight: 1.6 }}>
          ออกแบบลายน้ำของคุณเอง แล้วมันจะถูกฝังลงรูปทุกใบที่อัปโหลดใหม่ (ปกทริป/สถานที่ + แกลเลอรี) เพื่อกันการนำรูปไปใช้
        </p>
        <WatermarkSettings />
      </div>
    </div>
  );
}

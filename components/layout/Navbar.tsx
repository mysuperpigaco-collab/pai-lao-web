"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, isLoading, logout } = useAuth();

  const dashboardHref = user?.role === "BUSINESS" ? "/business/dashboard" : "/dashboard";
  const avatarInitial = user ? (user.displayName || user.firstName).charAt(0).toUpperCase() : "";

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 1000,
      background: "#ffffff", height: "80px",
      display: "flex", alignItems: "center", justifyContent: "center",
      borderBottom: "1px solid #eeeeee",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
    }}>
      <div style={{
        width: "100%", maxWidth: "1200px", padding: "0 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>

        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{ fontSize: "30px" }}>💬</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "900", lineHeight: 1 }}>
              <span style={{ color: "#3b82f6" }}>ไป</span><span style={{ color: "#10b981" }}>เล่า</span>
            </h1>
            <p style={{ margin: 0, fontSize: "9px", color: "#999", fontWeight: "bold" }}>PAI-LAO EXPERIENCE</p>
          </div>
        </Link>

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", background: "#f3f4f6",
          borderRadius: "50px", padding: "4px 15px", flex: "0 1 450px", border: "1px solid #e5e7eb"
        }}>
          <select style={{ background: "none", border: "none", padding: "8px", outline: "none", fontSize: "14px", borderRight: "1px solid #ddd", cursor: "pointer" }}>
            <option>ทริป</option>
            <option>ที่เที่ยว</option>
          </select>
          <input type="text" placeholder="ค้นหาทริปหรือสถานที่..." style={{ background: "none", border: "none", padding: "8px 15px", width: "100%", outline: "none", fontSize: "14px" }} />
          <span style={{ cursor: "pointer" }}>🔍</span>
        </div>

        {/* Auth Zone */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {isLoading ? (
            <div style={{ width: "80px", height: "36px", background: "#f1f5f9", borderRadius: "50px" }} />
          ) : user ? (
            /* ── logged in ── */
            <>
              <Link href="/trips/create" style={{
                textDecoration: "none", color: "#3b82f6", fontWeight: "700", fontSize: "14px"
              }}>
                + เขียนทริป
              </Link>

              <Link href={dashboardHref} style={{
                display: "flex", alignItems: "center", gap: "8px", textDecoration: "none"
              }}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0" }} />
                ) : (
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #3b82f6, #10b981)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: "800", fontSize: "15px"
                  }}>
                    {avatarInitial}
                  </div>
                )}
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                  {user.displayName || user.firstName}
                </span>
              </Link>

              <button onClick={logout} style={{
                background: "none", border: "1px solid #e2e8f0", borderRadius: "10px",
                padding: "8px 14px", fontSize: "13px", color: "#64748b", cursor: "pointer",
                fontWeight: "600"
              }}>
                ออกจากระบบ
              </button>
            </>
          ) : (
            /* ── not logged in ── */
            <>
              <Link href="/login" style={{
                textDecoration: "none", color: "#3b82f6", fontWeight: "700",
                fontSize: "14px", textTransform: "uppercase"
              }}>
                เข้าสู่ระบบ
              </Link>
              <Link href="/signup" style={{
                textDecoration: "none", background: "#10b981", color: "#ffffff",
                padding: "12px 25px", borderRadius: "12px", fontWeight: "700",
                fontSize: "14px", textTransform: "uppercase",
                boxShadow: "0 4px 6px rgba(16,185,129,0.2)", display: "inline-block"
              }}>
                สมัครสมาชิก
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

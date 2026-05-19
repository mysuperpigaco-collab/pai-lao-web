"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconPencil = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/>
  </svg>
);
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

export default function Navbar() {
  const { user, isLoading, logout } = useAuth();

  const dashboardHref = user?.role === "BUSINESS" ? "/business/dashboard" : "/dashboard";
  const avatarInitial = user ? (user.displayName || user.firstName).charAt(0).toUpperCase() : "";

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 1000,
      background: "#ffffff",
      borderBottom: "1px solid #e8f5e9",
    }}>
      {/* ── Gradient accent bar (top) ── */}
      <div style={{
        height: "3px",
        background: "linear-gradient(90deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)",
      }} />

      <div style={{
        maxWidth: "1200px", margin: "0 auto", padding: "0 20px",
        height: "66px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: "16px",
      }}>

        {/* ── Logo ── */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
          {/* Icon badge */}
          <div style={{
            width: "42px", height: "42px", borderRadius: "14px",
            background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "20px", boxShadow: "0 4px 12px rgba(16,185,129,0.35)",
            flexShrink: 0,
          }}>
            🗺️
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{
              fontSize: "28px", fontWeight: 900, letterSpacing: "-0.5px",
              background: "linear-gradient(90deg, #059669 0%, #0891b2 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              ไปเล่า
            </span>
            <span style={{
              fontSize: "9px", fontWeight: 800, letterSpacing: "2.5px",
              color: "#94a3b8", textTransform: "uppercase", marginTop: "1px",
            }}>
              PAI · LAO
            </span>
          </div>
        </Link>

        {/* ── Search ── */}
        <div style={{
          display: "flex", alignItems: "center",
          background: "#f0fdf4",
          borderRadius: "14px", padding: "0 14px 0 10px",
          flex: "0 1 420px", border: "1.5px solid #d1fae5",
          height: "42px", gap: "8px",
        }}>
          <select style={{
            background: "none", border: "none", padding: "0 8px 0 2px",
            outline: "none", fontSize: "13px", color: "#059669", fontWeight: 700,
            borderRight: "1.5px solid #a7f3d0", cursor: "pointer", height: "100%",
          }}>
            <option>ทริป</option>
            <option>ที่เที่ยว</option>
          </select>
          <input
            type="text"
            placeholder="ค้นหาทริปหรือสถานที่..."
            style={{
              background: "none", border: "none", flex: 1,
              outline: "none", fontSize: "13.5px", color: "#1e293b",
            }}
          />
          <span style={{ color: "#10b981", display: "flex" }}><IconSearch /></span>
        </div>

        {/* ── Auth Zone ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          {isLoading ? (
            <div style={{ width: "80px", height: "38px", background: "#f0fdf4", borderRadius: "12px" }} />
          ) : user ? (
            <>
              {/* Write / Add Place button — depends on role */}
              {user.role === "BUSINESS" ? (
                <Link href="/business/places/create" style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  textDecoration: "none", color: "#fff",
                  background: "linear-gradient(135deg, #10b981, #06b6d4)",
                  padding: "9px 16px", borderRadius: "12px",
                  fontWeight: 700, fontSize: "13px",
                  boxShadow: "0 3px 10px rgba(16,185,129,0.3)",
                  whiteSpace: "nowrap",
                }}>
                  <IconPlus /> เพิ่มสถานที่
                </Link>
              ) : (
                <Link href="/trips/create" style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  textDecoration: "none", color: "#fff",
                  background: "linear-gradient(135deg, #10b981, #06b6d4)",
                  padding: "9px 16px", borderRadius: "12px",
                  fontWeight: 700, fontSize: "13px",
                  boxShadow: "0 3px 10px rgba(16,185,129,0.3)",
                  whiteSpace: "nowrap",
                }}>
                  <IconPencil /> เขียนทริป
                </Link>
              )}

              {/* Avatar + name */}
              <Link href={dashboardHref} style={{
                display: "flex", alignItems: "center", gap: "8px",
                textDecoration: "none",
                background: "#f0fdf4", border: "1.5px solid #a7f3d0",
                borderRadius: "50px", padding: "4px 12px 4px 4px",
              }}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #10b981, #3b82f6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: 800, fontSize: "14px",
                  }}>
                    {avatarInitial}
                  </div>
                )}
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#065f46", maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.displayName || user.firstName}
                </span>
              </Link>

              {/* Logout */}
              <button onClick={logout} style={{
                background: "none", border: "1.5px solid #e2e8f0", borderRadius: "10px",
                padding: "8px 12px", fontSize: "12px", color: "#94a3b8", cursor: "pointer",
                fontWeight: 600, fontFamily: "inherit", transition: "0.2s",
              }}
                onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = "#fca5a5"; (e.target as HTMLButtonElement).style.color = "#ef4444"; }}
                onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = "#e2e8f0"; (e.target as HTMLButtonElement).style.color = "#94a3b8"; }}
              >
                ออก
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{
                textDecoration: "none", color: "#0891b2", fontWeight: 700,
                fontSize: "14px", padding: "8px 14px",
                border: "1.5px solid #a5f3fc", borderRadius: "10px",
                background: "#f0fdfe",
              }}>
                เข้าสู่ระบบ
              </Link>
              <Link href="/signup" style={{
                textDecoration: "none",
                background: "linear-gradient(135deg, #10b981, #06b6d4)",
                color: "#ffffff", padding: "10px 20px", borderRadius: "12px",
                fontWeight: 800, fontSize: "14px",
                boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
                whiteSpace: "nowrap",
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

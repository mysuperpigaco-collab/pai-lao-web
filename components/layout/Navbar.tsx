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
    <nav className="nb-nav">
      <style>{`
        .nb-nav {
          position: sticky; top: 0; z-index: 1000;
          background: #ffffff; border-bottom: 1px solid #e8f5e9;
        }
        .nb-accent {
          height: 3px;
          background: linear-gradient(90deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%);
        }
        .nb-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 16px;
          height: 60px;
          display: flex; justify-content: space-between; align-items: center;
          gap: 12px;
        }
        /* Logo */
        .nb-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; flex-shrink: 0;
        }
        .nb-logo-icon {
          width: 38px; height: 38px; border-radius: 12px;
          background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; box-shadow: 0 4px 12px rgba(16,185,129,0.35);
          flex-shrink: 0;
        }
        .nb-logo-text { display: flex; flex-direction: column; line-height: 1; }
        .nb-logo-th {
          font-size: 24px; font-weight: 900; letter-spacing: -0.5px;
          background: linear-gradient(90deg, #059669 0%, #0891b2 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .nb-logo-en {
          font-size: 8px; font-weight: 800; letter-spacing: 2.5px;
          color: #94a3b8; text-transform: uppercase; margin-top: 1px;
        }
        /* Desktop-only sections */
        .nb-links {
          display: flex; align-items: center; gap: 4px; flex-shrink: 0;
        }
        .nb-link {
          text-decoration: none; color: #475569; font-weight: 700;
          font-size: 13px; padding: 7px 12px; border-radius: 10px;
          transition: background 0.15s; white-space: nowrap;
        }
        .nb-link:hover { background: #f0fdf4; }
        .nb-search {
          display: flex; align-items: center;
          background: #f0fdf4; border-radius: 14px; padding: 0 14px 0 10px;
          flex: 0 1 360px; border: 1.5px solid #d1fae5;
          height: 42px; gap: 8px;
        }
        .nb-search select {
          background: none; border: none; padding: 0 8px 0 2px;
          outline: none; font-size: 13px; color: #059669; font-weight: 700;
          border-right: 1.5px solid #a7f3d0; cursor: pointer; height: 100%;
        }
        .nb-search input {
          background: none; border: none; flex: 1;
          outline: none; font-size: 13.5px; color: #1e293b; min-width: 0;
        }
        /* Auth zone */
        .nb-auth {
          display: flex; align-items: center; gap: 10px; flex-shrink: 0;
        }
        .nb-write-btn {
          display: flex; align-items: center; gap: 6px;
          text-decoration: none; color: #fff;
          background: linear-gradient(135deg, #10b981, #06b6d4);
          padding: 8px 14px; border-radius: 12px;
          font-weight: 700; font-size: 13px;
          box-shadow: 0 3px 10px rgba(16,185,129,0.3);
          white-space: nowrap;
        }
        .nb-avatar-link {
          display: flex; align-items: center; gap: 8px;
          text-decoration: none;
          background: #f0fdf4; border: 1.5px solid #a7f3d0;
          border-radius: 50px; padding: 4px 12px 4px 4px;
          flex-shrink: 0;
        }
        .nb-avatar-img { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; }
        .nb-avatar-circle {
          width: 30px; height: 30px; border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #3b82f6);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 800; font-size: 13px;
        }
        .nb-avatar-name {
          font-size: 13px; font-weight: 700; color: #065f46;
          max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .nb-logout {
          background: none; border: 1.5px solid #e2e8f0; border-radius: 10px;
          padding: 7px 12px; font-size: 12px; color: #94a3b8; cursor: pointer;
          font-weight: 600; font-family: inherit; transition: 0.2s; flex-shrink: 0;
        }
        .nb-logout:hover { border-color: #fca5a5; color: #ef4444; }
        .nb-login {
          text-decoration: none; color: #0891b2; font-weight: 700;
          font-size: 13px; padding: 7px 12px;
          border: 1.5px solid #a5f3fc; border-radius: 10px;
          background: #f0fdfe; white-space: nowrap;
        }
        .nb-signup {
          text-decoration: none;
          background: linear-gradient(135deg, #10b981, #06b6d4);
          color: #ffffff; padding: 9px 16px; border-radius: 12px;
          font-weight: 800; font-size: 13px;
          box-shadow: 0 4px 12px rgba(16,185,129,0.3);
          white-space: nowrap;
        }
        /* ── Mobile ── */
        @media (max-width: 768px) {
          .nb-links   { display: none; }
          .nb-search  { display: none; }
          .nb-avatar-name { display: none; }
          .nb-logout  { display: none; }
          .nb-write-btn { padding: 7px 10px; font-size: 12px; }
          .nb-write-btn span { display: none; }   /* hide text, keep icon */
          .nb-avatar-link { padding: 4px; border-radius: 50%; }
        }
      `}</style>

      {/* Accent bar */}
      <div className="nb-accent" />

      <div className="nb-inner">

        {/* Logo */}
        <Link href="/" className="nb-logo">
          <div className="nb-logo-icon">🗺️</div>
          <div className="nb-logo-text">
            <span className="nb-logo-th">ไปเล่า</span>
            <span className="nb-logo-en">PAI · LAO</span>
          </div>
        </Link>

        {/* Nav Links — desktop only */}
        <div className="nb-links">
          <Link href="/"       className="nb-link">🏠 หน้าแรก</Link>
          <Link href="/place"  className="nb-link">🗺️ สถานที่</Link>
          <Link href="/trips"  className="nb-link">✈️ ทริป</Link>
          <Link href="/planner" className="nb-link">📅 แพลนเนอร์</Link>
        </div>

        {/* Search — desktop only */}
        <div className="nb-search">
          <select>
            <option>ทริป</option>
            <option>ที่เที่ยว</option>
          </select>
          <input type="text" placeholder="ค้นหาทริปหรือสถานที่..." />
          <span style={{ color: "#10b981", display: "flex" }}><IconSearch /></span>
        </div>

        {/* Auth Zone */}
        <div className="nb-auth">
          {isLoading ? (
            <div style={{ width: "70px", height: "36px", background: "#f0fdf4", borderRadius: "12px" }} />
          ) : user ? (
            <>
              {/* Write / Add Place */}
              {user.role !== "ADMIN" && user.role !== "SUPERADMIN" && (
                user.role === "BUSINESS" ? (
                  <Link href="/business/places/create" className="nb-write-btn">
                    <IconPlus /><span>เพิ่มสถานที่</span>
                  </Link>
                ) : (
                  <Link href="/trips/create" className="nb-write-btn">
                    <IconPencil /><span>เขียนทริป</span>
                  </Link>
                )
              )}
              {(user.role === "ADMIN" || user.role === "SUPERADMIN") && (
                <Link href="/admin" className="nb-write-btn">
                  <IconPencil /><span>แอดมิน</span>
                </Link>
              )}

              {/* Avatar */}
              <Link href={dashboardHref} className="nb-avatar-link">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="nb-avatar-img" />
                ) : (
                  <div className="nb-avatar-circle">{avatarInitial}</div>
                )}
                <span className="nb-avatar-name">{user.displayName || user.firstName}</span>
              </Link>

              {/* Logout */}
              <button onClick={logout} className="nb-logout">ออก</button>
            </>
          ) : (
            <>
              <Link href="/login"  className="nb-login">เข้าสู่ระบบ</Link>
              <Link href="/signup" className="nb-signup">สมัครสมาชิก</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

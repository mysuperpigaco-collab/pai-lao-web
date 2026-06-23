"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMagneticButton } from "@/hooks/useMagneticButton";

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
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const magWrite = useMagneticButton();
  const magSignup = useMagneticButton();
  const [searchQ, setSearchQ] = useState("");
  const [searchType, setSearchType] = useState("ทริป");
  const [siteSettings, setSiteSettings] = useState<Record<string,string>>({});

  useEffect(() => {
    fetch("/api/settings").then(r=>r.json()).then(d=>setSiteSettings(d.settings||{}));
  }, []);

  // ปิดเมนูเมื่อคลิกนอก navbar
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // ปิดเมนูเมื่อ resize กลับขึ้น desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth > 768) setMenuOpen(false); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);


  const handleSearch = () => {
    const q = searchQ.trim();
    if (!q) return;
    const type = searchType === "ที่เที่ยว" ? "place" : "trip";
    router.push(`/search?q=${encodeURIComponent(q)}&type=${type}`);
  };

  const dashboardHref = user?.role === "BUSINESS" ? "/business/dashboard" : "/dashboard";
  const avatarInitial = user ? (user.displayName || user.firstName).charAt(0).toUpperCase() : "";

  // จำนวนฟีเจอร์ที่โชว์ใน navbar (มิชชัน/โปรโมชั่น) — โชว์เฉพาะตอน login เท่านั้น
  // ใช้กำหนด layout: เปิดครบ 2 จะซ่อนช่องค้นหา inline กันแถบล้น
  const featureCount = user
    ? (siteSettings.missionsEnabled === "true" ? 1 : 0) +
      (siteSettings.promotionsEnabled === "true" ? 1 : 0)
    : 0;

  return (
    <nav className={`nb-nav feat-${featureCount}`} ref={navRef}>
      <style>{`
        .nb-nav {
          position: sticky; top: 0; z-index: 1000;
          background: linear-gradient(135deg, rgba(5,150,105,0.80) 0%, rgba(8,145,178,0.80) 100%);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 2px 16px rgba(5,150,105,0.18);
        }
        .nb-inner {
          max-width: 1340px; margin: 0 auto; padding: 0 16px;
          height: 60px;
          /* รวมทุกเมนูเป็นกลุ่มเดียวแล้วจัดไว้กลางแถบ → ที่ว่างซ้าย-ขวาเหลือเท่ากัน */
          display: flex; justify-content: center; align-items: center;
          gap: 12px;
        }
        /* โซนซ้าย: โลโก้ + เมนู จับเป็นก้อนเดียวไม่ให้แตก */
        .nb-left {
          display: flex; align-items: center; gap: 10px; flex-shrink: 0;
        }
        /* Logo */
        .nb-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; flex-shrink: 0;
        }
        .nb-logo-icon {
          width: 38px; height: 38px; border-radius: 12px;
          background: rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          flex-shrink: 0; backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.3);
        }
        .nb-logo-text { display: flex; flex-direction: column; line-height: 1; }
        .nb-logo-th {
          font-size: 24px; font-weight: 900; letter-spacing: -0.5px;
          color: #ffffff;
          text-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }
        .nb-logo-en {
          font-size: 8px; font-weight: 800; letter-spacing: 2.5px;
          color: rgba(255,255,255,0.7); text-transform: uppercase; margin-top: 1px;
        }
        /* Desktop-only sections */
        .nb-links {
          display: flex; align-items: center; gap: 4px; flex-shrink: 0;
        }
        .nb-link {
          text-decoration: none; color: rgba(255,255,255,0.9); font-weight: 700;
          font-size: 13px; padding: 7px 12px; border-radius: 10px;
          transition: background 0.15s; white-space: nowrap;
        }
        .nb-link:hover { background: rgba(255,255,255,0.15); }
        .nb-link span { color: rgba(0,0,0,0.65) !important; }
        .nb-search {
          display: flex; align-items: center;
          background: rgba(255,255,255,0.18); border-radius: 14px; padding: 0 14px 0 10px;
          flex: 0 0 280px; min-width: 0;
          border: 1.5px solid rgba(255,255,255,0.35);
          height: 42px; gap: 8px; backdrop-filter: blur(4px);
        }
        .nb-search select {
          background: none; border: none; padding: 0 8px 0 2px;
          outline: none; font-size: 13px; color: #fff; font-weight: 700;
          border-right: 1.5px solid rgba(255,255,255,0.3); cursor: pointer; height: 100%;
        }
        .nb-search select option { color: #1e293b; background: #fff; }
        .nb-search input {
          background: none; border: none; flex: 1;
          outline: none; font-size: 13.5px; color: #fff; min-width: 0;
        }
        .nb-search input::placeholder { color: rgba(255,255,255,0.6); }
        /* Auth zone */
        .nb-auth {
          display: flex; align-items: center; gap: 10px; flex-shrink: 0;
        }
        .nb-write-btn {
          display: flex; align-items: center; gap: 6px;
          text-decoration: none; color: #059669;
          background: #ffffff;
          padding: 8px 14px; border-radius: 12px;
          font-weight: 800; font-size: 13px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          white-space: nowrap;
        }
        .nb-write-btn:hover { background: #f0fdf4; }
        .nb-avatar-link {
          display: flex; align-items: center; gap: 8px;
          text-decoration: none;
          background: rgba(255,255,255,0.2); border: 1.5px solid rgba(255,255,255,0.4);
          border-radius: 50px; padding: 4px 12px 4px 4px;
          flex-shrink: 0; backdrop-filter: blur(4px);
        }
        .nb-avatar-img { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; }
        .nb-avatar-circle {
          width: 30px; height: 30px; border-radius: 50%;
          background: rgba(255,255,255,0.3);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 800; font-size: 13px;
          border: 1.5px solid rgba(255,255,255,0.5);
        }
        .nb-avatar-name {
          font-size: 13px; font-weight: 700; color: #ffffff;
          max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .nb-logout {
          background: none; border: 1.5px solid rgba(255,255,255,0.35); border-radius: 10px;
          padding: 7px 12px; font-size: 12px; color: rgba(255,255,255,0.8); cursor: pointer;
          font-weight: 600; font-family: inherit; transition: 0.2s; flex-shrink: 0;
        }
        .nb-logout:hover { border-color: #fca5a5; color: #fca5a5; background: rgba(239,68,68,0.1); }
        .nb-login {
          text-decoration: none; color: #ffffff; font-weight: 700;
          font-size: 13px; padding: 7px 12px;
          border: 1.5px solid rgba(255,255,255,0.4); border-radius: 10px;
          background: rgba(255,255,255,0.15); white-space: nowrap;
        }
        .nb-login:hover { background: rgba(255,255,255,0.25); }
        .nb-signup {
          text-decoration: none;
          background: #ffffff;
          color: #059669; padding: 9px 16px; border-radius: 12px;
          font-weight: 800; font-size: 13px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          white-space: nowrap;
        }
        .nb-signup:hover { background: #f0fdf4; }
        /* Hamburger */
        .nb-hamburger {
          display: none; flex-direction: column; justify-content: center;
          gap: 5px; background: none; border: none; cursor: pointer;
          padding: 6px; border-radius: 10px; flex-shrink: 0;
        }
        .nb-hamburger span {
          display: block; width: 22px; height: 2.5px;
          background: rgba(255,255,255,0.9); border-radius: 2px;
          transition: all 0.25s;
        }
        /* Mobile drawer */
        .nb-mobile-menu {
          display: none; flex-direction: column;
          background: linear-gradient(135deg, #047857 0%, #0e7490 100%);
          border-top: 1px solid rgba(255,255,255,0.15);
          padding: 12px 16px 16px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        .nb-mobile-menu.open { display: flex; }
        .nb-m-link {
          text-decoration: none; color: rgba(255,255,255,0.92); font-weight: 700;
          font-size: 15px; padding: 12px 8px;
          border-bottom: 1px solid rgba(255,255,255,0.12);
        }
        .nb-m-link:last-child { border-bottom: none; }
        .nb-m-logout {
          margin-top: 8px; background: none; border: 1.5px solid rgba(252,165,165,0.6);
          border-radius: 10px; padding: 10px; font-size: 13px; color: #fca5a5;
          cursor: pointer; font-weight: 700; font-family: inherit; width: 100%;
        }
        /* Plan button */
        .nb-plan-btn {
          display: flex; align-items: center; gap: 6px;
          text-decoration: none; color: #ffffff;
          background: rgba(255,255,255,0.18); border: 1.5px solid rgba(255,255,255,0.35);
          padding: 7px 13px; border-radius: 12px;
          font-weight: 700; font-size: 13px; white-space: nowrap;
        }
        .nb-plan-btn:hover { background: rgba(255,255,255,0.28); }
        .nb-plan-btn span { color: rgba(255,255,255,0.7) !important; }
        /* ── ซ่อนช่องค้นหา inline เฉพาะตอนจอแคบเกินจะใส่ได้ครบ (อิงจำนวนฟีเจอร์)
              จอกว้างของจริงจะโชว์ search เสมอ และจัดสมดุลช่องว่าง 2 ข้างเท่ากัน ── */
        @media (max-width: 1080px) { .nb-search { display: none; } }
        @media (max-width: 1180px) { .nb-nav.feat-1 .nb-search { display: none; } }
        @media (max-width: 1300px) { .nb-nav.feat-2 .nb-search { display: none; } }
        /* ── Mobile ── */
        @media (max-width: 768px) {
          .nb-inner        { justify-content: space-between; }
          .nb-links        { display: none; }
          .nb-search       { display: none; }
          .nb-avatar-name  { display: none; }
          .nb-logout       { display: none; }
          .nb-plan-btn     { display: none; }
          .nb-feature-link { display: none; }
          .nb-write-btn    { padding: 7px 10px; font-size: 12px; }
          .nb-write-btn span { display: none; }
          .nb-avatar-link  { padding: 4px; border-radius: 50%; }
          .nb-hamburger    { display: flex; }
          /* ── ยังไม่ล็อกอิน: ปุ่ม Login/Signup จัดไทย-อังกฤษ 2 บรรทัด ให้พอดีจอแคบ
                (ตอนล็อกอินแล้ว ปุ่มพวกนี้ไม่ถูก render — เมนูยุบเป็นแฮมเบอร์เกอร์ตามเดิม) ── */
          .nb-login, .nb-signup {
            display: flex; flex-direction: column; align-items: center;
            line-height: 1.15; font-size: 12px; padding: 6px 10px;
          }
          .nb-btn-sep { display: none; }
          .nb-btn-en  { font-size: 9px; opacity: 0.85; font-weight: 700; }
        }
      `}</style>

      <div className="nb-inner">

        {/* ── โซนซ้าย: โลโก้ + เมนู (จับกลุ่มไว้เป็นก้อนเดียว เพื่อให้ space-between
              เหลือช่องว่างซ้าย/ขวาของช่องค้นหาเท่ากัน) ── */}
        <div className="nb-left">
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
            <Link href="/"      className="nb-link">🏠 หน้าแรก <span style={{fontSize:12,color:"#94a3b8",fontWeight:700}}>Home</span></Link>
            <Link href="/place" className="nb-link">🗺️ สถานที่ <span style={{fontSize:12,color:"#94a3b8",fontWeight:700}}>Places</span></Link>
            <Link href="/trips" className="nb-link">✈️ ทริป <span style={{fontSize:12,color:"#94a3b8",fontWeight:700}}>Trips</span></Link>
          </div>
        </div>

        {/* Search — desktop only, จัดกึ่งกลาง ขนาดพอดีคำ */}
        <div className="nb-search">
          <select value={searchType} onChange={e => setSearchType(e.target.value)}>
            <option value="ทริป">ทริป · Trips</option>
            <option value="ที่เที่ยว">ที่เที่ยว · Places</option>
          </select>
          <input
            type="text"
            placeholder="ค้นหา · Search trips, places..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
          <button
            type="button"
            onClick={handleSearch}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "#10b981" }}
          >
            <IconSearch />
          </button>
        </div>

        {/* Auth Zone */}
        <div className="nb-auth">
          {isLoading ? (
            <div style={{ width: "70px", height: "36px", background: "#f0fdf4", borderRadius: "12px" }} />
          ) : user ? (
            <>
              {siteSettings.missionsEnabled === "true" && <Link href="/missions" className="nb-link nb-feature-link">🎯 ภารกิจ <span style={{fontSize:11,fontWeight:700,color:"rgba(0,0,0,0.75)"}}>Missions</span></Link>}
              {siteSettings.promotionsEnabled === "true" && <Link href="/promotions" className="nb-link nb-feature-link">🎁 โปรโมชั่น <span style={{fontSize:11,fontWeight:700,color:"rgba(0,0,0,0.75)"}}>Deals</span></Link>}
              {/* Plan button — desktop only, for USER role · วางไว้ติดปุ่มเขียนทริป */}
              {user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.role !== "BUSINESS" && (
                <Link href="/planner" className="nb-plan-btn">📅 วางแผนเที่ยว <span style={{fontSize:12,opacity:0.85,fontWeight:700}}>Planner</span></Link>
              )}
              {/* Write / Add Place */}
              {user.role !== "ADMIN" && user.role !== "SUPERADMIN" && (
                user.role === "BUSINESS" ? (
                  <Link ref={magWrite.ref} onMouseMove={magWrite.onMouseMove} onMouseLeave={magWrite.onMouseLeave} href="/business/places/create" className="nb-write-btn">
                    <IconPlus /><span>เพิ่มสถานที่ · Add Place</span>
                  </Link>
                ) : (
                  <Link ref={magWrite.ref} onMouseMove={magWrite.onMouseMove} onMouseLeave={magWrite.onMouseLeave} href="/trips/create" className="nb-write-btn">
                    <IconPencil /><span>เขียนทริป · Write</span>
                  </Link>
                )
              )}
              {(user.role === "ADMIN" || user.role === "SUPERADMIN") && (
                <Link ref={magWrite.ref} onMouseMove={magWrite.onMouseMove} onMouseLeave={magWrite.onMouseLeave} href="/admin" className="nb-write-btn">
                  <IconPencil /><span>แอดมิน · Admin</span>
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
              <button onClick={logout} className="nb-logout">ออก · Logout</button>
            </>
          ) : (
            <>
              <Link href="/login"  className="nb-login"><span className="nb-btn-th">เข้าสู่ระบบ</span><span className="nb-btn-sep">&nbsp;·&nbsp;</span><span className="nb-btn-en">Login</span></Link>
              <Link ref={magSignup.ref} onMouseMove={magSignup.onMouseMove} onMouseLeave={magSignup.onMouseLeave} href="/signup" className="nb-signup"><span className="nb-btn-th">สมัครสมาชิก</span><span className="nb-btn-sep">&nbsp;·&nbsp;</span><span className="nb-btn-en">Sign up</span></Link>
            </>
          )}
        </div>

        {/* Hamburger — mobile only, far right */}
        <button className="nb-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="เมนู">
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile dropdown menu */}
      <div className={`nb-mobile-menu${menuOpen ? " open" : ""}`}>
        <Link href="/"      className="nb-m-link" onClick={() => setMenuOpen(false)}>🏠 หน้าแรก · Home</Link>
        <Link href="/place" className="nb-m-link" onClick={() => setMenuOpen(false)}>🗺️ สถานที่ · Places</Link>
        <Link href="/trips" className="nb-m-link" onClick={() => setMenuOpen(false)}>✈️ ทริป · Trips</Link>
        {user?.role !== "ADMIN" && user?.role !== "SUPERADMIN" && user?.role !== "BUSINESS" && user && (
          <Link href="/planner" className="nb-m-link" onClick={() => setMenuOpen(false)}>📅 วางแผนเที่ยว · Planner</Link>
        )}
        {siteSettings.missionsEnabled === "true" && <Link href="/missions" className="nb-m-link" onClick={() => setMenuOpen(false)}>🎯 ภารกิจ · Missions</Link>}
        {siteSettings.promotionsEnabled === "true" && <Link href="/promotions" className="nb-m-link" onClick={() => setMenuOpen(false)}>🎁 โปรโมชั่น · Deals</Link>}
        {user && (
          <button className="nb-m-logout" onClick={() => { logout(); setMenuOpen(false); }}>
            ออกจากระบบ · Logout
          </button>
        )}
        {!user && !isLoading && (
          <>
            <Link href="/login"  className="nb-m-link" onClick={() => setMenuOpen(false)}>🔑 เข้าสู่ระบบ · Login</Link>
            <Link href="/signup" className="nb-m-link" onClick={() => setMenuOpen(false)}>✨ สมัครสมาชิก · Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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
const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function Navbar() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQ, setSearchQ] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";
  const dashboardHref = isAdmin ? "/admin"
    : user?.role === "BUSINESS" ? "/business/dashboard"
    : "/dashboard";
  const avatarInitial = user ? (user.displayName || user.firstName || "U").charAt(0).toUpperCase() : "";

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = searchQ.trim();
    if (!q) { inputRef.current?.focus(); return; }
    const params = new URLSearchParams({ q });
    if (searchType !== "all") params.set("type", searchType);
    router.push(`/search?${params.toString()}`);
    setMobileOpen(false);
  };

  const Avatar = () => user?.avatarUrl ? (
    <img src={user.avatarUrl} alt="" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
  ) : (
    <div style={{
      width: "32px", height: "32px", borderRadius: "50%",
      background: "linear-gradient(135deg, #10b981, #3b82f6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: 800, fontSize: "14px",
    }}>{avatarInitial}</div>
  );

  return (
    <>
      <nav style={{ position: "sticky", top: 0, zIndex: 1000, background: "#ffffff", borderBottom: "1px solid #e8f5e9" }}>
        {/* Gradient accent */}
        <div style={{ height: "3px", background: "linear-gradient(90deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)" }} />

        {/* ── Desktop bar ── */}
        <div className="nav-desktop" style={{
          maxWidth: "1200px", margin: "0 auto", padding: "0 20px",
          height: "66px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px",
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              width: "42px", height: "42px", borderRadius: "14px",
              background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px", boxShadow: "0 4px 12px rgba(16,185,129,0.35)", flexShrink: 0,
            }}>🗺️</div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
              <span style={{
                fontSize: "28px", fontWeight: 900, letterSpacing: "-0.5px",
                background: "linear-gradient(90deg, #059669 0%, #0891b2 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>ไปเล่า</span>
              <span style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "2.5px", color: "#94a3b8", textTransform: "uppercase", marginTop: "1px" }}>
                PAI · LAO
              </span>
            </div>
          </Link>

          {/* Nav links (desktop only) */}
          <div className="nav-links-desktop" style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
            {[
              { href: "/", label: "🏠 หน้าแรก · Home" },
              { href: "/place", label: "🗺️ สถานที่ · Places" },
              { href: "/trips", label: "✈️ ทริป · Trips" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} style={{
                textDecoration: "none", color: "#475569", fontWeight: 700, fontSize: "13px",
                padding: "7px 12px", borderRadius: "10px", transition: "0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f0fdf4")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                {label}
              </Link>
            ))}
          </div>

          {/* Search (desktop only) */}
          <form onSubmit={handleSearch} className="nav-search-desktop" style={{
            display: "flex", alignItems: "center",
            background: "#f0fdf4", borderRadius: "14px", padding: "0 6px 0 10px",
            flex: "0 1 380px", border: "1.5px solid #d1fae5", height: "42px", gap: "6px",
          }}>
            <select value={searchType} onChange={e => setSearchType(e.target.value)} style={{
              background: "none", border: "none", padding: "0 8px 0 2px",
              outline: "none", fontSize: "13px", color: "#059669", fontWeight: 700,
              borderRight: "1.5px solid #a7f3d0", cursor: "pointer", height: "100%",
            }}>
              <option value="all">ทั้งหมด</option>
              <option value="trip">ทริป</option>
              <option value="place">สถานที่</option>
            </select>
            <input ref={inputRef} type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="ค้นหาทริปหรือสถานที่..."
              style={{ background: "none", border: "none", flex: 1, outline: "none", fontSize: "13.5px", color: "#1e293b" }} />
            <button type="submit" style={{
              background: "linear-gradient(135deg, #10b981, #06b6d4)", border: "none", borderRadius: 10,
              width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "white", flexShrink: 0,
            }}><IconSearch /></button>
          </form>

          {/* Auth zone (desktop) */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
            {isLoading ? (
              <div style={{ width: "80px", height: "38px", background: "#f0fdf4", borderRadius: "12px" }} />
            ) : user ? (
              <>
                {isAdmin ? (
                  <Link href="/admin" style={{
                    display: "flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "#fff",
                    background: "linear-gradient(135deg, #1e40af, #4facfe)", padding: "9px 16px", borderRadius: "12px",
                    fontWeight: 700, fontSize: "13px", boxShadow: "0 3px 10px rgba(79,172,254,0.3)", whiteSpace: "nowrap",
                  }}>🛡️ Admin Panel</Link>
                ) : user.role === "BUSINESS" ? (
                  <Link href="/business/places/create" style={{
                    display: "flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "#fff",
                    background: "linear-gradient(135deg, #10b981, #06b6d4)", padding: "9px 16px", borderRadius: "12px",
                    fontWeight: 700, fontSize: "13px", boxShadow: "0 3px 10px rgba(16,185,129,0.3)", whiteSpace: "nowrap",
                  }}><IconPlus /> เพิ่มสถานที่</Link>
                ) : (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Link href="/planner" style={{
                      display: "flex", alignItems: "center", gap: "6px", textDecoration: "none",
                      color: "#0f766e", background: "#f0fdfa", border: "1.5px solid #99f6e4",
                      padding: "8px 14px", borderRadius: "12px", fontWeight: 700, fontSize: "13px", whiteSpace: "nowrap",
                    }}>📅 วางแผน</Link>
                    <Link href="/trips/create" style={{
                      display: "flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "#fff",
                      background: "linear-gradient(135deg, #10b981, #06b6d4)", padding: "8px 14px", borderRadius: "12px",
                      fontWeight: 700, fontSize: "13px", boxShadow: "0 3px 10px rgba(16,185,129,0.3)", whiteSpace: "nowrap",
                    }}><IconPencil /> เขียนทริป</Link>
                  </div>
                )}
                <Link href={dashboardHref} style={{
                  display: "flex", alignItems: "center", gap: "8px", textDecoration: "none",
                  background: "#f0fdf4", border: "1.5px solid #a7f3d0",
                  borderRadius: "50px", padding: "4px 12px 4px 4px",
                }}>
                  <Avatar />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#065f46", maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.displayName || user.firstName}
                  </span>
                </Link>
                <button onClick={logout} style={{
                  background: "none", border: "1.5px solid #e2e8f0", borderRadius: "10px",
                  padding: "8px 12px", fontSize: "12px", color: "#94a3b8", cursor: "pointer",
                  fontWeight: 600, fontFamily: "inherit",
                }}>ออก</button>
              </>
            ) : (
              <>
                <Link href="/login" style={{
                  textDecoration: "none", color: "#0891b2", fontWeight: 700, fontSize: "14px",
                  padding: "8px 14px", border: "1.5px solid #a5f3fc", borderRadius: "10px", background: "#f0fdfe",
                }}>เข้าสู่ระบบ</Link>
                <Link href="/signup" style={{
                  textDecoration: "none", background: "linear-gradient(135deg, #10b981, #06b6d4)",
                  color: "#ffffff", padding: "10px 20px", borderRadius: "12px",
                  fontWeight: 800, fontSize: "14px", boxShadow: "0 4px 12px rgba(16,185,129,0.3)", whiteSpace: "nowrap",
                }}>สมัครสมาชิก</Link>
              </>
            )}
          </div>
        </div>

        {/* ── Mobile bar ── */}
        <div className="nav-mobile" style={{ padding: "0 14px", height: "54px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          {/* Logo (compact) */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              width: "34px", height: "34px", borderRadius: "11px",
              background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px",
            }}>🗺️</div>
            <span style={{
              fontSize: "22px", fontWeight: 900, letterSpacing: "-0.5px",
              background: "linear-gradient(90deg, #059669 0%, #0891b2 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>ไปเล่า</span>
          </Link>

          {/* Mobile right: search icon + avatar + hamburger */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={() => router.push("/search")} style={{
              background: "#f0fdf4", border: "1.5px solid #d1fae5", borderRadius: "10px",
              width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#059669",
            }}><IconSearch /></button>

            {!isLoading && user && (
              <Link href={dashboardHref} style={{ textDecoration: "none" }}>
                <Avatar />
              </Link>
            )}
            {!isLoading && !user && (
              <Link href="/login" style={{
                textDecoration: "none", background: "linear-gradient(135deg, #10b981, #06b6d4)",
                color: "#fff", padding: "7px 14px", borderRadius: "10px", fontWeight: 700, fontSize: "13px",
              }}>เข้าสู่ระบบ</Link>
            )}

            <button onClick={() => setMobileOpen(o => !o)} style={{
              background: mobileOpen ? "#f0fdf4" : "none",
              border: "1.5px solid #e2e8f0", borderRadius: "10px",
              width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#475569",
            }}>
              {mobileOpen ? <IconX /> : <IconMenu />}
            </button>
          </div>
        </div>

        {/* ── Mobile dropdown menu ── */}
        {mobileOpen && (
          <div className="nav-mobile" style={{
            borderTop: "2px solid #f0fdf4",
            background: "#fff",
            boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
          }}>

            {/* ── Search bar ── */}
            <div style={{ padding: "14px 16px 0" }}>
              <form onSubmit={handleSearch} style={{
                display: "flex", alignItems: "center",
                background: "#f8fafc", borderRadius: "14px",
                border: "1.5px solid #e2e8f0", height: "46px",
                padding: "0 8px 0 14px", gap: "8px",
              }}>
                <span style={{ color: "#94a3b8", flexShrink: 0 }}><IconSearch /></span>
                <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="ค้นหาทริปหรือสถานที่..."
                  style={{ background: "none", border: "none", flex: 1, outline: "none", fontSize: "15px", color: "#1e293b" }} />
                <button type="submit" style={{
                  background: "linear-gradient(135deg, #10b981, #06b6d4)", border: "none",
                  borderRadius: "10px", padding: "6px 14px", cursor: "pointer",
                  color: "white", fontSize: "13px", fontWeight: 700, fontFamily: "inherit", flexShrink: 0,
                }}>ค้นหา</button>
              </form>
            </div>

            {/* ── Nav links ── */}
            <div style={{ padding: "10px 10px 0" }}>
              {[
                { href: "/", icon: "🏠", th: "หน้าแรก", en: "Home" },
                { href: "/place", icon: "🗺️", th: "สถานที่", en: "Places" },
                { href: "/trips", icon: "✈️", th: "ทริป", en: "Trips" },
              ].map(({ href, icon, th, en }) => (
                <Link key={href} href={href} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  textDecoration: "none", padding: "13px 12px",
                  borderRadius: "12px", transition: "background 0.15s",
                }}>
                  <span style={{ fontSize: "20px", width: "28px", textAlign: "center", flexShrink: 0 }}>{icon}</span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>{th}</span>
                    <span style={{ display: "block", fontSize: "12px", color: "#94a3b8", fontWeight: 600, marginTop: "1px" }}>{en}</span>
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
              ))}
            </div>

            {/* ── Divider ── */}
            <div style={{ margin: "10px 16px", borderTop: "1px solid #f1f5f9" }} />

            {/* ── Action buttons (logged in, normal user) ── */}
            {!isLoading && user && !isAdmin && user.role !== "BUSINESS" && (
              <div style={{ padding: "0 10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <Link href="/planner" style={{
                  textDecoration: "none", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: "6px",
                  padding: "14px 10px", borderRadius: "14px",
                  background: "#f0fdfa", border: "1.5px solid #99f6e4",
                }}>
                  <span style={{ fontSize: "22px" }}>📅</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f766e", textAlign: "center" }}>วางแผนเที่ยว</span>
                </Link>
                <Link href="/trips/create" style={{
                  textDecoration: "none", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: "6px",
                  padding: "14px 10px", borderRadius: "14px",
                  background: "linear-gradient(135deg, #10b981, #06b6d4)",
                  boxShadow: "0 3px 10px rgba(16,185,129,0.25)",
                }}>
                  <span style={{ fontSize: "22px" }}>✏️</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff", textAlign: "center" }}>เขียนทริป</span>
                </Link>
              </div>
            )}

            {/* Admin action */}
            {!isLoading && user && isAdmin && (
              <div style={{ padding: "0 10px" }}>
                <Link href="/admin" style={{
                  textDecoration: "none", display: "flex", alignItems: "center", gap: "10px",
                  padding: "13px 16px", borderRadius: "14px",
                  background: "linear-gradient(135deg, #1e40af, #4facfe)",
                  boxShadow: "0 3px 10px rgba(79,172,254,0.25)",
                }}>
                  <span style={{ fontSize: "20px" }}>🛡️</span>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>Admin Panel</span>
                </Link>
              </div>
            )}

            {/* Business action */}
            {!isLoading && user && user.role === "BUSINESS" && (
              <div style={{ padding: "0 10px" }}>
                <Link href="/business/places/create" style={{
                  textDecoration: "none", display: "flex", alignItems: "center", gap: "10px",
                  padding: "13px 16px", borderRadius: "14px",
                  background: "linear-gradient(135deg, #10b981, #06b6d4)",
                  boxShadow: "0 3px 10px rgba(16,185,129,0.25)",
                }}>
                  <span style={{ fontSize: "20px" }}>➕</span>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>เพิ่มสถานที่</span>
                </Link>
              </div>
            )}

            {/* ── User profile row + logout (logged in) ── */}
            {!isLoading && user && (
              <>
                <div style={{ margin: "10px 16px", borderTop: "1px solid #f1f5f9" }} />
                <div style={{ padding: "0 10px 6px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <Link href={dashboardHref} style={{
                    flex: 1, textDecoration: "none",
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "10px 12px", borderRadius: "14px", background: "#f8fafc",
                  }}>
                    <Avatar />
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                        {user.displayName || user.firstName}
                      </div>
                      <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>ดูโปรไฟล์</div>
                    </div>
                  </Link>
                  <button onClick={() => { logout(); setMobileOpen(false); }} style={{
                    background: "#fff5f5", border: "1.5px solid #fecaca", borderRadius: "12px",
                    padding: "10px 14px", fontSize: "13px", color: "#ef4444",
                    cursor: "pointer", fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap",
                  }}>ออก</button>
                </div>
              </>
            )}

            {/* ── Login / Signup (logged out) ── */}
            {!isLoading && !user && (
              <div style={{ padding: "0 10px 6px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <Link href="/login" style={{
                  textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "13px", borderRadius: "14px",
                  border: "1.5px solid #a5f3fc", background: "#f0fdfe",
                  fontSize: "14px", fontWeight: 700, color: "#0891b2",
                }}>เข้าสู่ระบบ</Link>
                <Link href="/signup" style={{
                  textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "13px", borderRadius: "14px",
                  background: "linear-gradient(135deg, #10b981, #06b6d4)",
                  fontSize: "14px", fontWeight: 800, color: "#fff",
                  boxShadow: "0 3px 10px rgba(16,185,129,0.3)",
                }}>สมัครสมาชิก</Link>
              </div>
            )}

            <div style={{ height: "12px" }} />
          </div>
        )}
      </nav>
    </>
  );
}

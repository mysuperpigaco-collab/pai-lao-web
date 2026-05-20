"use client";
import "./admin.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface MeUser {
  id: string;
  username: string;
  displayName?: string | null;
  firstName: string;
  avatarUrl?: string | null;
  role: string;
}

const NAV_ADMIN = [
  { group: "ภาพรวม", items: [
    { href: "/admin",           icon: "🏠", label: "Dashboard" },
    { href: "/admin/analytics", icon: "📊", label: "Analytics" },
  ]},
  { group: "จัดการเนื้อหา", items: [
    { href: "/admin/trips",  icon: "🗺️", label: "ทริป" },
    { href: "/admin/places", icon: "📍", label: "สถานที่" },
  ]},
  { group: "ชุมชน", items: [
    { href: "/admin/users",   icon: "👥", label: "ผู้ใช้งาน" },
    { href: "/admin/reports", icon: "🚩", label: "รายงาน", alert: true },
  ]},
];

const NAV_SUPER = [
  { group: "ระบบ (Superadmin)", items: [
    { href: "/admin/permissions", icon: "🔑", label: "สิทธิ์การเข้าถึง", super: true },
    { href: "/admin/logs",        icon: "📋", label: "บันทึกระบบ",       super: true },
    { href: "/admin/database",    icon: "🗄️", label: "Database",         super: true },
  ]},
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [me, setMe]             = useState<MeUser | null>(null);
  const [pendingReports, set]   = useState(0);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        const u = d.user;
        if (!u || (u.role !== "ADMIN" && u.role !== "SUPERADMIN")) {
          router.replace("/");
          return;
        }
        setMe(u);
        setLoading(false);
      })
      .catch(() => { router.replace("/"); });
  }, [router]);

  useEffect(() => {
    if (!me) return;
    fetch("/api/admin/reports?status=PENDING&limit=1")
      .then(r => r.json())
      .then(d => set(d.total || 0));
  }, [me]);

  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#0f172a", color:"#64748b", fontSize:"0.9rem" }}>
        กำลังโหลด...
      </div>
    );
  }
  if (!me) return null;

  const isSuperAdmin = me.role === "SUPERADMIN";
  const displayName  = me.displayName || me.firstName || me.username;

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="adm-shell">
      {/* Sidebar */}
      <aside className="adm-sidebar">
        <div className="adm-logo">
          <div className="adm-logo-title">🗺️ ไปเล่า</div>
          <div className="adm-logo-sub">Admin Panel</div>
          <span className={`adm-logo-badge ${isSuperAdmin ? "superadmin" : "admin"}`}>
            {isSuperAdmin ? "⚡ Superadmin" : "Admin"}
          </span>
        </div>

        <nav className="adm-nav">
          {NAV_ADMIN.map(group => (
            <div className="adm-nav-group" key={group.group}>
              <div className="adm-nav-label">{group.group}</div>
              {group.items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`adm-nav-link${isActive(item.href) ? " active" : ""}`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.alert && pendingReports > 0 && (
                    <span className="adm-nav-badge">{pendingReports > 99 ? "99+" : pendingReports}</span>
                  )}
                </Link>
              ))}
            </div>
          ))}

          {isSuperAdmin && NAV_SUPER.map(group => (
            <div className="adm-nav-group" key={group.group}>
              <div className="adm-nav-label">{group.group}</div>
              {group.items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`adm-nav-link superonly${isActive(item.href) ? " active" : ""}`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <div style={{ color:"#94a3b8", fontWeight:600 }}>{displayName}</div>
          <div style={{ marginTop:2 }}>@{me.username}</div>
          <Link href="/" style={{ color:"#4facfe", textDecoration:"none", marginTop:8, display:"block", fontSize:"0.75rem" }}>
            ← กลับหน้าหลัก
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="adm-main">
        {children}
      </main>
    </div>
  );
}

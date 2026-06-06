"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

type AuthUser = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatarUrl?: string | null;
  role: "TRAVELER" | "BUSINESS" | "ADMIN" | "SUPERADMIN";
  business?: {
    id: string;
    businessName: string;
    logoUrl?: string | null;
    isVerified: boolean;
  } | null;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<{ ok: boolean; message: string; role?: string; unverified?: boolean }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refresh = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const login = async (emailOrUsername: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, message: data.message || "เกิดข้อผิดพลาด", unverified: data.unverified };
      // ตั้ง user จาก login response ก่อน (เร็ว — มี displayName + business แล้ว)
      setUser(data.user);
      // refresh background เพื่อให้แน่ใจว่าข้อมูลครบและ cookie ใช้ได้
      refresh();
      return { ok: true, message: data.message, role: data.user?.role as string };
    } catch {
      return { ok: false, message: "ไม่สามารถเชื่อมต่อระบบได้" };
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

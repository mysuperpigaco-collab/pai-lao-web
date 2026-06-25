"use client";
import { createContext, useContext, useState, ReactNode } from "react";

// State ร่วมระหว่างแผนที่ (หมุด) กับไทม์ไลน์ (การ์ด) — ชี้จุดไหน อีกฝั่งไฮไลต์ตาม
type RouteHoverCtx = {
  activeId: string | null;
  setActiveId: (id: string | null) => void;
};

// ดีฟอลต์ no-op → component ที่ใช้ context นี้แต่ไม่ได้อยู่ใน provider (หน้า place/planner) จะทำงานเหมือนเดิมทุกอย่าง
const Ctx = createContext<RouteHoverCtx>({ activeId: null, setActiveId: () => {} });

export function useRouteHover() {
  return useContext(Ctx);
}

export function RouteHoverProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  return <Ctx.Provider value={{ activeId, setActiveId }}>{children}</Ctx.Provider>;
}

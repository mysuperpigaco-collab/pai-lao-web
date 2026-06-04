"use client";
import { useEffect } from "react";

/**
 * useViewCount — เรียก POST /api/{type}/{slug}/view ครั้งเดียวหลัง mount
 * ใช้ sessionStorage ป้องกัน count ซ้ำเมื่อ refresh
 */
export function useViewCount(type: "trips" | "places", slug: string) {
  useEffect(() => {
    if (!slug) return;
    const key = `viewed:${type}:${slug}`;
    if (sessionStorage.getItem(key)) return; // นับแล้วใน session นี้
    sessionStorage.setItem(key, "1");
    fetch(`/api/${type}/${slug}/view`, { method: "POST" }).catch(() => {});
  }, [type, slug]);
}

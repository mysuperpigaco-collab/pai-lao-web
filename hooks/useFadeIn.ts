"use client";
import { useEffect, useRef } from "react";

/**
 * useFadeIn — ผูก IntersectionObserver กับ container ref
 * elements ที่มี class "pl-fade" ใน container จะได้รับ class "pl-visible"
 * เมื่อ scroll เข้ามาในหน้าจอ
 *
 * ใช้งาน:
 *   const ref = useFadeIn();
 *   <div ref={ref}>
 *     <div className="pl-fade">card 1</div>
 *     <div className="pl-fade">card 2</div>
 *   </div>
 */
export function useFadeIn(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const targets = container.querySelectorAll<HTMLElement>(".pl-fade");
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("pl-visible");
            observer.unobserve(entry.target); // animate ครั้งเดียวพอ
          }
        });
      },
      { threshold }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}

/**
 * useSingleFadeIn — สำหรับ element เดี่ยว
 */
export function useSingleFadeIn(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("pl-visible");
          observer.disconnect();
        }
      },
      { threshold }
    );

    el.classList.add("pl-fade");
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}

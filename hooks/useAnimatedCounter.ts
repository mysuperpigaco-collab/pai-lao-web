"use client";
import { useEffect, useRef, useState } from "react";

/**
 * useAnimatedCounter — นับตัวเลขขึ้นเมื่อ element เข้ามาในหน้าจอ
 *
 * ใช้งาน:
 *   const { ref, value } = useAnimatedCounter(1234);
 *   <span ref={ref}>{value.toLocaleString()}</span>
 */
export function useAnimatedCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();

          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutExpo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };

          requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { ref, value };
}

"use client";
import { useRef, useCallback } from "react";

export function use3DTilt(maxTilt = 7) {
  const ref = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left)  / r.width  - 0.5;
      const y = (e.clientY - r.top)   / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${-y * maxTilt}deg) rotateY(${x * maxTilt}deg) scale3d(1.025,1.025,1.025)`;
      el.style.transition = "transform 0.08s linear";
    },
    [maxTilt]
  );

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    el.style.transition = "transform 0.45s cubic-bezier(0.22,1,0.36,1)";
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}

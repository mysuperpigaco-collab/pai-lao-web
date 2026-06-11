"use client";
import { useRef } from "react";

export function useMagneticButton() {
  const ref = useRef<HTMLElement>(null);

  function onMouseMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) * 0.38;
    const dy = (e.clientY - (r.top + r.height / 2)) * 0.38;
    el.style.translate = `${dx}px ${dy}px`;
    el.style.transition = "translate 0.1s ease";
  }

  function onMouseLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.translate = "0px 0px";
    el.style.transition = "translate 0.65s cubic-bezier(0.22, 1, 0.36, 1)";
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { ref: ref as React.RefObject<any>, onMouseMove, onMouseLeave };
}

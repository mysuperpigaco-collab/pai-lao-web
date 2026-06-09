"use client";
import { useEffect } from "react";

export default function RippleProvider() {
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>(
        "button:not([disabled]):not([data-no-ripple]), a[role=button]"
      );
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const d = Math.max(rect.width, rect.height) * 2.5;
      const x = e.clientX - rect.left - d / 2;
      const y = e.clientY - rect.top - d / 2;

      const wave = document.createElement("span");
      wave.style.cssText = [
        "position:absolute", "pointer-events:none", "border-radius:50%",
        `width:${d}px`, `height:${d}px`, `left:${x}px`, `top:${y}px`,
        "background:rgba(255,255,255,0.28)",
        "transform:scale(0)", "animation:pl-ripple 0.55s ease-out forwards",
        "z-index:99",
      ].join(";");

      const cs = getComputedStyle(btn);
      const wasStatic  = cs.position === "static";
      const wasVisible = cs.overflow !== "hidden";
      if (wasStatic)  btn.style.position = "relative";
      if (wasVisible) btn.style.overflow  = "hidden";

      btn.appendChild(wave);
      wave.addEventListener("animationend", () => {
        wave.remove();
        if (wasStatic)  btn.style.position = "";
        if (wasVisible) btn.style.overflow  = "";
      }, { once: true });
    };

    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, []);

  return null;
}

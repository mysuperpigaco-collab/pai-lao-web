import { useRef } from "react";

export function useTiltCard() {
  const cardRef  = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const r  = el.getBoundingClientRect();
    const x  = (e.clientX - r.left) / r.width;
    const y  = (e.clientY - r.top)  / r.height;
    const rx = (y - 0.5) * -16;
    const ry = (x - 0.5) *  16;
    el.style.transform  = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px) scale(1.02)`;
    el.style.boxShadow  = `0 22px 44px rgba(15,23,42,.18), 0 ${8+ry}px ${16-rx}px rgba(79,172,254,.12)`;
    el.style.transition = "transform .08s ease, box-shadow .08s ease";
    if (shineRef.current)
      shineRef.current.style.background = `radial-gradient(circle at ${x*100}% ${y*100}%, rgba(255,255,255,.22) 0%, transparent 65%)`;
  }

  function onLeave() {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform  = "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)";
    el.style.boxShadow  = "0 2px 12px rgba(15,23,42,.06)";
    el.style.transition = "transform .5s cubic-bezier(0.22,1,0.36,1), box-shadow .5s ease";
    if (shineRef.current) shineRef.current.style.background = "none";
  }

  const shineStyle: React.CSSProperties = {
    position: "absolute", inset: 0, zIndex: 5,
    borderRadius: "inherit", pointerEvents: "none",
  };

  return { cardRef, shineRef, onMove, onLeave, shineStyle };
}

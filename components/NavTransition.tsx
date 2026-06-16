"use client";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

/**
 * NavTransition — curtain-open animation on every client-side navigation.
 * Matches the SplashScreen "opening" phase: two perspective walls slide apart
 * revealing the new page underneath. Triggered when pathname changes (RSC done).
 */
export default function NavTransition() {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const leftRef  = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef   = useRef<number>(0);

  useLayoutEffect(() => {
    const wrap  = wrapRef.current;
    const left  = leftRef.current;
    const right = rightRef.current;
    if (!wrap || !left || !right) return;

    // Initial mount — keep hidden
    if (prevPath.current === pathname) {
      wrap.style.display = "none";
      return;
    }
    prevPath.current = pathname;

    // Cancel any in-progress animation
    if (timerRef.current) clearTimeout(timerRef.current);
    cancelAnimationFrame(rafRef.current);

    // Synchronously set walls to CLOSED position before browser paints
    // (same frame as loading.tsx unmount → no gap/flash)
    wrap.style.display = "block";
    left.style.transition  = "none";
    right.style.transition = "none";
    left.style.transform   = "perspective(1500px) rotateY(33deg)";
    right.style.transform  = "perspective(1500px) rotateY(-33deg)";
    left.style.opacity     = "1";
    right.style.opacity    = "1";

    // Next two frames: start opening animation (mirrors sp-open CSS)
    rafRef.current = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const trans = "transform 1.5s cubic-bezier(.7,0,.18,1), opacity 1.5s ease";
        left.style.transition  = trans;
        right.style.transition = trans;
        left.style.transform   = "perspective(1500px) rotateY(62deg) translateX(-34%)";
        right.style.transform  = "perspective(1500px) rotateY(-62deg) translateX(34%)";
        left.style.opacity     = "0";
        right.style.opacity    = "0";
      });
    });

    // Hide wrapper after animation completes
    timerRef.current = setTimeout(() => {
      if (wrapRef.current) wrapRef.current.style.display = "none";
    }, 1700);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [pathname]);

  const wallBase: React.CSSProperties = {
    position: "absolute", top: "-4%", height: "108%", width: "46%",
    background: "#070f1c",
    backgroundImage:
      "linear-gradient(rgba(16,185,129,.07) 1px,transparent 1px)," +
      "linear-gradient(90deg,rgba(16,185,129,.07) 1px,transparent 1px)",
    backgroundSize: "42px 42px",
    willChange: "transform, opacity",
  };
  const edgeBase: React.CSSProperties = {
    position: "absolute", top: 0, height: "100%", width: 3,
    background: "#34d399",
    boxShadow: "0 0 22px 5px rgba(52,211,153,.55),0 0 6px 1px rgba(52,211,153,.9)",
    borderRadius: 2,
  };

  return (
    <div
      ref={wrapRef}
      style={{
        display: "none", // starts hidden; shown by useLayoutEffect
        position: "fixed", inset: 0, zIndex: 9998,
        overflow: "hidden", pointerEvents: "none",
      }}
    >
      <div ref={leftRef} style={{ ...wallBase, left: 0, transformOrigin: "left center", opacity: 0 }}>
        <span style={{ ...edgeBase, right: 0 }} />
      </div>
      <div ref={rightRef} style={{ ...wallBase, right: 0, transformOrigin: "right center", opacity: 0 }}>
        <span style={{ ...edgeBase, left: 0 }} />
      </div>
    </div>
  );
}

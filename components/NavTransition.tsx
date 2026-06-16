"use client";
import { useLayoutEffect, useRef } from "react";

/**
 * NavTransition — curtain-open animation triggered by "pai-lao:curtain-open" event.
 * loading.tsx dispatches that event in its useLayoutEffect cleanup (fires sync before paint
 * when RSC finishes and loading screen unmounts). This catches it and plays the wall animation
 * that mirrors SplashScreen's "opening" phase.
 */
export default function NavTransition() {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const leftRef  = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef   = useRef<number>(0);

  useLayoutEffect(() => {
    const el    = wrapRef.current;
    const left  = leftRef.current;
    const right = rightRef.current;
    if (!el || !left || !right) return;

    el.style.display = "none"; // start hidden

    const openCurtain = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);

      // Snap walls to closed position (sync — fires before next paint)
      el.style.display       = "block";
      left.style.transition  = "none";
      right.style.transition = "none";
      left.style.transform   = "perspective(1500px) rotateY(33deg)";
      right.style.transform  = "perspective(1500px) rotateY(-33deg)";
      left.style.opacity     = "1";
      right.style.opacity    = "1";

      // Two rAFs: ensure transition:none is committed before adding transition
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

      timerRef.current = setTimeout(() => {
        if (wrapRef.current) wrapRef.current.style.display = "none";
      }, 1700);
    };

    document.addEventListener("pai-lao:curtain-open", openCurtain);
    return () => {
      document.removeEventListener("pai-lao:curtain-open", openCurtain);
      if (timerRef.current) clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

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
        display: "none",
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

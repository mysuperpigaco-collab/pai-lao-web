"use client";
import { useEffect, useRef, useState } from "react";

const PHRASES = [
  "กำลังโหลดแผนที่เส้นทาง...",
  "กำลังค้นหาสถานที่น่าเที่ยว...",
  "เตรียมเรื่องเล่าให้คุณ...",
  "กำลังวางแผนการเดินทาง...",
  "Loading your journey...",
];

const WAYPOINTS = [
  { x: 0.42, y: 0.10, label: "เชียงใหม่" },
  { x: 0.58, y: 0.21, label: "เลย" },
  { x: 0.70, y: 0.33, label: "อุบลฯ" },
  { x: 0.50, y: 0.44, label: "กรุงเทพฯ" },
  { x: 0.35, y: 0.57, label: "ประจวบฯ" },
  { x: 0.56, y: 0.69, label: "สุราษฎร์ธานี" },
  { x: 0.38, y: 0.84, label: "ภูเก็ต" },
];

export default function Loading() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const rafRef = useRef<number>(0);
  const [phraseIdx, setPhraseIdx] = useState(0);

  // Rotate phrases
  useEffect(() => {
    const id = setInterval(
      () => setPhraseIdx((p) => (p + 1) % PHRASES.length),
      2200,
    );
    return () => clearInterval(id);
  }, []);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!canvas) return;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx!.scale(dpr, dpr);
    }
    resize();

    function draw() {
      if (!canvas || !ctx) return;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const totalSegs = WAYPOINTS.length - 1;
      progressRef.current += 0.007;
      if (progressRef.current > totalSegs + 1.2) progressRef.current = 0;
      const drawn = Math.min(progressRef.current, totalSegs);
      const now = Date.now();

      // ── Draw path segments ──────────────────────────────────────────
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = 0; i < totalSegs; i++) {
        const segProg = Math.min(Math.max(drawn - i, 0), 1);
        if (segProg <= 0) break;

        const p0 = WAYPOINTS[i];
        const p1 = WAYPOINTS[i + 1];
        const x0 = p0.x * W;
        const y0 = p0.y * H;
        const x1 = x0 + (p1.x - p0.x) * W * segProg;
        const y1 = y0 + (p1.y - p0.y) * H * segProg;

        // Glow line
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(16,185,129,0.55)";
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // ── Draw waypoint pins ──────────────────────────────────────────
      WAYPOINTS.forEach((pt, i) => {
        const ptDrawn = drawn >= i - 0.05;
        if (!ptDrawn) return;

        const x = pt.x * W;
        const y = pt.y * H;
        const isHead = drawn >= i - 0.3 && drawn < i + 0.7;
        const isVisited = drawn >= i;
        const pulse = (Math.sin(now / 380) + 1) / 2;

        // Pulse rings on active pin
        if (isHead) {
          ctx.beginPath();
          ctx.arc(x, y, 14 + pulse * 8, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(16,185,129,${0.08 + pulse * 0.12})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(x, y, 8 + pulse * 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(16,185,129,${0.2 + pulse * 0.18})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Pin dot
        ctx.beginPath();
        ctx.arc(x, y, isHead ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isHead
          ? "#10b981"
          : isVisited
            ? "rgba(16,185,129,0.5)"
            : "rgba(255,255,255,0.08)";
        ctx.fill();

        // Label
        if (isVisited) {
          ctx.font = `${isHead ? "600" : "400"} ${isHead ? "11" : "10"}px system-ui, sans-serif`;
          ctx.fillStyle = isHead
            ? "#34d399"
            : "rgba(16,185,129,0.42)";
          ctx.fillText(pt.label, x + 9, y + 4);
        }
      });

      // ── Moving head dot ─────────────────────────────────────────────
      if (progressRef.current < totalSegs) {
        const si = Math.floor(progressRef.current);
        const sf = progressRef.current - si;
        const p0 = WAYPOINTS[Math.min(si, totalSegs - 1)];
        const p1 = WAYPOINTS[Math.min(si + 1, totalSegs)];
        const hx = p0.x * W + (p1.x - p0.x) * W * sf;
        const hy = p0.y * H + (p1.y - p0.y) * H * sf;
        const pulse2 = (Math.sin(now / 220) + 1) / 2;

        // Outer glow ring
        ctx.beginPath();
        ctx.arc(hx, hy, 9 + pulse2 * 6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(6,182,212,${0.12 + pulse2 * 0.18})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Inner dot
        ctx.beginPath();
        ctx.arc(hx, hy, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = "#06b6d4";
        ctx.fill();

        // Bright center
        ctx.beginPath();
        ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#e0f7ff";
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();

    const ro = new ResizeObserver(() => {
      resize();
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        background: "#0a1628",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(16,185,129,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.035) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          zIndex: 0,
        }}
      />

      {/* Route canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
        }}
      />

      {/* Center card */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
          textAlign: "center",
          padding: "48px 32px 40px",
          background: "rgba(10,22,40,0.72)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: 28,
          border: "1px solid rgba(16,185,129,0.18)",
          boxShadow:
            "0 0 60px rgba(16,185,129,0.07), 0 24px 64px rgba(0,0,0,0.4)",
          minWidth: 260,
        }}
      >
        {/* Logo circle */}
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: "50%",
            border: "1.5px solid rgba(16,185,129,0.55)",
            background: "rgba(16,185,129,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            animation: "lp 2.8s ease-in-out infinite",
          }}
        >
          🗺️
        </div>

        {/* Brand name */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              fontSize: 38,
              fontWeight: 900,
              background: "linear-gradient(100deg, #10b981 0%, #06b6d4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: 5,
              lineHeight: 1,
            }}
          >
            ไปเล่า
          </div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 8,
              color: "rgba(255,255,255,0.28)",
              fontWeight: 300,
            }}
          >
            PAI · LAO
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: "100%",
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent)",
          }}
        />

        {/* Status phrase */}
        <div
          key={phraseIdx}
          style={{
            fontSize: 13,
            color: "#34d399",
            letterSpacing: 0.3,
            animation: "fp 0.45s ease",
            minHeight: 20,
          }}
        >
          {PHRASES[phraseIdx]}
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: 190,
            height: 2,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #10b981, #06b6d4)",
              borderRadius: 999,
              animation: "sc 1.9s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes lp {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(16,185,129,0.25),
                        0 0 18px rgba(16,185,129,0.08);
          }
          50% {
            box-shadow: 0 0 0 14px rgba(16,185,129,0),
                        0 0 36px rgba(6,182,212,0.18);
          }
        }
        @keyframes sc {
          0%   { width: 0%;   margin-left: 0; }
          55%  { width: 100%; margin-left: 0; }
          56%  { width: 0%;   margin-left: 100%; }
          100% { width: 0%;   margin-left: 100%; }
        }
        @keyframes fp {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

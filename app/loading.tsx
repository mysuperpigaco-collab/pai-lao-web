"use client";

export default function Loading() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, overflow: "hidden",
      background: "linear-gradient(180deg,#06101d 0%,#0a1628 55%,#071019 100%)",
    }}>
      {/* Radial glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background:
          "radial-gradient(120% 80% at 50% 18%, rgba(16,185,129,0.10), transparent 60%)," +
          "radial-gradient(90% 70% at 50% 120%, rgba(6,182,212,0.12), transparent 55%)",
      }} />

      {/* Left wall */}
      <div style={{
        position: "absolute", left: 0, top: "-4%", height: "108%", width: "46%",
        background: "#070f1c",
        backgroundImage:
          "linear-gradient(rgba(16,185,129,.07) 1px,transparent 1px)," +
          "linear-gradient(90deg,rgba(16,185,129,.07) 1px,transparent 1px)",
        backgroundSize: "42px 42px",
        transformOrigin: "left center",
        transform: "perspective(1500px) rotateY(33deg)",
        zIndex: 2,
      }}>
        <span style={{
          position: "absolute", right: 0, top: 0, height: "100%", width: 3,
          background: "#34d399",
          boxShadow: "0 0 22px 5px rgba(52,211,153,.55),0 0 6px 1px rgba(52,211,153,.9)",
          borderRadius: 2,
        }} />
      </div>

      {/* Right wall */}
      <div style={{
        position: "absolute", right: 0, top: "-4%", height: "108%", width: "46%",
        background: "#070f1c",
        backgroundImage:
          "linear-gradient(rgba(16,185,129,.07) 1px,transparent 1px)," +
          "linear-gradient(90deg,rgba(16,185,129,.07) 1px,transparent 1px)",
        backgroundSize: "42px 42px",
        transformOrigin: "right center",
        transform: "perspective(1500px) rotateY(-33deg)",
        zIndex: 2,
      }}>
        <span style={{
          position: "absolute", left: 0, top: 0, height: "100%", width: 3,
          background: "#34d399",
          boxShadow: "0 0 22px 5px rgba(52,211,153,.55),0 0 6px 1px rgba(52,211,153,.9)",
          borderRadius: 2,
        }} />
      </div>

      {/* Center: cats + logo card */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 6,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 20,
      }}>
        {/* Cats */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/splash/cat-orange-1.png" alt="" style={{
            width: 100, height: 100, objectFit: "contain",
            filter: "drop-shadow(0 0 18px rgba(232,154,82,.6))",
          }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/splash/cat-white-1.png" alt="" style={{
            width: 88, height: 88, objectFit: "contain",
            filter: "drop-shadow(0 0 14px rgba(242,239,233,.45))",
          }} />
        </div>

        {/* Logo card */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          padding: "22px 40px 18px",
          background: "rgba(8,20,36,.62)", backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: 24, border: "1px solid rgba(52,211,153,.28)",
          boxShadow: "0 0 60px rgba(16,185,129,.16), 0 30px 70px rgba(0,0,0,.5)",
        }}>
          <div style={{
            fontSize: 30, fontWeight: 900, letterSpacing: 5, lineHeight: 1,
            background: "linear-gradient(100deg,#10b981,#06b6d4)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>ไปเล่า</div>
          <div style={{ width: 160, height: 2, borderRadius: 9, background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 9,
              background: "linear-gradient(90deg,#10b981,#06b6d4)",
              boxShadow: "0 0 10px rgba(16,185,129,.7)",
              animation: "lbar 1.8s ease-in-out infinite",
            }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes lbar {
          0%   { width: 0%;   margin-left: 0; }
          55%  { width: 100%; margin-left: 0; }
          56%  { width: 0%;   margin-left: 100%; }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}

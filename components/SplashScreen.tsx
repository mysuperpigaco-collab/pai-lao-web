"use client";
import { useEffect, useState } from "react";

/**
 * SplashScreen — ฉากโหลดเปิดเว็บแบบเวทีนีออน 3D
 * โหลด: ผนังเอียงเรืองแสง + แท่นเรืองแสง + รอยเท้าแมว + การ์ดกระจกโลโก้ + แมว 2 ตัววิ่งวน
 * เสร็จ: ผนัง/ม่านเปิดออกข้าง แมววิ่งออกพ้นจอ (motion blur) เผยหน้าเว็บ
 *
 * รูปแมว: วางไฟล์ PNG พื้นหลังโปร่งที่ public/images/splash/cat-1.png และ cat-2.png
 * (ท่าเดินด้านข้าง หันขวา) — ถ้ายังไม่มีไฟล์ จะ fallback เป็นแมว SVG ที่วาดไว้อัตโนมัติ
 */

const PHRASES = [
  "กำลังโหลดแผนที่เส้นทาง…",
  "กำลังค้นหาสถานที่น่าเที่ยว…",
  "เตรียมเรื่องเล่าให้คุณ…",
  "Loading your journey…",
];

// รูปแมว — ใส่ได้หลายเฟรมเพื่อทำขาเดิน (ตอนนี้ตัวละ 1 ท่า)
// ย้ายไฟล์ kitty_1.jpg / kitty_2.jpg จาก scripts/ ไปไว้ที่ public/images/splash/
// ถ้าไม่พบไฟล์ จะ fallback เป็นแมว SVG อัตโนมัติ
const CAT_FRAMES: string[][] = [
  ["/images/splash/cat-orange-1.png"], // แมวส้ม (พื้นโปร่ง)
  ["/images/splash/cat-white-1.png"],  // แมวขาวหัวส้ม (พื้นโปร่ง)
];
const FRAME_MS = 130;
const CAT_BLEND: "screen" | "normal" = "normal";
const MIN_SHOW_MS = 2200;
const MAX_SHOW_MS = 6000;   // กันค้าง: ถ้าหน้าโหลดช้า/มี asset ค้าง ก็เปิดม่านภายในเวลานี้เสมอ
const OPEN_MS = 1600;

type Phase = "loading" | "opening" | "done";

type CatPalette = {
  body: string; dark: string; belly: string; head: string;
  cap?: string; ear: string; paw: string; tail: string;
  light: string; eye: string; bodyStripes: boolean;
};

const CATS: CatPalette[] = [
  { body: "#e89a52", dark: "#bf6a23", belly: "#f6e7d2", head: "#e89a52", ear: "#f1a7af", paw: "#f0e3cf", tail: "#e89a52", light: "#f7ddb6", eye: "#9bbdd2", bodyStripes: true },
  { body: "#f2efe9", dark: "#c87b34", belly: "#fbfaf6", head: "#f2efe9", cap: "#e89a52", ear: "#f1a7af", paw: "#f3ddc9", tail: "#e89a52", light: "#fbfaf6", eye: "#9bbdd2", bodyStripes: false },
];

// ── แมว SVG (fallback เมื่อไม่มีไฟล์ PNG) ─────────────────────────────────────
function Cat({ palette, id }: { palette: CatPalette; id: string }) {
  const c = palette;
  const earBase = c.cap ?? c.body;
  return (
    <svg viewBox="0 0 92 62" width="100%" height="100%" aria-hidden="true" className="cat" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.body} /><stop offset="1" stopColor={c.belly} />
        </linearGradient>
        <radialGradient id={`${id}-h`} cx="0.5" cy="0.4" r="0.72">
          <stop offset="0" stopColor={c.light} /><stop offset="1" stopColor={c.head} />
        </radialGradient>
      </defs>
      <path className="cat-tail" d="M12 42 C1 39 0 22 9 16 C13 13 18 15 17 20 C16 24 12 23 13 21" fill="none" stroke={c.tail} strokeWidth="8" strokeLinecap="round" />
      <g className="cat-tail" stroke={c.dark} strokeWidth="2" strokeLinecap="round" opacity="0.4" fill="none"><path d="M6 33 q3 -1 5 -3" /><path d="M4 26 q3 -1 5 -3" /></g>
      <g className="leg legB"><path d="M28 41 q-3 8 -1 13" stroke={`url(#${id}-b)`} strokeWidth="9" fill="none" strokeLinecap="round" /><ellipse cx="26" cy="55" rx="5" ry="3" fill={c.paw} /></g>
      <g className="leg legB"><rect x="56" y="43" width="6" height="13" rx="3" fill={`url(#${id}-b)`} opacity="0.72" /><ellipse cx="59" cy="56" rx="4.2" ry="2.6" fill={c.paw} /></g>
      <path d="M18 42 C16 28 31 22 45 23 C60 24 72 26 75 35 C76 42 69 48 56 48 L27 48 C21 48 18 46 18 42 Z" fill={`url(#${id}-b)`} />
      {c.bodyStripes && (
        <g stroke={c.dark} strokeWidth="2.4" strokeLinecap="round" opacity="0.5" fill="none">
          <path d="M35 25 q2 6 0 11" /><path d="M44 24 q2 7 0 12" /><path d="M53 25 q2 6 0 11" /><path d="M61 27 q2 5 0 9" />
        </g>
      )}
      <g className="leg legA"><path d="M32 44 q-2 7 0 12" stroke={`url(#${id}-b)`} strokeWidth="9" fill="none" strokeLinecap="round" /><ellipse cx="32" cy="56" rx="5" ry="3" fill={c.paw} /></g>
      <g className="leg legA"><rect x="62" y="43" width="6" height="14" rx="3" fill={`url(#${id}-b)`} /><ellipse cx="65" cy="57" rx="4.4" ry="2.7" fill={c.paw} /></g>
      <g className="cat-head">
        <path d="M62 13 L64 26 L72 20 Z" fill={earBase} /><path d="M85 12 L83 26 L75 20 Z" fill={earBase} />
        <path d="M63.5 16 L65 24 L70 20 Z" fill={c.ear} /><path d="M83.5 15 L82 24 L77 20 Z" fill={c.ear} />
        <path d="M64 18 q-1.5 -2 -1 -4 M83 17 q1.5 -2 1 -4" stroke={c.light} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.85" />
        <path d="M60 31 q-3 1 -4.5 4 q3.5 0.5 5.5 -1 Z" fill={c.light} /><path d="M86 31 q3 1 4.5 4 q-3.5 0.5 -5.5 -1 Z" fill={c.light} />
        <ellipse cx="73" cy="29" rx="13" ry="11.5" fill={`url(#${id}-h)`} />
        {c.cap && <path d="M60.5 28 C61 19 67 14.5 73 14.5 C79 14.5 85 19 85.5 28 C80 24.5 66 24.5 60.5 28 Z" fill={c.cap} />}
        {c.bodyStripes && (
          <g stroke={c.dark} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.55">
            <path d="M73 16 v6" /><path d="M68 17 l1.5 5" /><path d="M78 17 l-1.5 5" />
          </g>
        )}
        <ellipse cx="73" cy="35" rx="7.5" ry="5.2" fill={c.light} />
        <ellipse cx="68" cy="28" rx="3.4" ry="2.7" fill="#f4faff" /><ellipse cx="78" cy="28" rx="3.4" ry="2.7" fill="#f4faff" />
        <circle cx="68.4" cy="28" r="2.3" fill={c.eye} /><circle cx="78.4" cy="28" r="2.3" fill={c.eye} />
        <ellipse cx="68.4" cy="28.2" rx="1.1" ry="2.1" fill="#1c2b33" /><ellipse cx="78.4" cy="28.2" rx="1.1" ry="2.1" fill="#1c2b33" />
        <circle cx="69.3" cy="26.8" r="0.85" fill="#fff" /><circle cx="79.3" cy="26.8" r="0.85" fill="#fff" />
        <path d="M71.3 33 L74.7 33 L73 35 Z" fill="#e58da0" />
        <path d="M73 35 q-2 2 -4 1 M73 35 q2 2 4 1" fill="none" stroke="#9a6b4a" strokeWidth="0.9" strokeLinecap="round" />
        <g stroke="#fff" strokeWidth="0.7" strokeLinecap="round" opacity="0.75"><path d="M67 33 L56 31" /><path d="M67 34.5 L56 36" /><path d="M79 33 L90 31" /><path d="M79 34.5 L90 36" /></g>
      </g>
    </svg>
  );
}

function KittenVisual({ frames, palette, id }: { frames: string[]; palette: CatPalette; id: string }) {
  const [imgOk, setImgOk] = useState(true);
  const [fi, setFi] = useState(0);

  useEffect(() => {
    if (!imgOk || frames.length < 2) return;
    frames.forEach(f => { const im = new Image(); im.src = f; }); // preload กันกระตุก
    const t = setInterval(() => setFi(i => (i + 1) % frames.length), FRAME_MS);
    return () => clearInterval(t);
  }, [imgOk, frames]);

  if (imgOk && frames.length > 0) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={frames[fi]} alt="" className="cat-img" style={{ mixBlendMode: CAT_BLEND }} onError={() => setImgOk(false)} />;
  }
  return <Cat palette={palette} id={id} />;
}

// รอยเท้าแมวรอบแท่น
const PAWS = Array.from({ length: 11 }).map((_, i) => {
  const a = (i / 11) * Math.PI * 2;
  return { x: 50 + 44 * Math.cos(a), y: 52 + 38 * Math.sin(a), rot: (a * 180) / Math.PI + 90, d: (i * 0.13).toFixed(2) };
});

function Paw() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <ellipse cx="12" cy="16" rx="6" ry="5" fill="#34d399" />
      <circle cx="6" cy="10" r="2.1" fill="#34d399" /><circle cx="11" cy="7.5" r="2.3" fill="#34d399" />
      <circle cx="16.5" cy="8.5" r="2.2" fill="#34d399" /><circle cx="20" cy="12" r="1.9" fill="#34d399" />
    </svg>
  );
}

export default function SplashScreen() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    if (phase !== "loading") return;
    const id = setInterval(() => setPhraseIdx(p => (p + 1) % PHRASES.length), 2000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "loading") document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [phase]);

  useEffect(() => {
    const start = Date.now();
    let minTimer: ReturnType<typeof setTimeout>;
    let fired = false;
    const fire = () => { if (!fired) { fired = true; setPhase("opening"); } };
    const trigger = () => {
      const wait = Math.max(0, MIN_SHOW_MS - (Date.now() - start));
      minTimer = setTimeout(fire, wait);
    };
    if (document.readyState === "complete") trigger();
    else window.addEventListener("load", trigger, { once: true });
    const maxTimer = setTimeout(fire, MAX_SHOW_MS); // กันค้างถ้า load ไม่ยอม fire
    return () => { clearTimeout(minTimer); clearTimeout(maxTimer); window.removeEventListener("load", trigger); };
  }, []);

  useEffect(() => {
    if (phase !== "opening") return;
    const t = setTimeout(() => setPhase("done"), OPEN_MS);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "done") return null;
  const cls = phase === "opening" ? "sp-root sp-open" : "sp-root";

  return (
    <div aria-hidden="true" className={cls} style={{ pointerEvents: phase === "opening" ? "none" : "auto" }}>
      {/* พื้นหลังเวที (ปิดเว็บไว้ระหว่างโหลด) */}
      <div className="sp-back" />

      {/* ผนังเอียงเรืองแสง 2 ฝั่ง */}
      <div className="sp-wall sp-wall-l"><span className="sp-edge" /></div>
      <div className="sp-wall sp-wall-r"><span className="sp-edge" /></div>

      {/* แท่นเรืองแสง + วงโคจร + รอยเท้า */}
      <div className="sp-stage">
        <div className="sp-glow" />
        <svg className="sp-rings" viewBox="0 0 400 200" preserveAspectRatio="none">
          <ellipse cx="200" cy="100" rx="180" ry="70" fill="none" stroke="rgba(52,211,153,0.5)" strokeWidth="1.5" />
          <ellipse cx="200" cy="100" rx="130" ry="48" fill="none" stroke="rgba(52,211,153,0.28)" strokeWidth="1" />
        </svg>
        <div className="sp-paws">
          {PAWS.map((p, i) => (
            <span key={i} className="sp-paw" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%,-50%) rotate(${p.rot}deg)`, animationDelay: `${p.d}s` }}>
              <Paw />
            </span>
          ))}
        </div>
      </div>

      {/* การ์ดกระจกโลโก้ */}
      <div className="sp-ui">
        <div className="sp-card">
          <div className="sp-mark">🗺️</div>
          <div className="sp-brand"><div className="sp-name">ไปเล่า</div><div className="sp-sub">PAI · LAO</div></div>
          <div className="sp-div" />
          <div className="sp-bar"><i /></div>
          <div key={phraseIdx} className="sp-phrase">{PHRASES[phraseIdx]}</div>
          <div className="sp-dots"><span /><span /><span /></div>
        </div>
      </div>

      {/* แมว 2 ตัว วิ่งวนรอบแท่น */}
      <div className="sp-orbit">
        <div className="sp-kit sp-kit-A"><div className="sp-uns"><div className="sp-hop">
          <KittenVisual frames={CAT_FRAMES[0]} palette={CATS[0]} id="catA" />
        </div></div></div>
        <div className="sp-kit sp-kit-B"><div className="sp-uns"><div className="sp-hop">
          <KittenVisual frames={CAT_FRAMES[1]} palette={CATS[1]} id="catB" />
        </div></div></div>
      </div>

      <style>{`
        .sp-root{position:fixed;inset:0;z-index:99999;overflow:hidden}
        .sp-back{position:absolute;inset:0;background:
          radial-gradient(120% 80% at 50% 18%, rgba(16,185,129,0.10), transparent 60%),
          radial-gradient(90% 70% at 50% 120%, rgba(6,182,212,0.12), transparent 55%),
          linear-gradient(180deg,#06101d 0%,#0a1628 55%,#071019 100%);
          transition:opacity ${OPEN_MS}ms ease}
        .sp-root.sp-open .sp-back{opacity:0}

        .sp-wall{position:absolute;top:-4%;height:108%;width:46%;background:#070f1c;
          background-image:linear-gradient(rgba(16,185,129,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,.07) 1px,transparent 1px);
          background-size:42px 42px;z-index:2;transition:transform ${OPEN_MS}ms cubic-bezier(.7,0,.18,1),opacity ${OPEN_MS}ms ease}
        .sp-wall-l{left:0;transform-origin:left center;transform:perspective(1500px) rotateY(33deg)}
        .sp-wall-r{right:0;transform-origin:right center;transform:perspective(1500px) rotateY(-33deg)}
        .sp-edge{position:absolute;top:0;height:100%;width:3px;background:#34d399;box-shadow:0 0 22px 5px rgba(52,211,153,.55),0 0 6px 1px rgba(52,211,153,.9)}
        .sp-wall-l .sp-edge{right:0;border-radius:2px}
        .sp-wall-r .sp-edge{left:0;border-radius:2px}
        .sp-root.sp-open .sp-wall-l{transform:perspective(1500px) rotateY(62deg) translateX(-34%);opacity:0}
        .sp-root.sp-open .sp-wall-r{transform:perspective(1500px) rotateY(-62deg) translateX(34%);opacity:0}

        .sp-stage{position:absolute;left:50%;bottom:13%;width:520px;height:200px;margin-left:-260px;z-index:3;transition:opacity .55s ease}
        .sp-root.sp-open .sp-stage{opacity:0}
        .sp-glow{position:absolute;left:50%;top:55%;width:360px;height:120px;margin:-60px 0 0 -180px;border-radius:50%;
          background:radial-gradient(ellipse at center, rgba(16,185,129,.45), rgba(16,185,129,.08) 55%, transparent 72%);filter:blur(6px)}
        .sp-rings{position:absolute;inset:0;width:100%;height:100%}
        .sp-paws{position:absolute;inset:0}
        .sp-paw{position:absolute;filter:drop-shadow(0 0 5px rgba(52,211,153,.85));animation:sp-paw 2.6s ease-in-out infinite}
        @keyframes sp-paw{0%,100%{opacity:.12}45%{opacity:.92}}

        .sp-ui{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:6;transition:opacity .5s ease}
        .sp-root.sp-open .sp-ui{opacity:0}
        .sp-card{display:flex;flex-direction:column;align-items:center;gap:15px;padding:32px 46px 26px;border-radius:26px;transform:translateY(-26px);
          background:rgba(8,20,36,.62);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
          border:1px solid rgba(52,211,153,.3);box-shadow:0 0 0 1px rgba(52,211,153,.08),0 0 60px rgba(16,185,129,.18),0 30px 70px rgba(0,0,0,.5)}
        .sp-mark{width:78px;height:78px;border-radius:50%;border:1.5px solid rgba(52,211,153,.6);background:rgba(16,185,129,.07);
          display:flex;align-items:center;justify-content:center;font-size:34px;animation:sp-pin 2.6s ease-in-out infinite}
        .sp-name{font-size:36px;font-weight:900;letter-spacing:5px;line-height:1;text-align:center;
          background:linear-gradient(100deg,#10b981,#06b6d4);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
        .sp-sub{font-size:10px;letter-spacing:8px;color:rgba(255,255,255,.32);text-align:center;margin-top:5px}
        .sp-div{width:100%;height:1px;background:linear-gradient(90deg,transparent,rgba(52,211,153,.4),transparent)}
        .sp-bar{width:200px;height:3px;border-radius:9px;background:rgba(255,255,255,.07);overflow:hidden}
        .sp-bar i{display:block;height:100%;width:42%;border-radius:9px;background:linear-gradient(90deg,#10b981,#06b6d4);box-shadow:0 0 10px rgba(16,185,129,.7);animation:sp-scan 1.8s ease-in-out infinite}
        .sp-phrase{font-size:13px;color:#34d399;letter-spacing:.3px;min-height:18px;animation:sp-fade .45s ease}
        .sp-dots{display:flex;gap:7px}
        .sp-dots span{width:6px;height:6px;border-radius:50%;background:rgba(52,211,153,.45);animation:sp-dot 1.4s ease-in-out infinite}
        .sp-dots span:nth-child(2){animation-delay:.2s}
        .sp-dots span:nth-child(3){animation-delay:.4s}

        .sp-orbit{position:absolute;left:50%;bottom:21%;width:0;height:0;z-index:5;transform:scaleY(.52)}
        .sp-kit{position:absolute;left:0;top:0;width:120px;height:96px;margin:-48px 0 0 -60px;
          transition:transform ${OPEN_MS}ms cubic-bezier(.4,0,.2,1),opacity ${OPEN_MS}ms ease,filter ${OPEN_MS}ms ease}
        .sp-kit-A{animation:sp-orbA 3.6s linear infinite}
        .sp-kit-B{animation:sp-orbB 3.6s linear infinite}
        .sp-uns{width:100%;height:100%;transform:scaleY(1.92)}
        .sp-hop{width:100%;height:100%;display:flex;align-items:flex-end;justify-content:center;animation:sp-hop .42s ease-in-out infinite}
        .cat-img{height:100%;width:auto;object-fit:contain;filter:drop-shadow(0 6px 10px rgba(0,0,0,.4))}
        .cat{width:100%;height:100%}
        .sp-kit-A .cat-img,.sp-kit-A .cat{transform:scaleX(-1)}
        .sp-root.sp-open .sp-kit{animation:none}
        .sp-root.sp-open .sp-kit-A{transform:translate(-72vw,6px);opacity:0;filter:blur(2px)}
        .sp-root.sp-open .sp-kit-B{transform:translate(72vw,6px);opacity:0;filter:blur(2px)}

        .cat *{transform-box:fill-box}
        .cat-tail{transform-origin:90% 90%;animation:sp-tail .8s ease-in-out infinite}
        .leg{transform-origin:50% 8%}
        .legA{animation:sp-step .34s ease-in-out infinite}
        .legB{animation:sp-step .34s ease-in-out infinite reverse}

        @keyframes sp-orbA{from{transform:rotate(0) translateX(176px) rotate(0)}to{transform:rotate(360deg) translateX(176px) rotate(-360deg)}}
        @keyframes sp-orbB{from{transform:rotate(180deg) translateX(176px) rotate(-180deg)}to{transform:rotate(540deg) translateX(176px) rotate(-540deg)}}
        @keyframes sp-hop{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes sp-step{0%,100%{transform:rotate(15deg)}50%{transform:rotate(-15deg)}}
        @keyframes sp-tail{0%,100%{transform:rotate(-10deg)}50%{transform:rotate(14deg)}}
        @keyframes sp-pin{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.3),0 0 20px rgba(16,185,129,.1)}50%{box-shadow:0 0 0 14px rgba(16,185,129,0),0 0 40px rgba(6,182,212,.22)}}
        @keyframes sp-scan{0%{transform:translateX(-110%)}100%{transform:translateX(340%)}}
        @keyframes sp-fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes sp-dot{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}
        @media (max-width:380px){
          .sp-card{padding:24px 22px 20px}
          .sp-name{font-size:28px;letter-spacing:3px}
          .sp-mark{width:64px;height:64px;font-size:28px}
          .sp-bar{width:160px}
        }
        @media (prefers-reduced-motion:reduce){
          .sp-kit-A,.sp-kit-B,.sp-hop,.legA,.legB,.cat-tail,.sp-paw,.sp-dots span{animation:none!important}
        }
      `}</style>
    </div>
  );
}

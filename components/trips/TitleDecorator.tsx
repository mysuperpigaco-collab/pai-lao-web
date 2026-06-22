"use client";

import { useRef, useState } from "react";
import { TITLE_STYLES, titleStyleCss } from "@/lib/titleStyle";

const EMOJIS = ["✈️","🏖️","⛰️","🌿","🛕","☕","🍜","📸","🌊","🚗","🎒","🌅","🏝️","🗺️","🏞️","🍃","🌸","🐘","❤️","✨","🔥","🎉","🌙","⭐"];

type Props = {
  value: string;
  onChange: (v: string) => void;
  styleKey: string;
  onStyleChange: (k: string) => void;
  coverUrl?: string | null;
  moodLabel?: string | null;
  placeholder?: string;
  showEmoji?: boolean;
};

export default function TitleDecorator({
  value, onChange, styleKey, onStyleChange,
  coverUrl, moodLabel, placeholder = "ตั้งชื่อทริปให้น่าสนใจ...", showEmoji = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [trayOpen, setTrayOpen] = useState(false);

  const insertEmoji = (e: string) => {
    const el = inputRef.current;
    if (!el) { onChange(value + e); return; }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + e + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + e.length;
      try { el.setSelectionRange(pos, pos); } catch {}
    });
  };

  const previewStyle = titleStyleCss(styleKey);

  return (
    <div className="tdz">
      <style>{`
        .tdz-bar{display:flex;gap:8px;margin-top:8px}
        .tdz-tool{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;
          padding:9px 10px;border-radius:10px;cursor:pointer;border:1.5px solid #e2e8f0;background:#fff;
          color:#64748b;font-family:inherit;font-weight:700;transition:all .15s}
        .tdz-tool:hover{border-color:#c4b5fd;color:#6d28d9}
        .tdz-tray{display:flex;flex-wrap:wrap;gap:2px;padding:8px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;margin-top:8px}
        .tdz-em{font-size:20px;background:none;border:none;cursor:pointer;padding:4px 5px;border-radius:6px;line-height:1}
        .tdz-em:hover{background:#f1f5f9}
        .tdz-lbl{font-size:12px;color:#94a3b8;margin:14px 0 7px;font-weight:700}
        .tdz-styles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
        .tdz-sty{font-size:12px;padding:8px 6px;border-radius:10px;cursor:pointer;border:1.5px solid #e2e8f0;
          background:#fff;color:#64748b;font-family:inherit;font-weight:700;text-align:center;transition:all .15s}
        .tdz-sty:hover{border-color:#c4b5fd}
        .tdz-sty.on{border-color:#7c3aed;background:#f5f3ff;color:#6d28d9}
        .tdz-preview{margin-top:16px;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px}
        .tdz-pv-head{font-size:11px;color:#94a3b8;margin-bottom:10px;display:flex;align-items:center;gap:6px;font-weight:700}
        .tdz-pv-dot{width:6px;height:6px;border-radius:50%;background:#10b981;display:inline-block}
        .tdz-pv-row{display:flex;gap:14px;flex-wrap:wrap;align-items:stretch}
        .tdz-card{width:210px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}
        .tdz-cover{height:84px;background:linear-gradient(135deg,#a5b4fc,#c7d2fe);background-size:cover;background-position:center}
        .tdz-hero{flex:1;min-width:180px;border-radius:12px;overflow:hidden;background:linear-gradient(135deg,#1e3a5f,#2d5a7c);padding:18px 16px;display:flex;align-items:center}
        @media(max-width:768px){
          .tdz-styles{grid-template-columns:repeat(2,minmax(0,1fr))}
          .tdz-card{width:100%}
        }
      `}</style>

      <input
        ref={inputRef}
        type="text"
        className="form-control"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
      />

      {showEmoji && (
        <div className="tdz-bar">
          <button type="button" className="tdz-tool" onClick={() => setTrayOpen(o => !o)}>
            <span style={{ fontSize: 16 }}>😀</span> แทรกอิโมจิ
          </button>
        </div>
      )}

      {showEmoji && trayOpen && (
        <div className="tdz-tray">
          {EMOJIS.map(e => (
            <button key={e} type="button" className="tdz-em" onClick={() => insertEmoji(e)}>{e}</button>
          ))}
        </div>
      )}

      <div className="tdz-lbl">สไตล์ตัวอักษร · Title style</div>
      <div className="tdz-styles">
        {TITLE_STYLES.map(s => (
          <button
            key={s.key}
            type="button"
            className={`tdz-sty${styleKey === s.key ? " on" : ""}`}
            onClick={() => onStyleChange(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="tdz-preview">
        <div className="tdz-pv-head"><span className="tdz-pv-dot" /> ตัวอย่างสด · Live preview</div>
        <div className="tdz-pv-row">
          <div className="tdz-card">
            <div className="tdz-cover" style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined} />
            <div style={{ padding: "9px 11px" }}>
              {moodLabel && <div style={{ fontSize: 9, color: "#7c3aed", fontWeight: 700, marginBottom: 3 }}>{moodLabel}</div>}
              <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, ...previewStyle }}>
                {value || placeholder}
              </div>
            </div>
          </div>
          <div className="tdz-hero">
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.2, ...previewStyle }}>
              {value || placeholder}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

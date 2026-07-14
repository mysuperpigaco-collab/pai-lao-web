"use client";

import { useEffect, useRef, useState } from "react";
import { uploadFile } from "@/lib/uploadHelper";

// ── ตัวแก้ไขลายน้ำแบบลากวางอิสระ (หลายเลเยอร์) ────────────────
// size = % ของความกว้างภาพ → ใช้หน่วย cqw ให้ preview ตรงกับผลจริงตอนฝัง (W*size/100)

type Kind = "text" | "tiled" | "badge" | "image";
type Layer = {
  id: number; kind: Kind; text?: string; imageUrl?: string;
  x: number; y: number; rot: number; size: number; color: string; opacity: number;
  bold?: boolean; italic?: boolean; outline?: boolean; pill?: boolean; locked?: boolean;
  gap?: number; reps?: number; // tiled: ระยะห่างระหว่างบรรทัด · จำนวนซ้ำต่อแถว
};

const SITE = "pai-lao.com";
let UID = 1;

function lum(hex: string) {
  const c = (hex || "#fff").replace("#", ""); if (c.length < 6) return 1;
  return (0.299 * parseInt(c.slice(0, 2), 16) + 0.587 * parseInt(c.slice(2, 4), 16) + 0.114 * parseInt(c.slice(4, 6), 16)) / 255;
}
function shadowFor(color: string, outline?: boolean) {
  const oc = lum(color) > 0.5 ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)";
  if (outline) return `-1px -1px 0 ${oc},1px -1px 0 ${oc},-1px 1px 0 ${oc},1px 1px 0 ${oc},0 1px 0 ${oc},0 -1px 0 ${oc}`;
  return lum(color) > 0.5 ? "0 1px 3px rgba(0,0,0,0.55)" : "0 1px 2px rgba(255,255,255,0.45)";
}

// ── ตัวเรนเดอร์ visual ของ 1 เลเยอร์ (ใช้ทั้ง stage หลักและภาพตัวอย่างเทมเพลต) ──
function layerInner(l: Partial<Layer>) {
  const size = l.size ?? 4, color = l.color ?? "#ffffff", text = l.text || SITE;
  const sh = shadowFor(color, l.outline);
  const tcss: React.CSSProperties = { fontSize: `${size}cqw`, fontWeight: l.bold ? 700 : 600, fontStyle: l.italic ? "italic" : "normal", color, textShadow: sh, whiteSpace: "nowrap" };
  if (l.kind === "image" && l.imageUrl)
    return <img src={l.imageUrl} alt="" style={{ width: `${size * 2}cqw`, height: "auto", objectFit: "contain" }} draggable={false} />;
  if (l.kind === "tiled") {
    const gap = l.gap ?? 1.3, reps = Math.max(2, Math.round(l.reps ?? 5));
    const rows = Math.max(6, Math.round(24 / gap));
    return (
      <div style={{ width: "260cqw", display: "flex", flexDirection: "column", gap: `${size * gap}cqw`, lineHeight: 1 }}>
        {Array.from({ length: rows }).map((_, i) => <div key={i} style={tcss}>{`${text}     ${SITE}     `.repeat(reps)}</div>)}
      </div>
    );
  }
  if (l.kind === "badge")
    return (
      <div style={{ width: `${size * 3}cqw`, height: `${size * 3}cqw`, borderRadius: "50%", border: `2px solid ${color}`, background: "rgba(0,0,0,0.16)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textShadow: sh }}>
        <div style={{ fontSize: `${size * 0.6}cqw`, fontWeight: 700, color, lineHeight: 1 }}>{l.text || "@you"}</div>
        <div style={{ fontSize: `${size * 0.3}cqw`, color, marginTop: 2 }}>{SITE}</div>
      </div>
    );
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: l.pill ? "rgba(15,23,42,0.42)" : "transparent", borderRadius: l.pill ? 999 : 0, padding: l.pill ? `${size * 0.3}cqw ${size * 0.7}cqw` : 0 }}>
      <div style={tcss}>{text}</div>
      <div style={{ ...tcss, fontSize: `${size * 0.42}cqw`, fontWeight: 500 }}>{SITE}</div>
    </div>
  );
}

// ── เทมเพลตสำเร็จรูป (เลย์เอาต์สมดุล กดปุ่มเดียวได้เลย) ──
type Preset = { key: string; label: string; sub: string; bg: string; build: (t: string) => Omit<Layer, "id">[] };
const PRESETS: Preset[] = [
  { key: "minimal", label: "มินิมอล", sub: "มุมล่างเบา ๆ", bg: "linear-gradient(160deg,#fdba74,#fb7185 42%,#9333ea 78%,#312e81)",
    build: t => [{ kind: "text", text: t, x: 80, y: 88, rot: 0, size: 3.8, color: "#ffffff", opacity: 0.88 }] },
  { key: "official", label: "ทางการ", sub: "ป้ายกลางล่าง", bg: "linear-gradient(150deg,#34d399,#059669 48%,#065f46 82%,#064e3b)",
    build: t => [{ kind: "text", text: t, x: 50, y: 90, rot: 0, size: 3.4, color: "#ffffff", opacity: 0.95, pill: true }] },
  { key: "guard", label: "กันก๊อป", sub: "ทแยงเต็มกรอบ", bg: "linear-gradient(150deg,#0ea5e9,#6366f1 46%,#a855f7 78%,#ec4899)",
    build: t => [{ kind: "tiled", text: t, x: 50, y: 50, rot: -28, size: 3.4, color: "#ffffff", opacity: 0.42 }] },
  { key: "brand", label: "แบรนด์", sub: "ตราวงกลมมุม", bg: "linear-gradient(155deg,#1e293b,#312e81 42%,#7c3aed 74%,#f59e0b)",
    build: t => [{ kind: "badge", text: "@" + (t || "you").replace(/\s/g, "").slice(0, 10), x: 84, y: 83, rot: 0, size: 4.6, color: "#ffffff", opacity: 0.92 }] },
  { key: "combo", label: "ผสม", sub: "ทแยงจาง + เครดิต", bg: "linear-gradient(160deg,#f472b6,#db2777 46%,#7e22ce 80%,#4c1d95)",
    build: t => [
      { kind: "tiled", text: t, x: 50, y: 50, rot: -28, size: 2.9, color: "#ffffff", opacity: 0.26 },
      { kind: "text", text: t, x: 80, y: 89, rot: 0, size: 3.4, color: "#ffffff", opacity: 0.92, outline: true },
    ] },
];

export default function WatermarkSettings() {
  const [enabled, setEnabled] = useState(false);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [defaultText, setDefaultText] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number } | null>(null);
  const resizing = useRef<{ id: number; startSize: number; cx: number; cy: number; startDist: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/watermark").then(r => r.json()).then(d => {
      setDefaultText(d.defaultText || "");
      const s = d.settings || {};
      if (Array.isArray(s.layers) && s.layers.length) {
        setLayers(s.layers.map((L: any) => ({ ...L, id: UID++ })));
        setEnabled(!!s.enabled);
      }
    }).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  const mark = () => setSaved(false);
  const patch = (id: number, p: Partial<Layer>) => { setLayers(ls => ls.map(l => l.id === id ? { ...l, ...p } : l)); mark(); };
  const add = (L: Omit<Layer, "id">) => { const id = UID++; setLayers(ls => [...ls, { ...L, id }]); setSel(id); setEnabled(true); mark(); };
  const addText = () => add({ kind: "text", text: defaultText || "ชื่อของคุณ", x: 30, y: 82, rot: 0, size: 4, color: "#ffffff", opacity: 0.85 });
  const addTiled = () => add({ kind: "tiled", text: defaultText || "ชื่อของคุณ", x: 50, y: 50, rot: -28, size: 3.4, color: "#ffffff", opacity: 0.5 });
  const addBadge = () => add({ kind: "badge", text: "@you", x: 84, y: 82, rot: 0, size: 4, color: "#ffffff", opacity: 0.9 });
  const dup = (id: number) => { const l = layers.find(x => x.id === id); if (!l) return; const nid = UID++; setLayers(ls => [...ls, { ...l, id: nid, x: Math.min(96, l.x + 6), y: Math.min(94, l.y + 6) }]); setSel(nid); mark(); };
  const del = (id: number) => { setLayers(ls => ls.filter(l => l.id !== id)); setSel(null); mark(); };

  const onLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    try {
      const url = await uploadFile(f, "watermark-logo");
      add({ kind: "image", imageUrl: url, x: 82, y: 80, rot: 0, size: 10, color: "#ffffff", opacity: 0.9 });
    } catch {} finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const startDrag = (e: React.PointerEvent, l: Layer) => {
    if (l.locked) { setSel(l.id); return; }
    e.stopPropagation(); setSel(l.id); drag.current = { id: l.id };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const startResize = (e: React.PointerEvent, l: Layer) => {
    e.stopPropagation();
    if (!stageRef.current) return;
    setSel(l.id);
    const r = stageRef.current.getBoundingClientRect();
    const cx = r.left + (l.x / 100) * r.width;
    const cy = r.top + (l.y / 100) * r.height;
    resizing.current = { id: l.id, startSize: l.size, cx, cy, startDist: Math.hypot(e.clientX - cx, e.clientY - cy) || 1 };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (resizing.current) {
      const { id, startSize, cx, cy, startDist } = resizing.current;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      const ns = Math.min(20, Math.max(1, startSize * (dist / startDist)));
      patch(id, { size: Math.round(ns * 10) / 10 });
      return;
    }
    if (!drag.current || !stageRef.current) return;
    const l = layers.find(x => x.id === drag.current!.id);
    // ทแยงเลื่อนทะลุขอบได้ (เหลือเฉพาะตัวอักษรในกรอบ) · เลเยอร์อื่นจำกัดในกรอบ
    const lo = l?.kind === "tiled" ? -25 : 2;
    const hi = l?.kind === "tiled" ? 125 : 98;
    const r = stageRef.current.getBoundingClientRect();
    const x = Math.max(lo, Math.min(hi, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.max(lo, Math.min(hi, ((e.clientY - r.top) / r.height) * 100));
    patch(drag.current.id, { x, y });
  };
  const endDrag = () => { drag.current = null; resizing.current = null; };

  const applyPreset = (p: Preset) => {
    const built = p.build(defaultText).map(L => ({ ...L, id: UID++ }));
    setLayers(built); setSel(built[0]?.id ?? null); setEnabled(true); mark();
  };

  const save = async () => {
    setSaving(true);
    try {
      const clean = layers.map(({ id, locked, ...rest }) => rest);
      const res = await fetch("/api/auth/watermark", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { enabled: enabled && clean.length > 0, layers: clean } }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    } finally { setSaving(false); }
  };

  if (!loaded) return null;
  const active = layers.find(l => l.id === sel) || null;

  return (
    <section className="wm">
      <div className="wm-head">
        <div>
          <p className="wm-title">🖼️ ลายน้ำกันดึงรูป</p>
          <p className="wm-sub">ลากวางได้อิสระ · เพิ่มหลายอัน · หมุน/สี/หนา/เอียงได้ · ฝังลงรูปที่อัปโหลดใหม่</p>
        </div>
        <button type="button" className={`wm-toggle ${enabled ? "on" : ""}`} onClick={() => { setEnabled(v => !v); mark(); }} aria-label="เปิด/ปิดลายน้ำ"><span className="wm-knob" /></button>
      </div>

      {enabled && (
        <>
          <p className="wm-seclabel">เทมเพลตสำเร็จรูป · กดเลือกแล้วปรับต่อได้</p>
          <div className="wm-presets">
            {PRESETS.map(p => (
              <button type="button" key={p.key} className="wm-preset" onClick={() => applyPreset(p)}>
                <span className="wm-preset-thumb" style={{ background: p.bg }}>
                  {p.build(defaultText || "ชื่อของคุณ").map((l, i) => (
                    <span key={i} style={{ position: "absolute", left: `${l.x}%`, top: `${l.y}%`, transform: `translate(-50%,-50%) rotate(${l.rot}deg)`, opacity: l.opacity, display: "flex" }}>
                      {layerInner(l)}
                    </span>
                  ))}
                </span>
                <span className="wm-preset-label">{p.label}</span>
                <span className="wm-preset-sub">{p.sub}</span>
              </button>
            ))}
          </div>

          <p className="wm-seclabel">หรือเพิ่มเลเยอร์เอง</p>
          <div className="wm-tools">
            <button type="button" onClick={addText}>+ ข้อความ</button>
            <button type="button" onClick={addTiled}>+ ทแยง</button>
            <button type="button" onClick={addBadge}>+ ตราวงกลม</button>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? "กำลังอัป..." : "+ โลโก้/รูป"}</button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onLogo} />
            <span className="wm-tip">ลากกล่องเพื่อย้าย · คลิกเพื่อเลือก</span>
          </div>

          <div ref={stageRef} className="wm-stage" onPointerMove={onMove} onPointerUp={endDrag} onPointerDown={e => { if (e.target === stageRef.current) setSel(null); }}>
            <div className="wm-sun" />
            <div className="wm-shade" />
            {layers.map(l => (
              <div key={l.id} onPointerDown={e => startDrag(e, l)} style={{
                position: "absolute", left: `${l.x}%`, top: `${l.y}%`,
                transform: `translate(-50%,-50%) rotate(${l.rot}deg)`, opacity: l.opacity,
                cursor: l.locked ? "default" : "grab",
                outline: sel === l.id ? "1.5px dashed rgba(255,255,255,0.95)" : "none", outlineOffset: 3,
                display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap",
              }}>
                {layerInner(l)}
                {sel === l.id && !l.locked && l.kind !== "tiled" && (
                  <>
                    <span className="wm-hdl wm-hdl-del" title="ลบ" onPointerDown={e => { e.stopPropagation(); del(l.id); }}>×</span>
                    <span className="wm-hdl wm-hdl-size" title="ลากเพื่อขยาย/ย่อ" onPointerDown={e => startResize(e, l)} />
                  </>
                )}
              </div>
            ))}
            {layers.length === 0 && <div className="wm-empty">เลือกเทมเพลตด้านบน หรือกด “+ ข้อความ”</div>}
          </div>

          {active && (
            <div className="wm-panel">
              <div className="wm-row">
                {active.kind !== "image" && <input className="wm-input" value={active.text ?? ""} maxLength={40} placeholder="ข้อความ" onChange={e => patch(active.id, { text: e.target.value })} />}
                {active.kind === "image" && <span className="wm-imgnote">เลเยอร์รูป/โลโก้</span>}
                <button type="button" className="wm-mini" onClick={() => patch(active.id, { locked: !active.locked })} aria-label="ล็อก" style={{ borderColor: active.locked ? "var(--pl-green-dark,#22a06b)" : undefined }}>{active.locked ? "🔒" : "🔓"}</button>
                <button type="button" className="wm-mini" onClick={() => dup(active.id)} aria-label="ก๊อป">⧉</button>
                <button type="button" className="wm-mini" onClick={() => del(active.id)} aria-label="ลบ">🗑</button>
              </div>
              <div className="wm-grid">
                <div><label>หมุน · {active.rot}°</label><input type="range" min={-180} max={180} value={active.rot} onChange={e => patch(active.id, { rot: +e.target.value })} /></div>
                <div><label>ขนาด</label><input type="range" min={1} max={20} step={0.5} value={active.size} onChange={e => patch(active.id, { size: +e.target.value })} /></div>
                <div><label>ความชัด · {Math.round(active.opacity * 100)}%</label><input type="range" min={5} max={100} value={Math.round(active.opacity * 100)} onChange={e => patch(active.id, { opacity: +e.target.value / 100 })} /></div>
                {active.kind === "tiled" && (
                  <>
                    <div><label>ระยะห่างบรรทัด · {(active.gap ?? 1.3).toFixed(1)}</label><input type="range" min={0.6} max={2.6} step={0.1} value={active.gap ?? 1.3} onChange={e => patch(active.id, { gap: +e.target.value })} /></div>
                    <div><label>จำนวนซ้ำ/แถว · {Math.round(active.reps ?? 5)}</label><input type="range" min={2} max={10} step={1} value={Math.round(active.reps ?? 5)} onChange={e => patch(active.id, { reps: +e.target.value })} /></div>
                  </>
                )}
              </div>
              {active.kind !== "image" && (
                <div className="wm-row2">
                  <button type="button" className={`wm-chip ${active.bold ? "on" : ""}`} onClick={() => patch(active.id, { bold: !active.bold })}><b>B</b></button>
                  <button type="button" className={`wm-chip ${active.italic ? "on" : ""}`} onClick={() => patch(active.id, { italic: !active.italic })}><i>I</i></button>
                  <button type="button" className={`wm-chip ${active.outline ? "on" : ""}`} onClick={() => patch(active.id, { outline: !active.outline })}>ขอบ</button>
                  {active.kind === "text" && <button type="button" className={`wm-chip ${active.pill ? "on" : ""}`} onClick={() => patch(active.id, { pill: !active.pill })}>พื้นหลัง</button>}
                  <label className="wm-color">สี<input type="color" value={active.color} onChange={e => patch(active.id, { color: e.target.value })} /></label>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="wm-foot">
        <button type="button" className="wm-save" onClick={save} disabled={saving}>{saving ? "กำลังบันทึก..." : saved ? "✓ บันทึกแล้ว" : "บันทึกลายน้ำ"}</button>
      </div>

      <style jsx>{`
        .wm { margin-top: 28px; border: 1px solid var(--pl-border,#e2e8f0); border-radius: 20px; padding: 18px 20px; background: var(--pl-white,#fff); }
        .wm-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .wm-title { margin: 0 0 4px; font-weight: 800; font-size: 15px; color: var(--pl-text-primary,#0f172a); }
        .wm-sub { margin: 0; font-size: 12px; color: var(--pl-text-secondary,#64748b); line-height: 1.6; }
        .wm-toggle { flex-shrink: 0; width: 46px; height: 26px; border-radius: 999px; border: none; background: #cbd5e1; position: relative; cursor: pointer; transition: background .2s; }
        .wm-toggle.on { background: #10b981; }
        .wm-knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: left .2s; }
        .wm-toggle.on .wm-knob { left: 23px; }
        .wm-seclabel { margin: 18px 0 8px; font-size: 11px; font-weight: 800; letter-spacing: 0.04em; color: var(--pl-text-muted,#94a3b8); text-transform: uppercase; }
        .wm-presets { display: grid; grid-template-columns: repeat(auto-fill,minmax(104px,1fr)); gap: 10px; }
        .wm-preset { border: 1.5px solid var(--pl-border,#e2e8f0); background: var(--pl-white,#fff); border-radius: 14px; padding: 7px; cursor: pointer; font-family: inherit; display: flex; flex-direction: column; gap: 2px; transition: border-color .15s, transform .1s; }
        .wm-preset:hover { border-color: #10b981; transform: translateY(-2px); }
        .wm-preset:active { transform: translateY(0); }
        .wm-preset-thumb { position: relative; display: block; width: 100%; aspect-ratio: 4/3; border-radius: 9px; overflow: hidden; container-type: inline-size; }
        .wm-preset-label { font-size: 12.5px; font-weight: 700; color: var(--pl-text-primary,#0f172a); margin-top: 4px; text-align: left; }
        .wm-preset-sub { font-size: 10.5px; color: var(--pl-text-muted,#94a3b8); text-align: left; line-height: 1.3; }
        .wm-tools { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin: 8px 0 10px; }
        .wm-tools button { border: 1.5px solid var(--pl-border,#e2e8f0); background: transparent; color: var(--pl-text-secondary,#475569); border-radius: 999px; padding: 6px 12px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .wm-tools button:disabled { opacity: .5; }
        .wm-tip { font-size: 11px; color: var(--pl-text-muted,#94a3b8); }
        .wm-stage { position: relative; border-radius: 14px; overflow: hidden; aspect-ratio: 16/10; touch-action: none; user-select: none; container-type: inline-size; background: linear-gradient(155deg,#fdba74 0%,#fb7185 32%,#a855f7 64%,#312e81 100%); }
        .wm-sun { position: absolute; left: 20%; top: 20%; width: 12%; aspect-ratio: 1; border-radius: 50%; background: rgba(255,244,214,.9); }
        .wm-shade { position: absolute; inset: auto 0 0 0; height: 34%; background: linear-gradient(0deg,rgba(20,30,60,.34),transparent); }
        .wm-empty { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,.85); font-size: 13px; font-weight: 600; }
        .wm-hdl { position: absolute; z-index: 5; width: 22px; height: 22px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.4); }
        .wm-hdl-del { top: -11px; right: -11px; background: #ef4444; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700; line-height: 1; cursor: pointer; }
        .wm-hdl-size { bottom: -11px; right: -11px; background: #10b981; cursor: nwse-resize; }
        .wm-panel { margin-top: 12px; background: var(--pl-bg,#f8fafc); border-radius: 14px; padding: 12px 14px; }
        .wm-row { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; }
        .wm-input { flex: 1; box-sizing: border-box; border: 1.5px solid var(--pl-border,#e2e8f0); border-radius: 10px; padding: 8px 12px; font-size: 14px; font-family: inherit; background: var(--pl-white,#fff); color: var(--pl-text-primary,#0f172a); }
        .wm-imgnote { flex: 1; font-size: 13px; color: var(--pl-text-secondary,#64748b); }
        .wm-mini { border: 1.5px solid var(--pl-border,#e2e8f0); background: var(--pl-white,#fff); border-radius: 10px; width: 36px; height: 36px; cursor: pointer; font-size: 15px; }
        .wm-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(140px,1fr)); gap: 10px 16px; }
        .wm-grid label { display: block; font-size: 12px; color: var(--pl-text-secondary,#64748b); margin-bottom: 4px; }
        .wm-grid input[type=range] { width: 100%; }
        .wm-row2 { display: flex; gap: 6px; align-items: center; margin-top: 10px; flex-wrap: wrap; }
        .wm-chip { border: 1.5px solid var(--pl-border,#e2e8f0); background: var(--pl-white,#fff); color: var(--pl-text-secondary,#64748b); border-radius: 10px; min-width: 36px; height: 34px; padding: 0 10px; font-size: 13px; cursor: pointer; font-family: inherit; }
        .wm-chip.on { border-color: #10b981; color: #059669; background: rgba(16,185,129,.08); }
        .wm-color { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--pl-text-secondary,#64748b); margin-left: auto; }
        .wm-color input { width: 34px; height: 34px; padding: 0; border: none; background: none; cursor: pointer; }
        .wm-foot { margin-top: 16px; }
        .wm-save { border: none; background: linear-gradient(135deg,#10b981,#059669); color: #fff; border-radius: 14px; padding: 11px 22px; font-size: 14px; font-weight: 800; font-family: inherit; cursor: pointer; }
        .wm-save:disabled { opacity: .6; }
        :global([data-theme="dark"]) .wm { background: rgba(255,255,255,.03); }
        :global([data-theme="dark"]) .wm-panel { background: rgba(255,255,255,.04); }
        :global([data-theme="dark"]) .wm-input, :global([data-theme="dark"]) .wm-mini, :global([data-theme="dark"]) .wm-chip { background: rgba(255,255,255,.06); }
      `}</style>
    </section>
  );
}

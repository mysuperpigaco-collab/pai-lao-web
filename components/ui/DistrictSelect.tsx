"use client";
import { useState, useRef, useEffect } from "react";
import { getDistricts } from "@/data/thailand";

interface Props {
  province: string;         // จังหวัดที่เลือกอยู่ (เพื่อโหลดรายการอำเภอ)
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export default function DistrictSelect({
  province, value, onChange,
  placeholder = "-- ทุกอำเภอ --",
  className = "", style, disabled,
}: Props) {
  const districts = province ? getDistricts(province) : [];
  const [open, setOpen]     = useState(false);
  const [q, setQ]           = useState("");
  const ref                 = useRef<HTMLDivElement>(null);

  // ปิด dropdown เมื่อคลิกนอก
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // reset value เมื่อ province เปลี่ยน
  useEffect(() => {
    if (value) onChange("");
    setQ("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [province]);

  const filtered = districts.filter(d =>
    !q || d.includes(q) || d.toLowerCase().includes(q.toLowerCase())
  );

  // Match stored Thai-only value to full bilingual string for display
  const fullMatch = value ? districts.find(d => d === value || d.startsWith(value + " (")) : null;
  const displayVal = fullMatch || value || placeholder;

  if (!province || districts.length === 0) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8, flex: 1,
        background: "#f1f5f9", border: "1.5px solid #e2e8f0",
        borderRadius: 12, padding: "8px 14px", opacity: 0.5,
        fontSize: 13, color: "#94a3b8", ...style,
      }} className={className}>
        🏘️ <span>เลือกจังหวัดก่อน</span>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative", flex: 1, ...style }} className={className}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          background: "#f8fafc", border: "1.5px solid #e2e8f0",
          borderRadius: 12, padding: "8px 14px", cursor: "pointer",
          fontSize: 13, color: value ? "#334155" : "#94a3b8",
          fontFamily: "inherit", textAlign: "left",
        }}
      >
        🏘️
        <span style={{ flex: 1 }}>{displayVal}</span>
        <span style={{ fontSize: 10, color: "#94a3b8" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div data-lenis-prevent style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "white", border: "1.5px solid #e2e8f0",
          borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          zIndex: 100, maxHeight: 260, display: "flex", flexDirection: "column",
        }}>
          {/* Search */}
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9" }}>
            <input
              autoFocus
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="ค้นหาอำเภอ..."
              style={{
                width: "100%", border: "1px solid #e2e8f0", borderRadius: 8,
                padding: "6px 10px", fontSize: 13, outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Options */}
          <div style={{ overflowY: "auto", maxHeight: 200 }}>
            {/* ล้างค่า */}
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); setQ(""); }}
              style={{
                width: "100%", textAlign: "left", padding: "9px 14px",
                border: "none", background: "none", cursor: "pointer",
                fontSize: 13, color: "#94a3b8", fontFamily: "inherit",
                borderBottom: "1px solid #f8fafc",
              }}
            >
              {placeholder}
            </button>

            {filtered.length === 0 ? (
              <div style={{ padding: "12px 14px", fontSize: 13, color: "#94a3b8" }}>
                ไม่พบอำเภอ
              </div>
            ) : (
              filtered.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => { onChange(d.split(" (")[0]); setOpen(false); setQ(""); }}
                  style={{
                    width: "100%", textAlign: "left", padding: "9px 14px",
                    border: "none", cursor: "pointer", fontSize: 13,
                    fontFamily: "inherit",
                    background: value === d.split(" (")[0] ? "#eff6ff" : "none",
                    color:      value === d.split(" (")[0] ? "#2563eb" : "#334155",
                    fontWeight: value === d.split(" (")[0] ? 700 : 400,
                  }}
                >
                  {d}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

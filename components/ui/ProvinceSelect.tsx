"use client";
import { useState, useRef, useEffect } from "react";
import { PROVINCES, normalizeProvince } from "@/data/thailand";

interface ProvinceSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  id?: string;
  required?: boolean;
}

export default function ProvinceSelect({
  value,
  onChange,
  placeholder = "-- เลือกจังหวัด · Select Province --",
  className = "",
  style,
  disabled = false,
  id,
  required,
}: ProvinceSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizedValue = normalizeProvince(value);

  const filtered = query
    ? PROVINCES.filter((p) => p.toLowerCase().includes(query.toLowerCase()))
    : PROVINCES;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const handleSelect = (prov: string) => {
    onChange(prov);
    setOpen(false);
    setQuery("");
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} id={id} style={{ position: "relative", width: "100%" }}>
      {/* Trigger — styled exactly like a <select className="form-control"> */}
      <div
        className={className}
        onClick={() => { if (!disabled) setOpen((o) => !o); }}
        style={{
          position: "relative",
          paddingRight: 28,
          cursor: disabled ? "not-allowed" : "pointer",
          userSelect: "none",
          opacity: disabled ? 0.6 : 1,
          color: normalizedValue ? "inherit" : "#9ca3af",
          ...(open ? { borderColor: "#3b82f6", boxShadow: "0 0 0 4px rgba(59,130,246,0.1)", background: "white" } : {}),
          ...style,
        }}
      >
        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {normalizedValue || placeholder}
        </span>
        {/* Arrow — mimics native select arrow */}
        <span style={{
          position: "absolute",
          right: 14,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "#6b7280",
          fontSize: 10,
          lineHeight: 1,
        }}>
          ▼
        </span>
      </div>

      {required && (
        <input
          tabIndex={-1}
          style={{ opacity: 0, height: 0, width: 0, position: "absolute", pointerEvents: "none" }}
          value={normalizedValue}
          onChange={() => {}}
          required={required}
        />
      )}

      {open && (
        <div data-lenis-prevent style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          background: "#fff",
          border: "1.5px solid #e2e8f0",
          borderRadius: 15,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          zIndex: 9999,
          overflow: "hidden",
        }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="พิมพ์เพื่อค้นหาจังหวัด..."
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                border: "1.5px solid #e2e8f0",
                borderRadius: 10,
                padding: "8px 12px",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                color: "#1e293b",
                fontFamily: "inherit",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            <div
              onClick={handleClear}
              style={{ padding: "10px 16px", cursor: "pointer", color: "#94a3b8", fontSize: 14, borderBottom: "1px solid #f8fafc" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              -- เลือกจังหวัด · Select Province --
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 14 }}>ไม่พบจังหวัดที่ค้นหา</div>
            ) : (
              filtered.map((prov) => {
                const isSelected = prov === normalizedValue;
                return (
                  <div
                    key={prov}
                    onClick={() => handleSelect(prov)}
                    style={{
                      padding: "10px 16px",
                      cursor: "pointer",
                      fontSize: 14,
                      color: isSelected ? "#3b82f6" : "#1e293b",
                      background: isSelected ? "#eff6ff" : "transparent",
                      fontWeight: isSelected ? 600 : 400,
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f8fafc"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? "#eff6ff" : "transparent"; }}
                  >
                    {prov}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useState, useRef, useEffect } from "react";
import { PROVINCES } from "@/data/thailand";

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
  placeholder = "-- เลือกจังหวัด --",
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

  const filtered = query
    ? PROVINCES.filter((p) =>
        p.toLowerCase().includes(query.toLowerCase())
      )
    : PROVINCES;

  // Close on outside click
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

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
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

  const displayValue = value || placeholder;

  return (
    <div
      ref={containerRef}
      id={id}
      style={{ position: "relative", ...style }}
      className={className}
    >
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((o) => !o);
        }}
        style={{
          width: "100%",
          textAlign: "left",
          background: disabled ? "#f8fafc" : "#fff",
          border: "1.5px solid #e2e8f0",
          borderRadius: 15,
          padding: "14px 40px 14px 16px",
          fontSize: 15,
          color: value ? "#1e293b" : "#94a3b8",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          minHeight: 50,
          boxSizing: "border-box",
          outline: "none",
          transition: "border-color 0.15s",
          ...(open ? { borderColor: "#6366f1" } : {}),
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayValue}
        </span>
        <span style={{ color: "#94a3b8", fontSize: 12, flexShrink: 0 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {/* Hidden input for form required validation */}
      {required && (
        <input
          tabIndex={-1}
          style={{ opacity: 0, height: 0, width: 0, position: "absolute" }}
          value={value}
          onChange={() => {}}
          required={required}
        />
      )}

      {/* Dropdown */}
      {open && (
        <div
          style={{
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
          }}
        >
          {/* Search input */}
          <div style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="พิมพ์เพื่อค้นหาจังหวัด..."
              style={{
                width: "100%",
                border: "1.5px solid #e2e8f0",
                borderRadius: 10,
                padding: "8px 12px",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                color: "#1e293b",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          {/* Options list */}
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {/* Clear option */}
            <div
              onClick={handleClear}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                color: "#94a3b8",
                fontSize: 14,
                borderBottom: "1px solid #f8fafc",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              -- เลือกจังหวัด --
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 14 }}>
                ไม่พบจังหวัดที่ค้นหา
              </div>
            ) : (
              filtered.map((prov) => (
                <div
                  key={prov}
                  onClick={() => handleSelect(prov)}
                  style={{
                    padding: "10px 16px",
                    cursor: "pointer",
                    fontSize: 14,
                    color: prov === value ? "#6366f1" : "#1e293b",
                    background: prov === value ? "#eef2ff" : "transparent",
                    fontWeight: prov === value ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (prov !== value) e.currentTarget.style.background = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = prov === value ? "#eef2ff" : "transparent";
                  }}
                >
                  {prov}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

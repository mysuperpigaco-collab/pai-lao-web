"use client";
/*
 * components/ui/InputField.tsx
 * – รองรับ eye-toggle สำหรับ type="password"
 */

import { useState } from "react";
import "@/components/ui/form-card.css";

type Props = {
  label: string;
  labelEn?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  disabled?: boolean;
  readOnly?: boolean;
  hint?: string;
  error?: string;
  max?: string;
  min?: string;
};

const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function InputField({
  label,
  labelEn,
  required = false,
  type = "text",
  placeholder,
  value,
  defaultValue,
  name,
  onChange,
  disabled = false,
  readOnly = false,
  hint,
  error,
  max,
  min,
}: Props) {
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === "password";
  const inputType  = isPassword ? (showPw ? "text" : "password") : type;

  return (
    <div className="ui-field">
      <label>
        {label}
        {labelEn && <span className="en">{labelEn}</span>}
        {required && <span className="req">*</span>}
      </label>

      <div style={{ position: "relative" }}>
        <input
          type={inputType}
          name={name}
          className={`ui-input${error ? " ui-input--error" : ""}`}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
          disabled={disabled}
          readOnly={readOnly}
          max={max}
          min={min}
          style={isPassword ? { paddingRight: "42px" } : undefined}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            style={{
              position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: "#94a3b8", padding: "2px", display: "flex", alignItems: "center",
            }}
            tabIndex={-1}
            aria-label={showPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          >
            {showPw ? <EyeOff /> : <EyeOpen />}
          </button>
        )}
      </div>

      {error && (
        <span style={{ fontSize: "12px", color: "var(--pl-red)", marginTop: "4px", display: "block" }}>
          {error}
        </span>
      )}
      {hint && !error && (
        <span style={{ fontSize: "12px", color: "var(--pl-text-muted)", marginTop: "5px", display: "block" }}>
          {hint}
        </span>
      )}
    </div>
  );
}

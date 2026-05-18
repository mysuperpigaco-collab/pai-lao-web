/*
 * components/ui/InputField.tsx
 */

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
  return (
    <div className="ui-field">
      <label>
        {label}
        {labelEn && <span className="en">{labelEn}</span>}
        {required && <span className="req">*</span>}
      </label>

      <input
        type={type}
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
      />

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

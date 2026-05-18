/*
 * components/ui/SelectField.tsx
 * ✅ เพิ่ม onChange prop
 * ✅ ใช้ ui-field / ui-input class จาก form-card.css
 */

import "@/components/ui/form-card.css";

type Option = { label: string; value: string };

type Props = {
  label: string;
  labelEn?: string;
  required?: boolean;
  options: Option[];
  value?: string;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
};

export default function SelectField({
  label,
  labelEn,
  required,
  options,
  value,
  name,
  onChange,
  disabled,
}: Props) {
  return (
    <div className="ui-field">
      <label>
        {label}
        {labelEn && <span className="en">{labelEn}</span>}
        {required && <span className="req">*</span>}
      </label>

      <select
        className="ui-input"
        name={name}
        defaultValue={value}
        onChange={onChange}
        disabled={disabled}
        style={{ cursor: "pointer" }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

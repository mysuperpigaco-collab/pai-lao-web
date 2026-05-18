/*
 * components/business/BusinessSectionTitle.tsx
 * ✅ ใช้ ui-section-hdr class จาก form-card.css
 *    ไม่ใช้ section-divider จาก globals อีกต่อไป
 */

import "@/components/ui/form-card.css";

type Props = {
  title: string;
  subtitle?: string;
  description?: string;
};

export default function BusinessSectionTitle({ title, subtitle, description }: Props) {
  return (
    <div
      className="col-full"
      style={{
        paddingBottom: "16px",
        marginBottom: "4px",
        borderBottom: "1px solid var(--pl-border, #e2e8f0)",
      }}
    >
      <h2
        style={{
          fontSize: "18px",
          fontWeight: 800,
          color: "var(--pl-text-primary, #0f172a)",
          margin: "0 0 4px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        {title}
        {subtitle && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              background: "var(--pl-blue-soft, #eff6ff)",
              color: "var(--pl-blue-dark, #2563eb)",
              padding: "2px 9px",
              borderRadius: "6px",
              letterSpacing: "0.3px",
            }}
          >
            {subtitle}
          </span>
        )}
      </h2>
      {description && (
        <p style={{ fontSize: "13px", color: "var(--pl-text-secondary, #64748b)", margin: 0 }}>
          {description}
        </p>
      )}
    </div>
  );
}

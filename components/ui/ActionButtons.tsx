/*
 * ============================================================
 *  components/ui/ActionButtons.tsx
 *
 *  Export:
 *    <BackButton  href="/business/dashboard" label="Dashboard" />
 *    <CancelButton href="/business/dashboard" />
 *    <SaveButton />              ← type="submit" by default
 *    <ActionBar>…</ActionBar>   ← flex wrapper
 *    <PageTag label="EDIT PLACE" />
 * ============================================================
 */

import Link from "next/link";
import "@/components/ui/action-buttons.css";

/* ── SVG helpers ── */
const ArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M15 18L9 12L15 6"
      stroke="currentColor" strokeWidth="2.4"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 2L10 10M10 2L2 10"
      stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7L5.5 10.5L12 3.5"
      stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


/* ────────────────────────────────────────────────────────────
   BackButton
   ปุ่มกลับ — pill shape, วงกลมลูกศร, hover ฟ้า
──────────────────────────────────────────────────────────── */
type BackButtonProps = {
  href: string;
  label?: string;       // ชื่อปลายทาง เช่น "Dashboard"
  labelTh?: string;     // ชื่อภาษาไทย เช่น "กลับไป"
};

export function BackButton({
  href,
  label = "Dashboard",
  labelTh = "กลับไป",
}: BackButtonProps) {
  return (
    <Link href={href} className="ui-back-btn">
      <span className="ui-back-icon">
        <ArrowLeft />
      </span>
      <span className="ui-back-text">
        {labelTh}
        <span className="ui-back-sub">/ {label}</span>
      </span>
    </Link>
  );
}


/* ────────────────────────────────────────────────────────────
   CancelButton
   ปุ่มยกเลิก — พื้นขาว ขอบแดง hover แดงอ่อน
──────────────────────────────────────────────────────────── */
type CancelButtonProps = {
  href: string;
  label?: string;
};

export function CancelButton({
  href,
  label = "ยกเลิก · Discard",
}: CancelButtonProps) {
  return (
    <Link href={href} className="ui-cancel-btn">
      <span className="ui-cancel-icon">
        <XIcon />
      </span>
      {label}
    </Link>
  );
}


/* ────────────────────────────────────────────────────────────
   SaveButton
   ปุ่มบันทึก — gradient ฟ้า→เขียว
──────────────────────────────────────────────────────────── */
type SaveButtonProps = {
  label?: string;
  loading?: boolean;
  onClick?: () => void;
};

export function SaveButton({
  label = "บันทึก · Save changes",
  loading = false,
  onClick,
}: SaveButtonProps) {
  return (
    <button
      type="submit"
      className="ui-save-btn"
      disabled={loading}
      onClick={onClick}
    >
      <span className="ui-save-icon">
        <CheckIcon />
      </span>
      {loading ? "กำลังบันทึก..." : label}
    </button>
  );
}


/* ────────────────────────────────────────────────────────────
   ActionBar  —  flex wrapper ล่างฟอร์ม
──────────────────────────────────────────────────────────── */
export function ActionBar({ children }: { children: React.ReactNode }) {
  return <div className="ui-action-bar">{children}</div>;
}


/* ────────────────────────────────────────────────────────────
   PageTag  —  badge มุมขวาบน เช่น "EDIT PROFILE"
──────────────────────────────────────────────────────────── */
export function PageTag({ label }: { label: string }) {
  return <span className="ui-page-tag">{label}</span>;
}

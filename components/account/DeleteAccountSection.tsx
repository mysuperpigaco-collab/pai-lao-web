"use client";

import { useEffect, useState } from "react";

// ── โซนลบบัญชี (ใช้ร่วม dashboard/edit-profile + business/edit-profile) ──
// self-contained: fetch สถานะเอง ไม่พึ่ง state ของหน้าแม่ (styled-jsx เป็น scoped)
// โฟลว์: ขอลบ → มีเวลา 7 วันเปลี่ยนใจ (แบนเนอร์+ปุ่มยกเลิก) → cron ลบจริง

const GRACE_DAYS = 7;

function fmtThaiDate(d: Date): string {
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
}

export default function DeleteAccountSection() {
  const [username, setUsername] = useState<string>("");
  const [deletionRequestedAt, setDeletionRequestedAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUsername(d.user.username ?? "");
          setDeletionRequestedAt(d.user.deletionRequestedAt ?? null);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const requestDelete = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmUsername: confirmText.trim() }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.message || "เกิดข้อผิดพลาด"); return; }
      setDeletionRequestedAt(d.deletionRequestedAt);
      setShowModal(false);
      setConfirmText("");
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setBusy(false);
    }
  };

  const cancelDelete = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
      if (res.ok) setDeletionRequestedAt(null);
    } catch {} finally {
      setBusy(false);
    }
  };

  if (!loaded) return null;

  const purgeDate = deletionRequestedAt
    ? new Date(new Date(deletionRequestedAt).getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000)
    : null;
  const daysLeft = purgeDate
    ? Math.max(0, Math.ceil((purgeDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  return (
    <section className="da-section">
      {purgeDate ? (
        <div className="da-pending" role="alert">
          <span className="da-pending-text">
            ⏳ บัญชีนี้จะถูกลบถาวรในอีก <b>{daysLeft} วัน</b> ({fmtThaiDate(purgeDate)}) — เปลี่ยนใจได้ตลอดช่วงนี้
          </span>
          <button type="button" className="da-cancel-btn" onClick={cancelDelete} disabled={busy}>
            {busy ? "กำลังยกเลิก..." : "ยกเลิกการลบบัญชี"}
          </button>
        </div>
      ) : (
        <div className="da-card">
          <p className="da-title">⚠️ ลบบัญชีถาวร</p>
          <p className="da-desc">
            ทริป รีวิว รูปภาพ และข้อมูลทั้งหมดจะถูกลบ ไม่สามารถกู้คืนได้
            หลังยืนยันมีเวลา {GRACE_DAYS} วันในการเปลี่ยนใจ ยกเลิกได้ตลอดช่วงนี้
          </p>
          <button type="button" className="da-open-btn" onClick={() => { setShowModal(true); setError(""); }}>
            ขอลบบัญชี…
          </button>
        </div>
      )}

      {showModal && (
        <div className="da-overlay" onClick={() => !busy && setShowModal(false)}>
          <div className="da-modal" onClick={(e) => e.stopPropagation()}>
            <p className="da-modal-title">ยืนยันการลบบัญชี</p>
            <p className="da-desc">
              บัญชีจะถูกลบถาวรในวันที่ {fmtThaiDate(new Date(Date.now() + GRACE_DAYS * 24 * 60 * 60 * 1000))}
              {" "}— ระหว่างนี้ยังใช้งานได้ปกติ และกดยกเลิกได้ทุกเมื่อจากหน้านี้
            </p>
            <label className="da-label">
              พิมพ์ <code className="da-code">{username}</code> เพื่อยืนยัน
            </label>
            <input
              type="text"
              className="da-input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="username ของคุณ"
              autoComplete="off"
            />
            {error && <p className="da-error">{error}</p>}
            <div className="da-actions">
              <button type="button" className="da-cancel-btn" onClick={() => setShowModal(false)} disabled={busy}>
                ยกเลิก
              </button>
              <button
                type="button"
                className="da-confirm-btn"
                onClick={requestDelete}
                disabled={busy || confirmText.trim() !== username}
              >
                {busy ? "กำลังส่งคำขอ..." : "ยืนยันลบบัญชี"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .da-section { margin-top: 32px; }
        .da-card {
          border: 1px solid var(--pl-red-border, #fecaca);
          background: var(--pl-red-soft, #fff5f5);
          border-radius: 20px;
          padding: 18px 20px;
        }
        .da-title {
          margin: 0 0 6px;
          font-weight: 800;
          font-size: 15px;
          color: var(--pl-red, #b91c1c);
        }
        .da-desc {
          margin: 0 0 12px;
          font-size: 13px;
          line-height: 1.7;
          color: var(--pl-text-secondary, #64748b);
        }
        .da-open-btn {
          border: 1px solid var(--pl-red-border, #fecaca);
          background: transparent;
          color: var(--pl-red, #b91c1c);
          border-radius: var(--pl-radius-btn, 16px);
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
        }
        .da-open-btn:hover { background: var(--pl-red-mid, #fef2f2); }
        .da-pending {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          border: 1px solid var(--pl-orange-border, #fed7aa);
          background: var(--pl-orange-soft, #fff7ed);
          border-radius: 20px;
          padding: 14px 18px;
        }
        .da-pending-text {
          flex: 1;
          min-width: 220px;
          font-size: 13px;
          line-height: 1.7;
          color: var(--pl-orange-text, #9a3412);
        }
        .da-cancel-btn {
          border: 1px solid var(--pl-border, #e2e8f0);
          background: var(--pl-white, #fff);
          color: var(--pl-text-primary, #0f172a);
          border-radius: var(--pl-radius-btn, 16px);
          padding: 9px 16px;
          font-size: 13px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
        }
        .da-overlay {
          position: fixed;
          inset: 0;
          z-index: 9500;
          background: rgba(15, 23, 42, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .da-modal {
          background: var(--pl-white, #fff);
          border-radius: 20px;
          padding: 22px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
        }
        .da-modal-title {
          margin: 0 0 8px;
          font-size: 17px;
          font-weight: 800;
          color: var(--pl-text-primary, #0f172a);
        }
        .da-label {
          display: block;
          font-size: 13px;
          color: var(--pl-text-secondary, #64748b);
          margin-bottom: 6px;
        }
        .da-code {
          font-weight: 700;
          color: var(--pl-text-primary, #0f172a);
        }
        .da-input {
          width: 100%;
          border: 1px solid var(--pl-border, #e2e8f0);
          border-radius: var(--pl-radius-input, 18px);
          padding: 10px 14px;
          font-size: 14px;
          font-family: inherit;
          background: transparent;
          color: var(--pl-text-primary, #0f172a);
          margin-bottom: 12px;
        }
        .da-error {
          margin: 0 0 10px;
          font-size: 13px;
          color: var(--pl-red, #b91c1c);
        }
        .da-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          flex-wrap: wrap;
        }
        .da-confirm-btn {
          border: none;
          background: #dc2626;
          color: #fff;
          border-radius: var(--pl-radius-btn, 16px);
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 800;
          font-family: inherit;
          cursor: pointer;
        }
        .da-confirm-btn:disabled,
        .da-cancel-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        :global([data-theme="dark"]) .da-card { background: rgba(185, 28, 28, 0.08); }
        :global([data-theme="dark"]) .da-pending { background: rgba(154, 52, 18, 0.12); }
        :global([data-theme="dark"]) .da-modal { background: #1e293b; }
        :global([data-theme="dark"]) .da-cancel-btn { background: transparent; }
        @media (max-width: 480px) {
          .da-pending { flex-direction: column; align-items: stretch; }
          .da-cancel-btn { width: 100%; }
          .da-actions { flex-direction: column-reverse; }
          .da-actions button { width: 100%; }
        }
      `}</style>
    </section>
  );
}

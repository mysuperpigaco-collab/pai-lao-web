"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles, UserPlus } from "lucide-react";
import { useState } from "react";
import styles from "./forgot-password.module.css";

export default function ForgotPasswordPage() {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    // TODO:
    // connect reset password api here

    setSubmitted(true);
  };

  return (
    <div className="page">

      {/* BG */}
      <div className="bg" />

      {/* CARD */}
      <div className="card">

        {/* LOGO */}
        <div className="logo">
          🌏
        </div>

        {/* TITLE */}
        <span className="mini">
          ACCOUNT RECOVERY
        </span>

        <h1>
          ลืมรหัสผ่าน?
        </h1>

        <p className="desc">
          กรอกอีเมลหรือชื่อผู้ใช้ของคุณ
          เพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่
        </p>

        {/* SUCCESS */}
        {submitted ? (
          <div className="success">

            <div className="success-icon">
              📩
            </div>

            <div>
              <strong>
                ส่งลิงก์รีเซ็ตแล้ว
              </strong>

              <p>
                หากบัญชีนี้มีอยู่ในระบบ
                เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว
              </p>
            </div>

          </div>
        ) : (
          <form onSubmit={handleSubmit}>

            {/* INPUT */}
            <div className="input-group">

              <label>
                อีเมล หรือ Username
              </label>

              <input
                type="text"
                placeholder="example@email.com"
                value={value}
                onChange={(e) =>
                  setValue(e.target.value)
                }
                required
              />

            </div>

            {/* BUTTON */}
            <button
              type="submit"
              className="submit-btn"
            >
              ส่งลิงก์รีเซ็ตรหัสผ่าน
            </button>

          </form>
        )}

        <div className={styles.recoveryActions}>

          <Link
            href="/login"
            className={`${styles.recoveryButton} ${styles.loginButton}`}
            aria-label="กลับไปหน้าเข้าสู่ระบบ"
          >
            <span className={styles.buttonIcon}>
              <ArrowLeft size={20} />
            </span>

            <span className={styles.buttonText}>
              <strong>กลับหน้าเข้าสู่ระบบ</strong>
              <small>Back to Login</small>
            </span>

            <span className={styles.buttonCue}>
              <ArrowRight size={16} />
            </span>
          </Link>

          <Link
            href="/signup"
            className={`${styles.recoveryButton} ${styles.signupButton}`}
            aria-label="ไปหน้าสมัครสมาชิก"
          >
            <span className={styles.buttonIcon}>
              <UserPlus size={20} />
            </span>

            <span className={styles.buttonText}>
              <strong>สมัครสมาชิก</strong>
              <small>Join Pai-Lao Community</small>
            </span>

            <span className={styles.buttonCue}>
              <Sparkles size={16} />
            </span>
          </Link>

        </div>

      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;

          display: flex;

          align-items: center;

          justify-content: center;

          background: #f8fafc;

          padding: 24px;

          position: relative;

          overflow: hidden;
        }

        /* BG */
        .bg {
          position: absolute;

          inset: 0;

          background:
            radial-gradient(
              circle at top left,
              rgba(37,99,235,0.15),
              transparent 30%
            ),
            radial-gradient(
              circle at bottom right,
              rgba(16,185,129,0.15),
              transparent 30%
            );
        }

        /* CARD */
        .card {
          position: relative;

          z-index: 2;

          width: 100%;
          max-width: 540px;

          background: rgba(255,255,255,0.84);

          backdrop-filter: blur(20px);

          border-radius: 38px;

          padding: 42px;

          border: 1px solid rgba(255,255,255,0.6);

          box-shadow:
            0 25px 60px rgba(15,23,42,0.08);
        }

        /* LOGO */
        .logo {
          width: 86px;
          height: 86px;

          margin: 0 auto 24px;

          border-radius: 30px;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #10b981
            );

          display: flex;

          align-items: center;

          justify-content: center;

          font-size: 42px;

          color: white;

          box-shadow:
            0 18px 38px rgba(37,99,235,0.24);
        }

        /* TEXT */
        .mini {
          display: block;

          text-align: center;

          font-size: 11px;

          font-weight: 800;

          letter-spacing: 2px;

          color: #94a3b8;

          margin-bottom: 14px;
        }

        h1 {
          text-align: center;

          font-size: 42px;

          font-weight: 900;

          color: #0f172a;

          margin: 0 0 16px;
        }

        .desc {
          text-align: center;

          color: #64748b;

          font-size: 15px;

          line-height: 1.7;

          margin-bottom: 34px;
        }

        /* FORM */
        .input-group {
          margin-bottom: 22px;
        }

        label {
          display: block;

          margin-bottom: 10px;

          font-size: 14px;

          font-weight: 700;

          color: #334155;
        }

        input {
          width: 100%;

          height: 60px;

          border-radius: 20px;

          border: 1.5px solid #dbeafe;

          background: rgba(255,255,255,0.95);

          padding: 0 18px;

          font-size: 15px;

          outline: none;

          transition: 0.25s;
        }

        input:focus {
          border-color: #2563eb;

          box-shadow:
            0 0 0 4px rgba(37,99,235,0.08);
        }

        /* SUBMIT */
        .submit-btn {
          width: 100%;

          height: 62px;

          border: none;

          border-radius: 22px;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #10b981
            );

          color: white;

          font-size: 15px;

          font-weight: 900;

          cursor: pointer;

          transition: 0.3s ease;

          box-shadow:
            0 18px 38px rgba(37,99,235,0.22);
        }

        .submit-btn:hover {
          transform:
            translateY(-3px)
            scale(1.01);

          box-shadow:
            0 24px 48px rgba(37,99,235,0.3);
        }

        /* SUCCESS */
        .success {
          display: flex;

          gap: 16px;

          padding: 24px;

          border-radius: 24px;

          background: #f0fdf4;

          border: 1px solid #bbf7d0;
        }

        .success-icon {
          font-size: 30px;
        }

        .success strong {
          display: block;

          margin-bottom: 6px;

          color: #166534;
        }

        .success p {
          margin: 0;

          font-size: 13px;

          line-height: 1.6;

          color: #15803d;
        }

        /* MOBILE */
        @media (max-width: 640px) {
          .card {
            padding: 28px 22px;
          }

          h1 {
            font-size: 34px;
          }

        }
      `}</style>
    </div>
  );
}

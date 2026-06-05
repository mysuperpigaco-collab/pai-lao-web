"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        {/* ส่วนที่ 1: Logo และคำโปรย */}
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="logo-icon">💬</span>
            <div className="logo-text">
              <h2><span className="text-blue">ไป</span><span className="text-green">เล่า</span></h2>
              <p>PAI-LAO EXPERIENCE</p>
            </div>
          </div>
          <p className="brand-desc">
            ชุมชนแห่งการแบ่งปันเรื่องราวการเดินทาง <br />
            เพราะทุกก้าวของคุณมีเรื่องน่าเล่า
          </p>
        </div>

        {/* ส่วนที่ 2: เมนู (แบบยังไม่มี Link) */}
        <div className="footer-links-group">
          <div className="link-col">
            <h4>เกี่ยวกับเรา</h4>
            <ul>
              <li><a href="/about" style={{ color: "inherit", textDecoration: "none" }}>รู้จักไปเล่า</a></li>
            </ul>
          </div>
          <div className="link-col">
            <h4>ช่วยเหลือ</h4>
            <ul>
              <li><a href="/contact" style={{ color: "inherit", textDecoration: "none" }}>ติดต่อเรา</a></li>
              <li><a href="/contact?cat=ads" style={{ color: "inherit", textDecoration: "none" }}>ติดต่อโฆษณา</a></li>
              <li><a href="/faq" style={{ color: "inherit", textDecoration: "none" }}>คำถามที่พบบ่อย</a></li>
            </ul>
          </div>
          <div className="link-col">
            <h4>กฎกติกา</h4>
            <ul>
              <li><Link href="/policy?tab=terms" style={{ color:"inherit", textDecoration:"none" }}>เงื่อนไขการใช้งาน</Link></li>
              <li><Link href="/policy?tab=privacy" style={{ color:"inherit", textDecoration:"none" }}>นโยบายความเป็นส่วนตัว</Link></li>
              <li><Link href="/policy?tab=community" style={{ color:"inherit", textDecoration:"none" }}>มาตรฐานชุมชน</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* ส่วนที่ 3: Copyright ด้านล่างสุด */}
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} PAI-LAO EXPERIENCE. All rights reserved.</p>
        <div className="social-mini">
          <span>FB</span>
          <span>IG</span>
          <span>TK</span>
        </div>
      </div>

      <style jsx>{`
        .footer-container {
          background-color: #fff;
          border-top: 1px solid #eee;
          padding: 60px 5% 30px;
          margin-top: 80px;
          color: #333;
        }
        .footer-content {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 40px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .footer-brand {
          flex: 1;
          min-width: 250px;
        }
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        .logo-icon { font-size: 28px; }
        .logo-text h2 { margin: 0; font-size: 22px; font-weight: 800; }
        .logo-text p { margin: 0; font-size: 9px; color: #999; letter-spacing: 1px; }
        .text-blue { color: #3b82f6; }
        .text-green { color: #22c55e; }
        
        .brand-desc {
          font-size: 14px;
          color: #666;
          line-height: 1.6;
        }

        .footer-links-group {
          display: flex;
          gap: 60px;
          flex-wrap: wrap;
        }
        .link-col h4 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 20px;
          color: #444;
        }
        .link-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .link-col li {
          font-size: 14px;
          color: #777;
          margin-bottom: 12px;
          cursor: pointer;
          transition: color 0.2s;
        }
        .link-col li:hover {
          color: #3b82f6;
        }

        .footer-bottom {
          max-width: 1200px;
          margin: 40px auto 0;
          padding-top: 25px;
          border-top: 1px solid #f5f5f5;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #999;
        }
        .social-mini {
          display: flex;
          gap: 15px;
          font-weight: bold;
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .footer-content { flex-direction: column; text-align: center; }
          .footer-logo { justify-content: center; }
          .footer-links-group { justify-content: center; gap: 30px; }
          .footer-bottom { flex-direction: column; gap: 15px; }
        }
      `}</style>
    </footer>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getConsent } from "@/components/common/CookieConsent";

// ── GA4 แบบรอ consent (PDPA) ─────────────────────────────────
// โหลด gtag เฉพาะเมื่อผู้ใช้กด "ยอมรับทั้งหมด" — ก่อนหน้านั้นไม่ยิงอะไรเลย
// ฟัง event `pl-consent-analytics` จาก CookieConsent → โหลดทันทีไม่ต้องรีเฟรช

const GA_ID = "G-42HZ2VCDXZ";

export default function Analytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (getConsent()?.analytics) setAllowed(true);
    const on = () => setAllowed(true);
    window.addEventListener("pl-consent-analytics", on);
    return () => window.removeEventListener("pl-consent-analytics", on);
  }, []);

  useEffect(() => {
    if (!allowed || document.getElementById("pl-ga4")) return;
    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() { w.dataLayer.push(arguments); };
    w.gtag("js", new Date());
    w.gtag("config", GA_ID);
    const s = document.createElement("script");
    s.id = "pl-ga4";
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
  }, [allowed]);

  return null;
}

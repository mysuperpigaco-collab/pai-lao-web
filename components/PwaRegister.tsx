"use client";

import { useEffect } from "react";

// ลงทะเบียน service worker (production เท่านั้น)
// popup ชวนติดตั้งแบบลอยถูกถอดออกแล้ว — ปุ่มติดตั้งย้ายไปการ์ดแชร์ในหน้าโปรไฟล์
// (components/common/InstallAppButton.tsx) · คอมโพเนนต์นี้ทำหน้าที่ดัก
// beforeinstallprompt แล้วเก็บ event ไว้ที่ window.__plInstallEvt ให้ปุ่มใช้
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {});

    const onPrompt = (e: Event) => {
      e.preventDefault(); // กัน mini-infobar เด้งเองบน Android
      (window as any).__plInstallEvt = e;
      window.dispatchEvent(new CustomEvent("pl-install-ready"));
    };
    const onInstalled = () => {
      (window as any).__plInstallEvt = null;
      window.dispatchEvent(new CustomEvent("pl-install-done"));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return null;
}

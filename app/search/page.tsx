import { Suspense } from "react";
import SearchPageClient from "./SearchPageClient";

export default function SearchPage() {
  return (
    <Suspense fallback={
    <div style={{ padding: "60px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#10b981", animation: "_spin 0.8s linear infinite" }} />
      <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>กำลังโหลด...</p>
      <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  }>
      <SearchPageClient />
    </Suspense>
  );
}

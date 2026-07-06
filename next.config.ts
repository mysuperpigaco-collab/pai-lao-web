import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "X-Frame-Options",           value: "SAMEORIGIN" },
  { key: "X-XSS-Protection",          value: "1; mode=block" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=(self)" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // *.googleusercontent.com = รูปโปรไฟล์จาก Google login (lh3.googleusercontent.com)
      // google-analytics/googletagmanager = GA4 (tracking pixel)
      "img-src 'self' https://*.supabase.co https://images.unsplash.com https://picsum.photos https://*.tile.openstreetmap.org https://unpkg.com https://*.googleusercontent.com https://www.google-analytics.com https://www.googletagmanager.com data: blob:",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com",
      // frame-src = อนุญาต embed YouTube ในหน้าทริป (ไม่มีบรรทัดนี้ default-src 'self' จะบล็อก iframe)
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  // Prisma requires this for Vercel serverless
  serverExternalPackages: ["@prisma/client", "prisma", "isomorphic-dompurify", "jsdom", "sharp"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

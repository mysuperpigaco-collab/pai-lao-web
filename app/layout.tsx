import type { Metadata, Viewport } from "next";
import { Chakra_Petch } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/context/AuthContext";
import RippleProvider from "@/components/ui/RippleProvider";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import SplashScreen from "@/components/SplashScreen";
import NavTransition from "@/components/NavTransition";
import Script from "next/script";

const GA_ID = "G-42HZ2VCDXZ";

const chakraPetch = Chakra_Petch({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-chakra",
});

export const metadata: Metadata = {
  title: "ไปเล่า | PAI-LAO EXPERIENCE",
  description: "ชุมชนนักท่องเที่ยวไทย แบ่งปันเรื่องเล่าการเดินทาง ค้นหาสถานที่ท่องเที่ยว และวางแผนทริปได้ในที่เดียว",
  keywords: ["ท่องเที่ยว", "รีวิวทริป", "สถานที่ท่องเที่ยว", "ไทย", "pai-lao", "travel"],
  authors: [{ name: "PAI-LAO EXPERIENCE" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ไปเล่า",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://pai-lao.com",
    siteName: "ไปเล่า PAI-LAO EXPERIENCE",
    title: "ไปเล่า | PAI-LAO EXPERIENCE",
    description: "ชุมชนนักท่องเที่ยวไทย แบ่งปันเรื่องเล่าการเดินทาง",
  },
  twitter: {
    card: "summary_large_image",
    title: "ไปเล่า | PAI-LAO EXPERIENCE",
    description: "ชุมชนนักท่องเที่ยวไทย แบ่งปันเรื่องเล่าการเดินทาง",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={chakraPetch.variable} suppressHydrationWarning>
      <head>
        {/* ตั้งธีมก่อน paint กัน flash โหมดผิด (FOUC) */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(localStorage.getItem('pl-theme')==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();` }} />
      </head>
      <body className={chakraPetch.className}>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
        <SplashScreen />
        <NavTransition />
        <AuthProvider>
          <SmoothScrollProvider>
            <RippleProvider />
            <Navbar />
            <main style={{overflowX:"clip",maxWidth:"100%"}}>{children}</main>
            <Footer />
          </SmoothScrollProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

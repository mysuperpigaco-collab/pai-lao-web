import type { Metadata, Viewport } from "next";
import { Chakra_Petch } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/context/AuthContext";

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
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://pai-lao-web.vercel.app",
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
    <html lang="th" className={chakraPetch.variable}>
      <body className={chakraPetch.className}>
        <AuthProvider>
          <Navbar />
          <main style={{overflowX:"clip",maxWidth:"100%"}}>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

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
  description: "ก้าวแรกสู่การเป็นนักเล่าเรื่อง แบ่งปันประสบการณ์การเดินทาง",
};


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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

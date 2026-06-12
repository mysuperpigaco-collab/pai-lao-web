import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pai-lao.com";

export const metadata: Metadata = {
  title: "ทริปท่องเที่ยวไทย เรื่องเล่าจากนักเดินทาง | ไปเล่า",
  description: "รวมทริปท่องเที่ยวและเรื่องเล่าจากนักเดินทางทั่วไทย ค้นหาแรงบันดาลใจในการเดินทาง พร้อม timeline และรูปภาพสวยๆ",
  keywords: "ทริปท่องเที่ยว, รีวิวทริป, เรื่องเล่าการเดินทาง, ท่องเที่ยวไทย, แผนการเดินทาง",
  alternates: { canonical: `${SITE_URL}/trips` },
  openGraph: {
    title: "ทริปท่องเที่ยวไทย เรื่องเล่าจากนักเดินทาง | ไปเล่า",
    description: "รวมทริปท่องเที่ยวและเรื่องเล่าจากนักเดินทางทั่วไทย ค้นหาแรงบันดาลใจในการเดินทาง",
    url: `${SITE_URL}/trips`,
    siteName: "ไปเล่า",
    locale: "th_TH",
    type: "website",
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: "ทริปท่องเที่ยวไทย | ไปเล่า" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ทริปท่องเที่ยวไทย เรื่องเล่าจากนักเดินทาง | ไปเล่า",
    description: "รวมทริปท่องเที่ยวและเรื่องเล่าจากนักเดินทางทั่วไทย ค้นหาแรงบันดาลใจในการเดินทาง",
    images: [`${SITE_URL}/opengraph-image`],
  },
};

export default function TripsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

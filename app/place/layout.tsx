import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pai-lao.com";

export const metadata: Metadata = {
  title: "ค้นหาสถานที่ท่องเที่ยวไทย | ไปเล่า",
  description: "รวมสถานที่ท่องเที่ยวทั่วไทย ค้นหาตามจังหวัด หมวดหมู่ และความนิยม ทั้งธรรมชาติ วัด คาเฟ่ ชายหาด ตลาด และอีกมากมาย",
  keywords: "สถานที่ท่องเที่ยว, ท่องเที่ยวไทย, ที่เที่ยว, ธรรมชาติ, วัด, คาเฟ่, ชายหาด",
  alternates: { canonical: `${SITE_URL}/place` },
  openGraph: {
    title: "ค้นหาสถานที่ท่องเที่ยวไทย | ไปเล่า",
    description: "รวมสถานที่ท่องเที่ยวทั่วไทย ค้นหาตามจังหวัด หมวดหมู่ และความนิยม",
    url: `${SITE_URL}/place`,
    siteName: "ไปเล่า",
    locale: "th_TH",
    type: "website",
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: "สถานที่ท่องเที่ยวไทย | ไปเล่า" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ค้นหาสถานที่ท่องเที่ยวไทย | ไปเล่า",
    description: "รวมสถานที่ท่องเที่ยวทั่วไทย ค้นหาตามจังหวัด หมวดหมู่ และความนิยม",
    images: [`${SITE_URL}/opengraph-image`],
  },
};

export default function PlaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

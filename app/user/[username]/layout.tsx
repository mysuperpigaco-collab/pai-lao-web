import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ username: string }>; children: React.ReactNode };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pai-lao.com";

export async function generateMetadata({ params }: Props) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      displayName: true, firstName: true, lastName: true,
      bio: true, avatarUrl: true, role: true,
      _count: { select: { trips: true } },
    },
  }).catch(() => null);

  if (!user) return { title: `@${username} | ไปเล่า` };

  const name  = user.displayName || `${user.firstName} ${user.lastName || ""}`.trim();
  const desc  = user.bio || `นักเดินทาง ${user._count.trips} เรื่องเล่าบนไปเล่า`;

  // ไม่ใส่ images — ให้ opengraph-image.tsx (การ์ดโปรไฟล์อัตโนมัติ) จัดการ
  return {
    title:       `${name} (@${username}) | ไปเล่า`,
    description: desc,
    openGraph: {
      title:       `${name} (@${username})`,
      description: desc,
      url:         `${SITE_URL}/user/${username}`,
      siteName:    "ไปเล่า",
      type:        "profile",
      locale:      "th_TH",
    },
    twitter: {
      card:        "summary_large_image",
      title:       `${name} (@${username})`,
      description: desc,
    },
  };
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

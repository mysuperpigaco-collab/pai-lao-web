import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ username: string }>; children: React.ReactNode };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pai-lao-web.vercel.app";

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
  const image = user.avatarUrl || `${SITE_URL}/images/og-default.png`;

  return {
    title:       `${name} (@${username}) | ไปเล่า`,
    description: desc,
    openGraph: {
      title:       `${name} (@${username})`,
      description: desc,
      url:         `${SITE_URL}/user/${username}`,
      siteName:    "ไปเล่า",
      images:      [{ url: image, width: 400, height: 400, alt: name }],
      type:        "profile",
      locale:      "th_TH",
    },
    twitter: {
      card:        "summary",
      title:       `${name} (@${username})`,
      description: desc,
      images:      [image],
    },
  };
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

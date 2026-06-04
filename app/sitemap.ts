import { prisma } from "@/lib/prisma";
import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pai-lao-web.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [trips, places] = await Promise.all([
    prisma.trip.findMany({
      where: { isPublished: true, approvalStatus: "APPROVED", isDraft: false },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 1000,
    }),
    prisma.place.findMany({
      where: { approvalStatus: "APPROVED" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 1000,
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL,              lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${SITE_URL}/trips`,   lastModified: new Date(), changeFrequency: "hourly",  priority: 0.9 },
    { url: `${SITE_URL}/place`,   lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${SITE_URL}/login`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/register`,lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  const tripRoutes: MetadataRoute.Sitemap = trips.map(t => ({
    url:             `${SITE_URL}/trips/${t.slug}`,
    lastModified:    t.updatedAt,
    changeFrequency: "weekly",
    priority:        0.8,
  }));

  const placeRoutes: MetadataRoute.Sitemap = places.map(p => ({
    url:             `${SITE_URL}/place/${p.slug}`,
    lastModified:    p.updatedAt,
    changeFrequency: "weekly",
    priority:        0.8,
  }));

  return [...staticRoutes, ...tripRoutes, ...placeRoutes];
}

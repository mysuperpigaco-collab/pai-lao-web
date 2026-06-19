import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import EditTripForm from "./EditTripForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function EditTripPage({ params }: Props) {
  const { slug } = await params;
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  const trip = await prisma.trip.findUnique({
    where: { slug },
    select: {
      authorId:      true,
      title:         true,
      description:   true,
      budget:        true,
      mood:          true,
      tags:          true,
      youtubeUrl:    true,
      tiktokUrl:     true,
      coverUrl:      true,
      gallery:       true,
      isDraft:       true,
      isPublished:   true,
      approvalStatus: true,
      timeline: {
        orderBy: { order: "asc" },
        select: {
          date: true, time: true, placeName: true,
          province: true, district: true, description: true,
          images: true, shareToPlace: true, rating: true,
          placeId: true, lat: true, lng: true, googleMapsUrl: true,
        },
      },
    },
  });

  if (!trip) notFound();

  const isAdmin = session.role === "ADMIN" || session.role === "SUPERADMIN";
  if (trip.authorId !== session.userId && !isAdmin) redirect("/");

  return <EditTripForm initialTrip={trip} slug={slug} />;
}

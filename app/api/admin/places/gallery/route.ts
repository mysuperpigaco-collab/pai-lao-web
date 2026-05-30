import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// PATCH /api/admin/places/gallery — add/remove gallery photos, optionally set coverUrl
export async function PATCH(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { placeId, addPhotos, removePhoto, setCover } = await req.json();
  if (!placeId) return NextResponse.json({ message: "Missing placeId" }, { status: 400 });

  const place = await prisma.place.findUnique({ where: { id: placeId }, select: { gallery: true, coverUrl: true } });
  if (!place) return NextResponse.json({ message: "Not found" }, { status: 404 });

  let gallery = place.gallery ?? [];
  if (addPhotos && Array.isArray(addPhotos)) gallery = [...gallery, ...addPhotos];
  if (removePhoto) gallery = gallery.filter((g: string) => g !== removePhoto);

  const updateData: Record<string, unknown> = { gallery };
  if (setCover) updateData.coverUrl = setCover;

  const updated = await prisma.place.update({
    where: { id: placeId },
    data: updateData,
    select: { id: true, gallery: true, coverUrl: true },
  });
  return NextResponse.json({ place: updated });
}

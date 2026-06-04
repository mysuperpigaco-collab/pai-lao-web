"use client";
import { useViewCount } from "@/hooks/useViewCount";

export default function ViewTracker({ type, slug }: { type: "trips" | "places"; slug: string }) {
  useViewCount(type, slug);
  return null;
}

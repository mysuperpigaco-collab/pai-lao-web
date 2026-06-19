import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import "./plan-view.css";
import PlanShareView from "./PlanShareView";

type Props = { params: Promise<{ id: string }> };

export default async function PlanViewPage({ params }: Props) {
  const { id } = await params;

  const plan = await (prisma as any).tripPlan.findUnique({
    where: { id },
    include: {
      user: { select: { displayName: true, firstName: true, username: true, avatarUrl: true } },
      stops: {
        orderBy: [{ day: "asc" }, { order: "asc" }],
        include: {
          place: { select: { id: true, slug: true, title: true, coverUrl: true } },
        },
      },
    },
  });

  if (!plan) return notFound();

  const session = await getCurrentUser();
  const isOwner = session?.userId === plan.userId;
  if (!plan.isPublic && !isOwner) return notFound();

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pai-lao.com";
  const shareUrl = `${origin}/planner/${id}`;

  return <PlanShareView plan={plan} shareUrl={shareUrl} />;
}

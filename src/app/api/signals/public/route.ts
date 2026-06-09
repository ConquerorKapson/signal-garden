import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/signals/public — public feed (no auth required)
export async function GET() {
  const signals = await prisma.signal.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      content: true,
      mood: true,
      dateKey: true,
      createdAt: true,
      user: {
        select: { firstName: true, imageUrl: true },
      },
      // Never expose clerkUserId in public feed
    },
  });

  return NextResponse.json(signals);
}

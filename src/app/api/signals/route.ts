import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const VALID_MOODS = ["calm", "focused", "anxious", "excited", "tired"] as const;

// POST /api/signals — create today's signal
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { content, mood, isPublic } = body;

  // Validate input
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }
  if (content.length > 240) {
    return NextResponse.json({ error: "Content must be 240 chars or less" }, { status: 400 });
  }
  if (!VALID_MOODS.includes(mood)) {
    return NextResponse.json({ error: "Invalid mood" }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Ensure a local user row exists even if webhook delivery is delayed.
    await prisma.user.upsert({
      where: { clerkId: userId },
      create: { clerkId: userId },
      update: {},
    });

    const signal = await prisma.signal.create({
      data: {
        clerkUserId: userId,
        content: content.trim(),
        mood,
        isPublic: Boolean(isPublic),
        dateKey: today,
      },
    });
    return NextResponse.json(signal, { status: 201 });
  } catch (err: unknown) {
    // Unique constraint violation — already posted today
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "You have already posted a signal today" },
        { status: 409 }
      );
    }
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2003"
    ) {
      return NextResponse.json(
        { error: "User record sync incomplete. Please retry." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/signals — get current user's signals
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Number(req.nextUrl.searchParams.get("limit")) || 30;
  const all = req.nextUrl.searchParams.get("all") === "true";

  const signals = await prisma.signal.findMany({
    where: { clerkUserId: userId },
    orderBy: { dateKey: "desc" },
    ...(all ? {} : { take: limit }),
  });

  return NextResponse.json(signals);
}

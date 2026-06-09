import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const VALID_MOODS = ["calm", "focused", "anxious", "excited", "tired"] as const;

// PATCH /api/signals/[id] — edit a signal
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const signal = await prisma.signal.findUnique({ where: { id } });
  if (!signal || signal.clerkUserId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { content, mood, isPublic } = body;

  const updateData: Record<string, unknown> = {};

  if (content !== undefined) {
    if (typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    if (content.length > 240) {
      return NextResponse.json({ error: "Content must be 240 chars or less" }, { status: 400 });
    }
    updateData.content = content.trim();
  }

  if (mood !== undefined) {
    if (!VALID_MOODS.includes(mood)) {
      return NextResponse.json({ error: "Invalid mood" }, { status: 400 });
    }
    updateData.mood = mood;
  }

  if (isPublic !== undefined) {
    updateData.isPublic = Boolean(isPublic);
  }

  const updated = await prisma.signal.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}

// DELETE /api/signals/[id] — delete a signal
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const signal = await prisma.signal.findUnique({ where: { id } });
  if (!signal || signal.clerkUserId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.signal.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}

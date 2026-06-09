import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET /api/signals/stats?month=2026-06
// Returns mood breakdown for the given month
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const monthParam = req.nextUrl.searchParams.get("month");
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1;
  }

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  const signals = await prisma.signal.findMany({
    where: {
      clerkUserId: userId,
      dateKey: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    select: {
      mood: true,
      dateKey: true,
    },
    orderBy: { dateKey: "asc" },
  });

  // Mood breakdown
  const moodCounts: Record<string, number> = {};
  for (const signal of signals) {
    moodCounts[signal.mood] = (moodCounts[signal.mood] || 0) + 1;
  }

  // Days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysWithSignals = signals.length;

  // Dominant mood
  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0] ?? null;

  return NextResponse.json({
    month: `${year}-${String(month + 1).padStart(2, "0")}`,
    totalSignals: daysWithSignals,
    daysInMonth,
    completionRate: Math.round((daysWithSignals / daysInMonth) * 100),
    moodBreakdown: moodCounts,
    dominantMood: dominantMood ? { mood: dominantMood[0], days: dominantMood[1] } : null,
    signals: signals.map((s) => ({ mood: s.mood, date: s.dateKey })),
  });
}

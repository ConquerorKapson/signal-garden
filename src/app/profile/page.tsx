"use client";

import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";

interface MoodStats {
  month: string;
  totalSignals: number;
  daysInMonth: number;
  completionRate: number;
  moodBreakdown: Record<string, number>;
  dominantMood: { mood: string; days: number } | null;
  signals: { mood: string; date: string }[];
}

const MOOD_EMOJI: Record<string, string> = {
  calm: "🧘",
  focused: "🎯",
  anxious: "😰",
  excited: "⚡",
  tired: "😴",
};

const MOOD_COLORS: Record<string, string> = {
  calm: "bg-blue-100 text-blue-800",
  focused: "bg-amber-100 text-amber-800",
  anxious: "bg-rose-100 text-rose-800",
  excited: "bg-purple-100 text-purple-800",
  tired: "bg-slate-100 text-slate-800",
};

export default function ProfilePage() {
  const { user } = useUser();
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [totalSignals, setTotalSignals] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const [statsRes, signalsRes] = await Promise.all([
        fetch(`/api/signals/stats?month=${selectedMonth}`),
        fetch("/api/signals?all=true"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (signalsRes.ok) {
        const all = await signalsRes.json();
        setTotalSignals(all.length);
      }
      setLoading(false);
    }
    fetchStats();
  }, [selectedMonth]);

  const months = generateLastMonths(6);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong sticky top-0 z-40 border-b border-[var(--border)]"
      >
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              ← Back
            </Link>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">Your Profile</h1>
          </div>
          <UserButton />
        </div>
      </motion.header>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {/* User Info */}
        <motion.div
          className="card-elevated p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {user?.imageUrl && (
            <img
              src={user.imageUrl}
              alt=""
              className="w-20 h-20 rounded-full mx-auto mb-4 ring-4 ring-[var(--surface-sage)]"
            />
          )}
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            {user?.firstName} {user?.lastName}
          </h2>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            {user?.primaryEmailAddress?.emailAddress}
          </p>
          <p className="text-sm text-[var(--text-tertiary)] mt-2">
            Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : ""}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-[var(--surface-sage)] px-4 py-2 rounded-full">
            <span className="text-lg">🌱</span>
            <span className="text-sm font-medium text-[var(--forest)]">{totalSignals} total signals planted</span>
          </div>
        </motion.div>

        {/* Month Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-caption text-[var(--text-tertiary)] mb-3">Monthly Mood Report</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {months.map((m) => (
              <button
                key={m.value}
                onClick={() => setSelectedMonth(m.value)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                  selectedMonth === m.value
                    ? "bg-[var(--forest)] text-white"
                    : "bg-[var(--bg-deep)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        {loading ? (
          <div className="card-elevated p-10 text-center text-sm text-[var(--text-tertiary)]">
            Loading stats...
          </div>
        ) : stats ? (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Overview Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="card-elevated p-5 text-center">
                <p className="text-2xl font-semibold text-[var(--forest)]">{stats.totalSignals}</p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-1 uppercase tracking-wider">Days Logged</p>
              </div>
              <div className="card-elevated p-5 text-center">
                <p className="text-2xl font-semibold text-[var(--forest)]">{stats.completionRate}%</p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-1 uppercase tracking-wider">Completion</p>
              </div>
              <div className="card-elevated p-5 text-center">
                <p className="text-2xl font-semibold text-[var(--forest)]">
                  {stats.dominantMood ? MOOD_EMOJI[stats.dominantMood.mood] : "—"}
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-1 uppercase tracking-wider">
                  {stats.dominantMood ? `${stats.dominantMood.mood} (${stats.dominantMood.days}d)` : "No data"}
                </p>
              </div>
            </div>

            {/* Mood Breakdown */}
            {Object.keys(stats.moodBreakdown).length > 0 && (
              <div className="card-elevated p-6 space-y-4">
                <h4 className="text-sm font-medium text-[var(--text-primary)]">Mood Breakdown</h4>
                <div className="space-y-3">
                  {Object.entries(stats.moodBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([mood, count]) => (
                      <div key={mood} className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${MOOD_COLORS[mood] || ""}`}>
                          {MOOD_EMOJI[mood] || "❓"}
                        </span>
                        <span className="text-sm text-[var(--text-secondary)] capitalize w-16">{mood}</span>
                        <div className="flex-1 bg-[var(--bg-deep)] rounded-full h-3 overflow-hidden">
                          <motion.div
                            className="h-full bg-[var(--forest)] rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(count / stats.totalSignals) * 100}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-sm text-[var(--text-tertiary)] w-16 text-right">
                          {count} day{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* No data state */}
            {stats.totalSignals === 0 && (
              <div className="card-elevated p-10 text-center">
                <span className="text-3xl block mb-3">📊</span>
                <p className="text-sm text-[var(--text-tertiary)]">
                  No signals for this month yet. Start logging to see your mood patterns.
                </p>
              </div>
            )}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}

function generateLastMonths(count: number) {
  const months = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    });
  }
  return months;
}

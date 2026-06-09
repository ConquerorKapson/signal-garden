"use client";

import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { SignalForm } from "@/components/SignalForm";
import { SignalCard } from "@/components/SignalCard";

interface Signal {
  id: string;
  content: string;
  mood: string;
  isPublic: boolean;
  dateKey: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user } = useUser();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchSignals() {
    setLoading(true);
    const res = await fetch("/api/signals");
    if (res.ok) {
      const data = await res.json();
      setSignals(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchSignals();
  }, []);

  const streak = calculateStreak(signals);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* ═══ Sticky Header ═══ */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong sticky top-0 z-40 border-b border-[var(--border)]"
      >
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              <span>🌱</span> Your Garden
            </h1>
            <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
              Welcome back, {user?.firstName || "gardener"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="text-[13px] px-3 py-1.5 rounded-full bg-[var(--bg-deep)] text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors"
            >
              📊 Stats
            </Link>
            <UserButton
              appearance={{
                elements: { avatarBox: "w-9 h-9 ring-2 ring-[var(--border)] ring-offset-2" },
              }}
            />
          </div>
        </div>
      </motion.header>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">
        {/* ═══ Stats ═══ */}
        <motion.div
          className="grid grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <StatCard label="Signals" value={signals.length} icon="📝" />
          <StatCard label="Streak" value={`${streak}d`} icon="🔥" />
          <StatCard label="Public" value={signals.filter((s) => s.isPublic).length} icon="🌍" />
        </motion.div>

        {/* ═══ Form ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <SignalForm onSuccess={fetchSignals} />
        </motion.div>

        {/* ═══ Signal History ═══ */}
        <motion.section
          className="space-y-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-caption text-[var(--text-tertiary)]">
            Recent Signals
          </h2>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="card-elevated p-10 text-center"
              >
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-sm text-[var(--text-tertiary)]"
                >
                  Loading your signals...
                </motion.div>
              </motion.div>
            ) : signals.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card-elevated p-14 text-center"
              >
                <span className="text-4xl mb-4 block">🌿</span>
                <p className="text-[15px] text-[var(--text-secondary)]">
                  Your garden is empty. Plant your first signal above.
                </p>
              </motion.div>
            ) : (
              <motion.div key="list" className="space-y-3">
                {signals.map((signal, i) => (
                  <motion.div
                    key={signal.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <SignalCard
                      signal={signal}
                      editable
                      onUpdate={fetchSignals}
                      onDelete={fetchSignals}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <motion.div
      className="card-elevated p-6 text-center"
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <span className="text-xl block mb-2">{icon}</span>
      <p className="text-2xl font-semibold text-[var(--forest)] tracking-tight">{value}</p>
      <p className="text-[12px] text-[var(--text-tertiary)] mt-1.5 uppercase tracking-wider">{label}</p>
    </motion.div>
  );
}

function calculateStreak(signals: Signal[]): number {
  if (signals.length === 0) return 0;

  const sorted = [...signals].sort(
    (a, b) => new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime()
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const signalDate = new Date(sorted[i].dateKey);
    signalDate.setHours(0, 0, 0, 0);

    if (signalDate.getTime() === expected.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

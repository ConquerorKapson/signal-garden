"use client";

import { motion } from "framer-motion";

const MOOD_EMOJI: Record<string, string> = {
  calm: "🧘",
  focused: "🎯",
  anxious: "😰",
  excited: "⚡",
  tired: "😴",
};

const MOOD_BG: Record<string, string> = {
  calm: "bg-blue-50 border-blue-100",
  focused: "bg-amber-50 border-amber-100",
  anxious: "bg-rose-50 border-rose-100",
  excited: "bg-purple-50 border-purple-100",
  tired: "bg-slate-50 border-slate-100",
};

interface Signal {
  id: string;
  content: string;
  mood: string;
  isPublic?: boolean;
  dateKey: string;
  createdAt: string;
}

export function SignalCard({ signal, showDate = true }: { signal: Signal; showDate?: boolean }) {
  const date = new Date(signal.dateKey).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <motion.div
      className="card-elevated p-6 space-y-4"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm ${MOOD_BG[signal.mood] || "bg-[var(--surface-sage)]"}`}>
            {MOOD_EMOJI[signal.mood] || "❓"}
          </span>
          <span className="text-[13px] font-medium text-[var(--text-secondary)] capitalize">
            {signal.mood}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {signal.isPublic !== undefined && (
            <span className={`inline-flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full ${
              signal.isPublic
                ? "text-[var(--sage)] bg-[var(--surface-sage)]"
                : "text-[var(--text-tertiary)] bg-[var(--bg-deep)]"
            }`}>
              {signal.isPublic ? "🌍 Public" : "🔒 Private"}
            </span>
          )}
          {showDate && (
            <span className="text-[12px] text-[var(--text-tertiary)] tabular-nums">{date}</span>
          )}
        </div>
      </div>
      <p className="text-[15px] text-[var(--text-primary)] leading-relaxed">{signal.content}</p>
    </motion.div>
  );
}

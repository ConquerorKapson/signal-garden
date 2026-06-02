"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MOODS = [
  { value: "calm", emoji: "🧘", label: "Calm" },
  { value: "focused", emoji: "🎯", label: "Focused" },
  { value: "anxious", emoji: "😰", label: "Anxious" },
  { value: "excited", emoji: "⚡", label: "Excited" },
  { value: "tired", emoji: "😴", label: "Tired" },
] as const;

export function SignalForm({ onSuccess }: { onSuccess: () => void }) {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string>("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/signals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, mood, isPublic }),
    });

    if (res.ok) {
      setContent("");
      setMood("");
      setIsPublic(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      onSuccess();
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong");
    }
    setLoading(false);
  }

  const charProgress = content.length / 240;

  return (
    <form onSubmit={handleSubmit} className="card-elevated p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-caption text-[var(--text-tertiary)]">
          Today&apos;s Signal
        </h2>
        <AnimatePresence>
          {success && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-[13px] text-[var(--sage)] font-medium"
            >
              ✓ Planted!
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Content input */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind today?"
          maxLength={240}
          rows={3}
          className="w-full p-5 rounded-[var(--radius)] bg-[var(--bg-deep)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none text-[15px] leading-relaxed transition-all duration-300 focus:bg-[var(--surface)] focus:shadow-sm"
        />
        {/* Character progress bar */}
        <div className="mt-2 flex items-center justify-between">
          <div className="h-1 flex-1 max-w-[120px] rounded-full bg-[var(--bg-deep)] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: charProgress > 0.9 ? "var(--coral)" : "var(--sage)" }}
              animate={{ width: `${charProgress * 100}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>
          <span className="text-[12px] text-[var(--text-tertiary)] tabular-nums">
            {content.length}/240
          </span>
        </div>
      </div>

      {/* Mood selector */}
      <div>
        <p className="text-[13px] text-[var(--text-secondary)] mb-3">How are you feeling?</p>
        <div className="flex gap-2 flex-wrap">
          {MOODS.map((m) => (
            <motion.button
              key={m.value}
              type="button"
              onClick={() => setMood(m.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2.5 rounded-full text-[13px] border transition-colors ${
                mood === m.value
                  ? "border-[var(--sage)] bg-[var(--surface-sage)] text-[var(--forest)] shadow-sm"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--sage-light)] hover:bg-[var(--bg-deep)]"
              }`}
            >
              <span className="mr-1.5">{m.emoji}</span>{m.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Public toggle */}
      <label className="flex items-center gap-3 text-[14px] text-[var(--text-secondary)] cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 rounded-full bg-[var(--bg-deep)] border border-[var(--border)] peer-checked:bg-[var(--sage)] peer-checked:border-[var(--sage)] transition-colors" />
          <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
        </div>
        Share on public feed
      </label>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-[14px] text-[var(--coral)] bg-red-50 px-4 py-3 rounded-[var(--radius-sm)]"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={loading || !content.trim() || !mood}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
      >
        {loading ? (
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Planting...
          </motion.span>
        ) : (
          <>Plant Signal <span className="text-base">🌱</span></>
        )}
      </motion.button>
    </form>
  );
}

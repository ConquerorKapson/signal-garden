"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SignalCard } from "@/components/SignalCard";

interface PublicSignal {
  id: string;
  content: string;
  mood: string;
  dateKey: string;
  createdAt: string;
  user?: { firstName: string | null; imageUrl: string | null };
}

export default function FeedPage() {
  const [signals, setSignals] = useState<PublicSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/signals/public")
      .then((res) => res.json())
      .then((data) => setSignals(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong sticky top-0 z-40 border-b border-[var(--border)]"
      >
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              <span>🌍</span> Public Feed
            </h1>
            <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">Signals from the community</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="btn-secondary !py-2 !px-4 !text-[13px]">
              Home
            </Link>
            <Link href="/sign-in" className="btn-primary !py-2 !px-4 !text-[13px]">
              Sign in
            </Link>
          </div>
        </div>
      </motion.header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card-elevated p-10 text-center"
            >
              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-sm text-[var(--text-tertiary)]"
              >
                Loading signals...
              </motion.p>
            </motion.div>
          ) : signals.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-elevated p-14 text-center"
            >
              <span className="text-4xl mb-4 block">🌿</span>
              <p className="text-[15px] text-[var(--text-secondary)]">No public signals yet. Be the first to share!</p>
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
                  <div className="card-elevated p-6 space-y-4">
                    {signal.user && (
                      <div className="flex items-center gap-2">
                        {signal.user.imageUrl && (
                          <img src={signal.user.imageUrl} alt="" className="w-6 h-6 rounded-full" />
                        )}
                        <span className="text-[13px] text-[var(--text-secondary)] font-medium">
                          {signal.user.firstName || "Anonymous"}
                        </span>
                      </div>
                    )}
                    <SignalCard signal={signal} showDate />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

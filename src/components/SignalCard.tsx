"use client";

import { useState } from "react";
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

export function SignalCard({
  signal,
  showDate = true,
  editable = false,
  onUpdate,
  onDelete,
}: {
  signal: Signal;
  showDate?: boolean;
  editable?: boolean;
  onUpdate?: () => void;
  onDelete?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(signal.content);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const date = new Date(signal.dateKey).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/signals/${signal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(false);
      onUpdate?.();
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this signal? This cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/signals/${signal.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      onDelete?.();
    }
  }

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

      {editing ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--forest)]"
            rows={3}
            maxLength={240}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setEditing(false); setEditContent(signal.content); }}
              className="text-sm px-3 py-1.5 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-deep)]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || editContent.trim().length === 0}
              className="text-sm px-3 py-1.5 rounded-lg bg-[var(--forest)] text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[15px] text-[var(--text-primary)] leading-relaxed">{signal.content}</p>
      )}

      {editable && !editing && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setEditing(true)}
            className="text-[12px] px-3 py-1 rounded-full text-[var(--text-tertiary)] hover:bg-[var(--bg-deep)] hover:text-[var(--text-secondary)] transition-colors"
          >
            ✏️ Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-[12px] px-3 py-1 rounded-full text-[var(--text-tertiary)] hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "🗑️ Delete"}
          </button>
        </div>
      )}
    </motion.div>
  );
}

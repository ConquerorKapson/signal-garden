"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SignInPage() {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen bg-[var(--bg)] px-6 overflow-hidden">
      {/* Background organic shapes */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-[30%] -right-[20%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[var(--sage)]/6 to-transparent blur-3xl" />
        <div className="absolute bottom-[10%] -left-[15%] w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-[var(--lavender)]/5 to-transparent blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 7H3M3 7l4-4M3 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to Signal Garden
        </Link>

        <SignIn
          appearance={{
            elements: {
              card: "shadow-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md",
              headerTitle: "text-[var(--text-primary)] font-semibold",
              headerSubtitle: "text-[var(--text-secondary)]",
              formButtonPrimary: "bg-[var(--forest)] hover:bg-[var(--moss)] rounded-full shadow-sm",
              footerActionLink: "text-[var(--forest)] hover:text-[var(--moss)]",
              formFieldInput: "rounded-xl border-[var(--border)] focus:ring-[var(--sage)] focus:border-[var(--sage)]",
            },
          }}
        />
      </motion.div>
    </main>
  );
}

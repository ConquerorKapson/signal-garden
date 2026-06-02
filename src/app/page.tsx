"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  RevealContainer,
  RevealItem,
  FadeIn,
  FloatingElement,
} from "@/components/Motion";

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      {/* ═══ Floating Navigation ═══ */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-5 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-full px-7 py-3 shadow-sm"
      >
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg">🌱</span>
            <span className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
              Signal Garden
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/feed"
              className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Feed
            </Link>
            <Link
              href="/sign-in"
              className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Sign in
            </Link>
            <Link href="/sign-up" className="btn-primary !py-2 !px-5 !text-[13px]">
              Get started
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ═══ Background Organic Shapes ═══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[30%] -right-[20%] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-[var(--sage)]/8 to-transparent blur-3xl" />
        <div className="absolute top-[40%] -left-[15%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[var(--sky)]/6 to-transparent blur-3xl" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-[var(--lavender)]/5 to-transparent blur-3xl" />
      </div>

      {/* ═══ Hero Section — Full viewport, cinematic ═══ */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-3xl mx-auto">
          {/* Floating decorative element */}
          <FloatingElement className="mb-10" amplitude={6} duration={5}>
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface-sage)] border border-[var(--border-subtle)] text-[13px] text-[var(--moss)] font-medium">
                <span className="w-2 h-2 rounded-full bg-[var(--sage)] animate-pulse" />
                Now in open beta
              </span>
            </motion.div>
          </FloatingElement>

          {/* Display heading — cascading word reveal */}
          <motion.h1
            className="text-display text-[var(--text-primary)] mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              A quiet space
            </motion.span>
            <motion.span
              className="block text-[var(--forest)]"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              for daily reflection
            </motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-body text-[var(--text-secondary)] max-w-md mx-auto mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            Plant one signal each day — a thought, a mood, an insight.
            Watch your patterns bloom over time.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href="/sign-up" className="btn-primary">
              Begin your garden
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-1">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link href="/feed" className="btn-secondary">
              Browse public signals
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border-2 border-[var(--border)] flex items-start justify-center p-1"
          >
            <motion.div className="w-1 h-2 rounded-full bg-[var(--sage)]" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ Features Section ═══ */}
      <section className="relative py-32 px-6">
        <RevealContainer className="max-w-4xl mx-auto">
          <RevealItem>
            <p className="text-caption text-[var(--text-tertiary)] text-center mb-16">
              Why Signal Garden
            </p>
          </RevealItem>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RevealItem>
              <FeatureCard
                icon="🌱"
                title="One signal a day"
                description="No infinite scrolling. No pressure. Just one mindful moment — a sentence and a mood."
              />
            </RevealItem>
            <RevealItem>
              <FeatureCard
                icon="✨"
                title="Patterns emerge"
                description="Over weeks and months, your signals reveal emotional rhythms you never noticed before."
              />
            </RevealItem>
            <RevealItem>
              <FeatureCard
                icon="🌊"
                title="Share or stay quiet"
                description="Your garden, your rules. Go public to inspire others, or keep it entirely private."
              />
            </RevealItem>
          </div>
        </RevealContainer>
      </section>

      {/* ═══ How It Works — Cinematic Steps ═══ */}
      <section className="relative py-32 px-6 bg-[var(--bg-deep)]">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-20">
            <p className="text-caption text-[var(--text-tertiary)] mb-4">The ritual</p>
            <h2 className="text-headline text-[var(--text-primary)]">
              Three steps.<br />Thirty seconds.
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FadeIn delay={0.1}>
              <StepCard number="01" title="Write" description="One thought. One observation. Whatever is true right now." />
            </FadeIn>
            <FadeIn delay={0.25}>
              <StepCard number="02" title="Feel" description="Choose the mood that resonates. No overthinking required." />
            </FadeIn>
            <FadeIn delay={0.4}>
              <StepCard number="03" title="Grow" description="Come back tomorrow. Watch your inner garden take shape." />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══ Testimonial / Pull Quote ═══ */}
      <section className="relative py-32 px-6">
        <FadeIn className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <span className="inline-block w-12 h-[2px] bg-[var(--sage)]/40 rounded-full" />
          </div>
          <blockquote className="text-headline text-[var(--text-primary)]/80 font-light italic leading-snug mb-6">
            &ldquo;The quietest ritual became my most revealing mirror.&rdquo;
          </blockquote>
          <p className="text-caption text-[var(--text-tertiary)]">A Signal Gardener</p>
        </FadeIn>
      </section>

      {/* ═══ Final CTA ═══ */}
      <section className="relative py-32 px-6">
        <FadeIn className="max-w-xl mx-auto text-center">
          <h2 className="text-headline text-[var(--text-primary)] mb-6">
            Ready to plant your first signal?
          </h2>
          <p className="text-body text-[var(--text-secondary)] mb-10">
            It takes 30 seconds. No credit card. Just you and your thoughts.
          </p>
          <Link href="/sign-up" className="btn-primary">
            Start for free
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-1">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </FadeIn>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="relative px-6 py-12 border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌱</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">Signal Garden</span>
          </div>
          <p className="text-[13px] text-[var(--text-tertiary)]">
            A space that respects your attention.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/feed" className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Feed
            </Link>
            <Link href="/sign-in" className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="card-elevated p-8 text-center h-full">
      <span className="text-3xl mb-5 block">{icon}</span>
      <h3 className="text-title text-[var(--text-primary)] mb-3 !text-base">{title}</h3>
      <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <span className="inline-block text-[11px] font-semibold text-[var(--sage)] tracking-widest mb-4">
        {number}
      </span>
      <h3 className="text-title text-[var(--text-primary)] mb-3">{title}</h3>
      <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">{description}</p>
    </div>
  );
}

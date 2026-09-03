'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { person, projects, recruiterView } from '@/data/portfolioData';
import { useEscape, useReducedMotion, useScrollLock } from '@/lib/hooks';
import { Arrow } from '@/components/ui/Atoms';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The 60-second view.
 *
 * Strips every decorative element and answers the four questions a recruiter
 * actually has: who, what, what is the proof, and what should they do next.
 * Implemented as a modal dialog so it can be reached from anywhere on the site
 * without losing scroll position.
 */
export function RecruiterMode({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useScrollLock(open);
  useEscape(open, onClose);

  // Move focus into the dialog on open, and back out on close.
  useEffect(() => {
    if (open) {
      restoreFocus.current = document.activeElement as HTMLElement;
      const id = window.setTimeout(() => closeRef.current?.focus(), 60);
      return () => window.clearTimeout(id);
    }
    restoreFocus.current?.focus?.();
  }, [open]);

  // Keep Tab inside the dialog while it is open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink-950/92 px-4 py-6 backdrop-blur-md sm:px-6 sm:py-10"
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.24 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="recruiter-title"
            initial={reduced ? false : { opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="relative w-full max-w-[980px] rounded-2xl border border-white/[0.1] bg-[#0a0c11] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4 sm:px-8">
              <div className="flex items-center gap-3">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
                </span>
                <span className="label label-accent">60-second view</span>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="flex h-8 items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-3 text-[11.5px] text-muted transition-colors duration-300 hover:border-white/25 hover:text-chalk"
              >
                Close
                <span className="font-mono text-[9.5px] text-faint">ESC</span>
              </button>
            </div>

            <div className="px-5 py-7 sm:px-8 sm:py-9">
              <h2
                id="recruiter-title"
                className="font-display text-[clamp(1.5rem,3.5vw,2.1rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-chalk"
              >
                {person.name}
                <span className="mt-2 block text-[13px] font-normal leading-relaxed tracking-normal text-muted">
                  {person.title}
                </span>
              </h2>

              {/* Who / What */}
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {[
                  { k: 'Who', v: recruiterView.who },
                  { k: 'What', v: recruiterView.what },
                ].map((item) => (
                  <div key={item.k} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
                    <span className="label label-accent">{item.k}</span>
                    <p className="mt-3 text-[13.5px] leading-relaxed text-chalk/90">{item.v}</p>
                  </div>
                ))}
              </div>

              {/* Proof */}
              <div className="mt-6">
                <div className="section-eyebrow">
                  <span className="label label-accent">Proof</span>
                  <span className="hairline" aria-hidden="true" />
                </div>
                <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                  {recruiterView.proof.map((p) => (
                    <li key={p} className="flex gap-3 text-[13px] leading-relaxed text-muted">
                      <span className="mt-[7px] h-px w-3 shrink-0 bg-accent/60" aria-hidden="true" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Projects, in one line each */}
              <div className="mt-7">
                <div className="section-eyebrow">
                  <span className="label label-accent">Projects</span>
                  <span className="hairline" aria-hidden="true" />
                </div>
                <ul className="mt-4 grid gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.05] sm:grid-cols-2">
                  {projects.map((p) => (
                    <li key={p.slug} className="bg-[#0a0c11]">
                      <Link
                        href={`/projects/${p.slug}`}
                        onClick={onClose}
                        className="group flex h-full flex-col gap-1.5 px-4 py-3.5 transition-colors duration-300 hover:bg-white/[0.03]"
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-accent-soft/70 tnum">{p.index}</span>
                          <span className="text-[13px] font-medium text-chalk">{p.shortTitle}</span>
                          <span className="ml-auto text-muted">
                            <Arrow />
                          </span>
                        </span>
                        <span className="text-[11.5px] leading-snug text-faint">{p.positioning}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Target */}
              <div className="mt-7">
                <div className="section-eyebrow">
                  <span className="label label-accent">Target roles</span>
                  <span className="hairline" aria-hidden="true" />
                </div>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {recruiterView.target.map((t) => (
                    <li key={t} className="chip">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="mt-9 flex flex-wrap items-center gap-3 border-t border-white/[0.07] pt-7">
                <a
                  href={person.resumeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex h-11 items-center gap-2.5 rounded-full bg-chalk px-6 text-[13px] font-medium text-ink-950 transition-colors duration-300 hover:bg-white"
                >
                  View resume
                  <Arrow direction="up-right" />
                </a>
                <a
                  href={`mailto:${person.email}`}
                  className="group inline-flex h-11 items-center gap-2.5 rounded-full border border-white/[0.12] bg-white/[0.03] px-6 text-[13px] font-medium text-chalk transition-colors duration-300 hover:border-white/25"
                >
                  Contact Ran
                  <Arrow direction="up-right" />
                </a>
                <a
                  href={person.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-[12.5px] text-muted transition-colors duration-300 hover:text-chalk"
                >
                  {person.linkedinLabel}
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

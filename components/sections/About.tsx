'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { askEntries, positioning, principles } from '@/data/portfolioData';
import { Arrow, SectionHeading } from '@/components/ui/Atoms';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { useReducedMotion } from '@/lib/hooks';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * "Ask about Ran" — a compact, self-contained Q&A.
 * Every answer is assembled from portfolioData; there is no model call and no
 * network dependency, so it always works and never says anything unverified.
 */
function AskAboutRan() {
  const [activeId, setActiveId] = useState<string>(askEntries[0].id);
  const reduced = useReducedMotion();
  const active = askEntries.find((e) => e.id === activeId) ?? askEntries[0];

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="label label-accent">Ask about Ran</span>
        <span className="hairline" aria-hidden="true" />
      </div>

      {/* Questions */}
      <ul className="mt-5 flex flex-wrap gap-1.5" role="tablist" aria-label="Questions about Ran">
        {askEntries.map((entry) => {
          const selected = entry.id === activeId;
          return (
            <li key={entry.id} role="presentation">
              <button
                type="button"
                role="tab"
                id={`ask-tab-${entry.id}`}
                aria-selected={selected}
                aria-controls={`ask-panel-${entry.id}`}
                onClick={() => setActiveId(entry.id)}
                className={`chip cursor-pointer text-left ${selected ? 'chip-active' : ''}`}
              >
                {entry.question}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Answer */}
      <div className="mt-6 min-h-[188px] border-t border-white/[0.06] pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            id={`ask-panel-${active.id}`}
            role="tabpanel"
            aria-labelledby={`ask-tab-${active.id}`}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: EASE }}
          >
            <p className="text-[14.5px] leading-relaxed text-chalk/90">{active.answer}</p>
            <ul className="mt-4 space-y-2.5">
              {active.points.map((p) => (
                <li key={p} className="flex gap-3 text-[13px] leading-relaxed text-muted">
                  <span className="mt-[7px] h-px w-3 shrink-0 bg-accent/50" aria-hidden="true" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            {active.cta && (
              <Link
                href={active.cta.href}
                className="tap group mt-5 gap-2 text-[12.5px] text-accent-soft transition-colors duration-300 hover:text-white"
              >
                {active.cta.label}
                <Arrow />
              </Link>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Section 09 — how Ran approaches the work, plus a fast way for a recruiter
 * to interrogate the site without reading it end to end.
 */
export function About() {
  return (
    <section id="about" className="relative scroll-mt-[var(--nav-h)] py-20 md:py-28">
      <div className="shell">
        <SectionHeading
          index="09"
          eyebrow="How I work"
          title={
            <>
              A short set of rules{' '}
              <span className="text-muted">that decide what gets built.</span>
            </>
          }
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          {/* Operating principles */}
          <div>
            <Stagger className="space-y-0" gap={0.08}>
              {principles.map((p, i) => (
                <StaggerItem key={p} as="div">
                  <div className="group flex items-start gap-5 border-b border-white/[0.06] py-5 first:pt-0">
                    <span className="mt-1 font-mono text-[10.5px] text-accent-soft/60 tnum">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-[15px] leading-relaxed text-chalk/90 transition-colors duration-300 md:text-[16.5px]">
                      {p}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            <Reveal mode="fade" delay={0.15}>
              <p className="mt-8 max-w-[460px] text-[13.5px] leading-relaxed text-faint">
                {positioning.summary}
              </p>
            </Reveal>
          </div>

          {/* Ask about Ran */}
          <Reveal mode="rise" delay={0.08}>
            <AskAboutRan />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

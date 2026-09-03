'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';
import { StepBox, VisualFrame, useVisualEntrance } from './shared';

const BEFORE = [
  'Manual planning',
  'Personnel constraints',
  'Repeated coordination',
  'Reporting',
  'Hours of work',
];

const AFTER = [
  'Structured inputs',
  'Recommendation logic',
  'Assignment workflow',
  'Automated reporting',
  '~30 min process',
];

const EASE = [0.22, 1, 0.36, 1] as const;

function Row({
  steps,
  tone,
  seen,
  delay,
}: {
  steps: string[];
  tone: 'legacy' | 'accent';
  seen: boolean;
  delay: number;
}) {
  const reduced = useReducedMotion();
  const line = tone === 'legacy' ? 'rgba(216,162,94,0.28)' : 'rgba(123,140,255,0.35)';

  return (
    <div className="relative">
      {/* Connecting rail behind the steps */}
      <div
        aria-hidden="true"
        className="absolute left-[8%] right-[8%] top-1/2 hidden h-px -translate-y-1/2 sm:block"
        style={{ background: line }}
      />
      <ol className="relative grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-2.5">
        {steps.map((step, i) => (
          <motion.li
            key={step}
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={seen ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.5, delay: delay + i * 0.08, ease: EASE }}
            className={i === steps.length - 1 && steps.length % 2 === 1 ? 'col-span-2 sm:col-span-1' : ''}
          >
            <StepBox
              label={step}
              tone={tone}
              state={i === steps.length - 1 ? 'live' : 'done'}
              className="h-full backdrop-blur-sm"
            />
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Project 01 — the transformation itself is the story:
 * a manual chain that ends in hours, replaced by a structured chain that
 * ends in about thirty minutes.
 */
export function WorkflowVisual() {
  const { ref, seen } = useVisualEntrance<HTMLDivElement>();
  const reduced = useReducedMotion();

  return (
    <div ref={ref}>
      <VisualFrame caption="Assignment cycle" badge="Before → After">
        <div className="space-y-5">
          {/* BEFORE */}
          <div>
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
              <span className="label text-legacy/80">Before · manual</span>
              <span className="font-mono text-[10.5px] text-legacy/70">~half a day</span>
            </div>
            <Row steps={BEFORE} tone="legacy" seen={seen} delay={0.05} />
          </div>

          {/* Transformation marker */}
          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/12 to-transparent" />
            <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M2.5 7.5 6 11l3.5-3.5" stroke="#7b8cff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="label text-[9px] text-accent-soft">Digitized</span>
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/12 to-transparent" />
          </div>

          {/* AFTER */}
          <div>
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
              <span className="label label-accent">After · system</span>
              <span className="font-mono text-[10.5px] text-accent-soft">~30 minutes</span>
            </div>
            <Row steps={AFTER} tone="accent" seen={seen} delay={0.35} />
          </div>

          {/* Time comparison */}
          <div className="space-y-2.5 border-t border-white/[0.06] pt-5">
            {[
              { label: 'Manual process', width: '100%', tone: 'legacy' as const, value: '~half a day' },
              { label: 'With the system', width: '11%', tone: 'accent' as const, value: '~30 min' },
            ].map((bar, i) => (
              <div key={bar.label} className="flex items-center gap-3">
                <span className="w-[92px] shrink-0 text-[10.5px] text-faint sm:w-[104px]">{bar.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                  <motion.div
                    className={`h-full rounded-full ${
                      bar.tone === 'legacy'
                        ? 'bg-gradient-to-r from-legacy/70 to-legacy/40'
                        : 'bg-gradient-to-r from-accent to-signal'
                    }`}
                    initial={reduced ? false : { width: 0 }}
                    animate={seen ? { width: bar.width } : undefined}
                    transition={{ duration: 1.1, delay: 0.55 + i * 0.18, ease: EASE }}
                    style={reduced ? { width: bar.width } : undefined}
                  />
                </div>
                <span
                  className={`w-[74px] shrink-0 text-right font-mono text-[10.5px] tnum ${
                    bar.tone === 'legacy' ? 'text-legacy/70' : 'text-accent-soft'
                  }`}
                >
                  {bar.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </VisualFrame>
    </div>
  );
}

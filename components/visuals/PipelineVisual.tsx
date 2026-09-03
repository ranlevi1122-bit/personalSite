'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';
import { VisualFrame, useSequence, useVisualEntrance } from './shared';

const STEPS = ['Data', 'Preparation', 'Modeling', 'Risk prediction', 'Visualization', 'Decision support'];

/** Illustrative shape of the dashboard output, not reported model results. */
const RISK_BANDS = [
  { label: 'Low', share: 0.52, color: '#56d6c4' },
  { label: 'Moderate', share: 0.31, color: '#7b8cff' },
  { label: 'Elevated', share: 0.17, color: '#d8a25e' },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Project 04 — the end-to-end data science process, drawn as a pipeline
 * feeding a decision-support readout. The distribution shown is the shape of
 * the dashboard, deliberately unlabelled with figures the CV does not claim.
 */
export function PipelineVisual() {
  const { ref, seen } = useVisualEntrance<HTMLDivElement>();
  const reduced = useReducedMotion();
  const step = useSequence(STEPS.length, 1250, seen);

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div ref={ref}>
      <VisualFrame caption="Prediction pipeline" badge="Capstone · MVP">
        <div className="space-y-6">
          {/* Pipeline rail */}
          <div>
            <div className="relative mb-3 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent via-accent-soft to-signal"
                animate={{ width: `${progress}%` }}
                transition={{ duration: reduced ? 0 : 0.9, ease: EASE }}
              />
            </div>

            <ol className="grid grid-cols-3 gap-x-2 gap-y-2.5 sm:grid-cols-6 sm:gap-x-1.5">
              {STEPS.map((s, i) => {
                const done = i <= step;
                return (
                  <li key={s} className="flex flex-col items-start gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${
                        i === step
                          ? 'bg-accent-soft shadow-[0_0_0_4px_rgba(123,140,255,0.18)]'
                          : done
                            ? 'bg-accent/60'
                            : 'bg-white/15'
                      }`}
                    />
                    <span
                      className={`text-[10px] leading-tight transition-colors duration-500 ${
                        i === step ? 'text-chalk' : done ? 'text-muted' : 'text-faint'
                      }`}
                    >
                      {s}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Model comparison + risk readout */}
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            {/* Models */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-3.5">
              <span className="label">Models compared</span>
              <ul className="mt-3 space-y-2">
                {['Random Forest', 'XGBoost'].map((m, i) => (
                  <motion.li
                    key={m}
                    initial={reduced ? false : { opacity: 0, x: -8 }}
                    animate={seen ? { opacity: 1, x: 0 } : undefined}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.12, ease: EASE }}
                    className="flex items-center gap-2.5 rounded-lg border border-white/[0.07] bg-white/[0.02] px-2.5 py-2"
                  >
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path
                        d="M7 12V6M7 6 4 3.5M7 6l3-2.5M4 3.5V2M10 3.5V2"
                        stroke="#a3afff"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-[11.5px] text-muted">{m}</span>
                  </motion.li>
                ))}
              </ul>
              <p className="mt-3 text-[10px] leading-snug text-faint">
                Tree-based approaches evaluated for workplace accident risk.
              </p>
            </div>

            {/* Risk distribution */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-3.5">
              <div className="flex items-baseline justify-between">
                <span className="label">Predicted risk</span>
                <span className="font-mono text-[9.5px] text-faint">MVP dashboard</span>
              </div>

              {/* Stacked distribution bar */}
              <div className="mt-3.5 flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                {RISK_BANDS.map((band, i) => (
                  <motion.span
                    key={band.label}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    style={{ background: band.color, opacity: 0.75 }}
                    initial={reduced ? false : { width: 0 }}
                    animate={seen ? { width: `${band.share * 100}%` } : undefined}
                    transition={{ duration: 0.9, delay: 0.3 + i * 0.14, ease: EASE }}
                  />
                ))}
              </div>

              <ul className="mt-3 space-y-1.5">
                {RISK_BANDS.map((band) => (
                  <li key={band.label} className="flex items-center gap-2 text-[10.5px] text-muted">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: band.color }} />
                    {band.label} risk
                  </li>
                ))}
              </ul>

              <p className="mt-3 text-[10px] leading-snug text-faint">
                Illustrative of the dashboard output, not reported model results.
              </p>
            </div>
          </div>
        </div>
      </VisualFrame>
    </div>
  );
}

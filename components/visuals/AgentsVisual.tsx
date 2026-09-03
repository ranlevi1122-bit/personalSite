'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';
import { VisualFrame, useSequence, useVisualEntrance } from './shared';

interface Stage {
  id: string;
  label: string;
  role: string;
  /** What this stage hands to the next one. */
  handoff: string;
  icon: 'data' | 'agent' | 'chart' | 'report';
}

const STAGES: Stage[] = [
  { id: 'data', label: 'Data', role: 'Raw dataset in', handoff: 'structured dataset', icon: 'data' },
  { id: 'analysis', label: 'Analysis agent', role: 'Interrogates the data', handoff: 'findings', icon: 'agent' },
  { id: 'viz', label: 'Visualization', role: 'Generates the charts', handoff: 'charts', icon: 'chart' },
  { id: 'interpret', label: 'Interpretation', role: 'Explains what it means', handoff: 'narrative', icon: 'agent' },
  { id: 'report', label: 'Insight report', role: 'Business output', handoff: '—', icon: 'report' },
];

function Icon({ kind, active }: { kind: Stage['icon']; active: boolean }) {
  const stroke = active ? '#ffffff' : '#8d96a6';
  const common = { stroke, strokeWidth: 1.3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

  switch (kind) {
    case 'data':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <ellipse cx="8" cy="4" rx="5" ry="2.1" {...common} />
          <path d="M3 4v8c0 1.16 2.24 2.1 5 2.1s5-.94 5-2.1V4" {...common} />
          <path d="M3 8c0 1.16 2.24 2.1 5 2.1s5-.94 5-2.1" {...common} />
        </svg>
      );
    case 'chart':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M2.5 13.5h11" {...common} />
          <path d="M4.5 13.5V9M7.5 13.5V4.5M10.5 13.5V7M13 13.5v-3" {...common} />
        </svg>
      );
    case 'report':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 2h5l3 3v9H4z" {...common} />
          <path d="M9 2v3h3M6 9h4M6 11.5h3" {...common} />
        </svg>
      );
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <rect x="3" y="5" width="10" height="7.5" rx="2" {...common} />
          <path d="M8 5V2.6M6 8.4h.01M10 8.4h.01M6.4 10.6h3.2" {...common} />
        </svg>
      );
  }
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Project 03 — the multi-agent workflow, animated as a relay.
 * One stage is live at a time and the handoff between stages is named,
 * because the architecture is the point.
 */
export function AgentsVisual() {
  const { ref, seen } = useVisualEntrance<HTMLDivElement>();
  const reduced = useReducedMotion();
  const step = useSequence(STAGES.length, 1700, seen);

  return (
    <div ref={ref}>
      <VisualFrame caption="Agent orchestration" badge="AutoGen Studio">
        <div className="space-y-5">
          {/* The relay */}
          <ol className="grid grid-cols-1 gap-2 sm:grid-cols-5 sm:gap-2">
            {STAGES.map((stage, i) => {
              const active = i === step;
              const passed = i < step;
              return (
                <li key={stage.id} className="relative">
                  {/* Connector to the previous stage */}
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute hidden h-px w-2 sm:block"
                      style={{
                        left: '-9px',
                        top: '34px',
                        background: passed || active ? 'rgba(123,140,255,0.6)' : 'rgba(255,255,255,0.1)',
                        transition: 'background 0.5s',
                      }}
                    />
                  )}

                  <motion.div
                    initial={reduced ? false : { opacity: 0, y: 10 }}
                    animate={seen ? { opacity: 1, y: 0 } : undefined}
                    transition={{ duration: 0.5, delay: i * 0.07, ease: EASE }}
                    className={`flex h-full flex-row items-center gap-3 rounded-xl border px-3 py-3 transition-all duration-500 ease-premium sm:flex-col sm:items-start sm:gap-2 ${
                      active
                        ? 'border-accent/60 bg-accent/[0.09] shadow-[0_10px_34px_-18px_rgba(123,140,255,0.95)]'
                        : passed
                          ? 'border-white/[0.1] bg-white/[0.025]'
                          : 'border-white/[0.06] bg-white/[0.012]'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors duration-500 ${
                        active ? 'border-accent/50 bg-accent/15' : 'border-white/[0.08] bg-white/[0.03]'
                      }`}
                    >
                      <Icon kind={stage.icon} active={active} />
                    </span>
                    <div className="min-w-0">
                      <div
                        className={`text-[11.5px] font-medium leading-tight transition-colors duration-500 ${
                          active ? 'text-chalk' : 'text-muted'
                        }`}
                      >
                        {stage.label}
                      </div>
                      <div className="mt-1 text-[10px] leading-snug text-faint">{stage.role}</div>
                    </div>
                  </motion.div>

                  {/* Live indicator */}
                  {active && !reduced && (
                    <motion.span
                      layoutId="agent-live"
                      className="absolute -top-px left-3 right-3 h-px bg-gradient-to-r from-transparent via-accent-soft to-transparent"
                      transition={{ duration: 0.45, ease: EASE }}
                    />
                  )}
                </li>
              );
            })}
          </ol>

          {/* What just moved between the agents */}
          <div className="flex min-h-[46px] items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
            <span className="label shrink-0">Handoff</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={STAGES[step].id}
                initial={reduced ? false : { opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -5 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="font-mono text-[11px] text-accent-soft"
              >
                {step < STAGES.length - 1
                  ? `${STAGES[step].label} → ${STAGES[step + 1].label}: ${STAGES[step].handoff}`
                  : 'Business insight report delivered'}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Architecture footnote */}
          <div className="flex flex-wrap gap-1.5">
            {['Multi-agent architecture', 'LLM orchestration', 'Automated analysis', 'Streamlit UI'].map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
        </div>
      </VisualFrame>
    </div>
  );
}

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/lib/hooks';
import { VisualFrame, useVisualEntrance } from './shared';

const RESOURCES = ['Main hall', 'Studio A', 'Equipment'];
const SLOTS = ['08', '10', '12', '14', '16', '18'];

/**
 * Booking state per resource/slot.
 * 0 = free · 1 = reserved · 2 = the attempted double-booking the system blocks
 */
const GRID: number[][] = [
  [1, 1, 0, 0, 1, 0],
  [0, 1, 1, 0, 0, 1],
  [1, 0, 0, 1, 2, 0],
];

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Project 02 — a product interface concept.
 * Reads as the thing itself: a shared resource calendar with roles, a
 * utilisation readout, and conflict prevention shown at the moment it fires.
 */
export function ProductVisual() {
  const { ref, seen } = useVisualEntrance<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [showConflict, setShowConflict] = useState(false);

  // The conflict notice appears once the grid has finished drawing, then loops.
  useEffect(() => {
    if (!seen) return;
    if (reduced) {
      setShowConflict(true);
      return;
    }
    let hide = 0;
    const show = window.setTimeout(() => {
      setShowConflict(true);
      hide = window.setTimeout(() => setShowConflict(false), 3800);
    }, 1400);
    const loop = window.setInterval(() => {
      setShowConflict(true);
      hide = window.setTimeout(() => setShowConflict(false), 3800);
    }, 8200);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
      window.clearInterval(loop);
    };
  }, [seen, reduced]);

  return (
    <div ref={ref}>
      <VisualFrame caption="Reservations" badge="49 active users">
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-accent/35 bg-accent/10 px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-accent-soft">
                Admin
              </span>
              <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
                Member
              </span>
              <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
                Viewer
              </span>
            </div>
            <span className="font-mono text-[10px] text-faint">Role-based access</span>
          </div>

          {/* Booking grid */}
          <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.015]">
            {/* Slot header */}
            <div className="grid grid-cols-[76px_repeat(6,1fr)] gap-px border-b border-white/[0.06] sm:grid-cols-[92px_repeat(6,1fr)]">
              <div className="px-2.5 py-2" />
              {SLOTS.map((s) => (
                <div key={s} className="px-1 py-2 text-center font-mono text-[9.5px] text-faint tnum">
                  {s}:00
                </div>
              ))}
            </div>

            {RESOURCES.map((resource, r) => (
              <div
                key={resource}
                className="grid grid-cols-[76px_repeat(6,1fr)] gap-px border-b border-white/[0.05] last:border-b-0 sm:grid-cols-[92px_repeat(6,1fr)]"
              >
                <div className="flex items-center px-2.5 py-2.5 text-[10.5px] text-muted">{resource}</div>
                {GRID[r].map((cell, c) => (
                  <motion.div
                    key={`${r}-${c}`}
                    className="px-1 py-1.5"
                    initial={reduced ? false : { opacity: 0, scale: 0.85 }}
                    animate={seen ? { opacity: 1, scale: 1 } : undefined}
                    transition={{ duration: 0.35, delay: 0.1 + (r * 6 + c) * 0.028, ease: EASE }}
                  >
                    <div
                      className={`h-6 rounded-[5px] border transition-colors duration-500 ${
                        cell === 1
                          ? 'border-accent/40 bg-accent/25'
                          : cell === 2
                            ? 'border-legacy/60 bg-legacy/15'
                            : 'border-white/[0.06] bg-white/[0.02]'
                      }`}
                      style={
                        cell === 2
                          ? {
                              backgroundImage:
                                'repeating-linear-gradient(45deg, rgba(216,162,94,0.35) 0 3px, transparent 3px 6px)',
                            }
                          : undefined
                      }
                    />
                  </motion.div>
                ))}
              </div>
            ))}
          </div>

          {/* Conflict prevention notice */}
          <div className="relative min-h-[42px]">
            <AnimatePresence>
              {showConflict && (
                <motion.div
                  initial={reduced ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="flex items-start gap-2.5 rounded-lg border border-legacy/25 bg-legacy/[0.07] px-3 py-2.5"
                  role="status"
                >
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="mt-px shrink-0">
                    <path d="M7 4.4v3.2M7 10.1h.01" stroke="#d8a25e" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="7" cy="7" r="5.6" stroke="#d8a25e" strokeWidth="1.2" opacity="0.6" />
                  </svg>
                  <p className="text-[11.5px] leading-snug text-legacy/90">
                    Conflict prevented — <span className="text-muted">Equipment is already reserved at 16:00.</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Utilisation readout */}
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.05]">
            {[
              { k: 'Active users', v: '49' },
              { k: 'Resources', v: '3' },
              { k: 'Coordination', v: '1 system' },
            ].map((s, i) => (
              <motion.div
                key={s.k}
                className="bg-[#0a0c11] px-3 py-3"
                initial={reduced ? false : { opacity: 0 }}
                animate={seen ? { opacity: 1 } : undefined}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
              >
                <div className="font-display text-[15px] font-semibold text-chalk tnum">{s.v}</div>
                <div className="mt-1 text-[10px] text-faint">{s.k}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </VisualFrame>
    </div>
  );
}

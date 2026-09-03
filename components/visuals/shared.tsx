'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useInViewOnce, useReducedMotion } from '@/lib/hooks';

/**
 * Advances an index on an interval — used by the visuals that play a
 * repeating sequence. Pauses under reduced-motion and when the tab is hidden.
 */
export function useSequence(length: number, interval = 1500, enabled = true) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!enabled || reduced || length <= 1) return;
    let id = 0;
    const start = () => {
      id = window.setInterval(() => setI((v) => (v + 1) % length), interval);
    };
    const onVisibility = () => {
      window.clearInterval(id);
      if (!document.hidden) start();
    };
    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [length, interval, enabled, reduced]);

  return reduced ? length - 1 : i;
}

/** Fires `seen` once the visual scrolls into view, for entrance animations. */
export function useVisualEntrance<T extends Element>() {
  return useInViewOnce<T>('-8% 0px -8% 0px');
}

/**
 * Consistent chrome for every project visual: a bordered stage with a small
 * mono caption. Keeps four very different diagrams inside one design system.
 */
export function VisualFrame({
  children,
  caption,
  badge,
  className = '',
}: {
  children: ReactNode;
  caption: string;
  badge?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0c11] ${className}`}
    >
      {/* Header strip */}
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent/70" />
          <span className="label">{caption}</span>
        </div>
        {badge && (
          <span className="label text-[9.5px] text-accent-soft/80">{badge}</span>
        )}
      </div>

      <div className="relative p-4 sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse 90% 80% at 50% 50%, #000 30%, transparent 85%)',
            WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 50% 50%, #000 30%, transparent 85%)',
          }}
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

/** A labelled step box used across the flow-based visuals. */
export function StepBox({
  label,
  tone = 'accent',
  state = 'idle',
  className = '',
}: {
  label: string;
  tone?: 'accent' | 'legacy' | 'signal';
  state?: 'idle' | 'live' | 'done';
  className?: string;
}) {
  const toneRing =
    tone === 'legacy'
      ? 'border-legacy/30 text-legacy'
      : tone === 'signal'
        ? 'border-signal/30 text-signal'
        : 'border-accent/30 text-accent-soft';

  const live =
    state === 'live'
      ? tone === 'legacy'
        ? 'border-legacy/70 bg-legacy/10 text-legacy shadow-[0_0_0_1px_rgba(216,162,94,0.25),0_8px_28px_-14px_rgba(216,162,94,0.8)]'
        : 'border-accent/70 bg-accent/10 text-white shadow-[0_0_0_1px_rgba(123,140,255,0.28),0_8px_28px_-14px_rgba(123,140,255,0.9)]'
      : '';

  const done = state === 'done' ? 'opacity-100' : state === 'idle' ? 'opacity-55' : '';

  return (
    <div
      className={`flex min-h-[38px] items-center justify-center rounded-lg border bg-white/[0.02] px-2.5 py-2 text-center text-[10.5px] font-medium leading-tight transition-all duration-500 ease-premium ${toneRing} ${live} ${done} ${className}`}
    >
      {label}
    </div>
  );
}

/** Thin connector between steps. Horizontal on wide layouts, vertical below. */
export function Connector({
  vertical = false,
  tone = 'accent',
  animated = false,
}: {
  vertical?: boolean;
  tone?: 'accent' | 'legacy';
  animated?: boolean;
}) {
  const color = tone === 'legacy' ? 'rgba(216,162,94,0.35)' : 'rgba(123,140,255,0.4)';

  if (vertical) {
    return (
      <div className="mx-auto h-4 w-px shrink-0" style={{ background: color }} aria-hidden="true" />
    );
  }

  return (
    <div className="relative h-px min-w-[10px] flex-1 shrink" style={{ background: color }} aria-hidden="true">
      {animated && (
        <span
          className="absolute top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-signal"
          style={{ animation: 'slide 2.4s linear infinite' }}
        />
      )}
    </div>
  );
}

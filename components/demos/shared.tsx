'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocale } from '@/components/LocaleProvider';

/** How a demo is shown: worked by hand, or playing by itself as a preview. */
export type DemoMode = 'full' | 'preview';

/**
 * True while the element is on screen and the visitor has not asked for
 * reduced motion. Previews play only then, so four of them on one page cost
 * nothing while they are scrolled away.
 */
export function usePlaying<T extends Element>(enabled = true) {
  const ref = useRef<T | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(([entry]) => setPlaying(entry.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [enabled]);

  return { ref, playing };
}

/** Runs `step` every `ms` while `active`, from a fresh timer each time. */
export function useTicker(active: boolean, ms: number, step: () => void) {
  const saved = useRef(step);
  saved.current = step;
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => saved.current(), ms);
    return () => window.clearInterval(id);
  }, [active, ms]);
}

/**
 * Lays a fixed-size design out at whatever width the box has, scaled as one
 * piece. Previews are drawn at 800 x 600 and shrink to a phone without
 * reflowing.
 */
export function ScaledStage({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={ref} className="dm-stage" style={{ aspectRatio: `${width} / ${height}` }}>
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: '0 0' }}>{children}</div>
    </div>
  );
}

/** The window every demo sits in: the app's name, its context and its controls. */
export function DemoWindow({
  app,
  context,
  actions,
  children,
  className = '',
  pill,
}: {
  app: string;
  context?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** What the content is: sample data, or the real thing. */
  pill?: string;
}) {
  const locale = useLocale();
  return (
    <div className={`dm ${className}`.trim()} data-demo="" data-ui="">
      <div className="dm-bar">
        <b>{app}</b>
        {context && <span className="dm-bar__context">{context}</span>}
        <span className="dm-pill">{pill ?? (locale === 'he' ? 'נתוני דוגמה' : 'Sample data')}</span>
        <span className="dm-bar__spacer" />
        {actions}
      </div>
      {children}
    </div>
  );
}

/** A one-line status message, read out by screen readers as it changes. */
export function DemoMessage({ tone, children }: { tone: 'ok' | 'warn' | 'stop' | 'info'; children: ReactNode }) {
  return (
    <p className="dm-msg" data-msg={tone} role="status" aria-live="polite">
      {children}
    </p>
  );
}

export const pct = (n: number, digits = 0) => `${n.toFixed(digits)}%`;

'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { useInteractiveMotion, useInViewOnce, useReducedMotion } from '@/lib/hooks';
import { Reveal } from './Reveal';

/* -------------------------------------------------------------------------- */
/*  Section heading                                                           */
/* -------------------------------------------------------------------------- */

export function SectionHeading({
  index,
  eyebrow,
  title,
  lead,
  align = 'left',
  className = '',
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div className={`${align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-3xl'} ${className}`}>
      <Reveal mode="fade" duration={0.6}>
        <div className={`section-eyebrow ${align === 'center' ? 'justify-center' : ''}`}>
          <span className="label label-accent tnum">{index}</span>
          <span className="label">{eyebrow}</span>
          {align === 'left' && <span className="hairline" aria-hidden="true" />}
        </div>
      </Reveal>

      <Reveal mode="clip" delay={0.06}>
        <h2 className="mt-6 font-display text-[clamp(1.85rem,4.2vw,3.15rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-chalk">
          {title}
        </h2>
      </Reveal>

      {lead && (
        <Reveal delay={0.12}>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted md:text-base">{lead}</p>
        </Reveal>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Buttons                                                                   */
/* -------------------------------------------------------------------------- */

type Variant = 'primary' | 'secondary' | 'ghost';

const baseButton =
  'group relative inline-flex items-center justify-center gap-2.5 rounded-full text-[13px] font-medium tracking-[0.01em] transition-[color,background-color,border-color,box-shadow] duration-300 ease-premium select-none';

const sizing = 'h-11 px-6';

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-chalk text-ink-950 hover:bg-white shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_10px_30px_-12px_rgba(123,140,255,0.7)]',
  secondary:
    'border border-white/12 bg-white/[0.03] text-chalk hover:border-white/25 hover:bg-white/[0.06]',
  ghost: 'text-muted hover:text-chalk',
};

/**
 * A CTA that drifts a few pixels toward the pointer. Movement is written
 * straight to the element's transform, so it never re-renders React.
 */
function useMagnetic(strength = 10) {
  const ref = useRef<HTMLElement | null>(null);
  const enabled = useInteractiveMotion();

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      el.style.transform = `translate3d(${(dx * strength).toFixed(2)}px, ${(dy * strength * 0.55).toFixed(2)}px, 0)`;
    },
    [enabled, strength],
  );

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (el) el.style.transform = 'translate3d(0,0,0)';
  }, []);

  return {
    ref,
    enabled,
    handlers: enabled
      ? { onPointerMove, onPointerLeave }
      : ({} as { onPointerMove?: undefined; onPointerLeave?: undefined }),
  };
}

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  magnetic = true,
  external = false,
  className = '',
  ...rest
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  magnetic?: boolean;
  external?: boolean;
  className?: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children' | 'className'>) {
  const { ref, handlers } = useMagnetic(magnetic ? 8 : 0);
  const isHash = href.startsWith('#');
  const cls = `${baseButton} ${sizing} ${variantStyles[variant]} ${className}`;
  const style = { transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1), background-color 0.3s, border-color 0.3s, color 0.3s' };

  const inner = <span className="relative z-10 flex items-center gap-2.5">{children}</span>;

  if (external || href.startsWith('http') || href.startsWith('mailto:') || href.endsWith('.pdf')) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={cls}
        style={style}
        target={href.startsWith('mailto:') ? undefined : '_blank'}
        rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
        {...handlers}
        {...rest}
      >
        {inner}
      </a>
    );
  }

  if (isHash) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={cls}
        style={style}
        {...handlers}
        {...rest}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link
      ref={ref as React.Ref<HTMLAnchorElement>}
      href={href}
      className={cls}
      style={style}
      {...handlers}
      {...rest}
    >
      {inner}
    </Link>
  );
}

export function ButtonAction({
  children,
  variant = 'secondary',
  className = '',
  ...rest
}: { children: ReactNode; variant?: Variant; className?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const { ref, handlers } = useMagnetic(6);
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      className={`${baseButton} ${sizing} ${variantStyles[variant]} ${className}`}
      style={{ transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1), background-color 0.3s, border-color 0.3s, color 0.3s' }}
      {...handlers}
      {...rest}
    >
      <span className="relative z-10 flex items-center gap-2.5">{children}</span>
    </button>
  );
}

/** Arrow that nudges on hover of the parent `.group`. */
export function Arrow({ direction = 'right' }: { direction?: 'right' | 'down' | 'up-right' }) {
  const path =
    direction === 'down'
      ? 'M7 2v10M3 8.5 7 12.5l4-4'
      : direction === 'up-right'
        ? 'M3.5 10.5 10.5 3.5M4.5 3.5h6v6'
        : 'M2 7h10M8.5 3.5 12 7l-3.5 3.5';

  const shift =
    direction === 'down'
      ? 'group-hover:translate-y-[3px]'
      : direction === 'up-right'
        ? 'group-hover:translate-x-[3px] group-hover:-translate-y-[3px]'
        : 'group-hover:translate-x-[4px]';

  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className={`transition-transform duration-300 ease-premium ${shift}`}
    >
      <path d={path} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Animated counter                                                          */
/* -------------------------------------------------------------------------- */

export function Counter({
  to,
  prefix = '',
  suffix = '',
  duration = 1400,
  className = '',
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const { ref, seen } = useInViewOnce<HTMLSpanElement>('-10% 0px -10% 0px');
  const [value, setValue] = useState(reduced ? to : 0);

  useEffect(() => {
    if (!seen) return;
    if (reduced) {
      setValue(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setValue(Math.round(eased * to));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, duration, reduced]);

  return (
    <span ref={ref} className={`tnum ${className}`}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pointer-lit surface                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Wraps content in a panel whose highlight tracks the pointer and which
 * tilts very slightly in 3D. Both are pure CSS variables written from the
 * pointer handler, so hovering never triggers a React render.
 */
export function LitPanel({
  children,
  className = '',
  tilt = 3,
  radius = 420,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  tilt?: number;
  radius?: number;
  as?: 'div' | 'article' | 'li';
}) {
  const enabled = useInteractiveMotion();
  const ref = useRef<HTMLElement | null>(null);

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--px', `${(x * 100).toFixed(1)}%`);
    el.style.setProperty('--py', `${(y * 100).toFixed(1)}%`);
    el.style.setProperty('--rx', `${((0.5 - y) * tilt).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((x - 0.5) * tilt).toFixed(2)}deg`);
    el.style.setProperty('--lit', '1');
  };

  const onPointerLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--lit', '0');
  };

  return (
    <Tag
      ref={ref as React.Ref<never>}
      onPointerMove={onPointerMove as React.PointerEventHandler<never>}
      onPointerLeave={onPointerLeave}
      className={`group/lit relative isolate overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.028] to-white/[0.008] ${className}`}
      style={{
        transform: 'perspective(1100px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1), border-color 0.4s',
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[var(--lit,0)] transition-opacity duration-500"
        style={{
          background: `radial-gradient(${radius}px circle at var(--px,50%) var(--py,0%), rgba(123,140,255,0.13), transparent 62%)`,
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-[var(--lit,0)] transition-opacity duration-500"
        style={{
          background: `radial-gradient(220px circle at var(--px,50%) 0%, rgba(163,175,255,0.85), transparent 70%)`,
        }}
      />
      {children}
    </Tag>
  );
}

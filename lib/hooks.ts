'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/* -------------------------------------------------------------------------- */
/*  Motion & input-capability preferences                                     */
/* -------------------------------------------------------------------------- */

/** True when the user has asked the OS to reduce motion. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return reduced;
}

/**
 * True on devices with a precise pointer (mouse / trackpad).
 * Every cursor-driven flourish on the site is gated on this, so touch devices
 * never pay for effects they cannot use.
 */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const apply = () => setFine(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return fine;
}

/** Convenience: interactive pointer effects are allowed. */
export function useInteractiveMotion(): boolean {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  return fine && !reduced;
}

/* -------------------------------------------------------------------------- */
/*  Pointer tracking                                                          */
/* -------------------------------------------------------------------------- */

export interface PointerState {
  /** Viewport coordinates, updated on every move. */
  x: number;
  y: number;
  active: boolean;
}

/**
 * Global pointer position stored in a ref, deliberately NOT in React state.
 * Consumers read `ref.current` inside their own rAF loop, so pointer movement
 * never triggers a React render.
 */
export function usePointerRef(enabled = true) {
  const ref = useRef<PointerState>({ x: 0, y: 0, active: false });

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: PointerEvent) => {
      ref.current.x = e.clientX;
      ref.current.y = e.clientY;
      ref.current.active = true;
    };
    const onLeave = () => {
      ref.current.active = false;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, [enabled]);

  return ref;
}

/**
 * Writes normalised pointer coordinates for an element into CSS custom
 * properties (--px / --py in %, --pxr / --pyr in -0.5..0.5). Used for card
 * lighting and subtle perspective without any React re-render.
 */
export function usePointerSpotlight<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T | null>(null);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      if (!enabled) return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--px', `${(x * 100).toFixed(2)}%`);
      el.style.setProperty('--py', `${(y * 100).toFixed(2)}%`);
      el.style.setProperty('--pxr', (x - 0.5).toFixed(4));
      el.style.setProperty('--pyr', (y - 0.5).toFixed(4));
    },
    [enabled],
  );

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--pxr', '0');
    el.style.setProperty('--pyr', '0');
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}

/* -------------------------------------------------------------------------- */
/*  Scroll                                                                    */
/* -------------------------------------------------------------------------- */

/** True once the page has scrolled past `threshold` pixels. */
export function useScrolled(threshold = 12): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setScrolled(window.scrollY > threshold);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [threshold]);

  return scrolled;
}

/**
 * Returns the id of the section currently occupying the reading position.
 * Uses scroll position rather than IntersectionObserver ratios so that very
 * tall sections (the sticky work section) still resolve correctly.
 */
export function useActiveSection(ids: readonly string[]): string {
  const [active, setActive] = useState<string>(ids[0] ?? '');

  useEffect(() => {
    let raf = 0;

    const measure = () => {
      raf = 0;
      const line = window.scrollY + window.innerHeight * 0.35;

      // The nav order is a reading order, not the document order, so resolve
      // by position: the furthest-down section whose top has passed the line.
      let current = '';
      let bestTop = -Infinity;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= line && top > bestTop) {
          bestTop = top;
          current = id;
        }
      }
      // Above every tracked section (still in the hero), nothing is current —
      // an indicator on a section the reader has not reached yet reads as wrong.
      // At the very bottom of the page, always resolve to the last section.
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 60) {
        current = ids[ids.length - 1] ?? current;
      }
      setActive(current);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ids]);

  return active;
}

/** Locks body scroll while an overlay is open, without layout shift. */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [locked]);
}

/** Calls `onClose` on Escape. */
export function useEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, onClose]);
}

/* -------------------------------------------------------------------------- */
/*  Misc                                                                      */
/* -------------------------------------------------------------------------- */

/** Fires once when the element first enters the viewport. */
export function useInViewOnce<T extends Element>(rootMargin = '-15% 0px -15% 0px') {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, rootMargin]);

  return { ref, seen };
}

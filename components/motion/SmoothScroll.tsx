'use client';

import Lenis from 'lenis';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/scene';
import { visiblePath } from '@/lib/i18n';

/**
 * Weighted wheel scrolling, so the scroll scenes move with some mass. Off for
 * touch (the phone keeps its own scrolling), for reduced motion, and on the
 * private dashboard.
 */
export function SmoothScroll() {
  const pathname = visiblePath(usePathname());
  const lenis = useRef<Lenis | null>(null);
  const off = pathname.startsWith('/stats');

  useEffect(() => {
    if (off) return;
    const touch = window.matchMedia('(pointer: coarse)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (touch || reduced) return;

    const l = new Lenis({ lerp: 0.12, smoothWheel: true, anchors: { offset: -88 } });
    lenis.current = l;
    l.on('scroll', ScrollTrigger.update);
    const tick = (t: number) => l.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    document.documentElement.classList.add('is-smooth');
    return () => {
      gsap.ticker.remove(tick);
      l.destroy();
      lenis.current = null;
      document.documentElement.classList.remove('is-smooth');
    };
  }, [off]);

  // A new page starts at its top (unless the link names a section), with its scenes measured afresh.
  useEffect(() => {
    if (!window.location.hash) lenis.current?.scrollTo(0, { immediate: true });
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}

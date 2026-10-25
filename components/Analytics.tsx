'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { captureSource, flushNow, track, trackingAllowed } from '@/lib/analytics/client';

/**
 * Listens to the page and reports what visitors do: page views, the sections
 * they reach, every link and button they press, how far they scroll and how
 * long the page was actually in view. Renders nothing.
 *
 * Sections are named with data-section; any element can name its clicks with
 * data-track, otherwise the visible text (or aria-label) is used. Clicks inside
 * data-demo are left out: the live demos report what was done themselves.
 */
export function Analytics() {
  const pathname = usePathname();

  // Clicks, time in view and the final beacon: set up once.
  useEffect(() => {
    if (!trackingAllowed()) return;
    captureSource();

    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>('a, button, [data-track]');
      if (!el || el.closest('[data-demo]')) return;
      const label =
        el.dataset.track ??
        el.getAttribute('aria-label') ??
        (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
      const href = el instanceof HTMLAnchorElement ? el.getAttribute('href') ?? undefined : undefined;
      const section = el.closest<HTMLElement>('[data-section]')?.dataset.section;
      track({ n: 'click', l: label || '(no label)', h: href, s: section });
    };

    let visibleSince = document.visibilityState === 'visible' ? Date.now() : 0;
    let inView = 0;
    let lastSent = 0;
    const report = () => {
      track({ n: 'leave', v: Math.round(inView) });
      inView = 0;
      lastSent = Date.now();
      flushNow();
    };
    // Hiding the tab sends what is queued, but at most every 15 seconds: a
    // visitor flicking between tabs should not cost a request each time.
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (visibleSince) inView += (Date.now() - visibleSince) / 1000;
        visibleSince = 0;
        if (inView >= 2 && Date.now() - lastSent > 15_000) report();
      } else {
        visibleSince = Date.now();
      }
    };
    // Leaving the page always sends the rest.
    const onPageHide = () => {
      if (visibleSince) inView += (Date.now() - visibleSince) / 1000;
      visibleSince = 0;
      if (inView >= 1) report();
      else flushNow();
    };

    document.addEventListener('click', onClick, { capture: true });
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('click', onClick, { capture: true });
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

  // Per page: the view, the sections reached and scroll depth.
  useEffect(() => {
    if (!trackingAllowed()) return;
    track({ n: 'pageview', l: document.title });

    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.section;
          if (entry.isIntersecting && id && !seen.has(id)) {
            seen.add(id);
            track({ n: 'section', l: id });
          }
        }
      },
      { threshold: 0.35 },
    );
    const sections = document.querySelectorAll<HTMLElement>('[data-section]');
    sections.forEach((s) => observer.observe(s));

    const marks = [25, 50, 75, 100];
    let reached = 0;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const pct = max > 0 ? (window.scrollY / max) * 100 : 100;
        while (reached < marks.length && pct >= marks[reached] - 1) {
          track({ n: 'scroll', v: marks[reached] });
          reached++;
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return null;
}

'use client';

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { gsap, scene } from '@/lib/scene';

/**
 * A section that becomes a scroll scene on a desktop with motion allowed.
 * The markup is the section's finished composition, written by a server
 * component; this only adds the movement.
 *
 *  work     the case studies: one window that shows each system in turn while
 *           the list beside it moves on
 *  process  the six steps on a track that slides past as the page scrolls
 */
type Kind = 'work' | 'process';

const BUILDERS: Record<Kind, (root: HTMLElement) => () => void> = {
  work(root) {
    const cases = [...root.querySelectorAll<HTMLElement>('.case')];
    const ledger = [...root.querySelectorAll<HTMLElement>('[data-goto]')];
    const n = cases.length;
    const mark = (beat: number) => ledger.forEach((b, i) => b.setAttribute('aria-current', i === beat ? 'true' : 'false'));

    const stop = scene(root, {
      hold: 4,
      phone: 'rest',
      beats: n,
      onBeat: mark,
      build(tl) {
        const media = cases.map((c) => c.querySelector<HTMLElement>('.case__media')!);
        const bodies = cases.map((c) => c.querySelector<HTMLElement>('.case__body')!);
        // Each preview lies over the one before it; those still to come are hidden, not just clipped.
        media.forEach((m, i) => gsap.set(m, { zIndex: i + 1 }));
        for (let k = 1; k < n; k++) {
          const t = k / n - 0.06;
          tl.to(bodies[k - 1], { autoAlpha: 0, y: -28, duration: 0.035, ease: 'power1.in' }, t)
            .fromTo(bodies[k], { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: 'power2.out' }, t + 0.035)
            .fromTo(media[k], { clipPath: 'inset(100% 0% 0% 0%)', autoAlpha: 0 }, { clipPath: 'inset(0% 0% 0% 0%)', autoAlpha: 1, duration: 0.075, ease: 'power2.inOut' }, t)
            .to(media[k - 1], { scale: 0.92, autoAlpha: 0, duration: 0.075, ease: 'power2.in' }, t);
        }
      },
    });

    // The list moves the page to that system's place in the scene.
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as Element).closest<HTMLElement>('[data-goto]');
      if (!btn) return;
      const i = Number(btn.dataset.goto);
      const top = root.getBoundingClientRect().top + window.scrollY;
      const travel = root.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + ((i + 0.5) / n) * travel, behavior: 'smooth' });
    };
    root.addEventListener('click', onClick);
    return () => {
      stop();
      root.removeEventListener('click', onClick);
    };
  },

  process(root) {
    const steps = [...root.querySelectorAll<HTMLElement>('.step')];
    return scene(root, {
      hold: 2,
      phone: 'rest',
      beats: steps.length,
      onBeat: (b) => steps.forEach((s, i) => s.classList.toggle('is-on', i <= b)),
      build(tl, { q, rtl }) {
        const track = q('.process')[0];
        const travel = () => {
          const shell = q('.shell')[0];
          const pad = parseFloat(getComputedStyle(shell).paddingInlineStart) || 0;
          return Math.max(0, track.scrollWidth - (shell.clientWidth - 2 * pad));
        };
        tl.fromTo(track, { x: 0 }, { x: () => (rtl ? 1 : -1) * travel(), duration: 1, ease: 'none' }, 0).fromTo(
          q('.process__line i'),
          { scaleX: 0 },
          { scaleX: 1, duration: 1, ease: 'none' },
          0,
        );
      },
    });
  },
};

export function SceneSection({
  kind,
  className = '',
  children,
  ...rest
}: { kind: Kind; children: ReactNode } & HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    return el ? BUILDERS[kind](el) : undefined;
  }, [kind]);
  return (
    <section ref={ref} className={`scene ${className}`.trim()} {...rest}>
      {children}
    </section>
  );
}

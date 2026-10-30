'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/scene';

/**
 * The close: the name once more, as wide as the page, rising out of the
 * footer's bottom edge as the page reaches its end. It repeats the name the
 * footer already gives, so assistive tech skips it.
 */
export function FootName({ name }: { name: string }) {
  const ref = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        el.querySelector('span'),
        { yPercent: 55 },
        { yPercent: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom bottom', scrub: true } },
      );
    });
    return () => mm.revert();
  }, []);

  return (
    <p ref={ref} className="foot-name" aria-hidden="true">
      <span>{name}</span>
    </p>
  );
}

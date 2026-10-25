'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A figure that counts up from zero the first time it comes into view.
 * Renders the final value on the server and without script.
 */
export function CountUp({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    setShown(0);
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / 1600);
          setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
          if (t < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <span ref={ref} className="tnum">
      {prefix}
      {shown}
      {suffix}
    </span>
  );
}

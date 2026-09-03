'use client';

import { useEffect, useRef } from 'react';
import { useInteractiveMotion, usePointerRef } from '@/lib/hooks';

/**
 * A low-opacity ambient illumination that trails the cursor.
 *
 * Position is interpolated inside a single rAF loop and written directly to
 * the element's transform — React never re-renders on pointer movement.
 * Disabled entirely on touch devices and under prefers-reduced-motion.
 */
export function CursorLight() {
  const enabled = useInteractiveMotion();
  const pointer = usePointerRef(enabled);
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = elRef.current;
    if (!el) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight * 0.32;
    let opacity = 0;
    let raf = 0;

    const loop = () => {
      const p = pointer.current;
      // Critically damped follow: fast enough to feel connected, slow enough
      // to read as light rather than as a cursor.
      x += (p.x - x) * 0.085;
      y += (p.y - y) * 0.085;
      const target = p.active ? 1 : 0;
      opacity += (target - opacity) * 0.06;

      el.style.transform = `translate3d(${(x - 380).toFixed(1)}px, ${(y - 380).toFixed(1)}px, 0)`;
      el.style.opacity = opacity.toFixed(3);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [enabled, pointer]);

  if (!enabled) return null;

  return (
    <div
      ref={elRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-0 h-[760px] w-[760px] opacity-0 mix-blend-screen"
      style={{
        background:
          'radial-gradient(circle at center, rgba(123,140,255,0.10) 0%, rgba(86,214,196,0.035) 34%, transparent 66%)',
        willChange: 'transform, opacity',
      }}
    />
  );
}

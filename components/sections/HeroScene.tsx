'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Arrow } from '@/components/ui/Arrow';
import { gsap, scene } from '@/lib/scene';
import type { ProjectSlug } from '@/data/portfolioData';

export interface HeroScreen {
  src: string;
  slug: ProjectSlug;
  w: number;
  h: number;
  href: string;
  title: string;
  alt: string;
}

/**
 * The opening scene. The headline stands at the mouth of a tunnel of real
 * screens, set left and right into the distance. Scrolling is the camera:
 * the words lift away and it flies down the tunnel, past every system, and
 * comes to rest in front of the last screen, the scheduler, which the next
 * section then shows at work.
 *
 * The tunnel is plain CSS 3D, so with no script, or with reduced motion, it
 * is the same composition standing still under the headline.
 */

/** Each side screen sits this many screen widths off the centre line. */
const SIDE = 0.64;
/** Heights of the side screens, in screen widths, in a repeating pattern. */
const RISE = [-0.2, 0.1, -0.04, 0.16, -0.14, 0.04];
/** The side screens lean in towards the path by this much. */
const LEAN = 16;
/** Screens farther than this many gaps ahead are lost in the dark. */
const FOG = 6.5;
// Where the camera waits while the headline is read is set in the CSS, by
// width: --mouth, the vanishing point in % of the stage height, and --back,
// how many gaps it stands behind the first screen.

/** Read a length custom property as a number. */
const num = (el: Element, name: string) => parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function HeroScene({
  headline,
  sentence,
  email,
  cases,
  byline,
  screens,
  last,
  screensLabel,
}: {
  headline: readonly string[];
  sentence: string;
  email: { href: string; label: string };
  cases: { href: string; label: string };
  byline: { name: string; roles: string; photo: string; photoAlt: string };
  /** The screens passed on the way, each shown twice. */
  screens: HeroScreen[];
  /** The screen the camera stops in front of. */
  last: HeroScreen;
  screensLabel: string;
}) {
  const root = useRef<HTMLElement | null>(null);
  const passing = [...screens, ...screens];

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const tunnel = el.querySelector<HTMLElement>('.tunnel')!;
    const world = el.querySelector<HTMLElement>('.tunnel__world')!;
    const tiles = [...el.querySelectorAll<HTMLElement>('.tunnel__tile')];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /** How far the camera must travel to stop with the last screen filling the view. */
    const travel = () => {
      const persp = num(tunnel, '--persp');
      const gap = num(tunnel, '--gap');
      const pic = tiles[tiles.length - 1].querySelector<HTMLElement>('.tunnel__pic')!;
      const w = pic.offsetWidth;
      const h = pic.offsetHeight || w * 0.625;
      const fit = Math.min((window.innerWidth * 0.9) / w, (window.innerHeight * 0.72) / h);
      return (tiles.length + 0.5) * gap + persp - persp / fit;
    };

    /** Places the camera at `p` (0 to 1) of the flight and lights the screens it can see. */
    const render = (p: number) => {
      const persp = num(tunnel, '--persp');
      const gap = num(tunnel, '--gap');
      const eased = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
      const back = num(tunnel, '--back');
      const mouth = num(tunnel, '--mouth');
      const cam = -back * gap + (travel() + back * gap) * eased;
      // The tunnel rises from under the headline to the middle of the screen,
      // its vanishing point with it.
      const rise = clamp01((p - 0.03) / 0.32);
      const oy = mouth + (52 - mouth) * rise * rise * (3 - 2 * rise);
      tunnel.style.setProperty('--oy', `${oy.toFixed(2)}%`);
      world.style.transform = `translate3d(0, ${(oy - 50).toFixed(2)}%, ${cam.toFixed(1)}px)`;
      tiles.forEach((t, k) => {
        const end = k === tiles.length - 1;
        const z = cam - (end ? tiles.length + 0.5 : k + 1) * gap;
        // Out of the dark as it nears, and gone before it reaches the eye; the last one stays.
        const far = clamp01((z + FOG * gap) / (2.2 * gap));
        const near = end ? 1 : clamp01(1 - (z - 0.2 * persp) / (0.35 * persp));
        const a = Math.min(far, near);
        t.style.opacity = a.toFixed(3);
        t.style.visibility = a > 0.01 ? 'visible' : 'hidden';
      });
    };

    const stop = scene(el, {
      hold: 2,
      phone: { hold: 1.6 },
      build: (tl, { q }) => {
        tl.to(q('.hero__copy > *'), { yPercent: -30, autoAlpha: 0, stagger: 0.02, duration: 0.14, ease: 'power1.in' }, 0);
        tl.eventCallback('onUpdate', () => render(tl.progress()));
        render(0);
      },
    });

    // On a desktop the tunnel turns a little towards the pointer.
    const fine = window.matchMedia('(pointer: fine)').matches;
    const lean = { x: 0 };
    const toX = gsap.quickTo(lean, 'x', {
      duration: 1.1,
      ease: 'power3.out',
      onUpdate: () => tunnel.style.setProperty('--ox', `${lean.x.toFixed(2)}%`),
    });
    const onLean = (e: PointerEvent) => toX((e.clientX / window.innerWidth - 0.5) * -6);
    if (fine && !reduced) window.addEventListener('pointermove', onLean, { passive: true });

    return () => {
      stop();
      window.removeEventListener('pointermove', onLean);
      world.style.removeProperty('transform');
      tunnel.style.removeProperty('--oy');
      tunnel.style.removeProperty('--ox');
      tiles.forEach((t) => {
        t.style.removeProperty('opacity');
        t.style.removeProperty('visibility');
      });
    };
  }, []);

  const tile = (s: HeroScreen, k: number, place: { x: number; y: number; r: number; z: number }, copy: boolean, end = false) => (
    <li
      key={`${s.src}-${k}`}
      className={end ? 'tunnel__tile tunnel__tile--end' : 'tunnel__tile'}
      style={{ ['--x' as string]: place.x, ['--y' as string]: place.y, ['--r' as string]: `${place.r}deg`, ['--z' as string]: place.z }}
      aria-hidden={copy || undefined}
    >
      <Link href={s.href} tabIndex={copy ? -1 : undefined} draggable={false}>
        <span className="tunnel__pic">
          <Image
            src={s.src}
            alt={copy ? '' : s.alt}
            width={s.w}
            height={s.h}
            sizes={end ? '(max-width: 767px) 100vw, 90vw' : '(max-width: 767px) 80vw, 46vw'}
            priority={k < 3}
            draggable={false}
          />
        </span>
        <span className="tunnel__cap">{s.title}</span>
      </Link>
    </li>
  );

  return (
    <section ref={root} className="hero scene" data-section="hero" aria-labelledby="hero-title" data-tone="deep">
      <div className="scene-stage hero__stage">
        <div className="hero__copy shell">
          <h1 id="hero-title" className="hero__title t-display">
            {headline.map((line) => (
              <span key={line} className="lm">
                <span>{line}</span>
              </span>
            ))}
          </h1>
          <p className="hero__sentence">{sentence}</p>
          <div className="hero__actions">
            <a href={email.href} className="btn">
              {email.label}
              <Arrow />
            </a>
            <a href={cases.href} className="arrow-link">
              {cases.label} <Arrow />
            </a>
          </div>
          <p className="hero__byline">
            <span className="hero__photo">
              <Image src={byline.photo} alt={byline.photoAlt} fill sizes="44px" priority />
            </span>
            <span>
              <b>{byline.name}</b> · {byline.roles}
            </span>
          </p>
        </div>

        <div className="tunnel">
          <ul className="tunnel__world" aria-label={screensLabel}>
            {passing.map((s, k) =>
              tile(
                s,
                k,
                { x: (k % 2 ? 1 : -1) * SIDE, y: RISE[k % RISE.length], r: (k % 2 ? -1 : 1) * LEAN, z: k + 1 },
                k >= screens.length,
              ),
            )}
            {tile(last, passing.length, { x: 0, y: 0, r: 0, z: passing.length + 1.5 }, false, true)}
          </ul>
        </div>
      </div>
    </section>
  );
}

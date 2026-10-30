'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Arrow } from '@/components/ui/Arrow';
import { gsap, ScrollTrigger, scene } from '@/lib/scene';
import type { ProjectSlug } from '@/data/portfolioData';

export interface ArcScreen {
  src: string;
  slug: ProjectSlug;
  w: number;
  h: number;
  href: string;
  title: string;
  alt: string;
}

/**
 * The opening scene. The headline sits over a ring of real screens, the
 * viewer standing inside it. The ring turns by itself one screen at a time,
 * and a finger or the mouse can swipe it round. Scrolling stops it and moves
 * the camera into the screen in front: on a desktop until it fills the view,
 * on a phone until it fills the width, so the whole screen can be read.
 *
 * The ring is plain CSS 3D, so with no script it is the same composition,
 * standing still; with reduced motion it only moves when swiped.
 */

/** The ring holds every screen twice, so it can turn without end. */
const COPIES = 2;
/** The screen in front when the page opens. */
const START = 3;
/** Seconds each screen stays in front before the ring turns on. */
const HOLD_SECONDS = 2.6;

/** Read a length or angle custom property as a number. */
const num = (el: Element, name: string) => parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0;

export function HeroScene({
  headline,
  sentence,
  email,
  cases,
  byline,
  screens,
  screensLabel,
}: {
  headline: readonly string[];
  sentence: string;
  email: { href: string; label: string };
  cases: { href: string; label: string };
  byline: { name: string; roles: string; photo: string; photoAlt: string };
  screens: ArcScreen[];
  screensLabel: string;
}) {
  const root = useRef<HTMLElement | null>(null);
  const ring = Array.from({ length: COPIES }, () => screens).flat();
  const count = ring.length;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const arc = el.querySelector<HTMLElement>('.arc')!;
    const ringEl = el.querySelector<HTMLElement>('.arc__ring')!;
    const spin = el.querySelector<HTMLElement>('.arc__spin')!;
    const tilt = el.querySelector<HTMLElement>('.arc__tilt')!;
    const cards = [...el.querySelectorAll<HTMLElement>('.arc__card')];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dir = document.documentElement.dir === 'rtl' ? -1 : 1;
    const step = 360 / cards.length;
    const persp = () => num(arc, '--persp');

    // The ring's turn, in degrees; screen k is in front when it equals dir * k * step.
    const state = { angle: dir * START * step };
    let atTop = true;
    let dragging = false;

    /** Shows the screens that face the viewer and marks the one in front. */
    const render = () => {
      gsap.set(spin, { rotationY: state.angle });
      let best = 0;
      let bestOff = 360;
      cards.forEach((c, k) => {
        const off = Math.abs(((((-dir * k * step + state.angle) % 360) + 540) % 360) - 180);
        c.style.visibility = off < 80 ? 'visible' : 'hidden';
        c.removeAttribute('data-far');
        if (off < bestOff) {
          bestOff = off;
          best = k;
        }
      });
      cards.forEach((c, k) => c.toggleAttribute('data-front', k === best));
    };
    const snapped = (a: number) => Math.round(a / step) * step;
    let turning: gsap.core.Tween | null = null;
    const turnTo = (angle: number, duration = 0.9) => {
      turning?.kill();
      turning = gsap.to(state, { angle, duration: reduced ? 0 : duration, ease: 'power3.inOut', onUpdate: render });
    };

    // It turns by itself while the page sits at its start.
    let timer: gsap.core.Tween | null = null;
    const schedule = () => {
      timer?.kill();
      timer = null;
      if (reduced || !atTop || dragging || document.hidden) return;
      timer = gsap.delayedCall(HOLD_SECONDS, () => {
        turnTo(snapped(state.angle) + dir * step);
        schedule();
      });
    };
    render();
    schedule();

    // A swipe or a drag turns it; letting go carries on a little, then settles on a screen.
    let startX = 0;
    let startAngle = 0;
    let moved = false;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;
    const degPerPx = () => step / Math.max(120, (num(arc, '--card-w') * persp()) / num(arc, '--r'));
    const onDown = (e: PointerEvent) => {
      if (!atTop || (e.pointerType === 'mouse' && e.button !== 0)) return;
      dragging = true;
      moved = false;
      startX = lastX = e.clientX;
      lastT = performance.now();
      velocity = 0;
      startAngle = state.angle;
      turning?.kill();
      timer?.kill();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6) moved = true;
      const now = performance.now();
      velocity = (e.clientX - lastX) / Math.max(1, now - lastT);
      lastX = e.clientX;
      lastT = now;
      state.angle = startAngle - dx * degPerPx();
      render();
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      // A flick carries on, but never more than a screen and a half.
      const fling = gsap.utils.clamp(-1.5 * step, 1.5 * step, -velocity * 120 * degPerPx());
      turnTo(snapped(state.angle + fling), 0.7);
      schedule();
    };
    // A drag is not a click on the screen it ended on.
    const onClick = (e: MouseEvent) => {
      if (!moved) return;
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    };
    arc.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    arc.addEventListener('click', onClick, true);
    const onVisibility = () => schedule();
    document.addEventListener('visibilitychange', onVisibility);

    // Scrolling stops the ring on the screen in front and moves the camera into it.
    const build = (fit: 'cover' | 'contain') => (tl: gsap.core.Timeline, { q }: { q: (s: string) => HTMLElement[] }) => {
      const push = () => {
        const r = num(arc, '--r');
        const w = num(arc, '--card-w');
        const h = w * 0.625;
        const scale =
          fit === 'cover'
            ? Math.max(window.innerWidth / w, window.innerHeight / h) * 1.04
            : Math.min(window.innerWidth / w, window.innerHeight / h) * 0.92;
        return r - persp() / scale;
      };
      const centre = () => window.innerHeight / 2 - (arc.offsetTop + arc.offsetHeight / 2);
      tl.to(q('.hero__copy > *'), { yPercent: -40, autoAlpha: 0, stagger: 0.02, duration: 0.16, ease: 'power1.in' }, 0)
        .to(q('.arc__cap'), { autoAlpha: 0, duration: 0.12 }, 0.08)
        .to(arc, { y: centre, duration: 0.5, ease: 'power2.inOut' }, 0.1)
        .fromTo(ringEl, { z: persp }, { z: () => persp() + push(), duration: 1, ease: 'power2.inOut' }, 0);
    };
    const stop = scene(el, {
      hold: 1.6,
      build: build('cover'),
      phone: { hold: 1, build: build('contain') },
      beats: 2,
      onBeat: (b) => arc.toggleAttribute('data-zoom', b === 1),
    });
    const watch = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'top+=8 top',
      onLeave: () => {
        atTop = false;
        timer?.kill();
        dragging = false;
        turnTo(snapped(state.angle), 0.35);
      },
      onEnterBack: () => {
        atTop = true;
        schedule();
      },
    });

    // On a desktop the ring leans a little away from the pointer.
    const fine = window.matchMedia('(pointer: fine)').matches;
    const toX = gsap.quickTo(tilt, 'x', { duration: 0.9, ease: 'power3.out' });
    const toY = gsap.quickTo(tilt, 'y', { duration: 0.9, ease: 'power3.out' });
    const onLean = (e: PointerEvent) => {
      toX((e.clientX / window.innerWidth - 0.5) * -24);
      toY((e.clientY / window.innerHeight - 0.5) * -14);
    };
    if (fine && !reduced) window.addEventListener('pointermove', onLean, { passive: true });

    return () => {
      stop();
      watch.kill();
      timer?.kill();
      turning?.kill();
      arc.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      arc.removeEventListener('click', onClick, true);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onLean);
    };
  }, []);

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

        <div className="arc" style={{ ['--n' as string]: count, ['--start' as string]: START }}>
          <div className="arc__tilt">
            <div className="arc__ring">
              <ul className="arc__spin" aria-label={screensLabel}>
                {ring.map((s, k) => {
                  const copy = k >= screens.length;
                  return (
                    <li
                      key={`${s.src}-${k}`}
                      className="arc__card"
                      style={{ ['--k' as string]: k }}
                      data-far={Math.abs(k - START) > 3 ? '' : undefined}
                      aria-hidden={copy || undefined}
                    >
                      <Link href={s.href} tabIndex={copy ? -1 : undefined} draggable={false}>
                        <span className="arc__pic">
                          <Image
                            src={s.src}
                            alt={copy ? '' : s.alt}
                            width={s.w}
                            height={s.h}
                            sizes="(max-width: 767px) 480px, 100vw"
                            priority={Math.abs(k - START) <= 1}
                            draggable={false}
                          />
                        </span>
                        <span className="arc__cap">{s.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

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
 * The opening scene. The headline sits over a curved wall of real screens, the
 * viewer standing inside the curve. Scrolling turns the wall one screen on and
 * moves the camera into the scheduler until it fills the view; the next
 * section then rises over it.
 *
 * The wall is plain CSS 3D, so with no script or with reduced motion it is
 * the same composition, standing still. Idle, it drifts a few degrees, and on
 * a desktop it leans away from the pointer.
 */

/** Read a length custom property in pixels. */
const px = (el: Element, name: string) => parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0;

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
  const mid = (screens.length - 1) / 2;
  /** The screen the camera ends on: the one to the right of centre, in reading order. */
  const target = Math.ceil(mid) + 1;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const arc = el.querySelector<HTMLElement>('.arc')!;
    const ring = el.querySelector<HTMLElement>('.arc__ring')!;
    const spin = el.querySelector<HTMLElement>('.arc__spin')!;
    const tilt = el.querySelector<HTMLElement>('.arc__tilt')!;
    const cards = [...el.querySelectorAll<HTMLElement>('.arc__card')];

    const stop = scene(el, {
      hold: 1.6,
      build(tl, { rtl, q }) {
        const dir = rtl ? -1 : 1;
        const step = () => px(arc, '--step');
        const persp = () => px(arc, '--persp');
        // How far the camera moves for the target screen to cover the view.
        const push = () => {
          const r = px(arc, '--r');
          const w = px(arc, '--card-w');
          const h = w * 0.625;
          const fill = Math.max(window.innerWidth / w, window.innerHeight / h) * 1.04;
          return r - persp() / fill;
        };
        const others = cards.filter((_, i) => i !== target);
        // The wall rises to the middle of the screen as the words leave it.
        const centre = () => window.innerHeight / 2 - (arc.offsetTop + arc.offsetHeight / 2);

        tl.to(q('.hero__copy > *'), { yPercent: -40, autoAlpha: 0, stagger: 0.02, duration: 0.16, ease: 'power1.in' }, 0)
          .to(q('.arc__cap'), { autoAlpha: 0, duration: 0.12 }, 0.08)
          .to(arc, { y: centre, duration: 0.5, ease: 'power2.inOut' }, 0.12)
          .fromTo(ring, { z: persp, rotationY: 0 }, { z: () => persp() + push(), rotationY: () => dir * step(), duration: 1, ease: 'power2.inOut' }, 0)
          .to(others, { autoAlpha: 0, duration: 0.22, ease: 'power1.in' }, 0.5);
      },
    });

    // Idle drift, only while the scene sits at its start.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let drift: gsap.core.Tween | null = null;
    const startDrift = () => {
      if (reduced || drift) return;
      gsap.set(spin, { rotationY: -2.5 });
      drift = gsap.to(spin, { rotationY: 2.5, duration: 9, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    };
    const stopDrift = () => {
      drift?.kill();
      drift = null;
      gsap.to(spin, { rotationY: 0, duration: 0.6, ease: 'power2.out' });
    };
    startDrift();
    const watch = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'top+=12 top',
      onLeave: stopDrift,
      onEnterBack: startDrift,
    });

    // The wall leans a little away from the pointer.
    const fine = window.matchMedia('(pointer: fine)').matches;
    const toX = gsap.quickTo(tilt, 'x', { duration: 0.9, ease: 'power3.out' });
    const toY = gsap.quickTo(tilt, 'y', { duration: 0.9, ease: 'power3.out' });
    const onMove = (e: PointerEvent) => {
      toX((e.clientX / window.innerWidth - 0.5) * -24);
      toY((e.clientY / window.innerHeight - 0.5) * -14);
    };
    if (fine && !reduced) window.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      stop();
      watch.kill();
      drift?.kill();
      window.removeEventListener('pointermove', onMove);
    };
  }, [target]);

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

        <div className="arc">
          <div className="arc__tilt">
            <div className="arc__ring">
              <ul className="arc__spin" aria-label={screensLabel}>
                {screens.map((s, i) => (
                  <li key={s.src} className="arc__card" style={{ ['--k' as string]: i - mid }} data-target={i === target ? '' : undefined}>
                    <Link href={s.href} tabIndex={i === Math.round(mid) || i === target ? 0 : -1}>
                      <span className="arc__pic">
                        <Image src={s.src} alt={s.alt} width={s.w} height={s.h} sizes="100vw" priority={Math.abs(i - mid) <= 1} />
                      </span>
                      <span className="arc__cap">{s.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Scroll scenes: a tall section whose stage holds still while the page
 * scrolls past it, with a GSAP timeline scrubbed from 0 to 1 by that scroll.
 * The page always scrolls natively, so the scrollbar and the keyboard work
 * as everywhere else.
 *
 * Without motion (reduced motion, no script, a phone plan set to 'rest') the
 * section is an ordinary section showing its finished composition: the CSS
 * for each scene is written for that first, and for `.is-live` second.
 */

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export interface SceneContext {
  root: HTMLElement;
  stage: HTMLElement;
  phone: boolean;
  /** Right to left: anything that travels sideways goes the other way. */
  rtl: boolean;
  q: <T extends HTMLElement = HTMLElement>(selector: string) => T[];
}

export interface ScenePlan {
  /** Screens of scroll the stage is held for; the section is (hold + 1) screens tall. */
  hold: number;
  /** Adds the tweens; positions are fractions of the hold, 0 to 1. */
  build: (tl: gsap.core.Timeline, ctx: SceneContext) => void;
}

export interface SceneOptions extends ScenePlan {
  /** true locks the scene to the scrollbar; a number is seconds of catch-up. */
  scrub?: boolean | number;
  /** 'same', 'rest' (the finished composition), or a phone plan of its own. */
  phone?: 'same' | 'rest' | Partial<ScenePlan>;
  /** Splits the hold into equal beats and reports the current one. */
  beats?: number;
  onBeat?: (beat: number) => void;
}

/** Starts a scene on `root` (which holds one `.scene-stage`); returns its cleanup. */
export function scene(root: HTMLElement, opts: SceneOptions) {
  const stage = root.querySelector<HTMLElement>(':scope > .scene-stage') ?? (root.firstElementChild as HTMLElement);
  const q = <T extends HTMLElement = HTMLElement>(selector: string) => [...root.querySelectorAll<T>(selector)];
  const mm = gsap.matchMedia();

  mm.add({ motion: '(prefers-reduced-motion: no-preference)', phone: '(max-width: 767px)' }, (c) => {
    const phone = Boolean(c.conditions?.phone);
    const plan: ScenePlan | null = phone
      ? opts.phone === 'rest'
        ? null
        : opts.phone && opts.phone !== 'same'
          ? { hold: opts.phone.hold ?? opts.hold, build: opts.phone.build ?? opts.build }
          : { hold: opts.hold, build: opts.build }
      : { hold: opts.hold, build: opts.build };

    if (!c.conditions?.motion || !plan) {
      root.classList.add('is-rest');
      return () => root.classList.remove('is-rest');
    }

    root.classList.add('is-live');
    root.style.setProperty('--hold', String(plan.hold));
    let beat = -1;
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: opts.scrub ?? true,
        invalidateOnRefresh: true,
        onUpdate(self) {
          root.style.setProperty('--p', self.progress.toFixed(4));
          if (!opts.beats) return;
          const b = Math.min(opts.beats - 1, Math.floor(self.progress * opts.beats));
          if (b !== beat) {
            beat = b;
            root.dataset.beat = String(b);
            opts.onBeat?.(b);
          }
        },
      },
    });
    plan.build(tl, { root, stage, phone, rtl: document.documentElement.dir === 'rtl', q });
    // Padded to exactly 1, so positions in build() read as fractions of the hold.
    if (tl.duration() < 1) tl.to({}, { duration: 1 - tl.duration() }, tl.duration());
    if (opts.beats) opts.onBeat?.((beat = 0));

    return () => {
      root.classList.remove('is-live');
      root.style.removeProperty('--hold');
      root.style.removeProperty('--p');
      delete root.dataset.beat;
    };
  });

  // Fonts and pictures decide the heights the triggers measure.
  void document.fonts?.ready.then(() => ScrollTrigger.refresh());

  return () => mm.revert();
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

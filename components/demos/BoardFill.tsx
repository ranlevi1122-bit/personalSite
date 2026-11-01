'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocale } from '@/components/LocaleProvider';
import { fillPlan } from './Scheduler';

/**
 * The scheduler model filling its own board, as its "Fill the board" does:
 * the same people, the same rules, the same order, one seat every 420 ms. A
 * name flies from the list to each seat, and the clock runs from the first
 * seat to the last. It plays once when it comes into view, and again on
 * request. Without script, or with reduced motion, the board is shown full.
 */

/** The scheduler's own pace, one seat at a time. */
const STEP_MS = 420;
const FLY_MS = 480;
const LEAD_MS = 500;

export interface BoardWords {
  clock: string;
  byHand: { value: string; label: string };
  withSystem: { value: string; label: string };
  verdict: string;
  again: string;
  label: string;
}

const seatKey = (shift: string, i: number) => `${shift}:${i}`;
const clockOf = (ms: number) => `0:${String(Math.floor(ms / 1000)).padStart(2, '0')}`;

export function BoardFill({ words, intro, link }: { words: BoardWords; intro: ReactNode; link: ReactNode }) {
  const locale = useLocale();
  const { people, shifts, steps, T } = useMemo(() => fillPlan(locale), [locale]);
  const full = useMemo(() => Object.fromEntries(steps.map((s) => [seatKey(s.shift, s.seat), s.person])), [steps]);
  const fullCounts = useMemo(
    () => steps.reduce<Record<string, number>>((c, s) => ({ ...c, [s.person]: (c[s.person] ?? 0) + 1 }), {}),
    [steps],
  );
  const finalClock = clockOf((steps.length - 1) * STEP_MS + FLY_MS);

  // The finished board is what renders first, and what stays without motion.
  const [seats, setSeats] = useState<Record<string, string>>(full);
  const [counts, setCounts] = useState<Record<string, number>>(fullCounts);
  const [clock, setClock] = useState(finalClock);
  const [done, setDone] = useState(true);
  const [motion, setMotion] = useState(false);
  const board = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const stopAll = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    board.current?.querySelectorAll('.fb-ghost').forEach((g) => g.remove());
  };

  const reset = useCallback(() => {
    stopAll();
    setSeats({});
    setCounts({});
    setClock('0:00');
    setDone(false);
  }, []);

  /** One name flies from its card in the list to its seat. */
  const fly = useCallback(
    (shift: string, seat: number, person: string) => {
      const el = board.current;
      const from = el?.querySelector<HTMLElement>(`[data-person="${person}"]`);
      const to = el?.querySelector<HTMLElement>(`[data-seat="${seatKey(shift, seat)}"] b`);
      const land = () => {
        setSeats((s) => ({ ...s, [seatKey(shift, seat)]: person }));
        setCounts((c) => ({ ...c, [person]: (c[person] ?? 0) + 1 }));
      };
      if (!el || !from || !to) return land();
      const box = el.getBoundingClientRect();
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      const ghost = document.createElement('span');
      ghost.className = 'fb-ghost';
      ghost.textContent = T.name[person];
      ghost.style.left = `${a.left - box.left}px`;
      ghost.style.top = `${a.top - box.top}px`;
      el.appendChild(ghost);
      const dx = b.left - a.left + (locale === 'he' ? b.width - ghost.offsetWidth : 0);
      const dy = b.top - a.top + (b.height - ghost.offsetHeight) / 2;
      ghost
        .animate(
          [
            { transform: 'translate(0, 0) scale(1)' },
            { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 18}px) scale(1.08)`, offset: 0.5 },
            { transform: `translate(${dx}px, ${dy}px) scale(1)` },
          ],
          { duration: FLY_MS, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
        )
        .finished.then(() => {
          ghost.remove();
          land();
        })
        .catch(() => ghost.remove());
    },
    [T, locale],
  );

  const run = useCallback(() => {
    reset();
    const start = performance.now() + LEAD_MS;
    let tick = 0;
    const time = () => {
      setClock(clockOf(Math.max(0, performance.now() - start)));
      tick = window.setTimeout(time, 200);
      timers.current.push(tick);
    };
    timers.current.push(window.setTimeout(time, LEAD_MS));
    steps.forEach((s, i) => {
      timers.current.push(window.setTimeout(() => fly(s.shift, s.seat, s.person), LEAD_MS + i * STEP_MS));
    });
    timers.current.push(
      window.setTimeout(() => {
        timers.current.forEach((id) => window.clearTimeout(id));
        timers.current = [];
        setClock(finalClock);
        setDone(true);
      }, LEAD_MS + (steps.length - 1) * STEP_MS + FLY_MS + 40),
    );
  }, [reset, fly, steps, finalClock]);

  // With motion allowed, the board empties and waits to be seen.
  useEffect(() => {
    const el = board.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setMotion(true);
    reset();
    let started = false;
    const seen = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started) {
          started = true;
          run();
        }
      },
      { threshold: 0.45 },
    );
    seen.observe(el);
    return () => {
      seen.disconnect();
      stopAll();
    };
  }, [reset, run]);

  const staffed = shifts.map((s) => s.seats.every((_, i) => seats[seatKey(s.id, i)]));

  return (
    <div className="fb-wrap">
      <div className="fb-copy">
        {intro}
        <dl className="fb-facts">
          <div>
            <dt className="tnum" aria-live="off">
              {clock}
            </dt>
            <dd>{words.clock}</dd>
          </div>
          <div>
            <dt>{words.byHand.value}</dt>
            <dd>{words.byHand.label}</dd>
          </div>
          <div>
            <dt>{words.withSystem.value}</dt>
            <dd>{words.withSystem.label}</dd>
          </div>
        </dl>
        {link}
      </div>

      <div className="fb-side">
        <div className="dm fb" ref={board} role="img" aria-label={words.label} data-demo="" data-ui="">
          <div className="dm-bar">
            <b>{T.app}</b>
            <span className="dm-bar__context">{T.day}</span>
            <span className="dm-pill">{locale === 'he' ? 'נתוני דוגמה' : 'Sample data'}</span>
          </div>
          <div className="fb__body">
            <ul className="fb__people">
              {people.map((p) => (
                <li key={p.id} className="fb__chip" data-person={p.id} data-locked={p.tag === 'locked' || undefined}>
                  <span>{T.name[p.id]}</span>
                  <small>{p.tag === 'locked' ? T.tag.locked : counts[p.id] ? T.onShifts(counts[p.id]) : T.role(p.role, p.female)}</small>
                </li>
              ))}
            </ul>
            <div className="fb__shifts">
              {shifts.map((s, k) => (
                <div key={s.id} className="fb__shift" data-full={staffed[k] || undefined}>
                  <div className="fb__head">
                    <b>{T.shift[s.id]}</b>
                    <span className="tnum">{T.time(s.time)}</span>
                  </div>
                  {s.seats.map((role, i) => {
                    const who = seats[seatKey(s.id, i)];
                    return (
                      <div key={i} className="fb__seat" data-seat={seatKey(s.id, i)} data-filled={who ? '' : undefined}>
                        <span>{T.role(role)}</span>
                        <b>{who ? T.name[who] : T.open}</b>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="fb__verdict" data-on={done || undefined}>
              {words.verdict}
            </p>
          </div>
        </div>
        {motion && (
          <button type="button" className="fb__again" onClick={run} disabled={!done}>
            {words.again}
          </button>
        )}
      </div>
    </div>
  );
}

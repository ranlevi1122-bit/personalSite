'use client';

import { useEffect, useState } from 'react';
import { trackDemo } from '@/lib/analytics/client';
import { DemoMessage, DemoWindow, ScaledStage, usePlaying, type DemoMode } from './shared';

/**
 * The shared-facility platform as a week of two-hour slots. Members request a
 * slot, an admin approves it, a viewer only looks; a taken slot cannot be
 * booked twice. It replaced a WhatsApp group; the names here are invented.
 */

type Role = 'Member' | 'Admin' | 'Viewer';
type Status = 'ok' | 'pending';
interface Booking {
  who: string;
  status: Status;
}

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
const slots = ['08–10', '10–12', '16–18', '18–20', '20–22'];
const roles: Role[] = ['Member', 'Admin', 'Viewer'];
const ME = 'You';

const seed: Record<string, Booking> = {
  'Sun 18–20': { who: 'Maya', status: 'ok' },
  'Sun 20–22': { who: 'Tom', status: 'ok' },
  'Mon 16–18': { who: 'Shira', status: 'ok' },
  'Mon 18–20': { who: 'Yoni', status: 'ok' },
  'Tue 10–12': { who: 'Eden', status: 'ok' },
  'Tue 18–20': { who: 'Maya', status: 'ok' },
  'Tue 20–22': { who: 'Roni', status: 'pending' },
  'Wed 08–10': { who: 'Noam', status: 'ok' },
  'Wed 20–22': { who: 'Shira', status: 'ok' },
  'Thu 16–18': { who: 'Tom', status: 'pending' },
  'Thu 18–20': { who: 'Eden', status: 'ok' },
};

const key = (d: string, s: string) => `${d} ${s}`;
const TOTAL = days.length * slots.length;

type Msg = { tone: 'ok' | 'warn' | 'stop' | 'info'; text: string };

/** The preview's script: a request, a clash, then the admin's approvals. */
const script: { role?: Role; slot?: string; approve?: string }[] = [
  { role: 'Member' },
  { slot: 'Wed 18–20' },
  { slot: 'Tue 18–20' },
  { role: 'Admin' },
  { approve: 'Wed 18–20' },
  { approve: 'Tue 20–22' },
  {},
  {},
];

export function Booking({ mode = 'full' }: { mode?: DemoMode }) {
  const preview = mode === 'preview';
  const [role, setRole] = useState<Role>('Member');
  const [book, setBook] = useState<Record<string, Booking>>(seed);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const pending = Object.entries(book).filter(([, b]) => b.status === 'pending');
  const approved = Object.values(book).filter((b) => b.status === 'ok').length;
  const perDay = days.map((d) => slots.filter((s) => book[key(d, s)]?.status === 'ok').length);
  const busiest = days[perDay.indexOf(Math.max(...perDay))];

  const say = (m: Msg, at?: string) => {
    setMsg(m);
    setFlash(at ?? null);
  };

  function pick(slot: string, as: Role = role) {
    const b = book[slot];
    if (as === 'Viewer') {
      say({ tone: 'info', text: b ? `${slot}: booked by ${b.who}. Viewers can see the week but not book.` : `${slot} is free. Viewers can see the week but not book.` }, slot);
      return;
    }
    if (as === 'Admin') {
      if (b?.status === 'pending') return approve(slot);
      say({ tone: 'info', text: b ? `${slot}: ${b.who}, approved.` : `${slot} is free. Members request slots; admins approve them.` }, slot);
      return;
    }
    if (!b) {
      setBook({ ...book, [slot]: { who: ME, status: 'pending' } });
      say({ tone: 'ok', text: `Requested ${slot}. It is held for you until an admin approves it.` }, slot);
      if (!preview) trackDemo('booking: requested a slot');
      return;
    }
    if (b.who === ME) {
      const next = { ...book };
      delete next[slot];
      setBook(next);
      say({ tone: 'info', text: `Your booking for ${slot} is cancelled; the slot is free again.` }, slot);
      return;
    }
    say({ tone: 'stop', text: `${slot} is taken by ${b.who}. The platform does not allow double bookings; pick another slot.` }, slot);
    if (!preview) trackDemo('booking: hit a conflict');
  }

  function approve(slot: string) {
    setBook((cur) => ({ ...cur, [slot]: { ...cur[slot], status: 'ok' } }));
    say({ tone: 'ok', text: `Approved: ${book[slot]?.who ?? ''}, ${slot}. The slot now counts as used.` }, slot);
    if (!preview) trackDemo('booking: approved a request');
  }

  function decline(slot: string) {
    const next = { ...book };
    const who = next[slot]?.who;
    delete next[slot];
    setBook(next);
    say({ tone: 'info', text: `Declined ${who}'s request for ${slot}; the slot is free again.` }, slot);
    if (!preview) trackDemo('booking: declined a request');
  }

  /* The preview acts the script out, then starts over. */
  const { ref: stageRef, playing } = usePlaying<HTMLDivElement>(preview);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!preview || !playing) return;
    const id = window.setTimeout(() => {
      const s = script[step % script.length];
      if (step % script.length === 0) {
        setBook(seed);
        setMsg(null);
        setFlash(null);
      }
      if (s.role) setRole(s.role);
      if (s.slot) pick(s.slot, 'Member');
      if (s.approve) approve(s.approve);
      setStep((n) => n + 1);
    }, step === 0 ? 700 : 1700);
    return () => window.clearTimeout(id);
    // pick and approve read the latest state through the render they run in.
  }, [preview, playing, step]);

  const ui = (
    <DemoWindow
      app="Facility bookings"
      context="49 members"
      className={preview ? 'dm--preview' : undefined}
      actions={
        <span className="dm-seg" role="group" aria-label="Signed in as">
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={role === r}
              onClick={() => {
                setRole(r);
                say({
                  tone: 'info',
                  text:
                    r === 'Member'
                      ? 'As a member: click a free slot to request it, or your own to cancel.'
                      : r === 'Admin'
                        ? 'As an admin: approve or decline requests, here or on the week.'
                        : 'As a viewer: the week is visible, nothing can be booked.',
                });
                if (!preview) trackDemo(`booking: switched to ${r}`);
              }}
            >
              {r}
            </button>
          ))}
        </span>
      }
    >
      <div className="dm-book">
        <div className="dm-week" role="grid" aria-label="This week's slots">
          <div role="row" className="dm-week__row">
            <span role="columnheader" />
            {days.map((d) => (
              <span key={d} role="columnheader" className="dm-week__day">
                {d}
              </span>
            ))}
          </div>
          {slots.map((s) => (
            <div key={s} role="row" className="dm-week__row">
              <span role="rowheader" className="dm-week__time tnum">
                {s}
              </span>
              {days.map((d) => {
                const k = key(d, s);
                const b = book[k];
                return (
                  <span key={k} role="gridcell">
                    <button
                      type="button"
                      className="dm-slot"
                      data-state={b ? (b.status === 'pending' ? 'pending' : 'ok') : 'free'}
                      data-mine={b?.who === ME ? '' : undefined}
                      data-flash={flash === k ? (msg?.tone ?? 'info') : undefined}
                      onClick={() => pick(k)}
                      aria-label={`${k}: ${b ? `${b.who}${b.status === 'pending' ? ', waiting for approval' : ''}` : 'free'}`}
                    >
                      {b ? (
                        <>
                          <b>{b.who}</b>
                          {b.status === 'pending' && <small>Pending</small>}
                        </>
                      ) : (
                        <small className="dm-slot__free">{role === 'Member' ? 'Request' : 'Free'}</small>
                      )}
                    </button>
                  </span>
                );
              })}
            </div>
          ))}
        </div>

        <div className="dm-book__side">
          <section className="dm-panel">
            <div className="dm-panel__head">
              <b>Requests</b>
              <span className="tnum">{pending.length} waiting</span>
            </div>
            {pending.length ? (
              <ul className="dm-queue">
                {pending.map(([slot, b]) => (
                  <li key={slot}>
                    <span>
                      <b>{b.who}</b> {slot}
                    </span>
                    {role === 'Admin' ? (
                      <span className="dm-queue__acts">
                        <button type="button" className="dm-btn" data-primary="" onClick={() => approve(slot)}>
                          Approve
                        </button>
                        <button type="button" className="dm-btn" onClick={() => decline(slot)}>
                          Decline
                        </button>
                      </span>
                    ) : (
                      <small>Admin approves</small>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dm-note">No requests waiting.</p>
            )}
          </section>

          <section className="dm-panel">
            <div className="dm-panel__head">
              <b>Use this week</b>
              <span className="tnum">
                {approved} of {TOTAL} slots
              </span>
            </div>
            <p className="dm-big tnum">{Math.round((approved / TOTAL) * 100)}%</p>
            <div className="dm-usebars" aria-label={`Approved slots by day: ${days.map((d, i) => `${d} ${perDay[i]}`).join(', ')}`}>
              {days.map((d, i) => (
                <span key={d} data-top={d === busiest ? '' : undefined}>
                  <i style={{ height: `${(perDay[i] / slots.length) * 100}%` }} />
                  <small>{d}</small>
                </span>
              ))}
            </div>
            <p className="dm-note">Busiest day: {busiest}.</p>
          </section>
        </div>
      </div>
      <div className="dm-msgrow">
        <DemoMessage tone={msg?.tone ?? 'info'}>
          {msg?.text ?? 'Signed in as a member. Click a free slot to request it; try one that is taken.'}
        </DemoMessage>
      </div>
    </DemoWindow>
  );

  if (preview) {
    return (
      <div ref={stageRef} inert>
        <ScaledStage width={800} height={600}>
          {ui}
        </ScaledStage>
      </div>
    );
  }
  return ui;
}

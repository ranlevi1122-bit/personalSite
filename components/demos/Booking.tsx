'use client';

import { useEffect, useState } from 'react';
import { trackDemo } from '@/lib/analytics/client';
import { useLocale } from '@/components/LocaleProvider';
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
const ME = 'me';

const seed: Record<string, Booking> = {
  'Sun 18–20': { who: 'maya', status: 'ok' },
  'Sun 20–22': { who: 'tom', status: 'ok' },
  'Mon 16–18': { who: 'shira', status: 'ok' },
  'Mon 18–20': { who: 'yoni', status: 'ok' },
  'Tue 10–12': { who: 'eden', status: 'ok' },
  'Tue 18–20': { who: 'maya', status: 'ok' },
  'Tue 20–22': { who: 'roni', status: 'pending' },
  'Wed 08–10': { who: 'noam', status: 'ok' },
  'Wed 20–22': { who: 'shira', status: 'ok' },
  'Thu 16–18': { who: 'tom', status: 'pending' },
  'Thu 18–20': { who: 'eden', status: 'ok' },
};

const key = (d: string, s: string) => `${d} ${s}`;
const TOTAL = days.length * slots.length;

const en = {
  app: 'Facility bookings',
  context: '49 members',
  day: { Sun: 'Sun', Mon: 'Mon', Tue: 'Tue', Wed: 'Wed', Thu: 'Thu' } as Record<string, string>,
  time: (s: string) => s,
  name: { me: 'You', maya: 'Maya', tom: 'Tom', shira: 'Shira', yoni: 'Yoni', eden: 'Eden', roni: 'Roni', noam: 'Noam' } as Record<string, string>,
  role: { Member: 'Member', Admin: 'Admin', Viewer: 'Viewer' } as Record<Role, string>,
  viewerTaken: (slot: string, who: string) => `${slot}: booked by ${who}. Viewers can see the week but not book.`,
  viewerFree: (slot: string) => `${slot} is free. Viewers can see the week but not book.`,
  adminTaken: (slot: string, who: string) => `${slot}: ${who}, approved.`,
  adminFree: (slot: string) => `${slot} is free. Members request slots; admins approve them.`,
  requested: (slot: string) => `Requested ${slot}. It is held for you until an admin approves it.`,
  cancelled: (slot: string) => `Your booking for ${slot} is cancelled; the slot is free again.`,
  taken: (slot: string, who: string) => `${slot} is taken by ${who}. The platform does not allow double bookings; pick another slot.`,
  approved: (slot: string, who: string) => `Approved: ${who}, ${slot}. The slot now counts as used.`,
  declined: (slot: string, who: string, _mine: boolean) => `Declined ${who}'s request for ${slot}; the slot is free again.`,
  as: {
    Member: 'As a member: click a free slot to request it, or your own to cancel.',
    Admin: 'As an admin: approve or decline requests, here or on the week.',
    Viewer: 'As a viewer: the week is visible, nothing can be booked.',
  } as Record<Role, string>,
  signedInAs: 'Signed in as',
  grid: 'This week’s slots',
  cell: (slot: string, who: string | null, pending: boolean) => `${slot}: ${who ? `${who}${pending ? ', waiting for approval' : ''}` : 'free'}`,
  pending: 'Pending',
  request: 'Request',
  free: 'Free',
  requests: 'Requests',
  waiting: (n: number) => `${n} waiting`,
  approve: 'Approve',
  decline: 'Decline',
  adminApproves: 'Admin approves',
  noRequests: 'No requests waiting.',
  use: 'Use this week',
  slotsOf: (a: number, b: number) => `${a} of ${b} slots`,
  byDay: (list: string) => `Approved slots by day: ${list}`,
  busiest: (d: string) => `Busiest day: ${d}.`,
  intro: 'Signed in as a member. Click a free slot to request it; try one that is taken.',
};

const he: typeof en = {
  app: 'הזמנת מתקנים',
  context: '49 חברים',
  day: { Sun: 'ראשון', Mon: 'שני', Tue: 'שלישי', Wed: 'רביעי', Thu: 'חמישי' },
  /* Keeps a time range reading left to right inside a Hebrew sentence. */
  time: (s) => `⁦${s}⁩`,
  name: { me: 'אתם', maya: 'מאיה', tom: 'תום', shira: 'שירה', yoni: 'יוני', eden: 'עדן', roni: 'רוני', noam: 'נועם' },
  role: { Member: 'חבר', Admin: 'מנהל', Viewer: 'צופה' },
  viewerTaken: (slot, who) => `${slot} תפוס (${who}). צופים רואים את השבוע אבל לא מזמינים.`,
  viewerFree: (slot) => `${slot} פנוי. צופים רואים את השבוע אבל לא מזמינים.`,
  adminTaken: (slot, who) => `${slot}: ${who}, מאושר.`,
  adminFree: (slot) => `${slot} פנוי. חברים מבקשים משבצות, ומנהלים מאשרים אותן.`,
  requested: (slot) => `ביקשתם את ${slot}. המשבצת שמורה לכם עד שמנהל יאשר אותה.`,
  cancelled: (slot) => `ההזמנה שלכם ל${slot} בוטלה, והמשבצת פנויה שוב.`,
  taken: (slot, who) => `${slot} תפוס על ידי ${who}. הפלטפורמה לא מאפשרת הזמנה כפולה; בחרו משבצת אחרת.`,
  approved: (slot, who) => `אושר: ${who}, ${slot}. המשבצת נספרת עכשיו כמנוצלת.`,
  declined: (slot, who, mine) => `הבקשה ${mine ? 'שלכם' : `של ${who}`} ל${slot} נדחתה, והמשבצת פנויה שוב.`,
  as: {
    Member: 'בתור חבר: לחצו על משבצת פנויה כדי לבקש אותה, או על משבצת שלכם כדי לבטל.',
    Admin: 'בתור מנהל: אשרו או דחו בקשות, כאן או על גבי השבוע.',
    Viewer: 'בתור צופה: השבוע גלוי, ואי אפשר להזמין דבר.',
  },
  signedInAs: 'מחובר בתור',
  grid: 'המשבצות של השבוע',
  cell: (slot, who, pending) => `${slot}: ${who ? `${who}${pending ? ', ממתין לאישור' : ''}` : 'פנוי'}`,
  pending: 'ממתין',
  request: 'בקשה',
  free: 'פנוי',
  requests: 'בקשות',
  waiting: (n) => `${n} ממתינות`,
  approve: 'אישור',
  decline: 'דחייה',
  adminApproves: 'ממתין למנהל',
  noRequests: 'אין בקשות ממתינות.',
  use: 'ניצול השבוע',
  slotsOf: (a, b) => `${a} מתוך ${b} משבצות`,
  byDay: (list) => `משבצות מאושרות לפי יום: ${list}`,
  busiest: (d) => `היום העמוס ביותר: ${d}.`,
  intro: 'מחוברים בתור חבר. לחצו על משבצת פנויה כדי לבקש אותה; נסו גם אחת תפוסה.',
};

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
  const T = useLocale() === 'he' ? he : en;
  const [role, setRole] = useState<Role>('Member');
  const [book, setBook] = useState<Record<string, Booking>>(seed);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const pending = Object.entries(book).filter(([, b]) => b.status === 'pending');
  const approved = Object.values(book).filter((b) => b.status === 'ok').length;
  const perDay = days.map((d) => slots.filter((s) => book[key(d, s)]?.status === 'ok').length);
  const busiest = days[perDay.indexOf(Math.max(...perDay))];

  /** A slot as the visitor reads it: "Wed 18–20", "רביעי 18–20". */
  const label = (slot: string) => {
    const [d, s] = slot.split(' ');
    return `${T.day[d]} ${T.time(s)}`;
  };
  const who = (id: string) => T.name[id];

  const say = (m: Msg, at?: string) => {
    setMsg(m);
    setFlash(at ?? null);
  };

  function pick(slot: string, as: Role = role) {
    const b = book[slot];
    const at = label(slot);
    if (as === 'Viewer') {
      say({ tone: 'info', text: b ? T.viewerTaken(at, who(b.who)) : T.viewerFree(at) }, slot);
      return;
    }
    if (as === 'Admin') {
      if (b?.status === 'pending') return approve(slot);
      say({ tone: 'info', text: b ? T.adminTaken(at, who(b.who)) : T.adminFree(at) }, slot);
      return;
    }
    if (!b) {
      setBook({ ...book, [slot]: { who: ME, status: 'pending' } });
      say({ tone: 'ok', text: T.requested(at) }, slot);
      if (!preview) trackDemo('booking: requested a slot');
      return;
    }
    if (b.who === ME) {
      const next = { ...book };
      delete next[slot];
      setBook(next);
      say({ tone: 'info', text: T.cancelled(at) }, slot);
      return;
    }
    say({ tone: 'stop', text: T.taken(at, who(b.who)) }, slot);
    if (!preview) trackDemo('booking: hit a conflict');
  }

  function approve(slot: string) {
    setBook((cur) => ({ ...cur, [slot]: { ...cur[slot], status: 'ok' } }));
    const id = book[slot]?.who;
    say({ tone: 'ok', text: T.approved(label(slot), id ? who(id) : '') }, slot);
    if (!preview) trackDemo('booking: approved a request');
  }

  function decline(slot: string) {
    const next = { ...book };
    const id = next[slot]?.who ?? '';
    delete next[slot];
    setBook(next);
    say({ tone: 'info', text: T.declined(label(slot), who(id), id === ME) }, slot);
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
      app={T.app}
      context={T.context}
      className={preview ? 'dm--preview' : undefined}
      actions={
        <span className="dm-seg" role="group" aria-label={T.signedInAs}>
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={role === r}
              onClick={() => {
                setRole(r);
                say({ tone: 'info', text: T.as[r] });
                if (!preview) trackDemo(`booking: switched to ${r}`);
              }}
            >
              {T.role[r]}
            </button>
          ))}
        </span>
      }
    >
      <div className="dm-book">
        <div className="dm-week" role="grid" aria-label={T.grid}>
          <div role="row" className="dm-week__row">
            <span role="columnheader" />
            {days.map((d) => (
              <span key={d} role="columnheader" className="dm-week__day">
                {T.day[d]}
              </span>
            ))}
          </div>
          {slots.map((s) => (
            <div key={s} role="row" className="dm-week__row">
              <span role="rowheader" className="dm-week__time tnum" dir="ltr">
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
                      aria-label={T.cell(label(k), b ? who(b.who) : null, b?.status === 'pending')}
                    >
                      {b ? (
                        <>
                          <b>{who(b.who)}</b>
                          {b.status === 'pending' && <small>{T.pending}</small>}
                        </>
                      ) : (
                        <small className="dm-slot__free">{role === 'Member' ? T.request : T.free}</small>
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
              <b>{T.requests}</b>
              <span className="tnum">{T.waiting(pending.length)}</span>
            </div>
            {pending.length ? (
              <ul className="dm-queue">
                {pending.map(([slot, b]) => (
                  <li key={slot}>
                    <span>
                      <b>{who(b.who)}</b> {label(slot)}
                    </span>
                    {role === 'Admin' ? (
                      <span className="dm-queue__acts">
                        <button type="button" className="dm-btn" data-primary="" onClick={() => approve(slot)}>
                          {T.approve}
                        </button>
                        <button type="button" className="dm-btn" onClick={() => decline(slot)}>
                          {T.decline}
                        </button>
                      </span>
                    ) : (
                      <small>{T.adminApproves}</small>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dm-note">{T.noRequests}</p>
            )}
          </section>

          <section className="dm-panel">
            <div className="dm-panel__head">
              <b>{T.use}</b>
              <span className="tnum">{T.slotsOf(approved, TOTAL)}</span>
            </div>
            <p className="dm-big tnum">{Math.round((approved / TOTAL) * 100)}%</p>
            <div className="dm-usebars" aria-label={T.byDay(days.map((d, i) => `${T.day[d]} ${perDay[i]}`).join(', '))}>
              {days.map((d, i) => (
                <span key={d} data-top={d === busiest ? '' : undefined}>
                  <i style={{ height: `${(perDay[i] / slots.length) * 100}%` }} />
                  <small>{T.day[d]}</small>
                </span>
              ))}
            </div>
            <p className="dm-note">{T.busiest(T.day[busiest])}</p>
          </section>
        </div>
      </div>
      <div className="dm-msgrow">
        <DemoMessage tone={msg?.tone ?? 'info'}>{msg?.text ?? T.intro}</DemoMessage>
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

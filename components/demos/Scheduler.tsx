'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { trackDemo } from '@/lib/analytics/client';
import { DemoMessage, DemoWindow, ScaledStage, usePlaying, useTicker, type DemoMode } from './shared';

/**
 * A working model of the company scheduler: people on the left, the day's
 * shifts on the right, each shift with the roles it needs. The checks follow
 * the real system's (a full shift, a person already on it, someone not yet on
 * base, who arrives later, who stood guard last night); the names are invented.
 */

type Role = 'Commander' | 'Fighter';
type Tag = 'free' | 'night' | 'arriving' | 'locked';

interface Person {
  id: string;
  name: string;
  role: Role;
  tag?: Tag;
  /** Hour the person reaches base, when it is later than the first shift. */
  from?: number;
  /** Shifts on each of the last six days, oldest first. */
  week: number[];
  /** Night shifts in those six days. */
  nights: number;
}

interface Shift {
  id: string;
  name: string;
  time: string;
  start: number;
  end: number;
  night?: boolean;
  seats: Role[];
}

const people: Person[] = [
  { id: 'noa', name: 'Noa', role: 'Commander', tag: 'free', week: [1, 1, 0, 1, 1, 0], nights: 1 },
  { id: 'amit', name: 'Amit', role: 'Commander', tag: 'night', week: [1, 2, 1, 1, 1, 1], nights: 3 },
  { id: 'itay', name: 'Itay', role: 'Fighter', week: [1, 1, 1, 1, 1, 1], nights: 2 },
  { id: 'lior', name: 'Lior', role: 'Fighter', tag: 'free', week: [0, 1, 0, 1, 1, 0], nights: 0 },
  { id: 'dana', name: 'Dana', role: 'Fighter', tag: 'night', week: [1, 1, 2, 1, 1, 1], nights: 3 },
  { id: 'gal', name: 'Gal', role: 'Fighter', tag: 'arriving', from: 14, week: [0, 0, 1, 1, 0, 0], nights: 1 },
  { id: 'omer', name: 'Omer', role: 'Fighter', tag: 'locked', week: [0, 0, 0, 0, 0, 0], nights: 0 },
];

const shifts: Shift[] = [
  { id: 'gate-am', name: 'Gate', time: '06:00–14:00', start: 6, end: 14, seats: ['Commander', 'Fighter'] },
  { id: 'patrol', name: 'Patrol', time: '14:00–22:00', start: 14, end: 22, seats: ['Commander', 'Fighter'] },
  { id: 'gate-night', name: 'Night gate', time: '22:00–06:00', start: 22, end: 30, night: true, seats: ['Fighter', 'Fighter'] },
];

const tagText: Record<Tag, string> = {
  free: 'Off duty yesterday',
  night: 'Night shift yesterday',
  arriving: 'On base from 14:00',
  locked: 'Not on base yet',
};

/** Hard seats first, so the commanders are not used up on fighter seats. */
const fillOrder = [
  ['gate-am', 0],
  ['patrol', 0],
  ['gate-am', 1],
  ['patrol', 1],
  ['gate-night', 0],
  ['gate-night', 1],
] as const;

const seatId = (shiftId: string, i: number) => `${shiftId}:${i}`;
const TOTAL = shifts.reduce((n, s) => n + s.seats.length, 0);

type Board = Record<string, string | null>;
const emptyBoard = (): Board =>
  Object.fromEntries(shifts.flatMap((s) => s.seats.map((_, i) => [seatId(s.id, i), null]))) as Board;

const personById = (id: string) => people.find((p) => p.id === id)!;
const shiftById = (id: string) => shifts.find((s) => s.id === id)!;

function shiftsOf(board: Board, personId: string) {
  return shifts.filter((s) => s.seats.some((_, i) => board[seatId(s.id, i)] === personId));
}

const todayCount = (board: Board, personId: string) => Object.values(board).filter((v) => v === personId).length;
const load = (board: Board, p: Person) => p.week.reduce((a, b) => a + b, 0) + todayCount(board, p.id);
const nightsOf = (board: Board, p: Person) =>
  p.nights + shiftsOf(board, p.id).filter((s) => s.night).length;

interface Check {
  seat?: string;
  error?: string;
  warn?: string;
}

/** Whether a person can take a shift, and which seat; a seat index forces one. */
function check(board: Board, p: Person, s: Shift, seatIndex?: number): Check {
  if (p.tag === 'locked') return { error: `${p.name} is not on base yet, so the card is locked.` };
  if (p.from && s.start < p.from) return { error: `${p.name} reaches base at 14:00, too late for the ${s.time} ${s.name.toLowerCase()}.` };
  if (s.seats.some((_, i) => board[seatId(s.id, i)] === p.id)) return { error: `${p.name} is already on this shift.` };

  const open = s.seats.map((role, i) => ({ role, i })).filter(({ i }) => !board[seatId(s.id, i)]);
  if (!open.length) return { error: `${s.name} ${s.time} is already full.` };

  const candidates = seatIndex === undefined ? open : open.filter(({ i }) => i === seatIndex);
  const fits = (role: Role) => role === p.role || (role === 'Fighter' && p.role === 'Commander');
  const seat = candidates.find(({ role }) => role === p.role) ?? candidates.find(({ role }) => fits(role));
  if (!seat) {
    const needed = candidates[0]?.role ?? open[0].role;
    return { error: `That seat needs a ${needed}; ${p.name} is a ${p.role}.` };
  }

  let warn: string | undefined;
  const nextTo = shiftsOf(board, p.id).find((o) => o.end === s.start || s.end === o.start);
  if (nextTo) warn = `${p.name} goes straight between ${nextTo.name} and ${s.name}: sixteen hours in a row.`;
  else if (s.night && p.tag === 'night') warn = `${p.name} stood the night shift yesterday; this makes two nights running.`;
  else if (s.night && nightsOf(board, p) + 1 > 3)
    warn = `${p.name} reaches ${nightsOf(board, p) + 1} nights this week; more than three is flagged.`;

  return { seat: seatId(s.id, seat.i), warn };
}

/**
 * The suggestion for one seat: the least loaded over the week, one shift a
 * day before anyone gets a second, off duty yesterday first, no warnings.
 */
function ranked(board: Board, s: Shift, seatIndex: number) {
  return people
    .map((p) => ({ p, c: check(board, p, s, seatIndex) }))
    .filter(({ c }) => c.seat)
    .map(({ p, c }) => ({
      p,
      score:
        load(board, p) * 10 +
        todayCount(board, p.id) * 40 +
        (c.warn ? 100 : 0) +
        (p.tag === 'free' && !todayCount(board, p.id) ? -15 : 0) +
        (s.seats[seatIndex] === 'Fighter' && p.role === 'Commander' ? 25 : 0),
    }))
    .sort((a, b) => a.score - b.score)
    .map(({ p }) => p);
}

function nextAutoSeat(board: Board) {
  for (const [shiftId, i] of fillOrder) {
    if (board[seatId(shiftId, i)]) continue;
    const best = ranked(board, shiftById(shiftId), i)[0];
    if (best) return { seat: seatId(shiftId, i), person: best.id };
  }
  return null;
}

const filled = (board: Board) => Object.values(board).filter(Boolean).length;

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/* -------------------------------------------------------------------------- */
/*  The assistant: the real system asks a language model; this one reads      */
/*  the board.                                                                 */
/* -------------------------------------------------------------------------- */

const questions = ['Who is busiest?', 'What is still open?', 'Any recommendations?'] as const;
type Question = (typeof questions)[number];

function answer(board: Board, q: Question): string {
  const onBase = people.filter((p) => p.tag !== 'locked');
  if (q === 'Who is busiest?') {
    const sorted = [...onBase].sort((a, b) => load(board, b) - load(board, a));
    const [top, second] = sorted;
    return `${top.name}: ${load(board, top)} shifts in seven days, ${nightsOf(board, top)} of them nights. Then ${second.name} with ${load(board, second)}.`;
  }
  if (q === 'What is still open?') {
    const open = shifts.flatMap((s) =>
      s.seats.flatMap((role, i) => (board[seatId(s.id, i)] ? [] : [`${s.name} ${s.time}, ${role}`])),
    );
    if (!open.length) return 'Nothing. Every seat on the board is staffed.';
    return `${open.length} of ${TOTAL} seats: ${open.join('; ')}.`;
  }
  const tips: string[] = [];
  const idle = people.filter((p) => p.tag === 'free' && !todayCount(board, p.id));
  if (idle.length) tips.push(`${idle.map((p) => p.name).join(' and ')} had no duty yesterday; place them first.`);
  for (const s of shifts) {
    s.seats.forEach((_, i) => {
      const id = board[seatId(s.id, i)];
      const p = id ? personById(id) : null;
      if (p && s.night && p.tag === 'night') tips.push(`${p.name} is on a second night running; swap if anyone else fits.`);
    });
  }
  const gal = personById('gal');
  if (!todayCount(board, gal.id) && filled(board) < TOTAL) tips.push('Gal reaches base at 14:00: a fit for patrol or the night gate.');
  if (!tips.length) return 'The board looks balanced: no one is on two shifts back to back or a second night running.';
  return tips.slice(0, 2).join(' ');
}

/* -------------------------------------------------------------------------- */

export function Scheduler({ mode = 'full' }: { mode?: DemoMode }) {
  const preview = mode === 'preview';
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [selected, setSelected] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'warn' | 'stop' | 'info'; text: string } | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const [filling, setFilling] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [doneIn, setDoneIn] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [asked, setAsked] = useState<{ q: Question; a: string } | null>(null);
  const [typed, setTyped] = useState('');
  /* On a narrow screen the two panels under the board take turns. */
  const [lowerTab, setLowerTab] = useState<'fair' | 'ask'>('fair');
  const dragged = useRef<string | null>(null);

  const count = filled(board);

  const start = useCallback(() => {
    setStartedAt((t) => t ?? Date.now());
  }, []);

  const commit = useCallback(
    (next: Board, seat: string, personId: string, warn?: string) => {
      setBoard(next);
      setFresh(seat);
      const p = personById(personId);
      const s = shiftById(seat.split(':')[0]);
      setMsg(warn ? { tone: 'warn', text: warn } : { tone: 'ok', text: `${p.name} placed on ${s.name}, ${s.time}.` });
    },
    [],
  );

  const place = useCallback(
    (personId: string, shiftId: string, seatIndex?: number) => {
      const p = personById(personId);
      const result = check(board, p, shiftById(shiftId), seatIndex);
      if (!result.seat) {
        setMsg({ tone: 'stop', text: result.error! });
        if (!preview) trackDemo('scheduler: blocked by a check');
        return;
      }
      start();
      commit({ ...board, [result.seat]: personId }, result.seat, personId, result.warn);
      setSelected(null);
      if (!preview) trackDemo('scheduler: placed a person');
    },
    [board, commit, preview, start],
  );

  const remove = (seat: string) => {
    const id = board[seat];
    if (!id) return;
    setBoard({ ...board, [seat]: null });
    setMsg({ tone: 'info', text: `${personById(id).name} taken off the shift.` });
    setDoneIn(null);
  };

  const clear = useCallback(() => {
    setBoard(emptyBoard());
    setSelected(null);
    setFilling(false);
    setStartedAt(null);
    setDoneIn(null);
    setAsked(null);
    setMsg(null);
  }, []);

  /* Filling the board, one seat at a time so the choices can be watched. */
  useTicker(filling, preview ? 650 : 420, () => {
    const next = nextAutoSeat(board);
    if (!next) {
      setFilling(false);
      if (filled(board) < TOTAL) setMsg({ tone: 'warn', text: 'No one left who passes the checks for the open seats.' });
      return;
    }
    commit({ ...board, [next.seat]: next.person }, next.seat, next.person);
  });

  /* The clock, from the first change to a full board. */
  useEffect(() => {
    if (!startedAt || doneIn !== null) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [startedAt, doneIn]);

  useEffect(() => {
    if (count === TOTAL && startedAt && doneIn === null) {
      const took = Date.now() - startedAt;
      setDoneIn(took);
      setFilling(false);
      setMsg({ tone: 'ok', text: `Board staffed in ${clock(took)}. By hand, one cycle took about half a day.` });
      if (!preview) trackDemo('scheduler: board staffed');
    }
  }, [count, startedAt, doneIn, preview]);

  /* The assistant's answer types out. */
  useEffect(() => {
    if (!asked) return;
    setTyped('');
    let i = 0;
    const id = window.setInterval(() => {
      i += 3;
      setTyped(asked.a.slice(0, i));
      if (i >= asked.a.length) window.clearInterval(id);
    }, 18);
    return () => window.clearInterval(id);
  }, [asked]);

  /* The preview fills the board, holds it, clears it and starts again. */
  const { ref: stageRef, playing } = usePlaying<HTMLDivElement>(preview);
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    if (!preview || !playing) return;
    clear();
    const go = window.setTimeout(() => {
      setStartedAt(Date.now());
      setFilling(true);
    }, 900);
    const again = window.setTimeout(() => setCycle((c) => c + 1), 9000);
    return () => {
      window.clearTimeout(go);
      window.clearTimeout(again);
    };
  }, [preview, playing, cycle, clear]);

  const elapsed = doneIn ?? (startedAt ? Math.max(0, now - startedAt) : 0);

  const onDrop = (e: DragEvent, shiftId: string) => {
    e.preventDefault();
    const id = dragged.current ?? e.dataTransfer.getData('text/plain');
    dragged.current = null;
    if (id) place(id, shiftId);
  };

  const fairness = useMemo(() => {
    const onBase = people.filter((p) => p.tag !== 'locked');
    const max = Math.max(...onBase.map((p) => load(board, p)));
    return onBase.map((p) => ({
      p,
      days: [...p.week, todayCount(board, p.id)],
      nights: nightsOf(board, p),
      rest: Math.round(100 - (100 * load(board, p)) / max),
    }));
  }, [board]);

  /* People on the left; the shifts, then whatever goes under them, on the right. */
  const layout = (below: ReactNode) => (
    <div className="dm-sched" data-selecting={selected ? '' : undefined}>
      <div className="dm-sched__people">
        <p className="dm-label">People · one more on leave, not shown</p>
        <ul>
          {people.map((p) => {
            const n = todayCount(board, p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className="dm-person"
                  data-tag={p.tag}
                  data-on={n ? '' : undefined}
                  aria-pressed={selected === p.id}
                  draggable={p.tag !== 'locked' && !preview}
                  onDragStart={(e) => {
                    dragged.current = p.id;
                    e.dataTransfer.setData('text/plain', p.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onClick={() => {
                    if (p.tag === 'locked') {
                      setMsg({ tone: 'stop', text: `${p.name} is not on base yet, so the card is locked.` });
                      return;
                    }
                    setSelected(selected === p.id ? null : p.id);
                    setMsg({ tone: 'info', text: `${p.name} picked. Choose a shift, or drag the card onto one.` });
                  }}
                >
                  <span className="dm-person__name">
                    {p.name}
                    {n > 0 && <span className="dm-person__count tnum">{n === 1 ? 'On 1 shift' : `On ${n} shifts`}</span>}
                  </span>
                  <span className="dm-person__role">{p.role}</span>
                  {p.tag && <span className="dm-person__tag">{tagText[p.tag]}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="dm-sched__main">
        <div className="dm-sched__shifts">
          {shifts.map((s) => {
            const seats = s.seats.map((role, i) => ({ role, i, id: seatId(s.id, i), who: board[seatId(s.id, i)] }));
            const taken = seats.filter((x) => x.who).length;
            const full = taken === seats.length;
            const openSeat = seats.find((x) => !x.who);
            const ideas = !preview && taken > 0 && openSeat ? ranked(board, s, openSeat.i).slice(0, 2) : [];
            return (
              <div
                key={s.id}
                className="dm-shift"
                data-full={full ? '' : undefined}
                data-night={s.night ? '' : undefined}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, s.id)}
              >
                <div className="dm-shift__head">
                  <b>{s.name}</b>
                  <span className="tnum">{s.time}</span>
                  <span className="dm-shift__state">{full ? 'Staffed' : `${taken} of ${seats.length}`}</span>
                </div>
                <ul className="dm-seats">
                  {seats.map((x) => (
                    <li key={x.id}>
                      {x.who ? (
                        <button
                          type="button"
                          className="dm-seat"
                          data-filled=""
                          data-fresh={fresh === x.id ? '' : undefined}
                          onClick={() => remove(x.id)}
                          aria-label={`${personById(x.who).name}, ${x.role}. Take off this shift`}
                        >
                          <span className="dm-seat__role">{x.role}</span>
                          <span className="dm-seat__who">{personById(x.who).name}</span>
                          <span className="dm-seat__x" aria-hidden="true">
                            ×
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="dm-seat"
                          onClick={() =>
                            selected
                              ? place(selected, s.id, x.i)
                              : setMsg({ tone: 'info', text: 'Pick a person first, or drag a card onto the shift.' })
                          }
                          aria-label={`Open ${x.role} seat on ${s.name} ${s.time}`}
                        >
                          <span className="dm-seat__role">{x.role}</span>
                          <span className="dm-seat__who">{selected ? `Place ${personById(selected).name}` : 'Open'}</span>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {ideas.length > 0 && (
                  <div className="dm-ideas">
                    <span>Suggested</span>
                    {ideas.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          place(p.id, s.id, openSeat!.i);
                          trackDemo('scheduler: took a suggestion');
                        }}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {below}
      </div>
    </div>
  );

  const actions = (
    <span className="dm-bar__actions">
      <span className="dm-meter tnum" aria-label={`${count} of ${TOTAL} seats staffed`}>
        <i style={{ width: `${(count / TOTAL) * 56}px` }} />
        {count} of {TOTAL}
      </span>
      <span className="dm-clock tnum" aria-label="Time spent">
        {clock(elapsed)}
      </span>
      {!preview && (
        <>
          <button
            type="button"
            className="dm-btn"
            data-primary=""
            disabled={filling || count === TOTAL}
            onClick={() => {
              start();
              setFilling(true);
              trackDemo('scheduler: fill the board');
            }}
          >
            Fill the board
          </button>
          <button type="button" className="dm-btn" onClick={clear} disabled={!count && !startedAt}>
            Clear
          </button>
        </>
      )}
    </span>
  );

  if (preview) {
    return (
      <div ref={stageRef} inert>
        <ScaledStage width={800} height={600}>
          <DemoWindow app="Company scheduler" context="Thursday" actions={actions} className="dm--preview">
            {layout(<DemoMessage tone={msg?.tone ?? 'info'}>{msg?.text ?? 'Filling the board by the rules.'}</DemoMessage>)}
          </DemoWindow>
        </ScaledStage>
      </div>
    );
  }

  const panels = (
    <>
      {msg ? (
        <DemoMessage tone={msg.tone}>{msg.text}</DemoMessage>
      ) : (
        <DemoMessage tone="info">Drag a person onto a shift, or pick one and then a seat. Click a name on a shift to take it off.</DemoMessage>
      )}

      <span className="dm-seg dm-sched__tabs" role="group" aria-label="Panel">
        <button type="button" aria-pressed={lowerTab === 'fair'} onClick={() => setLowerTab('fair')}>
          Fairness table
        </button>
        <button type="button" aria-pressed={lowerTab === 'ask'} onClick={() => setLowerTab('ask')}>
          Assistant
        </button>
      </span>
      <div className="dm-sched__lower" data-tab={lowerTab}>
        <section className="dm-panel" data-panel="fair" aria-label="Fairness table">
          <div className="dm-panel__head">
            <b>Fairness table</b>
            <span>Last seven days, today included</span>
          </div>
          <table className="dm-fair">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Shifts by day</th>
                <th scope="col" className="dm-num">
                  Nights
                </th>
                <th scope="col" className="dm-num">
                  Rest
                </th>
              </tr>
            </thead>
            <tbody>
              {fairness.map(({ p, days, nights, rest }) => (
                <tr key={p.id}>
                  <th scope="row">{p.name}</th>
                  <td>
                    <span className="dm-days" aria-label={`Shifts by day: ${days.join(', ')}`}>
                      {days.map((d, i) => (
                        <i key={i} data-today={i === 6 ? '' : undefined} style={{ height: `${Math.max(8, d * 50)}%` }} data-zero={d === 0 ? '' : undefined} />
                      ))}
                    </span>
                  </td>
                  <td className="dm-num tnum" data-flag={nights > 3 ? '' : undefined}>
                    {nights}
                    {nights > 3 && <span className="dm-flag">over 3</span>}
                  </td>
                  <td className="dm-num tnum">{rest}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="dm-note">Rest is out of 100 against the busiest person: 100 is fully rested.</p>
        </section>

        <section className="dm-panel" data-panel="ask" aria-label="Assistant">
          <div className="dm-panel__head">
            <b>Assistant</b>
            <span>Questions about this board</span>
          </div>
          <div className="dm-asks">
            {questions.map((q) => (
              <button
                key={q}
                type="button"
                aria-pressed={asked?.q === q}
                onClick={() => {
                  setAsked({ q, a: answer(board, q) });
                  trackDemo(`scheduler: asked "${q}"`);
                }}
              >
                {q}
              </button>
            ))}
          </div>
          <p className="dm-answer" aria-live="polite">
            {asked ? typed : 'Ask one of the questions above.'}
          </p>
          <p className="dm-note">
            In the real system a Gemini model answers these. Here the answers are worked out from the board you see.
          </p>
        </section>
      </div>
    </>
  );

  return (
    <DemoWindow app="Company scheduler" context="Thursday" actions={actions}>
      {layout(panels)}
    </DemoWindow>
  );
}

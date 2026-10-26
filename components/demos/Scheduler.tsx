'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { trackDemo } from '@/lib/analytics/client';
import { useLocale } from '@/components/LocaleProvider';
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
  role: Role;
  /** Hebrew declines verbs and roles by gender. */
  female?: true;
  tag?: Tag;
  /** Hour the person reaches base, when it is later than the first shift. */
  from?: number;
  /** Shifts on each of the last six days, oldest first. */
  week: number[];
  /** Night shifts in those six days. */
  nights: number;
}

interface Shift {
  id: 'gate-am' | 'patrol' | 'gate-night';
  time: string;
  start: number;
  end: number;
  night?: boolean;
  seats: Role[];
}

const people: Person[] = [
  { id: 'noa', role: 'Commander', female: true, tag: 'free', week: [1, 1, 0, 1, 1, 0], nights: 1 },
  { id: 'amit', role: 'Commander', tag: 'night', week: [1, 2, 1, 1, 1, 1], nights: 3 },
  { id: 'itay', role: 'Fighter', week: [1, 1, 1, 1, 1, 1], nights: 2 },
  { id: 'lior', role: 'Fighter', tag: 'free', week: [0, 1, 0, 1, 1, 0], nights: 0 },
  { id: 'dana', role: 'Fighter', female: true, tag: 'night', week: [1, 1, 2, 1, 1, 1], nights: 3 },
  { id: 'gal', role: 'Fighter', tag: 'arriving', from: 14, week: [0, 0, 1, 1, 0, 0], nights: 1 },
  { id: 'omer', role: 'Fighter', tag: 'locked', week: [0, 0, 0, 0, 0, 0], nights: 0 },
];

const shifts: Shift[] = [
  { id: 'gate-am', time: '06:00–14:00', start: 6, end: 14, seats: ['Commander', 'Fighter'] },
  { id: 'patrol', time: '14:00–22:00', start: 14, end: 22, seats: ['Commander', 'Fighter'] },
  { id: 'gate-night', time: '22:00–06:00', start: 22, end: 30, night: true, seats: ['Fighter', 'Fighter'] },
];

const questions = ['busiest', 'open', 'tips'] as const;
type Question = (typeof questions)[number];

/** Keeps a time range reading left to right inside a Hebrew sentence. */
const ltr = (s: string) => `⁦${s}⁩`;

const en = {
  app: 'Company scheduler',
  day: 'Thursday',
  name: { noa: 'Noa', amit: 'Amit', itay: 'Itay', lior: 'Lior', dana: 'Dana', gal: 'Gal', omer: 'Omer' } as Record<string, string>,
  role: (r: Role, _female?: boolean) => r as string,
  shift: { 'gate-am': 'Gate', patrol: 'Patrol', 'gate-night': 'Night gate' } as Record<Shift['id'], string>,
  time: (s: string) => s,
  tag: {
    free: 'Off duty yesterday',
    night: 'Night shift yesterday',
    arriving: 'On base from 14:00',
    locked: 'Not on base yet',
  } as Record<Tag, string>,
  locked: (n: string, _f?: boolean) => `${n} is not on base yet, so the card is locked.`,
  late: (n: string, shift: string, time: string, _f?: boolean) => `${n} reaches base at 14:00, too late for the ${time} ${shift.toLowerCase()}.`,
  already: (n: string) => `${n} is already on this shift.`,
  full: (shift: string, time: string) => `${shift} ${time} is already full.`,
  needs: (seat: string, n: string, role: string, _f?: boolean) => `That seat needs a ${seat}; ${n} is a ${role}.`,
  straight: (n: string, a: string, b: string, _f?: boolean) => `${n} goes straight between ${a} and ${b}: sixteen hours in a row.`,
  twoNights: (n: string, _f?: boolean) => `${n} stood the night shift yesterday; this makes two nights running.`,
  manyNights: (n: string, k: number, _f?: boolean) => `${n} reaches ${k} nights this week; more than three is flagged.`,
  placed: (n: string, shift: string, time: string, _f?: boolean) => `${n} placed on ${shift}, ${time}.`,
  removed: (n: string, _f?: boolean) => `${n} taken off the shift.`,
  noneLeft: 'No one left who passes the checks for the open seats.',
  staffed: (t: string) => `Board staffed in ${t}. By hand, one cycle took about half a day.`,
  picked: (n: string, _f?: boolean) => `${n} picked. Choose a shift, or drag the card onto one.`,
  pickFirst: 'Pick a person first, or drag a card onto the shift.',
  intro: 'Drag a person onto a shift, or pick one and then a seat. Click a name on a shift to take it off.',
  filling: 'Filling the board by the rules.',
  peopleLabel: 'People · one more on leave, not shown',
  onShifts: (k: number) => (k === 1 ? 'On 1 shift' : `On ${k} shifts`),
  staffedState: 'Staffed',
  of: (a: number, b: number) => `${a} of ${b}`,
  takeOff: (n: string, role: string) => `${n}, ${role}. Take off this shift`,
  openSeat: (role: string, shift: string, time: string) => `Open ${role} seat on ${shift} ${time}`,
  place: (n: string) => `Place ${n}`,
  open: 'Open',
  suggested: 'Suggested',
  seatsStaffed: (a: number, b: number) => `${a} of ${b} seats staffed`,
  timeSpent: 'Time spent',
  fill: 'Fill the board',
  clear: 'Clear',
  panel: 'Panel',
  fair: 'Fairness table',
  fairNote: 'Last seven days, today included',
  cols: ['Name', 'Shifts by day', 'Nights', 'Rest'],
  byDay: (d: string) => `Shifts by day: ${d}`,
  over3: 'over 3',
  restNote: 'Rest is out of 100 against the busiest person: 100 is fully rested.',
  assistant: 'Assistant',
  assistantNote: 'Questions about this board',
  question: { busiest: 'Who is busiest?', open: 'What is still open?', tips: 'Any recommendations?' } as Record<Question, string>,
  askPrompt: 'Ask one of the questions above.',
  modelNote: 'In the real system a Gemini model answers these. Here the answers are worked out from the board you see.',
  busiest: (top: string, n: number, k: number, second: string, m: number) =>
    `${top}: ${n} shifts in seven days, ${k} of them nights. Then ${second} with ${m}.`,
  nothingOpen: 'Nothing. Every seat on the board is staffed.',
  openList: (n: number, total: number, list: string[]) => `${n} of ${total} seats: ${list.join('; ')}.`,
  idle: (names: string[], _f?: boolean) => `${names.join(' and ')} had no duty yesterday; place them first.`,
  secondNight: (n: string, _f?: boolean) => `${n} is on a second night running; swap if anyone else fits.`,
  galFits: 'Gal reaches base at 14:00: a fit for patrol or the night gate.',
  balanced: 'The board looks balanced: no one is on two shifts back to back or a second night running.',
};

const g = (f: boolean | undefined, m: string, w: string) => (f ? w : m);

const he: typeof en = {
  app: 'שיבוץ פלוגתי',
  day: 'יום חמישי',
  name: { noa: 'נועה', amit: 'עמית', itay: 'איתי', lior: 'ליאור', dana: 'דנה', gal: 'גל', omer: 'עומר' },
  role: (r, f) => (r === 'Commander' ? g(f, 'מפקד', 'מפקדת') : g(f, 'לוחם', 'לוחמת')),
  shift: { 'gate-am': 'שער', patrol: 'סיור', 'gate-night': 'שער לילה' },
  time: ltr,
  tag: {
    free: 'בלי תורנות אתמול',
    night: 'משמרת לילה אתמול',
    arriving: 'בבסיס מ-14:00',
    locked: 'עדיין לא בבסיס',
  },
  locked: (n, f) => `${n} עדיין לא ${g(f, 'הגיע', 'הגיעה')} לבסיס, ולכן הכרטיס נעול.`,
  late: (n, shift, time, f) => `${n} ${g(f, 'מגיע', 'מגיעה')} לבסיס ב-14:00, מאוחר מדי ל${shift} של ${time}.`,
  already: (n) => `${n} כבר במשמרת הזו.`,
  full: (shift, time) => `${shift} ${time} כבר מלאה.`,
  needs: (seat, n, role, f) => `המקום הזה דורש ${seat}, ו${n} ${g(f, 'הוא', 'היא')} ${role}.`,
  straight: (n, a, b, f) => `${n} ${g(f, 'עובר', 'עוברת')} ישר מ${a} ל${b}: שש עשרה שעות ברצף.`,
  twoNights: (n, f) => `${n} ${g(f, 'עמד', 'עמדה')} במשמרת לילה אתמול; זה יהיה לילה שני ברציפות.`,
  manyNights: (n, k, f) => `${n} ${g(f, 'מגיע', 'מגיעה')} ל-${k} לילות השבוע; יותר משלושה מסומן.`,
  placed: (n, shift, time, f) => `${n} ${g(f, 'שובץ', 'שובצה')} ל${shift}, ${time}.`,
  removed: (n, f) => `${n} ${g(f, 'הורד', 'הורדה')} מהמשמרת.`,
  noneLeft: 'לא נשאר אף אחד שעובר את הבדיקות למקומות הפתוחים.',
  staffed: (t) => `הלוח אויש תוך ${t}. ביד, סבב אחד לקח בערך חצי יום.`,
  picked: (n, f) => `${n} ${g(f, 'נבחר', 'נבחרה')}. בחרו משמרת, או גררו את הכרטיס אליה.`,
  pickFirst: 'קודם בוחרים אדם, או גוררים כרטיס אל המשמרת.',
  intro: 'גררו אדם אל משמרת, או בחרו אדם ואז מקום. לחיצה על שם במשמרת מורידה אותו ממנה.',
  filling: 'ממלא את הלוח לפי הכללים.',
  peopleLabel: 'אנשים · עוד אחד בחופשה, לא מוצג',
  onShifts: (k) => (k === 1 ? 'במשמרת אחת' : `ב-${k} משמרות`),
  staffedState: 'מאויש',
  of: (a, b) => `${a} מתוך ${b}`,
  takeOff: (n, role) => `${n}, ${role}. הורדה מהמשמרת`,
  openSeat: (role, shift, time) => `מקום פנוי ל${role} ב${shift} ${time}`,
  place: (n) => `לשבץ את ${n}`,
  open: 'פנוי',
  suggested: 'הצעות',
  seatsStaffed: (a, b) => `${a} מתוך ${b} מקומות מאוישים`,
  timeSpent: 'זמן שעבר',
  fill: 'מילוי הלוח',
  clear: 'ניקוי',
  panel: 'חלונית',
  fair: 'טבלת הוגנות',
  fairNote: 'שבעת הימים האחרונים, כולל היום',
  cols: ['שם', 'משמרות לפי יום', 'לילות', 'מנוחה'],
  byDay: (d) => `משמרות לפי יום: ${d}`,
  over3: 'מעל 3',
  restNote: 'המנוחה היא מתוך 100, ביחס לעמוס ביותר: 100 זו מנוחה מלאה.',
  assistant: 'עוזר',
  assistantNote: 'שאלות על הלוח הזה',
  question: { busiest: 'מי הכי עמוס?', open: 'מה עדיין פתוח?', tips: 'יש המלצות?' },
  askPrompt: 'שאלו את אחת השאלות למעלה.',
  modelNote: 'במערכת האמיתית מודל Gemini עונה על השאלות. כאן התשובות מחושבות מהלוח שמולכם.',
  busiest: (top, n, k, second, m) => `${top}: ${n} משמרות בשבעה ימים, ${k} מהן לילות. במקום השני ${second}, עם ${m}.`,
  nothingOpen: 'שום דבר. כל המקומות בלוח מאוישים.',
  openList: (n, total, list) => `${n} מתוך ${total} מקומות: ${list.join('; ')}.`,
  idle: (names, f) =>
    `כדאי לשבץ קודם את ${names.join(' ואת ')}: אתמול לא הייתה ${names.length > 1 ? 'להם' : g(f, 'לו', 'לה')} תורנות.`,
  secondNight: (n, f) => `${n} ${g(f, 'נמצא', 'נמצאת')} בלילה שני ברציפות; כדאי להחליף אם מישהו אחר מתאים.`,
  galFits: 'גל מגיע לבסיס ב-14:00 ומתאים לסיור או לשער הלילה.',
  balanced: 'הלוח מאוזן: אף אחד לא בשתי משמרות רצופות או בלילה שני ברציפות.',
};

type Text = typeof en;

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
function check(T: Text, board: Board, p: Person, s: Shift, seatIndex?: number): Check {
  const name = T.name[p.id];
  const f = p.female;
  if (p.tag === 'locked') return { error: T.locked(name, f) };
  if (p.from && s.start < p.from) return { error: T.late(name, T.shift[s.id], T.time(s.time), f) };
  if (s.seats.some((_, i) => board[seatId(s.id, i)] === p.id)) return { error: T.already(name) };

  const open = s.seats.map((role, i) => ({ role, i })).filter(({ i }) => !board[seatId(s.id, i)]);
  if (!open.length) return { error: T.full(T.shift[s.id], T.time(s.time)) };

  const candidates = seatIndex === undefined ? open : open.filter(({ i }) => i === seatIndex);
  const fits = (role: Role) => role === p.role || (role === 'Fighter' && p.role === 'Commander');
  const seat = candidates.find(({ role }) => role === p.role) ?? candidates.find(({ role }) => fits(role));
  if (!seat) {
    const needed = candidates[0]?.role ?? open[0].role;
    return { error: T.needs(T.role(needed), name, T.role(p.role, f), f) };
  }

  let warn: string | undefined;
  const nextTo = shiftsOf(board, p.id).find((o) => o.end === s.start || s.end === o.start);
  if (nextTo) warn = T.straight(name, T.shift[nextTo.id], T.shift[s.id], f);
  else if (s.night && p.tag === 'night') warn = T.twoNights(name, f);
  else if (s.night && nightsOf(board, p) + 1 > 3) warn = T.manyNights(name, nightsOf(board, p) + 1, f);

  return { seat: seatId(s.id, seat.i), warn };
}

/**
 * The suggestion for one seat: the least loaded over the week, one shift a
 * day before anyone gets a second, off duty yesterday first, no warnings.
 */
function ranked(board: Board, s: Shift, seatIndex: number) {
  return people
    .map((p) => ({ p, c: check(en, board, p, s, seatIndex) }))
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

function answer(T: Text, board: Board, q: Question): string {
  const onBase = people.filter((p) => p.tag !== 'locked');
  if (q === 'busiest') {
    const sorted = [...onBase].sort((a, b) => load(board, b) - load(board, a));
    const [top, second] = sorted;
    return T.busiest(T.name[top.id], load(board, top), nightsOf(board, top), T.name[second.id], load(board, second));
  }
  if (q === 'open') {
    const open = shifts.flatMap((s) =>
      s.seats.flatMap((role, i) => (board[seatId(s.id, i)] ? [] : [`${T.shift[s.id]} ${T.time(s.time)}, ${T.role(role)}`])),
    );
    if (!open.length) return T.nothingOpen;
    return T.openList(open.length, TOTAL, open);
  }
  const tips: string[] = [];
  const idle = people.filter((p) => p.tag === 'free' && !todayCount(board, p.id));
  if (idle.length) tips.push(T.idle(idle.map((p) => T.name[p.id]), idle[0].female));
  for (const s of shifts) {
    s.seats.forEach((_, i) => {
      const id = board[seatId(s.id, i)];
      const p = id ? personById(id) : null;
      if (p && s.night && p.tag === 'night') tips.push(T.secondNight(T.name[p.id], p.female));
    });
  }
  const gal = personById('gal');
  if (!todayCount(board, gal.id) && filled(board) < TOTAL) tips.push(T.galFits);
  if (!tips.length) return T.balanced;
  return tips.slice(0, 2).join(' ');
}

/* -------------------------------------------------------------------------- */

export function Scheduler({ mode = 'full' }: { mode?: DemoMode }) {
  const preview = mode === 'preview';
  const T = useLocale() === 'he' ? he : en;
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
  const nameOf = (id: string) => T.name[id];

  const start = useCallback(() => {
    setStartedAt((t) => t ?? Date.now());
  }, []);

  const commit = useCallback(
    (next: Board, seat: string, personId: string, warn?: string) => {
      setBoard(next);
      setFresh(seat);
      const p = personById(personId);
      const s = shiftById(seat.split(':')[0]);
      setMsg(warn ? { tone: 'warn', text: warn } : { tone: 'ok', text: T.placed(T.name[p.id], T.shift[s.id], T.time(s.time), p.female) });
    },
    [T],
  );

  const place = useCallback(
    (personId: string, shiftId: string, seatIndex?: number) => {
      const p = personById(personId);
      const result = check(T, board, p, shiftById(shiftId), seatIndex);
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
    [T, board, commit, preview, start],
  );

  const remove = (seat: string) => {
    const id = board[seat];
    if (!id) return;
    setBoard({ ...board, [seat]: null });
    setMsg({ tone: 'info', text: T.removed(nameOf(id), personById(id).female) });
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
      if (filled(board) < TOTAL) setMsg({ tone: 'warn', text: T.noneLeft });
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
      setMsg({ tone: 'ok', text: T.staffed(clock(took)) });
      if (!preview) trackDemo('scheduler: board staffed');
    }
  }, [T, count, startedAt, doneIn, preview]);

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
        <p className="dm-label">{T.peopleLabel}</p>
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
                      setMsg({ tone: 'stop', text: T.locked(nameOf(p.id), p.female) });
                      return;
                    }
                    setSelected(selected === p.id ? null : p.id);
                    setMsg({ tone: 'info', text: T.picked(nameOf(p.id), p.female) });
                  }}
                >
                  <span className="dm-person__name">
                    {nameOf(p.id)}
                    {n > 0 && <span className="dm-person__count tnum">{T.onShifts(n)}</span>}
                  </span>
                  <span className="dm-person__role">{T.role(p.role, p.female)}</span>
                  {p.tag && <span className="dm-person__tag">{T.tag[p.tag]}</span>}
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
            const shiftName = T.shift[s.id];
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
                  <b>{shiftName}</b>
                  <span className="tnum" dir="ltr">
                    {s.time}
                  </span>
                  <span className="dm-shift__state">{full ? T.staffedState : T.of(taken, seats.length)}</span>
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
                          aria-label={T.takeOff(nameOf(x.who), T.role(x.role))}
                        >
                          <span className="dm-seat__role">{T.role(x.role)}</span>
                          <span className="dm-seat__who">{nameOf(x.who)}</span>
                          <span className="dm-seat__x" aria-hidden="true">
                            ×
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="dm-seat"
                          onClick={() => (selected ? place(selected, s.id, x.i) : setMsg({ tone: 'info', text: T.pickFirst }))}
                          aria-label={T.openSeat(T.role(x.role), shiftName, T.time(s.time))}
                        >
                          <span className="dm-seat__role">{T.role(x.role)}</span>
                          <span className="dm-seat__who">{selected ? T.place(nameOf(selected)) : T.open}</span>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {ideas.length > 0 && (
                  <div className="dm-ideas">
                    <span>{T.suggested}</span>
                    {ideas.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          place(p.id, s.id, openSeat!.i);
                          trackDemo('scheduler: took a suggestion');
                        }}
                      >
                        {nameOf(p.id)}
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
      <span className="dm-meter tnum" aria-label={T.seatsStaffed(count, TOTAL)}>
        <i style={{ width: `${(count / TOTAL) * 56}px` }} />
        {T.of(count, TOTAL)}
      </span>
      <span className="dm-clock tnum" aria-label={T.timeSpent}>
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
            {T.fill}
          </button>
          <button type="button" className="dm-btn" onClick={clear} disabled={!count && !startedAt}>
            {T.clear}
          </button>
        </>
      )}
    </span>
  );

  if (preview) {
    return (
      <div ref={stageRef} inert>
        <ScaledStage width={800} height={600}>
          <DemoWindow app={T.app} context={T.day} actions={actions} className="dm--preview">
            {layout(<DemoMessage tone={msg?.tone ?? 'info'}>{msg?.text ?? T.filling}</DemoMessage>)}
          </DemoWindow>
        </ScaledStage>
      </div>
    );
  }

  const panels = (
    <>
      {msg ? <DemoMessage tone={msg.tone}>{msg.text}</DemoMessage> : <DemoMessage tone="info">{T.intro}</DemoMessage>}

      <span className="dm-seg dm-sched__tabs" role="group" aria-label={T.panel}>
        <button type="button" aria-pressed={lowerTab === 'fair'} onClick={() => setLowerTab('fair')}>
          {T.fair}
        </button>
        <button type="button" aria-pressed={lowerTab === 'ask'} onClick={() => setLowerTab('ask')}>
          {T.assistant}
        </button>
      </span>
      <div className="dm-sched__lower" data-tab={lowerTab}>
        <section className="dm-panel" data-panel="fair" aria-label={T.fair}>
          <div className="dm-panel__head">
            <b>{T.fair}</b>
            <span>{T.fairNote}</span>
          </div>
          <table className="dm-fair">
            <thead>
              <tr>
                <th scope="col">{T.cols[0]}</th>
                <th scope="col">{T.cols[1]}</th>
                <th scope="col" className="dm-num">
                  {T.cols[2]}
                </th>
                <th scope="col" className="dm-num">
                  {T.cols[3]}
                </th>
              </tr>
            </thead>
            <tbody>
              {fairness.map(({ p, days, nights, rest }) => (
                <tr key={p.id}>
                  <th scope="row">{nameOf(p.id)}</th>
                  <td>
                    <span className="dm-days" aria-label={T.byDay(days.join(', '))}>
                      {days.map((d, i) => (
                        <i key={i} data-today={i === 6 ? '' : undefined} style={{ height: `${Math.max(8, d * 50)}%` }} data-zero={d === 0 ? '' : undefined} />
                      ))}
                    </span>
                  </td>
                  <td className="dm-num tnum" data-flag={nights > 3 ? '' : undefined}>
                    {nights}
                    {nights > 3 && <span className="dm-flag">{T.over3}</span>}
                  </td>
                  <td className="dm-num tnum">{rest}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="dm-note">{T.restNote}</p>
        </section>

        <section className="dm-panel" data-panel="ask" aria-label={T.assistant}>
          <div className="dm-panel__head">
            <b>{T.assistant}</b>
            <span>{T.assistantNote}</span>
          </div>
          <div className="dm-asks">
            {questions.map((q) => (
              <button
                key={q}
                type="button"
                aria-pressed={asked?.q === q}
                onClick={() => {
                  setAsked({ q, a: answer(T, board, q) });
                  trackDemo(`scheduler: asked "${en.question[q]}"`);
                }}
              >
                {T.question[q]}
              </button>
            ))}
          </div>
          <p className="dm-answer" aria-live="polite">
            {asked ? typed : T.askPrompt}
          </p>
          <p className="dm-note">{T.modelNote}</p>
        </section>
      </div>
    </>
  );

  return (
    <DemoWindow app={T.app} context={T.day} actions={actions}>
      {layout(panels)}
    </DemoWindow>
  );
}

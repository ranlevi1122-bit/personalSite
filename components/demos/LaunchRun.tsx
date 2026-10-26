'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { trackDemo } from '@/lib/analytics/client';
import { useLocale } from '@/components/LocaleProvider';
import { DemoMessage, DemoWindow, ScaledStage, usePlaying, useTicker, type DemoMode } from './shared';

/**
 * One launch, run by hand: eight agents take a single product photo to a
 * checked landing page, the validator sends three claims back for rewriting,
 * and five people sign off. Every output shown is the system's reference
 * launch: in Hebrew as the system wrote it, in English translated from it.
 * Nothing is generated here.
 */

type Result = 'pass' | 'warn';

const TEXT = {
  en: {
    app: 'Launch Engine',
    context: 'One product, from photo to launch',
    pill: 'Reference launch',
    run: 'Run the 8 agents',
    again: 'Run again',
    input: 'Input',
    inputNote: 'One product photo. No data typed in.',
    photoAlt: 'The product photo: a basin tap with a bamboo-look arched spout',
    agents: [
      ['Product intelligence', 'Reads the photo and separates fact from guesswork'],
      ['Brand guardian', 'Checks the fit with the brand book'],
      ['Audience and positioning', 'Finds the readers and the design worlds'],
      ['Creative strategy', 'Turns the position into a concept'],
      ['Content', 'Writes the page and every other text'],
      ['Landing page builder', 'Orders the sections and the visuals'],
      ['Technical validator', 'Checks every claim against a source'],
      ['Launch QA', 'Seven quality checks before people see it'],
    ],
    state: { waiting: 'Waiting', working: 'Working…', flagged: '3 claims without a source', revising: 'Rewriting', done: 'Done' },
    emptyLead: 'Eight agents, in order, each with one job.',
    emptyNote: 'Each reads only what it needs and writes to a fixed schema. Nothing they cannot source is stated as a fact.',
    out: {
      summary:
        'A basin mixer with a bamboo-look arched spout rising from a low, brushed warm-bronze base, with a side lever. A sculptural object, not a quiet tap.',
      counts: [
        ['Verified', 'The run started from a photo only'],
        ['From the photo', 'Worded as appearance, not fact'],
        ['Missing', 'Left blank, never filled in'],
      ],
      found: ['Found online, pending approval:', 'Gessi Jacqueline 77201, finish 726 warm bronze.'],
      fit: ['Fit with the brand:', 'strong'],
      tone: ['Tone:', 'quiet, confident and precise. Luxury in the details, not in superlatives.'],
      avoid: ['Avoid until the product team approves:', '“real bamboo”, “natural material”, “handmade”, “water-saving”.'],
      proposition: '“The one detail that gives a bathroom its identity.”',
      readersLabel: 'Three readers',
      readers: ['Private clients building or renovating', 'Architects and interior designers', 'Developers and projects'],
      worldsLabel: 'Four design worlds',
      worlds: ['Refined classic · main bathroom', 'Warm modern · guest WC', 'Natural · wood and stone', 'Bold and artistic · boutique suite'],
      conceptLabel: 'Concept',
      concept: 'The Telling Detail',
      headlineLabel: 'Headline',
      headline: 'One detail. And the whole space tells a story.',
      bigIdea: 'In a luxury bathroom everything is already refined; what people remember is the one detail that says who lives there.',
      kit: [
        'A landing page in 11 sections',
        'A description for each of the three readers',
        'A sales kit and notes for architects',
        'Three posts: Instagram, Reels and LinkedIn',
        'Search texts: title, description and topics',
      ],
      orderLabel: 'Section order, chosen for this product',
      order: ['Product', 'Styles', 'Insight', 'Story', 'Why', 'Value', 'Standard', 'Architects', 'Messages', 'Design', 'Specs'],
      accent: 'Accent colour #9A7B4F, taken from the bronze · 10 assets in the kit',
      flaggedLead: 'Three claims have no source. They go back to the content and page agents.',
      fixedLead: 'Revision round done: no claim is left without a source.',
      claims: [
        ['Every tap is handmade and one of a kind.', 'A bamboo-look arch over a brushed warm-bronze base.', 'A collection claim stated as a fact about this item.'],
        ['Made in Italy by Gessi’s craftsmen.', 'From Gessi’s Haute Culture collection.', 'No source for the country of manufacture.'],
        [
          'It stays beautiful and durable for years, even with daily water.',
          'An object that feels more like a collector’s piece than plumbing.',
          'A durability claim with no data, on an unverified material.',
        ],
      ],
      claimSummary: '23 claims checked: 0 without a source, 16 pending approval, 7 inferred from the photo.',
      qa: [
        ['Brand', 'pass'],
        ['Product', 'pass'],
        ['Audience', 'pass'],
        ['Positioning', 'pass'],
        ['Technical integrity', 'warn'],
        ['Consistency', 'pass'],
        ['Scalability', 'warn'],
      ] as [string, Result][],
      result: { pass: 'Pass', warn: 'Warn' },
      verdict: 'Verdict: ready for the teams. The two warnings travel with the launch to sign-off.',
    },
    signOff: 'Sign-off',
    teams: (n: number) => `${n} of 4 teams`,
    approvedForLaunch: 'Approved for launch',
    roles: ['Product', 'Marketing', 'Creative', 'Commerce'],
    final: 'Final approval',
    launched: 'Launched',
    openWarnings: 'Two QA warnings are still open.',
    approveAnyway: 'Approve anyway',
    back: 'Back',
    live: 'The page goes live',
    landingAlt: 'The landing page this launch produced',
    msg: {
      launched: 'Approved for launch. The two QA warnings are logged with the approval, and the page joins the content library.',
      asking: 'Launch QA left two warnings: technical integrity and scalability. People decide; the override is logged.',
      teamsDone: 'All four teams have signed off. The final approval launches the product.',
      reviewed: 'The agents are done. Each team approves its own part; click to sign off.',
      revising: 'Revision round: the content and page agents rewrite the three flagged claims.',
      running: (n: number) => `Agent ${n} of 8 at work.`,
      idle: 'One photo, no data typed in. Run the agents and open any of them to see what it produced.',
    },
  },
  he: {
    app: 'Launch Engine',
    context: 'מוצר אחד, מתמונה להשקה',
    pill: 'השקת הדוגמה',
    run: 'הרצת 8 הסוכנים',
    again: 'הרצה מחדש',
    input: 'קלט',
    inputNote: 'תמונת מוצר אחת. בלי נתונים שהוקלדו.',
    photoAlt: 'תמונת המוצר: ברז כיור עם פיה מקושתת במראה במבוק',
    agents: [
      ['ניתוח מוצר', 'קורא את התמונה ומפריד בין עובדה לניחוש'],
      ['שומר המותג', 'בודק את ההתאמה לספר המותג'],
      ['סגנונות, חללים ומיצוב', 'מוצא את הקוראים ואת עולמות העיצוב'],
      ['אסטרטגיה קריאייטיבית', 'הופך את המיצוב לקונספט'],
      ['יצירת תוכן', 'כותב את הדף ואת כל שאר הטקסטים'],
      ['דף נחיתה וחומרי השקה', 'מסדר את המקטעים ואת הוויזואליה'],
      ['בקרה טכנית', 'בודק כל טענה מול מקור'],
      ['בקרת איכות לפני השקה', 'שבע בדיקות איכות לפני שאנשים רואים'],
    ],
    state: { waiting: 'ממתין', working: 'עובד…', flagged: '3 טענות בלי מקור', revising: 'משכתב', done: 'הושלם' },
    emptyLead: 'שמונה סוכנים, לפי הסדר, ולכל אחד תפקיד אחד.',
    emptyNote: 'כל אחד קורא רק את מה שהוא צריך וכותב למבנה קבוע. מה שאין לו מקור לא נכתב כעובדה.',
    out: {
      summary:
        'ברז פרח לכיור עם פיה מקושתת במרקם דמוי במבוק. הפיה עולה מבסיס מלבני נמוך, מוברש בגוון ברונזה חמה, ולצידה ידית גלילית. זה אובייקט עיצובי בולט ולא ברז ״שקט״.',
      counts: [
        ['מאומת', 'הריצה התחילה מתמונה בלבד'],
        ['הסקה מהתמונה', 'מנוסח כמראה, לא כעובדה'],
        ['חסר', 'נשאר ריק, לא מומצא'],
      ],
      found: ['נמצא ברשת, ממתין לאישור:', 'Gessi Jacqueline 77201, גימור 726 ברונזה חמה.'],
      fit: ['ההתאמה למותג:', 'חזקה'],
      tone: ['טון:', 'שקט, בטוח ומדויק. היוקרה נמצאת בפרטים ולא בסופרלטיבים.'],
      avoid: ['להימנע עד שצוות המוצר יאשר:', '״במבוק אמיתי״, ״חומר טבעי״, ״עבודת יד״, ״חוסך מים״.'],
      proposition: '״הפרט האחד שהופך חדר רחצה לחלל עם זהות.״',
      readersLabel: 'שלושה קוראים',
      readers: ['לקוחות פרטיים בבנייה או בשיפוץ', 'אדריכלים ומעצבי פנים', 'יזמים ופרויקטים'],
      worldsLabel: 'ארבעה עולמות עיצוב',
      worlds: ['קלאסי מוקפד · חדר רחצה ראשי', 'מודרני חם · שירותי אורחים', 'טבעי וכפרי · עץ ואבן', 'נועז ואמנותי · סוויטת בוטיק'],
      conceptLabel: 'קונספט',
      concept: 'הפרט שמספר · The Telling Detail',
      headlineLabel: 'כותרת',
      headline: 'פרט אחד. והחלל כולו מספר סיפור.',
      bigIdea: 'בחדר רחצה יוקרתי הכול כבר מוקפד, ולכן מה שנזכר הוא פרט אחד שמספר מי גר כאן.',
      kit: [
        'דף נחיתה ב-11 מקטעים',
        'תיאור לכל אחד משלושת הקוראים',
        'ערכת מכירה והערות לאדריכלים',
        'שלושה פוסטים: Instagram, Reels ו-LinkedIn',
        'טקסטים לגוגל: כותרת, תיאור ונושאי חיפוש',
      ],
      orderLabel: 'סדר המקטעים, שנבחר למוצר הזה',
      order: ['מוצר', 'סגנונות', 'תובנה', 'סיפור', 'למה', 'ערך', 'הסטנדרט', 'אדריכלים', 'מסרים', 'עיצוב', 'מפרט'],
      accent: 'צבע הדגשה #9A7B4F, שנלקח מהברונזה · 10 נכסים בחבילה',
      flaggedLead: 'שלוש טענות בלי מקור. הן חוזרות לסוכני התוכן ודף הנחיתה.',
      fixedLead: 'סבב התיקון הסתיים: לא נשארה אף טענה בלי מקור.',
      claims: [
        ['כל ברז נוצר בעבודת יד והוא יחיד מסוגו.', 'קשת במראה במבוק ובסיס מוברש בגוון ברונזה חמה.', 'טענת קולקציה הוצגה כעובדה על המק״ט.'],
        ['Jacqueline מיוצר באיטליה בידי אומני Gessi.', 'Jacqueline מתוך קולקציית Haute Culture של Gessi.', 'אין מקור לארץ הייצור ברמת המק״ט.'],
        [
          'בזכות תהליך עיבוד ייחודי, הוא נשאר יפה ועמיד לאורך שנים גם במגע יומיומי עם מים.',
          'התוצאה היא אובייקט שמרגיש יותר כמו פריט אספנות מאשר כמו אביזר אינסטלציה.',
          'טענת עמידות ללא נתון, על חומר שאינו מאומת.',
        ],
      ],
      claimSummary: 'נבדקו 23 טענות: 0 בלי מקור, 16 ממתינות לאישור, 7 הסקות מהתמונה.',
      qa: [
        ['מותג', 'pass'],
        ['מוצר', 'pass'],
        ['קהל', 'pass'],
        ['מיצוב', 'pass'],
        ['אמינות טכנית', 'warn'],
        ['עקביות', 'pass'],
        ['יכולת התרחבות', 'warn'],
      ] as [string, Result][],
      result: { pass: 'עבר', warn: 'אזהרה' },
      verdict: 'השורה התחתונה: מוכן לצוותים. שתי האזהרות עוברות יחד עם ההשקה לאישור.',
    },
    signOff: 'אישורים',
    teams: (n: number) => `${n} מתוך 4 צוותים`,
    approvedForLaunch: 'אושר להשקה',
    roles: ['מוצר', 'שיווק', 'קריאייטיב', 'מסחר'],
    final: 'אישור סופי',
    launched: 'הושק',
    openWarnings: 'שתי אזהרות של בקרת האיכות עדיין פתוחות.',
    approveAnyway: 'לאשר בכל זאת',
    back: 'חזרה',
    live: 'הדף עולה לאוויר',
    landingAlt: 'דף הנחיתה שההשקה הזו הפיקה',
    msg: {
      launched: 'אושר להשקה. שתי אזהרות בקרת האיכות נרשמו עם האישור, והדף נכנס לספריית התוכן.',
      asking: 'בקרת האיכות השאירה שתי אזהרות: אמינות טכנית ויכולת התרחבות. אנשים מחליטים, והחריגה נרשמת.',
      teamsDone: 'כל ארבעת הצוותים אישרו. האישור הסופי משיק את המוצר.',
      reviewed: 'הסוכנים סיימו. כל צוות מאשר את החלק שלו; לחצו כדי לאשר.',
      revising: 'סבב תיקון: סוכני התוכן ודף הנחיתה משכתבים את שלוש הטענות שסומנו.',
      running: (n: number) => `סוכן ${n} מתוך 8 בעבודה.`,
      idle: 'תמונה אחת, בלי נתונים שהוקלדו. הריצו את הסוכנים ופתחו כל אחד מהם כדי לראות מה הוא הפיק.',
    },
  },
};

type Text = (typeof TEXT)['en'];
/* The analytics keep one name per role, whatever the page's language. */
const ROLE_KEYS = ['product', 'marketing', 'creative', 'commerce'] as const;

/*
 * The run as a clock: agents 1–6 finish on ticks 1–6, the validator finds
 * three claims on tick 7, content and the page are rewritten on tick 8, the
 * validator clears them on tick 9 and QA finishes on tick 10.
 */
const END = 10;
type State = 'waiting' | 'working' | 'flagged' | 'revising' | 'done';

function stateOf(i: number, t: number | null): State {
  if (t === null) return 'waiting';
  if (i < 6) {
    if (t === 8 && (i === 4 || i === 5)) return 'revising';
    return t > i ? 'done' : t === i ? 'working' : 'waiting';
  }
  if (i === 6) {
    if (t < 6) return 'waiting';
    if (t === 6 || t === 8) return 'working';
    if (t === 7) return 'flagged';
    return 'done';
  }
  return t < 9 ? 'waiting' : t === 9 ? 'working' : 'done';
}

function Output({ i, t, o }: { i: number; t: number; o: Text['out'] }): ReactNode {
  switch (i) {
    case 0:
      return (
        <>
          <p className="lr-lead">{o.summary}</p>
          <dl className="lr-counts">
            {(['ok', 'infer', 'miss'] as const).map((k, n) => (
              <div key={k} data-k={k}>
                <dt>{o.counts[n][0]}</dt>
                <dd className="tnum">{[0, 6, 11][n]}</dd>
                <small>{o.counts[n][1]}</small>
              </div>
            ))}
          </dl>
          <p className="lr-note">
            <b>{o.found[0]}</b> {o.found[1]}
          </p>
        </>
      );
    case 1:
      return (
        <>
          <p className="lr-lead">
            {o.fit[0]} <b>{o.fit[1]}</b>.
          </p>
          <ul className="lr-list">
            <li>
              <b>{o.tone[0]}</b> {o.tone[1]}
            </li>
            <li>
              <b>{o.avoid[0]}</b> {o.avoid[1]}
            </li>
          </ul>
        </>
      );
    case 2:
      return (
        <>
          <p className="lr-lead">{o.proposition}</p>
          <p className="lr-label">{o.readersLabel}</p>
          <div className="lr-chips">
            {o.readers.map((r) => (
              <span key={r}>{r}</span>
            ))}
          </div>
          <p className="lr-label">{o.worldsLabel}</p>
          <div className="lr-chips">
            {o.worlds.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
        </>
      );
    case 3:
      return (
        <>
          <p className="lr-label">{o.conceptLabel}</p>
          <p className="lr-lead">{o.concept}</p>
          <p className="lr-label">{o.headlineLabel}</p>
          <p className="lr-big">{o.headline}</p>
          <p className="lr-note">{o.bigIdea}</p>
        </>
      );
    case 4:
      return (
        <ul className="lr-list">
          {o.kit.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      );
    case 5:
      return (
        <>
          <p className="lr-label">{o.orderLabel}</p>
          <ol className="lr-order">
            {o.order.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="lr-note">
            <i className="lr-swatch" aria-hidden="true" /> {o.accent}
          </p>
        </>
      );
    case 6: {
      const fixed = t >= 9;
      return (
        <>
          <p className="lr-lead">{fixed ? o.fixedLead : o.flaggedLead}</p>
          <ul className="lr-claims">
            {o.claims.map(([before, after, why]) => (
              <li key={before} data-fixed={fixed ? '' : undefined}>
                <s>{before}</s>
                {fixed && <span className="lr-claims__new">{after}</span>}
                <small>{why}</small>
              </li>
            ))}
          </ul>
          {fixed && <p className="lr-note tnum">{o.claimSummary}</p>}
        </>
      );
    }
    default:
      return (
        <>
          <ul className="lr-qa">
            {o.qa.map(([name, r]) => (
              <li key={name} data-r={r}>
                <span>{name}</span>
                <b>{o.result[r]}</b>
              </li>
            ))}
          </ul>
          <p className="lr-note">{o.verdict}</p>
        </>
      );
  }
}

export function LaunchRun({ mode = 'full' }: { mode?: DemoMode }) {
  const preview = mode === 'preview';
  const T: Text = TEXT[useLocale()];
  const [t, setT] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [approved, setApproved] = useState<boolean[]>([false, false, false, false]);
  const [asking, setAsking] = useState(false);
  const [launched, setLaunched] = useState(false);

  const running = t !== null && t < END;
  const reviewed = t === END;
  const teamsDone = approved.every(Boolean);
  /* The agent that finished last, which the panel follows until one is picked. */
  const latest = t === null || t === 0 ? null : t <= 6 ? t - 1 : t < END ? 6 : 7;
  const shown = picked ?? latest;

  const reset = useCallback(() => {
    setT(null);
    setPicked(null);
    setApproved([false, false, false, false]);
    setAsking(false);
    setLaunched(false);
  }, []);

  const run = () => {
    reset();
    setT(0);
    if (!preview) trackDemo('launch: ran the agents');
  };

  useTicker(running, preview ? 650 : 800, () => setT((v) => (v === null ? v : Math.min(END, v + 1))));

  const approve = (i: number) => {
    setApproved((a) => a.map((v, n) => (n === i ? !v : v)));
    if (!preview && !approved[i]) trackDemo(`launch: approved as ${ROLE_KEYS[i]}`);
  };
  const launch = () => {
    setAsking(false);
    setLaunched(true);
    if (!preview) trackDemo('launch: approved the launch');
  };

  /* The preview runs, signs off role by role, launches, holds, starts over. */
  const { ref: stageRef, playing } = usePlaying<HTMLDivElement>(preview);
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    if (!preview || !playing) return;
    reset();
    const timers = [window.setTimeout(() => setT(0), 600)];
    const runEnd = 600 + END * 650 + 400;
    ROLE_KEYS.forEach((_, i) =>
      timers.push(window.setTimeout(() => setApproved((a) => a.map((v, n) => (n === i ? true : v))), runEnd + i * 550)),
    );
    timers.push(window.setTimeout(() => setAsking(true), runEnd + 4 * 550 + 300));
    timers.push(
      window.setTimeout(() => {
        setAsking(false);
        setLaunched(true);
      }, runEnd + 4 * 550 + 1500),
    );
    timers.push(window.setTimeout(() => setCycle((c) => c + 1), runEnd + 4 * 550 + 5200));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [preview, playing, cycle, reset]);

  const m = T.msg;
  const status = launched
    ? { tone: 'ok' as const, text: m.launched }
    : asking
      ? { tone: 'warn' as const, text: m.asking }
      : reviewed
        ? { tone: 'info' as const, text: teamsDone ? m.teamsDone : m.reviewed }
        : running
          ? { tone: 'info' as const, text: t !== null && t >= 7 && t <= 8 ? m.revising : m.running(Math.min(8, (t ?? 0) + 1)) }
          : { tone: 'info' as const, text: m.idle };

  const ui = (
    <DemoWindow
      app={T.app}
      context={T.context}
      pill={T.pill}
      className={preview ? 'dm--preview' : undefined}
      actions={
        !preview && (
          <button type="button" className="dm-btn" data-primary="" onClick={run} disabled={running}>
            {t === null ? T.run : T.again}
          </button>
        )
      }
    >
      <div className="lr">
        <div className="lr-side">
          <div className="lr-product">
            <span className="lr-product__pic">
              <Image src="/work/launch-engine/product.webp" alt={T.photoAlt} fill sizes="88px" />
            </span>
            <span>
              <b>{T.input}</b>
              <small>{T.inputNote}</small>
            </span>
          </div>
          <ol className="lr-agents">
            {T.agents.map(([name, job], i) => {
              const s = stateOf(i, t);
              const open = s === 'done' || s === 'flagged' || (i === 6 && t !== null && t >= 7);
              return (
                <li key={name}>
                  <button
                    type="button"
                    className="lr-agent"
                    data-state={s}
                    aria-pressed={shown === i}
                    disabled={!open}
                    onClick={() => {
                      setPicked(i);
                      if (!preview) trackDemo(`launch: opened agent ${i + 1}`);
                    }}
                  >
                    <span className="lr-agent__num tnum">{i + 1}</span>
                    <span className="lr-agent__text">
                      <b>{name}</b>
                      <small>{s === 'waiting' && t === null ? job : T.state[s]}</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="lr-main">
          <section className="dm-panel lr-out" aria-live="polite">
            {shown === null ? (
              <div className="lr-empty">
                <p className="lr-lead">{T.emptyLead}</p>
                <p className="lr-note">{T.emptyNote}</p>
              </div>
            ) : (
              <>
                <div className="dm-panel__head">
                  <b>
                    {shown + 1} · {T.agents[shown][0]}
                  </b>
                  <span>{T.agents[shown][1]}</span>
                </div>
                <div className="lr-out__body" key={`${shown}-${t !== null && t >= 9}`}>
                  <Output i={shown} t={t ?? 0} o={T.out} />
                </div>
              </>
            )}
          </section>

          <section className="dm-panel lr-sign" aria-label={T.signOff}>
            <div className="dm-panel__head">
              <b>{T.signOff}</b>
              <span>{launched ? T.approvedForLaunch : T.teams(approved.filter(Boolean).length)}</span>
            </div>
            <div className="lr-roles">
              {T.roles.map((r, i) => (
                <button key={r} type="button" aria-pressed={approved[i]} disabled={!reviewed || launched} onClick={() => approve(i)}>
                  <i aria-hidden="true">{approved[i] ? '✓' : ''}</i>
                  {r}
                </button>
              ))}
              <button
                type="button"
                className="lr-final"
                aria-pressed={launched}
                disabled={!teamsDone || launched}
                onClick={() => setAsking(true)}
              >
                {launched ? T.launched : T.final}
              </button>
            </div>
            {asking && !launched && (
              <div className="lr-ask">
                <span>{T.openWarnings}</span>
                <button type="button" className="dm-btn" data-primary="" onClick={launch}>
                  {T.approveAnyway}
                </button>
                <button type="button" className="dm-btn" onClick={() => setAsking(false)}>
                  {T.back}
                </button>
              </div>
            )}
            {launched && (
              <div className="lr-done">
                <span className="lr-done__pic">
                  <Image src="/work/launch-engine/landing-hero.jpg" alt={T.landingAlt} fill sizes="160px" />
                </span>
                <span>
                  <b>{T.live}</b>
                  <small>“{T.out.headline}”</small>
                </span>
              </div>
            )}
          </section>
        </div>
      </div>
      <div className="dm-msgrow">
        <DemoMessage tone={status.tone}>{status.text}</DemoMessage>
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

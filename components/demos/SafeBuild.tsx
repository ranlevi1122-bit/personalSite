'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { trackDemo } from '@/lib/analytics/client';
import { Arrow } from '@/components/ui/Arrow';
import { useLocale } from '@/components/LocaleProvider';
import { useInViewOnce } from '@/lib/hooks';
import { getContent } from '@/data/content';
import { safebuildPlan as enPlan, safebuildRisks as enRisks } from '@/data/portfolioData';
import type { DemoMode } from './shared';
import { Walkthrough } from './Walkthrough';

/**
 * SafeBuild AI Pro, the capstone, shown with its own material: the team's
 * prototype screens, the test results, the plan and the risk register, all
 * from the project book.
 */

const en = {
  context: 'Underwriting report',
  pill: 'Team prototype',
  naive: 'Always say “injury”',
  verdicts: [
    'Highest recall of the ten, 90.6%, but an AUC of 66.1% fails the 75% gate: it calls almost every company risky.',
    'The best AUC, 79.2%, but a recall of 71%: it misses more of the companies that do have an injury.',
    'The only one to clear both: recall 82.1% and AUC 76.3% on the test set, steady across folds. Chosen.',
  ],
  targets: 'Targets and results',
  target: (t: number | null, note: string) => (t !== null ? `Target ${t}%. ${note}.` : `No target set. ${note}.`),
  records: 'All 41,760 test records',
  classifier: 'Classifier',
  flagged: 'Flagged',
  cleared: 'Cleared',
  injury: 'Had an injury',
  noInjury: 'No injury',
  cells: ['caught', 'missed', 'false alarms', 'correctly cleared'],
  recall: 'Recall',
  precision: 'Precision',
  accuracy: 'Accuracy',
  modelNote: 'The model keeps 82% of the injuries while clearing 9,036 companies that a blanket guess would flag.',
  naiveNote: 'A blanket guess catches every injury by flagging everyone, so precision falls to the share of injuries, 58.7%.',
  choosing: 'Choosing the model',
  rule: 'The rule: the highest recall, provided the AUC is at least 75%. Three of the ten algorithms compared:',
  gate: 'AUC gate, 75%',
  recallTarget: 'Recall target, 70%',
  recallAxis: 'Recall →',
  pickModel: 'Pick a model to see why it was or was not chosen.',
  dateLocale: 'en-GB',
  monthLocale: 'en-US',
  milestones: ['Scope signed off', 'Design review', 'Submission'],
  range: (a: string, b: string) => `${a} to ${b}`,
  days: (n: number) => `${n} working days`,
  planNote: 'Seven phases and three reviews. Point at a phase to see what it covered.',
  openPlan: 'Open the original MS Project plan',
  planAria: 'The team’s MS Project plan',
  planHead: 'The team’s MS Project plan, as submitted',
  close: 'Close',
  planAlt: 'Gantt chart from MS Project: 77 tasks from 28 July 2025 to 8 June 2026, with dependencies and owners',
  happened: 'What happened',
  done: 'What was done',
};

const he: typeof en = {
  context: 'דוח חיתום',
  pill: 'אב הטיפוס של הצוות',
  naive: 'תמיד לומר ״פציעה״',
  verdicts: [
    'הרגישות הגבוהה מבין העשרה, 90.6%, אבל AUC של 66.1% לא עובר את סף ה-75%: הוא מסמן כמעט כל חברה כמסוכנת.',
    'ה-AUC הטוב ביותר, 79.2%, אבל רגישות של 71%: הוא מפספס יותר מהחברות שכן הייתה בהן פציעה.',
    'היחיד שעבר את שני התנאים: רגישות 82.1% ו-AUC של 76.3% על סט המבחן, יציב בין קיפולי האימות. נבחר.',
  ],
  targets: 'יעדים ותוצאות',
  target: (t, note) => (t !== null ? `יעד ${t}%. ${note}.` : `לא הוגדר יעד. ${note}.`),
  records: 'כל 41,760 רשומות המבחן',
  classifier: 'מסווג',
  flagged: 'סומנו',
  cleared: 'לא סומנו',
  injury: 'הייתה פציעה',
  noInjury: 'לא הייתה פציעה',
  cells: ['נתפסו', 'פוספסו', 'התרעות שווא', 'סומנו נכון כבטוחות'],
  recall: 'רגישות',
  precision: 'דיוק',
  accuracy: 'נכונות',
  modelNote: 'המודל תופס 82% מהפציעות, ובמקביל משחרר 9,036 חברות שניחוש גורף היה מסמן.',
  naiveNote: 'ניחוש גורף תופס כל פציעה כי הוא מסמן את כולם, ולכן הדיוק יורד לשיעור הפציעות, 58.7%.',
  choosing: 'בחירת המודל',
  rule: 'הכלל: הרגישות הגבוהה ביותר, בתנאי שה-AUC הוא לפחות 75%. שלושה מעשרת האלגוריתמים שהושוו:',
  gate: 'סף AUC, 75%',
  recallTarget: 'יעד רגישות, 70%',
  recallAxis: 'רגישות →',
  pickModel: 'בחרו מודל כדי לראות למה הוא נבחר או לא נבחר.',
  dateLocale: 'he-IL',
  monthLocale: 'he-IL',
  milestones: ['אישור ההיקף', 'סקר תכן', 'הגשה'],
  range: (a, b) => `${a} עד ${b}`,
  days: (n) => `${n} ימי עבודה`,
  planNote: 'שבעה שלבים ושלוש סקירות. הצביעו על שלב כדי לראות מה הוא כלל.',
  openPlan: 'לתוכנית ה-MS Project המקורית',
  planAria: 'תוכנית ה-MS Project של הצוות',
  planHead: 'תוכנית ה-MS Project של הצוות, כפי שהוגשה',
  close: 'סגירה',
  planAlt: 'תרשים גאנט מ-MS Project: 77 משימות מ-28 ביולי 2025 עד 8 ביוני 2026, עם תלויות ואחראים',
  happened: 'מה קרה',
  done: 'מה נעשה',
};

const useText = () => {
  const locale = useLocale();
  return { locale, T: locale === 'he' ? he : en };
};

/** The team's prototype screens, as a guided tour. */
export function SafeBuildWalkthrough({ mode = 'full' }: { mode?: DemoMode }) {
  const { locale, T } = useText();
  return (
    <Walkthrough
      steps={getContent(locale).safebuildSteps}
      track="safebuild"
      app="SafeBuild AI Pro"
      context={T.context}
      pill={T.pill}
      aspect="1920 / 888"
      mode={mode}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  The results: targets, every company in the test set, and the choice of    */
/*  model.                                                                    */
/* -------------------------------------------------------------------------- */

const matrices = {
  model: { name: 'Gradient Boosting', cells: { tp: 20113, fn: 4388, fp: 8223, tn: 9036 } },
  naive: { name: 'naive', cells: { tp: 24501, fn: 0, fp: 17259, tn: 0 } },
} as const;
type Guess = keyof typeof matrices;
const N = 41760;
const fmt = (n: number) => n.toLocaleString('en-US');

const models = [
  { name: 'Naive Bayes', recall: 90.6, auc: 66.1 },
  { name: 'XGBoost', recall: 71.0, auc: 79.2 },
  { name: 'Gradient Boosting', recall: 82.1, auc: 76.3 },
];

export function SafeBuildResults() {
  const { locale, T } = useText();
  const { safebuildTargets } = getContent(locale);
  const { ref, seen } = useInViewOnce<HTMLDivElement>();
  const [guess, setGuess] = useState<Guess>('model');
  const [model, setModel] = useState<number | null>(null);

  const m = matrices[guess].cells;
  const recall = (m.tp / (m.tp + m.fn)) * 100;
  const precision = (m.tp / (m.tp + m.fp)) * 100;
  const accuracy = ((m.tp + m.tn) / N) * 100;
  /* Each cell's shade is its share of the largest possible cell. */
  const cell = (label: string, value: number) => (
    <div className="sb-cell" data-dark={value / 24501 > 0.45 ? '' : undefined} style={{ ['--a' as string]: (value / 24501).toFixed(3) }}>
      <b className="tnum">{fmt(value)}</b>
      <span>{label}</span>
    </div>
  );

  /* Scatter scale: recall 60–100 across, AUC 60–85 up. */
  const X = (r: number) => ((r - 60) / 40) * 100;
  const Y = (a: number) => 100 - ((a - 60) / 25) * 100;

  return (
    <div ref={ref} className="sb-results" data-seen={seen ? '' : undefined} data-demo="" data-ui="">
      <section className="sb-card">
        <h3>{T.targets}</h3>
        <ul className="sb-targets">
          {safebuildTargets.map((t) => (
            <li key={t.label}>
              <div className="sb-targets__head">
                <span>{t.label}</span>
                <b className="tnum">{t.achieved}%</b>
              </div>
              <div className="sb-track" aria-hidden="true">
                <i className="sb-track__fill" style={{ width: seen ? `${t.achieved}%` : 0 }} />
                {t.target !== null && <i className="sb-track__target" style={{ insetInlineStart: `${t.target}%` }} />}
              </div>
              <p>{T.target(t.target, t.note)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="sb-card">
        <h3>{T.records}</h3>
        <div className="sb-seg" role="group" aria-label={T.classifier}>
          {(Object.keys(matrices) as Guess[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={guess === k}
              onClick={() => {
                setGuess(k);
                trackDemo(`safebuild: matrix ${k}`);
              }}
            >
              {k === 'naive' ? T.naive : matrices[k].name}
            </button>
          ))}
        </div>
        <div className="sb-matrix" aria-live="polite">
          <span />
          <span className="sb-matrix__col">{T.flagged}</span>
          <span className="sb-matrix__col">{T.cleared}</span>
          <span className="sb-matrix__axis">{T.injury}</span>
          {cell(T.cells[0], m.tp)}
          {cell(T.cells[1], m.fn)}
          <span className="sb-matrix__axis">{T.noInjury}</span>
          {cell(T.cells[2], m.fp)}
          {cell(T.cells[3], m.tn)}
        </div>
        <dl className="sb-metrics">
          <div>
            <dt>{T.recall}</dt>
            <dd className="tnum">{recall.toFixed(1)}%</dd>
          </div>
          <div>
            <dt>{T.precision}</dt>
            <dd className="tnum">{precision.toFixed(1)}%</dd>
          </div>
          <div>
            <dt>{T.accuracy}</dt>
            <dd className="tnum">{accuracy.toFixed(1)}%</dd>
          </div>
        </dl>
        <p className="sb-small">{guess === 'model' ? T.modelNote : T.naiveNote}</p>
      </section>

      <section className="sb-card">
        <h3>{T.choosing}</h3>
        <p className="sb-small">{T.rule}</p>
        {/* A chart of two measures keeps its axes running left to right in either language. */}
        <div className="sb-scatter" dir="ltr">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <rect x={X(70)} y="0" width={100 - X(70)} height={Y(75)} className="sb-scatter__ok" />
            <line x1="0" x2="100" y1={Y(75)} y2={Y(75)} className="sb-scatter__gate" />
            <line x1={X(70)} x2={X(70)} y1="0" y2="100" className="sb-scatter__gate" />
          </svg>
          <span className="sb-scatter__note" style={{ top: `${Y(75)}%` }}>
            {T.gate}
          </span>
          <span className="sb-scatter__note sb-scatter__note--x" style={{ left: `${X(70)}%` }}>
            {T.recallTarget}
          </span>
          {models.map((md, i) => (
            <button
              key={md.name}
              type="button"
              className="sb-dot"
              data-chosen={i === 2 ? '' : undefined}
              aria-pressed={model === i}
              style={{ left: `${X(md.recall)}%`, top: `${Y(md.auc)}%` }}
              onClick={() => {
                setModel(i);
                trackDemo(`safebuild: model ${md.name}`);
              }}
            >
              <i aria-hidden="true" />
              <span>{md.name}</span>
            </button>
          ))}
          <span className="sb-scatter__axis sb-scatter__axis--x">{T.recallAxis}</span>
          <span className="sb-scatter__axis sb-scatter__axis--y">AUC →</span>
        </div>
        <p className="sb-small" aria-live="polite">
          {model === null ? T.pickModel : T.verdicts[model]}
        </p>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  The plan                                                                  */
/* -------------------------------------------------------------------------- */

const day = (iso: string) => new Date(`${iso}T00:00:00Z`).getTime();
const span = day(enPlan.end) - day(enPlan.start);
const at = (iso: string) => ((day(iso) - day(enPlan.start)) / span) * 100;

const monthStarts = (() => {
  const out: { time: number; left: number }[] = [];
  const d = new Date(`${enPlan.start}T00:00:00Z`);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + 1);
  while (d.getTime() < day(enPlan.end)) {
    out.push({ time: d.getTime(), left: ((d.getTime() - day(enPlan.start)) / span) * 100 });
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
})();

const milestoneDates = ['2025-10-23', '2025-12-15', '2026-06-08'];

/* The bars run from the start of the line: left to right in English, right to left in Hebrew. */
export function PlanTimeline() {
  const { locale, T } = useText();
  const plan = getContent(locale).safebuildPlan;
  const { ref, seen } = useInViewOnce<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement | null>(null);
  const phase = active === null ? null : plan.phases[active];
  const shortDate = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(T.dateLocale, { day: 'numeric', month: 'short', timeZone: 'UTC' });

  return (
    <div ref={ref} className="sb-plan" data-seen={seen ? '' : undefined} data-demo="" data-ui="">
      <div className="sb-plan__chart">
        <div className="sb-plan__months" aria-hidden="true">
          {monthStarts.map((m) => (
            <span key={m.time} style={{ insetInlineStart: `${m.left}%` }}>
              {new Date(m.time).toLocaleDateString(T.monthLocale, { month: 'short', timeZone: 'UTC' })}
            </span>
          ))}
        </div>
        <ol className="sb-plan__rows">
          {plan.phases.map((p, i) => (
            <li key={p.name}>
              <button
                type="button"
                className="sb-phase"
                aria-pressed={active === i}
                onClick={() => {
                  setActive(active === i ? null : i);
                  trackDemo(`safebuild: plan phase ${enPlan.phases[i].name}`);
                }}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
              >
                <span className="sb-phase__name">{p.name}</span>
                <span className="sb-phase__track">
                  <i
                    style={{
                      insetInlineStart: `${at(p.start)}%`,
                      width: `${at(p.end) - at(p.start)}%`,
                      transitionDelay: `${i * 90}ms`,
                    }}
                  />
                </span>
              </button>
            </li>
          ))}
        </ol>
        <div className="sb-plan__marks" aria-hidden="true">
          {milestoneDates.map((date, i) => (
            <span key={date} style={at(date) >= 99 ? { insetInlineEnd: 0 } : { insetInlineStart: `${at(date)}%` }}>
              <i />
              <small>{T.milestones[i]}</small>
            </span>
          ))}
        </div>
      </div>

      <div className="sb-plan__detail" aria-live="polite">
        {phase ? (
          <>
            <b>{phase.name}</b>
            <span className="tnum">{T.range(shortDate(phase.start), shortDate(phase.end))}</span>
            <p>{phase.detail}</p>
          </>
        ) : (
          <>
            <b>{T.days(plan.days)}</b>
            <span className="tnum">{T.range(`${shortDate(plan.start)} 2025`, `${shortDate(plan.end)} 2026`)}</span>
            <p>{T.planNote}</p>
          </>
        )}
        <button
          type="button"
          className="arrow-link"
          onClick={() => {
            dialog.current?.showModal();
            trackDemo('safebuild: opened the original plan');
          }}
        >
          {T.openPlan} <Arrow />
        </button>
      </div>

      <dialog ref={dialog} className="sb-dialog" aria-label={T.planAria} onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
        <div className="sb-dialog__head">
          <b>{T.planHead}</b>
          <button type="button" className="dm-btn" onClick={() => dialog.current?.close()}>
            {T.close}
          </button>
        </div>
        <Image src={plan.image} alt={T.planAlt} width={717} height={865} sizes="(max-width: 800px) 100vw, 717px" />
      </dialog>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  The risk register                                                         */
/* -------------------------------------------------------------------------- */

export function RiskRegister() {
  const { locale, T } = useText();
  return (
    <ol className="sb-risks" data-demo="" data-ui="">
      {getContent(locale).safebuildRisks.map((r, i) => (
        <li key={r.risk}>
          <details
            onToggle={(e) => {
              if ((e.currentTarget as HTMLDetailsElement).open) trackDemo(`safebuild: risk ${enRisks[i].risk}`);
            }}
          >
            <summary>
              <span className="sb-risks__num tnum">R{i + 1}</span>
              <b>{r.risk}</b>
              <span className="sb-risks__plus" aria-hidden="true" />
            </summary>
            <dl>
              <div>
                <dt>{T.happened}</dt>
                <dd>{r.happened}</dd>
              </div>
              <div>
                <dt>{T.done}</dt>
                <dd>{r.response}</dd>
              </div>
            </dl>
          </details>
        </li>
      ))}
    </ol>
  );
}

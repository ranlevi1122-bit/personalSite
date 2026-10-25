'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { trackDemo } from '@/lib/analytics/client';
import { Arrow } from '@/components/ui/Arrow';
import { useInViewOnce } from '@/lib/hooks';
import { safebuildPlan, safebuildRisks, safebuildSteps, safebuildTargets } from '@/data/portfolioData';
import type { DemoMode } from './shared';
import { Walkthrough } from './Walkthrough';

/**
 * SafeBuild AI Pro, the capstone, shown with its own material: the team's
 * prototype screens, the test results, the plan and the risk register, all
 * from the project book.
 */

/** The team's prototype screens, as a guided tour. */
export function SafeBuildWalkthrough({ mode = 'full' }: { mode?: DemoMode }) {
  return (
    <Walkthrough
      steps={safebuildSteps}
      track="safebuild"
      app="SafeBuild AI Pro"
      context="Underwriting report"
      pill="Team prototype"
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
  model: {
    name: 'Gradient Boosting',
    cells: { tp: 20113, fn: 4388, fp: 8223, tn: 9036 },
  },
  naive: {
    name: 'Always say “injury”',
    cells: { tp: 24501, fn: 0, fp: 17259, tn: 0 },
  },
} as const;
type Guess = keyof typeof matrices;
const N = 41760;
const fmt = (n: number) => n.toLocaleString('en-US');

const models = [
  {
    name: 'Naive Bayes',
    recall: 90.6,
    auc: 66.1,
    verdict: 'Highest recall of the ten, 90.6%, but an AUC of 66.1% fails the 75% gate: it calls almost every company risky.',
  },
  {
    name: 'XGBoost',
    recall: 71.0,
    auc: 79.2,
    verdict: 'The best AUC, 79.2%, but a recall of 71%: it misses more of the companies that do have an injury.',
  },
  {
    name: 'Gradient Boosting',
    recall: 82.1,
    auc: 76.3,
    verdict: 'The only one to clear both: recall 82.1% and AUC 76.3% on the test set, steady across folds. Chosen.',
  },
];

export function SafeBuildResults() {
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
        <h3>Targets and results</h3>
        <ul className="sb-targets">
          {safebuildTargets.map((t) => (
            <li key={t.label}>
              <div className="sb-targets__head">
                <span>{t.label}</span>
                <b className="tnum">{t.achieved}%</b>
              </div>
              <div className="sb-track" aria-hidden="true">
                <i className="sb-track__fill" style={{ width: seen ? `${t.achieved}%` : 0 }} />
                {t.target !== null && <i className="sb-track__target" style={{ left: `${t.target}%` }} />}
              </div>
              <p>{t.target !== null ? `Target ${t.target}%. ${t.note}.` : `No target set. ${t.note}.`}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="sb-card">
        <h3>All 41,760 test records</h3>
        <div className="sb-seg" role="group" aria-label="Classifier">
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
              {matrices[k].name}
            </button>
          ))}
        </div>
        <div className="sb-matrix" aria-live="polite">
          <span />
          <span className="sb-matrix__col">Flagged</span>
          <span className="sb-matrix__col">Cleared</span>
          <span className="sb-matrix__axis">Had an injury</span>
          {cell('caught', m.tp)}
          {cell('missed', m.fn)}
          <span className="sb-matrix__axis">No injury</span>
          {cell('false alarms', m.fp)}
          {cell('correctly cleared', m.tn)}
        </div>
        <dl className="sb-metrics">
          <div>
            <dt>Recall</dt>
            <dd className="tnum">{recall.toFixed(1)}%</dd>
          </div>
          <div>
            <dt>Precision</dt>
            <dd className="tnum">{precision.toFixed(1)}%</dd>
          </div>
          <div>
            <dt>Accuracy</dt>
            <dd className="tnum">{accuracy.toFixed(1)}%</dd>
          </div>
        </dl>
        <p className="sb-small">
          {guess === 'model'
            ? 'The model keeps 82% of the injuries while clearing 9,036 companies that a blanket guess would flag.'
            : 'A blanket guess catches every injury by flagging everyone, so precision falls to the share of injuries, 58.7%.'}
        </p>
      </section>

      <section className="sb-card">
        <h3>Choosing the model</h3>
        <p className="sb-small">The rule: the highest recall, provided the AUC is at least 75%. Three of the ten algorithms compared:</p>
        <div className="sb-scatter">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <rect x={X(70)} y="0" width={100 - X(70)} height={Y(75)} className="sb-scatter__ok" />
            <line x1="0" x2="100" y1={Y(75)} y2={Y(75)} className="sb-scatter__gate" />
            <line x1={X(70)} x2={X(70)} y1="0" y2="100" className="sb-scatter__gate" />
          </svg>
          <span className="sb-scatter__note" style={{ top: `${Y(75)}%` }}>
            AUC gate, 75%
          </span>
          <span className="sb-scatter__note sb-scatter__note--x" style={{ left: `${X(70)}%` }}>
            Recall target, 70%
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
          <span className="sb-scatter__axis sb-scatter__axis--x">Recall →</span>
          <span className="sb-scatter__axis sb-scatter__axis--y">AUC →</span>
        </div>
        <p className="sb-small" aria-live="polite">
          {model === null ? 'Pick a model to see why it was or was not chosen.' : models[model].verdict}
        </p>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  The plan                                                                  */
/* -------------------------------------------------------------------------- */

const day = (iso: string) => new Date(`${iso}T00:00:00Z`).getTime();
const span = day(safebuildPlan.end) - day(safebuildPlan.start);
const at = (iso: string) => ((day(iso) - day(safebuildPlan.start)) / span) * 100;
const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

const months = (() => {
  const out: { label: string; left: number }[] = [];
  const d = new Date(`${safebuildPlan.start}T00:00:00Z`);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + 1);
  while (d.getTime() < day(safebuildPlan.end)) {
    out.push({
      label: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
      left: ((d.getTime() - day(safebuildPlan.start)) / span) * 100,
    });
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
})();

const milestones = [
  { date: '2025-10-23', label: 'Scope signed off' },
  { date: '2025-12-15', label: 'Design review' },
  { date: '2026-06-08', label: 'Submission' },
];

export function PlanTimeline() {
  const { ref, seen } = useInViewOnce<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement | null>(null);
  const phase = active === null ? null : safebuildPlan.phases[active];

  return (
    <div ref={ref} className="sb-plan" data-seen={seen ? '' : undefined} data-demo="" data-ui="">
      <div className="sb-plan__chart">
        <div className="sb-plan__months" aria-hidden="true">
          {months.map((m) => (
            <span key={m.label + m.left} style={{ left: `${m.left}%` }}>
              {m.label}
            </span>
          ))}
        </div>
        <ol className="sb-plan__rows">
          {safebuildPlan.phases.map((p, i) => (
            <li key={p.name}>
              <button
                type="button"
                className="sb-phase"
                aria-pressed={active === i}
                onClick={() => {
                  setActive(active === i ? null : i);
                  trackDemo(`safebuild: plan phase ${p.name}`);
                }}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
              >
                <span className="sb-phase__name">{p.name}</span>
                <span className="sb-phase__track">
                  <i
                    style={{
                      left: `${at(p.start)}%`,
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
          {milestones.map((m) => (
            <span key={m.date} style={at(m.date) >= 99 ? { right: 0 } : { left: `${at(m.date)}%` }}>
              <i />
              <small>{m.label}</small>
            </span>
          ))}
        </div>
      </div>

      <div className="sb-plan__detail" aria-live="polite">
        {phase ? (
          <>
            <b>{phase.name}</b>
            <span className="tnum">
              {shortDate(phase.start)} to {shortDate(phase.end)}
            </span>
            <p>{phase.detail}</p>
          </>
        ) : (
          <>
            <b>{safebuildPlan.days} working days</b>
            <span className="tnum">
              {shortDate(safebuildPlan.start)} 2025 to {shortDate(safebuildPlan.end)} 2026
            </span>
            <p>Seven phases and three reviews. Point at a phase to see what it covered.</p>
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
          Open the original MS Project plan <Arrow />
        </button>
      </div>

      <dialog ref={dialog} className="sb-dialog" aria-label="The team's MS Project plan" onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
        <div className="sb-dialog__head">
          <b>The team’s MS Project plan, as submitted</b>
          <button type="button" className="dm-btn" onClick={() => dialog.current?.close()}>
            Close
          </button>
        </div>
        <Image
          src={safebuildPlan.image}
          alt="Gantt chart from MS Project: 77 tasks from 28 July 2025 to 8 June 2026, with dependencies and owners"
          width={717}
          height={865}
          sizes="(max-width: 800px) 100vw, 717px"
        />
      </dialog>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  The risk register                                                         */
/* -------------------------------------------------------------------------- */

export function RiskRegister() {
  return (
    <ol className="sb-risks" data-demo="" data-ui="">
      {safebuildRisks.map((r, i) => (
        <li key={r.risk}>
          <details
            onToggle={(e) => {
              if ((e.currentTarget as HTMLDetailsElement).open) trackDemo(`safebuild: risk ${r.risk}`);
            }}
          >
            <summary>
              <span className="sb-risks__num tnum">R{i + 1}</span>
              <b>{r.risk}</b>
              <span className="sb-risks__plus" aria-hidden="true" />
            </summary>
            <dl>
              <div>
                <dt>What happened</dt>
                <dd>{r.happened}</dd>
              </div>
              <div>
                <dt>What was done</dt>
                <dd>{r.response}</dd>
              </div>
            </dl>
          </details>
        </li>
      ))}
    </ol>
  );
}

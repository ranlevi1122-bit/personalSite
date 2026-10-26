'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { trackDemo } from '@/lib/analytics/client';
import { useLocale } from '@/components/LocaleProvider';
import { DemoWindow, ScaledStage, usePlaying, type DemoMode } from './shared';

/**
 * The multi-agent analyst as a run you can start: four agents hand the work
 * on in turn, and the chart and the report come out of the data itself, so
 * every figure in the report adds up. The datasets are samples.
 */

type DataId = 'sales' | 'tickets';

interface Dataset {
  id: DataId;
  file: string;
  values: number[];
  fmt: (v: number) => string;
}

const datasets: Dataset[] = [
  {
    id: 'sales',
    file: 'sales_2025.csv',
    values: [42, 39, 45, 48, 51, 47, 58, 61, 54, 50, 56, 72],
    fmt: (v) => `₪${Math.round(v)}k`,
  },
  {
    id: 'tickets',
    file: 'tickets_10_weeks.csv',
    values: [120, 132, 128, 141, 150, 138, 162, 171, 158, 185],
    fmt: (v) => `${Math.round(v)}`,
  },
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const weeks = Array.from({ length: 10 }, (_, i) => `W${i + 1}`);
const heMonths = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

interface Facts {
  fmt: (v: number) => string;
  file: string;
  n: number;
  avg: number;
  peak: number;
  low: number;
  peakAt: number;
  lowAt: number;
  h1: number;
  h2: number;
  change: number;
  above: number;
  next: number;
  step: number;
}

const en = {
  app: 'AI Data Analyst',
  agents: [
    ['Data agent', 'Loads and checks the file'],
    ['Analysis agent', 'Finds what moved and ranks it'],
    ['Visualisation agent', 'Charts the findings'],
    ['Interpretation agent', 'Writes the business report'],
  ],
  data: {
    sales: { name: 'Shop sales', labels: months, long: months, period: 'month' },
    tickets: { name: 'Support tickets', labels: weeks, long: weeks, period: 'week' },
  } as Record<DataId, { name: string; labels: string[]; long: string[]; period: string }>,
  report: (id: DataId, f: Facts, long: string[], period: string) => [
    `${long[f.peakAt]} is the peak at ${f.fmt(f.peak)}, ${f.above.toFixed(0)}% above the ${period}ly average of ${f.fmt(f.avg)}.`,
    `The second half ${f.change >= 0 ? 'grew' : 'fell'} ${Math.abs(f.change).toFixed(0)}% on the first, from ${f.fmt(f.h1)} to ${f.fmt(f.h2)}.`,
    id === 'sales'
      ? `Plan stock and staff for ${long[f.peakAt]}; ${long[f.lowAt]}, the low at ${f.fmt(f.low)}, is the month to promote.`
      : `If the trend holds, plan for about ${f.fmt(f.next)} tickets next week, ${f.fmt(f.step)} more each week.`,
  ],
  log: (f: Facts, labels: string[], period: string) => [
    [`Reading ${f.file}`, `${f.n} rows, 2 columns, no gaps.`],
    [`Average ${f.fmt(f.avg)} a ${period}, range ${f.fmt(f.low)} to ${f.fmt(f.peak)}.`, 'Three findings, ranked by size.'],
    [`Column chart, ${labels[f.peakAt]} marked as the peak.`],
    ['Report written in plain language.'],
  ],
  dataset: 'Dataset',
  run: 'Run the analysis',
  again: 'Run again',
  working: 'Working…',
  chart: (name: string, period: string, list: string) => `${name} by ${period}: ${list}`,
  insight: 'Insight report',
  ready: 'Ready',
  writing: 'Being written',
  notRun: 'Not run yet',
  intro: 'Choose a dataset and run the analysis. Four agents take it from the raw file to this report.',
};

const he: typeof en = {
  app: 'AI Data Analyst',
  agents: [
    ['סוכן נתונים', 'טוען את הקובץ ובודק אותו'],
    ['סוכן ניתוח', 'מוצא מה זז ומדרג את זה'],
    ['סוכן ויזואליזציה', 'משרטט את הממצאים'],
    ['סוכן פרשנות', 'כותב את הדוח העסקי'],
  ],
  data: {
    sales: { name: 'מכירות החנות', labels: heMonths.map((m) => m.slice(0, 3)), long: heMonths, period: 'חודש' },
    tickets: {
      name: 'פניות תמיכה',
      labels: weeks.map((_, i) => `ש${i + 1}`),
      long: weeks.map((_, i) => `שבוע ${i + 1}`),
      period: 'שבוע',
    },
  },
  report: (id, f, long, period) => [
    `${long[f.peakAt]} הוא השיא, עם ${f.fmt(f.peak)}: ${f.above.toFixed(0)}% מעל הממוצע ה${period === 'חודש' ? 'חודשי' : 'שבועי'}, ${f.fmt(f.avg)}.`,
    `המחצית השנייה ${f.change >= 0 ? 'עלתה' : 'ירדה'} ב-${Math.abs(f.change).toFixed(0)}% לעומת הראשונה, מ-${f.fmt(f.h1)} ל-${f.fmt(f.h2)}.`,
    id === 'sales'
      ? `כדאי לתכנן מלאי וכוח אדם ל${long[f.peakAt]}. ${long[f.lowAt]}, השפל עם ${f.fmt(f.low)}, הוא החודש לקידום מכירות.`
      : `אם המגמה תימשך, כדאי להיערך לכ-${f.fmt(f.next)} פניות בשבוע הבא, ${f.fmt(f.step)} יותר בכל שבוע.`,
  ],
  log: (f, labels, period) => [
    [`קורא את ${f.file}`, `${f.n} שורות, 2 עמודות, בלי חסרים.`],
    [`ממוצע ${f.fmt(f.avg)} ל${period}, טווח ${f.fmt(f.low)} עד ${f.fmt(f.peak)}.`, 'שלושה ממצאים, מדורגים לפי גודל.'],
    [`גרף עמודות, ${labels[f.peakAt]} מסומן כשיא.`],
    ['הדוח נכתב בשפה פשוטה.'],
  ],
  dataset: 'מאגר נתונים',
  run: 'הרצת הניתוח',
  again: 'הרצה מחדש',
  working: 'עובד…',
  chart: (name, period, list) => `${name} לפי ${period}: ${list}`,
  insight: 'דוח תובנות',
  ready: 'מוכן',
  writing: 'בכתיבה',
  notRun: 'עוד לא הורץ',
  intro: 'בחרו מאגר נתונים והריצו את הניתוח. ארבעה סוכנים לוקחים אותו מהקובץ הגולמי ועד הדוח הזה.',
};

/** When each agent finishes, in ms from the start of a run. */
const marks = [900, 2000, 3000, 4800];

function facts(d: Dataset): Facts {
  const n = d.values.length;
  const avg = d.values.reduce((a, b) => a + b, 0) / n;
  const peak = Math.max(...d.values);
  const low = Math.min(...d.values);
  const half = Math.floor(n / 2);
  const h1 = d.values.slice(0, half).reduce((a, b) => a + b, 0);
  const h2 = d.values.slice(n - half).reduce((a, b) => a + b, 0);
  const step = (d.values[n - 1] - d.values[0]) / (n - 1);
  return {
    fmt: d.fmt,
    file: d.file,
    n,
    avg,
    peak,
    low,
    peakAt: d.values.indexOf(peak),
    lowAt: d.values.indexOf(low),
    h1,
    h2,
    change: (h2 / h1 - 1) * 100,
    above: (peak / avg - 1) * 100,
    next: d.values[n - 1] + step,
    step,
  };
}

export function Agents({ mode = 'full' }: { mode?: DemoMode }) {
  const preview = mode === 'preview';
  const T = useLocale() === 'he' ? he : en;
  const [dataId, setDataId] = useState<DataId>(datasets[0].id);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const raf = useRef(0);

  const data = datasets.find((d) => d.id === dataId)!;
  const words = T.data[data.id];
  const result = useMemo(() => {
    const f = facts(data);
    return { peakAt: f.peakAt, report: T.report(data.id, f, words.long, words.period), log: T.log(f, words.labels, words.period) };
  }, [T, data, words]);

  const run = useCallback((id?: DataId) => {
    if (id) setDataId(id);
    setElapsed(0);
    setStartedAt(performance.now());
  }, []);

  useEffect(() => {
    if (startedAt === null) return;
    const tick = (now: number) => {
      const t = now - startedAt;
      setElapsed(t);
      if (t < marks[3] + 200) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [startedAt]);

  const running = startedAt !== null && elapsed < marks[3];
  const done = startedAt !== null && elapsed >= marks[3];
  const stageOf = (i: number) => {
    if (startedAt === null) return 'idle';
    if (elapsed >= marks[i]) return 'done';
    if (i === 0 || elapsed >= marks[i - 1]) return 'working';
    return 'waiting';
  };

  /* Lines of the report type out during the last agent's turn. */
  const reportText = result.report.join('\n');
  const typedTo =
    startedAt === null ? 0 : Math.max(0, Math.min(1, (elapsed - marks[2]) / (marks[3] - marks[2]))) * reportText.length;
  const typed = reportText.slice(0, Math.round(typedTo)).split('\n');

  const chartOn = startedAt !== null && elapsed >= marks[1];
  const max = Math.max(...data.values);
  const top = Math.ceil(max / 20) * 20;

  /* The preview runs both datasets in turn. */
  const { ref: stageRef, playing } = usePlaying<HTMLDivElement>(preview);
  const [loop, setLoop] = useState(0);
  useEffect(() => {
    if (!preview || !playing) return;
    const go = window.setTimeout(() => run(datasets[loop % datasets.length].id), 600);
    const again = window.setTimeout(() => setLoop((n) => n + 1), 8500);
    return () => {
      window.clearTimeout(go);
      window.clearTimeout(again);
    };
  }, [preview, playing, loop, run]);

  const ui = (
    <DemoWindow
      app={T.app}
      context="AutoGen Studio"
      className={preview ? 'dm--preview' : undefined}
      actions={
        <span className="dm-bar__actions">
          <span className="dm-seg" role="group" aria-label={T.dataset}>
            {datasets.map((d) => (
              <button
                key={d.id}
                type="button"
                aria-pressed={dataId === d.id}
                disabled={running}
                onClick={() => {
                  setDataId(d.id);
                  setStartedAt(null);
                }}
              >
                {T.data[d.id].name}
              </button>
            ))}
          </span>
          {!preview && (
            <button
              type="button"
              className="dm-btn"
              data-primary=""
              disabled={running}
              onClick={() => {
                run();
                trackDemo(`agents: ran ${en.data[data.id].name.toLowerCase()}`);
              }}
            >
              {done ? T.again : T.run}
            </button>
          )}
        </span>
      }
    >
      <div className="dm-agents">
        <ol className="dm-pipe">
          {T.agents.map(([name, job], i) => {
            const state = stageOf(i);
            return (
              <li key={name} className="dm-agent" data-state={state}>
                <span className="dm-agent__num tnum">{i + 1}</span>
                <span className="dm-agent__text">
                  <b>{name}</b>
                  <small>
                    {state === 'idle' || state === 'waiting' ? job : state === 'working' ? T.working : result.log[i][result.log[i].length - 1]}
                  </small>
                </span>
              </li>
            );
          })}
        </ol>

        <div className="dm-agents__out">
          <section className="dm-panel">
            <div className="dm-panel__head">
              <b>{words.name}</b>
              <span dir="ltr">{data.file}</span>
            </div>
            <svg
              className="dm-cols"
              data-on={chartOn ? '' : undefined}
              viewBox="0 0 400 180"
              role="img"
              aria-label={T.chart(words.name, words.period, words.labels.map((l, i) => `${l} ${data.fmt(data.values[i])}`).join(', '))}
            >
              <line x1="0" y1="150" x2="400" y2="150" className="dm-cols__base" />
              {data.values.map((v, i) => {
                const w = 400 / data.values.length;
                const h = (v / top) * 130;
                const peak = i === result.peakAt;
                return (
                  <g key={`${data.id}-${i}`}>
                    <rect
                      x={i * w + w * 0.18}
                      y={150 - h}
                      width={w * 0.64}
                      height={h}
                      rx="2"
                      className={peak ? 'dm-cols__peak' : 'dm-cols__bar'}
                      style={{ transitionDelay: `${i * 40}ms` }}
                    >
                      <title>{`${words.labels[i]}: ${data.fmt(v)}`}</title>
                    </rect>
                    <text x={i * w + w / 2} y="168" textAnchor="middle" className="dm-cols__label">
                      {words.labels[i]}
                    </text>
                    {peak && chartOn && (
                      <text x={i * w + w / 2} y={150 - h - 6} textAnchor="middle" className="dm-cols__value">
                        {data.fmt(v)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </section>

          <section className="dm-panel">
            <div className="dm-panel__head">
              <b>{T.insight}</b>
              <span>{done ? T.ready : running ? T.writing : T.notRun}</span>
            </div>
            {startedAt === null ? (
              <p className="dm-note">{T.intro}</p>
            ) : (
              <ol className="dm-report">
                {result.report.map((line, i) => (
                  <li key={i} data-on={typed[i] ? '' : undefined}>
                    {typed[i] ?? ''}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
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

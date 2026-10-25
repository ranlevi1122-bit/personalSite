'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { trackDemo } from '@/lib/analytics/client';
import { DemoWindow, ScaledStage, usePlaying, type DemoMode } from './shared';

/**
 * The multi-agent analyst as a run you can start: four agents hand the work
 * on in turn, and the chart and the report come out of the data itself, so
 * every figure in the report adds up. The datasets are samples.
 */

interface Dataset {
  id: string;
  name: string;
  file: string;
  labels: string[];
  values: number[];
  fmt: (v: number) => string;
  /** What the period is called in the report. */
  period: string;
}

const datasets: Dataset[] = [
  {
    id: 'sales',
    name: 'Shop sales',
    file: 'sales_2025.csv',
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    values: [42, 39, 45, 48, 51, 47, 58, 61, 54, 50, 56, 72],
    fmt: (v) => `₪${Math.round(v)}k`,
    period: 'month',
  },
  {
    id: 'tickets',
    name: 'Support tickets',
    file: 'tickets_10_weeks.csv',
    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10'],
    values: [120, 132, 128, 141, 150, 138, 162, 171, 158, 185],
    fmt: (v) => `${Math.round(v)}`,
    period: 'week',
  },
];

const agents = [
  { name: 'Data agent', job: 'Loads and checks the file' },
  { name: 'Analysis agent', job: 'Finds what moved and ranks it' },
  { name: 'Visualisation agent', job: 'Charts the findings' },
  { name: 'Interpretation agent', job: 'Writes the business report' },
];

/** When each agent finishes, in ms from the start of a run. */
const marks = [900, 2000, 3000, 4800];

function analyse(d: Dataset) {
  const n = d.values.length;
  const sum = d.values.reduce((a, b) => a + b, 0);
  const avg = sum / n;
  const peak = Math.max(...d.values);
  const low = Math.min(...d.values);
  const peakAt = d.values.indexOf(peak);
  const lowAt = d.values.indexOf(low);
  const half = Math.floor(n / 2);
  const h1 = d.values.slice(0, half).reduce((a, b) => a + b, 0);
  const h2 = d.values.slice(n - half).reduce((a, b) => a + b, 0);
  const change = (h2 / h1 - 1) * 100;
  const above = (peak / avg - 1) * 100;
  const step = (d.values[n - 1] - d.values[0]) / (n - 1);

  const report = [
    `${d.labels[peakAt]} is the peak at ${d.fmt(peak)}, ${above.toFixed(0)}% above the ${d.period}ly average of ${d.fmt(avg)}.`,
    `The second half ${change >= 0 ? 'grew' : 'fell'} ${Math.abs(change).toFixed(0)}% on the first, from ${d.fmt(h1)} to ${d.fmt(h2)}.`,
    d.id === 'sales'
      ? `Plan stock and staff for ${d.labels[peakAt]}; ${d.labels[lowAt]}, the low at ${d.fmt(low)}, is the month to promote.`
      : `If the trend holds, plan for about ${d.fmt(d.values[n - 1] + step)} tickets next week, ${d.fmt(step)} more each week.`,
  ];

  const log = [
    [`Reading ${d.file}`, `${n} rows, 2 columns, no gaps.`],
    [`Average ${d.fmt(avg)} a ${d.period}, range ${d.fmt(low)} to ${d.fmt(peak)}.`, 'Three findings, ranked by size.'],
    [`Column chart, ${d.labels[peakAt]} marked as the peak.`],
    ['Report written in plain language.'],
  ];

  return { peakAt, report, log };
}

export function Agents({ mode = 'full' }: { mode?: DemoMode }) {
  const preview = mode === 'preview';
  const [dataId, setDataId] = useState(datasets[0].id);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const raf = useRef(0);

  const data = datasets.find((d) => d.id === dataId)!;
  const result = useMemo(() => analyse(data), [data]);

  const run = useCallback((id?: string) => {
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
      app="AI Data Analyst"
      context="AutoGen Studio"
      className={preview ? 'dm--preview' : undefined}
      actions={
        <span className="dm-bar__actions">
          <span className="dm-seg" role="group" aria-label="Dataset">
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
                {d.name}
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
                trackDemo(`agents: ran ${data.name.toLowerCase()}`);
              }}
            >
              {done ? 'Run again' : 'Run the analysis'}
            </button>
          )}
        </span>
      }
    >
      <div className="dm-agents">
        <ol className="dm-pipe">
          {agents.map((a, i) => {
            const state = stageOf(i);
            return (
              <li key={a.name} className="dm-agent" data-state={state}>
                <span className="dm-agent__num tnum">{i + 1}</span>
                <span className="dm-agent__text">
                  <b>{a.name}</b>
                  <small>
                    {state === 'idle' || state === 'waiting' ? a.job : state === 'working' ? 'Working…' : result.log[i][result.log[i].length - 1]}
                  </small>
                </span>
              </li>
            );
          })}
        </ol>

        <div className="dm-agents__out">
          <section className="dm-panel">
            <div className="dm-panel__head">
              <b>{data.name}</b>
              <span>{data.file}</span>
            </div>
            <svg
              className="dm-cols"
              data-on={chartOn ? '' : undefined}
              viewBox="0 0 400 180"
              role="img"
              aria-label={`${data.name} by ${data.period}: ${data.labels.map((l, i) => `${l} ${data.fmt(data.values[i])}`).join(', ')}`}
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
                      <title>{`${data.labels[i]}: ${data.fmt(v)}`}</title>
                    </rect>
                    <text x={i * w + w / 2} y="168" textAnchor="middle" className="dm-cols__label">
                      {data.labels[i]}
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
              <b>Insight report</b>
              <span>{done ? 'Ready' : running ? 'Being written' : 'Not run yet'}</span>
            </div>
            {startedAt === null ? (
              <p className="dm-note">Choose a dataset and run the analysis. Four agents take it from the raw file to this report.</p>
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

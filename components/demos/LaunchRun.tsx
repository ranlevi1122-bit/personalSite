'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { trackDemo } from '@/lib/analytics/client';
import { DemoMessage, DemoWindow, ScaledStage, usePlaying, useTicker, type DemoMode } from './shared';

/**
 * One launch, run by hand: eight agents take a single product photo to a
 * checked landing page, the validator sends three claims back for rewriting,
 * and five people sign off. Every output shown is the system's reference
 * launch, translated from Hebrew; nothing is generated here.
 */

const agents = [
  { name: 'Product intelligence', job: 'Reads the photo and separates fact from guesswork' },
  { name: 'Brand guardian', job: 'Checks the fit with the brand book' },
  { name: 'Audience and positioning', job: 'Finds the readers and the design worlds' },
  { name: 'Creative strategy', job: 'Turns the position into a concept' },
  { name: 'Content', job: 'Writes the page and every other text' },
  { name: 'Landing page builder', job: 'Orders the sections and the visuals' },
  { name: 'Technical validator', job: 'Checks every claim against a source' },
  { name: 'Launch QA', job: 'Seven quality checks before people see it' },
];

const claims = [
  {
    before: 'Every tap is handmade and one of a kind.',
    after: 'A bamboo-look arch over a brushed warm-bronze base.',
    why: 'A collection claim stated as a fact about this item.',
  },
  {
    before: 'Made in Italy by Gessi’s craftsmen.',
    after: 'From Gessi’s Haute Culture collection.',
    why: 'No source for the country of manufacture.',
  },
  {
    before: 'It stays beautiful and durable for years, even with daily water.',
    after: 'An object that feels more like a collector’s piece than plumbing.',
    why: 'A durability claim with no data, on an unverified material.',
  },
];

const qaChecks: [string, 'Pass' | 'Warn'][] = [
  ['Brand', 'Pass'],
  ['Product', 'Pass'],
  ['Audience', 'Pass'],
  ['Positioning', 'Pass'],
  ['Technical integrity', 'Warn'],
  ['Consistency', 'Pass'],
  ['Scalability', 'Warn'],
];

const roles = ['Product', 'Marketing', 'Creative', 'Commerce'] as const;
type Role = (typeof roles)[number];

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

const stateText: Record<State, string> = {
  waiting: 'Waiting',
  working: 'Working…',
  flagged: '3 claims without a source',
  revising: 'Rewriting',
  done: 'Done',
};

function Output({ i, t }: { i: number; t: number }): ReactNode {
  switch (i) {
    case 0:
      return (
        <>
          <p className="lr-lead">
            A basin mixer with a bamboo-look arched spout rising from a low, brushed warm-bronze base, with a side lever.
            A sculptural object, not a quiet tap.
          </p>
          <dl className="lr-counts">
            <div data-k="ok">
              <dt>Verified</dt>
              <dd className="tnum">0</dd>
              <small>The run started from a photo only</small>
            </div>
            <div data-k="infer">
              <dt>From the photo</dt>
              <dd className="tnum">6</dd>
              <small>Worded as appearance, not fact</small>
            </div>
            <div data-k="miss">
              <dt>Missing</dt>
              <dd className="tnum">11</dd>
              <small>Left blank, never filled in</small>
            </div>
          </dl>
          <p className="lr-note">
            <b>Found online, pending approval:</b> Gessi Jacqueline 77201, finish 726 warm bronze.
          </p>
        </>
      );
    case 1:
      return (
        <>
          <p className="lr-lead">
            Fit with the brand: <b>strong</b>.
          </p>
          <ul className="lr-list">
            <li>
              <b>Tone:</b> quiet, confident and precise. Luxury in the details, not in superlatives.
            </li>
            <li>
              <b>Avoid until the product team approves:</b> “real bamboo”, “natural material”, “handmade”,
              “water-saving”.
            </li>
          </ul>
        </>
      );
    case 2:
      return (
        <>
          <p className="lr-lead">“The one detail that gives a bathroom its identity.”</p>
          <p className="lr-label">Three readers</p>
          <div className="lr-chips">
            <span>Private clients building or renovating</span>
            <span>Architects and interior designers</span>
            <span>Developers and projects</span>
          </div>
          <p className="lr-label">Four design worlds</p>
          <div className="lr-chips">
            <span>Refined classic · main bathroom</span>
            <span>Warm modern · guest WC</span>
            <span>Natural · wood and stone</span>
            <span>Bold and artistic · boutique suite</span>
          </div>
        </>
      );
    case 3:
      return (
        <>
          <p className="lr-label">Concept</p>
          <p className="lr-lead">The Telling Detail</p>
          <p className="lr-label">Headline</p>
          <p className="lr-big">One detail. And the whole space tells a story.</p>
          <p className="lr-note">
            In a luxury bathroom everything is already refined; what people remember is the one detail that says who lives
            there.
          </p>
        </>
      );
    case 4:
      return (
        <ul className="lr-list">
          <li>A landing page in 11 sections</li>
          <li>A description for each of the three readers</li>
          <li>A sales kit and notes for architects</li>
          <li>Three posts: Instagram, Reels and LinkedIn</li>
          <li>Search texts: title, description and topics</li>
        </ul>
      );
    case 5:
      return (
        <>
          <p className="lr-label">Section order, chosen for this product</p>
          <ol className="lr-order">
            {['Product', 'Styles', 'Insight', 'Story', 'Why', 'Value', 'Standard', 'Architects', 'Messages', 'Design', 'Specs'].map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="lr-note">
            <i className="lr-swatch" aria-hidden="true" /> Accent colour #9A7B4F, taken from the bronze · 10 assets in
            the kit
          </p>
        </>
      );
    case 6: {
      const fixed = t >= 9;
      return (
        <>
          <p className="lr-lead">
            {fixed
              ? 'Revision round done: no claim is left without a source.'
              : 'Three claims have no source. They go back to the content and page agents.'}
          </p>
          <ul className="lr-claims">
            {claims.map((c) => (
              <li key={c.before} data-fixed={fixed ? '' : undefined}>
                <s>{c.before}</s>
                {fixed && <span className="lr-claims__new">{c.after}</span>}
                <small>{c.why}</small>
              </li>
            ))}
          </ul>
          {fixed && (
            <p className="lr-note tnum">23 claims checked: 0 without a source, 16 pending approval, 7 inferred from the photo.</p>
          )}
        </>
      );
    }
    default:
      return (
        <>
          <ul className="lr-qa">
            {qaChecks.map(([name, r]) => (
              <li key={name} data-r={r}>
                <span>{name}</span>
                <b>{r}</b>
              </li>
            ))}
          </ul>
          <p className="lr-note">Verdict: ready for the teams. The two warnings travel with the launch to sign-off.</p>
        </>
      );
  }
}

export function LaunchRun({ mode = 'full' }: { mode?: DemoMode }) {
  const preview = mode === 'preview';
  const [t, setT] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [approved, setApproved] = useState<Record<Role, boolean>>({ Product: false, Marketing: false, Creative: false, Commerce: false });
  const [asking, setAsking] = useState(false);
  const [launched, setLaunched] = useState(false);

  const running = t !== null && t < END;
  const reviewed = t === END;
  const teamsDone = roles.every((r) => approved[r]);
  /* The agent that finished last, which the panel follows until one is picked. */
  const latest = t === null || t === 0 ? null : t <= 6 ? t - 1 : t < END ? 6 : 7;
  const shown = picked ?? latest;

  const reset = useCallback(() => {
    setT(null);
    setPicked(null);
    setApproved({ Product: false, Marketing: false, Creative: false, Commerce: false });
    setAsking(false);
    setLaunched(false);
  }, []);

  const run = () => {
    reset();
    setT(0);
    if (!preview) trackDemo('launch: ran the agents');
  };

  useTicker(running, preview ? 650 : 800, () => setT((v) => (v === null ? v : Math.min(END, v + 1))));

  const approve = (r: Role) => {
    setApproved((a) => ({ ...a, [r]: !a[r] }));
    if (!preview && !approved[r]) trackDemo(`launch: approved as ${r.toLowerCase()}`);
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
    roles.forEach((r, i) => timers.push(window.setTimeout(() => setApproved((a) => ({ ...a, [r]: true })), runEnd + i * 550)));
    timers.push(window.setTimeout(() => setAsking(true), runEnd + 4 * 550 + 300));
    timers.push(window.setTimeout(() => { setAsking(false); setLaunched(true); }, runEnd + 4 * 550 + 1500));
    timers.push(window.setTimeout(() => setCycle((c) => c + 1), runEnd + 4 * 550 + 5200));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [preview, playing, cycle, reset]);

  const status = launched
    ? { tone: 'ok' as const, text: 'Approved for launch. The two QA warnings are logged with the approval, and the page joins the content library.' }
    : asking
      ? { tone: 'warn' as const, text: 'Launch QA left two warnings: technical integrity and scalability. People decide; the override is logged.' }
      : reviewed
        ? teamsDone
          ? { tone: 'info' as const, text: 'All four teams have signed off. The final approval launches the product.' }
          : { tone: 'info' as const, text: 'The agents are done. Each team approves its own part; click to sign off.' }
        : running
          ? { tone: 'info' as const, text: t !== null && t >= 7 && t <= 8 ? 'Revision round: the content and page agents rewrite the three flagged claims.' : `Agent ${Math.min(8, (t ?? 0) + 1)} of 8 at work.` }
          : { tone: 'info' as const, text: 'One photo, no data typed in. Run the agents and open any of them to see what it produced.' };

  const ui = (
    <DemoWindow
      app="Launch Engine"
      context="One product, from photo to launch"
      pill="Reference launch"
      className={preview ? 'dm--preview' : undefined}
      actions={
        !preview && (
          <button type="button" className="dm-btn" data-primary="" onClick={run} disabled={running}>
            {t === null ? 'Run the 8 agents' : 'Run again'}
          </button>
        )
      }
    >
      <div className="lr">
        <div className="lr-side">
          <div className="lr-product">
            <span className="lr-product__pic">
              <Image src="/work/launch-engine/product.webp" alt="The product photo: a basin tap with a bamboo-look arched spout" fill sizes="88px" />
            </span>
            <span>
              <b>Input</b>
              <small>One product photo. No data typed in.</small>
            </span>
          </div>
          <ol className="lr-agents">
            {agents.map((a, i) => {
              const s = stateOf(i, t);
              const open = s === 'done' || s === 'flagged' || (i === 6 && t !== null && t >= 7);
              return (
                <li key={a.name}>
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
                      <b>{a.name}</b>
                      <small>{s === 'waiting' && t === null ? a.job : stateText[s]}</small>
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
                <p className="lr-lead">Eight agents, in order, each with one job.</p>
                <p className="lr-note">
                  Each reads only what it needs and writes to a fixed schema. Nothing they cannot source is stated as a fact.
                </p>
              </div>
            ) : (
              <>
                <div className="dm-panel__head">
                  <b>
                    {shown + 1} · {agents[shown].name}
                  </b>
                  <span>{agents[shown].job}</span>
                </div>
                <div className="lr-out__body" key={`${shown}-${t !== null && t >= 9}`}>
                  <Output i={shown} t={t ?? 0} />
                </div>
              </>
            )}
          </section>

          <section className="dm-panel lr-sign" aria-label="Sign-off">
            <div className="dm-panel__head">
              <b>Sign-off</b>
              <span>{launched ? 'Approved for launch' : `${roles.filter((r) => approved[r]).length} of 4 teams`}</span>
            </div>
            <div className="lr-roles">
              {roles.map((r) => (
                <button key={r} type="button" aria-pressed={approved[r]} disabled={!reviewed || launched} onClick={() => approve(r)}>
                  <i aria-hidden="true">{approved[r] ? '✓' : ''}</i>
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
                {launched ? 'Launched' : 'Final approval'}
              </button>
            </div>
            {asking && !launched && (
              <div className="lr-ask">
                <span>Two QA warnings are still open.</span>
                <button type="button" className="dm-btn" data-primary="" onClick={launch}>
                  Approve anyway
                </button>
                <button type="button" className="dm-btn" onClick={() => setAsking(false)}>
                  Back
                </button>
              </div>
            )}
            {launched && (
              <div className="lr-done">
                <span className="lr-done__pic">
                  <Image src="/work/launch-engine/landing-hero.jpg" alt="The landing page this launch produced" fill sizes="160px" />
                </span>
                <span>
                  <b>The page goes live</b>
                  <small>“One detail. And the whole space tells a story.”</small>
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

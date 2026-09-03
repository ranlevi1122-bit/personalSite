'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { domainEdges, domains } from '@/data/portfolioData';
import { useInteractiveMotion, usePointerRef, useReducedMotion } from '@/lib/hooks';

const W = 560;
const H = 520;
const PAD_X = 76;
const PAD_Y = 66;

/** Resting position of each node inside the viewBox. */
const base = domains.map((d) => ({
  x: PAD_X + d.x * (W - PAD_X * 2),
  y: PAD_Y + d.y * (H - PAD_Y * 2),
}));

/** Distance at which the cursor starts to influence a node. */
const INFLUENCE = 170;

interface NodeRefs {
  group: SVGGElement | null;
  halo: SVGCircleElement | null;
  ring: SVGCircleElement | null;
  core: SVGCircleElement | null;
  label: SVGTextElement | null;
}

/**
 * The five domains Ran works across, drawn as a connected system.
 *
 * All per-frame work (node drift, cursor proximity emphasis, edge weighting,
 * travelling signals) happens inside one rAF loop writing directly to SVG
 * attributes. React state changes only when the *focused* node changes.
 */
export function HeroGraph() {
  const interactive = useInteractiveMotion();
  const reduced = useReducedMotion();
  const pointer = usePointerRef(interactive);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const nodeRefs = useRef<NodeRefs[]>(domains.map(() => ({ group: null, halo: null, ring: null, core: null, label: null })));
  const edgeRefs = useRef<(SVGLineElement | null)[]>([]);
  const pulseRefs = useRef<(SVGCircleElement | null)[]>([]);

  const [active, setActive] = useState<number>(0);
  /** Set while the pointer (or keyboard focus) is driving the selection. */
  const userDriven = useRef(false);
  const activeRef = useRef(0);
  activeRef.current = active;

  /* ---- Ambient rotation of the caption when the user is not pointing ---- */
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      if (userDriven.current) return;
      setActive((i) => (i + 1) % domains.length);
    }, 3600);
    return () => window.clearInterval(id);
  }, [reduced]);

  /* ---- The single animation loop --------------------------------------- */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Signals travel along a subset of edges so the graph reads as a system
    // with flow, not a static constellation.
    const signalEdges = [0, 2, 5, 7];
    const positions = base.map((p) => ({ ...p }));
    const emphasis = new Array(domains.length).fill(0);

    let raf = 0;
    let t = 0;
    let lastPick = -1;

    const frame = () => {
      t += 1;

      // 1. Resolve pointer position into viewBox coordinates.
      let px = -9999;
      let py = -9999;
      if (interactive && pointer.current.active) {
        const r = svg.getBoundingClientRect();
        if (r.width > 0) {
          px = ((pointer.current.x - r.left) / r.width) * W;
          py = ((pointer.current.y - r.top) / r.height) * H;
        }
      }

      // 2. Node positions: slow organic drift, then a nudge toward the cursor.
      let nearest = -1;
      let nearestDist = Infinity;

      for (let i = 0; i < domains.length; i++) {
        const driftX = reduced ? 0 : Math.sin(t * 0.0055 + i * 1.7) * 6.5;
        const driftY = reduced ? 0 : Math.cos(t * 0.0043 + i * 2.3) * 5.5;

        const bx = base[i].x + driftX;
        const by = base[i].y + driftY;

        const dx = px - bx;
        const dy = py - by;
        const dist = Math.hypot(dx, dy);

        // Proximity in 0..1, eased.
        const prox = dist < INFLUENCE ? Math.pow(1 - dist / INFLUENCE, 1.8) : 0;
        emphasis[i] += (prox - emphasis[i]) * 0.12;

        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = i;
        }

        // Nodes lean gently toward the cursor.
        positions[i].x = bx + (dist < INFLUENCE ? (dx / Math.max(dist, 1)) * emphasis[i] * 9 : 0);
        positions[i].y = by + (dist < INFLUENCE ? (dy / Math.max(dist, 1)) * emphasis[i] * 9 : 0);

        const refs = nodeRefs.current[i];
        const e = emphasis[i];
        const isActive = activeRef.current === i;
        const lift = Math.max(e, isActive ? 0.72 : 0);

        if (refs.group) refs.group.setAttribute('transform', `translate(${positions[i].x.toFixed(2)} ${positions[i].y.toFixed(2)})`);
        if (refs.halo) {
          refs.halo.setAttribute('r', (26 + lift * 26).toFixed(2));
          refs.halo.setAttribute('opacity', (0.05 + lift * 0.4).toFixed(3));
        }
        if (refs.ring) {
          refs.ring.setAttribute('r', (13 + lift * 4.5).toFixed(2));
          refs.ring.setAttribute('opacity', (0.44 + lift * 0.56).toFixed(3));
          refs.ring.setAttribute('stroke-width', (1 + lift * 0.6).toFixed(2));
        }
        if (refs.core) {
          refs.core.setAttribute('r', (3.4 + lift * 2.4).toFixed(2));
          refs.core.setAttribute('opacity', (0.55 + lift * 0.45).toFixed(3));
        }
        if (refs.label) {
          refs.label.setAttribute('opacity', (0.52 + lift * 0.48).toFixed(3));
        }
      }

      // 3. Edges follow the nodes; weight rises with the emphasis of both ends.
      for (let k = 0; k < domainEdges.length; k++) {
        const line = edgeRefs.current[k];
        if (!line) continue;
        const [a, b] = domainEdges[k];
        line.setAttribute('x1', positions[a].x.toFixed(2));
        line.setAttribute('y1', positions[a].y.toFixed(2));
        line.setAttribute('x2', positions[b].x.toFixed(2));
        line.setAttribute('y2', positions[b].y.toFixed(2));
        const w = Math.max(emphasis[a], emphasis[b]);
        line.setAttribute('opacity', (0.17 + w * 0.5).toFixed(3));
      }

      // 4. Signals travelling between domains.
      if (!reduced) {
        for (let s = 0; s < signalEdges.length; s++) {
          const dot = pulseRefs.current[s];
          if (!dot) continue;
          const [a, b] = domainEdges[signalEdges[s]];
          const phase = ((t * 0.0032 + s * 0.31) % 1 + 1) % 1;
          const x = positions[a].x + (positions[b].x - positions[a].x) * phase;
          const y = positions[a].y + (positions[b].y - positions[a].y) * phase;
          dot.setAttribute('cx', x.toFixed(2));
          dot.setAttribute('cy', y.toFixed(2));
          // Fade in and out at the ends of the run.
          dot.setAttribute('opacity', (Math.sin(phase * Math.PI) * 0.85).toFixed(3));
        }
      }

      // 5. Promote the nearest node to "active" — the only React state write.
      if (interactive && pointer.current.active) {
        const pick = nearestDist < INFLUENCE ? nearest : -1;
        if (pick !== -1 && pick !== lastPick) {
          lastPick = pick;
          userDriven.current = true;
          setActive(pick);
        } else if (pick === -1) {
          lastPick = -1;
          userDriven.current = false;
        }
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [interactive, reduced, pointer]);

  const activeDomain = domains[active];

  return (
    <figure className="relative m-0 w-full select-none" aria-labelledby="hero-graph-caption">
      <div className="relative mx-auto w-full max-w-[560px]" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="h-full w-full overflow-visible"
          role="img"
          aria-label="A connected system of five domains: Projects, Systems, Data, Operations and People."
        >
          <defs>
            <radialGradient id="node-halo" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#7b8cff" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#7b8cff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="graph-bloom" cx="50%" cy="45%">
              <stop offset="0%" stopColor="#7b8cff" stopOpacity="0.13" />
              <stop offset="55%" stopColor="#56d6c4" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#7b8cff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ambient bloom behind the graph */}
          <ellipse cx={W / 2} cy={H / 2} rx={W * 0.52} ry={H * 0.48} fill="url(#graph-bloom)" />

          {/* Concentric guides — quiet structure, not decoration */}
          <g stroke="rgba(255,255,255,0.045)" fill="none">
            <circle cx={W / 2} cy={H / 2} r={168} />
            <circle cx={W / 2} cy={H / 2} r={228} strokeDasharray="2 8" />
          </g>

          {/* Edges */}
          <g strokeLinecap="round">
            {domainEdges.map((edge, k) => (
              <line
                key={`edge-${edge[0]}-${edge[1]}`}
                ref={(el) => {
                  edgeRefs.current[k] = el;
                }}
                stroke="#7b8cff"
                strokeWidth={1}
                opacity={0.12}
              />
            ))}
          </g>

          {/* Travelling signals */}
          {!reduced && (
            <g>
              {[0, 1, 2, 3].map((s) => (
                <circle
                  key={`pulse-${s}`}
                  ref={(el) => {
                    pulseRefs.current[s] = el;
                  }}
                  r={2.2}
                  fill="#56d6c4"
                  opacity={0}
                />
              ))}
            </g>
          )}

          {/* Nodes */}
          {domains.map((d, i) => (
            <g
              key={d.id}
              ref={(el) => {
                nodeRefs.current[i].group = el;
              }}
              transform={`translate(${base[i].x} ${base[i].y})`}
              tabIndex={0}
              role="button"
              aria-label={`${d.label}. ${d.line}`}
              className="cursor-default outline-none [&:focus-visible>circle:nth-child(2)]:stroke-white"
              onFocus={() => {
                userDriven.current = true;
                setActive(i);
              }}
              onBlur={() => {
                userDriven.current = false;
              }}
              onPointerEnter={() => {
                userDriven.current = true;
                setActive(i);
              }}
            >
              <circle ref={(el) => { nodeRefs.current[i].halo = el; }} r={26} fill="url(#node-halo)" opacity={0.06} />
              <circle
                ref={(el) => { nodeRefs.current[i].ring = el; }}
                r={13}
                fill="rgba(7,8,11,0.85)"
                stroke="#7b8cff"
                strokeWidth={1}
                opacity={0.35}
              />
              <circle ref={(el) => { nodeRefs.current[i].core = el; }} r={3.4} fill="#a3afff" opacity={0.6} />
              <text
                ref={(el) => { nodeRefs.current[i].label = el; }}
                y={38}
                textAnchor="middle"
                className="font-mono"
                fill="#f4f6fa"
                fontSize={10.5}
                letterSpacing="0.16em"
                opacity={0.45}
              >
                {d.label.toUpperCase()}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Caption — reads out the meaning of the highlighted domain */}
      <figcaption
        id="hero-graph-caption"
        className="relative mx-auto mt-2 flex min-h-[52px] max-w-[420px] items-start justify-center px-4 text-center"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={activeDomain.id}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="block"
          >
            <span className="label label-accent">{activeDomain.label}</span>
            <span className="mt-2 block text-[14px] leading-snug text-muted">{activeDomain.line}</span>
          </motion.span>
        </AnimatePresence>
      </figcaption>

      {/* Screen-reader summary of the whole system */}
      <ul className="sr-only">
        {domains.map((d) => (
          <li key={d.id}>
            {d.label}: {d.line}
          </li>
        ))}
      </ul>
    </figure>
  );
}

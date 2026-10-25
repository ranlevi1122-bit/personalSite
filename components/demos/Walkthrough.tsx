'use client';

import Image from 'next/image';
import { useEffect, useState, type CSSProperties } from 'react';
import { trackDemo } from '@/lib/analytics/client';
import type { PrototypeStep } from '@/data/portfolioData';
import { DemoWindow, ScaledStage, usePlaying, type DemoMode } from './shared';

/**
 * A guided tour of a real system's screens: each step pans and zooms to the
 * part it is about and rings it. Plays by itself while on screen; any step can
 * be picked by hand, which stops the tour.
 */

const STEP_MS = 5200;

/** Pan and zoom that bring one area of a screenshot to the middle of the frame. */
function focusStyle(f: PrototypeStep['focus']): CSSProperties {
  const s = Math.max(1, Math.min(100 / f.w, 100 / f.h) * 0.92);
  const clamp = (v: number) => Math.min(0, Math.max(100 - 100 * s, v));
  const tx = clamp(50 - s * (f.x + f.w / 2));
  const ty = clamp(50 - s * (f.y + f.h / 2));
  return { transform: `translate(${tx}%, ${ty}%) scale(${s})`, ['--s' as string]: s };
}

export function Walkthrough({
  steps,
  track,
  app,
  context,
  pill,
  aspect,
  previewAspect,
  mode = 'full',
}: {
  steps: PrototypeStep[];
  /** The name the analytics give this tour. */
  track: string;
  app: string;
  context: string;
  pill: string;
  /** Width / height of the screenshots, as a CSS aspect ratio. */
  aspect: string;
  /** The frame's shape in the 800 x 600 preview, when the screenshots are too tall to fit whole. */
  previewAspect?: string;
  mode?: DemoMode;
}) {
  const preview = mode === 'preview';
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  const { ref, playing } = usePlaying<HTMLDivElement>(true);
  const step = steps[index];
  const images = [...new Set(steps.map((s) => s.image))];

  useEffect(() => {
    if (!auto || !playing) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % steps.length), STEP_MS);
    return () => window.clearTimeout(id);
  }, [auto, playing, index, steps.length]);

  const go = (i: number) => {
    setIndex(i);
    setAuto(false);
    trackDemo(`${track}: walkthrough step ${i + 1}`);
  };

  const frame = (
    <div className="wt-frame" data-ui="" style={{ aspectRatio: preview ? (previewAspect ?? aspect) : aspect }}>
      <div className="wt-frame__pan" style={focusStyle(step.focus)}>
        {images.map((src) => {
          const s = steps.find((x) => x.image === src)!;
          return (
            <Image
              key={src}
              src={src}
              alt={src === step.image ? step.alt : ''}
              width={s.width}
              height={s.height}
              sizes={preview ? '(max-width: 900px) 100vw, 58vw' : '(max-width: 1400px) 100vw, 1360px'}
              data-on={src === step.image ? '' : undefined}
            />
          );
        })}
        <span
          className="wt-frame__ring"
          aria-hidden="true"
          style={{ left: `${step.focus.x}%`, top: `${step.focus.y}%`, width: `${step.focus.w}%`, height: `${step.focus.h}%` }}
        />
      </div>
    </div>
  );

  if (preview) {
    return (
      <div ref={ref} inert>
        <ScaledStage width={800} height={600}>
          <DemoWindow app={app} context={context} pill={pill} className="dm--preview wt-preview">
            {frame}
            <div className="wt-preview__caption">
              <span className="tnum">
                Step {index + 1} of {steps.length}
              </span>
              <b>{step.title}</b>
              <p>{step.body}</p>
            </div>
          </DemoWindow>
        </ScaledStage>
      </div>
    );
  }

  return (
    <div ref={ref} className="wt" data-demo="">
      {frame}
      <ol className="wt-steps" style={{ ['--n' as string]: steps.length }}>
        {steps.map((s, i) => (
          <li key={s.title}>
            <button
              type="button"
              className="wt-step"
              aria-current={i === index ? 'step' : undefined}
              onClick={() => go(i)}
              style={{ ['--run' as string]: `${STEP_MS}ms` }}
              data-auto={auto && playing && i === index ? '' : undefined}
            >
              <b>{s.title}</b>
              <span className="wt-step__body">{s.body}</span>
              <i className="wt-step__bar" aria-hidden="true" key={`${index}-${auto}`} />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

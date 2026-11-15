import { createElement } from 'react';
import { Reveal } from '@/components/ui/Reveal';

/**
 * A heading whose lines rise from behind their own baselines as it scrolls
 * into view. Each entry of `lines` is one authored line. A section that opens
 * a chapter of the page carries that chapter, its number and name, above it.
 */
export function Lines({
  lines,
  as = 'h2',
  id,
  className = 't-head',
  chapter,
}: {
  lines: readonly string[];
  as?: 'h1' | 'h2' | 'h3';
  id?: string;
  className?: string;
  chapter?: { n: string; name: string };
}) {
  return (
    <Reveal className="reveal--lines">
      {chapter && (
        <p className="chapter">
          <span className="chapter__n tnum">{chapter.n}</span>
          {chapter.name}
        </p>
      )}
      {createElement(
        as,
        { id, className, style: { margin: 0 } },
        lines.map((line) => (
          <span key={line} className="lm">
            <span>{line}</span>
          </span>
        )),
      )}
    </Reveal>
  );
}

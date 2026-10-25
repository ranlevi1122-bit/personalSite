import { createElement } from 'react';
import { Reveal } from '@/components/ui/Reveal';

/**
 * A heading whose lines rise from behind their own baselines as it scrolls
 * into view. Each entry of `lines` is one authored line.
 */
export function Lines({
  lines,
  as = 'h2',
  id,
  className = 't-head',
}: {
  lines: readonly string[];
  as?: 'h1' | 'h2' | 'h3';
  id?: string;
  className?: string;
}) {
  return (
    <Reveal className="reveal--lines">
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

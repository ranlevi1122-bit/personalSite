'use client';

import {
  Fragment,
  Children,
  cloneElement,
  createElement,
  isValidElement,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { observeReveal } from '@/lib/revealObserver';


type Tag = 'div' | 'ul' | 'ol' | 'li' | 'span' | 'section' | 'header' | 'article';

type RevealMode = 'rise' | 'fade' | 'clip' | 'left' | 'scale';

const modeClass: Record<RevealMode, string> = {
  rise: 'reveal-rise',
  fade: 'reveal-fade',
  clip: 'reveal-clip',
  left: 'reveal-left',
  scale: 'reveal-scale',
};

interface RevealProps {
  children: ReactNode;
  mode?: RevealMode;
  delay?: number;
  duration?: number;
  className?: string;
  as?: Tag;
}

/**
 * Scroll-triggered entrance driven by a shared IntersectionObserver and a CSS
 * transition — cheap enough to use a hundred times on one page.
 *
 * `distance` is no longer a prop; the offsets live in the CSS variants so the
 * whole site moves by the same amounts.
 */
export function Reveal({
  children,
  mode = 'rise',
  delay = 0,
  duration,
  className = '',
  as = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => observeReveal(ref.current), []);

  const style: CSSProperties = {};
  if (delay) style.transitionDelay = `${delay}s`;
  if (duration) style.transitionDuration = `${duration}s`;

  return createElement(
    as,
    { ref, className: `reveal ${modeClass[mode]} ${className}`.trim(), style },
    children,
  );
}

/**
 * Staggered group. The container is observed once and its children pick up
 * an incremental transition-delay from their index.
 */
export function Stagger({
  children,
  className = '',
  gap = 0.07,
  delay = 0,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
  delay?: number;
  as?: Tag;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => observeReveal(ref.current), []);

  // Hand each child its position so the CSS can offset it.
  let i = 0;
  const indexed = Children.map(children, (child) =>
    isValidElement<{ index?: number }>(child) ? cloneElement(child, { index: i++ }) : child,
  );

  return createElement(
    as,
    {
      ref,
      className: `reveal-group ${className}`.trim(),
      style: { '--stagger-gap': `${gap}s`, '--stagger-delay': `${delay}s` } as CSSProperties,
    },
    indexed,
  );
}

export function StaggerItem({
  children,
  className = '',
  as = 'div',
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  as?: Tag;
  /** Injected by <Stagger>; drives this item's transition delay. */
  index?: number;
}) {
  return createElement(
    as,
    {
      className: `reveal-item ${className}`.trim(),
      style: { '--i': index } as CSSProperties,
    },
    children,
  );
}

/**
 * Word-by-word headline reveal, each word clipped by its own overflow box.
 *
 * Pure CSS on purpose: this is the largest contentful paint on the page, and
 * animating it in JavaScript kept the headline invisible until the bundle had
 * loaded. The markup ships visible-by-default and the animation starts at
 * first paint.
 */
export function HeadlineReveal({
  text,
  className = '',
  textClassName = '',
  delay = 0,
  split = true,
}: {
  text: string;
  /** Applied to the line wrapper. */
  className?: string;
  /**
   * Applied to the element that directly contains the text. A gradient clipped
   * to text has to live here — `background-clip: text` does not reach into
   * descendant inline-blocks, which is exactly what each clipped word is.
   */
  textClassName?: string;
  delay?: number;
  /** false reveals the line as one unit instead of word by word. */
  split?: boolean;
}) {
  const words = split ? text.split(' ') : [text];

  return (
    <span className={className} style={{ '--wd': `${delay}s` } as CSSProperties}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="word-clip">
            <span className={`word ${textClassName}`.trim()} style={{ '--wi': i } as CSSProperties}>
              {word}
            </span>
          </span>
          {/* The separator lives outside the clip box: a trailing space inside
              an inline-block gets collapsed away. */}
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </span>
  );
}

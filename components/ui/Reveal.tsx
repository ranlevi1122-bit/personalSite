'use client';

import {
  Children,
  cloneElement,
  createElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react';
import { observeReveal } from '@/lib/revealObserver';

type Tag = 'div' | 'ul' | 'ol' | 'li' | 'dl' | 'span' | 'section' | 'header' | 'article' | 'figure';

/** Keeps the reveal watcher's ref and a caller's ref pointing at one node. */
function useMergedRef<T extends HTMLElement>(outer?: Ref<T>) {
  const inner = useRef<T | null>(null);
  const set = useCallback(
    (node: T | null) => {
      inner.current = node;
      if (typeof outer === 'function') outer(node);
      else if (outer) (outer as { current: T | null }).current = node;
    },
    [outer],
  );
  return [inner, set] as const;
}

interface RevealProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  children: ReactNode;
  delay?: number;
  as?: Tag;
  ref?: Ref<HTMLElement>;
}

/**
 * Rises into place once it scrolls into view: 24px and opacity, once.
 * The hidden state only applies under `html.js`, so content never stays
 * invisible if scripts fail.
 */
export function Reveal({ children, delay = 0, className = '', as = 'div', style, ref, ...rest }: RevealProps) {
  const [inner, setRef] = useMergedRef<HTMLElement>(ref);

  useEffect(() => observeReveal(inner.current), [inner]);

  return createElement(
    as,
    {
      ...rest,
      ref: setRef,
      className: `reveal ${className}`.trim(),
      style: delay ? { ...style, transitionDelay: `${delay}s` } : style,
    },
    children,
  );
}

interface StaggerProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  children: ReactNode;
  gap?: number;
  delay?: number;
  as?: Tag;
  ref?: Ref<HTMLElement>;
  'data-dragging'?: string;
}

/**
 * Staggered group: the container is watched once and each item takes its
 * delay from its index, so the parts of a section arrive in reading order.
 */
export function Stagger({
  children,
  className = '',
  gap = 0.075,
  delay = 0,
  as = 'div',
  style,
  ref,
  ...rest
}: StaggerProps) {
  const [inner, setRef] = useMergedRef<HTMLElement>(ref);

  useEffect(() => observeReveal(inner.current), [inner]);

  let i = 0;
  const indexed = Children.map(children, (child) =>
    isValidElement<{ index?: number }>(child) && child.props.index === undefined
      ? cloneElement(child, { index: i++ })
      : child,
  );

  return createElement(
    as,
    {
      ...rest,
      ref: setRef,
      className: `reveal-group ${className}`.trim(),
      style: { ...style, '--stagger-gap': `${gap}s`, '--stagger-delay': `${delay}s` } as CSSProperties,
    },
    indexed,
  );
}

export function StaggerItem({
  children,
  className = '',
  as = 'div',
  index = 0,
  style,
}: {
  children: ReactNode;
  className?: string;
  as?: Tag;
  /** Injected by <Stagger> when not given; drives this item's delay. */
  index?: number;
  style?: CSSProperties;
}) {
  return createElement(
    as,
    {
      className: `reveal-item ${className}`.trim(),
      style: { ...style, '--i': index } as CSSProperties,
    },
    children,
  );
}

'use client';

/**
 * One shared scroll watcher for every reveal on the page.
 *
 * These used to be individual framer-motion components. On a throttled mobile
 * CPU, hydrating ~70 of them dominated total blocking time, so the generic case
 * is now a CSS transition toggled from here. framer-motion is still used where
 * it earns its keep: presence transitions and the shared-layout nav indicator.
 *
 * Deliberately position-based rather than IntersectionObserver: an observer
 * only fires when an intersection threshold is *crossed*, so a fast flick, an
 * anchor jump or a restored scroll position can move an element from below the
 * viewport to above it without ever reporting it as intersecting — leaving that
 * content invisible for good. Checking position instead cannot miss.
 */

const pending = new Set<Element>();
let frame = 0;
let listening = false;

/** Reveal anything whose top has risen past 90% of the viewport height. */
function sweep() {
  frame = 0;
  const limit = window.innerHeight * 0.9;

  for (const el of pending) {
    if (el.getBoundingClientRect().top < limit) {
      el.classList.add('is-shown');
      pending.delete(el);
    }
  }

  if (pending.size === 0) stopListening();
}

function schedule() {
  if (frame) return;
  frame = requestAnimationFrame(sweep);
}

function startListening() {
  if (listening) return;
  listening = true;
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
}

function stopListening() {
  if (!listening) return;
  listening = false;
  window.removeEventListener('scroll', schedule);
  window.removeEventListener('resize', schedule);
}

/** Reveals `el` once it scrolls into view. Returns a cleanup function. */
export function observeReveal(el: Element | null): () => void {
  if (!el) return () => {};

  pending.add(el);
  startListening();
  schedule();

  return () => {
    pending.delete(el);
    if (pending.size === 0) stopListening();
  };
}

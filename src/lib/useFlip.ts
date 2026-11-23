import { useLayoutEffect, useRef } from 'react';

/**
 * Slides children to their new places when their order changes (the FLIP technique: measure
 * First, render Last, Invert with a transform, Play by removing it). Children opt in with a
 * `data-flip-id` attribute. Positions are measured relative to the container and refreshed on
 * every render, so page scrolls, layout shifts and late-loading photos never count as movement.
 * Does nothing when the user asks for reduced motion.
 */
export function useFlip<T extends HTMLElement>(orderKey: string) {
  const ref = useRef<T>(null);
  const last = useRef(new Map<string, { x: number; y: number }>());
  const lastKey = useRef(orderKey);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const kids = [...node.querySelectorAll<HTMLElement>('[data-flip-id]')];
    const reorder = lastKey.current !== orderKey;
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const next = new Map<string, { x: number; y: number }>();
    for (const el of kids) {
      const id = el.dataset.flipId!;
      // offsetLeft/Top ignore transforms, so a card still sliding is measured where it will land.
      const now = { x: el.offsetLeft, y: el.offsetTop };
      next.set(id, now);
      const before = last.current.get(id);
      if (!reorder || reduce || !before) continue;
      const dx = before.x - now.x;
      const dy = before.y - now.y;
      if (!dx && !dy) continue;
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.getBoundingClientRect(); // apply the jump before starting the slide
      el.style.transition = 'transform 420ms cubic-bezier(.2,.8,.2,1)';
      el.style.transform = '';
    }
    last.current = next;
    lastKey.current = orderKey;
  });

  return ref;
}

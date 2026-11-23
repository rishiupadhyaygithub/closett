import { useLayoutEffect, useRef } from 'react';

/**
 * Slides children to their new places when their order changes (the FLIP technique: measure
 * First, render Last, Invert with a transform, Play by removing it). Children opt in with a
 * `data-flip-id` attribute. Positions are measured relative to the container and refreshed on
 * every render, so page scrolls, layout shifts and late-loading photos never count as movement.
 * All reads happen before all writes, so a shelf of hundreds of cards costs one layout pass.
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

    // Read: offsetLeft/Top ignore transforms, so a card still sliding is measured where it will land.
    const next = new Map<string, { x: number; y: number }>();
    for (const el of kids) next.set(el.dataset.flipId!, { x: el.offsetLeft, y: el.offsetTop });

    const reorder = lastKey.current !== orderKey;
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const moving: HTMLElement[] = [];
    if (reorder && !reduce) {
      // Write: jump every moved card back to where it was.
      for (const el of kids) {
        const before = last.current.get(el.dataset.flipId!);
        const now = next.get(el.dataset.flipId!)!;
        if (!before) continue;
        const dx = before.x - now.x;
        const dy = before.y - now.y;
        if (!dx && !dy) continue;
        el.style.transition = 'none';
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        moving.push(el);
      }
      if (moving.length) {
        void node.offsetWidth; // one layout pass applies all the jumps
        // Play: slide them all home together.
        for (const el of moving) {
          el.style.transition = 'transform 420ms cubic-bezier(.2,.8,.2,1)';
          el.style.transform = '';
        }
      }
    }
    last.current = next;
    lastKey.current = orderKey;
  });

  return ref;
}

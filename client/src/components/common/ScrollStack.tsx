import React, { useEffect, useRef } from 'react';
import './ScrollStack.css';

interface ScrollStackItemProps {
  children: React.ReactNode;
  itemClassName?: string;
}

export const ScrollStackItem: React.FC<ScrollStackItemProps> = ({ children, itemClassName = '' }) => (
  <div className={`scroll-stack-card ${itemClassName}`.trim()}>{children}</div>
);

interface ScrollStackProps {
  children: React.ReactNode;
  className?: string;
  /** where cards pin, from the top of the viewport (px) */
  stackTop?: number;
  /** each pinned card sits this many px lower than the previous */
  fan?: number;
  /** scale a card reaches once the next one has stacked over it */
  minScale?: number;
}

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/**
 * Stacked-cards scroll effect. `position: sticky` does the pin (native, smooth);
 * a rAF-throttled window scroll listener only sets a small scale/dim as the next
 * card rides over. Cards sit close together — the scroll travel comes from card
 * height, so there is no big empty gap. Falls back to a plain list under
 * prefers-reduced-motion.
 *
 * Requires: no ancestor with `overflow: hidden|clip|auto|scroll` between the
 * cards and the page's scroll root, or `position: sticky` cannot engage.
 */
const ScrollStack: React.FC<ScrollStackProps> = ({
  children,
  className = '',
  stackTop = 72,
  fan = 8,
  minScale = 0.92,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const items = React.Children.toArray(children);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced()) return;

    const slots = Array.from(root.querySelectorAll<HTMLElement>('.scroll-stack-slot'));
    const cards = slots.map((s) => s.firstElementChild as HTMLElement | null);
    if (slots.length < 2) return;

    let raf = 0;
    const render = () => {
      raf = 0;
      const sy = window.scrollY;
      const tops = slots.map((s) => s.getBoundingClientRect().top + sy);

      cards.forEach((card, i) => {
        if (!card || i === cards.length - 1) return;
        const start = tops[i] - (stackTop + i * fan);
        const end = tops[i + 1] - (stackTop + (i + 1) * fan);
        const p = clamp((sy - start) / Math.max(1, end - start), 0, 1);
        const scale = 1 - p * (1 - minScale);
        card.style.transform = `scale(${scale.toFixed(4)})`;
        card.style.filter = p > 0 ? `brightness(${(1 - p * 0.06).toFixed(3)})` : '';
      });
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    render();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    root.querySelectorAll('img').forEach((img) => img.addEventListener('load', onScroll, { once: true }));

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [items.length, stackTop, fan, minScale]);

  const style = {
    ['--stack-top' as string]: `${stackTop}px`,
    ['--stack-fan' as string]: `${fan}px`,
  } as React.CSSProperties;

  return (
    <div className={`scroll-stack ${className}`.trim()} style={style} ref={rootRef}>
      {items.map((child, i) => (
        <div key={i} className="scroll-stack-slot" style={{ ['--i' as string]: i } as React.CSSProperties}>
          {child}
        </div>
      ))}
    </div>
  );
};

export default ScrollStack;

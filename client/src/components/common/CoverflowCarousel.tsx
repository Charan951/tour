import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export interface CoverflowItem {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  href: string;
}

interface Props {
  items: CoverflowItem[];
  ctaLabel?: string;
  autoPlayMs?: number;
  className?: string;
}

/**
 * Fanned "coverflow" carousel. The active card sits centered and large; its
 * near neighbours recede; the outer pair is heavily blurred and bleeds off the
 * edges as ambient texture. A "DRAG" hint sits on the active card until the
 * first interaction. Pointer-drag, arrow keys, dot bar, autoplay (paused on
 * hover/drag), and `prefers-reduced-motion` aware.
 */
export const CoverflowCarousel: React.FC<Props> = ({
  items,
  ctaLabel = 'Contact Us',
  autoPlayMs = 5000,
  className = '',
}) => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragX = useRef<number | null>(null);
  const dragMoved = useRef(false);
  const suppressClick = useRef(false);
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const count = items.length;
  const go = useCallback(
    (dir: number) => {
      setActive((i) => (i + dir + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (paused || reduce || count <= 1 || !autoPlayMs) return;
    const t = setInterval(() => setActive((i) => (i + 1) % count), autoPlayMs);
    return () => clearInterval(t);
  }, [paused, reduce, count, autoPlayMs]);

  if (count === 0) return null;

  // Shortest signed distance from `i` to `active` on the ring.
  const offsetOf = (i: number) => {
    let d = i - active;
    if (d > count / 2) d -= count;
    if (d < -count / 2) d += count;
    return d;
  };

  // Five cards on stage: centre + two near neighbours + an outer pair that is
  // lightly softened but still reads as a card.
  const layer = (o: number) => {
    const a = Math.abs(o);
    if (a === 0) return { x: 0, y: 0, scale: 1, rotY: 0, op: 1, z: 40, blur: 0 };
    if (a === 1) return { x: o * 38, y: 12, scale: 0.88, rotY: o * -6, op: 0.96, z: 30, blur: 0 };
    return { x: o * 68, y: 22, scale: 0.78, rotY: o * -9, op: 0.72, z: 20, blur: 2.5 };
  };

  const endDrag = (clientX: number | null) => {
    if (dragX.current != null && clientX != null) {
      const dx = clientX - dragX.current;
      if (Math.abs(dx) > 40) {
        go(dx < 0 ? 1 : -1);
        suppressClick.current = true; // swallow the card's click after a drag
      }
    }
    dragX.current = null;
    dragMoved.current = false;
    setDragging(false);
    setPaused(false);
  };

  return (
    <div
      className={`relative select-none overflow-x-clip ${dragging ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
      style={{ touchAction: 'pan-y' }}
      onMouseEnter={() => setPaused(true)}
      onMouseMove={() => { if (!paused) setPaused(true); }}
      onPointerEnter={() => setPaused(true)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onMouseLeave={() => { setPaused(false); if (dragX.current != null) endDrag(null); }}
      onPointerDown={(e) => {
        dragX.current = e.clientX;
        dragMoved.current = false;
        setDragging(true);
        setPaused(true);
      }}
      onPointerMove={(e) => {
        if (dragX.current == null) return;
        if (Math.abs(e.clientX - dragX.current) > 8) dragMoved.current = true;
      }}
      onPointerUp={(e) => endDrag(e.clientX)}
      onPointerCancel={() => endDrag(null)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') go(-1);
        if (e.key === 'ArrowRight') go(1);
      }}
      tabIndex={0}
      role="group"
      aria-roledescription="carousel"
      aria-label="Featured destinations"
    >
      <div
        className="relative mx-auto h-[340px] sm:h-[400px] w-full max-w-[1040px]"
        style={{ perspective: '1600px' }}
      >
        {items.map((it, i) => {
          const o = offsetOf(i);
          const { x, y, scale, rotY, op, z, blur } = layer(o);
          const isActive = o === 0;
          const hidden = Math.abs(o) > 2;
          return (
            <div
              key={it.id}
              className="absolute left-1/2 top-0 h-full w-[62vw] max-w-[240px] sm:w-[440px] sm:max-w-none"
              style={{
                transform: `translate(-50%, 0) translateX(${x}%) translateY(${y}px) scale(${scale}) rotateY(${rotY}deg)`,
                opacity: op,
                zIndex: z,
                filter: blur ? `blur(${blur}px)` : undefined,
                transition: reduce
                  ? 'none'
                  : 'transform 640ms cubic-bezier(0.16,1,0.3,1), opacity 520ms ease, filter 520ms ease',
                pointerEvents: hidden ? 'none' : 'auto',
                willChange: 'transform',
              }}
              aria-hidden={!isActive}
            >
              <Link
                to={it.href}
                tabIndex={isActive ? 0 : -1}
                onClick={(e) => {
                  if (suppressClick.current || dragMoved.current) {
                    e.preventDefault();
                    suppressClick.current = false;
                    return;
                  }
                  if (!isActive) {
                    e.preventDefault();
                    setActive(i);
                  }
                }}
                onDragStart={(e) => e.preventDefault()}
                className="group relative block h-full w-full overflow-hidden rounded-3xl2 shadow-[0_32px_70px_-20px_rgba(6,59,109,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600/50"
              >
                <img
                  src={it.image}
                  alt={it.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/90 via-ocean-900/15 to-transparent" />

                <div className="absolute inset-x-5 bottom-5 text-white">
                  <p className="font-display font-black text-xl leading-tight drop-shadow">
                    {it.title}
                  </p>
                  {it.subtitle && (
                    <p className="text-sm text-white/80 mt-0.5 line-clamp-1">{it.subtitle}</p>
                  )}
                  {isActive && (
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/10 px-4 h-9 text-xs font-black uppercase tracking-wider backdrop-blur-sm group-hover:bg-white group-hover:text-ocean-800 transition">
                      {ctaLabel} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              onClick={() => { setActive(i); }}
              aria-label={`Go to ${it.title}`}
              aria-current={i === active}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? 'w-6 bg-ocean-600' : 'w-1.5 bg-line'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CoverflowCarousel;

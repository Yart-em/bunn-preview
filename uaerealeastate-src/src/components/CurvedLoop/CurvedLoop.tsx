import { useRef, useEffect, useState, useMemo, useId, type ReactNode } from 'react';
import './CurvedLoop.css';

/* Separator dot — " • " in marqueeText renders as a big round dot
 * (the size the old '●' separator had).
 *
 * The marquee used to separate repeats with '●' (U+25CF). That glyph
 * isn't in Engravers Gothic (and this stack has no Satoshi), so the
 * browser had to search the system fonts for it — a slow fallback
 * lookup + shaping pass (~55–65 ms of layout at cpu×4 the first time
 * the brokers section is laid out) for a dot drawn from a different
 * typeface. Engravers Gothic's own '•' (U+2022) is used instead,
 * drawn to the exact geometry of the ● it replaces (Helvetica's,
 * which is what Mac browsers fell back to):
 *   - • ink is 0.305em wide, centred 0.357em above the baseline;
 *     ● was 0.430em wide, centred 0.284em up → draw • at 1.409em and
 *     drop it 0.2186em (dy, undone on the next glyph so the rest of
 *     the line stays on the path);
 *   - the space on either side is drawn at 0.676em, so the gaps to
 *     the dot's ink and the length of one repeat (= the loop period)
 *     match ● exactly.
 * Only font-size and dy are used: getComputedTextLength (which sets
 * the loop period below) counts font-size in every engine, but leaves
 * out a tspan's dx (Chromium and WebKit) and letter-spacing (WebKit).
 * The measuring <text> renders the same tspans, so its length stays
 * exact. A '•' without whitespace on both sides is left as a plain
 * glyph. */
const SEPARATOR_RE = /(\s)•(\s)/g;
const DOT_SCALE = 1.409;
const DOT_DROP = 0.2186; // in the marquee's em
const DOT_GAP_SCALE = 0.676;
/* dy lengths resolve against each tspan's OWN font-size, so convert
 * the drop from the marquee's em into the dot's / the gap's em. */
const DOT_DY = `${(DOT_DROP / DOT_SCALE).toFixed(4)}em`;
const GAP_DY = `${(-DOT_DROP / DOT_GAP_SCALE).toFixed(4)}em`;

/* One copy of the marquee text, with each " • " separator drawn as
 * the enlarged dot (see above). `copy` keeps keys unique when the
 * text is repeated along the path. */
function renderMarquee(text: string, copy: number): ReactNode[] {
  /* split() with the two capture groups yields
   * [text, gapBefore, gapAfter, text, gapBefore, gapAfter, …, text]. */
  const parts = text.split(SEPARATOR_RE);
  const out: ReactNode[] = [parts[0]];
  for (let i = 1; i < parts.length; i += 3) {
    out.push(
      <tspan key={`${copy}-${i}a`} fontSize={`${DOT_GAP_SCALE}em`}>{parts[i]}</tspan>,
      <tspan key={`${copy}-${i}b`} fontSize={`${DOT_SCALE}em`} dy={DOT_DY}>•</tspan>,
      <tspan key={`${copy}-${i}c`} fontSize={`${DOT_GAP_SCALE}em`} dy={GAP_DY}>{parts[i + 1]}</tspan>,
      parts[i + 2],
    );
  }
  return out;
}

interface CurvedLoopProps {
  marqueeText?: string;
  speed?: number;
  className?: string;
  curveAmount?: number;
  direction?: 'left' | 'right';
  interactive?: boolean;
}

const CurvedLoop = ({
  marqueeText = '',
  speed = 2,
  className,
  curveAmount = 400,
  direction = 'left',
  interactive = true,
}: CurvedLoopProps) => {
  const text = useMemo(() => {
    const hasTrailing = /\s| $/.test(marqueeText);
    return (hasTrailing ? marqueeText.replace(/\s+$/, '') : marqueeText) + ' ';
  }, [marqueeText]);

  const measureRef = useRef<SVGTextElement>(null);
  const textPathRef = useRef<SVGTextPathElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const jacketRef = useRef<HTMLDivElement>(null);
  const [spacing, setSpacing] = useState(0);
  /* Initial offset only — the marquee itself mutates the
   * startOffset ATTRIBUTE directly each frame. Keeping it out of
   * React state means the rAF loop causes zero re-renders (it
   * used to setState 60×/s for the page's whole lifetime). */
  const [initialOffset, setInitialOffset] = useState(0);
  const uid = useId();
  const pathId = `curve-${uid}`;
  const pathD = `M-100,40 Q500,${40 + curveAmount} 1540,40`;

  const dragRef = useRef(false);
  const lastXRef = useRef(0);
  const dirRef = useRef(direction);
  const velRef = useRef(0);

  const textLength = spacing;
  const copies = textLength ? Math.ceil(1800 / textLength) + 2 : 1;
  const totalText = Array.from({ length: copies }, (_, c) => renderMarquee(text, c));
  const ready = spacing > 0;

  useEffect(() => {
    if (measureRef.current) setSpacing(measureRef.current.getComputedTextLength());
  }, [text, className]);

  useEffect(() => {
    if (!spacing) return;
    if (textPathRef.current) {
      const initial = -spacing;
      textPathRef.current.setAttribute('startOffset', initial + 'px');
      setInitialOffset(initial);
    }
  }, [spacing]);

  useEffect(() => {
    if (!spacing || !ready) return;
    let frame: number | null = null;
    let lastTs: number | null = null;

    const step = (ts: number) => {
      if (!dragRef.current && textPathRef.current) {
        /* Normalize to a 60 fps baseline so the marquee moves at
         * the same visual speed on 120 Hz displays (it used to be
         * per-frame and ran 2× faster there). */
        const dt = lastTs === null ? 16.67 : Math.min(50, ts - lastTs);
        const delta =
          (dirRef.current === 'right' ? speed : -speed) * (dt / 16.67);
        const currentOffset = parseFloat(textPathRef.current.getAttribute('startOffset') || '0');
        let newOffset = currentOffset + delta;

        const wrapPoint = spacing;
        if (newOffset <= -wrapPoint) newOffset += wrapPoint;
        if (newOffset > 0) newOffset -= wrapPoint;

        textPathRef.current.setAttribute('startOffset', newOffset + 'px');
      }
      lastTs = ts;
      frame = requestAnimationFrame(step);
    };

    /* Only animate while on screen — SVG text-on-path relayouts
     * every frame are too expensive to run for an off-screen
     * marquee. */
    const start = () => {
      if (frame === null) {
        lastTs = null;
        frame = requestAnimationFrame(step);
      }
    };
    const stop = () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }
    };

    let io: IntersectionObserver | null = null;
    if (jacketRef.current && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? start() : stop()),
        { rootMargin: '100px' },
      );
      io.observe(jacketRef.current);
    } else {
      start();
    }

    return () => {
      stop();
      io?.disconnect();
    };
  }, [spacing, speed, ready]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    dragRef.current = true;
    lastXRef.current = e.clientX;
    velRef.current = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!interactive || !dragRef.current || !textPathRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    velRef.current = dx;

    const currentOffset = parseFloat(textPathRef.current.getAttribute('startOffset') || '0');
    let newOffset = currentOffset + dx;

    const wrapPoint = spacing;
    if (newOffset <= -wrapPoint) newOffset += wrapPoint;
    if (newOffset > 0) newOffset -= wrapPoint;

    textPathRef.current.setAttribute('startOffset', newOffset + 'px');
  };

  const endDrag = () => {
    if (!interactive) return;
    dragRef.current = false;
    dirRef.current = velRef.current > 0 ? 'right' : 'left';
  };

  const cursorStyle = interactive ? (dragRef.current ? 'grabbing' : 'grab') : 'auto';

  return (
    <div
      ref={jacketRef}
      className="curved-loop-jacket"
      style={{ visibility: ready ? 'visible' : 'hidden', cursor: cursorStyle }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    >
      <svg className="curved-loop-svg" viewBox="0 0 1440 120">
        <text ref={measureRef} xmlSpace="preserve" style={{ visibility: 'hidden', opacity: 0, pointerEvents: 'none' }}>
          {renderMarquee(text, 0)}
        </text>
        <defs>
          <path ref={pathRef} id={pathId} d={pathD} fill="none" stroke="transparent" />
        </defs>
        {ready && (
          <text fontWeight="bold" xmlSpace="preserve" className={className}>
            <textPath ref={textPathRef} href={`#${pathId}`} startOffset={initialOffset + 'px'} xmlSpace="preserve">
              {totalText}
            </textPath>
          </text>
        )}
      </svg>
    </div>
  );
};

export default CurvedLoop;

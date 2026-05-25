/* eslint-disable react-hooks/exhaustive-deps */
import {
  forwardRef,
  useId,
  type CSSProperties,
  type ReactNode,
} from 'react';
import './GlassSurface.css';

/**
 * Liquid Glass — backdrop-filter on the glass-surface ELEMENT
 * itself, not on a child layer.
 *
 * Why: any element with clip-path establishes a "backdrop root"
 * (per Filter Effects spec). A child with `backdrop-filter`
 * inside a backdrop-root samples only content INSIDE that root,
 * which means a glass-surface that's wrapped in a clipped
 * container has nothing to blur. Applying backdrop-filter to
 * the SAME element that owns the clip-path solves this — that
 * element IS the backdrop root, but ITS OWN backdrop-filter
 * looks at the parent's painted content (everything behind it).
 *
 * The SVG filter is chained inside `backdrop-filter` via
 * `var(--filter-id)` so its SourceGraphic is the actual
 * backdrop pixels (= the globe behind the panel).
 */

export type GlassSurfaceProps = {
  children?: ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  /** feDisplacementMap scale (user units / pixels). */
  displacementScale?: number;
  /** Skip the SVG displacement chain entirely. Uses a plain
   *  `blur() + saturate()` backdrop-filter on both prefixed and
   *  unprefixed properties, so the glass paints instantly the
   *  first frame — no compositor / SVG-filter warm-up lag.
   *  Use for small, fast-moving surfaces like the country
   *  cards where displacement isn't visible anyway. */
  simple?: boolean;
  className?: string;
  style?: CSSProperties;
  /* Retained for backwards-compat — no-ops. */
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
  backgroundOpacity?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  edgeSize?: number;
  refractionScale?: number;
  xChannel?: 'R' | 'G' | 'B';
  yChannel?: 'R' | 'G' | 'B';
  mixBlendMode?: CSSProperties['mixBlendMode'];
};

const GlassSurface = forwardRef<HTMLDivElement, GlassSurfaceProps>(
  (
    {
      children,
      width = '100%',
      height = 'auto',
      borderRadius = 24,
      displacementScale = 200,
      simple = false,
      className = '',
      style = {},
    },
    ref,
  ) => {
    const rawId = useId().replace(/:/g, '');
    const filterId = `glass-distortion-${rawId}`;

    /* backdrop-filter is set inline (not via CSS) because Vite's
     * CSS minifier collapses adjacent `backdrop-filter` and
     * `-webkit-backdrop-filter` declarations and keeps only one.
     *
     * Safari quirk: Safari doesn't support `url(#…)` inside
     * `backdrop-filter` (only blur / saturate / brightness /
     * etc.). If the value contains `url()`, Safari rejects the
     * ENTIRE declaration and renders no glass at all.
     *
     *   • backdropFilter (unprefixed): full chain with the SVG
     *     displacement filter — Chrome / Edge.
     *   • WebkitBackdropFilter: blur-only fallback — Safari
     *     uses this and at least gets the blur + saturation
     *     look (no displacement, but the card is still visibly
     *     a frosted-glass surface). */
    /* Simple mode: skip the SVG `url()` chain entirely. Both
     * prefixed + unprefixed get plain `blur + saturate`, so
     * the backdrop renders on the very first frame with no
     * SVG-filter / compositor warm-up lag (the country cards
     * use this — displacement isn't visible on them anyway). */
    const simpleBackdrop = 'blur(12px) saturate(1.6)';
    const chromeBackdrop = simple
      ? simpleBackdrop
      : `blur(3px) url(#${filterId})`;
    const safariBackdrop = simple
      ? simpleBackdrop
      : 'blur(18px) saturate(1.4)';
    const containerStyle: CSSProperties &
      Record<string, string | number | undefined> = {
      ...style,
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      borderRadius: `${borderRadius}px`,
      backdropFilter: chromeBackdrop,
      WebkitBackdropFilter: safariBackdrop,
    };

    return (
      <div
        ref={ref}
        className={`glass-surface ${className}`}
        style={containerStyle}
      >
        {/* SVG filter: feTurbulence → gamma curves → blur →
            feDisplacementMap. scale defaults to 200 (user units
            = pixels since primitiveUnits defaults to
            userSpaceOnUse). */}
        <svg className="glass-surface__filter-svg" aria-hidden="true">
          <filter
            id={filterId}
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            filterUnits="objectBoundingBox"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.001 0.005"
              numOctaves={1}
              seed={17}
              result="turbulence"
            />
            <feComponentTransfer in="turbulence" result="mapped">
              <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
              <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
              <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
            </feComponentTransfer>
            <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
            <feSpecularLighting
              in="softMap"
              surfaceScale="5"
              specularConstant="1"
              specularExponent="100"
              lightingColor="white"
              result="specLight"
            >
              <fePointLight x="-200" y="-200" z="300" />
            </feSpecularLighting>
            <feComposite
              in="specLight"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
              result="litImage"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="softMap"
              scale={displacementScale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>

        {/* Content paints above the backdrop-filter result. */}
        <div className="glass-surface__content">{children}</div>
      </div>
    );
  },
);

GlassSurface.displayName = 'GlassSurface';
export default GlassSurface;

import { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import BorderGlow from '../BorderGlow/BorderGlow';
import GlareHover from '../GlareHover/GlareHover';
import { IS_IOS } from '../../lib/platform';
import './SlideCarousel.css';

/* ── Slide data shape ─────────────────────────────────────── */
export interface SlideData {
  /** "FOR SOFIA" — rendered above the subtitle */
  label: string;
  /** Pain-point description text */
  subtitle: string;
  /** Country / residence line */
  country: string;
  /** Path to background image (public folder) */
  image: string;
}

/* ── SVG path generators ──────────────────────────────────── */
/* Both the rect + notch paths share the exact same SVG command
 * structure (M C H C C H C C H C V C H C V Z) so GSAP can tween the
 * `d` attribute by interpolating numeric values. The viewBox is
 * 760 × 483 (from Frame 16.svg). The notch hugs a button of width
 * `btnVw` (in viewBox units) centred at the bottom with a 5px
 * clearance; the depth is fixed (56px button + 2×5 clearance →
 * floor at y = 407) so the card corners + morph structure are
 * identical at every button width.
 *
 * buildNotch(270) / buildRect(270) reproduce the original
 * hand-tuned desktop paths exactly; buildNotch(608) ≈ 80%-of-width
 * button for the mobile card. */
const NOTCH_FLOOR_Y = 407; // 473 − (56 button + 2×5 clearance)

const f = (v: number) => +v.toFixed(2);

function notchAnchors(btnVw: number) {
  const half = btnVw / 2;
  const bRight = 380 + half;
  const bLeft = 380 - half;
  return {
    wallR: bRight + 5, // outer wall = button edge + 5px clearance
    wallL: bLeft - 5,
    floorR: bRight - 28, // floor = button edge − corner radius
    floorL: bLeft + 28,
    entryR: bRight + 5 + 35, // bottom-edge entry = wall + bottom corner r
    exitL: bLeft - 5 - 35,
  };
}

/** Flat-bottom rectangle; degenerate cubics sit on y = 473 at the
 *  same x-anchors as the notch so the morph interpolates cleanly. */
function buildRect(btnVw: number): string {
  const { wallR, wallL, floorR, floorL, entryR, exitL } = notchAnchors(btnVw);
  return (
    `M760 438 C760 457.33 744.33 473 725 473 ` +
    `H${f(entryR)} C${f(entryR)} 473 ${f(wallR)} 473 ${f(wallR)} 473 ` +
    `C${f(wallR)} 473 ${f(floorR)} 473 ${f(floorR)} 473 ` +
    `H${f(floorL)} C${f(floorL)} 473 ${f(wallL)} 473 ${f(wallL)} 473 ` +
    `C${f(wallL)} 473 ${f(exitL)} 473 ${f(exitL)} 473 ` +
    `H35 C15.67 473 0 457.33 0 438 V35 C0 15.67 15.67 0 35 0 ` +
    `H725 C744.33 0 760 15.67 760 35 V438 Z`
  );
}

/** S-curve notch hugging a `btnVw`-wide button at 5px clearance. */
function buildNotch(btnVw: number): string {
  const { wallR, wallL, floorR, floorL, entryR, exitL } = notchAnchors(btnVw);
  const y = NOTCH_FLOOR_Y;
  return (
    `M760 438 C760 457.33 744.33 473 725 473 ` +
    `H${f(entryR)} C${f(entryR - 19.33)} 473 ${f(wallR)} 457.33 ${f(wallR)} 438 ` +
    `C${f(wallR)} 421.77 ${f(floorR + 18.23)} ${y} ${f(floorR)} ${y} ` +
    `H${f(floorL)} C${f(floorL - 18.23)} ${y} ${f(wallL)} 421.77 ${f(wallL)} 438 ` +
    `C${f(wallL)} 457.33 ${f(exitL + 19.33)} 473 ${f(exitL)} 473 ` +
    `H35 C15.67 473 0 457.33 0 438 V35 C0 15.67 15.67 0 35 0 ` +
    `H725 C744.33 0 760 15.67 760 35 V438 Z`
  );
}

/* ── Pill-hug notch (mobile) ──────────────────────────────────
 * The mobile CTA keeps the DESKTOP pill aspect (270:56) at 75% of
 * the card width, so it's a TALL pill whose corner radius (= half
 * its height ≈ 59 viewBox units) is far larger than the desktop
 * pill's 28. The desktop `buildNotch` hard-codes a 28-unit corner;
 * reusing that on the tall mobile pill makes the floor too wide and
 * the walls cut ACROSS the rounded ends instead of wrapping them —
 * the "wrong top S-curves".
 *
 * This generator hugs a pill of ANY radius `r`: the floor flat ends
 * exactly where the pill's flat top ends (bEdge ∓ r); each wall is a
 * true quarter-arc of radius r+5 (the 5px clearance) wrapping the
 * pill's rounded end from the floor down to its widest point (wallR =
 * bEdge ± 5); then a flare cubic opens out to the bottom edge. This
 * is the SAME construction the desktop notch approximates — verified
 * to reproduce buildNotch's control points when r = 28 — so the
 * mobile notch reads as a scaled-up version of the desktop one.
 *
 * Command structure is IDENTICAL to buildRect / buildPillRect
 * (M C H C C H C C H C V C H C V Z) so GSAP morphs cleanly. */
const K = 0.5523; // cubic-bezier handle for a smooth quarter turn

function pillAnchors(btnVw: number, r: number) {
  const bRight = 380 + btnVw / 2;
  const bLeft = 380 - btnVw / 2;
  return {
    wallR: bRight + 5,       // notch widest = pill edge + 5px clearance
    wallL: bLeft - 5,
    floorR: bRight - r,      // floor corner = where the pill's flat top ends
    floorL: bLeft + r,
    entryR: bRight + 5 + 35, // bottom-edge entry = wall + flare
    exitL: bLeft - 5 - 35,
  };
}

/** Flat-bottom rectangle sharing the pill notch's x-anchors. */
function buildPillRect(btnVw: number, r: number): string {
  const { wallR, wallL, floorR, floorL, entryR, exitL } = pillAnchors(btnVw, r);
  return (
    `M760 438 C760 457.33 744.33 473 725 473 ` +
    `H${f(entryR)} C${f(entryR)} 473 ${f(wallR)} 473 ${f(wallR)} 473 ` +
    `C${f(wallR)} 473 ${f(floorR)} 473 ${f(floorR)} 473 ` +
    `H${f(floorL)} C${f(floorL)} 473 ${f(wallL)} 473 ${f(wallL)} 473 ` +
    `C${f(wallL)} 473 ${f(exitL)} 473 ${f(exitL)} 473 ` +
    `H35 C15.67 473 0 457.33 0 438 V35 C0 15.67 15.67 0 35 0 ` +
    `H725 C744.33 0 760 15.67 760 35 V438 Z`
  );
}

/** Notch wrapping a `btnVw`-wide pill of corner radius `r`, floor at
 *  `floorY`, with 5px clearance all round. */
function buildPillNotch(btnVw: number, r: number, floorY: number): string {
  const { wallR, wallL, floorR, floorL, entryR, exitL } = pillAnchors(btnVw, r);
  const top = 473;
  const centerY = floorY + 5 + r;   // pill vertical centre = arc centre y
  const R = r + 5;                  // hug radius = pill radius + clearance
  const aH = (entryR - wallR) * K;  // flare horizontal handle (≈19.33)
  const aV = (top - centerY) * K;   // flare vertical handle
  const bC = R * K;                 // quarter-arc handle
  return (
    `M760 438 C760 457.33 744.33 473 725 473 ` +
    `H${f(entryR)} C${f(entryR - aH)} ${top} ${f(wallR)} ${f(centerY + aV)} ${f(wallR)} ${f(centerY)} ` +
    `C${f(wallR)} ${f(centerY - bC)} ${f(floorR + bC)} ${floorY} ${f(floorR)} ${floorY} ` +
    `H${f(floorL)} C${f(floorL - bC)} ${floorY} ${f(wallL)} ${f(centerY - bC)} ${f(wallL)} ${f(centerY)} ` +
    `C${f(wallL)} ${f(centerY + aV)} ${f(exitL + aH)} ${top} ${f(exitL)} ${top} ` +
    `H35 C15.67 473 0 457.33 0 438 V35 C0 15.67 15.67 0 35 0 ` +
    `H725 C744.33 0 760 15.67 760 35 V438 Z`
  );
}

/* Desktop button is a 270×56 pill (r=28, shallow notch). Mobile keeps
 * the pill aspect at 75% width — a 570×118 pill (r≈59) — so the notch
 * is deeper AND its corners use the larger pill radius (the CSS forces
 * the CTA to a true pill so its rendered radius matches `r` in viewBox
 * space at every width). floorY 368 keeps ~5 units of top clearance;
 * the dock drops ~15% of the button below the card edge. */
const MOBILE_BTN_VW = 0.75 * 760;                    // 570
const MOBILE_BTN_R = (MOBILE_BTN_VW * 56) / 270 / 2; // pill radius ≈ 59.11
const MOBILE_FLOOR_Y = 368;
const DESKTOP_RECT = buildRect(270);
const DESKTOP_NOTCH = buildNotch(270);
const MOBILE_RECT = buildPillRect(MOBILE_BTN_VW, MOBILE_BTN_R);
const MOBILE_NOTCH = buildPillNotch(MOBILE_BTN_VW, MOBILE_BTN_R, MOBILE_FLOOR_Y);

/** Pick the path pair for the current viewport (mobile = ≤600px). */
const getPaths = () =>
  typeof window !== 'undefined' && window.innerWidth <= 600
    ? { rect: MOBILE_RECT, notch: MOBILE_NOTCH }
    : { rect: DESKTOP_RECT, notch: DESKTOP_NOTCH };

const ROTATE_MS = 3000;

/* ── Component ────────────────────────────────────────────── */
export default function SlideCarousel({ slides }: { slides: SlideData[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const total = slides.length;

  /* Refs for every slide's shape <path> + button wrapper so
   * GSAP can morph the path and reveal the button. */
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const btnRefs = useRef<(HTMLDivElement | null)[]>([]);
  /* Track the GSAP timeline per-slide so we can kill it on
   * cleanup / re-trigger without leaking. */
  const tlRefs = useRef<(gsap.core.Timeline | null)[]>([]);

  /* ── Auto-rotate timer ──────────────────────────────────── */
  useEffect(() => {
    const id = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % total);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [total]);

  /* ── Animate on activeIdx change ────────────────────────── */
  const animateSlide = useCallback(
    (idx: number) => {
      /* Kill any running timeline for this slot. */
      tlRefs.current[idx]?.kill();

      const path = pathRefs.current[idx];
      const btn = btnRefs.current[idx];
      if (!path || !btn) return;

      const P = getPaths();

      /* Reset to rectangle + button hidden. */
      gsap.set(path, { attr: { d: P.rect } });
      gsap.set(btn, { y: 40, opacity: 0, scale: 0.92 });

      const tl = gsap.timeline();

      /* 1. Morph shape: rectangle → S-curve notch (0.6 s). */
      tl.to(path, {
        attr: { d: P.notch },
        duration: 0.6,
        ease: 'power2.inOut',
      });

      /* 2. Button slides up + fades in (bounce-out ease).
       *    Centering is handled by the .sc-btn-dock flexbox
       *    wrapper so no xPercent needed here. */
      tl.to(
        btn,
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: 'back.out(1.7)',
        },
        '-=0.15', // overlap slightly with shape morph end
      );

      tlRefs.current[idx] = tl;
    },
    [],
  );

  /* Animate the previous active slide OUT: button disappears
   * first, then the shape morphs back to a flat rectangle. */
  const resetSlide = useCallback((idx: number) => {
    tlRefs.current[idx]?.kill();
    const path = pathRefs.current[idx];
    const btn = btnRefs.current[idx];
    if (!path && !btn) return;

    const tl = gsap.timeline();

    /* 1. Button slides down + fades out (reverse of appear). */
    if (btn) {
      tl.to(btn, {
        y: 40,
        opacity: 0,
        scale: 0.92,
        duration: 0.35,
        ease: 'power2.in',
      });
    }

    /* 2. Morph shape: S-curve notch → flat rectangle. */
    if (path) {
      tl.to(
        path,
        {
          attr: { d: getPaths().rect },
          duration: 0.5,
          ease: 'power2.inOut',
        },
        btn ? '-=0.1' : 0, // overlap slightly with button exit
      );
    }

    tlRefs.current[idx] = tl;
  }, []);

  useEffect(() => {
    /* Reset every slide, then animate the new active one. */
    slides.forEach((_, i) => {
      if (i !== activeIdx) resetSlide(i);
    });
    animateSlide(activeIdx);
  }, [activeIdx, slides.length, animateSlide, resetSlide]);

  /* Keep the notch matched to the viewport's button width: when the
   * mobile/desktop breakpoint is crossed, re-apply the correct path
   * pair instantly (active = notch, others = flat). */
  useEffect(() => {
    const onResize = () => {
      const P = getPaths();
      slides.forEach((_, i) => {
        const path = pathRefs.current[i];
        if (path) {
          gsap.set(path, { attr: { d: i === activeIdx ? P.notch : P.rect } });
        }
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activeIdx, slides.length]);

  /* ── Re-sync on tab visibility ────────────────────────────
   * Chrome suspends requestAnimationFrame in background tabs,
   * so GSAP timelines freeze while setInterval (auto-rotate)
   * still fires. When the user returns, re-trigger the active
   * slide animation so the notch + button state is correct. */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        slides.forEach((_, i) => {
          if (i !== activeIdx) resetSlide(i);
        });
        animateSlide(activeIdx);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [activeIdx, slides, animateSlide, resetSlide]);

  /* Cleanup all timelines on unmount. */
  useEffect(() => {
    return () => {
      tlRefs.current.forEach((tl) => tl?.kill());
    };
  }, []);

  /* ── Render ─────────────────────────────────────────────── */

  /** Position each slide in a 3-D ring around the centre.
   *  Active slide sits at translateX(0) / rotateY(0).
   *  Neighbours fan out horizontally + rotate, scaling down
   *  and blurring to read as a deck behind the focus card. */
  const getSlideStyle = (i: number): React.CSSProperties => {
    let offset = i - activeIdx;
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    const isActive = offset === 0;
    const absOff = Math.abs(offset);

    /* Layout knobs — percentages of the slide width so the
     * ring scales proportionally on any viewport. */
    const txPct = offset * 75;       // % of slide width
    const rY = offset * -40;         // rotateY per step
    const sc = isActive ? 1 : 0.72;  // scale of non-active
    const z = isActive ? 0 : -280;   // push back in Z
    /* Side slides are gaussian-blurred to read as a deck behind the
     * focus card — but iOS Safari renders this blur poorly, so skip
     * it there (the scale + opacity still push them back). */
    const blur = isActive || IS_IOS ? 0 : 10;
    const op = absOff > 2 ? 0 : isActive ? 1 : 0.55;

    return {
      transform: `translateX(${txPct}%) translateZ(${z}px) rotateY(${rY}deg) scale(${sc})`,
      filter: blur > 0 ? `blur(${blur}px)` : 'none',
      opacity: op,
      zIndex: isActive ? 10 : 5 - absOff,
    };
  };

  return (
    <div className="sc-wrap">
      <div className="sc-stage">
        {slides.map((slide, i) => {
          const isActive = i === activeIdx;
          return (
            <div
              key={i}
              className={`sc-slide${isActive ? ' sc-slide--active' : ''}`}
              style={getSlideStyle(i)}
            >
              {/* ── SVG shape (image + clipping) ────────── */}
              <svg
                className="sc-shape"
                viewBox="0 0 760 483"
                preserveAspectRatio="xMidYMid slice"
              >
                <defs>
                  <clipPath id={`sc-clip-${i}`}>
                    <path
                      ref={(el) => { pathRefs.current[i] = el; }}
                      d={getPaths().rect}
                    />
                  </clipPath>
                  {/* Drop shadow generated FROM the clipped card
                      silhouette (incl. the notch), so the shadow
                      always matches the actual element rather than a
                      rectangle underneath. Computed in SVG space so
                      Safari renders it correctly. The filter lives on
                      an OUTER <g> (no clip) that wraps the clipped
                      image — SVG applies a filter BEFORE clipping on
                      the same element, so nesting keeps the shadow
                      from being clipped away. */}
                  <filter
                    id={`sc-shadow-${i}`}
                    x="-25%"
                    y="-25%"
                    width="150%"
                    height="150%"
                    colorInterpolationFilters="sRGB"
                  >
                    <feDropShadow
                      dx="0"
                      dy="16"
                      stdDeviation="16"
                      floodColor="#0c0c0d"
                      floodOpacity="0.1"
                    />
                  </filter>
                </defs>

                {/* Background image, clipped by the notch path; the
                    shadow filter wraps the clipped group so it traces
                    the real silhouette (only on the active slide). */}
                <g filter={isActive ? `url(#sc-shadow-${i})` : undefined}>
                  <g clipPath={`url(#sc-clip-${i})`}>
                    <image
                      href={slide.image}
                      x="0"
                      y="0"
                      width="760"
                      height="483"
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </g>
                </g>
              </svg>

              {/* ── Overlay text ────────────────────────── */}
              {/* The anchor wraps only the label so the overlay's
                  flex-centering centres the HEADING at the card's
                  vertical middle. Subtitle + country hang in an
                  absolutely-positioned stack right below the label
                  (top: 100%) so they don't pull the heading off
                  centre, regardless of how many lines they wrap. */}
              <div className="sc-overlay">
                <div className="sc-text-anchor">
                  <p className="sc-label">{slide.label}</p>
                  <div className="sc-text-below">
                    <p className="sc-subtitle">{slide.subtitle}</p>
                    <p className="sc-country">{slide.country}</p>
                  </div>
                </div>
              </div>

              {/* ── CTA button (same pill as hero) ──────── */}
              <div className="sc-btn-dock">
              <div
                className="sc-btn-wrap"
                ref={(el) => { btnRefs.current[i] = el; }}
              >
                <BorderGlow
                  className="sc-cta-glow-wrap"
                  edgeSensitivity={20}
                  glowColor="0 0 100"
                  backgroundColor="#0e0e10"
                  borderRadius={28}
                  glowRadius={48}
                  glowIntensity={1.4}
                  coneSpread={28}
                  colors={['#ffffff', '#ffffff', '#ffffff']}
                >
                  <GlareHover
                    className="cta-fab-glare"
                    width="100%"
                    height="100%"
                    background="transparent"
                    borderRadius="28px"
                    borderColor="transparent"
                    glareColor="#ffffff"
                    glareOpacity={0.25}
                    glareAngle={-45}
                    glareSize={250}
                    transitionDuration={1800}
                    playOnce={false}
                    autoInterval={5000}
                  >
                    <a
                      className="cta-fab cta-fab--glow"
                      href="#contact"
                      aria-label="Start to use payment links"
                    >
                      <span className="cta-fab__label">
                        START TO USE PAYMENT LINKS
                      </span>
                      <span className="cta-fab__icon" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M2 7h10M8 3l4 4-4 4"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </a>
                  </GlareHover>
                </BorderGlow>
              </div>
              </div>{/* /.sc-btn-dock */}
            </div>
          );
        })}
      </div>
    </div>
  );
}

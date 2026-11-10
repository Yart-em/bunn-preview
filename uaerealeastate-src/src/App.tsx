import {
  Fragment,
  Suspense,
  lazy,
  startTransition,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type RefObject,
} from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
// Lazy-loaded: pulls in Three.js + R3F + drei. Code-splitting it
// keeps that ~600 KB out of the initial bundle so the page
// paints/interacts fast; the globe streams in at its 2 s mount.
// If the chunk fails to load, the page reloads for it (lib/chunks).
const loadGlobe = () => import('./components/Globe/Globe');
const Globe = lazyOrNothing(loadGlobe, { reload: true });
import GlassSurface from './components/GlassSurface/GlassSurface';
import BorderGlow from './components/BorderGlow/BorderGlow';
import GlareHover from './components/GlareHover/GlareHover';
import { BlurInWords, RiseInChars } from './components/HeroEntrance/HeroEntrance';
import { StaggerText } from './components/StaggerText/StaggerText';
import { useCardNotch } from './hooks/useCardNotch';
import type Lenis from 'lenis';
import { getLenis } from './lib/lenis';
import {
  BUNN_LINE_AFTER_PX,
  HERO_LOCK_TAIL_PX,
  HERO_POST_LOCK_BUFFER_PX,
} from './lib/scrollLayout';
import { PHONE_QUERY, installStepScroll } from './lib/stepScroll';
import { whenIdle } from './lib/idle';
// No three.js in here: it only starts the globe's dot-lattice worker.
import { loadGlobeDots } from './components/Globe/globeData';
import {
  CTA_SELECTOR,
  openContactAfterReload,
  requestContactOpen,
  takeContactOpenAfterReload,
} from './lib/contact';
import {
  afterPageLoad,
  importAfresh,
  isChunkReloadPage,
  lazyOrNothing,
  reloadForFailedChunk,
} from './lib/chunks';
import { BELOW_FOLD_STAGES } from './belowFoldStages';
// Code-split: every section after the hero (BelowFold.tsx) and the
// contact popup each live in their own chunk — see BelowFoldMount
// and ContactPopupHost below for when they load and mount.
// Each loader is shared by every caller, so there's only ever one
// copy of the module. A failed fetch would fail import() for good
// (lib/chunks), so it tries once more under fresh URLs; if that fails
// too, the next call starts over.
const loadBelowFold = memoRetry(
  () => import('./BelowFold'),
  () => importAfresh<typeof import('./BelowFold')>('belowFold'),
);
const BelowFold = lazy(loadBelowFold);
const loadContactPopup = memoRetry(
  () => import('./components/ContactPopup/ContactPopup'),
  () =>
    importAfresh<typeof import('./components/ContactPopup/ContactPopup')>(
      'contactPopup',
    ),
);
function memoRetry<T>(load: () => Promise<T>, retry: () => Promise<T>) {
  let loading: Promise<T> | null = null;
  return () =>
    (loading ??= load()
      .catch(retry)
      .catch((err) => {
        loading = null;
        throw err;
      }));
}
// The popup's CSS ships in the entry bundle for ContactPopupHost's
// stand-in of the closed popup (see there).
import './components/ContactPopup/ContactPopup.css';

/* ── Force scroll to top on every full page-load ──────────
 * Module-level so it runs BEFORE any React render or
 * useLayoutEffect.  Prevents the browser from restoring a
 * mid-page scroll position that would cause the fixed
 * 67.3 % / BUNN headings to flash on screen. */
if (typeof window !== 'undefined') {
  if ('scrollRestoration' in window.history)
    window.history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
}

/* Camera params — kept in sync with Globe.tsx so we can solve for
 * sphere placement on the canvas. */
const CAMERA_Y = 0.32;
const CAMERA_Z = 3.1;
const CAMERA_FOV_DEG = 45;

const cameraDistance = Math.sqrt(CAMERA_Y * CAMERA_Y + CAMERA_Z * CAMERA_Z);
const tanHalfFov = Math.tan((CAMERA_FOV_DEG / 2) * (Math.PI / 180));
/* Default for the INITIAL globe diameter as a % of viewport width
 * — tuned via the dev toggle bar's % slider. */
const DEFAULT_GLOBE_INITIAL_PCT = 45;
/* Default FINAL / locked globe diameter as a % of viewport width.
 * Live-tunable via the dev toggle bar. The globe lerps from
 * DEFAULT_GLOBE_INITIAL_PCT to this value during scroll. */
const DEFAULT_GLOBE_FINAL_PCT = 60;
/* Default values for the layout knobs the dev toggle bar exposes.
 * Tuned by eye and baked in here so the slider starts at the
 * already-correct value. The globe's FRAME (the canvas wrapper)
 * is anchored to the BOTTOM of the heading (= rotator line) —
 * a NEGATIVE gap pulls the FRAME TOP above that line so that
 * arc tops (= the "coin lines") can extend a few pixels into
 * the heading area while the sphere itself stays below. */
const DEFAULT_GAP_AFTER_HEADING_PX = 60;
const DEFAULT_CHIP_Y_OFFSET_PX = 0;
/* Default inset for the sphere top inside the canvas (= how
 * many pixels the sphere top sits BELOW the canvas top).
 * Live-tunable. Higher values push the sphere DOWN inside its
 * frame, which is the lever to pull when the sphere's upper
 * hemisphere is being covered by the sticky glass card. */
const DEFAULT_SPHERE_INSET_PX = 20;
/* Distance from the bottom of the viewport at which the glass
 * card sits when the page first loads. */
const CARD_BOTTOM_PADDING_PX = 50;

/* Default LOCK threshold. When the user scrolls, the globe FRAME
 * rides 1 : 1 with the page UNTIL its top edge reaches this many
 * pixels from the window's top — at that moment the frame pins
 * and the sphere holds at its final size. Live-tunable. */
const DEFAULT_LOCK_TOP_PX = 230;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/* ── Entrance ────────────────────────────────────────────────
 * The H1 lines, each rotator word and the chip all enter with the
 * same per-word blur-in, so the page-wide entrance reads as ONE
 * continuous reveal (the eyebrow above rises in per character).
 * All of it is CSS @keyframes (index.css, "Hero entrance"), played
 * on the compositor; only the delays are set here.
 *
 * Sequenced timing.
 *   • H1 lines 1 + 2 (BlurInWords)         ≈ 0 → 1.95 s
 *   • Globe canvas mounts at               2.0 s — immediately
 *     after last heading line; DotSphere gather runs ~1.9 s,
 *     dots settle ~3.9 s
 *   • Hero glass card fades in at          2.0 s (index.css)
 *   • Rotator words + chip                 2.0 → 3.8 s
 * All values in SECONDS. */
const ROTATOR_START = 2.0; // after H1 line 2 ends
const ROTATOR_WORD_DELAY = 0.15;
/** Globe mounts right after the last H1 line appears (~1.95 s). */
const GLOBE_MOUNT_DELAY_MS = 2000;
/** Longest the globe's dot-data build waits for an idle period. */
const GLOBE_DOTS_IDLE_TIMEOUT_MS = 1000;
/* Card entrance animation delay lives in index.css under
 * `.hero-card .glass-surface { animation-delay }` — kept in
 * sync at 2 s (same time as globe mount). */

/** Blur-in delay of the rotator's `i`-th word (the chip is word 4). */
const rotatorWordDelay = (i: number) => ({
  animationDelay: `${Math.round((ROTATOR_START + i * ROTATOR_WORD_DELAY) * 1000)}ms`,
});


/** Cities cycled in the rotator under the H1. Each city pairs with
 *  a buyer-portrait that swaps in alongside the city name; the
 *  catch-all "52+ countries" entry has no portrait — it's a sweep
 *  rather than a single buyer. The portraits are 180 × 120 WebP:
 *  the chip shows them at most ~55 × 37 CSS px, so that is ≥ 3× its
 *  size on any screen (they were 240 × 160 PNGs, ~74 KB together). */
const COUNTRIES: { name: string; photo: string | null }[] = [
  { name: 'China', photo: '/uaerealestate/portraits/beijing.webp' },
  { name: 'Ukraine', photo: '/uaerealestate/portraits/kyiv.webp' },
  { name: 'Nigeria', photo: '/uaerealestate/portraits/lagos.webp' },
  { name: 'Pakistan', photo: '/uaerealestate/portraits/karachi.webp' },
  { name: 'Lebanon', photo: '/uaerealestate/portraits/beirut.webp' },
  { name: 'Brazil', photo: '/uaerealestate/portraits/rio.webp' },
  { name: '52+ countries', photo: null },
];
const COUNTRY_ROTATE_MS = 2200;

/* Spring + stagger constants for the chip's rotating-text effect.
 * Same numbers as reactbits' RotatingText recipe (damping 30,
 * stiffness 400, staggerDuration 0.025). */
const ROTATOR_SPRING = {
  type: 'spring' as const,
  damping: 30,
  stiffness: 400,
};
const ROTATOR_STAGGER = 0.025;

/* Layout-transition for the chip + suffix bounce. Both elements
 * carry Framer's `layout` prop; LayoutGroup snapshots positions
 * before & after the city swap and tweens each to its new
 * position. With `backOut` ease, the value travels PAST the
 * target then settles back — so the suffix ("TO PAY")
 * overshoots in the direction of motion before bouncing back:
 *   - chip gets WIDER  → suffix moves right → overshoots
 *     further right, then bounces back leftward into place.
 *   - chip gets NARROWER → suffix moves left → overshoots
 *     further left, then bounces back rightward into place. */
const LAYOUT_BACKOUT_TRANSITION = {
  layout: {
    type: 'tween' as const,
    ease: 'backOut' as const,
    duration: 0.55,
  },
};
/* Instant (no animation) layout transition for the prefix on
 * ordinary city swaps — only the "52+ countries" slide gets
 * the backOut bounce on the left side. Hoisted to module
 * scope so the reference is stable across renders (a
 * recreated object every render makes Framer interpret the
 * transition as "changed" and can re-trigger animations). */
const LAYOUT_INSTANT_TRANSITION = {
  layout: { type: 'tween' as const, duration: 0 },
};

/** The three "step" lines in the subhead. Rendered as three columns
 *  in a single row, separated by horizontal pink-impulse dividers.
 *  Uppercased visually via CSS text-transform.
 *
 *  Each step carries an explicit `width` — measured to match the
 *  widest line of the step's 2-line wrap. CSS can't shrink a box
 *  to its widest wrapped line (the layout would need 2 passes),
 *  so the only way to make each frame = the text size is to
 *  hardcode the width that the text wraps INTO. The values below
 *  are 1 px wider than the measured widest line (sub-pixel safety
 *  margin so the wrap can't overflow by a rounding error). */
const SUBHEAD_STEPS: { text: string; width: number }[] = [
  { text: 'Send a payment link', width: 130 },
  { text: 'Buyer pays in stablecoins', width: 116 },
  { text: 'You receive AED in your bank', width: 155 },
];


/** Scroll-driven hero scene — the globe canvas plus the two fixed
 *  statement headings. Owns ALL the per-frame scroll state, so
 *  scrubbing through the hero re-renders only this small subtree.
 *  (Previously this state lived in <App/>, which meant the ENTIRE
 *  ~2000-line tree — framer-motion rotator included — reconciled on
 *  every scroll frame; that was the main source of scroll jank.)
 *  Every element here is position:fixed and .hero creates no
 *  stacking context, so rendering the headings inside the section
 *  is visually identical to their previous sibling placement. */
function HeroScrollScene({
  headingContainerRef,
  cardRef,
}: {
  headingContainerRef: RefObject<HTMLDivElement | null>;
  cardRef: RefObject<HTMLDivElement | null>;
}) {
  const globeWrapperRef = useRef<HTMLDivElement | null>(null);

  const [sphereYOffset, setSphereYOffset] = useState(-0.4);
  const [sphereScale, setSphereScale] = useState(1);
  /** World-space dot size for the globe. The globe DIAMETER is sized
   *  as a % of viewport WIDTH, but a Three.js point's pixel size keys
   *  off the canvas HEIGHT and is NOT affected by the sphere's group
   *  scale — so on a tall, narrow phone the globe shrinks while the
   *  dots keep their desktop pixel size, reading ~3× chunkier. We
   *  scale the dot world-size by the viewport aspect ratio so the
   *  dot-to-globe ratio is identical on every screen. Calibrated to
   *  0.011 at 16:9 (desktops/laptops sit at or just below that —
   *  finer, per request — and portrait phones drop proportionally). */
  const [dotSize, setDotSize] = useState(0.011);
  const [isLocked, setIsLocked] = useState(false);
  /** Pre-lock scroll progress 0..1 — drives the rotation
   *  "homing" that lerps a freely-spinning globe back to its
   *  Dubai-centred orientation by the time the user reaches
   *  the lock point. */
  const [preLockProgress, setPreLockProgress] = useState(0);
  /** Statement heading visibility — a 3-state machine driven by
   *  scroll position relative to the dissolve schedule.
   *    - 'hidden'  : default. dissolveProgress hasn't crossed 0.9
   *    - 'visible' : dissolve ≥ 0.9 AND user hasn't scrolled past
   *                  the 500 px pin window
   *    - 'leaving' : pin window exceeded — heading fades out
   *  Lives at page-root z-index so the heading floats over the
   *  still-diffusing globe canvas. */
  const [statementPhase, setStatementPhase] = useState<
    'hidden' | 'visible' | 'leaving'
  >('hidden');


  /** Scroll position at the moment the heading was first
   *  triggered. Used to measure the 500 px window. */
  const statementTriggerSyRef = useRef<number | null>(null);
  /** Guard: only allow the 67.3 % heading to trigger after the
   *  user has actually scrolled.  Prevents mid-page reloads from
   *  showing the heading — even with scrollRestoration:'manual',
   *  some browsers briefly restore scroll before our scrollTo(0,0)
   *  takes effect, which can push clampedDissolve past 0.9. */
  const hasUserScrolledRef = useRef(false);

  /** Second statement — "BUNN unsticks the wire. Easy with
   *  that." Appears 200 px AFTER the 67.3 % heading was
   *  triggered. Toggling 'visible' also makes the 67.3 %
   *  heading shift up + shrink to make room. */
  const [bunnPhase, setBunnPhase] = useState<'hidden' | 'visible'>('hidden');
  /** Distance the whole headings block has translated UP from
   *  its viewport-centred resting position, in pixels. Stays 0
   *  while the block is pinned at viewport-centre; once the
   *  user has scrolled 100 px past the BUNN line appearing the
   *  block "unpins" and tracks scroll 1:1 (offset = scroll past
   *  the unpin threshold). The headings scroll naturally off
   *  the top of the viewport from there. */
  const [unpinOffsetPx, setUnpinOffsetPx] = useState(0);
  /** Scroll-driven dissolve progress (0..1). 0 = sphere fully
   *  formed; 1 = everything scattered far past the viewport.
   *  Drives DotSphere dot positions, coin flings, country card
   *  flips, and the arc fade-out — all in lockstep with
   *  scroll position. */
  const [dissolveProgress, setDissolveProgress] = useState(0);
  /** Gate the Globe component's mount until the heading
   *  entrance has finished — so the DotSphere gather only
   *  starts AFTER the heading words have all settled in. */
  const [globeReady, setGlobeReady] = useState(false);
  useEffect(() => {
    /* Warm the lazy three.js chunk immediately so it's parsed and
     * ready by the time the 2 s mount delay elapses. If it fails,
     * reload now, while the entrance has barely begun, rather than
     * when the lazy Globe asks for it at 2 s. On the reloaded page,
     * leave the request to that 2 s mount (lib/chunks). */
    if (!isChunkReloadPage()) {
      loadGlobe().catch(() => reloadForFailedChunk());
    }
    /* And have the dots worker build the globe's dot lattice in the
     * first idle period, so the data is waiting at mount and the
     * dots are in the globe's very first commit. */
    const cancelIdle = whenIdle(() => {
      loadGlobeDots().catch(() => {});
    }, GLOBE_DOTS_IDLE_TIMEOUT_MS);
    const t = setTimeout(() => setGlobeReady(true), GLOBE_MOUNT_DELAY_MS);
    return () => {
      clearTimeout(t);
      cancelIdle();
    };
  }, []);
  /** False once the (200 vh) canvas has scrolled fully above the
   *  viewport — flips the R3F frameloop off so the GPU stops
   *  re-rendering a globe nobody can see. */
  const [globeOn, setGlobeOn] = useState(true);

  /* Scroll-driven sphere geometry. Globe is anchored to the BOTTOM
   * of the entire heading container (eyebrow + h1 + rotator) so it
   * sits visually below all three lines, never overlapping the
   * rotator. */
  useLayoutEffect(() => {
    const headingContainer = headingContainerRef.current;
    const card = cardRef.current;
    const globe = globeWrapperRef.current;
    if (!headingContainer || !card || !globe) return;

    const recalc = () => {
      const vw = window.innerWidth;
      const sy = window.scrollY;

      /* The canvas fills the FULL viewport (top: 0, height:
       * 100vh+) — see `.hero-globe` CSS. We drive the sphere's
       * position by computing the world-space Y offset that lands
       * the sphere center at the desired pixel Y inside the
       * viewport-sized canvas. */
      const headingDocBottom =
        headingContainer.offsetTop + headingContainer.offsetHeight;
      const initialSphereTopAbs =
        headingDocBottom + DEFAULT_GAP_AFTER_HEADING_PX + DEFAULT_SPHERE_INSET_PX;
      const sphereFinalTopAbs = DEFAULT_LOCK_TOP_PX + DEFAULT_SPHERE_INSET_PX;
      /* LOCK happens once the glass card has scrolled fully out
       * of the top of the viewport + a 35 px tail. Before then,
       * the sphere lerps its TOP from initialSphereTopAbs →
       * sphereFinalTopAbs and its DIAMETER from the initial to
       * the final pct, with the scroll progress as the lerp
       * parameter. Cards fade in only at lock. */
      const cardDocBottom = card.offsetTop + card.offsetHeight;
      const lockScrollPx = Math.max(1, cardDocBottom + HERO_LOCK_TAIL_PX);
      const cappedProgress = clamp01(sy / lockScrollPx);
      const nowLocked = sy >= lockScrollPx;

      /* On phones, lift the globe 20px (applied to the lerped top so
       * the initial + locked positions both shift up). */
      const mobileGlobeLiftPx = vw <= 600 ? 20 : 0;
      const sphereTopOnViewport =
        lerp(initialSphereTopAbs, sphereFinalTopAbs, cappedProgress) -
        mobileGlobeLiftPx;

      /* Sphere size: percentages of viewport WIDTH the rendered
       * sphere diameter should hit. Natural diameter (px, at
       * sphereScale = 1, world radius = 1) =
       *   canvasH / (cameraDistance × tanHalfFov). */
      const canvasH = globe.offsetHeight;
      const naturalDiameterPx = canvasH / (cameraDistance * tanHalfFov);
      /* On phones the globe starts at 85 % of viewport width (vs
       * 45 % on desktop) and finishes at 150 % for the full-bleed
       * dissolve. */
      const globeInitialPctEff = vw <= 600 ? 85 : DEFAULT_GLOBE_INITIAL_PCT;
      const globeFinalPctEff = vw <= 600 ? 150 : DEFAULT_GLOBE_FINAL_PCT;
      const desiredWidthVw = lerp(
        globeInitialPctEff / 100,
        globeFinalPctEff / 100,
        cappedProgress,
      );
      const desiredWidthPx = desiredWidthVw * vw;
      const nextScale = desiredWidthPx / naturalDiameterPx;
      setSphereScale(nextScale);
      const sphereRadiusPx = (naturalDiameterPx * nextScale) / 2;

      /* Back out the world-Y translation that lands the sphere
       * center at the desired canvas Y (canvas top = viewport
       * top, since .hero-globe is fixed at top: 0). */
      const projFactor = canvasH / (2 * tanHalfFov * cameraDistance);
      const sphereCenterCanvasY = sphereTopOnViewport + sphereRadiusPx;
      const dy = (canvasH / 2 - sphereCenterCanvasY) / projFactor;
      setSphereYOffset(dy);

      const vh = window.innerHeight;

      /* Keep the dot-to-globe ratio constant across viewports.
       * vw/vh are constant during scroll, so this only changes on
       * resize — setState bails otherwise. */
      const REF_ASPECT = 16 / 9;
      const nextDotSize = Math.max(
        0.003,
        Math.min(0.014, 0.011 * (vw / vh / REF_ASPECT)),
      );
      setDotSize(nextDotSize);

      /* Pin the globe at its locked position the moment the hero
       * card scrolls off (= cards appear). The user then gets
       * POST_LOCK_BUFFER pixels of consistent scroll BEFORE the
       * scatter kicks in, and a further dissolveSpan of frozen
       * scroll while the scatter plays out. After that the canvas
       * resumes scrolling up off the top. */
      const POST_LOCK_BUFFER = HERO_POST_LOCK_BUFFER_PX;
      const dissolveSpan = vh;
      const frozenWindow = POST_LOCK_BUFFER + dissolveSpan;
      const rawOverlap = nowLocked ? sy - lockScrollPx : 0;
      let effectiveOverlap: number;
      let rawProgress = 0;
      if (rawOverlap <= 0) {
        effectiveOverlap = 0;
      } else if (rawOverlap <= POST_LOCK_BUFFER) {
        effectiveOverlap = 0;
      } else if (rawOverlap <= frozenWindow) {
        effectiveOverlap = 0;
        rawProgress = (rawOverlap - POST_LOCK_BUFFER) / dissolveSpan;
      } else {
        effectiveOverlap = rawOverlap - frozenWindow;
        rawProgress = 1;
      }

      globe.style.position = 'fixed';
      globe.style.top = '0px';
      globe.style.transform =
        effectiveOverlap > 0 ? `translateY(${-effectiveOverlap}px)` : '';
      /* Once the (200 vh) canvas has fully cleared the top of the
       * viewport, hide it and stop the R3F frameloop — a fixed
       * full-page WebGL layer costs compositing + GPU every frame
       * even when all its content is off-screen / scattered.
       * canvasH > 0 guards suspended/zero-size viewports (e.g.
       * background tabs report 0 sizes; never hide there). */
      const canvasGone = canvasH > 0 && effectiveOverlap >= canvasH;
      globe.style.visibility = canvasGone ? 'hidden' : '';
      setGlobeOn(!canvasGone);
      setIsLocked(nowLocked);
      const clampedDissolve = clamp01(rawProgress);
      setDissolveProgress(clampedDissolve);
      setPreLockProgress(clamp01(sy / lockScrollPx));

      /* Statement heading state machine.
       *   trigger      = dissolveProgress crosses 0.9
       *   pin window   = 500 px of scroll AFTER trigger
       *   leaving      = scroll past that window */
      if (statementTriggerSyRef.current === null) {
        /* Only fire the trigger while we're STILL in the scatter
         * window (effectiveOverlap === 0 means the canvas is
         * still pinned). Past that window the 67.3 % heading must
         * never reappear. */
        if (
          clampedDissolve >= 0.9 &&
          hasUserScrolledRef.current &&
          effectiveOverlap === 0
        ) {
          statementTriggerSyRef.current = sy;
          setStatementPhase('visible');
        } else if (effectiveOverlap > 0) {
          setStatementPhase('leaving');
        }
        setBunnPhase('hidden');
        setUnpinOffsetPx(0);
      } else {
        const distance = sy - statementTriggerSyRef.current;
        /* BUNN line appears 400 px after the 67.3 % heading was
         * triggered; the same boolean drives the 67.3 % heading's
         * "shifted" state. */
        setBunnPhase(distance >= BUNN_LINE_AFTER_PX ? 'visible' : 'hidden');
        /* Unpin window — 100 px AFTER the BUNN appears, the block
         * stops being pinned at viewport-centre and tracks scroll
         * 1:1 via the --unpin CSS custom property. */
        const UNPIN_THRESHOLD = 500;
        setUnpinOffsetPx(
          distance > UNPIN_THRESHOLD ? distance - UNPIN_THRESHOLD : 0,
        );
        if (distance < 0) {
          if (clampedDissolve < 0.9) {
            statementTriggerSyRef.current = null;
            setStatementPhase('hidden');
            setBunnPhase('hidden');
          } else {
            setStatementPhase('visible');
          }
        } else if (distance > UNPIN_THRESHOLD + window.innerHeight) {
          setStatementPhase('leaving');
        } else {
          setStatementPhase('visible');
        }
      }
    };

    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(headingContainer);
    ro.observe(card);
    const onScroll = () => {
      hasUserScrolledRef.current = true;
      recalc();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', recalc);
    if (document.fonts?.ready) {
      document.fonts.ready.then(recalc);
    }
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', recalc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div
        className={`hero-globe${isLocked ? ' hero-globe--locked' : ''}`}
        aria-hidden="true"
        ref={globeWrapperRef}
      >
        {globeReady && (
          <Suspense fallback={null}>
            <Globe
              sphereYOffset={sphereYOffset}
              sphereScale={sphereScale}
              cardsVisible={isLocked}
              cardSizePct={100}
              dissolveProgress={dissolveProgress}
              preLockProgress={preLockProgress}
              dotSize={dotSize}
              frameloop={globeOn ? 'always' : 'never'}
            />
          </Suspense>
        )}
      </div>

      {/* Statement heading — fixed overlay pinned to viewport-
          centre for ≈500 px of scroll after the globe scatters,
          then released. */}
      <h2
        className={`statement-heading statement-heading--${statementPhase}${
          bunnPhase === 'visible' ? ' statement-heading--shifted' : ''
        }${unpinOffsetPx > 0 ? ' statement-heading--unpinned' : ''}`}
        aria-hidden={statementPhase === 'hidden'}
        style={{
          '--unpin': `${unpinOffsetPx}px`,
          ...(statementPhase !== 'visible' && statementPhase !== 'leaving'
            ? { top: '-200vh' }
            : {}),
        } as React.CSSProperties}
      >
        67.3% of cross-border property buyers worry more about{' '}
        <span className="statement-chip-target">
          how to pay
          <svg className="statement-chip-svg" aria-hidden="true">
            <rect
              className="statement-chip-rect"
              rx="15"
              ry="15"
              pathLength="1"
            />
          </svg>
        </span>{' '}
        than about anything else
      </h2>

      <div
        className={`bunn-heading bunn-heading--${bunnPhase}${
          unpinOffsetPx > 0 ? ' bunn-heading--unpinned' : ''
        }`}
        aria-hidden={bunnPhase === 'hidden'}
        style={{
          '--unpin': `${unpinOffsetPx}px`,
          ...(bunnPhase === 'hidden'
            ? { top: '-200vh' }
            : {}),
        } as React.CSSProperties}
      >
        <StaggerText
          text="BUNN unsticks the wire."
          play={bunnPhase === 'visible'}
          stagger={0.04}
          direction="bottom"
          transition={{
            ease: [0.25, 0.1, 0.25, 1],
            duration: 0.5,
          }}
          style={{ display: 'inline-block' }}
        />
        {' '}
        <motion.span
          className="bunn-heading__easy"
          initial={{ x: -60, opacity: 0 }}
          animate={
            bunnPhase === 'visible'
              ? { x: 0, opacity: 1 }
              : { x: -60, opacity: 0 }
          }
          transition={{
            x: { ease: 'backOut', duration: 0.55, delay: 0.96 },
            opacity: { duration: 0.3, delay: 0.96 },
          }}
          style={{ display: 'inline-block' }}
        >
          Easy
        </motion.span>
      </div>
    </>
  );
}

/** Country rotator line — "ENABLE YOUR CLIENT FROM <chip> TO PAY".
 *  Owns the 2.2 s rotation interval so each city swap re-renders
 *  only this framer-motion subtree instead of the whole app (an
 *  app-wide reconcile every 2.2 s caused visible hitches whenever
 *  a swap landed mid-scroll). */
function HeroRotator() {
  const [countryIdx, setCountryIdx] = useState(0);
  /* Two-step slide history — see the comments on the derived
   * flags below for why the chip needs to know the previous TWO
   * slides around the "52+ countries" entry. */
  const prevCountryIdxRef = useRef(0);
  const prevPrevCountryIdxRef = useRef(0);
  useEffect(() => {
    prevPrevCountryIdxRef.current = prevCountryIdxRef.current;
    prevCountryIdxRef.current = countryIdx;
  }, [countryIdx]);
  const is52Current = COUNTRIES[countryIdx].name === '52+ countries';
  const is52Prev =
    COUNTRIES[prevCountryIdxRef.current].name === '52+ countries';
  const is52PrevPrev =
    COUNTRIES[prevPrevCountryIdxRef.current].name === '52+ countries';
  /* Centred while the current OR previous slide is 52 — flips back
   * on the swap after next, which is the transition that should
   * read as the smooth 52-collapse. */
  const isCentered = is52Current || is52Prev;
  /* One more step keeps backOut easing for the layout shift right
   * after the rotator class flips back from --centered. */
  const transitionInvolves52 = is52Current || is52Prev || is52PrevPrev;
  useEffect(() => {
    const id = setInterval(
      () => setCountryIdx((i) => (i + 1) % COUNTRIES.length),
      COUNTRY_ROTATE_MS,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <p
      className={`rotator${isCentered ? ' rotator--centered' : ''}`}
      style={
        {
          '--chip-y-offset': `${DEFAULT_CHIP_Y_OFFSET_PX}px`,
        } as React.CSSProperties
      }
    >
      {/* LayoutGroup synchronizes motion-layout animations across
          the chip and the suffix so when the chip's width changes
          on every city swap, the surrounding suffix ("TO PAY")
          slides to its new position with the SAME timing. */}
      <LayoutGroup>
        <motion.span
          layout
          className="rotator-prefix"
          transition={
            transitionInvolves52
              ? LAYOUT_BACKOUT_TRANSITION
              : LAYOUT_INSTANT_TRANSITION
          }
        >
          {['ENABLE', 'YOUR', 'CLIENT'].map((word, i) => (
            <Fragment key={word}>
              <span
                className="blur-in blur-in--ease-out"
                style={rotatorWordDelay(i)}
              >
                {word}
              </span>
              {' '}
            </Fragment>
          ))}
        </motion.span>
        {' '}
        {/* "FROM" + chip + "TO PAY" grouped in rotator-tail
            (white-space: nowrap): one line on desktop; on mobile
            the group wraps as a unit. */}
        <span className="rotator-tail">
          <motion.span
            layout
            className="rotator-prefix rotator-in"
            transition={
              transitionInvolves52
                ? LAYOUT_BACKOUT_TRANSITION
                : LAYOUT_INSTANT_TRANSITION
            }
          >
            <span
              className="blur-in blur-in--ease-out"
              style={rotatorWordDelay(3)}
            >
              FROM
            </span>
          </motion.span>
          {/* No JSX space here: the chip's own margin is the whole
              gap, so "FROM" sits as close to the chip as "TO" does.
              (The suffix's leading space is dropped by the browser
              at the start of its inline-block, so a space here made
              the left gap a word wider than the right.) */}
          {/* The chip's blur-in runs on this wrapper, not on the chip:
              the chip resizes on every city swap through motion's
              layout animation, which drives the chip's inline
              transform — and a CSS animation of that property
              outranks inline styles (with fill `both`, for good).
              An inline-block around the inline-flex chip takes the
              chip's baseline, so the line lays out as before. */}
          <span
            className="blur-in blur-in--ease-out"
            style={rotatorWordDelay(4)}
          >
            <motion.span
              layout
              className="rotator-name-chip"
              transition={LAYOUT_BACKOUT_TRANSITION}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={countryIdx}
                  className="rotator-content"
                  layout
                  aria-hidden="true"
                >
                  {/* Per-character RotatingText animation: every
                      glyph slides y: 100% → 0 → -120% with a spring
                      + stagger keyed off the LAST character. */}
                  <span className="rotator-name">
                    {(() => {
                      const cityName =
                        COUNTRIES[countryIdx].name.toUpperCase();
                      const chars = Array.from(cityName);
                      return chars.map((char, i) => (
                        <motion.span
                          key={i}
                          className="rotator-name-char"
                          initial={{ y: '100%' }}
                          animate={{ y: 0 }}
                          exit={{ y: '-120%' }}
                          transition={{
                            ...ROTATOR_SPRING,
                            delay: (chars.length - 1 - i) * ROTATOR_STAGGER,
                          }}
                        >
                          {char === ' ' ? ' ' : char}
                        </motion.span>
                      ));
                    })()}
                  </span>
                  {COUNTRIES[countryIdx].photo && (
                    <motion.span
                      className="rotator-photo-frame"
                      aria-hidden="true"
                      initial={{ y: '100%', opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: '-120%', opacity: 0 }}
                      transition={{
                        ...ROTATOR_SPRING,
                        delay:
                          COUNTRIES[countryIdx].name.length *
                          ROTATOR_STAGGER,
                      }}
                    >
                      <img
                        className="rotator-photo"
                        src={COUNTRIES[countryIdx].photo as string}
                        alt=""
                      />
                    </motion.span>
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.span>
          </span>
          {/* "TO PAY" — layout-animated so it overshoots + bounces
              back whenever the chip width changes. */}
          <motion.span
            layout
            className="rotator-suffix"
            transition={LAYOUT_BACKOUT_TRANSITION}
          >
            {' '}
            {['TO', 'PAY'].map((word, i) => (
              <Fragment key={word}>
                <span
                  className="blur-in blur-in--ease-out"
                  style={rotatorWordDelay(5 + i)}
                >
                  {word}
                </span>
                {i < 1 && ' '}
              </Fragment>
            ))}
          </motion.span>
        </span>
      </LayoutGroup>
    </p>
  );
}

/* ── Hero-first mount ───────────────────────────────────────
 * The first commit renders only the top bar and the hero. Every
 * section after it lives in BelowFold.tsx (its own lazy chunk)
 * and mounts on the FIRST of:
 *   • the hero entrance is over — BELOW_FOLD_DELAY_MS after mount,
 *     in the next idle period (H1 0 → 2 s, globe gather 2 → 3.9 s,
 *     card + rotator words done by ~3.8 s);
 *   • scroll intent (wheel / touch / key / scroll) — the hero is
 *     ~3.5 screens of scroll-driven choreography, so the sections
 *     are in long before the visitor reaches them;
 *   • a #hash in the URL on load (a deep link wants the page now).
 * Rendering everything with the hero put ~11 000 px of DOM, style
 * and layout nobody can see yet into the first commit: it delayed
 * the first paint and stuttered the H1 + globe entrance. */
const BELOW_FOLD_DELAY_MS = 4500;
/* requestIdleCallback timeouts — the longest a step waits for an
 * idle period (e.g. while the visitor is already scrolling). */
const BELOW_FOLD_START_TIMEOUT_MS = 1000;
const BELOW_FOLD_STAGE_TIMEOUT_MS = 500;
const SCROLL_INTENT_EVENTS = ['wheel', 'touchstart', 'keydown', 'scroll'];

/** Mounts BelowFold one section at a time, top to bottom: each
 *  idle callback adds the next section in its own transition and
 *  commit, so no frame carries more than one section's render,
 *  style and layout (mounting them all at once cost a single
 *  ~145 ms frame at 4× CPU throttle). Until the last one is in, a
 *  placeholder keeps the document from ending at the hero's bottom
 *  edge: Lenis clamps scrolling to the document height, and the
 *  hero's scroll choreography runs on past that edge. */
function BelowFoldMount() {
  /* Chunk loaded yet, and how many sections are mounted so far. */
  const [loaded, setLoaded] = useState(false);
  const [stage, setStage] = useState(0);
  /* The chunk failed to load and the page can't reload for it. */
  const [failed, setFailed] = useState(false);
  const allIn = stage >= BELOW_FOLD_STAGES.length;

  useEffect(() => {
    let started = false;
    let timer = 0;
    let cancelIdle = () => {};
    const stopWaiting = () => {
      clearTimeout(timer);
      cancelIdle();
      SCROLL_INTENT_EVENTS.forEach((e) =>
        window.removeEventListener(e, start),
      );
    };
    const start = () => {
      if (started) return;
      started = true;
      stopWaiting();
      /* The first section mounts in the idle period after the
       * chunk has been fetched and evaluated, not in the same task.
       * If it can't be loaded even under fresh URLs (loadBelowFold),
       * reload for it (lib/chunks) — or, when this load already is
       * that reload, drop the placeholder, so the page ends at the
       * hero rather than in two blank screens. */
      const load = () =>
        loadBelowFold().then(
          () => setLoaded(true),
          () => {
            if (!reloadForFailedChunk()) setFailed(true);
          },
        );
      if (isChunkReloadPage()) afterPageLoad(load);
      else load();
    };
    SCROLL_INTENT_EVENTS.forEach((e) =>
      window.addEventListener(e, start, { passive: true }),
    );
    timer = window.setTimeout(() => {
      cancelIdle = whenIdle(start, BELOW_FOLD_START_TIMEOUT_MS);
    }, BELOW_FOLD_DELAY_MS);
    if (window.location.hash) start();
    return () => {
      started = true;
      stopWaiting();
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    /* Re-measure Lenis's scroll limit as each section lands. Lenis
     * stops wheel input at the limit it last measured, and its own
     * resize observer is debounced (250 ms after the LAST change, so
     * only once the last section is in): a visitor already scrolling
     * fast lost the input in between. Only the dimensions, not
     * lenis.resize(): that also resets the scroll target to the
     * current position, cutting short a scroll that is still easing
     * in (it did, once the last section was in). */
    if (stage > 0) getLenis().dimensions.resize();
    if (stage < BELOW_FOLD_STAGES.length) {
      /* Wait for the next frame before asking for idle time: one
       * idle period can run several callbacks back to back, and
       * their sections would then all land in the same frame's
       * style + layout. Going through rAF first means the previous
       * section has been rendered before the next one is added. */
      let cancelIdle = () => {};
      const raf = requestAnimationFrame(() => {
        cancelIdle = whenIdle(
          () => startTransition(() => setStage((s) => s + 1)),
          BELOW_FOLD_STAGE_TIMEOUT_MS,
        );
      });
      return () => {
        cancelAnimationFrame(raf);
        cancelIdle();
      };
    }
    /* All in. Warm the contact popup's chunk, so the first CTA click
     * doesn't wait on the network (a failed fetch is retried there,
     * and again on the click). */
    return whenIdle(() => {
      loadContactPopup().catch(() => {});
    }, BELOW_FOLD_STAGE_TIMEOUT_MS);
  }, [loaded, stage]);

  /* The Suspense boundary is mounted from the start (empty), so
   * the first stage's lazy render suspends its TRANSITION instead
   * of committing a fallback — React would otherwise throttle
   * that fallback's reveal and hand the first two sections to
   * the browser in the same commit. */
  return (
    <>
      <Suspense fallback={null}>
        {stage > 0 && <BelowFold stage={stage} />}
      </Suspense>
      {!allIn && !failed && (
        <div className="below-fold-placeholder" aria-hidden="true" />
      )}
    </>
  );
}

/** Every CTA on the page (any `.cta-fab` outside the popup) opens
 *  the contact popup. The popup is its own lazy chunk — its form,
 *  gsap timeline and CSS stay out of the first paint — but the
 *  hero CTA is clickable from ~3 s, before anything below the fold
 *  has loaded. So this ONE document-level listener is in the entry
 *  bundle from the first commit: it cancels the #contact navigation
 *  (no hash jump), asks for the popup to open (lib/contact replays
 *  the request once the popup has mounted and parked itself
 *  off-screen, so the first open plays the normal slide-in) and
 *  mounts the popup if it isn't yet. BelowFoldMount warms the chunk
 *  in idle time, so a click normally finds it loaded. If the chunk
 *  can't be loaded, even under a fresh URL, the click reloads the
 *  page and the reloaded page opens the popup (lib/chunks). */
function ContactPopupHost() {
  /* The popup component once its chunk has loaded — held in state
   * rather than rendered through React.lazy: a lazy component's
   * first render always suspends, and React then holds back the
   * reveal of the new Suspense boundary for ~300 ms, which would
   * land between the click and the slide-in. */
  const [Popup, setPopup] = useState<ComponentType | null>(null);
  useEffect(() => {
    const openPopup = () => {
      requestContactOpen();
      loadContactPopup().then(
        (m) => setPopup(() => m.default),
        /* Not even under a fresh URL: a deploy has replaced the chunk,
         * or gsap, which it imports, is what failed — and import()
         * won't fetch that again. Reload, and open the popup on the
         * new page. */
        () => reloadForFailedChunk(openContactAfterReload),
      );
    };
    const onClick = (e: MouseEvent) => {
      const cta =
        e.target instanceof Element ? e.target.closest(CTA_SELECTOR) : null;
      /* The form's own submit button is a .cta-fab too. */
      if (!cta || cta.closest('.contact-popup')) return;
      e.preventDefault();
      openPopup();
    };
    document.addEventListener('click', onClick);
    /* This load is that reload: open the popup the click asked for,
     * once the page has loaded and painted. (If WebKit still hands
     * back the old error then, loadContactPopup's retry under a
     * fresh URL gets past it — see isChunkReloadPage.) */
    if (takeContactOpenAfterReload()) {
      afterPageLoad(() => whenIdle(openPopup, BELOW_FOLD_STAGE_TIMEOUT_MS));
    }
    return () => document.removeEventListener('click', onClick);
  }, []);
  /* Until the popup has loaded, render its closed state: the panel
   * parked just past the right edge. That panel's box-shadow shades
   * the right edge of the viewport, which has always been part of
   * how the page looks, so the stand-in keeps it from the first
   * paint. The real popup replaces it in the same commit, parked
   * the same way (its layout effect) before it paints. */
  return Popup ? (
    <Popup />
  ) : (
    <div className="contact-popup" aria-hidden="true">
      <div
        className="contact-panel"
        style={{ transform: 'translateX(100%)' }}
      />
    </div>
  );
}

/* ── Directional "ease into focus" (replaces the hard snap) ──
 * The old proximity Snap pulled the scroll to the NEAREST block
 * edge — which yanked the view BACKWARD whenever you'd scrolled a
 * little past a section ("jump back"). Instead, when the user
 * settles after a scroll gesture, we gently ease to the upcoming
 * block edge IN THE DIRECTION they were already scrolling (never
 * the opposite), so each block slides into focus and the scroll
 * never jumps back. Each ease is "armed" by a real wheel/touch/key
 * gesture, so it fires once per gesture and never chains from one
 * anchor to the next on its own (and the hero's scroll-driven globe
 * keeps its free, continuous scroll). Everywhere but on phones
 * (App's scroll-model effect); returns its uninstall. */
function installFocusEase(lenis: Lenis): () => void {
  const sels = [
    '.hero',
    '.how-section',
    '.info-section',
    '.logos-section',
    '.carousel-section',
    '.brokers-section',
    '.faq-section',
  ];
  const isDesktop =
    typeof window !== 'undefined' && window.innerWidth > 600;
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

  /* Absolute scroll target for each block edge, recomputed live
   * (rect + current scroll) so transforms / layout shifts never
   * desync the anchors. Desktop eases the footer's BOTTOM to the
   * viewport bottom (so the cityscape + footer sit fully in view);
   * mobile eases the cityscape top — matching the old align logic. */
  const getTargets = () => {
    const cur = lenis.scroll;
    const arr: number[] = [];
    sels.forEach((s) => {
      const el = document.querySelector<HTMLElement>(s);
      if (el) arr.push(el.getBoundingClientRect().top + cur);
    });
    if (isDesktop) {
      const f = document.querySelector<HTMLElement>('.site-footer');
      if (f)
        arr.push(
          f.getBoundingClientRect().bottom + cur - window.innerHeight,
        );
    } else {
      const cs = document.querySelector<HTMLElement>('.cityscape-section');
      if (cs) arr.push(cs.getBoundingClientRect().top + cur);
    }
    return arr.map((v) => Math.max(0, Math.round(v))).sort((a, b) => a - b);
  };

  let armed = false;
  let lastDir = 0;
  let prev = lenis.scroll;
  let stopTimer = 0;
  let safety = 0;
  let snapping = false;

  const arm = () => {
    armed = true;
  };
  const onKey = (e: KeyboardEvent) => {
    if (
      ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(
        e.key,
      )
    )
      armed = true;
  };
  window.addEventListener('wheel', arm, { passive: true });
  window.addEventListener('touchmove', arm, { passive: true });
  window.addEventListener('keydown', onKey);

  const trySnap = () => {
    if (!armed || snapping || lastDir === 0) return;
    armed = false; // consume this gesture — never chain to the next anchor
    const cur = lenis.scroll;
    /* Reach = one full viewport: any block edge within a screen in
     * the travel direction captures the settle, so consecutive
     * blocks click into place one by one instead of flying past.
     * Long interiors (hero choreography, the card stack, mid-FAQ)
     * sit farther than a viewport from the next edge and keep
     * their free, continuous scroll. */
    const threshold = window.innerHeight;
    const targets = getTargets();
    let target: number | null = null;
    if (lastDir > 0) {
      // scrolling DOWN → only the nearest edge BELOW, within reach
      for (const a of targets) {
        const gap = a - cur;
        if (gap > 8 && gap <= threshold) {
          target = a;
          break;
        }
      }
    } else {
      // scrolling UP → only the nearest edge ABOVE, within reach
      for (let i = targets.length - 1; i >= 0; i--) {
        const gap = cur - targets[i];
        if (gap > 8 && gap <= threshold) {
          target = targets[i];
          break;
        }
      }
    }
    if (target == null) return;
    snapping = true;
    clearTimeout(safety);
    safety = window.setTimeout(() => {
      snapping = false;
    }, 1500);
    lenis.scrollTo(target, {
      duration: 1.1,
      easing: easeOut,
      lock: false,
      onComplete: () => {
        clearTimeout(safety);
        snapping = false;
        prev = lenis.scroll;
      },
    });
  };

  const onScroll = () => {
    const cur = lenis.scroll;
    const d = cur - prev;
    if (Math.abs(d) > 0.3) lastDir = Math.sign(d);
    prev = cur;
    if (snapping) return;
    clearTimeout(stopTimer);
    stopTimer = window.setTimeout(trySnap, 160);
  };

  lenis.on('scroll', onScroll);
  return () => {
    lenis.off('scroll', onScroll);
    window.removeEventListener('wheel', arm);
    window.removeEventListener('touchmove', arm);
    window.removeEventListener('keydown', onKey);
    clearTimeout(stopTimer);
    clearTimeout(safety);
  };
}

function App() {
  const headingContainerRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const glassSurfaceRef = useRef<HTMLDivElement | null>(null);
  const ctaFabRef = useRef<HTMLAnchorElement | null>(null);


  /* ── Scroll model ──
   * Phones (touch-primary, phone-sized: lib/stepScroll PHONE_QUERY)
   * step one idea per swipe; everything else — mouse wheel,
   * trackpad, keys, touch tablets — keeps the free scroll with its
   * "ease into focus" (installFocusEase above). Re-chosen when the
   * query flips (rotation, a resized window), the old model's
   * listeners removed first. */
  useEffect(() => {
    const lenis = getLenis();
    const phone = window.matchMedia(PHONE_QUERY);
    let uninstall = () => {};
    const apply = () => {
      uninstall();
      uninstall = phone.matches
        ? installStepScroll(lenis)
        : installFocusEase(lenis);
    };
    apply();
    phone.addEventListener('change', apply);
    return () => {
      phone.removeEventListener('change', apply);
      uninstall();
    };
  }, []);

  /* All the layout/scroll knobs that used to be live-tunable
   * via the dev toggle bar are now baked-in constants — the
   * scroll-driven ones moved into HeroScrollScene and the
   * info-section ones into BelowFold; only the card-positioning
   * knob remains here. */
  const cardBottomPadding = CARD_BOTTOM_PADDING_PX;

  /* S-curve cutout in the bottom-right corner of the glass card so
   * the round CTA appears to dissolve the surface around it. */
  useCardNotch(glassSurfaceRef, ctaFabRef, 35);

  /* Position the glass card so that on first load its BOTTOM
   * sits exactly cardBottomPadding pixels above the viewport
   * bottom. `.hero-heading` is `position: absolute` (out of
   * flow), so the card's natural document Y is the parent's
   * top (= 0 of `.hero`). With `margin-top: M`, card top in
   * doc = M. On first load (sy = 0), card top in viewport = M
   * and card bottom = M + cardHeight. Want card bottom =
   * vh − cardBottomPadding, so:
   *     M = vh − cardHeight − cardBottomPadding. */
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const recalcCardPos = () => {
      const vh = window.innerHeight;
      const cardH = card.offsetHeight;
      const marginTop = Math.max(0, vh - cardH - cardBottomPadding);
      card.style.marginTop = `${marginTop}px`;
    };
    recalcCardPos();
    const ro = new ResizeObserver(recalcCardPos);
    ro.observe(card);
    window.addEventListener('resize', recalcCardPos);
    if (document.fonts?.ready) {
      document.fonts.ready.then(recalcCardPos);
    }
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recalcCardPos);
    };
  }, [cardBottomPadding]);

  /* scrollRestoration = 'manual' is set at module level (top of
   * file) so it fires before any React render or layout effect.
   * No useEffect needed here. */

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <img src="/uaerealestate/logos/bunn-topbar-logo.svg" alt="BUNN" className="brand__logo" />
        </div>
      </header>

      <section className="hero">
        <div className="hero-heading" ref={headingContainerRef}>
          <RiseInChars
            className="eyebrow"
            text="FOR THE UAE REAL ESTATE MARKET"
            stagger={20}
          />
          {/* Two-line headline — first part regular, second part bold. */}
          <BlurInWords
            as="h1"
            className="hero-h1 hero-h1--light"
            text="DON'T LOSE CLOSED DEALS"
            stagger={120}
          />
          <BlurInWords
            as="h1"
            className="hero-h1 hero-h1--bold"
            text="TO A STUCK SWIFT WIRE"
            stagger={260}
          />
          <HeroRotator />
        </div>


        <div className="hero-card" ref={cardRef}>
          {/* Glass surface carries both the clip-path (s-curve
              cutout around the CTA) AND the backdrop-filter on
              the same element — otherwise the clip-path's
              backdrop-root scoping prevents backdrop-filter
              from sampling content behind the panel. */}
          <GlassSurface
            ref={glassSurfaceRef}
            width="100%"
            height="auto"
            borderRadius={35}
          >
              <div className="hero-card__inner">
                <div className="subhead-steps" role="list">
                  {SUBHEAD_STEPS.map((step, i) => (
                    <Fragment key={i}>
                      <div
                        className="subhead-step-item"
                        role="listitem"
                        style={{ width: `${step.width}px` }}
                      >
                        <p className="subhead-step">{step.text}</p>
                      </div>
                      {i < SUBHEAD_STEPS.length - 1 && (
                        <span
                          className={`subhead-divider divider-${i}`}
                          aria-hidden="true"
                        />
                      )}
                    </Fragment>
                  ))}
                </div>

                {/* Compliance footer — pinned bottom-left of the
                    glass card. The two regulator marks sit beside a
                    small "FULLY COMPLIANT" caption so anyone landing
                    on the page reads the trust signal alongside the
                    CTA on the opposite corner. */}
                <div className="compliance" aria-label="Fully compliant">
                  <span className="compliance__label">FULLY COMPLIANT</span>
                  <div className="compliance__logos">
                    <img
                      className="compliance__logo compliance__logo--dld"
                      src="/uaerealestate/logos/dld.webp"
                      alt="Dubai Land Department"
                    />
                    <img
                      className="compliance__logo compliance__logo--cb"
                      src="/uaerealestate/regulators/cb-uae.webp"
                      alt="Central Bank of the UAE"
                    />
                    <img
                      className="compliance__logo compliance__logo--vara"
                      src="/uaerealestate/regulators/vara.webp"
                      alt="VARA — Virtual Assets Regulatory Authority"
                    />
                  </div>
                </div>
              </div>
          </GlassSurface>

          {/* CTA — round black button at the bottom-right of the
              glass card. Lives as a sibling of the glass surface
              (NOT inside it) so the clip-path s-curve cutout on
              the glass flows around the pill without clipping
              the pill itself. */}
          {/* BorderGlow wraps the CTA so the React Bits
              pointer-following glow lights up the edges. The
              `cta-fab--glow` modifier strips the wrapper's
              own positioning so BorderGlow can carry it. */}
          {/* CTA stack — three layers on the same 270×56 pill:
                BorderGlow (outermost) — pointer-following WHITE
                  halo + mesh-gradient border on hover near edges
                GlareHover (middle)    — diagonal white glare
                  sweeps across the pill on hover entry
                <a> (inner)            — actual black pill with
                  bold white text. */}
          <BorderGlow
            className="cta-fab-glow-wrap"
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
                ref={ctaFabRef}
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

        {/* MUST render after .hero-card: HeroScrollScene's layout
            effect reads cardRef on mount, and refs to LATER JSX
            siblings aren't attached yet when an earlier child's
            effects run. All its elements are position:fixed with
            explicit z-indexes, so DOM order doesn't affect paint. */}
        <HeroScrollScene
          headingContainerRef={headingContainerRef}
          cardRef={cardRef}
        />
      </section>

      {/* How it works, info cards, logos, carousel, brokers, FAQ,
          cityscape and footer — mounted after the hero entrance,
          one section per idle callback (see BelowFoldMount). */}
      <BelowFoldMount />

      {/* ── Contact popup — opens on any CTA button click ──── */}
      <ContactPopupHost />
    </main>
  );
}

export default App;

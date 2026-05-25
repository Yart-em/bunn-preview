import { Fragment, Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
// Lazy-loaded: pulls in Three.js + R3F + drei. Code-splitting it (and
// BrokersCoin below) keeps that ~600 KB out of the initial bundle so
// the page paints/interacts fast; the globe streams in at its 2 s mount.
const Globe = lazy(() => import('./components/Globe/Globe'));
import GlassSurface from './components/GlassSurface/GlassSurface';
import BorderGlow from './components/BorderGlow/BorderGlow';
import GlareHover from './components/GlareHover/GlareHover';
import BlurText from './components/BlurText/BlurText';
import SplitText from './components/SplitText/SplitText';
import { StaggerText } from './components/StaggerText/StaggerText';
import ScrollStack, {
  ScrollStackItem,
} from './components/ScrollStack/ScrollStack';
// import InfiniteMenu from './components/InfiniteMenu/InfiniteMenu';
// import type { InfiniteMenuItem } from './components/InfiniteMenu/InfiniteMenu';
import CurvedLoop from './components/CurvedLoop/CurvedLoop';
import SlideCarousel from './components/SlideCarousel/SlideCarousel';
import type { SlideData } from './components/SlideCarousel/SlideCarousel';
import { useCardNotch } from './hooks/useCardNotch';
const BrokersCoin = lazy(() => import('./components/BrokersCoin/BrokersCoin'));
import CityScape from './components/CityScape/CityScape';
import ContactPopup from './components/ContactPopup/ContactPopup';
import { getLenis } from './lib/lenis';
import Snap from 'lenis/snap';

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

/* ── FAQ items ──────────────────────────────────────────── */
const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'Is this legal in the UAE?',
    a: 'Yes. The Virtual Asset Service Provider is licensed by VARA. The payment provider is regulated by CBUAE. You receive AED only. BUNN and partners hold the regulated activity.',
  },
  {
    q: 'Do I have to register as a crypto business?',
    a: 'No. You quote AED, you receive AED. To you, the inbound is an AED wire from buyers account, like any other inbound.',
  },
  {
    q: 'Who is responsible for KYC and AML on the buyer?',
    a: 'Our partner OKX holds the VARA license. Identity, sanctions, PEP, and adverse-media checks run on every payer. You receive the full KYC pack with each settlement, sufficient for your customer-due-diligence file under UAE Federal Decree-Law 20 of 2018.',
  },
  {
    q: 'How is AML verified for the crypto payment?',
    a: 'On-chain analysis through Elliptic runs on every payer wallet before the transaction confirms. Wallets with direct or one-hop exposure to OFAC sanctions, mixers, or illicit clusters are blocked.',
  },
  {
    q: 'Do you handle Travel Rule, goAML reporting, and record retention?',
    a: 'Yes. VARA Travel Rule under IVMS 101. Originator and beneficiary info travels with every above-threshold transaction. STRs filed to the UAE FIU via goAML when triggered. Records retained 5 years per UAE law.',
  },
  {
    q: 'What if my buyer fails KYC?',
    a: 'The link expires, no funds move, you’re notified. The buyer can re-submit or you can cancel.',
  },
  {
    q: 'Which stablecoins do you accept?',
    a: 'USDC and USDT on Ethereum, Tron, Solana and many others chains.',
  },
  {
    q: 'What’s the fee?',
    a: '1% of the AED amount, all-in. No FX spread. No bank deductions on the receiving side.',
  },
  {
    q: 'How does this show up in my accounting?',
    a: 'AED in, AED out. The bank statement reads as an inbound wire from the settlement account, with the unit reference in the memo.',
  },
  {
    q: 'What about VAT and DLD fees?',
    a: 'Settled in AED through your normal flow. BUNN does not interact with DLD.',
  },
  {
    q: 'How long does onboarding take?',
    a: '24 hours for a developer. Same day for a broker. We handle compliance review during onboarding so the first link works.',
  },
  {
    q: 'What’s the per-transaction limit?',
    a: 'USD 5 million equivalent standard. Higher with pre-approval, case by case.',
  },
  {
    q: 'What if BUNN goes insolvent before AED reaches my account?',
    a: 'BUNN routes the flow without holding the funds. At any moment, your buyer’s money is in one of four places: the buyer’s own wallet before payment, a VARA-licensed custody provider after the buyer sends stablecoin, a CBUAE-licensed payment provider after AED conversion, or your account after settlement. Every step is regulated.',
  },
  {
    q: 'Will my bank flag the inbound wire from BUNN?',
    a: 'No. Inbound wires arrive at local bank under the name of your client like any other fiat incoming transfer.',
  },
];

/* Default LOCK threshold. When the user scrolls, the globe FRAME
 * rides 1 : 1 with the page UNTIL its top edge reaches this many
 * pixels from the window's top — at that moment the frame pins
 * and the sphere holds at its final size. Live-tunable. */
const DEFAULT_LOCK_TOP_PX = 230;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/* ── BlurText-style entrance animation primitives ───────────
 * Match the keyframes the BlurText component uses for the H1
 * lines. Each rotator word + the chip + the card content uses
 * these so the page-wide entrance reads as ONE continuous
 * per-word reveal. */
const BLUR_INITIAL = { filter: 'blur(10px)', opacity: 0, y: -50 };
const BLUR_ANIMATE = {
  filter: ['blur(10px)', 'blur(5px)', 'blur(0px)'],
  opacity: [0, 0.5, 1],
  y: [-50, 5, 0],
};
const BLUR_TIMES = [0, 0.5, 1];
/* Each blur transition's TOTAL duration. Two transition steps
 * × stepDuration matches BlurText's internal math. */
const BLUR_STEP = 0.45;
const BLUR_TOTAL = BLUR_STEP * 2;

/* Sequenced timing.
 *   • H1 lines 1 + 2 (BlurText)            ≈ 0 → 1.95 s
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
/* Card entrance animation delay lives in index.css under
 * `.hero-card .glass-surface { animation-delay }` — kept in
 * sync at 2 s (same time as globe mount). */

const blurTransition = (delaySec: number) => ({
  duration: BLUR_TOTAL,
  times: BLUR_TIMES,
  delay: delaySec,
});


/** Per-word reveal helper — splits text into clip-masked spans
 *  so each word can slide up + fade in with a staggered delay.
 *  `baseIndex` offsets the word counter so heading + body words
 *  form one continuous stagger across both elements. */
const WordReveal = ({
  text,
  baseIndex = 0,
  className = '',
}: {
  text: string;
  baseIndex?: number;
  className?: string;
}) => (
  <>
    {text.split(' ').map((word, j) => (
      <span key={j} className="word-reveal">
        <span
          className={`word-reveal__inner ${className}`}
          style={{ '--wi': baseIndex + j } as React.CSSProperties}
        >
          {word}
        </span>
      </span>
    ))}
  </>
);

/** Cities cycled in the rotator under the H1. Each city pairs with
 *  a buyer-portrait that swaps in alongside the city name; the
 *  catch-all "52+ countries" entry has no portrait — it's a sweep
 *  rather than a single buyer. */
const COUNTRIES: { name: string; photo: string | null }[] = [
  { name: 'China', photo: '/uaerealeastate/portraits/beijing.png' },
  { name: 'Ukraine', photo: '/uaerealeastate/portraits/kyiv.png' },
  { name: 'Nigeria', photo: '/uaerealeastate/portraits/lagos.png' },
  { name: 'Pakistan', photo: '/uaerealeastate/portraits/karachi.png' },
  { name: 'Lebanon', photo: '/uaerealeastate/portraits/beirut.png' },
  { name: 'Brazil', photo: '/uaerealeastate/portraits/rio.png' },
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

/* ── Buyer persona data for the InfiniteMenu globe ───────
 * Temporarily commented out while the personas section is
 * disabled. Uncomment when re-enabling the section.
const BUYER_PERSONAS: InfiniteMenuItem[] = [
  {
    image: '/uaerealeastate/portraits/mrs-sharma.jpg',
    name: 'Nigerian capped by capital controls',
    sub: 'Tunde, 38. Oil services executive in Lagos.',
    body: 'The Central Bank of Nigeria caps personal outbound transfers at $10,000 a year. The villa he reserved in Dubai Hills is AED 8.5M. Sending it through legal SWIFT channels would mean splitting the wire across his wife, his brother, and two business partners, and waiting four years.',
  },
  {
    image: '/uaerealeastate/portraits/mr-sharma.jpg',
    name: 'Argentine with dollar savings outside the peso',
    sub: 'Mateo, 39. Tax lawyer in Buenos Aires.',
    body: 'The official outbound channel caps him at $200 a month at the official rate, which is about 60% below the parallel market. Sending pesos for AED through any legal channel is uneconomic. His real savings have been in USDC since 2020. The Dubai unit he wants is $385K, payable from that wallet.',
  },
  {
    image: '/uaerealeastate/portraits/portrait.jpg',
    name: 'Ukrainian with frozen banking rails',
    sub: 'Olena, 42. Tech founder in Kyiv.',
    body: 'Wartime capital controls limit personal spending abroad. International wire transfers from Ukrainian banks face multi-week delays and strict documentation. Her apartment deposit in JVC is due in 10 days.',
  },
]; */
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

/** Slide carousel data — each slide pairs a buyer name with
 *  their cross-border payment pain point and a country tag. */
const CAROUSEL_SLIDES: SlideData[] = [
  {
    label: 'FOR SOFIA',
    subtitle:
      'A 2.3% FX spread plus a fresh source-of-funds review',
    country: 'Portugal',
    image: '/uaerealeastate/rotator/sofia.jpg',
  },
  {
    label: 'FOR DMITRY',
    subtitle:
      "Passport triggers a 3–6-week manual sanctions review at his Cyprus bank",
    country: 'Russia with Cyprus resi',
    image: '/uaerealeastate/rotator/dmitry.jpg',
  },
  {
    label: 'FOR ARJUN',
    subtitle:
      "RBI’s LRS caps at $250,000 and loses 20% TCS above ₹10 lakh",
    country: 'India',
    image: '/uaerealeastate/rotator/arjun.jpg',
  },
  {
    label: 'FOR WEI',
    subtitle:
      'SAFE caps him at $50,000 a year and bars property abroad as an approved purpose',
    country: 'China',
    image: '/uaerealeastate/rotator/wei.jpg',
  },
  {
    label: 'FOR HASSAN',
    subtitle:
      'Bank queueing outbound real-estate transfers 30 to 60 days',
    country: 'Egypt',
    image: '/uaerealeastate/rotator/hassan.jpg',
  },
];

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

const BROKER_STEPS: { text: string; width: number }[] = [
  { text: 'Generate the payment link from your brokerage account', width: 200 },
  { text: "Enter invoice details and the developer's account", width: 200 },
  { text: "The funds settle directly to the developer's escrow", width: 200 },
];

function App() {
  const headingContainerRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const globeWrapperRef = useRef<HTMLDivElement | null>(null);
  const glassSurfaceRef = useRef<HTMLDivElement | null>(null);
  const ctaFabRef = useRef<HTMLAnchorElement | null>(null);

  const brokersGlassRef = useRef<HTMLDivElement | null>(null);
  const brokersShadowRef = useRef<HTMLDivElement | null>(null);
  const brokersCtaRef = useRef<HTMLAnchorElement | null>(null);

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
    const t = setTimeout(() => setGlobeReady(true), GLOBE_MOUNT_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  /* ── Smooth-scroll snap ─────────────────────────────────────
   * Lenis (the shared app instance) already smooths the wheel/touch
   * scroll. Here we add the snap addon so each block "clips" to the
   * top of the viewport and reads as focused. It's PROXIMITY (not
   * mandatory): a block only snaps once the user settles near its
   * edge, so the hero's scroll-driven globe + statement choreography
   * keeps its continuous scroll (the hero is a snap point only at the
   * very top). */
  useEffect(() => {
    const lenis = getLenis();
    const snap = new Snap(lenis, {
      type: 'proximity',
      lerp: 0.1,
      duration: 0.8,
    });
    const removers: Array<() => void> = [];
    [
      '.hero',
      '.how-section',
      '.info-section',
      '.logos-section',
      '.carousel-section',
      '.brokers-section',
      '.faq-section',
    ].forEach((sel) => {
      const el = document.querySelector<HTMLElement>(sel);
      if (el) removers.push(snap.addElement(el, { align: 'start' }));
    });
    /* Last block = CityScape + the site footer below it. On desktop the
     * cityscape card + footer are taller than the viewport, so snapping
     * the cityscape to its START pulls the view UP and hides the footer.
     * Instead, snap the FOOTER to the viewport BOTTOM (align: 'end') so
     * the block settles DOWNWARD and the whole cityscape+footer is in
     * view. On phones the two already fit one screen, so keep the
     * cityscape 'start' snap there. */
    const isDesktop =
      typeof window !== 'undefined' && window.innerWidth > 600;
    if (isDesktop) {
      const footer = document.querySelector<HTMLElement>('.site-footer');
      if (footer) removers.push(snap.addElement(footer, { align: 'end' }));
    } else {
      const cityscape =
        document.querySelector<HTMLElement>('.cityscape-section');
      if (cityscape)
        removers.push(snap.addElement(cityscape, { align: 'start' }));
    }
    return () => {
      removers.forEach((remove) => remove());
      snap.destroy();
    };
  }, []);

  /* All the layout/scroll knobs that used to be live-tunable
   * via the dev toggle bar are now baked-in constants — the
   * user removed those sliders. The values are still read by
   * the scroll recalc + card-positioning effects. */
  const gapAfterHeading = DEFAULT_GAP_AFTER_HEADING_PX;
  const chipYOffset = DEFAULT_CHIP_Y_OFFSET_PX;
  const globeInitialPct = DEFAULT_GLOBE_INITIAL_PCT;
  const cardSizePct = 100;
  const cardBottomPadding = CARD_BOTTOM_PADDING_PX;
  const globeFinalPct = DEFAULT_GLOBE_FINAL_PCT;
  const lockTopPx = DEFAULT_LOCK_TOP_PX;
  const sphereInsetPx = DEFAULT_SPHERE_INSET_PX;

  /* Info-card top/bottom padding (hardcoded, no longer in toggle panel) */
  const infoPadTB = 0;
  const bgLeftY = -193;
  const bgLeftSize = 100;
  const bgRightY = -100;
  const bgRightSize = 100;



  /* Parallax photo section */
  const photoImgRef = useRef<HTMLDivElement | null>(null);
  const photoShapeRef = useRef<HTMLDivElement | null>(null);

  /* Rolling coin on the bordered info card */
  const [infoVisible, setInfoVisible] = useState(false);
  const borderPathRef = useRef<SVGPathElement | null>(null);
  const coinGRef = useRef<SVGGElement | null>(null);
  const coinRafRef = useRef<number>(0);

  /* FAQ accordion — null = all closed, number = open index. */
  const [openFaq, setOpenFaq] = useState<number | null>(null);



  /* Country rotator. */
  const [countryIdx, setCountryIdx] = useState(0);
  /* Track the previous country index so we can detect transitions
   * INTO or OUT OF the "52+ countries" slide. Only those
   * transitions trigger the prefix (left side) bounce — all other
   * city swaps leave the prefix snapping instantly to its new
   * Flexbox position. */
  /* Two-step slide history. Needed so the chip / prefix can
   * keep the bounce-back animation for THREE consecutive
   * transitions around the "52+ countries" slide:
   *   Rio → 52         (current = 52)
   *   52 → Beijing     (prev    = 52)
   *   Beijing → Kyiv   (prev's prev = 52)
   * After that, the rotator is fully back to its default
   * left-anchored state and prefix sits idle for the rest of
   * the cycle. */
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
  /* The rotator-centred class is applied while the current OR
   * previous slide is 52 — so the rotator stays centred across
   * the Rio → 52 expand AND the post-52 settle on Beijing.
   * It only flips back to default on the Beijing → Kyiv swap,
   * which IS the transition the user wants to look like the
   * smooth 52-collapse. */
  const isCentered = is52Current || is52Prev;
  /* `transitionInvolves52` adds ONE more step so the prefix
   * keeps using backOut for the Beijing → Kyiv layout shift
   * (when the rotator class flips from --centered back to
   * default). After that, ordinary swaps fall back to the
   * instant transition and the prefix stays put. */
  const transitionInvolves52 = is52Current || is52Prev || is52PrevPrev;
  useEffect(() => {
    const id = setInterval(
      () => setCountryIdx((i) => (i + 1) % COUNTRIES.length),
      COUNTRY_ROTATE_MS,
    );
    return () => clearInterval(id);
  }, []);

  /* S-curve cutout in the bottom-right corner of the glass card so
   * the round CTA appears to dissolve the surface around it. */
  useCardNotch(glassSurfaceRef, ctaFabRef, 35);
  useCardNotch(brokersGlassRef, brokersCtaRef, 35, 5);

  /* Sync S-curve clip-path from glass to the shadow shape so the
   * shadow follows the exact same S-curve outline. */
  useEffect(() => {
    const glass = brokersGlassRef.current;
    const shadow = brokersShadowRef.current;
    if (!glass || !shadow) return;
    const sync = () => {
      const cp = glass.style.clipPath;
      if (cp) {
        shadow.style.clipPath = cp;
        (shadow.style as any).webkitClipPath = cp;
      }
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(glass, { attributes: true, attributeFilter: ['style'] });
    return () => mo.disconnect();
  }, []);

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

      /* The canvas now fills the FULL viewport (top: 0,
       * height: 100vh) — see `.hero-globe` CSS. So the sphere
       * top can sit anywhere on screen without being clipped
       * by a smaller frame; we drive its position by computing
       * the world-space Y offset that lands the sphere center
       * at the desired pixel Y inside the viewport-sized
       * canvas. */
      const headingDocBottom =
        headingContainer.offsetTop + headingContainer.offsetHeight;
      /* The sphere TOP's natural document-Y on first load.
       * `gapAfterHeading` is the offset from the heading's
       * bottom edge (default −20 → sphere top sits 20 px
       * ABOVE the heading bottom). `sphereInsetPx` adds an
       * extra downward shift so the sphere can be nudged
       * lower without changing the gap. */
      const initialSphereTopAbs =
        headingDocBottom + gapAfterHeading + sphereInsetPx;
      const sphereFinalTopAbs = lockTopPx + sphereInsetPx;
      /* LOCK happens once the glass card has scrolled fully out
       * of the top of the viewport + a 35 px tail (matching the
       * original spec: "globe grows till the glass is outside
       * and 35 px after"). Before then, the sphere lerps its
       * TOP from initialSphereTopAbs → sphereFinalTopAbs and
       * its DIAMETER from globeInitialPct → globeFinalPct,
       * with the scroll progress as the lerp parameter. Cards
       * fade in only at lock. */
      const cardDocBottom = card.offsetTop + card.offsetHeight;
      const lockScrollPx = Math.max(1, cardDocBottom + 35);
      const cappedProgress = clamp01(sy / lockScrollPx);
      const nowLocked = sy >= lockScrollPx;

      /* Sphere TOP in viewport coords lerps from initial to
       * final over the entire scroll-to-lock range. The canvas
       * is `position: fixed; top: 0`, so the sphere's viewport
       * Y is whatever we set here — it does NOT track scroll
       * 1:1. This gives the sphere a smooth ride from
       * initialSphereTopAbs at sy=0 → sphereFinalTopAbs at
       * sy=lockScrollPx, paired with the size lerp below. */
      /* On phones, lift the whole globe up by 10% of the viewport
       * height so it reads higher in the hero (applied to the lerped
       * top so the initial and locked positions both shift up). */
      const mobileGlobeLiftPx = vw <= 600 ? window.innerHeight * 0.1 : 0;
      const sphereTopOnViewport =
        lerp(initialSphereTopAbs, sphereFinalTopAbs, cappedProgress) -
        mobileGlobeLiftPx;

      /* Sphere size: the user's `globeInitialPct` / `globeFinalPct`
       * are percentages of viewport WIDTH that the rendered sphere
       * diameter should hit. Sphere natural diameter (in PIXELS,
       * at sphereScale = 1, world radius = 1) =
       *   canvasH / (cameraDistance × tanHalfFov)
       * because pixelRadius = worldRadius × canvasH /
       *   (2 × depth × tanHalfFov). canvasH is the WRAPPER's
       * actual offsetHeight — which is now 200 vh, taller than the
       * viewport, so the locked sphere fits without bottom clip. */
      const canvasH = globe.offsetHeight;
      const naturalDiameterPx = canvasH / (cameraDistance * tanHalfFov);
      /* On phones the globe should fill the view at its locked size —
       * 150 % of viewport width — so it reads as a full-bleed globe
       * rather than the smaller desktop framing. */
      /* On phones the globe starts at 85 % of viewport width (vs 45 %
       * on desktop) so it fills the gap between the heading and the
       * bottom-pinned glass card, and finishes at 150 % for the
       * full-bleed dissolve. */
      const globeInitialPctEff = vw <= 600 ? 85 : globeInitialPct;
      const globeFinalPctEff = vw <= 600 ? 150 : globeFinalPct;
      const desiredWidthVw = lerp(
        globeInitialPctEff / 100,
        globeFinalPctEff / 100,
        cappedProgress,
      );
      const desiredWidthPx = desiredWidthVw * vw;
      const nextScale = desiredWidthPx / naturalDiameterPx;
      setSphereScale(nextScale);
      const sphereRadiusPx = (naturalDiameterPx * nextScale) / 2;

      /* Sphere CENTER on canvas (canvas top = viewport top, since
       * .hero-globe is `position: fixed; top: 0`) = sphere top
       * viewport + radius. Back out the world-Y translation that
       * lands the sphere center at that canvas Y.
       *   pixel_y_from_center = -ndc_y × (canvasH / 2)
       *   ndc_y               =  world_y / (depth × tanHalfFov)
       * → world_y = (canvasH/2 − pixel_y) / projFactor
       * where projFactor = canvasH / (2 × tanHalfFov × cameraDist). */
      const projFactor = canvasH / (2 * tanHalfFov * cameraDistance);
      const sphereCenterCanvasY = sphereTopOnViewport + sphereRadiusPx;
      const dy = (canvasH / 2 - sphereCenterCanvasY) / projFactor;
      setSphereYOffset(dy);

      /* Globe canvas is `position: fixed; top: 0` ALWAYS. Pre-lock
       * the sphere scales / moves smoothly via R3F state.
       *
       * Phase budget post-lock:
       *   • rawOverlap ≤ dissolveStartOverlap
       *       Canvas slides up normally with scroll.
       *   • dissolveStartOverlap < rawOverlap ≤ +dissolveSpan
       *       FROZEN — canvas position held at the moment the
       *       sphere's bottom edge entered the viewport. The
       *       additional scroll inside this band drives
       *       dissolveProgress so all elements have time to
       *       fly out while the camera stays still.
       *   • rawOverlap > +dissolveSpan
       *       Resume scrolling — the (now empty) canvas slides
       *       further up so the user passes the hero. */
      const vh = window.innerHeight;

      /* Keep the dot-to-globe ratio constant across viewports (see
       * the dotSize state above). The globe diameter is ∝ vw while a
       * point's pixel size is ∝ canvas height (200 vh, i.e. ∝ vh), so
       * the ratio tracks the viewport ASPECT. Normalize to 16:9 and
       * clamp to a sane band. vw/vh are constant during scroll, so
       * this only changes on resize — setState bails otherwise. */
      const REF_ASPECT = 16 / 9;
      const nextDotSize = Math.max(
        0.003,
        Math.min(0.014, 0.011 * (vw / vh / REF_ASPECT)),
      );
      setDotSize(nextDotSize);

      /* Pin the globe at its locked position the moment the
       * hero card scrolls off (= cards appear). The user then
       * gets POST_LOCK_BUFFER pixels of consistent scroll
       * BEFORE the scatter kicks in, and a further dissolveSpan
       * of frozen scroll while the scatter plays out. Total
       * frozen window = 50 + 1 vh. After that the canvas
       * resumes scrolling up off the top. */
      const POST_LOCK_BUFFER = 600;
      const dissolveSpan = vh;
      const frozenWindow = POST_LOCK_BUFFER + dissolveSpan;
      const rawOverlap = nowLocked ? sy - lockScrollPx : 0;
      let effectiveOverlap: number;
      let rawProgress = 0;
      if (rawOverlap <= 0) {
        effectiveOverlap = 0;
      } else if (rawOverlap <= POST_LOCK_BUFFER) {
        /* Pinned buffer — globe stays put for 50 px after the
         * cards appear so the user sees them settle. */
        effectiveOverlap = 0;
      } else if (rawOverlap <= frozenWindow) {
        /* Scatter window — globe stays pinned, dissolveProgress
         * ramps 0 → 1 over this 1 vh of scroll. */
        effectiveOverlap = 0;
        rawProgress = (rawOverlap - POST_LOCK_BUFFER) / dissolveSpan;
      } else {
        /* Resume — canvas slides off the top as additional
         * scroll accumulates. */
        effectiveOverlap = rawOverlap - frozenWindow;
        rawProgress = 1;
      }

      globe.style.position = 'fixed';
      globe.style.top = '0px';
      globe.style.transform =
        effectiveOverlap > 0 ? `translateY(${-effectiveOverlap}px)` : '';
      setIsLocked(nowLocked);
      const clampedDissolve = clamp01(rawProgress);
      setDissolveProgress(clampedDissolve);
      setPreLockProgress(clamp01(sy / lockScrollPx));

      /* Statement heading state machine.
       *   trigger      = dissolveProgress crosses 0.9 (90 % diffused)
       *   pin window   = 500 px of scroll AFTER trigger
       *   leaving      = scroll past that window
       * The heading is position:fixed so it sits over the still-
       * diffusing globe at 90 %, stays pinned for 500 px, then
       * fades out as the user keeps scrolling. */
      if (statementTriggerSyRef.current === null) {
        /* Only fire the trigger while we're STILL in the
         * scatter window (effectiveOverlap === 0 means the
         * canvas is still pinned). Past that window we've
         * fully exited the hero and the 67.3 % heading must
         * never reappear — without this guard, jumping to a
         * mid-page scroll position (FAQ / CityScape) with
         * clampedDissolve already saturated at 1.0 would
         * re-trigger the heading at that random scroll. */
        if (
          clampedDissolve >= 0.9 &&
          hasUserScrolledRef.current &&
          effectiveOverlap === 0
        ) {
          statementTriggerSyRef.current = sy;
          setStatementPhase('visible');
        } else if (effectiveOverlap > 0) {
          /* Past the hero entirely — force 'leaving' so the
           * element is removed from the visual stack and can't
           * paint over the FAQ / CityScape below. */
          setStatementPhase('leaving');
        }
        setBunnPhase('hidden');
        setUnpinOffsetPx(0);
      } else {
        const distance = sy - statementTriggerSyRef.current;
        /* BUNN line appears 400 px after the 67.3 % heading
         * was triggered. The same boolean drives the 67.3 %
         * heading's "shifted" state (scale down + lift up). */
        setBunnPhase(distance >= 400 ? 'visible' : 'hidden');
        /* Unpin window — 100 px AFTER the BUNN appears (= 500
         * from the 67.3 % trigger), the whole block stops being
         * pinned at viewport-centre and tracks scroll 1:1. The
         * offset gets applied as an additional upward translate
         * via the --unpin CSS custom property, so both headings
         * scroll off the top together. */
        const UNPIN_THRESHOLD = 500;
        setUnpinOffsetPx(
          distance > UNPIN_THRESHOLD ? distance - UNPIN_THRESHOLD : 0,
        );
        if (distance < 0) {
          /* User scrolled back ABOVE the trigger — return the
           * heading to visible (it's still relevant on screen).
           * If they scroll far enough back that dissolve drops
           * below 0.9, reset entirely. */
          if (clampedDissolve < 0.9) {
            statementTriggerSyRef.current = null;
            setStatementPhase('hidden');
            setBunnPhase('hidden');
          } else {
            setStatementPhase('visible');
          }
        } else if (distance > UNPIN_THRESHOLD + window.innerHeight) {
          /* Heading has scrolled well past the viewport top —
           * transition to 'leaving' so visibility:hidden kicks
           * in and the element can't flash on resize/reload. */
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
  }, [
    gapAfterHeading,
    globeInitialPct,
    globeFinalPct,
    lockTopPx,
    sphereInsetPx,
  ]);

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

  /* ── Rolling coin animation on bordered info card ─────────
   * Starts after the SVG stroke finishes drawing (4 s CSS
   * transition). The coin follows the path using
   * getPointAtLength, offset perpendicular so it sits on the
   * gravitationally "correct" side — outside at the top,
   * inside at the bottom. */
  useEffect(() => {
    if (!infoVisible) return;
    const DRAW_DURATION = 4200; // stroke draws in 4 s + buffer
    const R = 6; // coin radius in SVG units (≈10 px on screen)
    const SPEED = 100; // SVG-units / second

    const delayId = setTimeout(() => {
      const path = borderPathRef.current;
      const coin = coinGRef.current;
      if (!path || !coin) return;
      const totalLen = path.getTotalLength();
      coin.style.transition = 'opacity 0.5s';
      coin.style.opacity = '1';
      let t0: number | null = null;

      const tick = (ts: number) => {
        if (!t0) t0 = ts;
        const dist = (((ts - t0) / 1000) * SPEED) % totalLen;
        const pt = path.getPointAtLength(dist);

        /* Tangent → normal */
        const d = 0.5;
        const p1 = path.getPointAtLength(Math.max(0, dist - d));
        const p2 = path.getPointAtLength(
          Math.min(totalLen, dist + d),
        );
        const tx = p2.x - p1.x;
        const ty = p2.y - p1.y;
        const len = Math.sqrt(tx * tx + ty * ty) || 1;
        let nx = -ty / len;
        let ny = tx / len;

        /* Keep the coin (and its 1px outline) ALWAYS on the OUTSIDE
         * of the card border: flip the perpendicular so it points
         * away from the card centre (viewBox 351×414 → centre
         * 175,207). The coin then rolls on the outer edge the whole
         * way around instead of cutting through the shape. */
        const cx = 175;
        const cy = 207;
        if (nx * (pt.x - cx) + ny * (pt.y - cy) < 0) {
          nx = -nx;
          ny = -ny;
        }

        const rot = (dist / R) * (180 / Math.PI);
        coin.setAttribute(
          'transform',
          `translate(${pt.x + nx * R},${pt.y + ny * R}) rotate(${rot})`,
        );
        coinRafRef.current = requestAnimationFrame(tick);
      };

      coinRafRef.current = requestAnimationFrame(tick);
    }, DRAW_DURATION);

    return () => {
      clearTimeout(delayId);
      cancelAnimationFrame(coinRafRef.current);
    };
  }, [infoVisible]);

  /* ── Parallax on the photo shape ──────────────────────────
   * The image div is 130 % the height of the clip container
   * (15 % extra top + bottom). As the section scrolls through
   * the viewport, the image translates from +8 % to −8 %,
   * creating a subtle depth effect. */
  useEffect(() => {
    const img = photoImgRef.current;
    const shape = photoShapeRef.current;
    if (!img || !shape) return;
    const onScroll = () => {
      const rect = shape.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = 1 - rect.bottom / (vh + rect.height);
      const clamped = Math.max(0, Math.min(1, progress));
      const ty = (clamped - 0.5) * 16; // −8 % … +8 %
      img.style.transform = `translateY(${ty}%)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);



  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <img src="/uaerealeastate/logos/bunn-topbar-logo.svg" alt="BUNN" className="brand__logo" />
        </div>
      </header>

      <section className="hero">
        <div className="hero-heading" ref={headingContainerRef}>
          <SplitText
            tag="p"
            className="eyebrow"
            text="FOR THE UAE REAL ESTATE MARKET"
            splitType="chars"
            delay={20}
            duration={0.9}
            from={{ opacity: 0, y: 12 }}
            to={{ opacity: 1, y: 0 }}
            ease="power3.out"
            textAlign="center"
            rootMargin="0px"
            threshold={0}
          />
          {/* Two-line headline — first part regular, second part bold. */}
          <BlurText
            as="h1"
            className="hero-h1 hero-h1--light"
            text="DON'T LOSE CLOSED DEALS"
            animateBy="words"
            direction="top"
            delay={120}
            stepDuration={0.45}
          />
          <BlurText
            as="h1"
            className="hero-h1 hero-h1--bold"
            text="TO A STUCK SWIFT WIRE"
            animateBy="words"
            direction="top"
            delay={260}
            stepDuration={0.45}
          />
          <p
            className={`rotator${isCentered ? ' rotator--centered' : ''}`}
            style={
              {
                '--chip-y-offset': `${chipYOffset}px`,
              } as React.CSSProperties
            }
          >
            {/* LayoutGroup synchronizes motion-layout animations
                across the chip and the suffix so when the chip's
                width changes on every city swap, the surrounding
                suffix ("TO PAY") slides horizontally to its new
                position with the SAME timing instead of just
                re-flowing instantly. */}
            <LayoutGroup>
              {/* Prefix carries `layout` too, so its position
                  animates whenever the chip width changes. The
                  transition is INSTANT (duration 0) on regular
                  city swaps so the prefix just snaps, then turns
                  into backOut when the new OR previous slide is
                  "52+ countries" — that's the only case where
                  the user wants the prefix to bounce-back as the
                  chip expands LEFT into its space. */}
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
                    <motion.span
                      initial={BLUR_INITIAL}
                      animate={BLUR_ANIMATE}
                      transition={blurTransition(
                        ROTATOR_START + i * ROTATOR_WORD_DELAY,
                      )}
                      style={{ display: 'inline-block' }}
                    >
                      {word}
                    </motion.span>
                    {' '}
                  </Fragment>
                ))}
              </motion.span>
              {/* Chip is a PERMANENT motion.span — never unmounts.
                  Its width animates via Framer's `layout` prop when
                  the inner content (photo + city) swaps to a new
                  size. Inside, an AnimatePresence with `popLayout`
                  lets the content slide / blur in & out;
                  overflow: hidden on the chip masks the slide so
                  the swap stays inside the gray frame. */}
              {' '}
              {/* "IN" + chip + "TO PAY" grouped in rotator-tail
                  (white-space: nowrap): one line on desktop, but on
                  mobile the group wraps as a unit so the last row
                  always reads "IN <city> TO PAY". "IN" keeps its own
                  layout bounce so it tracks the prefix on 52-swaps. */}
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
                  <motion.span
                    initial={BLUR_INITIAL}
                    animate={BLUR_ANIMATE}
                    transition={blurTransition(
                      ROTATOR_START + 3 * ROTATOR_WORD_DELAY,
                    )}
                    style={{ display: 'inline-block' }}
                  >
                    FROM
                  </motion.span>
                </motion.span>
                {' '}
              <motion.span
                layout
                className="rotator-name-chip"
                initial={BLUR_INITIAL}
                animate={BLUR_ANIMATE}
                transition={{
                  ...LAYOUT_BACKOUT_TRANSITION,
                  ...blurTransition(
                    ROTATOR_START + 4 * ROTATOR_WORD_DELAY,
                  ),
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={countryIdx}
                    className="rotator-content"
                    layout
                    aria-hidden="true"
                  >
                    {/* Per-character RotatingText animation
                        (reactbits pattern): every glyph is its
                        own motion.span that slides y: 100% → 0
                        → -120% with a spring + a stagger delay
                        keyed off the LAST character (the
                        rightmost glyph enters first, leftmost
                        last). The chip's overflow: hidden masks
                        the slide. */}
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
                            {char === ' ' ? ' ' : char}
                          </motion.span>
                        ));
                      })()}
                    </span>
                    {COUNTRIES[countryIdx].photo && (
                      <motion.span
                        className="rotator-photo-frame"
                        aria-hidden="true"
                        /* Photo enters in sync with the
                           leftmost character (= the last glyph
                           to roll in under staggerFrom='last'),
                           reading as one cohesive unit. */
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
              {/* "TO PAY" — a motion.span with `layout` so
                  Framer's LayoutGroup snapshots its position
                  before & after each city swap and tweens it
                  to the new spot. With `backOut` ease, the
                  motion OVERSHOOTS the target then bounces
                  back: chip wider → suffix moves right then
                  bounces back left; chip narrower → suffix
                  moves left then bounces back right. */}
              <motion.span
                layout
                className="rotator-suffix"
                transition={LAYOUT_BACKOUT_TRANSITION}
              >
                {' '}
                {['TO', 'PAY'].map((word, i) => (
                  <Fragment key={word}>
                    <motion.span
                      initial={BLUR_INITIAL}
                      animate={BLUR_ANIMATE}
                      transition={blurTransition(
                        ROTATOR_START + (5 + i) * ROTATOR_WORD_DELAY,
                      )}
                      style={{ display: 'inline-block' }}
                    >
                      {word}
                    </motion.span>
                    {i < 1 && ' '}
                  </Fragment>
                ))}
              </motion.span>
              </span>
            </LayoutGroup>
          </p>
        </div>

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
                cardSizePct={cardSizePct}
                dissolveProgress={dissolveProgress}
                preLockProgress={preLockProgress}
                dotSize={dotSize}
              />
            </Suspense>
          )}
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
                      src="/uaerealeastate/logos/images (5) 1.png"
                      alt="Dubai Land Department"
                    />
                    <img
                      className="compliance__logo compliance__logo--cb"
                      src="/uaerealeastate/regulators/cb-uae.png"
                      alt="Central Bank of the UAE"
                    />
                    <img
                      className="compliance__logo compliance__logo--vara"
                      src="/uaerealeastate/regulators/vara.png"
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
      </section>

      {/* Statement section — separate from the hero. The heading
          uses BlurText (same component the hero h1 uses) so the
          per-word blur-fade-in matches the hero's entrance. Sticky
          inside the section pins the heading to viewport-centre
          for ≈500 px of scroll, then releases. */}
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

      {/* How-it-works section — five portrait-aspect cards that
          stack as the user scrolls, using the React Bits
          ScrollStack recipe (lenis-powered smooth scroll).
          Each card's visible surface is the same liquid-glass
          (<GlassSurface />) treatment the hero card uses, so
          the texture continuity matches across the page. The
          section sits in document flow after the hero, so it
          comes into view AFTER the BUNN headings block has
          unpinned and scrolled off the top. */}
      <section className="how-section" aria-label="How it works">
        <ScrollStack
          /* Settings from the React Bits playground:
           *   itemDistance=590, baseScale=0.8,
           *   stackPosition=10%, itemStackDistance=20
           * — 590 px of scroll between cards in document flow,
           * cards stack at 10 % from the viewport top with a
           * 20 px offset per card, base scale 0.8. */
          /* Mobile halves the scroll distance between step cards
             (590 → 295) so the deck advances twice as fast on phones. */
          itemDistance={
            typeof window !== 'undefined' && window.innerWidth <= 600
              ? 295
              : 590
          }
          itemStackDistance={20}
          baseScale={0.8}
          stackPosition="10%"
          flyAwayAfter={400}
          flyAwayExcludeLast
        >
          {[
            {
              n: '01',
              title: 'You create the payment link',
              body:
                "Open your dashboard. Enter the unit, the AED price, and the buyer's email. The link is yours in 30 seconds. No integration.",
            },
            {
              n: '02',
              title: 'Your buyer completes KYC and AML',
              body:
                'The buyer clicks the link, uploads ID, and completes KYC and AML run by Sumsub. Most buyers finish in under a few minutes.',
            },
            {
              n: '03',
              title: 'Buyer sends USDC or USDT',
              body:
                'From any wallet. Any exchange. Any country we support. The stablecoin amount is calculated against the AED price locked for 30 minutes.',
            },
            {
              n: '04',
              title: "We convert and settle in your buyer's name",
              body:
                "A VARA-licensed Virtual Asset Service Provider takes the stablecoin and converts it to AED. A CBUAE-regulated payment provider settles AED to your escrow account in the buyer's name.",
            },
            {
              n: '05',
              title: 'AED lands in your escrow account',
              body: '',
            },
          ].map((card) => (
            <ScrollStackItem key={card.n}>
              <div className="scroll-stack-card__content">
                <div className="scroll-stack-card__number">{card.n}</div>
                <h3 className="scroll-stack-card__title">{card.title}</h3>
                {card.body && (
                  <p className="scroll-stack-card__body">{card.body}</p>
                )}
              </div>
            </ScrollStackItem>
          ))}
        </ScrollStack>
      </section>


      {/* ── Info cards — 4 notched-shape cards in a row ──── */}

      {/* SVG defs for the organic card clip-path (normalised
          to the 0–1 objectBoundingBox coordinate space). */}
      <svg
        width="0"
        height="0"
        style={{ position: 'absolute' }}
        aria-hidden="true"
      >
        <defs>
          <clipPath
            id="info-card-clip"
            clipPathUnits="objectBoundingBox"
          >
            <path d="M1,0.77536 C1,0.81538,0.96174,0.84783,0.91453,0.84783 H0.58689 C0.53969,0.84783,0.50142,0.88028,0.50142,0.92029 V0.92754 C0.50142,0.96756,0.46316,1,0.41595,1 H0.08547 C0.03826,1,0,0.96756,0,0.92754 V0.21739 C0,0.17737,0.03826,0.14493,0.08547,0.14493 H0.10826 C0.15546,0.14493,0.19374,0.11247,0.19374,0.07246 C0.19374,0.03244,0.23199,0,0.27920,0 H0.91453 C0.96174,0,1,0.03244,1,0.07246 V0.77536Z" />
          </clipPath>
          {/* Photo section S-curve shape — redrawn at 1694×742
              (15 % taller than 645) with the SAME 35 px corner
              radii and 66 px S-curve step. Normalised to 0–1
              objectBoundingBox coords. */}
          <clipPath
            id="photo-shape-clip"
            clipPathUnits="objectBoundingBox"
          >
            <path d="M0.47340,0.04447 C0.47340,0.06904,0.48209,0.08895,0.49284,0.08895 H0.97934 C0.99074,0.08895,1,0.11008,1,0.13612 V0.95283 C1,0.97889,0.99074,1,0.97934,1 H0.02066 C0.00925,1,0,0.97889,0,0.95283 V0.04717 C0,0.02112,0.00925,0,0.02066,0 H0.45390 C0.46466,0,0.47340,0.01991,0.47340,0.04447Z" />
          </clipPath>
        </defs>
      </svg>

      <section
        className="info-section"
        ref={(el) => {
          if (!el) return;
          const obs = new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting) {
                el.classList.add('info-section--visible');
                setInfoVisible(true);
                obs.disconnect();
              }
            },
            { threshold: 0.15 },
          );
          obs.observe(el);
        }}
        style={{
          '--info-heading-size': '30px',
          '--info-subtitle-size': '16px',
          '--info-pad-lr': '35px',
          '--info-pad-tb': `${infoPadTB}px`,
          '--bg-left-y': `${bgLeftY}px`,
          '--bg-left-scale': bgLeftSize / 100,
          '--bg-right-y': `${bgRightY}px`,
          '--bg-right-scale': bgRightSize / 100,
        } as React.CSSProperties}
      >
        {[
          {
            heading: 'Faster than a wire that works',
            body: 'A clean SWIFT from Lagos or Karachi clears in three to seven days when nothing goes wrong. We settle in 3 hours.',
            type: 'text' as const,
          },
          {
            heading: 'Built for the DLD pipeline',
            body: 'Form F deadlines, Oqood entries, 10 % deposit window. We hit the trustee banks RERA already approves, no new approvals on your side needed.',
            type: 'text' as const,
          },
          {
            heading: 'You never touch crypto',
            body: 'Your finance team books one AED inflow, your auditor sees fiat, the wire shows end buyer as a counterparty.',
            type: 'bordered' as const,
          },
          {
            heading: 'Only clean money lands in your account',
            body: "KYC, AML and sanctions checks all run before the buyer’s stablecoin leaves their wallet. Any failure stops the flow.",
            type: 'text' as const,
          },
        ].map((card, i) => (
          <div
            key={i}
            className={`info-card info-card--${card.type}`}
          >
            {card.type === 'bordered' && (
              <svg
                className="info-card__border"
                viewBox="0 0 351 414"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  ref={borderPathRef}
                  d="M351 30C351 13.4315 337.569 0 321 0H98C81.4315 0 68 13.4315 68 30C68 46.5685 54.5685 60 38 60H30C13.4315 60 0 73.4315 0 90V384C0 400.569 13.4315 414 30 414H146C162.569 414 176 400.569 176 384V381C176 364.431 189.431 351 206 351H321C337.569 351 351 337.569 351 321V30Z"
                  stroke="#999"
                  strokeWidth="1"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  strokeDasharray="1500"
                  strokeDashoffset="1500"
                />
                {/* Rolling coin — same pink as globe flow dots */}
                <g ref={coinGRef} style={{ opacity: 0 }}>
                  <circle r={6} fill="#FF9BAC" />
                  <circle
                    r={6}
                    fill="none"
                    stroke="#272727"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    r={4}
                    fill="none"
                    stroke="#272727"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                    opacity={0.35}
                  />
                </g>
              </svg>
            )}
            <div className="info-card__content">
              <h3 className="info-card__heading">
                <WordReveal text={card.heading} baseIndex={0} />
              </h3>
              <p className="info-card__subtitle">
                <WordReveal
                  text={card.body}
                  baseIndex={card.heading.split(' ').length}
                />
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Logo section — regulators + partners ──── */}
      <section className="logos-section" aria-label="Partners and compliance">
        <div className="logos-group logos-group--compliant">
          <span className="logos-group__label">Fully Compliant</span>
          <div className="logos-group__row">
            <img
              src="/uaerealeastate/regulators/vara.png"
              alt="VARA — Virtual Assets Regulatory Authority"
              className="logos-group__logo"
            />
            <img
              src="/uaerealeastate/regulators/cb-uae.png"
              alt="Central Bank of the UAE"
              className="logos-group__logo"
            />
            <img
              src="/uaerealeastate/logos/images (5) 1.png"
              alt="Dubai Land Department"
              className="logos-group__logo"
            />
          </div>
        </div>
        <div className="logos-group">
          <span className="logos-group__label">In Proud Partnership With</span>
          <div className="logos-group__row">
            <img
              src="/uaerealeastate/logos/blackrock 1.png"
              alt="BlackRock"
              className="logos-group__logo"
            />
            <img
              src="/uaerealeastate/logos/Fidelity_Investments_vector_logo 1.png"
              alt="Fidelity Investments"
              className="logos-group__logo logos-group__logo--fidelity"
            />
            <img
              src="/uaerealeastate/logos/bridge 1.png"
              alt="Bridge"
              className="logos-group__logo logos-group__logo--bridge"
            />
            <img
              src="/uaerealeastate/logos/okx 1.svg"
              alt="OKX"
              className="logos-group__logo"
            />
          </div>
        </div>
      </section>

      {/* Shared canvas — continuous pink gradient spans both the
          carousel and brokers sections so there's no visible seam
          between them. Individual sections are transparent. */}
      <div className="carousel-brokers-wrap">
      {/* ── Buyer slide carousel ──────────────────────────────── */}
      <section
        className="carousel-section"
        aria-label="Buyer pain points"
      >
        <SlideCarousel slides={CAROUSEL_SLIDES} />
      </section>

      {/* ── Photo CTA section — S-curve shape with couple photo ── */}
      {/* <section
        className="photo-cta-section"
        style={{
          '--photo-text-pad-extra': `${photoTextPad}px`,
          '--photo-btn-y': `${photoBtnY}px`,
        } as React.CSSProperties}
      >
        <div
          className="photo-shape"
          ref={photoShapeRef}
        >
          <div
            className="photo-shape__img"
            ref={photoImgRef}
          />
          <div className="photo-shape__overlay">
            <BlurText
              as="h2"
              className="photo-shape__heading"
              text="MAKE YOUR CLIENTS HAPPY TO PAY"
              animateBy="words"
              direction="top"
              delay={120}
              stepDuration={0.45}
            />
            <BorderGlow
              className="photo-cta-glow-wrap"
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
        </div>
      </section> */}

      {/* ── Buyer personas — InfiniteMenu globe ──────────────── */}
      {/* <section className="personas-section">
        <div className="personas-globe-wrap">
          <InfiniteMenu items={BUYER_PERSONAS} scale={5} />
        </div>
      </section> */}

      {/* ── Brokers — glass card over curved loop marquee ──── */}
      <section className="brokers-section">
        {/* Full-width curved marquee — spans the entire section behind
            the card. Shadow layer uses semi-transparent bg so this text
            bleeds through, giving the glass something to blur. */}
        <CurvedLoop
          marqueeText="COMMISSION COMES ON TIME BECAUSE THE DEAL IS CLOSED ON TIME ● "
          speed={2}
          curveAmount={350}
          direction="left"
          interactive={true}
          className="brokers-curved-text"
        />

        <div className="brokers-card">
          {/* Shadow — duplicate of the glass shape (same S-curve
              clip-path via MutationObserver), transparent + shadow.
              WRAPPER has filter: drop-shadow (no clip-path → shadow
              extends freely). INNER has clip-path + white bg
              (invisible against white section, gives shadow its
              shape). Glass sits on top with its own clip + frost. */}
          <div className="brokers-card__shadow-wrap" aria-hidden="true">
            <div className="brokers-card__shadow" ref={brokersShadowRef} />
          </div>
          <GlassSurface
            ref={brokersGlassRef}
            width="100%"
            height="auto"
            borderRadius={35}
            displacementScale={100}
          >
            <div className="brokers-card__inner">
              {/* Top row: heading + coin */}
              <div className="brokers-card__top">
                <div className="brokers-card__text">
                  <h2 className="brokers-card__heading">BROKERS</h2>
                  <p className="brokers-card__sub">
                    EARN REFERRAL BONUS WHILE YOUR CLIENT GETS DISCOUNTED FEE
                  </p>
                </div>
                {/* 3D coin — same CylinderGeometry + canvas textures
                    as globe TravelingDots, spinning in its own Canvas.
                    Lazy (Three.js) so it's out of the initial bundle. */}
                <Suspense fallback={null}>
                  <BrokersCoin />
                </Suspense>
              </div>

              {/* Three broker steps */}
              <div className="broker-steps-wrap">
                <div className="broker-steps" role="list">
                  {BROKER_STEPS.map((step, i) => (
                    <Fragment key={i}>
                      <div
                        className="broker-step-item"
                        role="listitem"
                        style={{ width: `${step.width}px` }}
                      >
                        <p className="broker-step">{step.text}</p>
                      </div>
                      {i < BROKER_STEPS.length - 1 && (
                        <span
                          className={`subhead-divider divider-${i}`}
                          aria-hidden="true"
                        />
                      )}
                    </Fragment>
                  ))}
                </div>
              </div>

              {/* Bottom row: grey tagline */}
              <p className="brokers-card__tagline">
                STOP CHASING PAYMENTS IN WHATSAPP
              </p>
            </div>
          </GlassSurface>

          {/* CTA — same pattern as hero */}
          <BorderGlow
            className="cta-fab-glow-wrap brokers-cta-wrap"
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
                ref={brokersCtaRef}
                className="cta-fab cta-fab--glow"
                href="#contact"
                aria-label="Open a brokerage account"
              >
                <span className="cta-fab__label">
                  OPEN A BROKERAGE ACCOUNT
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
      </section>
      </div>{/* /carousel-brokers-wrap */}

      {/* ══════════════════════════════════════════════════════
          FAQ accordion — card-based with glow + rotate icon
          ══════════════════════════════════════════════════════ */}
      <section className="faq-section">
        <ul className="faq-list">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openFaq === i;
            return (
              <motion.li
                key={i}
                className={`faq-item${isOpen ? ' faq-item--open' : ''}`}
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                whileHover={{ y: -2 }}
                viewport={{ amount: 0.2, once: true }}
                transition={{
                  duration: 0.5,
                  ease: [0.17, 0.55, 0.55, 1],
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty('--faq-x', `${e.clientX - rect.left}px`);
                  e.currentTarget.style.setProperty('--faq-y', `${e.clientY - rect.top}px`);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.removeProperty('--faq-x');
                  e.currentTarget.style.removeProperty('--faq-y');
                }}
              >
                {/* Pointer-following glow */}
                <div className="faq-glow" />

                <button
                  className="faq-trigger"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                >
                  {/* Circle icon */}
                  <span className="faq-icon">
                    <span className="faq-icon__ring" />
                    <svg
                      className="faq-icon__svg"
                      width="20" height="20" viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path d="M12 5v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>

                  <div className="faq-content">
                    <h3 className="faq-q">{item.q}</h3>
                    <div className="faq-body">
                      <p className="faq-a">{item.a}</p>
                    </div>
                  </div>
                </button>
              </motion.li>
            );
          })}
        </ul>
      </section>

      {/* ── Dubai cityscape — procedural dots + rolling coins ── */}
      <CityScape />

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="site-footer">
        <img
          src="/uaerealeastate/logos/bunn-footer-logo.svg"
          alt="BUNN"
          className="site-footer__logo"
        />
        <p className="site-footer__text">
          BUNN Labs, Inc. 2810 North Church Street Wilmington, DE, 19802 US
        </p>
      </footer>

      {/* ── Contact popup — opens on any CTA button click ──── */}
      <ContactPopup />
    </main>
  );
}

export default App;

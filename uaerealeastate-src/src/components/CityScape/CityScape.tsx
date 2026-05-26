/**
 * CityScape — Dubai dot illustration with a "gather" entrance.
 *
 * Layered card:
 *   • <img> renders the source PNG at full opacity.
 *   • <canvas> renders the procedural dot pattern via a
 *     per-dot lerp from a scattered START position to the
 *     dot's TARGET position (= where the dot would sit in
 *     the static illustration).
 *
 * When the section first scrolls into view (IntersectionObserver
 * threshold ≥ 30 %), the animation kicks off. As each dot eases
 * from start → target, the source PNG cross-fades to 0. End
 * state: only the dot illustration remains.
 *
 * Mirrors the hero-globe DotSphere gather: per-dot delay,
 * easeOutCubic, source image fading out as dots arrive.
 */
import { useEffect, useRef, useState } from 'react';
import BorderGlow from '../BorderGlow/BorderGlow';
import GlareHover from '../GlareHover/GlareHover';
import GlassSurface from '../GlassSurface/GlassSurface';
import BlurText from '../BlurText/BlurText';
import './CityScape.css';

/* ── Tunables ─────────────────────────────────────────────── */
const SRC_PATH = '/uaerealestate/photos/dubai-cityscape-v3.png';

/* Sampling grid in DISPLAY pixels (= dot spacing). Tighter
   spacing = denser dots — at 3 px the field has ~2 × the
   density of the previous 4-px grid (≈ 1.78× by area). */
const SAMPLE_STEP_DISPLAY = 3;
/* Pixels brighter than this are treated as background. */
const BRIGHTNESS_THRESHOLD = 215;
/* Hero-globe land-dot color. */
const DOT_COLOR = '#D7D7D7';
/* Dot RADIUS in DISPLAY pixels — matches hero globe. */
const DOT_RADIUS_DISPLAY = 1.6;

/* Gather animation timing — same vocabulary as DotSphere. The
 * dots gather into the Dubai skyline and STAY — there's no photo
 * layer; the dots ARE the illustration. */
const GATHER_DURATION = 1.2;   // seconds for any single dot to arrive
const MAX_DELAY = 1.4;         // last dot starts gathering at this offset
const GATHER_END = MAX_DELAY + GATHER_DURATION; // ≈ 2.6 s
const TOTAL_DURATION = GATHER_END;

/* ── Helpers ──────────────────────────────────────────────── */
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

type Dot = {
  sx: number; sy: number;       // scattered start position (canvas px)
  tx: number; ty: number;       // target position (canvas px)
  delay: number;                // when this dot begins easing
};

export default function CityScape() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dotsRef = useRef<Dot[]>([]);
  const rafRef = useRef<number | null>(null);
  const animStartRef = useRef<number | null>(null);
  /* Dot radius in CANVAS px, set by buildDots. On the wide desktop
   * card it stays the tuned constant; on the tall mobile card it
   * scales down with the canvas so the (finer) dots don't go chunky. */
  const dotRadiusRef = useRef<number>(DOT_RADIUS_DISPLAY);

  const [hasStarted, setHasStarted] = useState(false);

  /* Build the target dot list from the source image, then
   * pair each target with a scattered start position. */
  const buildDots = (
    img: HTMLImageElement,
    canvasW: number,
    canvasH: number,
    dpr: number,
  ): Dot[] => {
    const src = document.createElement('canvas');
    src.width = img.naturalWidth;
    src.height = img.naturalHeight;
    const sctx = src.getContext('2d', { willReadFrequently: true });
    if (!sctx) return [];
    sctx.drawImage(img, 0, 0);
    const data = sctx.getImageData(0, 0, src.width, src.height).data;

    const cx = canvasW / 2;
    const cy = canvasH / 2;
    const maxDim = Math.max(canvasW, canvasH);
    const dots: Dot[] = [];

    /* Each dot starts scattered outward from its own target so the
     * gather reads like a swarm zipping inward. */
    const pushDot = (tx: number, ty: number) => {
      const angle = Math.random() * Math.PI * 2;
      const radial = (0.5 + Math.random() * 0.8) * maxDim;
      dots.push({
        sx: cx + Math.cos(angle) * radial,
        sy: cy + Math.sin(angle) * radial,
        tx,
        ty,
        delay: Math.random() * MAX_DELAY,
      });
    };
    const isInk = (sx: number, sy: number) => {
      const i = (sy * src.width + sx) * 4;
      if (data[i + 3] < 50) return false;
      const lum =
        0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      return lum < BRIGHTNESS_THRESHOLD;
    };

    if (canvasH <= canvasW) {
      /* ── Wide card (desktop/tablet) — unchanged: sample on a
       * canvas-px grid, stretching the skyline to fill the card. ── */
      const stepCanvas = SAMPLE_STEP_DISPLAY * dpr;
      const srcXPer = src.width / canvasW;
      const srcYPer = src.height / canvasH;
      dotRadiusRef.current = DOT_RADIUS_DISPLAY * dpr;
      for (let py = 0; py < canvasH; py += stepCanvas) {
        const sy = Math.floor(py * srcYPer);
        for (let px = 0; px < canvasW; px += stepCanvas) {
          const sx = Math.floor(px * srcXPer);
          if (!isInk(sx, sy)) continue;
          pushDot(px, py);
        }
      }
      return dots;
    }

    /* ── Tall card (mobile) ──────────────────────────────────────
     * Sampling on the canvas grid here would BOTH stretch the wide
     * skyline vertically AND undersample it (coarse). Instead sample
     * the SOURCE on a fixed grid (SRC_STEP) so the dot COUNT — i.e.
     * the detail — is the SAME as desktop on any screen, and place it
     * UNDISTORTED, full-width, at the BOTTOM of the card (the heading
     * + CTA float in the space above). The dot radius scales with the
     * canvas so the finer grid renders as smaller dots, not chunks. */
    const scale = canvasW / src.width;
    const offsetY = Math.max(0, canvasH - src.height * scale);
    /* Source PNG was downscaled 4× (3520→880 px) for payload; SRC_STEP
     * goes 8→2 to keep the SAME sample grid (same dot count, world
     * positions, and radius — all relative to src.width). */
    const SRC_STEP = 2;
    dotRadiusRef.current = Math.max(0.6, SRC_STEP * scale * 0.53);
    for (let sy = 0; sy < src.height; sy += SRC_STEP) {
      for (let sx = 0; sx < src.width; sx += SRC_STEP) {
        if (!isInk(sx, sy)) continue;
        pushDot(sx * scale, sy * scale + offsetY);
      }
    }
    return dots;
  };

  /* Size canvas, load image, build dots, hook resize + IO. */
  useEffect(() => {
    const card = cardRef.current;
    const canvas = canvasRef.current;
    if (!card || !canvas) return;

    const setup = () => {
      const dpr = window.devicePixelRatio || 1;
      const displayW = card.clientWidth;
      const displayH = card.clientHeight;
      if (!displayW || !displayH) return;

      const canvasW = Math.round(displayW * dpr);
      const canvasH = Math.round(displayH * dpr);
      canvas.width = canvasW;
      canvas.height = canvasH;
      canvas.style.width = `${displayW}px`;
      canvas.style.height = `${displayH}px`;

      const img = imgRef.current;
      if (img && img.complete && img.naturalWidth > 0) {
        dotsRef.current = buildDots(img, canvasW, canvasH, dpr);
      }

      /* After the gather + reveal completes the final state is
       * "photo visible, canvas blank" — nothing to repaint on
       * resize, just keep the dot canvas cleared so the image
       * shows through unobstructed. */
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = SRC_PATH;
    imgRef.current = img;
    img.onload = setup;

    setup();

    const ro = new ResizeObserver(setup);
    ro.observe(card);

    /* Trigger: fire when the section is at least 25 % visible
     * in the viewport. We use a scroll listener + bounding-rect
     * math instead of IntersectionObserver because IO is
     * unreliable in some automation / preview contexts, and a
     * scroll handler is portable + still cheap. The check also
     * runs once immediately on mount so SSR / refresh-mid-page
     * scenarios trigger correctly. */
    const section = sectionRef.current;
    let triggered = false;
    const checkVisible = () => {
      if (triggered || !section) return;
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const visible = Math.max(0, Math.min(vh, r.bottom) - Math.max(0, r.top));
      const ratio = r.height > 0 ? visible / r.height : 0;
      if (ratio >= 0.3) {
        triggered = true;
        setHasStarted(true);
        window.removeEventListener('scroll', checkVisible);
      }
    };
    checkVisible();
    window.addEventListener('scroll', checkVisible, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', checkVisible);
    };
  }, []);

  /* Animation loop — only runs once after hasStarted flips. */
  useEffect(() => {
    if (!hasStarted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    animStartRef.current = null;

    const tick = (ts: number) => {
      if (animStartRef.current === null) animStartRef.current = ts;
      const elapsed = (ts - animStartRef.current) / 1000;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = DOT_COLOR;

      const r = dotRadiusRef.current;
      const dots = dotsRef.current;

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const local = Math.max(
          0,
          Math.min(1, (elapsed - d.delay) / GATHER_DURATION),
        );
        if (local <= 0) continue;
        const eased = easeOutCubic(local);
        const x = d.sx + (d.tx - d.sx) * eased;
        const y = d.sy + (d.ty - d.sy) * eased;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (elapsed < TOTAL_DURATION) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        /* Gather complete — the dots stay drawn as the final
         * illustration (no photo reveal). */
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [hasStarted]);

  return (
    <section className="cityscape-section" ref={sectionRef}>
      <div className="cityscape-card" ref={cardRef}>
        {/* Dot illustration — the gathered dots ARE the picture
            (no photo layer). Sits at the bottom of the stack. */}
        <canvas
          ref={canvasRef}
          className="cityscape-dots"
          aria-hidden="true"
        />

        {/* Heading layered ON TOP of the dot illustration, with
            the hero's per-word blur-fade-in entrance (BlurText),
            driven off the same scroll trigger as the gather. */}
        <BlurText
          as="h2"
          className="cityscape-heading"
          text="When the wire fails, send this link"
          animateBy="words"
          direction="top"
          delay={120}
          stepDuration={0.45}
          triggerInView={hasStarted}
        />

        {/* Button + subtitle on top. The button uses the hero
            CTA's exact BorderGlow + GlareHover effects with a
            brand-pink fill (no glass / backdrop blur). The whole
            group blur-fades in (same vocabulary as the hero text)
            once the section scrolls into view. */}
        <div
          className={`cityscape-overlay${
            hasStarted ? ' cityscape-overlay--in' : ''
          }`}
        >
          {/* Liquid-glass pill — same frosted GlassSurface as the
              hero card, tinted pink (#FF9BB4 @ 50%). The BorderGlow
              sits inside with a transparent fill so the glass shows
              through; it still supplies the hover edge-glow + glare. */}
          <GlassSurface
            className="cityscape-cta-glass"
            width={270}
            height={56}
            borderRadius={28}
            simple
          >
          <BorderGlow
            className="cityscape-cta-glow"
            edgeSensitivity={20}
            glowColor="0 0 100"
            backgroundColor="transparent"
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
          </GlassSurface>
          <p className="cityscape-caption">No DLD approval needed to test</p>
        </div>
      </div>
    </section>
  );
}

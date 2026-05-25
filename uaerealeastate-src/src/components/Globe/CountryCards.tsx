import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import GlassSurface from '../GlassSurface/GlassSurface';
import { latLonToVec3 } from './geo';
import './CountryCards.css';

/**
 * Country "why crypto?" cards — HTML overlays positioned at each
 * country's lat/lon on the globe. Rendered via drei's <Html> so
 * each card is a real DOM element that can carry the Liquid Glass
 * effect from <GlassSurface> (backdrop-filter + SVG displacement).
 *
 * Visibility (cardsVisible prop) drives an opacity ramp.
 * Front-hemisphere culling: each frame the card's world position
 * is dotted with the view vector — back-hemisphere cards fade out
 * (opacity 0) so they're not visible behind the globe.
 */

const CARD_RADIUS = 1.2;
/* Base card width in CSS pixels — fixed on-screen size. Multiplied
 * by sizePct/100 for the live-tunable dev slider. */
const CARD_BASE_WIDTH_PX = 240;

type Country = {
  code: string;
  name: string;
  flag: string;
  lat: number;
  lon: number;
  body: string;
};

const COUNTRIES_DATA: Country[] = [
  {
    code: 'UA',
    name: 'Ukraine',
    flag: '🇺🇦',
    lat: 50.4501,
    lon: 30.5234,
    body:
      'Wartime capital controls limit personal spending abroad to about $2,500 a month.',
  },
  {
    code: 'LB',
    name: 'Lebanon',
    flag: '🇱🇧',
    lat: 33.8938,
    lon: 35.5018,
    body:
      'Depositors are limited to about $400 a month at official withdrawal rates.',
  },
  {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    lat: 6.5244,
    lon: 3.3792,
    body:
      'The Central Bank caps individual outbound transfers at $10,000 per year.',
  },
  {
    code: 'PK',
    name: 'Pakistan',
    flag: '🇵🇰',
    lat: 24.8607,
    lon: 67.0011,
    body:
      'State Bank approval is required for outbound real estate, months of paperwork.',
  },
  {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    lat: -34.6037,
    lon: -58.3816,
    body: 'Strict capital controls and a triple exchange-rate regime.',
  },
  {
    code: 'EG',
    name: 'Egypt',
    flag: '🇪🇬',
    lat: 30.0444,
    lon: 31.2357,
    body:
      "USD shortages mean banks can't always source the FX and wires queue for weeks.",
  },
  {
    code: 'CN',
    name: 'China',
    flag: '🇨🇳',
    lat: 39.9042,
    lon: 116.4074,
    body: 'A $50,000 annual outbound limit per citizen.',
  },
  {
    code: 'TR',
    name: 'Turkey',
    flag: '🇹🇷',
    lat: 41.0082,
    lon: 28.9784,
    body:
      'Lira instability. Banks restrict outbound foreign-currency transfers above certain thresholds.',
  },
];

/**
 * Per-country lat/lon offsets to spread out clusters of nearby
 * countries (Egypt + Lebanon + Turkey + Pakistan all sit close in
 * the Middle East). Applied to the CARD's anchor only — the real
 * country positions stay accurate; the floating card moves.
 */
const CARD_OFFSETS: Record<string, { lat: number; lon: number }> = {
  /* Ukraine pushed slightly NW so its card sits over north-western
   * Ukraine instead of the centre. */
  UA: { lat: +2, lon: -6 },
  EG: { lat: -10, lon: -10 },
  /* Lebanon pushed south-east into Saudi Arabia / Red Sea so it
   * doesn't crowd Turkey's card above. */
  LB: { lat: -8, lon: +5 },
  /* Turkey held in NORTHERN Turkey (Black Sea side) — keeps it
   * inside Turkey's territory while staying south of Ukraine
   * and well above Lebanon's new southern spot. */
  TR: { lat: +2, lon: +2 },
  PK: { lat: -10, lon: +10 },
};

/* ── A single card (HTML overlay, billboard via drei <Html>) ─── */

function CountryCardHtml({
  country,
  pos,
  visible,
  sizePct,
  dissolveProgress,
  flyDx,
  flyDy,
  spinX,
  spinY,
  spinZ,
  startProgress,
  flyDistance,
  scaleEnd,
}: {
  country: Country;
  pos: THREE.Vector3;
  visible: boolean;
  sizePct: number;
  dissolveProgress: number;
  flyDx: number;
  flyDy: number;
  spinX: number;
  spinY: number;
  spinZ: number;
  /** This card's own start point on the overall dissolveProgress
   *  timeline (0..0.4). Cards with larger startProgress wait
   *  longer before they begin to fly. */
  startProgress: number;
  /** Per-card max fling distance in pixels — randomized so some
   *  cards fly far, others stay closer. */
  flyDistance: number;
  /** Final scale at localProgress=1. >1 reads as moving toward
   *  the camera, <1 as moving away. Cards growing past 2.5×
   *  also pick up a blur after 60 % of their flight. */
  scaleEnd: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const opacityRef = useRef(0);
  /* Track the LAST front-hemisphere flag so we only write style
   * when it changes — avoids touching the DOM every frame. */
  const lastFrontRef = useRef(true);
  /* Fly direction captured AT THE MOMENT this card's local
   *  dissolve starts — derived from its projected screen
   *  position so cards on the left fly LEFT, top fly UP, etc. */
  const flyDirRef = useRef<{ x: number; y: number } | null>(null);
  /* The dissolveProgress at which this card was first detected
   *  near a viewport edge → its own animation timeline starts. */
  const cardStartRef = useRef<number | null>(null);

  const tmpVec = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const g = groupRef.current;
    const el = cardRef.current;
    if (!g || !el) return;

    /* Force the drei <Html> wrapper (parent of cardRef) onto
     * its OWN composited layer so the backdrop-filter inside
     * glass-surface stays evaluated continuously — even when
     * the card is near a viewport edge or only partially in
     * view. We hint via `will-change: transform` (transform
     * doesn't establish a backdrop root, so the glass-surface
     * inside still samples the globe behind cleanly). One-shot
     * setup. */
    const wrapper = el.parentElement;
    if (wrapper && wrapper.style.willChange !== 'transform') {
      wrapper.style.willChange = 'transform';
    }

    /* Front-hemisphere check — outward normal dot view direction. */
    g.getWorldPosition(tmpVec);
    const dot =
      tmpVec.x * (state.camera.position.x - tmpVec.x) +
      tmpVec.y * (state.camera.position.y - tmpVec.y) +
      tmpVec.z * (state.camera.position.z - tmpVec.z);
    const front = dot > 0;

    /* EDGE-TRIGGERED dissolve. The card stays put on the globe
     * (rotating with autoRotate) until its projected screen
     * position enters the 100 px-from-edge zone. At that
     * moment we capture the current dissolveProgress as the
     * card's own `startProgress`, and from there localProgress
     * ramps with further scroll.
     *
     * Fallback: at high dissolveProgress (>0.7) we force-trigger
     * any cards still on screen so they're guaranteed to fly
     * out before the user exits the hero.
     *
     * Edge distance is computed using the drei <Html>
     * wrapper's CSS-pixel position (parent of cardRef). */
    /* Only allow edge-trigger AFTER the dissolve has actually
     * started (dissolveProgress > 0). Otherwise any card that
     * happens to project near a viewport edge at page-load
     * would capture cardStartRef immediately and stay pinned
     * to opacity 1 — visible on the hero screen before lock.
     */
    const EDGE_PX = 100;
    if (cardStartRef.current === null && dissolveProgress > 0) {
      const wrapper = el.parentElement;
      let nearEdge = false;
      if (wrapper) {
        const r = wrapper.getBoundingClientRect();
        const vw = window.innerWidth;
        const vH = window.innerHeight;
        const cx = (r.left + r.right) / 2;
        const cy = (r.top + r.bottom) / 2;
        if (
          cx < EDGE_PX ||
          cx > vw - EDGE_PX ||
          cy < EDGE_PX ||
          cy > vH - EDGE_PX
        ) {
          nearEdge = true;
        }
      }
      /* Force every card to start the moment dissolve begins —
       * NOT just the ones currently near a viewport edge.
       * Edge-trigger is kept as a no-op (every card hits the
       * dissolveProgress > 0 path immediately anyway), but the
       * threshold is low enough that cards START before arcs
       * fade out, matching the cards/coins → arcs → dots
       * order. */
      if (nearEdge || dissolveProgress > 0) {
        cardStartRef.current = dissolveProgress;
      }
    }
    const liveStart = cardStartRef.current ?? startProgress;
    const localProgress =
      cardStartRef.current === null
        ? 0
        : Math.min(
            1,
            (dissolveProgress - liveStart) / Math.max(0.05, 1 - liveStart),
          );

    /* Compute localProgress NOW (so it's available to the
     * opacity logic below). Definition: card stays at 0 until
     * dissolveProgress crosses its captured start, then ramps
     * to 1 by global progress 1. */
    const liveStartForOpacity = cardStartRef.current;
    const localProgressPreview =
      liveStartForOpacity === null || dissolveProgress < liveStartForOpacity
        ? 0
        : Math.min(
            1,
            (dissolveProgress - liveStartForOpacity) /
              Math.max(0.05, 1 - liveStartForOpacity),
          );

    /* Opacity rules:
     *   • Card is FLYING (localProgress > 0): pin to 1 — the
     *     underlying 3D anchor keeps rotating but the flying
     *     card mustn't fade in/out due to hemisphere flips.
     *   • Card is NOT flying (localProgress = 0): use the
     *     normal `visible && front` fade. This covers all
     *     pre-dissolve states, including when cards first
     *     appear at lock. */
    if (localProgressPreview > 0) {
      el.style.opacity = '1';
    } else {
      const target = visible && front ? 1 : 0;
      /* Asymmetric ramp:
       *   • Entering (target > current): SNAP straight to 1.
       *     Any intermediate opacity < 1 makes .country-card a
       *     backdrop root, which traps the glass-surface's
       *     backdrop-filter and the card looks transparent
       *     with no refraction until the ramp finishes.
       *   • Leaving  (target < current): lerp gently down at
       *     0.2 so cards still fade as they rotate to the back
       *     hemisphere. */
      if (target > opacityRef.current) {
        opacityRef.current = target;
      } else {
        opacityRef.current += (target - opacityRef.current) * 0.2;
      }
      el.style.opacity = `${opacityRef.current}`;
    }

    if (localProgress > 0) {
      /* Capture this card's fly direction the first frame
       * its dissolve begins. Project world position to NDC →
       * NDC x maps to screen X (left/right), NDC y maps to
       * screen Y inverted. */
      if (!flyDirRef.current) {
        const ndc = tmpVec.clone().project(state.camera);
        let dx = ndc.x;
        let dy = -ndc.y;
        const m = Math.sqrt(dx * dx + dy * dy);
        if (m > 0.08) {
          dx /= m;
          dy /= m;
        } else {
          /* Card sat too close to screen centre — fall back to
           * the pre-rolled random direction so it still moves. */
          dx = flyDx;
          dy = flyDy;
        }
        /* Small random jitter so cards next to each other don't
         * all leave on identical vectors. */
        dx += (Math.random() - 0.5) * 0.25;
        dy += (Math.random() - 0.5) * 0.25;
        flyDirRef.current = { x: dx, y: dy };
      }
      const dir = flyDirRef.current;

      /* Ease-OUT (1 − (1−t)²): fast start, slow finish. With
       * ease-IN the card barely moved for the first 30 % of its
       * progress, so visually the arcs vanished before the
       * card looked like it had begun flying. Ease-out makes
       * the card cover ≈19 % of its distance by local = 0.1
       * and ≈51 % by local = 0.3 — so cards are visibly
       * SHOOTING out before arcs fade at 0.056. */
      const eased = 1 - (1 - localProgress) * (1 - localProgress);
      const tx = dir.x * flyDistance * eased;
      const ty = dir.y * flyDistance * eased;
      const rx = spinX * localProgress;
      const ry = spinY * localProgress;
      const rz = spinZ * localProgress;
      /* Scale lerps 1 → scaleEnd. >1 reads "coming closer",
       * <1 reads "going further away". */
      const scale = 1 + (scaleEnd - 1) * localProgress;
      el.style.transform = `perspective(900px) translate3d(${tx}px, ${ty}px, 0) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`;
      /* Defocus blur once the card's CURRENT scale crosses
       * 300 %. Ramps from 0 → 16 px as scale climbs from 3.0
       * up to ~4.0×. */
      if (scale >= 3.0) {
        const blurT = Math.min(1, (scale - 3.0) / 1.0);
        el.style.filter = `blur(${blurT * 16}px)`;
      } else {
        el.style.filter = '';
      }
    } else {
      el.style.transform = '';
      el.style.filter = '';
      /* If the user has scrolled back to BEFORE the dissolve
       * began at all, reset captured direction + start so the
       * card can re-trigger naturally next time. */
      if (dissolveProgress <= 0) {
        flyDirRef.current = null;
        cardStartRef.current = null;
      }
    }

    if (front !== lastFrontRef.current) {
      lastFrontRef.current = front;
      el.style.pointerEvents = front ? 'none' : 'none';
    }
  });

  return (
    <group ref={groupRef} position={[pos.x, pos.y, pos.z]}>
      <Html center pointerEvents="none" zIndexRange={[100, 0]}>
        <div
          ref={cardRef}
          className="country-card"
          style={{
            opacity: 0,
            width: `${CARD_BASE_WIDTH_PX * (sizePct / 100)}px`,
            pointerEvents: 'none',
          }}
        >
          <GlassSurface
            width="100%"
            height="auto"
            borderRadius={15}
            simple
          >
            <div className="country-card__body">
              <div className="country-card__head">
                <img
                  className="country-card__flag"
                  src={`https://flagicons.lipis.dev/flags/4x3/${country.code.toLowerCase()}.svg`}
                  alt={`${country.name} flag`}
                />
                <span className="country-card__name">
                  {country.name.toUpperCase()}
                </span>
              </div>
              <p className="country-card__text">{country.body}</p>
            </div>
          </GlassSurface>
        </div>
      </Html>
    </group>
  );
}

export default function CountryCards({
  visible,
  sizePct = 100,
  dissolveProgress = 0,
}: {
  visible: boolean;
  sizePct?: number;
  /** Scroll-driven dissolve (0..1) — each card flings outward
   *  with a random direction + spin, fading to 0 as progress
   *  reaches 1. */
  dissolveProgress?: number;
}) {
  const placements = useMemo(
    () =>
      COUNTRIES_DATA.map((c) => {
        const off = CARD_OFFSETS[c.code] ?? { lat: 0, lon: 0 };
        const pos = latLonToVec3(c.lat + off.lat, c.lon + off.lon, CARD_RADIUS);
        /* Per-card random fling direction + 3D spin + start
         * point on the timeline + fly distance. Each card gets
         * its own values so the group scatters in waves with
         * mixed speeds, directions, and rotations — feels more
         * physical than a synchronous lockstep. */
        const a = Math.random() * Math.PI * 2;
        const flyDx = Math.cos(a);
        const flyDy = Math.sin(a) - 0.2 + (Math.random() - 0.5) * 0.5;
        const spinX = (Math.random() - 0.5) * 960; // ±2.6 turns
        const spinY = (Math.random() - 0.5) * 960;
        const spinZ = (Math.random() - 0.5) * 720; // ±2 turns
        const startProgress = Math.random() * 0.35; // 0..0.35
        /* Fly distance must clear the viewport diagonal so every
         * card ends fully off-screen. A 1280×900 viewport has
         * a diagonal of ≈1570 px; we use 1500..2200 px so cards
         * in every starting position exit. */
        const flyDistance = 1500 + Math.random() * 700;
        /* Final scale: bimodal split so the swarm visibly
         * separates into two depth layers. Half the cards
         * shrink (0.3..1.0, going further away); the other
         * half grow to 3.0..5.0× so they cross the blur
         * threshold and read as "coming up to the lens, out
         * of focus". */
        const scaleEnd =
          Math.random() < 0.5
            ? 0.3 + Math.random() * 0.7
            : 3.0 + Math.random() * 2.0;
        return {
          country: c,
          pos,
          flyDx,
          flyDy,
          spinX,
          spinY,
          spinZ,
          startProgress,
          flyDistance,
          scaleEnd,
        };
      }),
    [],
  );

  return (
    <>
      {placements.map((p) => (
        <CountryCardHtml
          key={p.country.code}
          country={p.country}
          pos={p.pos}
          visible={visible}
          sizePct={sizePct}
          dissolveProgress={dissolveProgress}
          flyDx={p.flyDx}
          flyDy={p.flyDy}
          spinX={p.spinX}
          spinY={p.spinY}
          spinZ={p.spinZ}
          startProgress={p.startProgress}
          flyDistance={p.flyDistance}
          scaleEnd={p.scaleEnd}
        />
      ))}
    </>
  );
}


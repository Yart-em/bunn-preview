import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { Arc } from './Arcs';
import { RIBBON_HEIGHT } from './Arcs';
import { COLOR_FLOW } from './constants';
import { ARCS_END, PINS_END, fadeAt } from './entry';

type Traveler = {
  arcIndex: number;
  phase: number;
  speed: number;
  currencyIndex: number;
  /** Real-time clock at which this coin transitioned from rolling
   *  into the arrival animation (= phase reached ARRIVAL_START).
   *  null while the coin is still rolling. */
  arrivedAt: number | null;
};

const PER_ARC = 2;
const MIN_SPEED = 0.05;
const MAX_SPEED = 0.1;

const COIN_RADIUS = 0.030;
const COIN_THICKNESS = 0.015;
const STRIPES_AROUND = 36;

/** Phase at which a coin stops rolling and starts the arrival
 *  animation. Set close to 1.0 so the coin reaches the *geographic*
 *  vicinity of Dubai before snapping to the pedestal. With a lower
 *  value (0.85) the longest arcs (Auckland → Dubai etc.) had the
 *  coin freeze far from the destination and then teleport across
 *  the globe in 0.5s, which read as the coin "disappearing" before
 *  the gathering point was reached. */
const ARRIVAL_START = 0.96;

/** Arrival animation timing — driven by REAL TIME, not phase, so
 *  every coin holds for exactly 1 second before fading regardless
 *  of its individual travel speed. */
const ARRIVAL_DROP_DURATION = 0.5; // sec — rolling pose → flat in stack
const ARRIVAL_HOLD_DURATION = 1.0; // sec — sit in the stack
const ARRIVAL_FADE_DURATION = 0.4; // sec — fade out
const ARRIVAL_TOTAL =
  ARRIVAL_DROP_DURATION + ARRIVAL_HOLD_DURATION + ARRIVAL_FADE_DURATION;

/** Top of the Dubai pedestal expressed as the radial offset from
 *  the sphere surface — must stay in sync with DubaiMarker.tsx so
 *  arriving coins land on top of the pedestal.
 *  Pedestal base sits on the surface (offset 0) and rises by its
 *  full height (0.030 — 25% larger to match the bigger coins). */
const PEDESTAL_TOP_LIFT = 0.030;

/** Currency symbols to mint, distributed across travelers. */
const CURRENCIES = ['$', '€', '£', '¥', '₹'];

const OUTLINE = '#272727';
const STROKE = 4; // ≈ 1 screen pixel at our texture resolution

function drawCurrencyGlyph(
  ctx: CanvasRenderingContext2D,
  glyph: string,
  cx: number,
  cy: number,
  size: number,
) {
  const fontSize = Math.round(size * 0.55);
  ctx.font = `900 ${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Filled glyph in pink (matches the coin disc) with a thin outline
  // for a clean "stroke around bold body" look.
  ctx.fillStyle = COLOR_FLOW;
  ctx.fillText(glyph, cx, cy);
  ctx.lineWidth = STROKE;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.strokeText(glyph, cx, cy);
}

function makeFaceTexture(glyph: string): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;

  const r = size / 2;

  // Pink disc body.
  ctx.fillStyle = COLOR_FLOW;
  ctx.beginPath();
  ctx.arc(r, r, r - STROKE / 2, 0, Math.PI * 2);
  ctx.fill();

  // Outer rim outline.
  ctx.lineWidth = STROKE;
  ctx.strokeStyle = OUTLINE;
  ctx.beginPath();
  ctx.arc(r, r, r - STROKE / 2, 0, Math.PI * 2);
  ctx.stroke();

  // Inner ring outline.
  ctx.beginPath();
  ctx.arc(r, r, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();

  drawCurrencyGlyph(ctx, glyph, r, r + size * 0.03, size);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function makeSideTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 64;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = COLOR_FLOW;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = OUTLINE;
  for (let i = 0; i < STRIPES_AROUND; i++) {
    const x = (i / STRIPES_AROUND) * w;
    ctx.fillRect(x, 0, STROKE, h);
  }
  ctx.fillRect(0, 0, w, STROKE);
  ctx.fillRect(0, h - STROKE, w, STROKE);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export default function TravelingDots({
  arcs,
  dissolveProgress = 0,
}: {
  arcs: Arc[];
  /** Scroll-driven dissolve (0..1). Coins fly outward + spin
   *  and fade out as progress climbs. */
  dissolveProgress?: number;
}) {
  const [textures, setTextures] = useState<{
    faces: THREE.Texture[];
    side: THREE.Texture;
  } | null>(null);

  useEffect(() => {
    setTextures({
      faces: CURRENCIES.map(makeFaceTexture),
      side: makeSideTexture(),
    });
  }, []);

  const travelers = useMemo<Traveler[]>(() => {
    const out: Traveler[] = [];
    let counter = 0;
    arcs.forEach((_, arcIndex) => {
      for (let i = 0; i < PER_ARC; i++) {
        out.push({
          arcIndex,
          phase: (i / PER_ARC + Math.random() * 0.3) % 1,
          speed: MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED),
          currencyIndex: counter % CURRENCIES.length,
          arrivedAt: null,
        });
        counter++;
      }
    });
    return out;
  }, [arcs]);

  const arcLengths = useMemo(
    () => arcs.map((a) => a.curve.getLength()),
    [arcs],
  );

  /** Per-coin materials (one set of three per traveler), each using
   *  the face texture for its assigned currency. */
  const coinMaterials = useMemo(() => {
    if (!textures) return [];
    return travelers.map((t) => {
      const face = textures.faces[t.currencyIndex];
      // depthWrite: false avoids the classic transparent-blocks-
      // background bug — without it, a fading coin still writes its
      // depth and "punches a hole" in the pedestal underneath.
      const common = {
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      };
      const side = new THREE.MeshBasicMaterial({
        ...common,
        map: textures.side,
      });
      const faceMat = new THREE.MeshBasicMaterial({
        ...common,
        map: face,
      });
      const faceMatBack = new THREE.MeshBasicMaterial({
        ...common,
        map: face,
      });
      return [side, faceMat, faceMatBack] as THREE.Material[];
    });
  }, [textures, travelers]);

  const groupRefs = useRef<Array<THREE.Group | null>>([]);
  const startRef = useRef<number | null>(null);

  // Scratch math helpers — declared once.
  const yAxis = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const tmpOutward = useMemo(() => new THREE.Vector3(), []);
  const tmpTangent = useMemo(() => new THREE.Vector3(), []);
  const tmpAxle = useMemo(() => new THREE.Vector3(), []);
  const tmpOrient = useMemo(() => new THREE.Quaternion(), []);
  const tmpRoll = useMemo(() => new THREE.Quaternion(), []);
  const tmpQ = useMemo(() => new THREE.Quaternion(), []);
  const tmpQ2 = useMemo(() => new THREE.Quaternion(), []);
  const tmpPt = useMemo(() => new THREE.Vector3(), []);
  const tmpArcPos = useMemo(() => new THREE.Vector3(), []);
  const tmpStackPos = useMemo(() => new THREE.Vector3(), []);
  const tmpRadial = useMemo(() => new THREE.Vector3(), []);

  /** Pre-computed per-coin scatter parameters so each coin gets
   *  its OWN start point, direction, fly distance, and spin —
   *  the swarm scatters in waves instead of in lockstep. */
  const coinScatter = useMemo(
    () =>
      travelers.map(() => {
        const dir = new THREE.Vector3(
          (Math.random() - 0.5) * 2.4,
          Math.random() * 1.8 + 0.2,
          (Math.random() - 0.5) * 2.4,
        ).normalize();
        const spinAxis = new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5,
        ).normalize();
        return {
          dir,
          spinAxis,
          /** Where on the global dissolveProgress timeline this
           *  coin starts flying (0..0.4). */
          startProgress: Math.random() * 0.4,
          /** Per-coin fly distance (10..18 world units) — far
           *  enough that every coin clears the camera frustum
           *  and exits the viewport. */
          distance: 10 + Math.random() * 8,
          /** Spin amount in radians at progress 1. */
          spinAmount: (Math.random() + 0.6) * Math.PI * 6,
          /** Final scale multiplier at localProgress=1. >1 reads
           *  "coming toward the camera", <1 as "going away". */
          scaleEnd: 0.4 + Math.random() * 2.6,
        };
      }),
    [travelers],
  );
  const tmpSpinQ = useMemo(() => new THREE.Quaternion(), []);

  /** Per-coin captured fly direction (locked at the frame each
   *  coin enters its local dissolve). */
  const coinFlyDirRef = useRef<Array<THREE.Vector3 | null>>([]);
  /** Per-coin dissolveProgress at the moment the coin was
   *  detected near a viewport edge (≤100 px). */
  const coinStartRef = useRef<Array<number | null>>([]);
  const tmpProj = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (startRef.current === null) startRef.current = state.clock.elapsedTime;
    const tEntry = state.clock.elapsedTime - startRef.current;
    const fade = fadeAt(tEntry, ARCS_END, PINS_END);
    const now = state.clock.elapsedTime;

    // Advance phases / arrival timers.
    travelers.forEach((t) => {
      if (t.arrivedAt === null) {
        // Rolling. When we cross ARRIVAL_START, freeze phase and
        // start the real-time arrival timer.
        t.phase += delta * t.speed;
        if (t.phase >= ARRIVAL_START) {
          t.phase = ARRIVAL_START;
          t.arrivedAt = now;
        }
      } else {
        // Already arriving. Reset to a fresh rolling cycle once the
        // full drop+hold+fade has elapsed.
        if (now - t.arrivedAt >= ARRIVAL_TOTAL) {
          t.phase = 0;
          t.arrivedAt = null;
        }
      }
    });

    // Stack slots: coins that arrived earliest sit at the bottom,
    // newer arrivals pile on top. Sorted by ascending arrivedAt.
    const arriving: number[] = [];
    travelers.forEach((t, i) => {
      if (t.arrivedAt !== null) arriving.push(i);
    });
    arriving.sort(
      (a, b) => (travelers[a].arrivedAt ?? 0) - (travelers[b].arrivedAt ?? 0),
    );
    const stackSlot = new Int8Array(travelers.length).fill(-1 as unknown as number);
    arriving.forEach((idx, slot) => {
      stackSlot[idx] = slot;
    });

    travelers.forEach((t, i) => {
      const group = groupRefs.current[i];
      const mats = coinMaterials[i];
      if (!group || !mats) return;

      const arc = arcs[t.arcIndex];
      if (!arc) return;

      // Where the coin would be rolling along the arc at this phase.
      arc.curve.getPointAt(t.phase, tmpPt);
      arc.curve.getTangent(t.phase, tmpTangent).normalize();
      tmpOutward.crossVectors(tmpTangent, arc.planeNormal).normalize();

      // Distance-based scaling. Compute first so the lift-off can
      // account for the shrunken coin radius — without this, far
      // coins look like they're floating above the arc because
      // their center stays at full-radius offset while the cylinder
      // itself is rendered smaller.
      const distFromCam = tmpPt.distanceTo(state.camera.position);
      const depthT = THREE.MathUtils.clamp((distFromCam - 1.5) / (5 - 1.5), 0, 1);
      const depthMul = THREE.MathUtils.lerp(1.05, 0.55, depthT);

      const liftOff = RIBBON_HEIGHT + COIN_RADIUS * depthMul + 0.001;
      tmpArcPos.copy(tmpPt).addScaledVector(tmpOutward, liftOff);

      // Roll angle accumulated up to this phase.
      const distance = arcLengths[t.arcIndex] * t.phase;
      const rollAngle = distance / COIN_RADIUS;

      let opacityMul = 1;

      if (t.arrivedAt === null) {
        // ====== Rolling along the arc ======
        group.position.copy(tmpArcPos);

        tmpAxle.copy(arc.planeNormal);
        tmpRoll.setFromAxisAngle(yAxis, rollAngle);
        tmpOrient.setFromUnitVectors(yAxis, tmpAxle);
        tmpQ.multiplyQuaternions(tmpOrient, tmpRoll);
        group.quaternion.copy(tmpQ);
      } else {
        // ====== Arrival animation ======
        const tArrive = now - t.arrivedAt;
        const slot = stackSlot[i];
        const destPt = arc.end;
        tmpRadial.copy(destPt).normalize();

        // Stack base sits on top of the Dubai pedestal. Each coin
        // offsets up by its slot index × thickness so coins pile up
        // one on another.
        const stackHeight =
          PEDESTAL_TOP_LIFT + COIN_THICKNESS / 2 + slot * COIN_THICKNESS * 0.95;
        tmpStackPos.copy(destPt).addScaledVector(tmpRadial, stackHeight);

        if (tArrive < ARRIVAL_DROP_DURATION) {
          // Phase A: drop — lerp position from arc to stack, slerp
          // orientation from rolling pose to "lying flat" pose.
          const dropT = tArrive / ARRIVAL_DROP_DURATION;
          const dropEased = easeOutCubic(dropT);

          group.position.lerpVectors(tmpArcPos, tmpStackPos, dropEased);

          tmpRoll.setFromAxisAngle(yAxis, rollAngle);
          tmpOrient.setFromUnitVectors(yAxis, arc.planeNormal);
          tmpQ.multiplyQuaternions(tmpOrient, tmpRoll);
          tmpQ2.setFromUnitVectors(yAxis, tmpRadial);
          tmpQ.slerp(tmpQ2, dropEased);
          group.quaternion.copy(tmpQ);
        } else if (tArrive < ARRIVAL_DROP_DURATION + ARRIVAL_HOLD_DURATION) {
          // Phase B: settled — sit in the stack for 1 second.
          group.position.copy(tmpStackPos);
          tmpQ.setFromUnitVectors(yAxis, tmpRadial);
          group.quaternion.copy(tmpQ);
        } else {
          // Phase C: fade out — last 0.4 sec.
          const fadeT =
            (tArrive - ARRIVAL_DROP_DURATION - ARRIVAL_HOLD_DURATION) /
            ARRIVAL_FADE_DURATION;
          opacityMul = THREE.MathUtils.clamp(1 - fadeT, 0, 1);

          group.position.copy(tmpStackPos);
          tmpQ.setFromUnitVectors(yAxis, tmpRadial);
          group.quaternion.copy(tmpQ);
        }
      }

      // Depth scaling computed earlier — apply now.
      group.scale.setScalar(depthMul);

      /* EDGE-TRIGGERED fly-off. The coin keeps rolling on the
       * arc / sitting on the pedestal until its projected
       * screen position enters the 100 px-from-edge zone. At
       * that moment we capture the current dissolveProgress
       * as the coin's `startProgress`, and from there local
       * ramps with further scroll. Coins still on screen at
       * dissolveProgress >0.7 get force-triggered so nothing
       * is left behind. */
      if (dissolveProgress > 0) {
        const EDGE_PX = 100;
        if (coinStartRef.current[i] == null) {
          tmpProj.copy(group.position);
          tmpProj.project(state.camera);
          const sx = ((tmpProj.x + 1) / 2) * window.innerWidth;
          const sy_ = ((1 - tmpProj.y) / 2) * window.innerHeight;
          const nearEdge =
            sx < EDGE_PX ||
            sx > window.innerWidth - EDGE_PX ||
            sy_ < EDGE_PX ||
            sy_ > window.innerHeight - EDGE_PX;
          /* Force-trigger immediately at dissolveProgress > 0
           * (instead of waiting until 0.3) so coins begin
           * flying BEFORE the arcs fade and BEFORE the dot
           * sphere scatters. */
          if (nearEdge || dissolveProgress > 0) {
            coinStartRef.current[i] = dissolveProgress;
          }
        }
        const s = coinScatter[i];
        const captured = coinStartRef.current[i];
        const local =
          captured == null
            ? 0
            : Math.min(
                1,
                (dissolveProgress - captured) / Math.max(0.05, 1 - captured),
              );
        if (local > 0) {
          /* Capture the coin's outward direction at its first
           * dissolve frame — derived from its CURRENT world
           * position relative to the scene origin so coins on
           * the +X side go +X, etc. Locked once captured. */
          if (!coinFlyDirRef.current[i]) {
            const captured = group.position.clone();
            if (captured.lengthSq() > 0.0001) {
              captured.normalize();
            } else {
              captured.copy(s.dir);
            }
            /* Small random jitter so adjacent coins don't end up
             * on identical vectors. */
            captured.x += (Math.random() - 0.5) * 0.4;
            captured.y += (Math.random() - 0.5) * 0.4;
            captured.z += (Math.random() - 0.5) * 0.4;
            captured.normalize();
            coinFlyDirRef.current[i] = captured;
          }
          const dir = coinFlyDirRef.current[i]!;

          /* Ease-OUT so coins shoot out fast at the start of
           * their local timeline (vs. ease-in which barely
           * moved them while arcs + dots were already fading). */
          const eased = 1 - (1 - local) * (1 - local);
          const flyDistance = s.distance * eased;
          group.position.x += dir.x * flyDistance;
          group.position.y += dir.y * flyDistance;
          group.position.z += dir.z * flyDistance;
          tmpSpinQ.setFromAxisAngle(s.spinAxis, local * s.spinAmount);
          group.quaternion.multiply(tmpSpinQ);
          /* Per-coin scale: lerp from current depthMul-scale to
           * (depthMul × scaleEnd) — so some coins grow (toward
           * the lens) and others shrink (off into the distance). */
          const scaleMul = 1 + (s.scaleEnd - 1) * local;
          group.scale.setScalar(depthMul * scaleMul);
          /* Pin opacity at 1 during dissolve — override any
           * arrival-phase Phase-C fade-out that would have been
           * computed above. Coins stay fully opaque while in
           * flight; they only "leave" by exiting the viewport. */
          opacityMul = 1;
        } else {
          /* Coin not yet triggered — make sure refs stay clean
           * so a fresh capture happens next time it crosses
           * the edge. */
          coinFlyDirRef.current[i] = null;
        }
      } else {
        /* Scrolled fully back below dissolve start — reset
         * both refs so this coin can re-trigger naturally. */
        coinStartRef.current[i] = null;
        coinFlyDirRef.current[i] = null;
      }

      mats.forEach((m) => {
        (m as THREE.MeshBasicMaterial).opacity = fade * opacityMul;
      });
    });
  });

  if (travelers.length === 0 || !textures) return null;

  return (
    <>
      {travelers.map((_, i) => (
        <group
          key={i}
          ref={(g) => {
            groupRefs.current[i] = g;
          }}
          renderOrder={2}
        >
          <mesh material={coinMaterials[i]} renderOrder={2}>
            <cylinderGeometry
              args={[COIN_RADIUS, COIN_RADIUS, COIN_THICKNESS, 48, 1, false]}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

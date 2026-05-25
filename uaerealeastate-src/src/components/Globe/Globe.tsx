import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import DotSphere from './DotSphere';
import Arcs, { useArcs } from './Arcs';
import TravelingDots from './TravelingDots';
import DubaiMarker from './DubaiMarker';
import CountryCards from './CountryCards';
import { useGlobeDots } from './dots';
import { latLonToVec3 } from './geo';
import { DUBAI } from './constants';

function Scene({
  sphereYOffset,
  sphereScale,
  cardsVisible,
  cardSizePct,
  dissolveProgress,
  preLockProgress,
  dotSize,
}: {
  sphereYOffset: number;
  sphereScale: number;
  cardsVisible: boolean;
  cardSizePct: number;
  dissolveProgress: number;
  preLockProgress: number;
  dotSize: number;
}) {
  const dots = useGlobeDots();
  const arcs = useArcs(dots?.landVectors ?? null);

  /** The Dubai-centred Y rotation. Manual auto-rotation
   *  accumulates from here. */
  const initialYRotation = useMemo(() => {
    const dubai = latLonToVec3(DUBAI[0], DUBAI[1], 1);
    return -Math.atan2(dubai.x, dubai.z);
  }, []);

  /** Ref to the rotating group. Rotation is driven manually in
   *  useFrame below — OrbitControls' autoRotate is disabled. */
  const groupRef = useRef<THREE.Group>(null);
  /** Free-rotation accumulator (radians). Increments every frame.
   *  Reset to 0 the moment `cardsVisible` flips so post-lock
   *  rotation starts exactly at Dubai-centred (no snap-back). */
  const freeRotationRef = useRef(0);
  const wasCardsVisibleRef = useRef(false);
  /** Radians per second. Matches OrbitControls' historical rate:
   *  its autoRotateSpeed = 0.32 translates to
   *  (π / 30) × 0.32 ≈ 0.0335 rad/s. */
  const AUTO_ROTATE_SPEED = (Math.PI / 30) * 0.32;

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    /* Lock transition: reset the accumulator so we continue
     * from Dubai-centred without snapping back to whatever
     * rotation the pre-lock free-spin had reached. */
    if (cardsVisible && !wasCardsVisibleRef.current) {
      freeRotationRef.current = 0;
    }
    wasCardsVisibleRef.current = cardsVisible;

    /* Rotate WEST → EAST (Earth's actual spin direction).
     * Positive group.rotation.y around +Y is counterclockwise
     * from above, which maps to W→E when viewing the equator
     * from the camera side. */
    freeRotationRef.current += delta * AUTO_ROTATE_SPEED;

    /* Wrap the accumulator to (-π, π] so the homing transition
     * always takes the SHORTEST path back to Dubai-centred —
     * at most half a turn. Without this, leaving the page open
     * for a long time would build up many full rotations in
     * the accumulator, and on scroll the globe would unwind ALL
     * of them. Visually 0 / 2π / 4π / … all show the SAME
     * rotation, so wrapping is a no-op on the rendered frame
     * but keeps the value used for the homing lerp bounded. */
    const TWO_PI = Math.PI * 2;
    freeRotationRef.current =
      ((freeRotationRef.current + Math.PI) % TWO_PI + TWO_PI) % TWO_PI -
      Math.PI;

    /* Pre-lock: blend the free-rotation to 0 as preLockProgress
     * approaches 1 — globe homes to Dubai-centred just before
     * cards appear. Post-lock: blend = 0, full free rotation. */
    const blend = cardsVisible ? 0 : preLockProgress;
    const offset = freeRotationRef.current * (1 - blend);
    groupRef.current.rotation.y = initialYRotation + offset;
  });

  if (!dots) return null;

  return (
    <group
      ref={groupRef}
      position={[0, sphereYOffset, 0]}
      scale={sphereScale}
      rotation={[0, initialYRotation, 0]}
    >
      <ambientLight intensity={1} />

      {/* Invisible depth-only sphere. Paints nothing visible but
          writes to the depth buffer so back-side arcs / pedestal /
          coins / country cards are correctly occluded by the
          globe's silhouette.
          Radius 0.99 — slightly SMALLER than the dotted-globe
          radius (1.0) so the arc endpoints at sphere surface
          pass the front-face depth test and reach the pedestal,
          while back-side geometry (at z ≈ −1.0) still fails the
          test against the occluder's back face (z ≈ −0.99,
          closer to camera) and stays hidden. Dots opt out via
          depthTest:false so they always render. */}
      <mesh renderOrder={-1}>
        <sphereGeometry args={[0.99, 64, 64]} />
        <meshBasicMaterial colorWrite={false} />
      </mesh>

      <DotSphere
        dots={dots}
        dissolveProgress={dissolveProgress}
        dotSize={dotSize}
      />
      {/* Country "why crypto" cards. */}
      <CountryCards
        visible={cardsVisible}
        sizePct={cardSizePct}
        dissolveProgress={dissolveProgress}
      />
      {/* Arcs fade out over a tiny 10 px scroll window once
          dissolve begins (driven by `dissolveProgress` inside
          Arcs); pedestal hides binary because nothing rolls
          onto it during dissolve. */}
      <Arcs arcs={arcs} dissolveProgress={dissolveProgress} />
      {dissolveProgress <= 0 && (
        <DubaiMarker landVectors={dots.landVectors} />
      )}
      <TravelingDots arcs={arcs} dissolveProgress={dissolveProgress} />
    </group>
  );
}

export default function Globe({
  sphereYOffset = -0.4,
  sphereScale = 1,
  cardsVisible = false,
  cardSizePct = 100,
  dissolveProgress = 0,
  preLockProgress = 0,
  dotSize = 0.011,
}: {
  sphereYOffset?: number;
  sphereScale?: number;
  /** True once the user has scrolled the globe to its locked
   *  (75 %-scale) state — country cards appear and the user can
   *  drag-rotate the globe at that point. */
  cardsVisible?: boolean;
  /** Country-card size as a % of baseline (100 = default).
   *  Driven by the dev toggle bar's slider. */
  cardSizePct?: number;
  /** Scroll-driven dissolve progress (0..1). 0 = sphere fully
   *  formed; 1 = dots scattered far, coins flung, cards flipped
   *  and flung, arcs hidden. */
  dissolveProgress?: number;
  /** Pre-lock scroll progress (0..1). Drives the rotation
   *  "homing" so the globe ends Dubai-centred at lock. */
  preLockProgress?: number;
  /** World-space dot size. Driven from App so dots scale with the
   *  globe's on-screen size (viewport aspect) — keeps the dot-to-globe
   *  ratio consistent between mobile and desktop. */
  dotSize?: number;
}) {
  useEffect(() => {
    const tick = () => window.dispatchEvent(new Event('resize'));
    const a = requestAnimationFrame(tick);
    const b = setTimeout(tick, 100);
    return () => {
      cancelAnimationFrame(a);
      clearTimeout(b);
    };
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0.32, 3.1], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      <Scene
        sphereYOffset={sphereYOffset}
        sphereScale={sphereScale}
        cardsVisible={cardsVisible}
        cardSizePct={cardSizePct}
        dissolveProgress={dissolveProgress}
        preLockProgress={preLockProgress}
        dotSize={dotSize}
      />
      <OrbitControls
        /* Auto-rotation is driven manually in Scene's useFrame
         * so we can lerp it back to Dubai-centred as the user
         * scrolls toward lock. OrbitControls just provides the
         * camera + drag plumbing. */
        autoRotate={false}
        enableZoom={false}
        enablePan={false}
        enableRotate={cardsVisible}
        minPolarAngle={Math.PI / 2.4}
        maxPolarAngle={Math.PI / 1.7}
      />
    </Canvas>
  );
}

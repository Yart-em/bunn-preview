import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import DotSphere from './DotSphere';
import Arcs, { useArcs } from './Arcs';
import TravelingDots from './TravelingDots';
import { prewarmCoinCanvases } from './coinCanvases';
import DubaiMarker from './DubaiMarker';
import CountryCards from './CountryCards';
import { useGlobeDots } from './dots';
import { latLonToVec3 } from './geo';
import { DUBAI } from './constants';
import { ARCS_STAGE_AT, COINS_STAGE_AT, entryTime } from './entry';

/** Upper bound on how long the globe's first frame waits for
 *  ShaderWarmup (and a Stage for its own compile). A first-visit
 *  (cold shader cache) warm-up measured
 *  180–235 ms on an M4 Pro in both Chromium and WebKit, desktop and
 *  iPhone-sized. That time is spent in the browser's GPU process /
 *  driver shader compiler, so it grows on slower devices: 1.5 s
 *  leaves ~6× headroom for them while still bounding how late the
 *  globe can start if the warm-up never settles. Hitting the cap is
 *  never worse than having no warm-up at all (see below). */
const SHADER_WARMUP_TIMEOUT_MS = 1500;

/**
 * Compiles every material under `object` via renderer.compileAsync,
 * then calls `onReady`: with KHR_parallel_shader_compile the browser
 * links the programs off the main thread and three polls their
 * COMPLETION_STATUS instead of blocking on it. Without this the first
 * draw compiled + linked every program synchronously — on a first
 * visit (cold GPU shader cache) that froze the page for 200–300 ms
 * right as the dots began to gather. Returns a cancel function.
 */
function compileThen(
  gl: THREE.WebGLRenderer,
  object: THREE.Object3D,
  camera: THREE.Camera,
  scene: THREE.Scene,
  onReady: () => void,
): () => void {
  /* Without KHR_parallel_shader_compile there is no non-blocking
   * way to wait: compileAsync would only log a console warning and
   * hand over to a first draw that compiles synchronously anyway.
   * Go straight on there, exactly as before. */
  if (!gl.extensions.has('KHR_parallel_shader_compile')) {
    onReady();
    return () => {};
  }
  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    clearTimeout(safety);
    onReady();
  };
  /* compileAsync's promise has no timeout: it polls until every
   * program reports complete, so a driver that never reports would
   * keep the globe hidden for good. Past the cap it is shown
   * anyway — any program still compiling is then finished
   * synchronously by the first draw, exactly as it was before this
   * warm-up existed. */
  const safety = setTimeout(finish, SHADER_WARMUP_TIMEOUT_MS);
  /* Its own task, so the main-thread half of compile() (shader
   * source assembly + the GL calls) doesn't lengthen the task that
   * just committed the objects. */
  const kick = setTimeout(() => {
    try {
      gl.compileAsync(object, camera, scene).then(finish, finish);
    } catch {
      finish();
    }
  }, 0);
  return () => {
    settled = true;
    clearTimeout(safety);
    clearTimeout(kick);
  };
}

/**
 * Compiles the globe's first commit — the depth occluder and the dot
 * cloud — BEFORE its first frame (see compileThen). The arcs, pedestal
 * and coins aren't in that commit: their Stages add and compile them
 * later.
 *
 * Rendered as the LAST child of the scene group: passive effects run
 * after every sibling's objects are attached, so compileAsync sees
 * the whole scene.
 */
function ShaderWarmup({ onReady }: { onReady: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(
    () => compileThen(gl, scene, camera, scene, onReady),
    [gl, scene, camera, onReady],
  );

  return null;
}

/**
 * One staged piece of the scene (see entry.ts). Mounts its children
 * once the entry clock reaches `at` — a React commit of its own, in a
 * frame of its own — then keeps them hidden until their shaders have
 * compiled off the main thread, so neither the mount nor a shader
 * compile lands on the frames that animate them. Their fades run on
 * the shared entry clock, so they look exactly as if they had been
 * there from the first frame.
 */
function Stage({
  at,
  entryStart,
  children,
}: {
  at: number;
  entryStart: RefObject<number | null>;
  children: ReactNode;
}) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const groupRef = useRef<THREE.Group>(null);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  useFrame((state) => {
    if (!mounted && entryTime(entryStart, state.clock.elapsedTime) >= at) {
      setMounted(true);
    }
  });

  useEffect(() => {
    const group = groupRef.current;
    if (!mounted || !group) return;
    return compileThen(gl, group, camera, scene, () => setReady(true));
  }, [mounted, gl, scene, camera]);

  if (!mounted) return null;
  return (
    <group ref={groupRef} visible={ready}>
      {children}
    </group>
  );
}

function Scene({
  sphereYOffset,
  sphereScale,
  cardsVisible,
  cardSizePct,
  dissolveProgress,
  preLockProgress,
  dotSize,
  onShadersReady,
}: {
  sphereYOffset: number;
  sphereScale: number;
  cardsVisible: boolean;
  cardSizePct: number;
  dissolveProgress: number;
  preLockProgress: number;
  dotSize: number;
  onShadersReady: () => void;
}) {
  const dots = useGlobeDots();
  const arcs = useArcs(dots);
  /** The entry clock (see entry.ts) every animated piece below reads. */
  const entryStart = useRef<number | null>(null);
  /** Set once the scroll dissolve has taken the Dubai pedestal away
   *  — its later returns fade in on their own clock (DubaiMarker). */
  const pedestalRemoved = useRef(false);
  useEffect(() => {
    if (dissolveProgress > 0) pedestalRemoved.current = true;
  }, [dissolveProgress]);
  /* Draw the coins' texture canvases in idle time while the dots
   * gather, so the coins stage doesn't have to. */
  const hasDots = dots !== null;
  useEffect(() => {
    if (hasDots) return prewarmCoinCanvases();
  }, [hasDots]);

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
        entryStart={entryStart}
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
      <Stage at={ARCS_STAGE_AT} entryStart={entryStart}>
        <Arcs
          arcs={arcs}
          entryStart={entryStart}
          dissolveProgress={dissolveProgress}
        />
        {dissolveProgress <= 0 && (
          <DubaiMarker
            dest={dots.dest}
            entryStart={entryStart}
            returning={pedestalRemoved}
          />
        )}
      </Stage>
      <Stage at={COINS_STAGE_AT} entryStart={entryStart}>
        <TravelingDots
          arcs={arcs}
          entryStart={entryStart}
          dissolveProgress={dissolveProgress}
        />
      </Stage>
      {/* Keep LAST — see ShaderWarmup. */}
      <ShaderWarmup onReady={onShadersReady} />
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
  frameloop = 'always',
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
  /** R3F render loop mode. The landing passes 'never' once the hero
   *  canvas has scrolled fully off-screen so the GPU stops
   *  re-rendering an invisible scene. */
  frameloop?: 'always' | 'demand' | 'never';
}) {
  /* The render loop is held at 'never' until ShaderWarmup has
   * compiled the scene (the canvas is still empty then: Scene renders
   * nothing until the dot data is in). The entry choreography — dot
   * gather, then arcs, pedestal and coins — runs on the entry clock,
   * which starts on the first useFrame, and R3F restarts its clock
   * when the loop leaves 'never', so the sequence keeps its exact
   * timing and simply begins on the first frame that is actually
   * drawn. */
  const [shadersReady, setShadersReady] = useState(false);
  const onShadersReady = useCallback(() => setShadersReady(true), []);

  /* No synthetic window 'resize' at mount (there used to be one, at
   * the next frame and again 100 ms later): the Canvas sizes itself
   * from its own ResizeObserver — verified at desktop and phone sizes
   * in Chromium and WebKit — while the fake event re-ran every resize
   * listener on the page inside the globe's mount frame. */
  return (
    <Canvas
      camera={{ position: [0, 0.32, 3.1], fov: 45 }}
      /* 1.75 instead of 2: the canvas is 100 vw × 200 vh, so full
       * retina resolution costs ~30 % more GPU raster work for a
       * difference that isn't visible on a dot cloud. */
      dpr={[1, 1.75]}
      frameloop={shadersReady ? frameloop : 'never'}
      /* preserveDrawingBuffer forces the browser to COPY (not swap)
       * the full canvas every frame — nothing here reads the buffer
       * back, so keep the cheap swap path. */
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      onCreated={({ gl }) => {
        /* With checkShaderErrors on, three reads LINK_STATUS and the
         * program + both shader info logs the first time each program
         * is used — synchronous round-trips to the GPU process whose
         * only product is console diagnostics. Dev builds keep them. */
        gl.debug.checkShaderErrors = import.meta.env.DEV;
      }}
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
        onShadersReady={onShadersReady}
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

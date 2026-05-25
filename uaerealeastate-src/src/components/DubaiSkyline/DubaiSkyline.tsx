/**
 * DubaiSkyline — 3D dot-based Dubai skyline with rolling coins.
 *
 * Three rendering layers:
 *   1. Main dot cloud — all buildings + roads (renderOrder 0)
 *   2. Rolling coins on the road paths (renderOrder 1)
 *   3. Overlay buildings — two left foreground buildings that sit
 *      in front of the road, drawn last so they occlude coins.
 *
 * Coin style matches the Globe's TravelingDots (pink disc with
 * currency symbol + dark outline + striped edge).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/* ── Visual constants ─────────────────────────────────────── */
const COLOR_DOT = '#D7D7D7';
const COLOR_FLOW = '#FF9BAC';
const DOT_SPACING = 0.14;
const DOT_POINT_SIZE = 2.2;

const COIN_RADIUS = 0.18;
const COIN_THICKNESS = 0.08;
const COIN_Y = COIN_RADIUS + 0.02;   // centre-height above road
const CURRENCIES = ['$', '€', '£', '¥', '₹'];
const COINS_PER_ROAD = 3;
const COIN_SPEED = 0.04;             // phase / sec
const OUTLINE = '#272727';
const STROKE = 4;

/* ── Building definition ──────────────────────────────────── */
interface Building {
  x: number; z: number; w: number; d: number; h: number;
  yBase?: number; taper?: number;
}

/* ── All buildings ────────────────────────────────────────── */
const BUILDINGS: Building[] = [
  // BACKGROUND
  { x: -11.5, z: -2.8, w: 0.5, d: 0.5, h: 2.0 },
  { x: -10.8, z: -3.0, w: 0.4, d: 0.4, h: 1.6 },
  { x: -10.2, z: -2.6, w: 0.55, d: 0.5, h: 2.4 },
  { x: -9.6, z: -3.1, w: 0.4, d: 0.4, h: 1.8 },
  { x: -7.5, z: -2.5, w: 0.45, d: 0.45, h: 2.8 },
  { x: -6.8, z: -2.8, w: 0.5, d: 0.4, h: 2.2 },
  { x: -6.2, z: -2.4, w: 0.4, d: 0.45, h: 3.0 },
  { x: -5.5, z: -2.9, w: 0.45, d: 0.4, h: 2.0 },
  { x: -2.0, z: -2.6, w: 0.5, d: 0.4, h: 3.2 },
  { x: -1.2, z: -3.0, w: 0.4, d: 0.4, h: 2.5 },
  { x: 0.8, z: -2.8, w: 0.45, d: 0.45, h: 2.8 },
  { x: 1.8, z: -2.5, w: 0.5, d: 0.4, h: 3.0 },
  { x: 4.0, z: -2.7, w: 0.45, d: 0.4, h: 2.4 },
  { x: 5.0, z: -3.0, w: 0.4, d: 0.45, h: 2.0 },
  { x: 6.2, z: -2.5, w: 0.5, d: 0.4, h: 2.6 },
  { x: 7.5, z: -2.8, w: 0.4, d: 0.4, h: 1.8 },
  { x: 8.5, z: -2.6, w: 0.45, d: 0.45, h: 2.2 },
  // MAIN SKYLINE
  { x: -12.0, z: -0.5, w: 0.15, d: 0.15, h: 4.5 },
  { x: -12.0, z: -0.5, w: 1.2, d: 0.12, h: 0.15, yBase: 4.3 },
  { x: -11.2, z: -0.2, w: 0.6, d: 0.55, h: 3.0 },
  { x: -10.5, z: 0.1, w: 0.55, d: 0.5, h: 3.6 },
  { x: -10.0, z: -0.4, w: 0.5, d: 0.5, h: 2.8 },
  { x: -9.0, z: -0.2, w: 0.55, d: 0.55, h: 4.5 },
  { x: -8.4, z: 0.1, w: 0.5, d: 0.5, h: 5.2, taper: 0.08 },
  { x: -7.8, z: -0.3, w: 0.6, d: 0.55, h: 5.8, taper: 0.1 },
  { x: -7.2, z: 0.2, w: 0.5, d: 0.5, h: 6.5, taper: 0.12 },
  { x: -6.6, z: -0.1, w: 0.55, d: 0.55, h: 5.0 },
  { x: -6.0, z: 0.3, w: 0.5, d: 0.5, h: 4.2 },
  { x: -5.2, z: 0, w: 0.55, d: 0.55, h: 7.2, taper: 0.15 },
  { x: -4.5, z: 0.2, w: 0.5, d: 0.5, h: 8.0, taper: 0.18 },
  { x: -3.8, z: -0.2, w: 0.6, d: 0.55, h: 6.0, taper: 0.08 },
  { x: -3.2, z: 0.1, w: 0.55, d: 0.5, h: 5.5 },
  { x: -2.6, z: -0.1, w: 0.5, d: 0.55, h: 7.0, taper: 0.1 },
  // Burj Khalifa
  { x: 0, z: 0, w: 1.0, d: 1.0, h: 3.5 },
  { x: 0, z: 0, w: 0.75, d: 0.75, h: 4.0, yBase: 3.5 },
  { x: 0, z: 0, w: 0.5, d: 0.5, h: 4.0, yBase: 7.5 },
  { x: 0, z: 0, w: 0.25, d: 0.25, h: 3.5, yBase: 11.5 },
  { x: 0, z: 0, w: 0.1, d: 0.1, h: 3.0, yBase: 15.0 },
  // Right of Burj
  { x: 1.5, z: 0.2, w: 0.55, d: 0.55, h: 6.5, taper: 0.1 },
  { x: 2.2, z: -0.1, w: 0.6, d: 0.55, h: 5.5 },
  { x: 2.8, z: 0.3, w: 0.5, d: 0.5, h: 7.0, taper: 0.12 },
  { x: 3.5, z: -0.2, w: 0.55, d: 0.55, h: 5.0 },
  { x: 4.0, z: 0.1, w: 0.6, d: 0.6, h: 4.5 },
  { x: 5.0, z: 0, w: 0.55, d: 0.55, h: 5.8, taper: 0.08 },
  { x: 5.6, z: -0.3, w: 0.5, d: 0.5, h: 6.2, taper: 0.1 },
  { x: 6.2, z: 0.2, w: 0.6, d: 0.55, h: 5.0 },
  { x: 6.8, z: -0.1, w: 0.5, d: 0.5, h: 4.5 },
  { x: 7.4, z: 0.3, w: 0.55, d: 0.55, h: 5.5, taper: 0.06 },
  { x: 8.2, z: 0, w: 0.55, d: 0.55, h: 4.8 },
  { x: 8.8, z: -0.2, w: 0.5, d: 0.5, h: 4.0 },
  { x: 9.4, z: 0.1, w: 0.45, d: 0.45, h: 3.5 },
  { x: 10.0, z: -0.1, w: 0.5, d: 0.5, h: 4.2 },
  { x: 10.6, z: 0.2, w: 0.4, d: 0.45, h: 3.0 },
  { x: 11.2, z: -0.15, w: 0.45, d: 0.45, h: 3.8 },
  // FOREGROUND (non-overlay)
  { x: -7.5, z: 1.8, w: 0.8, d: 0.8, h: 1.8 },
  { x: -6.5, z: 2.8, w: 1.0, d: 0.6, h: 1.5 },
  { x: -5.5, z: 2.2, w: 0.7, d: 0.7, h: 2.8 },
  { x: -3.5, z: 2.0, w: 0.8, d: 0.7, h: 3.0 },
  { x: -2.5, z: 2.5, w: 0.9, d: 0.8, h: 2.2 },
  { x: -1.5, z: 1.8, w: 0.7, d: 0.7, h: 3.5 },
  { x: -0.5, z: 2.8, w: 1.0, d: 0.6, h: 2.0 },
  { x: 0.8, z: 2.2, w: 0.8, d: 0.8, h: 2.5 },
  { x: 2.0, z: 2.6, w: 0.7, d: 0.7, h: 1.8 },
  { x: 3.5, z: 2.0, w: 0.9, d: 0.7, h: 2.5 },
  { x: 4.5, z: 2.8, w: 0.8, d: 0.6, h: 1.5 },
  { x: 5.5, z: 2.2, w: 0.7, d: 0.7, h: 2.8 },
  { x: 6.5, z: 2.5, w: 1.0, d: 0.8, h: 2.0 },
  { x: 7.5, z: 1.8, w: 0.8, d: 0.7, h: 2.2 },
  { x: 8.5, z: 2.6, w: 0.9, d: 0.6, h: 1.8 },
  // Very close foreground (non-overlay)
  { x: -2.0, z: 4.2, w: 1.1, d: 0.5, h: 0.8 },
  { x: 1.0, z: 3.8, w: 0.9, d: 0.5, h: 1.0 },
  { x: 4.0, z: 4.0, w: 1.2, d: 0.6, h: 1.1 },
  { x: 7.0, z: 3.8, w: 1.0, d: 0.5, h: 0.9 },
];

/* Two closest left foreground buildings — rendered as overlay */
const OVERLAY_BUILDINGS: Building[] = [
  { x: -10.0, z: 2.0, w: 1.0, d: 0.8, h: 2.0 },
  { x: -8.5, z: 2.5, w: 0.9, d: 0.7, h: 2.5 },
  { x: -8.0, z: 4.0, w: 1.2, d: 0.5, h: 1.0 },
  { x: -5.0, z: 3.8, w: 1.0, d: 0.6, h: 1.2 },
];

/* ── Road curves (THREE.CatmullRomCurve3) ─────────────────── */
function makeRoadCurves(): THREE.CatmullRomCurve3[] {
  const curves: THREE.CatmullRomCurve3[] = [];

  // Main highway — S-curve across the foreground
  const mainPts: THREE.Vector3[] = [];
  for (let t = 0; t <= 1; t += 0.05) {
    const x = -13 + t * 26;
    const z = 4.5 + Math.sin(t * Math.PI * 1.5) * 1.2;
    mainPts.push(new THREE.Vector3(x, COIN_Y, z));
  }
  curves.push(new THREE.CatmullRomCurve3(mainPts, false, 'catmullrom', 0.5));

  // Secondary diagonal road
  const secPts: THREE.Vector3[] = [];
  for (let t = 0; t <= 1; t += 0.05) {
    const x = 3 + t * 10;
    const z = 5.5 - t * 2.5;
    secPts.push(new THREE.Vector3(x, COIN_Y, z));
  }
  curves.push(new THREE.CatmullRomCurve3(secPts, false, 'catmullrom', 0.5));

  // Cross road
  const crossPts: THREE.Vector3[] = [];
  for (let t = 0; t <= 1; t += 0.05) {
    const x = -4 + t * 8;
    const z = 3.0 + t * 1.5;
    crossPts.push(new THREE.Vector3(x, COIN_Y, z));
  }
  curves.push(new THREE.CatmullRomCurve3(crossPts, false, 'catmullrom', 0.5));

  return curves;
}

/* ── Dot generation helpers ───────────────────────────────── */
function buildingDots(list: Building[]): Float32Array {
  const pts: number[] = [];
  list.forEach((b) => {
    const yBase = b.yBase ?? 0;
    const halfW = b.w / 2, halfD = b.d / 2, taper = b.taper ?? 0;
    for (let y = yBase; y <= yBase + b.h; y += DOT_SPACING) {
      const t = (y - yBase) / b.h;
      const sc = 1 - taper * t;
      const cW = halfW * sc, cD = halfD * sc;
      for (let lx = -cW; lx <= cW; lx += DOT_SPACING) {
        for (let lz = -cD; lz <= cD; lz += DOT_SPACING) {
          const onX = Math.abs(Math.abs(lx) - cW) < DOT_SPACING * 0.55;
          const onZ = Math.abs(Math.abs(lz) - cD) < DOT_SPACING * 0.55;
          const onBot = Math.abs(y - yBase) < DOT_SPACING * 0.55;
          const onTop = Math.abs(y - (yBase + b.h)) < DOT_SPACING * 0.55;
          if (onX || onZ || onBot || onTop) pts.push(b.x + lx, y, b.z + lz);
        }
      }
    }
  });
  return new Float32Array(pts);
}

function roadDots(): Float32Array {
  const pts: number[] = [];
  // Main highway
  for (let t = 0; t <= 1; t += 0.003) {
    const x = -13 + t * 26;
    const z = 4.5 + Math.sin(t * Math.PI * 1.5) * 1.2;
    for (let lane = -0.3; lane <= 0.3; lane += 0.15) pts.push(x, 0.01, z + lane);
  }
  // Secondary diagonal
  for (let t = 0; t <= 1; t += 0.004) {
    const x = 3 + t * 10, z = 5.5 - t * 2.5;
    for (let lane = -0.2; lane <= 0.2; lane += 0.15) pts.push(x + lane * 0.5, 0.01, z + lane);
  }
  // Cross road
  for (let t = 0; t <= 1; t += 0.004) {
    const x = -4 + t * 8, z = 3.0 + t * 1.5;
    for (let lane = -0.15; lane <= 0.15; lane += 0.15) pts.push(x, 0.01, z + lane);
  }
  return new Float32Array(pts);
}

/* ── Dot texture ──────────────────────────────────────────── */
function makeDotTexture(): THREE.CanvasTexture {
  const sz = 64, c = document.createElement('canvas');
  c.width = sz; c.height = sz;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, sz, sz);
  ctx.beginPath();
  ctx.arc(sz / 2, sz / 2, sz / 2 - 2, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

/* ── Coin textures (matching Globe TravelingDots) ─────────── */
function drawGlyph(ctx: CanvasRenderingContext2D, g: string, cx: number, cy: number, sz: number) {
  ctx.font = `900 ${Math.round(sz * 0.55)}px "Helvetica Neue",Helvetica,Arial,sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = COLOR_FLOW; ctx.fillText(g, cx, cy);
  ctx.lineWidth = STROKE; ctx.strokeStyle = OUTLINE; ctx.strokeText(g, cx, cy);
}
function makeCoinFace(glyph: string): THREE.CanvasTexture {
  const sz = 256, c = document.createElement('canvas');
  c.width = sz; c.height = sz;
  const ctx = c.getContext('2d')!, r = sz / 2;
  ctx.fillStyle = COLOR_FLOW;
  ctx.beginPath(); ctx.arc(r, r, r - STROKE / 2, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = STROKE; ctx.strokeStyle = OUTLINE;
  ctx.beginPath(); ctx.arc(r, r, r - STROKE / 2, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(r, r, r * 0.78, 0, Math.PI * 2); ctx.stroke();
  drawGlyph(ctx, glyph, r, r + sz * 0.03, sz);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true;
  return t;
}
function makeCoinSide(): THREE.CanvasTexture {
  const w = 1024, h = 64, c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = COLOR_FLOW; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = OUTLINE;
  for (let i = 0; i < 36; i++) ctx.fillRect((i / 36) * w, 0, STROKE, h);
  ctx.fillRect(0, 0, w, STROKE); ctx.fillRect(0, h - STROKE, w, STROKE);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.needsUpdate = true;
  return t;
}

/* ── Points component (used for buildings + roads) ────────── */
function DotCloud({ positions, order = 0 }: { positions: Float32Array; order?: number }) {
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const texture = useMemo(() => makeDotTexture(), []);

  useEffect(() => {
    if (!geomRef.current) return;
    geomRef.current.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geomRef.current.computeBoundingSphere();
  }, [positions]);

  return (
    <points renderOrder={order}>
      <bufferGeometry ref={geomRef} />
      <pointsMaterial
        color={COLOR_DOT} size={DOT_POINT_SIZE} sizeAttenuation
        map={texture} alphaTest={0.5} transparent toneMapped={false}
        depthWrite={order === 0}
      />
    </points>
  );
}

/* ── Rolling coins ────────────────────────────────────────── */
type CoinDef = { roadIdx: number; phase: number; speed: number; currency: number };

function RollingCoins({ roads }: { roads: THREE.CatmullRomCurve3[] }) {
  const [tex, setTex] = useState<{ faces: THREE.Texture[]; side: THREE.Texture } | null>(null);
  useEffect(() => {
    setTex({ faces: CURRENCIES.map(makeCoinFace), side: makeCoinSide() });
  }, []);

  const coins = useMemo<CoinDef[]>(() => {
    const out: CoinDef[] = [];
    let ci = 0;
    roads.forEach((_, ri) => {
      for (let i = 0; i < COINS_PER_ROAD; i++) {
        out.push({
          roadIdx: ri,
          phase: i / COINS_PER_ROAD + Math.random() * 0.1,
          speed: COIN_SPEED + Math.random() * 0.02,
          currency: ci++ % CURRENCIES.length,
        });
      }
    });
    return out;
  }, [roads]);

  const lengths = useMemo(() => roads.map(r => r.getLength()), [roads]);

  const materials = useMemo(() => {
    if (!tex) return [];
    return coins.map(c => {
      const face = tex.faces[c.currency];
      const common = { transparent: true, opacity: 1, depthWrite: false, toneMapped: false };
      return [
        new THREE.MeshBasicMaterial({ ...common, map: tex.side }),
        new THREE.MeshBasicMaterial({ ...common, map: face }),
        new THREE.MeshBasicMaterial({ ...common, map: face }),
      ] as THREE.Material[];
    });
  }, [tex, coins]);

  const refs = useRef<(THREE.Group | null)[]>([]);
  const tmpPt = useMemo(() => new THREE.Vector3(), []);
  const tmpTan = useMemo(() => new THREE.Vector3(), []);
  const tmpQ = useMemo(() => new THREE.Quaternion(), []);
  const yAxis = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame((_, delta) => {
    coins.forEach((c, i) => {
      c.phase = (c.phase + delta * c.speed) % 1;
      const g = refs.current[i];
      if (!g) return;

      const road = roads[c.roadIdx];
      road.getPointAt(c.phase, tmpPt);
      road.getTangentAt(c.phase, tmpTan).normalize();

      g.position.copy(tmpPt);

      // Coin orientation: upright, facing tangent direction
      const angle = Math.atan2(tmpTan.x, tmpTan.z);
      tmpQ.setFromAxisAngle(yAxis, angle);

      // Roll: rotate around the local Z (forward) axis
      const dist = lengths[c.roadIdx] * c.phase;
      const roll = dist / COIN_RADIUS;
      const rollQ = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 0, 1), roll
      );
      tmpQ.multiply(rollQ);
      g.quaternion.copy(tmpQ);
    });
  });

  if (!tex) return null;

  return (
    <>
      {coins.map((_, i) => (
        <group key={i} ref={g => { refs.current[i] = g; }} renderOrder={1}>
          <mesh material={materials[i]} renderOrder={1}>
            <cylinderGeometry args={[COIN_RADIUS, COIN_RADIUS, COIN_THICKNESS, 48, 1, false]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/* ── Parallax camera ──────────────────────────────────────── */
function ParallaxCamera({ scrollProgress }: { scrollProgress: number }) {
  const { camera } = useThree();
  const basePos = useRef(new THREE.Vector3(0, 8, 22));

  useFrame(() => {
    const xShift = (scrollProgress - 0.5) * 2 * 0.15 * basePos.current.z;
    const yShift = (scrollProgress - 0.5) * 1.0;
    camera.position.set(basePos.current.x + xShift, basePos.current.y + yShift, basePos.current.z);
    camera.lookAt(0, 4, 0);
  });
  return null;
}

/* ── Main component ───────────────────────────────────────── */
export default function DubaiSkyline({
  scrollProgress = 0.5,
  className = '',
}: {
  scrollProgress?: number;
  className?: string;
}) {
  const mainDots = useMemo(() => {
    const bDots = buildingDots(BUILDINGS);
    const rDots = roadDots();
    const combined = new Float32Array(bDots.length + rDots.length);
    combined.set(bDots, 0);
    combined.set(rDots, bDots.length);
    return combined;
  }, []);

  const overlayDots = useMemo(() => buildingDots(OVERLAY_BUILDINGS), []);
  const roads = useMemo(() => makeRoadCurves(), []);

  return (
    <div className={`dubai-skyline ${className}`} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 8, 22], fov: 35 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
        frameloop="always"
      >
        <ParallaxCamera scrollProgress={scrollProgress} />
        {/* Layer 1: main buildings + roads */}
        <DotCloud positions={mainDots} order={0} />
        {/* Layer 2: rolling coins on road paths */}
        <RollingCoins roads={roads} />
        {/* Layer 3: overlay buildings (draw last, occlude coins) */}
        <DotCloud positions={overlayDots} order={2} />
      </Canvas>
    </div>
  );
}

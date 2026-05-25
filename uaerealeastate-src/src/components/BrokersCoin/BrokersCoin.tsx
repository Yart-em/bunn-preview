/**
 * BrokersCoin — exact replica of the TravelingDots 3D coin
 * rendered in its own small R3F Canvas, slowly spinning.
 *
 * Geometry: CylinderGeometry  (same radius, thickness, segments)
 * Textures: Canvas-generated face + side textures using the same
 *           drawing routines as TravelingDots.tsx.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ── Constants matching TravelingDots exactly ─────────────── */
const COLOR_FLOW = '#FF9BAC';
const OUTLINE = '#000000';
const STROKE = 2;                // thinner outlines
const COIN_RADIUS = 0.55;        // scaled up 18× from globe's 0.030
const COIN_THICKNESS = 0.27;     // scaled up 18× from globe's 0.015
const STRIPES_AROUND = 36;

/* ── Dirham currency symbol (SVG path) ───────────────────── */
const DIRHAM_PATH = 'M342.14,140.96l2.7,2.54v-7.72c0-17-11.92-30.84-26.56-30.84h-23.41C278.49,36.7,222.69,0,139.68,0c-52.86,0-59.65,0-109.71,0,0,0,15.03,12.63,15.03,52.4v52.58h-27.68c-5.38,0-10.43-2.08-14.61-6.01l-2.7-2.54v7.72c0,17.01,11.92,30.84,26.56,30.84h18.44s0,29.99,0,29.99h-27.68c-5.38,0-10.43-2.07-14.61-6.01l-2.7-2.54v7.71c0,17,11.92,30.82,26.56,30.82h18.44s0,54.89,0,54.89c0,38.65-15.03,50.06-15.03,50.06h109.71c85.62,0,139.64-36.96,155.38-104.98h32.46c5.38,0,10.43,2.07,14.61,6l2.7,2.54v-7.71c0-17-11.92-30.83-26.56-30.83h-18.9c.32-4.88.49-9.87.49-15s-.18-10.11-.51-14.99h28.17c5.37,0,10.43,2.07,14.61,6.01ZM89.96,15.01h45.86c61.7,0,97.44,27.33,108.1,89.94l-153.96.02V15.01ZM136.21,284.93h-46.26v-89.98l153.87-.02c-9.97,56.66-42.07,88.38-107.61,90ZM247.34,149.96c0,5.13-.11,10.13-.34,14.99l-157.04.02v-29.99l157.05-.02c.22,4.84.33,9.83.33,15Z';
const DIRHAM_VB_W = 344.84;
const DIRHAM_VB_H = 299.91;

/* ── Texture factories ───────────────────────────────────── */
function drawDirhamGlyph(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
) {
  const glyphSize = size * 0.48;
  const scale = glyphSize / Math.max(DIRHAM_VB_W, DIRHAM_VB_H);
  const drawW = DIRHAM_VB_W * scale;
  const drawH = DIRHAM_VB_H * scale;

  ctx.save();
  ctx.translate(cx - drawW / 2, cy - drawH / 2);
  ctx.scale(scale, scale);

  const p = new Path2D(DIRHAM_PATH);
  // Outline only — no fill, just stroke
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 6;              // ≈ 2 canvas-px after scale
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke(p);
  ctx.restore();
}

function makeFaceTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const r = size / 2;

  // Pink disc body
  ctx.fillStyle = COLOR_FLOW;
  ctx.beginPath();
  ctx.arc(r, r, r - STROKE / 2, 0, Math.PI * 2);
  ctx.fill();

  // Outer rim outline
  ctx.lineWidth = STROKE;
  ctx.strokeStyle = OUTLINE;
  ctx.beginPath();
  ctx.arc(r, r, r - STROKE / 2, 0, Math.PI * 2);
  ctx.stroke();

  // Inner ring outline (78% radius)
  ctx.beginPath();
  ctx.arc(r, r, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();

  // Dirham currency symbol (SVG path)
  drawDirhamGlyph(ctx, r, r + size * 0.03, size);

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

/* ── Spinning coin mesh ───────────────────────────────────── */
function SpinningCoin({ hovered }: { hovered: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [textures, setTextures] = useState<{
    face: THREE.Texture;
    side: THREE.Texture;
  } | null>(null);

  useEffect(() => {
    setTextures({
      face: makeFaceTexture(),
      side: makeSideTexture(),
    });
  }, []);

  const materials = useMemo(() => {
    if (!textures) return undefined;
    const common = { toneMapped: false };
    return [
      new THREE.MeshBasicMaterial({ ...common, map: textures.side }),
      new THREE.MeshBasicMaterial({ ...common, map: textures.face }),
      new THREE.MeshBasicMaterial({ ...common, map: textures.face }),
    ];
  }, [textures]);

  /* Tilt the coin so the edge is prominently visible.
   * X-rotation ~0.7 rad ≈ 40° shows a clear coin edge
   * while the face disc is still readable at an angle. */
  const targetTiltX = hovered ? 0.7 + 0.25 : 0.7; // flop toward face on hover
  const tiltX = useRef(0.7);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    // Smooth lerp toward target tilt
    tiltX.current += (targetTiltX - tiltX.current) * Math.min(1, delta * 6);
    meshRef.current.rotation.x = tiltX.current;
    meshRef.current.rotation.y += delta * 0.8;
    meshRef.current.rotation.z = 0.15;
  });

  if (!materials) return null;

  return (
    <mesh
      ref={meshRef}
      material={materials}
      rotation={[0.7, 0, 0.15]}   // edge-forward tilt
    >
      <cylinderGeometry args={[COIN_RADIUS, COIN_RADIUS, COIN_THICKNESS, 48, 1, false]} />
    </mesh>
  );
}

/* ── Wrapper with R3F Canvas ──────────────────────────────── */
export default function BrokersCoin({ className = '' }: { className?: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`brokers-coin ${className}`}
      aria-hidden="true"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 2.2], fov: 40 }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
        dpr={[1, 2]}
      >
        <SpinningCoin hovered={hovered} />
      </Canvas>
    </div>
  );
}

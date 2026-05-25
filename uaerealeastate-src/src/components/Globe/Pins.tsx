import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { latLonToVec3 } from './geo';
import { snapToNearestLandDot } from './dots';
import {
  COLOR_DEST,
  COLOR_FLOW,
  DUBAI,
  GLOBE_RADIUS,
  SOURCES,
} from './constants';
import { ARCS_END, PINS_END, fadeAt } from './entry';

/**
 * Builds a soft round halo sprite — pink center fading to transparent.
 * Used for the glow halos around every pin.
 */
function makeHaloTexture(hex: string) {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const r = size / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  const col = new THREE.Color(hex);
  const rgb = `${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)}`;
  g.addColorStop(0, `rgba(${rgb},0.95)`);
  g.addColorStop(0.25, `rgba(${rgb},0.55)`);
  g.addColorStop(0.55, `rgba(${rgb},0.18)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

type PinProps = {
  position: THREE.Vector3;
  color: string;
  haloTexture: THREE.Texture;
  coreSize?: number;
  haloSize?: number;
  pulse?: boolean;
};

function Pin({
  position,
  color,
  haloTexture,
  coreSize = 0.014,
  haloSize = 0.075,
  pulse = false,
}: PinProps) {
  const haloRef = useRef<THREE.Sprite>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const startRef = useRef<number | null>(null);

  useFrame((state) => {
    if (startRef.current === null) startRef.current = state.clock.elapsedTime;
    const tEntry = state.clock.elapsedTime - startRef.current;
    const fade = fadeAt(tEntry, ARCS_END, PINS_END);

    // Pulse for the destination pin (running on globe time, not entry time).
    const pulseFactor = pulse
      ? 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 2.4)
      : 0;

    if (haloRef.current) {
      const s = haloSize * (1 + (pulse ? 0.18 * pulseFactor : 0));
      haloRef.current.scale.set(s, s, 1);
      const mat = haloRef.current.material as THREE.SpriteMaterial;
      const baseOpacity = pulse ? 0.9 - 0.25 * pulseFactor : 0.9;
      mat.opacity = fade * baseOpacity;
    }
    if (coreRef.current) {
      const cmat = coreRef.current.material as THREE.MeshBasicMaterial;
      cmat.transparent = true;
      cmat.opacity = fade;
    }
  });

  return (
    <group position={position}>
      {/* Halo — billboarded sprite */}
      <sprite ref={haloRef} scale={[haloSize, haloSize, 1]}>
        <spriteMaterial
          map={haloTexture}
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
        />
      </sprite>
      {/* Solid core dot */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[coreSize, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function OriginPins({ landVectors }: { landVectors: THREE.Vector3[] }) {
  const halo = useMemo(() => makeHaloTexture(COLOR_FLOW), []);
  const positions = useMemo(
    () =>
      SOURCES.map((s) => {
        const target = latLonToVec3(s.lat, s.lon, GLOBE_RADIUS);
        const snapped = snapToNearestLandDot(target, landVectors);
        // Lift slightly off the surface so the pin doesn't z-fight with dots.
        return snapped.multiplyScalar(1.005);
      }),
    [landVectors],
  );
  return (
    <group>
      {positions.map((p, i) => (
        <Pin
          key={i}
          position={p}
          color={COLOR_FLOW}
          haloTexture={halo}
          coreSize={0.011}
          haloSize={0.055}
        />
      ))}
    </group>
  );
}

export function DubaiPin({ landVectors }: { landVectors: THREE.Vector3[] }) {
  const halo = useMemo(() => makeHaloTexture(COLOR_DEST), []);
  const position = useMemo(() => {
    const target = latLonToVec3(DUBAI[0], DUBAI[1], GLOBE_RADIUS);
    const snapped = snapToNearestLandDot(target, landVectors);
    return snapped.multiplyScalar(1.005);
  }, [landVectors]);
  return (
    <Pin
      position={position}
      color={COLOR_DEST}
      haloTexture={halo}
      coreSize={0.018}
      haloSize={0.12}
      pulse
    />
  );
}

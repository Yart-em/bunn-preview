import { useEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { COLOR_ARC, COLOR_ARC_BOTTOM, COLOR_ARC_SIDE } from './constants';
import { ARCS_END, PINS_END, entryTime, fadeAt } from './entry';

/** 20% bigger diameter than the rolling coins (coin radius 0.030 →
 *  pedestal radius 0.030 × 1.2 = 0.036). */
const DOT_RADIUS = 0.036;
/** Pillar height — matches the bigger coin radius so arcs land on
 *  its lower side wall while the top stays well above the arc
 *  bodies, leaving room for coins to stack on top. */
const DOT_HEIGHT = 0.030;

/**
 * 3D destination marker at Dubai — a small flat disc with the same
 * three-tone shading as the arcs (top lightest, sides medium,
 * underside darkest) and a #272727 outline. Fades in at the same
 * time the pins do.
 */
export default function DubaiMarker({
  dest,
  entryStart,
  returning,
}: {
  /** Dubai, snapped to its nearest land dot. */
  dest: THREE.Vector3;
  /** The globe's entry clock (see entry.ts). */
  entryStart: RefObject<number | null>;
  /** True once the scroll dissolve has unmounted the pedestal. */
  returning: RefObject<boolean>;
}) {
  const yAxis = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  /** Position + orientation, computed once from the snapped
   *  Dubai land dot. */
  const placement = useMemo(() => {
    const snapped = dest.clone();
    const radial = snapped.clone().normalize();
    // Pedestal base sits on the earth surface (= radius 1.0, where
    // every arc terminates) so the arcs visually CONNECT to the
    // pedestal's side. Its full height (DOT_HEIGHT) extends upward
    // from there, with the bottom partially tucked inside the depth
    // occluder for a "pillar planted in the ground" look.
    const position = snapped.clone().addScaledVector(radial, DOT_HEIGHT / 2);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(yAxis, radial);
    return { position, quaternion };
  }, [dest, yAxis]);

  const cylinderGeometry = useMemo(
    () => new THREE.CylinderGeometry(DOT_RADIUS, DOT_RADIUS, DOT_HEIGHT, 48, 1, false),
    [],
  );

  useEffect(
    () => () => {
      cylinderGeometry.dispose();
    },
    [cylinderGeometry],
  );

  const groupRef = useRef<THREE.Group>(null);
  const startRef = useRef<number | null>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const now = state.clock.elapsedTime;
    /* The first time, the pedestal mounts with the arcs stage, after
     * the entry has begun: its fade runs on the shared entry clock.
     * Each time it comes back after the dissolve took it away, it
     * fades in again measured from its return, as it always has. */
    if (startRef.current === null) {
      startRef.current = returning.current ? now : now - entryTime(entryStart, now);
    }
    const t = now - startRef.current;
    const k = fadeAt(t, ARCS_END, PINS_END);
    groupRef.current.children.forEach((child) => {
      const mat = (child as THREE.Mesh).material as
        | THREE.Material
        | THREE.Material[]
        | undefined;
      if (!mat) return;
      const apply = (m: THREE.Material) => {
        m.transparent = true;
        m.opacity = k;
      };
      Array.isArray(mat) ? mat.forEach(apply) : apply(mat);
    });
  });

  return (
    <group
      ref={groupRef}
      position={placement.position}
      quaternion={placement.quaternion}
    >
      {/* Pedestal BODY paints below the coins (renderOrder 2 vs
          coin's 3) so the coin stack sits on top. No outline —
          the three-tone shading alone defines the silhouette. */}
      <mesh geometry={cylinderGeometry} renderOrder={2}>
        <meshBasicMaterial
          attach="material-0"
          color={COLOR_ARC_SIDE}
          transparent
          opacity={0}
          toneMapped={false}
        />
        <meshBasicMaterial
          attach="material-1"
          color={COLOR_ARC}
          transparent
          opacity={0}
          toneMapped={false}
        />
        <meshBasicMaterial
          attach="material-2"
          color={COLOR_ARC_BOTTOM}
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

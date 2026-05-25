import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  COLOR_ARC,
  COLOR_ARC_BOTTOM,
  COLOR_ARC_SIDE,
  DUBAI,
  GLOBE_RADIUS,
} from './constants';
import { latLonToVec3 } from './geo';
import { snapToNearestLandDot } from './dots';
import { ARCS_END, PINS_END, fadeAt } from './entry';

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
  landVectors,
}: {
  landVectors: THREE.Vector3[];
}) {
  const yAxis = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  /** Position + orientation, computed once from the snapped
   *  Dubai land dot. */
  const placement = useMemo(() => {
    const target = latLonToVec3(DUBAI[0], DUBAI[1], GLOBE_RADIUS);
    const snapped = snapToNearestLandDot(target, landVectors);
    const radial = snapped.clone().normalize();
    // Pedestal base sits on the earth surface (= radius 1.0, where
    // every arc terminates) so the arcs visually CONNECT to the
    // pedestal's side. Its full height (DOT_HEIGHT) extends upward
    // from there, with the bottom partially tucked inside the depth
    // occluder for a "pillar planted in the ground" look.
    const position = snapped.clone().addScaledVector(radial, DOT_HEIGHT / 2);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(yAxis, radial);
    return { position, quaternion };
  }, [landVectors, yAxis]);

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
    if (startRef.current === null) startRef.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - startRef.current;
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

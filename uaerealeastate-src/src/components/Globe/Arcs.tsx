import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { latLonToVec3, arcCurve } from './geo';
import { snapToNearestLandDot } from './dots';
import {
  COLOR_ARC,
  DUBAI,
  GLOBE_RADIUS,
  SOURCES,
} from './constants';
import { ARCS_END, GATHER_END, fadeAt } from './entry';

export type Arc = {
  curve: THREE.QuadraticBezierCurve3;
  points: THREE.Vector3[];
  start: THREE.Vector3;
  end: THREE.Vector3;
  /** Unit normal of the plane that contains start, end and the
   *  control point. Constant for the whole arc — used as the rolling
   *  axle for traveling coins. */
  planeNormal: THREE.Vector3;
};

export function useArcs(landVectors: THREE.Vector3[] | null): Arc[] {
  return useMemo(() => {
    if (!landVectors || landVectors.length === 0) return [];

    const dest = snapToNearestLandDot(
      latLonToVec3(DUBAI[0], DUBAI[1], GLOBE_RADIUS),
      landVectors,
    );

    return SOURCES.map(({ lat, lon }) => {
      const start = snapToNearestLandDot(
        latLonToVec3(lat, lon, GLOBE_RADIUS),
        landVectors,
      );
      const curve = arcCurve(start, dest, GLOBE_RADIUS);
      const points = curve.getPoints(64);
      const planeNormal = new THREE.Vector3()
        .subVectors(curve.v1, start)
        .cross(new THREE.Vector3().subVectors(dest, start))
        .normalize();
      return { curve, points, start, end: dest, planeNormal };
    });
  }, [landVectors]);
}

const FULL_OPACITY = 1;

/** Number of samples per arc when packing into a LineGeometry — high
 *  enough that the curve reads as smooth at any zoom level. */
const ARC_SAMPLES = 192;
/** Width of the arc line in CSS pixels (LineMaterial worldUnits=false). */
const ARC_PX = 2;

/** Coins still sit on the arc curve like it's a surface, but with no
 *  3D ribbon body anymore there's no extruded height to clear — kept
 *  exported as 0 so TravelingDots can keep its lift formula
 *  `RIBBON_HEIGHT + COIN_RADIUS * depthMul` working unchanged. */
export const RIBBON_HEIGHT = 0;

export default function Arcs({
  arcs,
  dissolveProgress = 0,
}: {
  arcs: Arc[];
  /** Once dissolveProgress > 0, the arcs fade out over a very
   *  short scroll range (≈10 px of scroll = 0.011 of progress)
   *  so the lines vanish quickly but not as a hard binary
   *  cut. */
  dissolveProgress?: number;
}) {
  const { size } = useThree();
  const startRef = useRef<number | null>(null);

  /** One Line2 per arc. Each line owns its own LineMaterial so the
   *  fade-in opacity ramps independently from any other LineMaterial
   *  instance in the scene. */
  const lines = useMemo(() => {
    /* Thinner arcs on phones (canvas = 100vw, so size.width tracks the
     * viewport). 1px reads cleaner on the small mobile globe. */
    const arcPx = size.width <= 600 ? 1 : ARC_PX;
    return arcs.map((arc) => {
      const pts = arc.curve.getPoints(ARC_SAMPLES);
      const positions = new Float32Array(pts.length * 3);
      pts.forEach((p, i) => {
        positions[i * 3 + 0] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
      });
      const geometry = new LineGeometry();
      geometry.setPositions(positions);
      const material = new LineMaterial({
        color: new THREE.Color(COLOR_ARC).getHex(),
        linewidth: arcPx, // pixels (worldUnits=false)
        worldUnits: false,
        transparent: true,
        opacity: 0,
        depthTest: true,
        depthWrite: false,
        toneMapped: false,
        resolution: new THREE.Vector2(size.width, size.height),
      });
      const line = new Line2(geometry, material);
      // renderOrder=1 keeps coins (renderOrder=2) painting on top
      // near Dubai, same as the previous ribbon body.
      line.renderOrder = 1;
      return line;
    });
  }, [arcs, size.width, size.height]);

  // Keep each line's resolution uniform synced with the canvas pixel
  // size — required for stable line widths in CSS pixels.
  useEffect(() => {
    lines.forEach((l) => {
      (l.material as LineMaterial).resolution.set(size.width, size.height);
    });
  }, [lines, size.width, size.height]);

  // Cleanup on unmount / arcs change.
  useEffect(() => {
    return () => {
      lines.forEach((l) => {
        l.geometry.dispose();
        (l.material as LineMaterial).dispose();
      });
    };
  }, [lines]);

  useFrame((state) => {
    if (startRef.current === null) startRef.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - startRef.current;
    const k = fadeAt(t, GATHER_END, ARCS_END) * FULL_OPACITY;
    /* Dissolve fade: arcs hold on for the first ~50 px of
     * scroll inside the dissolve span (so cards + coins fly
     * first), THEN vanish over the next ~10 px. Both numbers
     * are fractions of dissolveProgress at the canonical 1 vh
     * dissolve span: 50/900 ≈ 0.056 start, 10/900 ≈ 0.011
     * ramp. */
    const LINE_FADE_START = 0.056;
    const LINE_FADE_RAMP = 0.011;
    const dissolveFade =
      dissolveProgress > LINE_FADE_START
        ? Math.max(
            0,
            1 - (dissolveProgress - LINE_FADE_START) / LINE_FADE_RAMP,
          )
        : 1;
    lines.forEach((l) => {
      (l.material as LineMaterial).opacity = k * dissolveFade;
    });
  });

  return (
    <>
      {lines.map((l, i) => (
        <primitive key={i} object={l} />
      ))}
    </>
  );
}

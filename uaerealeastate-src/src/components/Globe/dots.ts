import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { GLOBE_RADIUS } from './constants';

// Denser Fibonacci lattice → finer continent silhouettes, closer to
// the reactbits / Framer "globe pins" reference visual.
const DOT_COUNT = 32000;
/** A point counts as "coastal" if any of its small neighbours falls
 *  in the opposite mask category (land vs sea). Coastal points get
 *  duplicated to boost edge density. */
const COAST_NEIGHBOR_DELTA_DEG = 0.9;
const COAST_DUPLICATES = 2;
// How far outside the globe each dot starts on first paint.
const SCATTER_MIN = 6;
const SCATTER_RANGE = 8;
// Per-dot start delay (seconds) so they don't all arrive at once.
const MAX_DELAY = 0.6;

export type GlobeDots = {
  /** Final on-globe target positions — used by snapping logic. */
  land: Float32Array;
  sea: Float32Array;
  /** Starting positions for the entry animation — far outside the sphere. */
  landStart: Float32Array;
  seaStart: Float32Array;
  /** Per-dot animation delay in seconds. */
  landDelay: Float32Array;
  seaDelay: Float32Array;
  /** Land dots packaged as Vector3s for snapping arcs/pins. */
  landVectors: THREE.Vector3[];
};

/**
 * Fetches the equirectangular land mask once and exposes a sampler.
 * Polarity (which luminance is "land") is auto-detected from known coords.
 */
function useLandMask(url: string) {
  const [sampler, setSampler] = useState<((lat: number, lon: number) => boolean) | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      let imgData: ImageData;
      try {
        imgData = ctx.getImageData(0, 0, w, h);
      } catch {
        return;
      }
      const data = imgData.data;

      const lumAt = (lat: number, lon: number) => {
        const u = ((lon + 180) / 360) * w;
        const v = ((90 - lat) / 180) * h;
        const x = Math.min(w - 1, Math.max(0, Math.floor(u)));
        const y = Math.min(h - 1, Math.max(0, Math.floor(v)));
        const i = (y * w + x) * 4;
        return data[i];
      };

      const sahara = lumAt(20, 10);
      const pacific = lumAt(0, -150);
      const landIsDark = sahara < pacific;
      const isLand = (lat: number, lon: number) => {
        const v = lumAt(lat, lon);
        return landIsDark ? v < 128 : v > 128;
      };
      setSampler(() => isLand);
    };
    img.src = url;
  }, [url]);

  return sampler;
}

/**
 * Generates a scatter position in 3D space far from the origin, biased
 * roughly toward the same outward direction as the target so dots fly
 * "from the screen edges" toward where they'll end up.
 */
function scatterFor(target: THREE.Vector3): [number, number, number] {
  const dir = target.clone().normalize();
  // Add a wide jitter so dots come from many directions, not all radial.
  dir.x += (Math.random() - 0.5) * 1.6;
  dir.y += (Math.random() - 0.5) * 1.6;
  dir.z += (Math.random() - 0.5) * 1.6;
  dir.normalize();
  const dist = SCATTER_MIN + Math.random() * SCATTER_RANGE;
  return [dir.x * dist, dir.y * dist, dir.z * dist];
}

/**
 * Builds a Fibonacci-lattice dot cloud over the entire sphere, splitting
 * each point into either the land or sea bucket based on the mask sample.
 * Also generates per-dot scatter positions and delays for the entry
 * animation. Returns null until the mask has loaded.
 */
export function useGlobeDots(maskUrl: string = '/uaerealeastate/earth-mask.png'): GlobeDots | null {
  const sampler = useLandMask(maskUrl);

  return useMemo<GlobeDots | null>(() => {
    if (!sampler) return null;

    const land: number[] = [];
    const sea: number[] = [];
    const landStart: number[] = [];
    const seaStart: number[] = [];
    const landDelay: number[] = [];
    const seaDelay: number[] = [];
    const landVectors: THREE.Vector3[] = [];

    const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle

    /** A point is "coastal" if any of its compass neighbours are sea. */
    const isCoastal = (lat: number, lon: number) => {
      const d = COAST_NEIGHBOR_DELTA_DEG;
      return (
        !sampler(lat + d, lon) ||
        !sampler(lat - d, lon) ||
        !sampler(lat, lon + d) ||
        !sampler(lat, lon - d)
      );
    };

    /** Pick a random direction tangent to the sphere at `target` and
     *  return a new unit vector close to `target` along it — used to
     *  jitter coastline boost duplicates so they don't stack. */
    const jitterTangent = (target: THREE.Vector3, amount: number) => {
      const t = target.clone().normalize();
      const helper = Math.abs(t.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
      const u = helper.cross(t).normalize();
      const v = t.clone().cross(u).normalize();
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * amount;
      return new THREE.Vector3()
        .copy(t)
        .addScaledVector(u, Math.cos(angle) * r)
        .addScaledVector(v, Math.sin(angle) * r)
        .normalize()
        .multiplyScalar(GLOBE_RADIUS);
    };

    const pushLand = (px: number, py: number, pz: number, target: THREE.Vector3) => {
      const [sx, sy, sz] = scatterFor(target);
      const delay = Math.random() * MAX_DELAY;
      land.push(px, py, pz);
      landStart.push(sx, sy, sz);
      landDelay.push(delay);
      landVectors.push(target);
    };

    for (let i = 0; i < DOT_COUNT; i++) {
      const y = 1 - (i / (DOT_COUNT - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      const lat = 90 - (Math.acos(y) * 180) / Math.PI;
      const thetaAz = Math.atan2(z, -x);
      const lon = (thetaAz * 180) / Math.PI - 180;
      const lonNorm = ((((lon + 180) % 360) + 360) % 360) - 180;

      const px = x * GLOBE_RADIUS;
      const py = y * GLOBE_RADIUS;
      const pz = z * GLOBE_RADIUS;
      const target = new THREE.Vector3(px, py, pz);

      if (sampler(lat, lonNorm)) {
        pushLand(px, py, pz, target);

        // Coastline density boost — duplicate each coastal point with
        // a tiny tangent jitter so the continent edges look denser
        // than the interior, mirroring the Framer reference.
        if (isCoastal(lat, lonNorm)) {
          for (let k = 0; k < COAST_DUPLICATES; k++) {
            const jitter = jitterTangent(target, 0.012);
            pushLand(jitter.x, jitter.y, jitter.z, jitter.clone());
          }
        }
      } else {
        const [sx, sy, sz] = scatterFor(target);
        const delay = Math.random() * MAX_DELAY;
        sea.push(px, py, pz);
        seaStart.push(sx, sy, sz);
        seaDelay.push(delay);
      }
    }

    return {
      land: new Float32Array(land),
      sea: new Float32Array(sea),
      landStart: new Float32Array(landStart),
      seaStart: new Float32Array(seaStart),
      landDelay: new Float32Array(landDelay),
      seaDelay: new Float32Array(seaDelay),
      landVectors,
    };
  }, [sampler]);
}

/** Find the land dot closest to a given world-space target. */
export function snapToNearestLandDot(
  target: THREE.Vector3,
  landVectors: THREE.Vector3[],
): THREE.Vector3 {
  let bestDist = Infinity;
  let best = landVectors[0];
  for (const v of landVectors) {
    const d = v.distanceToSquared(target);
    if (d < bestDist) {
      bestDist = d;
      best = v;
    }
  }
  return best.clone();
}

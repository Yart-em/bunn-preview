/**
 * The globe's dot lattice, built from the land mask's pixels.
 *
 * Plain numbers only — no three.js, no DOM — so the same code runs in
 * the dots worker (dots.worker.ts) and, where that worker can't run,
 * on the main thread (globeData.ts). Vectors are written out as x/y/z
 * triples; the maths is the same as the THREE.Vector3 version it
 * replaced, step for step.
 */
import { DUBAI, GLOBE_RADIUS, SOURCES } from './constants';

// Denser Fibonacci lattice → finer continent silhouettes, closer to
// the reactbits / Framer "globe pins" reference visual.
const DOT_COUNT = 32000;
/** A point counts as "coastal" if any of its small neighbours falls
 *  in the opposite mask category (land vs sea). Coastal points get
 *  duplicated to boost edge density. */
const COAST_NEIGHBOR_DELTA_DEG = 0.9;
const COAST_DUPLICATES = 2;
/** Largest tangent offset of a coastal duplicate (unit sphere). */
const COAST_JITTER = 0.012;
// How far outside the globe each dot starts on first paint.
const SCATTER_MIN = 6;
const SCATTER_RANGE = 8;
// Per-dot start delay (seconds) so they don't all arrive at once.
const MAX_DELAY = 0.6;

export type GlobeDotData = {
  /** Final on-globe positions of the land dots, xyz triples. (Sea
   *  points are never rendered, so none are kept.) */
  land: Float32Array;
  /** Starting positions for the entry animation — far outside the
   *  sphere — one triple per land dot. */
  landStart: Float32Array;
  /** Per-dot animation delay in seconds. */
  landDelay: Float32Array;
  /** Dubai, then every SOURCES origin in order, each snapped to its
   *  nearest land dot: the arc endpoints and the pedestal's spot.
   *  Float64, so they are exactly the dot positions the snapping
   *  measured (the dots themselves are stored as float32, as before). */
  snaps: Float64Array;
};

/** geo.ts latLonToVec3, as a plain triple. */
function latLonToXyz(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

/**
 * Builds a Fibonacci-lattice dot cloud over the entire sphere and keeps
 * the points that land on land in the equirectangular mask (`rgba`, as
 * returned by getImageData). Also rolls each dot's scatter position and
 * delay for the entry animation, and snaps Dubai + the arc origins to
 * their nearest land dot.
 */
export function buildGlobeDotData(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): GlobeDotData {
  const lumAt = (lat: number, lon: number) => {
    const u = ((lon + 180) / 360) * width;
    const v = ((90 - lat) / 180) * height;
    const x = Math.min(width - 1, Math.max(0, Math.floor(u)));
    const y = Math.min(height - 1, Math.max(0, Math.floor(v)));
    return rgba[(y * width + x) * 4];
  };
  /* Polarity (which luminance is "land") is auto-detected from known
   * coords. */
  const landIsDark = lumAt(20, 10) < lumAt(0, -150);
  const isLand = (lat: number, lon: number) => {
    const v = lumAt(lat, lon);
    return landIsDark ? v < 128 : v > 128;
  };
  /** A point is "coastal" if any of its compass neighbours are sea. */
  const isCoastal = (lat: number, lon: number) => {
    const d = COAST_NEIGHBOR_DELTA_DEG;
    return (
      !isLand(lat + d, lon) ||
      !isLand(lat - d, lon) ||
      !isLand(lat, lon + d) ||
      !isLand(lat, lon - d)
    );
  };

  const land: number[] = [];
  const landStart: number[] = [];
  const landDelay: number[] = [];

  /** Adds a land dot at (x, y, z) with its entry scatter + delay. The
   *  scatter position is far from the origin, biased roughly toward
   *  the dot's own outward direction so dots fly "from the screen
   *  edges" toward where they'll end up — plus a wide jitter so they
   *  come from many directions, not all radially. */
  const pushLand = (x: number, y: number, z: number) => {
    const len = Math.hypot(x, y, z);
    let dx = x / len + (Math.random() - 0.5) * 1.6;
    let dy = y / len + (Math.random() - 0.5) * 1.6;
    let dz = z / len + (Math.random() - 0.5) * 1.6;
    const dLen = Math.hypot(dx, dy, dz);
    const dist = SCATTER_MIN + Math.random() * SCATTER_RANGE;
    dx = (dx / dLen) * dist;
    dy = (dy / dLen) * dist;
    dz = (dz / dLen) * dist;
    land.push(x, y, z);
    landStart.push(dx, dy, dz);
    landDelay.push(Math.random() * MAX_DELAY);
  };

  const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle

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

    if (!isLand(lat, lonNorm)) continue;
    pushLand(x * GLOBE_RADIUS, y * GLOBE_RADIUS, z * GLOBE_RADIUS);

    // Coastline density boost — duplicate each coastal point with
    // a tiny tangent jitter so the continent edges look denser
    // than the interior, mirroring the Framer reference.
    if (isCoastal(lat, lonNorm)) {
      /* Tangent basis at the point: u = helper × t, v = t × u, with
       * the helper axis switched near the poles. */
      const [hx, hy] = Math.abs(y) < 0.9 ? [0, 1] : [1, 0];
      let ux = hy * z;
      let uy = -hx * z;
      let uz = hx * y - hy * x;
      const uLen = Math.hypot(ux, uy, uz);
      ux /= uLen;
      uy /= uLen;
      uz /= uLen;
      let vx = y * uz - z * uy;
      let vy = z * ux - x * uz;
      let vz = x * uy - y * ux;
      const vLen = Math.hypot(vx, vy, vz);
      vx /= vLen;
      vy /= vLen;
      vz /= vLen;
      for (let k = 0; k < COAST_DUPLICATES; k++) {
        const angle = Math.random() * Math.PI * 2;
        const jr = Math.random() * COAST_JITTER;
        const cu = Math.cos(angle) * jr;
        const cv = Math.sin(angle) * jr;
        const jx = x + ux * cu + vx * cv;
        const jy = y + uy * cu + vy * cv;
        const jz = z + uz * cu + vz * cv;
        const s = GLOBE_RADIUS / Math.hypot(jx, jy, jz);
        pushLand(jx * s, jy * s, jz * s);
      }
    }
  }

  /* Snap Dubai + every arc origin to its nearest land dot (first
   * minimum wins, as snapToNearestLandDot does). */
  const targets: Array<[number, number]> = [
    DUBAI,
    ...SOURCES.map(({ lat, lon }): [number, number] => [lat, lon]),
  ];
  const snaps = new Float64Array(targets.length * 3);
  targets.forEach(([lat, lon], k) => {
    const [tx, ty, tz] = latLonToXyz(lat, lon, GLOBE_RADIUS);
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < land.length; i += 3) {
      const dx = land[i] - tx;
      const dy = land[i + 1] - ty;
      const dz = land[i + 2] - tz;
      const d = dx * dx + dy * dy + dz * dz;
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    snaps[k * 3] = land[best];
    snaps[k * 3 + 1] = land[best + 1];
    snaps[k * 3 + 2] = land[best + 2];
  });

  return {
    land: new Float32Array(land),
    landStart: new Float32Array(landStart),
    landDelay: new Float32Array(landDelay),
    snaps,
  };
}

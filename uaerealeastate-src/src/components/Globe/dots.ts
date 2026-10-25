import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { SOURCES } from './constants';
import { getLoadedGlobeDots, loadGlobeDots } from './globeData';
import type { GlobeDotData } from './lattice';

export type GlobeDots = {
  /** Final on-globe target positions. */
  land: Float32Array;
  /** Starting positions for the entry animation — far outside the sphere. */
  landStart: Float32Array;
  /** Per-dot animation delay in seconds. */
  landDelay: Float32Array;
  /** Dubai, snapped to its nearest land dot — where every arc ends
   *  and the pedestal stands. */
  dest: THREE.Vector3;
  /** Each SOURCES origin snapped to its nearest land dot, same order. */
  sources: THREE.Vector3[];
};

function toGlobeDots(data: GlobeDotData): GlobeDots {
  const snap = (k: number) =>
    new THREE.Vector3(data.snaps[k * 3], data.snaps[k * 3 + 1], data.snaps[k * 3 + 2]);
  return {
    land: data.land,
    landStart: data.landStart,
    landDelay: data.landDelay,
    dest: snap(0),
    sources: SOURCES.map((_, i) => snap(i + 1)),
  };
}

/**
 * The globe's land-dot cloud (Fibonacci lattice sampled against the
 * land mask, with entry-animation scatter positions and delays) plus
 * the snapped arc endpoints. Built by globeData.ts — normally in a
 * worker started at page load, so it is already there when the globe
 * mounts. Returns null until it has loaded.
 */
export function useGlobeDots(): GlobeDots | null {
  const [dots, setDots] = useState<GlobeDots | null>(() => {
    const data = getLoadedGlobeDots();
    return data && toGlobeDots(data);
  });

  useEffect(() => {
    if (dots) return;
    let live = true;
    loadGlobeDots().then(
      (data) => {
        if (live) setDots(toGlobeDots(data));
      },
      /* The mask never loaded: no globe, as before. */
      () => {},
    );
    return () => {
      live = false;
    };
  }, [dots]);

  return dots;
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

import type { RefObject } from 'react';

/**
 * Entry-animation timing constants. All components read from these so the
 * choreography stays in sync.
 *
 * Timeline (seconds on the entry clock — since the globe's first drawn
 * frame):
 *   0.0 .. GATHER_END         dots fly in from outside the screen and
 *                             gather onto the sphere
 *   GATHER_END .. ARCS_END    arcs fade in
 *   ARCS_END .. PINS_END      pins + traveling dots fade in
 */
export const GATHER_DURATION = 1.4; // per-dot travel duration (after delay)
export const GATHER_END = 1.9;      // GATHER_DURATION + max scatter delay
export const ARCS_END = 2.5;
export const PINS_END = 3.0;

/**
 * Staged mount, on the same clock. Only the dots are in the globe's
 * first commit; the arcs + Dubai pedestal and then the coins are each
 * added in a later frame of their own, shaders compiled off the main
 * thread before they are shown — still well before they fade in
 * (at GATHER_END and ARCS_END). Mounting everything at once made the
 * globe's first frames one long main-thread stall.
 */
export const ARCS_STAGE_AT = 0.6;
export const COINS_STAGE_AT = 1.2;

/**
 * The entry clock. `start` holds the R3F clock time of the globe's
 * first drawn frame: the first caller on that frame records it, and
 * everything mounted later (the staged arcs, pedestal and coins) reads
 * the same origin — so mounting them later never shifts their fades.
 * Returns seconds since that frame.
 */
export function entryTime(
  start: RefObject<number | null>,
  elapsed: number,
): number {
  if (start.current === null) start.current = elapsed;
  return elapsed - start.current;
}

/**
 * Returns a 0..1 fade factor based on a clock-time window. Used by arcs,
 * pins and traveling dots to fade in after the gather animation.
 */
export function fadeAt(elapsed: number, start: number, end: number): number {
  if (elapsed <= start) return 0;
  if (elapsed >= end) return 1;
  return (elapsed - start) / (end - start);
}

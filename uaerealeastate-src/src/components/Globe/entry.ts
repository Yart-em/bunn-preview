/**
 * Entry-animation timing constants. All components read from these so the
 * choreography stays in sync.
 *
 * Timeline (seconds since the scene mounts):
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
 * Returns a 0..1 fade factor based on a clock-time window. Used by arcs,
 * pins and traveling dots to fade in after the gather animation.
 */
export function fadeAt(elapsed: number, start: number, end: number): number {
  if (elapsed <= start) return 0;
  if (elapsed >= end) return 1;
  return (elapsed - start) / (end - start);
}

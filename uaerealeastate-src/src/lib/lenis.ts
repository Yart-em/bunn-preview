import Lenis from 'lenis';

/**
 * App-wide smooth-scroll controller.
 *
 * Exactly ONE window-level Lenis exists for the whole page — two
 * instances would fight over the window scroll. Everything that needs
 * Lenis (the ScrollStack card choreography, the snap addon in App)
 * shares this single instance. It lives for the app's lifetime and
 * owns its own rAF loop, so callers never create or destroy it.
 */
let instance: Lenis | null = null;

export function getLenis(): Lenis {
  if (instance) return instance;

  instance = new Lenis({
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 2,
    wheelMultiplier: 1,
    lerp: 0.1,
    syncTouch: true,
    syncTouchLerp: 0.075,
  });

  const raf = (time: number) => {
    instance?.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  /* Debug hook — lets tooling drive the scroll (e.g. jump to a
   * section to inspect it). Harmless in production. */
  (window as unknown as { __lenis?: Lenis }).__lenis = instance;

  return instance;
}

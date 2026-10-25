/** Run `cb` once the main thread is idle (at most `timeout` ms
 *  later). Safari has no requestIdleCallback: there `cb` runs just
 *  after the next frame, so each step still gets a frame of its
 *  own. Returns a cancel function. */
export function whenIdle(cb: () => void, timeout: number): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(cb, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  let t = 0;
  const raf = requestAnimationFrame(() => {
    t = window.setTimeout(cb, 0);
  });
  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(t);
  };
}

/**
 * Platform detection — iOS / mobile-Safari.
 *
 * On iOS every browser is WebKit (the Safari engine), so iOS
 * detection == "mobile Safari" for the purposes of disabling
 * effects that render incorrectly or jankily there:
 *   • backdrop-filter "liquid glass" (GlassSurface, .faq-item)
 *   • the gaussian blur on the carousel's side slides
 *
 * Evaluated once at module load.
 */
export const IS_IOS: boolean = (() => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // iPhone / iPad / iPod — classic user-agent string.
  if (/iP(hone|ad|od)/.test(ua)) return true;
  // iPadOS 13+ masquerades as macOS Safari but reports touch points.
  if (
    navigator.platform === 'MacIntel' &&
    (navigator.maxTouchPoints ?? 0) > 1
  ) {
    return true;
  }
  return false;
})();

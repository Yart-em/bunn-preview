import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Applies a clip-path notch to the inner `.glass-surface` element
 * inside `cardRef` so a circular (or pill-shaped) button at the
 * BOTTOM-RIGHT corner appears to "dissolve" the glass around it via
 * an S-curve sweep. The path traversal is clockwise.
 *
 * The notch:
 *   • depth   = 3·(btnHeight/2 + 3px)   — driven by button HEIGHT,
 *               which is constant (56px) so the depth never changes
 *               while the pill expands.
 *   • width   = max(btnWidth, btnHeight) — for circular buttons the
 *               default 3·sr horizontal sweep is used; once the pill
 *               grows wider than tall, an `extra` horizontal BRIDGE
 *               is inserted between cubics 2 and 3 (where both have
 *               horizontal tangent at y = H − 2·sr) so the curve
 *               stays C¹-smooth and just lengthens horizontally.
 *
 * Geometry mirrors User-app's top-right notch flipped vertically and
 * traversed in reverse so it still flows clockwise. ResizeObserver
 * watches the button — the path is recomputed every frame the button
 * width changes (i.e. throughout the hover-expansion transition), so
 * the glass appears to subtract live around the growing pill.
 *
 * @param cardRef       WRAPPER element (`.glass-clip` div) that
 *                      contains the `.glass-surface`. We apply the
 *                      clip-path to this wrapper rather than the
 *                      inner glass element because Safari has a
 *                      compositing bug where clipping an element that
 *                      owns `backdrop-filter` produces edge artifacts
 *                      / dropped renders along the cut. Putting the
 *                      clip on a no-filter wrapper sidesteps it
 *                      entirely; the wrapper visually clips its
 *                      child, and the child's backdrop-filter still
 *                      computes against the unclipped element.
 * @param btnRef        round/pill CTA button — its right + bottom
 *                      edges MUST align with the card's right +
 *                      bottom edges.
 * @param borderRadius  card corner radius in px (default 35).
 */
export function useCardNotch(
  cardRef: RefObject<HTMLElement | null>,
  btnRef: RefObject<HTMLElement | null>,
  borderRadius = 35,
  /** Gap in px between the button edge and the S-curve. */
  gap = 3,
) {
  useEffect(() => {
    function apply() {
      const card = cardRef.current;
      const btn = btnRef.current;
      if (!card || !btn) return;

      const W = card.offsetWidth;
      const H = card.offsetHeight;
      if (!W || !H) return;

      // On phones (≤ 600 px) the CTA reflows out of the corner into a
      // full-width pill in normal flow (see the @media block in
      // index.css), so the S-curve corner notch no longer makes sense.
      // Clear any previously-applied clip and bail. The ResizeObserver
      // on the %-width card re-runs this when the viewport crosses the
      // breakpoint, so the notch restores on the way back to desktop.
      if (window.innerWidth <= 600) {
        card.style.clipPath = 'none';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (card.style as any).webkitClipPath = 'none';
        card.style.removeProperty('--notch-depth');
        return;
      }

      // Depth driven by button HEIGHT (constant).
      const nr = btn.offsetHeight / 2;
      const sr = nr + gap;
      const cr = borderRadius;
      const k = 0.5523; // cubic-bezier circle approximation constant

      // Width-driven extension: when the pill is wider than tall, we
      // shift cubics 2 + 3 RIGHT (toward the right edge) by `extra`
      // and bridge them to the unchanged cubic at the right edge with
      // a horizontal segment at y = H − 2·sr.
      //
      // Note: we shift the inner cubics, NOT the entry cubic at the
      // right edge — that's the mirror of the User-app pattern with
      // direction reversed. The bridge keeps depth at 3·sr; only the
      // notch's horizontal span grows.
      const extra = Math.max(0, btn.offsetWidth - btn.offsetHeight);

      const p = [
        `M${cr} 0`,
        `H${W - cr}`,
        `A${cr} ${cr} 0 0 1 ${W} ${cr}`,
        // Right edge down to where the s-curve begins.
        `V${H - 3 * sr}`,
        // Cubic A — exit from the right edge: starts vertical
        // (continuing the right-edge tangent downward), ends with a
        // horizontal tangent at y = H − 2·sr. Endpoint is (W − sr,
        // H − 2·sr) — unchanged regardless of `extra`.
        `C${W} ${H - sr * (3 - k)} ${W - sr * (1 - k)} ${H - 2 * sr} ${W - sr} ${H - 2 * sr}`,
        // Horizontal bridge — inserted only when extra > 0. Both
        // ends have horizontal tangent so this is C¹-continuous.
        `H${W - sr - extra}`,
        // Cubic B — middle: from horizontal tangent at y = H − 2·sr
        // to vertical tangent at y = H − sr. Shifted left by `extra`.
        `C${W - sr * (1 + k) - extra} ${H - 2 * sr} ${W - 2 * sr - extra} ${H - sr * (1 + k)} ${W - 2 * sr - extra} ${H - sr}`,
        // Cubic C — entry to the bottom edge: from vertical tangent
        // at y = H − sr to horizontal tangent at y = H. Shifted left
        // by `extra` so the curve lands at (W − 3·sr − extra, H).
        `C${W - 2 * sr - extra} ${H - sr * (1 - k)} ${W - 3 * sr + k * sr - extra} ${H} ${W - 3 * sr - extra} ${H}`,
        `H${cr}`,
        `A${cr} ${cr} 0 0 1 0 ${H - cr}`,
        `V${cr}`,
        `A${cr} ${cr} 0 0 1 ${cr} 0Z`,
      ].join(' ');

      // Set both the standard property and the -webkit- prefixed
       // variant — older Safari (≤ 13.1) only honors the prefixed
       // form for `clip-path: path()`.
      card.style.clipPath = `path('${p}')`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (card.style as any).webkitClipPath = `path('${p}')`;
      card.style.setProperty('--notch-depth', `${Math.round(3 * sr)}px`);
    }

    apply();

    const ro = new ResizeObserver(apply);
    if (cardRef.current) ro.observe(cardRef.current);
    if (btnRef.current) ro.observe(btnRef.current);

    // CSS width transitions don't always trigger ResizeObserver
    // smoothly on every frame, especially in Safari — pump a rAF
    // loop for the duration of the width transition so the notch
    // tracks the button perfectly through the expand AND collapse.
    let rafId: number | null = null;
    let lastWidth = -1;
    let stableFrames = 0;
    const pump = () => {
      apply();
      const b = btnRef.current;
      if (!b) {
        rafId = null;
        return;
      }
      // Stop once the width has been stable for ~6 frames (≈100ms)
      // — covers the easing tail.
      if (b.offsetWidth === lastWidth) {
        stableFrames += 1;
      } else {
        stableFrames = 0;
        lastWidth = b.offsetWidth;
      }
      if (stableFrames > 6) {
        rafId = null;
        return;
      }
      rafId = requestAnimationFrame(pump);
    };
    const startPump = () => {
      stableFrames = 0;
      lastWidth = -1;
      if (rafId === null) rafId = requestAnimationFrame(pump);
    };
    const btn = btnRef.current;
    btn?.addEventListener('mouseenter', startPump);
    btn?.addEventListener('mouseleave', startPump);
    btn?.addEventListener('focusin', startPump);
    btn?.addEventListener('focusout', startPump);

    return () => {
      ro.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
      btn?.removeEventListener('mouseenter', startPump);
      btn?.removeEventListener('mouseleave', startPump);
      btn?.removeEventListener('focusin', startPump);
      btn?.removeEventListener('focusout', startPump);
    };
  }, [cardRef, btnRef, borderRadius, gap]);
}

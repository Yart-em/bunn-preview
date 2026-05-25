import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Center-bottom S-curve notch — same aesthetic as useCardNotch but
 * the pocket is centered at the BOTTOM of the card instead of the
 * bottom-right.
 *
 * Geometry: a rectangular U-shaped pocket with 4 rounded transitions
 * (two quarter-circle arcs per side). Matches the carousel slide
 * notch language — outer arcs have the card's border-radius, inner
 * arcs are sized to the button's corner-radius + gap.
 *
 * @param cardRef     Element that receives the clip-path (GlassSurface).
 * @param btnRef      Center-bottom button pill.
 * @param borderRadius Card corner radius in px (default 35).
 * @param gap         Gap between button edge and the notch wall (default 5).
 */
export function useCenterNotch(
  cardRef: RefObject<HTMLElement | null>,
  btnRef: RefObject<HTMLElement | null>,
  borderRadius = 35,
  gap = 5,
) {
  useEffect(() => {
    function apply() {
      const card = cardRef.current;
      const btn = btnRef.current;
      if (!card || !btn) return;

      const W = card.offsetWidth;
      const H = card.offsetHeight;
      if (!W || !H) return;

      const nr = btn.offsetHeight / 2; // button corner radius
      const ir = nr + gap;             // inner arc radius
      const or_ = borderRadius;        // outer arc radius = card corner
      const k = 0.5523;                // cubic-bezier circle approximation

      const cx = W / 2;
      const halfBtn = btn.offsetWidth / 2;

      // Wall x-positions (vertical sections of the notch)
      const wallR = cx + halfBtn + gap;
      const wallL = cx - halfBtn - gap;

      // Entry / exit points on the bottom edge
      const entryR = wallR + or_;
      const exitL = wallL - or_;

      // Notch floor y
      const floorY = H - or_ - ir;

      // Inner edge x-positions on the floor
      const innerR = wallR - ir;
      const innerL = wallL + ir;

      const p = [
        // ── Card outline ───────────────────────────────
        `M${or_} 0`,
        `H${W - or_}`,
        `A${or_} ${or_} 0 0 1 ${W} ${or_}`,
        `V${H - or_}`,
        `A${or_} ${or_} 0 0 1 ${W - or_} ${H}`,

        // Bottom edge → right entry of notch
        `H${entryR}`,

        // ── RIGHT side of notch (going UP) ─────────────
        // Outer arc: bottom edge → vertical wall  (LEFT → UP)
        `C${entryR - or_ * k} ${H} ${wallR} ${H - or_ + or_ * k} ${wallR} ${H - or_}`,
        // Inner arc: vertical wall → floor         (UP → LEFT)
        `C${wallR} ${H - or_ - ir * k} ${innerR + ir * k} ${floorY} ${innerR} ${floorY}`,

        // Notch floor
        `H${innerL}`,

        // ── LEFT side of notch (going DOWN) ────────────
        // Inner arc: floor → vertical wall          (LEFT → DOWN)
        `C${innerL - ir * k} ${floorY} ${wallL} ${H - or_ - ir * k} ${wallL} ${H - or_}`,
        // Outer arc: vertical wall → bottom edge    (DOWN → LEFT)
        `C${wallL} ${H - or_ + or_ * k} ${exitL + or_ * k} ${H} ${exitL} ${H}`,

        // Bottom edge continues left
        `H${or_}`,
        `A${or_} ${or_} 0 0 1 0 ${H - or_}`,
        `V${or_}`,
        `A${or_} ${or_} 0 0 1 ${or_} 0`,
        `Z`,
      ].join(' ');

      card.style.clipPath = `path('${p}')`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (card.style as any).webkitClipPath = `path('${p}')`;
    }

    /* Refs may not be populated on the very first effect run
     * (React 19 concurrent rendering). Try immediately, then
     * retry on the next frame so the ResizeObserver is always
     * set up once the DOM nodes exist. */
    let ro: ResizeObserver | null = null;

    function setup() {
      apply();
      if (!ro && cardRef.current && btnRef.current) {
        ro = new ResizeObserver(apply);
        ro.observe(cardRef.current);
        ro.observe(btnRef.current);
      }
    }

    setup();
    const deferredId = requestAnimationFrame(setup);

    /* rAF pump for smooth hover-width transitions (same pattern
     * as useCardNotch). */
    let rafId: number | null = null;
    let lastWidth = -1;
    let stableFrames = 0;
    const pump = () => {
      apply();
      const b = btnRef.current;
      if (!b) { rafId = null; return; }
      if (b.offsetWidth === lastWidth) stableFrames++;
      else { stableFrames = 0; lastWidth = b.offsetWidth; }
      if (stableFrames > 6) { rafId = null; return; }
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
      cancelAnimationFrame(deferredId);
      ro?.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
      btn?.removeEventListener('mouseenter', startPump);
      btn?.removeEventListener('mouseleave', startPump);
      btn?.removeEventListener('focusin', startPump);
      btn?.removeEventListener('focusout', startPump);
    };
  }, [cardRef, btnRef, borderRadius, gap]);
}

/**
 * Scroll distances the page's choreography is built from.
 *
 * They live here, not next to the code that uses them, because two
 * places need the same numbers: the choreography itself (App.tsx's
 * hero recalc, the how-it-works ScrollStack in BelowFold.tsx) and the
 * phone scroll model (lib/stepScroll), which works out from them
 * where each "idea" comes to rest. Change one here and both follow.
 *
 * Tiny on purpose: it ships in the entry bundle.
 */

/** The globe locks this far past the hero card's bottom edge. */
export const HERO_LOCK_TAIL_PX = 35;

/** Scroll the locked globe holds still for before it dissolves. */
export const HERO_POST_LOCK_BUFFER_PX = 600;

/** The BUNN line joins this far past the 67.3 % statement. */
export const BUNN_LINE_AFTER_PX = 400;

/** How-it-works cards pin this far down the viewport (percent)… */
export const STACK_POSITION_PCT = 10;
/** …each one this much lower than the card before it. */
export const ITEM_STACK_DISTANCE_PX = 20;

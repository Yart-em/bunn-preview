/**
 * CTA → contact popup bridge.
 *
 * Every CTA on the page opens the ContactPopup, but the popup lives
 * in its own lazy chunk and may not be mounted yet when a CTA is
 * clicked (the hero CTA is clickable from ~3 s). App's single
 * document-level click listener (ContactPopupHost) therefore only
 * REQUESTS an open; the popup registers its opener once it has
 * mounted and parked its panel off-screen, and a request that came
 * in before that is replayed then — so the very first open still
 * plays the normal slide-in animation.
 *
 * Tiny on purpose: it ships in the entry bundle.
 */

/** What counts as a CTA. The popup's own submit button matches
 *  too; ContactPopupHost skips anything inside the popup. */
export const CTA_SELECTOR = 'a.cta-fab, button.cta-fab';

let opener: (() => void) | null = null;
let pending = false;

/** Open the popup now if it's mounted, otherwise as soon as it is. */
export function requestContactOpen(): void {
  if (opener) opener();
  else pending = true;
}

/** Called by the mounted popup. Replays a queued request; returns
 *  the unregister function (an effect cleanup). */
export function registerContactOpener(open: () => void): () => void {
  opener = open;
  if (pending) {
    pending = false;
    open();
  }
  return () => {
    if (opener === open) opener = null;
  };
}

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
 * plays the normal slide-in animation. If the popup's chunk fails to
 * load, the page reloads for it (lib/chunks) and the request carries
 * over to the reloaded page.
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

/** sessionStorage: a CTA click whose popup a reload interrupted. */
const OPEN_AFTER_RELOAD_KEY = 'bunn:contact-open-after-reload';

/** Have the next load of this page open the popup straight away: the
 *  popup's chunk failed on a CTA click and the page is reloading for
 *  it (lib/chunks), so the click isn't lost. */
export function openContactAfterReload(): void {
  try {
    sessionStorage.setItem(OPEN_AFTER_RELOAD_KEY, '1');
  } catch {
    /* Then the visitor clicks again after the reload. */
  }
}

/** True, once, on the load that openContactAfterReload asked for. */
export function takeContactOpenAfterReload(): boolean {
  try {
    if (!sessionStorage.getItem(OPEN_AFTER_RELOAD_KEY)) return false;
    sessionStorage.removeItem(OPEN_AFTER_RELOAD_KEY);
    return true;
  } catch {
    return false;
  }
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

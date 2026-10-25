import { lazy, type ComponentType } from 'react';

/**
 * Recovering from a lazy chunk that failed to load.
 *
 * The globe, everything below the hero (BelowFold) and the contact
 * popup are their own chunks, fetched after the first paint. If one
 * of those fetches fails — a dropped connection, or a deploy that
 * replaced the hashed chunk files while this page was open — that
 * import() has failed for good: the browser keeps the failed result
 * for the URL (as the HTML module map specifies), so calling import()
 * again rejects at once, without a new request. In order:
 *   1. importAfresh fetches the chunk again under fresh URLs. That
 *      gets past a failed fetch of the chunk itself.
 *   2. It can't help when what failed is a chunk the failed one
 *      imports (gsap, shared by BelowFold and the popup: still asked
 *      for under its own URL), or after a deploy (the old files are
 *      gone). reloadForFailedChunk reloads the page, which fetches
 *      it all again, after a deploy under the new names.
 *   3. If the reloaded page fails too, the page does without: no
 *      globe or coin (lazyOrNothing), no sections below the hero
 *      (BelowFoldMount), no popup.
 *
 * Ships in the entry bundle.
 */

/** sessionStorage: when this tab last reloaded for a failed chunk. */
const RELOADED_AT_KEY = 'bunn:chunk-reload-at';
/** No second reload this soon after the last one: a chunk that is
 *  still failing on the reloaded page stays failed, with no loop. */
const RELOAD_COOLDOWN_MS = 60_000;

/** Reloads the page to recover from a failed chunk, and returns true.
 *  Returns false, doing nothing, if this tab already reloaded for one
 *  within the cooldown, or can't record that it did (no
 *  sessionStorage) — the caller then degrades instead. While the
 *  browser reports being offline, the reload waits for the
 *  connection rather than swapping the page for its error page.
 *  `beforeReload` runs only if the page is going to reload, and
 *  BEFORE the reload is asked for: WebKit drops a sessionStorage
 *  write made after location.reload(), even in the same task. */
export function reloadForFailedChunk(beforeReload?: () => void): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOADED_AT_KEY));
    if (last && Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(RELOADED_AT_KEY, String(Date.now()));
  } catch {
    return false;
  }
  beforeReload?.();
  const reload = () => window.location.reload();
  if (navigator.onLine === false) {
    window.addEventListener('online', reload, { once: true });
  } else {
    reload();
  }
  return true;
}

/** React.lazy for a component the page can live without (the globe,
 *  the brokers coin). If its chunk fails it renders nothing instead of
 *  throwing: nothing above it catches errors, so the rejection would
 *  unmount the whole page. With `reload`, it also reloads the page to
 *  get the component back (see reloadForFailedChunk). */
export function lazyOrNothing<P extends object>(
  load: () => Promise<{ default: ComponentType<P> }>,
  { reload }: { reload: boolean },
) {
  return lazy(() =>
    load().catch(() => {
      if (reload) reloadForFailedChunk();
      return { default: Nothing as ComponentType<P> };
    }),
  );
}

/** True when this page load is a reload for a failed chunk (above).
 *  Such a page holds back its first chunk requests a little: when a
 *  chunk's <link rel=modulepreload> has failed, WebKit's memory cache
 *  hands the same error, without a request, to a load of that URL
 *  early in the next page (in testing: one made right at start-up
 *  failed, ones made seconds in fetched the file). */
export function isChunkReloadPage(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOADED_AT_KEY));
    return !!last && Date.now() - last < RELOAD_COOLDOWN_MS;
  } catch {
    return false;
  }
}

/** Runs `cb` once the page has loaded (now, if it has). */
export function afterPageLoad(cb: () => void): void {
  if (document.readyState === 'complete') cb();
  else window.addEventListener('load', cb, { once: true });
}

/** The lazy chunks the build lists the files of (chunkFiles in
 *  vite.config.ts). */
export type ListedChunk = 'belowFold' | 'contactPopup';

/** The built URLs of a listed chunk's files — the chunk's own JS
 *  first; none in the dev server. */
export function chunkFiles(name: ListedChunk): string[] {
  try {
    files ??= JSON.parse(
      document.getElementById('chunk-files')?.textContent || '{}',
    ) as Partial<Record<ListedChunk, string[]>>;
  } catch {
    files = {};
  }
  return files[name] ?? [];
}
let files: Partial<Record<ListedChunk, string[]>> | undefined;
let fresh = 0;

/** After import() of a listed chunk has failed: fetch the chunk again
 *  under fresh URLs, which the browser has no failed result for — its
 *  JS and, alongside, its stylesheets (a failed stylesheet fails the
 *  import as well, and Vite won't ask for it twice; one that did load
 *  is merely applied twice) — and resolve with the module. A chunk the
 *  failed one imports (gsap) is still requested under its own URL, so
 *  if THAT is what failed, this fails too; and after a deploy the old
 *  files are gone. Then only a reload helps. */
export async function importAfresh<T>(name: ListedChunk): Promise<T> {
  const [js, ...rest] = chunkFiles(name);
  if (!js) throw new Error(`no file list for the ${name} chunk`);
  const query = `?retry=${++fresh}`;
  const css = rest.filter((href) => href.endsWith('.css'));
  const [module] = await Promise.all([
    import(/* @vite-ignore */ js + query) as Promise<T>,
    ...css.map(
      (href) =>
        new Promise<void>((resolve, reject) => {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.crossOrigin = '';
          link.href = href + query;
          link.onload = () => resolve();
          link.onerror = () => reject(new Error(`${href} failed again`));
          document.head.append(link);
        }),
    ),
  ]);
  return module;
}

function Nothing() {
  return null;
}

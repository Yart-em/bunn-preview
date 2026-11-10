/**
 * Main-thread side of the globe's dot data: starts the dots worker,
 * caches its result, and falls back to building on the main thread.
 *
 * No three.js in here (nor in lattice.ts), so the page's entry chunk
 * can start the build long before the Globe chunk mounts: App calls
 * loadGlobeDots() in the first idle period after first paint, and by
 * the globe's 2 s mount the data is normally waiting in the cache —
 * useGlobeDots (dots.ts) then renders the dots in the globe's very
 * first commit.
 */
import type { DotsWorkerRequest, DotsWorkerResponse } from './dots.worker';
import type { GlobeDotData } from './lattice';

/* The lattice reads the mask's red channel and only compares it with
 * 128 (lattice.ts isLand), so the PNG is stored as 1-bit black land /
 * white sea at the same 800 × 400: every pixel classifies exactly as
 * the 8-bit original did (all 320 000 checked), so the globe's dots
 * are identical — 5 KB instead of 124 KB. */
const MASK_URL = '/uaerealestate/earth-mask.png';

let loaded: GlobeDotData | null = null;
let loading: Promise<GlobeDotData> | null = null;

/** Starts building the dot data (once) and resolves with it. */
export function loadGlobeDots(): Promise<GlobeDotData> {
  loading ??= buildInWorker()
    .catch(buildOnMainThread)
    .then((data) => (loaded = data));
  return loading;
}

/** The dot data if it has finished building, else null. */
export function getLoadedGlobeDots(): GlobeDotData | null {
  return loaded;
}

function buildInWorker(): Promise<GlobeDotData> {
  return new Promise((resolve, reject) => {
    if (
      typeof Worker === 'undefined' ||
      typeof OffscreenCanvas === 'undefined' ||
      typeof createImageBitmap === 'undefined'
    ) {
      reject(new Error('dots worker unsupported'));
      return;
    }
    let worker: Worker;
    try {
      worker = new Worker(new URL('./dots.worker.ts', import.meta.url), {
        type: 'module',
      });
    } catch (err) {
      reject(err);
      return;
    }
    const fail = (why: string) => {
      worker.terminate();
      reject(new Error(why));
    };
    worker.onmessage = (e: MessageEvent<DotsWorkerResponse>) => {
      worker.terminate();
      if (e.data.ok) resolve(e.data.data);
      else reject(new Error('dots worker failed'));
    };
    /* The script failed to load or threw — e.g. a browser that can't
     * run module workers. */
    worker.onerror = (e) => {
      e.preventDefault();
      fail('dots worker error');
    };
    worker.onmessageerror = () => fail('dots worker message error');
    const request: DotsWorkerRequest = {
      maskUrl: new URL(MASK_URL, window.location.href).href,
    };
    worker.postMessage(request);
  });
}

/** The pre-worker path, kept for browsers where the worker can't run:
 *  decode the mask via an <img>, read it back from a 2D canvas, build
 *  the lattice here. The builder is fetched only on this path, so it
 *  stays out of the page's entry chunk. */
async function buildOnMainThread(): Promise<GlobeDotData> {
  const [{ buildGlobeDotData }, mask] = await Promise.all([
    import('./lattice'),
    readMaskPixels(),
  ]);
  return buildGlobeDotData(mask.data, mask.width, mask.height);
}

function readMaskPixels(): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('no 2D context');
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, c.width, c.height));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('land mask failed to load'));
    img.src = MASK_URL;
  });
}

/**
 * Dots worker: fetches + decodes the land mask and builds the globe's
 * dot lattice (lattice.ts) off the main thread. On the main thread
 * the decode + 2D-canvas read-back, the 32 000-point sampling and the
 * arc-endpoint snapping (~45 ms at 4× CPU throttle) landed in the
 * ~80 ms frame in which the globe appeared. The result goes back as
 * transferable typed arrays, so receiving it is a hand-over, not a
 * copy.
 *
 * Any failure (no OffscreenCanvas 2D in workers, a decode or network
 * error, …) is reported back instead of thrown, and globeData.ts then
 * builds the lattice on the main thread as it always used to.
 */
import { buildGlobeDotData, type GlobeDotData } from './lattice';

export type DotsWorkerRequest = { maskUrl: string };
export type DotsWorkerResponse =
  | { ok: true; data: GlobeDotData }
  | { ok: false };

/* The app compiles against the DOM lib, where `self` is a Window;
 * in here it is the worker's global scope. */
const scope = self as unknown as Worker;

scope.onmessage = async (e: MessageEvent<DotsWorkerRequest>) => {
  let reply: DotsWorkerResponse = { ok: false };
  try {
    const res = await fetch(e.data.maskUrl);
    if (!res.ok) throw new Error(`land mask: HTTP ${res.status}`);
    const bitmap = await createImageBitmap(await res.blob());
    const { width, height } = bitmap;
    /* willReadFrequently keeps the canvas in CPU memory: the one
     * getImageData below is then a plain copy, not a GPU read-back. */
    const ctx = new OffscreenCanvas(width, height).getContext('2d', {
      willReadFrequently: true,
    });
    if (!ctx) throw new Error('no OffscreenCanvas 2D context');
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const { data } = ctx.getImageData(0, 0, width, height);
    reply = { ok: true, data: buildGlobeDotData(data, width, height) };
  } catch {
    /* reply stays { ok: false } — the main thread falls back. */
  }
  if (reply.ok) {
    const { land, landStart, landDelay, snaps } = reply.data;
    scope.postMessage(reply, [
      land.buffer,
      landStart.buffer,
      landDelay.buffer,
      snaps.buffer,
    ]);
  } else {
    scope.postMessage(reply);
  }
};

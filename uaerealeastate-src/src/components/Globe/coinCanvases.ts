/**
 * The traveling coins' texture canvases (TravelingDots): one face per
 * currency, plus the striped rim. Drawn once per page, and normally in
 * idle time ahead of the coins stage (prewarmCoinCanvases) instead of
 * inside its commit.
 */
import { whenIdle } from '../../lib/idle';
import { COLOR_FLOW } from './constants';

/** Currency symbols to mint, distributed across travelers. */
export const CURRENCIES = ['$', '€', '£', '¥', '₹'];

const STRIPES_AROUND = 36;
const OUTLINE = '#272727';
const STROKE = 4; // ≈ 1 screen pixel at our texture resolution

function drawCurrencyGlyph(
  ctx: CanvasRenderingContext2D,
  glyph: string,
  cx: number,
  cy: number,
  size: number,
) {
  const fontSize = Math.round(size * 0.55);
  ctx.font = `900 ${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Filled glyph in pink (matches the coin disc) with a thin outline
  // for a clean "stroke around bold body" look.
  ctx.fillStyle = COLOR_FLOW;
  ctx.fillText(glyph, cx, cy);
  ctx.lineWidth = STROKE;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.strokeText(glyph, cx, cy);
}

function drawFaceCanvas(glyph: string): HTMLCanvasElement {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;

  const r = size / 2;

  // Pink disc body.
  ctx.fillStyle = COLOR_FLOW;
  ctx.beginPath();
  ctx.arc(r, r, r - STROKE / 2, 0, Math.PI * 2);
  ctx.fill();

  // Outer rim outline.
  ctx.lineWidth = STROKE;
  ctx.strokeStyle = OUTLINE;
  ctx.beginPath();
  ctx.arc(r, r, r - STROKE / 2, 0, Math.PI * 2);
  ctx.stroke();

  // Inner ring outline.
  ctx.beginPath();
  ctx.arc(r, r, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();

  drawCurrencyGlyph(ctx, glyph, r, r + size * 0.03, size);
  return c;
}

function drawSideCanvas(): HTMLCanvasElement {
  const w = 1024;
  const h = 64;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = COLOR_FLOW;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = OUTLINE;
  for (let i = 0; i < STRIPES_AROUND; i++) {
    const x = (i / STRIPES_AROUND) * w;
    ctx.fillRect(x, 0, STROKE, h);
  }
  ctx.fillRect(0, 0, w, STROKE);
  ctx.fillRect(0, h - STROKE, w, STROKE);
  return c;
}

const drawn: {
  faces: Array<HTMLCanvasElement | undefined>;
  side?: HTMLCanvasElement;
} = { faces: [] };

/** Face canvas for CURRENCIES[i] (drawn now if it isn't yet). */
export const coinFaceCanvas = (i: number) =>
  (drawn.faces[i] ??= drawFaceCanvas(CURRENCIES[i]));
/** The rim's stripe canvas (drawn now if it isn't yet). */
export const coinSideCanvas = () => (drawn.side ??= drawSideCanvas());

/** Longest each coin canvas waits for an idle period. */
const COIN_CANVAS_IDLE_TIMEOUT_MS = 200;

/**
 * Draws the coin canvases ahead of the coins stage, one canvas per
 * idle callback. Drawn inside the stage's commit, the five currency
 * glyphs alone (900-weight text, filled + stroked) were ~10 ms of that
 * frame at 4× CPU throttle. Whatever isn't drawn by the time the coins
 * mount is drawn then, as before. Returns a cancel function.
 */
export function prewarmCoinCanvases(): () => void {
  const jobs = [
    ...CURRENCIES.map((_, i) => () => coinFaceCanvas(i)),
    coinSideCanvas,
  ];
  let cancel = () => {};
  const next = () => {
    const job = jobs.shift();
    if (!job) return;
    job();
    cancel = whenIdle(next, COIN_CANVAS_IDLE_TIMEOUT_MS);
  };
  cancel = whenIdle(next, COIN_CANVAS_IDLE_TIMEOUT_MS);
  return () => cancel();
}

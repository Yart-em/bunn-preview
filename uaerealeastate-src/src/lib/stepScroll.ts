import type Lenis from 'lenis';
import {
  BUNN_LINE_AFTER_PX,
  HERO_LOCK_TAIL_PX,
  HERO_POST_LOCK_BUFFER_PX,
  ITEM_STACK_DISTANCE_PX,
  STACK_POSITION_PCT,
} from './scrollLayout';

/**
 * Phone scroll model: one idea per swipe.
 *
 * On a phone every swipe moves the page to exactly the next rest
 * position — the globe, the 67.3 % statement, the BUNN line, each
 * how-it-works card, then each section below — with a calm
 * transition, like turning slides. Free scrolling on a small touch
 * screen kept landing between ideas: half a card, the statement
 * mid-dissolve, a section top just off screen.
 *
 *   • The page follows the finger 1:1, but only as far as the
 *     neighbouring rest position on either side.
 *   • On release a flick (or a drag past COMMIT_PX) finishes the
 *     move to that rest; anything less goes back to where the touch
 *     started. A release that was already moving towards the rest
 *     leaves at the finger's speed and only slows down from there.
 *   • A section taller than the screen (the FAQ, once answers are
 *     open) scrolls freely inside and steps at its two ends.
 *   • A swipe that starts during a transition stops it under the
 *     finger and heads for the next rest from there, so fast bursts
 *     of swipes still visit every idea, one per swipe.
 *
 * The rest positions are worked out from the same numbers the
 * choreography itself uses (lib/scrollLayout) and measured live, so
 * lazily mounted sections, an opened FAQ answer or a resize never
 * desync them.
 *
 * Phones only (PHONE_QUERY). Mouse wheels, trackpads and touch
 * tablets keep App.tsx's free scroll with its "ease into focus".
 */

/** Touch-primary AND phone-sized. A touch laptop or a tablet keeps
 *  the free scroll; so does a phone-width desktop window. */
export const PHONE_QUERY = '(pointer: coarse) and (max-width: 600px)';

/* ── Transitions ──
 * A step travels at STEP_SPEED_PX_S, but never in less than
 * STEP_MIN_S or more than STEP_MAX_S: a short hop still reads as a
 * deliberate move, a long one (a tall section) doesn't drag on.
 * The finishing move after a release may be quicker (down to
 * RELEASE_MIN_S): the finger has already covered part of the way. */
const STEP_SPEED_PX_S = 800;
const STEP_MIN_S = 0.8;
const STEP_MAX_S = 1.6;
const RELEASE_MIN_S = 0.45;

/* ── Reading a touch ── */
/** Finger travel before the gesture's axis is decided. A mostly
 *  sideways swipe (the carousel) never moves the page. */
const AXIS_DECIDE_PX = 10;
/** A slow release commits to the next rest after this much travel… */
const COMMIT_PX = 40;
/** …a release at least this fast (px/s) commits regardless. */
const FLING_PX_S = 200;
/** The finger's speed at release is measured over this window… */
const VELOCITY_WINDOW_MS = 100;
/** …and only if it was still moving this recently (a finger that
 *  stopped before lifting has no speed). */
const VELOCITY_STALE_MS = 60;
/** "At" a rest position, give or take rounding. */
const AT_REST_PX = 8;

/* ── Free zones (sections taller than the screen) ──
 * A flick inside one coasts finger speed × ZONE_COAST_TAU_S, at most
 * ZONE_COAST_CAP_VH screens, and never out of the zone; the coast
 * starts at the finger's speed and lasts ZONE_COAST_MIN_S…MAX_S. */
const ZONE_COAST_TAU_S = 0.3;
const ZONE_COAST_CAP_VH = 0.7;
const ZONE_COAST_MIN_S = 0.5;
const ZONE_COAST_MAX_S = 1.5;
/** A section this many screens tall or more scrolls freely inside. */
const TALL_SECTION_VH = 1.15;

/* ── Wheel / keys (a phone with a keyboard or mouse attached) ── */
/** A pause this long in the wheel stream starts a new gesture. */
const WHEEL_GAP_MS = 180;
/** Wheel input is ignored this long after a transition ends, so the
 *  tail of the gesture that started it can't start another. */
const WHEEL_COOLDOWN_MS = 150;
/** Inside a free zone: an arrow key scrolls a line, PageUp/Down and
 *  Space this much of a screen (the browser's own amounts). */
const KEY_LINE_PX = 40;
const KEY_PAGE_VH = 0.875;

/** Two rests closer than this (× viewport height) are one rest. */
const MERGE_VH = 0.2;
/** The rest list is re-measured at most this often (ms). */
const MAP_TTL_MS = 250;

/** Sections below the how-it-works stack, top to bottom. */
const SECTIONS = [
  '.info-section',
  '.logos-section',
  '.carousel-section',
  '.brokers-section',
  '.faq-section',
  '.cityscape-section',
  '.site-footer',
];

interface Rest {
  y: number;
  label: string;
}
/** A tall section's free-scroll range (scroll positions). */
interface Zone {
  start: number;
  end: number;
}
interface RestMap {
  rests: Rest[];
  zones: Zone[];
}

const clamp = (min: number, v: number, max: number) =>
  Math.max(min, Math.min(v, max));

/** Natural document Y, ignoring transforms — the ScrollStack cards
 *  are translated and scaled while they pin (ScrollStack's own walk). */
const docTop = (el: HTMLElement) => {
  let t = 0;
  let e: HTMLElement | null = el;
  while (e) {
    t += e.offsetTop;
    e = e.offsetParent as HTMLElement | null;
  }
  return t;
};

function measureRests(lenis: Lenis): RestMap {
  /* Lenis's own resize observer is debounced; the rests must match
   * the document as it is now (a section may have just mounted). */
  lenis.dimensions.resize();
  const vh = window.innerHeight;
  const cur = lenis.scroll;
  const limit = lenis.limit;
  const q = (s: string) => document.querySelector<HTMLElement>(s);
  const rests: Rest[] = [{ y: 0, label: 'hero' }];
  const zones: Zone[] = [];

  /* Hero choreography (App.tsx recalc): the globe locks once the
   * glass card has left; it holds for the post-lock buffer, then
   * dissolves over one screen (the 67.3 % statement is in by the
   * end), and the BUNN line joins BUNN_LINE_AFTER_PX later. The
   * globe rest sits a little past the lock, so the glass card is
   * fully gone. */
  const card = q('.hero-card');
  if (card) {
    const lock = card.offsetTop + card.offsetHeight + HERO_LOCK_TAIL_PX;
    const dissolved = lock + HERO_POST_LOCK_BUFFER_PX + vh;
    rests.push(
      { y: lock + 60, label: 'globe' },
      { y: dissolved, label: 'statement' },
      { y: dissolved + BUNN_LINE_AFTER_PX, label: 'bunn-line' },
    );
  }

  /* How-it-works: the scroll position at which each card pins. */
  document
    .querySelectorAll<HTMLElement>('.scroll-stack-card')
    .forEach((c, i) =>
      rests.push({
        y:
          docTop(c) -
          (STACK_POSITION_PCT / 100) * vh -
          ITEM_STACK_DISTANCE_PX * i,
        label: `card-${i + 1}`,
      }),
    );

  /* Plain sections: a rest at a section's top, unless the section
   * was already fully on screen at the previous rest. A section
   * taller than the screen becomes a free zone from its top to where
   * its bottom meets the viewport bottom, with a rest at each end. */
  let last = -Infinity;
  for (const sel of SECTIONS) {
    const el = q(sel);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    const top = r.top + cur;
    const bottom = r.bottom + cur;
    if (bottom <= last + vh + 2) continue;
    const y = Math.min(top, limit);
    rests.push({ y, label: sel.slice(1) });
    last = y;
    if (bottom - top > vh * TALL_SECTION_VH) {
      const end = Math.min(bottom - vh, limit);
      if (end - y > 40) {
        zones.push({ start: y, end });
        rests.push({ y: end, label: `${sel.slice(1)}-end` });
        last = end;
      }
    }
  }
  /* While below-fold sections are still mounting, the placeholder
   * holds the page's end open; it is not a place to rest. */
  if (limit > 0 && !q('.below-fold-placeholder'))
    rests.push({ y: limit, label: 'end' });

  for (const s of rests) s.y = Math.round(clamp(0, s.y, limit));
  rests.sort((a, b) => a.y - b.y);
  /* Two rests closer than MERGE_VH of a screen are one rest: keep
   * the later one (so the page end wins over "the cityscape's top,
   * 47 px short of it") — but never move the very top. */
  const merged: Rest[] = [];
  for (const s of rests) {
    const p = merged[merged.length - 1];
    if (p && s.y - p.y < vh * MERGE_VH) {
      if (p.y === 0) continue;
      merged[merged.length - 1] =
        s.label === 'end' ? { y: s.y, label: p.label } : s;
    } else merged.push(s);
  }
  return { rests: merged, zones };
}

const easeInOut = (t: number) => t * t * (3 - 2 * t);
/** Cubic that leaves at slope `s0` (= speed at t = 0 × duration /
 *  distance) and arrives with zero speed. s0 = 0 is a smoothstep,
 *  s0 = 3 a cubic ease-out; anything between starts at exactly the
 *  speed the page already has and never overshoots. */
const easeFrom = (s0: number) => {
  const a = clamp(0, s0, 3);
  return a === 0
    ? easeInOut
    : (t: number) => a * t + (3 - 2 * a) * t * t + (a - 2) * t * t * t;
};

const touchPoint = (e: Event) => {
  const te = e as TouchEvent;
  const t = te.targetTouches?.[0] ?? te.changedTouches?.[0];
  return t ? { x: t.clientX, y: t.clientY } : { x: 0, y: 0 };
};

/** The contact popup locks the page (ContactPopup sets the body's
 *  overflow) while its own panel scrolls natively. */
const popupOpen = () => document.body.style.overflow === 'hidden';

/** Can the popup scroll natively under this touch, `dy` px (+ =
 *  content up)? Only an element inside the panel that has room left
 *  that way. Anything else would scroll the page behind it: the
 *  body's overflow doesn't hold a touch scroll on every browser. */
const popupCanScroll = (target: EventTarget | null, dy: number) => {
  let el = target instanceof Element ? target : null;
  const panel = el?.closest('.contact-panel');
  if (!panel) return false;
  for (; el; el = el.parentElement) {
    const oy = getComputedStyle(el).overflowY;
    if (
      (oy === 'auto' || oy === 'scroll') &&
      el.scrollHeight > el.clientHeight + 1 &&
      (dy > 0
        ? el.scrollTop + el.clientHeight < el.scrollHeight - 1
        : el.scrollTop > 0)
    )
      return true;
    if (el === panel) break;
  }
  return false;
};

interface TouchState {
  x0: number;
  y0: number;
  /** finger Y the page was last moved to match */
  syncY: number;
  axis: 'none' | 'v' | 'h';
  /** the free zone the touch started in, if any */
  zone: Zone | null;
  /** scroll position at touchstart, and the rests on either side */
  start: number;
  lo: number;
  hi: number;
  /** where an interrupted transition was heading */
  pending: number | null;
  track: { t: number; y: number }[];
}

/** Installs the model on the shared Lenis; returns its uninstall. */
export function installStepScroll(lenis: Lenis): () => void {
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  );

  let mapCache: { t: number; map: RestMap } | null = null;
  const restMap = () => {
    const now = performance.now();
    if (!mapCache || now - mapCache.t >= MAP_TTL_MS)
      mapCache = { t: now, map: measureRests(lenis) };
    return mapCache.map;
  };
  const zoneAt = (y: number) =>
    restMap().zones.find((z) => y >= z.start - 2 && y <= z.end + 2) ?? null;

  /* The running transition (null = none), and one more step in the
   * same direction that may wait its turn (keys / wheel). */
  let anim: { to: number; dir: number; id: number } | null = null;
  let animId = 0;
  let queued = 0;
  let wheelQuietUntil = 0;

  /** One transition to a rest position. `quick`: the finishing move
   *  after a release. `v`: the finger's speed at release (px/s, + =
   *  page down) — when it points at the target the move leaves at
   *  that speed and only slows down; otherwise it eases in and out.
   *  With reduced motion the page goes straight there. */
  const animateTo = (y: number, dir: number, quick: boolean, v = 0) => {
    const cur = lenis.scroll;
    const dist = Math.abs(y - cur);
    if (dist < 1) {
      anim = null;
      return;
    }
    const id = ++animId;
    anim = { to: y, dir, id };
    const done = () => {
      if (!anim || anim.id !== id) return;
      anim = null;
      wheelQuietUntil = performance.now() + WHEEL_COOLDOWN_MS;
      if (queued) {
        const d = queued;
        queued = 0;
        step(d);
      }
    };
    if (reducedMotion.matches) {
      lenis.scrollTo(y, { immediate: true, force: true, onComplete: done });
      return;
    }
    const dur = clamp(
      quick ? RELEASE_MIN_S : STEP_MIN_S,
      dist / STEP_SPEED_PX_S,
      STEP_MAX_S,
    );
    const towards = v !== 0 && Math.sign(v) === Math.sign(y - cur);
    lenis.scrollTo(y, {
      duration: dur,
      easing: easeFrom(towards ? (Math.abs(v) * dur) / dist : 0),
      force: true,
      onComplete: done,
    });
  };

  /** Move to the next rest in `dir` from where the page is now. */
  const step = (dir: number) => {
    const { rests } = restMap();
    const cur = lenis.scroll;
    let target: Rest | undefined;
    if (dir > 0) target = rests.find((s) => s.y > cur + AT_REST_PX);
    else
      for (let i = rests.length - 1; i >= 0; i--)
        if (rests[i].y < cur - AT_REST_PX) {
          target = rests[i];
          break;
        }
    if (target) animateTo(target.y, dir, false);
  };

  /** A key / wheel request: during a transition, one more step the
   *  same way waits its turn (wheel tails never queue); the opposite
   *  way turns around at once. */
  const request = (dir: number, fromWheel: boolean) => {
    if (anim) {
      if (dir === anim.dir) {
        if (!fromWheel) queued = dir;
        return;
      }
      queued = 0;
    }
    step(dir);
  };

  let touch: TouchState | null = null;

  /** The finger's speed over its last moments (px/s, + = page down). */
  const releaseSpeed = (t: TouchState, now: number) => {
    const recent = t.track.filter((p) => now - p.t <= VELOCITY_WINDOW_MS);
    if (recent.length < 2) return 0;
    const a = recent[0];
    const b = recent[recent.length - 1];
    if (now - b.t >= VELOCITY_STALE_MS || b.t <= a.t) return 0;
    return ((a.y - b.y) / (b.t - a.t)) * 1000;
  };

  const release = (t: TouchState, v: number) => {
    lenis.isTouching = false;
    if (t.axis === 'h') {
      /* Sideways (or a pinch): the page never moved — but a
       * transition this touch stopped still has to arrive, or the
       * page would rest between two ideas. */
      if (t.pending != null)
        animateTo(t.pending, Math.sign(t.pending - lenis.scroll), true);
      return;
    }
    if (t.zone) {
      /* Inside a free zone: a bounded coast that stays in the zone;
       * a slow release just leaves the page where the finger did. */
      const z = t.zone;
      if (Math.abs(v) < FLING_PX_S) return;
      const cur = lenis.scroll;
      const coast = Math.min(
        Math.abs(v) * ZONE_COAST_TAU_S,
        ZONE_COAST_CAP_VH * window.innerHeight,
      );
      const landing = clamp(
        z.start,
        lenis.targetScroll + Math.sign(v) * coast,
        z.end,
      );
      const dist = Math.abs(landing - cur);
      if (dist < 1) return;
      const dur = clamp(
        ZONE_COAST_MIN_S,
        (3 * dist) / Math.abs(v),
        ZONE_COAST_MAX_S,
      );
      lenis.scrollTo(landing, {
        programmatic: false,
        duration: dur,
        easing: easeFrom((Math.abs(v) * dur) / dist),
        ...(reducedMotion.matches ? { immediate: true } : {}),
      });
      return;
    }
    const moved = lenis.targetScroll - t.start;
    let dir = 0;
    if (Math.abs(v) >= FLING_PX_S) dir = Math.sign(v);
    else if (Math.abs(moved) >= COMMIT_PX) dir = Math.sign(moved);
    if (dir > 0 && t.hi > t.start + AT_REST_PX) animateTo(t.hi, 1, true, v);
    else if (dir < 0 && t.lo < t.start - AT_REST_PX)
      animateTo(t.lo, -1, true, v);
    else {
      /* Not a swipe (a tap, or a few px): finish the transition the
       * touch interrupted, or go back to the rest it started on. */
      let back = t.pending;
      if (back == null) {
        const { rests } = restMap();
        let best = rests[0];
        for (const s of rests)
          if (Math.abs(s.y - t.start) < Math.abs(best.y - t.start)) best = s;
        back = Math.abs(best.y - t.start) <= AT_REST_PX ? best.y : null;
      }
      if (back != null)
        animateTo(back, Math.sign(back - lenis.scroll), true);
    }
  };

  const onTouchStart = (e: Event) => {
    const { rests } = restMap();
    const cur = lenis.scroll;
    const zone = anim ? null : zoneAt(cur);
    let lo = 0;
    for (const s of rests) if (s.y < cur - AT_REST_PX) lo = s.y;
    const next = rests.find((s) => s.y > cur + AT_REST_PX);
    const p = touchPoint(e);
    touch = {
      x0: p.x,
      y0: p.y,
      syncY: p.y,
      axis: 'none',
      zone,
      start: cur,
      lo,
      hi: next ? next.y : cur,
      pending: anim ? anim.to : null,
      track: [{ t: e.timeStamp, y: p.y }],
    };
    /* The finger takes over: Lenis stops a running transition under
     * it (returning true lets its touchstart reset run). */
    anim = null;
    queued = 0;
    return true;
  };

  /** Returns the page delta this move may apply, or null to swallow
   *  the event (the page stays put). */
  const onTouchMove = (e: Event): number | null => {
    const t = touch;
    if (!t) return null;
    const p = touchPoint(e);
    t.track.push({ t: e.timeStamp, y: p.y });
    if (t.track.length > 24) t.track.shift();

    if (t.axis === 'none') {
      const dx = Math.abs(p.x - t.x0);
      const dy = Math.abs(p.y - t.y0);
      if (Math.max(dx, dy) < AXIS_DECIDE_PX) return null;
      t.axis = dx > dy ? 'h' : 'v';
      /* A touch that starts AT a free zone's edge and pushes outward
       * is a step, not a scroll inside the zone. */
      if (t.axis === 'v' && t.zone) {
        const out = t.y0 - p.y; // > 0: finger up, page down
        const s = lenis.targetScroll;
        if (
          (out > 0 && s >= t.zone.end - 2) ||
          (out < 0 && s <= t.zone.start + 2)
        ) {
          t.zone = null;
          t.start = lenis.scroll;
        }
      }
    }
    if (t.axis === 'h') return null;

    /* 1:1 with the finger (the gesture's first AXIS_DECIDE_PX
     * included), never past the neighbouring rest or out of the
     * zone. */
    const want = t.syncY - p.y;
    t.syncY = p.y;
    const [min, max] = t.zone ? [t.zone.start, t.zone.end] : [t.lo, t.hi];
    const s = lenis.targetScroll;
    const d = clamp(min, s + want, max) - s;
    return Math.abs(d) < 0.01 ? null : d;
  };

  let lastWheelT = 0;
  let lastWheelAbs = 0;
  const onWheel = (e: WheelEvent, dy: number) => {
    const abs = Math.abs(dy);
    const now = performance.now();
    /* A new gesture = a pause, a clearly growing delta (fingers back
     * on a trackpad), or the steady notches of a mouse wheel — not
     * the decaying tail a trackpad keeps sending after a swipe. */
    const fresh =
      now - lastWheelT > WHEEL_GAP_MS ||
      abs > lastWheelAbs * 1.15 + 2 ||
      (abs >= 50 && abs >= lastWheelAbs);
    lastWheelT = now;
    lastWheelAbs = abs;
    if (!anim) {
      const z = zoneAt(lenis.targetScroll);
      if (z) {
        const s = lenis.targetScroll;
        const outward = (dy > 0 && s >= z.end - 2) || (dy < 0 && s <= z.start + 2);
        if (!outward) {
          const d = clamp(z.start, s + dy, z.end) - s;
          return Math.abs(d) < 0.01 ? null : d; // Lenis's smooth wheel, inside the zone
        }
      }
    }
    if (abs >= 4 && !anim && now >= wheelQuietUntil && fresh)
      request(dy > 0 ? 1 : -1, true);
    if (e.cancelable) e.preventDefault();
    return null;
  };

  let popupY = 0;
  lenis.options.virtualScroll = (data) => {
    const e = data.event as Event;
    if (popupOpen()) {
      /* No stepping: the form scrolls natively, the page behind
       * stays put. */
      touch = null;
      const y = e.type.startsWith('touch') ? touchPoint(e).y : 0;
      if (e.type === 'touchmove' || e.type === 'wheel') {
        const dy = e.type === 'wheel' ? data.deltaY : popupY - y;
        if (e.cancelable && !popupCanScroll(e.target, dy)) e.preventDefault();
      }
      popupY = y;
      return false;
    }
    /* Pinch-zoom stays the browser's (low vision): a second finger
     * hands the gesture over untouched — the page itself doesn't
     * step, and on release it goes back to where the touch started
     * (or on to where an interrupted transition was heading). While
     * the page is zoomed in, one finger pans the zoomed view natively
     * too; stepping resumes once it is zoomed back out. */
    if (e.type === 'touchstart' || e.type === 'touchmove') {
      const multi = ((e as TouchEvent).touches?.length ?? 1) > 1;
      if (multi || (window.visualViewport?.scale ?? 1) > 1.01) {
        if (touch && multi) {
          if (
            touch.pending == null &&
            Math.abs(lenis.targetScroll - touch.start) > 1
          )
            touch.pending = touch.start;
          touch.axis = 'h';
        } else if (!multi) touch = null;
        return false;
      }
    }
    let d: number | null;
    switch (e.type) {
      case 'touchstart':
        return onTouchStart(e);
      case 'touchmove':
        d = onTouchMove(e);
        break;
      case 'touchend': {
        const t = touch;
        touch = null;
        if (t) release(t, releaseSpeed(t, e.timeStamp));
        else lenis.isTouching = false;
        return false;
      }
      case 'wheel':
        if ((e as WheelEvent).ctrlKey) return true; // pinch-zoom
        d = onWheel(e as WheelEvent, data.deltaY);
        break;
      default:
        return true;
    }
    if (d == null) {
      if (e.cancelable) e.preventDefault();
      return false;
    }
    data.deltaX = 0;
    data.deltaY = d;
    return true;
  };

  /* Lenis listens for touchend only; a cancelled touch (the system
   * took the gesture over) still has to come to rest. */
  const onTouchCancel = () => {
    const t = touch;
    touch = null;
    if (t) release(t, 0);
  };
  window.addEventListener('touchcancel', onTouchCancel, { passive: true });

  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || popupOpen())
      return;
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))
      return;
    const onControl = !!t && /^(BUTTON|A)$/.test(t.tagName);
    let dir = 0;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') dir = 1;
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') dir = -1;
    else if (e.key === ' ' && !onControl) dir = e.shiftKey ? -1 : 1;
    else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      queued = 0;
      const home = e.key === 'Home';
      animateTo(home ? 0 : lenis.limit, home ? -1 : 1, false);
      return;
    }
    if (!dir) return;
    if (!anim) {
      /* Inside a free zone the keys scroll by their usual amounts —
       * an arrow a line, PageUp/Down and Space most of a screen — but
       * never out of the zone (the browser's own scroll would cross
       * its edge and stop between two ideas); at the edge they step. */
      const z = zoneAt(lenis.targetScroll);
      const cur = lenis.targetScroll;
      if (z && !((dir > 0 && cur >= z.end - 2) || (dir < 0 && cur <= z.start + 2))) {
        e.preventDefault();
        const by = e.key.startsWith('Arrow') ? KEY_LINE_PX : KEY_PAGE_VH * window.innerHeight;
        lenis.scrollTo(clamp(z.start, cur + dir * by, z.end), {
          programmatic: false,
          ...(reducedMotion.matches
            ? { immediate: true }
            : {
                lerp: lenis.options.lerp,
                duration: lenis.options.duration,
                easing: lenis.options.easing,
              }),
        });
        return;
      }
    }
    e.preventDefault();
    request(dir, false);
  };
  window.addEventListener('keydown', onKey);

  return () => {
    lenis.options.virtualScroll = undefined;
    window.removeEventListener('touchcancel', onTouchCancel);
    window.removeEventListener('keydown', onKey);
    /* A transition still running finishes on its own; nothing
     * chains from it any more. */
    anim = null;
    queued = 0;
    touch = null;
  };
}

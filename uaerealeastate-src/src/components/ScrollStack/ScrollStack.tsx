/* eslint-disable react-hooks/exhaustive-deps */
/**
 * ScrollStack — port of the React Bits recipe.
 *
 * Each child <ScrollStackItem> becomes a card that pins to a
 * vertical position in the viewport as the user scrolls, then
 * subsequent cards slide up and stack on top of it. Cards
 * shrink slightly (controlled by `baseScale` + `itemScale`)
 * the deeper they go in the stack.
 *
 * Adapted from the recipe (TypeScript, `useWindowScroll`
 * defaulted to true so the stack works as part of the main
 * document scroll rather than its own scroll container).
 */
import {
  useLayoutEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import Lenis from 'lenis';
import { getLenis } from '../../lib/lenis';
import GlassSurface from '../GlassSurface/GlassSurface';
import './ScrollStack.css';

interface ScrollStackItemProps {
  children: ReactNode;
  itemClassName?: string;
}

/**
 * Each card IS a <GlassSurface /> directly — not a wrapper
 * containing one — so the same element carries both the
 * backdrop-root-creating transform (set by ScrollStack's JS)
 * AND the backdrop-filter. That way the glass's backdrop-
 * filter samples its PARENT (the page / section behind), not
 * its own descendants. With GlassSurface nested inside an
 * outer .scroll-stack-card the filter would sample only the
 * empty inside of the card and render no visible glass.
 */
export const ScrollStackItem = ({
  children,
  itemClassName = '',
}: ScrollStackItemProps) => (
  <GlassSurface
    className={`scroll-stack-card ${itemClassName}`.trim()}
    width="100%"
    height={640}
    borderRadius={40}
    simple
  >
    {children}
  </GlassSurface>
);

interface ScrollStackProps {
  children: ReactNode;
  className?: string;
  itemDistance?: number;
  itemScale?: number;
  itemStackDistance?: number;
  stackPosition?: string;
  scaleEndPosition?: string;
  baseScale?: number;
  scaleDuration?: number;
  rotationAmount?: number;
  blurAmount?: number;
  useWindowScroll?: boolean;
  onStackComplete?: () => void;
  /** Pixels of scroll AFTER all cards are stacked before they
   *  fly away in different directions. `undefined` = no fly-away. */
  flyAwayAfter?: number;
  /** Pixels of scroll over which the fly-away completes (default 600). */
  flyAwaySpan?: number;
  /** When true the LAST card stays pinned while the others fly away. */
  flyAwayExcludeLast?: boolean;
}

interface CardTransform {
  translateX: number;
  translateY: number;
  scale: number;
  rotation: number;
  blur: number;
  opacity: number;
}

const ScrollStack = ({
  children,
  className = '',
  itemDistance = 100,
  itemScale = 0.03,
  itemStackDistance = 30,
  stackPosition = '20%',
  scaleEndPosition = '10%',
  baseScale = 0.85,
  rotationAmount = 0,
  blurAmount = 0,
  useWindowScroll = true,
  onStackComplete,
  flyAwayAfter,
  flyAwaySpan = 600,
  flyAwayExcludeLast = false,
}: ScrollStackProps) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const stackCompletedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const cardsRef = useRef<HTMLElement[]>([]);
  const lastTransformsRef = useRef<Map<number, CardTransform>>(new Map());
  const isUpdatingRef = useRef(false);

  const calculateProgress = useCallback(
    (scrollTop: number, start: number, end: number) => {
      if (scrollTop < start) return 0;
      if (scrollTop > end) return 1;
      return (scrollTop - start) / (end - start);
    },
    [],
  );

  const parsePercentage = useCallback(
    (value: string | number, containerHeight: number) => {
      if (typeof value === 'string' && value.includes('%')) {
        return (parseFloat(value) / 100) * containerHeight;
      }
      return typeof value === 'number' ? value : parseFloat(value);
    },
    [],
  );

  const getScrollData = useCallback(() => {
    if (useWindowScroll) {
      return {
        scrollTop: window.scrollY,
        containerHeight: window.innerHeight,
        scrollContainer: document.documentElement,
      };
    }
    const scroller = scrollerRef.current!;
    return {
      scrollTop: scroller.scrollTop,
      containerHeight: scroller.clientHeight,
      scrollContainer: scroller,
    };
  }, [useWindowScroll]);

  const getElementOffset = useCallback(
    (element: HTMLElement) => {
      if (useWindowScroll) {
        /* Walk the offsetParent chain to get the element's
         * natural document-Y WITHOUT CSS transforms. Using
         * getBoundingClientRect would include the card's own
         * translateY from the previous frame, creating a
         * feedback loop that makes pinned cards oscillate
         * instead of holding steady at their pin position. */
        let top = 0;
        let el: HTMLElement | null = element;
        while (el) {
          top += el.offsetTop;
          el = el.offsetParent as HTMLElement | null;
        }
        return top;
      }
      return element.offsetTop;
    },
    [useWindowScroll],
  );

  const updateCardTransforms = useCallback(() => {
    if (!cardsRef.current.length || isUpdatingRef.current) return;

    isUpdatingRef.current = true;

    const { scrollTop, containerHeight } = getScrollData();
    const stackPositionPx = parsePercentage(stackPosition, containerHeight);
    const scaleEndPositionPx = parsePercentage(
      scaleEndPosition,
      containerHeight,
    );

    const endElement = useWindowScroll
      ? (document.querySelector('.scroll-stack-end') as HTMLElement | null)
      : (scrollerRef.current?.querySelector(
          '.scroll-stack-end',
        ) as HTMLElement | null);

    const endElementTop = endElement ? getElementOffset(endElement) : 0;

    const totalCards = cardsRef.current.length;
    const flyingCards = flyAwayExcludeLast ? totalCards - 1 : totalCards;
    const midIndex = (flyingCards - 1) / 2;

    cardsRef.current.forEach((card, i) => {
      if (!card) return;

      const cardTop = getElementOffset(card);
      const triggerStart = cardTop - stackPositionPx - itemStackDistance * i;
      const triggerEnd = cardTop - scaleEndPositionPx;
      const pinStart = cardTop - stackPositionPx - itemStackDistance * i;
      const pinEnd = endElementTop - containerHeight / 2;

      /* When fly-away is enabled the cards stay pinned for an
       * extra flyAwayAfter pixels past the natural pinEnd so
       * the stack holds while the user keeps scrolling.
       *
       * When flyAwayExcludeLast is true, fly-away starts the
       * moment the LAST card first enters the viewport (its
       * top edge hits the bottom of the screen). This way the
       * first N−1 cards scatter as the Nth card slides in. */
      let effectivePinEnd = pinEnd;
      if (flyAwayAfter != null) {
        if (flyAwayExcludeLast && totalCards > 1) {
          const lastCard = cardsRef.current[totalCards - 1];
          const lastCardTop = lastCard ? getElementOffset(lastCard) : cardTop;
          /* The last card enters the viewport when scrollTop
           * reaches lastCardTop − containerHeight. */
          const lastCardAppears = lastCardTop - containerHeight;
          effectivePinEnd = Math.max(pinEnd, lastCardAppears);
        } else {
          effectivePinEnd = pinEnd + flyAwayAfter;
        }
      }

      const scaleProgress = calculateProgress(
        scrollTop,
        triggerStart,
        triggerEnd,
      );
      const targetScale = baseScale + i * itemScale;
      const scale = 1 - scaleProgress * (1 - targetScale);
      const rotation = rotationAmount
        ? i * rotationAmount * scaleProgress
        : 0;

      let blur = 0;
      if (blurAmount) {
        let topCardIndex = 0;
        for (let j = 0; j < cardsRef.current.length; j++) {
          const jCardTop = getElementOffset(cardsRef.current[j]);
          const jTriggerStart =
            jCardTop - stackPositionPx - itemStackDistance * j;
          if (scrollTop >= jTriggerStart) {
            topCardIndex = j;
          }
        }

        if (i < topCardIndex) {
          const depthInStack = topCardIndex - i;
          blur = Math.max(0, depthInStack * blurAmount);
        }
      }

      let translateX = 0;
      let translateY = 0;
      let flyRotation = 0;
      let flyOpacity = 1;

      const isPinned =
        scrollTop >= pinStart && scrollTop <= effectivePinEnd;

      if (isPinned) {
        translateY =
          scrollTop - cardTop + stackPositionPx + itemStackDistance * i;
      } else if (scrollTop > effectivePinEnd) {
        if (flyAwayAfter != null) {
          if (flyAwayExcludeLast && i === totalCards - 1) {
            /* ── Excluded last card — stays pinned ──────────── */
            translateY =
              effectivePinEnd -
              cardTop +
              stackPositionPx +
              itemStackDistance * i;
          } else {
            /* ── Fly-away phase ─────────────────────────────────
             * Cards hold their stacked position and add
             * directional translation + rotation so they scatter
             * outward. The rotation angle doubles as a "heading"
             * from straight-up: sin(heading) → horizontal,
             * cos(heading) → vertical.
             *
             * Card 0 (first)  → rotates RIGHT (+45 °), flies →
             * Card N (last)   → rotates LEFT  (−45 °), flies ←
             * Middle card     → 0 ° rotation,  flies straight ↑
             */
            translateY =
              effectivePinEnd -
              cardTop +
              stackPositionPx +
              itemStackDistance * i;

            const flyProgress = Math.min(
              1,
              (scrollTop - effectivePinEnd) / flyAwaySpan,
            );
            /* Ease-out quad — fast launch, gentle tail. */
            const ep = 1 - (1 - flyProgress) * (1 - flyProgress);

            /* normalizedPos: −1 (first) → 0 (middle) → +1 (last) */
            const normalizedPos =
              flyingCards > 1 ? (i - midIndex) / midIndex : 0;

            const maxRot = 45;
            flyRotation = -normalizedPos * maxRot * ep;

            const headingRad =
              (-normalizedPos * maxRot * Math.PI) / 180;
            const flyDist = containerHeight * 1.5;
            translateX = Math.sin(headingRad) * flyDist * ep;
            translateY += -Math.cos(headingRad) * flyDist * ep;

            flyOpacity = Math.max(0, 1 - ep * 1.4);
          }
        } else {
          /* Normal unpin — card resumes document flow. */
          translateY =
            pinEnd -
            cardTop +
            stackPositionPx +
            itemStackDistance * i;
        }
      }

      const newTransform: CardTransform = {
        translateX: Math.round(translateX * 100) / 100,
        translateY: Math.round(translateY * 100) / 100,
        scale: Math.round(scale * 1000) / 1000,
        rotation: Math.round((rotation + flyRotation) * 100) / 100,
        blur: Math.round(blur * 100) / 100,
        opacity: Math.round(flyOpacity * 1000) / 1000,
      };

      const lastTransform = lastTransformsRef.current.get(i);
      const hasChanged =
        !lastTransform ||
        Math.abs(lastTransform.translateX - newTransform.translateX) >
          0.1 ||
        Math.abs(lastTransform.translateY - newTransform.translateY) >
          0.1 ||
        Math.abs(lastTransform.scale - newTransform.scale) > 0.001 ||
        Math.abs(lastTransform.rotation - newTransform.rotation) >
          0.1 ||
        Math.abs(lastTransform.blur - newTransform.blur) > 0.1 ||
        Math.abs(lastTransform.opacity - newTransform.opacity) > 0.01;

      if (hasChanged) {
        const transform = `translate3d(${newTransform.translateX}px, ${newTransform.translateY}px, 0) scale(${newTransform.scale}) rotate(${newTransform.rotation}deg)`;
        const filter =
          newTransform.blur > 0 ? `blur(${newTransform.blur}px)` : '';

        card.style.transform = transform;
        card.style.filter = filter;
        card.style.opacity =
          newTransform.opacity < 1 ? `${newTransform.opacity}` : '';

        lastTransformsRef.current.set(i, newTransform);
      }

      if (i === totalCards - 1) {
        const isInView =
          scrollTop >= pinStart && scrollTop <= effectivePinEnd;
        if (isInView && !stackCompletedRef.current) {
          stackCompletedRef.current = true;
          onStackComplete?.();
        } else if (!isInView && stackCompletedRef.current) {
          stackCompletedRef.current = false;
        }
      }
    });

    isUpdatingRef.current = false;
  }, [
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    rotationAmount,
    blurAmount,
    useWindowScroll,
    onStackComplete,
    flyAwayAfter,
    flyAwaySpan,
    flyAwayExcludeLast,
    calculateProgress,
    parsePercentage,
    getScrollData,
    getElementOffset,
  ]);

  const handleScroll = useCallback(() => {
    updateCardTransforms();
  }, [updateCardTransforms]);

  const setupLenis = useCallback(() => {
    if (useWindowScroll) {
      /* Use the shared app-wide Lenis (it owns its own rAF loop and
       * lives for the app lifetime) instead of creating a second
       * window-level instance — App also attaches the snap addon to
       * this same instance. We only subscribe to its scroll events. */
      const lenis = getLenis();
      lenis.on('scroll', handleScroll);
      lenisRef.current = lenis;
      return lenis;
    }

    const scroller = scrollerRef.current;
    if (!scroller) return;

    const lenis = new Lenis({
      wrapper: scroller,
      content: scroller.querySelector('.scroll-stack-inner') as HTMLElement,
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
      infinite: false,
      wheelMultiplier: 1,
      lerp: 0.1,
      syncTouch: true,
      syncTouchLerp: 0.075,
    });

    lenis.on('scroll', handleScroll);

    const raf = (time: number) => {
      lenis.raf(time);
      animationFrameRef.current = requestAnimationFrame(raf);
    };
    animationFrameRef.current = requestAnimationFrame(raf);

    lenisRef.current = lenis;
    return lenis;
  }, [handleScroll, useWindowScroll]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const cards = Array.from(
      useWindowScroll
        ? document.querySelectorAll<HTMLElement>('.scroll-stack-card')
        : scroller.querySelectorAll<HTMLElement>('.scroll-stack-card'),
    );

    cardsRef.current = cards;
    const transformsCache = lastTransformsRef.current;

    cards.forEach((card, i) => {
      if (i < cards.length - 1) {
        card.style.marginBottom = `${itemDistance}px`;
      }
      card.style.willChange = 'transform, filter, opacity';
      card.style.transformOrigin = 'top center';
      card.style.backfaceVisibility = 'hidden';
      card.style.transform = 'translateZ(0)';
      card.style.setProperty('-webkit-transform', 'translateZ(0)');
      card.style.perspective = '1000px';
      card.style.setProperty('-webkit-perspective', '1000px');
    });

    /* When fly-away is enabled, extend the inner's bottom
     * padding so there's enough scroll room for the buffer
     * + the full fly-away animation to play out. */
    if (flyAwayAfter != null) {
      const inner = scroller.querySelector(
        '.scroll-stack-inner',
      ) as HTMLElement | null;
      if (inner) {
        if (flyAwayExcludeLast) {
          /* The last card stays pinned — only need enough
           * scroll room for the fly-away span so cards 0–N-1
           * finish scattering. No 50 vh cushion needed. */
          inner.style.paddingBottom = `${flyAwaySpan - 100}px`;
        } else {
          inner.style.paddingBottom = `calc(50vh + ${flyAwayAfter}px)`;
        }
      }
    }

    setupLenis();

    updateCardTransforms();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (lenisRef.current) {
        // The window-scroll Lenis is the SHARED app instance — only
        // unsubscribe, never destroy it (that would kill the page's
        // smooth scroll + snap). A container instance is ours to kill.
        lenisRef.current.off('scroll', handleScroll);
        if (!useWindowScroll) lenisRef.current.destroy();
      }
      stackCompletedRef.current = false;
      cardsRef.current = [];
      transformsCache.clear();
      isUpdatingRef.current = false;
    };
  }, [
    itemDistance,
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    rotationAmount,
    blurAmount,
    useWindowScroll,
    onStackComplete,
    flyAwayAfter,
    flyAwaySpan,
    flyAwayExcludeLast,
    setupLenis,
    updateCardTransforms,
  ]);

  return (
    <div
      className={`scroll-stack-scroller ${className}`.trim()}
      ref={scrollerRef}
    >
      <div className="scroll-stack-inner">
        {children}
        {/* Spacer so the last pin can release cleanly */}
        <div className="scroll-stack-end" />
      </div>
    </div>
  );
};

export default ScrollStack;

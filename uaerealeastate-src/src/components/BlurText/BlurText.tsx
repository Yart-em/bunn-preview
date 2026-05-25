/* eslint-disable react-hooks/exhaustive-deps */
import { motion, type Transition } from 'motion/react';
import { useEffect, useRef, useState, useMemo, type ElementType, type RefObject } from 'react';

type Snapshot = Record<string, number | string>;

const buildKeyframes = (from: Snapshot, steps: Snapshot[]) => {
  const keys = new Set<string>([...Object.keys(from), ...steps.flatMap((s) => Object.keys(s))]);
  const keyframes: Record<string, Array<number | string>> = {};
  keys.forEach((k) => {
    const seq: Array<number | string> = [];
    const fromVal = from[k];
    if (fromVal !== undefined) seq.push(fromVal);
    steps.forEach((s) => {
      const v = s[k];
      if (v !== undefined) seq.push(v);
    });
    keyframes[k] = seq;
  });
  return keyframes;
};

export type BlurTextProps = {
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
  animationFrom?: Snapshot;
  animationTo?: Snapshot[];
  easing?: (t: number) => number;
  onAnimationComplete?: () => void;
  stepDuration?: number;
  /** Optional wrapping element. Defaults to a <p> like the canonical source. */
  as?: ElementType;
  /** Seconds to wait before word 0 starts animating. Adds to the
   *  per-word stagger so multiple BlurText instances can be
   *  sequenced (e.g. start card text after heading completes). */
  initialDelay?: number;
  /** Manual trigger — when defined, overrides the internal
   *  IntersectionObserver. Useful when the host element lives
   *  in a context where IO callbacks don't fire reliably
   *  (preview iframes, deferred-render trees) and a parent has
   *  already decided the text should be revealed. */
  triggerInView?: boolean;
};

const BlurText = ({
  text = '',
  delay = 200,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  easing = (t) => t,
  onAnimationComplete,
  stepDuration = 0.35,
  as: Tag = 'p',
  initialDelay = 0,
  triggerInView,
}: BlurTextProps) => {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');
  const [ioInView, setIoInView] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    /* Skip the observer when the parent is driving the trigger
     * — the prop is the source of truth in that case. */
    if (triggerInView !== undefined) return;
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIoInView(true);
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerInView]);

  /* External prop wins when provided. */
  const inView = triggerInView !== undefined ? triggerInView : ioInView;

  const defaultFrom = useMemo<Snapshot>(
    () =>
      direction === 'top'
        ? { filter: 'blur(10px)', opacity: 0, y: -50 }
        : { filter: 'blur(10px)', opacity: 0, y: 50 },
    [direction],
  );

  const defaultTo = useMemo<Snapshot[]>(
    () => [
      {
        filter: 'blur(5px)',
        opacity: 0.5,
        y: direction === 'top' ? 5 : -5,
      },
      { filter: 'blur(0px)', opacity: 1, y: 0 },
    ],
    [direction],
  );

  const fromSnapshot = animationFrom ?? defaultFrom;
  const toSnapshots = animationTo ?? defaultTo;

  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, i) =>
    stepCount === 1 ? 0 : i / (stepCount - 1),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Wrapper = Tag as any;

  return (
    <Wrapper
      ref={ref as RefObject<HTMLElement>}
      className={className}
      style={{ display: 'flex', flexWrap: 'wrap' }}
    >
      {elements.map((segment, index) => {
        const animateKeyframes = buildKeyframes(fromSnapshot, toSnapshots);

        const spanTransition: Transition = {
          duration: totalDuration,
          times,
          delay: initialDelay + (index * delay) / 1000,
          ease: easing,
        };

        return (
          <motion.span
            className="inline-block will-change-[transform,filter,opacity]"
            key={index}
            initial={fromSnapshot}
            animate={inView ? animateKeyframes : fromSnapshot}
            transition={spanTransition}
            onAnimationComplete={
              index === elements.length - 1 ? onAnimationComplete : undefined
            }
          >
            {segment === ' ' ? ' ' : segment}
            {animateBy === 'words' && index < elements.length - 1 && ' '}
          </motion.span>
        );
      })}
    </Wrapper>
  );
};

export default BlurText;

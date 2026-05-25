/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Per-character stagger reveal. Each word's letters start
 * from a hidden offset (y: 100% by default) and animate to
 * their resting position. The stagger is applied at the
 * WORD level so all letters within a single word fire
 * together; consecutive words enter staggerChildren ms apart.
 *
 * Adapted from the kokonutui StaggerText recipe — replaced
 * Tailwind utility classes with inline styles (this project
 * doesn't use Tailwind) and added an optional `play` prop so
 * a parent can drive the trigger externally instead of
 * relying on the built-in IntersectionObserver.
 */
import * as React from 'react';
import {
  type HTMLMotionProps,
  type Transition,
  motion,
  useInView,
} from 'motion/react';

const easeTransitions = {
  default: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

export type TransformDirectionType =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'z';

export const transformVariants = (direction?: TransformDirectionType) => ({
  hidden: {
    x: direction === 'left' ? '-100%' : direction === 'right' ? '100%' : 0,
    y: direction === 'top' ? '-100%' : direction === 'bottom' ? '100%' : 0,
    scale: direction === 'z' ? 0 : 1,
    opacity: 0,
  },
  visible: {
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
  },
});

interface WordProps {
  word: string;
  transition?: Transition;
  direction?: TransformDirectionType;
}

const transitionConfig: Transition = {
  ease: easeTransitions.default,
  duration: 0.5,
};

function Word({
  word,
  transition = transitionConfig,
  direction = 'bottom',
}: WordProps) {
  const characters = word.split('');
  return (
    <span
      style={{
        display: 'inline-block',
        whiteSpace: 'nowrap',
        verticalAlign: 'top',
      }}
    >
      {characters.map((char, index) => (
        <span key={index} style={{ display: 'inline-block' }}>
          <motion.span
            style={{ display: 'inline-block' }}
            variants={transformVariants(direction)}
            transition={transition}
          >
            {char}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

interface StaggerTextProps extends HTMLMotionProps<'div'> {
  text: string;
  stagger?: number;
  transition?: Transition;
  direction?: TransformDirectionType;
  className?: string;
  /** External play override. When defined the internal
   *  IntersectionObserver is ignored and this prop drives
   *  the `hidden` ↔ `visible` variant switch directly. */
  play?: boolean;
}

function StaggerText({
  text,
  stagger = 0.05,
  transition,
  direction,
  className,
  play,
  style,
  ...props
}: StaggerTextProps) {
  const words = text.split(' ');
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const active = play !== undefined ? play : isInView;

  return (
    <motion.div
      ref={ref}
      transition={{ staggerChildren: stagger }}
      initial="hidden"
      animate={active ? 'visible' : 'hidden'}
      className={className}
      style={{ position: 'relative', ...style }}
      {...props}
    >
      {words.map((word, index) => (
        <React.Fragment key={index}>
          <Word transition={transition} direction={direction} word={word} />
          {index < words.length - 1 && ' '}
        </React.Fragment>
      ))}
    </motion.div>
  );
}

export { StaggerText };

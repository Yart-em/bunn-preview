import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import './GlareHover.css';

/**
 * GlareHover — React Bits port (JS+CSS variant).
 *
 * Renders a container whose `::before` carries a diagonal
 * highlight gradient. On hover, the gradient's
 * background-position sweeps from one corner of the
 * container to the opposite corner, producing a glare-sweep
 * effect across whatever sits inside.
 */

export type GlareHoverProps = {
  width?: string;
  height?: string;
  background?: string;
  borderRadius?: string;
  borderColor?: string;
  children?: ReactNode;
  glareColor?: string;
  glareOpacity?: number;
  glareAngle?: number;
  glareSize?: number;
  transitionDuration?: number;
  playOnce?: boolean;
  className?: string;
  style?: CSSProperties;
  /** When set, the glare sweeps automatically on this
   *  interval (ms) — hover triggering is disabled. */
  autoInterval?: number;
};

const GlareHover = ({
  width = '500px',
  height = '500px',
  background = '#000',
  borderRadius = '10px',
  borderColor = '#333',
  children,
  glareColor = '#ffffff',
  glareOpacity = 0.5,
  glareAngle = -45,
  glareSize = 250,
  transitionDuration = 650,
  playOnce = false,
  className = '',
  style = {},
  autoInterval,
}: GlareHoverProps) => {
  const ref = useRef<HTMLDivElement>(null);

  /* Auto-trigger: fire the sweep on a timer instead of on
   * hover. Each cycle adds `.glare-hover--sweeping` to drive
   * the gradient to the end position (using the same
   * transition as hover), waits for the transition to
   * finish, then snaps the gradient back to the start with
   * transitions disabled (`.glare-hover--no-transition`).
   * That avoids a visible reverse sweep that would otherwise
   * play out when we remove the class. */
  useEffect(() => {
    if (!autoInterval || !ref.current) return;
    const el = ref.current;
    let resetT: number | undefined;
    const fire = () => {
      el.classList.add('glare-hover--sweeping');
      resetT = window.setTimeout(() => {
        el.classList.add('glare-hover--no-transition');
        el.classList.remove('glare-hover--sweeping');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.classList.remove('glare-hover--no-transition');
          });
        });
      }, transitionDuration);
    };
    fire();
    const id = window.setInterval(fire, autoInterval);
    return () => {
      window.clearInterval(id);
      if (resetT !== undefined) window.clearTimeout(resetT);
    };
  }, [autoInterval, transitionDuration]);
  const hex = glareColor.replace('#', '');
  let rgba = glareColor;
  if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    rgba = `rgba(${r}, ${g}, ${b}, ${glareOpacity})`;
  } else if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    rgba = `rgba(${r}, ${g}, ${b}, ${glareOpacity})`;
  }

  const vars: Record<string, string> = {
    '--gh-width': width,
    '--gh-height': height,
    '--gh-bg': background,
    '--gh-br': borderRadius,
    '--gh-angle': `${glareAngle}deg`,
    '--gh-duration': `${transitionDuration}ms`,
    '--gh-size': `${glareSize}%`,
    '--gh-rgba': rgba,
    '--gh-border': borderColor,
  };

  return (
    <div
      ref={ref}
      className={`glare-hover ${playOnce ? 'glare-hover--play-once' : ''} ${
        autoInterval ? 'glare-hover--auto' : ''
      } ${className}`}
      style={{ ...(vars as CSSProperties), ...style }}
    >
      {children}
    </div>
  );
};

export default GlareHover;

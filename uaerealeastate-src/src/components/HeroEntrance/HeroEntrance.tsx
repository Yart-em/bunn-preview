/**
 * Hero entrance text — the eyebrow's per-character rise and the H1
 * lines' per-word blur-in, played by CSS @keyframes (index.css,
 * "Hero entrance") instead of gsap SplitText and motion BlurText.
 *
 * The browser runs CSS transform / opacity / filter animations on
 * the compositor, so the entrance stays smooth while the main thread
 * is busy with the page's start-up (the globe chunk, its 2 s mount,
 * the dot lattice). gsap and motion stepped the eyebrow and every
 * word's y offset from a rAF loop on the main thread, so each long
 * task froze them. It also keeps gsap out of the entry bundle.
 *
 * Keyframes, durations, easings and staggers are the ones the two
 * libraries were given — see index.css for the exact curves.
 */
import { Fragment, useEffect, useRef, useState } from 'react';

/** Longest the eyebrow waits for its web font before it plays in
 *  the fallback face anyway — about when the H1 (0 → 1.95 s) has
 *  fully settled, so a slow font never leaves the eyebrow hidden
 *  under a finished headline. */
const FONT_WAIT_MAX_MS = 2000;

/** Each word's characters with their running index across the whole
 *  text (spaces don't count, like SplitText's `chars`). */
function splitChars(text: string) {
  let i = 0;
  return text
    .split(' ')
    .map((word) => Array.from(word).map((ch) => ({ ch, i: i++ })));
}

/** One line whose characters rise 12 px into place, one after the
 *  other (`stagger` ms apart), clipped by the line's own box.
 *
 *  Like the SplitText it replaces, it starts only once the font it
 *  renders in has loaded: a line that rises in the fallback face and
 *  then swaps reads as a glitch. It waits for that one face (the
 *  first family of its font stack), not `document.fonts.ready`,
 *  which would also wait for unrelated loads — e.g. Satoshi, which
 *  this line never uses. Until then the characters sit at the
 *  animation's start (hidden).
 *
 *  Screen readers get the text once, from a visually hidden copy;
 *  the per-character spans are aria-hidden (aria-label isn't allowed
 *  on a paragraph). */
export function RiseInChars({
  text,
  className = '',
  stagger,
}: {
  text: string;
  className?: string;
  /** Delay between consecutive characters, in ms. */
  stagger: number;
}) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let done = false;
    const play = () => {
      if (done) return;
      done = true;
      setPlaying(true);
    };
    const timer = window.setTimeout(play, FONT_WAIT_MAX_MS);
    const cs = getComputedStyle(el);
    const family = cs.fontFamily.split(',')[0];
    /* Resolves at once if the face is already in; rejects (→ play)
     * if it can't load at all. */
    document.fonts
      .load(`${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${family}`, text)
      .then(play, play);
    return () => {
      done = true;
      clearTimeout(timer);
    };
  }, [text]);

  return (
    <p
      ref={ref}
      className={`rise-in-chars${playing ? ' is-playing' : ''} ${className}`.trim()}
    >
      <span className="visually-hidden">{text}</span>
      {splitChars(text).map((chars, w) => (
        <Fragment key={w}>
          {w > 0 && ' '}
          <span className="rise-in-chars__word" aria-hidden="true">
            {chars.map(({ ch, i }) => (
              <span
                key={i}
                className="rise-in-chars__char"
                style={{ animationDelay: `${i * stagger}ms` }}
              >
                {ch}
              </span>
            ))}
          </span>
        </Fragment>
      ))}
    </p>
  );
}

/** One line whose words drop in from above out of a blur, one after
 *  the other (`stagger` ms apart), starting on the first frame. The
 *  words are laid out in a wrapping flex row, each carrying its
 *  trailing space as U+00A0: a plain space at the end of a flex item
 *  collapses, which ran the words together. The words stay plain
 *  text inside the element, so a heading's accessible name is simply
 *  its line. */
export function BlurInWords({
  text,
  className = '',
  stagger,
  as: Tag = 'p',
}: {
  text: string;
  className?: string;
  /** Delay between consecutive words, in ms. */
  stagger: number;
  as?: 'p' | 'h1' | 'h2' | 'h3';
}) {
  const words = text.split(' ');
  return (
    <Tag className={`blur-in-words ${className}`.trim()}>
      {words.map((word, i) => (
        <span
          key={i}
          className="blur-in"
          style={{ animationDelay: `${i * stagger}ms` }}
        >
          {word}
          {i < words.length - 1 && '\u00A0'}
        </span>
      ))}
    </Tag>
  );
}

/**
 * ContactPopup — a full-height slide-in panel (90 vw) with the
 * React-Bits StaggeredMenu entrance: staggered colour pre-layers
 * sweep in from the right, the white panel follows, then the form
 * fields stagger up. Opened by clicking ANY CTA button on the
 * page (every `.cta-fab`), closed via the X, the backdrop, or Esc.
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { gsap } from 'gsap';
import BorderGlow from '../BorderGlow/BorderGlow';
import GlareHover from '../GlareHover/GlareHover';
import './ContactPopup.css';

/* Staggered underlay layers — brand grey then pink (#FF9BB4, the
   project pink). The grey sweeps in first (furthest back), the pink
   lands last against the white panel: grey → pink → white. */
const PRELAYER_COLORS = ['#D7D7D7', '#FF9BB4'];

/* Country dial-code list for the phone field. */
const DIAL_CODES: { code: string; label: string }[] = [
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+7', label: '🇷🇺 +7' },
  { code: '+91', label: '🇮🇳 +91' },
  { code: '+86', label: '🇨🇳 +86' },
  { code: '+20', label: '🇪🇬 +20' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+234', label: '🇳🇬 +234' },
  { code: '+92', label: '🇵🇰 +92' },
  { code: '+961', label: '🇱🇧 +961' },
  { code: '+55', label: '🇧🇷 +55' },
  { code: '+351', label: '🇵🇹 +351' },
];

export default function ContactPopup() {
  const [open, setOpen] = useState(false);
  const [dial, setDial] = useState('+971');

  const openRef = useRef(false);
  const panelRef = useRef<HTMLElement | null>(null);
  const prelayersRef = useRef<HTMLDivElement | null>(null);
  const prelayerElsRef = useRef<HTMLElement[]>([]);
  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const busyRef = useRef(false);

  /* Park the panel + pre-layers off-screen to the right. */
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const pre = prelayersRef.current;
      if (!panel || !pre) return;
      const layers = Array.from(
        pre.querySelectorAll<HTMLElement>('.contact-prelayer'),
      );
      prelayerElsRef.current = layers;
      gsap.set([panel, ...layers], { xPercent: 100 });
    });
    return () => ctx.revert();
  }, []);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = prelayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    closeTweenRef.current?.kill();

    const fieldEls = Array.from(
      panel.querySelectorAll<HTMLElement>('.contact-anim'),
    );
    gsap.set(fieldEls, { yPercent: 60, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    layers.forEach((el, i) => {
      tl.fromTo(
        el,
        { xPercent: 100 },
        { xPercent: 0, duration: 0.5, ease: 'power4.out' },
        i * 0.07,
      );
    });
    const lastTime = layers.length ? (layers.length - 1) * 0.07 : 0;
    const panelInsert = lastTime + (layers.length ? 0.08 : 0);
    const panelDur = 0.65;
    tl.fromTo(
      panel,
      { xPercent: 100 },
      { xPercent: 0, duration: panelDur, ease: 'power4.out' },
      panelInsert,
    );

    if (fieldEls.length) {
      tl.to(
        fieldEls,
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power4.out',
          stagger: { each: 0.08, from: 'start' },
        },
        panelInsert + panelDur * 0.25,
      );
    }

    openTlRef.current = tl;
    return tl;
  }, []);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    const panel = panelRef.current;
    const layers = prelayerElsRef.current;
    if (!panel) return;
    closeTweenRef.current?.kill();
    closeTweenRef.current = gsap.to([...layers, panel], {
      xPercent: 100,
      duration: 0.32,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        busyRef.current = false;
      },
    });
  }, []);

  const openPopup = useCallback(() => {
    if (openRef.current) return;
    openRef.current = true;
    setOpen(true);
    document.body.style.overflow = 'hidden';
    playOpen();
  }, [playOpen]);

  const closePopup = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    setOpen(false);
    document.body.style.overflow = '';
    playClose();
  }, [playClose]);

  /* Open on ANY CTA button click (every `.cta-fab` on the page),
   * except the form's own submit button inside the panel. */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      const cta = el?.closest('a.cta-fab, button.cta-fab');
      if (!cta) return;
      if (panelRef.current && panelRef.current.contains(cta)) return; // skip in-panel button
      e.preventDefault();
      openPopup();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [openPopup]);

  /* Esc closes. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePopup();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closePopup]);

  return (
    <div className="contact-popup" data-open={open || undefined}>
      <div className="contact-backdrop" onClick={closePopup} aria-hidden="true" />

      <div className="contact-prelayers" ref={prelayersRef} aria-hidden="true">
        {PRELAYER_COLORS.map((c, i) => (
          <div key={i} className="contact-prelayer" style={{ background: c }} />
        ))}
      </div>

      <aside
        className="contact-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Get in touch"
      >
        <button
          type="button"
          className="contact-close"
          onClick={closePopup}
          aria-label="Close"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 5l14 14M19 5L5 19"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="contact-panel-inner">
          <h2 className="contact-heading contact-anim">
            Let&rsquo;s get to know each other
          </h2>

          <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
            <input
              className="contact-input contact-anim"
              type="text"
              name="name"
              placeholder="Your name"
              autoComplete="name"
            />
            <input
              className="contact-input contact-anim"
              type="text"
              name="position"
              placeholder="Position"
              autoComplete="organization-title"
            />

            <input
              className="contact-input contact-anim"
              type="email"
              name="email"
              placeholder="Email"
              autoComplete="email"
            />

            <div className="contact-phone contact-anim">
              <select
                className="contact-phone-code"
                value={dial}
                onChange={(e) => setDial(e.target.value)}
                aria-label="Country code"
              >
                {DIAL_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                className="contact-input contact-phone-num"
                type="tel"
                name="phone"
                placeholder="Mobile phone"
                autoComplete="tel"
              />
            </div>

            <div className="contact-submit contact-anim">
              <BorderGlow
                className="contact-cta-glow"
                edgeSensitivity={20}
                glowColor="0 0 100"
                backgroundColor="#FF9BB4"
                borderRadius={28}
                glowRadius={48}
                glowIntensity={1.4}
                coneSpread={28}
                colors={['#ffffff', '#ffffff', '#ffffff']}
              >
                <GlareHover
                  className="cta-fab-glare"
                  width="100%"
                  height="100%"
                  background="transparent"
                  borderRadius="28px"
                  borderColor="transparent"
                  glareColor="#ffffff"
                  glareOpacity={0.25}
                  glareAngle={-45}
                  glareSize={250}
                  transitionDuration={1800}
                  playOnce={false}
                  autoInterval={5000}
                >
                  <button
                    type="submit"
                    className="cta-fab cta-fab--glow"
                    aria-label="Get in touch"
                  >
                    <span className="cta-fab__label">GET IN TOUCH</span>
                    <span className="cta-fab__icon" aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M2 7h10M8 3l4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                </GlareHover>
              </BorderGlow>
            </div>
          </form>
        </div>
      </aside>
    </div>
  );
}

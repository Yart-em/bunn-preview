/**
 * BelowFold — every section after the hero.
 *
 * Code-split out of the entry bundle (React.lazy in App.tsx) and
 * mounted only after the hero has finished its entrance, the visitor
 * shows scroll intent, or the URL carries a #hash — see
 * <BelowFoldMount /> in App.tsx. Until then the first commit holds
 * just the top bar + hero, so the hero paints sooner and its
 * entrance never shares the main thread with ~11 000 px of
 * off-screen DOM, style and layout (plus the ScrollStack, carousel,
 * marquee, 3D coin and cityscape set-up).
 *
 * Each section is its own component that OWNS its refs, state and
 * effects, so the host can add them one at a time, top to bottom,
 * one per idle callback (`stage` = how many are mounted). Mounting
 * all of them in a single commit cost one ~145 ms frame at 4× CPU
 * throttle — a visible hitch in the spinning globe.
 */
import { Fragment, Suspense, lazy, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import GlassSurface from './components/GlassSurface/GlassSurface';
import BorderGlow from './components/BorderGlow/BorderGlow';
import GlareHover from './components/GlareHover/GlareHover';
import ScrollStack, {
  ScrollStackItem,
} from './components/ScrollStack/ScrollStack';
// import InfiniteMenu from './components/InfiniteMenu/InfiniteMenu';
// import type { InfiniteMenuItem } from './components/InfiniteMenu/InfiniteMenu';
import CurvedLoop from './components/CurvedLoop/CurvedLoop';
import SlideCarousel from './components/SlideCarousel/SlideCarousel';
import type { SlideData } from './components/SlideCarousel/SlideCarousel';
import { useCardNotch } from './hooks/useCardNotch';
const BrokersCoin = lazy(() => import('./components/BrokersCoin/BrokersCoin'));
import CityScape from './components/CityScape/CityScape';
import { BELOW_FOLD_STAGES, type BelowFoldStage } from './belowFoldStages';

/* ── FAQ items ──────────────────────────────────────────── */
const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'Is this legal in the UAE?',
    a: 'Yes. The Virtual Asset Service Provider is licensed by VARA. The payment provider is regulated by CBUAE. You receive AED only. BUNN and partners hold the regulated activity.',
  },
  {
    q: 'Do I have to register as a crypto business?',
    a: 'No. You quote AED, you receive AED. To you, the inbound is an AED wire from buyers account, like any other inbound.',
  },
  {
    q: 'Who is responsible for KYC and AML on the buyer?',
    a: 'Our partner OKX holds the VARA license. Identity, sanctions, PEP, and adverse-media checks run on every payer. You receive the full KYC pack with each settlement, sufficient for your customer-due-diligence file under UAE Federal Decree-Law 20 of 2018.',
  },
  {
    q: 'How is AML verified for the crypto payment?',
    a: 'On-chain analysis through Elliptic runs on every payer wallet before the transaction confirms. Wallets with direct or one-hop exposure to OFAC sanctions, mixers, or illicit clusters are blocked.',
  },
  {
    q: 'Do you handle Travel Rule, goAML reporting, and record retention?',
    a: 'Yes. VARA Travel Rule under IVMS 101. Originator and beneficiary info travels with every above-threshold transaction. STRs filed to the UAE FIU via goAML when triggered. Records retained 5 years per UAE law.',
  },
  {
    q: 'What if my buyer fails KYC?',
    a: 'The link expires, no funds move, you’re notified. The buyer can re-submit or you can cancel.',
  },
  {
    q: 'Which stablecoins do you accept?',
    a: 'USDC and USDT on Ethereum, Tron, Solana and many others chains.',
  },
  {
    q: 'What’s the fee?',
    a: '1% of the AED amount, all-in. No FX spread. No bank deductions on the receiving side.',
  },
  {
    q: 'How does this show up in my accounting?',
    a: 'AED in, AED out. The bank statement reads as an inbound wire from the settlement account, with the unit reference in the memo.',
  },
  {
    q: 'What about VAT and DLD fees?',
    a: 'Settled in AED through your normal flow. BUNN does not interact with DLD.',
  },
  {
    q: 'How long does onboarding take?',
    a: '24 hours for a developer. Same day for a broker. We handle compliance review during onboarding so the first link works.',
  },
  {
    q: 'What’s the per-transaction limit?',
    a: 'USD 5 million equivalent standard. Higher with pre-approval, case by case.',
  },
  {
    q: 'What if BUNN goes insolvent before AED reaches my account?',
    a: 'BUNN routes the flow without holding the funds. At any moment, your buyer’s money is in one of four places: the buyer’s own wallet before payment, a VARA-licensed custody provider after the buyer sends stablecoin, a CBUAE-licensed payment provider after AED conversion, or your account after settlement. Every step is regulated.',
  },
  {
    q: 'Will my bank flag the inbound wire from BUNN?',
    a: 'No. Inbound wires arrive at local bank under the name of your client like any other fiat incoming transfer.',
  },
];

/** Per-word reveal helper — splits text into clip-masked spans
 *  so each word can slide up + fade in with a staggered delay.
 *  `baseIndex` offsets the word counter so heading + body words
 *  form one continuous stagger across both elements. */
const WordReveal = ({
  text,
  baseIndex = 0,
  className = '',
}: {
  text: string;
  baseIndex?: number;
  className?: string;
}) => (
  <>
    {text.split(' ').map((word, j) => (
      <span key={j} className="word-reveal">
        <span
          className={`word-reveal__inner ${className}`}
          style={{ '--wi': baseIndex + j } as React.CSSProperties}
        >
          {word}
        </span>
      </span>
    ))}
  </>
);

/* ── Buyer persona data for the InfiniteMenu globe ───────
 * Temporarily commented out while the personas section is
 * disabled. Uncomment when re-enabling the section.
const BUYER_PERSONAS: InfiniteMenuItem[] = [
  {
    image: '/uaerealestate/portraits/mrs-sharma.jpg',
    name: 'Nigerian capped by capital controls',
    sub: 'Tunde, 38. Oil services executive in Lagos.',
    body: 'The Central Bank of Nigeria caps personal outbound transfers at $10,000 a year. The villa he reserved in Dubai Hills is AED 8.5M. Sending it through legal SWIFT channels would mean splitting the wire across his wife, his brother, and two business partners, and waiting four years.',
  },
  {
    image: '/uaerealestate/portraits/mr-sharma.jpg',
    name: 'Argentine with dollar savings outside the peso',
    sub: 'Mateo, 39. Tax lawyer in Buenos Aires.',
    body: 'The official outbound channel caps him at $200 a month at the official rate, which is about 60% below the parallel market. Sending pesos for AED through any legal channel is uneconomic. His real savings have been in USDC since 2020. The Dubai unit he wants is $385K, payable from that wallet.',
  },
  {
    image: '/uaerealestate/portraits/portrait.jpg',
    name: 'Ukrainian with frozen banking rails',
    sub: 'Olena, 42. Tech founder in Kyiv.',
    body: 'Wartime capital controls limit personal spending abroad. International wire transfers from Ukrainian banks face multi-week delays and strict documentation. Her apartment deposit in JVC is due in 10 days.',
  },
]; */

/** Slide carousel data — each slide pairs a buyer name with
 *  their cross-border payment pain point and a country tag. */
const CAROUSEL_SLIDES: SlideData[] = [
  {
    label: 'FOR SOFIA',
    subtitle:
      'A 2.3% FX spread plus a fresh source-of-funds review',
    country: 'Portugal',
    image: '/uaerealestate/rotator/sofia.jpg',
  },
  {
    label: 'FOR DMITRY',
    subtitle:
      "Passport triggers a 3–6-week manual sanctions review at his Cyprus bank",
    country: 'Russia with Cyprus resi',
    image: '/uaerealestate/rotator/dmitry.jpg',
  },
  {
    label: 'FOR ARJUN',
    subtitle:
      "RBI’s LRS caps at $250,000 and loses 20% TCS above ₹10 lakh",
    country: 'India',
    image: '/uaerealestate/rotator/arjun.jpg',
  },
  {
    label: 'FOR WEI',
    subtitle:
      'SAFE caps him at $50,000 a year and bars property abroad as an approved purpose',
    country: 'China',
    image: '/uaerealestate/rotator/wei.jpg',
  },
  {
    label: 'FOR HASSAN',
    subtitle:
      'Bank queueing outbound real-estate transfers 30 to 60 days',
    country: 'Egypt',
    image: '/uaerealestate/rotator/hassan.jpg',
  },
];

const BROKER_STEPS: { text: string; width: number }[] = [
  { text: 'Generate the payment link from your brokerage account', width: 200 },
  { text: "Enter invoice details and the developer's account", width: 200 },
  { text: "The funds settle directly to the developer's escrow", width: 200 },
];

/** How-it-works section — five portrait-aspect cards that
 *  stack as the user scrolls, using the React Bits
 *  ScrollStack recipe (lenis-powered smooth scroll).
 *  Each card's visible surface is the same liquid-glass
 *  (<GlassSurface />) treatment the hero card uses, so
 *  the texture continuity matches across the page. The
 *  section sits in document flow after the hero, so it
 *  comes into view AFTER the BUNN headings block has
 *  unpinned and scrolled off the top. */
function HowSection() {
  return (
    <section className="how-section" aria-label="How it works">
      <ScrollStack
        /* Settings from the React Bits playground:
         *   itemDistance=590, baseScale=0.8,
         *   stackPosition=10%, itemStackDistance=20
         * — 590 px of scroll between cards in document flow,
         * cards stack at 10 % from the viewport top with a
         * 20 px offset per card, base scale 0.8. */
        /* Mobile halves the scroll distance between step cards
           (590 → 295) so the deck advances twice as fast on phones. */
        itemDistance={
          typeof window !== 'undefined' && window.innerWidth <= 600
            ? 295
            : 590
        }
        itemStackDistance={20}
        baseScale={0.8}
        stackPosition="10%"
        flyAwayAfter={400}
        flyAwayExcludeLast
      >
        {[
          {
            n: '01',
            title: 'You create the payment link',
            body:
              "Open your dashboard. Enter the unit, the AED price, and the buyer's email. The link is yours in 30 seconds. No integration.",
          },
          {
            n: '02',
            title: 'Your buyer completes KYC and AML',
            body:
              'The buyer clicks the link, uploads ID, and completes KYC and AML run by Sumsub. Most buyers finish in under a few minutes.',
          },
          {
            n: '03',
            title: 'Buyer sends USDC or USDT',
            body:
              'From any wallet. Any exchange. Any country we support. The stablecoin amount is calculated against the AED price locked for 30 minutes.',
          },
          {
            n: '04',
            title: "We convert and settle in your buyer's name",
            body:
              "A VARA-licensed Virtual Asset Service Provider takes the stablecoin and converts it to AED. A CBUAE-regulated payment provider settles AED to your escrow account in the buyer's name.",
          },
          {
            n: '05',
            title: 'AED lands in your escrow account',
            body: '',
          },
        ].map((card) => (
          <ScrollStackItem key={card.n}>
            <div className="scroll-stack-card__content">
              <div className="scroll-stack-card__number">{card.n}</div>
              <h3 className="scroll-stack-card__title">{card.title}</h3>
              {card.body && (
                <p className="scroll-stack-card__body">{card.body}</p>
              )}
            </div>
          </ScrollStackItem>
        ))}
      </ScrollStack>
    </section>
  );
}

/** Info cards — 4 notched-shape cards in a row. The bordered
 *  card's outline draws itself the first time the section is
 *  15 % on screen, then a coin rolls around it. */
function InfoSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  /* Info-card top/bottom padding (hardcoded, no longer in toggle panel) */
  const infoPadTB = 0;
  const bgLeftY = -193;
  const bgLeftSize = 100;
  const bgRightY = -100;
  const bgRightSize = 100;

  /* Rolling coin on the bordered info card */
  const [infoVisible, setInfoVisible] = useState(false);
  const borderPathRef = useRef<SVGPathElement | null>(null);
  const coinGRef = useRef<SVGGElement | null>(null);
  const coinRafRef = useRef<number>(0);

  /* Reveal once: `info-section--visible` starts the word stagger
   * and the border draw (CSS); infoVisible starts the coin. */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('info-section--visible');
          setInfoVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* ── Rolling coin animation on bordered info card ─────────
   * Starts after the SVG stroke finishes drawing (4 s CSS
   * transition). The coin follows the path using
   * getPointAtLength, offset perpendicular so it sits on the
   * gravitationally "correct" side — outside at the top,
   * inside at the bottom. */
  useEffect(() => {
    if (!infoVisible) return;
    const DRAW_DURATION = 4200; // stroke draws in 4 s + buffer
    const R = 6; // coin radius in SVG units (≈10 px on screen)
    const SPEED = 100; // SVG-units / second

    const delayId = setTimeout(() => {
      const path = borderPathRef.current;
      const coin = coinGRef.current;
      if (!path || !coin) return;
      const totalLen = path.getTotalLength();
      coin.style.transition = 'opacity 0.5s';
      coin.style.opacity = '1';
      let t0: number | null = null;

      const tick = (ts: number) => {
        if (!t0) t0 = ts;
        const dist = (((ts - t0) / 1000) * SPEED) % totalLen;
        const pt = path.getPointAtLength(dist);

        /* Tangent → normal */
        const d = 0.5;
        const p1 = path.getPointAtLength(Math.max(0, dist - d));
        const p2 = path.getPointAtLength(
          Math.min(totalLen, dist + d),
        );
        const tx = p2.x - p1.x;
        const ty = p2.y - p1.y;
        const len = Math.sqrt(tx * tx + ty * ty) || 1;
        let nx = -ty / len;
        let ny = tx / len;

        /* Keep the coin (and its 1px outline) ALWAYS on the OUTSIDE
         * of the card border: flip the perpendicular so it points
         * away from the card centre (viewBox 351×414 → centre
         * 175,207). The coin then rolls on the outer edge the whole
         * way around instead of cutting through the shape. */
        const cx = 175;
        const cy = 207;
        if (nx * (pt.x - cx) + ny * (pt.y - cy) < 0) {
          nx = -nx;
          ny = -ny;
        }

        const rot = (dist / R) * (180 / Math.PI);
        coin.setAttribute(
          'transform',
          `translate(${pt.x + nx * R},${pt.y + ny * R}) rotate(${rot})`,
        );
        coinRafRef.current = requestAnimationFrame(tick);
      };

      coinRafRef.current = requestAnimationFrame(tick);
    }, DRAW_DURATION);

    return () => {
      clearTimeout(delayId);
      cancelAnimationFrame(coinRafRef.current);
    };
  }, [infoVisible]);

  return (
    <>
      {/* SVG defs for the organic card clip-path (normalised
          to the 0–1 objectBoundingBox coordinate space). */}
      <svg
        width="0"
        height="0"
        style={{ position: 'absolute' }}
        aria-hidden="true"
      >
        <defs>
          <clipPath
            id="info-card-clip"
            clipPathUnits="objectBoundingBox"
          >
            <path d="M1,0.77536 C1,0.81538,0.96174,0.84783,0.91453,0.84783 H0.58689 C0.53969,0.84783,0.50142,0.88028,0.50142,0.92029 V0.92754 C0.50142,0.96756,0.46316,1,0.41595,1 H0.08547 C0.03826,1,0,0.96756,0,0.92754 V0.21739 C0,0.17737,0.03826,0.14493,0.08547,0.14493 H0.10826 C0.15546,0.14493,0.19374,0.11247,0.19374,0.07246 C0.19374,0.03244,0.23199,0,0.27920,0 H0.91453 C0.96174,0,1,0.03244,1,0.07246 V0.77536Z" />
          </clipPath>
          {/* Photo section S-curve shape — redrawn at 1694×742
              (15 % taller than 645) with the SAME 35 px corner
              radii and 66 px S-curve step. Normalised to 0–1
              objectBoundingBox coords. */}
          <clipPath
            id="photo-shape-clip"
            clipPathUnits="objectBoundingBox"
          >
            <path d="M0.47340,0.04447 C0.47340,0.06904,0.48209,0.08895,0.49284,0.08895 H0.97934 C0.99074,0.08895,1,0.11008,1,0.13612 V0.95283 C1,0.97889,0.99074,1,0.97934,1 H0.02066 C0.00925,1,0,0.97889,0,0.95283 V0.04717 C0,0.02112,0.00925,0,0.02066,0 H0.45390 C0.46466,0,0.47340,0.01991,0.47340,0.04447Z" />
          </clipPath>
        </defs>
      </svg>

      <section
        className="info-section"
        ref={sectionRef}
        style={{
          '--info-heading-size': '30px',
          '--info-subtitle-size': '16px',
          '--info-pad-lr': '35px',
          '--info-pad-tb': `${infoPadTB}px`,
          '--bg-left-y': `${bgLeftY}px`,
          '--bg-left-scale': bgLeftSize / 100,
          '--bg-right-y': `${bgRightY}px`,
          '--bg-right-scale': bgRightSize / 100,
        } as React.CSSProperties}
      >
        {[
          {
            heading: 'Faster than a wire that works',
            body: 'A clean SWIFT from Lagos or Karachi clears in three to seven days when nothing goes wrong. We settle in 3 hours.',
            type: 'text' as const,
          },
          {
            heading: 'Built for the DLD pipeline',
            body: 'Form F deadlines, Oqood entries, 10 % deposit window. We hit the trustee banks RERA already approves, no new approvals on your side needed.',
            type: 'text' as const,
          },
          {
            heading: 'You never touch crypto',
            body: 'Your finance team books one AED inflow, your auditor sees fiat, the wire shows end buyer as a counterparty.',
            type: 'bordered' as const,
          },
          {
            heading: 'Only clean money lands in your account',
            body: "KYC, AML and sanctions checks all run before the buyer’s stablecoin leaves their wallet. Any failure stops the flow.",
            type: 'text' as const,
          },
        ].map((card, i) => (
          <div
            key={i}
            className={`info-card info-card--${card.type}`}
          >
            {card.type === 'bordered' && (
              <svg
                className="info-card__border"
                viewBox="0 0 351 414"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  ref={borderPathRef}
                  d="M351 30C351 13.4315 337.569 0 321 0H98C81.4315 0 68 13.4315 68 30C68 46.5685 54.5685 60 38 60H30C13.4315 60 0 73.4315 0 90V384C0 400.569 13.4315 414 30 414H146C162.569 414 176 400.569 176 384V381C176 364.431 189.431 351 206 351H321C337.569 351 351 337.569 351 321V30Z"
                  stroke="#999"
                  strokeWidth="1"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  strokeDasharray="1500"
                  strokeDashoffset="1500"
                />
                {/* Rolling coin — same pink as globe flow dots */}
                <g ref={coinGRef} style={{ opacity: 0 }}>
                  <circle r={6} fill="#FF9BAC" />
                  <circle
                    r={6}
                    fill="none"
                    stroke="#272727"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    r={4}
                    fill="none"
                    stroke="#272727"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                    opacity={0.35}
                  />
                </g>
              </svg>
            )}
            <div className="info-card__content">
              <h3 className="info-card__heading">
                <WordReveal text={card.heading} baseIndex={0} />
              </h3>
              <p className="info-card__subtitle">
                <WordReveal
                  text={card.body}
                  baseIndex={card.heading.split(' ').length}
                />
              </p>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

/** Logo section — regulators + the banks the accounts sit with. */
function LogosSection() {
  return (
    <section className="logos-section" aria-label="Partners and compliance">
      <div className="logos-group logos-group--compliant">
        <span className="logos-group__label">Fully Compliant</span>
        <div className="logos-group__row">
          <img
            src="/uaerealestate/regulators/vara.png"
            alt="VARA — Virtual Assets Regulatory Authority"
            className="logos-group__logo"
          />
          <img
            src="/uaerealestate/regulators/cb-uae.png"
            alt="Central Bank of the UAE"
            className="logos-group__logo"
          />
          <img
            src="/uaerealestate/logos/images (5) 1.png"
            alt="Dubai Land Department"
            className="logos-group__logo"
          />
        </div>
      </div>
      <div className="logos-group">
        <span className="logos-group__label">Powered with accounts from</span>
        <div className="logos-group__row">
          <img
            src="/uaerealestate/logos/lead-bank.svg"
            alt="Lead Bank"
            className="logos-group__logo"
          />
          <img
            src="/uaerealestate/logos/banking-circle.svg"
            alt="Banking Circle"
            className="logos-group__logo logos-group__logo--banking-circle"
          />
        </div>
      </div>
    </section>
  );
}

/** Buyer slide carousel. */
function CarouselSection() {
  return (
    <section
      className="carousel-section"
      aria-label="Buyer pain points"
    >
      <SlideCarousel slides={CAROUSEL_SLIDES} />
    </section>
  );
}

/** Brokers — glass card over the curved loop marquee. */
function BrokersSection() {
  const brokersGlassRef = useRef<HTMLDivElement | null>(null);
  const brokersShadowRef = useRef<HTMLDivElement | null>(null);
  const brokersCtaRef = useRef<HTMLAnchorElement | null>(null);

  /* S-curve cutout around the CTA, as on the hero card. */
  useCardNotch(brokersGlassRef, brokersCtaRef, 35, 5);

  /* Sync S-curve clip-path from glass to the shadow shape so the
   * shadow follows the exact same S-curve outline. */
  useEffect(() => {
    const glass = brokersGlassRef.current;
    const shadow = brokersShadowRef.current;
    if (!glass || !shadow) return;
    const sync = () => {
      const cp = glass.style.clipPath;
      if (cp) {
        shadow.style.clipPath = cp;
        (
          shadow.style as CSSStyleDeclaration & { webkitClipPath: string }
        ).webkitClipPath = cp;
      }
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(glass, { attributes: true, attributeFilter: ['style'] });
    return () => mo.disconnect();
  }, []);

  return (
    <section className="brokers-section">
      {/* Full-width curved marquee — spans the entire section behind
          the card. Shadow layer uses semi-transparent bg so this text
          bleeds through, giving the glass something to blur.
          The " • " separator is drawn by CurvedLoop at ●'s size from
          Engravers Gothic's own glyph — don't swap in '●'
          or other symbols the font lacks (■ ◆ ★ …): each one forces
          a slow system-font fallback when this section lays out. */}
      <CurvedLoop
        marqueeText="COMMISSION COMES ON TIME BECAUSE THE DEAL IS CLOSED ON TIME • "
        speed={2}
        curveAmount={350}
        direction="left"
        interactive={true}
        className="brokers-curved-text"
      />

      <div className="brokers-card">
        {/* Shadow — duplicate of the glass shape (same S-curve
            clip-path via MutationObserver), transparent + shadow.
            WRAPPER has filter: drop-shadow (no clip-path → shadow
            extends freely). INNER has clip-path + white bg
            (invisible against white section, gives shadow its
            shape). Glass sits on top with its own clip + frost. */}
        <div className="brokers-card__shadow-wrap" aria-hidden="true">
          <div className="brokers-card__shadow" ref={brokersShadowRef} />
        </div>
        <GlassSurface
          ref={brokersGlassRef}
          width="100%"
          height="auto"
          borderRadius={35}
          displacementScale={100}
        >
          <div className="brokers-card__inner">
            {/* Top row: heading + coin */}
            <div className="brokers-card__top">
              <div className="brokers-card__text">
                <h2 className="brokers-card__heading">BROKERS</h2>
                <p className="brokers-card__sub">
                  EARN REFERRAL BONUS WHILE YOUR CLIENT GETS DISCOUNTED FEE
                </p>
              </div>
              {/* 3D coin — same CylinderGeometry + canvas textures
                  as globe TravelingDots, spinning in its own Canvas.
                  Lazy (Three.js) so it's out of the initial bundle. */}
              <Suspense fallback={null}>
                <BrokersCoin />
              </Suspense>
            </div>

            {/* Three broker steps */}
            <div className="broker-steps-wrap">
              <div className="broker-steps" role="list">
                {BROKER_STEPS.map((step, i) => (
                  <Fragment key={i}>
                    <div
                      className="broker-step-item"
                      role="listitem"
                      style={{ width: `${step.width}px` }}
                    >
                      <p className="broker-step">{step.text}</p>
                    </div>
                    {i < BROKER_STEPS.length - 1 && (
                      <span
                        className={`subhead-divider divider-${i}`}
                        aria-hidden="true"
                      />
                    )}
                  </Fragment>
                ))}
              </div>
            </div>

            {/* Bottom row: grey tagline */}
            <p className="brokers-card__tagline">
              STOP CHASING PAYMENTS IN WHATSAPP
            </p>
          </div>
        </GlassSurface>

        {/* CTA — same pattern as hero */}
        <BorderGlow
          className="cta-fab-glow-wrap brokers-cta-wrap"
          edgeSensitivity={20}
          glowColor="0 0 100"
          backgroundColor="#0e0e10"
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
            <a
              ref={brokersCtaRef}
              className="cta-fab cta-fab--glow"
              href="#contact"
              aria-label="Open a brokerage account"
            >
              <span className="cta-fab__label">
                OPEN A BROKERAGE ACCOUNT
              </span>
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
            </a>
          </GlareHover>
        </BorderGlow>
      </div>
    </section>
  );
}

/** FAQ accordion — card-based with glow + rotate icon. */
function FaqSection() {
  /* FAQ accordion — null = all closed, number = open index. */
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className="faq-section">
      <ul className="faq-list">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = openFaq === i;
          return (
            <motion.li
              key={i}
              className={`faq-item${isOpen ? ' faq-item--open' : ''}`}
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              whileHover={{ y: -2 }}
              viewport={{ amount: 0.2, once: true }}
              transition={{
                duration: 0.5,
                ease: [0.17, 0.55, 0.55, 1],
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty('--faq-x', `${e.clientX - rect.left}px`);
                e.currentTarget.style.setProperty('--faq-y', `${e.clientY - rect.top}px`);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.removeProperty('--faq-x');
                e.currentTarget.style.removeProperty('--faq-y');
              }}
            >
              {/* Pointer-following glow */}
              <div className="faq-glow" />

              <button
                className="faq-trigger"
                aria-expanded={isOpen}
                onClick={() => setOpenFaq(isOpen ? null : i)}
              >
                {/* Circle icon */}
                <span className="faq-icon">
                  <span className="faq-icon__ring" />
                  <svg
                    className="faq-icon__svg"
                    width="20" height="20" viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path d="M12 5v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>

                <div className="faq-content">
                  <h3 className="faq-q">{item.q}</h3>
                  <div className="faq-body">
                    <p className="faq-a">{item.a}</p>
                  </div>
                </div>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <img
        src="/uaerealestate/logos/bunn-footer-logo.svg"
        alt="BUNN"
        className="site-footer__logo"
      />
      <div className="site-footer__meta">
        <p className="site-footer__text">
          BUNN Labs, Inc. 2810 North Church Street Wilmington, DE, 19802 US
        </p>
        <a className="site-footer__link" href="/terms">
          Terms of Service
        </a>
        <a className="site-footer__link" href="/privacy">
          Privacy Policy
        </a>
      </div>
    </footer>
  );
}

/* The photo CTA section (commented out in BelowFold below) is
 * disabled. Its parallax effect lived in <App/>; restore it with
 * the section, as a component that owns these refs: */
// const photoImgRef = useRef<HTMLDivElement | null>(null);
// const photoShapeRef = useRef<HTMLDivElement | null>(null);
//
// /* ── Parallax on the photo shape ──────────────────────────
//  * The image div is 130 % the height of the clip container
//  * (15 % extra top + bottom). As the section scrolls through
//  * the viewport, the image translates from +8 % to −8 %,
//  * creating a subtle depth effect. */
// useEffect(() => {
//   const img = photoImgRef.current;
//   const shape = photoShapeRef.current;
//   if (!img || !shape) return;
//   const onScroll = () => {
//     const rect = shape.getBoundingClientRect();
//     const vh = window.innerHeight;
//     const progress = 1 - rect.bottom / (vh + rect.height);
//     const clamped = Math.max(0, Math.min(1, progress));
//     const ty = (clamped - 0.5) * 16; // −8 % … +8 %
//     img.style.transform = `translateY(${ty}%)`;
//   };
//   window.addEventListener('scroll', onScroll, { passive: true });
//   onScroll();
//   return () => window.removeEventListener('scroll', onScroll);
// }, []);

/** Renders the first `stage` sections of BELOW_FOLD_STAGES. */
export default function BelowFold({ stage }: { stage: number }) {
  const has = (s: BelowFoldStage) => BELOW_FOLD_STAGES.indexOf(s) < stage;
  return (
    <>
      {has('how') && <HowSection />}

      {/* ── Info cards — 4 notched-shape cards in a row ──── */}
      {has('info') && <InfoSection />}

      {/* ── Logo section — regulators + partners ──── */}
      {has('logos') && <LogosSection />}

      {/* Shared canvas — continuous pink gradient spans both the
          carousel and brokers sections so there's no visible seam
          between them. Individual sections are transparent. */}
      {has('carousel') && (
        <div className="carousel-brokers-wrap">
          {/* ── Buyer slide carousel ──────────────────────────────── */}
          <CarouselSection />

          {/* ── Photo CTA section — S-curve shape with couple photo ── */}
          {/* <section
            className="photo-cta-section"
            style={{
              '--photo-text-pad-extra': `${photoTextPad}px`,
              '--photo-btn-y': `${photoBtnY}px`,
            } as React.CSSProperties}
          >
            <div
              className="photo-shape"
              ref={photoShapeRef}
            >
              <div
                className="photo-shape__img"
                ref={photoImgRef}
              />
              <div className="photo-shape__overlay">
                <BlurText
                  as="h2"
                  className="photo-shape__heading"
                  text="MAKE YOUR CLIENTS HAPPY TO PAY"
                  animateBy="words"
                  direction="top"
                  delay={120}
                  stepDuration={0.45}
                />
                <BorderGlow
                  className="photo-cta-glow-wrap"
                  edgeSensitivity={20}
                  glowColor="0 0 100"
                  backgroundColor="#0e0e10"
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
                    <a
                      className="cta-fab cta-fab--glow"
                      href="#contact"
                      aria-label="Start to use payment links"
                    >
                      <span className="cta-fab__label">
                        START TO USE PAYMENT LINKS
                      </span>
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
                    </a>
                  </GlareHover>
                </BorderGlow>
              </div>
            </div>
          </section> */}

          {/* ── Buyer personas — InfiniteMenu globe ──────────────── */}
          {/* <section className="personas-section">
            <div className="personas-globe-wrap">
              <InfiniteMenu items={BUYER_PERSONAS} scale={5} />
            </div>
          </section> */}

          {/* ── Brokers — glass card over curved loop marquee ──── */}
          {has('brokers') && <BrokersSection />}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          FAQ accordion — card-based with glow + rotate icon
          ══════════════════════════════════════════════════════ */}
      {has('faq') && <FaqSection />}

      {/* ── Dubai cityscape — procedural dots + rolling coins ── */}
      {has('cityscape') && <CityScape />}

      {/* ── Footer ─────────────────────────────────────────── */}
      {has('footer') && <SiteFooter />}
    </>
  );
}

import { motion } from "framer-motion";
import { BRAND_LAYOUT_ID, EASE, INTRO_COLORS, TIMINGS } from "./intro.constants";

type Props = {
  visible: boolean;
  /** Skip stroke drawing, just crossfade (reduced motion). */
  reducedMotion?: boolean;
  size?: number;
};

/** Minimal node-and-line abstract "P" mark. */
export function BrandMark({ size = 160, animated = false }: { size?: number; animated?: boolean }) {
  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: TIMINGS.logoDrawDuration / 1000, ease: EASE.out },
    },
  };
  const pop = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: { delay: 0.5 + i * 0.12, duration: 0.4, ease: EASE.out },
    }),
  };

  const stroke = INTRO_COLORS.brandGlow;
  const MotionPath = animated ? motion.path : "path";
  const MotionCircle = animated ? motion.circle : "circle";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-label="Pratikriya AI logo"
    >
      <MotionPath
        d="M32 82 V22 H56 a16 16 0 0 1 0 32 H32"
        stroke={stroke}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...(animated ? { variants: draw, initial: "hidden", animate: "visible" } : {})}
      />
      <MotionPath
        d="M56 54 L78 78"
        stroke={INTRO_COLORS.brand}
        strokeWidth={3.5}
        strokeLinecap="round"
        {...(animated ? { variants: draw, initial: "hidden", animate: "visible" } : {})}
      />
      {[
        { cx: 32, cy: 22, r: 4.5 },
        { cx: 32, cy: 82, r: 4.5 },
        { cx: 72, cy: 38, r: 3.5 },
        { cx: 78, cy: 78, r: 4 },
      ].map((c, i) => (
        <MotionCircle
          key={i}
          cx={c.cx}
          cy={c.cy}
          r={c.r}
          fill={stroke}
          {...(animated ? { custom: i, variants: pop, initial: "hidden", animate: "visible" } : {})}
        />
      ))}
    </svg>
  );
}

export function LogoReveal({ visible, reducedMotion = false, size = 160 }: Props) {
  if (!visible) return null;
  return (
    <motion.div
      layoutId={BRAND_LAYOUT_ID}
      className="relative grid place-items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: reducedMotion ? TIMINGS.reducedMotionCrossfade / 1000 : 0.6,
        ease: EASE.smooth,
      }}
      style={{ filter: "drop-shadow(0 0 28px rgba(111,195,192,0.45))" }}
    >
      <BrandMark size={size} animated={!reducedMotion} />
    </motion.div>
  );
}
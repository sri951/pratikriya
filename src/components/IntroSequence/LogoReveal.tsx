import { motion } from "framer-motion";
import brandMark from "@/assets/pratikriya-mark.png.asset.json";
import { BRAND_LAYOUT_ID, EASE, TIMINGS } from "./intro.constants";

type Props = {
  visible: boolean;
  /** Skip stroke drawing, just crossfade (reduced motion). */
  reducedMotion?: boolean;
  size?: number;
};

/** Official Pratikriya brand mark (leaf + circle emblem). */
export function BrandMark({ size = 160, animated = false }: { size?: number; animated?: boolean }) {
  const Img = animated ? motion.img : "img";
  return (
    <Img
      src={brandMark.url}
      alt="Pratikriya AI logo"
      width={size}
      height={size}
      className="object-contain"
      style={{ width: size, height: size }}
      {...(animated
        ? {
            initial: { scale: 0.86, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            transition: { duration: TIMINGS.logoDrawDuration / 1000, ease: EASE.out },
          }
        : {})}
    />
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
      style={{ filter: "drop-shadow(0 0 32px rgba(111,195,192,0.35))" }}
    >
      <BrandMark size={size} animated={!reducedMotion} />
    </motion.div>
  );
}
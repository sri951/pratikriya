import { motion } from "framer-motion";
import { EASE, TAGLINE_WORDS, TIMINGS } from "./intro.constants";

export function TaglineText({ visible, reducedMotion = false }: { visible: boolean; reducedMotion?: boolean }) {
  if (!visible) return null;

  if (reducedMotion) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: TIMINGS.reducedMotionCrossfade / 1000, ease: EASE.smooth }}
        className="mt-6 text-center font-display text-lg tracking-[0.28em] text-[#9BE7D6] sm:text-2xl"
      >
        {TAGLINE_WORDS.join(" ")}
      </motion.p>
    );
  }

  return (
    <p className="mt-6 flex flex-wrap items-center justify-center gap-x-4 font-display text-lg tracking-[0.28em] text-[#9BE7D6] sm:text-2xl">
      {TAGLINE_WORDS.map((word, i) => (
        <motion.span
          key={word}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: (i * TIMINGS.taglineWordStagger) / 1000,
            ease: EASE.out,
          }}
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
}
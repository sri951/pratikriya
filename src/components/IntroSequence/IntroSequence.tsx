import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { IntroVideoBg } from "./IntroVideoBg";
import { LogoReveal } from "./LogoReveal";
import { TaglineText } from "./TaglineText";
import { useIntroPreferences } from "./useIntroPreferences";
import {
  EASE,
  INTRO_ANNOUNCEMENT,
  INTRO_COLORS,
  INTRO_MEDIA,
  SCENES,
  TIMINGS,
  type SceneId,
} from "./intro.constants";

type Props = {
  onComplete: () => void;
  /** Fired at Scene 5 start so the app header can claim the shared brand logo. */
  onHandoff?: () => void;
};

export function IntroSequence({ onComplete, onHandoff }: Props) {
  const handoffRef = useRef(onHandoff);
  handoffRef.current = onHandoff;

  const beginHandoff = useCallback(() => {
    setHandoff(true);
    handoffRef.current?.();
  }, []);
  const { hasSeenIntro, setHasSeenIntro, muted, setMuted, reducedMotion } = useIntroPreferences();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeouts = useRef<number[]>([]);
  const finished = useRef(false);

  const [scene, setScene] = useState<SceneId>(1);
  const [showSkip, setShowSkip] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [showTagline, setShowTagline] = useState(false);
  const [handoff, setHandoff] = useState(false);

  const schedule = useCallback((fn: () => void, ms: number) => {
    timeouts.current.push(window.setTimeout(fn, ms));
  }, []);

  const cleanup = useCallback(() => {
    timeouts.current.forEach((t) => window.clearTimeout(t));
    timeouts.current = [];
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
  }, []);

  const complete = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    cleanup();
    handoffRef.current?.();
    setHasSeenIntro(true);
    onComplete();
  }, [cleanup, onComplete, setHasSeenIntro]);

  // ---- Timeline -----------------------------------------------------------
  useEffect(() => {
    if (reducedMotion) {
      setShowLogo(true);
      setShowTagline(true);
      schedule(beginHandoff, TIMINGS.reducedMotionCrossfade);
      schedule(complete, TIMINGS.reducedMotionCompleteAt);
      return cleanup;
    }

    (Object.keys(SCENES) as unknown as string[]).forEach((key) => {
      const id = Number(key) as SceneId;
      schedule(() => setScene(id), SCENES[id]);
    });
    schedule(() => setShowSkip(true), TIMINGS.skipVisibleAt);
    schedule(() => setShowLogo(true), TIMINGS.logoRevealAt);
    schedule(() => setShowTagline(true), TIMINGS.taglineAt);
    schedule(beginHandoff, TIMINGS.handoffAt);
    schedule(complete, TIMINGS.completeAt);

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // ---- Media --------------------------------------------------------------
  useEffect(() => {
    if (reducedMotion || muted) return;
    const a = audioRef.current;
    if (!a) return;
    a.volume = 0.5;
    const p = a.play();
    if (p && typeof p.catch === "function") p.catch(() => undefined);
  }, [muted, reducedMotion]);

  // ---- Esc to skip --------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") complete();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [complete]);

  const stageOpacity = useMemo(() => (scene >= 2 ? 1 : 0.4), [scene]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] overflow-hidden"
      style={{ backgroundColor: handoff ? INTRO_COLORS.appBackground : INTRO_COLORS.atmosphere }}
      initial={{ opacity: 1 }}
      animate={{ opacity: handoff ? 0.001 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: handoff ? 1.6 : 0.4, ease: EASE.smooth }}
      role="dialog"
      aria-label="Pratikriya AI intro"
    >
      <span className="sr-only" aria-live="polite">
        {INTRO_ANNOUNCEMENT}
      </span>

      {!reducedMotion && (
        <IntroVideoBg fadedOut={handoff} />
      )}

      {!reducedMotion && (
        <audio ref={audioRef} src={INTRO_MEDIA.audioSrc} preload="auto" aria-hidden="true" />
      )}

      <div
        className="relative z-20 grid h-full place-items-center px-6 transition-opacity duration-700"
        style={{ opacity: stageOpacity }}
      >
        <div className="flex flex-col items-center">
          <AnimatePresence>
            {!handoff && (
              <LogoReveal visible={showLogo} reducedMotion={reducedMotion} size={168} />
            )}
          </AnimatePresence>
          <TaglineText visible={showTagline && !handoff} reducedMotion={reducedMotion} />
        </div>
      </div>

      {!reducedMotion && (
        <div className="absolute bottom-8 right-6 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            aria-label={muted ? "Unmute intro audio" : "Mute intro audio"}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-white/80 backdrop-blur transition-colors hover:bg-white/10"
          >
            {muted ? (
              <VolumeX className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Volume2 className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          {showSkip && !handoff && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE.out }}
              onClick={complete}
              className="inline-flex min-h-11 items-center rounded-full border border-white/15 bg-white/5 px-5 text-sm font-medium text-white/85 backdrop-blur transition-colors hover:bg-white/10"
            >
              Skip intro
            </motion.button>
          )}
        </div>
      )}

      {hasSeenIntro ? null : null}
    </motion.div>
  );
}

export default IntroSequence;
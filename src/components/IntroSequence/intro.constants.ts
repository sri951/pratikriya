import introAudio from "@/assets/intro-theme.mp3.asset.json";

/** Single source of truth for the cinematic intro. All times in ms. */
export const INTRO_MEDIA = {
  audioSrc: introAudio.url,
} as const;

export const INTRO_COLORS = {
  atmosphere: "#050505",
  appBackground: "#0B1220",
  brand: "#6FC3C0",
  brandGlow: "#9BE7D6",
} as const;

export const EASE = {
  smooth: [0.4, 0, 0.2, 1] as const,
  out: [0.16, 1, 0.3, 1] as const,
};

export type SceneId = 1 | 2 | 3 | 4 | 5;

/** Scene start times (ms) — authoritative timeline. */
export const SCENES: Record<SceneId, number> = {
  1: 0,
  2: 1000,
  3: 2500,
  4: 4500,
  5: 6000,
};

export const TIMINGS = {
  skipVisibleAt: 2000,
  logoRevealAt: 4000,
  logoDrawDuration: 1400,
  taglineAt: 4500,
  taglineWordStagger: 80,
  handoffAt: 6000,
  completeAt: 8000,
  reducedMotionCrossfade: 1500,
  reducedMotionCompleteAt: 2600,
} as const;

export const BRAND_LAYOUT_ID = "pratikriya-brand-logo";
export const TAGLINE_WORDS = ["Think.", "Evolve."] as const;
export const INTRO_ANNOUNCEMENT = "Pratikriya AI — Think. Evolve.";

export const STORAGE_KEYS = {
  hasSeenIntro: "pratikriya:intro:seen",
  muted: "pratikriya:intro:muted",
} as const;
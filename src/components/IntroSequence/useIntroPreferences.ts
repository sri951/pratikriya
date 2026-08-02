import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS } from "./intro.constants";

function readBool(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : raw === "true";
  } catch {
    return fallback;
  }
}

function writeBool(key: string, value: boolean) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* storage unavailable — non fatal */
  }
}

export function useIntroPreferences() {
  // Start deterministic for SSR, then hydrate from storage/media queries.
  const [hydrated, setHydrated] = useState(false);
  const [hasSeenIntro, setHasSeenIntroState] = useState(true);
  const [muted, setMutedState] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setHasSeenIntroState(readBool(STORAGE_KEYS.hasSeenIntro, false));
    setMutedState(readBool(STORAGE_KEYS.muted, true));

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    setHydrated(true);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setHasSeenIntro = useCallback((value: boolean) => {
    setHasSeenIntroState(value);
    writeBool(STORAGE_KEYS.hasSeenIntro, value);
  }, []);

  const setMuted = useCallback((value: boolean) => {
    setMutedState(value);
    writeBool(STORAGE_KEYS.muted, value);
  }, []);

  return { hydrated, hasSeenIntro, setHasSeenIntro, muted, setMuted, reducedMotion };
}
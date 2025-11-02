import { useCallback, useEffect, useRef, useState } from "react";
import { EasingFn, EasingName, getEasing } from "./easing";

export interface UseTweenOptions {
  duration?: number; // ms
  delay?: number; // ms
  easing?: EasingName | EasingFn;
  autoplay?: boolean;
  loop?: boolean;
  yoyo?: boolean;
  onUpdate?: (t: number) => void; // eased t
  onComplete?: () => void;
}

export interface UseTweenApi {
  t: number; // eased progress 0..1
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  reset: () => void; // reset to start (direction-respecting)
  reverse: () => void; // flip direction
}

export function useTween(options: UseTweenOptions = {}): UseTweenApi {
  const {
    duration = 1000,
    delay = 0,
    easing: easingIn = "linear",
    autoplay = false,
    loop = false,
    yoyo = false,
    onUpdate,
    onComplete,
  } = options;

  const ease = getEasing(easingIn);
  const rafRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const delayDoneRef = useRef(false);
  const dirRef = useRef<1 | -1>(1); // 1 forward, -1 backward
  const rawRef = useRef(0); // 0..1 raw progress
  const [t, setT] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const step = useCallback(
    (now: number) => {
      // Delay handling
      if (!delayDoneRef.current) {
        if (startTimeRef.current === null) startTimeRef.current = now;
        if (now - startTimeRef.current < delay) {
          rafRef.current = requestAnimationFrame(step);
          return;
        }
        delayDoneRef.current = true;
        startTimeRef.current = now; // reset for active phase
      }

      const elapsed = now - (startTimeRef.current ?? now);
      let raw = Math.min(Math.max(elapsed / duration, 0), 1);

      if (dirRef.current < 0) {
        raw = 1 - raw;
      }
      rawRef.current = raw;

      const eased = ease(raw);
      setT(eased);
      onUpdate?.(eased);

      const finished = elapsed >= duration;
      if (!finished) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      if (loop) {
        // Loop logic (with optional yoyo flip)
        if (yoyo) dirRef.current = dirRef.current === 1 ? -1 : 1;
        startTimeRef.current = now;
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      // Complete
      setIsPlaying(false);
      rafRef.current = null;
      onComplete?.();
    },
    [delay, duration, ease, loop, onComplete, onUpdate, yoyo]
  );

  const play = useCallback(() => {
    if (rafRef.current != null) return; // already running
    setIsPlaying(true);
    startTimeRef.current = null;
    delayDoneRef.current = false;
    rafRef.current = requestAnimationFrame(step);
    // Fallback driver in case RAF is throttled or not firing in this environment
    if (intervalRef.current == null && typeof window !== 'undefined') {
      intervalRef.current = window.setInterval(() => {
        try {
          // Prefer high-res time
          const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
          step(now as number);
        } catch {/* noop */}
      }, 16);
    }
  }, [step]);

  const pause = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      setIsPlaying(false);
    }
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    // Always reset to the start in forward direction to avoid flashes
    // when previous run ended with reversed direction (e.g., yoyo cases).
    pause();
    dirRef.current = 1;
    rawRef.current = 0;
    const eased = ease(0);
    setT(eased);
  }, [ease, pause]);

  const reverse = useCallback(() => {
    dirRef.current = dirRef.current === 1 ? -1 : 1;
  }, []);

  useEffect(() => {
    if (autoplay) play();
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (intervalRef.current != null) clearInterval(intervalRef.current);
    };
  }, [autoplay, play]);

  return { t, isPlaying, play, pause, reset, reverse };
}

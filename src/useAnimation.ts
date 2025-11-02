import React from "react";

export type UseAnimationOptions = {
  autoplay?: boolean; // start playing on mount
  speed?: number;     // time scale factor (1 = realtime seconds)
  duration?: number;  // optional looping duration in seconds
  loop?: boolean;     // if duration provided, wrap t modulo duration
  onTick?: (t:number, dt:number)=>void; // optional side-effect callback each frame
};

export type AnimationApi = {
  t: number;        // elapsed time in seconds (scaled)
  dt: number;       // last frame dt in seconds (scaled)
  playing: boolean;
  speed: number;
  play: ()=>void;
  stop: ()=>void;
  toggle: ()=>void;
  reset: ()=>void;     // set t=0
  setTime: (t:number)=>void;
  setSpeed: (s:number)=>void;
};

export function useAnimation(opts: UseAnimationOptions = {}): AnimationApi {
  const { autoplay = false, speed: initSpeed = 1, duration, loop = Boolean(opts.duration), onTick } = opts;
  const [t, setT] = React.useState(0);
  const [dt, setDt] = React.useState(0);
  // Start stopped; if autoplay, we'll call play() on mount
  const [playing, setPlaying] = React.useState<boolean>(false);
  const speedRef = React.useRef(initSpeed);
  const rafRef = React.useRef<number | null>(null);
  const lastTsRef = React.useRef<number | null>(null);
  const tRef = React.useRef(0);

  // Keep refs in sync with state
  React.useEffect(() => { tRef.current = t; }, [t]);

  const step = React.useCallback((now: number) => {
    const last = lastTsRef.current ?? now;
    const rawDt = (now - last) / 1000;
    lastTsRef.current = now;
    const scaledDt = rawDt * speedRef.current;
    let newT = tRef.current + scaledDt;
    if (duration && loop) {
      const dur = Math.max(1e-9, duration);
      newT = ((newT % dur) + dur) % dur;
    }
    tRef.current = newT;
    setT(newT);
    setDt(scaledDt);
    onTick?.(newT, scaledDt);
    rafRef.current = requestAnimationFrame(step);
  }, [duration, loop, onTick]);

  const play = React.useCallback(() => {
    // If RAF is already running, do nothing.
    if (rafRef.current != null) return;
    setPlaying(true);
    lastTsRef.current = null;
    rafRef.current = requestAnimationFrame(step);
  }, [step]);

  const stop = React.useCallback(() => {
    setPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = null;
  }, []);

  const toggle = React.useCallback(() => {
    if (rafRef.current != null) {
      stop();
    } else {
      play();
    }
  }, [play, stop]);

  const reset = React.useCallback(() => setT(0), []);
  const setTime = React.useCallback((time: number) => { tRef.current = time; setT(time); }, []);
  const setSpeed = React.useCallback((s: number) => { speedRef.current = s; }, []);

  // Auto-start/stop lifecycle
  React.useEffect(() => {
    if (autoplay) {
      play();
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [autoplay, play]);

  return { t, dt, playing, speed: speedRef.current, play, stop, toggle, reset, setTime, setSpeed };
}

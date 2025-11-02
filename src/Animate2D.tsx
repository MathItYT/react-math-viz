import React from "react";
import { EasingFn, EasingName, getEasing } from "./easing";
import { PlotContext } from "./context";

export type AnimationType2D = "appear" | "disappear" | "transform" | "morph";

export type Transform2D = {
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number; // radians
  opacity?: number;
};

export type Animate2DProps = {
  children?: React.ReactNode;
  type?: AnimationType2D;
  from?: Transform2D;
  to?: Transform2D;
  duration?: number;
  delay?: number;
  easing?: EasingName | EasingFn;
  autoplay?: boolean;
  loop?: boolean;
  yoyo?: boolean;
  replayKey?: any; // when this value changes, restart the animation
  // For morph we could add fromNode/toNode props in future iterations.
};

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export function Animate2D({ children, type = "transform", from, to, duration = 600, delay = 0, easing = "easeInOutCubic", autoplay = true, loop = false, yoyo = false, replayKey }: Animate2DProps) {
  const plot = React.useContext(PlotContext);
  const easeFn: EasingFn = React.useMemo(() => typeof easing === 'function' ? easing : getEasing(easing), [easing]);
  const defaults = React.useMemo(() => {
    // Fade-only defaults for appear/disappear
    if (type === "appear") return { from: { opacity: 0 }, to: { opacity: 1 } };
    if (type === "disappear") return { from: { opacity: 1 }, to: { opacity: 0 } };
    return { from: {}, to: {} };
  }, [type]);

  const outerRef = React.useRef<SVGGElement | null>(null);

  const applyAt = React.useCallback((tt: number) => {
    const g = outerRef.current; if (!g) return;
    const f = { ...defaults.from, ...from } as Transform2D;
    const t = { ...defaults.to, ...to } as Transform2D;
    const wx = lerp(f.x ?? 0, t.x ?? 0, tt);
    const wy = lerp(f.y ?? 0, t.y ?? 0, tt);
    const sc = lerp(f.scale ?? 1, t.scale ?? 1, tt);
    const rot = lerp(f.rotation ?? 0, t.rotation ?? 0, tt);
    const opFrom = f.opacity ?? 1; const opTo = t.opacity ?? 1;
    const op = lerp(opFrom, opTo, tt);
    const rotDeg = rot * 180 / Math.PI;

    // Map world translation to screen pixels if inside a Plot2D
    let dx = wx, dy = wy;
    if (plot) {
      const o = plot.worldToScreen(0, 0);
      const px = plot.worldToScreen(wx, 0);
      const py = plot.worldToScreen(0, wy);
      dx = px.x - o.x;
      dy = py.y - o.y;
    }
    g.setAttribute('transform', `translate(${dx} ${dy}) scale(${sc}) rotate(${rotDeg})`);
    if (typeof op === 'number') g.setAttribute('opacity', String(op));
  }, [defaults.from, defaults.to, from, to, plot]);

  // Interval-based driver (same policy as 3D) to avoid RAF throttling
  const driverRef = React.useRef<{ playing: boolean; dir: 1 | -1; startAt: number; id: number | null }>({ playing: false, dir: 1, startAt: 0, id: null });
  const stop = React.useCallback(() => {
    const d = driverRef.current;
    if (d.id != null) { clearInterval(d.id); d.id = null; }
    d.playing = false;
  }, []);
  const play = React.useCallback(() => {
    const d = driverRef.current;
    if (d.playing) return;
    d.playing = true; d.dir = 1;
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    d.startAt = now;
    if (d.id != null) { clearInterval(d.id); d.id = null; }
    d.id = window.setInterval(() => {
      const tnow = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const elapsed = tnow - d.startAt;
      const eff = elapsed - delay;
      if (eff < 0) { applyAt(0); return; }
      let raw = Math.min(Math.max(eff / duration, 0), 1);
      if (d.dir < 0) raw = 1 - raw;
      const eased = easeFn(raw);
      applyAt(eased);
      const finished = eff >= duration;
      if (finished) {
        if (loop) {
          if (yoyo) d.dir = d.dir === 1 ? -1 : 1;
          d.startAt = tnow;
        } else {
          stop();
        }
      }
    }, 16);
  }, [applyAt, delay, duration, easeFn, loop, stop, yoyo]);

  // Reset + (re)start policy
  const lastResetAtRef = React.useRef<number>(-1);
  const resetPlay = React.useCallback(() => {
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    if (lastResetAtRef.current > 0 && (now - lastResetAtRef.current) < 250) return;
    lastResetAtRef.current = now;
    stop();
    // Apply t=0 before first paint
    applyAt(0);
    if (autoplay) play();
  }, [applyAt, autoplay, play, stop]);

  // First mount and when type/replayKey changes
  const initedRef = React.useRef(false);
  React.useLayoutEffect(() => {
    if (!initedRef.current) initedRef.current = true;
    resetPlay();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, replayKey]);

  // Toggle autoplay without full reset (but still ensure freeze when off)
  React.useLayoutEffect(() => {
    if (autoplay) {
      // if not playing, start from current 0 position
      play();
    } else {
      stop();
    }
  }, [autoplay, play, stop]);

  // Heuristic: if children are only intrinsic SVG elements (e.g., 'g', 'circle', 'rect'),
  // assume their coordinates are in WORLD units and provide a mapping group.
  const intrinsicOnly = React.useMemo(() => {
    const arr = React.Children.toArray(children) as any[];
    const isIntrinsic = (el: any): boolean => {
      if (!React.isValidElement(el)) return true;
      const t = (el as any).type;
      if (typeof t === 'string') return true; // svg intrinsic
      return false; // custom component -> we won't remap
    };
    return arr.every(isIntrinsic);
  }, [children]);

  let worldGroupTransform: string | null = null;
  if (plot && intrinsicOnly) {
    const o = plot.worldToScreen(0, 0);
    const px = plot.worldToScreen(1, 0);
    const py = plot.worldToScreen(0, 1);
    const sx = px.x - o.x;
    const sy = py.y - o.y; // usually negative (y up in world)
    worldGroupTransform = `matrix(${sx} 0 0 ${sy} ${o.x} ${o.y})`;
  }

  const clipProps = plot ? { clipPath: `url(#${plot.clipPathId})` } : {};

  // For appear, start with opacity 0 to avoid first-frame flash
  const initialOpacity = type === 'appear' ? 0 : undefined;

  return (
    <g ref={outerRef} opacity={initialOpacity as any} {...clipProps}>
      {worldGroupTransform ? (
        <g transform={worldGroupTransform}>{children}</g>
      ) : (
        children as any
      )}
    </g>
  );
}

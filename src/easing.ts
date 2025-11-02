export type EasingName =
  | "linear"
  | "easeInQuad"
  | "easeOutQuad"
  | "easeInOutSine"
  | "easeInOutCubic";

export type EasingFn = (t: number) => number;

export const easing: Record<EasingName, EasingFn> = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutSine: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};

export function getEasing(fn?: EasingName | EasingFn): EasingFn {
  if (!fn) return easing.linear;
  if (typeof fn === "function") return fn;
  return easing[fn] ?? easing.linear;
}

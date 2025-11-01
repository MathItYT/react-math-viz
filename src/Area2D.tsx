import React from "react";
import { usePlot } from "./context";

export type Area2DProps = {
  f: (x: number) => number;
  a: number;
  b: number;
  baseline?: number | ((x: number) => number);
  samples?: number;
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  clip?: boolean;
};

export function Area2D({ f, a, b, baseline = 0, samples = 300, fill = "rgba(21,101,192,0.15)", fillOpacity, stroke = "#1565c0", strokeWidth = 1, clip = true }: Area2DProps) {
  const { worldToScreen, clipPathId } = usePlot();
  const d = React.useMemo(() => {
    const n = Math.max(2, Math.floor(samples));
    const x0 = Math.min(a, b);
    const x1 = Math.max(a, b);
    const ptsTop: Array<{ x: number; y: number }> = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = x0 + t * (x1 - x0);
      ptsTop.push(worldToScreen(x, f(x)));
    }
    const ptsBase: Array<{ x: number; y: number }> = [];
    for (let i = n; i >= 0; i--) {
      const t = i / n;
      const x = x0 + t * (x1 - x0);
      const yb = typeof baseline === 'number' ? baseline : baseline(x);
      ptsBase.push(worldToScreen(x, yb));
    }
    if (ptsTop.length === 0) return "";
    const start = ptsTop[0];
    let s = `M ${start.x} ${start.y}`;
    for (let i = 1; i < ptsTop.length; i++) s += ` L ${ptsTop[i].x} ${ptsTop[i].y}`;
    for (let i = 0; i < ptsBase.length; i++) s += ` L ${ptsBase[i].x} ${ptsBase[i].y}`;
    s += " Z";
    return s;
  }, [a, b, samples, baseline, f, worldToScreen]);

  return (
    <path d={d} fill={fill} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={strokeWidth} clipPath={clip ? `url(#${clipPathId})` : undefined} />
  );
}

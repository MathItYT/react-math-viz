import React from "react";
import { usePlot } from "./context";
import { Vector2D } from "./Vector2D";

export type VectorField2DProps = {
  v: (x: number, y: number) => { vx: number; vy: number } | [number, number];
  // Sampling layout
  mode?: "world" | "viewport"; // world: grid sticks to world coords. viewport: grid tied to viewport lattice.
  origin?: [number, number]; // for mode="world" grid alignment (default [0,0])
  stepX?: number; // world step size in X for mode="world"
  stepY?: number; // world step size in Y for mode="world"
  countX?: number; // used for mode="viewport" or initial step estimation
  countY?: number; // used for mode="viewport" or initial step estimation
  // Arrow styling
  normalize?: boolean; // if true, arrows have same length (scaled)
  scale?: number; // world length when normalize=true; multiplier otherwise
  color?: string;
  strokeWidth?: number;
  headSize?: number; // px
  clip?: boolean;
};

export function VectorField2D({
  v,
  mode = "world",
  origin = [0, 0],
  stepX,
  stepY,
  countX = 16,
  countY = 12,
  normalize = true,
  scale,
  color = "#334155",
  strokeWidth = 1.5,
  headSize = 8,
}: VectorField2DProps) {
  const { xRange, yRange } = usePlot();
  const xmin = Math.min(xRange[0], xRange[1]);
  const xmax = Math.max(xRange[0], xRange[1]);
  const ymin = Math.min(yRange[0], yRange[1]);
  const ymax = Math.max(yRange[0], yRange[1]);

  // Persist initial step when mode="world" and no step provided
  const initStepRef = React.useRef<{ sx: number; sy: number } | null>(null);
  if (mode === "world" && !initStepRef.current) {
    const sx0 = (xmax - xmin) / Math.max(1, countX - 1);
    const sy0 = (ymax - ymin) / Math.max(1, countY - 1);
    initStepRef.current = { sx: sx0, sy: sy0 };
  }

  const arrows = React.useMemo(() => {
    const nodes: React.ReactNode[] = [];

    if (mode === "world") {
      const sx = stepX ?? initStepRef.current!.sx;
      const sy = stepY ?? initStepRef.current!.sy;
      const [ox, oy] = origin;
      // index ranges covering viewport
      const iMin = Math.ceil((xmin - ox) / sx);
      const iMax = Math.floor((xmax - ox) / sx);
      const jMin = Math.ceil((ymin - oy) / sy);
      const jMax = Math.floor((ymax - oy) / sy);
      const base = (scale ?? (0.35 * Math.hypot(sx, sy)));
      for (let j = jMin; j <= jMax; j++) {
        for (let i = iMin; i <= iMax; i++) {
          const x = ox + i * sx;
          const y = oy + j * sy;
          const vec = v(x, y);
          const vx = Array.isArray(vec) ? vec[0] : vec.vx;
          const vy = Array.isArray(vec) ? vec[1] : vec.vy;
          let mx = vx, my = vy;
          if (normalize) {
            const m = Math.hypot(vx, vy) || 1;
            mx = (vx / m) * base;
            my = (vy / m) * base;
          } else {
            const s = scale ?? 1;
            mx = vx * s;
            my = vy * s;
          }
          nodes.push(
            <Vector2D key={`${i}-${j}`} x1={x} y1={y} x2={x + mx} y2={y + my} stroke={color} strokeWidth={strokeWidth} headSize={headSize} />
          );
        }
      }
      return nodes;
    } else {
      // viewport-tied lattice (previous behavior)
      const dx = (xmax - xmin) / Math.max(1, countX - 1);
      const dy = (ymax - ymin) / Math.max(1, countY - 1);
      const base = (scale ?? (0.35 * Math.hypot(dx, dy)));
      for (let iy = 0; iy < countY; iy++) {
        for (let ix = 0; ix < countX; ix++) {
          const x = xmin + ix * dx;
          const y = ymin + iy * dy;
          const vec = v(x, y);
          const vx = Array.isArray(vec) ? vec[0] : vec.vx;
          const vy = Array.isArray(vec) ? vec[1] : vec.vy;
          let mx = vx, my = vy;
          if (normalize) {
            const m = Math.hypot(vx, vy) || 1;
            mx = (vx / m) * base;
            my = (vy / m) * base;
          } else {
            const s = scale ?? 1;
            mx = vx * s;
            my = vy * s;
          }
          nodes.push(
            <Vector2D key={`${ix}-${iy}`} x1={x} y1={y} x2={x + mx} y2={y + my} stroke={color} strokeWidth={strokeWidth} headSize={headSize} />
          );
        }
      }
      return nodes;
    }
  }, [mode, v, origin, stepX, stepY, xmin, xmax, ymin, ymax, countX, countY, normalize, scale, color, strokeWidth, headSize]);

  return <g>{arrows}</g>;
}

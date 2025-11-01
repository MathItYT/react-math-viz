import React from "react";
import { usePlot } from "./context";

export type ArcProps = {
  cx: number;
  cy: number;
  r: number; // radius in world units
  a0: number; // start angle (radians)
  a1: number; // end angle (radians)
  stroke?: string;
  strokeWidth?: number;
  fill?: string; // if provided, draws a wedge (sector) fill
  fillOpacity?: number;
  clip?: boolean;
};

function polar(cx: number, cy: number, r: number, a: number) {
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number, asWedge: boolean) {
  // Normalize angles
  let start = a0;
  let end = a1;
  const twoPi = Math.PI * 2;
  // Reduce span to at most 2π for SVG arc flags
  let da = end - start;
  // If angles are equal, draw nothing
  if (Math.abs(da) < 1e-12) return "";
  // Normalize to positive sweep direction and track sweep flag
  const sweep = da >= 0 ? 1 : 0; // 1 means positive-angle direction (clockwise in SVG y-down, but our mapping handles orientation)
  da = Math.abs(da);
  if (da > twoPi) da = twoPi;
  // Adjust end from start by da in the chosen sweep direction
  end = sweep ? (start + da) : (start - da);

  const p0 = polar(cx, cy, r, start);
  const p1 = polar(cx, cy, r, end);
  const largeArc = da > Math.PI ? 1 : 0;
  // Path in world coords; will be transformed via worldToScreen per point before rendering
  if (asWedge) {
    return `W ${cx} ${cy} ${p0.x} ${p0.y} ${r} ${largeArc} ${sweep} ${p1.x} ${p1.y}`; // custom token we'll expand
  } else {
    return `A ${p0.x} ${p0.y} ${r} ${largeArc} ${sweep} ${p1.x} ${p1.y}`; // custom token we'll expand
  }
}

export function Arc({ cx, cy, r, a0, a1, stroke = "#333", strokeWidth = 1.5, fill, fillOpacity = 0.2, clip = true }: ArcProps) {
  const { worldToScreen, clipPathId } = usePlot();

  const d = React.useMemo(() => {
    // Sample the arc in world space (circle centered at (cx,cy)) and map to a
    // screen-space polyline. This preserves the correct ellipse (rx != ry) and
    // keeps the arc centered at world (cx,cy) after non-uniform scaling.
    let da = a1 - a0;
    if (Math.abs(da) < 1e-12 || !isFinite(r) || r <= 0) return "";
    const twoPi = Math.PI * 2;
    const sweepSign = da >= 0 ? 1 : -1;
    da = Math.min(twoPi, Math.abs(da));
    const span = da;
    // ~64 segments for full circle (enough for smooth visuals)
    const segments = Math.max(6, Math.ceil(span / (Math.PI / 64)));
    const step = sweepSign * (span / segments);
    const points: {x:number;y:number}[] = [];
    for (let i = 0; i <= segments; i++) {
      const t = a0 + i * step;
      const wx = cx + r * Math.cos(t);
      const wy = cy + r * Math.sin(t);
      points.push(worldToScreen(wx, wy));
    }
    if (!points.length) return "";
    if (fill) {
      const c = worldToScreen(cx, cy);
      let s = `M ${c.x} ${c.y} L ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) s += ` L ${points[i].x} ${points[i].y}`;
      s += " Z";
      return s;
    } else {
      let s = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) s += ` L ${points[i].x} ${points[i].y}`;
      return s;
    }
  }, [cx, cy, r, a0, a1, worldToScreen, fill]);

  if (!d) return null;

  return (
    <path
      d={d}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill={fill ? fill : "none"}
      fillOpacity={fill ? fillOpacity : undefined}
      clipPath={clip ? `url(#${clipPathId})` : undefined}
    />
  );
}

export type CircleProps = {
  cx: number;
  cy: number;
  r: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  fillOpacity?: number;
  clip?: boolean;
};

export function Circle({ cx, cy, r, stroke = "#333", strokeWidth = 1, fill = "none", fillOpacity = 1, clip = true }: CircleProps) {
  const { worldToScreen, clipPathId } = usePlot();
  const c = worldToScreen(cx, cy);
  const rx = Math.abs(r * (worldToScreen(cx + 1, cy).x - c.x));
  const ry = Math.abs(r * (worldToScreen(cx, cy + 1).y - c.y));
  return (
    <g clipPath={clip ? `url(#${clipPathId})` : undefined}>
      <ellipse cx={c.x} cy={c.y} rx={rx} ry={ry} fill={fill} fillOpacity={fill !== "none" ? fillOpacity : undefined} />
      <ellipse cx={c.x} cy={c.y} rx={rx} ry={ry} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
    </g>
  );
}

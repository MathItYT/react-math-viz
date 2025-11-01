import React from "react";
import { usePlot } from "./context";
import { Line } from "./Line";

export type NormalLineProps = {
  f: (x: number) => number;
  x0: number;
  color?: string;
  strokeWidth?: number;
};

export function NormalLine({ f, x0, color = "#10b981", strokeWidth = 1.5 }: NormalLineProps) {
  const { xRange, yRange, innerWidth, innerHeight } = usePlot();
  const span = Math.max(1e-8, Math.abs(xRange[1] - xRange[0]));
  const h = span * 1e-8;
  const y0 = f(x0);
  const dydx = (f(x0 + h) - f(x0 - h)) / (2 * h);

  // Compute a world-space direction vector for the normal that is perpendicular in screen space,
  // accounting for anisotropic scaling between X and Y.
  const scaleX = Math.abs(innerWidth / (xRange[1] - xRange[0]));
  const scaleY = Math.abs(innerHeight / (yRange[1] - yRange[0]));
  let vx = -(scaleY / Math.max(1e-12, scaleX)) * dydx;
  let vy = (scaleX / Math.max(1e-12, scaleY));
  if (!isFinite(dydx)) { vx = 0; vy = 1; }
  if (Math.abs(vx) + Math.abs(vy) < 1e-16) { vx = 0; vy = 1; }

  // Intersect the infinite line p(t) = (x0,y0) + t*(vx,vy) with the viewport bbox
  const xmin = Math.min(xRange[0], xRange[1]);
  const xmax = Math.max(xRange[0], xRange[1]);
  const ymin = Math.min(yRange[0], yRange[1]);
  const ymax = Math.max(yRange[0], yRange[1]);
  const eps = 1e-12;
  const ts: number[] = [];
  if (Math.abs(vx) > eps) { ts.push((xmin - x0) / vx, (xmax - x0) / vx); }
  if (Math.abs(vy) > eps) { ts.push((ymin - y0) / vy, (ymax - y0) / vy); }

  const pts: Array<[number, number, number]> = [];
  for (const t of ts) {
    const x = x0 + vx * t;
    const y = y0 + vy * t;
    if (x >= xmin - 1e-9 && x <= xmax + 1e-9 && y >= ymin - 1e-9 && y <= ymax + 1e-9) {
      pts.push([x, y, t]);
    }
  }
  pts.sort((a, b) => a[2] - b[2]);

  let xA = x0, yA = y0, xB = x0, yB = y0;
  if (pts.length >= 2) {
    [xA, yA] = [pts[0][0], pts[0][1]];
    [xB, yB] = [pts[pts.length - 1][0], pts[pts.length - 1][1]];
  } else if (pts.length === 1) {
    const [xe, ye] = pts[0];
    const ext = Math.max(xmax - xmin, ymax - ymin) || 1;
    xA = xe - vx * ext; yA = ye - vy * ext;
    xB = xe + vx * ext; yB = ye + vy * ext;
  } else {
    // Fallback: vertical through point (should be rare)
    xA = x0; yA = ymin; xB = x0; yB = ymax;
  }

  return <Line x1={xA} y1={yA} x2={xB} y2={yB} stroke={color} strokeWidth={strokeWidth} />;
}

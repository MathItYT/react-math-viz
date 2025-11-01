import React from "react";
import { usePlot } from "./context";
import { Line } from "./Line";

export type Ray2DProps = {
  from: [number, number];
  through: [number, number];
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  clip?: boolean; // Line itself is clipped; this prop kept for API similarity
};

export function Ray2D({ from, through, stroke = "#1565c0", strokeWidth = 2, strokeDasharray }: Ray2DProps) {
  const { xRange, yRange } = usePlot();
  const [x0, y0] = from;
  const [x1, y1] = through;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const eps = 1e-12;
  const candidates: Array<[number, number]> = [];
  // Parametric p(t) = (x0,y0) + t*(dx,dy), t>=0; intersect with bbox lines
  const addIfValid = (t: number) => {
    if (t >= 0 && isFinite(t)) candidates.push([x0 + t * dx, y0 + t * dy]);
  };
  // x = xmin
  if (Math.abs(dx) > eps) addIfValid((xRange[0] - x0) / dx);
  // x = xmax
  if (Math.abs(dx) > eps) addIfValid((xRange[1] - x0) / dx);
  // y = ymin
  if (Math.abs(dy) > eps) addIfValid((yRange[0] - y0) / dy);
  // y = ymax
  if (Math.abs(dy) > eps) addIfValid((yRange[1] - y0) / dy);
  // Choose the farthest valid point along the ray inside the bbox
  let end: [number, number] = [x0, y0];
  let bestT = -Infinity;
  for (const [xe, ye] of candidates) {
    // Check inside bbox with tolerance
    const inside = xe >= Math.min(xRange[0], xRange[1]) - eps && xe <= Math.max(xRange[0], xRange[1]) + eps &&
      ye >= Math.min(yRange[0], yRange[1]) - eps && ye <= Math.max(yRange[0], yRange[1]) + eps;
    if (!inside) continue;
    const t = Math.abs(dx) > Math.abs(dy) ? (xe - x0) / (dx || 1) : (ye - y0) / (dy || 1);
    if (t >= 0 && t > bestT) { bestT = t; end = [xe, ye]; }
  }
  return <Line x1={x0} y1={y0} x2={end[0]} y2={end[1]} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />;
}

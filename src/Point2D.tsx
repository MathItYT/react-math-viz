import React from "react";
import { usePlot } from "./context";

export type Point2DProps = {
  x: number;
  y: number;
  r?: number; // radius in pixels
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  clip?: boolean;
};

export function Point2D({ x, y, r = 3, fill = "#1565c0", stroke = "none", strokeWidth = 1, clip = true }: Point2DProps) {
  const { worldToScreen, clipPathId } = usePlot();
  const p = worldToScreen(x, y);
  return (
    <g clipPath={clip ? `url(#${clipPathId})` : undefined}>
      <circle cx={p.x} cy={p.y} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </g>
  );
}

import React from "react";
import { usePlot } from "./context";

export type LineProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  clip?: boolean;
};

export function Line({
  x1,
  y1,
  x2,
  y2,
  stroke = "#1565c0",
  strokeWidth = 2,
  strokeDasharray,
  clip = true,
}: LineProps) {
  const { worldToScreen, clipPathId } = usePlot();
  const p1 = worldToScreen(x1, y1);
  const p2 = worldToScreen(x2, y2);
  return (
    <line
      x1={p1.x}
      y1={p1.y}
      x2={p2.x}
      y2={p2.y}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      clipPath={clip ? `url(#${clipPathId})` : undefined}
    />
  );
}

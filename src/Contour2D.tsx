import React from "react";
import { Implicit2D } from "./Implicit2D";

export type Contour2DProps = {
  F: (x: number, y: number) => number;
  levels: number[];
  colors?: string[]; // optional per-level colors
  strokeWidth?: number;
  strokeDasharray?: string;
  countX?: number;
  countY?: number;
};

export function Contour2D({ F, levels, colors, strokeWidth = 1, strokeDasharray, countX, countY }: Contour2DProps) {
  return (
    <g>
      {levels.map((lv, i) => (
        <Implicit2D key={i} F={F} level={lv} stroke={colors?.[i % (colors?.length || 1)] || "#1f2937"} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} countX={countX} countY={countY} />
      ))}
    </g>
  );
}

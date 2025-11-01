import React from "react";
import { usePlot } from "./context";
import { Line } from "./Line";

export type TangentLineProps = {
  f: (x: number) => number;
  x0: number;
  color?: string;
  strokeWidth?: number;
};

export function TangentLine({ f, x0, color = "#ef4444", strokeWidth = 1.5 }: TangentLineProps) {
  const { xRange } = usePlot();
  const span = Math.max(1e-8, Math.abs(xRange[1] - xRange[0]));
  const h = span * 1e-8;
  const y0 = f(x0);
  const dydx = (f(x0 + h) - f(x0 - h)) / (2 * h);
  const xA = xRange[0];
  const xB = xRange[1];
  const yA = y0 + dydx * (xA - x0);
  const yB = y0 + dydx * (xB - x0);
  return <Line x1={xA} y1={yA} x2={xB} y2={yB} stroke={color} strokeWidth={strokeWidth} />;
}

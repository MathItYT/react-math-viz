import React from "react";
import { Parametric2D } from "./Parametric2D";

export type PolarFunction2DProps = {
  r: (theta: number) => number;
  thetaRange: [number, number];
  samples?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  clip?: boolean;
  overscan?: number;
};

export function PolarFunction2D({ r, thetaRange, samples = 800, stroke = "#111827", strokeWidth = 2, strokeDasharray, clip = true, overscan = 0 }: PolarFunction2DProps) {
  return (
    <Parametric2D
      x={(t:number) => r(t) * Math.cos(t)}
      y={(t:number) => r(t) * Math.sin(t)}
      tRange={thetaRange}
      samples={samples}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      clip={clip}
      domainFollowsViewport={false}
      overscan={overscan}
    />
  );
}

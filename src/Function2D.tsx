import React from "react";
import { Parametric2D } from "./Parametric2D";

export type Function2DProps = {
  f: (x: number) => number;
  xRange: [number, number];
  samples?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  clip?: boolean;
  domainFollowsViewport?: boolean;
  overscan?: number;
};

export function Function2D({
  f,
  xRange,
  samples = 600,
  stroke = "#1565c0",
  strokeWidth = 2,
  strokeDasharray,
  clip = true,
  domainFollowsViewport = true,
  overscan = 0,
}: Function2DProps) {
  return (
    <Parametric2D
      x={(t: number) => t}
      y={(t: number) => f(t)}
      tRange={xRange}
      samples={samples}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      clip={clip}
      domainFollowsViewport={domainFollowsViewport}
      assumeXEqualsT={true}
      overscan={overscan}
    />
  );
}

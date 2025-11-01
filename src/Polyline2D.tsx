import React from "react";
import { usePlot } from "./context";

export type Polyline2DProps = {
  points: Array<[number, number]>;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  clip?: boolean;
};

export function Polyline2D({ points, stroke = "#1565c0", strokeWidth = 2, strokeDasharray, clip = true }: Polyline2DProps) {
  const { worldToScreen, clipPathId } = usePlot();
  const d = React.useMemo(() => {
    if (!points.length) return "";
    const [x0, y0] = points[0];
    const p0 = worldToScreen(x0, y0);
    let s = `M ${p0.x} ${p0.y}`;
    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i];
      const p = worldToScreen(x, y);
      s += ` L ${p.x} ${p.y}`;
    }
    return s;
  }, [points, worldToScreen]);
  return <path d={d} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} fill="none" clipPath={clip ? `url(#${clipPathId})` : undefined} />;
}

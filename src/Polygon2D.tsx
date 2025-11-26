import React from "react";
import { usePlot } from "./context";

export type Polygon2DProps = {
  points: Array<[number, number]>;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  fillOpacity?: number;
  closed?: boolean;
  clip?: boolean;
};

export function Polygon2D({
  points,
  stroke = "#000",
  strokeWidth = 2,
  fill = "rgba(0,0,0,0.06)",
  fillOpacity = 1,
  closed = true,
  clip = true,
}: Polygon2DProps) {
  const { worldToScreen, clipPathId } = usePlot();
  const d = React.useMemo(() => {
    if (!points.length) return "";
    const [x0, y0] = points[0];
    const p0 = worldToScreen(x0, y0);
    let s = 'M ' + p0.x + ' ' + p0.y;
    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i];
      const p = worldToScreen(x, y);
      s += ' L ' + p.x + ' ' + p.y;
    }
    if (closed) s += ' Z';
    return s;
  }, [points, worldToScreen, closed]);

  return (
    <path
      d={d}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fillOpacity={fillOpacity}
      fill={closed ? fill : "none"}
      clipPath={clip ? `url(#${clipPathId})` : undefined}
    />
  );
}

import React from "react";
import { usePlot } from "./context";

export type Scatter2DProps = {
  points: Array<[number, number] | { x: number; y: number }>;
  r?: number; // radius in pixels (used for default marker)
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  clip?: boolean;
  // Optional custom renderer for each point. Returned node will be wrapped in a <g transform="translate(sx,sy)">
  renderPoint?: (args: { x: number; y: number; i: number; sx: number; sy: number }) => React.ReactNode;
};

export function Scatter2D({ points, r = 2.5, fill = "#1565c0", stroke = "none", strokeWidth = 1, clip = true, renderPoint }: Scatter2DProps) {
  const { worldToScreen, clipPathId } = usePlot();
  const nodes = React.useMemo(() => {
    return points.map((pt, i) => {
      const x = Array.isArray(pt) ? pt[0] : pt.x;
      const y = Array.isArray(pt) ? pt[1] : pt.y;
      const p = worldToScreen(x, y);
      if (renderPoint) {
        return (
          <g key={i} transform={`translate(${p.x},${p.y})`}>
            {renderPoint({ x, y, i, sx: p.x, sy: p.y })}
          </g>
        );
      }
      return <circle key={i} cx={p.x} cy={p.y} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
    });
  }, [points, worldToScreen, r, fill, stroke, strokeWidth, renderPoint]);
  return <g clipPath={clip ? `url(#${clipPathId})` : undefined}>{nodes}</g>;
}

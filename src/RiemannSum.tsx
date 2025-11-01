import React from "react";
import { usePlot } from "./context";

export type RiemannSumMethod = "left" | "right" | "mid" | "trapezoid";

export type RiemannSumProps = {
  f: (x: number) => number;
  a: number;
  b: number;
  n: number;
  method?: RiemannSumMethod;
  baseline?: number; // for drawing rectangles down to this y (default 0)
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  clip?: boolean;
};

export function RiemannSum({ f, a, b, n, method = "mid", baseline = 0, fill = "rgba(21,101,192,0.15)", stroke = "#1565c0", strokeWidth = 1, clip = true }: RiemannSumProps) {
  const { worldToScreen, clipPathId } = usePlot();
  const rects = React.useMemo(() => {
    const rects: Array<string> = [];
    const x0 = Math.min(a, b);
    const x1 = Math.max(a, b);
    const dx = (x1 - x0) / Math.max(1, n);
    for (let i = 0; i < n; i++) {
      let xLeft = x0 + i * dx;
      let xRight = xLeft + dx;
      let heightY: number;
      if (method === "left") heightY = f(xLeft);
      else if (method === "right") heightY = f(xRight);
      else if (method === "mid") heightY = f((xLeft + xRight) * 0.5);
      else /* trapezoid */ heightY = (f(xLeft) + f(xRight)) * 0.5;

      const yTop = method === "trapezoid" ? undefined : heightY;
      if (method === "trapezoid") {
        const p1 = worldToScreen(xLeft, baseline);
        const p2 = worldToScreen(xLeft, f(xLeft));
        const p3 = worldToScreen(xRight, f(xRight));
        const p4 = worldToScreen(xRight, baseline);
        rects.push(`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`);
      } else {
        const p1 = worldToScreen(xLeft, baseline);
        const p2 = worldToScreen(xLeft, yTop as number);
        const p3 = worldToScreen(xRight, yTop as number);
        const p4 = worldToScreen(xRight, baseline);
        rects.push(`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`);
      }
    }
    return rects;
  }, [a, b, n, method, baseline, f, worldToScreen]);

  return (
    <g clipPath={clip ? `url(#${clipPathId})` : undefined}>
      {rects.map((d, i) => (
        <path key={i} d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      ))}
    </g>
  );
}

import React from "react";
import { Arc } from "./Arc";

export type AngleMarkerProps = {
  center: [number, number];
  a: [number, number];
  b: [number, number];
  r?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  fillOpacity?: number;
};

export function AngleMarker({ center, a, b, r = 0.3, stroke = "#ef4444", strokeWidth = 2, fill, fillOpacity = 0.15 }: AngleMarkerProps) {
  const [cx, cy] = center;
  const ang = (p: [number, number]) => Math.atan2(p[1] - cy, p[0] - cx);
  let a0 = ang(a);
  let a1 = ang(b);
  // Normalize to shortest positive sweep from a0 to a1
  let da = a1 - a0;
  while (da <= -Math.PI) { a1 += 2 * Math.PI; da = a1 - a0; }
  while (da > Math.PI) { a1 -= 2 * Math.PI; da = a1 - a0; }
  return <Arc cx={cx} cy={cy} r={r} a0={a0} a1={a1} stroke={stroke} strokeWidth={strokeWidth} fill={fill} fillOpacity={fill ? fillOpacity : undefined as any} />;
}

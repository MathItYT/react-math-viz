import React from "react";
import { usePlot } from "./context";

export type Bezier2DProps =
  | { kind: "quadratic"; p0: [number, number]; p1: [number, number]; p2: [number, number]; samples?: number; stroke?: string; strokeWidth?: number; strokeDasharray?: string; clip?: boolean }
  | { kind: "cubic"; p0: [number, number]; p1: [number, number]; p2: [number, number]; p3: [number, number]; samples?: number; stroke?: string; strokeWidth?: number; strokeDasharray?: string; clip?: boolean };

export function Bezier2D(props: Bezier2DProps) {
  const { worldToScreen, clipPathId } = usePlot();
  const samples = props.samples ?? 120;
  const stroke = (props as any).stroke ?? "#1565c0";
  const strokeWidth = (props as any).strokeWidth ?? 2;
  const strokeDasharray = (props as any).strokeDasharray as string | undefined;
  const clip = (props as any).clip ?? true;

  const points = React.useMemo(() => {
    const pts: Array<{ x: number; y: number }> = [];
    if (props.kind === "quadratic") {
      const [x0, y0] = props.p0;
      const [x1, y1] = props.p1;
      const [x2, y2] = props.p2;
      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const u = 1 - t;
        const wx = u * u * x0 + 2 * u * t * x1 + t * t * x2;
        const wy = u * u * y0 + 2 * u * t * y1 + t * t * y2;
        pts.push(worldToScreen(wx, wy));
      }
    } else {
      const [x0, y0] = props.p0;
      const [x1, y1] = props.p1;
      const [x2, y2] = props.p2;
      const [x3, y3] = (props as any).p3 as [number, number];
      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const u = 1 - t;
        const wx = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
        const wy = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
        pts.push(worldToScreen(wx, wy));
      }
    }
    return pts;
  }, [(props as any).p0?.[0], (props as any).p0?.[1], (props as any).p1?.[0], (props as any).p1?.[1], (props as any).p2?.[0], (props as any).p2?.[1], (props as any).kind, (props as any).p3?.[0], (props as any).p3?.[1], samples, worldToScreen]);

  const d = React.useMemo(() => {
    if (points.length === 0) return "";
    const [p0, ...rest] = points;
    return 'M ' + p0.x + ' ' + p0.y + ' ' + rest.map(p => 'L ' + p.x + ' ' + p.y).join(' ');
  }, [points]);

  return <path d={d} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} fill="none" clipPath={clip ? `url(#${clipPathId})` : undefined} />;
}

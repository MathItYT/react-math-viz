import React from "react";
import { usePlot } from "./context";

export type DistanceMarkerProps = {
  x1: number; y1: number; x2: number; y2: number;
  tickSize?: number; // in pixels, length of end ticks
  stroke?: string;
  strokeWidth?: number;
  label?: React.ReactNode;
  labelOffsetPx?: number; // shift label away from segment (perpendicular) in px
  clip?: boolean;
};

export function DistanceMarker({ x1, y1, x2, y2, tickSize = 8, stroke = "#333", strokeWidth = 1, label, labelOffsetPx = 10, clip = true }: DistanceMarkerProps) {
  const { worldToScreen, clipPathId } = usePlot();
  const p1 = worldToScreen(x1, y1);
  const p2 = worldToScreen(x2, y2);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const ox = -uy;
  const oy = ux;
  const t = tickSize * 0.5;
  const t1a = { x: p1.x + ox * t, y: p1.y + oy * t };
  const t1b = { x: p1.x - ox * t, y: p1.y - oy * t };
  const t2a = { x: p2.x + ox * t, y: p2.y + oy * t };
  const t2b = { x: p2.x - ox * t, y: p2.y - oy * t };
  const mid = { x: (p1.x + p2.x) / 2 + ox * labelOffsetPx, y: (p1.y + p2.y) / 2 + oy * labelOffsetPx };
  return (
    <g clipPath={clip ? `url(#${clipPathId})` : undefined}>
      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={stroke} strokeWidth={strokeWidth} />
      <line x1={t1a.x} y1={t1a.y} x2={t1b.x} y2={t1b.y} stroke={stroke} strokeWidth={strokeWidth} />
      <line x1={t2a.x} y1={t2a.y} x2={t2b.x} y2={t2b.y} stroke={stroke} strokeWidth={strokeWidth} />
      {label && (
        <foreignObject x={Math.min(p1.x, p2.x)} y={Math.min(p1.y, p2.y)} width={Math.abs(p2.x - p1.x) || 1} height={Math.abs(p2.y - p1.y) || 1}>
          <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none', fontFamily: 'system-ui, Segoe UI, Roboto, sans-serif', fontSize: 12, color: '#222' }}>
            <div style={{ position: 'absolute', left: mid.x - Math.min(p1.x, p2.x), top: mid.y - Math.min(p1.y, p2.y), transform: 'translate(-50%, -50%)' }}>{label}</div>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

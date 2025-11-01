import React from "react";
import { usePlot } from "./context";

export type Vector2DProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke?: string;
  strokeWidth?: number;
  headSize?: number; // in pixels
  fillHead?: string;
  clip?: boolean;
};

export function Vector2D({ x1, y1, x2, y2, stroke = "#1565c0", strokeWidth = 2, headSize = 8, fillHead, clip = true }: Vector2DProps) {
  const { worldToScreen, clipPathId } = usePlot();
  const p1 = worldToScreen(x1, y1);
  const p2 = worldToScreen(x2, y2);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const hs = Math.max(2, headSize);
  const backX = p2.x - ux * hs;
  const backY = p2.y - uy * hs;
  const orthoX = -uy;
  const orthoY = ux;
  const w = hs * 0.6;
  const a = { x: p2.x, y: p2.y };
  const b = { x: backX + orthoX * w * 0.5, y: backY + orthoY * w * 0.5 };
  const c = { x: backX - orthoX * w * 0.5, y: backY - orthoY * w * 0.5 };
  return (
    <g clipPath={clip ? `url(#${clipPathId})` : undefined}>
      <line x1={p1.x} y1={p1.y} x2={backX} y2={backY} stroke={stroke} strokeWidth={strokeWidth} />
      <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`} fill={fillHead ?? stroke} />
    </g>
  );
}

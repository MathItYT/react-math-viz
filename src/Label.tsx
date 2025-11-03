import React from "react";
import { usePlot } from "./context";

export type LabelProps = {
  x: number;
  y: number;
  children: React.ReactNode;
  align?: "center" | "left" | "right";
  vAlign?: "middle" | "top" | "bottom";
  dx?: number; // pixel offset x
  dy?: number; // pixel offset y
  pointerEvents?: "auto" | "none";
  width?: string | number;
  height?: string | number;
};

export function Label({ x, y, children, align = "center", vAlign = "middle", dx = 0, dy = 0, pointerEvents = "auto", width, height }: LabelProps) {
  const { worldToScreen, margin, innerWidth, innerHeight } = usePlot();
  const p = worldToScreen(x, y);

  const transformX = align === "center" ? "-50%" : (align === "right" ? "-100%" : "0");
  const transformY = vAlign === "middle" ? "-50%" : (vAlign === "bottom" ? "-100%" : "0");

  // Place a foreignObject covering the plotting area; position child absolutely inside it
  const left = p.x - margin.left + dx;
  const top = p.y - margin.top + dy;

  return (
    <foreignObject x={margin.left} y={margin.top} width={innerWidth} height={innerHeight}>
      <div style={{ position: "relative", width: width || "100%", height: height || "100%", pointerEvents: "none", fontFamily: "system-ui, Segoe UI, Roboto, sans-serif", fontSize: 12, color: "#222" }}>
        <div style={{ position: "absolute", left, top, transform: `translate(${transformX}, ${transformY})`, pointerEvents }}>
          {children}
        </div>
      </div>
    </foreignObject>
  );
}

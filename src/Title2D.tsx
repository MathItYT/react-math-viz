import React from "react";
import { usePlot } from "./context";

export type Title2DProps = {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  /** Vertical offset in pixels from the top margin area. Positive moves down. */
  offsetY?: number;
};

export function Title2D({ children, align = 'center', offsetY = 2 }: Title2DProps) {
  const { margin, innerWidth } = usePlot();
  const x = align === 'left' ? margin.left + 4 : align === 'right' ? margin.left + innerWidth - 4 : margin.left + innerWidth / 2;
  const transform = align === 'left' ? 'translate(0, 0)' : align === 'right' ? 'translate(-100%, 0)' : 'translate(-50%, 0)';
  return (
    <foreignObject x={margin.left} y={0} width={innerWidth} height={margin.top}>
      <div style={{ position:'relative', width:'100%', height:'100%', pointerEvents:'none', fontFamily:'system-ui, Segoe UI, Roboto, sans-serif' }}>
        <div style={{ position:'absolute', left: x - margin.left, top: offsetY, transform, fontSize: 14, fontWeight: 600 }}>{children}</div>
      </div>
    </foreignObject>
  );
}

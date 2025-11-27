import React from "react";
import { usePlot } from "./context";
import { generateTicks, generateTicksFromDelta } from "./utils";

export type Axes2DProps = {
  grid?: boolean | { stroke?: string; strokeWidth?: number; opacity?: number };
  minorGrid?: boolean | { stroke?: string; strokeWidth?: number; opacity?: number };
  xSubdivisions?: number; // number of minor divisions between consecutive major x ticks
  ySubdivisions?: number; // number of minor divisions between consecutive major y ticks
  gridMajorPx?: number | { x?: number; y?: number }; // target pixel spacing between major grid lines
  minMinorPx?: number; // minimum pixel spacing for minor grid lines; auto-reduce subdivisions if needed
  gridXDelta?: number; // explicit major grid step for X (world units)
  gridYDelta?: number; // explicit major grid step for Y (world units)
  xTicks?: number[];
  yTicks?: number[];
  approxXTicks?: number;
  approxYTicks?: number;
  axisColor?: string;
  axisWidth?: number;
  tickSize?: number;
  renderXLabel?: (x: number) => React.ReactNode | null;
  renderYLabel?: (y: number) => React.ReactNode | null;
  labelOffset?: { x?: number; y?: number };
};

export function Axes2D({
  grid = false,
  minorGrid = false,
  xSubdivisions = 0,
  ySubdivisions = 0,
  gridMajorPx = 80,
  minMinorPx = 14,
  gridXDelta,
  gridYDelta,
  xTicks,
  yTicks,
  approxXTicks = 9,
  approxYTicks = 7,
  axisColor = "#333",
  axisWidth = 1,
  tickSize = 6,
  renderXLabel,
  renderYLabel,
  labelOffset = { x: 12, y: 8 },
}: Axes2DProps) {
  const { width, height, xRange, yRange, worldToScreen, clipPathId, innerWidth, innerHeight, margin } = usePlot();

  let xTickVals: number[] = [];
  let yTickVals: number[] = [];

  const inferDelta = (vals: number[]) => {
    const uniq = Array.from(new Set(vals)).sort((a, b) => a - b);
    let best = Infinity;
    for (let i = 1; i < uniq.length; i++) {
      const d = Math.abs(uniq[i] - uniq[i - 1]);
      if (d > 1e-12 && d < best) best = d;
    }
    return isFinite(best) ? best : undefined;
  };

  const xDeltaInferred = xTicks && xTicks.length >= 2 ? inferDelta(xTicks) : undefined;
  const yDeltaInferred = yTicks && yTicks.length >= 2 ? inferDelta(yTicks) : undefined;
  const xDeltaBase = typeof gridXDelta === 'number' && gridXDelta > 0 ? gridXDelta : xDeltaInferred;
  const yDeltaBase = typeof gridYDelta === 'number' && gridYDelta > 0 ? gridYDelta : yDeltaInferred;

  const p00 = worldToScreen(0, 0);
  const p10 = worldToScreen(1, 0);
  const p01 = worldToScreen(0, 1);
  const pxPerUnitX = Math.max(1e-9, Math.abs(p10.x - p00.x));
  const pxPerUnitY = Math.max(1e-9, Math.abs(p01.y - p00.y));
  const targetMajorPxX = typeof gridMajorPx === 'number' ? gridMajorPx : (gridMajorPx.x ?? 80);
  const targetMajorPxY = typeof gridMajorPx === 'number' ? gridMajorPx : (gridMajorPx.y ?? 80);
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  const coarsenDelta = (delta: number | undefined, pxPerUnit: number, targetPx: number) => {
    if (!delta || !(delta > 0)) return undefined;
    let d = delta;
    const factors = [2, 2.5, 2];
    let fi = 0;
    let guard = 0;
    while (pxPerUnit * d < targetPx && guard < 20) {
      d *= factors[fi % factors.length];
      fi += 1;
      guard += 1;
    }
    return d;
  };

  const approxCountX = clamp(Math.round(innerWidth / targetMajorPxX), 2, 40);
  const approxCountY = clamp(Math.round(innerHeight / targetMajorPxY), 2, 40);

  const xDeltaCoarse = typeof gridXDelta === 'number' && gridXDelta > 0 ? gridXDelta : coarsenDelta(xDeltaBase, pxPerUnitX, targetMajorPxX);
  const yDeltaCoarse = typeof gridYDelta === 'number' && gridYDelta > 0 ? gridYDelta : coarsenDelta(yDeltaBase, pxPerUnitY, targetMajorPxY);

  const gridXMajor = xDeltaCoarse ? generateTicksFromDelta(xRange[0], xRange[1], xDeltaCoarse, 0) : generateTicks(xRange[0], xRange[1], approxCountX);
  const gridYMajor = yDeltaCoarse ? generateTicksFromDelta(yRange[0], yRange[1], yDeltaCoarse, 0) : generateTicks(yRange[0], yRange[1], approxCountY);

  const gridXMajorFinal = xDeltaBase && gridXMajor.length <= 1 ? generateTicks(xRange[0], xRange[1], approxCountX) : gridXMajor;
  const gridYMajorFinal = yDeltaBase && gridYMajor.length <= 1 ? generateTicks(yRange[0], yRange[1], approxCountY) : gridYMajor;

  if (xTicks && xTicks.length) xTickVals = xTicks;
  else if (typeof gridXDelta === 'number' && gridXDelta > 0) xTickVals = gridXMajorFinal;
  else xTickVals = generateTicks(xRange[0], xRange[1], approxXTicks);

  if (yTicks && yTicks.length) yTickVals = yTicks;
  else if (typeof gridYDelta === 'number' && gridYDelta > 0) yTickVals = gridYMajorFinal;
  else yTickVals = generateTicks(yRange[0], yRange[1], approxYTicks);

  const segMinMinorSubs = (majors: number[], desired: number, pxPerUnit: number) => {
    if (!desired || majors.length < 2) return 0;
    let maxSubs = Infinity;
    for (let i = 1; i < majors.length; i++) {
      const seg = Math.abs(majors[i] - majors[i - 1]);
      const segPx = pxPerUnit * seg;
      const allowed = Math.floor(segPx / Math.max(1, minMinorPx)) - 1;
      if (allowed < maxSubs) maxSubs = allowed;
    }
    return Math.max(0, Math.min(desired, isFinite(maxSubs) ? maxSubs : 0));
  };

  const xSubEff = segMinMinorSubs(gridXMajorFinal, xSubdivisions, pxPerUnitX);
  const ySubEff = segMinMinorSubs(gridYMajorFinal, ySubdivisions, pxPerUnitY);

  const zeroXInRange = xRange[0] <= 0 && 0 <= xRange[1];
  const zeroYInRange = yRange[0] <= 0 && 0 <= yRange[1];

  const axisYValue = zeroYInRange ? 0 : (Math.abs(yRange[0]) <= Math.abs(yRange[1]) ? yRange[0] : yRange[1]);
  const axisXValue = zeroXInRange ? 0 : (Math.abs(xRange[0]) <= Math.abs(xRange[1]) ? xRange[0] : xRange[1]);

  const axisX1 = worldToScreen(xRange[0], axisYValue);
  const axisX2 = worldToScreen(xRange[1], axisYValue);
  const axisY1 = worldToScreen(axisXValue, yRange[0]);
  const axisY2 = worldToScreen(axisXValue, yRange[1]);

  const gridCfg = typeof grid === 'boolean' ? { stroke: '#999', strokeWidth: 1, opacity: 0.15 } : grid;
  const minorGridCfgRaw = typeof minorGrid === 'boolean' ? {} : (minorGrid || {});
  const minorGridCfg = {
    stroke: minorGridCfgRaw.stroke ?? gridCfg?.stroke ?? '#999',
    strokeWidth: minorGridCfgRaw.strokeWidth ?? Math.max(0.5, (gridCfg?.strokeWidth ?? 1) * 0.6),
    opacity: minorGridCfgRaw.opacity ?? Math.min(1, (gridCfg?.opacity ?? 0.15) * 0.9),
  };

  if ((grid && !minorGrid) && (xSubdivisions === 0 && ySubdivisions === 0)) {
    xSubdivisions = 4;
    ySubdivisions = 4;
    minorGrid = true;
  }

  const labelYForX = zeroYInRange ? 0 : (Math.abs(yRange[0]) <= Math.abs(yRange[1]) ? yRange[0] : yRange[1]);
  const labelXForY = zeroXInRange ? 0 : (Math.abs(xRange[0]) <= Math.abs(xRange[1]) ? xRange[0] : xRange[1]);

  const baseXLabelOffset = labelOffset.y ?? 8;
  const xLabelAbove = zeroYInRange ? false : (labelYForX === yRange[1]);

  const labels = (
    // 2. Cambia x, y, width, height para cubrir todo el SVG
    <foreignObject x={0} y={0} width={width} height={height} style={{ overflow: 'visible' }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none', fontFamily: 'system-ui, Segoe UI, Roboto, sans-serif', fontSize: 12, color: '#222', userSelect: 'none' }}>
        {renderXLabel && xTickVals.map((x) => {
          const node = renderXLabel(x);
          if (node == null) return null;
          const p = worldToScreen(x, labelYForX);
          const topAbs = xLabelAbove ? p.y - baseXLabelOffset : p.y + baseXLabelOffset;
          const transform = xLabelAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)';
          return (
            // 3. Elimina "- margin.left" y "- margin.top" aquí
            <div key={`xl-${x}`} style={{ position: 'absolute', left: p.x, top: topAbs, transform, pointerEvents: 'auto' }}>{node}</div>
          );
        })}
        {renderYLabel && yTickVals.map((y) => {
          const node = renderYLabel(y);
          if (node == null) return null;
          const p = worldToScreen(labelXForY, y);
          const placeLeft = zeroXInRange ? true : (labelXForY === xRange[0]);
          const baseX = labelOffset.x ?? 12;
          const leftAbs = p.x + (placeLeft ? -baseX : baseX);
          const transform = placeLeft ? 'translate(-100%, -50%)' : 'translate(0, -50%)';
          const textAlign = placeLeft ? 'right' as const : 'left' as const;
          return (
            // 3. Elimina "- margin.left" y "- margin.top" aquí también
            <div key={`yl-${y}`} style={{ position: 'absolute', left: leftAbs, top: p.y, transform, textAlign, pointerEvents: 'auto' }}>{node}</div>
          );
        })}
      </div>
    </foreignObject>
  );

  return (
    <g clipPath={`url(#${clipPathId})`}>
      {minorGrid && (xSubdivisions > 0 || ySubdivisions > 0) && (
        <g stroke={minorGridCfg.stroke} strokeWidth={minorGridCfg.strokeWidth} opacity={minorGridCfg.opacity} shapeRendering="crispEdges" vectorEffect="non-scaling-stroke">
          {xSubEff > 0 && gridXMajorFinal.length > 1 && gridXMajorFinal.flatMap((xv, i) => {
            if (i === gridXMajorFinal.length - 1) return [] as React.ReactNode[];
            const next = gridXMajorFinal[i + 1];
            const dt = (next - xv) / (xSubEff + 1);
            const nodes: React.ReactNode[] = [];
            for (let j = 1; j <= xSubEff; j++) {
              const x = xv + j * dt;
              const p1 = worldToScreen(x, yRange[0]);
              const p2 = worldToScreen(x, yRange[1]);
              nodes.push(<line key={`gvm-${i}-${j}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />);
            }
            return nodes;
          })}
          {ySubEff > 0 && gridYMajorFinal.length > 1 && gridYMajorFinal.flatMap((yv, i) => {
            if (i === gridYMajorFinal.length - 1) return [] as React.ReactNode[];
            const next = gridYMajorFinal[i + 1];
            const dt = (next - yv) / (ySubEff + 1);
            const nodes: React.ReactNode[] = [];
            for (let j = 1; j <= ySubEff; j++) {
              const y = yv + j * dt;
              const p1 = worldToScreen(xRange[0], y);
              const p2 = worldToScreen(xRange[1], y);
              nodes.push(<line key={`ghm-${i}-${j}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />);
            }
            return nodes;
          })}
        </g>
      )}
      {grid && (
        <g stroke={gridCfg?.stroke} strokeWidth={gridCfg?.strokeWidth} opacity={gridCfg?.opacity} shapeRendering="crispEdges" vectorEffect="non-scaling-stroke">
          {zeroYInRange && (() => {
            const p1 = worldToScreen(xRange[0], 0);
            const p2 = worldToScreen(xRange[1], 0);
            return <line key={`gh-0`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />;
          })()}
          {zeroXInRange && (() => {
            const p1 = worldToScreen(0, yRange[0]);
            const p2 = worldToScreen(0, yRange[1]);
            return <line key={`gv-0`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />;
          })()}
          {gridXMajorFinal.map((x) => {
            const p1 = worldToScreen(x, yRange[0]);
            const p2 = worldToScreen(x, yRange[1]);
            return <line key={`gv-${x}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />;
          })}
          {gridYMajorFinal.map((y) => {
            const p1 = worldToScreen(xRange[0], y);
            const p2 = worldToScreen(xRange[1], y);
            return <line key={`gh-${y}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />;
          })}
        </g>
      )}

      <g stroke={axisColor} strokeWidth={axisWidth}>
        <line x1={axisX1.x} y1={axisX1.y} x2={axisX2.x} y2={axisX2.y} />
        <line x1={axisY1.x} y1={axisY1.y} x2={axisY2.x} y2={axisY2.y} />
      </g>

      <g stroke={axisColor} strokeWidth={axisWidth}>
        {xTickVals.map((x) => {
          const p = worldToScreen(x, axisYValue);
          const y0 = p.y - tickSize / 2;
          const y1 = p.y + tickSize / 2;
          return <line key={`tx-${x}`} x1={p.x} y1={y0} x2={p.x} y2={y1} />;
        })}
        {yTickVals.map((y) => {
          const p = worldToScreen(axisXValue, y);
          const x0 = p.x - tickSize / 2;
          const x1 = p.x + tickSize / 2;
          return <line key={`ty-${y}`} x1={x0} y1={p.y} x2={x1} y2={p.y} />;
        })}
      </g>

      {labels}
    </g>
  );
}

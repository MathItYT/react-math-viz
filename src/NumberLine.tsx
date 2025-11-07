import React from "react";
import { usePlot } from "./context";
import { generateTicks, generateTicksFromDelta } from "./utils";

export type NumberLineProps = {
  /** Horizontal extent of the number line (defaults to plot xRange) */
  xRange?: [number, number];
  /** World Y coordinate where the number line is drawn (defaults to 0) */
  y?: number;
  /** Explicit major tick values. If provided, overrides approxTicks/delta logic. */
  ticks?: number[];
  /** Desired approx count of major ticks when ticks not provided. Default 9. */
  approxTicks?: number;
  /** Fixed delta (world units) between consecutive major ticks. Optional. */
  delta?: number;
  /** Count of minor subdivisions between consecutive majors. Default 0 (none). */
  minorSubdivisions?: number;
  /** Minimum pixel spacing for minor ticks; reduces effective subdivisions when too dense. Default 14. */
  minMinorPx?: number;
  /** Color of the line and ticks. */
  color?: string;
  /** Stroke width of the line and ticks. */
  strokeWidth?: number;
  /** Major tick size in pixels. Default 8. */
  tickSize?: number;
  /** Minor tick size in pixels. Default 5. */
  minorTickSize?: number;
  /** Optional label renderer for each major tick. Return null to hide a label. */
  renderLabel?: (x: number) => React.ReactNode | null;
  /** Pixel offset for labels from the line (positive places below by default transform). Default 8. */
  labelOffset?: number;
  /** Place labels above (true) or below (false) the line. Default false (below). */
  labelsAbove?: boolean;
};

export function NumberLine({
  xRange,
  y = 0,
  ticks,
  approxTicks = 9,
  delta,
  minorSubdivisions = 0,
  minMinorPx = 14,
  color = "#333",
  strokeWidth = 1,
  tickSize = 8,
  minorTickSize = 5,
  renderLabel,
  labelOffset = 8,
  labelsAbove = false,
}: NumberLineProps) {
  const { xRange: plotX, worldToScreen, clipPathId, innerWidth, margin } = usePlot();
  const xr = xRange ?? plotX;

  // Compute pixels-per-unit along X to scale minor density
  const p0 = worldToScreen(0, y);
  const p1 = worldToScreen(1, y);
  const pxPerUnitX = Math.max(1e-9, Math.abs(p1.x - p0.x));

  // Derive major ticks
  let major: number[] = [];
  if (Array.isArray(ticks) && ticks.length > 0) {
    major = Array.from(new Set(ticks)).sort((a, b) => a - b);
  } else if (typeof delta === 'number' && delta > 0) {
    major = generateTicksFromDelta(xr[0], xr[1], delta, 0);
    if (major.length <= 1) {
      // Fallback to automatic "nice" ticks if too few
      major = generateTicks(xr[0], xr[1], approxTicks);
    }
  } else {
    major = generateTicks(xr[0], xr[1], approxTicks);
  }

  // Compute effective minor subdivisions based on pixel density between majors
  const segMinMinorSubs = (majors: number[], desired: number) => {
    if (!desired || majors.length < 2) return 0;
    let maxSubs = Infinity;
    for (let i = 1; i < majors.length; i++) {
      const seg = Math.abs(majors[i] - majors[i - 1]);
      const segPx = pxPerUnitX * seg;
      const allowed = Math.floor(segPx / Math.max(1, minMinorPx)) - 1;
      if (allowed < maxSubs) maxSubs = allowed;
    }
    return Math.max(0, Math.min(desired, isFinite(maxSubs) ? maxSubs : 0));
  };

  const minorSubsEff = segMinMinorSubs(major, minorSubdivisions);

  // Render helpers
  const lineP1 = worldToScreen(xr[0], y);
  const lineP2 = worldToScreen(xr[1], y);

  const labels = renderLabel ? (
    <foreignObject x={margin.left} y={margin.top} width={innerWidth} height={1 /* height doesn't matter for abs pos */}>
      <div style={{ position: 'relative', width: '100%', height: 0, pointerEvents: 'none', fontFamily: 'system-ui, Segoe UI, Roboto, sans-serif', fontSize: 12, color: '#222', userSelect: 'none' }}>
        {major.map((x) => {
          const node = renderLabel(x);
          if (node == null) return null;
          const p = worldToScreen(x, y);
          const topAbs = labelsAbove ? (p.y - labelOffset) : (p.y + labelOffset);
          const transform = labelsAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)';
          return (
            <div key={`nl-xl-${x}`} style={{ position: 'absolute', left: p.x - margin.left, top: topAbs - margin.top, transform, pointerEvents: 'auto' }}>{node}</div>
          );
        })}
      </div>
    </foreignObject>
  ) : null;

  return (
    <g clipPath={`url(#${clipPathId})`} stroke={color} strokeWidth={strokeWidth} shapeRendering="crispEdges" vectorEffect="non-scaling-stroke">
      {/* Base line */}
      <line x1={lineP1.x} y1={lineP1.y} x2={lineP2.x} y2={lineP2.y} />

      {/* Major ticks */}
      {major.map((x) => {
        const p = worldToScreen(x, y);
        const y0 = p.y - tickSize / 2;
        const y1 = p.y + tickSize / 2;
        return <line key={`nl-t-${x}`} x1={p.x} y1={y0} x2={p.x} y2={y1} />;
      })}

      {/* Minor ticks between majors */}
      {minorSubsEff > 0 && major.length > 1 && major.flatMap((xv, i) => {
        if (i === major.length - 1) return [] as React.ReactNode[];
        const next = major[i + 1];
        const dt = (next - xv) / (minorSubsEff + 1);
        const nodes: React.ReactNode[] = [];
        for (let j = 1; j <= minorSubsEff; j++) {
          const x = xv + j * dt;
          const p = worldToScreen(x, y);
          const y0 = p.y - minorTickSize / 2;
          const y1 = p.y + minorTickSize / 2;
          nodes.push(<line key={`nl-tm-${i}-${j}`} x1={p.x} y1={y0} x2={p.x} y2={y1} />);
        }
        return nodes;
      })}

      {labels}
    </g>
  );
}

export default NumberLine;

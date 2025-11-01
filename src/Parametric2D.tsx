import React from "react";
import { usePlot } from "./context";

export type Parametric2DProps = {
  x: (t: number) => number;
  y: (t: number) => number;
  tRange: [number, number];
  samples?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  fill?: string;
  clip?: boolean;
  // When true, restrict the effective t-range to what's visible in the current xRange viewport (plus overscan)
  domainFollowsViewport?: boolean;
  // If true, we assume x(t) = t so we can map viewport x-range directly to t-range for performance/precision
  assumeXEqualsT?: boolean;
  // Fraction of the current viewport width to extend on both sides when domainFollowsViewport is enabled
  overscan?: number;
};

export function Parametric2D({
  x,
  y,
  tRange,
  samples = 600,
  stroke = "#1565c0",
  strokeWidth = 2,
  strokeDasharray,
  fill = "none",
  clip = true,
  domainFollowsViewport = false,
  assumeXEqualsT = false,
  overscan = 0,
}: Parametric2DProps) {
  const { worldToScreen, clipPathId, xRange, yRange } = usePlot();

  // Determine effective t-range based on viewport if requested
  const [t0Eff, t1Eff, viewportRect] = React.useMemo(() => {
    let [t0, t1] = tRange;
    if (!domainFollowsViewport) return [t0, t1] as [number, number];
    const [xmin, xmax] = xRange;
    const [ymin, ymax] = yRange;
    const padX = (xmax - xmin) * overscan;
    const padY = (ymax - ymin) * overscan;
    const vx0 = Math.min(xmin, xmax) - padX;
    const vx1 = Math.max(xmin, xmax) + padX;
    const vy0 = Math.min(ymin, ymax) - padY;
    const vy1 = Math.max(ymin, ymax) + padY;
    if (assumeXEqualsT) {
      // When x(t) = t, the effective domain is the viewport x-range itself (ignore provided tRange bounds)
      const nt0 = vx0;
      const nt1 = vx1;
      return [nt0, nt1, { vx0, vx1, vy0, vy1 }] as [number, number, { vx0: number; vx1: number; vy0: number; vy1: number }];
    }
    // Generic fallback: coarse scan to find t-interval intersecting viewport in x
    const coarse = 128;
    let found = false;
    let tmin = tRange[1];
    let tmax = tRange[0];
    for (let i = 0; i <= coarse; i++) {
      const tt = tRange[0] + (i / coarse) * (tRange[1] - tRange[0]);
      const xv = x(tt);
      if (xv >= vx0 && xv <= vx1) {
        if (!found) { tmin = tt; tmax = tt; found = true; }
        else { if (tt < tmin) tmin = tt; if (tt > tmax) tmax = tt; }
      }
    }
    if (found) {
      // Expand slightly to avoid clipping partial segments
      const expand = (tmax - tmin) * 0.05;
      t0 = Math.max(tRange[0], tmin - expand);
      t1 = Math.min(tRange[1], tmax + expand);
      return [t0, t1, { vx0, vx1, vy0, vy1 }] as [number, number, { vx0: number; vx1: number; vy0: number; vy1: number }];
    }
    // If nothing found, choose closest end by x-distance
    const x0 = x(tRange[0]);
    const x1 = x(tRange[1]);
    const d0 = Math.min(Math.abs(x0 - vx0), Math.abs(x0 - vx1));
    const d1 = Math.min(Math.abs(x1 - vx0), Math.abs(x1 - vx1));
    const tt0 = d0 <= d1 ? tRange[0] : tRange[1];
    const rect = { vx0, vx1, vy0, vy1 };
    return [tt0, tt0, rect] as [number, number, { vx0: number; vx1: number; vy0: number; vy1: number }];
  }, [tRange[0], tRange[1], domainFollowsViewport, assumeXEqualsT, xRange[0], xRange[1], yRange[0], yRange[1], overscan, x]);

  const n = Math.max(2, Math.floor(samples));
  const dt = (t1Eff - t0Eff) / (n - 1 || 1);

  const d = React.useMemo(() => {
    // Build path with sub-segments only where curve is within the padded viewport rectangle
    const { vx0, vx1, vy0, vy1 } = viewportRect || { vx0: -Infinity, vx1: Infinity, vy0: -Infinity, vy1: Infinity } as any;
    let path = "";
    let hasOpen = false;
    for (let i = 0; i < (n || 2); i++) {
      const t = t0Eff + i * dt;
      const wx = x(t);
      const wy = y(t);
      const inside = wx >= vx0 && wx <= vx1 && wy >= vy0 && wy <= vy1;
      const sp = worldToScreen(wx, wy);
      if (inside) {
        if (!hasOpen) {
          path += (path ? ' ' : '') + 'M ' + sp.x + ' ' + sp.y;
          hasOpen = true;
        } else {
          path += ' L ' + sp.x + ' ' + sp.y;
        }
      } else {
        hasOpen = false;
      }
    }
    return path;
  }, [x, y, t0Eff, t1Eff, n, dt, worldToScreen, viewportRect]);

  return (
    <path
      d={d}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      fill={fill}
      clipPath={clip ? `url(#${clipPathId})` : undefined}
    />
  );
}

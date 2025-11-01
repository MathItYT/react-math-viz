import React from "react";
import { usePlot } from "./context";

export type Heatmap2DProps = {
  f: (x: number, y: number) => number;
  // Sampling layout
  mode?: "world" | "viewport"; // world: tiles are fixed in world coords; viewport: tiles span the viewport evenly
  origin?: [number, number]; // for mode="world" tiling alignment (default [0,0])
  stepX?: number; // world tile width for mode="world"
  stepY?: number; // world tile height for mode="world"
  countX?: number; // used for mode="viewport" or to derive default step in mode="world"
  countY?: number; // used for mode="viewport" or to derive default step in mode="world"
  // Styling
  valueRange?: [number, number]; // if omitted, auto from sampled min/max
  colorMap?: (t: number) => string; // t in [0,1]
  opacity?: number;
  clip?: boolean;
};

function defaultColorMap(t: number): string {
  // simple blue -> cyan -> yellow -> red gradient
  const clamp = (v:number)=>Math.max(0,Math.min(1,v));
  t = clamp(t);
  const r = t < 0.5 ? 0 : Math.round(510*(t-0.5));
  const g = t < 0.5 ? Math.round(510*t) : Math.round(510*(1 - (t-0.5)));
  const b = t < 0.5 ? Math.round(255) : Math.round(255*(1 - (t-0.5)*2));
  return `rgb(${r},${g},${b})`;
}

export function Heatmap2D({ f, mode = "world", origin = [0,0], stepX, stepY, countX = 40, countY = 30, valueRange, colorMap = defaultColorMap, opacity = 0.9, clip = true }: Heatmap2DProps) {
  const { xRange, yRange, worldToScreen, clipPathId } = usePlot();
  const xmin = Math.min(xRange[0], xRange[1]);
  const xmax = Math.max(xRange[0], xRange[1]);
  const ymin = Math.min(yRange[0], yRange[1]);
  const ymax = Math.max(yRange[0], yRange[1]);

  // Persist initial tile size for mode="world" if not provided
  const initStepRef = React.useRef<{ sx: number; sy: number } | null>(null);
  if (mode === "world" && !initStepRef.current) {
    const sx0 = (xmax - xmin) / Math.max(1, countX);
    const sy0 = (ymax - ymin) / Math.max(1, countY);
    initStepRef.current = { sx: sx0, sy: sy0 };
  }

  const rects = React.useMemo(() => {
    let minv = Infinity, maxv = -Infinity;
    const tiles: Array<{ x0:number; y0:number; x1:number; y1:number; v:number }>[] = [] as any;

    if (mode === "world") {
      const sx = stepX ?? initStepRef.current!.sx;
      const sy = stepY ?? initStepRef.current!.sy;
      const [ox, oy] = origin;
      const iMin = Math.floor((xmin - ox) / sx) - 1;
      const iMax = Math.ceil((xmax - ox) / sx) + 1;
      const jMin = Math.floor((ymin - oy) / sy) - 1;
      const jMax = Math.ceil((ymax - oy) / sy) + 1;
      const rows: any[] = [];
      for (let j = jMin; j <= jMax; j++) {
        const row: any[] = [];
        for (let i = iMin; i <= iMax; i++) {
          const x0 = ox + i * sx, y0 = oy + j * sy;
          const x1 = x0 + sx, y1 = y0 + sy;
          const xc = (x0 + x1) * 0.5, yc = (y0 + y1) * 0.5;
          const v = f(xc, yc);
          if (v < minv) minv = v; if (v > maxv) maxv = v;
          row.push({ x0, y0, x1, y1, v });
        }
        rows.push(row);
      }
      (tiles as any).push(...rows);
    } else {
      // viewport-anchored tiles
      const sx = (xmax - xmin) / Math.max(1, countX);
      const sy = (ymax - ymin) / Math.max(1, countY);
      for (let j = 0; j < countY; j++) {
        const row: any[] = [];
        for (let i = 0; i < countX; i++) {
          const x0 = xmin + i * sx, y0 = ymin + j * sy;
          const x1 = x0 + sx, y1 = y0 + sy;
          const xc = (x0 + x1) * 0.5, yc = (y0 + y1) * 0.5;
          const v = f(xc, yc);
          if (v < minv) minv = v; if (v > maxv) maxv = v;
          row.push({ x0, y0, x1, y1, v });
        }
        (tiles as any).push(row);
      }
    }

    if (valueRange) { minv = valueRange[0]; maxv = valueRange[1]; }
    const clampV = (v:number)=>Math.max(minv, Math.min(maxv, v));
    const tOf = (v:number)=> (maxv === minv ? 0.5 : (clampV(v) - minv) / (maxv - minv));

    const nodes: React.ReactNode[] = [];
    let key = 0;
    for (const row of tiles as Array<Array<{x0:number;y0:number;x1:number;y1:number;v:number}>>) {
      for (const tile of row) {
        const p = worldToScreen(tile.x0, tile.y0);
        const p2 = worldToScreen(tile.x1, tile.y1);
        const w = Math.abs(p2.x - p.x);
        const h = Math.abs(p2.y - p.y);
        const fill = colorMap(tOf(tile.v));
        nodes.push(<rect key={key++} x={Math.min(p.x, p2.x)} y={Math.min(p.y, p2.y)} width={Math.max(1, w)} height={Math.max(1, h)} fill={fill} opacity={opacity} />);
      }
    }
    return nodes;
  }, [mode, f, origin, stepX, stepY, countX, countY, xmin, xmax, ymin, ymax, worldToScreen, valueRange, colorMap, opacity]);

  return <g clipPath={clip ? `url(#${clipPathId})` : undefined}>{rects}</g>;
}

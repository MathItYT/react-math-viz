import React from "react";
import { usePlot } from "./context";

export type Implicit2DProps = {
  F: (x: number, y: number) => number; // contour of F(x,y) = level
  level?: number;
  countX?: number;
  countY?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  clip?: boolean;
};

// Linear interpolation helper
function lerp(a:number,b:number,t:number){return a+(b-a)*t}

export function Implicit2D({ F, level = 0, countX = 96, countY = 72, stroke = "#111827", strokeWidth = 1.5, strokeDasharray, clip = true }: Implicit2DProps) {
  const { xRange, yRange, worldToScreen, clipPathId } = usePlot();
  const xmin = Math.min(xRange[0], xRange[1]);
  const xmax = Math.max(xRange[0], xRange[1]);
  const ymin = Math.min(yRange[0], yRange[1]);
  const ymax = Math.max(yRange[0], yRange[1]);
  const dx = (xmax - xmin) / Math.max(1, countX);
  const dy = (ymax - ymin) / Math.max(1, countY);

  const segs = React.useMemo(() => {
    // Sample grid values at cell corners
    const vals: number[][] = [];
    for (let iy = 0; iy <= countY; iy++) {
      const row: number[] = [];
      for (let ix = 0; ix <= countX; ix++) {
        const x = xmin + ix * dx;
        const y = ymin + iy * dy;
        row.push(F(x, y) - level);
      }
      vals.push(row);
    }

    const lines: Array<string> = [];
    // Marching squares per cell
    for (let iy = 0; iy < countY; iy++) {
      for (let ix = 0; ix < countX; ix++) {
        const v00 = vals[iy][ix];
        const v10 = vals[iy][ix+1];
        const v01 = vals[iy+1][ix];
        const v11 = vals[iy+1][ix+1];
        const x0 = xmin + ix * dx;
        const y0 = ymin + iy * dy;
        const x1 = x0 + dx;
        const y1 = y0 + dy;

        const idx = (v00>0?1:0) | (v10>0?2:0) | (v11>0?4:0) | (v01>0?8:0);
        if (idx === 0 || idx === 15) continue;

        // helper: edge interpolation returns screen coords
        const edgePoint = (edge:number)=>{
          switch(edge){
            case 0: { // bottom: (x0,y0)-(x1,y0)
              const t = v10===v00?0.5:(0 - v00)/(v10 - v00);
              const xs = lerp(x0,x1,t); const ys = y0; return worldToScreen(xs,ys);
            }
            case 1: { // right: (x1,y0)-(x1,y1)
              const t = v11===v10?0.5:(0 - v10)/(v11 - v10);
              const xs = x1; const ys = lerp(y0,y1,t); return worldToScreen(xs,ys);
            }
            case 2: { // top: (x0,y1)-(x1,y1)
              const t = v11===v01?0.5:(0 - v01)/(v11 - v01);
              const xs = lerp(x0,x1,t); const ys = y1; return worldToScreen(xs,ys);
            }
            case 3: { // left: (x0,y0)-(x0,y1)
              const t = v01===v00?0.5:(0 - v00)/(v01 - v00);
              const xs = x0; const ys = lerp(y0,y1,t); return worldToScreen(xs,ys);
            }
          }
          return worldToScreen(x0,y0);
        };

        // cases from standard marching squares; produce 0,1 or 2 segments
        const table: {[k:number]: [number,number][]} = {
          1:[[3,0]], 2:[[0,1]], 3:[[3,1]], 4:[[1,2]], 5:[[3,2],[0,1]], 6:[[0,2]], 7:[[3,2]],
          8:[[2,3]], 9:[[0,2]], 10:[[1,3],[0,2]], 11:[[1,2]], 12:[[1,3]], 13:[[0,1]], 14:[[3,0]]
        };
        const segEdges = table[idx] || [];
        for (const [e1,e2] of segEdges) {
          const p1 = edgePoint(e1); const p2 = edgePoint(e2);
          lines.push(`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`);
        }
      }
    }
    return lines;
  }, [F, level, countX, countY, xmin, ymin, dx, dy, worldToScreen]);

  return (
    <g clipPath={clip ? `url(#${clipPathId})` : undefined}>
      {segs.map((d,i)=>(<path key={i} d={d} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} fill="none"/>))}
    </g>
  );
}

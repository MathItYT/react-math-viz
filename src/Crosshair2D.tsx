import React from "react";
import { usePlot } from "./context";

// Nota sobre coordenadas:
// `mouse.sx` y `mouse.sy` ya están compensadas por cualquier escala CSS externa
// (ver lógica en Plot2D donde se aplica factor width/rect.width). Por eso aquí
// podemos usarlas directamente como coordenadas "lógicas" del SVG sin aplicar
// ninguna corrección adicional. Si en el futuro se reemplaza la estrategia de
// escalado (por ejemplo dimensionando realmente el SVG en vez de usar transform),
// este componente no necesita cambios porque consumirá los valores normalizados
// que Plot2D le entrega.

export type Crosshair2DProps = {
  color?: string;
  strokeWidth?: number;
  showLabels?: boolean;
  format?: (x:number,y:number)=>string;
};

export function Crosshair2D({ color = "#6b7280", strokeWidth = 1, showLabels = true, format }: Crosshair2DProps) {
  const { mouse, clipPathId, margin, innerWidth, innerHeight } = usePlot();
  if (!mouse?.inside) return null;
  const sx = margin.left + Math.max(0, Math.min(innerWidth, mouse.sx - margin.left));
  const sy = margin.top + Math.max(0, Math.min(innerHeight, mouse.sy - margin.top));
  const label = format ? format(mouse.x, mouse.y) : `(${mouse.x.toFixed(3)}, ${mouse.y.toFixed(3)})`;
  return (
    <g>
      <g clipPath={`url(#${clipPathId})`}>
        <line x1={margin.left} y1={sy} x2={margin.left + innerWidth} y2={sy} stroke={color} strokeWidth={strokeWidth} strokeDasharray="4 4" />
        <line x1={sx} y1={margin.top} x2={sx} y2={margin.top + innerHeight} stroke={color} strokeWidth={strokeWidth} strokeDasharray="4 4" />
      </g>
      {showLabels && (
        <foreignObject x={margin.left} y={margin.top} width={innerWidth} height={innerHeight}>
          <div style={{ position:'relative', width:'100%', height:'100%', pointerEvents:'none', fontFamily:'system-ui, Segoe UI, Roboto, sans-serif', fontSize: 12 }}>
            <div style={{ position:'absolute', left: sx - margin.left + 8, top: sy - margin.top - 8, transform:'translate(0,-100%)', background:'rgba(17,24,39,0.75)', color:'#fff', padding:'2px 6px', borderRadius:4, whiteSpace:'nowrap' }}>{label}</div>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

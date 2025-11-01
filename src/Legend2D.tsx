import React from "react";
import { usePlot } from "./context";

export type LegendItem = {
  label: React.ReactNode;
  color?: string;
  strokeDasharray?: string;
  marker?: React.ReactNode; // optional custom marker
};

export type Legend2DProps = {
  items: LegendItem[];
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  padding?: number;
  bg?: string;
  opacity?: number;
};

export function Legend2D({ items, position = 'top-right', padding = 8, bg = 'rgba(255,255,255,0.9)', opacity = 1 }: Legend2DProps) {
  const { margin, innerWidth, innerHeight } = usePlot();
  const x0 = margin.left;
  const y0 = margin.top;
  const width = innerWidth;
  const height = innerHeight;

  const isTR = position === 'top-right';
  const isBR = position === 'bottom-right';
  const top = (position.startsWith('top') ? y0 + padding : y0 + height - padding);
  const left = (isTR || isBR ? x0 + width - padding : x0 + padding);
  const align = (isTR || isBR) ? 'right' as const : 'left' as const;

  return (
    <foreignObject x={margin.left} y={margin.top} width={innerWidth} height={innerHeight} opacity={opacity}>
      <div style={{ position:'relative', width:'100%', height:'100%', pointerEvents:'none', fontFamily:'system-ui, Segoe UI, Roboto, sans-serif', fontSize: 12 }}>
        <div style={{ position:'absolute', left: left - margin.left, top: top - margin.top, transform:`translate(${align==='right'?'-100%':'0'}, ${position.startsWith('top')? '0' : '-100%'})`, background:bg, border:'1px solid #e5e7eb', borderRadius:6, padding:8, boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
          {items.map((it, i)=> (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, margin:'4px 0', whiteSpace:'nowrap' }}>
              {it.marker ?? <svg width={18} height={10} style={{ flex:'0 0 auto' }}>
                <line x1={0} y1={5} x2={18} y2={5} stroke={it.color ?? '#111'} strokeWidth={2} strokeDasharray={it.strokeDasharray} />
              </svg>}
              <div style={{ pointerEvents:'auto' }}>{it.label}</div>
            </div>
          ))}
        </div>
      </div>
    </foreignObject>
  );
}

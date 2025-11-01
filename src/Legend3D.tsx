import React from "react";
import { useThree } from "./threeContext";

export type Legend3DItem = {
  label: React.ReactNode;
  color?: string;
  marker?: React.ReactNode;
};

export type Legend3DProps = {
  items: Legend3DItem[];
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  bg?: string;
  padding?: number;
};

export function Legend3D({ items, position='top-right', bg='rgba(255,255,255,0.92)', padding=8 }: Legend3DProps) {
  const { htmlOverlay } = useThree();
  if (!htmlOverlay) return null;
  const isTR = position === 'top-right';
  const isBR = position === 'bottom-right';
  const x = isTR || isBR ? 'right' : 'left';
  const y = position.startsWith('top') ? 'top' : 'bottom';
  const style: React.CSSProperties = {
    position:'absolute',
    [x]: padding,
    [y]: padding,
    transform: undefined,
    background: bg,
    border:'1px solid #e5e7eb',
    borderRadius:6,
    padding:8,
    boxShadow:'0 1px 3px rgba(0,0,0,0.1)',
    pointerEvents:'none',
    fontSize:12,
  } as any;
  return (
    <div style={style}>
      {items.map((it, i)=> (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, margin:'4px 0', whiteSpace:'nowrap' }}>
          {it.marker ?? <svg width={18} height={10} style={{ flex:'0 0 auto' }}>
            <line x1={0} y1={5} x2={18} y2={5} stroke={it.color ?? '#111'} strokeWidth={2} />
          </svg>}
          <div>{it.label}</div>
        </div>
      ))}
    </div>
  );
}

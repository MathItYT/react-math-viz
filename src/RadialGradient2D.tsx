import React from "react";
import { usePlot } from "./context";
import type { GradientStop } from "./LinearGradient2D";

export type RadialGradient2DProps = {
  stops: GradientStop[];
  // Optional world-space center/radius
  cx?: number;
  cy?: number;
  r?: number; // world units (mapped along X scale)
  fx?: number;
  fy?: number;
  // Optional paint area in world units (defaults to inner plot)
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
  children: React.ReactNode;
  overlay?: React.ReactNode;
  // Coordinate space: 'world' (default, moves with viewport) or 'screen' (fixed to pixels)
  space?: 'world' | 'screen';
  // Anchoring: when 'mask' (default) and cx/cy not provided, center/r default to the mask's bbox.
  anchor?: 'mask' | 'world' | 'screen';
  // What parts of children reveal the paint through the mask: 'fill' | 'stroke' | 'both'
  reveal?: 'fill' | 'stroke' | 'both';
};

function makeToMask(revealMode: 'fill' | 'stroke' | 'both') {
  function toMask(node: React.ReactNode): React.ReactNode {
    if (!React.isValidElement(node)) return node;
    const props: any = node.props || {};
    const clonedChildren = props.children ? React.Children.map(props.children, toMask) : props.children;
    const extra: any = {};
    if (revealMode === 'fill') {
      extra.fill = '#fff'; extra.stroke = 'none';
    } else if (revealMode === 'stroke') {
      extra.fill = 'none'; extra.stroke = '#fff';
      if (props.strokeWidth == null) extra.strokeWidth = 2;
    } else {
      extra.fill = '#fff'; extra.stroke = '#fff';
      if (props.strokeWidth == null) extra.strokeWidth = 1;
    }
    extra.opacity = 1;
    if (Object.prototype.hasOwnProperty.call(props, 'clip')) extra.clip = false;
    return React.cloneElement(node as any, extra, clonedChildren);
  }
  return toMask;
}

export function RadialGradient2D({ stops, cx, cy, r, fx, fy, x, y, width, height, opacity = 1, children, overlay, space = 'world', anchor = 'mask', reveal = 'fill' }: RadialGradient2DProps) {
  const { margin, innerWidth, innerHeight, xRange, yRange, worldToScreen, clipPathId } = usePlot();
  const idBase = (React as any).useId ? React.useId() : Math.random().toString(36).slice(2);
  const gradId = `rg-${idBase}`;
  const maskId = `rgm-${idBase}`;
  const measureRef = React.useRef<SVGGElement | null>(null);
  const [bbox, setBbox] = React.useState<{ x:number; y:number; width:number; height:number } | null>(null);
  React.useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    try {
      const b = el.getBBox();
      if (isFinite(b.x) && isFinite(b.y) && isFinite(b.width) && isFinite(b.height)) {
        setBbox({ x: b.x, y: b.y, width: b.width, height: b.height });
      }
    } catch {}
  }, [children, xRange[0], xRange[1], yRange[0], yRange[1]]);

  // Paint rectangle in pixels
  let sx = margin.left, sy = margin.top, sw = innerWidth, sh = innerHeight;
  if (typeof x === 'number' && typeof y === 'number' && typeof width === 'number' && typeof height === 'number') {
    const p0 = worldToScreen(x, y);
    const p1 = worldToScreen(x + width, y + height);
    sx = Math.min(p0.x, p1.x);
    sy = Math.min(p0.y, p1.y);
    sw = Math.abs(p1.x - p0.x);
    sh = Math.abs(p1.y - p0.y);
  } else if (anchor === 'mask' && bbox) {
    sx = bbox.x; sy = bbox.y; sw = bbox.width; sh = bbox.height;
  } else if (space === 'world') {
    // Paint rect follows world viewport by default
    const p0 = worldToScreen(xRange[0], yRange[0]);
    const p1 = worldToScreen(xRange[1], yRange[1]);
    sx = Math.min(p0.x, p1.x);
    sy = Math.min(p0.y, p1.y);
    sw = Math.abs(p1.x - p0.x);
    sh = Math.abs(p1.y - p0.y);
  }

  // Center/radius in pixels
  const defaultCxW = (xRange[0] + xRange[1]) / 2;
  const defaultCyW = (yRange[0] + yRange[1]) / 2;
  let cpx: number, cpy: number;
  if (anchor === 'mask' && bbox && (typeof cx !== 'number' && typeof cy !== 'number')) {
    cpx = bbox.x + bbox.width / 2;
    cpy = bbox.y + bbox.height / 2;
  } else if (space === 'world') {
    const c = worldToScreen(cx ?? defaultCxW, cy ?? defaultCyW);
    cpx = c.x; cpy = c.y;
  } else {
    cpx = sx + sw / 2; cpy = sy + sh / 2;
  }

  let rPx: number;
  if (typeof r === 'number') {
    if (space === 'world') {
      const p0 = worldToScreen((cx ?? defaultCxW), (cy ?? defaultCyW));
      const p1 = worldToScreen((cx ?? defaultCxW) + r, (cy ?? defaultCyW));
      rPx = Math.abs(p1.x - p0.x);
    } else {
      rPx = r; // treat as pixels in screen space
    }
  } else if (anchor === 'mask' && bbox) {
    rPx = Math.min(bbox.width, bbox.height) / 2;
  } else {
    rPx = Math.min(sw, sh) / 2;
  }

  let fpx: number, fpy: number;
  if (typeof fx === 'number' || typeof fy === 'number') {
    if (space === 'world') {
      const fp = worldToScreen(fx ?? (cx ?? defaultCxW), fy ?? (cy ?? defaultCyW));
      fpx = fp.x; fpy = fp.y;
    } else {
      fpx = fx ?? cpx; fpy = fy ?? cpy;
    }
  } else { fpx = cpx; fpy = cpy; }

  return (
    <g clipPath={`url(#${clipPathId})`}>
      {/* Hidden measuring group to compute mask bbox in screen space */}
      <g ref={measureRef} style={{ opacity: 0, pointerEvents: 'none' as any }}>{children}</g>
      <defs>
        <radialGradient id={gradId} cx={cpx} cy={cpy} r={rPx} fx={fpx} fy={fpy} gradientUnits="userSpaceOnUse">
          {stops.map((s, i) => (
            <stop key={i} offset={typeof s.offset === 'number' ? String(s.offset) : s.offset} stopColor={s.color} stopOpacity={s.opacity ?? 1} />
          ))}
        </radialGradient>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect x={sx} y={sy} width={sw} height={sh} fill="#000" />
          <g>{React.Children.map(children as any, makeToMask(reveal))}</g>
        </mask>
      </defs>
      <rect x={sx} y={sy} width={sw} height={sh} fill={`url(#${gradId})`} mask={`url(#${maskId})`} opacity={opacity} />
      {overlay ? <g>{overlay}</g> : null}
    </g>
  );
}

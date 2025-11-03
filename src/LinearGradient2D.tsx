import React from "react";
import { usePlot } from "./context";

export type GradientStop = {
  offset: number | string; // 0..1 or '50%'
  color: string;
  opacity?: number;
};

export type LinearGradient2DProps = {
  stops: GradientStop[];
  // Optional gradient line expressed in WORLD coordinates (mapped to pixels).
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  // Optional target rectangle in WORLD coordinates (where the gradient is painted).
  // If omitted, the whole inner plotting area is used.
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
  children: React.ReactNode; // clip geometry (SVG)
  overlay?: React.ReactNode; // visible overlay (labels, etc.)
  // Coordinate space for the gradient line and the default paint rect.
  // 'world' => moves with viewport (default). 'screen' => fixed on screen.
  space?: 'world' | 'screen';
  // Anchoring: when 'mask' and no explicit rect/line, derive from mask bbox so it sticks to shape
  anchor?: 'mask' | 'world' | 'screen';
  // What parts of children reveal the paint through the mask
  // 'fill' (default): interior only, 'stroke': outline only, 'both': interior + outline
  reveal?: 'fill' | 'stroke' | 'both';
};

function toMask(node: React.ReactNode): React.ReactNode {
  if (!React.isValidElement(node)) return node;
  const props: any = node.props || {};
  const clonedChildren = props.children ? React.Children.map(props.children, toMask) : props.children;
  const extra: any = {
    fill: '#fff',
    stroke: 'none',
    opacity: 1,
  };
  if (Object.prototype.hasOwnProperty.call(props, 'clip')) extra.clip = false;
  return React.cloneElement(node as any, extra, clonedChildren);
}

export function LinearGradient2D({ stops, x1, y1, x2, y2, x, y, width, height, opacity = 1, children, overlay, space = 'world', anchor = 'mask', reveal = 'fill' }: LinearGradient2DProps) {
  const { margin, innerWidth, innerHeight, xRange, yRange, worldToScreen, clipPathId } = usePlot();
  const idBase = (React as any).useId ? React.useId() : Math.random().toString(36).slice(2);
  const gradId = `lg-${idBase}`;
  const maskId = `lgm-${idBase}`;
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

  // Compute paint rectangle in pixel space
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
    // Default paint rect tied to the current world viewport
    const p0 = worldToScreen(xRange[0], yRange[0]);
    const p1 = worldToScreen(xRange[1], yRange[1]);
    sx = Math.min(p0.x, p1.x);
    sy = Math.min(p0.y, p1.y);
    sw = Math.abs(p1.x - p0.x);
    sh = Math.abs(p1.y - p0.y);
  }

  // Gradient line in pixel space
  let gx1: number, gy1: number, gx2: number, gy2: number;
  if (anchor === 'mask' && bbox && !(typeof x1 === 'number' || typeof y1 === 'number' || typeof x2 === 'number' || typeof y2 === 'number')) {
    // Default gradient line across the center of mask bbox
    gx1 = sx; gy1 = sy + sh / 2; gx2 = sx + sw; gy2 = sy + sh / 2;
  } else if (space === 'world') {
    if (typeof x1 === 'number' || typeof y1 === 'number' || typeof x2 === 'number' || typeof y2 === 'number') {
      const p1 = worldToScreen(x1 ?? xRange[0], y1 ?? (yRange[0] + yRange[1]) / 2);
      const p2 = worldToScreen(x2 ?? xRange[1], y2 ?? (yRange[0] + yRange[1]) / 2);
      gx1 = p1.x; gy1 = p1.y; gx2 = p2.x; gy2 = p2.y;
    } else {
      // Default: world left->right across current world center
      const p1 = worldToScreen(xRange[0], (yRange[0] + yRange[1]) / 2);
      const p2 = worldToScreen(xRange[1], (yRange[0] + yRange[1]) / 2);
      gx1 = p1.x; gy1 = p1.y; gx2 = p2.x; gy2 = p2.y;
    }
  } else {
    // screen-locked
    gx1 = sx; gy1 = sy + sh / 2; gx2 = sx + sw; gy2 = sy + sh / 2;
  }

  // Clone children for mask according to reveal mode
  function toMask(node: React.ReactNode): React.ReactNode {
    if (!React.isValidElement(node)) return node;
    const props: any = node.props || {};
    const clonedChildren = props.children ? React.Children.map(props.children, toMask) : props.children;
    const extra: any = {};
    if (reveal === 'fill') {
      extra.fill = '#fff'; extra.stroke = 'none';
    } else if (reveal === 'stroke') {
      extra.fill = 'none'; extra.stroke = '#fff';
      // keep user's strokeWidth if any; otherwise default reasonable width
      if (props.strokeWidth == null) extra.strokeWidth = 2;
    } else { // both
      extra.fill = '#fff'; extra.stroke = '#fff';
      if (props.strokeWidth == null) extra.strokeWidth = 1;
    }
    extra.opacity = 1;
    if (Object.prototype.hasOwnProperty.call(props, 'clip')) extra.clip = false;
    return React.cloneElement(node as any, extra, clonedChildren);
  }

  return (
    <g>
      {/* Hidden measuring group to compute mask bbox in screen space */}
      <g ref={measureRef} style={{ opacity: 0, pointerEvents: 'none' as any }}>{children}</g>
      <defs>
        <linearGradient id={gradId} x1={gx1} y1={gy1} x2={gx2} y2={gy2} gradientUnits="userSpaceOnUse">
          {stops.map((s, i) => (
            <stop key={i} offset={typeof s.offset === 'number' ? String(s.offset) : s.offset} stopColor={s.color} stopOpacity={s.opacity ?? 1} />
          ))}
        </linearGradient>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          {/* Black background (fully transparent) */}
          <rect x={sx} y={sy} width={sw} height={sh} fill="#000" />
          {/* Children painted in white to reveal the gradient */}
          <g>{React.Children.map(children as any, toMask)}</g>
        </mask>
      </defs>
      <rect x={sx} y={sy} width={sw} height={sh} fill={`url(#${gradId})`} mask={`url(#${maskId})`} opacity={opacity} />
      {overlay ? <g>{overlay}</g> : null}
    </g>
  );
}

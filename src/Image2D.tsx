import React from "react";
import { usePlot } from "./context";

export type Image2DProps = {
  href: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  preserveAspectRatio?: string; // e.g. 'xMidYMid meet'
  opacity?: number;
  children: React.ReactNode; // clip geometry
  overlay?: React.ReactNode;
  crossOrigin?: string;
  // Coordinate space for default area: 'world' (moves with viewport) | 'screen' (fixed). Default 'world'.
  space?: 'world' | 'screen';
  // Anchoring: when 'mask' and no explicit rect, use mask bbox as paint rect so image sticks to shape
  anchor?: 'mask' | 'world' | 'screen';
  // Optional override for the IMAGE placement itself (x/y/width/height of the <image> tag).
  // Interpreted in the same coordinate space as `space`:
  //  - 'world': numbers are world units (converted via worldToScreen)
  //  - 'screen': numbers are pixels
  imageX?: number;
  imageY?: number;
  imageWidth?: number;
  imageHeight?: number;
  // What parts of children reveal the paint through the mask: 'fill' | 'stroke' | 'both'
  reveal?: 'fill' | 'stroke' | 'both';
};

function toMaskFactory(revealMode: 'fill' | 'stroke' | 'both') {
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
    } else { // both
      extra.fill = '#fff'; extra.stroke = '#fff';
      if (props.strokeWidth == null) extra.strokeWidth = 1;
    }
    extra.opacity = 1;
    if (Object.prototype.hasOwnProperty.call(props, 'clip')) extra.clip = false;
    return React.cloneElement(node as any, extra, clonedChildren);
  }
  return toMask;
}

export function Image2D({ href, x, y, width, height, preserveAspectRatio = 'xMidYMid meet', opacity = 1, children, overlay, crossOrigin, space = 'world', anchor = 'mask', imageX, imageY, imageWidth, imageHeight, reveal = 'fill' }: Image2DProps) {
  const { margin, innerWidth, innerHeight, xRange, yRange, worldToScreen, clipPathId } = usePlot();
  const idBase = (React as any).useId ? React.useId() : Math.random().toString(36).slice(2);
  const maskId = `imm-${idBase}`;
  const measureRef = React.useRef<SVGGElement | null>(null);
  const [bbox, setBbox] = React.useState<{ x:number; y:number; width:number; height:number } | null>(null);
  React.useLayoutEffect(() => {
    const el = measureRef.current; if (!el) return;
    try {
      const b = el.getBBox();
      if (isFinite(b.x) && isFinite(b.y) && isFinite(b.width) && isFinite(b.height)) setBbox({ x:b.x, y:b.y, width:b.width, height:b.height });
    } catch {}
  }, [children, xRange[0], xRange[1], yRange[0], yRange[1]]);

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
    // Default to world viewport rect so image moves/scales with pan/zoom
    const p0 = worldToScreen(xRange[0], yRange[0]);
    const p1 = worldToScreen(xRange[1], yRange[1]);
    sx = Math.min(p0.x, p1.x);
    sy = Math.min(p0.y, p1.y);
    sw = Math.abs(p1.x - p0.x);
    sh = Math.abs(p1.y - p0.y);
  }

  // Image placement defaults to paint rect, but can be overridden by imageX/Y/Width/Height
  let ix = sx, iy = sy, iw = sw, ih = sh;
  const defaultXW = (xRange[0] + xRange[1]) / 2;
  const defaultYW = (yRange[0] + yRange[1]) / 2;
  if (typeof imageX === 'number' || typeof imageY === 'number') {
    if (space === 'world') {
      const p = worldToScreen(imageX ?? defaultXW, imageY ?? defaultYW);
      if (typeof imageX === 'number') ix = p.x;
      if (typeof imageY === 'number') iy = p.y;
    } else {
      if (typeof imageX === 'number') ix = imageX;
      if (typeof imageY === 'number') iy = imageY;
    }
  }
  if (typeof imageWidth === 'number') {
    if (space === 'world') {
      const p0 = worldToScreen(imageX ?? defaultXW, defaultYW);
      const p1 = worldToScreen((imageX ?? defaultXW) + imageWidth, defaultYW);
      iw = Math.abs(p1.x - p0.x);
    } else {
      iw = imageWidth;
    }
  }
  if (typeof imageHeight === 'number') {
    if (space === 'world') {
      const q0 = worldToScreen(defaultXW, imageY ?? defaultYW);
      const q1 = worldToScreen(defaultXW, (imageY ?? defaultYW) + imageHeight);
      ih = Math.abs(q1.y - q0.y);
    } else {
      ih = imageHeight;
    }
  }

  return (
    <g clipPath={`url(#${clipPathId})`}>
      {/* Hidden measuring group to compute mask bbox in screen space */}
      <g ref={measureRef} style={{ opacity: 0, pointerEvents: 'none' as any }}>{children}</g>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect x={sx} y={sy} width={sw} height={sh} fill="#000" />
          <g>{React.Children.map(children as any, toMaskFactory(reveal))}</g>
        </mask>
      </defs>
      {/* eslint-disable-next-line react/forbid-elements */}
      <image href={href} x={ix} y={iy} width={iw} height={ih} preserveAspectRatio={preserveAspectRatio as any} opacity={opacity} mask={`url(#${maskId})`} crossOrigin={crossOrigin as any} />
      {overlay ? <g>{overlay}</g> : null}
    </g>
  );
}

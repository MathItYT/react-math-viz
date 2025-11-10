import React from "react";
import { PlotContext, Margins, Range } from "./context";
import { makeLinearMapper } from "./utils";

export type Plot2DProps = {
  width: number;
  height: number;
  xRange: Range;
  yRange: Range;
  margin?: Partial<Margins>;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  // Interactions
  pannable?: boolean;
  onViewportChange?: (xRange: Range, yRange: Range) => void;
  zoomable?: boolean;
  zoomSpeed?: number;
  pinchZoomable?: boolean;
};

export function Plot2D({
  width,
  height,
  xRange,
  yRange,
  margin,
  children,
  style,
  className,
  pannable = true,
  onViewportChange,
  zoomable = true,
  zoomSpeed = 1.1,
  pinchZoomable = true,
}: Plot2DProps) {
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const m: Margins = {
    top: margin?.top ?? 20,
    right: margin?.right ?? 20,
    bottom: margin?.bottom ?? 30,
    left: margin?.left ?? 40,
  };

  const innerWidth = Math.max(0, width - m.left - m.right);
  const innerHeight = Math.max(0, height - m.top - m.bottom);

  // Viewport state
  const [curXRange, setCurXRange] = React.useState<Range>(xRange);
  const [curYRange, setCurYRange] = React.useState<Range>(yRange);
  React.useEffect(() => { setCurXRange(xRange); }, [xRange[0], xRange[1]]);
  React.useEffect(() => { setCurYRange(yRange); }, [yRange[0], yRange[1]]);

  const xMap = makeLinearMapper(curXRange[0], curXRange[1], 0, innerWidth);
  const yMap = makeLinearMapper(curYRange[0], curYRange[1], innerHeight, 0);
  const worldToScreen = (x: number, y: number) => ({ x: m.left + xMap.f(x), y: m.top + yMap.f(y) });
  const screenToWorld = (sx: number, sy: number) => ({ x: xMap.inv(sx - m.left), y: yMap.inv(sy - m.top) });

  // Overlay and clip
  const [overlayEl, setOverlayEl] = React.useState<HTMLDivElement | null>(null);
  const clipPathId = (React as any).useId ? React.useId() : 'clip-' + Math.random().toString(36).slice(2);

  // Mouse and frozen label
  const [mouse, setMouse] = React.useState<{ sx:number; sy:number; x:number; y:number; inside:boolean }>({ sx:0, sy:0, x:0, y:0, inside:false });
  const frozenLabelRef = React.useRef<{ x:number; y:number } | null>(null);

  // Interaction state machine
  type InteractionMode = 'idle' | 'pan' | 'pinch';
  const interactionRef = React.useRef<{
    mode: InteractionMode;
    startXRange: Range;
    startYRange: Range;
    startSvgX: number;
    startSvgY: number;
    pinchStartDist: number;
    pinchCenterWorld: { x:number; y:number } | null;
    pinchLastDist: number;
  }>({ mode:'idle', startXRange:[0,1], startYRange:[0,1], startSvgX:0, startSvgY:0, pinchStartDist:0, pinchCenterWorld:null, pinchLastDist:0 });
  const pointers = React.useRef<Map<number,{clientX:number; clientY:number}>>(new Map());

  const pxPerUnitX = innerWidth > 0 ? innerWidth / Math.max(1e-12, (curXRange[1] - curXRange[0])) : 1;
  const pxPerUnitY = innerHeight > 0 ? innerHeight / Math.max(1e-12, (curYRange[1] - curYRange[0])) : 1;

  const getSvgPoint = (svg: SVGSVGElement | null, clientX:number, clientY:number) => {
    if (!svg) return { x: clientX, y: clientY };
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const ctm = svg.getScreenCTM();
    return ctm ? pt.matrixTransform(ctm.inverse()) : { x: clientX, y: clientY };
  };

  const startPan = (svg: SVGSVGElement | null, clientX:number, clientY:number) => {
    const svgP = getSvgPoint(svg, clientX, clientY);
    interactionRef.current.mode = 'pan';
    interactionRef.current.startXRange = curXRange;
    interactionRef.current.startYRange = curYRange;
    interactionRef.current.startSvgX = svgP.x;
    interactionRef.current.startSvgY = svgP.y;
    const w = screenToWorld(svgP.x, svgP.y);
    frozenLabelRef.current = { x: w.x, y: w.y };
  };

  const applyPan = (svg: SVGSVGElement | null, clientX:number, clientY:number) => {
    const svgP = getSvgPoint(svg, clientX, clientY);
    const dxPx = svgP.x - interactionRef.current.startSvgX;
    const dyPx = svgP.y - interactionRef.current.startSvgY;
    const dxWorld = dxPx / Math.max(1e-12, pxPerUnitX);
    const dyWorld = -dyPx / Math.max(1e-12, pxPerUnitY);
    const nx: Range = [ interactionRef.current.startXRange[0] - dxWorld, interactionRef.current.startXRange[1] - dxWorld ];
    const ny: Range = [ interactionRef.current.startYRange[0] - dyWorld, interactionRef.current.startYRange[1] - dyWorld ];
    setCurXRange(nx);
    setCurYRange(ny);
    onViewportChange?.(nx, ny);
  };

  const startPinch = (svg: SVGSVGElement | null) => {
    if (pointers.current.size < 2) return;
    const pts = Array.from(pointers.current.values());
    const p0 = pts[0], p1 = pts[1];
    const midX = (p0.clientX + p1.clientX) / 2;
    const midY = (p0.clientY + p1.clientY) / 2;
    const svgMid = getSvgPoint(svg, midX, midY);
    const dx = p0.clientX - p1.clientX;
    const dy = p0.clientY - p1.clientY;
    const dist = Math.max(1e-6, Math.hypot(dx, dy));
    const w = screenToWorld(svgMid.x, svgMid.y);
    interactionRef.current.mode = 'pinch';
    interactionRef.current.pinchStartDist = dist;
    interactionRef.current.pinchLastDist = dist;
    interactionRef.current.pinchCenterWorld = { x: w.x, y: w.y };
  };

  const applyPinch = (svg: SVGSVGElement | null) => {
    if (interactionRef.current.mode !== 'pinch' || !pinchZoomable) return;
    if (pointers.current.size < 2 || !interactionRef.current.pinchCenterWorld) return;
    const pts = Array.from(pointers.current.values());
    const p0 = pts[0], p1 = pts[1];
    const dx = p0.clientX - p1.clientX;
    const dy = p0.clientY - p1.clientY;
    const dist = Math.max(1e-6, Math.hypot(dx, dy));
    const s = dist / Math.max(1e-6, interactionRef.current.pinchLastDist);
    const c = interactionRef.current.pinchCenterWorld;
    const nx: Range = [ c.x + (curXRange[0] - c.x) / s, c.x + (curXRange[1] - c.x) / s ];
    const ny: Range = [ c.y + (curYRange[0] - c.y) / s, c.y + (curYRange[1] - c.y) / s ];
    setCurXRange(nx);
    setCurYRange(ny);
    onViewportChange?.(nx, ny);
    interactionRef.current.pinchLastDist = dist;
  };

  const endInteraction = () => {
    // Keep frozenLabelRef until next pointer move to avoid post-pan jump
    interactionRef.current.mode = 'idle';
    interactionRef.current.pinchCenterWorld = null;
  };

  const onPointerDown = React.useCallback((e: React.PointerEvent<SVGRectElement>) => {
    const svg = (e.currentTarget as any).ownerSVGElement as SVGSVGElement | null;
    try { (e.currentTarget as any).setPointerCapture?.(e.pointerId); } catch {}
    pointers.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
    const isPrimaryMouse = e.pointerType === 'mouse' && e.button === 0;
    // Second pointer -> start pinch
    if (pinchZoomable && pointers.current.size === 2) {
      startPinch(svg);
      return;
    }
    if (pannable && isPrimaryMouse && interactionRef.current.mode === 'idle') {
      startPan(svg, e.clientX, e.clientY);
    }
  }, [pannable, pinchZoomable, curXRange, curYRange]);

  const onPointerMove = React.useCallback((e: React.PointerEvent<SVGRectElement>) => {
    const svg = (e.currentTarget as any).ownerSVGElement as SVGSVGElement | null;
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
    }
    const svgP = getSvgPoint(svg, e.clientX, e.clientY);
    const worldP = screenToWorld(svgP.x, svgP.y);
    if (interactionRef.current.mode === 'pinch') {
      applyPinch(svg);
      setMouse({ sx: svgP.x, sy: svgP.y, x: worldP.x, y: worldP.y, inside: true });
      return;
    }
    if (interactionRef.current.mode === 'pan') {
      applyPan(svg, e.clientX, e.clientY);
      if (frozenLabelRef.current) {
        setMouse({ sx: svgP.x, sy: svgP.y, x: frozenLabelRef.current.x, y: frozenLabelRef.current.y, inside: true });
      } else {
        setMouse({ sx: svgP.x, sy: svgP.y, x: worldP.x, y: worldP.y, inside: true });
      }
      return;
    }
    // idle
    if (frozenLabelRef.current) frozenLabelRef.current = null;
    setMouse({ sx: svgP.x, sy: svgP.y, x: worldP.x, y: worldP.y, inside: true });
  }, [applyPan, applyPinch, screenToWorld]);

  const onPointerUp = React.useCallback((e: React.PointerEvent<SVGRectElement>) => {
    try { (e.currentTarget as any).releasePointerCapture?.(e.pointerId); } catch {}
    pointers.current.delete(e.pointerId);
    if (interactionRef.current.mode === 'pinch') {
      if (pointers.current.size < 2) endInteraction();
    } else if (interactionRef.current.mode === 'pan') {
      endInteraction();
    }
  }, []);

  const onPointerCancel = onPointerUp;

  const onPointerLeaveArea = React.useCallback((e: React.PointerEvent<SVGRectElement>) => {
    onPointerUp(e);
    setMouse(m => ({ ...m, inside: false }));
  }, [onPointerUp]);

  // Wheel zoom
  React.useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!zoomable) return;
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      const svgP = getSvgPoint(svg, e.clientX, e.clientY);
      const w = screenToWorld(svgP.x, svgP.y);
      const factor = e.deltaY < 0 ? (1/zoomSpeed) : zoomSpeed;
      const nx: Range = [ w.x + (curXRange[0] - w.x) * factor, w.x + (curXRange[1] - w.x) * factor ];
      const ny: Range = [ w.y + (curYRange[0] - w.y) * factor, w.y + (curYRange[1] - w.y) * factor ];
      setCurXRange(nx);
      setCurYRange(ny);
      onViewportChange?.(nx, ny);
      setMouse({ sx: svgP.x, sy: svgP.y, x: w.x, y: w.y, inside: true });
    };
    el.addEventListener('wheel', handler, { passive:false });
    return () => el.removeEventListener('wheel', handler as any);
  }, [zoomable, zoomSpeed, curXRange[0], curXRange[1], curYRange[0], curYRange[1], screenToWorld, onViewportChange]);

  const ctxValue = React.useMemo(() => ({
    width,
    height,
    innerWidth,
    innerHeight,
    margin: m,
    xRange: curXRange,
    yRange: curYRange,
    worldToScreen,
    screenToWorld,
    htmlOverlay: overlayEl,
    clipPathId,
    mouse,
  }), [width, height, innerWidth, innerHeight, m.top, m.right, m.bottom, m.left, curXRange[0], curXRange[1], curYRange[0], curYRange[1], overlayEl, clipPathId, mouse?.sx, mouse?.sy, mouse?.x, mouse?.y, mouse?.inside]);

  const cursor = pannable ? (interactionRef.current.mode === 'pan' ? 'grabbing' : 'grab') : 'default';

  return (
    <div ref={wrapperRef} className={className} style={{ position:'relative', width, height, overscrollBehavior:'contain', touchAction: (pannable || zoomable || pinchZoomable) ? 'none' as any : 'auto', ...style }}>
      <svg ref={svgRef} width={width} height={height} style={{ position:'absolute', inset:0 }}>
        <defs>
          <clipPath id={clipPathId}>
            <rect x={m.left} y={m.top} width={innerWidth} height={innerHeight} />
          </clipPath>
        </defs>
        <PlotContext.Provider value={ctxValue}>
          <g>{children}</g>
          <rect
            x={m.left}
            y={m.top}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            style={{ cursor, touchAction: (pannable || pinchZoomable) ? 'none' as any : 'auto' as any }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onPointerLeave={onPointerLeaveArea}
          />
        </PlotContext.Provider>
      </svg>
      <div ref={setOverlayEl} style={{ position:'absolute', inset:0, pointerEvents:'none', fontFamily:'system-ui, Segoe UI, Roboto, sans-serif', fontSize:12, color:'#222' }} />
    </div>
  );
}

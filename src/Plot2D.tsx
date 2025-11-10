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
  pannable?: boolean; // enable drag-to-pan with mouse/touch (defaults to true)
  onViewportChange?: (xRange: Range, yRange: Range) => void; // called whenever viewport changes due to interactions
  zoomable?: boolean; // enable wheel-zoom centered at cursor
  zoomSpeed?: number; // zoom multiplier per wheel step (e.g., 1.1)
  pinchZoomable?: boolean; // enable two-finger pinch zoom on touch devices (defaults to true)
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

  // Viewport state (supports controlled via props and interactive panning)
  const [curXRange, setCurXRange] = React.useState<Range>(xRange);
  const [curYRange, setCurYRange] = React.useState<Range>(yRange);

  // Keep local state in sync if parent updates props
  React.useEffect(() => {
    setCurXRange(xRange);
  }, [xRange[0], xRange[1]]);
  React.useEffect(() => {
    setCurYRange(yRange);
  }, [yRange[0], yRange[1]]);

  const xMap = makeLinearMapper(curXRange[0], curXRange[1], 0, innerWidth);
  const yMap = makeLinearMapper(curYRange[0], curYRange[1], innerHeight, 0);

  const worldToScreen = (x: number, y: number) => ({
    x: m.left + xMap.f(x),
    y: m.top + yMap.f(y),
  });
  const screenToWorld = (sx: number, sy: number) => ({
    x: xMap.inv(sx - m.left),
    y: yMap.inv(sy - m.top),
  });

  // Use state ref for overlay to ensure portal mount triggers re-render
  const [overlayEl, setOverlayEl] = React.useState<HTMLDivElement | null>(null);
  const clipPathId = (React as any).useId ? React.useId() : 'clip-' + Math.random().toString(36).slice(2);

  // Panning interaction
  const panState = React.useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startXRange: Range;
    startYRange: Range;
    startSX: number;
    startSY: number;
    startMouseWorldX: number;
    startMouseWorldY: number;
  }>({ active: false, startX: 0, startY: 0, startXRange: [0, 1], startYRange: [0, 1], startSX: 0, startSY: 0, startMouseWorldX: 0, startMouseWorldY: 0 });

  const pxPerUnitX = innerWidth > 0 ? innerWidth / Math.max(1e-12, (curXRange[1] - curXRange[0])) : 1;
  const pxPerUnitY = innerHeight > 0 ? innerHeight / Math.max(1e-12, (curYRange[1] - curYRange[0])) : 1;

  // Multi-touch tracking for pinch zoom
  const pointersRef = React.useRef<Map<number, { clientX:number; clientY:number }>>(new Map());
  const pinchRef = React.useRef<{ active:boolean; lastDist:number; lastCenter:{sx:number; sy:number; x:number; y:number} | null }>({ active:false, lastDist:0, lastCenter:null });

  const onPointerDown = React.useCallback((e: React.PointerEvent<SVGRectElement>) => {
    // Allow touch/pen pointers for pinch even when pannable=false
    if (e.pointerType === 'mouse') {
      if (!pannable) return; // don't start pan with mouse if pannable is disabled
      if (e.button !== 0) return; // only primary button
    }
    const target = e.currentTarget as SVGRectElement;
    try { (target as any).setPointerCapture?.(e.pointerId); } catch {}
    // Track pointer for potential pinch
    pointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
    const svgEl = (e.currentTarget as any).ownerSVGElement as SVGSVGElement | null;
    // Helper para convertir coordenadas de ventana a coordenadas del SVG usando la matriz actual (robusto ante transform CSS)
    const clientToSvg = (clientX:number, clientY:number) => {
      if (!svgEl) return { x: clientX, y: clientY };
      const pt = svgEl.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svgEl.getScreenCTM();
      if (!ctm) return { x: clientX, y: clientY };
      const inv = ctm.inverse();
      const svgP = pt.matrixTransform(inv);
      return { x: svgP.x, y: svgP.y };
    };
    if (pinchZoomable && pointersRef.current.size >= 2) {
      // Initialize pinch state
      if (svgEl) {
        const pts = Array.from(pointersRef.current.values());
        const p0 = pts[0], p1 = pts[1];
        const midX = (p0.clientX + p1.clientX) / 2;
        const midY = (p0.clientY + p1.clientY) / 2;
        const svgMid = clientToSvg(midX, midY);
        const sx = svgMid.x;
        const sy = svgMid.y;
        const w = screenToWorld(sx, sy);
        const dx = (p0.clientX - p1.clientX);
        const dy = (p0.clientY - p1.clientY);
        const dist = Math.hypot(dx, dy);
        pinchRef.current = { active:true, lastDist: Math.max(1e-6, dist), lastCenter: { sx, sy, x: w.x, y: w.y } };
        // Ensure pan is not active while pinching
        panState.current.active = false;
      }
    } else if (pannable) {
      // Start a pan gesture
      panState.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        startXRange: curXRange,
        startYRange: curYRange,
        // Guardamos también coordenadas SVG iniciales para pan correcto bajo transformaciones
        startSX: (() => { const p = svgEl ? (() => { const pt = svgEl.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const ctm = svgEl.getScreenCTM(); if (!ctm) return pt; return pt.matrixTransform(ctm.inverse()); })() : { x: e.clientX, y: e.clientY }; return p.x; })(),
        startSY: (() => { const p = svgEl ? (() => { const pt = svgEl.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const ctm = svgEl.getScreenCTM(); if (!ctm) return pt; return pt.matrixTransform(ctm.inverse()); })() : { x: e.clientX, y: e.clientY }; return p.y; })(),
        startMouseWorldX: (() => { const invP = (() => { if (!svgEl) return { x: e.clientX, y: e.clientY }; const pt = svgEl.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const ctm = svgEl.getScreenCTM(); return ctm ? pt.matrixTransform(ctm.inverse()) : { x: e.clientX, y: e.clientY }; })(); return screenToWorld(invP.x, invP.y).x; })(),
        startMouseWorldY: (() => { const invP = (() => { if (!svgEl) return { x: e.clientX, y: e.clientY }; const pt = svgEl.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const ctm = svgEl.getScreenCTM(); return ctm ? pt.matrixTransform(ctm.inverse()) : { x: e.clientX, y: e.clientY }; })(); return screenToWorld(invP.x, invP.y).y; })(),
      };
      frozenLabelRef.current = { x: panState.current.startMouseWorldX, y: panState.current.startMouseWorldY };
    }
  }, [pannable, curXRange, curYRange, pinchZoomable]);

  const onPointerMove = React.useCallback((e: React.PointerEvent<SVGRectElement>) => {
    // update mouse state always (compute immediately to avoid React event pooling issues)
    const svgEl = (e.currentTarget as any).ownerSVGElement as SVGSVGElement | null;
    if (svgEl) {
      const pt = svgEl.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const ctm = svgEl.getScreenCTM();
      let svgP = { x: e.clientX, y: e.clientY };
      if (ctm) svgP = pt.matrixTransform(ctm.inverse());
      const sx = svgP.x;
      const sy = svgP.y;
      const w = screenToWorld(sx, sy);
      if (panState.current.active && frozenLabelRef.current) {
        // During active pan keep showing the original world coords where pan started
        setMouse({ sx, sy, x: frozenLabelRef.current.x, y: frozenLabelRef.current.y, inside: true });
      } else {
        // If pan just ended we still have frozen coords; first real pointer move after pan end
        // should release the freeze AFTER using current pointer world coords (prevent jump on pointerup).
        if (frozenLabelRef.current) {
          frozenLabelRef.current = null; // release freeze now that pointer actually moved
        }
        setMouse({ sx, sy, x: w.x, y: w.y, inside: true });
      }
    }
    // Pinch handling (two fingers)
    if (pinchRef.current.active && pinchZoomable) {
      const svgEl2 = (e.currentTarget as any).ownerSVGElement as SVGSVGElement | null;
      if (svgEl2) {
        if (pointersRef.current.has(e.pointerId)) {
          pointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
        }
        if (pointersRef.current.size >= 2) {
          const pts = Array.from(pointersRef.current.values());
          const p0 = pts[0], p1 = pts[1];
          const midX = (p0.clientX + p1.clientX) / 2;
          const midY = (p0.clientY + p1.clientY) / 2;
          const pt2 = svgEl2.createSVGPoint(); pt2.x = midX; pt2.y = midY;
          const ctm2 = svgEl2.getScreenCTM();
          let svgMid = { x: midX, y: midY };
          if (ctm2) svgMid = pt2.matrixTransform(ctm2.inverse());
          const sx = svgMid.x;
          const sy = svgMid.y;
          const w = screenToWorld(sx, sy);
          const dx = (p0.clientX - p1.clientX);
          const dy = (p0.clientY - p1.clientY);
          const dist = Math.max(1e-6, Math.hypot(dx, dy));
          const s = dist / Math.max(1e-6, pinchRef.current.lastDist);
          // Scale current ranges around current finger center
          let nx: Range = [ w.x + (curXRange[0] - w.x) / s, w.x + (curXRange[1] - w.x) / s ];
          let ny: Range = [ w.y + (curYRange[0] - w.y) / s, w.y + (curYRange[1] - w.y) / s ];
          // Translate ranges to keep the world point under the fingers stationary
          if (pinchRef.current.lastCenter) {
            const dxw = pinchRef.current.lastCenter.x - w.x;
            const dyw = pinchRef.current.lastCenter.y - w.y;
            nx = [ nx[0] + dxw, nx[1] + dxw ];
            ny = [ ny[0] + dyw, ny[1] + dyw ];
          }
          setCurXRange(nx);
          setCurYRange(ny);
          onViewportChange?.(nx, ny);
          pinchRef.current.lastDist = dist;
          pinchRef.current.lastCenter = { sx, sy, x: w.x, y: w.y };
          setMouse({ sx, sy, x: w.x, y: w.y, inside: true });
        }
      }
      return;
    }
    if (!panState.current.active) return;
    const svgEl3 = (e.currentTarget as any).ownerSVGElement as SVGSVGElement | null;
    let curSX = e.clientX, curSY = e.clientY;
    if (svgEl3) {
      const pt3 = svgEl3.createSVGPoint(); pt3.x = e.clientX; pt3.y = e.clientY;
      const ctm3 = svgEl3.getScreenCTM();
      if (ctm3) {
        const svgP3 = pt3.matrixTransform(ctm3.inverse());
        curSX = svgP3.x; curSY = svgP3.y;
      }
    }
    const dxPxSvg = curSX - (panState.current as any).startSX;
    const dyPxSvg = curSY - (panState.current as any).startSY;
    const dxWorld = (dxPxSvg) / Math.max(1e-12, pxPerUnitX);
    const dyWorld = -(dyPxSvg) / Math.max(1e-12, pxPerUnitY);
    const nx: Range = [
      panState.current.startXRange[0] - dxWorld,
      panState.current.startXRange[1] - dxWorld,
    ];
    const ny: Range = [
      panState.current.startYRange[0] - dyWorld,
      panState.current.startYRange[1] - dyWorld,
    ];
    setCurXRange(nx);
    setCurYRange(ny);
    onViewportChange?.(nx, ny);
  }, [pxPerUnitX, pxPerUnitY, onViewportChange]);

  const endPan = React.useCallback((e?: React.PointerEvent<SVGRectElement>) => {
    if (e) {
      try { (e.currentTarget as any).releasePointerCapture?.(e.pointerId); } catch {}
      pointersRef.current.delete((e as any).pointerId);
    }
    // End pan if it was active. Keep frozenLabelRef to avoid post-drag jump; it will be cleared on next pointer move.
    panState.current.active = false;
    // If pinch loses fingers, end pinch
    if (pinchRef.current.active && pointersRef.current.size < 2) {
      pinchRef.current.active = false;
      pinchRef.current.lastCenter = null;
      pinchRef.current.lastDist = 0;
    }
  }, []);

  // Mouse state for crosshair/tooltip
  const [mouse, setMouse] = React.useState<{ sx:number; sy:number; x:number; y:number; inside:boolean }>({ sx: 0, sy: 0, x: 0, y: 0, inside: false });
  // Freeze label world coords during active pan so displayed numbers don't change while dragging
  const frozenLabelRef = React.useRef<{ x:number; y:number } | null>(null);

  const onPointerLeaveArea = React.useCallback((e: React.PointerEvent<SVGRectElement>) => {
    endPan(e);
    setMouse(m => ({ ...m, inside: false }));
  }, [endPan]);

  // React onWheel handler removed to avoid passive listener preventDefault warnings.

  // Native wheel handler on the wrapper to fully prevent page zoom/scroll (non-passive)
  React.useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!zoomable) return;
      // Prevent default to avoid page scroll and browser zoom (ctrl+wheel / pinch-zoom on trackpad)
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      // Usar matriz inversa del SVG para coordenadas exactas bajo cualquier transform
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      let svgP = { x: e.clientX, y: e.clientY };
      if (ctm) svgP = pt.matrixTransform(ctm.inverse());
      const sx = svgP.x;
      const sy = svgP.y;
      const w = screenToWorld(sx, sy);
      const zx = e.deltaY < 0 ? (1 / zoomSpeed) : zoomSpeed;
      const zy = zx; // future: independent zoom per axis
      const nx: Range = [
        w.x + (curXRange[0] - w.x) * zx,
        w.x + (curXRange[1] - w.x) * zx,
      ];
      const ny: Range = [
        w.y + (curYRange[0] - w.y) * zy,
        w.y + (curYRange[1] - w.y) * zy,
      ];
      setCurXRange(nx);
      setCurYRange(ny);
      onViewportChange?.(nx, ny);
      setMouse({ sx, sy, x: w.x, y: w.y, inside: true });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler as any);
  }, [zoomable, zoomSpeed, curXRange[0], curXRange[1], curYRange[0], curYRange[1], screenToWorld, onViewportChange]);

  const ctxValue = React.useMemo(
    () => ({
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
    }),
    [width, height, innerWidth, innerHeight, m.top, m.right, m.bottom, m.left, curXRange[0], curXRange[1], curYRange[0], curYRange[1], overlayEl, clipPathId, mouse?.sx, mouse?.sy, mouse?.x, mouse?.y, mouse?.inside]
  );

  return (
    <div
      ref={wrapperRef}
      className={className}
  style={{ position: "relative", width, height, overscrollBehavior: 'contain', touchAction: (pannable || zoomable || pinchZoomable) ? 'none' as any : 'auto', ...style }}
    >
      <svg ref={svgRef} width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <clipPath id={clipPathId}>
            <rect x={m.left} y={m.top} width={innerWidth} height={innerHeight} />
          </clipPath>
        </defs>
        <PlotContext.Provider value={ctxValue}>
          <g>{children}</g>
          {/* Pan capture rect over plotting area */}
          <rect
            x={m.left}
            y={m.top}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            style={{ cursor: pannable ? (panState.current.active ? 'grabbing' : 'grab') : 'default', touchAction: (pannable || pinchZoomable) ? 'none' as any : 'auto' as any }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPan}
            onPointerCancel={endPan}
            onPointerLeave={onPointerLeaveArea}
          />
        </PlotContext.Provider>
      </svg>
      <div
        ref={setOverlayEl}
        style={{ position: "absolute", inset: 0, pointerEvents: "none", fontFamily: "system-ui, Segoe UI, Roboto, sans-serif", fontSize: 12, color: "#222" }}
      />
    </div>
  );
}

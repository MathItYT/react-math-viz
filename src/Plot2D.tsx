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
  }>({ active: false, startX: 0, startY: 0, startXRange: [0, 1], startYRange: [0, 1] });

  const pxPerUnitX = innerWidth > 0 ? innerWidth / Math.max(1e-12, (curXRange[1] - curXRange[0])) : 1;
  const pxPerUnitY = innerHeight > 0 ? innerHeight / Math.max(1e-12, (curYRange[1] - curYRange[0])) : 1;

  const onPointerDown = React.useCallback((e: React.PointerEvent<SVGRectElement>) => {
    if (!pannable) return;
    // Only primary button for mouse; all pointers for touch/pen
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const target = e.currentTarget as SVGRectElement;
    try { (target as any).setPointerCapture?.(e.pointerId); } catch {}
    panState.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startXRange: curXRange,
      startYRange: curYRange,
    };
  }, [pannable, curXRange, curYRange]);

  const onPointerMove = React.useCallback((e: React.PointerEvent<SVGRectElement>) => {
    // update mouse state always (compute immediately to avoid React event pooling issues)
    const svgEl = (e.currentTarget as any).ownerSVGElement as SVGSVGElement | null;
    if (svgEl) {
      const rect = svgEl.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const w = screenToWorld(sx, sy);
      setMouse({ sx, sy, x: w.x, y: w.y, inside: true });
    }
    if (!panState.current.active) return;
    const dxPx = e.clientX - panState.current.startX;
    const dyPx = e.clientY - panState.current.startY;
    const dxWorld = (dxPx) / Math.max(1e-12, pxPerUnitX);
    const dyWorld = -(dyPx) / Math.max(1e-12, pxPerUnitY);
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
    if (!panState.current.active) return;
    if (e) {
      try { (e.currentTarget as any).releasePointerCapture?.(e.pointerId); } catch {}
    }
    panState.current.active = false;
  }, []);

  // Mouse state for crosshair/tooltip
  const [mouse, setMouse] = React.useState<{ sx:number; sy:number; x:number; y:number; inside:boolean }>({ sx: 0, sy: 0, x: 0, y: 0, inside: false });

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
      const rect = svg.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
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
      style={{ position: "relative", width, height, overscrollBehavior: 'contain', touchAction: (pannable || zoomable) ? 'none' as any : 'auto', ...style }}
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
            style={{ cursor: pannable ? (panState.current.active ? 'grabbing' : 'grab') : 'default', touchAction: pannable ? 'none' as any : 'auto' as any }}
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

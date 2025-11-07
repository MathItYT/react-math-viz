// src/Plot2D.tsx
import React2 from "react";

// src/context.ts
import React from "react";
var PlotContext = React.createContext(null);
var usePlot = () => {
  const ctx = React.useContext(PlotContext);
  if (!ctx) throw new Error("This component must be used inside <Plot2D />");
  return ctx;
};

// src/utils.ts
function makeLinearMapper(domainMin, domainMax, rangeMin, rangeMax) {
  const span = domainMax - domainMin || 1e-9;
  const k = (rangeMax - rangeMin) / span;
  return {
    f: (x) => rangeMin + (x - domainMin) * k,
    inv: (y) => domainMin + (y - rangeMin) / k
  };
}
function niceStep(span, approxCount) {
  const raw = span / Math.max(1, approxCount);
  const pow10 = Math.pow(10, Math.floor(Math.log10(Math.abs(raw))));
  const base = raw / pow10;
  let nice;
  if (base >= 10) nice = 10;
  else if (base >= 5) nice = 5;
  else if (base >= 2) nice = 2;
  else if (base >= 1) nice = 1;
  else if (base >= 0.5) nice = 0.5;
  else nice = 0.2;
  return nice * pow10;
}
function generateTicks(min, max, approxCount) {
  if (!(isFinite(min) && isFinite(max))) return [];
  if (min === max) return [min];
  const step = niceStep(max - min, approxCount);
  const eps = 1e-12;
  if (min <= 0 && 0 <= max) {
    const ticks = [0];
    for (let t = step; t <= max + eps; t += step) {
      const val = Math.abs(t) < eps ? 0 : t;
      ticks.push(Number(val.toFixed(12)));
    }
    for (let t = -step; t >= min - eps; t -= step) {
      const val = Math.abs(t) < eps ? 0 : t;
      ticks.push(Number(val.toFixed(12)));
    }
    const uniq = Array.from(new Set(ticks.map((v) => Number(v.toFixed(12))))).sort((a, b) => a - b);
    return uniq;
  } else {
    const start = Math.ceil(min / step) * step;
    const ticks = [];
    for (let t = start; t <= max + eps; t += step) {
      const val = Math.abs(t) < eps ? 0 : t;
      ticks.push(Number(val.toFixed(12)));
    }
    return ticks;
  }
}
function generateTicksFromDelta(min, max, delta, anchor = 0) {
  if (!(isFinite(min) && isFinite(max) && isFinite(delta))) return [];
  const d = Math.abs(delta) || 1e-9;
  const eps = 1e-12;
  if (min <= anchor && anchor <= max) {
    const ticks = [anchor];
    for (let t = anchor + d; t <= max + eps; t += d) ticks.push(Number((Math.abs(t) < eps ? 0 : t).toFixed(12)));
    for (let t = anchor - d; t >= min - eps; t -= d) ticks.push(Number((Math.abs(t) < eps ? 0 : t).toFixed(12)));
    const uniq = Array.from(new Set(ticks.map((v) => Number(v.toFixed(12))))).sort((a, b) => a - b);
    return uniq;
  } else {
    const kStart = Math.ceil((min - anchor) / d);
    const start = anchor + kStart * d;
    const ticks = [];
    for (let t = start; t <= max + eps; t += d) ticks.push(Number((Math.abs(t) < eps ? 0 : t).toFixed(12)));
    return ticks;
  }
}

// src/Plot2D.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function Plot2D({
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
  pinchZoomable = true
}) {
  const wrapperRef = React2.useRef(null);
  const svgRef = React2.useRef(null);
  const m = {
    top: (margin == null ? void 0 : margin.top) ?? 20,
    right: (margin == null ? void 0 : margin.right) ?? 20,
    bottom: (margin == null ? void 0 : margin.bottom) ?? 30,
    left: (margin == null ? void 0 : margin.left) ?? 40
  };
  const innerWidth = Math.max(0, width - m.left - m.right);
  const innerHeight = Math.max(0, height - m.top - m.bottom);
  const [curXRange, setCurXRange] = React2.useState(xRange);
  const [curYRange, setCurYRange] = React2.useState(yRange);
  React2.useEffect(() => {
    setCurXRange(xRange);
  }, [xRange[0], xRange[1]]);
  React2.useEffect(() => {
    setCurYRange(yRange);
  }, [yRange[0], yRange[1]]);
  const xMap = makeLinearMapper(curXRange[0], curXRange[1], 0, innerWidth);
  const yMap = makeLinearMapper(curYRange[0], curYRange[1], innerHeight, 0);
  const worldToScreen = (x, y) => ({
    x: m.left + xMap.f(x),
    y: m.top + yMap.f(y)
  });
  const screenToWorld = (sx, sy) => ({
    x: xMap.inv(sx - m.left),
    y: yMap.inv(sy - m.top)
  });
  const [overlayEl, setOverlayEl] = React2.useState(null);
  const clipPathId = React2.useId ? React2.useId() : "clip-" + Math.random().toString(36).slice(2);
  const panState = React2.useRef({ active: false, startX: 0, startY: 0, startXRange: [0, 1], startYRange: [0, 1], startSX: 0, startSY: 0, startMouseWorldX: 0, startMouseWorldY: 0 });
  const pxPerUnitX = innerWidth > 0 ? innerWidth / Math.max(1e-12, curXRange[1] - curXRange[0]) : 1;
  const pxPerUnitY = innerHeight > 0 ? innerHeight / Math.max(1e-12, curYRange[1] - curYRange[0]) : 1;
  const pointersRef = React2.useRef(/* @__PURE__ */ new Map());
  const pinchRef = React2.useRef({ active: false, lastDist: 0, lastCenter: null });
  const onPointerDown = React2.useCallback((e) => {
    var _a;
    if (e.pointerType === "mouse") {
      if (!pannable) return;
      if (e.button !== 0) return;
    }
    const target = e.currentTarget;
    try {
      (_a = target.setPointerCapture) == null ? void 0 : _a.call(target, e.pointerId);
    } catch {
    }
    pointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
    const svgEl = e.currentTarget.ownerSVGElement;
    const clientToSvg = (clientX, clientY) => {
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
      if (svgEl) {
        const pts = Array.from(pointersRef.current.values());
        const p0 = pts[0], p1 = pts[1];
        const midX = (p0.clientX + p1.clientX) / 2;
        const midY = (p0.clientY + p1.clientY) / 2;
        const svgMid = clientToSvg(midX, midY);
        const sx = svgMid.x;
        const sy = svgMid.y;
        const w = screenToWorld(sx, sy);
        const dx = p0.clientX - p1.clientX;
        const dy = p0.clientY - p1.clientY;
        const dist = Math.hypot(dx, dy);
        pinchRef.current = { active: true, lastDist: Math.max(1e-6, dist), lastCenter: { sx, sy, x: w.x, y: w.y } };
        panState.current.active = false;
      }
    } else if (pannable) {
      panState.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        startXRange: curXRange,
        startYRange: curYRange,
        // Guardamos también coordenadas SVG iniciales para pan correcto bajo transformaciones
        startSX: (() => {
          const p = svgEl ? (() => {
            const pt = svgEl.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const ctm = svgEl.getScreenCTM();
            if (!ctm) return pt;
            return pt.matrixTransform(ctm.inverse());
          })() : { x: e.clientX, y: e.clientY };
          return p.x;
        })(),
        startSY: (() => {
          const p = svgEl ? (() => {
            const pt = svgEl.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const ctm = svgEl.getScreenCTM();
            if (!ctm) return pt;
            return pt.matrixTransform(ctm.inverse());
          })() : { x: e.clientX, y: e.clientY };
          return p.y;
        })(),
        startMouseWorldX: (() => {
          const invP = (() => {
            if (!svgEl) return { x: e.clientX, y: e.clientY };
            const pt = svgEl.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const ctm = svgEl.getScreenCTM();
            return ctm ? pt.matrixTransform(ctm.inverse()) : { x: e.clientX, y: e.clientY };
          })();
          return screenToWorld(invP.x, invP.y).x;
        })(),
        startMouseWorldY: (() => {
          const invP = (() => {
            if (!svgEl) return { x: e.clientX, y: e.clientY };
            const pt = svgEl.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const ctm = svgEl.getScreenCTM();
            return ctm ? pt.matrixTransform(ctm.inverse()) : { x: e.clientX, y: e.clientY };
          })();
          return screenToWorld(invP.x, invP.y).y;
        })()
      };
      frozenLabelRef.current = { x: panState.current.startMouseWorldX, y: panState.current.startMouseWorldY };
    }
  }, [pannable, curXRange, curYRange, pinchZoomable]);
  const onPointerMove = React2.useCallback((e) => {
    const svgEl = e.currentTarget.ownerSVGElement;
    if (svgEl) {
      const pt = svgEl.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svgEl.getScreenCTM();
      let svgP = { x: e.clientX, y: e.clientY };
      if (ctm) svgP = pt.matrixTransform(ctm.inverse());
      const sx = svgP.x;
      const sy = svgP.y;
      const w = screenToWorld(sx, sy);
      if (panState.current.active && frozenLabelRef.current) {
        setMouse({ sx, sy, x: frozenLabelRef.current.x, y: frozenLabelRef.current.y, inside: true });
      } else {
        setMouse({ sx, sy, x: w.x, y: w.y, inside: true });
      }
    }
    if (pinchRef.current.active && pinchZoomable) {
      const svgEl2 = e.currentTarget.ownerSVGElement;
      if (svgEl2) {
        if (pointersRef.current.has(e.pointerId)) {
          pointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
        }
        if (pointersRef.current.size >= 2) {
          const pts = Array.from(pointersRef.current.values());
          const p0 = pts[0], p1 = pts[1];
          const midX = (p0.clientX + p1.clientX) / 2;
          const midY = (p0.clientY + p1.clientY) / 2;
          const pt2 = svgEl2.createSVGPoint();
          pt2.x = midX;
          pt2.y = midY;
          const ctm2 = svgEl2.getScreenCTM();
          let svgMid = { x: midX, y: midY };
          if (ctm2) svgMid = pt2.matrixTransform(ctm2.inverse());
          const sx = svgMid.x;
          const sy = svgMid.y;
          const w = screenToWorld(sx, sy);
          const dx = p0.clientX - p1.clientX;
          const dy = p0.clientY - p1.clientY;
          const dist = Math.max(1e-6, Math.hypot(dx, dy));
          const s = dist / Math.max(1e-6, pinchRef.current.lastDist);
          let nx2 = [w.x + (curXRange[0] - w.x) / s, w.x + (curXRange[1] - w.x) / s];
          let ny2 = [w.y + (curYRange[0] - w.y) / s, w.y + (curYRange[1] - w.y) / s];
          if (pinchRef.current.lastCenter) {
            const dxw = pinchRef.current.lastCenter.x - w.x;
            const dyw = pinchRef.current.lastCenter.y - w.y;
            nx2 = [nx2[0] + dxw, nx2[1] + dxw];
            ny2 = [ny2[0] + dyw, ny2[1] + dyw];
          }
          setCurXRange(nx2);
          setCurYRange(ny2);
          onViewportChange == null ? void 0 : onViewportChange(nx2, ny2);
          pinchRef.current.lastDist = dist;
          pinchRef.current.lastCenter = { sx, sy, x: w.x, y: w.y };
          setMouse({ sx, sy, x: w.x, y: w.y, inside: true });
        }
      }
      return;
    }
    if (!panState.current.active) return;
    const svgEl3 = e.currentTarget.ownerSVGElement;
    let curSX = e.clientX, curSY = e.clientY;
    if (svgEl3) {
      const pt3 = svgEl3.createSVGPoint();
      pt3.x = e.clientX;
      pt3.y = e.clientY;
      const ctm3 = svgEl3.getScreenCTM();
      if (ctm3) {
        const svgP3 = pt3.matrixTransform(ctm3.inverse());
        curSX = svgP3.x;
        curSY = svgP3.y;
      }
    }
    const dxPxSvg = curSX - panState.current.startSX;
    const dyPxSvg = curSY - panState.current.startSY;
    const dxWorld = dxPxSvg / Math.max(1e-12, pxPerUnitX);
    const dyWorld = -dyPxSvg / Math.max(1e-12, pxPerUnitY);
    const nx = [
      panState.current.startXRange[0] - dxWorld,
      panState.current.startXRange[1] - dxWorld
    ];
    const ny = [
      panState.current.startYRange[0] - dyWorld,
      panState.current.startYRange[1] - dyWorld
    ];
    setCurXRange(nx);
    setCurYRange(ny);
    onViewportChange == null ? void 0 : onViewportChange(nx, ny);
  }, [pxPerUnitX, pxPerUnitY, onViewportChange]);
  const endPan = React2.useCallback((e) => {
    var _a, _b;
    if (e) {
      try {
        (_b = (_a = e.currentTarget).releasePointerCapture) == null ? void 0 : _b.call(_a, e.pointerId);
      } catch {
      }
      pointersRef.current.delete(e.pointerId);
    }
    panState.current.active = false;
    frozenLabelRef.current = null;
    if (pinchRef.current.active && pointersRef.current.size < 2) {
      pinchRef.current.active = false;
      pinchRef.current.lastCenter = null;
      pinchRef.current.lastDist = 0;
    }
  }, []);
  const [mouse, setMouse] = React2.useState({ sx: 0, sy: 0, x: 0, y: 0, inside: false });
  const frozenLabelRef = React2.useRef(null);
  const onPointerLeaveArea = React2.useCallback((e) => {
    endPan(e);
    setMouse((m2) => ({ ...m2, inside: false }));
  }, [endPan]);
  React2.useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const handler = (e) => {
      if (!zoomable) return;
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      let svgP = { x: e.clientX, y: e.clientY };
      if (ctm) svgP = pt.matrixTransform(ctm.inverse());
      const sx = svgP.x;
      const sy = svgP.y;
      const w = screenToWorld(sx, sy);
      const zx = e.deltaY < 0 ? 1 / zoomSpeed : zoomSpeed;
      const zy = zx;
      const nx = [
        w.x + (curXRange[0] - w.x) * zx,
        w.x + (curXRange[1] - w.x) * zx
      ];
      const ny = [
        w.y + (curYRange[0] - w.y) * zy,
        w.y + (curYRange[1] - w.y) * zy
      ];
      setCurXRange(nx);
      setCurYRange(ny);
      onViewportChange == null ? void 0 : onViewportChange(nx, ny);
      setMouse({ sx, sy, x: w.x, y: w.y, inside: true });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [zoomable, zoomSpeed, curXRange[0], curXRange[1], curYRange[0], curYRange[1], screenToWorld, onViewportChange]);
  const ctxValue = React2.useMemo(
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
      mouse
    }),
    [width, height, innerWidth, innerHeight, m.top, m.right, m.bottom, m.left, curXRange[0], curXRange[1], curYRange[0], curYRange[1], overlayEl, clipPathId, mouse == null ? void 0 : mouse.sx, mouse == null ? void 0 : mouse.sy, mouse == null ? void 0 : mouse.x, mouse == null ? void 0 : mouse.y, mouse == null ? void 0 : mouse.inside]
  );
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: wrapperRef,
      className,
      style: { position: "relative", width, height, overscrollBehavior: "contain", touchAction: pannable || zoomable || pinchZoomable ? "none" : "auto", ...style },
      children: [
        /* @__PURE__ */ jsxs("svg", { ref: svgRef, width, height, style: { position: "absolute", inset: 0 }, children: [
          /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsx("clipPath", { id: clipPathId, children: /* @__PURE__ */ jsx("rect", { x: m.left, y: m.top, width: innerWidth, height: innerHeight }) }) }),
          /* @__PURE__ */ jsxs(PlotContext.Provider, { value: ctxValue, children: [
            /* @__PURE__ */ jsx("g", { children }),
            /* @__PURE__ */ jsx(
              "rect",
              {
                x: m.left,
                y: m.top,
                width: innerWidth,
                height: innerHeight,
                fill: "transparent",
                style: { cursor: pannable ? panState.current.active ? "grabbing" : "grab" : "default", touchAction: pannable || pinchZoomable ? "none" : "auto" },
                onPointerDown,
                onPointerMove,
                onPointerUp: endPan,
                onPointerCancel: endPan,
                onPointerLeave: onPointerLeaveArea
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "div",
          {
            ref: setOverlayEl,
            style: { position: "absolute", inset: 0, pointerEvents: "none", fontFamily: "system-ui, Segoe UI, Roboto, sans-serif", fontSize: 12, color: "#222" }
          }
        )
      ]
    }
  );
}

// src/Axes2D.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function Axes2D({
  grid = false,
  minorGrid = false,
  xSubdivisions = 0,
  ySubdivisions = 0,
  gridMajorPx = 80,
  minMinorPx = 14,
  gridXDelta,
  gridYDelta,
  xTicks,
  yTicks,
  approxXTicks = 9,
  approxYTicks = 7,
  axisColor = "#333",
  axisWidth = 1,
  tickSize = 6,
  renderXLabel,
  renderYLabel,
  labelOffset = { x: 12, y: 8 }
}) {
  const { xRange, yRange, worldToScreen, clipPathId, innerWidth, innerHeight, margin } = usePlot();
  let xTickVals = [];
  let yTickVals = [];
  const inferDelta = (vals) => {
    const uniq = Array.from(new Set(vals)).sort((a, b) => a - b);
    let best = Infinity;
    for (let i = 1; i < uniq.length; i++) {
      const d = Math.abs(uniq[i] - uniq[i - 1]);
      if (d > 1e-12 && d < best) best = d;
    }
    return isFinite(best) ? best : void 0;
  };
  const xDeltaInferred = xTicks && xTicks.length >= 2 ? inferDelta(xTicks) : void 0;
  const yDeltaInferred = yTicks && yTicks.length >= 2 ? inferDelta(yTicks) : void 0;
  const xDeltaBase = typeof gridXDelta === "number" && gridXDelta > 0 ? gridXDelta : xDeltaInferred;
  const yDeltaBase = typeof gridYDelta === "number" && gridYDelta > 0 ? gridYDelta : yDeltaInferred;
  const p00 = worldToScreen(0, 0);
  const p10 = worldToScreen(1, 0);
  const p01 = worldToScreen(0, 1);
  const pxPerUnitX = Math.max(1e-9, Math.abs(p10.x - p00.x));
  const pxPerUnitY = Math.max(1e-9, Math.abs(p01.y - p00.y));
  const targetMajorPxX = typeof gridMajorPx === "number" ? gridMajorPx : gridMajorPx.x ?? 80;
  const targetMajorPxY = typeof gridMajorPx === "number" ? gridMajorPx : gridMajorPx.y ?? 80;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const coarsenDelta = (delta, pxPerUnit, targetPx) => {
    if (!delta || !(delta > 0)) return void 0;
    let d = delta;
    const factors = [2, 2.5, 2];
    let fi = 0;
    let guard = 0;
    while (pxPerUnit * d < targetPx && guard < 20) {
      d *= factors[fi % factors.length];
      fi += 1;
      guard += 1;
    }
    return d;
  };
  const approxCountX = clamp(Math.round(innerWidth / targetMajorPxX), 2, 40);
  const approxCountY = clamp(Math.round(innerHeight / targetMajorPxY), 2, 40);
  const xDeltaCoarse = typeof gridXDelta === "number" && gridXDelta > 0 ? gridXDelta : coarsenDelta(xDeltaBase, pxPerUnitX, targetMajorPxX);
  const yDeltaCoarse = typeof gridYDelta === "number" && gridYDelta > 0 ? gridYDelta : coarsenDelta(yDeltaBase, pxPerUnitY, targetMajorPxY);
  const gridXMajor = xDeltaCoarse ? generateTicksFromDelta(xRange[0], xRange[1], xDeltaCoarse, 0) : generateTicks(xRange[0], xRange[1], approxCountX);
  const gridYMajor = yDeltaCoarse ? generateTicksFromDelta(yRange[0], yRange[1], yDeltaCoarse, 0) : generateTicks(yRange[0], yRange[1], approxCountY);
  const gridXMajorFinal = xDeltaBase && gridXMajor.length <= 1 ? generateTicks(xRange[0], xRange[1], approxCountX) : gridXMajor;
  const gridYMajorFinal = yDeltaBase && gridYMajor.length <= 1 ? generateTicks(yRange[0], yRange[1], approxCountY) : gridYMajor;
  if (xTicks && xTicks.length) xTickVals = xTicks;
  else if (typeof gridXDelta === "number" && gridXDelta > 0) xTickVals = gridXMajorFinal;
  else xTickVals = generateTicks(xRange[0], xRange[1], approxXTicks);
  if (yTicks && yTicks.length) yTickVals = yTicks;
  else if (typeof gridYDelta === "number" && gridYDelta > 0) yTickVals = gridYMajorFinal;
  else yTickVals = generateTicks(yRange[0], yRange[1], approxYTicks);
  const segMinMinorSubs = (majors, desired, pxPerUnit) => {
    if (!desired || majors.length < 2) return 0;
    let maxSubs = Infinity;
    for (let i = 1; i < majors.length; i++) {
      const seg = Math.abs(majors[i] - majors[i - 1]);
      const segPx = pxPerUnit * seg;
      const allowed = Math.floor(segPx / Math.max(1, minMinorPx)) - 1;
      if (allowed < maxSubs) maxSubs = allowed;
    }
    return Math.max(0, Math.min(desired, isFinite(maxSubs) ? maxSubs : 0));
  };
  const xSubEff = segMinMinorSubs(gridXMajorFinal, xSubdivisions, pxPerUnitX);
  const ySubEff = segMinMinorSubs(gridYMajorFinal, ySubdivisions, pxPerUnitY);
  const zeroXInRange = xRange[0] <= 0 && 0 <= xRange[1];
  const zeroYInRange = yRange[0] <= 0 && 0 <= yRange[1];
  const axisYValue = zeroYInRange ? 0 : Math.abs(yRange[0]) <= Math.abs(yRange[1]) ? yRange[0] : yRange[1];
  const axisXValue = zeroXInRange ? 0 : Math.abs(xRange[0]) <= Math.abs(xRange[1]) ? xRange[0] : xRange[1];
  const axisX1 = worldToScreen(xRange[0], axisYValue);
  const axisX2 = worldToScreen(xRange[1], axisYValue);
  const axisY1 = worldToScreen(axisXValue, yRange[0]);
  const axisY2 = worldToScreen(axisXValue, yRange[1]);
  const gridCfg = typeof grid === "boolean" ? { stroke: "#999", strokeWidth: 1, opacity: 0.15 } : grid;
  const minorGridCfgRaw = typeof minorGrid === "boolean" ? {} : minorGrid || {};
  const minorGridCfg = {
    stroke: minorGridCfgRaw.stroke ?? (gridCfg == null ? void 0 : gridCfg.stroke) ?? "#999",
    strokeWidth: minorGridCfgRaw.strokeWidth ?? Math.max(0.5, ((gridCfg == null ? void 0 : gridCfg.strokeWidth) ?? 1) * 0.6),
    opacity: minorGridCfgRaw.opacity ?? Math.min(1, ((gridCfg == null ? void 0 : gridCfg.opacity) ?? 0.15) * 0.9)
  };
  if (grid && !minorGrid && (xSubdivisions === 0 && ySubdivisions === 0)) {
    xSubdivisions = 4;
    ySubdivisions = 4;
    minorGrid = true;
  }
  const labelYForX = zeroYInRange ? 0 : Math.abs(yRange[0]) <= Math.abs(yRange[1]) ? yRange[0] : yRange[1];
  const labelXForY = zeroXInRange ? 0 : Math.abs(xRange[0]) <= Math.abs(xRange[1]) ? xRange[0] : xRange[1];
  const baseXLabelOffset = labelOffset.y ?? 8;
  const xLabelAbove = zeroYInRange ? false : labelYForX === yRange[1];
  const labels = /* @__PURE__ */ jsx2("foreignObject", { x: margin.left, y: margin.top, width: innerWidth, height: innerHeight, children: /* @__PURE__ */ jsxs2("div", { style: { position: "relative", width: "100%", height: "100%", pointerEvents: "none", fontFamily: "system-ui, Segoe UI, Roboto, sans-serif", fontSize: 12, color: "#222", userSelect: "none" }, children: [
    renderXLabel && xTickVals.map((x) => {
      const node = renderXLabel(x);
      if (node == null) return null;
      const p = worldToScreen(x, labelYForX);
      const topAbs = xLabelAbove ? p.y - baseXLabelOffset : p.y + baseXLabelOffset;
      const transform = xLabelAbove ? "translate(-50%, -100%)" : "translate(-50%, 0)";
      return /* @__PURE__ */ jsx2("div", { style: { position: "absolute", left: p.x - margin.left, top: topAbs - margin.top, transform, pointerEvents: "auto" }, children: node }, `xl-${x}`);
    }),
    renderYLabel && yTickVals.map((y) => {
      const node = renderYLabel(y);
      if (node == null) return null;
      const p = worldToScreen(labelXForY, y);
      const placeLeft = zeroXInRange ? true : labelXForY === xRange[0];
      const baseX = labelOffset.x ?? 12;
      const leftAbs = p.x + (placeLeft ? -baseX : baseX);
      const transform = placeLeft ? "translate(-100%, -50%)" : "translate(0, -50%)";
      const textAlign = placeLeft ? "right" : "left";
      return /* @__PURE__ */ jsx2("div", { style: { position: "absolute", left: leftAbs - margin.left, top: p.y - margin.top, transform, textAlign, pointerEvents: "auto" }, children: node }, `yl-${y}`);
    })
  ] }) });
  return /* @__PURE__ */ jsxs2("g", { clipPath: `url(#${clipPathId})`, children: [
    minorGrid && (xSubdivisions > 0 || ySubdivisions > 0) && /* @__PURE__ */ jsxs2("g", { stroke: minorGridCfg.stroke, strokeWidth: minorGridCfg.strokeWidth, opacity: minorGridCfg.opacity, shapeRendering: "crispEdges", vectorEffect: "non-scaling-stroke", children: [
      xSubEff > 0 && gridXMajorFinal.length > 1 && gridXMajorFinal.flatMap((xv, i) => {
        if (i === gridXMajorFinal.length - 1) return [];
        const next = gridXMajorFinal[i + 1];
        const dt = (next - xv) / (xSubEff + 1);
        const nodes = [];
        for (let j = 1; j <= xSubEff; j++) {
          const x = xv + j * dt;
          const p1 = worldToScreen(x, yRange[0]);
          const p2 = worldToScreen(x, yRange[1]);
          nodes.push(/* @__PURE__ */ jsx2("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }, `gvm-${i}-${j}`));
        }
        return nodes;
      }),
      ySubEff > 0 && gridYMajorFinal.length > 1 && gridYMajorFinal.flatMap((yv, i) => {
        if (i === gridYMajorFinal.length - 1) return [];
        const next = gridYMajorFinal[i + 1];
        const dt = (next - yv) / (ySubEff + 1);
        const nodes = [];
        for (let j = 1; j <= ySubEff; j++) {
          const y = yv + j * dt;
          const p1 = worldToScreen(xRange[0], y);
          const p2 = worldToScreen(xRange[1], y);
          nodes.push(/* @__PURE__ */ jsx2("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }, `ghm-${i}-${j}`));
        }
        return nodes;
      })
    ] }),
    grid && /* @__PURE__ */ jsxs2("g", { stroke: gridCfg == null ? void 0 : gridCfg.stroke, strokeWidth: gridCfg == null ? void 0 : gridCfg.strokeWidth, opacity: gridCfg == null ? void 0 : gridCfg.opacity, shapeRendering: "crispEdges", vectorEffect: "non-scaling-stroke", children: [
      zeroYInRange && (() => {
        const p1 = worldToScreen(xRange[0], 0);
        const p2 = worldToScreen(xRange[1], 0);
        return /* @__PURE__ */ jsx2("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }, `gh-0`);
      })(),
      zeroXInRange && (() => {
        const p1 = worldToScreen(0, yRange[0]);
        const p2 = worldToScreen(0, yRange[1]);
        return /* @__PURE__ */ jsx2("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }, `gv-0`);
      })(),
      gridXMajorFinal.map((x) => {
        const p1 = worldToScreen(x, yRange[0]);
        const p2 = worldToScreen(x, yRange[1]);
        return /* @__PURE__ */ jsx2("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }, `gv-${x}`);
      }),
      gridYMajorFinal.map((y) => {
        const p1 = worldToScreen(xRange[0], y);
        const p2 = worldToScreen(xRange[1], y);
        return /* @__PURE__ */ jsx2("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }, `gh-${y}`);
      })
    ] }),
    /* @__PURE__ */ jsxs2("g", { stroke: axisColor, strokeWidth: axisWidth, children: [
      /* @__PURE__ */ jsx2("line", { x1: axisX1.x, y1: axisX1.y, x2: axisX2.x, y2: axisX2.y }),
      /* @__PURE__ */ jsx2("line", { x1: axisY1.x, y1: axisY1.y, x2: axisY2.x, y2: axisY2.y })
    ] }),
    /* @__PURE__ */ jsxs2("g", { stroke: axisColor, strokeWidth: axisWidth, children: [
      xTickVals.map((x) => {
        const p = worldToScreen(x, axisYValue);
        const y0 = p.y - tickSize / 2;
        const y1 = p.y + tickSize / 2;
        return /* @__PURE__ */ jsx2("line", { x1: p.x, y1: y0, x2: p.x, y2: y1 }, `tx-${x}`);
      }),
      yTickVals.map((y) => {
        const p = worldToScreen(axisXValue, y);
        const x0 = p.x - tickSize / 2;
        const x1 = p.x + tickSize / 2;
        return /* @__PURE__ */ jsx2("line", { x1: x0, y1: p.y, x2: x1, y2: p.y }, `ty-${y}`);
      })
    ] }),
    labels
  ] });
}

// src/Parametric2D.tsx
import React3 from "react";
import { jsx as jsx3 } from "react/jsx-runtime";
function Parametric2D({
  x,
  y,
  tRange,
  samples = 600,
  stroke = "#1565c0",
  strokeWidth = 2,
  strokeDasharray,
  fill = "none",
  clip = true,
  domainFollowsViewport = false,
  assumeXEqualsT = false,
  overscan = 0
}) {
  const { worldToScreen, clipPathId, xRange, yRange } = usePlot();
  const [t0Eff, t1Eff, viewportRect] = React3.useMemo(() => {
    let [t0, t1] = tRange;
    if (!domainFollowsViewport) return [t0, t1];
    const [xmin, xmax] = xRange;
    const [ymin, ymax] = yRange;
    const padX = (xmax - xmin) * overscan;
    const padY = (ymax - ymin) * overscan;
    const vx0 = Math.min(xmin, xmax) - padX;
    const vx1 = Math.max(xmin, xmax) + padX;
    const vy0 = Math.min(ymin, ymax) - padY;
    const vy1 = Math.max(ymin, ymax) + padY;
    if (assumeXEqualsT) {
      const nt0 = vx0;
      const nt1 = vx1;
      return [nt0, nt1, { vx0, vx1, vy0, vy1 }];
    }
    const coarse = 128;
    let found = false;
    let tmin = tRange[1];
    let tmax = tRange[0];
    for (let i = 0; i <= coarse; i++) {
      const tt = tRange[0] + i / coarse * (tRange[1] - tRange[0]);
      const xv = x(tt);
      if (xv >= vx0 && xv <= vx1) {
        if (!found) {
          tmin = tt;
          tmax = tt;
          found = true;
        } else {
          if (tt < tmin) tmin = tt;
          if (tt > tmax) tmax = tt;
        }
      }
    }
    if (found) {
      const expand = (tmax - tmin) * 0.05;
      t0 = Math.max(tRange[0], tmin - expand);
      t1 = Math.min(tRange[1], tmax + expand);
      return [t0, t1, { vx0, vx1, vy0, vy1 }];
    }
    const x0 = x(tRange[0]);
    const x1 = x(tRange[1]);
    const d0 = Math.min(Math.abs(x0 - vx0), Math.abs(x0 - vx1));
    const d1 = Math.min(Math.abs(x1 - vx0), Math.abs(x1 - vx1));
    const tt0 = d0 <= d1 ? tRange[0] : tRange[1];
    const rect = { vx0, vx1, vy0, vy1 };
    return [tt0, tt0, rect];
  }, [tRange[0], tRange[1], domainFollowsViewport, assumeXEqualsT, xRange[0], xRange[1], yRange[0], yRange[1], overscan, x]);
  const n = Math.max(2, Math.floor(samples));
  const dt = (t1Eff - t0Eff) / (n - 1 || 1);
  const d = React3.useMemo(() => {
    const { vx0, vx1, vy0, vy1 } = viewportRect || { vx0: -Infinity, vx1: Infinity, vy0: -Infinity, vy1: Infinity };
    let path = "";
    let hasOpen = false;
    for (let i = 0; i < (n || 2); i++) {
      const t = t0Eff + i * dt;
      const wx = x(t);
      const wy = y(t);
      const inside = wx >= vx0 && wx <= vx1 && wy >= vy0 && wy <= vy1;
      const sp = worldToScreen(wx, wy);
      if (inside) {
        if (!hasOpen) {
          path += (path ? " " : "") + "M " + sp.x + " " + sp.y;
          hasOpen = true;
        } else {
          path += " L " + sp.x + " " + sp.y;
        }
      } else {
        hasOpen = false;
      }
    }
    return path;
  }, [x, y, t0Eff, t1Eff, n, dt, worldToScreen, viewportRect]);
  return /* @__PURE__ */ jsx3(
    "path",
    {
      d,
      stroke,
      strokeWidth,
      strokeDasharray,
      fill,
      clipPath: clip ? `url(#${clipPathId})` : void 0
    }
  );
}

// src/Polygon2D.tsx
import React4 from "react";
import { jsx as jsx4 } from "react/jsx-runtime";
function Polygon2D({
  points,
  stroke = "#000",
  strokeWidth = 2,
  fill = "rgba(0,0,0,0.06)",
  closed = true,
  clip = true
}) {
  const { worldToScreen, clipPathId } = usePlot();
  const d = React4.useMemo(() => {
    if (!points.length) return "";
    const [x0, y0] = points[0];
    const p0 = worldToScreen(x0, y0);
    let s = "M " + p0.x + " " + p0.y;
    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i];
      const p = worldToScreen(x, y);
      s += " L " + p.x + " " + p.y;
    }
    if (closed) s += " Z";
    return s;
  }, [points, worldToScreen, closed]);
  return /* @__PURE__ */ jsx4(
    "path",
    {
      d,
      stroke,
      strokeWidth,
      fill: closed ? fill : "none",
      clipPath: clip ? `url(#${clipPathId})` : void 0
    }
  );
}

// src/Arc.tsx
import React5 from "react";
import { jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
function Arc({ cx, cy, r, a0, a1, stroke = "#333", strokeWidth = 1.5, fill, fillOpacity = 0.2, clip = true }) {
  const { worldToScreen, clipPathId } = usePlot();
  const d = React5.useMemo(() => {
    let da = a1 - a0;
    if (Math.abs(da) < 1e-12 || !isFinite(r) || r <= 0) return "";
    const twoPi = Math.PI * 2;
    const sweepSign = da >= 0 ? 1 : -1;
    da = Math.min(twoPi, Math.abs(da));
    const span = da;
    const segments = Math.max(6, Math.ceil(span / (Math.PI / 64)));
    const step = sweepSign * (span / segments);
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const t = a0 + i * step;
      const wx = cx + r * Math.cos(t);
      const wy = cy + r * Math.sin(t);
      points.push(worldToScreen(wx, wy));
    }
    if (!points.length) return "";
    if (fill) {
      const c = worldToScreen(cx, cy);
      let s = `M ${c.x} ${c.y} L ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) s += ` L ${points[i].x} ${points[i].y}`;
      s += " Z";
      return s;
    } else {
      let s = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) s += ` L ${points[i].x} ${points[i].y}`;
      return s;
    }
  }, [cx, cy, r, a0, a1, worldToScreen, fill]);
  if (!d) return null;
  return /* @__PURE__ */ jsx5(
    "path",
    {
      d,
      stroke,
      strokeWidth,
      fill: fill ? fill : "none",
      fillOpacity: fill ? fillOpacity : void 0,
      clipPath: clip ? `url(#${clipPathId})` : void 0
    }
  );
}
function Circle({ cx, cy, r, stroke = "#333", strokeWidth = 1, fill = "none", fillOpacity = 1, clip = true }) {
  const { worldToScreen, clipPathId } = usePlot();
  const c = worldToScreen(cx, cy);
  const rx = Math.abs(r * (worldToScreen(cx + 1, cy).x - c.x));
  const ry = Math.abs(r * (worldToScreen(cx, cy + 1).y - c.y));
  return /* @__PURE__ */ jsxs3("g", { clipPath: clip ? `url(#${clipPathId})` : void 0, children: [
    /* @__PURE__ */ jsx5("ellipse", { cx: c.x, cy: c.y, rx, ry, fill, fillOpacity: fill !== "none" ? fillOpacity : void 0 }),
    /* @__PURE__ */ jsx5("ellipse", { cx: c.x, cy: c.y, rx, ry, fill: "none", stroke, strokeWidth })
  ] });
}

// src/Label.tsx
import { jsx as jsx6 } from "react/jsx-runtime";
function Label({ x, y, children, align = "center", vAlign = "middle", dx = 0, dy = 0, pointerEvents = "auto", width, height }) {
  const { worldToScreen, margin, innerWidth, innerHeight } = usePlot();
  const p = worldToScreen(x, y);
  const transformX = align === "center" ? "-50%" : align === "right" ? "-100%" : "0";
  const transformY = vAlign === "middle" ? "-50%" : vAlign === "bottom" ? "-100%" : "0";
  const left = p.x - margin.left + dx;
  const top = p.y - margin.top + dy;
  return /* @__PURE__ */ jsx6("foreignObject", { x: margin.left, y: margin.top, width: innerWidth, height: innerHeight, children: /* @__PURE__ */ jsx6("div", { style: { position: "relative", width: width || "100%", height: height || "100%", pointerEvents: "none", fontFamily: "system-ui, Segoe UI, Roboto, sans-serif", fontSize: 12, color: "#222" }, children: /* @__PURE__ */ jsx6("div", { style: { position: "absolute", left, top, transform: `translate(${transformX}, ${transformY})`, pointerEvents }, children }) }) });
}

// src/Line.tsx
import { jsx as jsx7 } from "react/jsx-runtime";
function Line({
  x1,
  y1,
  x2,
  y2,
  stroke = "#1565c0",
  strokeWidth = 2,
  strokeDasharray,
  clip = true
}) {
  const { worldToScreen, clipPathId } = usePlot();
  const p1 = worldToScreen(x1, y1);
  const p2 = worldToScreen(x2, y2);
  return /* @__PURE__ */ jsx7(
    "line",
    {
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      stroke,
      strokeWidth,
      strokeDasharray,
      clipPath: clip ? `url(#${clipPathId})` : void 0
    }
  );
}

// src/Function2D.tsx
import { jsx as jsx8 } from "react/jsx-runtime";
function Function2D({
  f,
  xRange,
  samples = 600,
  stroke = "#1565c0",
  strokeWidth = 2,
  strokeDasharray,
  clip = true,
  domainFollowsViewport = true,
  overscan = 0
}) {
  return /* @__PURE__ */ jsx8(
    Parametric2D,
    {
      x: (t) => t,
      y: (t) => f(t),
      tRange: xRange,
      samples,
      stroke,
      strokeWidth,
      strokeDasharray,
      clip,
      domainFollowsViewport,
      assumeXEqualsT: true,
      overscan
    }
  );
}

// src/Point2D.tsx
import { jsx as jsx9 } from "react/jsx-runtime";
function Point2D({ x, y, r = 3, fill = "#1565c0", stroke = "none", strokeWidth = 1, clip = true }) {
  const { worldToScreen, clipPathId } = usePlot();
  const p = worldToScreen(x, y);
  return /* @__PURE__ */ jsx9("g", { clipPath: clip ? `url(#${clipPathId})` : void 0, children: /* @__PURE__ */ jsx9("circle", { cx: p.x, cy: p.y, r, fill, stroke, strokeWidth }) });
}

// src/Scatter2D.tsx
import React6 from "react";
import { jsx as jsx10 } from "react/jsx-runtime";
function Scatter2D({ points, r = 2.5, fill = "#1565c0", stroke = "none", strokeWidth = 1, clip = true, renderPoint }) {
  const { worldToScreen, clipPathId } = usePlot();
  const nodes = React6.useMemo(() => {
    return points.map((pt, i) => {
      const x = Array.isArray(pt) ? pt[0] : pt.x;
      const y = Array.isArray(pt) ? pt[1] : pt.y;
      const p = worldToScreen(x, y);
      if (renderPoint) {
        return /* @__PURE__ */ jsx10("g", { transform: `translate(${p.x},${p.y})`, children: renderPoint({ x, y, i, sx: p.x, sy: p.y }) }, i);
      }
      return /* @__PURE__ */ jsx10("circle", { cx: p.x, cy: p.y, r, fill, stroke, strokeWidth }, i);
    });
  }, [points, worldToScreen, r, fill, stroke, strokeWidth, renderPoint]);
  return /* @__PURE__ */ jsx10("g", { clipPath: clip ? `url(#${clipPathId})` : void 0, children: nodes });
}

// src/Ray2D.tsx
import { jsx as jsx11 } from "react/jsx-runtime";
function Ray2D({ from, through, stroke = "#1565c0", strokeWidth = 2, strokeDasharray }) {
  const { xRange, yRange } = usePlot();
  const [x0, y0] = from;
  const [x1, y1] = through;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const eps = 1e-12;
  const candidates = [];
  const addIfValid = (t) => {
    if (t >= 0 && isFinite(t)) candidates.push([x0 + t * dx, y0 + t * dy]);
  };
  if (Math.abs(dx) > eps) addIfValid((xRange[0] - x0) / dx);
  if (Math.abs(dx) > eps) addIfValid((xRange[1] - x0) / dx);
  if (Math.abs(dy) > eps) addIfValid((yRange[0] - y0) / dy);
  if (Math.abs(dy) > eps) addIfValid((yRange[1] - y0) / dy);
  let end = [x0, y0];
  let bestT = -Infinity;
  for (const [xe, ye] of candidates) {
    const inside = xe >= Math.min(xRange[0], xRange[1]) - eps && xe <= Math.max(xRange[0], xRange[1]) + eps && ye >= Math.min(yRange[0], yRange[1]) - eps && ye <= Math.max(yRange[0], yRange[1]) + eps;
    if (!inside) continue;
    const t = Math.abs(dx) > Math.abs(dy) ? (xe - x0) / (dx || 1) : (ye - y0) / (dy || 1);
    if (t >= 0 && t > bestT) {
      bestT = t;
      end = [xe, ye];
    }
  }
  return /* @__PURE__ */ jsx11(Line, { x1: x0, y1: y0, x2: end[0], y2: end[1], stroke, strokeWidth, strokeDasharray });
}

// src/Vector2D.tsx
import { jsx as jsx12, jsxs as jsxs4 } from "react/jsx-runtime";
function Vector2D({ x1, y1, x2, y2, stroke = "#1565c0", strokeWidth = 2, headSize = 8, fillHead, clip = true }) {
  const { worldToScreen, clipPathId } = usePlot();
  const p1 = worldToScreen(x1, y1);
  const p2 = worldToScreen(x2, y2);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const hs = Math.max(2, headSize);
  const backX = p2.x - ux * hs;
  const backY = p2.y - uy * hs;
  const orthoX = -uy;
  const orthoY = ux;
  const w = hs * 0.6;
  const a = { x: p2.x, y: p2.y };
  const b = { x: backX + orthoX * w * 0.5, y: backY + orthoY * w * 0.5 };
  const c = { x: backX - orthoX * w * 0.5, y: backY - orthoY * w * 0.5 };
  return /* @__PURE__ */ jsxs4("g", { clipPath: clip ? `url(#${clipPathId})` : void 0, children: [
    /* @__PURE__ */ jsx12("line", { x1: p1.x, y1: p1.y, x2: backX, y2: backY, stroke, strokeWidth }),
    /* @__PURE__ */ jsx12("polygon", { points: `${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`, fill: fillHead ?? stroke })
  ] });
}

// src/Polyline2D.tsx
import React7 from "react";
import { jsx as jsx13 } from "react/jsx-runtime";
function Polyline2D({ points, stroke = "#1565c0", strokeWidth = 2, strokeDasharray, clip = true }) {
  const { worldToScreen, clipPathId } = usePlot();
  const d = React7.useMemo(() => {
    if (!points.length) return "";
    const [x0, y0] = points[0];
    const p0 = worldToScreen(x0, y0);
    let s = `M ${p0.x} ${p0.y}`;
    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i];
      const p = worldToScreen(x, y);
      s += ` L ${p.x} ${p.y}`;
    }
    return s;
  }, [points, worldToScreen]);
  return /* @__PURE__ */ jsx13("path", { d, stroke, strokeWidth, strokeDasharray, fill: "none", clipPath: clip ? `url(#${clipPathId})` : void 0 });
}

// src/Bezier2D.tsx
import React8 from "react";
import { jsx as jsx14 } from "react/jsx-runtime";
function Bezier2D(props) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const { worldToScreen, clipPathId } = usePlot();
  const samples = props.samples ?? 120;
  const stroke = props.stroke ?? "#1565c0";
  const strokeWidth = props.strokeWidth ?? 2;
  const strokeDasharray = props.strokeDasharray;
  const clip = props.clip ?? true;
  const points = React8.useMemo(() => {
    const pts = [];
    if (props.kind === "quadratic") {
      const [x0, y0] = props.p0;
      const [x1, y1] = props.p1;
      const [x2, y2] = props.p2;
      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const u = 1 - t;
        const wx = u * u * x0 + 2 * u * t * x1 + t * t * x2;
        const wy = u * u * y0 + 2 * u * t * y1 + t * t * y2;
        pts.push(worldToScreen(wx, wy));
      }
    } else {
      const [x0, y0] = props.p0;
      const [x1, y1] = props.p1;
      const [x2, y2] = props.p2;
      const [x3, y3] = props.p3;
      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const u = 1 - t;
        const wx = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
        const wy = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
        pts.push(worldToScreen(wx, wy));
      }
    }
    return pts;
  }, [(_a = props.p0) == null ? void 0 : _a[0], (_b = props.p0) == null ? void 0 : _b[1], (_c = props.p1) == null ? void 0 : _c[0], (_d = props.p1) == null ? void 0 : _d[1], (_e = props.p2) == null ? void 0 : _e[0], (_f = props.p2) == null ? void 0 : _f[1], props.kind, (_g = props.p3) == null ? void 0 : _g[0], (_h = props.p3) == null ? void 0 : _h[1], samples, worldToScreen]);
  const d = React8.useMemo(() => {
    if (points.length === 0) return "";
    const [p0, ...rest] = points;
    return "M " + p0.x + " " + p0.y + " " + rest.map((p) => "L " + p.x + " " + p.y).join(" ");
  }, [points]);
  return /* @__PURE__ */ jsx14("path", { d, stroke, strokeWidth, strokeDasharray, fill: "none", clipPath: clip ? `url(#${clipPathId})` : void 0 });
}

// src/Area2D.tsx
import React9 from "react";
import { jsx as jsx15 } from "react/jsx-runtime";
function Area2D({ f, a, b, baseline = 0, samples = 300, fill = "rgba(21,101,192,0.15)", fillOpacity, stroke = "#1565c0", strokeWidth = 1, clip = true }) {
  const { worldToScreen, clipPathId } = usePlot();
  const d = React9.useMemo(() => {
    const n = Math.max(2, Math.floor(samples));
    const x0 = Math.min(a, b);
    const x1 = Math.max(a, b);
    const ptsTop = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = x0 + t * (x1 - x0);
      ptsTop.push(worldToScreen(x, f(x)));
    }
    const ptsBase = [];
    for (let i = n; i >= 0; i--) {
      const t = i / n;
      const x = x0 + t * (x1 - x0);
      const yb = typeof baseline === "number" ? baseline : baseline(x);
      ptsBase.push(worldToScreen(x, yb));
    }
    if (ptsTop.length === 0) return "";
    const start = ptsTop[0];
    let s = `M ${start.x} ${start.y}`;
    for (let i = 1; i < ptsTop.length; i++) s += ` L ${ptsTop[i].x} ${ptsTop[i].y}`;
    for (let i = 0; i < ptsBase.length; i++) s += ` L ${ptsBase[i].x} ${ptsBase[i].y}`;
    s += " Z";
    return s;
  }, [a, b, samples, baseline, f, worldToScreen]);
  return /* @__PURE__ */ jsx15("path", { d, fill, fillOpacity, stroke, strokeWidth, clipPath: clip ? `url(#${clipPathId})` : void 0 });
}

// src/RiemannSum.tsx
import React10 from "react";
import { jsx as jsx16 } from "react/jsx-runtime";
function RiemannSum({ f, a, b, n, method = "mid", baseline = 0, fill = "rgba(21,101,192,0.15)", stroke = "#1565c0", strokeWidth = 1, clip = true }) {
  const { worldToScreen, clipPathId } = usePlot();
  const rects = React10.useMemo(() => {
    const rects2 = [];
    const x0 = Math.min(a, b);
    const x1 = Math.max(a, b);
    const dx = (x1 - x0) / Math.max(1, n);
    for (let i = 0; i < n; i++) {
      let xLeft = x0 + i * dx;
      let xRight = xLeft + dx;
      let heightY;
      if (method === "left") heightY = f(xLeft);
      else if (method === "right") heightY = f(xRight);
      else if (method === "mid") heightY = f((xLeft + xRight) * 0.5);
      else heightY = (f(xLeft) + f(xRight)) * 0.5;
      const yTop = method === "trapezoid" ? void 0 : heightY;
      if (method === "trapezoid") {
        const p1 = worldToScreen(xLeft, baseline);
        const p2 = worldToScreen(xLeft, f(xLeft));
        const p3 = worldToScreen(xRight, f(xRight));
        const p4 = worldToScreen(xRight, baseline);
        rects2.push(`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`);
      } else {
        const p1 = worldToScreen(xLeft, baseline);
        const p2 = worldToScreen(xLeft, yTop);
        const p3 = worldToScreen(xRight, yTop);
        const p4 = worldToScreen(xRight, baseline);
        rects2.push(`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`);
      }
    }
    return rects2;
  }, [a, b, n, method, baseline, f, worldToScreen]);
  return /* @__PURE__ */ jsx16("g", { clipPath: clip ? `url(#${clipPathId})` : void 0, children: rects.map((d, i) => /* @__PURE__ */ jsx16("path", { d, fill, stroke, strokeWidth }, i)) });
}

// src/TangentLine.tsx
import { jsx as jsx17 } from "react/jsx-runtime";
function TangentLine({ f, x0, color = "#ef4444", strokeWidth = 1.5 }) {
  const { xRange } = usePlot();
  const span = Math.max(1e-8, Math.abs(xRange[1] - xRange[0]));
  const h = span * 1e-8;
  const y0 = f(x0);
  const dydx = (f(x0 + h) - f(x0 - h)) / (2 * h);
  const xA = xRange[0];
  const xB = xRange[1];
  const yA = y0 + dydx * (xA - x0);
  const yB = y0 + dydx * (xB - x0);
  return /* @__PURE__ */ jsx17(Line, { x1: xA, y1: yA, x2: xB, y2: yB, stroke: color, strokeWidth });
}

// src/NormalLine.tsx
import { jsx as jsx18 } from "react/jsx-runtime";
function NormalLine({ f, x0, color = "#10b981", strokeWidth = 1.5 }) {
  const { xRange, yRange, innerWidth, innerHeight } = usePlot();
  const span = Math.max(1e-8, Math.abs(xRange[1] - xRange[0]));
  const h = span * 1e-8;
  const y0 = f(x0);
  const dydx = (f(x0 + h) - f(x0 - h)) / (2 * h);
  const scaleX = Math.abs(innerWidth / (xRange[1] - xRange[0]));
  const scaleY = Math.abs(innerHeight / (yRange[1] - yRange[0]));
  let vx = -(scaleY / Math.max(1e-12, scaleX)) * dydx;
  let vy = scaleX / Math.max(1e-12, scaleY);
  if (!isFinite(dydx)) {
    vx = 0;
    vy = 1;
  }
  if (Math.abs(vx) + Math.abs(vy) < 1e-16) {
    vx = 0;
    vy = 1;
  }
  const xmin = Math.min(xRange[0], xRange[1]);
  const xmax = Math.max(xRange[0], xRange[1]);
  const ymin = Math.min(yRange[0], yRange[1]);
  const ymax = Math.max(yRange[0], yRange[1]);
  const eps = 1e-12;
  const ts = [];
  if (Math.abs(vx) > eps) {
    ts.push((xmin - x0) / vx, (xmax - x0) / vx);
  }
  if (Math.abs(vy) > eps) {
    ts.push((ymin - y0) / vy, (ymax - y0) / vy);
  }
  const pts = [];
  for (const t of ts) {
    const x = x0 + vx * t;
    const y = y0 + vy * t;
    if (x >= xmin - 1e-9 && x <= xmax + 1e-9 && y >= ymin - 1e-9 && y <= ymax + 1e-9) {
      pts.push([x, y, t]);
    }
  }
  pts.sort((a, b) => a[2] - b[2]);
  let xA = x0, yA = y0, xB = x0, yB = y0;
  if (pts.length >= 2) {
    [xA, yA] = [pts[0][0], pts[0][1]];
    [xB, yB] = [pts[pts.length - 1][0], pts[pts.length - 1][1]];
  } else if (pts.length === 1) {
    const [xe, ye] = pts[0];
    const ext = Math.max(xmax - xmin, ymax - ymin) || 1;
    xA = xe - vx * ext;
    yA = ye - vy * ext;
    xB = xe + vx * ext;
    yB = ye + vy * ext;
  } else {
    xA = x0;
    yA = ymin;
    xB = x0;
    yB = ymax;
  }
  return /* @__PURE__ */ jsx18(Line, { x1: xA, y1: yA, x2: xB, y2: yB, stroke: color, strokeWidth });
}

// src/AngleMarker.tsx
import { jsx as jsx19 } from "react/jsx-runtime";
function AngleMarker({ center, a, b, r = 0.3, stroke = "#ef4444", strokeWidth = 2, fill, fillOpacity = 0.15 }) {
  const [cx, cy] = center;
  const ang = (p) => Math.atan2(p[1] - cy, p[0] - cx);
  let a0 = ang(a);
  let a1 = ang(b);
  let da = a1 - a0;
  while (da <= -Math.PI) {
    a1 += 2 * Math.PI;
    da = a1 - a0;
  }
  while (da > Math.PI) {
    a1 -= 2 * Math.PI;
    da = a1 - a0;
  }
  return /* @__PURE__ */ jsx19(Arc, { cx, cy, r, a0, a1, stroke, strokeWidth, fill, fillOpacity: fill ? fillOpacity : void 0 });
}

// src/DistanceMarker.tsx
import { jsx as jsx20, jsxs as jsxs5 } from "react/jsx-runtime";
function DistanceMarker({ x1, y1, x2, y2, tickSize = 8, stroke = "#333", strokeWidth = 1, label, labelOffsetPx = 10, clip = true }) {
  const { worldToScreen, clipPathId } = usePlot();
  const p1 = worldToScreen(x1, y1);
  const p2 = worldToScreen(x2, y2);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const ox = -uy;
  const oy = ux;
  const t = tickSize * 0.5;
  const t1a = { x: p1.x + ox * t, y: p1.y + oy * t };
  const t1b = { x: p1.x - ox * t, y: p1.y - oy * t };
  const t2a = { x: p2.x + ox * t, y: p2.y + oy * t };
  const t2b = { x: p2.x - ox * t, y: p2.y - oy * t };
  const mid = { x: (p1.x + p2.x) / 2 + ox * labelOffsetPx, y: (p1.y + p2.y) / 2 + oy * labelOffsetPx };
  return /* @__PURE__ */ jsxs5("g", { clipPath: clip ? `url(#${clipPathId})` : void 0, children: [
    /* @__PURE__ */ jsx20("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke, strokeWidth }),
    /* @__PURE__ */ jsx20("line", { x1: t1a.x, y1: t1a.y, x2: t1b.x, y2: t1b.y, stroke, strokeWidth }),
    /* @__PURE__ */ jsx20("line", { x1: t2a.x, y1: t2a.y, x2: t2b.x, y2: t2b.y, stroke, strokeWidth }),
    label && /* @__PURE__ */ jsx20("foreignObject", { x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y), width: Math.abs(p2.x - p1.x) || 1, height: Math.abs(p2.y - p1.y) || 1, children: /* @__PURE__ */ jsx20("div", { style: { position: "relative", width: "100%", height: "100%", pointerEvents: "none", fontFamily: "system-ui, Segoe UI, Roboto, sans-serif", fontSize: 12, color: "#222" }, children: /* @__PURE__ */ jsx20("div", { style: { position: "absolute", left: mid.x - Math.min(p1.x, p2.x), top: mid.y - Math.min(p1.y, p2.y), transform: "translate(-50%, -50%)" }, children: label }) }) })
  ] });
}

// src/VectorField2D.tsx
import React11 from "react";
import { jsx as jsx21 } from "react/jsx-runtime";
function VectorField2D({
  v,
  mode = "world",
  origin = [0, 0],
  stepX,
  stepY,
  countX = 16,
  countY = 12,
  normalize = true,
  scale,
  color = "#334155",
  strokeWidth = 1.5,
  headSize = 8
}) {
  const { xRange, yRange } = usePlot();
  const xmin = Math.min(xRange[0], xRange[1]);
  const xmax = Math.max(xRange[0], xRange[1]);
  const ymin = Math.min(yRange[0], yRange[1]);
  const ymax = Math.max(yRange[0], yRange[1]);
  const initStepRef = React11.useRef(null);
  if (mode === "world" && !initStepRef.current) {
    const sx0 = (xmax - xmin) / Math.max(1, countX - 1);
    const sy0 = (ymax - ymin) / Math.max(1, countY - 1);
    initStepRef.current = { sx: sx0, sy: sy0 };
  }
  const arrows = React11.useMemo(() => {
    const nodes = [];
    if (mode === "world") {
      const sx = stepX ?? initStepRef.current.sx;
      const sy = stepY ?? initStepRef.current.sy;
      const [ox, oy] = origin;
      const iMin = Math.ceil((xmin - ox) / sx);
      const iMax = Math.floor((xmax - ox) / sx);
      const jMin = Math.ceil((ymin - oy) / sy);
      const jMax = Math.floor((ymax - oy) / sy);
      const base = scale ?? 0.35 * Math.hypot(sx, sy);
      for (let j = jMin; j <= jMax; j++) {
        for (let i = iMin; i <= iMax; i++) {
          const x = ox + i * sx;
          const y = oy + j * sy;
          const vec = v(x, y);
          const vx = Array.isArray(vec) ? vec[0] : vec.vx;
          const vy = Array.isArray(vec) ? vec[1] : vec.vy;
          let mx = vx, my = vy;
          if (normalize) {
            const m = Math.hypot(vx, vy) || 1;
            mx = vx / m * base;
            my = vy / m * base;
          } else {
            const s = scale ?? 1;
            mx = vx * s;
            my = vy * s;
          }
          nodes.push(
            /* @__PURE__ */ jsx21(Vector2D, { x1: x, y1: y, x2: x + mx, y2: y + my, stroke: color, strokeWidth, headSize }, `${i}-${j}`)
          );
        }
      }
      return nodes;
    } else {
      const dx = (xmax - xmin) / Math.max(1, countX - 1);
      const dy = (ymax - ymin) / Math.max(1, countY - 1);
      const base = scale ?? 0.35 * Math.hypot(dx, dy);
      for (let iy = 0; iy < countY; iy++) {
        for (let ix = 0; ix < countX; ix++) {
          const x = xmin + ix * dx;
          const y = ymin + iy * dy;
          const vec = v(x, y);
          const vx = Array.isArray(vec) ? vec[0] : vec.vx;
          const vy = Array.isArray(vec) ? vec[1] : vec.vy;
          let mx = vx, my = vy;
          if (normalize) {
            const m = Math.hypot(vx, vy) || 1;
            mx = vx / m * base;
            my = vy / m * base;
          } else {
            const s = scale ?? 1;
            mx = vx * s;
            my = vy * s;
          }
          nodes.push(
            /* @__PURE__ */ jsx21(Vector2D, { x1: x, y1: y, x2: x + mx, y2: y + my, stroke: color, strokeWidth, headSize }, `${ix}-${iy}`)
          );
        }
      }
      return nodes;
    }
  }, [mode, v, origin, stepX, stepY, xmin, xmax, ymin, ymax, countX, countY, normalize, scale, color, strokeWidth, headSize]);
  return /* @__PURE__ */ jsx21("g", { children: arrows });
}

// src/Heatmap2D.tsx
import React12 from "react";
import { jsx as jsx22 } from "react/jsx-runtime";
function defaultColorMap(t) {
  const clamp = (v) => Math.max(0, Math.min(1, v));
  t = clamp(t);
  const r = t < 0.5 ? 0 : Math.round(510 * (t - 0.5));
  const g = t < 0.5 ? Math.round(510 * t) : Math.round(510 * (1 - (t - 0.5)));
  const b = t < 0.5 ? Math.round(255) : Math.round(255 * (1 - (t - 0.5) * 2));
  return `rgb(${r},${g},${b})`;
}
function Heatmap2D({ f, mode = "world", origin = [0, 0], stepX, stepY, countX = 40, countY = 30, valueRange, colorMap = defaultColorMap, opacity = 0.9, clip = true }) {
  const { xRange, yRange, worldToScreen, clipPathId } = usePlot();
  const xmin = Math.min(xRange[0], xRange[1]);
  const xmax = Math.max(xRange[0], xRange[1]);
  const ymin = Math.min(yRange[0], yRange[1]);
  const ymax = Math.max(yRange[0], yRange[1]);
  const initStepRef = React12.useRef(null);
  if (mode === "world" && !initStepRef.current) {
    const sx0 = (xmax - xmin) / Math.max(1, countX);
    const sy0 = (ymax - ymin) / Math.max(1, countY);
    initStepRef.current = { sx: sx0, sy: sy0 };
  }
  const rects = React12.useMemo(() => {
    let minv = Infinity, maxv = -Infinity;
    const tiles = [];
    if (mode === "world") {
      const sx = stepX ?? initStepRef.current.sx;
      const sy = stepY ?? initStepRef.current.sy;
      const [ox, oy] = origin;
      const iMin = Math.floor((xmin - ox) / sx) - 1;
      const iMax = Math.ceil((xmax - ox) / sx) + 1;
      const jMin = Math.floor((ymin - oy) / sy) - 1;
      const jMax = Math.ceil((ymax - oy) / sy) + 1;
      const rows = [];
      for (let j = jMin; j <= jMax; j++) {
        const row = [];
        for (let i = iMin; i <= iMax; i++) {
          const x0 = ox + i * sx, y0 = oy + j * sy;
          const x1 = x0 + sx, y1 = y0 + sy;
          const xc = (x0 + x1) * 0.5, yc = (y0 + y1) * 0.5;
          const v = f(xc, yc);
          if (v < minv) minv = v;
          if (v > maxv) maxv = v;
          row.push({ x0, y0, x1, y1, v });
        }
        rows.push(row);
      }
      tiles.push(...rows);
    } else {
      const sx = (xmax - xmin) / Math.max(1, countX);
      const sy = (ymax - ymin) / Math.max(1, countY);
      for (let j = 0; j < countY; j++) {
        const row = [];
        for (let i = 0; i < countX; i++) {
          const x0 = xmin + i * sx, y0 = ymin + j * sy;
          const x1 = x0 + sx, y1 = y0 + sy;
          const xc = (x0 + x1) * 0.5, yc = (y0 + y1) * 0.5;
          const v = f(xc, yc);
          if (v < minv) minv = v;
          if (v > maxv) maxv = v;
          row.push({ x0, y0, x1, y1, v });
        }
        tiles.push(row);
      }
    }
    if (valueRange) {
      minv = valueRange[0];
      maxv = valueRange[1];
    }
    const clampV = (v) => Math.max(minv, Math.min(maxv, v));
    const tOf = (v) => maxv === minv ? 0.5 : (clampV(v) - minv) / (maxv - minv);
    const nodes = [];
    let key = 0;
    for (const row of tiles) {
      for (const tile of row) {
        const p = worldToScreen(tile.x0, tile.y0);
        const p2 = worldToScreen(tile.x1, tile.y1);
        const w = Math.abs(p2.x - p.x);
        const h = Math.abs(p2.y - p.y);
        const fill = colorMap(tOf(tile.v));
        nodes.push(/* @__PURE__ */ jsx22("rect", { x: Math.min(p.x, p2.x), y: Math.min(p.y, p2.y), width: Math.max(1, w), height: Math.max(1, h), fill, opacity }, key++));
      }
    }
    return nodes;
  }, [mode, f, origin, stepX, stepY, countX, countY, xmin, xmax, ymin, ymax, worldToScreen, valueRange, colorMap, opacity]);
  return /* @__PURE__ */ jsx22("g", { clipPath: clip ? `url(#${clipPathId})` : void 0, children: rects });
}

// src/Implicit2D.tsx
import React13 from "react";
import { jsx as jsx23 } from "react/jsx-runtime";
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function Implicit2D({ F, level = 0, countX = 96, countY = 72, stroke = "#111827", strokeWidth = 1.5, strokeDasharray, clip = true }) {
  const { xRange, yRange, worldToScreen, clipPathId } = usePlot();
  const xmin = Math.min(xRange[0], xRange[1]);
  const xmax = Math.max(xRange[0], xRange[1]);
  const ymin = Math.min(yRange[0], yRange[1]);
  const ymax = Math.max(yRange[0], yRange[1]);
  const dx = (xmax - xmin) / Math.max(1, countX);
  const dy = (ymax - ymin) / Math.max(1, countY);
  const segs = React13.useMemo(() => {
    const vals = [];
    for (let iy = 0; iy <= countY; iy++) {
      const row = [];
      for (let ix = 0; ix <= countX; ix++) {
        const x = xmin + ix * dx;
        const y = ymin + iy * dy;
        row.push(F(x, y) - level);
      }
      vals.push(row);
    }
    const lines = [];
    for (let iy = 0; iy < countY; iy++) {
      for (let ix = 0; ix < countX; ix++) {
        const v00 = vals[iy][ix];
        const v10 = vals[iy][ix + 1];
        const v01 = vals[iy + 1][ix];
        const v11 = vals[iy + 1][ix + 1];
        const x0 = xmin + ix * dx;
        const y0 = ymin + iy * dy;
        const x1 = x0 + dx;
        const y1 = y0 + dy;
        const idx = (v00 > 0 ? 1 : 0) | (v10 > 0 ? 2 : 0) | (v11 > 0 ? 4 : 0) | (v01 > 0 ? 8 : 0);
        if (idx === 0 || idx === 15) continue;
        const edgePoint = (edge) => {
          switch (edge) {
            case 0: {
              const t = v10 === v00 ? 0.5 : (0 - v00) / (v10 - v00);
              const xs = lerp(x0, x1, t);
              const ys = y0;
              return worldToScreen(xs, ys);
            }
            case 1: {
              const t = v11 === v10 ? 0.5 : (0 - v10) / (v11 - v10);
              const xs = x1;
              const ys = lerp(y0, y1, t);
              return worldToScreen(xs, ys);
            }
            case 2: {
              const t = v11 === v01 ? 0.5 : (0 - v01) / (v11 - v01);
              const xs = lerp(x0, x1, t);
              const ys = y1;
              return worldToScreen(xs, ys);
            }
            case 3: {
              const t = v01 === v00 ? 0.5 : (0 - v00) / (v01 - v00);
              const xs = x0;
              const ys = lerp(y0, y1, t);
              return worldToScreen(xs, ys);
            }
          }
          return worldToScreen(x0, y0);
        };
        const table = {
          1: [[3, 0]],
          2: [[0, 1]],
          3: [[3, 1]],
          4: [[1, 2]],
          5: [[3, 2], [0, 1]],
          6: [[0, 2]],
          7: [[3, 2]],
          8: [[2, 3]],
          9: [[0, 2]],
          10: [[1, 3], [0, 2]],
          11: [[1, 2]],
          12: [[1, 3]],
          13: [[0, 1]],
          14: [[3, 0]]
        };
        const segEdges = table[idx] || [];
        for (const [e1, e2] of segEdges) {
          const p1 = edgePoint(e1);
          const p2 = edgePoint(e2);
          lines.push(`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`);
        }
      }
    }
    return lines;
  }, [F, level, countX, countY, xmin, ymin, dx, dy, worldToScreen]);
  return /* @__PURE__ */ jsx23("g", { clipPath: clip ? `url(#${clipPathId})` : void 0, children: segs.map((d, i) => /* @__PURE__ */ jsx23("path", { d, stroke, strokeWidth, strokeDasharray, fill: "none" }, i)) });
}

// src/Contour2D.tsx
import { jsx as jsx24 } from "react/jsx-runtime";
function Contour2D({ F, levels, colors, strokeWidth = 1, strokeDasharray, countX, countY }) {
  return /* @__PURE__ */ jsx24("g", { children: levels.map((lv, i) => /* @__PURE__ */ jsx24(Implicit2D, { F, level: lv, stroke: (colors == null ? void 0 : colors[i % ((colors == null ? void 0 : colors.length) || 1)]) || "#1f2937", strokeWidth, strokeDasharray, countX, countY }, i)) });
}

// src/PolarFunction2D.tsx
import { jsx as jsx25 } from "react/jsx-runtime";
function PolarFunction2D({ r, thetaRange, samples = 800, stroke = "#111827", strokeWidth = 2, strokeDasharray, clip = true, overscan = 0 }) {
  return /* @__PURE__ */ jsx25(
    Parametric2D,
    {
      x: (t) => r(t) * Math.cos(t),
      y: (t) => r(t) * Math.sin(t),
      tRange: thetaRange,
      samples,
      stroke,
      strokeWidth,
      strokeDasharray,
      clip,
      domainFollowsViewport: false,
      overscan
    }
  );
}

// src/Crosshair2D.tsx
import { jsx as jsx26, jsxs as jsxs6 } from "react/jsx-runtime";
function Crosshair2D({ color = "#6b7280", strokeWidth = 1, showLabels = true, format }) {
  const { mouse, clipPathId, margin, innerWidth, innerHeight } = usePlot();
  if (!(mouse == null ? void 0 : mouse.inside)) return null;
  const sx = margin.left + Math.max(0, Math.min(innerWidth, mouse.sx - margin.left));
  const sy = margin.top + Math.max(0, Math.min(innerHeight, mouse.sy - margin.top));
  const label = format ? format(mouse.x, mouse.y) : `(${mouse.x.toFixed(3)}, ${mouse.y.toFixed(3)})`;
  return /* @__PURE__ */ jsxs6("g", { children: [
    /* @__PURE__ */ jsxs6("g", { clipPath: `url(#${clipPathId})`, children: [
      /* @__PURE__ */ jsx26("line", { x1: margin.left, y1: sy, x2: margin.left + innerWidth, y2: sy, stroke: color, strokeWidth, strokeDasharray: "4 4" }),
      /* @__PURE__ */ jsx26("line", { x1: sx, y1: margin.top, x2: sx, y2: margin.top + innerHeight, stroke: color, strokeWidth, strokeDasharray: "4 4" })
    ] }),
    showLabels && /* @__PURE__ */ jsx26("foreignObject", { x: margin.left, y: margin.top, width: innerWidth, height: innerHeight, children: /* @__PURE__ */ jsx26("div", { style: { position: "relative", width: "100%", height: "100%", pointerEvents: "none", fontFamily: "system-ui, Segoe UI, Roboto, sans-serif", fontSize: 12 }, children: /* @__PURE__ */ jsx26("div", { style: { position: "absolute", left: sx - margin.left + 8, top: sy - margin.top - 8, transform: "translate(0,-100%)", background: "rgba(17,24,39,0.75)", color: "#fff", padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap" }, children: label }) }) })
  ] });
}

// src/Legend2D.tsx
import { jsx as jsx27, jsxs as jsxs7 } from "react/jsx-runtime";
function Legend2D({ items, position = "top-right", padding = 8, bg = "rgba(255,255,255,0.9)", opacity = 1 }) {
  const { margin, innerWidth, innerHeight } = usePlot();
  const x0 = margin.left;
  const y0 = margin.top;
  const width = innerWidth;
  const height = innerHeight;
  const isTR = position === "top-right";
  const isBR = position === "bottom-right";
  const top = position.startsWith("top") ? y0 + padding : y0 + height - padding;
  const left = isTR || isBR ? x0 + width - padding : x0 + padding;
  const align = isTR || isBR ? "right" : "left";
  return /* @__PURE__ */ jsx27("foreignObject", { x: margin.left, y: margin.top, width: innerWidth, height: innerHeight, opacity, children: /* @__PURE__ */ jsx27("div", { style: { position: "relative", width: "100%", height: "100%", pointerEvents: "none", fontFamily: "system-ui, Segoe UI, Roboto, sans-serif", fontSize: 12 }, children: /* @__PURE__ */ jsx27("div", { style: { position: "absolute", left: left - margin.left, top: top - margin.top, transform: `translate(${align === "right" ? "-100%" : "0"}, ${position.startsWith("top") ? "0" : "-100%"})`, background: bg, border: "1px solid #e5e7eb", borderRadius: 6, padding: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }, children: items.map((it, i) => /* @__PURE__ */ jsxs7("div", { style: { display: "flex", alignItems: "center", gap: 8, margin: "4px 0", whiteSpace: "nowrap" }, children: [
    it.marker ?? /* @__PURE__ */ jsx27("svg", { width: 18, height: 10, style: { flex: "0 0 auto" }, children: /* @__PURE__ */ jsx27("line", { x1: 0, y1: 5, x2: 18, y2: 5, stroke: it.color ?? "#111", strokeWidth: 2, strokeDasharray: it.strokeDasharray }) }),
    /* @__PURE__ */ jsx27("div", { style: { pointerEvents: "auto" }, children: it.label })
  ] }, i)) }) }) });
}

// src/Title2D.tsx
import { jsx as jsx28 } from "react/jsx-runtime";
function Title2D({ children, align = "center", offsetY = 2 }) {
  const { margin, innerWidth } = usePlot();
  const x = align === "left" ? margin.left + 4 : align === "right" ? margin.left + innerWidth - 4 : margin.left + innerWidth / 2;
  const transform = align === "left" ? "translate(0, 0)" : align === "right" ? "translate(-100%, 0)" : "translate(-50%, 0)";
  return /* @__PURE__ */ jsx28("foreignObject", { x: margin.left, y: 0, width: innerWidth, height: margin.top, children: /* @__PURE__ */ jsx28("div", { style: { position: "relative", width: "100%", height: "100%", pointerEvents: "none", fontFamily: "system-ui, Segoe UI, Roboto, sans-serif" }, children: /* @__PURE__ */ jsx28("div", { style: { position: "absolute", left: x - margin.left, top: offsetY, transform, fontSize: 14, fontWeight: 600 }, children }) }) });
}

// src/LinearGradient2D.tsx
import React14 from "react";
import { jsx as jsx29, jsxs as jsxs8 } from "react/jsx-runtime";
function LinearGradient2D({ stops, x1, y1, x2, y2, x, y, width, height, opacity = 1, children, overlay, space = "world", anchor = "mask", reveal = "fill" }) {
  const { margin, innerWidth, innerHeight, xRange, yRange, worldToScreen, clipPathId } = usePlot();
  const idBase = React14.useId ? React14.useId() : Math.random().toString(36).slice(2);
  const gradId = `lg-${idBase}`;
  const maskId = `lgm-${idBase}`;
  const measureRef = React14.useRef(null);
  const [bbox, setBbox] = React14.useState(null);
  React14.useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    try {
      const b = el.getBBox();
      if (isFinite(b.x) && isFinite(b.y) && isFinite(b.width) && isFinite(b.height)) {
        setBbox({ x: b.x, y: b.y, width: b.width, height: b.height });
      }
    } catch {
    }
  }, [children, xRange[0], xRange[1], yRange[0], yRange[1]]);
  let sx = margin.left, sy = margin.top, sw = innerWidth, sh = innerHeight;
  if (typeof x === "number" && typeof y === "number" && typeof width === "number" && typeof height === "number") {
    const p0 = worldToScreen(x, y);
    const p1 = worldToScreen(x + width, y + height);
    sx = Math.min(p0.x, p1.x);
    sy = Math.min(p0.y, p1.y);
    sw = Math.abs(p1.x - p0.x);
    sh = Math.abs(p1.y - p0.y);
  } else if (anchor === "mask" && bbox) {
    sx = bbox.x;
    sy = bbox.y;
    sw = bbox.width;
    sh = bbox.height;
  } else if (space === "world") {
    const p0 = worldToScreen(xRange[0], yRange[0]);
    const p1 = worldToScreen(xRange[1], yRange[1]);
    sx = Math.min(p0.x, p1.x);
    sy = Math.min(p0.y, p1.y);
    sw = Math.abs(p1.x - p0.x);
    sh = Math.abs(p1.y - p0.y);
  }
  let gx1, gy1, gx2, gy2;
  if (anchor === "mask" && bbox && !(typeof x1 === "number" || typeof y1 === "number" || typeof x2 === "number" || typeof y2 === "number")) {
    gx1 = sx;
    gy1 = sy + sh / 2;
    gx2 = sx + sw;
    gy2 = sy + sh / 2;
  } else if (space === "world") {
    if (typeof x1 === "number" || typeof y1 === "number" || typeof x2 === "number" || typeof y2 === "number") {
      const p1 = worldToScreen(x1 ?? xRange[0], y1 ?? (yRange[0] + yRange[1]) / 2);
      const p2 = worldToScreen(x2 ?? xRange[1], y2 ?? (yRange[0] + yRange[1]) / 2);
      gx1 = p1.x;
      gy1 = p1.y;
      gx2 = p2.x;
      gy2 = p2.y;
    } else {
      const p1 = worldToScreen(xRange[0], (yRange[0] + yRange[1]) / 2);
      const p2 = worldToScreen(xRange[1], (yRange[0] + yRange[1]) / 2);
      gx1 = p1.x;
      gy1 = p1.y;
      gx2 = p2.x;
      gy2 = p2.y;
    }
  } else {
    gx1 = sx;
    gy1 = sy + sh / 2;
    gx2 = sx + sw;
    gy2 = sy + sh / 2;
  }
  function toMask(node) {
    if (!React14.isValidElement(node)) return node;
    const props = node.props || {};
    const clonedChildren = props.children ? React14.Children.map(props.children, toMask) : props.children;
    const extra = {};
    if (reveal === "fill") {
      extra.fill = "#fff";
      extra.stroke = "none";
    } else if (reveal === "stroke") {
      extra.fill = "none";
      extra.stroke = "#fff";
      if (props.strokeWidth == null) extra.strokeWidth = 2;
    } else {
      extra.fill = "#fff";
      extra.stroke = "#fff";
      if (props.strokeWidth == null) extra.strokeWidth = 1;
    }
    extra.opacity = 1;
    if (Object.prototype.hasOwnProperty.call(props, "clip")) extra.clip = false;
    return React14.cloneElement(node, extra, clonedChildren);
  }
  return /* @__PURE__ */ jsxs8("g", { children: [
    /* @__PURE__ */ jsx29("g", { ref: measureRef, style: { opacity: 0, pointerEvents: "none" }, children }),
    /* @__PURE__ */ jsxs8("defs", { children: [
      /* @__PURE__ */ jsx29("linearGradient", { id: gradId, x1: gx1, y1: gy1, x2: gx2, y2: gy2, gradientUnits: "userSpaceOnUse", children: stops.map((s, i) => /* @__PURE__ */ jsx29("stop", { offset: typeof s.offset === "number" ? String(s.offset) : s.offset, stopColor: s.color, stopOpacity: s.opacity ?? 1 }, i)) }),
      /* @__PURE__ */ jsxs8("mask", { id: maskId, maskUnits: "userSpaceOnUse", children: [
        /* @__PURE__ */ jsx29("rect", { x: sx, y: sy, width: sw, height: sh, fill: "#000" }),
        /* @__PURE__ */ jsx29("g", { children: React14.Children.map(children, toMask) })
      ] })
    ] }),
    /* @__PURE__ */ jsx29("rect", { x: sx, y: sy, width: sw, height: sh, fill: `url(#${gradId})`, mask: `url(#${maskId})`, opacity }),
    overlay ? /* @__PURE__ */ jsx29("g", { children: overlay }) : null
  ] });
}

// src/RadialGradient2D.tsx
import React15 from "react";
import { jsx as jsx30, jsxs as jsxs9 } from "react/jsx-runtime";
function makeToMask(revealMode) {
  function toMask(node) {
    if (!React15.isValidElement(node)) return node;
    const props = node.props || {};
    const clonedChildren = props.children ? React15.Children.map(props.children, toMask) : props.children;
    const extra = {};
    if (revealMode === "fill") {
      extra.fill = "#fff";
      extra.stroke = "none";
    } else if (revealMode === "stroke") {
      extra.fill = "none";
      extra.stroke = "#fff";
      if (props.strokeWidth == null) extra.strokeWidth = 2;
    } else {
      extra.fill = "#fff";
      extra.stroke = "#fff";
      if (props.strokeWidth == null) extra.strokeWidth = 1;
    }
    extra.opacity = 1;
    if (Object.prototype.hasOwnProperty.call(props, "clip")) extra.clip = false;
    return React15.cloneElement(node, extra, clonedChildren);
  }
  return toMask;
}
function RadialGradient2D({ stops, cx, cy, r, fx, fy, x, y, width, height, opacity = 1, children, overlay, space = "world", anchor = "mask", reveal = "fill" }) {
  const { margin, innerWidth, innerHeight, xRange, yRange, worldToScreen, clipPathId } = usePlot();
  const idBase = React15.useId ? React15.useId() : Math.random().toString(36).slice(2);
  const gradId = `rg-${idBase}`;
  const maskId = `rgm-${idBase}`;
  const measureRef = React15.useRef(null);
  const [bbox, setBbox] = React15.useState(null);
  React15.useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    try {
      const b = el.getBBox();
      if (isFinite(b.x) && isFinite(b.y) && isFinite(b.width) && isFinite(b.height)) {
        setBbox({ x: b.x, y: b.y, width: b.width, height: b.height });
      }
    } catch {
    }
  }, [children, xRange[0], xRange[1], yRange[0], yRange[1]]);
  let sx = margin.left, sy = margin.top, sw = innerWidth, sh = innerHeight;
  if (typeof x === "number" && typeof y === "number" && typeof width === "number" && typeof height === "number") {
    const p0 = worldToScreen(x, y);
    const p1 = worldToScreen(x + width, y + height);
    sx = Math.min(p0.x, p1.x);
    sy = Math.min(p0.y, p1.y);
    sw = Math.abs(p1.x - p0.x);
    sh = Math.abs(p1.y - p0.y);
  } else if (anchor === "mask" && bbox) {
    sx = bbox.x;
    sy = bbox.y;
    sw = bbox.width;
    sh = bbox.height;
  } else if (space === "world") {
    const p0 = worldToScreen(xRange[0], yRange[0]);
    const p1 = worldToScreen(xRange[1], yRange[1]);
    sx = Math.min(p0.x, p1.x);
    sy = Math.min(p0.y, p1.y);
    sw = Math.abs(p1.x - p0.x);
    sh = Math.abs(p1.y - p0.y);
  }
  const defaultCxW = (xRange[0] + xRange[1]) / 2;
  const defaultCyW = (yRange[0] + yRange[1]) / 2;
  let cpx, cpy;
  if (anchor === "mask" && bbox && (typeof cx !== "number" && typeof cy !== "number")) {
    cpx = bbox.x + bbox.width / 2;
    cpy = bbox.y + bbox.height / 2;
  } else if (space === "world") {
    const c = worldToScreen(cx ?? defaultCxW, cy ?? defaultCyW);
    cpx = c.x;
    cpy = c.y;
  } else {
    cpx = sx + sw / 2;
    cpy = sy + sh / 2;
  }
  let rPx;
  if (typeof r === "number") {
    if (space === "world") {
      const p0 = worldToScreen(cx ?? defaultCxW, cy ?? defaultCyW);
      const p1 = worldToScreen((cx ?? defaultCxW) + r, cy ?? defaultCyW);
      rPx = Math.abs(p1.x - p0.x);
    } else {
      rPx = r;
    }
  } else if (anchor === "mask" && bbox) {
    rPx = Math.min(bbox.width, bbox.height) / 2;
  } else {
    rPx = Math.min(sw, sh) / 2;
  }
  let fpx, fpy;
  if (typeof fx === "number" || typeof fy === "number") {
    if (space === "world") {
      const fp = worldToScreen(fx ?? (cx ?? defaultCxW), fy ?? (cy ?? defaultCyW));
      fpx = fp.x;
      fpy = fp.y;
    } else {
      fpx = fx ?? cpx;
      fpy = fy ?? cpy;
    }
  } else {
    fpx = cpx;
    fpy = cpy;
  }
  return /* @__PURE__ */ jsxs9("g", { clipPath: `url(#${clipPathId})`, children: [
    /* @__PURE__ */ jsx30("g", { ref: measureRef, style: { opacity: 0, pointerEvents: "none" }, children }),
    /* @__PURE__ */ jsxs9("defs", { children: [
      /* @__PURE__ */ jsx30("radialGradient", { id: gradId, cx: cpx, cy: cpy, r: rPx, fx: fpx, fy: fpy, gradientUnits: "userSpaceOnUse", children: stops.map((s, i) => /* @__PURE__ */ jsx30("stop", { offset: typeof s.offset === "number" ? String(s.offset) : s.offset, stopColor: s.color, stopOpacity: s.opacity ?? 1 }, i)) }),
      /* @__PURE__ */ jsxs9("mask", { id: maskId, maskUnits: "userSpaceOnUse", children: [
        /* @__PURE__ */ jsx30("rect", { x: sx, y: sy, width: sw, height: sh, fill: "#000" }),
        /* @__PURE__ */ jsx30("g", { children: React15.Children.map(children, makeToMask(reveal)) })
      ] })
    ] }),
    /* @__PURE__ */ jsx30("rect", { x: sx, y: sy, width: sw, height: sh, fill: `url(#${gradId})`, mask: `url(#${maskId})`, opacity }),
    overlay ? /* @__PURE__ */ jsx30("g", { children: overlay }) : null
  ] });
}

// src/Image2D.tsx
import React16 from "react";
import { jsx as jsx31, jsxs as jsxs10 } from "react/jsx-runtime";
function toMaskFactory(revealMode) {
  function toMask(node) {
    if (!React16.isValidElement(node)) return node;
    const props = node.props || {};
    const clonedChildren = props.children ? React16.Children.map(props.children, toMask) : props.children;
    const extra = {};
    if (revealMode === "fill") {
      extra.fill = "#fff";
      extra.stroke = "none";
    } else if (revealMode === "stroke") {
      extra.fill = "none";
      extra.stroke = "#fff";
      if (props.strokeWidth == null) extra.strokeWidth = 2;
    } else {
      extra.fill = "#fff";
      extra.stroke = "#fff";
      if (props.strokeWidth == null) extra.strokeWidth = 1;
    }
    extra.opacity = 1;
    if (Object.prototype.hasOwnProperty.call(props, "clip")) extra.clip = false;
    return React16.cloneElement(node, extra, clonedChildren);
  }
  return toMask;
}
function Image2D({ href, x, y, width, height, preserveAspectRatio = "xMidYMid meet", opacity = 1, children, overlay, crossOrigin, space = "world", anchor = "mask", imageX, imageY, imageWidth, imageHeight, reveal = "fill" }) {
  const { margin, innerWidth, innerHeight, xRange, yRange, worldToScreen, clipPathId } = usePlot();
  const idBase = React16.useId ? React16.useId() : Math.random().toString(36).slice(2);
  const maskId = `imm-${idBase}`;
  const measureRef = React16.useRef(null);
  const [bbox, setBbox] = React16.useState(null);
  React16.useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    try {
      const b = el.getBBox();
      if (isFinite(b.x) && isFinite(b.y) && isFinite(b.width) && isFinite(b.height)) setBbox({ x: b.x, y: b.y, width: b.width, height: b.height });
    } catch {
    }
  }, [children, xRange[0], xRange[1], yRange[0], yRange[1]]);
  let sx = margin.left, sy = margin.top, sw = innerWidth, sh = innerHeight;
  if (typeof x === "number" && typeof y === "number" && typeof width === "number" && typeof height === "number") {
    const p0 = worldToScreen(x, y);
    const p1 = worldToScreen(x + width, y + height);
    sx = Math.min(p0.x, p1.x);
    sy = Math.min(p0.y, p1.y);
    sw = Math.abs(p1.x - p0.x);
    sh = Math.abs(p1.y - p0.y);
  } else if (anchor === "mask" && bbox) {
    sx = bbox.x;
    sy = bbox.y;
    sw = bbox.width;
    sh = bbox.height;
  } else if (space === "world") {
    const p0 = worldToScreen(xRange[0], yRange[0]);
    const p1 = worldToScreen(xRange[1], yRange[1]);
    sx = Math.min(p0.x, p1.x);
    sy = Math.min(p0.y, p1.y);
    sw = Math.abs(p1.x - p0.x);
    sh = Math.abs(p1.y - p0.y);
  }
  let ix = sx, iy = sy, iw = sw, ih = sh;
  const defaultXW = (xRange[0] + xRange[1]) / 2;
  const defaultYW = (yRange[0] + yRange[1]) / 2;
  if (typeof imageX === "number" || typeof imageY === "number") {
    if (space === "world") {
      const p = worldToScreen(imageX ?? defaultXW, imageY ?? defaultYW);
      if (typeof imageX === "number") ix = p.x;
      if (typeof imageY === "number") iy = p.y;
    } else {
      if (typeof imageX === "number") ix = imageX;
      if (typeof imageY === "number") iy = imageY;
    }
  }
  if (typeof imageWidth === "number") {
    if (space === "world") {
      const p0 = worldToScreen(imageX ?? defaultXW, defaultYW);
      const p1 = worldToScreen((imageX ?? defaultXW) + imageWidth, defaultYW);
      iw = Math.abs(p1.x - p0.x);
    } else {
      iw = imageWidth;
    }
  }
  if (typeof imageHeight === "number") {
    if (space === "world") {
      const q0 = worldToScreen(defaultXW, imageY ?? defaultYW);
      const q1 = worldToScreen(defaultXW, (imageY ?? defaultYW) + imageHeight);
      ih = Math.abs(q1.y - q0.y);
    } else {
      ih = imageHeight;
    }
  }
  return /* @__PURE__ */ jsxs10("g", { clipPath: `url(#${clipPathId})`, children: [
    /* @__PURE__ */ jsx31("g", { ref: measureRef, style: { opacity: 0, pointerEvents: "none" }, children }),
    /* @__PURE__ */ jsx31("defs", { children: /* @__PURE__ */ jsxs10("mask", { id: maskId, maskUnits: "userSpaceOnUse", children: [
      /* @__PURE__ */ jsx31("rect", { x: sx, y: sy, width: sw, height: sh, fill: "#000" }),
      /* @__PURE__ */ jsx31("g", { children: React16.Children.map(children, toMaskFactory(reveal)) })
    ] }) }),
    /* @__PURE__ */ jsx31("image", { href, x: ix, y: iy, width: iw, height: ih, preserveAspectRatio, opacity, mask: `url(#${maskId})`, crossOrigin }),
    overlay ? /* @__PURE__ */ jsx31("g", { children: overlay }) : null
  ] });
}

// src/Plot3D.tsx
import React18 from "react";

// src/threeContext.ts
import React17 from "react";
var ThreeContext = React17.createContext({
  THREE: null,
  scene: null,
  camera: null,
  renderer: null,
  htmlOverlay: null
});
var useThree = () => React17.useContext(ThreeContext);

// src/Plot3D.tsx
import { jsx as jsx32, jsxs as jsxs11 } from "react/jsx-runtime";
function Plot3D({
  width,
  height,
  background = "#fff",
  camera,
  orbitControls = true,
  children,
  className,
  style
}) {
  var _a, _b, _c, _d, _e, _f;
  const containerRef = React18.useRef(null);
  const [three, setThree] = React18.useState(null);
  const [scene, setScene] = React18.useState(null);
  const [camera3d, setCamera3d] = React18.useState(null);
  const [renderer3d, setRenderer3d] = React18.useState(null);
  const controlsRef = React18.useRef(null);
  const rafRef = React18.useRef(null);
  const [overlayEl, setOverlayEl] = React18.useState(null);
  React18.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
        const { OrbitControls } = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js");
        if (!mounted) return;
        setThree({ ...THREE, OrbitControls });
        const _scene = new THREE.Scene();
        _scene.background = new THREE.Color(background);
        setScene(_scene);
        const fov = (camera == null ? void 0 : camera.fov) ?? 50;
        const near = (camera == null ? void 0 : camera.near) ?? 0.1;
        const far = (camera == null ? void 0 : camera.far) ?? 1e3;
        const cam = new THREE.PerspectiveCamera(fov, width / height, near, far);
        const [cx, cy, cz] = (camera == null ? void 0 : camera.position) ?? [-3, 3, 6];
        cam.position.set(cx, cy, cz);
        const look = (camera == null ? void 0 : camera.lookAt) ?? [0, 0, 0];
        cam.lookAt(...look);
        setCamera3d(cam);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        setRenderer3d(renderer);
        const container = containerRef.current;
        container.innerHTML = "";
        container.appendChild(renderer.domElement);
        const ambient = new THREE.AmbientLight(16777215, 0.6);
        _scene.add(ambient);
        const dir = new THREE.DirectionalLight(16777215, 0.8);
        dir.position.set(5, 8, 4);
        _scene.add(dir);
        if (orbitControls) {
          const controls = new OrbitControls(cam, renderer.domElement);
          controls.enableDamping = true;
          controls.dampingFactor = 0.08;
          controlsRef.current = controls;
        }
        const onResize = () => {
          const w = width;
          const h = height;
          renderer.setSize(w, h);
          cam.aspect = w / h;
          cam.updateProjectionMatrix();
        };
        onResize();
        const animate = () => {
          var _a2, _b2;
          rafRef.current = requestAnimationFrame(animate);
          (_b2 = (_a2 = controlsRef.current) == null ? void 0 : _a2.update) == null ? void 0 : _b2.call(_a2);
          renderer.render(_scene, cam);
        };
        animate();
      } catch (err) {
        console.error("Failed to load THREE:", err);
      }
    })();
    return () => {
      var _a2, _b2, _c2;
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try {
        (_b2 = (_a2 = controlsRef.current) == null ? void 0 : _a2.dispose) == null ? void 0 : _b2.call(_a2);
      } catch {
      }
      try {
        (_c2 = renderer3d == null ? void 0 : renderer3d.dispose) == null ? void 0 : _c2.call(renderer3d);
      } catch {
      }
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [width, height, background, camera == null ? void 0 : camera.fov, camera == null ? void 0 : camera.near, camera == null ? void 0 : camera.far, (_a = camera == null ? void 0 : camera.position) == null ? void 0 : _a[0], (_b = camera == null ? void 0 : camera.position) == null ? void 0 : _b[1], (_c = camera == null ? void 0 : camera.position) == null ? void 0 : _c[2], (_d = camera == null ? void 0 : camera.lookAt) == null ? void 0 : _d[0], (_e = camera == null ? void 0 : camera.lookAt) == null ? void 0 : _e[1], (_f = camera == null ? void 0 : camera.lookAt) == null ? void 0 : _f[2], orbitControls]);
  const ctxValue = React18.useMemo(() => ({
    THREE: three,
    scene,
    camera: camera3d,
    renderer: renderer3d,
    htmlOverlay: overlayEl
  }), [three, scene, camera3d, renderer3d, overlayEl]);
  return /* @__PURE__ */ jsxs11("div", { className, style: { position: "relative", width, height, overscrollBehavior: "contain", touchAction: "none", ...style }, children: [
    /* @__PURE__ */ jsx32("div", { ref: containerRef, style: { position: "absolute", inset: 0 } }),
    /* @__PURE__ */ jsx32(ThreeContext.Provider, { value: ctxValue, children }),
    /* @__PURE__ */ jsx32("div", { ref: setOverlayEl, style: { position: "absolute", inset: 0, pointerEvents: "none", fontFamily: "system-ui, Segoe UI, Roboto, sans-serif", fontSize: 12, color: "#222" } })
  ] });
}

// src/Axes3D.tsx
import React20 from "react";

// src/threeParent.ts
import React19 from "react";
var ThreeParentContext = React19.createContext(null);
var useThreeParent = () => React19.useContext(ThreeParentContext);

// src/Axes3D.tsx
function Axes3D({ size = 2, thickness = 0, arrows = true, negativeArrows = false }) {
  const { THREE, scene } = useThree();
  const parent = useThreeParent();
  React20.useEffect(() => {
    if (!THREE || !scene) return;
    const target = parent ?? scene;
    if (!thickness || thickness <= 0) {
      const group2 = new THREE.Group();
      const mkLine = (axis, color) => {
        const mat = new THREE.LineBasicMaterial({ color });
        const pos = new Float32Array([
          axis === "x" ? -size : 0,
          axis === "y" ? -size : 0,
          axis === "z" ? -size : 0,
          axis === "x" ? size : 0,
          axis === "y" ? size : 0,
          axis === "z" ? size : 0
        ]);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        const line = new THREE.Line(geo, mat);
        group2.add(line);
        const cones = [];
        if (arrows) {
          const h = Math.max(size * 0.24, 0.12);
          const r = Math.max(size * 0.06, 0.04);
          const coneGeo = new THREE.ConeGeometry(r, h, 16);
          const coneMat = new THREE.MeshStandardMaterial({ color });
          const coneP = new THREE.Mesh(coneGeo, coneMat);
          if (axis === "x") {
            coneP.rotation.z = -Math.PI / 2;
            coneP.position.set(size, 0, 0);
          }
          if (axis === "y") {
            coneP.position.set(0, size, 0);
          }
          if (axis === "z") {
            coneP.rotation.x = Math.PI / 2;
            coneP.position.set(0, 0, size);
          }
          group2.add(coneP);
          cones.push(coneP);
          if (negativeArrows) {
            const coneN = new THREE.Mesh(coneGeo.clone(), coneMat);
            if (axis === "x") {
              coneN.rotation.z = Math.PI / 2;
              coneN.position.set(-size, 0, 0);
            }
            if (axis === "y") {
              coneN.rotation.x = Math.PI;
              coneN.position.set(0, -size, 0);
            }
            if (axis === "z") {
              coneN.rotation.x = -Math.PI / 2;
              coneN.position.set(0, 0, -size);
            }
            group2.add(coneN);
            cones.push(coneN);
          }
        }
        return () => {
          geo.dispose();
          mat.dispose();
          cones.forEach((c) => {
            var _a, _b, _c, _d;
            (_b = (_a = c.geometry).dispose) == null ? void 0 : _b.call(_a);
            (_d = (_c = c.material).dispose) == null ? void 0 : _d.call(_c);
          });
        };
      };
      const cleanups2 = [];
      target.add(group2);
      cleanups2.push(mkLine("x", 16711680));
      cleanups2.push(mkLine("y", 65280));
      cleanups2.push(mkLine("z", 255));
      return () => {
        target.remove(group2);
        cleanups2.forEach((fn) => {
          try {
            fn();
          } catch {
          }
        });
      };
    }
    const group = new THREE.Group();
    const mkAxis = (axis, color) => {
      const len = size * 2;
      const cylGeo = new THREE.CylinderGeometry(thickness, thickness, len, 16);
      const mat = new THREE.MeshStandardMaterial({ color });
      const cyl = new THREE.Mesh(cylGeo, mat);
      if (axis === "x") {
        cyl.rotation.z = Math.PI / 2;
      } else if (axis === "y") {
      } else {
        cyl.rotation.x = Math.PI / 2;
      }
      group.add(cyl);
      const cones = [];
      if (arrows) {
        const h = Math.max(size * 0.24, thickness * 6);
        const r = Math.max(thickness * 2, size * 0.06);
        const coneGeo = new THREE.ConeGeometry(r, h, 16);
        const coneMat = new THREE.MeshStandardMaterial({ color });
        const coneP = new THREE.Mesh(coneGeo, coneMat);
        if (axis === "x") {
          coneP.rotation.z = -Math.PI / 2;
          coneP.position.set(size, 0, 0);
        }
        if (axis === "y") {
          coneP.position.set(0, size, 0);
        }
        if (axis === "z") {
          coneP.rotation.x = Math.PI / 2;
          coneP.position.set(0, 0, size);
        }
        group.add(coneP);
        cones.push(coneP);
        if (negativeArrows) {
          const coneN = new THREE.Mesh(coneGeo.clone(), coneMat);
          if (axis === "x") {
            coneN.rotation.z = Math.PI / 2;
            coneN.position.set(-size, 0, 0);
          }
          if (axis === "y") {
            coneN.rotation.x = Math.PI;
            coneN.position.set(0, -size, 0);
          }
          if (axis === "z") {
            coneN.rotation.x = -Math.PI / 2;
            coneN.position.set(0, 0, -size);
          }
          group.add(coneN);
          cones.push(coneN);
        }
      }
      return () => {
        cylGeo.dispose();
        mat.dispose();
        cones.forEach((co) => {
          var _a, _b, _c, _d;
          (_b = (_a = co.geometry).dispose) == null ? void 0 : _b.call(_a);
          (_d = (_c = co.material).dispose) == null ? void 0 : _d.call(_c);
        });
      };
    };
    const cleanups = [];
    target.add(group);
    cleanups.push(mkAxis("x", 16711680));
    cleanups.push(mkAxis("y", 65280));
    cleanups.push(mkAxis("z", 255));
    return () => {
      target.remove(group);
      cleanups.forEach((fn) => {
        try {
          fn();
        } catch {
        }
      });
    };
  }, [THREE, scene, parent, size, thickness, arrows, negativeArrows]);
  return null;
}

// src/Grid3D.tsx
import React21 from "react";
function Grid3D({ size = 10, divisions = 10, color1 = 13421772, color2 = 15067115 }) {
  const { THREE, scene } = useThree();
  const parent = useThreeParent();
  React21.useEffect(() => {
    if (!THREE || !scene) return;
    const grid = new THREE.GridHelper(size, divisions, color1, color2);
    (parent ?? scene).add(grid);
    return () => {
      (parent ?? scene).remove(grid);
    };
  }, [THREE, scene, parent, size, divisions, color1, color2]);
  return null;
}

// src/Box3D.tsx
import React22 from "react";
function Box3D({ size = [1, 1, 1], position = [0, 0, 0], color = 15680580, wireframe = false }) {
  const { THREE, scene } = useThree();
  const parent = useThreeParent();
  const meshRef = React22.useRef(null);
  React22.useEffect(() => {
    if (!THREE || !scene) return;
    const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const mat = new THREE.MeshStandardMaterial({ color, wireframe });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...position);
    (parent ?? scene).add(mesh);
    meshRef.current = mesh;
    return () => {
      (parent ?? scene).remove(mesh);
      geo.dispose();
      mat.dispose();
    };
  }, [THREE, scene, parent]);
  React22.useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.position.set(...position);
  }, [position == null ? void 0 : position[0], position == null ? void 0 : position[1], position == null ? void 0 : position[2]]);
  React22.useEffect(() => {
    var _a;
    if (!meshRef.current || !THREE) return;
    const old = meshRef.current.geometry;
    const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
    meshRef.current.geometry = geo;
    (_a = old == null ? void 0 : old.dispose) == null ? void 0 : _a.call(old);
  }, [size == null ? void 0 : size[0], size == null ? void 0 : size[1], size == null ? void 0 : size[2]]);
  React22.useEffect(() => {
    if (!meshRef.current || !THREE) return;
    meshRef.current.material.color = new THREE.Color(color);
    meshRef.current.material.wireframe = wireframe;
  }, [color, wireframe, THREE]);
  return null;
}

// src/Sphere3D.tsx
import React23 from "react";
function Sphere3D({ radius = 0.6, widthSegments = 32, heightSegments = 16, position = [0, 0, 0], color = 1096065, wireframe = false }) {
  const { THREE, scene } = useThree();
  const parent = useThreeParent();
  const meshRef = React23.useRef(null);
  React23.useEffect(() => {
    if (!THREE || !scene) return;
    const geo = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    const mat = new THREE.MeshStandardMaterial({ color, wireframe });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...position);
    (parent ?? scene).add(mesh);
    meshRef.current = mesh;
    return () => {
      (parent ?? scene).remove(mesh);
      geo.dispose();
      mat.dispose();
    };
  }, [THREE, scene, parent]);
  React23.useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.position.set(...position);
  }, [position == null ? void 0 : position[0], position == null ? void 0 : position[1], position == null ? void 0 : position[2]]);
  React23.useEffect(() => {
    var _a;
    if (!meshRef.current || !THREE) return;
    const old = meshRef.current.geometry;
    const geo = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    meshRef.current.geometry = geo;
    (_a = old == null ? void 0 : old.dispose) == null ? void 0 : _a.call(old);
  }, [radius, widthSegments, heightSegments]);
  React23.useEffect(() => {
    if (!meshRef.current || !THREE) return;
    meshRef.current.material.color = new THREE.Color(color);
    meshRef.current.material.wireframe = wireframe;
  }, [color, wireframe, THREE]);
  return null;
}

// src/Label3D.tsx
import React24 from "react";
import { jsx as jsx33 } from "react/jsx-runtime";
function Label3D({ position, children, align = "left", vAlign = "top", dx = 0, dy = 0, className, style }) {
  const { THREE, camera, renderer, htmlOverlay } = useThree();
  const elRef = React24.useRef(null);
  React24.useEffect(() => {
    if (!THREE || !camera || !renderer || !htmlOverlay || !elRef.current) return;
    const el = elRef.current;
    const v = new THREE.Vector3();
    let stopped = false;
    const update = () => {
      if (stopped) return;
      try {
        v.set(position[0], position[1], position[2]);
        v.project(camera);
        const x = (v.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
        const y = (-v.y * 0.5 + 0.5) * renderer.domElement.clientHeight;
        const ax = align === "center" ? -50 : align === "right" ? -100 : 0;
        const ay = vAlign === "middle" ? -50 : vAlign === "bottom" ? -100 : 0;
        el.style.transform = `translate(${Math.round(x + dx)}px, ${Math.round(y + dy)}px) translate(${ax}%, ${ay}%)`;
        el.style.display = v.z < 1 ? "block" : "none";
      } catch {
      }
      requestAnimationFrame(update);
    };
    const id = requestAnimationFrame(update);
    return () => {
      stopped = true;
      cancelAnimationFrame(id);
    };
  }, [THREE, camera, renderer, htmlOverlay, position == null ? void 0 : position[0], position == null ? void 0 : position[1], position == null ? void 0 : position[2], align, vAlign, dx, dy]);
  if (!htmlOverlay) return null;
  return /* @__PURE__ */ jsx33("div", { ref: elRef, className, style: { position: "absolute", pointerEvents: "none", ...style }, children });
}

// src/Legend3D.tsx
import { jsx as jsx34, jsxs as jsxs12 } from "react/jsx-runtime";
function Legend3D({ items, position = "top-right", bg = "rgba(255,255,255,0.92)", padding = 8 }) {
  const { htmlOverlay } = useThree();
  if (!htmlOverlay) return null;
  const isTR = position === "top-right";
  const isBR = position === "bottom-right";
  const x = isTR || isBR ? "right" : "left";
  const y = position.startsWith("top") ? "top" : "bottom";
  const style = {
    position: "absolute",
    [x]: padding,
    [y]: padding,
    transform: void 0,
    background: bg,
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    padding: 8,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    pointerEvents: "none",
    fontSize: 12
  };
  return /* @__PURE__ */ jsx34("div", { style, children: items.map((it, i) => /* @__PURE__ */ jsxs12("div", { style: { display: "flex", alignItems: "center", gap: 8, margin: "4px 0", whiteSpace: "nowrap" }, children: [
    it.marker ?? /* @__PURE__ */ jsx34("svg", { width: 18, height: 10, style: { flex: "0 0 auto" }, children: /* @__PURE__ */ jsx34("line", { x1: 0, y1: 5, x2: 18, y2: 5, stroke: it.color ?? "#111", strokeWidth: 2 }) }),
    /* @__PURE__ */ jsx34("div", { children: it.label })
  ] }, i)) });
}

// src/Torus3D.tsx
import React25 from "react";
function Torus3D({ radius = 1, tube = 0.3, radialSegments = 16, tubularSegments = 48, arc = Math.PI * 2, position = [0, 0, 0], rotation = [0, 0, 0], color = 9647082, wireframe = false }) {
  const { THREE, scene } = useThree();
  const parent = useThreeParent();
  const meshRef = React25.useRef(null);
  React25.useEffect(() => {
    if (!THREE || !scene) return;
    const geo = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc);
    const mat = new THREE.MeshStandardMaterial({ color, wireframe });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    (parent ?? scene).add(mesh);
    meshRef.current = mesh;
    return () => {
      (parent ?? scene).remove(mesh);
      geo.dispose();
      mat.dispose();
    };
  }, [THREE, scene]);
  React25.useEffect(() => {
    var _a;
    (_a = meshRef.current) == null ? void 0 : _a.position.set(...position);
  }, [position == null ? void 0 : position[0], position == null ? void 0 : position[1], position == null ? void 0 : position[2]]);
  React25.useEffect(() => {
    var _a;
    (_a = meshRef.current) == null ? void 0 : _a.rotation.set(...rotation);
  }, [rotation == null ? void 0 : rotation[0], rotation == null ? void 0 : rotation[1], rotation == null ? void 0 : rotation[2]]);
  React25.useEffect(() => {
    var _a;
    if (!meshRef.current || !THREE) return;
    const old = meshRef.current.geometry;
    const geo = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc);
    meshRef.current.geometry = geo;
    (_a = old == null ? void 0 : old.dispose) == null ? void 0 : _a.call(old);
  }, [radius, tube, radialSegments, tubularSegments, arc]);
  React25.useEffect(() => {
    if (!meshRef.current || !THREE) return;
    meshRef.current.material.color = new THREE.Color(color);
    meshRef.current.material.wireframe = wireframe;
  }, [color, wireframe, THREE]);
  return null;
}

// src/Cylinder3D.tsx
import React26 from "react";
function Cylinder3D({ radiusTop = 0.4, radiusBottom = 0.4, height = 1.2, radialSegments = 32, openEnded = false, position = [0, 0, 0], rotation = [0, 0, 0], color = 6583435, wireframe = false }) {
  const { THREE, scene } = useThree();
  const parent = useThreeParent();
  const meshRef = React26.useRef(null);
  React26.useEffect(() => {
    if (!THREE || !scene) return;
    const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, 1, openEnded);
    const mat = new THREE.MeshStandardMaterial({ color, wireframe });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    (parent ?? scene).add(mesh);
    meshRef.current = mesh;
    return () => {
      (parent ?? scene).remove(mesh);
      geo.dispose();
      mat.dispose();
    };
  }, [THREE, scene, parent]);
  React26.useEffect(() => {
    var _a;
    (_a = meshRef.current) == null ? void 0 : _a.position.set(...position);
  }, [position == null ? void 0 : position[0], position == null ? void 0 : position[1], position == null ? void 0 : position[2]]);
  React26.useEffect(() => {
    var _a;
    (_a = meshRef.current) == null ? void 0 : _a.rotation.set(...rotation);
  }, [rotation == null ? void 0 : rotation[0], rotation == null ? void 0 : rotation[1], rotation == null ? void 0 : rotation[2]]);
  React26.useEffect(() => {
    var _a;
    if (!meshRef.current || !THREE) return;
    const old = meshRef.current.geometry;
    meshRef.current.geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, 1, openEnded);
    (_a = old == null ? void 0 : old.dispose) == null ? void 0 : _a.call(old);
  }, [radiusTop, radiusBottom, height, radialSegments, openEnded]);
  React26.useEffect(() => {
    if (!meshRef.current || !THREE) return;
    meshRef.current.material.color = new THREE.Color(color);
    meshRef.current.material.wireframe = wireframe;
  }, [color, wireframe, THREE]);
  return null;
}

// src/Cone3D.tsx
import React27 from "react";
function Cone3D({ radius = 0.45, height = 1.2, radialSegments = 32, openEnded = false, position = [0, 0, 0], rotation = [0, 0, 0], color = 16096779, wireframe = false }) {
  const { THREE, scene } = useThree();
  const parent = useThreeParent();
  const meshRef = React27.useRef(null);
  React27.useEffect(() => {
    if (!THREE || !scene) return;
    const geo = new THREE.ConeGeometry(radius, height, radialSegments, 1, openEnded);
    const mat = new THREE.MeshStandardMaterial({ color, wireframe });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    (parent ?? scene).add(mesh);
    meshRef.current = mesh;
    return () => {
      (parent ?? scene).remove(mesh);
      geo.dispose();
      mat.dispose();
    };
  }, [THREE, scene, parent]);
  React27.useEffect(() => {
    var _a;
    (_a = meshRef.current) == null ? void 0 : _a.position.set(...position);
  }, [position == null ? void 0 : position[0], position == null ? void 0 : position[1], position == null ? void 0 : position[2]]);
  React27.useEffect(() => {
    var _a;
    (_a = meshRef.current) == null ? void 0 : _a.rotation.set(...rotation);
  }, [rotation == null ? void 0 : rotation[0], rotation == null ? void 0 : rotation[1], rotation == null ? void 0 : rotation[2]]);
  React27.useEffect(() => {
    var _a;
    if (!meshRef.current || !THREE) return;
    const old = meshRef.current.geometry;
    meshRef.current.geometry = new THREE.ConeGeometry(radius, height, radialSegments, 1, openEnded);
    (_a = old == null ? void 0 : old.dispose) == null ? void 0 : _a.call(old);
  }, [radius, height, radialSegments, openEnded]);
  React27.useEffect(() => {
    if (!meshRef.current || !THREE) return;
    meshRef.current.material.color = new THREE.Color(color);
    meshRef.current.material.wireframe = wireframe;
  }, [color, wireframe, THREE]);
  return null;
}

// src/Surface3D.tsx
import React28 from "react";
function Surface3D({ xRange, yRange, xSegments = 64, ySegments = 48, f, color = 2278750, colorMap, wireframe = false, doubleSided = true }) {
  const { THREE, scene } = useThree();
  const parent = useThreeParent();
  const meshRef = React28.useRef(null);
  const buildGeometry = React28.useCallback(() => {
    if (!THREE) return null;
    const nx = Math.max(1, xSegments);
    const ny = Math.max(1, ySegments);
    const nCols = nx + 1;
    const nRows = ny + 1;
    const positions = new Float32Array(nCols * nRows * 3);
    const colors = colorMap ? new Float32Array(nCols * nRows * 3) : null;
    let idx = 0, cidx = 0;
    for (let j = 0; j <= ny; j++) {
      const v = j / ny;
      const y = yRange[0] + v * (yRange[1] - yRange[0]);
      for (let i = 0; i <= nx; i++) {
        const u = i / nx;
        const x = xRange[0] + u * (xRange[1] - xRange[0]);
        const z = f(x, y);
        positions[idx++] = x;
        positions[idx++] = z;
        positions[idx++] = y;
        if (colors) {
          const col = new THREE.Color(colorMap(x, y, z));
          colors[cidx++] = col.r;
          colors[cidx++] = col.g;
          colors[cidx++] = col.b;
        }
      }
    }
    const indices = [];
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const a = i + j * (nx + 1);
        const b = i + 1 + j * (nx + 1);
        const c = i + 1 + (j + 1) * (nx + 1);
        const d = i + (j + 1) * (nx + 1);
        indices.push(a, b, d, b, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setIndex(indices);
    if (colors) geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [THREE, xRange == null ? void 0 : xRange[0], xRange == null ? void 0 : xRange[1], yRange == null ? void 0 : yRange[0], yRange == null ? void 0 : yRange[1], xSegments, ySegments, f, colorMap]);
  React28.useEffect(() => {
    if (!THREE || !scene) return;
    const geo = buildGeometry();
    if (!geo) return;
    const mat = new THREE.MeshStandardMaterial({ color, wireframe, vertexColors: !!colorMap, side: doubleSided ? THREE.DoubleSide : THREE.FrontSide });
    const mesh = new THREE.Mesh(geo, mat);
    (parent ?? scene).add(mesh);
    meshRef.current = mesh;
    return () => {
      (parent ?? scene).remove(mesh);
      geo.dispose();
      mat.dispose();
    };
  }, [THREE, scene, parent]);
  React28.useEffect(() => {
    var _a;
    if (!meshRef.current) return;
    const old = meshRef.current.geometry;
    const geo = buildGeometry();
    if (!geo) return;
    meshRef.current.geometry = geo;
    (_a = old == null ? void 0 : old.dispose) == null ? void 0 : _a.call(old);
  }, [buildGeometry]);
  React28.useEffect(() => {
    if (!meshRef.current || !THREE) return;
    const mat = meshRef.current.material;
    mat.color = new THREE.Color(color);
    mat.wireframe = wireframe;
    mat.vertexColors = !!colorMap;
    mat.side = doubleSided ? THREE.DoubleSide : THREE.FrontSide;
    mat.needsUpdate = true;
  }, [color, wireframe, colorMap, doubleSided, THREE]);
  return null;
}

// src/ParametricSurface3D.tsx
import React29 from "react";
function ParametricSurface3D({ uRange, vRange, uSegments = 80, vSegments = 30, f, color = 959977, colorMap, wireframe = false, doubleSided = true }) {
  const { THREE, scene } = useThree();
  const parent = useThreeParent();
  const meshRef = React29.useRef(null);
  const buildGeometry = React29.useCallback(() => {
    if (!THREE) return null;
    const nu = Math.max(1, uSegments);
    const nv = Math.max(1, vSegments);
    const positions = new Float32Array((nu + 1) * (nv + 1) * 3);
    const colors = colorMap ? new Float32Array((nu + 1) * (nv + 1) * 3) : null;
    let idx = 0, cidx = 0;
    for (let j = 0; j <= nv; j++) {
      const v = vRange[0] + j / nv * (vRange[1] - vRange[0]);
      for (let i = 0; i <= nu; i++) {
        const u = uRange[0] + i / nu * (uRange[1] - uRange[0]);
        const [x, y, z] = f(u, v);
        positions[idx++] = x;
        positions[idx++] = y;
        positions[idx++] = z;
        if (colors) {
          const col = new THREE.Color(colorMap(u, v, x, y, z));
          colors[cidx++] = col.r;
          colors[cidx++] = col.g;
          colors[cidx++] = col.b;
        }
      }
    }
    const indices = [];
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const a = i + j * (nu + 1);
        const b = i + 1 + j * (nu + 1);
        const c = i + 1 + (j + 1) * (nu + 1);
        const d = i + (j + 1) * (nu + 1);
        indices.push(a, b, d, b, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    if (colors) geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [THREE, uRange == null ? void 0 : uRange[0], uRange == null ? void 0 : uRange[1], vRange == null ? void 0 : vRange[0], vRange == null ? void 0 : vRange[1], uSegments, vSegments, f, colorMap]);
  React29.useEffect(() => {
    if (!THREE || !scene) return;
    const geo = buildGeometry();
    if (!geo) return;
    const mat = new THREE.MeshStandardMaterial({ color, wireframe, vertexColors: !!colorMap, side: doubleSided ? THREE.DoubleSide : THREE.FrontSide });
    const mesh = new THREE.Mesh(geo, mat);
    (parent ?? scene).add(mesh);
    meshRef.current = mesh;
    return () => {
      (parent ?? scene).remove(mesh);
      geo.dispose();
      mat.dispose();
    };
  }, [THREE, scene, parent]);
  React29.useEffect(() => {
    var _a;
    if (!meshRef.current) return;
    const old = meshRef.current.geometry;
    const geo = buildGeometry();
    if (!geo) return;
    meshRef.current.geometry = geo;
    (_a = old == null ? void 0 : old.dispose) == null ? void 0 : _a.call(old);
  }, [buildGeometry]);
  React29.useEffect(() => {
    if (!meshRef.current || !THREE) return;
    const mat = meshRef.current.material;
    mat.color = new THREE.Color(color);
    mat.wireframe = wireframe;
    mat.vertexColors = !!colorMap;
    mat.side = doubleSided ? THREE.DoubleSide : THREE.FrontSide;
    mat.needsUpdate = true;
  }, [color, wireframe, colorMap, doubleSided, THREE]);
  return null;
}

// src/Scatter3D.tsx
import React30 from "react";
function Scatter3D({ points, color = 3900150, colors, colorMap, size = 6, opacity = 1 }) {
  const { THREE, scene } = useThree();
  const parent = useThreeParent();
  const ptsRef = React30.useRef(null);
  const buildGeometry = React30.useCallback(() => {
    if (!THREE) return null;
    const n = (points == null ? void 0 : points.length) ?? 0;
    const pos = new Float32Array(n * 3);
    const useVertexColors = !!(colors == null ? void 0 : colors.length) || !!colorMap;
    const col = useVertexColors ? new Float32Array(n * 3) : null;
    for (let i = 0; i < n; i++) {
      const [x, y, z] = points[i];
      const j = i * 3;
      pos[j] = x;
      pos[j + 1] = y;
      pos[j + 2] = z;
      if (col) {
        const c = new THREE.Color(
          colors && colors[i] !== void 0 ? colors[i] : colorMap ? colorMap(x, y, z, i) : color
        );
        col[j] = c.r;
        col[j + 1] = c.g;
        col[j + 2] = c.b;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    if (col) geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return { geo, vertexColors: !!col };
  }, [THREE, points, colors, colorMap, color]);
  React30.useEffect(() => {
    if (!THREE || !scene) return;
    const built = buildGeometry();
    if (!built) return;
    const mat = new THREE.PointsMaterial({
      color: (colors == null ? void 0 : colors.length) || colorMap ? 16777215 : color,
      vertexColors: !!((colors == null ? void 0 : colors.length) || colorMap),
      size,
      sizeAttenuation: false,
      opacity,
      transparent: opacity < 1
    });
    const pointsObj = new THREE.Points(built.geo, mat);
    (parent ?? scene).add(pointsObj);
    ptsRef.current = pointsObj;
    return () => {
      (parent ?? scene).remove(pointsObj);
      built.geo.dispose();
      mat.dispose();
    };
  }, [THREE, scene, parent]);
  React30.useEffect(() => {
    var _a;
    const obj = ptsRef.current;
    if (!obj) return;
    const old = obj.geometry;
    const built = buildGeometry();
    if (!built) return;
    obj.geometry = built.geo;
    obj.material.vertexColors = built.vertexColors;
    (_a = old == null ? void 0 : old.dispose) == null ? void 0 : _a.call(old);
  }, [buildGeometry]);
  React30.useEffect(() => {
    const obj = ptsRef.current;
    if (!obj || !THREE) return;
    obj.material.size = size;
    obj.material.opacity = opacity;
    obj.material.transparent = opacity < 1;
    if (!((colors == null ? void 0 : colors.length) || colorMap)) {
      obj.material.color = new THREE.Color(color);
    }
    obj.material.needsUpdate = true;
  }, [size, opacity, color, colors == null ? void 0 : colors.length, !!colorMap, THREE]);
  return null;
}

// src/useAnimation.ts
import React31 from "react";
function useAnimation(opts = {}) {
  const { autoplay = false, speed: initSpeed = 1, duration, loop = Boolean(opts.duration), onTick } = opts;
  const [t, setT] = React31.useState(0);
  const [dt, setDt] = React31.useState(0);
  const [playing, setPlaying] = React31.useState(false);
  const speedRef = React31.useRef(initSpeed);
  const rafRef = React31.useRef(null);
  const lastTsRef = React31.useRef(null);
  const tRef = React31.useRef(0);
  React31.useEffect(() => {
    tRef.current = t;
  }, [t]);
  const step = React31.useCallback((now) => {
    const last = lastTsRef.current ?? now;
    const rawDt = (now - last) / 1e3;
    lastTsRef.current = now;
    const scaledDt = rawDt * speedRef.current;
    let newT = tRef.current + scaledDt;
    if (duration && loop) {
      const dur = Math.max(1e-9, duration);
      newT = (newT % dur + dur) % dur;
    }
    tRef.current = newT;
    setT(newT);
    setDt(scaledDt);
    onTick == null ? void 0 : onTick(newT, scaledDt);
    rafRef.current = requestAnimationFrame(step);
  }, [duration, loop, onTick]);
  const play = React31.useCallback(() => {
    if (rafRef.current != null) return;
    setPlaying(true);
    lastTsRef.current = null;
    rafRef.current = requestAnimationFrame(step);
  }, [step]);
  const stop = React31.useCallback(() => {
    setPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = null;
  }, []);
  const toggle = React31.useCallback(() => {
    if (rafRef.current != null) {
      stop();
    } else {
      play();
    }
  }, [play, stop]);
  const reset = React31.useCallback(() => setT(0), []);
  const setTime = React31.useCallback((time) => {
    tRef.current = time;
    setT(time);
  }, []);
  const setSpeed = React31.useCallback((s) => {
    speedRef.current = s;
  }, []);
  React31.useEffect(() => {
    if (autoplay) {
      play();
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [autoplay, play]);
  return { t, dt, playing, speed: speedRef.current, play, stop, toggle, reset, setTime, setSpeed };
}

// src/Group3D.tsx
import React32 from "react";
import { jsx as jsx35 } from "react/jsx-runtime";
function Group3D({ children, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] }) {
  const { THREE, scene } = useThree();
  const parent = useThreeParent();
  const groupRef = React32.useRef(null);
  const [ready, setReady] = React32.useState(false);
  React32.useEffect(() => {
    if (!THREE || !scene) return;
    const g = new THREE.Group();
    g.position.set(...position);
    g.rotation.set(...rotation);
    g.scale.set(...scale);
    (parent ?? scene).add(g);
    groupRef.current = g;
    setReady(true);
    return () => {
      (parent ?? scene).remove(g);
    };
  }, [THREE, scene, parent]);
  React32.useEffect(() => {
    var _a;
    (_a = groupRef.current) == null ? void 0 : _a.position.set(...position);
  }, [position == null ? void 0 : position[0], position == null ? void 0 : position[1], position == null ? void 0 : position[2]]);
  React32.useEffect(() => {
    var _a;
    (_a = groupRef.current) == null ? void 0 : _a.rotation.set(...rotation);
  }, [rotation == null ? void 0 : rotation[0], rotation == null ? void 0 : rotation[1], rotation == null ? void 0 : rotation[2]]);
  React32.useEffect(() => {
    var _a;
    (_a = groupRef.current) == null ? void 0 : _a.scale.set(...scale);
  }, [scale == null ? void 0 : scale[0], scale == null ? void 0 : scale[1], scale == null ? void 0 : scale[2]]);
  if (!groupRef.current || !ready) return null;
  return /* @__PURE__ */ jsx35(ThreeParentContext.Provider, { value: groupRef.current, children });
}

// src/easing.ts
var easing = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutSine: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
};
function getEasing(fn) {
  if (!fn) return easing.linear;
  if (typeof fn === "function") return fn;
  return easing[fn] ?? easing.linear;
}

// src/useTween.ts
import { useCallback, useEffect, useRef, useState } from "react";
function useTween(options = {}) {
  const {
    duration = 1e3,
    delay = 0,
    easing: easingIn = "linear",
    autoplay = false,
    loop = false,
    yoyo = false,
    onUpdate,
    onComplete
  } = options;
  const ease = getEasing(easingIn);
  const rafRef = useRef(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const delayDoneRef = useRef(false);
  const dirRef = useRef(1);
  const rawRef = useRef(0);
  const [t, setT] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const step = useCallback(
    (now) => {
      if (!delayDoneRef.current) {
        if (startTimeRef.current === null) startTimeRef.current = now;
        if (now - startTimeRef.current < delay) {
          rafRef.current = requestAnimationFrame(step);
          return;
        }
        delayDoneRef.current = true;
        startTimeRef.current = now;
      }
      const elapsed = now - (startTimeRef.current ?? now);
      let raw = Math.min(Math.max(elapsed / duration, 0), 1);
      if (dirRef.current < 0) {
        raw = 1 - raw;
      }
      rawRef.current = raw;
      const eased = ease(raw);
      setT(eased);
      onUpdate == null ? void 0 : onUpdate(eased);
      const finished = elapsed >= duration;
      if (!finished) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      if (loop) {
        if (yoyo) dirRef.current = dirRef.current === 1 ? -1 : 1;
        startTimeRef.current = now;
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      setIsPlaying(false);
      rafRef.current = null;
      onComplete == null ? void 0 : onComplete();
    },
    [delay, duration, ease, loop, onComplete, onUpdate, yoyo]
  );
  const play = useCallback(() => {
    if (rafRef.current != null) return;
    setIsPlaying(true);
    startTimeRef.current = null;
    delayDoneRef.current = false;
    rafRef.current = requestAnimationFrame(step);
    if (intervalRef.current == null && typeof window !== "undefined") {
      intervalRef.current = window.setInterval(() => {
        try {
          const now = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
          step(now);
        } catch {
        }
      }, 16);
    }
  }, [step]);
  const pause = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      setIsPlaying(false);
    }
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  const reset = useCallback(() => {
    pause();
    dirRef.current = 1;
    rawRef.current = 0;
    const eased = ease(0);
    setT(eased);
  }, [ease, pause]);
  const reverse = useCallback(() => {
    dirRef.current = dirRef.current === 1 ? -1 : 1;
  }, []);
  useEffect(() => {
    if (autoplay) play();
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (intervalRef.current != null) clearInterval(intervalRef.current);
    };
  }, [autoplay, play]);
  return { t, isPlaying, play, pause, reset, reverse };
}

// src/Animate2D.tsx
import React33 from "react";
import { jsx as jsx36 } from "react/jsx-runtime";
function lerp2(a, b, t) {
  return a + (b - a) * t;
}
function Animate2D({ children, type = "transform", from, to, duration = 600, delay = 0, easing: easing2 = "easeInOutCubic", autoplay = true, loop = false, yoyo = false, replayKey }) {
  const plot = React33.useContext(PlotContext);
  const easeFn = React33.useMemo(() => typeof easing2 === "function" ? easing2 : getEasing(easing2), [easing2]);
  const defaults = React33.useMemo(() => {
    if (type === "appear") return { from: { opacity: 0 }, to: { opacity: 1 } };
    if (type === "disappear") return { from: { opacity: 1 }, to: { opacity: 0 } };
    return { from: {}, to: {} };
  }, [type]);
  const outerRef = React33.useRef(null);
  const applyAt = React33.useCallback((tt) => {
    const g = outerRef.current;
    if (!g) return;
    const f = { ...defaults.from, ...from };
    const t = { ...defaults.to, ...to };
    const wx = lerp2(f.x ?? 0, t.x ?? 0, tt);
    const wy = lerp2(f.y ?? 0, t.y ?? 0, tt);
    const sc = lerp2(f.scale ?? 1, t.scale ?? 1, tt);
    const rot = lerp2(f.rotation ?? 0, t.rotation ?? 0, tt);
    const opFrom = f.opacity ?? 1;
    const opTo = t.opacity ?? 1;
    const op = lerp2(opFrom, opTo, tt);
    const rotDeg = rot * 180 / Math.PI;
    let dx = wx, dy = wy;
    if (plot) {
      const o = plot.worldToScreen(0, 0);
      const px = plot.worldToScreen(wx, 0);
      const py = plot.worldToScreen(0, wy);
      dx = px.x - o.x;
      dy = py.y - o.y;
    }
    g.setAttribute("transform", `translate(${dx} ${dy}) scale(${sc}) rotate(${rotDeg})`);
    if (typeof op === "number") g.setAttribute("opacity", String(op));
  }, [defaults.from, defaults.to, from, to, plot]);
  const driverRef = React33.useRef({ playing: false, dir: 1, startAt: 0, id: null });
  const stop = React33.useCallback(() => {
    const d = driverRef.current;
    if (d.id != null) {
      clearInterval(d.id);
      d.id = null;
    }
    d.playing = false;
  }, []);
  const play = React33.useCallback(() => {
    const d = driverRef.current;
    if (d.playing) return;
    d.playing = true;
    d.dir = 1;
    const now = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
    d.startAt = now;
    if (d.id != null) {
      clearInterval(d.id);
      d.id = null;
    }
    d.id = window.setInterval(() => {
      const tnow = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
      const elapsed = tnow - d.startAt;
      const eff = elapsed - delay;
      if (eff < 0) {
        applyAt(0);
        return;
      }
      let raw = Math.min(Math.max(eff / duration, 0), 1);
      if (d.dir < 0) raw = 1 - raw;
      const eased = easeFn(raw);
      applyAt(eased);
      const finished = eff >= duration;
      if (finished) {
        if (loop) {
          if (yoyo) d.dir = d.dir === 1 ? -1 : 1;
          d.startAt = tnow;
        } else {
          stop();
        }
      }
    }, 16);
  }, [applyAt, delay, duration, easeFn, loop, stop, yoyo]);
  const lastResetAtRef = React33.useRef(-1);
  const resetPlay = React33.useCallback(() => {
    const now = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
    if (lastResetAtRef.current > 0 && now - lastResetAtRef.current < 250) return;
    lastResetAtRef.current = now;
    stop();
    applyAt(0);
    if (autoplay) play();
  }, [applyAt, autoplay, play, stop]);
  const initedRef = React33.useRef(false);
  React33.useLayoutEffect(() => {
    if (!initedRef.current) initedRef.current = true;
    resetPlay();
  }, [type, replayKey]);
  React33.useLayoutEffect(() => {
    if (autoplay) {
      play();
    } else {
      stop();
    }
  }, [autoplay, play, stop]);
  const intrinsicOnly = React33.useMemo(() => {
    const arr = React33.Children.toArray(children);
    const isIntrinsic = (el) => {
      if (!React33.isValidElement(el)) return true;
      const t = el.type;
      if (typeof t === "string") return true;
      return false;
    };
    return arr.every(isIntrinsic);
  }, [children]);
  let worldGroupTransform = null;
  if (plot && intrinsicOnly) {
    const o = plot.worldToScreen(0, 0);
    const px = plot.worldToScreen(1, 0);
    const py = plot.worldToScreen(0, 1);
    const sx = px.x - o.x;
    const sy = py.y - o.y;
    worldGroupTransform = `matrix(${sx} 0 0 ${sy} ${o.x} ${o.y})`;
  }
  const clipProps = plot ? { clipPath: `url(#${plot.clipPathId})` } : {};
  const initialOpacity = type === "appear" ? 0 : void 0;
  return /* @__PURE__ */ jsx36("g", { ref: outerRef, opacity: initialOpacity, ...clipProps, children: worldGroupTransform ? /* @__PURE__ */ jsx36("g", { transform: worldGroupTransform, children }) : children });
}

// src/Animate3D.tsx
import React34 from "react";
import { jsx as jsx37 } from "react/jsx-runtime";
function lerp3(a, b, t) {
  return a + (b - a) * t;
}
function lerp32(a, b, t, fallback) {
  const aa = a ?? fallback;
  const bb = b ?? fallback;
  return [lerp3(aa[0], bb[0], t), lerp3(aa[1], bb[1], t), lerp3(aa[2], bb[2], t)];
}
function Animate3D({ children, type = "transform", from, to, duration = 800, delay = 0, easing: easing2 = "easeInOutCubic", autoplay = true, loop = false, yoyo = false, replayKey }) {
  const { THREE, scene } = useThree();
  const parent = useThreeParent();
  const easeFn = React34.useMemo(() => typeof easing2 === "function" ? easing2 : getEasing(easing2), [easing2]);
  const groupRef = React34.useRef(null);
  const [ready, setReady] = React34.useState(false);
  const [childrenReadyTick, setChildrenReadyTick] = React34.useState(0);
  React34.useEffect(() => {
    if (!THREE || !scene) return;
    const g = new THREE.Group();
    if (type === "appear") g.visible = false;
    (parent ?? scene).add(g);
    groupRef.current = g;
    setReady(true);
    return () => {
      try {
        (parent ?? scene).remove(g);
      } catch {
      }
      groupRef.current = null;
      setReady(false);
    };
  }, [THREE, scene, parent]);
  const traverseMeshes = React34.useCallback((root, fn) => {
    var _a;
    if (!root) return false;
    let found = false;
    (_a = root.traverse) == null ? void 0 : _a.call(root, (obj) => {
      if (!obj || !obj.isMesh) return;
      found = true;
      if (!fn) return;
      const mat = obj.material;
      if (Array.isArray(mat)) {
        mat.forEach((m, i) => fn(obj, m, i));
      } else if (mat) {
        fn(obj, mat, null);
      }
    });
    return found;
  }, []);
  const preparedRef = React34.useRef(false);
  const finalizeOnAppearRef = React34.useRef(false);
  const appearRunningRef = React34.useRef(false);
  const appearWatchRef = React34.useRef(null);
  const currentProgressRef = React34.useRef(0);
  const prepareMaterials = React34.useCallback((initialOpacity) => {
    const g = groupRef.current;
    if (!g) return;
    if (preparedRef.current) return;
    traverseMeshes(g, (mesh, material, idx) => {
      var _a, _b;
      if ((_a = mesh.userData) == null ? void 0 : _a.__anim3dPrepared) return;
      let cloned;
      try {
        cloned = ((_b = material.clone) == null ? void 0 : _b.call(material)) ?? material;
      } catch {
        cloned = material;
      }
      const orig = material;
      const originalTransparent = !!orig.transparent;
      const originalDepthWrite = !!orig.depthWrite;
      if (idx == null) mesh.material = cloned;
      else mesh.material[idx] = cloned;
      try {
        cloned.transparent = true;
        cloned.depthWrite = false;
        if (typeof cloned.opacity === "number") cloned.opacity = initialOpacity;
      } catch {
      }
      mesh.userData = mesh.userData || {};
      mesh.userData.__anim3dPrepared = { orig, originalTransparent, originalDepthWrite, idx };
    });
    preparedRef.current = true;
  }, [traverseMeshes]);
  const finalizeMaterials = React34.useCallback(() => {
    const g = groupRef.current;
    if (!g) return;
    if (!preparedRef.current) return;
    traverseMeshes(g, (mesh, material) => {
      var _a;
      const info = (_a = mesh.userData) == null ? void 0 : _a.__anim3dPrepared;
      if (!info) return;
      try {
        if (mesh.material && info.orig) {
          mesh.material = info.orig;
        }
      } catch {
      }
      try {
        if (material) {
          material.transparent = info.originalTransparent;
          material.depthWrite = info.originalDepthWrite;
        }
      } catch {
      }
      delete mesh.userData.__anim3dPrepared;
    });
    preparedRef.current = false;
  }, [traverseMeshes]);
  const applyAt = React34.useCallback((tt) => {
    const g = groupRef.current;
    if (!g) return;
    currentProgressRef.current = tt;
    const fpos = (from == null ? void 0 : from.position) ?? [0, 0, 0];
    const tpos = (to == null ? void 0 : to.position) ?? [0, 0, 0];
    const frot = (from == null ? void 0 : from.rotation) ?? [0, 0, 0];
    const trot = (to == null ? void 0 : to.rotation) ?? [0, 0, 0];
    const fsca = (from == null ? void 0 : from.scale) ?? [1, 1, 1];
    const tsca = (to == null ? void 0 : to.scale) ?? [1, 1, 1];
    const p = lerp32(fpos, tpos, tt, [0, 0, 0]);
    const r = lerp32(frot, trot, tt, [0, 0, 0]);
    const s = lerp32(fsca, tsca, tt, [1, 1, 1]);
    g.position.set(p[0], p[1], p[2]);
    g.rotation.set(r[0], -r[1], r[2]);
    g.scale.set(s[0], s[1], s[2]);
    if (type === "appear" || type === "disappear") {
      const op = type === "appear" ? tt : 1 - tt;
      traverseMeshes(g, (_mesh, material) => {
        try {
          if (typeof material.opacity === "number") material.opacity = op;
        } catch {
        }
      });
    }
  }, [from == null ? void 0 : from.position, from == null ? void 0 : from.rotation, from == null ? void 0 : from.scale, to == null ? void 0 : to.position, to == null ? void 0 : to.rotation, to == null ? void 0 : to.scale, type, traverseMeshes]);
  const driverRef = React34.useRef({ playing: false, dir: 1, startAt: 0, id: null });
  const stop = React34.useCallback(() => {
    const d = driverRef.current;
    if (d.id != null) {
      clearInterval(d.id);
      d.id = null;
    }
    d.playing = false;
  }, []);
  const play = React34.useCallback(() => {
    const d = driverRef.current;
    if (d.playing) return;
    d.playing = true;
    d.dir = 1;
    const now = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
    d.startAt = now;
    if (d.id != null) {
      clearInterval(d.id);
      d.id = null;
    }
    d.id = window.setInterval(() => {
      const tnow = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
      const elapsed = tnow - d.startAt;
      const eff = elapsed - (delay ?? 0);
      if (eff < 0) {
        applyAt(0);
        return;
      }
      let raw = Math.min(Math.max(eff / (duration || 1), 0), 1);
      if (d.dir < 0) raw = 1 - raw;
      const eased = easeFn(raw);
      applyAt(eased);
      const finished = eff >= (duration || 1);
      if (finished) {
        if (loop) {
          if (yoyo) d.dir = d.dir === 1 ? -1 : 1;
          d.startAt = tnow;
        } else {
          stop();
          if (type === "appear") finalizeOnAppearRef.current = true;
          appearRunningRef.current = false;
          if (appearWatchRef.current != null) {
            clearInterval(appearWatchRef.current);
            appearWatchRef.current = null;
          }
        }
      }
    }, 16);
  }, [applyAt, delay, duration, easeFn, loop, stop, type, yoyo]);
  const lastResetAtRef = React34.useRef(-1);
  const rafRevealRef = React34.useRef(null);
  const pollTimerRef = React34.useRef(null);
  const resetPlay = React34.useCallback(() => {
    const now = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
    if (lastResetAtRef.current > 0 && now - lastResetAtRef.current < 250) return;
    lastResetAtRef.current = now;
    stop();
    finalizeMaterials();
    const g = groupRef.current;
    if (!g) return;
    if (type === "appear") {
      g.visible = false;
      appearRunningRef.current = true;
      const startWatcher = () => {
        if (appearWatchRef.current != null) {
          clearInterval(appearWatchRef.current);
        }
        appearWatchRef.current = window.setInterval(() => {
          const root = groupRef.current;
          if (!root) return;
          traverseMeshes(root, (mesh, material, idx) => {
            var _a, _b;
            if ((_a = mesh.userData) == null ? void 0 : _a.__anim3dPrepared) return;
            let cloned;
            try {
              cloned = ((_b = material.clone) == null ? void 0 : _b.call(material)) ?? material;
            } catch {
              cloned = material;
            }
            const orig = material;
            const originalTransparent = !!orig.transparent;
            const originalDepthWrite = !!orig.depthWrite;
            if (idx == null) mesh.material = cloned;
            else mesh.material[idx] = cloned;
            try {
              cloned.transparent = true;
              cloned.depthWrite = false;
              cloned.opacity = currentProgressRef.current;
              cloned.needsUpdate = true;
            } catch {
            }
            mesh.userData = mesh.userData || {};
            mesh.userData.__anim3dPrepared = { orig, originalTransparent, originalDepthWrite, idx };
          });
        }, 40);
      };
      const kick = () => {
        prepareMaterials(0);
        applyAt(0);
        if (rafRevealRef.current != null) cancelAnimationFrame(rafRevealRef.current);
        rafRevealRef.current = requestAnimationFrame(() => {
          g.visible = true;
          startWatcher();
          if (autoplay) play();
        });
      };
      if (pollTimerRef.current != null) clearTimeout(pollTimerRef.current);
      const start = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
      const poll = () => {
        if (!groupRef.current) return;
        const hasMesh = traverseMeshes(groupRef.current);
        const tnow = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
        if (hasMesh || tnow - start > 2e3) {
          kick();
        } else {
          pollTimerRef.current = window.setTimeout(poll, 16);
        }
      };
      poll();
      return;
    }
    if (type === "disappear") {
      g.visible = true;
      prepareMaterials(1);
      applyAt(0);
      if (autoplay) play();
      return;
    }
    g.visible = true;
    applyAt(0);
    if (autoplay) play();
  }, [applyAt, autoplay, finalizeMaterials, play, prepareMaterials, stop, type]);
  const initedRef = React34.useRef(false);
  React34.useLayoutEffect(() => {
    if (!ready) return;
    if (!initedRef.current) initedRef.current = true;
    resetPlay();
  }, [ready, type, replayKey]);
  React34.useLayoutEffect(() => {
    if (!ready) return;
    if (autoplay) {
      play();
    } else {
      stop();
    }
  }, [autoplay, play, ready, stop]);
  React34.useEffect(() => {
    if (!ready || !groupRef.current) return;
    setChildrenReadyTick((t) => t + 1);
  }, [children, ready]);
  React34.useEffect(() => {
    if (!finalizeOnAppearRef.current) return;
    finalizeOnAppearRef.current = false;
    finalizeMaterials();
  });
  React34.useEffect(() => {
    return () => {
      try {
        stop();
      } catch {
      }
      if (rafRevealRef.current != null) cancelAnimationFrame(rafRevealRef.current);
      if (pollTimerRef.current != null) clearTimeout(pollTimerRef.current);
      if (appearWatchRef.current != null) {
        clearInterval(appearWatchRef.current);
        appearWatchRef.current = null;
      }
      appearRunningRef.current = false;
      try {
        finalizeMaterials();
      } catch {
      }
    };
  }, [finalizeMaterials, stop]);
  if (!groupRef.current || !ready) return null;
  return /* @__PURE__ */ jsx37(ThreeParentContext.Provider, { value: groupRef.current, children });
}
export {
  AngleMarker,
  Animate2D,
  Animate3D,
  Arc,
  Area2D,
  Axes2D,
  Axes3D,
  Bezier2D,
  Box3D,
  Circle,
  Cone3D,
  Contour2D,
  Crosshair2D,
  Cylinder3D,
  DistanceMarker,
  Function2D,
  Grid3D,
  Group3D,
  Heatmap2D,
  Image2D,
  Implicit2D,
  Label,
  Label3D,
  Legend2D,
  Legend3D,
  Line,
  LinearGradient2D,
  NormalLine,
  Parametric2D,
  ParametricSurface3D,
  Plot2D,
  Plot3D,
  Point2D,
  PolarFunction2D,
  Polygon2D,
  Polyline2D,
  RadialGradient2D,
  Ray2D,
  RiemannSum,
  Scatter2D,
  Scatter3D,
  Sphere3D,
  Surface3D,
  TangentLine,
  Title2D,
  Torus3D,
  Vector2D,
  VectorField2D,
  easing,
  getEasing,
  useAnimation,
  useTween
};
//# sourceMappingURL=index.js.map
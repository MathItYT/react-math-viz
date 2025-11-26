import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';

type Range = [number, number];
type Margins = {
    top: number;
    right: number;
    bottom: number;
    left: number;
};

type Plot2DProps = {
    width: number;
    height: number;
    xRange: Range;
    yRange: Range;
    margin?: Partial<Margins>;
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    pannable?: boolean;
    onViewportChange?: (xRange: Range, yRange: Range) => void;
    zoomable?: boolean;
    zoomSpeed?: number;
    pinchZoomable?: boolean;
};
declare function Plot2D({ width, height, xRange, yRange, margin, children, style, className, pannable, onViewportChange, zoomable, zoomSpeed, pinchZoomable, }: Plot2DProps): react_jsx_runtime.JSX.Element;

type Axes2DProps = {
    grid?: boolean | {
        stroke?: string;
        strokeWidth?: number;
        opacity?: number;
    };
    minorGrid?: boolean | {
        stroke?: string;
        strokeWidth?: number;
        opacity?: number;
    };
    xSubdivisions?: number;
    ySubdivisions?: number;
    gridMajorPx?: number | {
        x?: number;
        y?: number;
    };
    minMinorPx?: number;
    gridXDelta?: number;
    gridYDelta?: number;
    xTicks?: number[];
    yTicks?: number[];
    approxXTicks?: number;
    approxYTicks?: number;
    axisColor?: string;
    axisWidth?: number;
    tickSize?: number;
    renderXLabel?: (x: number) => React.ReactNode | null;
    renderYLabel?: (y: number) => React.ReactNode | null;
    labelOffset?: {
        x?: number;
        y?: number;
    };
};
declare function Axes2D({ grid, minorGrid, xSubdivisions, ySubdivisions, gridMajorPx, minMinorPx, gridXDelta, gridYDelta, xTicks, yTicks, approxXTicks, approxYTicks, axisColor, axisWidth, tickSize, renderXLabel, renderYLabel, labelOffset, }: Axes2DProps): react_jsx_runtime.JSX.Element;

type Parametric2DProps = {
    x: (t: number) => number;
    y: (t: number) => number;
    tRange: [number, number];
    samples?: number;
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    fill?: string;
    clip?: boolean;
    domainFollowsViewport?: boolean;
    assumeXEqualsT?: boolean;
    overscan?: number;
};
declare function Parametric2D({ x, y, tRange, samples, stroke, strokeWidth, strokeDasharray, fill, clip, domainFollowsViewport, assumeXEqualsT, overscan, }: Parametric2DProps): react_jsx_runtime.JSX.Element;

type Polygon2DProps = {
    points: Array<[number, number]>;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    fillOpacity?: number;
    closed?: boolean;
    clip?: boolean;
};
declare function Polygon2D({ points, stroke, strokeWidth, fill, fillOpacity, closed, clip, }: Polygon2DProps): react_jsx_runtime.JSX.Element;

type ArcProps = {
    cx: number;
    cy: number;
    r: number;
    a0: number;
    a1: number;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    fillOpacity?: number;
    clip?: boolean;
};
declare function Arc({ cx, cy, r, a0, a1, stroke, strokeWidth, fill, fillOpacity, clip }: ArcProps): react_jsx_runtime.JSX.Element;
type CircleProps = {
    cx: number;
    cy: number;
    r: number;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    fillOpacity?: number;
    clip?: boolean;
};
declare function Circle({ cx, cy, r, stroke, strokeWidth, fill, fillOpacity, clip }: CircleProps): react_jsx_runtime.JSX.Element;
type EllipticalArcProps = {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    a0: number;
    a1: number;
    rotation?: number;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    fillOpacity?: number;
    clip?: boolean;
};
declare function EllipticalArc({ cx, cy, rx, ry, a0, a1, rotation, stroke, strokeWidth, fill, fillOpacity, clip, }: EllipticalArcProps): react_jsx_runtime.JSX.Element;
type EllipseProps = {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    rotation?: number;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    fillOpacity?: number;
    clip?: boolean;
};
declare function Ellipse({ cx, cy, rx, ry, rotation, stroke, strokeWidth, fill, fillOpacity, clip, }: EllipseProps): react_jsx_runtime.JSX.Element;

type LabelProps = {
    x: number;
    y: number;
    children: React.ReactNode;
    align?: "center" | "left" | "right";
    vAlign?: "middle" | "top" | "bottom";
    dx?: number;
    dy?: number;
    pointerEvents?: "auto" | "none";
    width?: string | number;
    height?: string | number;
};
declare function Label({ x, y, children, align, vAlign, dx, dy, pointerEvents, width, height }: LabelProps): react_jsx_runtime.JSX.Element;

type LineProps = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    clip?: boolean;
};
declare function Line({ x1, y1, x2, y2, stroke, strokeWidth, strokeDasharray, clip, }: LineProps): react_jsx_runtime.JSX.Element;

type Function2DProps = {
    f: (x: number) => number;
    xRange: [number, number];
    samples?: number;
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    clip?: boolean;
    domainFollowsViewport?: boolean;
    overscan?: number;
};
declare function Function2D({ f, xRange, samples, stroke, strokeWidth, strokeDasharray, clip, domainFollowsViewport, overscan, }: Function2DProps): react_jsx_runtime.JSX.Element;

type Point2DProps = {
    x: number;
    y: number;
    r?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    clip?: boolean;
};
declare function Point2D({ x, y, r, fill, stroke, strokeWidth, clip }: Point2DProps): react_jsx_runtime.JSX.Element;

type Scatter2DProps = {
    points: Array<[number, number] | {
        x: number;
        y: number;
    }>;
    r?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    clip?: boolean;
    renderPoint?: (args: {
        x: number;
        y: number;
        i: number;
        sx: number;
        sy: number;
    }) => React.ReactNode;
};
declare function Scatter2D({ points, r, fill, stroke, strokeWidth, clip, renderPoint }: Scatter2DProps): react_jsx_runtime.JSX.Element;

type Ray2DProps = {
    from: [number, number];
    through: [number, number];
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    clip?: boolean;
};
declare function Ray2D({ from, through, stroke, strokeWidth, strokeDasharray }: Ray2DProps): react_jsx_runtime.JSX.Element;

type Vector2DProps = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    stroke?: string;
    strokeWidth?: number;
    headSize?: number;
    fillHead?: string;
    clip?: boolean;
};
declare function Vector2D({ x1, y1, x2, y2, stroke, strokeWidth, headSize, fillHead, clip }: Vector2DProps): react_jsx_runtime.JSX.Element;

type Polyline2DProps = {
    points: Array<[number, number]>;
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    clip?: boolean;
};
declare function Polyline2D({ points, stroke, strokeWidth, strokeDasharray, clip }: Polyline2DProps): react_jsx_runtime.JSX.Element;

type Bezier2DProps = {
    kind: "quadratic";
    p0: [number, number];
    p1: [number, number];
    p2: [number, number];
    samples?: number;
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    clip?: boolean;
} | {
    kind: "cubic";
    p0: [number, number];
    p1: [number, number];
    p2: [number, number];
    p3: [number, number];
    samples?: number;
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    clip?: boolean;
};
declare function Bezier2D(props: Bezier2DProps): react_jsx_runtime.JSX.Element;

type Area2DProps = {
    f: (x: number) => number;
    a: number;
    b: number;
    baseline?: number | ((x: number) => number);
    samples?: number;
    fill?: string;
    fillOpacity?: number;
    stroke?: string;
    strokeWidth?: number;
    clip?: boolean;
};
declare function Area2D({ f, a, b, baseline, samples, fill, fillOpacity, stroke, strokeWidth, clip }: Area2DProps): react_jsx_runtime.JSX.Element;

type RiemannSumMethod = "left" | "right" | "mid" | "trapezoid";
type RiemannSumProps = {
    f: (x: number) => number;
    a: number;
    b: number;
    n: number;
    method?: RiemannSumMethod;
    baseline?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    clip?: boolean;
};
declare function RiemannSum({ f, a, b, n, method, baseline, fill, stroke, strokeWidth, clip }: RiemannSumProps): react_jsx_runtime.JSX.Element;

type TangentLineProps = {
    f: (x: number) => number;
    x0: number;
    color?: string;
    strokeWidth?: number;
};
declare function TangentLine({ f, x0, color, strokeWidth }: TangentLineProps): react_jsx_runtime.JSX.Element;

type NormalLineProps = {
    f: (x: number) => number;
    x0: number;
    color?: string;
    strokeWidth?: number;
};
declare function NormalLine({ f, x0, color, strokeWidth }: NormalLineProps): react_jsx_runtime.JSX.Element;

type AngleMarkerProps = {
    center: [number, number];
    a: [number, number];
    b: [number, number];
    r?: number;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    fillOpacity?: number;
};
declare function AngleMarker({ center, a, b, r, stroke, strokeWidth, fill, fillOpacity }: AngleMarkerProps): react_jsx_runtime.JSX.Element;

type DistanceMarkerProps = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    tickSize?: number;
    stroke?: string;
    strokeWidth?: number;
    label?: React.ReactNode;
    labelOffsetPx?: number;
    clip?: boolean;
};
declare function DistanceMarker({ x1, y1, x2, y2, tickSize, stroke, strokeWidth, label, labelOffsetPx, clip }: DistanceMarkerProps): react_jsx_runtime.JSX.Element;

type VectorField2DProps = {
    v: (x: number, y: number) => {
        vx: number;
        vy: number;
    } | [number, number];
    mode?: "world" | "viewport";
    origin?: [number, number];
    stepX?: number;
    stepY?: number;
    countX?: number;
    countY?: number;
    normalize?: boolean;
    scale?: number;
    color?: string;
    strokeWidth?: number;
    headSize?: number;
    clip?: boolean;
};
declare function VectorField2D({ v, mode, origin, stepX, stepY, countX, countY, normalize, scale, color, strokeWidth, headSize, }: VectorField2DProps): react_jsx_runtime.JSX.Element;

type Heatmap2DProps = {
    f: (x: number, y: number) => number;
    mode?: "world" | "viewport";
    origin?: [number, number];
    stepX?: number;
    stepY?: number;
    countX?: number;
    countY?: number;
    valueRange?: [number, number];
    colorMap?: (t: number) => string;
    opacity?: number;
    clip?: boolean;
};
declare function Heatmap2D({ f, mode, origin, stepX, stepY, countX, countY, valueRange, colorMap, opacity, clip }: Heatmap2DProps): react_jsx_runtime.JSX.Element;

type Implicit2DProps = {
    F: (x: number, y: number) => number;
    level?: number;
    countX?: number;
    countY?: number;
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    clip?: boolean;
};
declare function Implicit2D({ F, level, countX, countY, stroke, strokeWidth, strokeDasharray, clip }: Implicit2DProps): react_jsx_runtime.JSX.Element;

type Contour2DProps = {
    F: (x: number, y: number) => number;
    levels: number[];
    colors?: string[];
    strokeWidth?: number;
    strokeDasharray?: string;
    countX?: number;
    countY?: number;
};
declare function Contour2D({ F, levels, colors, strokeWidth, strokeDasharray, countX, countY }: Contour2DProps): react_jsx_runtime.JSX.Element;

type PolarFunction2DProps = {
    r: (theta: number) => number;
    thetaRange: [number, number];
    samples?: number;
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    clip?: boolean;
    overscan?: number;
};
declare function PolarFunction2D({ r, thetaRange, samples, stroke, strokeWidth, strokeDasharray, clip, overscan }: PolarFunction2DProps): react_jsx_runtime.JSX.Element;

type Crosshair2DProps = {
    color?: string;
    strokeWidth?: number;
    showLabels?: boolean;
    format?: (x: number, y: number) => string;
};
declare function Crosshair2D({ color, strokeWidth, showLabels, format }: Crosshair2DProps): react_jsx_runtime.JSX.Element;

type NumberLineProps = {
    /** Horizontal extent of the number line (defaults to plot xRange) */
    xRange?: [number, number];
    /** World Y coordinate where the number line is drawn (defaults to 0) */
    y?: number;
    /** Explicit major tick values. If provided, overrides approxTicks/delta logic. */
    ticks?: number[];
    /** Desired approx count of major ticks when ticks not provided. Default 9. */
    approxTicks?: number;
    /** Fixed delta (world units) between consecutive major ticks. Optional. */
    delta?: number;
    /** Count of minor subdivisions between consecutive majors. Default 0 (none). */
    minorSubdivisions?: number;
    /** Minimum pixel spacing for minor ticks; reduces effective subdivisions when too dense. Default 14. */
    minMinorPx?: number;
    /** Color of the line and ticks. */
    color?: string;
    /** Stroke width of the line and ticks. */
    strokeWidth?: number;
    /** Major tick size in pixels. Default 8. */
    tickSize?: number;
    /** Minor tick size in pixels. Default 5. */
    minorTickSize?: number;
    /** Optional label renderer for each major tick. Return null to hide a label. */
    renderLabel?: (x: number) => React.ReactNode | null;
    /** Pixel offset for labels from the line (positive places below by default transform). Default 8. */
    labelOffset?: number;
    /** Place labels above (true) or below (false) the line. Default false (below). */
    labelsAbove?: boolean;
};
declare function NumberLine({ xRange, y, ticks, approxTicks, delta, minorSubdivisions, minMinorPx, color, strokeWidth, tickSize, minorTickSize, renderLabel, labelOffset, labelsAbove, }: NumberLineProps): react_jsx_runtime.JSX.Element;

type LegendItem = {
    label: React.ReactNode;
    color?: string;
    strokeDasharray?: string;
    marker?: React.ReactNode;
};
type Legend2DProps = {
    items: LegendItem[];
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    padding?: number;
    bg?: string;
    opacity?: number;
};
declare function Legend2D({ items, position, padding, bg, opacity }: Legend2DProps): react_jsx_runtime.JSX.Element;

type Title2DProps = {
    children: React.ReactNode;
    align?: 'left' | 'center' | 'right';
    /** Vertical offset in pixels from the top margin area. Positive moves down. */
    offsetY?: number;
};
declare function Title2D({ children, align, offsetY }: Title2DProps): react_jsx_runtime.JSX.Element;

type GradientStop = {
    offset: number | string;
    color: string;
    opacity?: number;
};
type LinearGradient2DProps = {
    stops: GradientStop[];
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    opacity?: number;
    children: React.ReactNode;
    overlay?: React.ReactNode;
    space?: 'world' | 'screen';
    anchor?: 'mask' | 'world' | 'screen';
    reveal?: 'fill' | 'stroke' | 'both';
};
declare function LinearGradient2D({ stops, x1, y1, x2, y2, x, y, width, height, opacity, children, overlay, space, anchor, reveal }: LinearGradient2DProps): react_jsx_runtime.JSX.Element;

type RadialGradient2DProps = {
    stops: GradientStop[];
    cx?: number;
    cy?: number;
    r?: number;
    fx?: number;
    fy?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    opacity?: number;
    children: React.ReactNode;
    overlay?: React.ReactNode;
    space?: 'world' | 'screen';
    anchor?: 'mask' | 'world' | 'screen';
    reveal?: 'fill' | 'stroke' | 'both';
};
declare function RadialGradient2D({ stops, cx, cy, r, fx, fy, x, y, width, height, opacity, children, overlay, space, anchor, reveal }: RadialGradient2DProps): react_jsx_runtime.JSX.Element;

type Image2DProps = {
    href: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    preserveAspectRatio?: string;
    opacity?: number;
    children: React.ReactNode;
    overlay?: React.ReactNode;
    crossOrigin?: string;
    space?: 'world' | 'screen';
    anchor?: 'mask' | 'world' | 'screen';
    imageX?: number;
    imageY?: number;
    imageWidth?: number;
    imageHeight?: number;
    reveal?: 'fill' | 'stroke' | 'both';
};
declare function Image2D({ href, x, y, width, height, preserveAspectRatio, opacity, children, overlay, crossOrigin, space, anchor, imageX, imageY, imageWidth, imageHeight, reveal }: Image2DProps): react_jsx_runtime.JSX.Element;

type Plot3DProps = {
    width: number;
    height: number;
    background?: string;
    camera?: {
        fov?: number;
        near?: number;
        far?: number;
        position?: [number, number, number];
        lookAt?: [number, number, number];
    };
    orbitControls?: boolean;
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
};
declare function Plot3D({ width, height, background, camera, orbitControls, children, className, style, }: Plot3DProps): react_jsx_runtime.JSX.Element;

type Axes3DProps = {
    /** Half-extent of each axis; axes go from -size to +size. */
    size?: number;
    /** Cylinder radius in world units; if not provided or <= 0, draws thin line axes. */
    thickness?: number;
    /** Show arrowheads. */
    arrows?: boolean;
    /** Also draw arrowheads on the negative side. */
    negativeArrows?: boolean;
};
declare function Axes3D({ size, thickness, arrows, negativeArrows }: Axes3DProps): any;

type Grid3DProps = {
    size?: number;
    divisions?: number;
    color1?: number;
    color2?: number;
};
declare function Grid3D({ size, divisions, color1, color2 }: Grid3DProps): any;

type Box3DProps = {
    size?: [number, number, number];
    position?: [number, number, number];
    color?: string | number;
    wireframe?: boolean;
};
declare function Box3D({ size, position, color, wireframe }: Box3DProps): any;

type Sphere3DProps = {
    radius?: number;
    widthSegments?: number;
    heightSegments?: number;
    position?: [number, number, number];
    color?: string | number;
    wireframe?: boolean;
};
declare function Sphere3D({ radius, widthSegments, heightSegments, position, color, wireframe }: Sphere3DProps): any;

type Label3DProps = {
    position: [number, number, number];
    children: React.ReactNode;
    align?: 'left' | 'center' | 'right';
    vAlign?: 'top' | 'middle' | 'bottom';
    dx?: number;
    dy?: number;
    className?: string;
    style?: React.CSSProperties;
};
declare function Label3D({ position, children, align, vAlign, dx, dy, className, style }: Label3DProps): react_jsx_runtime.JSX.Element;

type Legend3DItem = {
    label: React.ReactNode;
    color?: string;
    marker?: React.ReactNode;
};
type Legend3DProps = {
    items: Legend3DItem[];
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    bg?: string;
    padding?: number;
};
declare function Legend3D({ items, position, bg, padding }: Legend3DProps): react_jsx_runtime.JSX.Element;

type Torus3DProps = {
    radius?: number;
    tube?: number;
    radialSegments?: number;
    tubularSegments?: number;
    arc?: number;
    position?: [number, number, number];
    rotation?: [number, number, number];
    color?: string | number;
    wireframe?: boolean;
};
declare function Torus3D({ radius, tube, radialSegments, tubularSegments, arc, position, rotation, color, wireframe }: Torus3DProps): any;

type Cylinder3DProps = {
    radiusTop?: number;
    radiusBottom?: number;
    height?: number;
    radialSegments?: number;
    openEnded?: boolean;
    position?: [number, number, number];
    rotation?: [number, number, number];
    color?: string | number;
    wireframe?: boolean;
};
declare function Cylinder3D({ radiusTop, radiusBottom, height, radialSegments, openEnded, position, rotation, color, wireframe }: Cylinder3DProps): any;

type Cone3DProps = {
    radius?: number;
    height?: number;
    radialSegments?: number;
    openEnded?: boolean;
    position?: [number, number, number];
    rotation?: [number, number, number];
    color?: string | number;
    wireframe?: boolean;
};
declare function Cone3D({ radius, height, radialSegments, openEnded, position, rotation, color, wireframe }: Cone3DProps): any;

type Surface3DProps = {
    xRange: [number, number];
    yRange: [number, number];
    xSegments?: number;
    ySegments?: number;
    f: (x: number, y: number) => number;
    color?: string | number;
    colorMap?: (x: number, y: number, z: number) => string | number;
    wireframe?: boolean;
    doubleSided?: boolean;
};
declare function Surface3D({ xRange, yRange, xSegments, ySegments, f, color, colorMap, wireframe, doubleSided }: Surface3DProps): any;

type ParametricSurface3DProps = {
    uRange: [number, number];
    vRange: [number, number];
    uSegments?: number;
    vSegments?: number;
    f: (u: number, v: number) => [number, number, number];
    color?: string | number;
    colorMap?: (u: number, v: number, x: number, y: number, z: number) => string | number;
    wireframe?: boolean;
    doubleSided?: boolean;
};
declare function ParametricSurface3D({ uRange, vRange, uSegments, vSegments, f, color, colorMap, wireframe, doubleSided }: ParametricSurface3DProps): any;

type Scatter3DProps = {
    points: Array<[number, number, number]>;
    color?: string | number;
    colors?: Array<string | number>;
    colorMap?: (x: number, y: number, z: number, i: number) => string | number;
    size?: number;
    opacity?: number;
};
declare function Scatter3D({ points, color, colors, colorMap, size, opacity }: Scatter3DProps): any;

type UseAnimationOptions = {
    autoplay?: boolean;
    speed?: number;
    duration?: number;
    loop?: boolean;
    onTick?: (t: number, dt: number) => void;
};
type AnimationApi = {
    t: number;
    dt: number;
    playing: boolean;
    speed: number;
    play: () => void;
    stop: () => void;
    toggle: () => void;
    reset: () => void;
    setTime: (t: number) => void;
    setSpeed: (s: number) => void;
};
declare function useAnimation(opts?: UseAnimationOptions): AnimationApi;

type Group3DProps = {
    children?: React.ReactNode;
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
};
declare function Group3D({ children, position, rotation, scale }: Group3DProps): react_jsx_runtime.JSX.Element;

type EasingName = "linear" | "easeInQuad" | "easeOutQuad" | "easeInOutSine" | "easeInOutCubic";
type EasingFn = (t: number) => number;
declare const easing: Record<EasingName, EasingFn>;
declare function getEasing(fn?: EasingName | EasingFn): EasingFn;

interface UseTweenOptions {
    duration?: number;
    delay?: number;
    easing?: EasingName | EasingFn;
    autoplay?: boolean;
    loop?: boolean;
    yoyo?: boolean;
    onUpdate?: (t: number) => void;
    onComplete?: () => void;
}
interface UseTweenApi {
    t: number;
    isPlaying: boolean;
    play: () => void;
    pause: () => void;
    reset: () => void;
    reverse: () => void;
}
declare function useTween(options?: UseTweenOptions): UseTweenApi;

type AnimationType2D = "appear" | "disappear" | "transform" | "morph";
type Transform2D = {
    x?: number;
    y?: number;
    scale?: number;
    rotation?: number;
    opacity?: number;
};
type Animate2DProps = {
    children?: React.ReactNode;
    type?: AnimationType2D;
    from?: Transform2D;
    to?: Transform2D;
    duration?: number;
    delay?: number;
    easing?: EasingName | EasingFn;
    autoplay?: boolean;
    loop?: boolean;
    yoyo?: boolean;
    replayKey?: any;
};
declare function Animate2D({ children, type, from, to, duration, delay, easing, autoplay, loop, yoyo, replayKey }: Animate2DProps): react_jsx_runtime.JSX.Element;

type Vec3 = [number, number, number];
type AnimationType3D = "appear" | "disappear" | "transform";
type Transform3D = {
    position?: Vec3;
    rotation?: Vec3;
    scale?: Vec3;
};
type Animate3DProps = {
    children?: React.ReactNode;
    type?: AnimationType3D;
    from?: Transform3D;
    to?: Transform3D;
    duration?: number;
    delay?: number;
    easing?: EasingName | EasingFn;
    autoplay?: boolean;
    loop?: boolean;
    yoyo?: boolean;
    replayKey?: any;
};
declare function Animate3D({ children, type, from, to, duration, delay, easing, autoplay, loop, yoyo, replayKey }: Animate3DProps): react_jsx_runtime.JSX.Element;

export { AngleMarker, Animate2D, Animate3D, Arc, Area2D, Axes2D, Axes3D, Bezier2D, Box3D, Circle, Cone3D, Contour2D, Crosshair2D, Cylinder3D, DistanceMarker, type EasingFn, type EasingName, Ellipse, EllipticalArc, Function2D, Grid3D, Group3D, Heatmap2D, Image2D, Implicit2D, Label, Label3D, Legend2D, Legend3D, Line, LinearGradient2D, NormalLine, NumberLine, Parametric2D, ParametricSurface3D, Plot2D, Plot3D, Point2D, PolarFunction2D, Polygon2D, Polyline2D, RadialGradient2D, Ray2D, RiemannSum, Scatter2D, Scatter3D, Sphere3D, Surface3D, TangentLine, Title2D, Torus3D, Vector2D, VectorField2D, easing, getEasing, useAnimation, useTween };

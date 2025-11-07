# react-math-viz

Librería de visualización matemática en React con enfoque práctico y tipado TypeScript. Render 2D vía SVG (con overlay HTML para etiquetas) y 3D con ThreeJS, soporte de interactividad (pan/zoom), animaciones y utilidades para construir escenas con pocas líneas de código.

Características clave:
- 2D: ejes, funciones, implícitas, campos vectoriales, anotaciones, heatmap, etc.
- 3D: superficies, primitivas y leyendas con labels HTML.
- Precisión al interactuar bajo escalado CSS (coordenadas de puntero robustas).
- Crosshair y leyendas fáciles; layout resizable.

## Instalación

Instálalo desde NPM:

```bash
npm install react-math-viz
```

o directamente desde GitHub:

```bash
npm install github:MathItYT/react-math-viz
```

Peer deps: React 18+ y ReactDOM 18+.

## Inicio rápido (2D)

```tsx
import { Plot2D, Axes2D, Function2D, Parametric2D, Polygon2D, Crosshair2D, Title2D, Legend2D } from "react-math-viz";

export function Demo2D() {
  const xRange: [number, number] = [-6.28, 6.28];
  const yRange: [number, number] = [-2, 2];
  return (
    <Plot2D width={640} height={360} xRange={xRange} yRange={yRange} pannable zoomable>
      <Axes2D grid renderXLabel={(x)=> x===0? null : <span>{x}</span>} renderYLabel={(y)=> y===0? null : <span>{y}</span>} />
      <Title2D>Funciones básicas</Title2D>
      <Function2D f={(x)=> Math.sin(x)} xRange={xRange} stroke="#2563eb" strokeWidth={2} />
      <Parametric2D x={(t)=> t} y={(t)=> 0.5*Math.cos(2*t)} tRange={xRange} stroke="#16a34a" />
      <Polygon2D points={[[-5,-1],[-3,1],[-1,-1]]} fill="rgba(99,102,241,.15)" stroke="#6366f1" />
      <Legend2D items={[{ label: 'sin(x)', color: '#2563eb' }, { label: 'y=0.5 cos(2x)', color: '#16a34a' }]} />
      <Crosshair2D />
    </Plot2D>
  );
}
```

## Componentes disponibles

### 2D
- Plot2D: contenedor 2D. Props: width, height, xRange, yRange, pannable, zoomable.
  - Uso: agrupa capas SVG y overlays; provee worldToScreen/screenToWorld.
- Axes2D: ejes cartesianos con grid mayor/menor, ticks y labels React.
  - Props: grid, minorGrid, xSubdivisions, ySubdivisions, gridMajorPx, gridXDelta, gridYDelta, xTicks, yTicks, renderXLabel, renderYLabel.
- Function2D: grafica y=f(x) en xRange.
  - Props: f:(x)=>number, xRange, stroke, strokeWidth.
- Parametric2D: curva (x(t), y(t)).
  - Props: x:(t)=>number, y:(t)=>number, tRange, samples, stroke, strokeWidth, assumeXEqualsT?, domainFollowsViewport?, overscan?.
- Polyline2D: polilínea abierta.
  - Props: points:[[x,y],...], stroke, strokeWidth, strokeDasharray.
- Polygon2D: polígono/área cerrada.
  - Props: points, stroke, strokeWidth, fill, fillOpacity.
- Area2D: integral visual entre f(x) y baseline en [a,b].
  - Props: f:(x)=>y | string expr, a, b, baseline:number|(x)=>number, samples, fill, fillOpacity, stroke.
- Line: recta por dos puntos o por ecuación y=mx+b.
  - Props: (x1,y1,x2,y2) o (m,b), stroke, strokeWidth.
- Ray2D: semirrecta desde un punto pasando por otro.
  - Props: from:[x,y], through:[x,y], stroke, strokeWidth, strokeDasharray.
- Bezier2D: curva Bézier cúbica.
  - Props: p0,p1,p2,p3 o points, stroke, strokeWidth.
- Scatter2D / Point2D: puntos / un punto.
  - Props: points, r, fill, stroke (Scatter2D); x,y,r,fill,stroke (Point2D).
- Vector2D: vector con cabeza de flecha.
  - Props: from, to? o v?, headSize, stroke.
- VectorField2D: campo vectorial muestreado.
  - Props: v:(x,y)=>[vx,vy], mode, origin, stepX, stepY, countX, countY, normalize, scale, color, headSize.
- Heatmap2D: mapa de calor por muestreo.
  - Props: f:(x,y)=>number, mode, origin, stepX, stepY, countX, countY, valueRange, opacity.
- Implicit2D: curva de nivel F(x,y)=level.
  - Props: F:(x,y)=>number, level, countX, countY, stroke, strokeWidth, strokeDasharray.
- Contour2D: múltiples curvas de nivel.
  - Props: F, levels[], colors[], strokeWidth, strokeDasharray, countX, countY.
- PolarFunction2D: curva polar r(θ).
  - Props: r:(theta)=>number, thetaRange, stroke, strokeWidth, strokeDasharray.
- AngleMarker: marca de ángulo ∠AĈB.
  - Props: center:[x,y], a:[x,y], b:[x,y], r, stroke, strokeWidth, fill, fillOpacity.
- DistanceMarker: regla con ticks entre dos puntos (con etiqueta opcional).
  - Props: x1,y1,x2,y2,tickSize,stroke,strokeWidth,label,labelOffsetPx.
- Arc / Circle: arco o círculo.
  - Props (Arc): cx,cy,r,a0,a1, stroke, strokeWidth, fill, fillOpacity.
  - Props (Circle): cx,cy,r, stroke, strokeWidth, fill, fillOpacity.
- Label (2D): texto/HTML anclado a [x,y].
  - Props: x,y, dx, dy, children ReactNode.
- Title2D: título overlay del gráfico.
  - Props: children ReactNode.
- Legend2D: leyenda automática con items {label, color}.
  - Props: items, position.
- Image2D: imagen raster en coordenadas mundo o pantalla.
  - Props: href, x,y,width,height, mode: 'world'|'screen', opacity.
- LinearGradient2D / RadialGradient2D: gradientes SVG reutilizables.
  - Props: id, stops, x1,y1,x2,y2 (lineal) / cx,cy,r,fx,fy (radial). Usar fill="url(#id)".
- Crosshair2D: puntero interactivo con coordenadas.
  - Props: color, strokeWidth, showLabels.
- NumberLine: recta numérica 1D (ticks/labels personalizables) dibujada en y.
  - Props: xRange?, y?, ticks?, approxTicks?, delta?, minorSubdivisions?, minMinorPx?, color, strokeWidth, tickSize, minorTickSize, renderLabel?, labelOffset?, labelsAbove?

Props comunes:
- stroke, strokeWidth, strokeDasharray, fill, fillOpacity, color.
- xRange/yRange/tRange/thetaRange, samples/segments.
- renderXLabel/renderYLabel (en Axes2D), headSize (vectores), opacity (heatmap/image).

### 3D
- Plot3D: contenedor ThreeJS. Props: width, height, background, camera, orbitControls.
- Axes3D / Grid3D: ejes/cartesiano y grilla.
- Box3D, Sphere3D, Torus3D, Cylinder3D, Cone3D: primitivas 3D.
- Surface3D: malla por z=f(x,y) en grilla.
- ParametricSurface3D: malla paramétrica f(u,v)→[x,y,z].
- Scatter3D: puntos 3D con tamaño y color.
- Label3D: label HTML colocado en 3D.
- Legend3D: leyenda para ítems 3D.
- Group3D: agrupa hijos con position/rotation/scale.

Ejemplo simple 3D:

```tsx
import { Plot3D, Axes3D, Surface3D } from "react-math-viz";

<Plot3D width={640} height={360} orbitControls>
  <Axes3D />
  <Surface3D xRange={[-2,2]} yRange={[-2,2]} f={(x,y)=> Math.sin(x)*Math.cos(y)} />
</Plot3D>
```

## Animación e interactividad

- Pan/zoom en 2D (prop pannable/zoomable) con mapeo de puntero estable incluso si el contenedor está escalado por CSS.
- Hooks y utilidades: useAnimation, Animate2D/Animate3D, easing, useTween.
- Loop por tiempo: componentes aceptan expresiones dependientes de t/endT en campos tipo función (fn/x/y/F/r/v/colorMap).
- Crosshair2D: alineación exacta bajo cualquier escala CSS; durante un drag/pan, las etiquetas numéricas pueden “congelarse” para facilitar lectura.

## Notas de precisión (puntero y escalado)

La conversión de coordenadas evento→SVG→mundo usa matrices SVG (getScreenCTM().inverse()) para que el puntero y overlays (crosshair/labels) coincidan incluso con transformaciones CSS (scale). Esto evita desajustes entre tooltip/crosshair y el cursor.

## Tipos y build

- Paquete incluye .d.ts en dist para TypeScript.
- Peer deps: react y react-dom >= 18.
- Construcción local: `npm run build` (usa tsup).

## Lista de exportaciones

```ts
// 2D
Plot2D, Axes2D, Function2D, Parametric2D, Polyline2D, Polygon2D, Area2D, Line,
Ray2D, Bezier2D, Scatter2D, Point2D, Vector2D, VectorField2D, Heatmap2D,
Implicit2D, Contour2D, PolarFunction2D, AngleMarker, DistanceMarker, Arc, Circle,
Label, Title2D, Legend2D, Image2D, LinearGradient2D, RadialGradient2D, Crosshair2D,
NumberLine,

// 3D
Plot3D, Axes3D, Grid3D, Box3D, Sphere3D, Torus3D, Cylinder3D, Cone3D,
Surface3D, ParametricSurface3D, Scatter3D, Label3D, Legend3D, Group3D,

// Animación y utilidades
useAnimation, Animate2D, Animate3D, useTween, easing
```

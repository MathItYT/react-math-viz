# react-math-viz

Pequeña librería React para visualización 2D (SVG + overlay HTML para labels):
- Ejes cartesianos con grid y labels como ReactNode.
- Curvas paramétricas (x(t), y(t)).
- Polígonos.

## Uso

Instala tus herramientas preferidas (p. ej., tsup o vite) y construye desde `src/`.

Ejemplo rápido (TypeScript):

```tsx
import { Plot2D, Axes2D, Parametric2D, Polygon2D } from "react-math-viz";

<Plot2D width={700} height={450} xRange={[-10,10]} yRange={[-6,6]}>
  <Axes2D grid renderXLabel={(x)=> <span>{x}</span>} renderYLabel={(y)=> <span>{y}</span>} />
  <Parametric2D x={(t)=>t} y={(t)=>0.5*Math.sin(t)} tRange={[-12.56,12.56]} />
  <Polygon2D points={[[-7,-2],[-3,3],[-1,-4]]} />
</Plot2D>
```


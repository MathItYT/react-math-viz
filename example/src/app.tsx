import React from 'react';
import { createRoot } from 'react-dom/client';
// @ts-ignore - use CDN ESM at runtime
import katex from 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.mjs';
// @ts-ignore - served by Express at runtime
import { Plot2D, Axes2D, Arc, Circle, Label, Line, Function2D, Point2D, Scatter2D, Ray2D, Vector2D, Polygon2D, Polyline2D, Bezier2D, Area2D, RiemannSum, TangentLine, NormalLine, AngleMarker, DistanceMarker, VectorField2D, Heatmap2D, Contour2D, PolarFunction2D, Crosshair2D, Legend2D, Title2D, Plot3D, Axes3D, Grid3D, Box3D, Sphere3D, Label3D, Legend3D, Torus3D, Cylinder3D, Cone3D, Surface3D, ParametricSurface3D, Scatter3D, Group3D, Animate2D, Animate3D, useAnimation, LinearGradient2D, RadialGradient2D, Image2D } from '/lib/index.js';
import { AutoSizer } from './Responsive.js';

const App: React.FC = () => {
  // Ángulo para la circunferencia unitaria
  const [theta, setTheta] = React.useState(30 / 180 * Math.PI);
  // Controles para demos
  const [x0, setX0] = React.useState(0.7);
  const [nRects, setNRects] = React.useState(8);
  const xTheta = Math.cos(theta);
  const yTheta = Math.sin(theta);
  const f = React.useCallback((x:number) => Math.sin(x), []);
  // Animations hooks (used later in the Animaciones section)
  const anim2D = (useAnimation as any)?.({ autoplay: true, speed: 1 });
  const anim3D = (useAnimation as any)?.({ autoplay: true, speed: 0.8 });
  // Stable random sphere for Scatter3D (avoid regenerating every render)
  const spherePts = React.useMemo<[number, number, number][]>(() => {
    const pts: [number, number, number][] = [];
    const N = 2500;
    for (let i = 0; i < N; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 1.6 + (Math.random() * 0.08 - 0.04);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);
      pts.push([x, y, z]);
    }
    return pts;
  }, []);
  const sphereColorMap = React.useCallback((x:number,_y:number,z:number,_i:number) => {
    const h = Math.floor((Math.atan2(z, x) / (2 * Math.PI) + 0.5) * 360);
    return `hsl(${h}, 80%, 55%)`;
  }, []);
  return (
    <div className="mx-auto max-w-[1100px] p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">¿Qué son las funciones trigonométricas?</h1>
      </header>

      {/* 1) Circunferencia unitaria (no draggable) */}
      <div className="rounded border bg-white p-3">
        <h2 className="font-semibold mb-2">¿De dónde viene el seno? Circunferencia unitaria</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full">
            <AutoSizer aspect={1}>
              {(w,h)=> (
            <Plot2D width={w} height={h} xRange={[-1.4, 1.4]} yRange={[-1.4, 1.4]} pannable={false} zoomable={false} pinchZoomable={false}>
              <Axes2D grid={{ stroke: '#9aa0a6', strokeWidth: 1, opacity: 0.18 }} gridXDelta={0.5} gridYDelta={0.5}
                renderXLabel={(x:number)=>null} renderYLabel={(y:number)=>null} />
              {/* Circunferencia unitaria */}
              <Circle cx={0} cy={0} r={1} stroke="#111" strokeWidth={1.5} />
              {/* Arco del ángulo */}
              <Arc cx={0} cy={0} r={0.35} a0={0} a1={theta} stroke="#ef4444" strokeWidth={2} fill="#ef4444" fillOpacity={0.15} />
              {/* Triángulo rectángulo: base en el eje X y cateto vertical hasta el punto */}
              {(() => { const [a,b] = xTheta >= 0 ? [0, xTheta] : [xTheta, 0];
                return <Line x1={a} y1={0} x2={b} y2={0} stroke="#2563eb" strokeWidth={2} />; })()}
              {(() => { const [a,b] = yTheta >= 0 ? [0, yTheta] : [yTheta, 0];
                return <Line x1={xTheta} y1={a} x2={xTheta} y2={b} stroke="#2563eb" strokeWidth={2} />; })()}
              {/* Radio hasta el punto */}
              <Line x1={0} y1={0} x2={xTheta} y2={yTheta} stroke="#ef4444" strokeWidth={2} />
              {/* Punto en la circunferencia */}
              <Circle cx={xTheta} cy={yTheta} r={0.03} fill="#2563eb" />
              {/* Etiquetas cos y sin */}
              <Label x={xTheta/2} y={-0.06} vAlign="top">
                <span dangerouslySetInnerHTML={{__html:katex.renderToString('\\cos(\\theta)')}} />
              </Label>
              <Label x={xTheta + (xTheta>=0?0.06:-0.06)} y={yTheta/2} align={xTheta>=0?"left":"right"}>
                <span dangerouslySetInnerHTML={{__html:katex.renderToString('\\sin(\\theta)')}} />
              </Label>
              {/* Etiqueta theta (más separada del arco) */}
              <Label x={0.39*Math.cos(theta/2)} y={0.39*Math.sin(theta/2)} dx={8*Math.cos(theta/2)} dy={-8*Math.sin(theta/2)}>
                <span dangerouslySetInnerHTML={{__html: katex.renderToString('\\theta')}} />
              </Label>
            </Plot2D>
              )}
            </AutoSizer>
            <div className="mt-3 flex items-center gap-3">
              <input className="w-72 accent-blue-600" type="range" min={-2*Math.PI} max={2*Math.PI} step={0.01} value={theta} onChange={e=>setTheta(parseFloat(e.target.value))} />
              <span className="text-sm text-gray-600 leading-6" style={{whiteSpace:'nowrap'}}
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(`\\theta=${theta.toFixed(2)},\\ x=\\cos(\\theta)=${xTheta.toFixed(3)},\\ y=\\sin(\\theta)=${yTheta.toFixed(3)}`)
                }}
              />
            </div>
          </div>
          <div className="w-full text-sm leading-6 text-gray-700">
            <div dangerouslySetInnerHTML={{__html: katex.renderToString('\\text{En la circunferencia unitaria, } x=\\cos(\\theta),\\ y=\\sin(\\theta).',{throwOnError:false})}} />
            <p className="mt-2">Mueve el deslizador para variar el ángulo y ver cómo cambian las coordenadas del punto sobre la circunferencia.</p>
          </div>
        </div>
      </div>

      {/* 10) Fondos recortados: gradientes e imagen */}
      <div className="rounded border bg-white p-3">
        <h2 className="font-semibold mb-2">Fondos recortados: gradientes e imagen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LinearGradient2D con una estrella */}
          <div className="w-full">
            <AutoSizer aspect={0.714}>
              {(w,h)=> (
            <Plot2D width={w} height={h} xRange={[-2.2,2.2]} yRange={[-1.8,1.8]} pannable={true}>
              <Axes2D grid={{ stroke: '#9aa0a6', strokeWidth: 1, opacity: 0.18 }} />
              {(() => {
                // Estrella de 5 puntas
                const R = 1.2, r = 0.5;
                const pts: [number,number][] = [];
                for (let i=0;i<10;i++) {
                  const ang = -Math.PI/2 + i*(Math.PI/5);
                  const rr = i%2===0 ? R : r;
                  pts.push([ rr*Math.cos(ang), rr*Math.sin(ang) ]);
                }
                const stops = [
                  { offset: 0, color: '#2563eb' },
                  { offset: 1, color: '#10b981' },
                ];
                return (
                  <LinearGradient2D stops={stops} reveal="stroke">
                    <Polygon2D points={pts} stroke="#000" fill="none" />
                  </LinearGradient2D>
                );
              })()}
              <Label x={0} y={-1.5}>
                <span className="text-gray-700">LinearGradient2D recortado por una estrella</span>
              </Label>
            </Plot2D>
              )}
            </AutoSizer>
          </div>
          {/* RadialGradient2D con círculo */}
          <div className="w-full">
            <AutoSizer aspect={0.714}>
              {(w,h)=> (
            <Plot2D width={w} height={h} xRange={[-2.2,2.2]} yRange={[-1.8,1.8]} pannable={true}>
              <Axes2D grid={{ stroke: '#9aa0a6', strokeWidth: 1, opacity: 0.18 }} />
              <RadialGradient2D stops={[{offset:0, color:'#f59e0b', opacity:0.95}, {offset:1, color:'#f59e0b', opacity:0.05}]} r={1.0}>
                <Circle cx={0} cy={0} r={1.0} fill="#000" />
              </RadialGradient2D>
              <Label x={0} y={-1.5}>
                <span className="text-gray-700">RadialGradient2D recortado por un círculo</span>
              </Label>
            </Plot2D>
              )}
            </AutoSizer>
          </div>
          {/* Image2D dentro de un polígono */}
          <div className="w-full">
            <AutoSizer aspect={0.714}>
              {(w,h)=> (
            <Plot2D width={w} height={h} xRange={[-3.2,3.2]} yRange={[-2.2,2.2]} pannable={true}>
              <Axes2D grid={{ stroke: '#9aa0a6', strokeWidth: 1, opacity: 0.18 }} />
              {(() => {
                const poly: [number,number][] = [[-2,-0.6],[-1.2,1.2],[0.2,1.0],[1.4,0.2],[2.2,-1.2],[-0.4,-1.5]];
                return (
                  <Image2D href="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Fronalpstock_big.jpg/1280px-Fronalpstock_big.jpg" imageX={-2} imageY={2} imageWidth={8.88} imageHeight={4}>
                    <Polygon2D points={poly} fill="#000" />
                  </Image2D>
                );
              })()}
              <Label x={0} y={-1.9}>
                <span className="text-gray-700">Image2D recortada por un polígono</span>
              </Label>
            </Plot2D>
              )}
            </AutoSizer>
          </div>
          <div className="w-full text-sm leading-6 text-gray-700">
            <p>
              Estos componentes aplican fondos de gradiente o imágenes y los recortan por cualquier contenido SVG que entregues como hijos.
              Las etiquetas HTML (<code>Label</code>) funcionan como overlay y no forman parte del recorte, por compatibilidad de SVG.
            </p>
          </div>
        </div>
      </div>

      {/* 2) Funciones y cálculo: f(x), tangente, normal, área y Riemann */}
      <div className="rounded border bg-white p-3">
        <h2 className="font-semibold mb-2">Funciones y cálculo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full">
            <AutoSizer aspect={0.714}>
              {(w,h)=> (
            <Plot2D width={w} height={h} xRange={[-3.5, 3.5]} yRange={[-2, 2]} pannable={true}>
              <Title2D offsetY={0}>Funciones y cálculo</Title2D>
              <Axes2D grid={{ stroke: '#9aa0a6', strokeWidth: 1, opacity: 0.18 }} />
              <Function2D f={f} xRange={[-10,10]} stroke="#2563eb" strokeWidth={2} />
              <Area2D f={f} a={-Math.PI/2} b={Math.PI/2} fill="rgba(37,99,235,0.15)" stroke="#2563eb" />
              <RiemannSum f={f} a={-Math.PI/2} b={Math.PI/2} n={nRects} method="mid" fill="rgba(37,99,235,0.12)" stroke="#2563eb" />
              <TangentLine f={f} x0={x0} color="#ef4444" />
              <NormalLine f={f} x0={x0} color="#10b981" />
              <Point2D x={x0} y={f(x0)} r={3} fill="#ef4444" />
              <Legend2D items={[
                { label: <span dangerouslySetInnerHTML={{__html:katex.renderToString('f(x)=\\sin(x)')}} />, color:'#2563eb' },
                { label: 'Área', marker:<div style={{width:14,height:8,background:'rgba(37,99,235,0.15)', border:'1px solid #2563eb'}} /> },
                { label: 'Tangente', color:'#ef4444' },
                { label: 'Normal', color:'#10b981' },
              ]} position="top-right" />
              <Crosshair2D />
            </Plot2D>
              )}
            </AutoSizer>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <label className="text-sm text-gray-700 flex items-center gap-2">x₀
                <input className="w-56 accent-blue-600" type="range" min={-3.5} max={3.5} step={0.01} value={x0} onChange={e=>setX0(parseFloat(e.target.value))} />
              </label>
              <label className="text-sm text-gray-700 flex items-center gap-2">n
                <input className="w-40 accent-blue-600" type="range" min={2} max={40} step={1} value={nRects} onChange={e=>setNRects(parseInt(e.target.value))} />
              </label>
              <span className="text-sm text-gray-600 leading-6" dangerouslySetInnerHTML={{__html:katex.renderToString(`x_0=${x0.toFixed(2)},\\ f(x_0)=${f(x0).toFixed(3)},\\ n=${nRects}`)}} />
            </div>
          </div>
          <div className="w-full text-sm leading-6 text-gray-700">
            <p>Ejemplo con y = sin(x): curva, rectángulos de Riemann, área entre −π/2 y π/2, y rectas tangente (roja) y normal (verde) en x₀.</p>
          </div>
        </div>
      </div>

      {/* 3) Scatter2D y marcador personalizado */}
      <div className="rounded border bg-white p-3">
        <h2 className="font-semibold mb-2">Scatter2D y marcadores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full">
            {(() => {
              const pts = Array.from({length: 25}, (_,i)=>{
                const x = -2 + 4*(i/24);
                return [x, Math.sin(2*x)*0.8] as [number,number];
              });
              return (
                <AutoSizer aspect={0.714}>
                  {(w,h)=> (
                <Plot2D width={w} height={h} xRange={[-2.2,2.2]} yRange={[-1.6,1.6]} pannable={true}>
                  <Axes2D grid={{ stroke: '#9aa0a6', strokeWidth: 1, opacity: 0.18 }} />
                  <Function2D f={(x)=>Math.sin(2*x)*0.8} xRange={[-10,10]} stroke="#64748b" strokeDasharray="4 4" />
                  {/* Marcadores por defecto (círculo) */}
                  <Scatter2D points={pts} r={3} fill="#2563eb" />
                  {/* Marcadores personalizados: rombo */}
                  <Scatter2D points={pts} renderPoint={({i})=> (
                    <rect x={-4} y={-4} width={8} height={8} transform="rotate(45)" fill="none" stroke="#16a34a" strokeWidth={2} opacity={0.9} />
                  )} />
                  <Crosshair2D showLabels={false} />
                </Plot2D>
                  )}
                </AutoSizer>
              );
            })()}
          </div>
          <div className="w-full text-sm leading-6 text-gray-700">
            <p>Por defecto los puntos son círculos. También puedes pasar un renderizador personalizado para dibujar cualquier SVG en cada punto (aquí, rombos verdes).</p>
          </div>
        </div>
      </div>

      {/* 4) Vectores, rayos, polilíneas y Bézier */}
      <div className="rounded border bg-white p-3">
        <h2 className="font-semibold mb-2">Vectores, rayos, polilíneas y Bézier</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full">
            <AutoSizer aspect={0.714}>
              {(w,h)=> (
            <Plot2D width={w} height={h} xRange={[-2.5,2.5]} yRange={[-2,2]} pannable={true}>
              <Axes2D grid={{ stroke: '#9aa0a6', strokeWidth: 1, opacity: 0.18 }} />
              <Vector2D x1={0} y1={0} x2={1.4} y2={1} stroke="#ef4444" fillHead="#ef4444" />
              <Ray2D from={[-2,-1]} through={[0.5,0.2]} stroke="#2563eb" strokeDasharray="6 4" />
              <Polyline2D points={[[-2,0.6],[-1,0.2],[-0.2,0.7],[0.6,-0.2],[1.8,0.4]]} stroke="#0ea5e9" />
              <Bezier2D kind="quadratic" p0={[-2,-1]} p1={[-0.5,1.2]} p2={[1.5,-0.6]} stroke="#10b981" />
              <Bezier2D kind="cubic" p0={[-1.5,-0.5]} p1={[-1,1.2]} p2={[0.8,1.2]} p3={[1.8,-0.2]} stroke="#a855f7" />
            </Plot2D>
              )}
            </AutoSizer>
          </div>
          <div className="w-full text-sm leading-6 text-gray-700">
            <p>Demostración de un vector con flecha, un rayo recortado al viewport, una polilínea y curvas de Bézier cuadrática y cúbica.</p>
          </div>
        </div>
      </div>

      {/* 5) Marcadores: ángulo y distancia */}
      <div className="rounded border bg-white p-3">
        <h2 className="font-semibold mb-2">Marcadores geométricos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full">
            <AutoSizer aspect={0.714}>
              {(w,h)=> (
            <Plot2D width={w} height={h} xRange={[-2,2]} yRange={[-1.5,1.5]} pannable={true}>
              <Axes2D grid={{ stroke: '#9aa0a6', strokeWidth: 1, opacity: 0.18 }} />
              <AngleMarker center={[0,0]} a={[1,0]} b={[0.5,1]} r={0.5} stroke="#f59e0b" strokeWidth={2} fill="#f59e0b" />
              <Line x1={0} y1={0} x2={1} y2={0} stroke="#f59e0b" />
              <Line x1={0} y1={0} x2={0.5} y2={1} stroke="#f59e0b" />
              <DistanceMarker x1={-1} y1={-1} x2={1} y2={-1} tickSize={10} stroke="#0ea5e9" strokeWidth={2}
                label={<span dangerouslySetInnerHTML={{__html:katex.renderToString('d')}} />} labelOffsetPx={14} />
            </Plot2D>
              )}
            </AutoSizer>
          </div>
          <div className="w-full text-sm leading-6 text-gray-700">
            <p>Ángulo entre dos radios desde el origen y un medidor de distancia con marcas finales y etiqueta.</p>
          </div>
        </div>
      </div>

      {/* 6) Avanzados: Campo vectorial */}
      <div className="rounded border bg-white p-3">
        <h2 className="font-semibold mb-2">Campo vectorial</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full">
            <AutoSizer aspect={0.714}>
              {(w,h)=> (
            <Plot2D width={w} height={h} xRange={[-3,3]} yRange={[-3,3]} pannable={true}>
              <Axes2D grid={{ stroke: '#9aa0a6', strokeWidth: 1, opacity: 0.18 }} />
              <VectorField2D v={(x:number,y:number)=>({vx:-y, vy:x})} countX={17} countY={13} normalize={true} color="#374151" mode="world" origin={[0,0]} />
            </Plot2D>
              )}
            </AutoSizer>
          </div>
          <div className="w-full text-sm leading-6 text-gray-700">
            <p>Campo rotacional v(x,y)=(-y, x) muestreado en una grilla y normalizado para una longitud uniforme.</p>
          </div>
        </div>
      </div>

      {/* 7) Avanzados: Heatmap y Contornos */}
      <div className="rounded border bg-white p-3">
        <h2 className="font-semibold mb-2">Heatmap y Contornos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full">
            <AutoSizer aspect={0.714}>
              {(w,h)=> (
            <Plot2D width={w} height={h} xRange={[-3.5,3.5]} yRange={[-2.5,2.5]} pannable={true}>
              <Axes2D grid={{ stroke: '#9aa0a6', strokeWidth: 1, opacity: 0.18 }} />
              {(() => {
                const g = (x:number,y:number)=> Math.sin(x)*Math.cos(y) + 0.2*Math.cos(2*x+1.5*y);
                return (
                  <>
                    <Heatmap2D f={g} countX={50} countY={36} mode="world" origin={[0,0]} opacity={0.85} />
                    <Contour2D countX={192} countY={144} F={g} levels={[-0.8,-0.4,0,0.4,0.8]} colors={["#0ea5e9","#22c55e","#000","#f59e0b","#ef4444"]} strokeWidth={1.2} />
                    <Legend2D position="bottom-right" items={[{label:'Heatmap', marker:<div style={{width:14,height:8,background:'linear-gradient(90deg,#000,#0ea5e9,#22c55e,#f59e0b,#ef4444)'}}/>},{label:'Contornos', color:'#000'}]} />
                    <Crosshair2D />
                  </>
                );
              })()}
            </Plot2D>
              )}
            </AutoSizer>
          </div>
          <div className="w-full text-sm leading-6 text-gray-700">
            <p>Mapa de calor de f(x,y)=sin(x)cos(y)+0.2cos(2x+1.5y), con curvas de nivel superpuestas.</p>
          </div>
        </div>
      </div>

      {/* 8) Avanzados: Función polar */}
      <div className="rounded border bg-white p-3">
        <h2 className="font-semibold mb-2">Curva polar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full">
            <AutoSizer aspect={0.714}>
              {(w,h)=> (
            <Plot2D width={w} height={h} xRange={[-2.2,2.2]} yRange={[-2.2,2.2]} pannable={true}>
              <Axes2D grid={{ stroke: '#9aa0a6', strokeWidth: 1, opacity: 0.18 }} renderXLabel={()=>null} renderYLabel={()=>null} />
              <PolarFunction2D r={(t:number)=> 1 + 0.4*Math.cos(5*t)} thetaRange={[0, 2*Math.PI]} stroke="#dc2626" />
            </Plot2D>
              )}
            </AutoSizer>
          </div>
          <div className="w-full text-sm leading-6 text-gray-700">
            <p>Ejemplo polar r(θ)=1+0.4cos(5θ) convertido a coordenadas XY con un envolvente suave.</p>
          </div>
        </div>
      </div>

      {/* 9) Sin ejes 2D */}
      <div className="rounded border bg-white p-3">
        <h2 className="font-semibold mb-2">Ejemplos sin ejes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full space-y-4">
            <AutoSizer aspect={0.524}>
              {(w,h)=> (
            <Plot2D width={w} height={h} xRange={[-3.5, 3.5]} yRange={[-2, 2]} pannable={true}>
              <Title2D offsetY={0}><span dangerouslySetInnerHTML={{__html: katex.renderToString('f(x)=\\sin(x)')}} /></Title2D>
              <Function2D f={f} xRange={[-10,10]} stroke="#2563eb" strokeWidth={2} />
              <Area2D f={f} a={-Math.PI/2} b={Math.PI/2} fill="rgba(37,99,235,0.15)" stroke="#2563eb" />
              <TangentLine f={f} x0={x0} color="#ef4444" />
              <NormalLine f={f} x0={x0} color="#10b981" />
              <Point2D x={x0} y={f(x0)} r={3} fill="#ef4444" />
            </Plot2D>
              )}
            </AutoSizer>

            {(() => {
              const pts = Array.from({length: 25}, (_,i)=>{
                const x = -2 + 4*(i/24);
                return [x, Math.sin(2*x)*0.8] as [number,number];
              });
              return (
                <AutoSizer aspect={0.524}>
                  {(w,h)=> (
                <Plot2D width={w} height={h} xRange={[-2.2,2.2]} yRange={[-1.6,1.6]} pannable={true}>
                  <Title2D offsetY={0}>Marcadores sin ejes</Title2D>
                  <Function2D f={(x)=>Math.sin(2*x)*0.8} xRange={[-10,10]} stroke="#64748b" strokeDasharray="4 4" />
                  <Scatter2D points={pts} r={3} fill="#2563eb" />
                  <Scatter2D points={pts} renderPoint={({i})=> (
                    <rect x={-4} y={-4} width={8} height={8} transform="rotate(45)" fill="none" stroke="#16a34a" strokeWidth={2} opacity={0.9} />
                  )} />
                </Plot2D>
                  )}
                </AutoSizer>
              );
            })()}

          </div>
          <div className="w-full text-sm leading-6 text-gray-700">
            <p>Estas demos muestran el lienzo limpio: sin ejes, ticks ni grillas; útil para presentaciones o piezas visuales. Aún puedes desplazar y hacer zoom.</p>
          </div>
        </div>
      </div>

      {/* 10) Objetos 3D */}
      <div className="rounded border bg-white p-3">
        <h2 className="font-semibold mb-2">Objetos 3D</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full">
            <AutoSizer aspect={0.762}>
              {(w,h)=> (
            <Plot3D width={w} height={h} background="#ffffff" camera={{ position:[-4,3,6], lookAt:[0,0,0] }}>
              <Axes3D size={2.5} thickness={0.06} negativeArrows={false} />
              <Grid3D size={10} divisions={20} />
              {/* Primitivas */}
              <Box3D size={[1.2, 0.8, 1.0]} position={[1.2, 0.4, 0]} color={0xef4444} />
              <Sphere3D radius={0.6} position={[-1.0, 0.6, 0]} color={0x10b981} />
              <Torus3D radius={0.7} tube={0.18} position={[0, 0.5, -1.0]} color={0x9333ea} />
              <Cylinder3D radiusTop={0.25} radiusBottom={0.25} height={1.0} position={[-1.6, 0.5, -0.8]} rotation={[Math.PI/2, 0, 0]} color={0x64748b} />
              <Cone3D radius={0.35} height={1.0} position={[1.8, 0.5, -1.0]} rotation={[Math.PI/2, 0.2, 0]} color={0xf59e0b} />
              {/* Labels en puntas positivas */}
              {(() => { const S = 2.5; return (
                <>
                  <Label3D position={[ S, 0, 0 ]} align="left" vAlign="middle" dx={8}>
                    <span style={{color:'#ef4444', fontWeight:600}}>X</span>
                  </Label3D>
                  <Label3D position={[ 0, S, 0 ]} align="center" vAlign="bottom" dy={-8}>
                    <span style={{color:'#16a34a', fontWeight:600}}>Y</span>
                  </Label3D>
                  <Label3D position={[ 0, 0, S ]} align="left" vAlign="middle" dx={8}>
                    <span style={{color:'#2563eb', fontWeight:600}}>Z</span>
                  </Label3D>
                </>
              ); })()}
              {/* Leyenda 3D */}
              <Legend3D position="top-right" items={[
                { label: 'X', color:'#ef4444' },
                { label: 'Y', color:'#16a34a' },
                { label: 'Z', color:'#2563eb' },
                { label: 'Caja', color:'#ef4444' },
                { label: 'Esfera', color:'#10b981' },
                { label: 'Toro', color:'#9333ea' },
                { label: 'Cilindro', color:'#64748b' },
                { label: 'Cono', color:'#f59e0b' },
              ]} />
            </Plot3D>
              )}
            </AutoSizer>
          </div>
          <div className="w-full text-sm leading-6 text-gray-700">
            <p>Escena 3D con ejes (RGB = X,Y,Z), grilla y varias primitivas: caja, esfera, toro, cilindro y cono.</p>
          </div>
        </div>
      </div>

      {/* 11) Superficies 3D: z = f(x, y) y paramétricas (UV) */}
      <div className="rounded border bg-white p-3">
        <h2 className="font-semibold mb-2">Superficies 3D: z = f(x, y) y UV</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full">
            <AutoSizer aspect={0.762}>
              {(w,h)=> (
            <Plot3D width={w} height={h} background="#ffffff" camera={{ position:[-5,4,6], lookAt:[0,0,0] }}>
              <Axes3D size={3} thickness={0.05} negativeArrows={false} />
              <Grid3D size={12} divisions={24} />
              {(() => {
                const fz = (x:number,y:number) => {
                  const r = Math.sqrt(x*x + y*y) + 1e-6;
                  return Math.sin(r*2) / r; // tipo sinc radial
                };
                const cmap = (x:number,y:number,z:number) => {
                  const t = Math.max(0, Math.min(1, (z + 1) / 2));
                  const r = Math.floor(37 + 200*t);
                  const g = Math.floor(99 + 120*t);
                  const b = Math.floor(235 - 200*t);
                  return `rgb(${r},${g},${b})`;
                };
                return (
                  <Surface3D xRange={[-3,3]} yRange={[-3,3]} xSegments={100} ySegments={80} f={fz} colorMap={cmap} doubleSided />
                );
              })()}
            </Plot3D>
              )}
            </AutoSizer>
          </div>
          <div className="w-full">
            <AutoSizer aspect={0.762}>
              {(w,h)=> (
            <Plot3D width={w} height={h} background="#ffffff" camera={{ position:[-5,4,6], lookAt:[0,0,0] }}>
              <Axes3D size={3} thickness={0.05} negativeArrows={false} />
              <Grid3D size={12} divisions={24} />
              {(() => {
                // Banda de Möbius paramétrica
                const mobius = (u:number, v:number):[number,number,number] => {
                  const R = 1.6;
                  const uu = u; const vv = v;
                  const x = (R + vv*Math.cos(uu/2)) * Math.cos(uu);
                  const y = (R + vv*Math.cos(uu/2)) * Math.sin(uu);
                  const z = vv * Math.sin(uu/2);
                  return [x,y,z];
                };
                const cmap = (u:number,v:number,x:number,y:number,z:number) => {
                  const t = (u % (2*Math.PI)) / (2*Math.PI);
                  return `hsl(${Math.floor(240*(1-t))}, 80%, 55%)`;
                };
                return (
                  <ParametricSurface3D uRange={[0, 2*Math.PI]} vRange={[-0.3, 0.3]} uSegments={200} vSegments={36} f={mobius} colorMap={cmap} doubleSided />
                );
              })()}
            </Plot3D>
              )}
            </AutoSizer>
          </div>
          <div className="w-full text-sm leading-6 text-gray-700">
            <p>Ejemplos de superficies: una gráfica z=f(x,y) con color por altura y una superficie paramétrica (banda de Möbius) coloreada por u.</p>
          </div>
        </div>
      </div>

      {/* 12) Scatter 3D con colormap */}
      <div className="rounded border bg-white p-3">
        <h2 className="font-semibold mb-2">Scatter 3D con colormap</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full">
            <AutoSizer aspect={0.762}>
              {(w,h)=> (
            <Plot3D width={w} height={h} background="#ffffff" camera={{ position:[-4,3,6], lookAt:[0,0,0] }}>
              <Axes3D size={3} thickness={0.05} negativeArrows={false} />
              <Grid3D size={12} divisions={24} />
              {(() => {
                // Muestra puntos sampleando z=f(x,y) con rejilla regular y color por z
                const pts: [number, number, number][] = [];
                for (let j=0;j<=40;j++) {
                  const y = -3 + 6*(j/40);
                  for (let i=0;i<=40;i++) {
                    const x = -3 + 6*(i/40);
                    const z = Math.sin(x)*Math.cos(y);
                    pts.push([x, z, y]); // y al eje Z de world para quedar sobre XZ grid
                  }
                }
                const cmap = (x:number,y:number,z:number) => {
                  const t = Math.max(0, Math.min(1, (y + 1) / 2)); // usamos 'y' que es Z real de función
                  const r = Math.floor(37 + 200*t);
                  const g = Math.floor(99 + 120*t);
                  const b = Math.floor(235 - 200*t);
                  return `rgb(${r},${g},${b})`;
                };
                return <Scatter3D points={pts} size={5} colorMap={(X,Y,Z,i)=>cmap(X,Y,Z)} />;
              })()}
            </Plot3D>
              )}
            </AutoSizer>
          </div>
          <div className="w-full">
            {/* Versión sin ejes */}
            <AutoSizer aspect={0.762}>
              {(w,h)=> (
            <Plot3D width={w} height={h} background="#ffffff" camera={{ position:[-4,3,6], lookAt:[0,0,0] }}>
              {/* Esfera de puntos con color HSL por ángulo polar; sin ejes ni grilla */}
              <Scatter3D points={spherePts} size={4} colorMap={sphereColorMap} />
            </Plot3D>
              )}
            </AutoSizer>
          </div>
          <div className="w-full text-sm leading-6 text-gray-700">
            <p>Izquierda: puntos sobre z=sin(x)cos(y) coloreados por altura. Derecha: nube esférica sin ejes, coloreada por ángulo.</p>
          </div>
        </div>
      </div>

      {/* 13) Animaciones */}
      <div className="rounded border bg-white p-3">
        <h2 className="font-semibold mb-2">Animaciones</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 2D: punto moviéndose en la circunferencia unitaria */}
          <div className="w-full">
            <AutoSizer aspect={1}>
              {(w,h)=> {
                const tt = anim2D?.t ?? 0;
                const cx = Math.cos(tt);
                const cy = Math.sin(tt);
                return (
                  <Plot2D width={w} height={h} xRange={[-1.4,1.4]} yRange={[-1.4,1.4]} pannable={false}>
                    <Title2D offsetY={0}>Punto animado: (cos t, sin t)</Title2D>
                    <Axes2D grid={{ stroke:'#9aa0a6', strokeWidth:1, opacity:0.18 }} renderXLabel={()=>null} renderYLabel={()=>null} />
                    <Circle cx={0} cy={0} r={1} stroke="#111" />
                    <Line x1={0} y1={0} x2={cx} y2={cy} stroke="#ef4444" />
                    <Point2D x={cx} y={cy} r={4} fill="#2563eb" />
                    <Label x={cx} y={cy} align={cx>=0?"left":"right"} dx={cx>=0?6:-6}>
                      <span>t={(tt).toFixed(2)}</span>
                    </Label>
                  </Plot2D>
                );
              }}
            </AutoSizer>
            <div className="mt-3 flex items-center gap-3">
              <button className="px-3 py-1 rounded bg-blue-600 text-white text-sm" onClick={()=>anim2D?.play?.()}>Play</button>
              <button className="px-3 py-1 rounded bg-gray-200 text-gray-800 text-sm" onClick={()=>anim2D?.stop?.()}>Stop</button>
            </div>

            <Demo2DAnimations />
          </div>

          {/* 3D: esfera orbitando en el plano XZ */}
          <div className="w-full">
            <AutoSizer aspect={0.762}>
              {(w,h)=> {
                const t3 = anim3D?.t ?? 0;
                const R = 1.8;
                const px = Math.cos(t3)*R;
                const pz = Math.sin(t3)*R;
                return (
                  <Plot3D width={w} height={h} background="#ffffff" camera={{ position:[-5,4,6], lookAt:[0,0,0] }}>
                    <Axes3D size={2.5} thickness={0.05} negativeArrows={false} />
                    <Grid3D size={10} divisions={20} />
                    <Sphere3D radius={0.4} position={[px, 0.0, pz]} color={0x2563eb} />
                    {/* Orientamos el toro al plano XZ para coincidir con la órbita */}
                    <Torus3D radius={R} tube={0.01} rotation={[Math.PI/2, 0, 0]} color={0x64748b} />
                  </Plot3D>
                );
              }}
            </AutoSizer>
            <div className="mt-3 flex items-center gap-3">
              <button className="px-3 py-1 rounded bg-blue-600 text-white text-sm" onClick={()=>anim3D?.play?.()}>Play</button>
              <button className="px-3 py-1 rounded bg-gray-200 text-gray-800 text-sm" onClick={()=>anim3D?.stop?.()}>Stop</button>
            </div>
          </div>

          {/* 3D: crear/destruir/transformar */}
          <Demo3DAnimations />
        </div>
      </div>

      <footer className="text-xs text-gray-500">Creado por MathItYT.</footer>
    </div>
  );
};

// --------- Subcomponents for animation demos ---------
function Demo2DAnimations() {
  const [showObj, setShowObj] = React.useState(false);
  const [isDisappearing, setIsDisappearing] = React.useState(false);
  const [transformOn, setTransformOn] = React.useState(false);
  const [createTick, setCreateTick] = React.useState(0);
  const D = 700; // ms

  React.useEffect(() => {
    if (!isDisappearing) return;
    const id = setTimeout(() => { setShowObj(false); setIsDisappearing(false); }, D + 20);
    return () => clearTimeout(id);
  }, [isDisappearing]);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3 mb-2">
        <button className="px-3 py-1 rounded bg-emerald-600 text-white text-sm" onClick={()=>{ console.log('[2D] Crear'); setShowObj(true); setIsDisappearing(false); setCreateTick(t=>t+1); }}>
          Crear
        </button>
        <button className="px-3 py-1 rounded bg-rose-600 text-white text-sm" onClick={()=>{ console.log('[2D] Destruir'); if (showObj) setIsDisappearing(true); }}>
          Destruir
        </button>
        <button className="px-3 py-1 rounded bg-indigo-600 text-white text-sm" onClick={()=> { console.log('[2D] Transformar toggle'); setTransformOn(v=>!v); }}>
          {transformOn ? 'Detener transformación' : 'Transformar'}
        </button>
      </div>
      <AutoSizer aspect={1}>
        {(w,h)=> (
          <Plot2D width={w} height={h} xRange={[-1.5,1.5]} yRange={[-1.5,1.5]} pannable={false}>
            <Axes2D grid={{ stroke:'#9aa0a6', strokeWidth:1, opacity:0.18 }} renderXLabel={()=>null} renderYLabel={()=>null} />
            {/* Crear/Destruir */}
            {showObj && (
              <Animate2D type={isDisappearing ? 'disappear' : 'appear'} duration={D} replayKey={createTick}>
                <g>
                  <circle cx={0.6} cy={0.6} r={0.08} fill="#2563eb" />
                </g>
              </Animate2D>
            )}
            {/* Transformar: rombo verde */}
            <Animate2D type="transform" from={{x:-0.8}} to={{x:0.8}} duration={1200} easing="easeInOutSine" autoplay={transformOn} loop yoyo>
              <g>
                <rect x={-0.08} y={-0.08} width={0.16} height={0.16} transform="rotate(45)" fill="none" stroke="#16a34a" strokeWidth={0.02} opacity={0.95} />
              </g>
            </Animate2D>
          </Plot2D>
        )}
      </AutoSizer>
    </div>
  );
}

function Demo3DAnimations() {
  const [showObj, setShowObj] = React.useState(false);
  const [isDisappearing, setIsDisappearing] = React.useState(false);
  const [transformOn, setTransformOn] = React.useState(false);
  const [create3DTick, setCreate3DTick] = React.useState(0);
  const D = 1600; // ms (más largo para que la animación sea inconfundible)

  React.useEffect(() => {
    if (!isDisappearing) return;
    const id = setTimeout(() => { setShowObj(false); setIsDisappearing(false); }, D + 20);
    return () => clearTimeout(id);
  }, [isDisappearing]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-2">
        <button className="px-3 py-1 rounded bg-emerald-600 text-white text-sm" onClick={()=>{ console.log('[3D] Crear'); setShowObj(true); setIsDisappearing(false); setCreate3DTick(t=>t+1); }}>
          Crear 3D
        </button>
        <button className="px-3 py-1 rounded bg-rose-600 text-white text-sm" onClick={()=>{ console.log('[3D] Destruir'); if (showObj) setIsDisappearing(true); }}>
          Destruir 3D
        </button>
        <button className="px-3 py-1 rounded bg-indigo-600 text-white text-sm" onClick={()=> { console.log('[3D] Transformar toggle'); setTransformOn(v=>!v); }}>
          {transformOn ? 'Detener transformación 3D' : 'Transformar 3D'}
        </button>
      </div>
      <AutoSizer aspect={0.762}>
        {(w,h)=> (
          <Plot3D width={w} height={h} background="#ffffff" camera={{ position:[-4,3,6], lookAt:[0,0,0] }}>
            <Axes3D size={2.2} thickness={0.05} negativeArrows={false} />
            <Grid3D size={10} divisions={20} />
            {/* Crear/Destruir */}
            {showObj && (
              <Animate3D type={isDisappearing ? 'disappear' : 'appear'} duration={D} easing="easeInOutSine" replayKey={create3DTick}>
                <Group3D position={[0,0,0]}>
                  <Box3D size={[1, 0.6, 0.8]} position={[-1.0, 0.3, 0]} color={0xef4444} />
                  <Sphere3D radius={0.5} position={[1.0, 0.5, 0]} color={0x10b981} />
                </Group3D>
              </Animate3D>
            )}
            {/* Transformar */}
            <Animate3D type="transform" from={{ position:[-1.4, 0.4, 0] }} to={{ position:[1.4, 0.4, 0] }} duration={2200} easing="easeInOutSine" autoplay={transformOn} loop yoyo>
              <Group3D>
                <Torus3D radius={0.5} tube={0.12} rotation={[Math.PI/2, 0, 0]} color={0x64748b} />
                <Sphere3D radius={0.2} position={[0,0,0]} color={0x2563eb} />
              </Group3D>
            </Animate3D>
          </Plot3D>
        )}
      </AutoSizer>
    </div>
  );
}

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);

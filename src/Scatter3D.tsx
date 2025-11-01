import React from "react";
import { useThree } from "./threeContext";

export type Scatter3DProps = {
  points: Array<[number, number, number]>;
  color?: string | number; // base color if no per-point color
  colors?: Array<string | number>; // per-point colors (overrides colorMap)
  colorMap?: (x:number, y:number, z:number, i:number) => string | number; // used when colors not provided
  size?: number; // in pixels
  opacity?: number;
};

export function Scatter3D({ points, color = 0x3b82f6, colors, colorMap, size = 6, opacity = 1 }: Scatter3DProps) {
  const { THREE, scene } = useThree();
  const ptsRef = React.useRef<any>(null);

  const buildGeometry = React.useCallback(() => {
    if (!THREE) return null;
    const n = points?.length ?? 0;
    const pos = new Float32Array(n * 3);
    const useVertexColors = !!(colors?.length) || !!colorMap;
    const col = useVertexColors ? new Float32Array(n * 3) : null;
    for (let i=0; i<n; i++) {
      const [x,y,z] = points[i];
      const j = i*3;
      pos[j] = x; pos[j+1] = y; pos[j+2] = z;
      if (col) {
        const c = new THREE.Color(
          (colors && colors[i] !== undefined) ? (colors[i] as any) : (colorMap ? (colorMap(x,y,z,i) as any) : color as any)
        );
        col[j] = c.r; col[j+1] = c.g; col[j+2] = c.b;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    if (col) geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return { geo, vertexColors: !!col };
  }, [THREE, points, colors, colorMap, color]);

  React.useEffect(() => {
    if (!THREE || !scene) return;
    const built = buildGeometry(); if (!built) return;
    const mat = new THREE.PointsMaterial({
      color: (colors?.length || colorMap) ? 0xffffff : (color as any),
      vertexColors: !!(colors?.length || colorMap),
      size: size,
      sizeAttenuation: false,
      opacity,
      transparent: opacity < 1
    });
    const pointsObj = new THREE.Points(built.geo, mat);
    scene.add(pointsObj);
    ptsRef.current = pointsObj;
    return () => { scene.remove(pointsObj); built.geo.dispose(); mat.dispose(); };
  }, [THREE, scene]);

  React.useEffect(() => {
    const obj = ptsRef.current; if (!obj) return;
    const old = obj.geometry; const built = buildGeometry(); if (!built) return;
    obj.geometry = built.geo; obj.material.vertexColors = built.vertexColors;
    old?.dispose?.();
  }, [buildGeometry]);

  React.useEffect(() => {
    const obj = ptsRef.current; if (!obj || !THREE) return;
    obj.material.size = size;
    obj.material.opacity = opacity;
    obj.material.transparent = opacity < 1;
    if (!(colors?.length || colorMap)) {
      obj.material.color = new THREE.Color(color as any);
    }
    obj.material.needsUpdate = true;
  }, [size, opacity, color, colors?.length, !!colorMap, THREE]);

  return null;
}

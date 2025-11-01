import React from "react";
import { useThree } from "./threeContext";

export type ParametricSurface3DProps = {
  uRange: [number, number];
  vRange: [number, number];
  uSegments?: number;
  vSegments?: number;
  f: (u:number, v:number) => [number, number, number];
  color?: string | number;
  colorMap?: (u:number, v:number, x:number, y:number, z:number) => string | number;
  wireframe?: boolean;
  doubleSided?: boolean;
};

export function ParametricSurface3D({ uRange, vRange, uSegments=80, vSegments=30, f, color=0x0ea5e9, colorMap, wireframe=false, doubleSided=true }: ParametricSurface3DProps) {
  const { THREE, scene } = useThree();
  const meshRef = React.useRef<any>(null);

  const buildGeometry = React.useCallback(() => {
    if (!THREE) return null;
    const nu = Math.max(1, uSegments);
    const nv = Math.max(1, vSegments);
    const positions = new Float32Array((nu+1)*(nv+1)*3);
    const colors = colorMap ? new Float32Array((nu+1)*(nv+1)*3) : null;
    let idx = 0, cidx = 0;
    for (let j=0; j<=nv; j++) {
      const v = vRange[0] + (j/nv)*(vRange[1]-vRange[0]);
      for (let i=0; i<=nu; i++) {
        const u = uRange[0] + (i/nu)*(uRange[1]-uRange[0]);
        const [x,y,z] = f(u,v);
        positions[idx++] = x; positions[idx++] = y; positions[idx++] = z;
        if (colors) {
          const col = new THREE.Color(colorMap!(u,v,x,y,z) as any);
          colors[cidx++] = col.r; colors[cidx++] = col.g; colors[cidx++] = col.b;
        }
      }
    }
    const indices: number[] = [];
    for (let j=0; j<nv; j++) {
      for (let i=0; i<nu; i++) {
        const a = i + j*(nu+1);
        const b = (i+1) + j*(nu+1);
        const c = (i+1) + (j+1)*(nu+1);
        const d = i + (j+1)*(nu+1);
        indices.push(a,b,d, b,c,d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions,3));
    if (colors) geo.setAttribute('color', new THREE.BufferAttribute(colors,3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [THREE, uRange?.[0], uRange?.[1], vRange?.[0], vRange?.[1], uSegments, vSegments, f, colorMap]);

  React.useEffect(() => {
    if (!THREE || !scene) return;
    const geo = buildGeometry(); if (!geo) return;
    const mat = new THREE.MeshStandardMaterial({ color, wireframe, vertexColors: !!colorMap, side: doubleSided ? THREE.DoubleSide : THREE.FrontSide });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    meshRef.current = mesh;
    return () => { scene.remove(mesh); geo.dispose(); mat.dispose(); };
  }, [THREE, scene]);

  React.useEffect(() => {
    if (!meshRef.current) return;
    const old = meshRef.current.geometry; const geo = buildGeometry(); if (!geo) return;
    meshRef.current.geometry = geo; old?.dispose?.();
  }, [buildGeometry]);

  React.useEffect(() => {
    if (!meshRef.current || !THREE) return;
    const mat = meshRef.current.material;
    mat.color = new THREE.Color(color as any);
    mat.wireframe = wireframe;
    mat.vertexColors = !!colorMap;
    mat.side = doubleSided ? THREE.DoubleSide : THREE.FrontSide;
    mat.needsUpdate = true;
  }, [color, wireframe, colorMap, doubleSided, THREE]);

  return null;
}

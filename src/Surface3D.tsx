import React from "react";
import { useThree } from "./threeContext";

export type Surface3DProps = {
  xRange: [number, number];
  yRange: [number, number];
  xSegments?: number;
  ySegments?: number;
  f: (x:number, y:number) => number; // z=f(x,y)
  color?: string | number; // base color if no colorMap
  colorMap?: (x:number, y:number, z:number) => string | number; // per-vertex color
  wireframe?: boolean;
  doubleSided?: boolean;
};

export function Surface3D({ xRange, yRange, xSegments=64, ySegments=48, f, color=0x22c55e, colorMap, wireframe=false, doubleSided=true }: Surface3DProps) {
  const { THREE, scene } = useThree();
  const meshRef = React.useRef<any>(null);

  const buildGeometry = React.useCallback(() => {
    if (!THREE) return null;
    const nx = Math.max(1, xSegments);
    const ny = Math.max(1, ySegments);
    const nCols = nx + 1;
    const nRows = ny + 1;
    const positions = new Float32Array(nCols * nRows * 3);
    const colors = colorMap ? new Float32Array(nCols * nRows * 3) : null;

    let idx = 0, cidx = 0;
    for (let j=0; j<=ny; j++) {
      const v = j / ny;
      const y = yRange[0] + v * (yRange[1] - yRange[0]);
      for (let i=0; i<=nx; i++) {
        const u = i / nx;
        const x = xRange[0] + u * (xRange[1] - xRange[0]);
        const z = f(x, y);
        positions[idx++] = x;
        positions[idx++] = z;
        positions[idx++] = y;
        if (colors) {
          const col = new THREE.Color(colorMap!(x, y, z) as any);
          colors[cidx++] = col.r;
          colors[cidx++] = col.g;
          colors[cidx++] = col.b;
        }
      }
    }

    const indices: number[] = [];
    for (let j=0; j<ny; j++) {
      for (let i=0; i<nx; i++) {
        const a = i + j * (nx+1);
        const b = (i+1) + j * (nx+1);
        const c = (i+1) + (j+1) * (nx+1);
        const d = i + (j+1) * (nx+1);
        indices.push(a, b, d, b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setIndex(indices);
    if (colors) geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [THREE, xRange?.[0], xRange?.[1], yRange?.[0], yRange?.[1], xSegments, ySegments, f, colorMap]);

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

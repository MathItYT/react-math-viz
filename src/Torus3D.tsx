import React from "react";
import { useThree } from "./threeContext";

export type Torus3DProps = {
  radius?: number; // major radius
  tube?: number;   // tube radius
  radialSegments?: number;
  tubularSegments?: number;
  arc?: number;
  position?: [number, number, number];
  color?: string | number;
  wireframe?: boolean;
};

export function Torus3D({ radius=1, tube=0.3, radialSegments=16, tubularSegments=48, arc=Math.PI*2, position=[0,0,0], color=0x9333ea, wireframe=false }: Torus3DProps) {
  const { THREE, scene } = useThree();
  const meshRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!THREE || !scene) return;
    const geo = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc);
    const mat = new THREE.MeshStandardMaterial({ color, wireframe });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...position);
    scene.add(mesh);
    meshRef.current = mesh;
    return () => {
      scene.remove(mesh);
      geo.dispose();
      mat.dispose();
    };
  }, [THREE, scene]);

  React.useEffect(() => { meshRef.current?.position.set(...position); }, [position?.[0], position?.[1], position?.[2]]);

  React.useEffect(() => {
    if (!meshRef.current || !THREE) return;
    const old = meshRef.current.geometry;
    const geo = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc);
    meshRef.current.geometry = geo; old?.dispose?.();
  }, [radius, tube, radialSegments, tubularSegments, arc]);

  React.useEffect(() => {
    if (!meshRef.current || !THREE) return;
    meshRef.current.material.color = new THREE.Color(color as any);
    meshRef.current.material.wireframe = wireframe;
  }, [color, wireframe, THREE]);

  return null;
}

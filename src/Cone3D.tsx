import React from "react";
import { useThree } from "./threeContext";
import { useThreeParent } from "./threeParent";

export type Cone3DProps = {
  radius?: number;
  height?: number;
  radialSegments?: number;
  openEnded?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  color?: string | number;
  wireframe?: boolean;
};

export function Cone3D({ radius=0.45, height=1.2, radialSegments=32, openEnded=false, position=[0,0,0], rotation=[0,0,0], color=0xf59e0b, wireframe=false }: Cone3DProps) {
  const { THREE, scene } = useThree();
  const parent = useThreeParent();
  const meshRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!THREE || !scene) return;
    const geo = new THREE.ConeGeometry(radius, height, radialSegments, 1, openEnded);
    const mat = new THREE.MeshStandardMaterial({ color, wireframe });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
  (parent ?? scene).add(mesh);
    meshRef.current = mesh;
    return () => { (parent ?? scene).remove(mesh); geo.dispose(); mat.dispose(); };
  }, [THREE, scene, parent]);

  React.useEffect(() => { meshRef.current?.position.set(...position); }, [position?.[0], position?.[1], position?.[2]]);
  React.useEffect(() => { meshRef.current?.rotation.set(...rotation); }, [rotation?.[0], rotation?.[1], rotation?.[2]]);

  React.useEffect(() => {
    if (!meshRef.current || !THREE) return;
    const old = meshRef.current.geometry;
    meshRef.current.geometry = new THREE.ConeGeometry(radius, height, radialSegments, 1, openEnded);
    old?.dispose?.();
  }, [radius, height, radialSegments, openEnded]);

  React.useEffect(() => {
    if (!meshRef.current || !THREE) return;
    meshRef.current.material.color = new THREE.Color(color as any);
    meshRef.current.material.wireframe = wireframe;
  }, [color, wireframe, THREE]);

  return null;
}

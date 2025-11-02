import React from "react";
import { useThree } from "./threeContext";
import { useThreeParent } from "./threeParent";

export type Sphere3DProps = {
  radius?: number;
  widthSegments?: number;
  heightSegments?: number;
  position?: [number, number, number];
  color?: string | number;
  wireframe?: boolean;
};

export function Sphere3D({ radius = 0.6, widthSegments = 32, heightSegments = 16, position = [0,0,0], color = 0x10b981, wireframe = false }: Sphere3DProps) {
  const { THREE, scene } = useThree();
  const parent = useThreeParent();
  const meshRef = React.useRef<any>(null);

  React.useEffect(() => {
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

  React.useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.position.set(...position);
  }, [position?.[0], position?.[1], position?.[2]]);

  React.useEffect(() => {
    if (!meshRef.current || !THREE) return;
    const old = meshRef.current.geometry;
    const geo = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    meshRef.current.geometry = geo;
    old?.dispose?.();
  }, [radius, widthSegments, heightSegments]);

  React.useEffect(() => {
    if (!meshRef.current || !THREE) return;
    meshRef.current.material.color = new THREE.Color(color as any);
    meshRef.current.material.wireframe = wireframe;
  }, [color, wireframe, THREE]);

  return null;
}

import React from "react";
import { useThree } from "./threeContext";
import { useThreeParent } from "./threeParent";

export type Box3DProps = {
  size?: [number, number, number];
  position?: [number, number, number];
  color?: string | number;
  wireframe?: boolean;
};

export function Box3D({ size = [1,1,1], position = [0,0,0], color = 0xef4444, wireframe = false }: Box3DProps) {
  const { THREE, scene } = useThree();
  const parent = useThreeParent();
  const meshRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!THREE || !scene) return;
    const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
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
    // Update geometry by reassigning (simple approach)
    const old = meshRef.current.geometry;
    const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
    meshRef.current.geometry = geo;
    old?.dispose?.();
  }, [size?.[0], size?.[1], size?.[2]]);

  React.useEffect(() => {
    if (!meshRef.current || !THREE) return;
    meshRef.current.material.color = new THREE.Color(color as any);
    meshRef.current.material.wireframe = wireframe;
  }, [color, wireframe, THREE]);

  return null;
}

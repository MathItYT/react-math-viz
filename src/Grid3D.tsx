import React from "react";
import { useThree } from "./threeContext";
import { useThreeParent } from "./threeParent";

export type Grid3DProps = {
  size?: number; // total size
  divisions?: number;
  color1?: number; // hex
  color2?: number; // hex
};

export function Grid3D({ size = 10, divisions = 10, color1 = 0xcccccc, color2 = 0xe5e7eb }: Grid3DProps) {
  const { THREE, scene } = useThree();
  const parent = useThreeParent();
  React.useEffect(() => {
    if (!THREE || !scene) return;
    const grid = new THREE.GridHelper(size, divisions, color1, color2);
    (parent ?? scene).add(grid);
    return () => { (parent ?? scene).remove(grid); };
  }, [THREE, scene, parent, size, divisions, color1, color2]);
  return null;
}

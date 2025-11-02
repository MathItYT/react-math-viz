import React from "react";
import { useThree } from "./threeContext";
import { ThreeParentContext, useThreeParent } from "./threeParent";

export type Group3DProps = {
  children?: React.ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
};

export function Group3D({ children, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1] }: Group3DProps) {
  const { THREE, scene } = useThree();
  const parent = useThreeParent();
  const groupRef = React.useRef<any>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!THREE || !scene) return;
    const g = new THREE.Group();
    g.position.set(...position);
    g.rotation.set(...rotation);
    g.scale.set(...scale);
    (parent ?? scene).add(g);
    groupRef.current = g;
    // trigger a re-render so children mount under the created group
    setReady(true);
    return () => { (parent ?? scene).remove(g); };
  }, [THREE, scene, parent]);

  React.useEffect(() => { groupRef.current?.position.set(...position); }, [position?.[0], position?.[1], position?.[2]]);
  React.useEffect(() => { groupRef.current?.rotation.set(...rotation); }, [rotation?.[0], rotation?.[1], rotation?.[2]]);
  React.useEffect(() => { groupRef.current?.scale.set(...scale); }, [scale?.[0], scale?.[1], scale?.[2]]);

  if (!groupRef.current || !ready) return null;
  return (
    <ThreeParentContext.Provider value={groupRef.current}>
      {children}
    </ThreeParentContext.Provider>
  );
}

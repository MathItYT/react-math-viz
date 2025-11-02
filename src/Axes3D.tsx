import React from "react";
import { useThree } from "./threeContext";
import { useThreeParent } from "./threeParent";

export type Axes3DProps = {
  /** Half-extent of each axis; axes go from -size to +size. */
  size?: number;
  /** Cylinder radius in world units; if not provided or <= 0, draws thin line axes. */
  thickness?: number;
  /** Show arrowheads. */
  arrows?: boolean;
  /** Also draw arrowheads on the negative side. */
  negativeArrows?: boolean;
};

export function Axes3D({ size = 2, thickness = 0, arrows = true, negativeArrows = false }: Axes3DProps) {
  const { THREE, scene } = useThree();
  const parent = useThreeParent();
  // Render the actual axis meshes in an effect
  React.useEffect(() => {
    if (!THREE || !scene) return;
    const target = parent ?? scene;
    // Thin axes using lines from -size to +size
    if (!thickness || thickness <= 0) {
      const group = new THREE.Group();
      const mkLine = (axis: 'x'|'y'|'z', color: number) => {
        const mat = new THREE.LineBasicMaterial({ color });
        const pos = new Float32Array([
          axis==='x' ? -size : 0, axis==='y' ? -size : 0, axis==='z' ? -size : 0,
          axis==='x' ?  size : 0, axis==='y' ?  size : 0, axis==='z' ?  size : 0,
        ]);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const line = new THREE.Line(geo, mat);
        group.add(line);

        // Arrowheads (positive and optionally negative)
        const cones: any[] = [];
        if (arrows) {
          const h = Math.max(size * 0.24, 0.12);
          const r = Math.max(size * 0.06, 0.04);
          const coneGeo = new THREE.ConeGeometry(r, h, 16);
          const coneMat = new THREE.MeshStandardMaterial({ color });
          const coneP = new THREE.Mesh(coneGeo, coneMat);
          if (axis==='x') { coneP.rotation.z = -Math.PI/2; coneP.position.set(size,0,0); }
          if (axis==='y') { /* default +Y */ coneP.position.set(0,size,0); }
          if (axis==='z') { coneP.rotation.x = Math.PI/2; coneP.position.set(0,0,size); }
          group.add(coneP); cones.push(coneP);
          if (negativeArrows) {
            const coneN = new THREE.Mesh(coneGeo.clone(), coneMat);
            if (axis==='x') { coneN.rotation.z = Math.PI/2; coneN.position.set(-size,0,0); }
            if (axis==='y') { coneN.rotation.x = Math.PI; coneN.position.set(0,-size,0); }
            if (axis==='z') { coneN.rotation.x = -Math.PI/2; coneN.position.set(0,0,-size); }
            group.add(coneN); cones.push(coneN);
          }
        }

        return () => {
          geo.dispose();
          mat.dispose();
          cones.forEach(c => { c.geometry.dispose?.(); c.material.dispose?.(); });
        };
      };

      const cleanups: Array<() => void> = [];
      target.add(group);
      cleanups.push(mkLine('x', 0xff0000));
      cleanups.push(mkLine('y', 0x00ff00));
      cleanups.push(mkLine('z', 0x0000ff));
      return () => {
        target.remove(group);
        cleanups.forEach(fn => { try { fn(); } catch {} });
      };
    }

    // Thick axes using cylinders from -size to +size (and optional cone arrowheads)
    const group = new THREE.Group();

    const mkAxis = (axis: 'x'|'y'|'z', color: number) => {
      const len = size * 2;
      const cylGeo = new THREE.CylinderGeometry(thickness, thickness, len, 16);
      const mat = new THREE.MeshStandardMaterial({ color });
      const cyl = new THREE.Mesh(cylGeo, mat);
      if (axis === 'x') {
        cyl.rotation.z = Math.PI / 2;
      } else if (axis === 'y') {
        // along Y by default
      } else { // 'z'
        cyl.rotation.x = Math.PI / 2;
      }
      group.add(cyl);

      const cones: any[] = [];
      if (arrows) {
        const h = Math.max(size * 0.24, thickness * 6);
        const r = Math.max(thickness * 2, size * 0.06);
        const coneGeo = new THREE.ConeGeometry(r, h, 16);
        const coneMat = new THREE.MeshStandardMaterial({ color });
        const coneP = new THREE.Mesh(coneGeo, coneMat);
        if (axis === 'x') { coneP.rotation.z = -Math.PI/2; coneP.position.set(size,0,0); }
        if (axis === 'y') { coneP.position.set(0,size,0); }
        if (axis === 'z') { coneP.rotation.x = Math.PI/2; coneP.position.set(0,0,size); }
        group.add(coneP); cones.push(coneP);
        if (negativeArrows) {
          const coneN = new THREE.Mesh(coneGeo.clone(), coneMat);
          if (axis === 'x') { coneN.rotation.z = Math.PI/2; coneN.position.set(-size,0,0); }
          if (axis === 'y') { coneN.rotation.x = Math.PI; coneN.position.set(0,-size,0); }
          if (axis === 'z') { coneN.rotation.x = -Math.PI/2; coneN.position.set(0,0,-size); }
          group.add(coneN); cones.push(coneN);
        }
      }

      return () => {
        cylGeo.dispose();
        mat.dispose();
        cones.forEach(co => { co.geometry.dispose?.(); co.material.dispose?.(); });
      };
    };

    const cleanups: Array<() => void> = [];
    target.add(group);
    cleanups.push(mkAxis('x', 0xff0000));
    cleanups.push(mkAxis('y', 0x00ff00));
    cleanups.push(mkAxis('z', 0x0000ff));

    return () => {
      target.remove(group);
      cleanups.forEach(fn => { try { fn(); } catch {} });
    };
  }, [THREE, scene, parent, size, thickness, arrows, negativeArrows]);

  // Also allow rendering customizable tip labels via Label3D by composing this component with it
  return null;
}

import React from "react";
import { useThree } from "./threeContext";

export type Label3DProps = {
  position: [number, number, number];
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  vAlign?: 'top' | 'middle' | 'bottom';
  dx?: number; // px offset x
  dy?: number; // px offset y
  className?: string;
  style?: React.CSSProperties;
};

export function Label3D({ position, children, align = 'left', vAlign = 'top', dx = 0, dy = 0, className, style }: Label3DProps) {
  const { THREE, camera, renderer, htmlOverlay } = useThree();
  const elRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!THREE || !camera || !renderer || !htmlOverlay || !elRef.current) return;
    const el = elRef.current;
    const v = new THREE.Vector3();
    let stopped = false;
    const update = () => {
      if (stopped) return;
      try {
        v.set(position[0], position[1], position[2]);
        v.project(camera);
        const x = (v.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
        const y = ( -v.y * 0.5 + 0.5) * renderer.domElement.clientHeight;
        const ax = align === 'center' ? -50 : align === 'right' ? -100 : 0;
        const ay = vAlign === 'middle' ? -50 : vAlign === 'bottom' ? -100 : 0;
        el.style.transform = `translate(${Math.round(x+dx)}px, ${Math.round(y+dy)}px) translate(${ax}%, ${ay}%)`;
        el.style.display = v.z < 1 ? 'block' : 'none';
      } catch {}
      requestAnimationFrame(update);
    };
    const id = requestAnimationFrame(update);
    return () => { stopped = true; cancelAnimationFrame(id); };
  }, [THREE, camera, renderer, htmlOverlay, position?.[0], position?.[1], position?.[2], align, vAlign, dx, dy]);

  if (!htmlOverlay) return null;
  return (
    <div ref={elRef} className={className} style={{ position:'absolute', pointerEvents:'none', ...style }}>
      {children}
    </div>
  );
}

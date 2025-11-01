import React from "react";
import { ThreeContext } from "./threeContext";

export type Plot3DProps = {
  width: number;
  height: number;
  background?: string;
  camera?: {
    fov?: number;
    near?: number;
    far?: number;
    position?: [number, number, number];
    lookAt?: [number, number, number];
  };
  orbitControls?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function Plot3D({
  width,
  height,
  background = "#fff",
  camera,
  orbitControls = true,
  children,
  className,
  style,
}: Plot3DProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  // Keep these in state so React re-render happens once initialized
  const [three, setThree] = React.useState<any | null>(null);
  const [scene, setScene] = React.useState<any | null>(null);
  const [camera3d, setCamera3d] = React.useState<any | null>(null);
  const [renderer3d, setRenderer3d] = React.useState<any | null>(null);
  const controlsRef = React.useRef<any>(null);
  const rafRef = React.useRef<number | null>(null);
  const [overlayEl, setOverlayEl] = React.useState<HTMLDivElement | null>(null);

  // Lazy-load THREE from CDN to avoid hard dependency for the library
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // @ts-ignore - ESM CDN import
  const THREE: any = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
  // Import OrbitControls from the same version; relies on a page-level import map mapping "three" to the URL above
  const { OrbitControls }: any = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js');
        if (!mounted) return;
  setThree({ ...THREE, OrbitControls });

  // Init scene
  const _scene = new THREE.Scene();
  _scene.background = new THREE.Color(background);
  setScene(_scene);

        // Camera
        const fov = camera?.fov ?? 50;
        const near = camera?.near ?? 0.1;
        const far = camera?.far ?? 1000;
  const cam = new THREE.PerspectiveCamera(fov, width / height, near, far);
        const [cx, cy, cz] = camera?.position ?? [3, 3, 6];
        cam.position.set(cx, cy, cz);
        const look = camera?.lookAt ?? [0, 0, 0];
        cam.lookAt(...look);
  setCamera3d(cam);

        // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  setRenderer3d(renderer);
        const container = containerRef.current!;
        container.innerHTML = "";
        container.appendChild(renderer.domElement);

        // Lights (basic)
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  _scene.add(ambient);
        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(5, 8, 4);
  _scene.add(dir);

        // Controls
        if (orbitControls) {
          const controls = new OrbitControls(cam, renderer.domElement);
          controls.enableDamping = true;
          controls.dampingFactor = 0.08;
          controlsRef.current = controls;
        }

        const onResize = () => {
          const w = width;
          const h = height;
          renderer.setSize(w, h);
          cam.aspect = w / h;
          cam.updateProjectionMatrix();
        };
        onResize();

        const animate = () => {
          rafRef.current = requestAnimationFrame(animate);
          controlsRef.current?.update?.();
          renderer.render(_scene, cam);
        };
        animate();

      } catch (err) {
        console.error("Failed to load THREE:", err);
      }
    })();
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { controlsRef.current?.dispose?.(); } catch {}
      try { renderer3d?.dispose?.(); } catch {}
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [width, height, background, camera?.fov, camera?.near, camera?.far, camera?.position?.[0], camera?.position?.[1], camera?.position?.[2], camera?.lookAt?.[0], camera?.lookAt?.[1], camera?.lookAt?.[2], orbitControls]);

  const ctxValue = React.useMemo(() => ({
    THREE: three,
    scene: scene,
    camera: camera3d,
    renderer: renderer3d,
    htmlOverlay: overlayEl,
  }), [three, scene, camera3d, renderer3d, overlayEl]);

  return (
    <div className={className} style={{ position:'relative', width, height, overscrollBehavior:'contain', touchAction:'none', ...style }}>
      <div ref={containerRef} style={{ position:'absolute', inset:0 }} />
      <ThreeContext.Provider value={ctxValue}>
        {children}
      </ThreeContext.Provider>
      <div ref={setOverlayEl} style={{ position:'absolute', inset:0, pointerEvents:'none', fontFamily:'system-ui, Segoe UI, Roboto, sans-serif', fontSize:12, color:'#222' }} />
    </div>
  );
}

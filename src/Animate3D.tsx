import React from "react";
import { useThree } from "./threeContext";
import { ThreeParentContext, useThreeParent } from "./threeParent";
import { EasingFn, EasingName } from "./easing";
import { getEasing } from "./easing";

type Vec3 = [number, number, number];

export type AnimationType3D = "appear" | "disappear" | "transform";

export type Transform3D = {
  position?: Vec3;
  rotation?: Vec3; // Euler XYZ in radians
  scale?: Vec3;
};

export type Animate3DProps = {
  children?: React.ReactNode;
  type?: AnimationType3D;
  from?: Transform3D;
  to?: Transform3D;
  duration?: number;
  delay?: number;
  easing?: EasingName | EasingFn;
  autoplay?: boolean;
  loop?: boolean;
  yoyo?: boolean;
  replayKey?: any; // when this value changes, restart the animation
};

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function lerp3(a: Vec3 | undefined, b: Vec3 | undefined, t: number, fallback: Vec3): Vec3 {
  const aa = a ?? fallback;
  const bb = b ?? fallback;
  return [lerp(aa[0], bb[0], t), lerp(aa[1], bb[1], t), lerp(aa[2], bb[2], t)];
}

export function Animate3D({ children, type = "transform", from, to, duration = 800, delay = 0, easing = "easeInOutCubic", autoplay = true, loop = false, yoyo = false, replayKey }: Animate3DProps) {
  const { THREE, scene } = useThree();
  const parent = useThreeParent();
  const easeFn: EasingFn = React.useMemo(() => typeof easing === 'function' ? easing : getEasing(easing), [easing]);

  const groupRef = React.useRef<any>(null);
  const [ready, setReady] = React.useState(false);
  const [childrenReadyTick, setChildrenReadyTick] = React.useState(0);

  // Create a group and mount it under current three parent (or scene)
  React.useEffect(() => {
    if (!THREE || !scene) return;
    const g = new THREE.Group();
    // Start hidden for appear to avoid first-frame flash
    if (type === 'appear') g.visible = false;
    (parent ?? scene).add(g);
    groupRef.current = g;
    setReady(true);
    return () => {
      try { (parent ?? scene).remove(g); } catch {}
      groupRef.current = null;
      setReady(false);
    };
  // parent shouldn't change often; re-create if context changes
  }, [THREE, scene, parent]);

  // Helper: traverse meshes within group
  const traverseMeshes = React.useCallback((root: any, fn?: (mesh: any, material: any, idx: number | null) => void) => {
    if (!root) return false;
    let found = false;
    root.traverse?.((obj: any) => {
      if (!obj || !obj.isMesh) return;
      found = true;
      if (!fn) return;
      const mat = obj.material;
      if (Array.isArray(mat)) {
        mat.forEach((m, i) => fn(obj, m, i));
      } else if (mat) {
        fn(obj, mat, null);
      }
    });
    return found;
  }, []);

  // Material preparation to avoid shared-material flicker during fades
  const preparedRef = React.useRef(false);
  const finalizeOnAppearRef = React.useRef(false);
  const appearRunningRef = React.useRef(false);
  const appearWatchRef = React.useRef<number | null>(null);
  const currentProgressRef = React.useRef(0);
  const prepareMaterials = React.useCallback((initialOpacity: number) => {
    const g = groupRef.current; if (!g) return;
    if (preparedRef.current) return;
    traverseMeshes(g, (mesh, material, idx) => {
      // Skip if already prepared
      if (mesh.userData?.__anim3dPrepared) return;
      // Clone material to avoid mutating shared instances
      let cloned: any;
      try { cloned = material.clone?.() ?? material; } catch { cloned = material; }
      const orig = material;
      const originalTransparent = !!orig.transparent;
      const originalDepthWrite = !!orig.depthWrite;
      // Assign cloned material
      if (idx == null) mesh.material = cloned; else mesh.material[idx] = cloned;
      // Configure for fade
      try {
        cloned.transparent = true;
        cloned.depthWrite = false;
        if (typeof cloned.opacity === 'number') cloned.opacity = initialOpacity;
      } catch {}
      mesh.userData = mesh.userData || {};
      mesh.userData.__anim3dPrepared = { orig, originalTransparent, originalDepthWrite, idx };
    });
    preparedRef.current = true;
  }, [traverseMeshes]);

  const finalizeMaterials = React.useCallback(() => {
    const g = groupRef.current; if (!g) return;
    if (!preparedRef.current) return;
    traverseMeshes(g, (mesh, material) => {
      const info = mesh.userData?.__anim3dPrepared;
      if (!info) return;
      // Restore original where possible; else at least set solid flags back
      try {
        if (mesh.material && info.orig) {
          // Assign back the original material instance
          mesh.material = info.orig;
        }
      } catch {}
      try {
        if (material) {
          material.transparent = info.originalTransparent;
          material.depthWrite = info.originalDepthWrite;
        }
      } catch {}
      delete mesh.userData.__anim3dPrepared;
    });
    preparedRef.current = false;
  }, [traverseMeshes]);

  // Interpolation and application
  const applyAt = React.useCallback((tt: number) => {
    const g = groupRef.current; if (!g) return;
    currentProgressRef.current = tt;
    // Interpolate transforms
    const fpos = from?.position ?? [0,0,0];
    const tpos = to?.position ?? [0,0,0];
    const frot = from?.rotation ?? [0,0,0];
    const trot = to?.rotation ?? [0,0,0];
    const fsca = from?.scale ?? [1,1,1];
    const tsca = to?.scale ?? [1,1,1];
    const p = lerp3(fpos as Vec3, tpos as Vec3, tt, [0,0,0]);
  const r = lerp3(frot as Vec3, trot as Vec3, tt, [0,0,0]);
    const s = lerp3(fsca as Vec3, tsca as Vec3, tt, [1,1,1]);
    g.position.set(p[0], p[1], p[2]);
  // Invert Y to match visual expectation: positive yaw rotates to the right on screen
  g.rotation.set(r[0], -r[1], r[2]);
    g.scale.set(s[0], s[1], s[2]);

    // Opacity fade for appear/disappear
    if (type === 'appear' || type === 'disappear') {
      const op = type === 'appear' ? tt : (1 - tt);
      traverseMeshes(g, (_mesh, material) => {
        try { if (typeof material.opacity === 'number') material.opacity = op; } catch {}
      });
    }
  }, [from?.position, from?.rotation, from?.scale, to?.position, to?.rotation, to?.scale, type, traverseMeshes]);

  // Interval-based driver independent of RAF
  const driverRef = React.useRef<{ playing: boolean; dir: 1 | -1; startAt: number; id: number | null }>({ playing: false, dir: 1, startAt: 0, id: null });
  const stop = React.useCallback(() => {
    const d = driverRef.current;
    if (d.id != null) { clearInterval(d.id); d.id = null; }
    d.playing = false;
  }, []);
  const play = React.useCallback(() => {
    const d = driverRef.current;
    if (d.playing) return;
    d.playing = true; d.dir = 1;
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    d.startAt = now;
    if (d.id != null) { clearInterval(d.id); d.id = null; }
    d.id = window.setInterval(() => {
      const tnow = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const elapsed = tnow - d.startAt;
      const eff = elapsed - (delay ?? 0);
      if (eff < 0) { applyAt(0); return; }
      let raw = Math.min(Math.max(eff / (duration || 1), 0), 1);
      if (d.dir < 0) raw = 1 - raw;
      const eased = easeFn(raw);
      applyAt(eased);
      const finished = eff >= (duration || 1);
      if (finished) {
        if (loop) {
          if (yoyo) d.dir = d.dir === 1 ? -1 : 1;
          d.startAt = tnow;
        } else {
          stop();
          // Finalize materials after appear completes
          if (type === 'appear') finalizeOnAppearRef.current = true;
          appearRunningRef.current = false;
          if (appearWatchRef.current != null) { clearInterval(appearWatchRef.current); appearWatchRef.current = null; }
        }
      }
    }, 16);
  }, [applyAt, delay, duration, easeFn, loop, stop, type, yoyo]);

  // Debounced reset + start policy
  const lastResetAtRef = React.useRef<number>(-1);
  const rafRevealRef = React.useRef<number | null>(null);
  const pollTimerRef = React.useRef<number | null>(null);
  const resetPlay = React.useCallback(() => {
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    if (lastResetAtRef.current > 0 && (now - lastResetAtRef.current) < 250) return;
    lastResetAtRef.current = now;
    stop();
    finalizeMaterials();
    const g = groupRef.current;
    if (!g) return;

    // Appear: start hidden, prep materials at opacity=0, apply t=0, then reveal next frame (after children mount)
    if (type === 'appear') {
      g.visible = false;
      appearRunningRef.current = true;

      const startWatcher = () => {
        // While appear is running, prepare any late-added meshes to current opacity
        if (appearWatchRef.current != null) { clearInterval(appearWatchRef.current); }
        appearWatchRef.current = window.setInterval(() => {
          const root = groupRef.current; if (!root) return;
          traverseMeshes(root, (mesh, material, idx) => {
            if (mesh.userData?.__anim3dPrepared) return;
            // Prepare this late mesh
            let cloned: any;
            try { cloned = material.clone?.() ?? material; } catch { cloned = material; }
            const orig = material;
            const originalTransparent = !!orig.transparent;
            const originalDepthWrite = !!orig.depthWrite;
            if (idx == null) mesh.material = cloned; else mesh.material[idx] = cloned;
            try {
              cloned.transparent = true; cloned.depthWrite = false; cloned.opacity = currentProgressRef.current;
              cloned.needsUpdate = true;
            } catch {}
            mesh.userData = mesh.userData || {};
            mesh.userData.__anim3dPrepared = { orig, originalTransparent, originalDepthWrite, idx };
          });
        }, 40);
      };

      const kick = () => {
        prepareMaterials(0);
        applyAt(0);
        if (rafRevealRef.current != null) cancelAnimationFrame(rafRevealRef.current);
        rafRevealRef.current = requestAnimationFrame(() => {
          g.visible = true;
          startWatcher();
          if (autoplay) play();
        });
      };

      // Wait until at least one mesh exists; fallback after 2000ms
      if (pollTimerRef.current != null) clearTimeout(pollTimerRef.current);
      const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const poll = () => {
        if (!groupRef.current) return;
        const hasMesh = traverseMeshes(groupRef.current);
        const tnow = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        if (hasMesh || (tnow - start) > 2000) {
          kick();
        } else {
          pollTimerRef.current = window.setTimeout(poll, 16) as any;
        }
      };
      poll();
      return;
    }

    // Disappear: ensure materials prepared at opacity=1, then run
    if (type === 'disappear') {
      g.visible = true;
      prepareMaterials(1);
      applyAt(0);
      if (autoplay) play();
      return;
    }

    // Transform: just apply t=0 and go
    g.visible = true;
    applyAt(0);
    if (autoplay) play();
  }, [applyAt, autoplay, finalizeMaterials, play, prepareMaterials, stop, type]);

  // On first mount and when type/replayKey changes
  const initedRef = React.useRef(false);
  React.useLayoutEffect(() => {
    if (!ready) return;
    if (!initedRef.current) initedRef.current = true;
    resetPlay();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, type, replayKey]);

  // Watch autoplay toggles without full reset
  React.useLayoutEffect(() => {
    if (!ready) return;
    if (autoplay) {
      play();
    } else {
      stop();
    }
  }, [autoplay, play, ready, stop]);

  // After each render where children count might change, bump a tick to allow appear polling to resume quicker
  React.useEffect(() => {
    if (!ready || !groupRef.current) return;
    setChildrenReadyTick((t) => t + 1);
    // no cleanup
  }, [children, ready]);

  // Finalization after appear complete on next effect tick
  React.useEffect(() => {
    if (!finalizeOnAppearRef.current) return;
    finalizeOnAppearRef.current = false;
    // Restore solid flags soon after finishing
    finalizeMaterials();
  });

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      try { stop(); } catch {}
      if (rafRevealRef.current != null) cancelAnimationFrame(rafRevealRef.current);
      if (pollTimerRef.current != null) clearTimeout(pollTimerRef.current);
      if (appearWatchRef.current != null) { clearInterval(appearWatchRef.current); appearWatchRef.current = null; }
      appearRunningRef.current = false;
      try { finalizeMaterials(); } catch {}
    };
  }, [finalizeMaterials, stop]);

  if (!groupRef.current || !ready) return null;
  return (
    <ThreeParentContext.Provider value={groupRef.current}>
      {children}
    </ThreeParentContext.Provider>
  );
}

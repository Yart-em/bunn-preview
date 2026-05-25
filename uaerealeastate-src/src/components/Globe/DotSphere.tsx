import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { COLOR_DOT } from './constants';
import type { GlobeDots } from './dots';
import { GATHER_DURATION } from './entry';

/**
 * Crisp round dot sprite — solid filled circle with one pixel of native
 * canvas anti-aliasing at the rim.
 */
function makeDotTexture() {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * One animated point cloud. Positions lerp from `start` to `target`
 * during the gather animation. The PointsMaterial is patched via
 * onBeforeCompile so each dot's size scales with how front-facing it
 * is — points on the back of the sphere render smaller than those
 * facing the camera, giving the cloud some apparent depth.
 */
function AnimatedPoints({
  start,
  target,
  delay,
  color,
  size,
  texture,
  dissolveProgress = 0,
}: {
  start: Float32Array;
  target: Float32Array;
  delay: Float32Array;
  color: string;
  size: number;
  texture: THREE.Texture;
  /** Scroll-driven dissolve progress (0..1). At 0 the dots sit at
   *  their sphere positions; at 1 they're 2.5× further out than
   *  their original scattered start positions (off-frame). */
  dissolveProgress?: number;
}) {
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const positions = useMemo(() => new Float32Array(start), [start]);
  const startTimeRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  /**
   * Shared uniform refs that the patched shader reads. We update
   * uCamPos every frame; uMinSizeMul stays constant.
   */
  const uniforms = useMemo(
    () => ({
      uCamPos: { value: new THREE.Vector3() },
      uMinSizeMul: { value: 0.45 },
      uMinAlphaMul: { value: 0.55 },
    }),
    [],
  );

  useEffect(() => {
    startTimeRef.current = null;
    doneRef.current = false;
  }, [start, target]);

  /** Patch the standard PointsMaterial shader so dot size is reduced
   *  as a point rotates around to the back of the sphere. */
  const onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uCamPos = uniforms.uCamPos;
    shader.uniforms.uMinSizeMul = uniforms.uMinSizeMul;
    shader.uniforms.uMinAlphaMul = uniforms.uMinAlphaMul;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform vec3 uCamPos;
         uniform float uMinSizeMul;
         uniform float uMinAlphaMul;
         varying float vFacing;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         {
           vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
           vec3 sphereNormal = normalize(worldPos);
           vec3 toCam = normalize(uCamPos - worldPos);
           vFacing = dot(sphereNormal, toCam);
         }`,
      )
      .replace(
        'gl_PointSize = size;',
        `float facing01 = (vFacing + 1.0) * 0.5;
         gl_PointSize = size * mix(uMinSizeMul, 1.0, facing01);`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uMinAlphaMul;
         varying float vFacing;`,
      )
      .replace(
        '#include <output_fragment>',
        `#include <output_fragment>
         float facing01 = (vFacing + 1.0) * 0.5;
         gl_FragColor.a *= mix(uMinAlphaMul, 1.0, facing01);`,
      );
  };

  useFrame((state) => {
    if (matRef.current) {
      // Convert world-space camera position into the sphere's local
      // frame so the math holds even when the parent group moves /
      // scales / rotates.
      const local = state.camera.position.clone();
      const parent = matRef.current.userData?.parentObject;
      if (parent) {
        local.applyMatrix4(parent.matrixWorld.clone().invert());
      }
      uniforms.uCamPos.value.copy(state.camera.position);
    }

    if (!geomRef.current) return;

    /* ── Scroll-driven dissolve ─────────────────────────────
     * The gather animation PLAYED BACKWARDS. Gather progresses
     * over `maxDelay + GATHER_DURATION` seconds of elapsedTime;
     * dissolve maps dissolveProgress (0 → 1) onto that same
     * timeline running in reverse (gatherEnd → 0). Each dot
     * uses the EXACT same per-dot delay + easing the gather
     * uses, so the dissolve is a literal reverse of the entry
     * — dots fly back to their scattered `start` positions
     * with the same stagger they came in with, just reversed
     * in time. Scroll-controlled, no extra effects. */
    if (dissolveProgress > 0) {
      const count = delay.length;
      let maxDelay = 0;
      for (let i = 0; i < count; i++) {
        if (delay[i] > maxDelay) maxDelay = delay[i];
      }
      const gatherEnd = maxDelay + GATHER_DURATION;
      const tReverse = (1 - dissolveProgress) * gatherEnd;
      for (let i = 0; i < count; i++) {
        const localT = Math.max(
          0,
          Math.min(1, (tReverse - delay[i]) / GATHER_DURATION),
        );
        const eased = easeOutCubic(localT);
        const i3 = i * 3;
        positions[i3 + 0] = start[i3 + 0] + (target[i3 + 0] - start[i3 + 0]) * eased;
        positions[i3 + 1] = start[i3 + 1] + (target[i3 + 1] - start[i3 + 1]) * eased;
        positions[i3 + 2] = start[i3 + 2] + (target[i3 + 2] - start[i3 + 2]) * eased;
      }
      const attr = geomRef.current.getAttribute('position') as THREE.BufferAttribute;
      attr.needsUpdate = true;
      if (matRef.current) {
        matRef.current.opacity = 1;
      }
      return;
    }

    /* ── Gather phase ──────────────────────────────────────
     * Normal start → target lerp on initial mount. */
    if (doneRef.current) return;
    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.elapsedTime;
    }
    const t = state.clock.elapsedTime - startTimeRef.current;

    const count = delay.length;
    let allDone = true;
    for (let i = 0; i < count; i++) {
      const localT = Math.max(0, Math.min(1, (t - delay[i]) / GATHER_DURATION));
      if (localT < 1) allDone = false;
      const eased = easeOutCubic(localT);
      const i3 = i * 3;
      positions[i3 + 0] = start[i3 + 0] + (target[i3 + 0] - start[i3 + 0]) * eased;
      positions[i3 + 1] = start[i3 + 1] + (target[i3 + 1] - start[i3 + 1]) * eased;
      positions[i3 + 2] = start[i3 + 2] + (target[i3 + 2] - start[i3 + 2]) * eased;
    }
    const attr = geomRef.current.getAttribute('position') as THREE.BufferAttribute;
    attr.needsUpdate = true;
    if (allDone) doneRef.current = true;
  });

  return (
    <points>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        color={color}
        size={size}
        sizeAttenuation
        map={texture}
        transparent
        alphaTest={0.5}
        depthWrite={false}
        depthTest={false}
        onBeforeCompile={onBeforeCompile}
      />
    </points>
  );
}

export default function DotSphere({
  dots,
  dissolveProgress = 0,
  dotSize = 0.011,
}: {
  dots: GlobeDots;
  dissolveProgress?: number;
  /** World-space point size. Driven from App so it scales with the
   *  globe's on-screen size (viewport aspect) — keeps the dot-to-globe
   *  ratio identical on mobile and desktop. Defaults to the desktop
   *  reference value. */
  dotSize?: number;
}) {
  const tex = useMemo(makeDotTexture, []);

  return (
    <group>
      <AnimatedPoints
        start={dots.landStart}
        target={dots.land}
        delay={dots.landDelay}
        color={COLOR_DOT}
        size={dotSize}
        texture={tex}
        dissolveProgress={dissolveProgress}
      />
    </group>
  );
}

import { useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { COLOR_DOT } from './constants';
import type { GlobeDots } from './dots';
import { GATHER_DURATION, entryTime } from './entry';

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

/**
 * One animated point cloud. The `position` attribute holds each dot's
 * final spot on the sphere; `aStart` (scattered start) and `aDelay`
 * (per-dot delay) ride along as static attributes, and the gather is
 * done in the vertex shader from a single time uniform. Nothing about
 * the ~12 000 dots is touched on the CPU after the first upload — it
 * used to be a JS loop over every dot plus a re-upload of all their
 * positions on every frame of the gather and of the scroll dissolve.
 *
 * The PointsMaterial is patched via onBeforeCompile for that gather,
 * and so each dot's size scales with how front-facing it is — points
 * on the back of the sphere render smaller than those facing the
 * camera, giving the cloud some apparent depth.
 */
function AnimatedPoints({
  start,
  target,
  delay,
  color,
  size,
  texture,
  entryStart,
  dissolveProgress = 0,
}: {
  start: Float32Array;
  target: Float32Array;
  delay: Float32Array;
  color: string;
  size: number;
  texture: THREE.Texture;
  /** The globe's entry clock (see entry.ts). */
  entryStart: RefObject<number | null>;
  /** Scroll-driven dissolve progress (0..1). At 0 the dots sit at
   *  their sphere positions; at 1 they are back at their scattered
   *  start positions (off-frame). */
  dissolveProgress?: number;
}) {
  /* Hoisted out of the per-frame callback — it's a constant for a
   * given delay array. */
  const maxDelay = useMemo(() => {
    let max = 0;
    for (let i = 0; i < delay.length; i++) {
      if (delay[i] > max) max = delay[i];
    }
    return max;
  }, [delay]);
  const doneRef = useRef(false);

  /**
   * Shared uniform refs that the patched shader reads. We update
   * uCamPos and uGatherTime every frame; the rest stay constant.
   */
  const uniforms = useMemo(
    () => ({
      uCamPos: { value: new THREE.Vector3() },
      uMinSizeMul: { value: 0.45 },
      uMinAlphaMul: { value: 0.55 },
      /** Seconds on the gather timeline. */
      uGatherTime: { value: 0 },
      uGatherDuration: { value: GATHER_DURATION },
    }),
    [],
  );

  /** Patch the standard PointsMaterial shader: gather each dot from
   *  aStart to its sphere position, and reduce dot size as a point
   *  rotates around to the back of the sphere. */
  const onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uCamPos = uniforms.uCamPos;
    shader.uniforms.uMinSizeMul = uniforms.uMinSizeMul;
    shader.uniforms.uMinAlphaMul = uniforms.uMinAlphaMul;
    shader.uniforms.uGatherTime = uniforms.uGatherTime;
    shader.uniforms.uGatherDuration = uniforms.uGatherDuration;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform vec3 uCamPos;
         uniform float uMinSizeMul;
         uniform float uMinAlphaMul;
         uniform float uGatherTime;
         uniform float uGatherDuration;
         attribute vec3 aStart;
         attribute float aDelay;
         varying float vFacing;`,
      )
      .replace(
        /* Replaces begin_vertex (transformed = position): each dot
         * eases (cubic out) from aStart to its sphere position over
         * uGatherDuration, after its own delay. */
        '#include <begin_vertex>',
        `float gatherT = clamp((uGatherTime - aDelay) / uGatherDuration, 0.0, 1.0);
         float gatherLeft = 1.0 - gatherT;
         vec3 transformed = mix(aStart, position, 1.0 - gatherLeft * gatherLeft * gatherLeft);
         {
           vec3 worldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
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
    uniforms.uCamPos.value.copy(state.camera.position);

    const gatherEnd = maxDelay + GATHER_DURATION;

    /* ── Scroll-driven dissolve ─────────────────────────────
     * The gather animation PLAYED BACKWARDS. Gather progresses
     * over `maxDelay + GATHER_DURATION` seconds of entry time;
     * dissolve maps dissolveProgress (0 → 1) onto that same
     * timeline running in reverse (gatherEnd → 0). Each dot
     * uses the EXACT same per-dot delay + easing the gather
     * uses, so the dissolve is a literal reverse of the entry
     * — dots fly back to their scattered `start` positions
     * with the same stagger they came in with, just reversed
     * in time. Scroll-controlled, no extra effects. */
    if (dissolveProgress > 0) {
      uniforms.uGatherTime.value = (1 - dissolveProgress) * gatherEnd;
      return;
    }

    /* ── Gather phase ──────────────────────────────────────
     * Normal start → target ease on initial mount, then held
     * at the gathered state. */
    if (doneRef.current) {
      uniforms.uGatherTime.value = gatherEnd;
      return;
    }
    const t = entryTime(entryStart, state.clock.elapsedTime);
    uniforms.uGatherTime.value = t;
    if (t >= gatherEnd) doneRef.current = true;
  });

  return (
    /* frustumCulled off: the bounding sphere three derives from
     * `position` is the unit globe, but the shader draws the dots up
     * to ~14 units out while they gather and dissolve. */
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[target, 3]} />
        <bufferAttribute attach="attributes-aStart" args={[start, 3]} />
        <bufferAttribute attach="attributes-aDelay" args={[delay, 1]} />
      </bufferGeometry>
      <pointsMaterial
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
  entryStart,
  dissolveProgress = 0,
  dotSize = 0.011,
}: {
  dots: GlobeDots;
  /** The globe's entry clock (see entry.ts). */
  entryStart: RefObject<number | null>;
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
        entryStart={entryStart}
        dissolveProgress={dissolveProgress}
      />
    </group>
  );
}

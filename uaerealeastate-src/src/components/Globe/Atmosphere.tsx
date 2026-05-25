import { useMemo } from 'react';
import * as THREE from 'three';
import { GLOBE_RADIUS } from './constants';

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vPosView = -normalize(mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPower;
  varying vec3 vNormal;
  varying vec3 vPosView;
  void main() {
    float fres = 1.0 - max(dot(normalize(vNormal), normalize(vPosView)), 0.0);
    float a = pow(fres, uPower) * uIntensity;
    gl_FragColor = vec4(uColor, a);
  }
`;

/**
 * Soft pink atmospheric halo around the globe. Uses an inverse-fresnel rim
 * factor so the center of the disc (facing the camera) is transparent and
 * only the silhouette glows. Plays well over a white background with
 * standard alpha blending — no additive blending (which washes out on white).
 */
export default function Atmosphere({
  color = '#ffb3da',
  intensity = 0.55,
  power = 2.6,
  scale = 1.12,
}: {
  color?: string;
  intensity?: number;
  power?: number;
  scale?: number;
}) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
      uPower: { value: power },
    }),
    [color, intensity, power],
  );

  return (
    <mesh scale={scale}>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

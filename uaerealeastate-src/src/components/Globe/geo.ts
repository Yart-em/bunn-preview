import * as THREE from 'three';

/**
 * Convert geographic coordinates to a 3D position on a sphere.
 * Equirectangular convention: lon=0,lat=0 sits on +X.
 */
export function latLonToVec3(
  lat: number,
  lon: number,
  radius: number,
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180); // polar angle from +Y
  const theta = (lon + 180) * (Math.PI / 180); // azimuthal, offset so lon=-180 -> 0

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

/**
 * Build a quadratic bezier arc from `start` to `end` lifted above the sphere.
 * The control point is the chord midpoint pushed outward, with height growing
 * with chord length so far-apart points get taller arcs.
 */
export function arcCurve(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
): THREE.QuadraticBezierCurve3 {
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const chordLen = start.distanceTo(end);
  // Lift midpoint outward from globe center. Higher coefficient makes
  // arcs peak higher above the sphere — useful so they reach up into
  // the heading area for the layered hero effect.
  const lift = radius + chordLen * 0.6;
  mid.normalize().multiplyScalar(lift);
  return new THREE.QuadraticBezierCurve3(start.clone(), mid, end.clone());
}

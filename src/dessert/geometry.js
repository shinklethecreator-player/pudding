import * as THREE from 'three';
import { CONFIG } from '../config.js';

export const smoothstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// A smooth closed surface of revolution, with welded vertices and capped poles.
// Profiles run from bottom center to top center; radiusAt adds gentle fluting.
export function revolved(profile, radiusAt = (r) => r) {
  const curve = new THREE.SplineCurve(profile.map(([r, y]) => new THREE.Vector2(r, y)));
  const points = curve.getPoints((profile.length - 1) * CONFIG.geometry.profileSubdivisions);
  const n = CONFIG.geometry.radialSegments;
  const positions = [0, points[0].y, 0], indices = [];
  for (let j = 1; j < points.length - 1; j++) {
    const { x: radius, y } = points[j];
    for (let i = 0; i < n; i++) {
      const a = i * Math.PI * 2 / n;
      const r = radiusAt(Math.max(0, radius), y, a);
      positions.push(r * Math.cos(a), y, r * Math.sin(a));
    }
  }
  const rows = points.length - 2;
  for (let i = 0; i < n; i++) indices.push(0, 1 + i, 1 + (i + 1) % n);
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < n; i++) {
      const a = 1 + j * n + i, b = 1 + j * n + (i + 1) % n;
      indices.push(a, a + n, b, b, a + n, b + n);
    }
  }
  const top = positions.length / 3;
  positions.push(0, points.at(-1).y, 0);
  for (let i = 0; i < n; i++) indices.push(1 + (rows - 1) * n + i, top, 1 + (rows - 1) * n + (i + 1) % n);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function foodMesh(name, geometry, material) {
  const mesh = new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({ metalness: 0, ...material }));
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

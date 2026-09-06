import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { foodMesh } from './geometry.js';
import { creamBaseY } from './createCream.js';

export function createCherry() {
  const c = CONFIG.cherry, r = c.radius;
  const group = new THREE.Group();
  group.name = 'cherryGroup';
  const geometry = new THREE.SphereGeometry(r, 48, 32);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const dent = y > 0 ? 0.1 * r * Math.exp(-(x * x + z * z) / (r * r * 0.13)) : 0;
    p.setXYZ(i, x * (1 + 0.03 * Math.sin(z / r * 3)), y * 0.95 - dent, z * 0.95);
  }
  geometry.computeVertexNormals();
  group.add(foodMesh('cherryMesh', geometry, {
    color: c.color, roughness: c.roughness, clearcoat: 0.55, clearcoatRoughness: 0.24,
  }));
  const l = c.stemLength;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, r * 0.78, 0),
    new THREE.Vector3(l * 0.13, r + l * 0.3, 0),
    new THREE.Vector3(l * 0.39, r + l * 0.66, 0.02),
    new THREE.Vector3(l * 0.7, r + l * 0.87, 0.035),
  ]);
  group.add(foodMesh('cherryStemMesh', new THREE.TubeGeometry(curve, 24, c.stemRadius, 10, false), {
    color: c.stemColor, roughness: 0.48,
  }));
  // Perched on the tip of the piped swirl, nudged forward so the stem reads clearly.
  group.position.set(0.04, creamBaseY() + CONFIG.cream.height * 0.86 + r * 0.4, 0.03);
  return group;
}

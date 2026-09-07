import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { blob, bakeMesh, seatOnBase } from './geometry.js';

// Four rounded stubs buried in the bun at its widest band, each aimed outward along its
// own azimuth so only the tip clears the crust. The group is seated on the base plane, so
// the limbs never break the flat underside.
export function createLegs() {
  const l = CONFIG.legs, b = CONFIG.body;
  const group = new THREE.Group();
  group.name = 'legsGroup';
  const geometry = blob(l.radius, { length: l.lengthScale, height: l.heightScale, taper: 0.12 });
  l.placements.forEach(({ azimuth, pitch }, index) => {
    const mesh = bakeMesh(`legMesh${index}`, geometry.clone(), {
      color: b.color, roughness: b.roughness,
      clearcoat: b.clearcoat, clearcoatRoughness: b.clearcoatRoughness,
    });
    mesh.position.set(Math.sin(azimuth) * l.reach, 0, Math.cos(azimuth) * l.reach);
    mesh.rotation.set(pitch, azimuth, 0, 'YXZ');
    group.add(mesh);
  });
  return seatOnBase(group, l.lift);
}

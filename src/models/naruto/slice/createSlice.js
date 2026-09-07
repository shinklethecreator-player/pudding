import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { revolved, paintVertices, bakeMesh, resampleByArcLength } from './geometry.js';
import { swirlAmount, faceAmount } from './swirl.js';

// The flower cross-section. `petalSharpness` below 1 leaves broad rounded lobes separated by
// narrow notches, which is what a scalloped fish cake looks like; above 1 inverts that into
// narrow spikes with wide flats between them.
function petalFactor(angle) {
  const s = CONFIG.slice;
  const lobe = Math.pow(0.5 + 0.5 * Math.cos(s.petals * angle), s.petalSharpness);
  return 1 + s.petalDepth * (2 * lobe - 1);
}

// A short cylinder: flat faces, a fillet at each edge, and a faint crown so the faces catch
// a gradient instead of reading as dead flat.
function sliceProfile() {
  const s = CONFIG.slice, R = s.radius, H = s.height, f = s.edgeFillet;
  const flat = R - f;
  const dense = [[0, 0], [flat * 0.5, 0]];

  const steps = 14;
  for (let i = 0; i <= steps; i++) {           // bottom fillet
    const a = (i / steps) * Math.PI / 2;
    dense.push([flat + f * Math.sin(a), f * (1 - Math.cos(a))]);
  }
  for (let i = 1; i < 8; i++) dense.push([R, f + (H - 2 * f) * (i / 8)]);   // straight rim
  for (let i = 0; i <= steps; i++) {           // top fillet
    const a = (i / steps) * Math.PI / 2;
    dense.push([R - f * (1 - Math.cos(a)), H - f + f * Math.sin(a)]);
  }
  const face = 26;
  for (let i = 1; i <= face; i++) {            // crowned top face, running back to the axis
    const t = 1 - i / face;
    dense.push([flat * t, H + s.crown * (1 - t * t)]);
  }
  return resampleByArcLength(dense, CONFIG.geometry.profileRows);
}

export function createSlice() {
  const s = CONFIG.slice;
  const geometry = revolved(sliceProfile(), (radius, y, angle) => radius * petalFactor(angle));

  const base = new THREE.Color(s.color), ink = new THREE.Color(CONFIG.swirl.color);
  paintVertices(geometry, (x, y, z, i, out) => {
    out.copy(base).lerp(ink, swirlAmount(x, y, z) * faceAmount(y));
  });

  return bakeMesh('sliceMesh', geometry, {
    color: '#ffffff', vertexColors: true,
    roughness: s.roughness, clearcoat: s.clearcoat, clearcoatRoughness: s.clearcoatRoughness,
  });
}

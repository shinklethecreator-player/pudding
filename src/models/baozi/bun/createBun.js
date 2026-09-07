import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { revolved, displaceAlongNormal, paintVertices, bakeMesh, resampleByArcLength } from './geometry.js';
import { pleatDisplacement, creaseAmount } from './pleats.js';

// The body: one generated wall, so there is no crease of its own — every edge on the
// finished bun comes from the pleating pass. A quarter-ellipse tuck at the base leaves the
// profile horizontal where it meets the flat bottom, and tangent to the wall where the
// rounding ends.
function bunProfile() {
  const b = CONFIG.bun, R = b.radius, H = b.height;
  const tuckHeight = b.baseTuckHeight / H, tuckDepth = b.baseTuck / R;

  const wall = (u) => {
    const dome = R * Math.pow(Math.max(0, 1 - Math.pow(u, b.domeFullness)), b.domeRound);
    const bow = 1 + b.bow * Math.sin(Math.PI * u);
    const tuck = u < tuckHeight
      ? 1 - tuckDepth * (1 - Math.sqrt(Math.max(0, 1 - ((tuckHeight - u) / tuckHeight) ** 2)))
      : 1;
    return dome * bow * tuck;
  };

  const dense = [[0, 0], [wall(0) * 0.55, 0]];
  const steps = 900;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    dense.push([Math.max(0.0004, wall(u)), H * u]);
  }
  // Equal spacing along the wall, so the rows stay dense where the pleats are pressed in.
  return resampleByArcLength(dense, CONFIG.geometry.profileRows);
}

export function createBun() {
  const b = CONFIG.bun;
  const geometry = revolved(bunProfile());

  displaceAlongNormal(geometry, (x, y, z) => pleatDisplacement(x, y, z));

  // Creases sit in their own shadow, so they read slightly darker and greyer than the skin.
  const base = new THREE.Color(b.color), crease = new THREE.Color(b.creaseColor);
  paintVertices(geometry, (x, y, z, i, out) => {
    out.copy(base).lerp(crease, creaseAmount(x, y, z) * 0.85);
  });

  return bakeMesh('bunMesh', geometry, {
    color: '#ffffff', vertexColors: true,
    roughness: b.roughness, clearcoat: b.clearcoat, clearcoatRoughness: b.clearcoatRoughness,
  });
}

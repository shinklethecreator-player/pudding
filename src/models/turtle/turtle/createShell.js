import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { revolved, displaceAlongNormal, paintVertices, bakeMesh } from './geometry.js';
import { lattice, latticeEnvelope } from './lattice.js';

// The bun: a generated dome sitting on a rim that curls under, then scored with the
// cross-hatch. The dome profile is one continuous function, so the surface has no
// crease of its own and every visible edge comes from the scoring.
function shellProfile() {
  const s = CONFIG.shell, R = s.radius, H = s.height, lip = s.lipHeight;
  const flat = R - s.lipInset;
  const profile = [[0, 0], [flat * 0.55, 0], [flat * 0.92, 0.004]];
  const rimSteps = 7;
  for (let i = 1; i <= rimSteps; i++) {
    const angle = (i / rimSteps) * Math.PI / 2;
    profile.push([flat + s.lipInset * Math.sin(angle), lip * (1 - Math.cos(angle))]);
  }
  for (let i = 1; i <= CONFIG.geometry.domeSamples; i++) {
    const t = i / CONFIG.geometry.domeSamples;
    const radius = R * Math.pow(Math.max(0, 1 - Math.pow(t, s.domeFullness)), s.domeRound);
    profile.push([Math.max(0.0004, radius), lip + (H - lip) * t]);
  }
  return profile;
}

export function createShell() {
  const s = CONFIG.shell;
  const geometry = revolved(shellProfile());

  displaceAlongNormal(geometry, (x, y, z) => {
    const { groove, panel } = lattice(x, z);
    const envelope = latticeEnvelope(y);
    return envelope * (s.panelPuff * panel - s.grooveDepth * groove);
  });

  // The cuts expose a paler, more buttery crust than the domed plots between them.
  const base = new THREE.Color(s.color), crease = new THREE.Color(s.creaseColor);
  paintVertices(geometry, (x, y, z, i, out) => {
    const { groove } = lattice(x, z);
    out.copy(base).lerp(crease, latticeEnvelope(y) * Math.pow(groove, 0.3));
  });

  return bakeMesh('shellMesh', geometry, {
    color: '#ffffff', vertexColors: true,
    roughness: s.roughness, clearcoat: s.clearcoat, clearcoatRoughness: s.clearcoatRoughness,
  });
}

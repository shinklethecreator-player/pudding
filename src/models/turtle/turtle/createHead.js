import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { capsuleZ, blob, bakeMesh, seatOnBase } from './geometry.js';

// Centre of the capsule's front cap, in head-local space.
const capCentre = () => CONFIG.head.radius * CONFIG.head.barrel / 2;

// A point on the rounded front cap, addressed by two angles, with the outward normal
// there. The cap is a sphere squashed vertically by `heightScale`, so the normal is the
// ellipsoid gradient rather than the radial direction — features land flush on the skin.
function onCap(theta, phi) {
  const h = CONFIG.head, r = h.radius;
  const sx = Math.sin(theta), sy = Math.sin(phi);
  const sz = Math.sqrt(Math.max(0, 1 - sx * sx - sy * sy));
  const point = new THREE.Vector3(r * sx, r * h.heightScale * sy, capCentre() + r * sz);
  const normal = new THREE.Vector3(sx / r, sy / (r * h.heightScale), sz / r).normalize();
  return { point, normal };
}

// Features are sunk along the surface normal so only a cap stands proud — a dot pressed
// into dough, not a bead resting on it.
function seat(theta, phi, depth) {
  const { point, normal } = onCap(theta, phi);
  return point.addScaledVector(normal, -depth);
}

function addFace(group) {
  const f = CONFIG.face;
  const material = { color: f.color, roughness: 0.44 };

  const eye = blob(f.eyeRadius, { length: 1, height: 1, segments: 24 });
  for (const side of [-1, 1]) {
    const mesh = bakeMesh(`eye${side > 0 ? 'Right' : 'Left'}`, eye.clone(), material);
    mesh.position.copy(seat(side * f.eyeAngle, f.eyeHeight, f.eyeRadius * f.eyeSink));
    mesh.castShadow = false;
    group.add(mesh);
  }

  // A shallow smile: the span sweeps sideways while the drop dips at the middle.
  const points = [];
  for (let i = 0; i <= 24; i++) {
    const k = (i / 24 - 0.5) * 2;
    points.push(seat(k * f.mouthSpan, -f.mouthDrop + f.mouthArc * k * k, f.mouthThickness * f.mouthSink));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const mouth = bakeMesh('mouth', new THREE.TubeGeometry(curve, 48, f.mouthThickness, 10, false), material);
  mouth.castShadow = false;
  group.add(mouth);
}

export function createHead() {
  const h = CONFIG.head;
  const group = new THREE.Group();
  group.name = 'headGroup';
  group.add(bakeMesh('headMesh', capsuleZ({
    radius: h.radius, straight: h.radius * h.barrel, height: h.heightScale,
  }), {
    color: CONFIG.body.color, roughness: CONFIG.body.roughness,
    clearcoat: CONFIG.body.clearcoat, clearcoatRoughness: CONFIG.body.clearcoatRoughness,
  }));
  addFace(group);
  // Set back far enough that the whole barrel's rear is buried in the bun: only the rounded
  // cap clears the rim, so there is no seam, and nothing dips below the flat base.
  group.position.set(0, 0, h.forward);
  group.rotation.x = h.tilt;
  return seatOnBase(group, h.lift);
}

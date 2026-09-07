import { CONFIG } from '../config.js';
import { smoothstep } from './geometry.js';

// How strongly a point lies on the painted spiral, 0 to 1.
//
// The stroke is an Archimedean spiral, r = inner + b·φ. For any point we only need to test
// the two or three windings whose radius could reach it: solving r for this point's radius
// gives a parameter, and the nearest windings are that parameter shifted by whole turns.
// Clamping φ to the stroke's ends and measuring to the point there is what gives the spiral
// rounded caps instead of letting it run on forever.
export function swirlAmount(x, y, z) {
  const s = CONFIG.swirl, R = CONFIG.slice.radius;
  const inner = s.innerRadius * R, outer = s.outerRadius * R;
  const phiMax = s.turns * Math.PI * 2;
  const b = (outer - inner) / phiMax;

  const rho = Math.hypot(x, z);
  const theta = Math.atan2(z, x);
  const guess = (rho - inner) / b;
  const centre = Math.round((guess - theta) / (Math.PI * 2));

  let nearest = Infinity;
  for (let k = centre - 1; k <= centre + 1; k++) {
    const phi = Math.min(Math.max(theta + k * Math.PI * 2, 0), phiMax);
    const r = inner + b * phi;
    nearest = Math.min(nearest, Math.hypot(x - r * Math.cos(phi), z - r * Math.sin(phi)));
  }

  return smoothstep(s.width * 0.5 + s.softness, s.width * 0.5, nearest);
}

// The spiral is printed on the two flat faces only, fading out into the rounded rim.
export function faceAmount(y) {
  const sl = CONFIG.slice, f = sl.edgeFillet, H = sl.height;
  const top = smoothstep(H - f * 0.95, H - f * 0.2, y);
  const bottom = 1 - smoothstep(f * 0.2, f * 0.95, y);
  return Math.max(top, bottom);
}

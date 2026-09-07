import { CONFIG } from '../config.js';
import { smoothstep } from './geometry.js';

// The gathered top, evaluated in polar coordinates.
//
// Each pleat ramps outward from its crease and then falls off a cliff at the next one, so
// the folds read as overlapping shingles the way a hand-pinched bun does — a symmetrical
// ridge-and-valley wave would read as corrugated metal instead. The whole pattern rotates
// as it descends, which is what gives the top its swirl, and every crease converges on a
// small navel at the centre.
export function pleatDisplacement(x, y, z) {
  const p = CONFIG.pleats, H = CONFIG.bun.height;
  const rho = Math.hypot(x, z);
  const v = Math.max(0, Math.min(1, y / H));
  const envelope = smoothstep(p.fadeStart, p.fadeEnd, v);

  let fold = 0;
  if (envelope > 0) {
    // Folds spiral: the angular offset grows as the pleat runs down the shoulder.
    const phi = Math.atan2(z, x) + p.swirl * (1 - v);
    const turns = phi * p.count / (Math.PI * 2);
    const frac = turns - Math.floor(turns);

    // A raised cosine whose phase is warped by a power, which slides the crest past the
    // middle of the pleat: one flank climbs gently, the other falls away steeply, so the
    // fold reads as a shingle. Unlike a ramp with a cliff it is smooth everywhere, and a
    // sharp ridge crossing the mesh diagonally is exactly what shatters recomputed normals
    // into a dashed line.
    const warped = Math.pow(frac, p.foldSkew);
    const ramp = 0.5 - 0.5 * Math.cos(2 * Math.PI * warped);

    // A gouge along the crease itself. Angular distance is converted to surface distance
    // so the crease keeps a constant width instead of pinching shut near the centre.
    const angular = Math.min(frac, 1 - frac) * Math.PI * 2 / p.count;
    const arc = angular * Math.max(rho, p.minRadius);
    const crease = Math.exp(-(arc * arc) / (p.creaseWidth * p.creaseWidth));

    fold = envelope * (p.foldDepth * (ramp - 0.5) - p.creaseDepth * crease);
  }

  const navel = p.dimpleDepth
    * Math.exp(-(rho * rho) / (p.dimpleWidth * p.dimpleWidth))
    * smoothstep(p.dimpleFadeStart, p.dimpleFadeEnd, v);

  return fold - navel;
}

// How strongly a point sits in a crease, for the colour ramp.
export function creaseAmount(x, y, z) {
  const p = CONFIG.pleats, H = CONFIG.bun.height;
  const v = Math.max(0, Math.min(1, y / H));
  const envelope = smoothstep(p.fadeStart, p.fadeEnd, v);
  if (envelope <= 0) return 0;
  const rho = Math.hypot(x, z);
  const phi = Math.atan2(z, x) + p.swirl * (1 - v);
  const turns = phi * p.count / (Math.PI * 2);
  const frac = turns - Math.floor(turns);
  const angular = Math.min(frac, 1 - frac) * Math.PI * 2 / p.count;
  const arc = angular * Math.max(rho, p.minRadius);
  return envelope * Math.exp(-(arc * arc) / (p.creaseWidth * p.creaseWidth * 4));
}

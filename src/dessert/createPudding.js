import { CONFIG, fluteFactor } from '../config.js';
import { revolved, foodMesh, smoothstep } from './geometry.js';

// Squat fluted body. The side wall is generated rather than hand-placed, so the
// surface stays crease-free: hand-set profile points were what made it read as a
// creased cloth bag rather than a smooth set custard.
export function createPudding() {
  const p = CONFIG.pudding, h = p.height, b = p.bottomRadius, t = p.topRadius;
  const rim = t * p.rimRadiusFactor, dome = p.domeHeight;
  const bottom = -h / 2;
  const tuckHeight = p.baseFilletHeight / h;   // where the base rounding blends into the wall
  const tuckDepth = p.baseFillet / b;          // how much the wall pulls in at the very bottom

  // One continuous function for the whole wall: a near-linear taper with a slight
  // outward bow, tucked in by a quarter-ellipse at the base. It leaves the profile
  // horizontal where it meets the flat bottom and tangent to the taper where the
  // rounding ends, so there is no crease anywhere along the side.
  const sideRadius = (u) => {
    const taper = b + (rim - b) * u;
    const bow = 1 + p.bow * Math.sin(Math.PI * u);
    const tuck = u < tuckHeight
      ? 1 - tuckDepth * (1 - Math.sqrt(Math.max(0, 1 - ((tuckHeight - u) / tuckHeight) ** 2)))
      : 1;
    return taper * bow * tuck;
  };

  const profile = [[0, bottom], [sideRadius(0) * 0.55, bottom]];
  for (let i = 0; i <= p.sideSamples; i++) {
    const u = Math.pow(i / p.sideSamples, 1.5);  // denser sampling through the base rounding
    profile.push([sideRadius(u), bottom + h * u]);
  }
  profile.push(
    [rim * 0.985, h / 2 + dome * 0.16],
    [rim * 0.72, h / 2 + dome * 0.62],
    [rim * 0.39, h / 2 + dome * 0.91],
    [0, h / 2 + dome],
  );

  const geometry = revolved(profile, (r, y, a) => {
    const v = (y + h / 2) / h;
    return r * (1 + (fluteFactor(a) - 1) * smoothstep(p.fluteFadeStart, p.fluteFadeEnd, v));
  });
  return foodMesh('puddingMesh', geometry, {
    color: p.color, roughness: p.roughness,
    clearcoat: p.clearcoat, clearcoatRoughness: p.clearcoatRoughness,
  });
}

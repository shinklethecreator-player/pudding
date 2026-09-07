import { CONFIG } from '../config.js';
import { smoothstep } from './geometry.js';

// Distance from t to the nearest line of a family spaced `spacing` apart.
const distanceToLine = (t, spacing) => Math.abs(t / spacing - Math.round(t / spacing)) * spacing;

// The melon-bread score pattern, evaluated in the horizontal plane so the cuts read as
// a straight cross-hatch from above and curve naturally over the dome's flanks.
// Returns { groove, panel }: groove peaks at 1 inside a cut, panel peaks at 1 at the
// centre of a plot of crust.
export function lattice(x, z) {
  const s = CONFIG.shell;
  const c = Math.cos(s.latticeAngle), sn = Math.sin(s.latticeAngle);
  const u = x * c - z * sn, v = x * sn + z * c;
  const du = distanceToLine(u, s.spacing), dv = distanceToLine(v, s.spacing);
  const near = Math.min(du, dv);
  const groove = Math.exp(-(near * near) / (s.grooveWidth * s.grooveWidth));
  const panel = smoothstep(s.grooveWidth * 0.8, s.spacing * 0.5, near);
  return { groove, panel };
}

// The cuts are pressed into the crust only; the rim underneath stays smooth.
export function latticeEnvelope(y) {
  const s = CONFIG.shell;
  return smoothstep(s.lipHeight * 0.2, s.lipHeight * 1.5, y);
}

import { CONFIG } from '../config.js';
import { revolved, foodMesh } from './geometry.js';

// Base height of the cream: the centre of the caramel cap's top surface.
export function creamBaseY() {
  return CONFIG.pudding.height / 2 + CONFIG.caramel.height + CONFIG.pudding.domeHeight * 0.76 - 0.04;
}

// Piped swirl. A tapering dome carries a helical ridge: at any fixed angle the
// radius oscillates once per coil as it climbs, which is exactly the surface a
// piping bag leaves behind, and it stays a single watertight surface.
export function createCream() {
  const c = CONFIG.cream, R = c.width / 2, H = c.height;
  const silhouette = (u) => R * Math.pow(Math.max(0, 1 - Math.pow(u, 1.4)), 0.58);
  const profile = [[0, 0], [R * 0.62, 0]];
  const rows = 46;
  for (let i = 0; i <= rows; i++) {
    const u = i / rows;
    profile.push([Math.max(0.0005, silhouette(u)), H * u]);
  }
  const pitch = c.turns * Math.PI * 2 / H;
  const geometry = revolved(profile, (radius, y, a) => {
    const u = Math.min(1, Math.max(0, y / H));
    const fade = Math.pow(1 - u, 0.32);
    const coil = Math.cos(a + pitch * y);
    const petals = c.petalDepth * Math.cos(c.petals * a + pitch * y);
    return radius * (1 + fade * (c.ridgeDepth * coil + petals));
  });
  const mesh = foodMesh('creamMesh', geometry, {
    color: c.color, roughness: c.roughness, specularIntensity: c.specularIntensity,
  });
  mesh.position.y = creamBaseY();
  return mesh;
}

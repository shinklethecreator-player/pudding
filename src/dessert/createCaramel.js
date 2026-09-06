import { CONFIG, fluteFactor } from '../config.js';
import { revolved, foodMesh } from './geometry.js';

// A thick glossy cap. Its lobes are locked to the pudding's flutes so it hugs the
// body instead of floating out past it, and its underside matches the domed top.
export function createCaramel() {
  const c = CONFIG.caramel, p = CONFIG.pudding;
  const r = p.topRadius * p.rimRadiusFactor * c.hugFactor;
  const th = c.height, dome = p.domeHeight;
  const profile = [
    [0, dome],
    [r * 0.34, dome * 0.9],
    [r * 0.66, dome * 0.58],
    [r * 0.9, dome * 0.2],
    [r * 0.985, 0.015],
    [r, th * 0.42],
    [r * 0.975, th * 0.86],
    [r * 0.86, th],
    [r * 0.6, th + dome * 0.42],
    [r * 0.3, th + dome * 0.68],
    [0, th + dome * 0.76],
  ];
  const geometry = revolved(profile, (radius, y, a) =>
    radius * fluteFactor(a) * (1 + c.wobble * Math.cos(3 * a + 0.7)));
  const mesh = foodMesh('caramelMesh', geometry, {
    color: c.color, roughness: c.roughness,
    clearcoat: c.clearcoat, clearcoatRoughness: c.clearcoatRoughness,
  });
  mesh.position.y = p.height / 2;
  return mesh;
}

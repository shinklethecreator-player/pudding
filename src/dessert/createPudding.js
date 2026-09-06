import { CONFIG } from '../config.js';
import { revolved, foodMesh } from './geometry.js';

export function createPudding() {
  const p = CONFIG.pudding, h = p.height, b = p.bottomRadius, t = p.topRadius;
  const profile = [[0, -h/2], [b*0.7, -h/2], [b*0.94, -h*0.475], [b, -h*0.39], [b*0.985, -h*0.24], [b*0.93, -h*0.06], [t*1.06, h*0.3], [t, h*0.455], [t*0.92, h/2], [t*0.6, h/2], [0,h/2]];
  const geometry = revolved(profile, (r, y, a) => {
    const v = Math.max(0, Math.min(1, (y + h/2)/h));
    return r * (1 + p.fluteDepth * Math.pow(Math.sin(Math.PI*v/2), 0.75) * Math.cos(p.flutes*a));
  });
  return foodMesh('puddingMesh', geometry, { color: p.color, roughness: p.roughness, clearcoat: 0.23, clearcoatRoughness: 0.3 });
}

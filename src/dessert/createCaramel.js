import { CONFIG } from '../config.js';
import { revolved, foodMesh } from './geometry.js';

export function createCaramel() {
  const c = CONFIG.caramel, r = c.radius, h = c.height;
  const profile = [[0,0],[r*0.7,0],[r*0.96,0],[r*1.015,h*0.27],[r*1.015,h*0.65],[r*0.98,h],[r*0.65,h*1.03],[0,h*1.03]];
  const geometry = revolved(profile, (radius, y, a) => radius * (1 + c.waveAmount * Math.cos(c.waves*a)));
  const mesh = foodMesh('caramelMesh', geometry, { color: c.color, roughness: c.roughness, clearcoat: 0.65, clearcoatRoughness: 0.2 });
  mesh.position.y = CONFIG.pudding.height/2 - h*0.3;
  return mesh;
}

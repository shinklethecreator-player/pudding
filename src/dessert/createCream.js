import { CONFIG } from '../config.js';
import { revolved, foodMesh } from './geometry.js';

export function createCream() {
  const c = CONFIG.cream, r = c.width/2, h = c.height;
  const profile = [[0,0],[r*0.62,0],[r*0.93,h*0.08],[r,h*0.25],[r*0.93,h*0.5],[r*0.73,h*0.77],[r*0.4,h*0.96],[0,h]];
  const geometry = revolved(profile, (radius, y, a) => radius * (1 + 0.035*Math.sin(3*a+y*4) + 0.025*Math.cos(5*a)));
  const pos = geometry.attributes.position;
  for (let i=0; i<pos.count; i++) pos.setX(i, pos.getX(i) + 0.085*Math.pow(pos.getY(i)/h,2));
  geometry.computeVertexNormals();
  const mesh = foodMesh('creamMesh', geometry, { color: c.color, roughness: c.roughness, specularIntensity: 0.32 });
  mesh.position.y = CONFIG.pudding.height/2 + CONFIG.caramel.height*0.7 - 0.005;
  return mesh;
}

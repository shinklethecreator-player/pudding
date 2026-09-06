import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { foodMesh } from './geometry.js';

export function createCherry() {
  const c = CONFIG.cherry, r = c.radius;
  const group = new THREE.Group();
  group.name = 'cherryGroup';
  const geometry = new THREE.SphereGeometry(r, 40, 28);
  const p = geometry.attributes.position;
  for (let i=0;i<p.count;i++) {
    const x=p.getX(i), y=p.getY(i), z=p.getZ(i);
    const dent = y>0 ? 0.1*r*Math.exp(-(x*x+z*z)/(r*r*0.13)) : 0;
    p.setXYZ(i, x*(1+0.035*Math.sin(z/r*3)), y*0.94-dent, z*0.94);
  }
  geometry.computeVertexNormals();
  group.add(foodMesh('cherryMesh', geometry, { color: c.color, roughness: c.roughness, clearcoat: 0.8, clearcoatRoughness: 0.17 }));
  const l=c.stemLength;
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0,r*0.8,0),new THREE.Vector3(l*0.13,r+l*0.3,0),new THREE.Vector3(l*0.39,r+l*0.66,0.02),new THREE.Vector3(l*0.7,r+l*0.87,0.035)]);
  group.add(foodMesh('cherryStemMesh', new THREE.TubeGeometry(curve,18,c.stemRadius,8,false), { color:c.stemColor, roughness:0.48 }));
  group.position.set(0.07, CONFIG.pudding.height/2 + CONFIG.caramel.height*0.7 + CONFIG.cream.height + r*0.56, 0);
  return group;
}

import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createPudding} from '../src/dessert/createPudding.js';
import {ClayDeformer} from '../src/deformation/ClayDeformer.js';
import {CONFIG} from '../src/config.js';
const mesh=createPudding(),d=new ClayDeformer(mesh,CONFIG.pudding),normal=new THREE.Vector3(0,0,1);
for(let stroke=0;stroke<12;stroke++){
 d.beginPress();const point=new THREE.Vector3(Math.sin(stroke)*.3,Math.cos(stroke)*.3,1.25);
 for(let frame=0;frame<40;frame++){d.press(point,normal,.85,1/60);d.update(1/60);}
}
let minProjection=Infinity,maxGradient=0;
for(const [i,j,limit] of d.edges){let dot=0,rest2=0,strain2=0;for(let a=0;a<3;a++){const r=d.rest[i+a]-d.rest[j+a],v=d.position.array[i+a]-d.position.array[j+a];dot+=r*v;rest2+=r*r;strain2+=(v-r)**2;}minProjection=Math.min(minProjection,dot/rest2);maxGradient=Math.max(maxGradient,Math.sqrt(strain2/rest2));}
assert(minProjection>0,'Repeated presses must not turn mesh edges inside out');assert(maxGradient<1,'Neighbouring deformation must remain bounded');assert(d.position.array.every(Number.isFinite));
d.reset();assert.deepEqual(d.position.array,d.rest);
console.log('PASS: 12 repeated soft presses; no reversed edges; maximum displacement gradient',maxGradient.toFixed(3),'; exact reset.');

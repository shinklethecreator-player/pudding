import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createModel, clayConfig, applyPuddingColors, puddingColors } from '../src/models/catalog.js';
import { JellyDeformer } from '../src/deformation/JellyDeformer.js';
const model=createModel('jelly');
assert(model.children.every(m=>m.material.transmission>.9 && m.material.roughness<.15));
puddingColors.jelly.body='#55bbff';puddingColors.jelly.topping='#ee88aa';
applyPuddingColors(model,'jelly');
assert.equal(model.getObjectByName('puddingMesh').material.attenuationColor.getHexString(),'55bbff');
assert.equal(model.getObjectByName('caramelMesh').material.attenuationColor.getHexString(),'ee88aa');
assert.equal(createModel('jelly').getObjectByName('puddingMesh').material.attenuationColor.getHexString(),'55bbff');
assert.equal(createModel('pudding').getObjectByName('puddingMesh').material.attenuationColor.getHexString(),'ffc94f');
const cherry=model.getObjectByName('cherryMesh').material;
assert(cherry.color.r > cherry.color.g*3 && cherry.color.r > cherry.color.b*2, 'cherry stays saturated red');
assert(cherry.attenuationDistance < .3, 'small cherry has enough color absorption');
const mesh=model.getObjectByName('puddingMesh'), d=new JellyDeformer(mesh,clayConfig(mesh,'jelly'));
d.beginPress();
const point=new THREE.Vector3(0,0,1.35),normal=new THREE.Vector3(0,0,1);
for(let i=0;i<20;i++){d.press(point,normal,.8,1/60);d.update(1/60);}
let index=0;for(let i=0;i<d.elastic.length;i++)if(Math.abs(d.elastic[i])>Math.abs(d.elastic[index]))index=i;
const held=d.elastic[index];assert(Math.abs(held)>.03);
d.endPress();let overshoot=false;
for(let i=0;i<300;i++){d.update(1/60);if(d.elastic[index]*held<0)overshoot=true;}
assert(overshoot,'jelly should spring past its rest position');
assert(Math.abs(d.elastic[index])<.0001,'jelly settles back to rest');
assert(d.position.array.every(Number.isFinite));
d.reset();assert.deepEqual(d.position.array,d.rest);assert(d.velocity.every(v=>v===0));
console.log('PASS: transparent materials on all parts; two independent colors; color retention and clay isolation; held dent, elastic overshoot, stable settling and exact reset.');

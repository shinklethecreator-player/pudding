import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDessert} from '../src/dessert/createDessert.js';
import {CONFIG} from '../src/config.js';
import {ClayDeformer} from '../src/deformation/ClayDeformer.js';
import {ClayAssembly} from '../src/deformation/ClayAssembly.js';
import {WaxFractureSystem} from '../src/wax/WaxFractureSystem.js';
import {TactileAudio} from '../src/audio/TactileAudio.js';
const dessert=createDessert(),meshes=[];dessert.traverse(o=>{if(o.isMesh)meshes.push(o);});dessert.updateMatrixWorld(true);
const wax=new WaxFractureSystem(meshes),deformers=new Map();
for(const mesh of meshes){const config=mesh.name==='puddingMesh'?CONFIG.pudding:mesh.name==='caramelMesh'?CONFIG.caramelClay:mesh.name==='creamMesh'?CONFIG.cream:CONFIG.cherryClay;deformers.set(mesh,new ClayDeformer(mesh,config));}
const assembly=new ClayAssembly(deformers,wax);wax.peelAll();
for(const name of ['caramelMesh','cherryMesh','cherryStemMesh']){
 const mesh=dessert.getObjectByName(name),d=deformers.get(mesh),point=new THREE.Vector3().fromBufferAttribute(d.position,30);mesh.localToWorld(point);
 assembly.beginGrab(point);for(let i=0;i<12;i++)assembly.pull(new THREE.Vector3(.1,.02,0));for(const d of deformers.values())d.update(.016);
 assert(d.plastic.some(v=>Math.abs(v)>.2),name+' can be pulled beyond its original silhouette');assembly.endGrab();
 for(const d of deformers.values())d.reset();
}
const caramel=dessert.getObjectByName('caramelMesh');const ray=new THREE.Raycaster(new THREE.Vector3(0,1.18,5),new THREE.Vector3(0,0,-1));const hit=ray.intersectObject(caramel,false)[0];assert(hit);
assembly.press(hit,.8,.1);for(const d of deformers.values())d.update(.016);assert(deformers.get(caramel).plastic.some(v=>v!==0));
for(const d of deformers.values())d.reset();assembly.knead();for(let i=0;i<60;i++){assembly.update(1/60);for(const d of deformers.values())d.update(1/60);}
assert.equal(assembly.ball,null);const box=new THREE.Box3(),v=new THREE.Vector3();
for(const [mesh,d] of deformers){assert(d.position.array.every(Number.isFinite));assert(d.plastic.some(v=>v!==0),mesh.name+' joins the lump');for(let i=0;i<d.position.count;i++){v.fromBufferAttribute(d.position,i);mesh.localToWorld(v);box.expandByPoint(v);}}
assert(box.getSize(v).y<2.2,'The full dessert compresses into one compact lump');
assembly.reset();for(const d of deformers.values()){d.reset();assert.deepEqual(d.position.array,d.rest);}wax.reset();
const audio=new TactileAudio();assert.equal(audio.context,null);audio.setEnabled(false);audio.crack();audio.clay();audio.stop();assert.equal(audio.voices.size,0);
console.log('PASS: caramel, cherry and stem pull; shared pressing; whole-dessert compaction; finite geometry; exact reset; audio lazy initialization and mute.');

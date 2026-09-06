import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDessert} from '../src/dessert/createDessert.js';
import {CONFIG,waxProperties} from '../src/config.js';
import {ClayDeformer} from '../src/deformation/ClayDeformer.js';
import {WaxFractureSystem} from '../src/wax/WaxFractureSystem.js';
const dessert=createDessert(),meshes=[];dessert.traverse(o=>{if(o.isMesh)meshes.push(o);});dessert.updateMatrixWorld(true);
const wax=new WaxFractureSystem(meshes);assert.equal(wax.pieces.length,102);
for(const m of meshes)assert(wax.pieces.some(p=>p.source===m),'Entire dessert is coated');
const body=dessert.getObjectByName('puddingMesh');const clay=new ClayDeformer(body,CONFIG.pudding);
const ray=new THREE.Raycaster(new THREE.Vector3(0,0,5),new THREE.Vector3(0,0,-1));
const hit=ray.intersectObject(body,false)[0];assert(hit);const local=body.worldToLocal(hit.point.clone());
clay.press(local,hit.face.normal,1,1/60,v=>wax.exposed(body,v));clay.update(1/60);assert.deepEqual(clay.position.array,clay.rest,'Intact wax prevents deformation');
const piece=wax.pieceAt(hit);let sawCrack=false;for(let i=0;i<200&&piece.state!==3;i++){wax.damage(hit,.8,1/60);if(piece.state===2)sawCrack=true;}
assert(sawCrack);assert.equal(piece.state,3);assert.equal(wax.pieces.filter(p=>p.state===3).length,1,'One contact breaks only one region');
for(let i=0;i<90;i++){clay.press(local,hit.face.normal,1,1/60,v=>wax.exposed(body,v));clay.update(1/60);}
const peak=Math.max(...clay.plastic.map(Math.abs));assert(peak>.005,'Strong pressure leaves plastic strain');
const before=clay.plastic.slice();for(let i=0;i<360;i++)clay.update(1/60);assert.deepEqual(clay.plastic,before,'Plastic strain persists after release');
assert(clay.position.array.every(Number.isFinite));
const thin=waxProperties(.01),thick=waxProperties(.2);assert(thick.offset>thin.offset);assert(thick.opacity>thin.opacity);assert(thick.fractureThreshold/thick.damageRate>thin.fractureThreshold/thin.damageRate);
wax.update(.1);clay.reset();wax.reset();assert.deepEqual(clay.position.array,clay.rest);assert(clay.plastic.every(v=>v===0));
for(const p of wax.pieces){assert.equal(p.state,0);assert(p.shell.position.equals(p.center));assert.equal(p.shell.rotation.x,0);assert.equal(p.velocity.length(),0);assert(!p.crack.visible);}
// Local coordinates must remain correct for a translated cream mesh.
const cream=dessert.getObjectByName('creamMesh'),creamClay=new ClayDeformer(cream,CONFIG.cream);
const creamLocal=new THREE.Vector3(.5,.25,0);const world=cream.localToWorld(creamLocal.clone());assert(cream.worldToLocal(world).distanceTo(creamLocal)<1e-10);
creamClay.press(creamLocal,new THREE.Vector3(1,0,0),1,.2);creamClay.update(.02);assert(creamClay.plastic.some(v=>v!==0));creamClay.reset();assert.deepEqual(creamClay.position.array,creamClay.rest);
// Lightweight sustained load on the actual source geometry.
const start=performance.now();for(let i=0;i<120;i++){clay.press(local,hit.face.normal,.9,1/60);clay.update(1/60);wax.update(1/60);}
console.log('PASS: full coating, raycasting, wax gating, local fracture, persistent dents, thickness mapping, local coordinates, exact reset.');
console.log('120 simulation frames:',Math.round(performance.now()-start),'ms; body vertices:',clay.position.count);

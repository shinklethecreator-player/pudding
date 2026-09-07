import assert from 'node:assert/strict';
import * as THREE from 'three';
import { MODELS, createModel, clayConfig, disposeModel } from '../src/models/catalog.js';
import { WaxFractureSystem } from '../src/wax/WaxFractureSystem.js';
import { ClayDeformer } from '../src/deformation/ClayDeformer.js';
import { ClayAssembly } from '../src/deformation/ClayAssembly.js';
for (const {id} of MODELS) {
  const start = performance.now();
  const model = createModel(id), meshes = [...model.children];
  model.updateMatrixWorld(true);
  const wax = new WaxFractureSystem(meshes, model);
  const deformers = new Map(meshes.map(mesh => [mesh, new ClayDeformer(mesh, clayConfig(mesh,id))]));
  const assembly = new ClayAssembly(deformers, wax);
  assert.equal(model.children.filter(m=>m.name==='continuousWaxEnvelope').length,1);
  assert.equal(wax.cracks.length,0);
  const box = new THREE.Box3().setFromObject(model), center = box.getCenter(new THREE.Vector3());
  const ray = new THREE.Raycaster(center.clone().add(new THREE.Vector3(0,2,5)),new THREE.Vector3(0,-2,-5).normalize());
  const hit = ray.intersectObject(wax.shell)[0];
  assert(hit, `${id}: front wax hit`);
  assert.equal(wax.tap(hit),'cracked');
  assert.equal(wax.pieces.length,0);
  assert(!wax.removed.some(Boolean));
  assert.equal(wax.tap(hit),'broken');
  assert(wax.removed.some(Boolean));
  assert([...wax.sources.values()].some(s=>s.mask.some(v=>v>0)), `${id}: broken wax exposes clay`);
  wax.peelAll();
  const clayHit=ray.intersectObjects(meshes,false)[0];
  assert(clayHit, `${id}: filling hit`);
  assembly.beginGrab(clayHit.point);
  assembly.press(clayHit,.8,.1);
  assembly.pull(new THREE.Vector3(.15,.03,0));
  for(const d of deformers.values())d.update(1/60);
  assert(deformers.get(clayHit.object).plastic.some(v=>Math.abs(v)>.001), `${id}: press and pull`);
  assembly.endGrab(); assembly.knead();
  for(let frame=0;frame<55;frame++) {assembly.update(1/60); for(const d of deformers.values())d.update(1/60);}
  assert.equal(assembly.ball,null);
  for(const d of deformers.values()) {
    assert(d.position.array.every(Number.isFinite));
    d.reset(); assert.deepEqual(d.position.array,d.rest);
  }
  wax.reset(); assert.equal(wax.cracks.length,0);assert(!wax.removed.some(Boolean));
  disposeModel(model);
  console.log(`PASS ${id}: single wax envelope, two taps, exposed filling, press, pull, knead, exact reset (${Math.round(performance.now()-start)} ms)`);
}

import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDessert} from '../src/dessert/createDessert.js';
import {CONFIG,waxProperties} from '../src/config.js';
import {ClayDeformer} from '../src/deformation/ClayDeformer.js';
import {WaxFractureSystem} from '../src/wax/WaxFractureSystem.js';
import {PointerInteraction} from '../src/interaction/PointerInteraction.js';
const dessert=createDessert(),meshes=[];dessert.traverse(o=>{if(o.isMesh)meshes.push(o);});dessert.updateMatrixWorld(true);
const start=performance.now(),wax=new WaxFractureSystem(meshes);
console.log('Envelope preparation:',Math.round(performance.now()-start),'ms');
assert.equal(wax.pieces.length,0,'No preexisting fragments or crack edges');
assert(meshes.every(m=>m.children.length===0),'No separate shell on food components');
assert.equal(wax.shell.parent,dessert);
const edges=new Map(),idx=wax.originalIndex;
for(let i=0;i<idx.length;i+=3)for(let k=0;k<3;k++){const a=idx[i+k],b=idx[i+(k+1)%3],key=Math.min(a,b)+':'+Math.max(a,b);edges.set(key,(edges.get(key)||0)+1);}
assert([...edges.values()].every(n=>n===2),'Envelope is closed, without per-part seams');
const body=dessert.getObjectByName('puddingMesh'),clay=new ClayDeformer(body,CONFIG.pudding);
const ray=new THREE.Raycaster(new THREE.Vector3(0,0,5),new THREE.Vector3(0,0,-1));dessert.updateMatrixWorld(true);
const hit=ray.intersectObject(wax.shell,false)[0];assert(hit);const foodHit=ray.intersectObject(body,false)[0];assert(hit.distance<foodHit.distance);
const local=body.worldToLocal(foodHit.point.clone());clay.press(local,foodHit.face.normal,.75,.2,v=>wax.exposed(body,v));clay.update(.016);assert.deepEqual(clay.position.array,clay.rest);
assert.equal(wax.tap(hit),'cracked');assert.equal(wax.pieces.length,0);assert(wax.removed.every(v=>v===0));assert.equal(wax.cracks.length,1);assert(wax.cracks[0].lines.geometry.attributes.position.count>50);wax.update(1);assert.equal(wax.pieces.length,0);assert.equal(wax.tap(hit),'broken');assert.equal(wax.cracks.length,0);assert(wax.pieces.length>=3&&wax.pieces.length<=8);
assert.equal(ray.intersectObject(wax.shell,false).length,0,'Actual click center is open immediately');
const removed=wax.removed.reduce((a,b)=>a+b,0);assert(removed>0&&removed<wax.removed.length*.2,'Damage remains local');
for(let i=0;i<12;i++){clay.press(local,foodHit.face.normal,.75,1/60,v=>wax.exposed(body,v));clay.update(1/60);}
const dent=Math.max(...clay.position.array.map((v,i)=>Math.abs(v-clay.rest[i])));assert(dent>.1,'A light 200 ms press visibly dents filling');
const elasticBefore=Math.hypot(...clay.elastic);const persistent=clay.plastic.slice();for(let i=0;i<180;i++)clay.update(1/60);assert.deepEqual(clay.plastic,persistent);assert(Math.hypot(...clay.elastic)<elasticBefore*.1,'Soft elastic indentation recovers substantially within three seconds');assert(clay.position.array.every(Number.isFinite));
console.log('Light press dent:',dent.toFixed(3));
wax.reset();clay.reset();assert.deepEqual(wax.shell.geometry.index.array,wax.originalIndex);assert.equal(wax.pieces.length,0);assert(wax.sources.get(body).mask.every(v=>v===0));assert.deepEqual(clay.position.array,clay.rest);
assert(waxProperties(.01).breakRadius>waxProperties(.2).breakRadius);
// A down/up pair with no animation tick must still fracture at every thickness.
const listeners={},canvas={addEventListener:(k,f)=>listeners[k]=f,getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),setPointerCapture(){},hasPointerCapture:()=>false};
globalThis.document={querySelector:()=>({textContent:'',value:0}),addEventListener(){}};globalThis.window={addEventListener(){}};
const camera=new THREE.PerspectiveCamera(50,1,.1,100);camera.position.set(0,0,5);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
const interaction=new PointerInteraction({renderer:{domElement:canvas},controls:{enabled:true},scene:dessert,camera},meshes,wax,new Map([[body,clay]]));
for(const thickness of [.01,.06,.2]){wax.reset();wax.setThickness(thickness);listeners.pointerdown({button:0,pointerId:1,clientX:50,clientY:50,pointerType:'mouse',pressure:0,stopImmediatePropagation(){},preventDefault(){}});for(let i=0;i<120;i++)interaction.update(1/60);assert.equal(wax.pieces.length,0,'Holding first click cannot detach wax');listeners.pointerup({pointerId:1});listeners.pointerdown({button:0,pointerId:1,clientX:50,clientY:50,pointerType:'mouse',pressure:0,stopImmediatePropagation(){},preventDefault(){}});listeners.pointerup({pointerId:1});assert(wax.pieces.length>0);assert.equal(interaction.active,null);}
wax.reset();wax.setThickness(.06);
console.log('PASS: seamless unified coating, two distinct clicks with attached first-stage cracks, click-centered hole, local damage, soft persistent clay, exact reset, hold protection and two clicks at all thicknesses.');

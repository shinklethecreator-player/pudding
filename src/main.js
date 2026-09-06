import './style.css';
import * as THREE from 'three';
import { createDessert } from './dessert/createDessert.js';
import { setupScene } from './scene/setupScene.js';
import { CONFIG } from './config.js';
import { ClayDeformer } from './deformation/ClayDeformer.js';
import { WaxFractureSystem } from './wax/WaxFractureSystem.js';
import { PointerInteraction } from './interaction/PointerInteraction.js';
const dessert=createDessert();
const app=setupScene(document.querySelector('#scene'),dessert);
app.controls.autoRotate=false;
const meshes=[];dessert.traverse(object=>{if(object.isMesh)meshes.push(object);});
const deformers=new Map();
for(const name of ['pudding','cream']) {const mesh=dessert.getObjectByName(name+'Mesh');deformers.set(mesh,new ClayDeformer(mesh,CONFIG[name]));}
const wax=new WaxFractureSystem(meshes);
const interaction=new PointerInteraction(app,meshes,wax,deformers);
const clock=new THREE.Clock();app.controls.saveState();
function resetDessert() {interaction.reset();for(const d of deformers.values())d.reset();wax.reset();app.controls.reset();app.controls.autoRotate=false;}
document.querySelector('#reset').addEventListener('click',resetDessert);
document.querySelector('#thickness').addEventListener('input',e=>{wax.setThickness(Number(e.target.value));document.querySelector('#thickness-value').value=Number(e.target.value).toFixed(2);});
document.querySelector('#pudding-softness').addEventListener('input',e=>{CONFIG.pudding.softness=Number(e.target.value);});
document.querySelector('#cream-softness').addEventListener('input',e=>{CONFIG.cream.softness=Number(e.target.value);});
document.querySelector('#plasticity').addEventListener('input',e=>{CONFIG.pudding.plasticity=Number(e.target.value);CONFIG.cream.plasticity=Math.min(.98,CONFIG.pudding.plasticity+.16);});
app.renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.035);interaction.update(dt);for(const deformer of deformers.values())deformer.update(dt);wax.update(dt);app.controls.update();app.renderer.render(app.scene,app.camera);});
window.pudding={...app,dessert,wax,deformers,interaction,resetDessert,CONFIG};

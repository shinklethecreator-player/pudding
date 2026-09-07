import './style.css';
import * as THREE from 'three';
import { setupScene } from './scene/setupScene.js';
import { CONFIG } from './config.js';
import { ClayDeformer } from './deformation/ClayDeformer.js';
import { WaxFractureSystem } from './wax/WaxFractureSystem.js';
import { ClayAssembly } from './deformation/ClayAssembly.js';
import { TactileAudio } from './audio/TactileAudio.js';
import { PointerInteraction } from './interaction/PointerInteraction.js';
import { MODELS, createModel, clayConfig, disposeModel } from './models/catalog.js';
import { renderModelPreviews } from './models/previews.js';

let currentModel = 'pudding';
let dessert = createModel(currentModel);
const app = setupScene(document.querySelector('#scene'), dessert);
app.controls.autoRotate = false;
const audio = new TactileAudio();
let meshes, deformers, wax, assembly;
function prepareModel() {
  meshes = dessert.children.filter(object => object.isMesh);
  deformers = new Map(meshes.map(mesh => [mesh, new ClayDeformer(mesh, clayConfig(mesh, currentModel))]));
  wax = new WaxFractureSystem(meshes, dessert);
  assembly = new ClayAssembly(deformers, wax);
}
prepareModel();
const interaction = new PointerInteraction(app, meshes, wax, deformers, assembly, audio);
const clock = new THREE.Clock();
app.setModel(dessert);
function exposeState() {
  window.pudding = { ...app, dessert, wax, deformers, interaction, assembly, audio, resetDessert, selectModel, currentModel, CONFIG };
}
function resetDessert() {
  interaction.reset(); assembly.reset(); audio.stop();
  for (const d of deformers.values()) d.reset();
  wax.reset(); app.controls.reset(); app.controls.autoRotate = false;
}
function selectModel(id) {
  if (id === currentModel || !MODELS.some(model => model.id === id)) return;
  interaction.reset(); assembly.reset(); audio.stop();
  wax.reset(); dessert.removeFromParent(); disposeModel(dessert);
  currentModel = id;
  dessert = createModel(id);
  app.scene.add(dessert);
  prepareModel();
  Object.assign(interaction, { meshes, deformers, wax, assembly });
  app.setModel(dessert);
  app.controls.autoRotate = false;
  document.querySelectorAll('[data-model]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.model === id)));
  const label = MODELS.find(model => model.id === id).label;
  document.querySelector('#scene').setAttribute('aria-label', `可揉捏的三维${label}`);
  document.querySelector('#status').textContent = `${label} · 点一下冰裂，再点一下碎开`;
  exposeState();
}
const picker = document.createElement('nav');
picker.className = 'model-picker';
picker.setAttribute('aria-label', '选择捏捏模型');
for (const { id, label } of MODELS) {
  const button = document.createElement('button');
  button.type = 'button'; button.dataset.model = id;
  button.setAttribute('aria-pressed', String(id === currentModel));
  button.setAttribute('aria-label', `切换到${label}`);
  const image = document.createElement('img');
  image.alt = ''; image.width = 96; image.height = 80;
  const caption = document.createElement('span'); caption.textContent = label;
  button.append(image, caption);
  button.addEventListener('click', () => selectModel(id));
  picker.append(button);
}
document.body.append(picker);
// Let the primary canvas appear before rendering the small model portraits.
requestAnimationFrame(() => {
  const previews = renderModelPreviews();
  for (const button of picker.children) button.querySelector('img').src = previews.get(button.dataset.model);
});
document.querySelector('#knead').addEventListener('click', () => {
  interaction.release(); audio.unlock();
  if (wax.removed.some(v => v === 0)) audio.crack();
  assembly.knead();
});
document.querySelector('#sound').addEventListener('click', e => {
  audio.setEnabled(!audio.enabled);
  e.currentTarget.setAttribute('aria-pressed', String(audio.enabled));
  e.currentTarget.textContent = audio.enabled ? '音效：开' : '音效：关';
});
document.querySelector('#reset').addEventListener('click', resetDessert);
document.querySelector('#thickness').addEventListener('input', e => {
  wax.setThickness(Number(e.target.value));
  document.querySelector('#thickness-value').value = Number(e.target.value).toFixed(2);
});
document.querySelector('#pudding-softness').addEventListener('input', e => { CONFIG.pudding.softness = Number(e.target.value); });
document.querySelector('#cream-softness').addEventListener('input', e => { CONFIG.cream.softness = Number(e.target.value); });
document.querySelector('#plasticity').addEventListener('input', e => {
  CONFIG.pudding.plasticity = Number(e.target.value);
  CONFIG.cream.plasticity = Math.min(.98, CONFIG.pudding.plasticity + .07);
});
app.renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), .035);
  interaction.update(dt);
  if (assembly.update(dt)) audio.clay(.8);
  for (const deformer of deformers.values()) deformer.update(dt);
  wax.update(dt); app.controls.update(); app.renderer.render(app.scene, app.camera);
});
exposeState();

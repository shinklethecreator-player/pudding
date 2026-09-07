import * as THREE from 'three';
import { createDessert } from '../dessert/createDessert.js';
import { createTurtle } from './turtle/turtle/createTurtle.js';
import { createBun } from './baozi/bun/createBun.js';
import { createSlice } from './naruto/slice/createSlice.js';
import { CONFIG } from '../config.js';

export const MODELS = [
  { id: 'pudding', label: '布丁', create: createDessert },
  { id: 'turtle', label: '乌龟包', create: createTurtle },
  { id: 'baozi', label: '包子', create: createBun },
  { id: 'naruto', label: '鸣门卷', create: createSlice },
];

export function createModel(id) {
  const entry = MODELS.find(model => model.id === id);
  if (!entry) throw new Error(`Unknown model: ${id}`);
  const source = entry.create();
  if (id === 'turtle') source.rotation.y = 0;
  if (id === 'naruto') source.rotation.x = Math.PI * .28;
  source.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(source);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = id === 'pudding' ? 1 : 3.1 / Math.max(size.x, size.y, size.z);
  const offset = id === 'pudding' ? new THREE.Vector3() :
    new THREE.Vector3(-center.x * scale, -CONFIG.pudding.height / 2 - box.min.y * scale, -center.z * scale);
  const normalize = new THREE.Matrix4().makeTranslation(...offset.toArray())
    .multiply(new THREE.Matrix4().makeScale(scale, scale, scale));
  const result = new THREE.Group();
  result.name = `${id}Group`;
  // Bake the entire hierarchy into a common coordinate system. Facial features
  // and limbs then receive the same world-space clay gesture as the body.
  source.traverse(object => {
    if (!object.isMesh) return;
    const mesh = new THREE.Mesh(object.geometry.clone().applyMatrix4(
      normalize.clone().multiply(object.matrixWorld)), object.material.clone());
    mesh.name = object.name;
    mesh.castShadow = object.castShadow;
    mesh.receiveShadow = true;
    result.add(mesh);
  });
  disposeModel(source);
  return result;
}

export function clayConfig(mesh, id) {
  if (id !== 'pudding') return CONFIG.pudding;
  return mesh.name === 'puddingMesh' ? CONFIG.pudding :
    mesh.name === 'caramelMesh' ? CONFIG.caramelClay :
    mesh.name === 'creamMesh' ? CONFIG.cream : CONFIG.cherryClay;
}

export function disposeModel(group) {
  group.traverse(object => {
    if (!object.isMesh) return;
    object.geometry.dispose();
    for (const material of [].concat(object.material)) material.dispose();
  });
}

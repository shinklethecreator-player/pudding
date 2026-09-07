import * as THREE from 'three';
import { MODELS, createModel, disposeModel } from './catalog.js';

// Render the actual model from the front, with a little elevation to show its top.
// One temporary renderer is shared by all four icons and then released.
export function renderModelPreviews() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(192, 160);
  renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#fff8ef', '#bba790', 2));
  const key = new THREE.DirectionalLight('#fff9ef', 3.2);
  key.position.set(-3, 6, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight('#ffffff', 1);
  fill.position.set(4, 2, 3);
  scene.add(fill);
  const camera = new THREE.OrthographicCamera(-2, 2, 1.67, -1.67, .1, 30);
  const images = new Map();
  for (const { id } of MODELS) {
    const model = createModel(id);
    scene.add(model);
    const box = new THREE.Box3().setFromObject(model), center = box.getCenter(new THREE.Vector3());
    camera.position.copy(center).add(new THREE.Vector3(0, .55, 1).normalize().multiplyScalar(10));
    camera.lookAt(center);
    camera.updateMatrixWorld(true);
    const projected = new THREE.Box3();
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) projected.expandByPoint(new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
    const size = projected.getSize(new THREE.Vector3());
    const height = Math.max(size.y, size.x / 1.2) * 1.12;
    camera.left = -height * .6; camera.right = height * .6;
    camera.top = height / 2; camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    images.set(id, renderer.domElement.toDataURL('image/png'));
    model.removeFromParent();
    disposeModel(model);
  }
  renderer.dispose();
  renderer.forceContextLoss();
  return images;
}

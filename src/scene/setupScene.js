import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CONFIG } from '../config.js';

// A soft radial blob used as a contact shadow, which reads cleaner than a
// shadow-map penumbra alone in the clay/icon look.
function contactShadowTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(96,80,60,1)');
  gradient.addColorStop(0.45, 'rgba(96,80,60,0.55)');
  gradient.addColorStop(1, 'rgba(96,80,60,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function setupScene(container, dessert) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.presentation.background);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, CONFIG.presentation.pixelRatio));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = CONFIG.presentation.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.07);
  scene.environment = environment.texture;
  scene.environmentIntensity = CONFIG.presentation.environmentIntensity;
  room.dispose(); pmrem.dispose();

  scene.add(dessert);
  scene.add(new THREE.HemisphereLight('#fff8e9', '#d9c9b2', CONFIG.light.ambientIntensity));

  const key = new THREE.DirectionalLight('#fff7e9', CONFIG.light.intensity);
  key.position.fromArray(CONFIG.light.keyPosition);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 5, bottom: -4, near: 0.1, far: 20 });
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.025;
  key.shadow.radius = 9;
  scene.add(key);

  const fill = new THREE.DirectionalLight('#ffffff', CONFIG.light.fillIntensity);
  fill.position.set(4, 3, -2);
  scene.add(fill);

  const floorY = -CONFIG.pudding.height / 2 - 0.012;
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.ShadowMaterial({ color: '#635440', opacity: CONFIG.presentation.shadowOpacity }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = floorY;
  floor.receiveShadow = true;
  scene.add(floor);

  const blobRadius = CONFIG.pudding.bottomRadius * CONFIG.presentation.contactScale;
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(blobRadius * 2, blobRadius * 2),
    new THREE.MeshBasicMaterial({
      map: contactShadowTexture(), transparent: true, depthWrite: false,
      opacity: CONFIG.presentation.contactOpacity,
    }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.set(0, floorY + 0.002, 0);
  contact.scale.set(1, 0.78, 1);
  contact.renderOrder = -1;
  scene.add(contact);

  const camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, 1, 0.1, 100);
  const box = new THREE.Box3().setFromObject(dessert);
  const target = new THREE.Vector3().fromArray(CONFIG.camera.target);
  const direction = new THREE.Vector3().fromArray(CONFIG.camera.position).sub(target).normalize();

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(target);
  controls.enabled = CONFIG.controls.enabled;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = CONFIG.controls.dampingFactor;
  controls.autoRotate = CONFIG.controls.autoRotate;
  controls.autoRotateSpeed = CONFIG.controls.autoRotateSpeed;
  controls.minPolarAngle = CONFIG.controls.minPolarAngle;
  controls.maxPolarAngle = CONFIG.controls.maxPolarAngle;
  controls.rotateSpeed = 0.6;
  // Pausing rotation on interaction keeps the model steady while it is being inspected.
  controls.addEventListener('start', () => { controls.autoRotate = false; });

  function frame() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const size = box.getSize(new THREE.Vector3());
    const vertical = size.y + size.z * 0.5;
    const fit = Math.max(vertical, size.x / camera.aspect) /
      (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * CONFIG.camera.framing);
    controls.minDistance = fit * 0.6;
    controls.maxDistance = fit * 1.9;
    return fit;
  }

  const distance = frame();
  camera.position.copy(target).addScaledVector(direction, distance);
  controls.update();

  window.addEventListener('resize', () => {
    const fit = frame();
    const offset = camera.position.clone().sub(controls.target).setLength(fit);
    camera.position.copy(controls.target).add(offset);
    controls.update();
  });

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });

  function setModel(model) {
    box.setFromObject(model);
    box.getCenter(target);
    controls.target.copy(target);
    const distance = frame();
    camera.position.copy(target).addScaledVector(new THREE.Vector3(0, .65, 1).normalize(), distance);
    controls.update();
    controls.saveState();
  }
  new ResizeObserver(() => {
    const fit = frame();
    const offset = camera.position.clone().sub(controls.target).setLength(fit);
    camera.position.copy(controls.target).add(offset);
    controls.update();
  }).observe(container);
  return { scene, renderer, camera, controls, setModel };
}

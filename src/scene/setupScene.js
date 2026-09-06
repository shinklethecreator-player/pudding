import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CONFIG } from '../config.js';

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
  scene.environmentIntensity = 0.42;
  room.dispose(); pmrem.dispose();
  scene.add(dessert);
  scene.add(new THREE.HemisphereLight('#fff8e9','#d7c6ad',CONFIG.light.ambientIntensity));
  const key = new THREE.DirectionalLight('#fff7e9', CONFIG.light.intensity);
  key.position.fromArray(CONFIG.light.keyPosition);
  key.castShadow = true;
  key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera, { left:-4,right:4,top:5,bottom:-4,near:0.1,far:20 });
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.025;
  key.shadow.radius = 5;
  scene.add(key);
  const fill = new THREE.DirectionalLight('#ffffff', CONFIG.light.fillIntensity);
  fill.position.set(4,3,-2); scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({ color:'#635440', opacity:CONFIG.presentation.shadowOpacity }));
  floor.rotation.x = -Math.PI/2;
  floor.position.y = -CONFIG.pudding.height/2 - 0.012;
  floor.receiveShadow=true; scene.add(floor);
  const camera = new THREE.PerspectiveCamera(CONFIG.camera.fov,1,0.1,100);
  const box = new THREE.Box3().setFromObject(dessert);
  const target = new THREE.Vector3().fromArray(CONFIG.camera.target);
  const direction = new THREE.Vector3().fromArray(CONFIG.camera.position).sub(target).normalize();
  function resize() {
    const w=container.clientWidth,h=container.clientHeight;
    renderer.setSize(w,h);
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
    const size=box.getSize(new THREE.Vector3());
    const vertical=size.y + size.z*0.23;
    const fit=Math.max(vertical,size.x/camera.aspect)/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*CONFIG.camera.framing);
    camera.position.copy(target).addScaledVector(direction,fit);
    camera.lookAt(target);
    renderer.render(scene,camera);
  }
  window.addEventListener('resize',resize);
  resize();
  return { scene,renderer,camera };
}

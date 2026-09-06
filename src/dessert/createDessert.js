import * as THREE from 'three';
import { createPudding } from './createPudding.js';
import { createCaramel } from './createCaramel.js';
import { createCream } from './createCream.js';
import { createCherry } from './createCherry.js';

export function createDessert() {
  const dessert = new THREE.Group();
  dessert.name = 'dessertGroup';
  dessert.add(createPudding(), createCaramel(), createCream(), createCherry());
  return dessert;
}

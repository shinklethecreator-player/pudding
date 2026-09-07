import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { createShell } from './createShell.js';
import { createHead } from './createHead.js';
import { createLegs } from './createLegs.js';

export function createTurtle() {
  const turtle = new THREE.Group();
  turtle.name = 'turtleGroup';
  turtle.add(createShell(), createHead(), createLegs());
  turtle.rotation.y = CONFIG.pose.yaw;
  return turtle;
}

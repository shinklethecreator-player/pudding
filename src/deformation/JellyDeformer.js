import { ClayDeformer } from './ClayDeformer.js';

// Damped springs return displaced jelly to rest with a soft overshoot.
export class JellyDeformer extends ClayDeformer {
  constructor(mesh, config) {
    super(mesh, config);
    this.velocity = new Float32Array(this.rest.length);
    this.held = false;
  }
  beginPress() { super.beginPress(); this.held = true; }
  endPress() { this.held = false; }
  update(dt) {
    if (!this.dirty) return;
    this.relaxStrain();
    let active = false;
    const steps = Math.max(1, Math.ceil(dt / .008)), h = dt / steps;
    for (let i = 0; i < this.rest.length; i++) {
      let displacement = this.elastic[i] + this.plastic[i];
      let speed = this.velocity[i];
      this.plastic[i] = 0;
      if (this.held) speed = 0;
      else for (let step = 0; step < steps; step++) {
        speed += (-100 * displacement - 5.5 * speed) * h;
        displacement += speed * h;
      }
      if (Math.abs(displacement) < .00002 && Math.abs(speed) < .0001) { displacement = 0; speed = 0; }
      else active = true;
      this.elastic[i] = displacement;
      this.velocity[i] = speed;
      this.position.array[i] = this.rest[i] + displacement;
    }
    this.position.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
    this.mesh.geometry.computeBoundingSphere();
    this.dirty = active;
  }
  reset() { super.reset(); this.velocity.fill(0); this.held = false; }
}

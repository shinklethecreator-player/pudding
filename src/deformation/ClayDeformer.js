import * as THREE from 'three';

// A stable local-space displacement field, with separate recoverable and yielded strain.
export class ClayDeformer {
  constructor(mesh, config) {
    this.mesh = mesh; this.config = config;
    this.position = mesh.geometry.attributes.position;
    this.rest = this.position.array.slice();
    this.elastic = new Float32Array(this.rest.length);
    this.plastic = new Float32Array(this.rest.length);
    this.scratch = new Float32Array(this.rest.length);
    this.adj = Array.from({ length: this.position.count }, () => new Set());
    const index = mesh.geometry.index.array;
    for (let i = 0; i < index.length; i += 3) {
      const [a,b,c] = [index[i],index[i+1],index[i+2]];
      this.adj[a].add(b).add(c); this.adj[b].add(a).add(c); this.adj[c].add(a).add(b);
    }
    this.adj = this.adj.map(s => [...s]); this.dirty = false; this.normalTick = 0;
    this.delta = new THREE.Vector3();
  }
  press(point, normal, pressure, dt, exposed = () => true, drag = null) {
    const c = this.config, p = this.position.array, radius2 = c.deformationRadius ** 2;
    const retained = THREE.MathUtils.clamp((pressure - c.yieldThreshold) / (1 - c.yieldThreshold), 0, 1) * c.plasticity;
    const changed = [];
    for (let v = 0; v < this.position.count; v++) {
      if (!exposed(v)) continue;
      const i = v * 3, dx = p[i]-point.x, dy = p[i+1]-point.y, dz = p[i+2]-point.z;
      const q = (dx*dx+dy*dy+dz*dz)/radius2;
      if (q >= 1) continue;
      const w = (1-q)**3, amount = pressure * dt * c.strength * c.softness * w;
      for (let axis=0;axis<3;axis++) {
        const strain = -normal.getComponent(axis) * amount + (drag ? drag.getComponent(axis)*w*c.dragInfluence*pressure : 0);
        this.elastic[i+axis] += strain*(1-retained);
        this.plastic[i+axis] += strain*retained;
      }
      for (const field of [this.elastic,this.plastic]) {
        const length = Math.hypot(field[i],field[i+1],field[i+2]);
        const limit = c.maxDent * (field === this.plastic ? 0.85 : 0.55);
        if (length > limit) for(let a=0;a<3;a++) field[i+a] *= limit/length;
      }
      changed.push(v);
    }
    // Smooth only the local displacement, never the original silhouette.
    for (const field of [this.elastic,this.plastic]) {
      this.scratch.set(field);
      for (const v of changed) {
        const neighbors=this.adj[v];
        if (!neighbors.length) continue;
        for(let a=0;a<3;a++) {
          let sum=0; for(const n of neighbors) sum+=this.scratch[n*3+a];
          field[v*3+a] += (sum/neighbors.length-this.scratch[v*3+a])*c.smoothing;
        }
      }
    }
    if(changed.length) this.dirty=true;
  }
  drag(previous, current, normal, pressure, dt, exposed) {
    this.delta.subVectors(current,previous).clampLength(0,0.08);
    this.press(current,normal,pressure,dt,exposed,this.delta);
  }
  update(dt) {
    if(!this.dirty) return;
    const decay=Math.exp(-this.config.recovery*dt); let active=false;
    for(let i=0;i<this.rest.length;i++) {
      this.elastic[i]*=decay;
      if(Math.abs(this.elastic[i])<0.000005) this.elastic[i]=0;
      else active=true;
      this.position.array[i]=this.rest[i]+this.elastic[i]+this.plastic[i];
    }
    this.position.needsUpdate=true;
    if(++this.normalTick%3===0 || !active) this.mesh.geometry.computeVertexNormals();
    this.mesh.geometry.computeBoundingSphere();
    this.dirty=active;
  }
  reset() {
    this.elastic.fill(0); this.plastic.fill(0); this.scratch.fill(0);
    this.position.array.set(this.rest);this.position.needsUpdate=true;
    this.mesh.geometry.computeVertexNormals();this.mesh.geometry.computeBoundingSphere();
    this.dirty=false;this.normalTick=0;
  }
}

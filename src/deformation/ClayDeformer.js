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
    this.edges=[];
    for(let a=0;a<this.adj.length;a++)for(const b of this.adj[a])if(a<b){
      const i=a*3,j=b*3,length=Math.hypot(this.rest[i]-this.rest[j],this.rest[i+1]-this.rest[j+1],this.rest[i+2]-this.rest[j+2]);
      if(length>1e-7)this.edges.push([i,j,length*.82]);
    }
    // Weld duplicate pole/UV-seam positions for deformation, without changing topology.
    const groups=new Map();
    for(let i=0;i<this.rest.length;i+=3){const key=[0,1,2].map(a=>Math.round(this.rest[i+a]*1e5)).join(',');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);}
    this.seams=[...groups.values()].filter(g=>g.length>1);
    this.strokeDepth=0;

  }
  press(point, normal, pressure, dt, exposed = () => true, drag = null) {
    const c = this.config, p = this.position.array, radius2 = c.deformationRadius ** 2;
    // A held finger makes one rounded depression instead of drilling indefinitely.
    const resistance=Math.exp(-this.strokeDepth/(c.deformationRadius*.3));
    const retained = (.2 + .8 * THREE.MathUtils.clamp((pressure - c.yieldThreshold) / (1 - c.yieldThreshold), 0, 1)) * c.plasticity;
    const changed = [];
    for (let v = 0; v < this.position.count; v++) {
      const exposure = Number(exposed(v));
      if (!exposure) continue;
      const i = v * 3, dx = p[i]-point.x, dy = p[i+1]-point.y, dz = p[i+2]-point.z;
      const q = (dx*dx+dy*dy+dz*dz)/radius2;
      if (q >= 1) continue;
      const w = (1 - q*q*q*(10-15*q+6*q*q)) * exposure, amount = pressure * dt * c.strength * c.softness * w * resistance;
      for (let axis=0;axis<3;axis++) {
        const strain = -normal.getComponent(axis) * amount + (drag ? drag.getComponent(axis)*w*c.dragInfluence*pressure : 0);
        this.elastic[i+axis] += strain*(1-retained);
        this.plastic[i+axis] += strain*retained;
      }
      // Plastic displacement has no small rest-shape leash: pulled clay stays
      // where it was sculpted. Only recoverable strain is bounded.
      const elasticLength = Math.hypot(this.elastic[i],this.elastic[i+1],this.elastic[i+2]);
      if(elasticLength > c.maxDent*.55) for(let a=0;a<3;a++) this.elastic[i+a]*=c.maxDent*.55/elasticLength;
      changed.push(v);
    }
    // Smooth only the local displacement, never the original silhouette.
    for (const field of [this.elastic,this.plastic]) for(let pass=0;pass<3;pass++) {
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
    if(changed.length){this.dirty=true;this.strokeDepth+=pressure*dt*c.strength*c.softness*resistance;}
  }
  drag(previous, current, normal, pressure, dt, exposed) {
    this.delta.subVectors(current,previous).clampLength(0,0.08);
    this.press(current,normal,pressure,dt,exposed,this.delta);
  }
  beginPress(){this.strokeDepth=0;}
  relaxStrain(){
    // Bound neighbouring displacement differences. This distributes a pull over
    // the material instead of allowing thin spikes or overturned triangle edges.
    for(let pass=0;pass<5;pass++)for(const [i,j,limit] of this.edges){
      const x=this.plastic[i]+this.elastic[i]-this.plastic[j]-this.elastic[j];
      const y=this.plastic[i+1]+this.elastic[i+1]-this.plastic[j+1]-this.elastic[j+1];
      const z=this.plastic[i+2]+this.elastic[i+2]-this.plastic[j+2]-this.elastic[j+2];
      const length=Math.hypot(x,y,z);if(length<=limit)continue;
      const f=(1-limit/length)*.5;
      for(let a=0;a<3;a++){const correction=(a===0?x:a===1?y:z)*f;this.plastic[i+a]-=correction;this.plastic[j+a]+=correction;}
    }
    for(const group of this.seams)for(const field of [this.plastic,this.elastic])for(let a=0;a<3;a++){
      let mean=0;for(const i of group)mean+=field[i+a];mean/=group.length;for(const i of group)field[i+a]=mean;
    }
  }
  update(dt) {
    if(!this.dirty) return;
    this.relaxStrain();
    const decay=Math.exp(-this.config.recovery*dt); let active=false;
    for(let i=0;i<this.rest.length;i++) {
      this.elastic[i]*=decay;
      if(Math.abs(this.elastic[i])<0.000005) this.elastic[i]=0;
      else active=true;
      this.position.array[i]=this.rest[i]+this.elastic[i]+this.plastic[i];
    }
    this.position.needsUpdate=true;
    this.mesh.geometry.computeVertexNormals();
    this.mesh.geometry.computeBoundingSphere();
    this.dirty=active;
  }
  reset() {
    this.strokeDepth=0;
    this.elastic.fill(0); this.plastic.fill(0); this.scratch.fill(0);
    this.position.array.set(this.rest);this.position.needsUpdate=true;
    this.mesh.geometry.computeVertexNormals();this.mesh.geometry.computeBoundingSphere();
    this.dirty=false;this.normalTick=0;
  }
}

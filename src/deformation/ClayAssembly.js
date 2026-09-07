import * as THREE from 'three';
// Shared world-space gestures act on every ingredient, keeping contact regions
// moving together. Individual geometry and colours remain intact for reset.
export class ClayAssembly {
  constructor(deformers,wax){this.deformers=deformers;this.wax=wax;this.grab=null;this.ball=null;this.v=new THREE.Vector3();}
  beginGrab(point){
    this.grab=[];const radius=1.65;
    for(const d of this.deformers.values())d.beginPress();
    for(const [mesh,d] of this.deformers){
      const weights=new Float32Array(d.position.count);
      for(let i=0;i<weights.length;i++){this.v.fromBufferAttribute(d.position,i);mesh.localToWorld(this.v);const q=this.v.distanceToSquared(point)/(radius*radius);weights[i]=q<1?(1-q)**3*this.wax.exposed(mesh,i):0;}
      this.grab.push({mesh,d,weights});
    }
  }
  pull(delta){
    if(!this.grab)return;const movement=delta.clone().clampLength(0,.18);
    for(const {mesh,d,weights} of this.grab){const local=mesh.worldToLocal(mesh.getWorldPosition(new THREE.Vector3()).add(movement));
      for(let i=0;i<weights.length;i++)if(weights[i])for(let a=0;a<3;a++)d.plastic[i*3+a]+=local.getComponent(a)*weights[i];
      d.dirty=true;
    }
  }
  press(hit,pressure,dt){
    const worldNormal=(hit.normal||hit.face.normal).clone().transformDirection(hit.object.matrixWorld);
    for(const [mesh,d] of this.deformers){const point=mesh.worldToLocal(hit.point.clone());const normal=worldNormal.clone().transformDirection(mesh.matrixWorld.clone().invert());d.press(point,normal,pressure,dt,v=>this.wax.exposed(mesh,v));}
  }
  endGrab(){this.grab=null;for(const d of this.deformers.values())d.endPress?.();}
  knead(){
    this.endGrab();this.wax.peelAll();
    const box=new THREE.Box3();for(const [mesh,d] of this.deformers)for(let i=0;i<d.position.count;i++){this.v.fromBufferAttribute(d.position,i);mesh.localToWorld(this.v);box.expandByPoint(this.v);}
    const center=box.getCenter(new THREE.Vector3());center.y=-.03;
    this.ball={elapsed:0,fields:[]};let layer=0;
    for(const [mesh,d] of this.deformers){const from=d.position.array.slice(),to=new Float32Array(from.length),radius=1.04+layer++*.008;
      for(let i=0;i<d.position.count;i++){
        this.v.fromArray(from,i*3);mesh.localToWorld(this.v);this.v.sub(center);
        // Broad compression and rounding; all ingredients join the same lump.
        this.v.y*=.8;const length=this.v.length();if(length>radius)this.v.multiplyScalar(radius/length);
        this.v.add(center);mesh.worldToLocal(this.v);this.v.toArray(to,i*3);
      }
      this.ball.fields.push({d,from,to});
    }
  }
  update(dt){if(!this.ball)return false;const b=this.ball;b.elapsed+=dt;const t=Math.min(1,b.elapsed/.85),ease=t*t*(3-2*t);
    for(const {d,from,to} of b.fields){for(let i=0;i<from.length;i++){d.elastic[i]=0;d.plastic[i]=THREE.MathUtils.lerp(from[i],to[i],ease)-d.rest[i];}d.dirty=true;}
    if(t===1)this.ball=null;return true;
  }
  reset(){this.grab=null;this.ball=null;}
}

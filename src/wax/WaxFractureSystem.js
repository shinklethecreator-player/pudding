import * as THREE from 'three';
import { CONFIG, waxProperties } from '../config.js';

export class WaxFractureSystem {
  constructor(meshes) {
    this.pieces=[]; this.sources=new Map(); this.properties=waxProperties();
    for(const mesh of meshes) this.create(mesh,CONFIG.wax.fragments[mesh.name] || 3);
  }
  create(source, count) {
    const g=source.geometry, p=g.attributes.position, normals=g.attributes.normal, index=g.index.array;
    const centers=[];
    for(let i=0;i<index.length;i+=3) {
      const c=new THREE.Vector3();for(let a=0;a<3;a++)c.add(new THREE.Vector3().fromBufferAttribute(p,index[i+a]));centers.push(c.multiplyScalar(1/3));
    }
    // Farthest-point seeds create deterministic, spatially coherent irregular patches.
    const seeds=[centers[Math.floor(centers.length*.37)].clone()], distances=new Float64Array(centers.length).fill(Infinity);
    while(seeds.length<count) {
      let far=0;
      for(let i=0;i<centers.length;i++) {distances[i]=Math.min(distances[i],centers[i].distanceToSquared(seeds.at(-1)));if(distances[i]>distances[far])far=i;}
      seeds.push(centers[far].clone());
    }
    const groups=Array.from({length:count},()=>[]), mapping=new Uint16Array(centers.length);
    for(let i=0;i<centers.length;i++) {
      let best=0,d=Infinity;for(let s=0;s<count;s++){const v=centers[i].distanceToSquared(seeds[s]);if(v<d){d=v;best=s;}}
      groups[best].push(i);mapping[i]=this.pieces.length+best;
    }
    const vertexPieces=Array.from({length:p.count},()=>new Set());
    for(let face=0;face<mapping.length;face++)for(let a=0;a<3;a++)vertexPieces[index[face*3+a]].add(mapping[face]);
    this.sources.set(source,{mapping,vertexPieces});
    for(let s=0;s<count;s++) {
      const faces=groups[s], edges=new Map(), positions=[], ns=[], outerCount=faces.length*3;
      const center=new THREE.Vector3();for(const face of faces)center.add(centers[face]);center.divideScalar(faces.length||1);
      for(const face of faces) {
        for(let a=0;a<3;a++) {
          const v=index[face*3+a];positions.push(p.getX(v)-center.x,p.getY(v)-center.y,p.getZ(v)-center.z);ns.push(normals.getX(v),normals.getY(v),normals.getZ(v));
          const b=index[face*3+(a+1)%3],key=Math.min(v,b)+':'+Math.max(v,b);
          if(edges.has(key))edges.delete(key);else edges.set(key,[v,b]);
        }
      }
      // Edge skirts give fragments a real thickness without a Boolean operation.
      const rims=[];
      for(const [a,b] of edges.values()) for(const [v,outer] of [[a,1],[a,0],[b,1],[b,1],[a,0],[b,0]]) {
        positions.push(p.getX(v)-center.x,p.getY(v)-center.y,p.getZ(v)-center.z);
        ns.push(normals.getX(v)*outer,normals.getY(v)*outer,normals.getZ(v)*outer);
      }
      const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      const material=new THREE.MeshPhysicalMaterial({color:'#fff8df',transparent:true,opacity:this.properties.opacity,roughness:0.3,metalness:0,clearcoat:0.38,side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
      const shell=new THREE.Mesh(geom,material);shell.position.copy(center);source.add(shell);shell.renderOrder=2;
      const crackPositions=[];
      for(const [a,b] of edges.values()) for(const v of [a,b]) {crackPositions.push(p.getX(v)-center.x,p.getY(v)-center.y,p.getZ(v)-center.z);rims.push(normals.getX(v),normals.getY(v),normals.getZ(v));}
      const crackGeo=new THREE.BufferGeometry();crackGeo.setAttribute('position',new THREE.Float32BufferAttribute(crackPositions,3));
      const crack=new THREE.LineSegments(crackGeo,new THREE.LineBasicMaterial({color:'#8c6440',transparent:true,opacity:0.65,depthWrite:false}));crack.visible=false;shell.add(crack);
      const piece={source,shell,crack,center,base:Float32Array.from(positions),normals:Float32Array.from(ns),crackBase:Float32Array.from(crackPositions),crackNormals:Float32Array.from(rims),outerCount,damage:0,state:0,velocity:new THREE.Vector3(),spin:new THREE.Vector3(),age:0};
      this.pieces.push(piece);this.resize(piece);
    }
  }
  resize(piece) {
    const pos=piece.shell.geometry.attributes.position, cp=piece.crack.geometry.attributes.position,o=this.properties.offset;
    for(let i=0;i<pos.array.length;i++)pos.array[i]=piece.base[i]+piece.normals[i]*o;
    for(let i=0;i<cp.array.length;i++)cp.array[i]=piece.crackBase[i]+piece.crackNormals[i]*(o+0.002);
    pos.needsUpdate=cp.needsUpdate=true;piece.shell.geometry.computeVertexNormals();piece.shell.geometry.computeBoundingSphere();piece.crack.geometry.computeBoundingSphere();piece.shell.material.opacity=this.properties.opacity;
  }
  setThickness(value) {CONFIG.wax.thickness=value;this.properties=waxProperties(value);for(const piece of this.pieces)this.resize(piece);}
  pieceAt(hit) {return this.pieces[this.sources.get(hit.object)?.mapping[hit.faceIndex]];}
  exposed(source, vertex) {return [...this.sources.get(source).vertexPieces[vertex]].every(i=>this.pieces[i].state===3);}
  damage(hit,pressure,dt) {
    const piece=this.pieceAt(hit);if(!piece || piece.state===3)return false;
    piece.damage+=pressure*dt*this.properties.damageRate/this.properties.fractureThreshold;
    piece.state=piece.damage>.48?2:piece.damage>.16?1:0;
    piece.crack.visible=piece.state===2;
    piece.shell.material.color.set(piece.state ? '#fffdf2':'#fff8df');
    if(piece.damage>=1) {
      piece.state=3;piece.crack.visible=false;
      const normal=hit.face.normal.clone().normalize();
      piece.velocity.copy(normal).multiplyScalar(this.properties.impulse);piece.velocity.y+=0.25;
      const seed=this.pieces.indexOf(piece)+1;piece.spin.set(Math.sin(seed)*2,Math.cos(seed*2)*2,Math.sin(seed*3)*2);
      piece.shell.material.opacity=Math.min(0.9,this.properties.opacity+0.18);
    }
    return true;
  }
  update(dt) {
    for(const p of this.pieces)if(p.state===3&&p.shell.visible) {
      p.age+=dt;p.velocity.y-=2.4*dt;p.shell.position.addScaledVector(p.velocity,dt);
      p.shell.rotation.x+=p.spin.x*dt;p.shell.rotation.y+=p.spin.y*dt;p.shell.rotation.z+=p.spin.z*dt;
      // Floor height expressed in the source mesh's local coordinates.
      const ground=-CONFIG.pudding.height/2-p.source.getWorldPosition(new THREE.Vector3()).y+0.035;
      if(p.shell.position.y<ground){p.shell.position.y=ground;p.velocity.set(0,0,0);p.spin.multiplyScalar(Math.exp(-dt*10));}
      if(p.age>5){p.shell.material.opacity=Math.max(0,p.shell.material.opacity-dt*.6);if(p.shell.material.opacity===0)p.shell.visible=false;}
    }
  }
  reset() {for(const p of this.pieces){p.state=0;p.damage=0;p.age=0;p.velocity.set(0,0,0);p.spin.set(0,0,0);p.shell.position.copy(p.center);p.shell.rotation.set(0,0,0);p.shell.visible=true;p.crack.visible=false;p.shell.material.color.set('#fff8df');p.shell.material.opacity=this.properties.opacity;}}
}

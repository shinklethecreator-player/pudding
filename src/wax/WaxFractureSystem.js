import * as THREE from 'three';
import { CONFIG, waxProperties } from '../config.js';
import {createIceCracks} from './IceCracks.js';
import {createEnvelope} from './createEnvelope.js';

export class WaxFractureSystem {
  constructor(meshes,parent=meshes[0].parent) {
    this.parent=parent;this.meshes=meshes;this.properties=waxProperties();this.pieces=[];this.cracks=[];this.holes=[];this.sources=new Map();
    const geometry=createEnvelope(meshes,parent);
    this.base=geometry.attributes.position.array.slice();this.normals=geometry.attributes.normal.array.slice();
    this.originalIndex=geometry.index.array.slice();this.removed=new Uint8Array(this.originalIndex.length/3);
    this.shell=new THREE.Mesh(geometry,new THREE.MeshPhysicalMaterial({color:'#fff5db',transparent:true,opacity:this.properties.opacity,roughness:.28,clearcoat:.42,side:THREE.FrontSide,depthWrite:false}));
    this.shell.name='continuousWaxEnvelope';this.shell.renderOrder=2;parent.add(this.shell);
    parent.updateMatrixWorld(true);
    const inverse=parent.matrixWorld.clone().invert(),v=new THREE.Vector3();
    for(const source of meshes){
      const p=source.geometry.attributes.position,m=inverse.clone().multiply(source.matrixWorld),rest=new Float32Array(p.count*3);
      for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m);v.toArray(rest,i*3);}
      this.sources.set(source,{rest,mask:new Float32Array(p.count)});
    }
    this.setThickness(CONFIG.wax.thickness);
  }
  setThickness(value) {
    CONFIG.wax.thickness=value;this.properties=waxProperties(value);
    const p=this.shell.geometry.attributes.position;
    for(let i=0;i<p.array.length;i++)p.array[i]=this.base[i]+this.normals[i]*this.properties.offset;
    p.needsUpdate=true;this.shell.geometry.computeBoundingSphere();this.shell.material.opacity=this.properties.opacity;
    for(const c of this.cracks){this.clearCrack(c);c.lines=createIceCracks(this.shell,this.parent,c.point,c.normal,c.radius);}
  }
  clearCrack(crack){crack.lines.removeFromParent();crack.lines.geometry.dispose();crack.lines.material.dispose();}
  tap(hit){
    if(hit.object!==this.shell)return null;
    const point=this.parent.worldToLocal(hit.point.clone()),normal=(hit.normal||hit.face.normal).clone().normalize();
    const existing=this.cracks.find(c=>c.point.distanceTo(point)<c.radius*.92&&c.normal.dot(normal)>.25);
    if(existing){
      const centered={...hit,point:this.parent.localToWorld(existing.point.clone()),face:{normal:existing.normal}};
      this.breakAt(centered);
      this.clearCrack(existing);this.cracks.splice(this.cracks.indexOf(existing),1);return 'broken';
    }
    const radius=this.properties.breakRadius;
    const lines=createIceCracks(this.shell,this.parent,point,normal,radius);
    this.cracks.push({point,normal,radius,lines});return 'cracked';
  }
  exposed(source,vertex){return this.sources.get(source).mask[vertex];}
  // All wedges are generated only on impact, about the actual pointer contact.
  breakAt(hit) {
    if(hit.object!==this.shell)return false;
    const point=this.parent.worldToLocal(hit.point.clone()),normal=hit.face.normal.clone().normalize(),radius=this.properties.breakRadius;
    const tangent=new THREE.Vector3().crossVectors(normal,Math.abs(normal.y)<.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0)).normalize();
    const bitangent=new THREE.Vector3().crossVectors(normal,tangent),groups=Array.from({length:8},()=>[]);
    const p=this.shell.geometry.attributes.position,n=this.shell.geometry.attributes.normal,c=new THREE.Vector3(),d=new THREE.Vector3(),fn=new THREE.Vector3();
    let removed=0;
    for(let f=0;f<this.removed.length;f++){
      if(this.removed[f])continue;c.set(0,0,0);fn.set(0,0,0);
      for(let k=0;k<3;k++){const id=this.originalIndex[f*3+k];c.add(d.fromBufferAttribute(p,id));fn.add(d.fromBufferAttribute(n,id));}
      c.multiplyScalar(1/3);d.subVectors(c,point);const depth=d.dot(normal);if(Math.abs(depth)>radius*.75||fn.normalize().dot(normal)<.05)continue;
      const x=d.dot(tangent),y=d.dot(bitangent),angle=Math.atan2(y,x),edge=radius*(1+.09*Math.sin(angle*7+.3)+.055*Math.sin(angle*11));
      if(x*x+y*y>edge*edge)continue;
      this.removed[f]=1;removed++;
      groups[Math.min(7,Math.floor((angle+Math.PI)/(Math.PI*2)*8))].push(f);
    }
    if(!removed)return false;
    const index=this.shell.geometry.index;
    // BufferAttribute's itemSize is 1 for an index; write triangle slots directly.
    for(let f=0;f<this.removed.length;f++)if(this.removed[f])index.array.fill(0,f*3,f*3+3);
    index.needsUpdate=true;
    for(const faces of groups)if(faces.length)this.fragment(faces,point,normal,tangent,bitangent);
    this.holes.push({point,normal,radius});
    // Expose a smooth field based on the original filling surface, so deep dents
    // never become locked again and intact wax keeps supporting adjacent filling.
    for(const {rest,mask} of this.sources.values())for(let i=0;i<mask.length;i++){
      d.fromArray(rest,i*3).sub(point);const depth=d.dot(normal);
      if(depth>.12||depth< -radius*1.15)continue;
      const lateral=Math.sqrt(Math.max(0,d.lengthSq()-depth*depth));
      const weight=1-THREE.MathUtils.smoothstep(lateral,radius*.55,radius*.96);
      mask[i]=Math.max(mask[i],weight);
    }
    return true;
  }
  fragment(faces,point,normal) {
    const p=this.shell.geometry.attributes.position,n=this.shell.geometry.attributes.normal,center=new THREE.Vector3(),v=new THREE.Vector3(),edges=new Map();
    let total=0;for(const f of faces)for(let k=0;k<3;k++){center.add(v.fromBufferAttribute(p,this.originalIndex[f*3+k]));total++;}center.divideScalar(total);
    const positions=[],normals=[];
    for(const f of faces)for(let k=0;k<3;k++){
      const a=this.originalIndex[f*3+k],b=this.originalIndex[f*3+(k+1)%3];v.fromBufferAttribute(p,a).sub(center);positions.push(v.x,v.y,v.z);normals.push(n.getX(a),n.getY(a),n.getZ(a));
      const key=Math.min(a,b)+':'+Math.max(a,b);if(edges.has(key))edges.delete(key);else edges.set(key,[a,b]);
    }
    const thickness=this.properties.offset*.75;
    for(const [a,b] of edges.values())for(const [id,inner] of [[a,0],[a,1],[b,0],[b,0],[a,1],[b,1]]){
      v.fromBufferAttribute(p,id).sub(center);if(inner)v.addScaledVector(new THREE.Vector3().fromBufferAttribute(n,id),-thickness);positions.push(v.x,v.y,v.z);normals.push(n.getX(id),n.getY(id),n.getZ(id));
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
    const shell=new THREE.Mesh(geometry,new THREE.MeshPhysicalMaterial({color:'#fff4d8',roughness:.32,transparent:true,opacity:.78,side:THREE.DoubleSide,depthWrite:false}));shell.position.copy(center);this.parent.add(shell);
    const outward=center.clone().sub(point).normalize();const velocity=outward.multiplyScalar(.025).addScaledVector(normal,.035);velocity.y-=.04;
    const seed=this.pieces.length+1;this.pieces.push({shell,velocity,spin:new THREE.Vector3(Math.sin(seed)*3,Math.cos(seed*2)*3,Math.sin(seed*3)*3),age:0});
    while(this.pieces.length>96)this.disposePiece(this.pieces.shift());
  }
  disposePiece(p){p.shell.removeFromParent();p.shell.geometry.dispose();p.shell.material.dispose();}
  update(dt){
    for(let i=this.pieces.length-1;i>=0;i--){const p=this.pieces[i];p.age+=dt;p.velocity.y-=3.5*dt;p.shell.position.addScaledVector(p.velocity,dt);p.shell.rotation.x+=p.spin.x*dt;p.shell.rotation.y+=p.spin.y*dt;p.shell.rotation.z+=p.spin.z*dt;
      if(p.age>.35)p.shell.material.opacity=Math.max(0,.78-(p.age-.35)*1.1);
      if(p.age>1.1){this.disposePiece(p);this.pieces.splice(i,1);}
    }
  }
  peelAll(){for(const c of this.cracks)this.clearCrack(c);this.cracks=[];this.removed.fill(1);this.shell.geometry.index.array.fill(0);this.shell.geometry.index.needsUpdate=true;for(const source of this.sources.values())source.mask.fill(1);}
  reset(){for(const c of this.cracks)this.clearCrack(c);this.cracks=[];for(const p of this.pieces)this.disposePiece(p);this.pieces=[];this.holes=[];this.removed.fill(0);this.shell.geometry.index.array.set(this.originalIndex);this.shell.geometry.index.needsUpdate=true;for(const source of this.sources.values())source.mask.fill(0);}
}

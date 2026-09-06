import * as THREE from 'three';

// Project each fine branch onto the intact exterior: cracks cling to the wax.
export function createIceCracks(shell, parent, point, normal, radius) {
  parent.updateMatrixWorld(true);
  const tangent=new THREE.Vector3().crossVectors(normal,Math.abs(normal.y)<.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0)).normalize();
  const bitangent=new THREE.Vector3().crossVectors(normal,tangent),ray=new THREE.Raycaster(),positions=[];
  const direction=normal.clone().negate().transformDirection(parent.matrixWorld);
  function project(x,y){
    const origin=point.clone().addScaledVector(tangent,x).addScaledVector(bitangent,y).addScaledVector(normal,radius*1.5);
    parent.localToWorld(origin);ray.set(origin,direction);const hit=ray.intersectObject(shell,false)[0];
    if(!hit)return null;
    return parent.worldToLocal(hit.point.clone()).addScaledVector(normal,.003);
  }
  function path(points){let last=null;for(const [x,y] of points){const p=project(x,y);if(p&&last&&p.distanceTo(last)<radius*.3)positions.push(...last.toArray(),...p.toArray());last=p;}}
  for(let arm=0;arm<5;arm++){
    const angle=arm*Math.PI*2/5+.13*Math.sin(arm*4.7),length=radius*(.78+.17*Math.sin(arm*2.3+1));
    const points=[];
    for(let i=0;i<=15;i++){const r=length*i/15,a=angle+.045*Math.sin(i*1.7+arm)*i/15;points.push([Math.cos(a)*r,Math.sin(a)*r]);}
    path(points);
    for(const sign of (arm===1||arm===3?[1]:[])){const start=points[sign===1?7:11],branch=[];for(let i=0;i<=6;i++){const r=radius*.25*i/6,a=angle+sign*.58+.06*Math.sin(i);branch.push([start[0]+Math.cos(a)*r,start[1]+Math.sin(a)*r]);}path(branch);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const lines=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:'#a78d68',transparent:true,opacity:.72,depthWrite:false}));lines.renderOrder=3;parent.add(lines);return lines;
}

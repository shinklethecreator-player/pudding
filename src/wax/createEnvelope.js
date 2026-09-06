import * as THREE from 'three';

// A single exterior envelope from horizontal sections of the whole dessert.
// Internal contact surfaces are discarded; each angular sample keeps only the
// outermost intersection. The source food geometry is never changed.
export function createEnvelope(meshes, parent) {
  parent.updateMatrixWorld(true);
  const inverse=parent.matrixWorld.clone().invert();
  const triangles=[];let minY=Infinity,maxY=-Infinity;
  const v=new THREE.Vector3();
  for(const mesh of meshes){
    const matrix=inverse.clone().multiply(mesh.matrixWorld),p=mesh.geometry.attributes.position,idx=mesh.geometry.index.array;
    const points=[];
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(matrix);points.push(v.clone());minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y);}
    for(let i=0;i<idx.length;i+=3)triangles.push([points[idx[i]],points[idx[i+1]],points[idx[i+2]]]);
  }
  const rows=200,sides=128,step=(maxY-minY)/rows;
  const sections=Array.from({length:rows},()=>[]);
  for(const tri of triangles){
    const low=Math.min(...tri.map(p=>p.y)),high=Math.max(...tri.map(p=>p.y));
    const first=Math.max(0,Math.ceil((low-minY)/step-.5)),last=Math.min(rows-1,Math.floor((high-minY)/step-.5));
    for(let row=first;row<=last;row++){
      const y=minY+(row+.5)*step,points=[];
      for(let e=0;e<3;e++){
        const a=tri[e],b=tri[(e+1)%3];if((a.y<=y&&b.y>y)||(b.y<=y&&a.y>y)){
          const t=(y-a.y)/(b.y-a.y);points.push([a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t]);
        }
      }
      if(points.length===2)sections[row].push(points);
    }
  }
  const centers=sections.map(segments=>{
    let x0=Infinity,x1=-Infinity,z0=Infinity,z1=-Infinity;
    for(const s of segments)for(const p of s){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);z0=Math.min(z0,p[1]);z1=Math.max(z1,p[1]);}
    return segments.length?[(x0+x1)/2,(z0+z1)/2]:[0,0];
  });
  const positions=[],indices=[];
  for(let row=0;row<rows;row++){
    const [cx,cz]=centers[row];
    for(let col=0;col<sides;col++){
      const a=col/sides*Math.PI*2,dx=Math.cos(a),dz=Math.sin(a);let radius=0;
      for(const [p,q] of sections[row]){
        const sx=q[0]-p[0],sz=q[1]-p[1],px=p[0]-cx,pz=p[1]-cz,den=dx*sz-dz*sx;
        if(Math.abs(den)<1e-10)continue;
        const t=(px*sz-pz*sx)/den,u=(px*dz-pz*dx)/den;
        if(u>=-1e-6&&u<=1+1e-6&&t>radius)radius=t;
      }
      positions.push(cx+Math.max(.003,radius)*dx,minY+(row+.5)*step,cz+Math.max(.003,radius)*dz);
    }
  }
  for(let row=0;row<rows-1;row++)for(let c=0;c<sides;c++){
    const a=row*sides+c,b=row*sides+(c+1)%sides;indices.push(a,a+sides,b,b,a+sides,b+sides);
  }
  const bottom=positions.length/3;positions.push(centers[0][0],minY,centers[0][1]);
  const top=positions.length/3;positions.push(centers.at(-1)[0],maxY,centers.at(-1)[1]);
  for(let c=0;c<sides;c++){indices.push(bottom,c,(c+1)%sides);indices.push((rows-1)*sides+c,top,(rows-1)*sides+(c+1)%sides);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  return geometry;
}

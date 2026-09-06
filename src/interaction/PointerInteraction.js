import * as THREE from 'three';
import { CONFIG } from '../config.js';
export class PointerInteraction {
  constructor(app, meshes, wax, deformers) {
    Object.assign(this,{app,meshes,wax,deformers});this.canvas=app.renderer.domElement;
    this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.local=new THREE.Vector3();this.previous=new THREE.Vector3();
    this.active=null;this.previousMesh=null;this.hold=0;this.pressure=0;this.movement=0;this.hardware=0;
    this.status=document.querySelector('#status');this.meter=document.querySelector('#pressure');
    this.canvas.addEventListener('pointerdown',e=>{
      if(e.button!==0 || this.active!==null)return;
      this.locate(e);const hit=this.hit();if(!hit)return;
      e.stopImmediatePropagation();e.preventDefault();
      this.active=e.pointerId;this.canvas.setPointerCapture(e.pointerId);
      app.controls.enabled=false;app.controls.autoRotate=false;
      this.hold=0;this.previousMesh=null;this.hardware=e.pointerType==='pen'?e.pressure:0;
      this.lastX=e.clientX;this.lastY=e.clientY;
    },{capture:true});
    this.canvas.addEventListener('pointermove',e=>{
      if(this.active!==e.pointerId)return;
      this.locate(e);this.movement+=Math.hypot(e.clientX-this.lastX,e.clientY-this.lastY);
      this.lastX=e.clientX;this.lastY=e.clientY;this.hardware=e.pointerType==='pen'?e.pressure:0;
    });
    const release=e=>{if(this.active===e.pointerId)this.release();};
    this.canvas.addEventListener('pointerup',release);this.canvas.addEventListener('pointercancel',release);this.canvas.addEventListener('lostpointercapture',release);
    window.addEventListener('blur',()=>this.release());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.release();});
  }
  locate(e) {const r=this.canvas.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);}
  hit() {this.app.scene.updateMatrixWorld(true);this.ray.setFromCamera(this.pointer,this.app.camera);return this.ray.intersectObjects(this.meshes,false)[0];}
  release() {
    const id=this.active;this.active=null;
    if(id!==null && this.canvas.hasPointerCapture(id))this.canvas.releasePointerCapture(id);
    this.app.controls.enabled=true;this.pressure=0;this.hold=0;this.hardware=0;this.movement=0;this.previousMesh=null;this.meter.value=0;
  }
  update(dt) {
    if(this.active===null)return;
    this.hold+=dt;
    this.pressure=Math.min(CONFIG.interaction.maxPressure,Math.max(this.hardware,.22+this.hold*CONFIG.interaction.holdPressureSpeed+Math.min(.2,this.movement*CONFIG.interaction.dragPressureScale)));
    this.movement*=Math.exp(-dt*10);this.meter.value=this.pressure;
    const hit=this.hit();if(!hit){this.previousMesh=null;this.status.textContent='移回布丁表面，继续揉捏';return;}
    const piece=this.wax.pieceAt(hit);
    if(piece&&piece.state!==3) {
      this.wax.damage(hit,this.pressure,dt);this.previousMesh=null;
      this.status.textContent=piece.state===3?'蜡壳脱落了 · 继续按压柔软内芯':piece.state===2?'出现裂纹了 · 再用一点力':'蜡壳正在承受压力…';return;
    }
    const deformer=this.deformers.get(hit.object);
    if(!deformer){this.status.textContent='这部分保持形状 · 试着揉捏布丁或奶油';return;}
    this.local.copy(hit.point);hit.object.worldToLocal(this.local);
    const normal=hit.face.normal;
    const exposed=v=>this.wax.exposed(hit.object,v);
    if(this.previousMesh===hit.object && this.previous.distanceToSquared(this.local)<.2)deformer.drag(this.previous,this.local,normal,this.pressure,dt,exposed);
    else deformer.press(this.local,normal,this.pressure,dt,exposed);
    this.previous.copy(this.local);this.previousMesh=hit.object;
    this.status.textContent=hit.object.name==='creamMesh'?'轻轻推开奶油 · 留下柔软的形状':'慢慢揉捏 · 重压会留下凹痕';
  }
  reset() {this.release();this.pointer.set(0,0);this.local.set(0,0,0);this.previous.set(0,0,0);this.lastX=0;this.lastY=0;this.status.textContent='按住布丁，感受蜡壳的阻力';}
}

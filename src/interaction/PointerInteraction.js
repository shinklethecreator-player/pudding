import * as THREE from 'three';
import { CONFIG } from '../config.js';
export class PointerInteraction {
  constructor(app, meshes, wax, deformers, assembly=null, audio=null) {
    this.assembly=assembly;this.audio=audio;this.grabPlane=new THREE.Plane();this.grabPoint=new THREE.Vector3();this.nextGrabPoint=new THREE.Vector3();this.dragging=false;this.grabReady=false;this.travel=0;this.waxGesture=false;
    Object.assign(this,{app,meshes,wax,deformers});this.canvas=app.renderer.domElement;
    this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.local=new THREE.Vector3();this.previous=new THREE.Vector3();
    this.active=null;this.previousMesh=null;this.hold=0;this.pressure=0;this.movement=0;this.hardware=0;
    this.status=document.querySelector('#status');this.meter=document.querySelector('#pressure');
    this.canvas.addEventListener('pointerdown',e=>{
      if(e.button!==0 || this.active!==null)return;
      this.locate(e);const hit=this.hit();if(!hit)return;
      this.audio?.unlock();if(this.assembly?.ball)return;
      e.stopImmediatePropagation();e.preventDefault();
      this.active=e.pointerId;this.canvas.setPointerCapture(e.pointerId);
      app.controls.enabled=false;app.controls.autoRotate=false;
      this.hold=0;this.previousMesh=null;this.hardware=e.pointerType==='pen'?e.pressure:0;
      this.lastX=e.clientX;this.lastY=e.clientY;
      if(hit.object===this.wax.shell){const state=this.wax.tap(hit);this.waxGesture=state==='cracked';this.audio?.crack();this.status.textContent=state==='cracked'?"冰裂纹贴在蜡皮上 · 松开后再点一下碎开":"蜡皮碎开了 · 轻轻揉捏内馅";}
      else {this.beginGrab(hit);this.sculpt(hit,.75,.08);}
    },{capture:true});
    this.canvas.addEventListener('pointermove',e=>{
      if(this.active!==e.pointerId)return;
      this.locate(e);const distance=Math.hypot(e.clientX-this.lastX,e.clientY-this.lastY);this.movement+=distance;this.travel+=distance;if(this.travel>4)this.dragging=true;
      this.lastX=e.clientX;this.lastY=e.clientY;this.hardware=e.pointerType==='pen'?e.pressure:0;
    });
    const release=e=>{if(this.active===e.pointerId)this.release();};
    this.canvas.addEventListener('pointerup',release);this.canvas.addEventListener('pointercancel',release);this.canvas.addEventListener('lostpointercapture',release);
    window.addEventListener('blur',()=>this.release());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.release();});
  }
  locate(e) {const r=this.canvas.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);}
  hit() {this.app.scene.updateMatrixWorld(true);this.ray.setFromCamera(this.pointer,this.app.camera);return this.ray.intersectObjects([this.wax.shell,...this.meshes],false)[0];}
  beginGrab(hit) {
    if(!this.assembly)return;this.assembly.beginGrab(hit.point);
    this.grabPlane.setFromNormalAndCoplanarPoint(this.app.camera.getWorldDirection(new THREE.Vector3()),hit.point);this.grabPoint.copy(hit.point);this.grabReady=true;
  }
  release() {
    this.waxGesture=false;this.assembly?.endGrab();this.grabReady=false;this.dragging=false;this.travel=0;
    const id=this.active;this.active=null;
    if(id!==null && this.canvas.hasPointerCapture(id))this.canvas.releasePointerCapture(id);
    this.app.controls.enabled=true;this.pressure=0;this.hold=0;this.hardware=0;this.movement=0;this.previousMesh=null;this.meter.value=0;
  }
  update(dt) {
    if(this.active===null||this.waxGesture)return;
    this.hold+=dt;
    this.pressure=Math.min(CONFIG.interaction.maxPressure,Math.max(this.hardware,.72+this.hold*CONFIG.interaction.holdPressureSpeed+Math.min(.2,this.movement*CONFIG.interaction.dragPressureScale)));
    this.movement*=Math.exp(-dt*10);this.meter.value=this.pressure;
    if(this.grabReady&&this.dragging){
      this.ray.setFromCamera(this.pointer,this.app.camera);
      if(this.ray.ray.intersectPlane(this.grabPlane,this.nextGrabPoint)){
        const delta=this.nextGrabPoint.clone().sub(this.grabPoint).clampLength(0,.18);
        if(delta.lengthSq()>1e-8){this.assembly.pull(delta);this.audio?.clay(.75);}
        this.grabPoint.add(delta);
      }
      this.status.textContent='抓住不放，向外拉长 · 向内推拢';return;
    }
    const hit=this.hit();if(!hit){this.previousMesh=null;this.status.textContent='移回布丁表面，继续揉捏';return;}
    if(hit.object===this.wax.shell) {
      this.previousMesh=null;
      this.status.textContent='松开后点击蜡皮 · 一下裂开，再点碎开';return;
    }
    if(!this.grabReady)this.beginGrab(hit);
    this.sculpt(hit,this.pressure,dt);
  }
  sculpt(hit,pressure,dt) {
    if(this.assembly){this.assembly.press(hit,pressure,dt);this.audio?.clay(pressure);this.status.textContent="轻按压扁 · 按住拖动，把粘土拉长";return;}
    const deformer=this.deformers.get(hit.object);
    if(!deformer){this.status.textContent='这部分保持形状 · 试着揉捏布丁或奶油';return;}
    this.local.copy(hit.point);hit.object.worldToLocal(this.local);
    const normal=hit.normal||hit.face.normal;
    const exposed=v=>this.wax.exposed(hit.object,v);
    if(this.previousMesh===hit.object && this.previous.distanceToSquared(this.local)<.2)deformer.drag(this.previous,this.local,normal,pressure,dt,exposed);
    else deformer.press(this.local,normal,pressure,dt,exposed);
    this.previous.copy(this.local);this.previousMesh=hit.object;
    this.status.textContent=hit.object.name==='creamMesh'?'轻轻推开奶油 · 留下柔软的形状':'慢慢揉捏 · 轻轻一按，就留下凹痕';
  }
  reset() {this.release();this.pointer.set(0,0);this.local.set(0,0,0);this.previous.set(0,0,0);this.lastX=0;this.lastY=0;this.status.textContent='点一下冰裂，再点一下碎开';}
}

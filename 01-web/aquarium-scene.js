import * as THREE from 'three';
import {Blocks} from './models.js';
import {createSpeciesModel} from './species-models.js';
import {BY_ID} from './catalog.js';
import {FOOD_BY_ID} from './care-profiles.js';
import {sizeClass,visualLength,visualIndividualScale} from './size-classes.js';
import {personalityFor} from './personality.js';
import {motionProfile,sampleMotion} from './motion-profiles.js';
import {feedingFrame} from './feeding-effects.js';
import {createHabitats,HABITAT_FLOORS} from './habitats.js';

const TAU=Math.PI*2;
function seedFor(s){let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return (n>>>0)/4294967296;}
function colorize(group,shift){if(Math.abs(shift)<.004)return;const color=new THREE.Color(),hsl={h:0,s:0,l:0};group.traverse(o=>{
 if(!o.isInstancedMesh||!o.instanceColor)return;
 for(let i=0;i<o.count;i++){o.getColorAt(i,color);color.getHSL(hsl);if(hsl.s>.16 && hsl.l>.10 && hsl.l<.82){color.setHSL((hsl.h+shift+2)%1,hsl.s,hsl.l);o.setColorAt(i,color);}}
 o.instanceColor.needsUpdate=true;
});}
// A few simple block shapes make the selected food recognisable even in a
// close-up. They are illustrative game food, not real feeding instructions.
function makeFoodPiece(food,color){
 const group=new THREE.Group(),material=new THREE.MeshStandardMaterial({color,roughness:.72,emissive:color,emissiveIntensity:.12});
 const add=(x,y,z,w,h,d)=>{const block=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);block.position.set(x,y,z);group.add(block);};
 if(food==='seafood'){add(0,0,0,.23,.13,.12);add(.12,-.035,0,.11,.09,.10);add(-.11,.04,0,.09,.09,.10);}
 else if(food==='plants'){add(0,0,0,.19,.10,.045);add(.075,.055,0,.13,.09,.045);}
 else if(food==='insects'){add(0,0,0,.20,.09,.10);add(-.115,.015,0,.07,.065,.09);}
 else if(food==='special'){add(0,0,0,.17,.17,.17);}
 else {add(0,0,0,.13,.13,.13);add(.075,.07,.03,.055,.055,.055);}
 return group;
}
function makeMealBubbles(){
 const group=new THREE.Group(),geometry=new THREE.SphereGeometry(.045,6,5),material=new THREE.MeshBasicMaterial({color:0xd8f5dd,transparent:true,opacity:.8,depthWrite:false});
 for(let i=0;i<4;i++){const bubble=new THREE.Mesh(geometry,material);bubble.userData.index=i;group.add(bubble);}group.visible=false;return group;
}
export class AquariumScene {
 constructor({onTap,onHold,onZoom,onMoment,onMomentEnd,onFeedingEnd,canShowMoment}){
  this.onTap=onTap;this.onHold=onHold;this.onZoom=onZoom;this.onMoment=onMoment;this.onMomentEnd=onMomentEnd;this.onFeedingEnd=onFeedingEnd;this.canShowMoment=canShowMoment;this.momentPairs=[];this.activeMoment=null;this.momentSignature='';this.nextMomentAt=0;this.momentCycle=0;this.zoom=1;this.viewMode='drag';this.followUid=null;this.panX=0;this.panY=0;this.stage=null;this.entries=[];this.mode='none';this.sim=0;this.last=null;this.reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  const motionPreference=window.matchMedia?.('(prefers-reduced-motion: reduce)');motionPreference?.addEventListener?.('change',event=>{this.reduceMotion=event.matches;if(this.reduceMotion)this.cancelFeedingCamera();});
  this.canvas=document.createElement('canvas');this.canvas.className='aquarium-canvas';this.canvas.style.touchAction='none';this.canvas.setAttribute('aria-label','生き物が泳ぐ3D水槽。タップでなでる、長押しで詳細。ピンチで拡大できます');
  try{this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});}catch(e){this.renderer=null;return;}
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.13;this.renderer.setClearColor(0,0);
  this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-5,5,5,-5,.1,80);this.camera.position.set(0,6.8,25);this.camera.lookAt(0,-.2,0);this.cameraBase=this.camera.position.clone();this.cameraQuaternion=this.camera.quaternion.clone();this.lowCameraBase=new THREE.Vector3(0,1.5,25);const lowCamera=this.camera.clone();lowCamera.position.copy(this.lowCameraBase);lowCamera.lookAt(0,-.2,0);this.lowCameraQuaternion=lowCamera.quaternion.clone();this.cameraRight=new THREE.Vector3(1,0,0).applyQuaternion(this.camera.quaternion);this.cameraUp=new THREE.Vector3(0,1,0).applyQuaternion(this.camera.quaternion);
  this.scene.add(new THREE.HemisphereLight(0xeaffff,0x516873,1.35));const key=new THREE.DirectionalLight(0xfff4d9,2.15);key.position.set(-5,9,10);this.scene.add(key);const fill=new THREE.DirectionalLight(0x8ee7e6,.6);fill.position.set(7,4,-8);this.scene.add(fill);
  this.habitat='current';this.waterGroup=new THREE.Group();this.scene.add(this.waterGroup);this.fishGroup=new THREE.Group();this.scene.add(this.fishGroup);this.foodRoot=new THREE.Group();this.scene.add(this.foodRoot);this.feeding=null;
  this.makeEnvironment();this.makeBubbles();
  // Fine, slowly drifting flecks make the river current legible without a
  // permanent overlay or a separate animation loop.
  const currentMaterial=new THREE.MeshBasicMaterial({color:0xbce5d6,transparent:true,opacity:.52,depthWrite:false});
  this.riverCurrent=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),currentMaterial,48);this.riverCurrent.visible=false;this.waterGroup.add(this.riverCurrent);this.currentDummy=new THREE.Object3D();
  this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.holdTimer=null;this.start=null;this.held=false;this.pointers=new Map();this.pinch=null;this.wasPinch=false;
  this.canvas.addEventListener('pointerdown',e=>this.pointerDown(e));this.canvas.addEventListener('pointerup',e=>this.pointerUp(e));this.canvas.addEventListener('pointercancel',e=>this.pointerCancel(e));
  this.canvas.addEventListener('pointermove',e=>this.pointerMove(e));
  this.resizeObserver=new ResizeObserver(()=>this.resize());requestAnimationFrame(t=>this.animate(t));
 }
 makeEnvironment(){
  // A deep base prevents a thin floating slab from appearing in low-angle
  // bottom-dweller close-ups. Its top remains at the original floor height.
  const sand=new THREE.Mesh(new THREE.BoxGeometry(160,8,50),new THREE.MeshStandardMaterial({color:0xc0ba99,roughness:1}));sand.position.set(0,-8.54,21);this.sand=sand;this.waterGroup.add(sand);
  const grains=new Blocks();for(let i=0;i<240;i++){const x=(seedFor('sand-x'+i)-.5)*17,z=(seedFor('sand-z'+i)-.5)*6.5,size=.025+seedFor('sand-s'+i)*.045;grains.box(x,-4.525,z,size,.012,size*.9,i%3===0?0x948f79:0xd8d0af);}this.grains=grains.mesh('sand grains');this.waterGroup.add(this.grains);
  this.rockGroup=new THREE.Group();for(const [x,z,w,h] of [[-4.8,-1.8,1.3,.5],[-1.8,-2.6,1,.3],[4.3,-1.4,1.5,.5]]){const rock=new Blocks(),pivot=new THREE.Group();rock.box(0,0,0,w,h,.8,0x536e70);pivot.position.set(x,-4.38,z);pivot.add(rock.mesh('rock'));this.rockGroup.add(pivot);}this.waterGroup.add(this.rockGroup);
  this.sandPatches=new THREE.Group();for(const x of [-2.6,.3,3.5]){const patch=new Blocks(),pivot=new THREE.Group();patch.box(0,0,0,1.15,.04,.8,0xddc8a1);pivot.position.set(x,-4.51,.1);pivot.add(patch.mesh('sand patch'));this.sandPatches.add(pivot);}this.waterGroup.add(this.sandPatches);
  this.plantsRoot=new THREE.Group();this.waterGroup.add(this.plantsRoot);this.plantGroups=[];
  for(let i=0;i<7;i++){
   const p=new THREE.Group(),b=new Blocks(),u=.18;const x=[-5.1,-4.1,-2.6,1.7,3.2,4.5,5.2][i];
   const h=4+(i%3)*2;
   for(let j=0;j<h;j++){const dx=Math.round(Math.sin(j*.6+i)*.7);b.box(dx*u,j*u,0,u,u,u,i%2?0x3d9c8b:0x5eae99);if(j>2&&j%3===0){const dir=i%2?1:-1;b.box((dx+dir)*u,j*u,0,u,u,u,0x4ca896);b.box((dx+2*dir)*u,(j+1)*u,0,u,u,u,0x4ca896);}}
   p.position.set(x,-4.5,-1.5-(i%3)*.6);p.add(b.mesh('plants'));this.plantsRoot.add(p);this.plantGroups.push(p);
  }
  this.coralRoot=new THREE.Group();const coral=new Blocks();for(const base of [-3.7,3.7])for(let x=-2;x<=2;x++)for(let y=0;y<3+(x===0?3:Math.abs(x)===1?2:0);y++){if(Math.abs(x)===2&&y>1)continue;coral.box(base+x*.17,-4.45+y*.17,-.8,.175,.175,.175,(x+y)%2?0xd58e82:0xeaac94);}this.coralRoot.add(coral.mesh('coral'));this.waterGroup.add(this.coralRoot);
  this.anemoneRoot=new THREE.Group();const anemone=new Blocks();for(let x=-2;x<=2;x++)for(let y=0;y<3+(x%2===0?1:2);y++)anemone.box(2.15+x*.16,-4.43+y*.16,-.4,.17,.17,.17,(x+y)%2?0xdc8c98:0xf1a7a4);this.anemoneRoot.add(anemone.mesh('anemone'));this.waterGroup.add(this.anemoneRoot);
  this.habitatGroups=createHabitats();for(const group of Object.values(this.habitatGroups))this.waterGroup.add(group);
 }
 // Scenery changes in 3D, not just the room name or a CSS color. Older
 // decoration inventory/positions are left untouched in the player's save.
 setHabitat(id){
  if(!this.renderer)return;const next=Object.prototype.hasOwnProperty.call(HABITAT_FLOORS,id)?id:'current',changed=next!==this.habitat;this.habitat=next;if(changed&&this.mode==='tank'){this.viewMode='drag';this.followUid=null;this.panX=this.panY=0;this.setZoom(this.isWideHabitat()?0.55:1);}
  for(const group of Object.values(this.habitatGroups))group.visible=false;if(this.habitatGroups[this.habitat])this.habitatGroups[this.habitat].visible=true;
  const color=HABITAT_FLOORS[this.habitat];this.sand.visible=color!==null;this.grains.visible=color!==null&&this.habitat!=='deep';
  if(color!==null)this.sand.material.color.setHex(color);
  this.coralRoot.visible=this.habitat==='reef';this.anemoneRoot.visible=this.habitat==='reef';
  this.bubbles.visible=this.mode!=='tank';this.riverCurrent.visible=this.habitat==='river';
 }
 makeBubbles(){
  this.bubbleData=Array.from({length:32},(_,i)=>({x:(seedFor('x'+i)-.5)*11,y:seedFor('y'+i)*10-5,z:(seedFor('z'+i)-.5)*3,r:.025+seedFor('r'+i)*.055,s:.15+seedFor('s'+i)*.3,p:seedFor('p'+i)*10}));
  const mat=new THREE.MeshBasicMaterial({color:0xc7f6ee,transparent:true,opacity:.32,depthWrite:false});this.bubbles=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,5),mat,this.bubbleData.length);this.scene.add(this.bubbles);this.tmp=new THREE.Object3D();
 }
 attach(stage,mode='tank'){
  this.stage=stage;this.mode=mode;if(!this.renderer){stage.innerHTML='<div class="webgl-fallback">3D表示に対応したブラウザでお楽しみください。</div>';return;}
  stage.prepend(this.canvas);this.waterGroup.visible=mode==='tank';this.bubbles.visible=mode!=='tank';this.camera.zoom=mode==='tank'?this.zoom:1;this.camera.updateProjectionMatrix();this.applyCamera();this.resizeObserver.disconnect();this.resizeObserver.observe(stage);this.resize();
 }
 detach(){this.resizeObserver?.disconnect();this.stage=null;this.mode='none';if(this.canvas.parentNode)this.canvas.remove();}
 resize(){if(!this.stage||!this.renderer)return;const w=Math.max(1,this.stage.clientWidth),h=Math.max(1,this.stage.clientHeight);const aspect=w/h;let halfH=this.mode==='title'?5.8:5.2;let halfW=halfH*aspect;if(halfW<4.0){halfW=4.0;halfH=halfW/aspect;}this.halfW=halfW;this.halfH=halfH;this.camera.left=-halfW;this.camera.right=halfW;this.camera.top=halfH;this.camera.bottom=-halfH;this.camera.updateProjectionMatrix();this.applyCamera();this.renderer.setSize(w,h,false);}
 setFish(list,mode='tank'){
  if(!this.renderer)return;this.finishMoment();this.clearFood();this.modelBuildCount=(this.modelBuildCount||0)+1;while(this.fishGroup.children.length){const child=this.fishGroup.children[0];child.traverse(o=>{if(o.isInstancedMesh&&typeof o.dispose==='function')o.dispose();});this.fishGroup.remove(child);}this.entries=[];
  const plants=list.filter(f=>BY_ID[f.species_id]?.kind==='environment'&&f.placed!==false).slice(0,10);
  const animals=list.filter(f=>BY_ID[f.species_id]?.kind!=="environment"&&BY_ID[f.species_id]).slice(0,20);
  // In a mixed, crowded exhibit, gently separate large free-swimmers into
  // vertical bands; otherwise similarly centred giant models hide each other.
  this.sizeLanes=mode==='tank'&&animals.length>=3&&animals.some(f=>['giant','colossal'].includes(sizeClass(BY_ID[f.species_id])));
  const visible=mode==='title'?animals:[...animals,...plants];
  visible.forEach((f,i)=>{
   const sp=BY_ID[f.species_id];if(!sp)return;const model=createSpeciesModel(sp);const group=model.group;
   colorize(group,f.hue_shift||0);const n=animals.length;
   let scale,rawMajor=null,rawBottom=null,mouthLocal=null;
   if(mode==='title')scale=(f.size||1)*.86;
   else if(sp.kind==='environment'){const box=new THREE.Box3().setFromObject(group);rawBottom=box.min.y;scale=(f.size||1)*.58;}
   else {
    const box=new THREE.Box3().setFromObject(group),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),major=Math.max(size.x,size.y,size.z,.001);
    rawMajor=major;rawBottom=box.min.y;scale=visualIndividualScale(f)*visualLength(sp)/major*(n>8?.82:n>4?.91:1);
    // Most horizontal models face -X. Radial / jelly / octopus models feed
    // around the centre instead of pretending their arm tips are a mouth.
    const central=['jelly','moonJelly','octopus','squid','starfish','urchin'].includes(sp.shape)||model.kind==='jelly';
    mouthLocal=new THREE.Vector3(central?center.x:box.min.x+size.x*.13,central?center.y-size.y*.12:center.y-size.y*.05,center.z);
   }
   group.scale.multiplyScalar(scale);
   group.userData.fishUid=f.uid;group.rotation.y=(i%2?Math.PI-.5:.5);
   // The top of a flatfish faces upwards. A slight presentation tilt keeps
   // its eyes and camouflage visible instead of showing an edge-on sliver.
   if(sp.shape==='flatfish')group.rotation.x=.25;
   else if(['manta','stingray','starfish'].includes(sp.shape))group.rotation.x=-.45;
   this.fishGroup.add(group);
   const cls=sizeClass(sp);
   // Large background animals should not hide small animals in the same tank.
   const depthBias=cls==='colossal'?-1.0:cls==='giant'?-.55:0;
   this.entries.push({...model,group,fish:f,sp,sizeClass:cls,depthBias,mouthLocal,baseScale:group.scale.clone(),displayLength:rawMajor?rawMajor*scale:null,index:i,phase:seedFor(f.uid)*TAU,seed:seedFor(f.uid+'s'),personality:personalityFor(f),reactionAt:null,stationary:sp.kind==='environment'||!!motionProfile(sp).stationary,benthic:!!motionProfile(sp).benthic,floorY:rawBottom===null?null:(-4.51-rawBottom*scale+.03+(sp.shape==='flatfish'?(rawMajor||0)*scale*.13:0))});
  });
 }
 applyCamera(){
  if(!this.cameraBase)return;
  if(this.mode!=='tank'){this.camera.zoom=1;this.camera.updateProjectionMatrix();this.camera.position.copy(this.cameraBase);this.camera.quaternion.copy(this.cameraQuaternion);this.cameraRight.set(1,0,0).applyQuaternion(this.camera.quaternion);this.cameraUp.set(0,1,0).applyQuaternion(this.camera.quaternion);this.camera.updateMatrixWorld();return;}
  // The cinematic view is a temporary overlay. The user's zoom, drag offset,
  // follow mode and target remain untouched and are restored on completion.
  const view=this.feeding?.camera,zoom=view?.zoom??this.zoom;
  const baseline=this.isWideHabitat()?.55:1;const maxX=Math.max(0,(this.halfW||5)*(1/baseline-1/zoom)),maxY=Math.max(0,(this.halfH||5)*(1/baseline-1/zoom));
  const px=Math.max(-maxX,Math.min(maxX,view?.panX??this.panX)),py=Math.max(-maxY,Math.min(maxY,view?.panY??this.panY));
  if(!view){this.panX=px;this.panY=py;}
  this.camera.zoom=zoom;this.camera.updateProjectionMatrix();
  const tilt=view?.tilt||0;this.camera.quaternion.copy(this.cameraQuaternion).slerp(this.lowCameraQuaternion,tilt);this.cameraRight.set(1,0,0).applyQuaternion(this.camera.quaternion);this.cameraUp.set(0,1,0).applyQuaternion(this.camera.quaternion);
  this.camera.position.copy(this.cameraBase).lerp(this.lowCameraBase,tilt).addScaledVector(this.cameraRight,px).addScaledVector(this.cameraUp,py);this.camera.updateMatrixWorld();
 }
 cancelFeedingCamera(){if(this.feeding){this.feeding.interrupted=true;if(this.feeding.camera){this.feeding.camera=null;this.applyCamera();}}}
 isWideHabitat(){return ['large-cold-sea','large-warm-sea'].includes(this.habitat);}
 setZoom(value){this.cancelFeedingCamera();this.zoom=Math.max(this.isWideHabitat()?.4:.8,Math.min(3,Number(value)||1));if(this.camera&&this.mode==='tank')this.applyCamera();this.onZoom?.(this.zoom);return this.zoom;}
 getZoom(){return this.zoom;}
 // Conservative projected world bounds for automated visual-fit checks.
 getProjectedBounds(uid){
  const a=this.entries.find(e=>e.fish.uid===uid);if(!a||!this.stage||!this.camera)return null;
  this.scene.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(a.group);if(box.isEmpty())return null;
  const r=this.canvas.getBoundingClientRect(),points=[];
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
   const p=new THREE.Vector3(x,y,z).project(this.camera);points.push({x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2});
  }
  return {left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))};
 }
 setViewMode(mode,uid=null){this.cancelFeedingCamera();this.viewMode=mode==='follow'?'follow':'drag';this.followUid=this.viewMode==='follow'?uid:null;if(this.viewMode==='follow'&&uid&&this.zoom<1.7)this.setZoom(1.7);if(this.viewMode==='drag'&&!uid)this.applyCamera();}
 resetView(){this.cancelFeedingCamera();this.viewMode='drag';this.followUid=null;this.panX=0;this.panY=0;this.setZoom(this.isWideHabitat()?0.55:1);this.applyCamera();}
 getView(){return {mode:this.viewMode,uid:this.followUid,panX:this.panX,panY:this.panY};}
 getFeedingInfo(){
  const meal=this.feeding;if(!meal)return null;const elapsed=(performance.now()-meal.started)/1000;
  return {elapsed,phase:feedingFrame(elapsed).phase,focusUid:meal.focusUid,cameraActive:!!meal.camera,items:meal.items.map(item=>{
   const a=this.entries.find(e=>e.fish.uid===item.uid);let mouthDistance=null;if(a?.mouthLocal){a.group.updateMatrixWorld(true);mouthDistance=item.pellet.position.distanceTo(a.group.localToWorld(a.mouthLocal.clone()));}
   return {uid:item.uid,food:item.food,visible:item.pellet.visible,scale:item.pellet.scale.x,mouthDistance,bubbles:item.bubbles.visible,position:{x:item.pellet.position.x,y:item.pellet.position.y,z:item.pellet.position.z}};
  })};
 }
 clearFood({notify=true,reason='cancelled'}={}){
  const finished=this.feeding,wasFeeding=!!finished,geometries=new Set(),materials=new Set();
  this.foodRoot?.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());this.foodRoot?.clear();this.feeding=null;
  for(const a of this.entries||[])if(a.baseScale)a.group.scale.copy(a.baseScale);
  if(wasFeeding){this.applyCamera();if(notify)this.onFeedingEnd?.({reason,interrupted:!!finished.interrupted});}
 }
 startFeeding(uids,food,foods={}){
  if(!this.renderer||this.mode!=='tank'||!this.stage)return false;
  this.finishMoment();this.nextMomentAt=performance.now()+12000;this.clearFood({notify:false});
  const targets=this.entries.filter(a=>uids.includes(a.fish.uid)&&a.sp.kind!=='environment'&&!a.fish.showcase);
  if(!targets.length)return false;
  // Prefer the player's tracked animal if it is eating, otherwise focus the
  // first visible eligible animal. Never focus a demo-only or ineligible one.
  const focus=targets.find(a=>a.fish.uid===this.followUid)||targets[0],items=[],count=Math.max(3,Math.min(12,targets.length));
  for(let i=0;i<count;i++){
   const a=targets[i%targets.length],actualFood=foods[a.fish.uid]||food,color=FOOD_BY_ID[actualFood]?.color||0xf2cb83;
   const pellet=makeFoodPiece(actualFood,color),bubbles=makeMealBubbles(),side=i%2?1:-1;
   const spread=.65+Math.min(.5,(a.displayLength||1)*.10),extra=i>=targets.length?((i%3)-1)*.18:0;
   const x=Math.max(-(this.halfW||5)+.35,Math.min((this.halfW||5)-.35,a.group.position.x+side*spread+extra));
   const y=(a.benthic||a.stationary)?Math.max(-4.05,a.group.position.y+.28):Math.max(-3.1,Math.min(2.7,a.group.position.y+.48));
   pellet.position.set(x,4.7,.35);this.foodRoot.add(pellet);this.foodRoot.add(bubbles);
   items.push({pellet,bubbles,x,y,side,food:actualFood,uid:a.fish.uid,delay:(i%4)*.08});
  }
  const peak=Math.max(this.zoom,Math.min(4.5,(this.halfW||5)*1.40/Math.max(.6,focus.displayLength||1)));
  const camera=this.reduceMotion?null:{zoom:this.zoom,panX:this.panX,panY:this.panY,peak,tilt:0};
  this.feeding={started:performance.now(),items,focusUid:focus.fish.uid,camera};return true;
 }
 updateFood(now){
  if(!this.feeding)return;
  const elapsed=(now-this.feeding.started)/1000,frame=feedingFrame(elapsed);
  if(frame.done){this.clearFood({reason:'complete'});return;}
  for(const item of this.feeding.items){
   const f=feedingFrame(elapsed,item.delay);item.pellet.position.set(item.x,4.7+(item.y-4.7)*f.fall,.35);
   item.pellet.rotation.z=elapsed*.45;item.pellet.visible=f.bite<.999;
   item.pellet.scale.setScalar(Math.max(.001,f.pelletScale));item.bubbles.visible=false;
  }
 }
 approachFood(entry,now){
  if(!this.feeding)return;const item=this.feeding.items.find(x=>x.uid===entry.fish.uid);if(!item)return;
  const elapsed=(now-this.feeding.started)/1000,frame=feedingFrame(elapsed),head=Math.min(1.7,(entry.displayLength||1)*.30);
  const targetX=item.x-item.side*head,targetY=entry.benthic?entry.group.position.y:item.y-.25;
  if(!entry.stationary&&entry.sp.shape!=='gardenEel'&&entry.sp.design?.jellyStyle!=='upside')entry.group.position.lerp(new THREE.Vector3(targetX,targetY,entry.group.position.z),frame.approach*.92);
  // A tiny gulp pulse; restored exactly when the presentation ends.
  const bite=feedingFrame(elapsed,item.delay).bite,pulse=bite>0&&bite<1?Math.sin(bite*Math.PI*3)*.025:0;
  if(entry.baseScale)entry.group.scale.copy(entry.baseScale).multiplyScalar(1+pulse);
 }
 finishFoodFrame(now){
  const meal=this.feeding;if(!meal)return;const elapsed=(now-meal.started)/1000;
  for(const item of meal.items){
   const a=this.entries.find(e=>e.fish.uid===item.uid);if(!a||!a.mouthLocal)continue;
   a.group.updateMatrixWorld(true);const mouth=a.group.localToWorld(a.mouthLocal.clone()),f=feedingFrame(elapsed,item.delay);
   // Bring each food piece to the animal, then shrink it at the approximate
   // mouth with a small bubble burst. This is a stylised, non-anatomical effect.
   if(f.bite>0)item.pellet.position.lerp(mouth,f.bite);
   if(f.burstVisible&&!this.reduceMotion){
    item.bubbles.visible=true;item.bubbles.position.copy(mouth);item.bubbles.children.forEach((bubble,i)=>{
     const angle=i*Math.PI/2+.45,r=.08+f.burst*.34;bubble.position.set(Math.cos(angle)*r,Math.sin(angle)*r+.08*f.burst,.22);bubble.scale.setScalar(.7+f.burst*.6);
    });item.bubbles.children[0].material.opacity=.70*(1-f.burst);
   }
  }
  if(meal.camera){
   const target=this.entries.find(e=>e.fish.uid===meal.focusUid),frame=feedingFrame(elapsed),w=frame.camera,pan=frame.cameraPan;
   if(target){const d=target.group.position.clone().sub(new THREE.Vector3(0,-.2,0));meal.camera.zoom=this.zoom+(meal.camera.peak-this.zoom)*w;meal.camera.tilt=(target.benthic||target.stationary)?w:0;meal.camera.panX=this.panX+(d.dot(this.cameraRight)-this.panX)*pan;meal.camera.panY=this.panY+(d.dot(this.cameraUp)-this.panY)*pan;this.applyCamera();}
   else this.cancelFeedingCamera();
  }
 }
 setLight(light){if(!this.stage)return;this.stage.dataset.light=light;}
 setDecor(decor,quantities={},layout=[]){
  if(!this.renderer)return;const at=(type,index)=>layout.find(p=>p.type===type&&p.index===index);
  const place=(obj,pos)=>{if(!pos)return;obj.position.x=pos.x;obj.position.z=pos.z;obj.rotation.y=pos.rotation*Math.PI/180;};
  this.plantsRoot.visible=decor.includes('plants')&&!['current','current-cool','current-large','cold-sea','warm-sea','large-cold-sea','large-warm-sea','deep'].includes(this.habitat);this.plantGroups.forEach((p,i)=>{p.visible=i<(quantities.plants??(decor.includes('plants')?1:0));place(p,at('plants',i));});
  this.rockGroup.visible=decor.includes('rock');this.rockGroup.children.forEach((r,i)=>{r.visible=i<(quantities.rock??1);place(r,at('rock',i));});
  this.sandPatches.children.forEach((r,i)=>{r.visible=i<(quantities.sand??0);place(r,at('sand',i));});this.coralRoot.visible=this.habitat==='reef';this.anemoneRoot.visible=this.habitat==='reef';
 }
 reactToPet(uid){const a=this.entries.find(x=>x.fish.uid===uid);if(!a)return false;a.reactionAt=performance.now();return true;}
 reactionAmount(a,now){if(a.reactionAt===null)return 0;const p=(now-a.reactionAt)/1600;if(p<0||p>=1){a.reactionAt=null;return 0;}return Math.sin(Math.PI*p)*(this.reduceMotion?.25:1);}
 setMomentPairs(pairs,scope){
  const signature=JSON.stringify([scope,...pairs.map(p=>[p.key,p.fishUid,p.envUid])]);
  if(signature!==this.momentSignature){this.finishMoment();this.momentSignature=signature;this.momentCycle=0;this.nextMomentAt=performance.now()+4500;}
  this.momentPairs=pairs;
 }
 finishMoment(){if(this.activeMoment){this.activeMoment=null;this.onMomentEnd?.();}}
 playMoment(key,now=performance.now()){
  if(!this.renderer||this.mode!=='tank'||!this.stage||this.feeding||this.canShowMoment?.()===false)return false;
  const pair=this.momentPairs.find(p=>p.key===key);if(!pair||!this.entries.some(e=>e.fish.uid===pair.fishUid)||!this.entries.some(e=>e.fish.uid===pair.envUid))return false;
  const animal=this.entries.find(e=>e.fish.uid===pair.fishUid),env=this.entries.find(e=>e.fish.uid===pair.envUid),side=animal.group.position.x<env.group.position.x?-1:1;
  this.finishMoment();this.activeMoment={...pair,side,started:now,duration:6200};this.nextMomentAt=now+30000;this.onMoment?.(pair);return true;
 }
 updateMoment(now){
  if(this.mode!=='tank'||!this.stage||this.canShowMoment?.()===false){this.finishMoment();return;}
  if(this.activeMoment){if(now-this.activeMoment.started>=this.activeMoment.duration){this.finishMoment();this.nextMomentAt=now+26000;}return;}
  if(!this.feeding&&this.momentPairs.length&&now>=this.nextMomentAt){const p=this.momentPairs[this.momentCycle++%this.momentPairs.length];if(!this.playMoment(p.key,now))this.nextMomentAt=now+8000;}
 }
 approachMoment(entry,now){
  const m=this.activeMoment;if(!m||entry.fish.uid!==m.fishUid||this.feeding)return;
  const env=this.entries.find(e=>e.fish.uid===m.envUid);if(!env)return;
  const p=Math.max(0,Math.min(1,(now-m.started)/m.duration));
  const smooth=x=>x*x*(3-2*x),weight=(p<.3?smooth(p/.3):p>.7?smooth((1-p)/.3):1)*(this.reduceMotion?.25:.90);
  // Bottom dwellers travel horizontally; they are never lifted to swim.
  const distance=Math.min(1.45,Math.max(.72,(entry.displayLength||0)*.48));
  const x=env.group.position.x+m.side*distance,z=env.group.position.z+.45;
  const y=entry.benthic?entry.group.position.y:Math.min(-2.45,env.group.position.y+1.15);
  entry.group.position.lerp(new THREE.Vector3(x,y,z),weight);
 }
 animateParts(a,t,speed=1){
  const phase=a.phase;
  if(a.parts.eelSegments)a.parts.eelSegments.forEach((seg,i)=>{seg.position.z=Math.sin(t*2.8*speed+phase-i*.65)*.02*Math.min(i,7);seg.rotation.y=Math.sin(t*2.8*speed+phase-i*.65)*.10;});
  if(a.parts.tail){if(a.kind==='mammal')a.parts.tail.rotation.z=Math.sin(t*3*speed+phase)*.18;else a.parts.tail.rotation.y=Math.sin(t*4*speed+phase)*.32;}
  if(a.parts.fins)a.parts.fins.forEach((f,k)=>f.rotation.y=(k?1:-1)*Math.sin(t*4.5*speed+phase)*.25);
  if(a.parts.wings)a.parts.wings.forEach(f=>{if(a.sp?.shape==='clione')f.group.rotation.z=f.side*Math.sin(t*3*speed+phase)*.65;else f.group.rotation.x=f.side*Math.sin(t*1.9*speed+phase)*.20;});
  if(a.sp?.shape==='nautilus'&&a.parts.tentacles)a.parts.tentacles.forEach((f,k)=>f.rotation.z=Math.sin(t*.8+phase+k*.5)*.1);
  if(a.parts.gardenStem)a.parts.gardenStem.rotation.z=Math.sin(t*.8+phase)*.055;
  if(a.parts.flippers)a.parts.flippers.forEach(f=>{f.group.rotation.y=f.side*Math.sin(t*3*speed+phase)*.22;f.group.rotation.x=f.side*Math.sin(t*3*speed+phase)*.15;});
  if(a.parts.tentacles&&a.parts.bell){const pulse=Math.sin(t*2*speed+phase)*.05;a.parts.bell.scale.set(1+pulse,1-pulse,1+pulse);a.parts.tentacles.forEach((f,k)=>f.rotation.z=Math.sin(t*1.5*speed+phase+k*.6)*.13);}
  if(a.parts.fin)a.parts.fin.rotation.y=Math.sin(t*5*speed+phase)*.3;
 }
 getHit(e){if(!this.stage||this.mode!=='tank')return null;const r=this.canvas.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hit=this.ray.intersectObjects(this.entries.map(x=>x.group),true)[0];if(!hit)return null;let o=hit.object;while(o&&!o.userData.fishUid)o=o.parent;return o?.userData.fishUid||null;}
 pointerDown(e){
  this.cancelFeedingCamera();this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});try{this.canvas.setPointerCapture(e.pointerId)}catch(_){}
  if(this.pointers.size>=2){this.clearHold();const [a,b]=[...this.pointers.values()];this.pinch={distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),zoom:this.zoom};this.wasPinch=true;return;}
  this.wasPinch=false;const id=this.getHit(e);this.start={x:e.clientX,y:e.clientY,prevX:e.clientX,prevY:e.clientY,id,moved:false};this.held=false;
  if(id)this.holdTimer=setTimeout(()=>{if(this.start&&!this.start.moved&&!this.pinch){this.held=true;this.onHold?.(id)}},500);
 }
 pointerMove(e){
  if(!this.pointers.has(e.pointerId))return;this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(this.pinch&&this.pointers.size>=2){const [a,b]=[...this.pointers.values()];this.setZoom(this.pinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/this.pinch.distance);return;}
  if(!this.start)return;const st=this.start;
  if(Math.hypot(e.clientX-st.x,e.clientY-st.y)>8){st.moved=true;clearTimeout(this.holdTimer);}
  if(st.moved&&this.viewMode==='drag'&&this.zoom>(this.isWideHabitat()?.55:1)&&this.stage){const r=this.canvas.getBoundingClientRect();this.panX-=(e.clientX-st.prevX)*2*this.halfW/(r.width*this.zoom);this.panY+=(e.clientY-st.prevY)*2*this.halfH/(r.height*this.zoom);this.applyCamera();}
  st.prevX=e.clientX;st.prevY=e.clientY;
 }
 pointerUp(e){
  this.pointers.delete(e.pointerId);if(this.wasPinch){this.clearHold();if(this.pointers.size<2)this.pinch=null;if(this.pointers.size===0)this.wasPinch=false;return;}
  if(!this.start)return;const {id,x,y,moved}=this.start;clearTimeout(this.holdTimer);if(id&&!moved&&!this.held&&Math.hypot(e.clientX-x,e.clientY-y)<9)this.onTap?.(id,e.clientX,e.clientY);this.start=null;
 }
 pointerCancel(e){this.pointers.delete(e.pointerId);this.clearHold();if(this.pointers.size<2)this.pinch=null;if(!this.pointers.size)this.wasPinch=false;}
 clearHold(){clearTimeout(this.holdTimer);this.start=null;}
 animate(now){requestAnimationFrame(t=>this.animate(t));if(!this.renderer)return;const dt=this.last===null?0:Math.max(0,Math.min((now-this.last)/1000,.1));this.last=now;if(!this.stage||document.hidden)return;this.sim+=dt*(this.reduceMotion ? .15 : 1);const t=this.sim;
  this.updateFood(now);this.updateMoment(now);const staticEntries=this.entries.filter(a=>a.stationary);
  this.entries.forEach(a=>{
   const p=a.personality,profile=motionProfile(a.sp),speed=p.speed*(1+Math.min(.2,(a.fish.affinity||0)*.004)),reaction=this.reactionAmount(a,now);
   if(a.stationary){const j=staticEntries.indexOf(a),count=staticEntries.length;const x=count===1?0:-3.9+7.8*j/Math.max(1,count-1);a.group.position.set(x,a.floorY??-4.14,-1.0+(j%2)*.35);a.group.rotation.y=0;a.group.rotation.z=Math.sin(t*.6+a.phase)*.012+reaction*.025;this.approachFood(a,now);return;}
   const minZoom=this.mode==='tank'?(this.isWideHabitat()?.4:.8):1;const worldHalfW=(this.halfW||5)/minZoom,worldHalfH=(this.halfH||5)/minZoom;
   const path=sampleMotion(a.sp,a.fish,t,{halfW:worldHalfW,halfH:worldHalfH,maxWidth:worldHalfW,verticalScale:1/minZoom,displayLength:a.displayLength||1,speed,range:p.range});
   let y=path.benthic&&a.floorY!==null?a.floorY+(path.y-profile.layer):path.y;
   const wide=this.mode==='tank'&&this.isWideHabitat();
   if(this.sizeLanes&&!wide&&!path.benthic&&a.sp.motion!=='surface'){
    const lane={large:-2.1,giant:0,colossal:2.8}[a.sizeClass];
    if(lane!==undefined)y=y*.20+lane*.80;
   }
   let x=path.x,z=path.z+(a.depthBias||0),land=0;
   // Alternate open-water swimming with a gradual haul-out to the dry shelf.
   if(['penguin','seaLion','smallOtter'].includes(a.sp.shape)){
    y=Math.min(.7,y);const cycle=(t+a.phase*2)%48;
    const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v)};
    land=smooth((cycle-26)/4)*(1-smooth((cycle-41)/4));
    const shoreX=-3.8+(a.index%3)*.48;
    const landing=a.sp.shape==='smallOtter'?-shoreX:a.sp.shape==='seaLion'?shoreX*.85+1.9:shoreX;
    x=x*(1-land)+landing*land;
    y=y*(1-land)+(2.35+(a.displayLength||1)*.35)*land;z=z*(1-land)-1.5*land;
   }
   a.group.position.set(x,y+reaction*.035,z);
   this.approachMoment(a,now);this.approachFood(a,now);
   // Fish models face left. Smoothly turn toward the path derivative; seated
   // animals remain planted, and jellyfish stay upright while pulsing.
   const foodItem=this.feeding?.items.find(x=>x.uid===a.fish.uid),foodTurn=foodItem&&feedingFrame((now-this.feeding.started)/1000).approach>.06;
   const target=a.kind==='jelly'?Math.sin(t*.18+a.phase)*.12:foodTurn&&a.sp.shape!=='gardenEel'?(foodItem.side<0?.35:Math.PI-.35):path.resting?.30:(path.dx>0?Math.PI-.45:.45);
   const diff=Math.atan2(Math.sin(target-a.group.rotation.y),Math.cos(target-a.group.rotation.y));a.group.rotation.y+=diff*(1-Math.exp(-dt*2.2));
   a.group.rotation.z=Math.sin(t*.7*speed+a.phase)*(path.benthic?.014:.025)+reaction*.07-(a.sp.shape==='penguin'?land*Math.PI/2:0);
   if(a.sp.shape==='flatfish')a.group.rotation.x=.25+Math.sin(t*.8*speed+a.phase)*.025;
   else if(['stingray','manta','starfish'].includes(a.sp.shape))a.group.rotation.x=-.45+Math.sin(t*.8*speed+a.phase)*.025;
   else if(a.sp.shape==='otter')a.group.rotation.x=Math.PI+Math.sin(t*.6*speed+a.phase)*.055; // sea otter resting belly-up at the surface
   const finSpeed=profile.resting?.28:Math.max(.5,Math.min(2.1,profile.speed/.30))*speed;this.animateParts(a,t,finSpeed);
  });
  this.finishFoodFrame(now);
  this.plantGroups.forEach((p,i)=>p.rotation.z=Math.sin(t*.6+i)*.025);
  for(let i=0;i<this.bubbleData.length;i++){const b=this.bubbleData[i],range=this.halfH*2+1;const y=((b.y+t*b.s+this.halfH)%range+range)%range-this.halfH;this.tmp.position.set(b.x+Math.sin(t*.5+b.p)*.13,y,b.z);this.tmp.scale.setScalar(b.r);this.tmp.updateMatrix();this.bubbles.setMatrixAt(i,this.tmp.matrix);}this.bubbles.instanceMatrix.needsUpdate=true;
  if(this.mode==='tank'&&!this.feeding&&this.viewMode==='follow'&&this.followUid){const target=this.entries.find(a=>a.fish.uid===this.followUid);if(target){const d=target.group.position.clone().sub(new THREE.Vector3(0,-.2,0)),blend=1-Math.exp(-dt*4);this.panX+=(d.dot(this.cameraRight)-this.panX)*blend;this.panY+=(d.dot(this.cameraUp)-this.panY)*blend;this.applyCamera();}}
  if(this.riverCurrent.visible){const w=(this.halfW||5)/.8;for(let i=0;i<48;i++){const x=((seedFor('current-x'+i)*w*2+t*(.48+(i%3)*.12))%(w*2))-w;this.currentDummy.position.set(x,-2.8+(i%8)*.83,-2.8-(i%3)*.25);this.currentDummy.scale.set(.35+(i%4)*.11,.035,.035);this.currentDummy.updateMatrix();this.riverCurrent.setMatrixAt(i,this.currentDummy.matrix);}this.riverCurrent.instanceMatrix.needsUpdate=true;}
  this.renderer.render(this.scene,this.camera);
 }
}

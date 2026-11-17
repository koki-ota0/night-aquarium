import * as THREE from 'three';
import {Blocks} from './models.js';
import {createSpeciesModel} from './species-models.js';
import {BY_ID, idOfScientific} from './catalog.js';
import {journeyProgress} from './journey.js';

// An entirely presentational diorama: these animals are scenery, not a preview
// of the exploration result. Nothing here reads or writes the game save.
export const VOYAGE_WORLDS=Object.freeze({
 coast:Object.freeze({name:'coast',floor:0xbcae86,rock:0x557c78,rockLight:0x7e9b8a,plant:0x579d89,plantLight:0x8abca0,light:0xb7f2e2,ground:0x3d656d,
  animals:['Chelonia mydas','Scomber japonicus','Sardinops sagax']}),
 fresh:Object.freeze({name:'fresh',floor:0x8f9673,rock:0x647e68,rockLight:0x9aac88,plant:0x5b9671,plantLight:0x93ba89,light:0xd9eac5,ground:0x3b5a52,
  animals:['Cyprinus carpio','Paracheirodon innesi','Oryzias latipes']}),
 reef:Object.freeze({name:'reef',floor:0xc4b48c,rock:0x7b9185,rockLight:0xb3b79a,plant:0x57a797,plantLight:0x9ed4b2,light:0xbdf8e1,ground:0x426d71,
  animals:['Amphiprion ocellaris','Paracanthurus hepatus','Zebrasoma flavescens']}),
 deep:Object.freeze({name:'deep',floor:0x35485d,rock:0x283d57,rockLight:0x50687e,plant:0x497e91,plantLight:0x8ec7c7,light:0x95dcea,ground:0x17273e,
  animals:['Melanocetus johnsonii','Macropinna microstoma','Watasenia scintillans']})
});
// A focused itinerary has its own representative creatures and visual palette.
// They remain scenery, not the randomly selected reward. The broad worlds and
// old saves still work exactly as before.
export const VOYAGE_SPOT_WORLDS=Object.freeze({
 'coast:open':Object.freeze({...VOYAGE_WORLDS.coast,spot:'open',ground:0x22546c,light:0xb8e8f3,
  animals:['Thunnus orientalis','Megaptera novaeangliae','Sardinops sagax']}),
 'coast:shore':Object.freeze({...VOYAGE_WORLDS.coast,spot:'shore',floor:0xd1bf97,rock:0x718a79,rockLight:0xa5ae91,
  animals:['Heterodontus japonicus','Octopus sinensis','Hemitrygon akajei']}),
 'fresh:river':Object.freeze({...VOYAGE_WORLDS.fresh,spot:'river',floor:0x8c9a82,plant:0x568e75,light:0xd7f0d8,
  animals:['Oncorhynchus mykiss','Misgurnus anguillicaudatus','Cyprinus carpio']}),
 'fresh:lake':Object.freeze({...VOYAGE_WORLDS.fresh,spot:'lake',floor:0x9e9c76,plant:0x729b6e,light:0xe6ecc3,
  animals:['Cyprinus carpio','Carassius auratus','Oryzias latipes']})
});
const TAU=Math.PI*2;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
const lerp=(a,b,t)=>a+(b-a)*t;
const seed=(i)=>{let x=Math.sin(i*127.1+31.7)*43758.5453123;return x-Math.floor(x);};

// The route is a visual interpretation of the already-saved clock. A reduced
// motion user gets a still composition while the real progress bar advances.
export function journeyShipPose(fraction,time=0,reduced=false){
 const p=clamp(Number.isFinite(fraction)?fraction:0),stage=p<.2?0:p<.75?1:2;
 let x;if(p<.2)x=lerp(-1.10,-.27,smooth(p/.2));else if(p<.75)x=lerp(-.27,.77,smooth((p-.2)/.55));else x=lerp(.77,-1.10,smooth((p-.75)/.25));
 // Both ends of the boat have visible windows. It turns around gradually at
 // the start of the return leg, rather than instantly flipping.
 const turn=smooth((p-.73)/.06);
 return {x:reduced?-.05:x,y:reduced?.18:.18+Math.sin(time*.80)*.075,
  tilt:reduced?0:Math.sin(time*.67)*.018,heading:reduced?.32:lerp(Math.PI-.34,.34,turn),stage};
}

function blocks(parent,name,fn){const b=new Blocks();fn(b);parent.add(b.mesh(name));}
function reefPlant(parent,x,z,color,color2,height=1,variant=0,baseY=-3.13){
 const g=new THREE.Group();g.position.set(x,baseY,z);parent.add(g);
 blocks(g,'voxel sea plants',b=>{
  const u=.15;
  for(let stem=-1;stem<=1;stem++){
   const h=Math.round((4+((stem+variant+4)%3)*2)*height);
   for(let y=0;y<h;y++){
    const dx=Math.round(Math.sin(y*.62+stem*1.8+variant)*.6)+stem*2;
    b.box(dx*u,y*u,0,u*1.04,u*1.04,u*1.04,(y+stem+variant)%3===0?color2:color);
    if(y>1&&y%3===0){const dir=(stem+variant)%2?1:-1;b.box((dx+dir)*u,y*u,0,u,u,u,color2);b.box((dx+dir*2)*u,(y+1)*u,0,u,u,u,color);}
   }
  }
 });return g;
}
function coral(parent,x,z,color,accent,scale=1,baseY=-3.15){
 const g=new THREE.Group();g.position.set(x,baseY,z);g.scale.setScalar(scale);parent.add(g);
 blocks(g,'branching voxel coral',b=>{
  const u=.17;
  // Asymmetric branching silhouettes are intentionally made of separate cubes.
  const stems=[[-2,4],[-1,6],[0,8],[1,5],[2,4]];
  for(const [col,h] of stems){for(let y=0;y<h;y++){
   if(Math.abs(col)===2&&y<2)continue;
   if(col===-1&&y===5||col===1&&y===4)continue;
   const dx=col+(y>4&&col===-1?-1:0)+(y>3&&col===1?1:0);
   b.box(dx*u,y*u,0,u*1.04,u*1.04,u*1.08,(col+y)%4===0?accent:color);
  }}
  for(const [cx,cy] of [[-3,5],[3,4],[1,7]])b.box(cx*u,cy*u,0,u,u,u,accent);
 });return g;
}
function outcrop(b,x,z,w,depth,profile){
 const {floor,rock,rockLight}=profile;
 b.box(x,-3.47,z,w,.68,depth,rock);
 b.box(x-.12,-3.11,z-.10,w*.88,.18,depth*.86,rockLight);
 b.box(x+w*.24,-2.91,z-.10,w*.38,.26,depth*.66,rock);
 b.box(x+w*.24,-2.75,z-.10,w*.34,.10,depth*.60,rockLight);
 b.box(x-w*.32,-3.05,z+.25,w*.19,.12,depth*.29,floor);
}
function highShelf(b,x,z,profile,wide=2.3,height=1){
 // Several inset, overhanging layers read as a handmade voxel cliff, not a
 // smooth background plane. Tops stay clear for a second layer of plants.
 b.box(x,-2.99,z,wide,.52,1.75,profile.rock);
 b.box(x-.12,-2.70,z-.08,wide*.91,.14,1.58,profile.rockLight);
 b.box(x+.18,-2.53,z-.10,wide*.70,.24,1.30,profile.rock);
 b.box(x+.18,-2.38,z-.10,wide*.65,.10,1.24,profile.rockLight);
 b.box(x-.64,-2.69,z+.48,wide*.22,.12,.25,profile.floor);
 if(height>1){b.box(x+.35,-2.22,z-.16,wide*.35,.26,.90,profile.rock);b.box(x+.35,-2.07,z-.16,wide*.30,.08,.82,profile.rockLight);}
}
function submarine(){
 const root=new THREE.Group(),hull=new THREE.Group();root.add(hull);
 const gold=0xc8a65d,lit=0xe4c77e,shade=0x967446,deep=0x6a553d;
 blocks(hull,'brass voxel submarine',b=>{
  const u=.135;
  // A stepped ellipsoid provides the same square block language as the fish.
  for(let x=-10;x<=10;x++)for(let y=-4;y<=4;y++)for(let z=-4;z<=4;z++){
   if((x*x)/(10.8*10.8)+(y*y)/(4.75*4.75)+(z*z)/(4.7*4.7)>1)continue;
   const c=y>=3?lit:y<=-3?shade:((x+y+z+45)%9===0?0xd5b775:gold);
   b.box(x*u,y*u,z*u,u*1.01,u*1.01,u*1.01,c);
  }
  // Two glass portholes on each side, with square/octagonal brass frames.
  for(const side of [-1,1])for(const cx of [-4,3])for(let x=-2;x<=2;x++)for(let y=-2;y<=2;y++){
   if(Math.abs(x)+Math.abs(y)>3)continue;
   const edge=Math.max(Math.abs(x),Math.abs(y))===2||Math.abs(x)+Math.abs(y)===3;
   let c=edge?(y>0?0xf1da97:0x846739):0x174a52;
   if(!edge&&x===-1&&y===1)c=0x9ed9c8;
   if(!edge&&x===0&&y===1)c=0x4b9995;
   b.box((cx+x)*u,y*u,side*.635,u*1.03,u*1.03,.08,c);
  }
  // A raised conning tower, periscope, rail and small stern stabilisers.
  b.box(.08,.66,0,.92,.26,.75,shade);b.box(.05,.79,0,.74,.23,.64,gold);b.box(.05,.94,0,.87,.08,.7,lit);
  b.box(-.14,1.12,.03,.10,.34,.11,gold);b.box(-.26,1.27,.03,.34,.10,.12,lit);b.box(-.40,1.22,.03,.10,.18,.14,shade);
  b.box(.40,1.06,-.05,.065,.24,.07,lit);
  for(const side of [-1,1]){
   b.box(.22,.78,side*.39,.38,.08,.06,deep);b.box(.22,.78,side*.43,.24,.03,.03,lit);
   b.box(.05,-.55,side*.57,1.52,.07,.07,shade);
  }
  b.box(1.24,.37,0,.42,.43,.17,shade);b.box(1.34,.53,0,.29,.21,.19,gold);
  b.box(1.23,-.35,0,.35,.29,.18,shade);
  b.box(1.45,0,0,.30,.20,.20,shade);
  // Nose light: faceted turquoise glass, not a circular vector illustration.
  b.box(-1.39,.02,0,.10,.32,.42,shade);b.box(-1.46,.02,0,.06,.22,.30,0x61a99d);
  b.box(-1.50,.08,.06,.025,.08,.11,0xc1ead2);
 });
 const prop=new THREE.Group();prop.position.set(1.66,0,0);root.add(prop);
 blocks(prop,'turning voxel propeller',b=>{
  b.box(0,0,0,.12,.19,.19,0x70563c);
  for(const side of [-1,1]){
   b.box(0,side*.21,0,.10,.32,.15,0xd9bd79);b.box(0,side*.35,side*.05,.10,.10,.19,0xe6d092);
   b.box(0,0,side*.21,.10,.15,.32,0xa5824d);b.box(0,side*.05,side*.35,.10,.19,.10,0xe6d092);
  }
 });
 return {root,prop};
}

export class VoxelJourneyScene{
 constructor(aquarium){
  this.aquarium=aquarium;this.renderer=aquarium.renderer;this.canvas=aquarium.canvas;
  this.stage=null;this.key=null;this.scene=null;this.items=[];this.plants=[];this.resources=[];
  this.progress=0;this.phase=0;this.time=0;this.last=0;this.lastPaint=0;this.raf=0;this.frameCount=0;this.buildCount=0;
  this.motion=window.matchMedia?.('(prefers-reduced-motion: reduce)');this.reduced=!!this.motion?.matches;
  this.motion?.addEventListener?.('change',e=>{this.reduced=e.matches;if(!this.stage)return;this.stop();this.pose(0);this.draw();if(!this.reduced&&!document.hidden)this.start();});
  this.onVisibility=()=>{if(!this.stage)return;if(document.hidden)this.stop();else {this.last=0;this.pose(0);this.draw();if(!this.reduced)this.start();}};
  document.addEventListener('visibilitychange',this.onVisibility);
  this.resizeObserver=typeof ResizeObserver==='function'?new ResizeObserver(()=>this.resize()):null;
 }
 disposeWorld(){
  if(!this.scene)return;
  this.scene.traverse(o=>{if(o.isInstancedMesh&&typeof o.dispose==='function')o.dispose();});
  this.resources.forEach(r=>r.dispose());this.resources=[];this.scene=null;this.items=[];this.plants=[];this.key=null;this.profile=null;this.ship=null;this.propeller=null;this.beam=null;this.bubbles=null;
 }
 build(destination,key,spot=null){
  this.disposeWorld();const profile=VOYAGE_SPOT_WORLDS[`${destination}:${spot}`]||VOYAGE_WORLDS[destination]||VOYAGE_WORLDS.coast;this.profile=profile;this.key=key;this.time=0;this.buildCount++;
  this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-5,5,4,-4,.1,80);this.camera.position.set(3.0,4.9,17);this.camera.lookAt(0,-.48,0);
  const deep=profile.name==='deep',open=profile.name==='coast'&&profile.spot==='open';
  this.scene.add(new THREE.HemisphereLight(deep?0xb7ddf0:0xe8fff0,profile.ground,deep?1.10:1.30));
  const keyLight=new THREE.DirectionalLight(deep?0xaedeea:0xffefd0,deep?1.30:1.85);keyLight.position.set(-5,8,9);this.scene.add(keyLight);
  const fill=new THREE.DirectionalLight(profile.light,.48);fill.position.set(7,5,-7);this.scene.add(fill);
  const landscape=new THREE.Group();this.scene.add(landscape);
  // Distant, rectilinear formations provide depth without a second image or
  // another WebGL context. They remain deliberately quieter than the fish.
  if(!open){
   const distantGeo=new THREE.BoxGeometry(1,1,1),distantMat=new THREE.MeshBasicMaterial({color:deep?0x17304b:0x285d5b,transparent:true,opacity:deep?.34:.16,depthWrite:false});
   this.resources.push(distantGeo,distantMat);const silhouettes=new THREE.InstancedMesh(distantGeo,distantMat,14),distantTemp=new THREE.Object3D();
   for(let i=0;i<14;i++){
    const x=-6.3+i*.96,h=.45+seed(i+201)*1.8,w=.55+seed(i+214)*.65;
    distantTemp.position.set(x,-3.15+h/2,-4.0);distantTemp.scale.set(w,h,.22);distantTemp.updateMatrix();silhouettes.setMatrixAt(i,distantTemp.matrix);
   }
   silhouettes.instanceMatrix.needsUpdate=true;landscape.add(silhouettes);
  }
  if(!open)blocks(landscape,'stepped seabed',b=>{
   b.box(0,-4.25,0,15,2.0,8,profile.floor);
   // Distant shelves and a foreground left/right frame make a little stage.
   outcrop(b,-4.00,-1.5,2.9,2.1,profile);outcrop(b,4.20,-1.2,2.6,2.0,profile);
   outcrop(b,-5.00,1.7,2.0,1.8,profile);outcrop(b,5.10,1.5,2.0,1.7,profile);
   highShelf(b,-3.75,-.35,profile,2.65,profile.name==='deep'?1.3:1);highShelf(b,3.75,-.35,profile,2.45,profile.name==='deep'?1.3:1);
   for(let i=0;i<44;i++){
    const x=(seed(i+10)-.5)*14,z=(seed(i+200)-.5)*7;
    const w=.07+seed(i+310)*.17;b.box(x,-3.235,z,w,.025,w*.8,i%3?profile.rockLight:profile.rock);
   }
   // A few tiny layered pebbles give the open sandy path a tactile scale.
   for(const [x,z,w] of [[-1.6,1.4,.34],[.45,2.0,.25],[2.0,1.8,.31],[-.8,-.9,.23]]){
    b.box(x,-3.16,z,w,.16,w*.75,profile.rock);b.box(x-.025,-3.07,z,w*.62,.055,w*.52,profile.rockLight);
   }
  });
  const addPlant=(x,z,s=1,v=0,base=-3.13)=>this.plants.push(reefPlant(landscape,x,z,profile.plant,profile.plantLight,s,v,base));
  if(open){
   // The oceanic focus has no seabed or coastal plants in view.
   blocks(landscape,'suspended open-water flecks',b=>{for(let i=0;i<42;i++){const x=(seed(i+1100)-.5)*12,y=(seed(i+1200)-.5)*7,z=-3.8,u=.035+seed(i+1300)*.04;b.box(x,y,z,u,u,u,i%3?0x74a6ac:0xa9d6d5);}});
  }else if(profile.name==='reef'){
   coral(landscape,-3.80,-.5,0xe69b8a,0xffc4ad,1.55,-2.32);coral(landscape,-2.78,.45,0x91ceb6,0xc8ecd0,1.10,-2.38);
   coral(landscape,3.75,-.6,0xe49d94,0xfac9ad,1.50,-2.32);coral(landscape,4.55,.62,0x90c9b0,0xc8e9c8,1.0,-2.38);
   coral(landscape,-4.65,1.20,0xbfcfae,0xe5e8c5,.72,-3.13);addPlant(-2.65,-1.3,1.0,1,-2.42);addPlant(2.95,.55,1.02,2,-2.40);
  }else if(profile.name==='coast'){
   for(const [x,z,size,v,base] of [[-4.25,-.55,1.50,1,-2.32],[-3.05,.55,1.25,3,-2.37],[3.25,-.65,1.45,2,-2.32],[4.25,.65,1.22,4,-2.38],[-4.8,1.7,.8,5,-3.13]])addPlant(x,z,size,v,base);
   coral(landscape,3.82,.8,0xa8c5a8,0xdde0bc,.70,-2.38);
  }else if(profile.name==='fresh'){
   for(const [x,z,size,v,base] of [[-4.2,-.55,1.60,3,-2.32],[-3.15,.45,1.28,4,-2.37],[3.45,-.65,1.50,0,-2.32],[4.35,.45,1.30,2,-2.38],[-4.7,1.7,.85,3,-3.13]])addPlant(x,z,size,v,base);
   blocks(landscape,'sunken voxel driftwood',b=>{
    b.box(2.20,-3.0,.65,1.9,.36,.60,0x665745);b.box(1.72,-2.78,.65,.9,.18,.53,0x827052);
    b.box(1.75,-2.60,.60,.28,.22,.32,0x78644d);b.box(2.65,-2.86,.97,.33,.12,.09,0xb19a6c);
   });
  }else{
   // Jagged, glowing mineral gardens instead of surface-water corals.
   for(const [x,z,size,v,base] of [[-4.0,-.65,1.15,1,-2.02],[-3.05,.55,.85,4,-2.32],[3.5,-.75,1.10,2,-2.02],[4.3,.65,1.0,3,-2.32]])addPlant(x,z,size,v,base);
   blocks(landscape,'luminous voxel stones',b=>{
    for(let i=0;i<38;i++){
     const side=i%2?-1:1,x=side*(2.7+seed(i+50)*2.3),z=(seed(i+60)-.5)*2,y=-2.4+seed(i+70)*1.4;
     const u=.06+seed(i+80)*.10;b.box(x,y,z,u,u,u,i%3?0x8ee3dc:0xe4d7a5);
    }
   });
  }
  const ship=submarine();this.ship=ship.root;this.propeller=ship.prop;this.scene.add(this.ship);
  // Square light steps are more consistent with the voxel art than a smooth cone.
  const beamGeometry=new THREE.BoxGeometry(1,1,1),beamMaterial=new THREE.MeshBasicMaterial({color:deep?0xc7e9d5:0xf6e1a4,transparent:true,opacity:deep?.09:.045,depthWrite:false});
  this.resources.push(beamGeometry,beamMaterial);this.beam=new THREE.Group();this.ship.add(this.beam);
  for(let i=0;i<4;i++){const m=new THREE.Mesh(beamGeometry,beamMaterial);m.position.set(-1.68-i*.32,0,0);m.scale.set(.36,.20+i*.19,.26+i*.18);this.beam.add(m);}
  const casting=[profile.animals[0],profile.animals[1],profile.animals[2],profile.animals[2],profile.animals[2]];
  this.items=casting.map((scientific,i)=>{
   const species=BY_ID[idOfScientific(scientific)];if(!species)return null;
   const model=createSpeciesModel(species),bounds=new THREE.Box3().setFromObject(model.group),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
   const target=[1.55,1.18,.77,.61,.50][i],factor=target/Math.max(.1,size.x,size.y,size.z);
   model.group.position.sub(center);const group=new THREE.Group();group.add(model.group);group.scale.setScalar(factor);this.scene.add(group);
   const school=i>=2,offset=i-2,shore=profile.spot==='shore',riverBottom=profile.spot==='river'&&scientific==='Misgurnus anguillicaudatus';
   // Shoreline animals stay near the bed instead of floating high above it.
   const base=riverBottom?{x:-2.75,y:-2.75,z:-1.25}:shore?(school?{x:0,y:-2.25-offset*.10,z:-1.0-offset*.20}:[{x:1.65,y:-1.82,z:-1.4},{x:-1.85,y:-2.42,z:-.45}][i]):
    (school?{x:0,y:-.98-offset*.22,z:-1.0-offset*.20}:[{x:2.35,y:1.25,z:-1.4},{x:-2.75,y:1.30,z:-1.25}][i]);
   return {...model,group,scientific,phase:school?6.22-offset*.24:1.9+i*2.2,base,
    amp:riverBottom?.20:school?(deep?2.35:shore?1.2:3.15):[.62,.55][i],speed:riverBottom?.14:school?(deep?.27:shore?.20:.36):[.26,.38][i]};
  }).filter(Boolean);
  const bubbleGeometry=new THREE.BoxGeometry(1,1,1),bubbleMaterial=new THREE.MeshBasicMaterial({color:deep?0xa5e6ec:0xd8f4d9,transparent:true,opacity:.48,depthWrite:false});
  this.resources.push(bubbleGeometry,bubbleMaterial);this.bubbles=new THREE.InstancedMesh(bubbleGeometry,bubbleMaterial,32);this.scene.add(this.bubbles);this.temp=new THREE.Object3D();
  this.pose(0);
 }
 attach(stage,active){
  if(!stage)return;this.stage=stage;
  if(!this.renderer){stage.dataset.renderer='fallback';return;}
  const map={'open-ocean':['coast','open'],coastal:['reef',null],deep:['deep',null],river:['fresh','river'],lake:['fresh','lake'],estuary:['fresh',null]};const [destination,defaultSpot]=map[active?.destination]||['coast',null],spot=active?.spot||defaultSpot,key=`${destination}:${spot||'all'}:${active?.started_at??''}`;
  if(key!==this.key)this.build(destination,key,spot);
  stage.dataset.renderer='webgl';this.canvas.className='journey-canvas';stage.prepend(this.canvas);
  this.pixelRatio=this.renderer.getPixelRatio();this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.35));
  this.resizeObserver?.disconnect();this.resizeObserver?.observe(stage);this.resize();this.setProgress(active,Date.now());
  this.pose(0);this.draw();if(!this.reduced&&!document.hidden)this.start();
 }
 detach(){
  this.stop();this.resizeObserver?.disconnect();
  if(this.stage&&this.canvas?.parentNode===this.stage)this.canvas.remove();
  if(this.stage&&this.renderer&&this.pixelRatio)this.renderer.setPixelRatio(this.pixelRatio);
  if(this.canvas)this.canvas.className='aquarium-canvas';this.stage=null;this.last=0;this.lastPaint=0;
 }
 clear(){this.detach();this.disposeWorld();}
 setProgress(active,now=Date.now()){
  const before=this.phase,{fraction,stage}=journeyProgress(active,now);this.progress=fraction;this.phase=stage;
  if(this.stage&&this.scene&&this.reduced&&stage!==before){this.pose(0);this.draw();}
 }
 resize(){
  if(!this.stage||!this.renderer||!this.camera)return;
  const w=Math.max(1,this.stage.clientWidth),h=Math.max(1,this.stage.clientHeight),aspect=w/h;
  let halfH=4.12,halfW=halfH*aspect;if(halfW<4.5){halfW=4.5;halfH=halfW/aspect;}
  this.camera.left=-halfW;this.camera.right=halfW;this.camera.top=halfH;this.camera.bottom=-halfH;this.camera.updateProjectionMatrix();
  this.renderer.setSize(w,h,false);this.pose(0);this.draw();
 }
 start(){if(this.raf||!this.stage||this.reduced||document.hidden)return;this.last=0;this.raf=requestAnimationFrame(t=>this.animate(t));}
 stop(){if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;this.last=0;}
 animate(now){
  this.raf=0;if(!this.stage||!this.scene||this.reduced||document.hidden)return;
  // 30 fps is sufficient for the slow diorama and reduces phone GPU usage.
  if(this.lastPaint&&now-this.lastPaint<31){this.raf=requestAnimationFrame(t=>this.animate(t));return;}
  const dt=this.last?Math.min(.10,Math.max(0,(now-this.last)/1000)):0;this.last=now;this.lastPaint=now;this.time+=dt;
  this.pose(dt);this.draw();this.raf=requestAnimationFrame(t=>this.animate(t));
 }
 pose(dt){
  if(!this.scene)return;const t=this.reduced?0:this.time,boat=journeyShipPose(this.progress,t,this.reduced);
  this.ship.position.set(boat.x,boat.y,.35);this.ship.rotation.set(0,boat.heading,boat.tilt);this.propeller.rotation.x=this.reduced?0:t*4.2;
  // A barely perceptible camera drift creates depth between the ledges and
  // foreground fish, without distracting from the clock or inducing motion.
  const drift=this.reduced?0:Math.sin(t*.16);this.camera.position.set(3.0+drift*.12,4.9+drift*.035,17);this.camera.lookAt(drift*.035,-.48,0);
  this.beam.visible=boat.stage===1||this.profile.name==='deep';
  this.plants.forEach((p,i)=>p.rotation.z=this.reduced?0:Math.sin(t*.62+i*1.3)*.035);
  this.items.forEach((a,i)=>{
   const wave=t*a.speed+a.phase;a.group.position.set(a.base.x+Math.sin(wave)*a.amp,a.base.y+Math.sin(wave*.73)*(this.profile.name==='deep'&&i>=2?.30:.19),a.base.z);
   const target=a.kind==='jelly'?.15:(Math.cos(wave)>0?Math.PI-.38:.38);
   if(this.reduced||dt===0)a.group.rotation.y=target;else{const diff=Math.atan2(Math.sin(target-a.group.rotation.y),Math.cos(target-a.group.rotation.y));a.group.rotation.y+=diff*(1-Math.exp(-dt*2));}
   a.group.rotation.z=this.reduced?0:Math.sin(t*.8+a.phase)*.035;
   this.aquarium.animateParts(a,t,1);
  });
  for(let i=0;i<this.bubbles.count;i++){
   const q=(seed(i+500)+t*(.075+seed(i+600)*.04))%1;
   if(i<24){this.temp.position.set((seed(i+700)-.5)*9.0+Math.sin(t*.3+i)*.08,-3.1+q*7.0,(seed(i+800)-.5)*3);}
   else{
    const rise=(seed(i+500)+t*.18)%1;
    this.temp.position.set(1.70+rise*.9,rise*1.10,(seed(i+660)-.5)*.3);this.ship.localToWorld(this.temp.position);
   }
   this.temp.scale.setScalar(.035+seed(i+900)*.06);this.temp.updateMatrix();this.bubbles.setMatrixAt(i,this.temp.matrix);
  }
  this.bubbles.instanceMatrix.needsUpdate=true;
 }
 draw(){if(!this.stage||!this.renderer||!this.scene)return;this.renderer.render(this.scene,this.camera);this.frameCount++;}
 info(){return {active:!!this.stage,webgl:!!this.renderer,destination:this.profile?.name||null,spot:this.profile?.spot||null,phase:this.phase,progress:this.progress,reducedMotion:this.reduced,
  running:!!this.raf,frameCount:this.frameCount,buildCount:this.buildCount,usesAquariumCanvas:!!this.stage&&this.canvas?.parentNode===this.stage,
  geometries:this.renderer?.info.memory.geometries??0,drawCalls:this.renderer?.info.render.calls??0,
  propeller:this.propeller?.rotation.x??null,ship:this.ship?{x:this.ship.position.x,y:this.ship.position.y,heading:this.ship.rotation.y}:null,
  creatures:this.items.map(a=>({scientific:a.scientific,x:a.group.position.x,y:a.group.position.y,tail:a.parts.tail?.rotation.y??a.parts.tail?.rotation.z??null}))};}
}

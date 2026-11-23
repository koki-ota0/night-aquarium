import * as THREE from 'three';
import {Blocks,createCreature} from './models.js';

// Purpose-built voxel silhouettes, extending the original reference models rather than
// merely hue-rotating nine fish. Positions are in little block units.
const U=.19, WHITE=0xfffaf0, INK=0x25313e;
const col=(sp)=>sp.tint??0x99b7b0;
const shade=(hex,m=1)=>{let c=new THREE.Color(hex);return c.multiplyScalar(m).getHex();};
const V=(b,x,y,z,c)=>b.voxel(x,y,z,c,U);
const B=(b,x,y,z,w,h,d,c)=>b.box(x*U,y*U,z*U,w*U,h*U,d*U,c);
function eye(b,x,y,z,size=1.5){
 for(const s of [-1,1]){B(b,x,y,s*z,size,size,.38,WHITE);B(b,x-.10,y-.02,s*(z+.25),size*.72,size*.72,.25,INK);B(b,x-.28,y+.25,s*(z+.40),size*.20,size*.20,.13,0xffffff);}
}
function dotOnSide(b,x,y,z,c,r=.65){for(const s of [-1,1])B(b,x,y,s*z,r,r,.15,c);}
function finish(b,name='voxel') {const g=new THREE.Group();g.add(b.mesh(name));return {group:g,parts:{},kind:'other'};}
function addBody(g,b,name='body'){g.add(b.mesh(name));}
function animalTint(group,hex){
 const target=new THREE.Color(hex),a={h:0,s:0,l:0},v={h:0,s:0,l:0},color=new THREE.Color();target.getHSL(a);
 group.traverse(o=>{if(!o.isInstancedMesh||!o.instanceColor)return;for(let i=0;i<o.count;i++){o.getColorAt(i,color);color.getHSL(v);if(v.s>.22&&v.l>.17&&v.l<.76){color.setHSL(a.h,Math.min(1,(v.s+a.s)*.5),v.l);o.setColorAt(i,color);}}o.instanceColor.needsUpdate=true;});
}

function fish(sp){
 const sh=sp.shape,c=col(sp),g=new THREE.Group(),b=new Blocks();
 const long=['medaka','tetra','loach','catfish','arapaima','arowana','wrasse','archer','flyingFish','tuna','eel','catshark'].includes(sh);
 const rx=sh==='puffer'?4.6:['loach','eel'].includes(sh)?9.0:long?7.3:6.4,ry=sh==='puffer'?4.8:(sh==='clown'?4.0:(['loach','eel','catfish'].includes(sh)?2.1:3.1)),rz=sh==='puffer'?3.6:2.6;
 const maxX=Math.floor(rx),maxY=Math.floor(ry),maxZ=Math.floor(rz);
 for(let x=-maxX;x<=maxX;x++)for(let y=-maxY;y<=maxY;y++)for(let z=-maxZ;z<=maxZ;z++){
  if((x*x)/(rx*rx)+(y*y)/(ry*ry)+(z*z)/(rz*rz)>1.05)continue;
  let cc=y>1?shade(c,.89):y< -1?shade(c,1.10):c;
  // Real species markings are painted from their curated pattern below.
  
  if(sh==='koi'&&((x<-3&&y>=0)||(x>=-1&&x<=1&&y>=0)||(x>=4&&y>=-1)))cc=0xde7964;
  if(sh==='archer'&&((x===-1||x===2||x===5)&&y>=-1))cc=0x3c4a49;
  if(sh==='arapaima'&&x>=1&&((x+y+z+100)%3===0))cc=0xc57567;
  if(sh==='arowana'&&((x+2*y+20)%4===0))cc=shade(c,1.22);
  if(sh==='loach'&&((x+2*y+20)%5===0))cc=shade(c,.72);
  if(sh==='tuna'){if(y>0)cc=shade(c,.75);if(y<=-1)cc=0xc4d0c9;}
  // Apply the curated real species marking.
  cc=realPattern(sp,cc,x,y,z,maxX,maxY);
  V(b,x,y,z,cc);
 }
 const eyeX=-Math.min(4,maxX-1.2),eyeZ=sh==='puffer'?3.15:2.22;
 eye(b,eyeX,.6,eyeZ,sh==='puffer'?1.8:1.65);
 B(b,-maxX-.2,-.7,0,1.5,.45,1.4,shade(c,.62));
 if((sh==='loach'||sh==='catfish'||sh==='arowana'||sh==='koi'||sh==='corydoras')&&sp.scientific!=='Parabrotula tanseimaru'){
  // distinctive, short sensory barbels (pirarucu deliberately has none)
  for(const s of [-1,1]){B(b,-maxX-1,-1,s*.85,2.0,.13,.15,shade(c,.60));if(sh==='catfish'||sh==='loach'||sh==='corydoras')B(b,-maxX-.3,-1.6,s*.9,1.8,.13,.15,shade(c,.60));}
 }
 if(sp.scientific==='Diodon holocanthus'){
  for(const side of [-1,1])for(let x=-3;x<=3;x+=2)for(let y=-2;y<=2;y+=2)B(b,x,y,side*4,.22,.22,1.9,0x8b8165);
  for(let x=-3;x<=3;x+=2)for(let z=-2;z<=2;z+=2){B(b,x,4.1,z,.24,1.35,.24,0x7b745f);B(b,x,-4,z,.24,1.05,.24,0x7b745f);}
 }
 addBody(g,b,'body, eyes and markings');
 // Tail group: vertical for fish; shape-specific size and fork.
 const tail=new THREE.Group();tail.position.x=(maxX-.5)*U;const tb=new Blocks();const ts=['puffer','loach','eel'].includes(sh)?2:(['tuna','flyingFish','catshark'].includes(sh)?5:3);
 for(let x=0;x<=3;x++)for(let y=-ts;y<=ts;y++){
  const allowed=Math.abs(y)<=Math.min(ts,1+x) && !(sh==='tuna'&&x>=2&&Math.abs(y)<2) && !(sh==='catshark'&&y< -2);
  if(allowed)B(tb,x,y,0,1,1,1.15,tailColor(sp,c));
 }
 tail.add(tb.mesh('tail'));g.add(tail);
 const dorsal=new Blocks();
 if(sh==='eel'||sh==='catfish'){
  for(let x=-2;x<=6;x++)B(dorsal,x,maxY-.1,0,1,.65,1,shade(c,.78));
 }else {
  const positions=sh==='catshark'?[-2,3]:[0];
  for(const center of positions){const sharkFamily=['shark','hammer','whaleShark'].includes(sp.realShape);const h=sharkFamily&&center===-2?5:sh==='catshark'?3:(sh==='arapaima'?2:3);
   for(let x=-2;x<=2;x++)for(let y=0;y<h-Math.abs(x)/2;y++)V(dorsal,center+x,maxY+y,0,shade(c,.79));}
 }
 addBody(g,dorsal,'dorsal fin');
 if(sp.realShape==='betta'){const anal=new Blocks();for(let x=-2;x<=2;x++)for(let y=0;y<3-Math.abs(x)/2;y++)V(anal,x,-maxY-y,0,shade(c,.79));addBody(g,anal,'symmetric anal fin');}
 const fins=[];
 for(const side of [-1,1]){
  const f=new THREE.Group(),fb=new Blocks();f.position.set(.2*U,-.7*U,side*2.1*U);
  if(sh==='flyingFish'){
   for(let x=-2;x<=4;x++)for(let z=0;z<=5;z++){if(z>3&&x<0)continue;B(fb,x,-.15*z,side*z,1,.30,1,shade(c,1.2));}
  }else for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)V(fb,x,y,0,shade(c,.8));
  f.add(fb.mesh('pectoral fin'));g.add(f);fins.push(f);
 }
 if(sh==='arowana'||sh==='arapaima'){const ridge=new Blocks();for(let x=0;x<=6;x++){B(ridge,x,-3.3,0,1,1.2,.5,shade(c,.78));if(x>3)B(ridge,x,3.2,0,1,.8,.5,shade(c,.86));}addBody(g,ridge,'long rear fins');}
 if(sh==='tuna'){const finlets=new Blocks();for(let x=3;x<=6;x++){B(finlets,x,maxY-.4,0,.4,.65,.6,0xd8bb69);B(finlets,x,-maxY+.4,0,.4,.65,.6,0xd8bb69)}addBody(g,finlets,'finlets');}
 return {group:g,parts:{tail,fins},kind:'fish'};
}
// A purpose-built broad-headed whale shark instead of the catshark template.
// Voxel spots, gill marks, two dorsals and the asymmetric tail remain legible;
// soft eyes and a rounded silhouette make the animal friendlier at tank scale.
function whaleShark(sp){
 const c=col(sp),accent=sp.design?.accent||0xe5e7d4,g=new THREE.Group(),b=new Blocks();
 const inside=(x,y,z)=>{const taper=x>2?1-(x-2)*.052:1,rx=x<0?10.2:9.5,ry=3.55*taper,rz=4.25*taper;return (x*x)/(rx*rx)+(y*y)/(ry*ry)+(z*z)/(rz*rz)<=1.02;};
 for(let x=-9;x<=9;x++)for(let y=-3;y<=3;y++)for(let z=-4;z<=4;z++){
  if(!inside(x,y,z))continue;
  let cc=y<=-2?0xd9ded3:y===-1?shade(c,1.12):y>=2?shade(c,1.08):c;
  V(b,x,y,z,cc);
 }
 // Small, separate surface dots rather than whole white checker voxels.
 for(let x=-8;x<=7;x++)for(let y=-1;y<=2;y++){if((x+8)%2!==0||(y+1)%2!==0)continue;let edge=-1;for(let z=0;z<=4;z++)if(inside(x,y,z))edge=z;if(edge>=0)for(const side of [-1,1])B(b,x,y,side*(edge+.53),.32,.32,.13,accent);}
 for(let x=-8;x<=7;x+=2)for(let z=-3;z<=3;z+=2){let top=-9;for(let y=0;y<=3;y++)if(inside(x,y,z))top=y;if(top>=0)B(b,x,top+.53,z,.32,.13,.32,accent);}
 // A level terminal mouth: not teeth or an invented face painted on a fish.
 B(b,-9.35,-.6,0,.40,.30,4.3,0x526a73);B(b,-9.18,-1.0,0,.32,.25,4.1,0xe2e6d9);
 for(const side of [-1,1]){
  const z=side*3.62;B(b,-6,.45,z,1.25,1.28,.32,0x263e4b);
  B(b,-6.20,.73,side*3.82,.28,.28,.14,0xffffff);
  for(let j=0;j<4;j++)B(b,-3+j*.72,-.15,side*4.56,.13,1.5,.12,shade(c,.68));
 }
 addBody(g,b,'whale shark rounded body spots and face');
 const dorsal=new Blocks();
 for(const [cx,h] of [[1,4.4],[5,2.2]])for(let x=-2;x<=2;x++)for(let y=0;y<h-Math.abs(x)*.7;y++)B(dorsal,cx+x,3+y*.83,0,1,.85,.72,shade(c,.82));
 addBody(g,dorsal,'two dorsal fins');
 const tail=new THREE.Group(),tb=new Blocks();tail.position.x=8.5*U;
 for(let x=0;x<=5;x++)for(let y=-5;y<=7;y++){
  const spread=1+x*1.25;if(Math.abs(y)>spread||y< -5||x>1&&Math.abs(y)<x*.55)continue;
  B(tb,x,y,0,1,1,.68,shade(c,.86));
 }
 for(let x=1;x<=4;x+=2)for(let y=-4;y<=5;y+=2){if(Math.abs(y)>1+x*1.25||x>1&&Math.abs(y)<x*.55)continue;for(const side of [-1,1])B(tb,x,y,side*.38,.32,.32,.12,accent);}
 tail.add(tb.mesh('asymmetric forked tail'));g.add(tail);
 const fins=[];for(const side of [-1,1]){const f=new THREE.Group(),fb=new Blocks();f.position.set(-1.6*U,-1.25*U,side*3.0*U);
  for(let z=0;z<=5;z++)for(let x=-1;x<=2;x++){if(z===5&&x!==0)continue;B(fb,x+z*.20,-z*.15,side*z,1,.55,1,shade(c,.85));}
  f.add(fb.mesh('broad pectoral fin'));g.add(f);fins.push(f);
 }
 return {group:g,parts:{tail,fins},kind:'fish'};
}
function mammal(sp){
 const sh=sp.shape,c=col(sp),g=new THREE.Group(),b=new Blocks(),dugong=sh==='dugong',orca=sh==='orca';
 const rx=dugong?7.0:7.8,ry=dugong?3.6:3.15,rz=dugong?3.0:2.7;
 for(let x=-7;x<=7;x++)for(let y=-3;y<=3;y++)for(let z=-3;z<=3;z++){
  if(x*x/(rx*rx)+y*y/(ry*ry)+z*z/(rz*rz)>1.05)continue;
  let cc=c;if(y<=-1)cc=orca?0xe9eee6:shade(c,1.25);
  if(sh==='pacificDolphin'&&y===0&&x>0)cc=0xc4ced0;
  if(sh==='pacificDolphin'&&y>0)cc=0x4c5965;
  if(orca&&x>=-5&&x<=-3&&y===1&&Math.abs(z)>=2)cc=0xf0f1e8;
  V(b,x,y,z,cc);
 }
 const nose=new Blocks();B(nose,-7.1,-.25,0,dugong?2.3:2.6,dugong?2.6:1.2,2.0,shade(c,.9));
 if(sh==='bottlenose')B(nose,-8.2,-.15,0,2,0.9,1.45,shade(c,.92));
 eye(nose,-5.4,.45,2.35,1.45);
 for(const side of [-1,1])B(nose,-7.1,-.55,side*1.06,1.7,.16,.16,shade(c,.65));
 addBody(g,b,'mammal body');addBody(g,nose,'head');
 if(!dugong){const d=new Blocks(),h=orca?6:4;for(let x=-1;x<=2;x++)for(let y=0;y<h-(x===2?2:Math.max(0,x));y++)V(d,x,3+y,0,shade(c,.72));if(sh==='pacificDolphin')B(d,1,5.5,0,1,2,.8,0xadb9bd);addBody(g,d,'dorsal fin');}
 const tail=new THREE.Group();tail.position.x=6.5*U;const tb=new Blocks();
 for(let x=0;x<=2;x++)for(let z=-5;z<=5;z++){if(Math.abs(z)>1+x*2)continue;B(tb,x,0,z,1,.6,1,shade(c,.75));}
 tail.add(tb.mesh('horizontal flukes'));g.add(tail);
 const flippers=[];for(const side of [-1,1]){let f=new THREE.Group(),b2=new Blocks();f.position.set(-2.5*U,-1.4*U,side*2*U);for(let x=-1;x<=2;x++)for(let z=0;z<=3;z++)B(b2,x,-.25*z,side*z,1,.55,1,shade(c,.80));f.add(b2.mesh('flipper'));g.add(f);flippers.push({group:f,side});}
 return {group:g,parts:{tail,flippers},kind:'mammal'};
}
function baleenWhale(sp){
 // Long body, throat pleats, small dorsal and horizontal flukes. Humpbacks
 // have unusually long white pectoral flippers; blue whales are sleeker.
 const hump=sp.shape==='humpback',c=col(sp),g=new THREE.Group(),b=new Blocks();
 for(let x=-9;x<=9;x++)for(let y=-3;y<=3;y++)for(let z=-3;z<=3;z++){
  const ry=hump?2.7:2.4,rz=hump?2.8:2.6;
  if(x*x/90+y*y/(ry*ry)+z*z/(rz*rz)>1.05)continue;
  let color=y< -1?shade(c,hump?1.25:1.12):c;
  if(!hump&&((x+2*y+z+48)%7===0))color=shade(c,1.15);
  V(b,x,y,z,color);
 }
 for(const side of [-1,1]){
  B(b,-7.2,.15,side*2.12,1.70,1.70,.30,0xd7e5df);
  B(b,-7.24,.15,side*2.32,1.30,1.30,.16,INK);
  B(b,-7.50,.48,side*2.42,.33,.33,.12,0xffffff);
  B(b,-8.0,-.85,side*1.5,2.0,.20,.16,shade(c,.55));
  for(let x=-7;x<=-2;x++)B(b,x,-1.2,side*2.0,1,.15,.15,shade(c,.63));
 }
 // parallel pleats are intentionally subtle, not stripes across the top.
 for(let z=-2;z<=2;z++)for(let x=-7;x<=-1;x++)B(b,x,-2.0,z*.65,1,.14,.12,shade(c,hump?1.3:1.18));
 for(let x=4;x<=6;x++)for(let y=0;y<3-(x===6?1:0);y++)V(b,x,2+y,0,shade(c,.78));
 addBody(g,b,'baleen whale body, throat and dorsal fin');
 const tail=new THREE.Group(),tb=new Blocks();tail.position.x=8*U;
 for(let x=0;x<=3;x++)for(let z=-6;z<=6;z++)if(Math.abs(z)<=1+x*1.7)B(tb,x,0,z,1,.48,1,shade(c,.82));
 tail.add(tb.mesh('horizontal flukes'));g.add(tail);
 const flippers=[];for(const side of [-1,1]){const f=new THREE.Group(),fb=new Blocks(),reach=hump?6:4;f.position.set(-3.5*U,-1*U,side*2*U);
  for(let z=0;z<=reach;z++)for(let x=-1;x<=1;x++)if(z<reach||x===0)B(fb,x-z*.12,-.15*z,side*z,1,.45,1,hump?0xe2e7df:shade(c,.87));
  f.add(fb.mesh('long pectoral flipper'));g.add(f);flippers.push({group:f,side});}
 return {group:g,parts:{tail,flippers},kind:'mammal'};
}
function leatherback(sp){
 // Smooth, dark carapace with lengthwise ridges rather than hard scute tiles.
 const c=col(sp),g=new THREE.Group(),b=new Blocks();
 for(let x=-5;x<=5;x++)for(let z=-4;z<=4;z++){
  const r=x*x/29+z*z/18;if(r>1.04)continue;const top=r<.45?2:1;
  for(let y=-1;y<=top;y++)V(b,x,y,z,y===top&&Math.abs(z)<=2&&z%1===0?shade(c,1.22):c);
 }
 for(let z=-2;z<=2;z++)for(let x=-4;x<=4;x++){
  const r=x*x/29+z*z/18,top=r<.45?2:1;if(r<=1.04)B(b,x,top+.6,z,.8,.35,.27,shade(c,1.35));
 }
 B(b,-5.4,.1,0,2.7,2.2,2.4,shade(c,1.08));eye(b,-5.8,.5,1.35,1.15);addBody(g,b,'leathery ridged shell and head');
 const flippers=[];for(const side of [-1,1])for(const rear of [false,true]){const f=new THREE.Group(),fb=new Blocks(),reach=rear?3:7;f.position.set((rear?3:-2.5)*U,-.9*U,side*3*U);
  for(let z=0;z<=reach;z++)for(let x=-1;x<=1;x++)if(z<reach||x===0)B(fb,x-z*.10,-.12*z,side*z,1,.55,1,shade(c,.9));
  f.add(fb.mesh(rear?'rear flipper':'long front flipper'));g.add(f);flippers.push({group:f,side,rear});}
 return {group:g,parts:{flippers},kind:'turtle'};
}
function gulperEel(sp){
 // Oversized hinged pouch mouth, narrow body and tapering whip tail.
 const c=col(sp),g=new THREE.Group(),b=new Blocks();
 for(let x=-3;x<=6;x++){const h=x<0?2:x<4?1:.6;B(b,x,0,0,1,h*2,1.6,c);}
 for(let x=-9;x<=-3;x++){const q=(x+9)/6;B(b,x,1.2+q*.3,0,1,.55,1.1,shade(c,1.08));B(b,x,-3+q*2,0,1,.5,1.1,shade(c,.95));}
 B(b,-5.0,-.4,0,4,2.7,.5,shade(c,.48));eye(b,-3.7,1.1,.9,1.05);
 for(let x=2;x<=6;x++)B(b,x,1,0,1,.35,.6,shade(c,.8));addBody(g,b,'large pouch mouth and eel body');
 const tail=new THREE.Group(),tb=new Blocks();tail.position.x=5.5*U;
 for(let x=0;x<=9;x++)B(tb,x,0,0,1,Math.max(.15,.75-x*.06),Math.max(.15,.75-x*.06),x===9?0xc2d5cf:shade(c,.88));
 tail.add(tb.mesh('whip tail'));g.add(tail);return {group:g,parts:{tail},kind:'fish'};
}
function ray(sp){
 const c=col(sp),manta=sp.shape==='manta',g=new THREE.Group(),center=new Blocks(),wings=[];
 for(const side of [-1,1]){const wing=new THREE.Group(),wb=new Blocks();wing.position.z=side*2*U;
  for(let x=-5;x<=5;x++)for(let az=3;az<=8;az++){const width=Math.max(0,8-Math.abs(x)*1.3);if(az>width)continue;const z=side*(az-2);B(wb,x,-.55,z,1,.65,1,manta?0xd1ded9:shade(c,1.15));B(wb,x,0,z,1,.75,1,az>5?shade(c,.86):c);}
  wing.add(wb.mesh('movable pectoral wing'));g.add(wing);wings.push({group:wing,side});
 }
 for(let x=-5;x<=5;x++)for(let z=-2;z<=2;z++){if(Math.abs(z)>Math.max(0,8-Math.abs(x)*1.3))continue;B(center,x,-.55,z,1,.65,1,manta?0xd1ded9:shade(c,1.15));B(center,x,0,z,1,.75,1,c);}
 for(const side of [-1,1]){B(center,-4,.48,side*1.6,.9,.34,.9,INK);B(center,-4.20,.67,side*1.42,.22,.18,.22,0xffffff);}
 if(manta){for(const side of [-1,1]){B(center,-6,0,side*3.3,2,.8,1,c);B(center,-7,.4,side*3.8,1,1,1,c);}B(center,-6,-.45,0,1,.4,3,0xe1e9e1);}
 for(let x=5;x<=12;x++)B(center,x,-.1,0,1,.22,.25,shade(c,.68));
 addBody(g,center,'ray body and tail');return {group:g,parts:{wings},kind:'ray'};
}
function turtle(sp){
 if(sp.shape==='seaTurtle'){
  const m=createCreature('turtle');animalTint(m.group,col(sp));return m;
 }
 const g=new THREE.Group(),b=new Blocks(),c=col(sp);
 for(let x=-4;x<=4;x++)for(let z=-4;z<=4;z++){
  const r=x*x/24+z*z/19;if(r>1)continue;let h=r<.35?3:r<.8?2:1;
  for(let y=0;y<=h;y++)V(b,x,y,z,(x===0||Math.abs(z)===2)?shade(c,.66):c);
 }
 B(b,-5.1,.25,0,3,2.1,2.7,shade(c,1.06));eye(b,-5.5,.65,1.4,1.25);
 if(sp.scientific==='Trachemys scripta')for(const side of [-1,1])B(b,-4.5,.6,side*1.6,1.2,.6,.2,0xc66157);
 for(const side of [-1,1])for(const x of [-2.6,2.6]){
  B(b,x,-.35,side*3.6,1.7,.85,2.3,shade(c,.9));for(let t=-1;t<=1;t++)B(b,x+t*.55,-.55,side*4.7,.28,.25,.7,0x726e58);
 }
 return finish(b,'freshwater turtle, toes and shell');
}
function seahorse(sp){
 const m=createCreature('seahorse');animalTint(m.group,col(sp));m.group.scale.z*=1.65;
 // The real animal is laterally compressed, but its head and ringed trunk are not a flat cutout.
 const b=new Blocks(),c=col(sp),p=shade(c,1.18);for(const side of [-1,1]){for(let y=-4;y<=3;y+=2){B(b,.4,y,side*1.68,2.8,.20,.25,p);B(b,2.7,y,side*1.7,.35,.35,.35,shade(c,.8));}B(b,-.2,4.9,side*1.6,1.8,1.45,.28,c);B(b,1.9,9,side*.45,.7,1.1,.7,p);B(b,3.8,2.4,side*.8,.3,1.0,.4,shade(c,.8));}m.group.add(b.mesh('seahorse sculpted rings and coronet'));return m;
}
function seadragon(sp){
 const c=col(sp),b=new Blocks();
 for(let x=-5;x<=5;x++)for(let y=-2;y<=2;y++)for(let z=-1;z<=1;z++)if(x*x/42+y*y/3+z*z/3<=1.15)V(b,x,y,z,c);
 for(let x=4;x<=11;x++)B(b,x,-.4,0,1.2,.6,.7,shade(c,.8));
 B(b,-6.5,.8,0,2,1.7,1.8,c);B(b,-8,.5,0,2.4,.6,.8,c);eye(b,-6,.9,1.0,1);
 // Discrete, alternating leaf-like appendages instead of one continuous plate.
 for(const [x,dir,lift] of [[-4,-1,.2],[-1,1,1.0],[2,-1,.4],[5,1,.8],[8,1,.1]]){
  const z=.35;B(b,x,2.25,z,.32,1.8,.30,shade(c,.86));
  B(b,x+dir*.42,3.25+lift,z,.85,.7,.30,shade(c,1.08));
  B(b,x+dir*1.0,3.65+lift,z,1.0,1.05,.30,shade(c,1.18));
  B(b,x+dir*1.55,4.05+lift,z,.7,.70,.30,shade(c,1.25));
  B(b,x+dir*2.0,4.40+lift,z,.3,.35,.30,shade(c,1.3));
  B(b,x,-2.4,z,.32,1.3,.30,shade(c,.8));
  B(b,x-dir*.55,-3.15,z,1.1,.7,.30,shade(c,1.05));
  B(b,x-dir*1.25,-3.5,z,.7,.45,.30,shade(c,1.14));
 }
 return finish(b,'leafy sea dragon');
}
function jelly(sp){
 const m=createCreature('jelly');animalTint(m.group,col(sp));
 // Moon jellies have a short fine fringe, not long sea-nettle tentacles.
 m.parts.tentacles.forEach(t=>{t.scale.y=.28});
 const b=new Blocks();for(const x of [-1.7,1.7])for(const z of [-1.3,1.3]){
  for(const [dx,dz] of [[-1,0],[-1,1],[0,1],[1,1],[1,0]])B(b,x+dx*.48,5.7,z+dz*.48,.45,.24,.45,0xc4a4d2);
 }
 m.parts.bell.add(b.mesh('four horseshoe rings'));return m;
}
function shrimp(sp){const c=col(sp),b=new Blocks();
 for(let x=-5;x<=4;x++){
  const h=x< -3?2:(x>2?1:2),baseY=x>1?-(x-1)*.4:0;
  for(let y=-h;y<=h;y++)for(let z=-1;z<=1;z++){
   let cc=c;if((sp.design?.pattern||'').startsWith('bands')&&((x+6)%3===0))cc=sp.design.accent;
   else if(sp.design?.pattern==='stripe'&&y===h)cc=sp.design.accent;else if(sp.design?.pattern==='dots'&&((x*3+y+z+30)%5===0))cc=sp.design.accent;else if(x%2===0)cc=shade(c,1.13);B(b,x,y+baseY,z,1,1,1,cc);
  }
 }
 for(let x=-2;x<=4;x+=2)for(const s of [-1,1]){B(b,x,-2,s*1.3,.3,1.8,.3,shade(c,.65));B(b,x+.7,-2.6,s*1.6,1.5,.25,.25,shade(c,.65));}
 for(const s of [-1,1]){const antenna=sp.scientific==='Lysmata amboinensis'?sp.design.accent:shade(c,.75);B(b,-7,1,s*.9,4,.14,.16,antenna);B(b,-7.5,1.9,s*.7,4,.13,.14,antenna);if(sp.scientific==='Stenopus hispidus'){B(b,-6,-1.8,s*2.4,3,.5,.6,c);B(b,-7.5,-1.8,s*2.5,1.5,1,.7,sp.design.accent);}}
 eye(b,-4.5,.8,1.3,1.15);return finish(b,'segmented shrimp');}
function nudibranch(sp){const c=col(sp),b=new Blocks();
 for(let x=-5;x<=5;x++)for(let z=-2;z<=2;z++)if(x*x/31+z*z/7<=1.1){B(b,x,0,z,1,1.2,1,c);const top=sp.design?.pattern==='stripe3'&&z!==0?sp.design.accent:shade(c,1.2);B(b,x,1,z,1,.7,1,top);if(Math.abs(z)===2)B(b,x,.5,z,1,.45,.4,sp.design?.pattern==='edge'?sp.design.accent:shade(c,1.35));}
 for(const s of [-1,1]){B(b,-4,2,s*.8,.5,2.2,.5,0xe3b56e);B(b,-4,3,s*.8,.7,.7,.7,0xf2d48e);}
 for(let i=-2;i<=2;i++){B(b,2+i*.4,1.9,i*.5,.35,1.5,.35,0xf1d2b3);}return finish(b,'sea slug with rhinophores and gills');}
function starfish(sp){const c=col(sp),b=new Blocks(),crown=sp.scientific==='Acanthaster planci',blue=sp.scientific==='Linckia laevigata';
 if(crown||blue){
  // Crown-of-thorns has many spiny arms; Linckia has five long narrow arms.
  const arms=crown?12:5;
  for(let x=-7;x<=7;x++)for(let z=-7;z<=7;z++){
   const r=Math.hypot(x,z),angle=Math.atan2(z,x),sector=2*Math.PI/arms;
   let delta=Math.abs(((angle+sector/2+Math.PI*4)%sector)-sector/2);
   const inside=crown?(r<=2.3||(r<=6.8&&delta<.13+(7-r)*.018)):(r<=1.8||(r<=6.9&&delta<.10+(7-r)*.030));
   if(!inside)continue;B(b,x,0,z,1,.72,1,c);
   if(crown&&((x+z+32)%2===0))B(b,x,.8,z,.27,1.15,.27,sp.design.accent);
   else if(blue&&((x+z+32)%4===0))B(b,x,.45,z,.45,.2,.45,shade(c,1.18));
  }
 }else{
  // Short, broad arms leave the Japanese bat star a pentagonal profile.
  for(let x=-5;x<=5;x++)for(let z=-5;z<=5;z++){
   const angle=Math.atan2(z,x),r=Math.hypot(x,z),limit=4.1+1.5*Math.cos(5*(angle-Math.PI/2));
   if(r<=limit){B(b,x,0,z,1,.8,1,c);if((x+z+20)%4===0)B(b,x,.5,z,.55,.25,.55,sp.design?.accent??shade(c,1.25));}
  }
 }
 return finish(b,crown?'many-armed spiny crown-of-thorns':'five-armed starfish');}
function octopus(sp){const c=col(sp),b=new Blocks();
 for(let x=-3;x<=3;x++)for(let y=0;y<=5;y++)for(let z=-2;z<=2;z++)if(x*x/10+(y-2.5)**2/10+z*z/5<=1.1)V(b,x,y,z,c);
 eye(b,-2,2.2,2.1,1.5);
 for(let arm=0;arm<8;arm++){
  const a=arm*Math.PI/4;for(let j=1;j<=7;j++){
   const x=Math.cos(a)*(2+j*.65),z=Math.sin(a)*(2+j*.65),y=-.1-j*.12+(j>5?(j-5)*.25:0);
   let cc=sp.design?.pattern==='bands4'&&j%2===0?(sp.design?.accent||0xf0d9c2):c;B(b,x,y,z,1,.8,.85,cc);if(j%2===0)B(b,x,y-.48,z,.45,.2,.45,0xe7c8ae);
  }
 }return finish(b,'eight arms');}
function flatfish(sp){const c=col(sp),b=new Blocks();
 for(let x=-6;x<=6;x++)for(let z=-4;z<=4;z++)if(x*x/42+z*z/18<=1.1){B(b,x,0,z,1,.7,1,c);if((x+z+20)%4===0)B(b,x,.5,z,.6,.25,.6,shade(c,1.25));if(sp.scientific==='Platichthys stellatus'&&Math.abs(z)>=3&&x%2===0)B(b,x,.5,z,.8,.24,.8,shade(c,.55));}
 // both eyes on upper side, which is visible from the elevated camera
 for(const z of [-.9,.9]){B(b,-4.0,.65,z,1,.35,.8,WHITE);B(b,-4.25,.9,z,.45,.2,.45,INK);}
 for(let x=6;x<=9;x++)for(let z=-2;z<=2;z++)if(Math.abs(z)<=x-5)B(b,x,0,z,1,.5,1,shade(c,.8));
 return finish(b,'flatfish, both eyes on one side');}
function urchin(sp){const c=col(sp),b=new Blocks(),short=sp.design?.pattern==='shortspines',len=short?.70:(sp.design?.pattern==='longspines'?4:2.7),extent=short?3.35:4;
 for(let x=-3;x<=3;x++)for(let y=-3;y<=3;y++)for(let z=-3;z<=3;z++)if(x*x+y*y+z*z<=10)V(b,x,y,z,c);
 for(let x=-3;x<=3;x+=2)for(let z=-3;z<=3;z+=2){const r=Math.hypot(x,z);if(r>3.8)continue;const y=Math.sqrt(Math.max(0,9-r*r));B(b,x,y+len*.45,z,.35,len,.35,shade(c,.8));B(b,x,-y-len*.45,z,.35,len,.35,shade(c,.8));}
 for(let y=-2;y<=2;y+=2)for(let z=-2;z<=2;z+=2){B(b,extent,y,z,len,.35,.35,shade(c,.8));B(b,-extent,y,z,len,.35,.35,shade(c,.8));B(b,z,y,extent,.35,.35,len,shade(c,.8));B(b,z,y,-extent,.35,.35,len,shade(c,.8));}
 return finish(b,'spiny urchin');}
function squid(sp,groupVersion=true){const c=col(sp),g=new THREE.Group(),b=new Blocks();
 for(let x=-5;x<=4;x++){const w=Math.max(1,Math.round(2.8-Math.abs(x+1)*.3));for(let y=-w;y<=w;y++)for(let z=-2;z<=2;z++)if(y*y/(w*w+.1)+z*z/5<=1.2)V(b,x,y,z,c);}
 for(let x=3;x<=6;x++)for(let z=-4;z<=4;z++)if(Math.abs(z)<=6-x)B(b,x,0,z,1,.45,1,shade(c,1.1));
 eye(b,-4,0,2,1.25);
 for(let arm=0;arm<8;arm++){const a=arm*Math.PI/4;for(let j=0;j<5;j++)B(b,-6-j,-.3+Math.cos(a)*j*.24,Math.sin(a)*(.5+j*.3),1,.38,.38,j===4&&sp.scientific==='Watasenia scintillans'?0x8fe9ef:shade(c,.9));}
 for(const s of [-1,1])for(let j=0;j<8;j++)B(b,-7-j,-1.1,s*(1+j*.2),1,.25,.25,j>=6&&sp.scientific==='Watasenia scintillans'?0x98f2f6:c);
 addBody(g,b,'firefly squid, arms and photophores');
 
 return {group:g,parts:{},kind:'other'};}
function monkfish(sp){
 // Broad, flattened benthic angler with eyes above the wide head.
 const c=col(sp),g=new THREE.Group(),b=new Blocks();
 for(let x=-6;x<=5;x++)for(let z=-5;z<=5;z++){
  const head=x<=0,rx=head?(x+2)*(x+2)/20:(x*x/36),rz=head?z*z/24:z*z/Math.max(2,16-x*2);
  if(rx+rz>1.1)continue;for(let y=-1;y<=1;y++)V(b,x,y,z,((x*3+z*2+40)%8===0)?sp.design.accent:c);
 }
 for(const side of [-1,1]){B(b,-4.2,1.4,side*2.2,1.2,.6,1.2,shade(c,1.2));B(b,-4.4,1.8,side*2.2,.55,.3,.55,INK);}
 for(let z=-3;z<=3;z++)B(b,-6.0,-.2,z,.3,.25,1,shade(c,.45));
 // Raised fishing lure and broad pectoral fins.
 B(b,-2.5,2.5,0,.25,2.8,.25,shade(c,1.2));B(b,-3.4,3.8,0,2.0,.25,.25,shade(c,1.2));B(b,-4.3,3.55,0,.65,.65,.65,sp.design.accent);
 for(const side of [-1,1])for(let x=0;x<=3;x++)B(b,x,-.6,side*(4+x*.25),1,.45,2.0,shade(c,.85));
 addBody(g,b,'flattened benthic head and lure');
 const tail=new THREE.Group(),tb=new Blocks();tail.position.x=4.5*U;for(let x=0;x<=3;x++)for(let z=-2;z<=2;z++)if(Math.abs(z)<=x)B(tb,x,0,z,1,.55,1,shade(c,.8));tail.add(tb.mesh('benthic angler tail'));g.add(tail);return {group:g,parts:{tail},kind:'fish'};
}
function angler(sp){const m=fish({...sp,shape:'puffer'}),b=new Blocks();
 B(b,-4.5,4.1,0,.3,2.5,.3,0xb9a779);B(b,-5.5,5.2,0,2,.3,.3,0xb9a779);B(b,-6.4,4.8,0,.9,.9,.9,0xf4dc8b);
 for(let y=-2;y<=0;y++)B(b,-5.2,y,0,.5,.4,2.4,0x423b3a);
 for(const s of [-1,1])for(let i=0;i<3;i++)B(b,-5.4,-1.6+i*.6,s*1.1,.8,.3,.2,0xf3e9cf);
 m.group.add(b.mesh('lure and mouth'));return m;}
function environment(sp){const c=col(sp),b=new Blocks(),sh=sp.shape;
 if(sh==='anemone'){
  for(let x=-3;x<=3;x++)for(let z=-3;z<=3;z++)if(x*x+z*z<=11)for(let y=-2;y<=0;y++)V(b,x,y,z,shade(c,.75));
  for(let i=0;i<12;i++){const a=i*Math.PI/6,x=Math.round(Math.cos(a)*3),z=Math.round(Math.sin(a)*3),h=3+i%3;for(let y=1;y<=h;y++)B(b,x+Math.cos(a)*y*.15,y,z+Math.sin(a)*y*.15,.65,1,.65,y===h?shade(c,1.3):c);}
 }else if(sh==='branchCoral'){
  for(let y=-2;y<=3;y++)B(b,0,y,0,1.2,1,1.2,c);for(const s of [-1,1])for(let i=0;i<4;i++){B(b,s*i,1+i,0,1,1,1,c);if(i>1)B(b,s*i,2+i,0,1,1,1,shade(c,1.15));}
 }else if(sh==='flowerCoral'){
  for(let x=-3;x<=3;x+=2)for(let z=-2;z<=2;z+=2){for(let y=-2;y<=1;y++)B(b,x,y,z,1.7,1,1.7,c);for(let i=0;i<6;i++){let a=i*Math.PI/3;B(b,x+Math.cos(a),2,z+Math.sin(a),.5,1.5,.5,shade(c,1.2));}}
 }else if(sh==='seaFan'){
  for(let y=-2;y<=1;y++)B(b,0,y,0,1,1,1,c);for(let x=-5;x<=5;x++)for(let y=1;y<=6-Math.abs(x)*.55;y++)if(x===0||y===1||((x+y+20)%2===0))B(b,x,y,0,.55,.55,.55,c);
 }else if(['eelgrass','broadleaf','seagrass'].includes(sh)){
  for(let i=-3;i<=3;i++){let h=sh==='eelgrass'?7+(i%2):sh==='broadleaf'?6+(i%2):5;for(let y=-2;y<=h-2;y++)B(b,i*(sh==='broadleaf'?1.1:.7)+Math.sin(y*.4+i)*.45,y,i%2*.8,sh==='broadleaf'?.95:.5,1,.4,y%3===0?shade(c,1.15):c);}
 }else if(sh==='ascidian'){
  for(let x=-3;x<=3;x++)for(let y=-2;y<=3;y++)for(let z=-2;z<=2;z++)if(x*x/13+z*z/6<=1.1)V(b,x,y,z,(x+y)%3?c:shade(c,1.1));
  B(b,-1.5,4,0,1.4,2,1.4,shade(c,1.1));B(b,2,3,1.4,1.3,1.8,1.3,shade(c,1.1));B(b,-1.5,5.1,0,.6,.2,.6,0x765960);B(b,2,4,1.4,.5,.2,.5,0x765960);
 }else if(sh==='mussel'){
  for(let x=-4;x<=4;x++)for(let y=-2;y<=3;y++)for(let z=-1;z<=1;z++)if(x*x/19+(y-.3)**2/10+z*z/3<=1.1)V(b,x,y,z,x%2?c:shade(c,1.25));B(b,0,0,0,.2,5,2.5,shade(c,.55));
 }
 return finish(b,sh+' attached to the bottom');
}

// A small set of anatomical builders combined with species-specific palettes,
// markings and additional silhouettes. These are stylised voxel models, not
// scans or scientifically exact illustrations.
function tailColor(sp,c){
 const p=sp.design?.pattern;
 if(['palette','tailgold','purpletail','redtail','redfin','tailblack'].includes(p))return sp.design.accent;
 if(sp.scientific==='Amphiprion clarkii')return 0xe6bb64;
 return shade(c,.82);
}
function realPattern(sp,base,x,y,z,rx,ry){
 const p=sp.design?.pattern||'none',a=sp.design?.accent??shade(col(sp),1.3), ax=Math.abs(x),r=(x+12)*13+(y+9)*7;
 if(sp.scientific==='Julidochromis marlieri'&&((x+12)%4===0||(y+6)%3===0))return a;
 if(sp.scientific==='Tropheus duboisi')return x===0||x===1?a:base;
 if(p==='skipjackBack'){if(y>=1&&x>=0&&y%2===1)return 0x304c5b;if(y<0)return a;}
 if(p.startsWith('bands')){
  const n=Number((p.match(/bands(\d)/)||[])[1])||3,sections=n===1?[-3]:n===2?[-3,2]:n===3?[-4,0,4]:n===4?[-5,-2,1,4]:[-5,-3,0,3,5];
  if(sections.some(v=>x===v))return a;
  return base;
 }
 if(p==='neon'||p==='neonfull'){if(y===0)return 0x37c9df;if(y===-1&&(p==='neonfull'||x>=0))return a;if(y<0)return 0xc9d2c8;}
 if(p==='stripe'||p==='stripe3'||p==='stripe5'||p==='twin'||p==='backline'){
  if((p==='backline'&&y>=ry-1)||(p==='twin'&&Math.abs(y)===1)||(p==='stripe'&&y===0)||(p==='stripe3'&&Math.abs(y)<=1)||(p==='stripe5'&&Math.abs(y)<=2&&y%2===0))return a;
 }
 if(['dots','spots','polkadot','stars','ocelli','halfspots'].includes(p)){
  // Two-dimensional spots rather than diagonal bands on side surfaces.
  const spacing=p==='stars'?2:3,vertical=p==='polkadot'?3:2;
  if((x+24)%spacing===0&&(y+24)%vertical===0&&(p!=='halfspots'||x>0))return a;
 }
 if(p==='mottled'&&((Math.floor((x+8)/2)*3+Math.floor((y+5)/2))%4===0))return a;
 if(p==='waves'&&((x+2*y+40)%5===0))return a;
 if(p==='chevron'&&((x+Math.abs(y)+24)%5===0))return a;
 if(p==='diagonal'&&((x+y+24)%5===0))return a;
 if(p==='counter'&&y<0)return a;
 if(p==='redbelly'&&y< -1)return a;
 if(p==='headgold'&&x< -2)return a;
 if(p==='redhead'&&x< -3)return a;
 if(p==='half'&&x>0)return a;
 if(p==='mask'&&x<=-3&&y>=0)return a;
 if(p==='headstripe'&&x===-4)return a;
 if(p==='back'&&y>1)return a;
 if(p==='saddle'&&x>1&&y>=1)return a;
 if(p==='palette'&&y>=0&&x> -3&&x<4&&((x+y+12)%4<=1))return 0x27394a;
 if(p==='rainbow'&&y===0)return a;
 if(p==='scales'&&((x+2*y+30)%4===0))return shade(base,1.2);
 if(p==='redtail'&&x>2)return a;
 if(p==='fintips'&&y>=ry-1)return a;
 if(p==='clearhead'&&x< -3&&y>0)return a;
 return base;
}
function boxfish(sp){
 const g=new THREE.Group(),b=new Blocks(),c=col(sp),accent=sp.design?.accent||shade(c,.6);
 for(let x=-4;x<=4;x++)for(let y=-3;y<=3;y++)for(let z=-3;z<=3;z++){
  let cc=((x+2*y+3*z+60)%7===0)?accent:c;
  if(Math.abs(x)===4||Math.abs(y)===3||Math.abs(z)===3)V(b,x,y,z,cc);
 }
 eye(b,-3.1,1,3.2,1.25);B(b,-5,0,0,1.5,.7,1.2,shade(c,.75));
 if(sp.design?.pattern==='horn')for(const side of [-1,1]){B(b,-3,4,side*2,1,2,.8,shade(c,.8));B(b,-3.4,5.1,side*2,0.7,.8,.6,shade(c,.8));}
 addBody(g,b,'box-shaped body');const tail=new THREE.Group(),tb=new Blocks();tail.position.x=4*U;
 for(let x=0;x<=3;x++)for(let y=-2;y<=2;y++)if(Math.abs(y)<=x)B(tb,x,y,0,1,1,.7,accent);
 tail.add(tb.mesh('tail'));g.add(tail);return {group:g,parts:{tail},kind:'fish'};
}
function crustacean(sp){
 const sh=sp.shape,c=col(sp),a=sp.design?.accent||shade(c,1.2),b=new Blocks(),g=new THREE.Group();
 if(sh==='lobster'){
  // Elongated segmented abdomen, long paired antennae and walking legs.
  for(let x=-5;x<=5;x++)for(let y=-2;y<=2;y++)for(let z=-2;z<=2;z++)if(y*y/5+z*z/5<=1.1)V(b,x,y,z,x%3===0?a:c);
  for(const side of [-1,1]){for(let j=0;j<5;j++)B(b,-8-j,2.2+j*.15,side*(1+j*.5),1,.14,.14,a);for(let x=-3;x<=4;x+=2){B(b,x,-2,side*3,.3,2,2,c);B(b,x,-3.1,side*4.1,.3,.3,2,c);}}
  for(let z=-3;z<=3;z++)B(b,6,0,z,1,.6,1,a);eye(b,-4.8,1.3,1.9,1.0);
 }else{
  // Round carapace, eye stalks, claws and eight legs; hermits get a shell.
  for(let x=-4;x<=4;x++)for(let z=-4;z<=4;z++)if(x*x/19+z*z/14<=1.1)for(let y=0;y<=1;y++)V(b,x,y,z,(x+z+14)%4?a:c);
  for(const side of [-1,1]){
   B(b,-3,2,side*2,.6,1,.6,c);B(b,-3,2.6,side*2,.8,.7,.8,INK);
   for(let x=-2;x<=4;x+=2){const reach=sp.design?.pattern==='longlegs'?7:4;B(b,x,-.2,side*(3+reach*.32),.35,.4,reach,c);B(b,x,-1.0,side*(3+reach*.78),.3,1.8,.3,c);}
   B(b,-5,0,side*3,2,1,1,c);B(b,-6.4,0,side*3.4,1.5,1.3,1.6,side>0?a:c);
  }
  if(sh==='hermit')for(let x=1;x<=5;x++)for(let y=1;y<=4;y++)for(let z=-2;z<=2;z++)if((x-2.5)**2/9+(y-2)**2/5+z*z/6<=1) V(b,x,y,z,(x+y)%3?a:shade(c,1.4));
 }
 addBody(g,b,sh+' body and limbs');return {group:g,parts:{},kind:'other'};
}
function pinniped(sp){
 const c=col(sp),otter=sp.shape==='otter',style=sp.design?.seaLionStyle,b=new Blocks(),g=new THREE.Group();
 for(let x=-6;x<=6;x++)for(let y=-3;y<=3;y++)for(let z=-2;z<=2;z++)if(x*x/42+y*y/9+z*z/6<=1.08){let cc=otter&&x< -2?0xc8b69b:c;if(style==='fur'&&((x*7+y*3+z*5+80)%8===0))cc=shade(c,1.23);if(!otter&&sp.shape!=='seaLion'&&((x*5+y*3+z*2+60)%11===0))cc=sp.design.accent;V(b,x,y,z,cc);}
 if(style==='steller')B(b,-4.2,.4,0,4,5.6,4.4,shade(c,1.08));B(b,-6.2,.3,0,style==='fur'?2.7:3,style==='steller'?3.7:3,style==='steller'?3.3:2.7,otter?0xc8b69b:c);eye(b,-6.6,.8,style==='steller'?1.85:1.55,1.05);B(b,-8.1,0,0,.6,.5,.8,INK);if(sp.shape==='seaLion')for(const side of [-1,1])B(b,-5.8,1.9,side*(style==='steller'?1.8:1.5),.45,style==='fur'?.9:.5,.35,c);
 for(const side of [-1,1]){for(let j=-1;j<=1;j++)B(b,-7.8,-.2+j*.3,side*1.4,2,.10,.12,0xded9c7);B(b,5,-.6,side*2,2,.5,3,shade(c,.8));}
 addBody(g,b,otter?'sea otter body':'seal body');const flippers=[];
 for(const side of [-1,1]){const fin=new THREE.Group(),fb=new Blocks();fin.position.set(-1*U,-1*U,side*2*U);for(let x=-2;x<=1;x++)for(let z=0;z<=3;z++)B(fb,x,-z*.2,side*z,1,.55,1,shade(c,.78));fin.add(fb.mesh('fore flipper'));g.add(fin);flippers.push({group:fin,side});}
 return {group:g,parts:{flippers},kind:'mammal'};
}
// Hand-built bell, oral arms and marginal tentacles for the reviewed 2.20 jellies.
function nautilus220(sp){
 const g=new THREE.Group(),b=new Blocks(),c=col(sp),a=sp.design.accent;
 // Laterally flattened coiled shell; curved dark radial bands on cream.
 for(let x=-5;x<=5;x++)for(let y=-5;y<=5;y++){const d=Math.sqrt(x*x+y*y);if(d>5.4)continue;for(let z=-2;z<=2;z++){const radial=Math.atan2(y,x)+d*.32;const stripe=Math.sin(radial*8)>.68;B(b,x,y,z,1,1,1,stripe?a:c);}}
 B(b,-5.5,-1,0,2,2.8,2.6,0xbd997b);for(const side of [-1,1])B(b,-5.9,-.4,side*1.35,.5,.5,.2,0x171b1e);
 addBody(g,b,'striped spiral shell');const tentacles=[];for(let k=0;k<12;k++){const t=new THREE.Group(),v=new Blocks();t.position.set(-6*U,(-1+(k%4)*.4)*U,((k%5)-2)*.35*U);for(let j=0;j<5;j++)B(v,-j,-j*.25+(k%3)*.2,0,1,.18,.18,0xd4b89c);t.add(v.mesh('nautilus tentacle'));g.add(t);tentacles.push(t);}return {group:g,parts:{tentacles},kind:'other'};
}
function penguin220(sp){
 const g=new THREE.Group(),b=new Blocks(),dark=col(sp),cream=sp.design.accent,style=sp.design?.penguinStyle||'magellanic',little=style==='little';
 // A shared streamlined voxel body. Band count and face markings are chosen per species.
 for(let x=-6;x<=6;x++)for(let y=-3;y<=3;y++)for(let z=-3;z<=3;z++)if(x*x/45+y*y/13+z*z/8<1.08){
  const belly=y<0&&x>-5;let c=belly?cream:dark;
  if(belly&&((style==='magellanic'&&(x===-2||x===1))||(['humboldt','african','galapagos'].includes(style)&&x===-1)))c=dark;
  if(style==='african'&&belly&&x>0&&((x*3+z*5+20)%5===0))c=dark;
  V(b,x,y,z,c);
 }
 // Small dark belly marks and species bands on visible outer breast surfaces.
 if(style==='african')for(const [x,z] of [[2,-.8],[3,0],[2,.8],[4,-.5],[4,.5]])B(b,x,-2.1,z,.32,.18,.32,dark);
 B(b,-6,.4,0,4.0,3.8,4.0,dark);B(b,-6.4,-2.0,0,1.0,1.5,1.05,0x756451);
 for(const side of [-1,1]){
  // In banded penguins a pale face stripe curves from above/behind the eye toward throat.
  if(!little){const thin=style==='galapagos'?.24:.42;B(b,-4.8,.65,side*2.05,thin,2.2,.18,cream);B(b,-5.0,-.45,side*2.05,.8,thin,.18,cream);}
  if(style==='humboldt')B(b,-7.45,-.12,side*2.06,1.25,.75,.20,0xcf8e83);
  if(style==='african')B(b,-6.45,1.40,side*2.08,.8,.26,.14,0xd49c99);
  if(style==='galapagos')B(b,-7.25,-.24,side*2.08,.65,.35,.16,0xbd8d87);
  B(b,-6.4,.9,side*2.08,1.15,1.15,.2,0xe9e8df);B(b,-6.48,.9,side*2.21,.78,.78,.14,0x18212a);B(b,-6.7,1.16,side*2.30,.24,.24,.08,0xffffff);B(b,5,-2,side*1.1,2,.45,1,0x756c5e);
 }
 addBody(g,b,`${style} penguin body`);const flippers=[];
 for(const side of [-1,1]){const f=new THREE.Group(),v=new Blocks();f.position.set(0,0,side*2*U);for(let x=-2;x<=3;x++)B(v,x,0,side*(1+(x+2)*.35),1,.4,2,dark);f.add(v.mesh('penguin flipper'));g.add(f);flippers.push({group:f,side});}
 g.scale.set(1.04,.90,.92);return {group:g,parts:{flippers},kind:'mammal'};
}

function smallOtter220(sp){
 const g=new THREE.Group(),b=new Blocks(),c=col(sp),pale=sp.design.accent;
 for(let x=-6;x<=6;x++)for(let y=-2;y<=2;y++)for(let z=-2;z<=2;z++)if(x*x/43+y*y/6+z*z/6<1.12)V(b,x,y,z,y<0?pale:c);
 B(b,-6.4,.1,0,3.5,2.7,3.3,c);B(b,-8,-.3,0,1.9,1.6,2.3,pale);B(b,-8.9,.12,0,.42,.4,.8,0x201c18);eye(b,-6.8,.70,1.75,1.25);for(const side of [-1,1]){B(b,-7.9,-.35,side*1.12,.8,.65,.18,pale);for(let k=0;k<2;k++)B(b,-8.15+k*.38,-.4-k*.24,side*1.27,.8,.09,.12,0xd9c7aa);}
 for(const side of [-1,1]){B(b,-5,1.3,side*1.3,.5,.5,.5,c);for(const x of [-3,4]){B(b,x,-1.5,side*2,1.4,.65,1.8,c);for(let k=0;k<3;k++)B(b,x-.4+k*.4,-1.7,side*2.8,.25,.28,.55,pale);}}
 for(let x=7;x<=12;x++)B(b,x,-.25,0,1,.65,Math.max(.4,2-(x-7)*.22),c);addBody(g,b,'small-clawed otter');return {group:g,parts:{},kind:'mammal'};
}
function salamander220(sp){
 const g=new THREE.Group(),b=new Blocks(),c=col(sp),a=sp.design.accent;
 for(let x=-7;x<=7;x++)for(let z=-3;z<=3;z++)for(let y=-1;y<=1;y++)if(x*x/64+z*z/12+y*y/3<1.05)V(b,x,y,z,(x*11+z*5+y*3+70)%9<2?a:c);
 for(let x=-11;x<=-6;x++)for(let z=-3;z<=3;z++)if((x+8)*(x+8)/15+z*z/12<1)B(b,x,.1,z,1,1,1,(x+z)%3?a:c);
 for(const side of [-1,1]){B(b,-9,1,side*2.1,.35,.3,.4,0x181f1d);for(const x of [-4,4]){B(b,x,-.5,side*3.3,1.3,.65,2.8,c);for(let j=0;j<3;j++)B(b,x-1+j*.7,-.8,side*4.8,.4,.3,.9,c);}}
 for(let x=7;x<14;x++)B(b,x,0,0,1,Math.max(.35,1.5-(x-7)*.15),Math.max(.4,4-(x-7)*.5),c);addBody(g,b,'mottled giant salamander');return {group:g,parts:{},kind:'other'};
}
// Articulated eel bodies: long tapering trunk and a continuous low fin, not a fish with a fan tail.
function eel224(sp){
 const g=new THREE.Group(),segments=[],moray=sp.shape==='moray',c=col(sp),belly=sp.design.accent;
 for(let i=0;i<14;i++){const seg=new THREE.Group(),b=new Blocks(),x=-13+i*2,thick=Math.max(.43,1.55-i*.075);seg.position.x=x*U;seg.position.z=Math.sin(i*.6)*.02*Math.min(i,7);seg.rotation.y=Math.sin(i*.6)*.09;
  for(let yy=-1;yy<=1;yy++)for(let zz=-1;zz<=1;zz++){if(yy*yy+zz*zz>1.1)continue;B(b,0,yy*thick*.65,zz*thick*.65,2.28,thick*.72,thick*.72,yy<0?(moray?0xa99163:belly):c);}
  if(i>0){B(b,0,thick*.98,0,2.2,.42,thick*.48,moray?0x806840:0x6f7b70);B(b,0,-thick*.99,0,2.2,.35,thick*.43,moray?0xd7c498:0x8c9888);}
  if(moray&&i>0&&i%2===1)for(const side of [-1,1])B(b,0,.22,side*thick,.7,thick*1.35,.18,0x4f422e);
  if(i===0){B(b,-1.3,.12,0,1.6,1.45,2.4,c);B(b,-1.45,-.65,0,1.8,.35,2.15,moray?0xd9c095:belly);for(const side of [-1,1]){B(b,-1.05,.75,side*1.26,.42,.42,.13,0xe6dbb7);B(b,-1.12,.75,side*1.34,.22,.22,.1,0x171e20);if(moray)B(b,-1.55,.45,side*.85,.17,.6,.18,0x4b3f2e);else B(b,1.5,-.1,side*1.75,.8,.18,1.0,0x8e9a8b);}}
  seg.add(b.mesh(moray?'moray patterned segment':'eel smooth segment'));g.add(seg);segments.push(seg);
 }
 return {group:g,parts:{eelSegments:segments},kind:'fish'};
}
function clione224(sp){
 // Soft, pale translucent shell-less body with visible orange internal mass.
 const g=new THREE.Group(),body=new Blocks(),inner=new Blocks();
 for(let y=-7;y<=4;y++){const w=Math.max(.35,1.65-Math.abs(y+1)*.15);B(body,0,y,0,w*2,1,w*1.4,0xe4f1ed);}
 B(body,0,4.8,0,3.0,1.4,2.2,0xf0f5ee);B(body,0,5.7,0,2.3,.9,1.8,0xf0f5ee);B(body,-.55,6.35,0,.48,.65,.45,0xe9f3ef);B(body,.55,6.35,0,.48,.65,.45,0xe9f3ef);
 for(let y=-3;y<=0;y++)B(inner,0,y,0,2.0,1,1.15,y===-1?0xe99677:0xeeb59c);
 addBody(g,inner,'sea angel orange internal organs');const skin=body.mesh('soft translucent sea angel body');skin.material=skin.material.clone();skin.material.transparent=false;skin.material.opacity=1;skin.material.depthWrite=true;g.add(skin);const tint=new Blocks();for(let y=-3;y<=0;y++)for(const side of [-1,1])B(tint,0,y,side*1.14,1.0+(y===-1?.35:0),.85,.08,y===-1?0xe9a07f:0xeeb9a2);addBody(g,tint,'soft orange visible organs');
 const wings=[];for(const side of [-1,1]){const wing=new THREE.Group(),v=new Blocks();wing.position.set(side*.18,.38,0);for(let k=0;k<5;k++)B(v,side*(k*.72),-.13*k,0,.9,Math.max(.6,2.25-k*.33),.48,0xe3f1eb);const mesh=v.mesh('sea angel swimming wing');mesh.material=mesh.material.clone();mesh.material.transparent=true;mesh.material.opacity=.80;mesh.material.depthWrite=false;wing.add(mesh);g.add(wing);wings.push({group:wing,side});}return {group:g,parts:{wings},kind:'other'};
}
function sturgeon224(sp){
 const g=new THREE.Group(),b=new Blocks(),c=col(sp),a=sp.design.accent;
 for(let x=-7;x<=7;x++)for(let y=-2;y<=2;y++)for(let z=-2;z<=2;z++)if(x*x/65+y*y/6+z*z/6<1.04)V(b,x,y,z,y<0?a:c);
 for(let k=0;k<5;k++)B(b,-7-k,.15,0,1,.65,Math.max(.3,1.6-k*.26),c);
 for(const side of [-1,1]){B(b,-6,.6,side*1.4,.35,.35,.18,0x202c28);for(let n=0;n<2;n++)B(b,-8+n*.6,-.75,side*.45,.12,1.0,.12,a);for(let x=-4;x<=6;x+=2)B(b,x,.5,side*2.05,.55,.65,.25,0xd5d5bc);B(b,-1,-1.2,side*2.5,2,.28,2,c);}
 for(let x=-5;x<=6;x+=2)B(b,x,2.1,0,.6,.65,.7,a);B(b,5,2.4,0,2,1,.5,c);addBody(g,b,'sturgeon snout barbels and scutes');const tail=new THREE.Group(),tb=new Blocks();tail.position.x=7*U;for(let x=0;x<4;x++)for(let y=-2;y<=4;y++)if(Math.abs(y)<=x+1&&!(x>1&&y===0))B(tb,x,y,0,1,1,.6,c);tail.add(tb.mesh('asymmetric tail'));g.add(tail);return {group:g,parts:{tail},kind:'fish'};
}
function amphibian223(sp){
 const g=new THREE.Group(),b=new Blocks(),c=col(sp),a=sp.design.accent,ax=sp.shape==='axolotl',frog=sp.shape==='clawedFrog';let tail=null;
 if(frog){
  for(let x=-5;x<=5;x++)for(let z=-4;z<=4;z++)for(let y=-2;y<=2;y++)if(x*x/36+z*z/21+y*y/7<1.02)V(b,x,y,z,y<0?a:((x*3+z*5+40)%9===0?shade(c,.7):c));
  B(b,-5,.25,0,2.5,1.8,4.0,c);for(const side of [-1,1]){B(b,-5,1.5,side*1.4,1.0,.65,1.0,c);B(b,-5,1.88,side*1.4,.45,.20,.45,0x252b22);B(b,-3,-.2,side*3.6,2,.5,2,c);B(b,3,-.2,side*4,2,.6,4,c);B(b,5,-.2,side*6,2.5,.4,2.2,c);}
 }else{
  for(let x=-5;x<=6;x++)for(let z=-2;z<=2;z++)for(let y=-2;y<=2;y++)if(x*x/42+z*z/7+y*y/7<1.05)V(b,x,y,z,y<0&&!ax?a:c);
  B(b,-6,.3,0,3.8,2.4,4.5,c);for(const side of [-1,1]){B(b,-6.9,.7,side*2.28,.55,.55,.2,0x24272a);for(const x of [-3,4]){B(b,x,-1,side*2.7,1.2,.6,2,c);B(b,x,-1.3,side*3.8,1.8,.4,1,c);}}
  tail=new THREE.Group();tail.position.x=6*U;const tb=new Blocks();for(let x=0;x<=6;x++)B(tb,x,0,0,1,ax?2.0:1.0,Math.max(.5,2.6-x*.34),c);if(ax)for(let x=0;x<=5;x++)B(tb,x,1.25,0,1,.5,.45,c);tail.add(tb.mesh('swimming tail'));g.add(tail);
  if(ax){for(const side of [-1,1])for(let k=0;k<3;k++){const x=-4.5+k*1.0;B(b,x,1,side*3,0.35,2.5,.35,0xc98887);B(b,x,2.1,side*3.5,.3,.3,1.4,0xc98887);B(b,x,1.2,side*3.7,.3,.3,1.2,0xc98887);}}
 }
 addBody(g,b,sp.shape);return {group:g,parts:{tail},kind:'other'};
}
function isopod220(sp){
 const b=new Blocks(),g=new THREE.Group(),c=col(sp),a=sp.design.accent;
 // Seven overlapping broad dorsal plates and a rounded tail fan.
 for(let x=-5;x<=5;x++)for(let z=-4;z<=4;z++){const ell=x*x/36+z*z/19;if(ell>1)continue;const y=Math.max(0,Math.round(2*Math.sqrt(Math.max(0,1-ell))));B(b,x,y,z,1,.75,1,(x%2===0)?a:c);}
 B(b,-5,1,0,2.6,1.3,5,shade(c,.9));for(const side of [-1,1]){B(b,-5.9,1.5,side*1.6,.7,.55,.5,0x282a30);for(let n=0;n<7;n++){const x=-4+n*1.3;B(b,x,-.5,side*3.9,.32,.65,2.1,shade(c,.8));B(b,x,-1,side*4.9,.32,.6,.4,shade(c,.8));}for(let k=0;k<4;k++)B(b,-6.3-k*.45,1.1,side*(2+k*.24),.55,.18,.18,a);}
 B(b,5.7,.1,0,1.8,.5,4.3,a);addBody(g,b,'segmented isopod');return {group:g,parts:{},kind:'other'};
}
function gardenEel220(sp){
 const g=new THREE.Group(),stem=new THREE.Group(),b=new Blocks(),c=col(sp),a=sp.design.accent;
 // Only the upper body is visible above a sand burrow.
 for(let y=0;y<15;y++){let x=Math.sin(y*.18)*.8;let color=sp.design.pattern==='bands'&&Math.floor(y/2)%2===0?a:c;B(b,x,y,0,1.45,1.05,1.15,color);if(sp.design.pattern==='spots'&&y%2===0){B(b,x,y,.62,.24,.30,.16,a);if(y===8||y===12)B(b,x+.15,y,.66,.78,1.05,.19,a);}}
 B(b,.7,15,0,2.0,1.5,1.5,c);for(const side of [-1,1])B(b,.45,15.25,side*.78,.3,.3,.15,0x1c252b);
 stem.add(b.mesh('emerging garden eel'));g.add(stem);return {group:g,parts:{gardenStem:stem},kind:'other'};
}
function curatedJelly(sp){
 // Reuse the original game's solid, softly shaded voxel jelly foundation.
 // The species-specific markings and arms remain distinct without a separate visual language.
 const style=sp.design.jellyStyle,c=col(sp),accent=sp.design.accent,m=createCreature('jelly');
 animalTint(m.group,c);const marks=new Blocks(),bell=m.parts.bell;
 // Paint the same solid voxel volume rather than a thin shell. This keeps the
 // stepped volume of the original jelly while preserving radial species marks.
 const cap=bell.children.find(o=>o.isInstancedMesh);if(cap){const mat=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),paint=new THREE.Color();
  for(let i=0;i<cap.count;i++){cap.getMatrixAt(i,mat);mat.decompose(p,q,sc);const x=p.x/.2,z=p.z/.2,y=p.y/.2,angle=Math.atan2(z/4.5,x/6.4);
   let hex=c;if(style==='purple'&&Math.abs(Math.sin(angle*8))<.34)hex=accent;
   if(style==='flower'&&Math.abs(Math.sin(angle*12))<.22)hex=0x7fa9a2;
   if(style==='black')hex=0x40365c;
   paint.setHex(hex).multiplyScalar(y>3?1.13:y<1?.82:1);cap.setColorAt(i,paint);
  }cap.instanceColor.needsUpdate=true;
 }
 if(style==='crystal')bell.scale.y=.55;
 if(style==='blubber')bell.scale.y=1.13;
 if(style==='purple'||style==='flower')for(let i=0;i<(style==='purple'?8:12);i++){
  const a=i*Math.PI*2/(style==='purple'?8:12);for(let j=1;j<=5;j++){const x=Math.cos(a)*j,z=Math.sin(a)*j*.72,y=5.45-j*.31;B(marks,x,y,z,.58,.35,.58,style==='purple'?accent:0x91b8ae);}
 }
 if(style==='crystal')for(let i=0;i<16;i++){const a=i*Math.PI/8;B(marks,Math.cos(a)*5.6,.12,Math.sin(a)*3.8,.46,.35,.46,0xe3f2e7);}
 bell.add(marks.mesh('jelly species markings'));
 for(let i=0;i<m.parts.tentacles.length;i++){const t=m.parts.tentacles[i];
  t.scale.y=style==='blubber'?.62:style==='upside'?.70:style==='crystal'?.75:style==='flower'?.95:1.50;
  t.scale.x=style==='crystal'?.65:style==='flower'?.68:1;
  if(style==='flower')animalTint(t,accent);
  if(style==='black'&&(i===2||i===4))animalTint(t,accent);
 }
 // The existing 7 hanging voxel arms are augmented with an eighth for rhizostomes.
 if(style==='blubber'||style==='upside'){const extra=m.parts.tentacles[3].clone();extra.position.x+=.28;extra.position.z-=.22;m.group.add(extra);m.parts.tentacles.push(extra);}
 if(style==='upside'){const core=new THREE.Group();while(m.group.children.length)core.add(m.group.children[0]);core.rotation.z=Math.PI;m.group.add(core);}
 return m;
}

function jellyReal(sp){
 const m=createCreature('jelly');animalTint(m.group,col(sp));const p=sp.design?.pattern,c=sp.design?.accent||0xe5ded0,b=new Blocks();
 m.parts.tentacles.forEach(t=>{t.scale.y=p==='rings'?.28:p==='stripes'?1.15:p==='dots'?.55:.48;});
 if(p==='rings')for(const x of [-1.7,1.7])for(const z of [-1.3,1.3])for(const [dx,dz] of [[-1,0],[-1,1],[0,1],[1,1],[1,0]])B(b,x+dx*.48,5.7,z+dz*.48,.45,.24,.45,c);
 if(p==='dots')for(let x=-4;x<=4;x+=2)for(let z=-2;z<=2;z+=2)B(b,x,4.4-Math.abs(x)*.25,z,.6,.32,.6,c);
 if(p==='stripes')for(let i=0;i<8;i++){const ang=i*Math.PI/4;for(let j=0;j<=5;j++)B(b,Math.cos(ang)*j,5.5-j*.28,Math.sin(ang)*j,.42,.32,.42,c);}
 if(p==='yolk')for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)if(x*x+z*z<=5)B(b,x,5.5, z,1,1,1,c);
 m.parts.bell.add(b.mesh('species bell markings'));return m;
}
function addRealSilhouette(model,sp){
 const sh=sp.shape,p=sp.design?.pattern,c=col(sp),a=sp.design?.accent||shade(c,1.3),b=new Blocks();let added=false;
 if(sp.scientific==='Heterodontus japonicus'){for(const x of [-3,2])for(let y=0;y<4;y++)B(b,x,5+y*.55,0,.28,.6,.28,0xefe1b5);added=true;}
 if(sp.scientific==='Plecoglossus altivelis'){for(const side of [-1,1])B(b,-3,0,side*2.5,1.4,1,.18,0xd1bd67);added=true;}
 if(sp.scientific==='Nipponocypris temminckii'){for(const side of [-1,1])for(let x=-4;x<=5;x++)B(b,x,.2,side*2.5,1,.35,.16,0x536366);added=true;}
 if(['billfish','gar'].includes(sh)||p==='longnose'||p==='sword'){
  const len=p==='sword'?9:sh==='billfish'?7:4;
  for(let x=0;x<len;x++)B(b,-8.2-x,.15,0,1,.36,1-Math.min(.8,x*.09),shade(c,.85));added=true;
 }
 if(sh==='hammer'){
  for(let z=-6;z<=6;z++)B(b,-6.5,.5,z,1.5,1.3,1,c);
  for(const side of [-1,1])B(b,-7,.9,side*5.8,.7,.7,.4,INK);added=true;
 }
 if(sh==='lionfish'){
  for(let x=-4;x<=4;x+=2)for(let y=0;y<=4+(x%3===0?2:0);y++)B(b,x,3+y,0,.25,1,.4,y%2?a:c);
  for(const side of [-1,1])for(let x=-3;x<=3;x+=2)for(let z=0;z<=4;z++)B(b,x,1+z*.45,side*(2+z),.3,.3,1,z%2?a:c);added=true;
 }
 if(sh==='butterfly'&&(p==='moorish'||p==='bands2dark')){for(let y=0;y<=7;y++)B(b,0,3+y,0,.35,1,.5,y>4?a:c);added=true;}
 if(sh==='sunfish'){for(const side of [-1,1])for(let y=0;y<=5;y++)B(b,2,side*(3+y),0,2-y*.22,1,.75,c);added=true;}
 if(sh==='billfish'&&p==='sail'){for(let x=-3;x<=4;x++)for(let y=0;y<=Math.max(0,6-Math.abs(x));y++)B(b,x,3+y,0,1,1,.45,a);added=true;}
 if(p==='swordtail'){for(let x=6;x<=10;x++)B(b,x,-2.5,0,1,.35,.5,a);added=true;}
 if(p==='gills'){for(let x=-4;x<=-2;x++)B(b,x,0,2.6,.25,3.5,.2,a);added=true;}
 if(sh==='wrasse'&&sp.scientific==='Cheilinus undulatus'){for(let x=-4;x<=-2;x++)for(let y=3;y<=5;y++)B(b,x,y,0,1,1,1,c);added=true;}
 if(['manta','stingray'].includes(sh)&&['ocelli','spots','shoulder'].includes(p)){for(const side of [-1,1])for(let x=-1;x<=2;x+=2)B(b,x,.55,side*4,1.1,.25,1.1,a);added=true;}
 if(sh==='humpback')for(const side of [-1,1]){for(let z=0;z<=7;z++)B(b,-2,-1,side*(3+z),1.6,.4,1,0xe8e8df);added=true;}
 if(sh==='cuttlefish'){for(let x=-4;x<=4;x++)for(const side of [-1,1])B(b,x,0,side*3,1,.3,2,a);added=true;}
 if(sp.scientific==='Pterygoplichthys pardalis'){for(let x=-2;x<=5;x++)for(let y=0;y<=Math.max(0,5-Math.floor(Math.abs(x-1)*.7));y++)B(b,x,2.2+y,0,1,1,.55,(x+y)%3===0?a:c);added=true;}
 if(sp.scientific==='Ancistrus cirrhosus'){for(const side of [-1,1])for(let j=0;j<4;j++)B(b,-7.3-j*.45,.3+j*.35,side*(.4+j*.35),.25,.9,.25,a);added=true;}
 // Individually recognisable additions for the 2.16 research branch.
 if(sp.scientific==='Gigantura indica'){
  for(const side of [-1,1]){B(b,-5.9,1.1,side*2.3,2.5,1.35,1.1,0xb6c8c7);B(b,-7.05,1.1,side*2.3,.5,1.1,1.0,0x162d38);}
  for(let j=0;j<6;j++)B(b,7+j,-2-j*.3,0,1,.3,.4,c);added=true;
 }
 if(sp.scientific==='Caulophryne jordani'){
  for(let i=0;i<8;i++){let a=(i-3.5)*.3;for(let j=1;j<=6;j++)B(b,1+j*.35,3+j*.48,Math.sin(a)*j*.65,.13,.8,.13,a>0?c:a===0?c:shade(c,1.2));}
  for(let i=0;i<7;i++)for(let j=1;j<=5;j++)B(b,2+j*.3,-3-j*.4,(i-3)*j*.16,.12,.65,.12,shade(c,1.2));added=true;
 }
 if(sp.scientific==='Thunnus alalunga'){
  for(const side of [-1,1])for(let i=0;i<8;i++)B(b,-1+i*.65,-.6-i*.08,side*(2.4+i*.45),1,.27,.7,shade(c,.8));added=true;
 }
 // New expansion studies: elongated thresher tail remains part of the animated tail.
 if(sp.scientific==='Alopias pelagicus'&&model.parts.tail){
  const tail=model.parts.tail;while(tail.children.length)tail.remove(tail.children[0]);const tb=new Blocks();
  for(let j=0;j<15;j++){const x=j*.72,y=j*.30;B(tb,x,y,0,1.1,Math.max(.36,2-j*.10),.9,shade(c,.84));}
  for(let j=0;j<4;j++)B(tb,j*.6,-j*.45,0,1.1,1,.85,shade(c,.84));tail.add(tb.mesh('long upper tail lobe'));added=true;
 }
 if(sp.scientific==='Alepisaurus ferox'){
  for(let x=-3;x<=5;x++)for(let y=0;y<Math.max(1,6-Math.floor(Math.abs(x)*.65));y++)B(b,x,2.5+y,0,.9,.9,.36,shade(c,.76));added=true;
 }
 if(sp.scientific==='Gerres filamentosus'){
  for(let j=0;j<14;j++)B(b,-1+j*.22,3+j*.75,0,.18,.9,.22,shade(c,.8));added=true;
 }
 if(sp.scientific==='Cyphotilapia frontosa'){
  for(let x=-5;x<=-3;x++)for(let y=3;y<=4;y++)B(b,x,y,0,1,1,1.5,c);added=true;
 }
 if(sp.scientific==='Pseudomugil signifer'){
  for(const side of [-1,1]){B(b,-4,.7,side*2.58,1.2,1.2,.3,0x45b8df);B(b,-4,.7,side*2.78,.55,.55,.18,INK);}
  added=true;
 }
 if(sp.scientific==='Caristius macropus'){
  for(let x=-4;x<=4;x++)for(let y=0;y<Math.max(1,5-Math.floor(Math.abs(x)*.6));y++)B(b,x,4+y,0,.85,.85,.36,c);
  for(let x=-3;x<=4;x++)for(let y=0;y<Math.max(1,3-Math.floor(Math.abs(x)*.5));y++)B(b,x,-4-y,0,.85,.85,.36,shade(c,.9));added=true;
 }
 if(sp.scientific==='Acanthonus armatus'){
  for(let x=-6;x<=-3;x++)for(let y=-2;y<=2;y++)for(let z=-2;z<=2;z++)if((x+4.5)**2/4+y*y/6+z*z/6<=1.2)V(b,x,y,z,c);
  for(let x=0;x<=7;x++)for(let side of [-1,1])B(b,x,side*(2.4-x*.14),0,1,.4,.45,shade(c,.8));
  for(const side of [-1,1]){B(b,-6.9,1.1,side*.5,1.1,.22,.22,shade(c,.7));B(b,-1.6,.5,side*2.2,1.8,.2,.2,shade(c,.7));}added=true;
 }
 if(['Bathylagus antarcticus','Alepisaurus ferox','Osmerus mordax','Alosa maeotica','Sillago sihama','Pseudomugil signifer'].includes(sp.scientific)){model.group.scale.x*=1.28;model.group.scale.y*=.82;}
 // Deep-sea / estuary expansion: the diagnostic features are stylised.
 if(sp.scientific==='Lophiodes mutilus'){
  for(const side of [-1,1])for(let j=0;j<4;j++)B(b,-4.8+j*.65,-.7,side*(3.1+j*.12),.28,.7,.28,shade(c,.68));added=true;
 }
 if(sp.scientific==='Stomias boa'){
  // Long chin barbel, terminal light, teeth, and orderly ventral photophores.
  for(let j=0;j<6;j++)B(b,-6.5-j*.6,-1.2-j*.17,0,.65,.18,.18,shade(c,1.3));
  B(b,-10,-2.25,0,.55,.55,.55,0xb9f3dd);
  for(const side of [-1,1]){for(let j=0;j<5;j++)B(b,-5.7+j*.7,-.9,side*.9,.22,.55,.2,0xd9e5dc);for(let x=-3;x<=5;x+=2)B(b,x,-1.8,side*2.25,.35,.3,.2,0x9be8d5);}
  model.group.scale.set(1.5,.72,.85);added=true;
 }
 if(sp.scientific==='Parabrotula tanseimaru'){
  for(let x=0;x<=7;x++){B(b,x,-2.1,0,1,.35,.3,shade(c,.85));B(b,x,2.15,0,1,.3,.3,shade(c,.85));}added=true;
 }
 if(sp.scientific==='Hemitrygon fluviorum'){
  for(let x=-2;x<=5;x++)B(b,x,.8,0,.3,.38,.3,shade(c,.65));added=true;
 }
 if(sp.scientific==='Sarotherodon melanotheron'){
  for(const side of [-1,1])B(b,-4.5,-1.7,side*1.8,2.0,.8,.3,0x394640);added=true;
 }
 if(sp.scientific==='Cottus asper'){
  for(const side of [-1,1])for(let x=-3;x<=0;x++)for(let z=0;z<=3;z++)B(b,x,-1,side*(2.5+z),.8,.3,.8,shade(c,.8));
  for(let x=-5;x<=-3;x++)for(let z=-3;z<=3;z++)B(b,x,-.3,z,.8,1.6,.8,c);added=true;
 }
 if(sp.scientific==='Ambassis marianus'){
  for(const side of [-1,1]){B(b,-2,0,side*2.45,1.8,2.0,.15,shade(c,.83));B(b,0,0,side*2.4,.25,3,.12,shade(c,1.1));}model.group.scale.y*=.85;added=true;
 }
 if(['Tactostoma macropus','Echiostoma barbatum'].includes(sp.scientific)){
  model.group.scale.set(1.5,.66,.8);
  for(const side of [-1,1]){for(let x=-3;x<=5;x+=2)B(b,x,-1.8,side*2.25,.32,.28,.18,0x94dfcf);for(let j=0;j<4;j++)B(b,-5.4+j*.7,-.9,side*.9,.2,.5,.18,0xd9e5dc);}
  if(sp.scientific==='Echiostoma barbatum')for(const side of [-1,1])for(let j=0;j<8;j++)B(b,-2+j*.6,-1-j*.12,side*(2.3+j*.34),.65,.16,.38,shade(c,.85));
  added=true;
 }
 if(sp.scientific==='Lamprologus ocellatus'){for(const side of [-1,1])B(b,-2.9,.05,side*2.5,1.05,1.05,.18,0x37494a);model.group.scale.set(1.08,.82,1);added=true;}
 if(sp.scientific==='Julidochromis marlieri'){model.group.scale.set(1.32,.77,1);}
 if(sp.scientific==='Ambassis interrupta'){for(let j=0;j<6;j++)B(b,-2.0,3+j*.4,0,.22,.48,.2,0x526d70);model.group.scale.y*=.85;added=true;}
 if(sp.scientific==='Monodactylus argenteus'){model.group.scale.set(.8,1.35,.9);}
 if(sp.scientific==='Polypterus senegalus'){for(let x=-1;x<=7;x+=2){B(b,x,2.1,0,.5,1.5,.45,a);B(b,x+.35,2.7,0,.5,.6,.45,a);}added=true;}
 if(sp.scientific==='Eretmochelys imbricata'){B(b,-7.25,-.5,0,1.4,1.0,1.2,shade(c,.8));B(b,-7.9,-.9,0,.7,.5,.75,shade(c,.7));added=true;}

 if(added)model.group.add(b.mesh('species-specific anatomy'));
 if(sh==='betta'||(sh==='medaka'&&sp.scientific==='Poecilia reticulata')){if(model.parts.tail){model.parts.tail.scale.y=sh==='betta'?2.0:1.65;model.parts.tail.scale.x=1.25;}}
 if(sh==='angelfish'||sh==='disc'||sh==='butterfly')model.group.scale.y*=sh==='disc'?1.22:1.12;
 if(sh==='ribbon')model.group.scale.set(1.45,.60,.8);
 if(sh==='cuttlefish')model.group.scale.set(1,.75,1.35);
}
const FISH_BASE={
 surgeon:'clown',angelfish:'clown',butterfly:'clown',lionfish:'puffer',goby:'medaka',dartfish:'medaka',cardinal:'clown',damselfish:'clown',grouper:'wrasse',trigger:'clown',boxfish:'puffer',
 mackerel:'tuna',jack:'wrasse',salmon:'wrasse',whaleShark:'catshark',shark:'catshark',hammer:'catshark',sunfish:'puffer',billfish:'tuna',ribbon:'eel',deepfish:'medaka',disc:'puffer',cichlid:'clown',betta:'medaka',gourami:'clown',pleco:'catfish',gar:'arapaima'
};
// Documented additions: distinct voxel silhouettes, retaining the shared motion rig.
function shark228(sp){
 const m=fish({...sp,realShape:'shark',shape:'catshark'}),c=col(sp),b=new Blocks();
 if(sp.scientific==='Alopias vulpinus'){
  const tail=m.parts.tail;while(tail.children.length)tail.remove(tail.children[0]);const t=new Blocks();
  for(let x=0;x<15;x++){const y=x*.55;B(t,x,y,0,1.2,Math.max(.35,2.3-x*.11),.7,shade(c,.84));if(x<5)B(t,x,-x*.58,0,1,Math.max(.45,1.8-x*.16),.7,shade(c,.84));}tail.add(t.mesh('long upper tail lobe'));
 }else{
  // Even when the mouth is closed the exposed needle-like teeth remain visible.
  for(const side of [-1,1])for(let i=0;i<5;i++)B(b,-7.0+i*.44,-.98,side*.65,.12,.55,.12,0xe7e4d2);
  for(const side of [-1,1])for(let i=0;i<5;i++)B(b,-2.3+i*.42,.05,side*2.68,.12,1.55,.12,shade(c,.65));
  m.group.add(b.mesh('visible teeth and gill slits'));
 }
 return m;
}
function spottedRay228(sp){const m=ray(sp),c=sp.design.accent;
 for(const wing of m.parts.wings){const b=new Blocks();for(let x=-3;x<=3;x+=2)for(let z=1;z<=5;z+=2)if(z+2<=8-Math.abs(x)*1.3)B(b,x,.46,wing.side*z,.38,.12,.38,c);wing.group.add(b.mesh('white dorsal spots'));}
 const b=new Blocks();for(let x=-3;x<=3;x+=2)for(let z=-1;z<=1;z+=2)B(b,x,.46,z,.38,.12,.38,c);for(let x=12;x<=22;x++)B(b,x,-.1,0,1,.18,.18,0x344550);B(b,-6,0,0,2,.6,3,0x4c6171);m.group.add(b.mesh('spotted back long tail and duckbill'));return m;}
function snakeEel228(sp){const m=eel224(sp);m.parts.eelSegments.forEach((seg,i)=>{if(i%2===0){const b=new Blocks();for(const side of [-1,1])B(b,0,.15,side*(1.5-i*.06),.75,.65,.16,sp.design.accent);seg.add(b.mesh('irregular dark spots'));}});return m;}
function blueDragon228(sp){const b=new Blocks(),g=new THREE.Group(),blue=col(sp),light=sp.design.accent;
 // Flattened blue underside faces the surface. Six branched appendage groups.
 for(let x=-6;x<=6;x++)for(let y=-1;y<=1;y++){if(Math.abs(y)>Math.max(.2,1.4-Math.abs(x)*.14))continue;B(b,x,y,0,1,1,1.0,blue);B(b,x,y,-.56,1,.8,.15,light);}
 for(const side of [-1,1])for(let arm=0;arm<3;arm++)for(let j=0;j<5-arm;j++){
  const x=-3+arm*3+j*.18,y=side*(1.4+j*.72),z=side*(1+j*.22);B(b,x,y,z,.65,.85,.62,j%2?blue:0x3168a3);
  for(let k=1;k<=2;k++)B(b,x+side*k*.33,y+side*k*.22,z+side*k*.25,.35,.55,.35,k===2?light:0x3b8ec2);
 }
 for(const side of [-1,1]){B(b,-6.3,.4,side*.55,.9,.35,.35,light);B(b,-6.1,.7,side*.55,.25,.25,.25,0x19334b);}
 g.add(b.mesh('blue dragon body and six branched appendages'));return {group:g,parts:{},kind:'other'};
}
function scorpion228(sp){const m=fish({...sp,shape:'puffer'}),b=new Blocks(),c=col(sp);m.group.scale.set(1.1,.75,1);
 for(let x=-3;x<=4;x++)for(let k=0;k<4-(Math.abs(x)%3);k++)B(b,x,4+k,0,.28,.9,.35,k%2?sp.design.accent:c);
 for(const side of [-1,1])for(let j=0;j<4;j++){B(b,-1+j*.8,-2.5-j*.35,side*3,1.1,.4,.6,shade(c,.8));B(b,-1+j*.8,-3.2-j*.35,side*3,.25,1,.25,sp.design.accent);}
 m.group.add(b.mesh('venomous dorsal spines and walking fin rays'));return m;}
function boxJelly228(sp){const g=new THREE.Group(),bell=new THREE.Group(),b=new Blocks(),c=col(sp),accent=sp.design.accent;
 // A lantern-shaped solid, stepped voxel bell; four separate trailing tentacles.
 for(let x=-4;x<=4;x++)for(let z=-3;z<=3;z++)for(let y=0;y<=5;y++){if(y===5&&(Math.abs(x)>3||Math.abs(z)>2))continue;B(b,x,y,z,1,1,1,(Math.abs(x)===4||Math.abs(z)===3)?shade(c,.85):shade(c,1.06));}
 for(const side of [-1,1]){B(b,side*4,1,0,.35,.55,.35,0x6c8b8a);B(b,0,1,side*3,.35,.55,.35,0x6c8b8a);}
 bell.add(b.mesh('square lantern bell'));g.add(bell);const tentacles=[];
 for(const x of [-3.6,3.6])for(const z of [-2.6,2.6]){const t=new THREE.Group(),tb=new Blocks();t.position.set(x*U,0,z*U);for(let j=0;j<14;j++)B(tb,Math.sin(j*.35)*.35,-j,0,.23,1.02,.23,j%3?accent:0xd7c8c5);t.add(tb.mesh('long single tentacle'));g.add(t);tentacles.push(t);}
 return {group:g,parts:{bell,tentacles},kind:'jelly'};
}
function nomura228(sp){const m=curatedJelly({...sp,design:{...sp.design,jellyStyle:'blubber'}}),b=new Blocks();
 // Broad densely branching oral arms under the thick hemispherical bell.
 for(let j=0;j<8;j++){const a=j*Math.PI/4,x=Math.cos(a)*1.6,z=Math.sin(a)*1.5;for(let k=0;k<6;k++){B(b,x,-1-k*.65,z,.65,.75,.65,k%2?0xcbb9a8:sp.design.accent);if(k%2===0)B(b,x+Math.cos(a)*.6,-1-k*.65,z+Math.sin(a)*.6,1,.35,1,0xdac9b8);}}
 m.group.add(b.mesh('branched oral arms'));return m;}

function seaCucumber229(sp){const b=new Blocks(),c=col(sp),a=sp.design.accent;for(let x=-7;x<=7;x++)for(let y=-2;y<=2;y++)for(let z=-2;z<=2;z++)if(x*x/50+y*y/6+z*z/6<=1.1)V(b,x,y,z,(x+y+z+30)%5?c:shade(c,1.2));for(let x=-5;x<=5;x+=2)for(const side of [-1,1]){B(b,x,2,side*1.2,.4,1.0,.4,a);B(b,x,.5,side*2,.4,.6,.4,a);}for(let i=0;i<7;i++){let angle=i*Math.PI*2/7;B(b,-7.5,Math.cos(angle)*.8,Math.sin(angle)*.8,.8,.25,.25,a);}return finish(b,'sea cucumber soft body and feeding tentacles');}
function mantis229(sp){const m=shrimp(sp),b=new Blocks(),c=col(sp);for(const side of [-1,1]){B(b,-3,1.8,side*1.2,.5,1,.5,c);B(b,-3,2.45,side*1.2,.8,.6,.7,INK);for(let j=0;j<4;j++){B(b,-5-j*.45,-1.4-j*.15,side*(2+j*.2),1,.45,.45,c);B(b,-6.4-j*.2,-1.8+j*.24,side*(2.5+j*.1),.35,.6,.25,sp.design.accent);}}m.group.add(b.mesh('stalk eyes and folded raptorial claws'));return m;}
function crab229(sp){const m=crustacean({...sp,design:{...sp.design,pattern:sp.scientific==='Chionoecetes opilio'?'longlegs':'none'}}),b=new Blocks();if(sp.scientific==='Erimacrus isenbeckii')for(let x=-3;x<=3;x+=2)for(let z=-3;z<=3;z+=2)if(x*x/19+z*z/14<1)B(b,x,2,z,.25,.65,.25,sp.design.accent);m.group.add(b.mesh(sp.scientific==='Erimacrus isenbeckii'?'fine shell bristles':'slender crab limbs'));return m;}
function cuttle229(sp){const m=squid(sp),b=new Blocks(),c=col(sp),a=sp.design.accent;for(const side of [-1,1])for(let x=-3;x<=4;x++)B(b,x,-.15,side*2.65,1,.25,.8,sp.scientific==='Sepiella japonica'?0xe2d9c4:shade(c,1.15));for(let x=-2;x<=3;x+=2)for(const side of [-1,1]){if(sp.scientific==='Sepiella japonica')B(b,x,2.1,side*1.2,.4,.18,.4,a);else {B(b,x,2.15,side*1.15,1.2,.18,.85,a);B(b,x,2.25,side*1.15,.5,.15,.3,c);}}m.group.add(b.mesh('cuttlefish lateral fin and species markings'));return m;}
function plant229(sp){const b=new Blocks(),c=col(sp),a=sp.design.accent;
 if(sp.scientific==='Cabomba caroliniana')for(let stem=-1;stem<=1;stem++){const x=stem*2;for(let y=-2;y<=8;y++){B(b,x,y,0,.28,1,.28,c);if(y%2===0)for(const side of [-1,1])for(let j=1;j<=3;j++){B(b,x+side*j*.4,y+j*.3,side*j*.35,.3,.35,.3,a);B(b,x+side*j*.4,y+j*.3,-side*j*.35,.3,.35,.3,c);}}}
 else if(sp.scientific==='Vallisneria spiralis')for(let j=-2;j<=2;j++)for(let y=-2;y<=9;y++)B(b,j*.8+Math.sin(y*.3+j)*.25,y,j%2*.55,.42,1,.20,y%3?c:a);
 else if(sp.scientific==='Undaria pinnatifida'){for(let y=-2;y<=8;y++){B(b,0,y,0,.35,1,.35,c);for(const side of [-1,1])for(let k=1;k<=Math.max(1,4-Math.abs(y-2)*.4);k++)B(b,side*k*.65,y+.1*k,0,.7,.62,.22,(k+y)%3?c:a);}}
 else {for(let x=-4;x<=4;x++)for(let y=-2;y<=5;y++){if(Math.abs(x)>3-(y+2)*.18&&y>1)continue;if((x*7+y*11+50)%13===0&&y>0)continue;B(b,x,y,Math.sin(x*.7)*.4,1,1,.16,(x+y)%4?c:a);}}
 return finish(b,'species-specific aquatic foliage');}

export function createSpeciesModel(sp){
 let m;const sh=sp.shape;
 if(sp.scientific==='Apostichopus japonicus')m=seaCucumber229(sp);
 else if(sp.scientific==='Oratosquilla oratoria')m=mantis229(sp);
 else if(['Chionoecetes opilio','Erimacrus isenbeckii'].includes(sp.scientific))m=crab229(sp);
 else if(['Sepiella japonica','Acanthosepion lycidas'].includes(sp.scientific))m=cuttle229(sp);
 else if(['Cabomba caroliniana','Vallisneria spiralis','Undaria pinnatifida','Ulva australis'].includes(sp.scientific))m=plant229(sp);
 else if(['Carcharias taurus','Alopias vulpinus'].includes(sp.scientific))m=shark228(sp);
 else if(sp.scientific==='Aetobatus ocellatus')m=spottedRay228(sp);
 else if(sp.scientific==='Myrichthys maculosus')m=snakeEel228(sp);
 else if(sp.scientific==='Glaucus atlanticus')m=blueDragon228(sp);
 else if(sp.scientific==='Inimicus japonicus')m=scorpion228(sp);
 else if(sp.scientific==='Carybdea rastonii')m=boxJelly228(sp);
 else if(sp.scientific==='Nemopilema nomurai')m=nomura228(sp);
 else if(['anemone','branchCoral','flowerCoral','seaFan','eelgrass','broadleaf','seagrass','ascidian','mussel'].includes(sh))m=environment(sp);
 else if(sh==='whaleShark')m=whaleShark(sp);
 else if(['pacificDolphin','bottlenose','orca','dugong'].includes(sh))m=mammal(sp);
 else if(['humpback','blueWhale'].includes(sh))m=baleenWhale(sp);
 else if(sh==='nautilus')m=nautilus220(sp);
 else if(sh==='penguin')m=penguin220(sp);
 else if(sh==='smallOtter')m=smallOtter220(sp);
 else if(sh==='seaLion')m=pinniped(sp);
 else if(['seal','otter'].includes(sh))m=pinniped(sp);
 else if(['manta','stingray'].includes(sh))m=ray(sp);
 else if(sp.scientific==='Dermochelys coriacea')m=leatherback(sp);
 else if(['seaTurtle','freshTurtle'].includes(sh))m=turtle(sp);
 else if(sh==='seahorse')m=seahorse(sp);
 else if(sh==='seadragon')m=seadragon(sp);
 else if(sp.scientific==='Anguilla japonica'||sh==='moray')m=eel224(sp);
 else if(sh==='clione')m=clione224(sp);
 else if(sh==='sturgeon')m=sturgeon224(sp);
 else if(sh==='giantSalamander')m=salamander220(sp);
 else if(['axolotl','newt','clawedFrog'].includes(sh))m=amphibian223(sp);
 else if(sh==='isopod')m=isopod220(sp);
 else if(sh==='gardenEel')m=gardenEel220(sp);
 else if(sh==='moonJelly')m=sp.design?.jellyStyle?curatedJelly(sp):jellyReal(sp);
 else if(sh==='shrimp')m=shrimp(sp);
 else if(['lobster','crab','hermit'].includes(sh))m=crustacean(sp);
 else if(sh==='nudibranch')m=nudibranch(sp);
 else if(sh==='starfish')m=starfish(sp);
 else if(sh==='octopus')m=octopus(sp);
 else if(sh==='flatfish')m=flatfish(sp);
 else if(sh==='urchin')m=urchin(sp);
 else if(sh==='squid'||sh==='cuttlefish')m=squid(sp);
 else if(sp.scientific==='Eurypharynx pelecanoides')m=gulperEel(sp);
 else if(['Lophius litulon','Lophius vomerinus','Lophiodes mutilus'].includes(sp.scientific))m=monkfish(sp);
 else if(sh==='angler')m=angler(sp);
 else if(sh==='boxfish')m=boxfish(sp);
 else m=fish({...sp,realShape:sh,shape:FISH_BASE[sh]||sh});
 addRealSilhouette(m,sp);m.group.name=`${sp.number} ${sp.name}`;m.group.userData.speciesId=sp.id;
 return m;
}

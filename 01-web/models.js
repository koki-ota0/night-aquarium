import * as THREE from 'three';

// All creatures are real, individual, editable 3D meshes assembled from little blocks.
// Keeping the blocks instanced makes the nine animated models lightweight in the browser.
const voxelGeometry = new THREE.BoxGeometry(1, 1, 1);
const voxelMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .77, metalness: 0.0 });
const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

class Blocks {
  constructor() { this.blocks = []; }
  box(x,y,z,w,h,d,color) { this.blocks.push({x,y,z,w,h,d,color}); return this; }
  voxel(x,y,z,color,u=0.2) { return this.box(x*u,y*u,z*u,u*1.005,u*1.005,u*1.005,color); }
  mesh(name='blocks') {
    if (!this.blocks.length) return new THREE.Group();
    const mesh = new THREE.InstancedMesh(voxelGeometry, voxelMaterial, this.blocks.length);
    mesh.name = name;
    for (let i=0; i<this.blocks.length; i++) {
      const b=this.blocks[i];
      tempObject.position.set(b.x,b.y,b.z);
      tempObject.rotation.set(0,0,0);
      tempObject.scale.set(b.w,b.h,b.d);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i,tempObject.matrix);
      mesh.setColorAt(i,tempColor.set(b.color));
    }
    mesh.instanceMatrix.needsUpdate=true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate=true;
    mesh.castShadow=true;
    mesh.receiveShadow=true;
    return mesh;
  }
}
const dark=0x262d3c, white=0xfffcf2;

function addEyes(blocks, u, options={}) {
  const x=options.x ?? -3.55, y=options.y ?? .7, z=options.z ?? 2.85;
  const size=options.size ?? 2.6;
  for (const s of [-1,1]) {
    blocks.box(x*u,y*u,s*z*u, size*u,size*u,.52*u, white);
    blocks.box((x-.08)*u,(y-.03)*u,s*(z+.38)*u, size*.72*u,size*.72*u,.42*u, dark);
    blocks.box((x-.42)*u,(y+.39)*u,s*(z+.64)*u, size*.21*u,size*.21*u,.18*u, 0xffffff);
  }
}
function addMouth(blocks, u, color, x=-4.65, y=-1.9, z=2.02) {
  for (const s of [-1,1]) blocks.box(x*u,y*u,s*z*u,1.45*u,.47*u,.24*u,color);
}
function addPectoral(root,u,color,accent=0, x=.9, z=2.7) {
  const fins=[];
  for (const side of [-1,1]) {
    const g=new THREE.Group(); g.name=side===1?'Right fin':'Left fin';
    g.position.set(x*u,-.8*u,side*z*u);
    const b=new Blocks();
    // A gently stepped little fin, like the stacked blocks of the reference.
    for(let xx=0;xx<=2;xx++) for(let yy=-1;yy<=1;yy++) {
      if(xx===2 && yy===1) continue;
      b.box((xx-.55)*u,yy*u,side*.25*u,u*1.01,u*1.01,.8*u,(accent && yy===-1)?accent:color);
    }
    g.add(b.mesh('fin blocks')); root.add(g); fins.push(g);
  }
  return fins;
}

function makeFish(kind) {
  const group=new THREE.Group();
  group.name=kind;
  const u=.21;
  const body=new Blocks(), dorsal=new Blocks(), belly=new Blocks();
  const tall=kind==='angelfish' || kind==='butterfly';
  const rx=tall?5.4:6.2, ry=tall?5.6:4.55, rz=tall?2.7:3.05;
  const maxX=tall?5:6, maxY=tall?5:4;
  const palette = {
    clown: {base:0xff780c, light:0xff9d12, dark:0xed5406, tail:0xf7670a, edge:0x292b3b, fin:0xff8908, mouth:0xe93f31},
    cyan: {base:0x2ac8cf, light:0x6fe2de, dark:0x0aa5bd, tail:0x187dcd, edge:0x168bbd, fin:0x20c0d2, mouth:0xffa126},
    blue: {base:0x1594d5, light:0x28bbe4, dark:0x1470bc, tail:0x155ec3, edge:0x1459b5, fin:0x087fc6, mouth:0xff7e89},
    gold: {base:0xffb321, light:0xffd14d, dark:0xf38b0a, tail:0xf37f00, edge:0xf18d05, fin:0xf99600, mouth:0xf46958},
    angelfish: {base:0x5da6cf, light:0x85d5df, dark:0x2f425e, tail:0x303444, edge:0x3d4253, fin:0xffd216, mouth:0xffffff},
    butterfly: {base:0xffdc15, light:0xffed36, dark:0x2e3038, tail:0xffc90d, edge:0xe99907, fin:0xffd510, mouth:0xeab60d}
  }[kind];
  function colorFor(x,y,z) {
    if (kind==='clown') {
      if (x===-3 || x===0 || x===3 || x===6) return 0x292d3b;
      if (x===-2 || x===-1 || x===4 || x===5) return y>1?0xfffefe:0xe8ebf5;
      return y>=2?palette.light:(y<=-3?palette.dark:palette.base);
    }
    if (kind==='angelfish') {
      if(x<=-3) return 0x303442;
      if(y>=4 || y<=-4) return 0xffd91a;
      // Variegated blue, cream and gold stripes angle gently across the flank.
      const stripe=((x+Math.floor(y/2)+30)%4);
      return [0xf9e765,0x618cb8,0xa5e2de,0x6cbfd5][stripe];
    }
    if (kind==='butterfly') {
      if(x===-1 || x===2) return 0x2d3038;
      if(y>=4 || y<=-4) return 0xffd815;
      return x<0?0xffe83c:((x+y)%3===0?0xf8c00a:0xffd816);
    }
    if (kind==='cyan') {
      if(x<=-3) return y>0?0x69e4df:0x4bd8d7;
      if(y<=-3) return 0x09b4c1;
      if(y>=1 && (x+y+z)%3===0) return 0x45d8df;
      return (x+y)%4===0?0x25bdd0:palette.base;
    }
    if (kind==='blue') {
      if(x<=-3) return 0x28b1df;
      if(y<=-3) return 0x12b2d5;
      if(y>=2) return 0x158fd4;
      return ((x+y)%4===0)?0x1785ce:palette.base;
    }
    if (kind==='gold') {
      if(x<=-3) return 0xffd04a;
      if(y<=-3) return 0xf59e13;
      if(y>=2) return 0xffc02b;
      return (x+y)%5===0?0xfca71d:palette.base;
    }
    return palette.base;
  }
  for(let x=-maxX;x<=maxX;x++) for(let y=-maxY;y<=maxY;y++) for(let z=-2;z<=2;z++) {
    const norm=(x*x)/(rx*rx)+(y*y)/(ry*ry)+(z*z)/(rz*rz);
    if(norm<=1.02) body.voxel(x,y,z,colorFor(x,y,z),u);
  }
  addEyes(body,u,{x:tall?-3.2:-3.6,y:.65,z:tall?2.35:2.82,size:tall?2.45:2.65});
  if (kind==='angelfish') {
    // The pale, projecting muzzle of the dark-faced angelfish.
    body.box(-5.15*u,-.75*u,0,1.9*u,1.12*u,2.6*u,0xf9f7ee);
    body.box(-6.05*u,-.60*u,0,1.05*u,.49*u,2.15*u,0xfffdf5);
    body.box(-6.05*u,-1.19*u,0,1.05*u,.42*u,2.15*u,0xe4e0ed);
  } else if (kind==='butterfly') {
    body.box(-5.35*u,-1.1*u,0,1.65*u,.54*u,1.6*u,0xffe726);
    body.box(-5.25*u,-1.85*u,0,1.5*u,.43*u,1.5*u,0xf1b90f);
  } else addMouth(body,u,palette.mouth);
  group.add(body.mesh('body and eyes'));

  // Dorsal fin, with a dark outline on the clownfish and long tops on the striped fish.
  for(let x=-3;x<=4;x++) {
    let h=[1,2,3,4,4,4,3,2][x+3];
    if(tall) h += (x>=-1 && x<=3)?2:0;
    for(let y=0;y<h;y++) {
      const yy=maxY+y;
      const edge=(kind==='clown' && y===h-1);
      const c=edge?0x292d3b:(kind==='blue'?(x%2?0x105dbb:0x177dd0):(kind==='cyan'?0x1db7c8:(kind==='gold'?0xf99400:palette.fin)));
      dorsal.voxel(x,yy,0,c,u);
      if(tall && y<2) dorsal.voxel(x,yy,-1,c,u);
    }
  }
  group.add(dorsal.mesh('dorsal fin'));
  for(let x=-.5;x<=2.5;x++) for(let y=-1;y<=0;y++) {
    belly.voxel(Math.round(x),-maxY+y,0,kind==='clown'&&y===-1?0x292d3b:palette.tail,u);
  }
  group.add(belly.mesh('lower fin'));
  const tail=new THREE.Group(); tail.name='Tail'; tail.position.x=(maxX-.25)*u;
  const tb=new Blocks();
  for(let x=0;x<=4;x++) {
    const hh=x<2?1:(x===2?2:(x===3?3:4));
    for(let y=-hh;y<=hh;y++) {
      const c=(kind==='clown' && (x===4 || Math.abs(y)===hh))?0x292d3b:
        ((kind==='butterfly' && (y+x)%3===0)?0xee9706:palette.tail);
      tb.box(x*u,y*u,0,u*1.01,u*1.01,u*1.55,c);
    }
  }
  tail.add(tb.mesh('tail blocks')); group.add(tail);
  const fins=addPectoral(group,u,palette.fin,kind==='clown'?0xea5708:palette.dark,tall?.15:.8,tall?2.42:2.9);
  const scale=tall?1.10:1.08;
  group.scale.setScalar(scale);
  return {group,parts:{tail,fins},kind};
}

function makeJelly() {
  const group=new THREE.Group(); group.name='Jellyfish'; const u=.20;
  const cap=new Blocks();
  // A stepped, rounded bell with a soft lilac band beneath the turquoise crown.
  for(let y=0;y<=5;y++) {
    const r=Math.sqrt(Math.max(0,1-(y*y)/(6.1*6.1)));
    for(let x=-6;x<=6;x++) for(let z=-4;z<=4;z++) {
      if((x*x)/(6.4*6.4)+(z*z)/(4.65*4.65)>r*r) continue;
      let c;
      if(y<=1) c=(x+z)%4===0?0x7cbddf:0x6ed8e8;
      else if(y===2 && Math.abs(x)<5 && Math.abs(z)>=2) c=(x+z)%3===0?0xe9a3d5:0xb9addd;
      else if(y>=4) c=(x+z)%4===0?0xa5ebf0:0x7bdeea;
      else c=(x+z)%4===0?0x73d8e7:0x5bcde2;
      cap.voxel(x,y,z,c,u);
    }
  }
  for(let x=-5;x<=5;x++) for(let z=-3;z<=3;z++) {
    if((x*x)/31+(z*z)/12<1.1) cap.voxel(x,-1,z,0x64d8e7,u);
  }
  // Three bright square glints on the crown.
  cap.box(-3.4*u,4.25*u,3.4*u,.9*u,.55*u,.25*u,0xe8ffff);
  cap.box(-1.2*u,4.85*u,2.6*u,.9*u,.55*u,.25*u,0xe8ffff);
  cap.box(3*u,4.1*u,3.15*u,.9*u,.55*u,.25*u,0xe8ffff);
  const bell=new THREE.Group(); bell.name='Bell'; bell.add(cap.mesh('bell blocks')); group.add(bell);
  const tentacles=[];
  const pts=[[-4.2,1.1],[-2.8,-1.5],[-1.4,1.8],[0,-.4],[1.3,1.6],[2.7,-1.5],[4.0,.7]];
  pts.forEach(([x,z],i)=>{
    const t=new THREE.Group(); t.name=`Tentacle ${i+1}`; t.position.set(x*u,-1.3*u,z*u);
    const b=new Blocks(), len=7+(i%3);
    for(let j=0;j<len;j++) {
      const sway=Math.round(Math.sin(j*.8+i)*.65);
      const c=(i===2||i===4)?(j%3===0?0xe2a2d9:0xb7a5df):(j%3===0?0x65c8e4:0x43c4e2);
      b.box(sway*u*.65,-(j+.5)*u,0,u*(i===2||i===4?1.1:.72),u*1.02,u*.8,c);
    }
    t.add(b.mesh('tentacle blocks')); group.add(t); tentacles.push(t);
  });
  return {group,parts:{bell,tentacles},kind:'jelly'};
}

function makeTurtle() {
  const group=new THREE.Group(); group.name='Sea turtle'; const u=.205;
  const shell=new Blocks(), head=new Blocks();
  // Broad, domed green shell and a dark shell rim.
  for(let x=-4;x<=4;x++) for(let z=-4;z<=4;z++) {
    const r=(x*x)/24+(z*z)/22;
    if(r>1.1) continue;
    shell.voxel(x,-1,z,(Math.abs(x)>3||Math.abs(z)>3)?0x384039:0x43513b,u);
    shell.voxel(x,0,z,(Math.abs(x)>3||Math.abs(z)>3)?0x6d8c2d:0x8da83d,u);
    const top= r<.25?3:(r<.65?2:1);
    for(let y=1;y<=top;y++) {
      let c=0x96a93c;
      // Scute outlines form an irregular, tiled carapace rather than a smooth ball.
      if ((x===0 && Math.abs(z)>=1) || (Math.abs(x)===3 && Math.abs(z)<=2) ||
          (Math.abs(z)===2 && Math.abs(x)<=3) || (y===top && ((x+2*z+20)%6===0))) c=0x49503b;
      else if((x-z)%4===0) c=0xa8b746;
      else if(y===1 && r>.7) c=0x778e2f;
      shell.voxel(x,y,z,c,u);
    }
  }
  // A little underbelly and the neck.
  shell.box(-1*u,-1.55*u,0,7*u,1.1*u,5.2*u,0x9acb4b);
  head.box(-5.05*u,-.1*u,0,3.5*u,3.05*u,3.25*u,0x8bd13d);
  head.box(-6.25*u,-.23*u,0,1.5*u,2.5*u,3.05*u,0x9fe448);
  for(const s of [-1,1]) {
    head.box(-5.1*u,.35*u,s*1.85*u,2.0*u,2.0*u,.45*u,white);
    head.box(-5.22*u,.30*u,s*2.17*u,1.45*u,1.48*u,.30*u,dark);
    head.box(-5.52*u,.63*u,s*2.36*u,.42*u,.42*u,.18*u,0xffffff);
    head.box(-6.1*u,-1.0*u,s*1.60*u,1.6*u,.27*u,.18*u,0x2e4a39);
  }
  group.add(shell.mesh('shell')); group.add(head.mesh('head and eyes'));
  const flippers=[];
  for(const s of [-1,1]) for(const rear of [false,true]) {
    const f=new THREE.Group(); f.name=(rear?'Rear':'Front')+' flipper';
    f.position.set((rear?2.6:-2.1)*u,-1.25*u,s*3.15*u);
    const b=new Blocks();
    for(let x=-1;x<=1;x++) for(let z=0;z<=3;z++) {
      if(z===3&&x===-1) continue;
      const c=((x+z+8)%4===0)?0x67ad32:0x92d442;
      b.box((x+(rear?.4:-.3))*u,(-.12*z)*u,s*z*u,u*1.02,.8*u,u*1.02,c);
    }
    f.add(b.mesh('flipper blocks')); group.add(f); flippers.push({group:f,side:s,rear});
  }
  group.scale.setScalar(1.18);
  return {group,parts:{flippers},kind:'turtle'};
}

function makeSeahorse() {
  const group=new THREE.Group(); group.name='Seahorse'; const u=.195;
  const b=new Blocks();
  const rows={
    8:[0,1,2],7:[-1,0,1,2,3],6:[-2,-1,0,1,2,3],5:[-5,-4,-3,-2,-1,0,1,2,3],
    4:[-5,-4,-3,-2,-1,0,1,2,3],3:[0,1,2,3],2:[-1,0,1,2,3],
    1:[-2,-1,0,1,2,3],0:[-2,-1,0,1,2,3],'-1':[-2,-1,0,1,2,3],
    '-2':[-2,-1,0,1,2,3],'-3':[-1,0,1,2,3],'-4':[0,1,2,3],'-5':[1,2,3],'-6':[1,2,3],'-7':[1,2,3]
  };
  for(const [ys,xs] of Object.entries(rows)) {
    const y=Number(ys);
    for(const x of xs) for(let z=-1;z<=1;z++) {
      let c=0xffa80b;
      if(y<=2 && y>=-3 && x<=0) c=(y%2===0)?0xffd76a:0xffc850;
      if(x>=3) c=(y%2===0)?0xf2740c:0xee810b;
      if(y>=4 && x<=-3) c=0xffb414;
      if((x+y+z)%7===0 && y>3) c=0xffb81d;
      b.voxel(x,y,z,c,u);
    }
  }
  // A little square crown and an undulating orange-red spine.
  for(let y=4;y<=8;y++) b.voxel(4,y,0,(y%2?0xe9630b:0xf47a0b),u);
  b.voxel(2,9,0,0xffb41b,u); b.voxel(-1,8,0,0xffc427,u);
  for(let y=-5;y<=3;y++) if(y%2===0) b.voxel(4,y,0,0xee7b0b,u);
  // Curled tail, made as a square spiral so the hole remains visible.
  const tailPath=[[2,-7],[2,-8],[1,-9],[0,-10],[-1,-10],[-2,-10],[-3,-9],[-3,-8],[-3,-7],[-2,-6],[-1,-6],[-1,-7]];
  tailPath.forEach(([x,y],i)=>{for(let z=-1;z<=1;z++){
    b.voxel(x,y,z,i%3===0?0xf47409:0xffa60c,u);
    if(i<6) b.voxel(x,y-1,z,0xf58e09,u);
  }});
  for(const s of [-1,1]) {
    b.box(-.8*u,5.8*u,s*1.58*u,2.0*u,2.05*u,.45*u,white);
    b.box(-.91*u,5.77*u,s*1.90*u,1.50*u,1.55*u,.32*u,dark);
    b.box(-1.24*u,6.12*u,s*2.11*u,.42*u,.42*u,.17*u,0xffffff);
  }
  group.add(b.mesh('body and curled tail'));
  const fin=new THREE.Group(); fin.name='Dorsal fin'; fin.position.set(3.2*u,.0,0);
  const fb=new Blocks();
  for(let x=0;x<=2;x++) for(let y=-2;y<=1;y++) {
    if(x===2 && y===1) continue;
    fb.box(x*u,y*u,0,u*1.01,u*1.01,u*1.2,(y%2===0)?0xf57e08:0xffaf13);
  }
  fin.add(fb.mesh('fin blocks')); group.add(fin);
  // Center the irregular shape around the swim position.
  group.children.forEach(ch=>ch.position.y += .2);
  group.scale.setScalar(.98);
  return {group,parts:{fin},kind:'seahorse'};
}

export const CREATURE_INFO = [
  {id:'angelfish', name:'カラフルな魚', en:'ANGELFISH', description:'青と黄色のしま模様。'},
  {id:'clown', name:'クマノミ', en:'CLOWNFISH', description:'オレンジ色がチャームポイント。'},
  {id:'cyan', name:'みずいろの魚', en:'TURQUOISE FISH', description:'さわやかな水色のからだ。'},
  {id:'blue', name:'あおい魚', en:'BLUE FISH', description:'海のような鮮やかな青色。'},
  {id:'butterfly', name:'しましまの魚', en:'STRIPED FISH', description:'黄色と黒のしま模様。'},
  {id:'gold', name:'きいろい魚', en:'GOLDEN FISH', description:'おひさまみたいな黄色。'},
  {id:'jelly', name:'クラゲ', en:'JELLYFISH', description:'ふわふわ、ゆらゆら。'},
  {id:'turtle', name:'ウミガメ', en:'SEA TURTLE', description:'大きな甲羅でのんびり。'},
  {id:'seahorse', name:'タツノオトシゴ', en:'SEAHORSE', description:'くるんと巻いたしっぽ。'}
];
export function createCreature(id) {
  let model;
  if (['angelfish','clown','cyan','blue','butterfly','gold'].includes(id)) model=makeFish(id);
  else if(id==='jelly') model=makeJelly();
  else if(id==='turtle') model=makeTurtle();
  else model=makeSeahorse();
  model.group.userData.creatureId=id;
  return model;
}
export { Blocks };

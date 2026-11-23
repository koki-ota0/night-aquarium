// Lightweight, editable voxel scenery for six genuinely different displays.
// These are illustrative set pieces, not additional catalog animals or decor.
import * as THREE from 'three';
import {Blocks} from './models.js';

const rnd=i=>{let n=Math.imul(i+1,2654435761);n^=n>>>16;return (n>>>0)/4294967296;};
export function createHabitats(){
 const groups=Object.fromEntries(['current','current-cool','current-large','beach','reef','deep','river','river-lake','estuary','estuary-cool','cold-sea','warm-sea','large-cold-sea','large-warm-sea','lake','estuary-tropical','estuary-north','penguin','sea-lion','otter-room'].map(id=>[id,new THREE.Group()]));
 for(const [id,g] of Object.entries(groups))g.name=`habitat_${id}`;

 // Open water: no sand bed or solid foreground; sparse flecks suggest distance.
 {const b=new Blocks(),c=new Blocks();for(let i=0;i<20;i++){
  const x=(rnd(i)-.5)*11,y=(rnd(i+31)-.3)*7,z=-3.5,size=.035+rnd(i+70)*.035;
  b.box(x,y,z,size,size,size,0x55949d);
  c.box(x,y,z,size,size,size,i%3===0?0x91c2cd:0x739da9);
 }groups.current.add(b.mesh('warm open-water flecks'));groups['current-cool'].add(c.mesh('cool open-water flecks'));}

 // The large-animal tank is deliberately open: faint distant particles
 // and a broad overhead suggestion keep the animals as the visual focus.
 {const b=new Blocks();for(let i=0;i<27;i++){const x=(rnd(i+33)-.5)*12,y=(rnd(i+71)-.4)*8,z=-3.8,q=.025+rnd(i+91)*.035;b.box(x,y,z,q,q,q,i%4?0x72adb2:0xa4c9bf);}
  for(let k=0;k<9;k++)b.box(-4.5+k*1.1,4.42,-3.9,.48,.035,.04,0x6ba7a8);
  groups['current-large'].add(b.mesh('large ocean distant light'));}

 // Shallow sand: ripple bands, pale shells and a few eelgrass blades.
 {const b=new Blocks();
  for(let i=0;i<22;i++){const x=(rnd(i+110)-.5)*12,z=(rnd(i+140)-.5)*5,y=-4.515;b.box(x,y,z,.36+rnd(i+130)*.42,.014,.035,0xa8a685);}
  for(const [x,z] of [[-3.8,-.6],[1.1,.2],[4.2,-1.8]]){b.box(x,-4.48,z,.27,.09,.15,0xe8d6b5);b.box(x+.08,-4.45,z,.09,.08,.12,0xd3b792);}
  for(const base of [-4.45,4.6])for(let blade=0;blade<4;blade++)for(let k=0;k<6;k++){
   const x=base+(blade-1.5)*.13+Math.sin(k*.55+blade)*.045,y=-4.38+k*.16,z=-1.9+blade*.08;
   b.box(x,y,z,.105,.17,.10,k%3===0?0x799e78:0x4f886f);
  }groups.beach.add(b.mesh('sand ripples and sparse seagrass'));
 }

 // A shallow tropical reef with branching, plate and mound silhouettes. All
 // pieces are scenery: no imaginary animal is added to the player's catalogue.
 {const b=new Blocks();
  for(const [side,base] of [[-1,-4.0],[1,4.1]]){
   b.box(base,-4.05,-2.5,2.3,.9,1.0,0x526f69);b.box(base+side*.55,-3.55,-2.55,1.15,.5,.9,0x61776b);
   for(let c=0;c<3;c++){
    const cx=base+(c-1)*.55,by=-3.48+(c%2)*.23,h=6+(c+1)%3*3,color=[0xd88f83,0xc4a175,0x8fb8a2][c];
    for(let k=0;k<h;k++){const u=.14;b.box(cx,by+k*u,-2.45,u,u,.17,color);if(k>2&&k%3===0)for(const d of [-1,1]){b.box(cx+d*u,by+k*u,-2.45,u,u,.17,color);b.box(cx+d*2*u,by+(k+1)*u,-2.45,u,u,.17,color);}}
   }
   for(let m=0;m<4;m++){const x=base+(m-1.5)*.36;b.box(x,-4.25,-1.75,.3,.28,.32,m%2?0xb1ad86:0xe2aa87);}
  }
  for(let i=0;i<20;i++){const x=(rnd(i+190)-.5)*9,z=-2.4+rnd(i+220);b.box(x,-4.48,z,.08,.09,.09,i%2?0xd8b391:0xb7c0a0);}
  groups.reef.add(b.mesh('branch and mound reef'));
 }

 // No illuminated surface or photosynthetic seagrass at depth; the tiny
 // pale squares are suspended marine snow, not a claim all deep life glows.
 {const b=new Blocks();
  for(const [base,side] of [[-4.3,-1],[4.2,1]]){
   b.box(base,-4.05,-2.5,2.2,.85,1.0,0x293747);b.box(base+side*.4,-3.45,-2.7,1.2,.55,.8,0x354455);b.box(base+side*.65,-3.02,-2.8,.65,.35,.7,0x405063);
  }
  for(let i=0;i<36;i++){const x=(rnd(i+260)-.5)*10,y=(rnd(i+300)-.48)*8,z=-3.3,s=.035+rnd(i+330)*.04;b.box(x,y,z,s,s,s,i%5===0?0x86bdc2:0x708b9d);}
  groups.deep.add(b.mesh('dark rock and marine snow'));
 }

 // River/lake: rounded-stone suggestion, driftwood and leafy plants.
 {const b=new Blocks();
  for(let i=0;i<13;i++){const x=(rnd(i+360)-.5)*11,z=-1.4-rnd(i+390)*1.8,w=.28+rnd(i+420)*.38;b.box(x,-4.4,z,w,.25,.44,i%3===0?0x7c8e79:0x687c72);}
  for(let k=0;k<8;k++){const x=-4.4+k*.22;b.box(x,-4.2+k*.10,-2.65,.28,.25,.36,k%2?0x795c43:0x876c4d);}
  for(const base of [-3.9,3.85])for(let stalk=0;stalk<3;stalk++){
   const x=base+(stalk-1)*.24,h=7+(stalk%2)*3;
   for(let k=0;k<h;k++){const y=-4.35+k*.15;b.box(x,y,-2.1,.085,.16,.08,0x4c826e);if(k>2&&k%3===0){const d=stalk%2?1:-1;b.box(x+d*.14,y,-2.1,.25,.12,.08,0x79a685);}}
  }groups.river.add(b.mesh('river stones driftwood and water plants'));
 }

 // Lake/pond: quieter water, flat stones, round pads and upright reeds,
 // distinct geometry from the running river and its driftwood.
 {const b=new Blocks();
  for(let i=0;i<14;i++){const x=(rnd(i+600)-.5)*11,z=-1.4-rnd(i+630)*1.8,w=.25+rnd(i+660)*.42;b.box(x,-4.4,z,w,.16,.38,i%3?0x778c7b:0x9baa8b);}
  for(const base of [-4.25,4.20])for(let stalk=0;stalk<6;stalk++){
   const x=base+(stalk-2.5)*.12,h=6+stalk%3;for(let k=0;k<h;k++)b.box(x,-4.35+k*.17,-2.5,.07,.18,.08,k%3?0x71977c:0x9ab28a);
  }
  for(const [x,z] of [[-3,-2.9],[2.8,-2.8],[4.5,-3.0]]){b.box(x,3.62,z,.8,.10,.60,0x78a77d);b.box(x+.14,3.70,z,.32,.12,.34,0xa4c499);}
  groups['river-lake'].add(b.mesh('lake stones reeds and floating pads'));
 }

 // Estuary: visible stilt roots from a mangrove-like bank, mud and sparse
 // pneumatophore-like roots. It is a separate brackish tank from the river.
 {const b=new Blocks();
  for(const [base,side] of [[-4.2,-1],[4.1,1]]){
   b.box(base,2.6,-2.9,.52,4.8,.55,0x6c5947);b.box(base+side*.1,.2,-2.9,.72,1.2,.65,0x765d48);
   for(let root=0;root<3;root++)for(let k=0;k<17;k++){
    const y=.0-k*.27,spread=root-1,x=base+spread*(k*.055)+side*k*.018;
    b.box(x,y,-2.85+root*.2,.22,.31,.22,(k+root)%4===0?0x8c7658:0x715d49);
   }
   for(let tip=0;tip<5;tip++){const x=base+(tip-2)*.38;b.box(x,-4.25,-1.9,.12,.5,.12,0x806b4f);}
  }
  for(let i=0;i<17;i++){const x=(rnd(i+450)-.5)*10,z=-1.6-rnd(i+480)*1.6;b.box(x,-4.47,z,.22+rnd(i+500)*.3,.1,.16,0x8d8365);}
  groups.estuary.add(b.mesh('mangrove roots and mud'));
 }
 // Northern temperate estuary: no tropical mangroves; stony/silty bottom,
 // driftwood and reeds. Kept physically separate from the tropical tank.
 {const b=new Blocks();
  for(let i=0;i<18;i++){const x=(rnd(i+520)-.5)*11,z=-1.5-rnd(i+550)*1.6,w=.20+rnd(i+580)*.40;b.box(x,-4.42,z,w,.18,.34,i%2?0x879795:0x697d7e);}
  for(const base of [-4.4,4.3])for(let stalk=0;stalk<5;stalk++){
   const x=base+(stalk-2)*.12,h=5+(stalk%3);for(let k=0;k<h;k++){b.box(x+Math.sin(k*.4+stalk)*.03,-4.37+k*.18,-2.5,.08,.19,.08,k%3?0x7f9688:0xa5ae92);}
  }
  for(let k=0;k<8;k++)b.box(3.0+k*.22,-4.28+k*.07,-2.7,.28,.18,.30,k%2?0x7d7561:0x918974);
  groups['estuary-cool'].add(b.mesh('cool estuary stones reeds and driftwood'));
 }
 // --- 2.15 distinctive open-water and still-water scenery ---
 // Cold sea: kelp towers, without ungrounded decorative marks.
 {const b=new Blocks();
  for(const base of [-5.2,5.2])for(let stalk=0;stalk<5;stalk++){const x=base+(stalk-2)*.22;for(let k=0;k<9;k++)b.box(x+Math.sin(k*.5+stalk)*.06,-4.4+k*.32,-2.2-(stalk%2)*.3,.14,.34,.12,k%3?0x2e5d4a:0x477a58);}
  groups['cold-sea'].add(b.mesh('cold sea kelp'));}
 // Warm sea: low seagrass fans and warm-tinted low rocks.
 {const b=new Blocks();
  for(const base of [-3.6,0.4,3.8])for(let blade=0;blade<5;blade++)for(let k=0;k<4;k++)b.box(base+(blade-2)*.13+Math.sin(k+blade)*.04,-4.4+k*.17,-1.6+blade*.07,.1,.18,.09,k%2?0x69b96f:0x8fce7d);
  for(const [x,z,c] of [[-2.2,-2.4,0xe39a6b],[2.6,-2.5,0xefa97e],[4.4,-1.2,0xdd8a5f]])for(let k=0;k<4;k++)b.box(x+(k%2)*.2,-4.45+Math.floor(k/2)*.18,z,.22,.18,.2,c);
  groups['warm-sea'].add(b.mesh('warm sea seagrass and warm rocks'));}
 // The wide cold sea keeps an open swimming stage.
 {const b=new Blocks();
  groups['large-cold-sea'].add(b.mesh('large cold sea icebergs'));}
 // The wide warm sea keeps an open swimming stage.
 {const b=new Blocks();
  // The sky glow is provided by the water background, not floating bars.


  groups['large-warm-sea'].add(b.mesh('large warm sea light bands'));}
 // Distant scenery is kept at the edges of the wide large-ocean stage.
 // Cold sea: dark rocks and kelp far below.
 {const b=new Blocks();for(const side of [-1,1]){const base=side*8.1;for(let j=0;j<9;j++)b.box(base+side*j*.10,-6.8-j*.60,-4.8,2.6+j*.22,.62,.6,j%2?0x274a5e:0x2b4f61);for(let k=0;k<5;k++){b.box(base-side*k*.58,-6.4+k*.13,-4.6,1.45-k*.12,.75-k*.08,.6,k%2?0x34576c:0x476978);}for(let k=0;k<7;k++)b.box(base-side*.7+Math.sin(k*.4)*.12,-6.2+k*.32,-4.2,.13,.35,.16,k%2?0x487c70:0x6e9a86);}groups['large-cold-sea'].add(b.mesh('large cold sea distant rocks and kelp'));}
 // Warm ocean: distant underwater slopes.
 {const b=new Blocks();for(const side of [-1,1]){const base=side*8;for(let j=0;j<9;j++)b.box(base+side*j*.10,-6.8-j*.60,-4.9,2.6+j*.22,.62,.6,j%2?0x386962:0x3c6f65);for(let k=0;k<6;k++){b.box(base-side*k*.65,-6.55+k*.18,-4.7,1.4-k*.12,.8-k*.07,.65,k%2?0x577d78:0x6d9385);}for(let k=0;k<6;k++)b.box(base-side*.5+Math.sin(k*.6)*.18,-6.15+k*.28,-4.3,.14,.3,.15,k%2?0x77a88b:0x9fc499);}groups['large-warm-sea'].add(b.mesh('large warm sea distant slopes'));}
 // Lake: still water with lily pads, pink lotus points and bank reeds.
 {const b=new Blocks();
  for(const [x,z] of [[-3.4,.4],[-1.2,-.8],[1.6,.2],[3.9,-.6],[.2,1.2],[-4.4,-1.4]])for(let k=0;k<5;k++)b.box(x+Math.cos(k*1.26)*.28,3.62+((k*7)%3)*.02,z+Math.sin(k*1.26)*.2,.3,.035,.24,k?0x5d9463:0x6fae72);
  for(const [x,z] of [[-1.2,-.8],[3.9,-.6]]){b.box(x,3.74,z,.16,.12,.16,0xf2a7bb);b.box(x+.12,3.70,z+.06,.1,.08,.1,0xf7c3d0);}
  for(const base of [-5.3,5.3])for(let stalk=0;stalk<6;stalk++)for(let k=0;k<6;k++)b.box(base+(stalk-3)*.1,-4.4+k*.3,-2.4,.07,.32,.07,k%3?0x86a860:0xa9bd7d);
  groups.lake.add(b.mesh('lake lily pads lotus and reeds'));}
 // Tropical mangrove: denser arching roots plus roots dropping from above.
 {const b=new Blocks();
  for(const base of [-4.8,4.8])for(let rootI=0;rootI<6;rootI++){const x=base+(rootI-3)*.28;for(let k=0;k<5;k++)b.box(x+Math.sin(k*.6+rootI)*.08,3.9-k*.34,-2.3,.09,.36,.09,rootI%2?0x7a6248:0x96835e);}
  groups['estuary-tropical'].add(b.mesh('mangrove hanging roots'));}
 // Cold estuary: pale reeds, grey stones and a half-buried driftwood log.
 {const b=new Blocks();
  for(let k=0;k<7;k++)b.box(-2.8+k*.34,-4.32+k*.05,-1.1,.4,.09,.3,0xb9beb4);
  for(const base of [-5.2,-4.9,5.1])for(let stalk=0;stalk<4;stalk++)for(let k=0;k<5;k++)b.box(base+(stalk-2)*.09,-4.4+k*.28,-2.5,.06,.3,.06,0xaebfa4);
  groups['estuary-north'].add(b.mesh('cold estuary pale stones and reeds'));}
 // Three semi-aquatic displays share water-level and bank geometry, but not scenery.
 // The left bank aligns with the actual haul-out path in aquarium-scene.js.
 function bank(id,base,light){const b=new Blocks();
  for(let x=-6;x<=-2.05;x+=.30)for(let y=1;y<=2;y+=.30)for(let z=-3;z<=-.5;z+=.50){const speck=(Math.round(x*10)*7+Math.round(y*10)*11+Math.round(z*2)*3)%17===0;b.box(x,y,z,.31,.31,.52,speck?light:base);}
  groups[id].add(b.mesh('bank and waterline'));}
 // Magellanic penguins: a temperate Patagonian coast, not an icy Antarctic set.
 bank('penguin',0xa69c86,0xc8bca1);
 {const b=new Blocks();
  // Rear bank with a dark low burrow entrance and a sandy nest lip.
  for(let x=-5.6;x<=-4.1;x+=.25)for(let y=2.2;y<=3.1;y+=.25){const hole=((x+4.87)/.43)**2+((y-2.44)/.34)**2<1;b.box(x,y,-2.65,.26,.26,.30,hole?0x4c514b:(Math.round(x*4+y*4)%3?0xb5aa91:0x8c8b7c));}
  for(let i=0;i<14;i++){const x=-5.6+i*.26;b.box(x,2.17,-.9,.18,.07,.14,i%3?0xd8c5a7:0xb3ad96);}
  // Pale stepping stones: an unobstructed route between shore and water.
  for(let i=0;i<6;i++)b.box(-2.1+i*.22,2.05-i*.16,-1.1,.30,.18,.50,i%2?0xafa99a:0xc6bdab);
  for(let i=0;i<10;i++)b.box(-4.8+i*.85,-4.45,-2.3,.18,.08,.14,i%2?0xa9b2a9:0xddd1b6);
  // Short coastal grasses frame the nest without implying polar ice.
  for(const x of [-5.7,-4.0,-2.2])for(let k=0;k<3;k++)b.box(x+(k-1)*.12,2.35+k*.12,-2.9,.08,.26,.08,k%2?0xa0a486:0xc0be9e);
  groups.penguin.add(b.mesh('penguin nest burrow and coastal approach'));}
 // California sea lions: broad coastal rocks, a floating haul-out dock, and kelp.
 bank('sea-lion',0x84867d,0xb1aba0);
 {const b=new Blocks();
  for(const [bx,w,h] of [[-5.2,1.3,.65],[-3.1,1.0,.42]])for(let x=-w;x<=w;x+=.35)for(let y=0;y<=h;y+=.30)if(Math.abs(x)<w-y*.3)b.box(bx+x,2.22+y,-2.5,.37,.31,.5,(Math.round(x*10+y*10)%4)?0x777d78:0x9da79c);
  // A timber float references the docks sea lions commonly use as resting sites.
  for(let x=2.0;x<5.5;x+=.35)b.box(x,1.28,-2.5,.34,.20,.8,(Math.round(x*10)%3)?0x8b7052:0xa38663);
  for(const x of [2.3,4.9])b.box(x,.88,-2.5,.25,.65,.28,0x6e6655);
  for(const base of [4.1,5.0])for(let k=0;k<10;k++){const xx=base+Math.sin(k*.6)*.12;b.box(xx,-4.35+k*.31,-2.9,.13,.34,.13,k%3?0x4b806d:0x79a98b);if(k>2&&k%2===0){b.box(xx-.25,-4.35+k*.31,-2.9,.48,.16,.14,0x5e957a);b.box(xx+.25,-4.35+k*.31+.1,-2.9,.48,.16,.14,0x78a984);}}
  groups['sea-lion'].add(b.mesh('sea lion rocky haulout dock and kelp'));}
 // Small-clawed otter: sheltered freshwater bank with roots, pebbles and den.
 bank('otter-room',0x777e60,0xa1a887);
 {const b=new Blocks();
  for(let x=-5.6;x<=-4.3;x+=.23)for(let y=2.2;y<=3.0;y+=.23){const hole=((x+4.9)/.38)**2+((y-2.42)/.32)**2<1;b.box(x,y,-2.68,.24,.24,.25,hole?0x3d4b3e:0x7d886c);}
  for(const base of [-5.5,-2.6,4.9])for(let stalk=0;stalk<4;stalk++)for(let k=0;k<7;k++){let xx=base+(stalk-1.5)*.13+Math.sin(k*.5+stalk)*.08;b.box(xx,-4.38+k*.26,-2.6,.09,.28,.10,k%3?0x588565:0x8dad78);}
  // Exposed roots descend to the shallow water, with smooth stones on the bed.
  for(let k=0;k<8;k++){b.box(4.2+Math.sin(k*.4)*.2,3.7-k*.27,-2.8,.22,.30,.22,0x77674c);if(k>3)b.box(4.2+(k-3)*.15,3.7-k*.27,-2.8,.30,.12,.18,0x927e5c);}
  for(const [x,z] of [[-3.5,-1.1],[-1.5,-2],[.5,-1.8],[2.7,-1.5],[4,-2.3]]){b.box(x,-4.42,z,.42,.16,.35,0xa1a797);b.box(x+.1,-4.34,z,.20,.08,.22,0xc1c3aa);}
  for(let i=0;i<5;i++)b.box(-2.0+i*.2,2.07-i*.16,-1.2,.30,.18,.48,0x9d987c);
  for(const x of [-5.5,-2.6,4.9])for(let k=1;k<5;k+=2){b.box(x-.22,-4.38+k*.26,-2.55,.40,.10,.12,0x77a278);b.box(x+.22,-4.22+k*.26,-2.55,.40,.10,.12,0x8cb68a);}
  // Shallow roots and low boulders line the freshwater bottom.
  for(let k=0;k<6;k++)b.box(3.7+k*.18,-4.25+k*.14,-2.7,.28,.15,.22,0x83765d);
  groups['otter-room'].add(b.mesh('otter den roots reeds and river stones'));}
 // 2.24: grounded shores, recognisable above/below-water exhibits.
 // Keep the centre open for animals and retain the actual left-hand landing path.
 {const b=new Blocks();
  // Submerged, stepped rock face connects the sandy nesting bank to the floor.
  for(let y=-4.2;y<1.05;y+=.34){let edge=-4.85+(y+4.2)*.32;for(let x=-6;x<edge;x+=.34)b.box(x,y,-2.9,.35,.35,.42,((Math.round(x*9+y*7)%5)===0)?0x8b9384:0x697e78);}
  for(const [x,y,w,h] of [[-5.6,-3.95,1.3,.45],[-4.6,-4.15,1.0,.35],[4.9,-4.10,1.4,.5],[4.3,-4.32,.9,.26]]){b.box(x,y,-2.25,w,h,.7,0x899b8e);b.box(x,y+h*.48,-2.25,w*.72,.15,.7,0xb6b7a3);}
  // A second protected burrow, coastal scrub and pale stone borders.
  for(let x=-3.9;x<-2.8;x+=.20)for(let y=2.15;y<2.9;y+=.20){const hole=((x+3.35)/.30)**2+((y-2.4)/.27)**2<1;b.box(x,y,-3.05,.22,.22,.22,hole?0x414c48:0xb2a48a);}
  for(const base of [-5.5,-3.7,-2.6])for(let stalk=0;stalk<5;stalk++)for(let k=0;k<3+stalk%2;k++)b.box(base+stalk*.12,2.2+k*.13,-2.9,.07,.14,.08,stalk%2?0x8d9b78:0xb2b59a);
  for(let i=0;i<9;i++)b.box(-4.8+i*.65,-4.43,-1.8,.23,.1,.20,i%2?0xc6bba4:0x9faba0);
  groups.penguin.add(b.mesh('grounded penguin nesting shore'));}
 {const b=new Blocks();
  // Staggered heavy rock ledges run below water and form haul-out slopes.
  for(let y=-4.2;y<1.1;y+=.38){let edge=-5.0+(y+4.2)*.33;for(let x=-6;x<edge;x+=.38)b.box(x,y,-2.95,.39,.39,.50,(Math.round(x*7+y*8)%3)?0x647874:0x87968b);}
  for(const [x,y,w,h] of [[-4.8,-4.05,1.8,.65],[-3.9,-4.3,1.0,.3],[4.8,-4.08,1.4,.60],[3.9,-4.32,1.1,.28]]){b.box(x,y,-2.3,w,h,.8,0x687e79);b.box(x-.15,y+h*.5,-2.3,w*.63,.18,.7,0x9ba79a);}
  // Dock plank seams and mooring pilings, placed away from the main swimming volume.
  for(let x=2.15;x<5.5;x+=.55)b.box(x,1.4,-2.46,.07,.06,.85,0xc0a27c);
  for(const x of [2.1,5.25]){b.box(x,1.6,-2.75,.18,1.05,.22,0x776853);b.box(x,2.13,-2.75,.27,.14,.29,0xb29b76);}
  groups['sea-lion'].add(b.mesh('sea lion submerged rock wall and dock'));}
 {const b=new Blocks();
  // Earthen riverbank extends below the surface, with root lattice and a sheltered den.
  for(let y=-4.2;y<1.05;y+=.34){let edge=-5.05+(y+4.2)*.35;for(let x=-6;x<edge;x+=.34)b.box(x,y,-3,.35,.35,.46,(Math.round(x*7+y*9)%4)?0x677e68:0x8d9876);}
  for(let k=0;k<11;k++){const y=2.15-k*.30;b.box(-4.0+k*.10,y,-2.7,.22,.33,.22,0x816a4d);if(k>2)b.box(-4.0+k*.13+.22,y,-2.7,.40,.12,.18,0xa08863);}
  // Low stream stones and a fallen trunk, with no obstruction in the central swim lane.
  for(const [x,w] of [[-4.8,.9],[-3.9,.6],[3.6,.7],[4.5,1.0]]){b.box(x,-4.31,-2.0,w,.34,.55,0x98a48a);b.box(x,-4.1,-2.0,w*.65,.12,.4,0xc0c4aa);}
  for(let k=0;k<8;k++)b.box(3.0+k*.25,2.18+k*.05,-2.8,.29,.20,.28,k%2?0x876e4f:0xa58b66);
  for(let k=0;k<6;k++)b.box(3.8,2.25+k*.22,-2.85,.09,.25,.1,0x678f6c);
  groups['otter-room'].add(b.mesh('otter river bank roots and shallow stream'));}
 // 2.27: perimeter extensions occupy the part revealed at maximum zoom-out.
 // Features are habitat-specific, grounded, and deliberately leave the swimming centre clear.
 function perimeter(id,draw){const b=new Blocks();for(const side of [-1,1])draw(b,side);groups[id].add(b.mesh('extended habitat perimeter '+id));}
 const stones=(b,side,colors,y=-4.38)=>{for(let i=0;i<5;i++){const x=side*(5.75+i*.54),z=-2.15-(i%2)*.35,w=.36+(i%3)*.12;b.box(x,y,z,w,.20+(i%2)*.08,.38,colors[i%colors.length]);}};
 const blades=(b,side,col1,col2,y=-4.3)=>{for(let j=0;j<5;j++){const x=side*(6.1+j*.24);for(let k=0;k<5+j%3;k++)b.box(x+Math.sin(k*.55+j)*.045,y+k*.22,-2.7,.09,.24,.10,k%2?col1:col2);}};
 perimeter('beach',(b,s)=>{stones(b,s,[0xc8b99d,0xe2d3b8]);blades(b,s,0x6e9e7d,0x8bb291);});
 perimeter('reef',(b,s)=>{stones(b,s,[0x6a8275,0x8b9780]);for(let j=0;j<3;j++){const x=s*(5.85+j*.56);for(let k=0;k<6+j*2;k++){b.box(x,-4.3+k*.16,-2.5,.15,.17,.19,j%2?0xc6a880:0xd9998d);if(k>2&&k%3===0)b.box(x+s*.18,-4.3+k*.16,-2.5,.35,.14,.18,0xc9a398);}}});
 perimeter('deep',(b,s)=>{for(let i=0;i<4;i++){const x=s*(5.9+i*.62),h=.5+i*.16;b.box(x,-4.5+h*.5,-2.9,.75,h,.62,i%2?0x263847:0x34495a);}});
 perimeter('river',(b,s)=>{stones(b,s,[0x687f70,0x95a288]);blades(b,s,0x57866a,0x84a988);});
 perimeter('lake',(b,s)=>{stones(b,s,[0x869c80,0xa3b499]);blades(b,s,0x769970,0x9fba88);});
 perimeter('estuary-tropical',(b,s)=>{stones(b,s,[0x867b60,0xa49a76]);for(let j=0;j<3;j++)for(let k=0;k<15;k++){const x=s*(6.1+j*.45+k*.035);b.box(x,-4.3+k*.30,-2.8,.20,.31,.22,j%2?0x6e5942:0x8b7557);}});
 perimeter('estuary-north',(b,s)=>{stones(b,s,[0x8a9992,0xaeb8aa]);blades(b,s,0x829a8c,0xaabca5);});
 perimeter('cold-sea',(b,s)=>{stones(b,s,[0x3f5c64,0x607a79]);blades(b,s,0x386b56,0x578972);});
 perimeter('warm-sea',(b,s)=>{stones(b,s,[0xa7ad8a,0xc1b38f]);blades(b,s,0x67a17d,0x8bb78a);});
 // Shores remain contiguous offscreen on the left; the opposite edge gets low bank-side details.
 for(const [id,rock,edge,plant] of [['penguin',0x89988e,0xb2a78d,0x8c9a7c],['sea-lion',0x6a807a,0x948f7e,0x5c8b76],['otter-room',0x71846b,0x889579,0x6d9b79]])perimeter(id,(b,s)=>{
  if(s<0){for(let x=-8.1;x<-5.9;x+=.36){for(let y=1.05;y<=2.0;y+=.34)b.box(x,y,-2.8,.37,.35,.45,edge);for(let y=-4.3;y<1;y+=.42)b.box(x,y,-3.0,.37,.43,.42,rock);}}
  stones(b,s,[rock,edge]);if(id==='otter-room'||id==='sea-lion')blades(b,s,plant,edge);else if(s>0)for(let i=0;i<3;i++)b.box(6+i*.4,-4.38,-2.4,.25,.13,.20,0xcac1a7);
 });
 // Wide open-ocean rooms are shown at 0.4x: extend distant slopes from x≈8 to the visible edges x≈13.
 for(const [id,rock,light,kelp] of [['large-cold-sea',0x294d60,0x33586a,0x568270],['large-warm-sea',0x3a6c62,0x47776b,0x8ab194]])perimeter(id,(b,s)=>{
  for(let j=0;j<10;j++){const y=-6.2-j*.58;for(let k=0;k<5;k++){const x=s*(9.2+k*.82+j*.08);b.box(x,y,-4.9,.88,.60,.65,(j*17+k*11)%11===3?light:rock);}}
  for(const base of [10.0,11.7,13.1])for(let k=0;k<7;k++)b.box(s*base+Math.sin(k*.45)*.10,-6.35+k*.28,-4.4,.13,.3,.14,k%2?kelp:light);
 });
 // Independent layouts: penguin shore left, sea-lion haul-out toward centre, otter bank right.
 groups['sea-lion'].scale.x=.85;groups['sea-lion'].position.x=1.9;
 groups['otter-room'].scale.x=-1;
 const ALIASES={};
 for(const [alias,target] of Object.entries(ALIASES))groups[alias]=groups[target];
 groups['estuary-tropical'].add(groups.estuary.children[0].clone());groups['estuary-north'].add(groups['estuary-cool'].children[0].clone());
 for(const g of Object.values(groups))g.visible=false;
 return groups;
}
export const HABITAT_FLOORS={
 current:null,'current-cool':null,'current-large':null,beach:0xcfc19d,reef:0xb9ac91,deep:0x26313f,river:0x788a76,'river-lake':0x859681,estuary:0x8c8266,'estuary-cool':0x788783,
 'cold-sea':0x39566b,'warm-sea':0xb9b392,'large-cold-sea':null,'large-warm-sea':null,lake:0x859681,'estuary-tropical':0x8c8266,'estuary-north':0x788783,penguin:0x819593,'sea-lion':0x817e71,'otter-room':0x718a70
};

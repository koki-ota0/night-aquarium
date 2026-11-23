import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import source from '../catalog-data.json' with {type:'json'};
import {CATALOG,BY_ID,EVOLUTIONS,POOLS,DESTINATIONS,LEGACY_ID_MAP,idFor,poolWeight,conditionText} from '../catalog.js';
import * as E from '../engine.js';
import {createSpeciesModel} from '../species-models.js';
import {FOODS,FOOD_BY_ID,careProfile,canEat} from '../care-profiles.js';
import {visualLength} from '../size-classes.js';
const t=new Date(2026,9,27,12).getTime(),rng=()=>.25;

test('formal catalog: exact 100 names, numbers, rarity, types, parents and raw conditions',()=>{
 assert.equal(CATALOG.length,100);assert.equal(new Set(CATALOG.map(x=>x.id)).size,100);
 assert.deepEqual(CATALOG.map(x=>x.number),Array.from({length:100},(_,i)=>i+1));
 for(const row of source){const sp=CATALOG[row.number-1];assert.equal(sp.name,row.name);assert.equal(sp.rarityOriginal,row.rarity);assert.equal(sp.kind,row.kind);assert.equal(sp.biome,row.biome);if(row.parent){assert.equal(sp.parentId,idFor(row.parent));assert.equal(sp.condition.raw,row.condition);}}
 assert.equal(CATALOG.filter(x=>x.kind==='environment').length,10);assert.equal(CATALOG.filter(x=>x.kind==='basic').length,34);assert.equal(EVOLUTIONS.length,56);
 assert.deepEqual(Object.fromEntries(['common','rare','epic','legendary','mythic'].map(k=>[k,CATALOG.filter(s=>s.rarity===k).length])),{common:20,rare:29,epic:27,legendary:18,mythic:6});
});
test('source Markdown matches every official name, rarity and evolution condition',()=>{
 const md=fs.readFileSync(new URL('../docs/fish-catalog-100.md',import.meta.url),'utf8');
 const rows=md.split(/\r?\n/).filter(line=>/^\|\s*\d+\s*\|/.test(line)).map(line=>line.split('|').slice(1,-1).map(x=>x.trim()));
 assert.equal(rows.length,100);for(const cells of rows){const n=Number(cells[0]),sp=CATALOG[n-1];assert.equal(sp.number,n);assert.equal(sp.name,cells[1]);assert.equal(sp.rarityOriginal,cells[2]);if(sp.kind==='environment')assert.equal(sp.tag,cells[4]);if(sp.kind==='evolution'){assert.equal(sp.parent,Number(cells[3].split(' ')[0]));assert.equal(sp.condition.raw,cells[4]);}}
});
test('all 44 non-evolution entries have a reachable pool and meaningful nonzero weights',()=>{
 const ids=new Set(Object.values(POOLS).flat());assert.equal(ids.size,44);assert.deepEqual([...ids].sort(),CATALOG.filter(s=>s.kind!=='evolution').map(s=>s.id).sort());
 for(const d of DESTINATIONS){assert.ok(POOLS[d.id].length);for(const id of POOLS[d.id])assert.ok(poolWeight(BY_ID[id])>0);assert.equal(E.weightedPick(POOLS[d.id],()=>0),POOLS[d.id][0]);assert.equal(E.weightedPick(POOLS[d.id],()=>.999999),POOLS[d.id].at(-1));}
});
test('all 100 models can be constructed; major animal silhouettes are separate families',()=>{
 for(const sp of CATALOG){const m=createSpeciesModel(sp);assert.ok(m.group.children.length,sp.name);assert.equal(m.group.userData.speciesId,sp.id);}
 assert.notEqual(BY_ID.sp_057.shape,BY_ID.sp_058.shape);assert.notEqual(BY_ID.sp_075.shape,BY_ID.sp_088.shape);assert.notEqual(BY_ID.sp_054.shape,BY_ID.sp_078.shape);assert.notEqual(BY_ID.sp_031.shape,BY_ID.sp_091.shape);
});
test('all 100 official model thumbnails are present and individually rendered',()=>{
 const thumbs=JSON.parse(fs.readFileSync(new URL('../model-thumbs.json',import.meta.url),'utf8'));
 const images=CATALOG.map(sp=>thumbs[sp.id]);assert.equal(images.length,100);for(const img of images)assert.match(img,/^data:image\/webp;base64,/);assert.equal(new Set(images).size,100);
});
test('first exploration always finds the official clownfish and completes while offline',()=>{
 const s=E.createInitial(t);assert.equal(E.startExplore(s,'coast',t).ok,true);assert.equal(s.exploration.stock,2);assert.equal(E.refresh(s,t+29999,rng).result,null);const result=E.refresh(s,t+30000,rng).result;assert.equal(result.id,'sp_030');assert.equal(result.type,'fish');assert.equal(s.fish_instances.length,1);assert.equal(E.refresh(s,t+30001,rng).result,null);
});
test('stock caps, feeding and petting reset daily; animals can repeat until the limit',()=>{
 const s=E.createInitial(t);E.discover(s,'sp_030','test',t,rng);assert.equal(E.discover(s,'sp_030','test',t,rng).type,'fish');for(let i=0;i<4;i++)E.discover(s,'sp_030','test',t,rng);assert.equal(E.discover(s,'sp_030','test',t,rng).type,'duplicate');assert.equal(s.materials,1);assert.ok(E.feed(s,t).ok);assert.ok(E.feed(s,t).ok);assert.equal(E.feed(s,t).reason,'limit');const f=s.fish_instances[0];for(let i=0;i<10;i++)assert.ok(E.pet(s,f.uid,t).ok);assert.equal(E.pet(s,f.uid,t).reason,'limit');assert.ok(E.feed(s,t+86400000).ok);assert.equal(s.daily.pet_count,0);E.startExplore(s,'coast',t+86400000);E.refresh(s,t+86400000+20*E.stockInterval(s),rng);assert.equal(s.exploration.stock,3);
});
test('plants, rock and sand have count gates and deterministic resource unlock',()=>{
 const s=E.createInitial(t);const r=E.discover(s,'sp_011','test',t,rng),f=s.fish_instances.find(x=>x.uid===r.uid);let child=E.evolutionOptions(s,f).find(x=>x.id==='sp_019');assert.equal(child.ready,false);
 E.setDecorQuantity(s,'plants',1);E.setDecorQuantity(s,'plants',1);child=E.evolutionOptions(s,f).find(x=>x.id==='sp_019');assert.equal(child.ready,true);
 assert.equal(E.setDecorQuantity(s,'rock',1),false);s.materials=1;assert.ok(E.unlockDecor(s,'rock'));assert.equal(s.materials,0);for(let i=0;i<10;i++)E.setDecorQuantity(s,'rock',1);assert.equal(s.tank.quantities.rock,3);
});
test('catalog requires live environmental species in the same room and water; four game synergies',()=>{
 const s=E.createInitial(t);const c=E.discover(s,'sp_030','test',t,rng),clown=s.fish_instances.find(f=>f.uid===c.uid);assert.equal(E.evolutionOptions(s,clown).find(e=>e.id==='sp_039').ready,false);
 const a=E.discover(s,'sp_001','test',t,rng);assert.ok(s.dex.synergies.includes('clown_anemone'));assert.equal(E.evolutionOptions(s,clown).find(e=>e.id==='sp_039').ready,true);
 E.togglePlaced(s,a.uid);assert.equal(E.evolutionOptions(s,clown).find(e=>e.id==='sp_039').ready,false);E.togglePlaced(s,a.uid);
 for(const id of [2,37,9,88,10,78])E.discover(s,idFor(id),'test',t,rng);assert.equal(s.dex.synergies.length,4);
 E.feed(s,t);assert.equal(clown.growth,13);assert.equal(s.fish_instances.find(f=>f.uid===a.uid).growth,0);
});
test('grass/sand environment tags count only when placed in same room and salinity',()=>{
 const s=E.createInitial(t),a=E.discover(s,'sp_011','test',t,rng),f=s.fish_instances.find(x=>x.uid===a.uid),grass=E.discover(s,'sp_007','test',t,rng);E.setDecorQuantity(s,'plants',1);assert.equal(E.conditionCounts(s,f).plants,3);assert.equal(E.evolutionOptions(s,f).find(e=>e.id==='sp_019').ready,true);
 E.togglePlaced(s,grass.uid);assert.equal(E.conditionCounts(s,f).plants,2);assert.equal(E.evolutionOptions(s,f).find(e=>e.id==='sp_019').ready,false);E.togglePlaced(s,grass.uid);const grassObj=s.fish_instances.find(x=>x.uid===grass.uid);grassObj.room='beach';assert.equal(E.conditionCounts(s,f).plants,2);grassObj.room='current';E.discover(s,'sp_006','test',t,rng);assert.equal(E.conditionCounts(s,f).plants,3,'sea grass in another salinity must not count');
 const m=E.discover(s,'sp_074','test',t,rng),ray=s.fish_instances.find(x=>x.uid===m.uid);E.discover(s,'sp_008','test',t,rng);E.discover(s,'sp_010','test',t,rng);assert.equal(E.conditionCounts(s,ray).sand,2);s.materials++;E.unlockDecor(s,'sand');E.setDecorQuantity(s,'sand',1);assert.equal(E.evolutionOptions(s,ray).find(e=>e.id==='sp_079').ready,true);
});
test('synergy requirements are active placements; growth effects stop when environmental species are stored',()=>{
 const s=E.createInitial(t);const c=E.discover(s,'sp_030','test',t,rng),clown=s.fish_instances.find(f=>f.uid===c.uid),env=E.discover(s,'sp_001','test',t,rng);const g=E.discover(s,'sp_033','test',t,rng),puffer=s.fish_instances.find(f=>f.uid===g.uid);assert.equal(E.activeSynergies(s).length,1);assert.equal(E.evolutionOptions(s,puffer).find(e=>e.id==='sp_045').ready,true);
 E.togglePlaced(s,env.uid);assert.equal(E.activeSynergies(s).length,0);assert.equal(s.dex.synergies.length,1);assert.equal(E.evolutionOptions(s,puffer).find(e=>e.id==='sp_045').ready,false);E.feed(s,t);assert.equal(clown.growth,12);
 E.togglePlaced(s,env.uid);E.discover(s,'sp_004','test',t,rng);E.feed(s,t);assert.equal(clown.growth,26);assert.equal(puffer.growth,0);E.refreshGrowth(s,t+86400000);const before=puffer.growth;E.feed(s,t+86400000,'current','marine','seafood');assert.equal(puffer.growth-before,13);
});
test('multi-light condition #68 records sequential exposure; one-light conditions require current light',()=>{
 const s=E.createInitial(t),m=E.discover(s,'sp_057','test',t,rng),f=s.fish_instances.find(x=>x.uid===m.uid);assert.equal(E.evolutionOptions(s,f).find(e=>e.id==='sp_068').ready,false);assert.match(conditionText(BY_ID.sp_068.condition),/順に体験/);E.setLight(s,'blue');assert.equal(E.evolutionOptions(s,f).find(e=>e.id==='sp_068').ready,true);
 const a=E.discover(s,'sp_011','test',t,rng),medaka=s.fish_instances.find(x=>x.uid===a.uid);assert.equal(E.evolutionOptions(s,medaka).find(e=>e.id==='sp_018').ready,false);E.setLight(s,'moon');assert.equal(E.evolutionOptions(s,medaka).find(e=>e.id==='sp_018').ready,true);
});
test('evolution preserves parent, creates child and inherits individual size and hue',()=>{
 const s=E.createInitial(t),r=E.discover(s,'sp_030','test',t,rng),f=s.fish_instances.find(x=>x.uid===r.uid);f.size=.91;f.hue_shift=.017;E.discover(s,'sp_001','test',t,rng);const result=E.evolve(s,f.uid,'sp_039',t,rng);assert.ok(result.ok);const child=s.fish_instances.find(x=>x.uid===result.uid);assert.equal(child.size,.91);assert.equal(child.hue_shift,.017);assert.ok(s.fish_instances.includes(f));assert.equal(E.evolve(s,f.uid,'sp_039',t,rng).ok,false);
});
test('every catalog form is achievable, including high dex, symbiosis and sequential lights',()=>{
 const s=E.createInitial(t);for(const sp of CATALOG.filter(x=>x.kind!=='evolution'))E.discover(s,sp.id,'test',t,rng);
 for(const k of ['rock','sand']){s.materials++;assert.ok(E.unlockDecor(s,k));}for(const k of ['plants','rock','sand'])for(let i=0;i<5;i++)E.setDecorQuantity(s,k,1);
 for(const f of s.fish_instances)f.growth=100;let last=-1;
 for(let pass=0;pass<10&&s.dex.discovered.length!==last;pass++){
  last=s.dex.discovered.length;
  for(const evo of EVOLUTIONS){if(s.dex.discovered.includes(evo.id))continue;const parent=s.fish_instances.find(f=>f.species_id===evo.parentId);for(const light of evo.condition.lights)E.setLight(s,light);if(E.evolutionOptions(s,parent).find(e=>e.id===evo.id).ready)assert.ok(E.evolve(s,parent.uid,evo.id,t,rng).ok,evo.name);}
 }
 assert.equal(s.dex.discovered.length,100,EVOLUTIONS.filter(e=>!s.dex.discovered.includes(e.id)).map(x=>x.name).join(','));assert.deepEqual(s.dex.awards,[10,25,50,75,100]);assert.equal(new Set(s.fish_instances.map(f=>f.uid)).size,100);
});
test('stationary environmental entries do not gain invisible passive growth',()=>{const s=E.createInitial(t);const a=E.discover(s,'sp_001','test',t,rng),b=E.discover(s,'sp_030','test',t,rng);E.refreshGrowth(s,t+3*E.HOUR);assert.equal(s.fish_instances.find(f=>f.uid===a.uid).growth,0);assert.equal(s.fish_instances.find(f=>f.uid===b.uid).growth,3);});
test('science distinction and salinity are explicit, uncertain names do not get fabricated taxonomy',()=>{
 assert.match(BY_ID.sp_006.natural,/浅海/);assert.match(BY_ID.sp_087.natural,/沿岸/);assert.match(BY_ID.sp_091.natural,/沿岸/);assert.equal(BY_ID.sp_034.water,'brackish');assert.equal(BY_ID.sp_048.water,'fresh');assert.match(BY_ID.sp_025.trivia,/別/);assert.match(BY_ID.sp_070.trivia,/別名/);assert.match(BY_ID.sp_018.trivia,/実在/);assert.match(BY_ID.sp_072.trivia,/観察例/);assert.match(BY_ID.sp_079.trivia,/イズヒメエイ/);
 for(const id of [7,12,33])assert.match(BY_ID[idFor(id)].status,/未確認/);
});
test('v3 migration preserves all fish and original backup; only exact names enter official dex',()=>{
 const old={schema_version:1,game:'yoru-aquarium-web-1',started:true,next_fish_id:2,fish_instances:[{uid:'old-clown',species_id:'basic_01',growth:75,size:.9,hue_shift:.04,room:'current'},{uid:'old-blue',species_id:'basic_03',growth:31,size:1.1,hue_shift:-.02,room:'current'}],dex:{discovered:['basic_01','basic_03'],stages_recorded:{basic_01:[0,1]},synergies:['anemone_clown'],awards:[]},tank:{light:'moon',decor:['plants','anemone'],inventory:['plants','anemone']},exploration:{stock:2,stock_updated_at:t,active:null,has_explored:true},daily:{date:E.dayKey(t),fed_count:0,feed_bonus:0,today_fish_claimed:false,pet_count:0},settings:{demo:true},tutorial:{discover:true},materials:4,pending:[],events:[]};
 const s=E.migrateLegacy(old,t);assert.ok(E.validSave(s));assert.equal(s.fish_instances.length,2);assert.equal(s.fish_instances[0].species_id,'sp_030');assert.equal(s.fish_instances[0].growth,75);assert.equal(s.fish_instances[1].species_id,LEGACY_ID_MAP.basic_03);assert.ok(BY_ID[s.fish_instances[1].species_id]);assert.equal(BY_ID[s.fish_instances[1].species_id].kind,'legacy');assert.deepEqual(s.dex.discovered,['sp_030']);assert.equal(s.materials,4);assert.deepEqual(s.legacy.original,old);assert.notEqual(s.legacy.original,old);assert.equal(s.legacy.legacyInstances,1);
});
test('v3 migration keeps an in-progress exploration and resolves it under the new catalog',()=>{
 const t=1700000000000,old=E.createInitial(t);old.schema_version=1;old.game='yoru-aquarium-web-1';old.exploration.active={destination:'coast',started_at:t,ends_at:t+30000,first:true};old.exploration.stock=2;
 const before=structuredClone(old),migrated=E.migrateLegacy(old,t+1000);
 assert.deepEqual(old,before);assert.equal(migrated.exploration.active.ends_at,t+30000);assert.equal(migrated.exploration.stock,2);
 E.refresh(migrated,t+30001,rng);assert.equal(migrated.exploration.active,null);assert.ok(migrated.dex.discovered.includes('sp_030'));assert.ok(migrated.pending.some(x=>x.type==='discovery'&&x.result.id==='sp_030'));
});

test('all animal care profiles have valid non-empty food groups and compressed relative sizes',()=>{
 assert.equal(FOODS.length,5);for(const sp of CATALOG.filter(x=>x.kind!=='environment')){const p=careProfile(sp);assert.ok(p.cm>0,sp.name);assert.ok(p.foods.length,sp.name);assert.ok(p.foods.every(id=>FOOD_BY_ID[id]),sp.name);assert.ok(canEat(sp,p.favorite));assert.ok(visualLength(sp)>=1&&visualLength(sp)<=3.2);}
 assert.ok(visualLength(BY_ID.sp_011)<visualLength(BY_ID.sp_030));assert.ok(visualLength(BY_ID.sp_030)<visualLength(BY_ID.sp_060));assert.ok(visualLength(BY_ID.sp_060)/visualLength(BY_ID.sp_011)<3.3);
 assert.deepEqual(careProfile(BY_ID.sp_078).foods,['plants']);assert.deepEqual(careProfile(BY_ID.sp_057).foods,['plankton']);assert.deepEqual(careProfile(BY_ID.sp_037).foods,['special']);
});
test('foods grow only compatible animals in the selected room and water, and do not consume a failed meal',()=>{
 const s=E.createInitial(t),a=E.discover(s,'sp_030','test',t,rng),b=E.discover(s,'sp_056','test',t,rng),c=E.discover(s,'sp_011','test',t,rng);
 const clown=s.fish_instances.find(x=>x.uid===a.uid),turtle=s.fish_instances.find(x=>x.uid===b.uid),medaka=s.fish_instances.find(x=>x.uid===c.uid);
 let r=E.feed(s,t,'current','marine','special');assert.equal(r.reason,'incompatible');assert.equal(E.feedRemaining(s,'current','marine'),2);
 r=E.feed(s,t,'current','marine','plankton');assert.equal(r.matched,1);assert.equal(r.ignored,1);assert.deepEqual(r.fedUids,[clown.uid]);assert.equal(clown.growth,12);assert.equal(turtle.growth,0);assert.equal(medaka.growth,0);
 r=E.feed(s,t,'current','marine','seafood');assert.equal(r.matched,1);assert.equal(turtle.growth,12);assert.equal(clown.growth,12);assert.equal(E.feedRemaining(s,'current','marine'),0);
 r=E.feed(s,t,'current','fresh','insects');assert.equal(r.matched,1);assert.equal(medaka.growth,8);assert.equal(E.feedRemaining(s,'current','fresh'),1);assert.equal(clown.care.meals,1);
 assert.equal(E.feed(s,t,'current','brackish','plankton').reason,'empty');assert.equal(E.feed(s,t,'current','marine','no-such-food').reason,'food');
});
test('same species repeats, counterpart is opposite sex, animal cap and environment duplicates',()=>{
 const s=E.createInitial(t),a=E.discover(s,'sp_030','test',t,()=>.1),b=E.discover(s,'sp_030','test',t,()=>.1);
 const x=s.fish_instances.find(f=>f.uid===a.uid),y=s.fish_instances.find(f=>f.uid===b.uid);assert.notEqual(x.sex,y.sex);assert.equal(s.dex.discovered.length,1);
 for(let i=0;i<4;i++)assert.equal(E.discover(s,'sp_030','test',t,rng).type,'fish');assert.equal(E.discover(s,'sp_030','test',t,rng).type,'duplicate');assert.equal(s.fish_instances.filter(f=>f.species_id==='sp_030').length,6);
 const env=E.discover(s,'sp_001','test',t,rng);assert.equal(s.fish_instances.find(f=>f.uid===env.uid).sex,undefined);assert.equal(E.discover(s,'sp_001','test',t,rng).type,'duplicate');
});
test('first invited partner is free, further species require material, sexes oppose and rooms match',()=>{
 const s=E.createInitial(t),r=E.discover(s,'sp_030','test',t,rng),first=s.fish_instances.find(f=>f.uid===r.uid);assert.equal(E.partnerCost(s,r.uid),0);
 const invited=E.invitePartner(s,r.uid,t,rng),mate=s.fish_instances.find(f=>f.uid===invited.uid);assert.equal(invited.ok,true);assert.equal(mate.room,first.room);assert.notEqual(mate.sex,first.sex);assert.equal(E.partnerCost(s,r.uid),null);
 const other=E.discover(s,'sp_011','test',t,rng);assert.equal(E.partnerCost(s,other.uid),1);assert.equal(E.invitePartner(s,other.uid,t,rng).reason,'materials');s.materials=1;assert.equal(E.invitePartner(s,other.uid,t,rng).ok,true);assert.equal(s.materials,0);
});
test('breeding requires matching species, room, mature opposite-sex pair and enforces its probability',()=>{
 const s=E.createInitial(t),a=E.discover(s,'sp_030','test',t,rng),b=E.discover(s,'sp_030','test',t,rng),x=s.fish_instances.find(f=>f.uid===a.uid),y=s.fish_instances.find(f=>f.uid===b.uid);
 x.growth=40;y.growth=39;E.refreshBreeding(s,t,rng);assert.equal(E.breedingPairs(s).length,0);
 y.growth=40;y.room='beach';E.refreshBreeding(s,t,rng);assert.equal(E.breedingPairs(s).length,0);y.room='current';
 E.refreshBreeding(s,t,rng);const key=E.breedKey(x),timer=s.breeding.timers[key];assert.equal(timer.interval,E.BREED_DEMO_INTERVAL);assert.equal(timer.next_at,t+60000);
 E.refreshBreeding(s,t+60000,()=>.9);assert.equal(s.fish_instances.length,2);assert.equal(timer.last_result,'rest');
 E.refreshBreeding(s,t+120000,()=>.1);assert.equal(s.fish_instances.length,3);const child=s.fish_instances.at(-1);assert.equal(child.species_id,x.species_id);assert.equal(child.growth,0);assert.deepEqual(new Set(child.parents),new Set([x.uid,y.uid]));assert.equal(child.room,x.room);assert.equal(s.pending.at(-1).type,'birth');assert.equal(s.dex.discovered.length,1);
});
test('low satiety prevents birth without death; food restores it',()=>{
 const s=E.createInitial(t),a=E.discover(s,'sp_030','test',t,rng),b=E.discover(s,'sp_030','test',t,rng);for(const f of s.fish_instances){f.growth=40;f.care.satiety=0;}
 E.refreshBreeding(s,t,rng);const key=E.breedKey(s.fish_instances[0]);E.refreshBreeding(s,t+60000,()=>0);assert.equal(s.fish_instances.length,2);assert.equal(s.breeding.timers[key].last_result,'hungry');
 assert.ok(E.feed(s,t+61000,'current','marine','plankton').ok);for(const f of s.fish_instances)assert.ok(E.satietyAt(f,t+61000)>=35);E.refreshBreeding(s,t+120000,()=>0);assert.equal(s.fish_instances.length,3);
});
test('offline breeding catch-up is bounded to seven checks; interval is fixed when mode changes',()=>{
 const s=E.createInitial(t);s.settings.demo=false;E.discover(s,'sp_030','test',t,rng);E.discover(s,'sp_030','test',t,rng);
 for(const f of s.fish_instances){f.growth=40;f.care.satiety=100;f.care.satiety_at=t+1000*E.HOUR;}
 E.refreshBreeding(s,t,rng);const key=E.breedKey(s.fish_instances[0]),timer=s.breeding.timers[key];assert.equal(timer.interval,24*E.HOUR);s.settings.demo=true;assert.equal(timer.interval,24*E.HOUR);assert.equal(E.skipBreedCheck(s,key,t,()=>0),false);
 let calls=0;E.refreshBreeding(s,t+20*24*E.HOUR,()=>{calls++;return .9});assert.equal(calls,7);assert.equal(timer.next_at,t+21*24*E.HOUR);assert.equal(s.fish_instances.length,2);
});
test('demo skips only a demo timer and runs a real probability roll',()=>{
 const s=E.createInitial(t);E.discover(s,'sp_030','test',t,rng);E.discover(s,'sp_030','test',t,rng);for(const f of s.fish_instances)f.growth=40;E.refreshBreeding(s,t,rng);const key=E.breedKey(s.fish_instances[0]);
 assert.ok(E.skipBreedCheck(s,key,t+1,()=>.99));assert.equal(s.fish_instances.length,2);assert.ok(E.skipBreedCheck(s,key,t+2,()=>.01));assert.equal(s.fish_instances.length,3);
});
test('names and care notes persist, are limited to 12 characters and do not affect the species',()=>{
 const s=E.createInitial(t),r=E.discover(s,'sp_030','test',t,rng),f=s.fish_instances[0];assert.ok(E.renameFish(s,r.uid,'abcdefghijklmnop',t));assert.equal(f.nickname,'abcdefghijkl');assert.equal(f.species_id,'sp_030');assert.match(f.care.journal[0].text,/名前/);E.renameFish(s,r.uid,'',t);assert.equal(f.nickname,'');
});
test('v4 migration is non-mutating, preserves all progress, exploration and original backup',()=>{
 const old=E.createInitial(t);old.schema_version=2;old.game='yoru-aquarium-web-2';old.started=true;const a=E.discover(old,'sp_030','test',t,rng);old.fish_instances[0].growth=71;delete old.fish_instances[0].sex;delete old.fish_instances[0].care;delete old.breeding;delete old.daily.fed_by_tank;old.daily.fed_count=1;old.exploration.active={destination:'coast',started_at:t,ends_at:t+30000,first:false,demo:true};
 const original=structuredClone(old),next=E.migratePrevious(old,t+1000);assert.deepEqual(old,original);assert.deepEqual(next.previous.original,original);assert.notEqual(next.previous.original,old);assert.ok(E.validSave(next));assert.equal(next.fish_instances.find(f=>f.uid===a.uid).growth,71);assert.ok(['male','female'].includes(next.fish_instances[0].sex));assert.equal(next.fish_instances[0].care.satiety,70);assert.equal(next.exploration.active.ends_at,t+30000);assert.equal(next.daily.fed_by_tank['current:marine'],1);
 const nextAgain=E.migratePrevious(old,t+5000);assert.equal(nextAgain.fish_instances[0].sex,next.fish_instances[0].sex);
});

test('passive growth pauses below satiety 20, resumes after compatible feeding, and never kills',()=>{
 const s=E.createInitial(t),r=E.discover(s,'sp_030','test',t,rng),f=s.fish_instances.find(x=>x.uid===r.uid);
 E.refreshGrowth(s,t+72*E.HOUR);assert.equal(f.growth,50);assert.equal(E.satietyAt(f,t+72*E.HOUR),0);assert.ok(s.fish_instances.includes(f));
 assert.ok(E.feed(s,t+72*E.HOUR,'current','marine','plankton').ok);assert.equal(f.growth,62);E.refreshGrowth(s,t+73*E.HOUR);assert.equal(f.growth,63);
});
test('parent-child and siblings are excluded from breeding; unrelated individuals still pair',()=>{
 const s=E.createInitial(t);E.discover(s,'sp_030','test',t,rng);E.discover(s,'sp_030','test',t,rng);const [a,b]=s.fish_instances;for(const f of s.fish_instances)f.growth=40;
 E.refreshBreeding(s,t,rng);E.refreshBreeding(s,t+60000,()=>0);E.refreshBreeding(s,t+120000,()=>.25);const kids=s.fish_instances.filter(f=>f.parents?.length);assert.equal(kids.length,2);kids[0].sex='male';kids[1].sex='female';kids.forEach(f=>f.growth=40);
 assert.ok(E.closeRelatives(a,kids[0]));assert.ok(E.closeRelatives(kids[0],kids[1]));a.room='beach';b.room='beach';assert.equal(E.breedingPairs(s).filter(p=>p.male.room==='current').length,0);
 const outsider=E.discover(s,'sp_030','test',t+130000,rng);const ext=s.fish_instances.find(x=>x.uid===outsider.uid);ext.sex='female';ext.growth=40;assert.equal(E.breedingPairs(s).filter(p=>p.male.room==='current').length,1);
});

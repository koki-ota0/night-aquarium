import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../engine.js';
import * as P from '../progress.js';
import {CATALOG,EVOLUTIONS,BY_ID} from '../catalog.js';

const t=1700000000000,rng=()=>.42;
function originalChecks(s,f,e){
 const c=e.condition,counts=E.conditionCounts(s,f);
 return {
  hasGrowth:f.growth>=c.growth,
  hasLight:c.lights.length>1?c.lights.every(l=>(f.light_seen||[]).includes(l)):!c.lights.length||s.tank.light===c.lights[0],
  hasCounts:Object.entries(c.counts).every(([k,n])=>(counts[k]||0)>=n),
  hasTag:!c.tag||s.fish_instances.some(x=>x.room===f.room&&x.placed!==false&&BY_ID[x.species_id]?.kind==='environment'&&BY_ID[x.species_id]?.tag===c.tag&&E.waterGroup(BY_ID[x.species_id])===E.waterGroup(BY_ID[f.species_id])),
  hasDex:s.dex.discovered.length>=c.dex,
  hasSynergies:E.activeSynergies(s).length>=c.synergies
 };
}
function allBase(){const s=E.createInitial(t);for(const sp of CATALOG.filter(x=>x.kind!=='evolution'))E.discover(s,sp.id,'test',t,rng);s.pending=[];return s;}

test('all 56 evolution checklists match the original decision rules across diverse states',()=>{
 const base=allBase();
 for(let scenario=0;scenario<4;scenario++){
  const s=structuredClone(base);s.tank.light=['moon','warm','blue','warm'][scenario];s.tank.quantities={plants:[0,1,3,5][scenario],rock:[0,1,2,3][scenario],sand:[0,1,2,3][scenario]};
  for(const [i,f] of s.fish_instances.entries()){
   f.growth=[0,39,40,100][scenario];f.light_seen=[['moon'],['moon','blue'],['blue'],['moon','blue','warm']][scenario];
   if(scenario===2&&i%2===0)f.room='beach';if(scenario===3&&BY_ID[f.species_id]?.kind==='environment'&&i%2===0)f.placed=false;
  }
  if(scenario===3)s.dex.discovered=CATALOG.map(x=>x.id);
  const before=structuredClone(s);
  for(const evo of EVOLUTIONS){const parent=s.fish_instances.find(f=>f.species_id===evo.parentId);assert.ok(parent,evo.id);const result=E.evolutionOptions(s,parent).find(x=>x.id===evo.id),old=originalChecks(s,parent,evo);assert.deepEqual(result.checks,old,evo.id);assert.equal(result.ready,Object.values(old).every(Boolean),evo.id);assert.equal(result.ready,result.requirements.every(r=>r.met),evo.id);}
  assert.deepEqual(s,before,'inspecting progress must never mutate a save');
 }
});

test('single-light conditions use current light; multi-light conditions use this individual history',()=>{
 const s=E.createInitial(t),m=E.discover(s,'sp_011','test',t,rng),ma=E.discover(s,'sp_057','test',t,rng),medaka=s.fish_instances.find(f=>f.uid===m.uid),manta=s.fish_instances.find(f=>f.uid===ma.uid);
 let one=E.evolutionOptions(s,medaka).find(x=>x.id==='sp_018'),two=E.evolutionOptions(s,manta).find(x=>x.id==='sp_068');assert.equal(one.ready,true);assert.equal(two.ready,false);assert.deepEqual(two.requirements.map(x=>[x.id,x.met]),[['blue',false],['moon',true]]);
 E.setLight(s,'blue');assert.equal(E.evolutionOptions(s,medaka).find(x=>x.id==='sp_018').ready,false);assert.equal(E.evolutionOptions(s,manta).find(x=>x.id==='sp_068').ready,true);
 E.setLight(s,'warm');two=E.evolutionOptions(s,manta).find(x=>x.id==='sp_068');assert.equal(two.ready,true);assert.ok(two.requirements.every(x=>x.mode==='seen'));
});

test('catalog search never exposes unknown names, but accepts numbers and owned nicknames',()=>{
 const s=E.createInitial(t),a=E.discover(s,'sp_030','test',t,rng),b=E.discover(s,'sp_011','test',t,rng);s.settings.demo_showcase=false;s.fish_instances.find(f=>f.uid===a.uid).nickname='きなこ';
 assert.deepEqual(P.filterCatalog(s,{query:'きなこ'}).map(x=>x.id),['sp_030']);assert.deepEqual(P.filterCatalog(s,{query:'クマノミ'}).map(x=>x.id),['sp_030']);
 assert.deepEqual(P.filterCatalog(s,{query:'マンタ'}),[],'an undiscovered name is not a searchable spoiler');assert.deepEqual(P.filterCatalog(s,{query:'#５７'}).map(x=>x.id),['sp_057']);
 assert.equal(P.filterCatalog(s,{status:'known'}).length,2);assert.equal(P.filterCatalog(s,{status:'unknown'}).length,98);assert.deepEqual(P.filterCatalog(s,{status:'ready'}).map(x=>x.id),['sp_011']);
 assert.equal(P.filterCatalog(s,{biome:'淡水',query:'クマノミ'}).length,0);assert.deepEqual(P.filterCatalog(s,{biome:'淡水',query:'No. 11'}).map(x=>x.id),['sp_011']);
});

test('initial water chooses an occupied animal group before empty water or environment-only water',()=>{
 const s=E.createInitial(t);assert.equal(P.defaultWater(s,'current'),'marine');E.discover(s,'sp_011','test',t,rng);assert.equal(P.defaultWater(s,'current'),'fresh');E.discover(s,'sp_001','test',t,rng);assert.equal(P.defaultWater(s,'current'),'fresh');E.discover(s,'sp_030','test',t,rng);assert.equal(P.defaultWater(s,'current'),'marine');
});

test('suggestions are optional, actionable, derived and do not change the save',()=>{
 const s=E.createInitial(t),result=E.discover(s,'sp_033','test',t,rng),puffer=s.fish_instances.find(f=>f.uid===result.uid);puffer.care.satiety=0;puffer.care.satiety_at=t;
 const before=structuredClone(s);let tip=P.nextSuggestion(s,t);assert.equal(tip.kind,'care');assert.equal(tip.water,'marine');assert.equal(tip.count,1);assert.deepEqual(s,before);
 s.daily.fed_by_tank['current:marine']=2;tip=P.nextSuggestion(s,t);assert.equal(tip.kind,'collection');assert.equal(tip.next,10);
 puffer.growth=40;tip=P.nextSuggestion(s,t);assert.equal(tip.kind,'evolution');assert.equal(tip.uid,puffer.uid);
 s.dex.discovered=CATALOG.map(x=>x.id);puffer.care.satiety=100;tip=P.nextSuggestion(s,t);assert.equal(tip.kind,'complete');
});


test('environment counts are local to a water group and synergy requirements use the current pair, not historical discovery',()=>{
 const s=E.createInitial(t);const m=E.discover(s,'sp_011','test',t,rng),medaka=s.fish_instances.find(f=>f.uid===m.uid);s.tank.quantities.plants=2;
 E.discover(s,'sp_006','test',t,rng);const fresh=E.discover(s,'sp_007','test',t,rng);
 const grass=()=>E.evolutionOptions(s,medaka).find(x=>x.id==='sp_019').requirements.find(x=>x.type==='count');assert.deepEqual([grass().current,grass().target,grass().met],[3,3,true]);
 E.togglePlaced(s,fresh.uid);assert.deepEqual([grass().current,grass().target,grass().met],[2,3,false]);
 const puff=E.discover(s,'sp_033','test',t,rng),puffer=s.fish_instances.find(f=>f.uid===puff.uid);E.discover(s,'sp_030','test',t,rng);const anemone=E.discover(s,'sp_001','test',t,rng);
 const pair=()=>E.evolutionOptions(s,puffer).find(x=>x.id==='sp_045').requirements.find(x=>x.type==='synergies');assert.deepEqual([pair().current,pair().met],[1,true]);assert.ok(s.dex.synergies.includes('clown_anemone'));
 E.togglePlaced(s,anemone.uid);assert.deepEqual([pair().current,pair().met],[0,false]);assert.ok(s.dex.synergies.includes('clown_anemone'),'history is retained but does not satisfy a current-pair condition');
});

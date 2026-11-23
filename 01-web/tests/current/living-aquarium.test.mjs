import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../engine.js';
import * as L from '../../decor-layout.js';
import {personalityFor,speciesGesture} from '../../personality.js';
import {BY_ID,POOLS,poolWeight} from '../../catalog.js';
import {prepareImport,portableState} from '../../save-transfer.js';

const t=new Date(2026,9,27,12).getTime(),rng=()=>.25;

test('visual personalities are stable per UID and do not alter care, species or game statistics',()=>{
 const f={uid:'friend_42',species_id:'real_170',affinity:0,growth:2};const before=structuredClone(f),p=personalityFor(f);
 assert.deepEqual(f,before);assert.deepEqual(personalityFor({...f,affinity:999,growth:100}),p);
 assert.ok(['gentle','curious','steady'].includes(p.id));assert.ok(p.speed>=.8&&p.speed<=1.1);
 assert.equal(new Set(Array.from({length:30},(_,i)=>personalityFor({uid:`fish_${i}`}).id)).size,3);
 assert.match(speciesGesture(BY_ID.sp_076),/水底/);assert.match(speciesGesture(BY_ID.real_176),/傘/);
});

test('the four existing scene pairs require the same room, water, visibility and placed environment',()=>{
 const s=E.createInitial(t),ids=['real_160','real_161','real_166','real_165','real_170','real_139','sp_088','sp_078'];
 for(const id of ids)E.discover(s,id,'test',t,rng);
 assert.equal(E.activeSynergies(s).length,3);assert.equal(E.synergyPairsInTank(s,'reef','marine').length,2);assert.equal(E.synergyPairsInTank(s,'beach','marine').length,1);
 assert.equal(E.synergyPairsInTank(s,'reef','fresh').length,0);
 const clown=s.fish_instances.find(f=>f.species_id==='real_170'),red=s.fish_instances.find(f=>f.species_id==='real_160');
 assert.deepEqual(E.synergyPairsInTank(s,'reef','marine',[clown.uid,red.uid]).map(p=>p.key),['clown_anemone']);
 assert.equal(E.synergyPairsInTank(s,'reef','marine',[clown.uid]).length,0);
 assert.ok(E.recordSynergyMoment(s,'clown_anemone',t+1));assert.equal(E.recordSynergyMoment(s,'clown_anemone',t+2),false);assert.equal(s.dex.moments.length,1);
 E.togglePlaced(s,red.uid);assert.equal(E.synergyPairsInTank(s,'reef','marine').length,1);assert.equal(E.activeSynergies(s).includes('clown_anemone'),false);assert.equal(s.dex.moments.length,1,'history persists without making active conditions true');
 assert.equal(E.recordSynergyMoment(s,'invented',t),false);assert.equal(E.findSynergyLocation(s,'clown_anemone'),null);
});

test('decor placement is scoped by room and water, with no changes to counts or evolution conditions',()=>{
 const s=E.createInitial(t);E.discover(s,'real_167','test',t,rng);s.tank.inventory.push('rock','sand');Object.assign(s.tank.quantities,{plants:3,rock:2,sand:2});s.tank.decor=['plants','rock','sand'];
 const f=s.fish_instances[0],counts=structuredClone(E.conditionCounts(s,f)),quantities=structuredClone(s.tank.quantities),freshDefault=L.getDecorPosition(s,'cold-sea','fresh','plants',0);
 assert.ok(L.setDecorPosition(s,'cold-sea','marine','plants',0,{x:3.2,z:1.4,rotation:45}));
 assert.deepEqual(L.getDecorPosition(s,'cold-sea','marine','plants',0),{x:3.2,z:1.4,rotation:45});
 assert.deepEqual(L.getDecorPosition(s,'cold-sea','fresh','plants',0),freshDefault);assert.deepEqual(L.getDecorPosition(s,'beach','marine','plants',0),freshDefault);
 assert.deepEqual(s.tank.quantities,quantities);assert.deepEqual(E.conditionCounts(s,f),counts);assert.equal(L.visibleDecor(s,'cold-sea','marine').length,7);
 assert.equal(L.setDecorPosition(s,'cold-sea','marine','plants',4,{x:1,z:1,rotation:0}),false,'cannot move a hidden item');
 assert.ok(L.applyDecorPreset(s,'cold-sea','marine','cluster'));assert.deepEqual(s.tank.quantities,quantities);
 assert.ok(L.applyDecorPreset(s,'cold-sea','fresh','wide'));assert.ok(L.applyDecorPreset(s,'cold-sea','marine','default'));
 assert.deepEqual(L.getDecorPosition(s,'cold-sea','marine','plants',0),freshDefault);assert.notDeepEqual(L.getDecorPosition(s,'cold-sea','fresh','plants',0),freshDefault);
 assert.equal(L.applyDecorPreset(s,'nowhere','marine','wide'),false);
});

test('new fields round-trip safely; old saves receive defaults, malicious layouts are rejected',()=>{
 const s=E.createInitial(t);E.discover(s,'real_170','test',t,rng);E.discover(s,'real_160','test',t,rng);E.recordSynergyMoment(s,'clown_anemone',t);
 L.setDecorPosition(s,'cold-sea','marine','plants',0,{x:1.15,z:-.7,rotation:90});s.started=true;s.welcome_back={since:t,at:t+E.WELCOME_AFTER,items:[{kind:'growth',uid:s.fish_instances[0].uid,stage:1}]};
 const a=prepareImport(JSON.stringify(portableState(s)),t);assert.equal(a.ok,true);assert.deepEqual(a.state.tank.layouts,s.tank.layouts);assert.deepEqual(a.state.dex.moments,s.dex.moments);assert.deepEqual(a.state.welcome_back,s.welcome_back);
 const old=structuredClone(s);delete old.tank.layouts;delete old.dex.moments;delete old.welcome_back;const b=prepareImport(old,t);assert.equal(b.ok,true);assert.deepEqual(b.state.tank.layouts,{});assert.deepEqual(b.state.dex.moments,[]);assert.equal(b.state.welcome_back,null);
 for(const mutate of [x=>x.tank.layouts['cold-sea:marine']['plants:0'].x=999,x=>x.tank.layouts['cold-sea:marine']['plants:0'].rotation=23,x=>x.dex.moments=[{key:'clown_anemone',at:t},{key:'clown_anemone',at:t}],x=>x.welcome_back.items=[{kind:'fiction',uid:'abc'}],x=>x.tank.layouts['__proto__:marine']={}]){
  const bad=structuredClone(s);mutate(bad);assert.equal(prepareImport(bad,t).ok,false);
 }
});

test('welcome report is created only on real return and contains only events actually resolved',()=>{
 const s=E.createInitial(t);s.started=true;s.settings.demo=false;for(const id of ['real_170','real_170','real_167'])E.discover(s,id,'test',t,rng);
 s.pending=[];s.fish_instances[0].growth=40;s.fish_instances[1].growth=40;s.fish_instances[2].growth=39;{const bt=E.createBreedingTank(s,'reef','繁殖');s.settings.demo=true;E.moveFish(s,s.fish_instances[0].uid,bt.id);E.moveFish(s,s.fish_instances[1].uid,bt.id);s.settings.demo=false;}E.refreshBreeding(s,t,rng);E.startExplore(s,'open-ocean',t);s.last_seen=t;
 const result=E.refreshForReturn(s,t+25*E.HOUR,()=>0);assert.equal(result.welcomeCreated,true);
 assert.deepEqual(s.welcome_back.items.map(x=>x.kind),['explore','birth','growth']);
 assert.equal(s.welcome_back.items[0].species_id,'real_170');assert.ok(s.fish_instances.some(f=>f.uid===s.welcome_back.items[1].uid&&f.parents?.length));
 assert.equal(s.welcome_back.items[2].uid,s.fish_instances.find(f=>f.species_id==='real_167').uid);assert.equal(prepareImport(s,t).ok,true);
 const old=structuredClone(s.welcome_back);E.refreshForReturn(s,t+25*E.HOUR+1000,()=>0);assert.deepEqual(s.welcome_back,old);
 const quiet=E.createInitial(t);quiet.started=true;quiet.last_seen=t;E.refreshForReturn(quiet,t+E.WELCOME_AFTER-1,rng);assert.equal(quiet.welcome_back,null);
 quiet.last_seen=t;E.refreshForReturn(quiet,t+E.WELCOME_AFTER,rng);assert.deepEqual(quiet.welcome_back.items,[]);
 const unread=structuredClone(quiet.welcome_back);quiet.last_seen=t+E.WELCOME_AFTER;E.refreshForReturn(quiet,t+E.WELCOME_AFTER*2,rng);assert.deepEqual(quiet.welcome_back,unread);
});

test('gentler hunger supports one compatible meal per day without changing limits or breeding odds',()=>{
 const s=E.createInitial(t);s.settings.demo=false;E.discover(s,'real_170','test',t,rng);const f=s.fish_instances[0];let first=[];
 for(let day=1;day<=5;day++){const at=t+day*24*E.HOUR;first.push(E.satietyAt(f,at));assert.ok(E.satietyAt(f,at)>=20);assert.ok(E.feed(s,at,E.displayRoom(f),'marine','plankton').ok);}
 assert.deepEqual(first,[46,57,68,76,76]);assert.equal(E.BREED_CHANCE,.3);assert.equal(E.MAX_PER_SPECIES,6);assert.equal(E.feedRemaining(s,E.displayRoom(f),'marine'),1);
 E.refreshGrowth(s,t+10*24*E.HOUR);assert.ok(s.fish_instances.includes(f),'there is never death from hunger');
});

test('unseen exploration entries have 1.5x weight without guaranteeing or changing the 80/15/5 split',()=>{
 const s=E.createInitial(t),pool=POOLS['open-ocean'],known=pool[0],unknown=pool[1];E.discover(s,known,'test',t,rng);
 assert.equal(E.explorationWeight(s,known),poolWeight(BY_ID[known]));assert.equal(E.explorationWeight(s,unknown),poolWeight(BY_ID[unknown])*1.5);
 assert.equal(E.weightedPick([known,unknown],()=>0,id=>E.explorationWeight(s,id)),known);
 assert.equal(E.weightedPick([known,unknown],()=>.999999,id=>E.explorationWeight(s,id)),unknown);
 for(const [roll,type] of [[.79,'fish'],[.80,'material'],[.95,'decor']]){const c=E.createInitial(t);c.exploration.has_explored=true;E.startExplore(c,'open-ocean',t);const r=E.finishExplore(c,t+30001,()=>roll);assert.equal(r.type,type);}
});

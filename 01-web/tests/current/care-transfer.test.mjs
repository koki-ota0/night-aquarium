import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../engine.js';
import {CATALOG,BY_ID} from '../../catalog.js';
import {careProfile,canEat,canServe,resolvedFood} from '../../care-profiles.js';
import {prepareImport,withRecovery,portableState} from '../../save-transfer.js';

const t=1700000000000, rng=()=>.5;

test('mixed feeding covers different diets in one tank without bypassing limits or salinity',()=>{
 const s=E.createInitial(t);
 for(const id of ['real_170','real_054','real_139','real_160'])E.discover(s,id,'test',t,rng,'reef');
 const reef=E.fishInTank(s,'reef','marine');assert.equal(reef.length,3);
 const result=E.feed(s,t,'reef','marine','auto');assert.equal(result.matched,3);assert.equal(result.fedUids.length,3);
 for(const f of reef){const sp=BY_ID[f.species_id],actual=result.foods[f.uid];assert.ok(canEat(sp,actual));assert.equal(f.care.last_food,actual);assert.ok(f.growth>=8);}
 assert.equal(s.fish_instances.find(f=>f.species_id==='real_160').growth,0,'environment species are not fed');
 assert.equal(E.feedRemaining(s,'reef','marine'),1);
 assert.ok(E.feed(s,t,'reef','marine','auto').ok);assert.equal(E.feed(s,t,'reef','marine','auto').reason,'limit');
});

test('every animal auto option resolves to a food that species can actually eat',()=>{
 for(const sp of CATALOG.filter(x=>x.kind!=='environment')){assert.ok(canServe(sp,'auto'),sp.name);assert.ok(canEat(sp,resolvedFood(sp,'auto')),sp.name);}
 assert.equal(canServe(BY_ID.real_160,'auto'),false);
});

test('breeding diagnostics follow the actual scope, pedigree, growth, hunger and cap rules',()=>{
 const s=E.createInitial(t);s.settings.demo=true;const bt=E.createBreedingTank(s,'reef','繁殖');
 const a=E.discover(s,'real_170','test',t,rng,bt.id),x=s.fish_instances.find(f=>f.uid===a.uid);
 const status=()=>E.breedingStatus(s,bt.id,'marine',t)[0];assert.equal(status().reason,'partner');
 const b=E.discover(s,'real_170','test',t,rng,bt.id),y=s.fish_instances.find(f=>f.uid===b.uid);y.sex=x.sex;assert.equal(status().reason,'sex');y.sex=x.sex==='male'?'female':'male';assert.equal(status().reason,'growth');
 x.growth=40;y.growth=40;y.parents=[x.uid];assert.equal(status().reason,'relatives');y.parents=[];assert.equal(status().reason,'ready');assert.ok(status().pair);
 y.care.satiety=19;y.care.satiety_at=t;assert.equal(status().reason,'hungry');y.care.satiety=70;
 for(let i=0;i<4;i++)E.discover(s,'real_170','test',t,rng,'reef');
 assert.equal(status().reason,'full');assert.equal(status().pair,null);
 assert.equal(E.breedingStatus(s,'reef','marine',t)[0].pair,null,'exhibit tanks do not breed in 2.14');
});

function validSave(){const s=E.createInitial(t);s.started=true;E.discover(s,'real_170','test',t,rng);s.fish_instances[0].nickname='こはく';s.pending=[];return s;}
test('portable save and one-deep recovery preserve original data without mutating the live save',()=>{
 const old=validSave(),incoming=E.createInitial(t);E.discover(incoming,'sp_055','test',t,rng);
 const oldBefore=structuredClone(old),inBefore=structuredClone(incoming),prepared=prepareImport(JSON.stringify(incoming),t);
 assert.equal(prepared.ok,true);assert.equal(prepared.version,'v5');assert.equal(prepared.fish,1);
 const next=withRecovery(prepared.state,old,t);assert.deepEqual(next.importRecovery.original,oldBefore);assert.deepEqual(old,oldBefore);assert.deepEqual(incoming,inBefore);
 const portable=portableState(next);assert.equal(portable.importRecovery,undefined);assert.equal(next.importRecovery.original.fish_instances[0].nickname,'こはく');
 const again=withRecovery(prepared.state,next,t+1);assert.equal(again.importRecovery.original.importRecovery,undefined,'repeated imports cannot recursively nest recovery points');
});

test('v4 and v3 files migrate on a clone; unknown ids are retained and counted',()=>{
 const prev=validSave();prev.schema_version=2;prev.game='yoru-aquarium-web-2';delete prev.fish_instances[0].care;delete prev.fish_instances[0].sex;delete prev.breeding;delete prev.daily.fed_by_tank;
 const before=structuredClone(prev),p=prepareImport(prev,t+1);assert.equal(p.ok,true);assert.equal(p.version,'v4');assert.deepEqual(prev,before);assert.deepEqual(p.state.previous.original,before);assert.ok(['male','female'].includes(p.state.fish_instances[0].sex));
 const old=structuredClone(prev);old.schema_version=1;old.game='yoru-aquarium-web-1';old.fish_instances[0].species_id='basic_01';old.dex.discovered=['basic_01'];old.dex.stages_recorded={basic_01:[0]};
 const oldBefore=structuredClone(old),v3=prepareImport(old,t+2);assert.equal(v3.ok,true);assert.equal(v3.version,'v3');assert.equal(v3.state.fish_instances[0].species_id,'legacy_basic_01');assert.deepEqual(old,oldBefore);assert.deepEqual(v3.state.legacy.original,oldBefore);
 const future=validSave();future.fish_instances[0].species_id='future_species_777';const u=prepareImport(future,t);assert.equal(u.ok,true);assert.equal(u.unknown,1);assert.equal(u.state.fish_instances[0].species_id,'future_species_777');
});

test('invalid or malicious files are rejected without altering their inputs',()=>{
 const good=validSave();const variants=[
  '{bad json',[],{},
  {...structuredClone(good),fish_instances:[null]},
  {...structuredClone(good),fish_instances:[good.fish_instances[0],good.fish_instances[0]]},
  {...structuredClone(good),fish_instances:[{...good.fish_instances[0],species_id:'__proto__'}]},
  {...structuredClone(good),pending:[{type:'award',threshold:'<img src=x onerror=alert(1)>'}]},
  {...structuredClone(good),legacy:{notice:true,originalDiscovered:'<img>'}},
  {...structuredClone(good),settings:'not settings'},
  {...structuredClone(good),fish_instances:[{...good.fish_instances[0],care:{...good.fish_instances[0].care,journal:'broken'}}]},
  {...structuredClone(good),pending:'will not be silently discarded'},
 ];
 for(const input of variants){const before=structuredClone(input);assert.equal(prepareImport(input,t).ok,false,JSON.stringify(input).slice(0,100));assert.deepEqual(input,before);}
});

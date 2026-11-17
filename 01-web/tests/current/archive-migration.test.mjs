import test from 'node:test';import assert from 'node:assert/strict';
import * as E from '../../engine.js';import {BY_ID,idOfScientific} from '../../catalog.js';
import {prepareImport,portableState,withRecovery,MAX_SAVED_INSTANCES} from '../../save-transfer.js';
const now=1700000000000;
function prior(){
 const s=E.createInitial(now);s.started=true;s.settings.demo_showcase=false;E.discover(s,idOfScientific('Paracheirodon innesi'),'test',now,()=>.4);const live=s.fish_instances[0];live.uid='old_real_uid';live.nickname='残すネオン';live.growth=25;
 const old={...structuredClone(live),uid:'old_fantasy_uid',species_id:'sp_039',nickname:'たいせつな旧個体',growth:68,size:1.13,custom_legacy_note:{memory:'保存する'}};s.fish_instances.push(old);
 const uncertain={...structuredClone(live),uid:'old_ambiguous_uid',species_id:'sp_030',nickname:'旧クマノミ',growth:52};s.fish_instances.push(uncertain);
 s.dex.discovered=['sp_014','sp_039','sp_030','sp_099','unknown_legacy_777'];s.dex.stages_recorded.sp_039=[0,1];s.dex.awards=[10,25];s.pending=[{type:'evolution',result:{ok:true,type:'fish',id:'sp_039',uid:'old_fantasy_uid'}},{type:'award',threshold:25}];
 s.breeding.timers['current|marine|sp_039']={male:'old_fantasy_uid',female:'old_ambiguous_uid',next_at:now+60000,interval:60000,demo:true,last_result:null};return s;
}
test('old v5 live, uncertain, fantasy and unknown species remain distinct without mutation',()=>{
 const input=prior(),before=structuredClone(input),result=prepareImport(input,now);assert.ok(result.ok,JSON.stringify(result));assert.deepEqual(input,before);const s=result.state;
 assert.equal(result.fish,3);assert.equal(result.discovered,1);assert.equal(result.archivedDiscovered,4);assert.equal(result.unknown,2);
 assert.deepEqual(E.archivedInstances(s),before.fish_instances.slice(1));assert.deepEqual(s.dex.discovered,before.dex.discovered);assert.deepEqual(s.dex.stages_recorded,before.dex.stages_recorded);assert.deepEqual(s.pending,before.pending);
 assert.deepEqual(s.breeding.timers,before.breeding.timers);assert.equal(BY_ID[s.fish_instances[1].species_id],undefined);assert.equal(s.fish_instances[0].species_id,'sp_014');
});
test('refresh, feeding, petting, room changes and portable export do not alter archived individuals or timers',()=>{
 const input=prior(),s=prepareImport(input,now).state,before=structuredClone(E.archivedInstances(s)),timers=structuredClone(s.breeding.timers);
 E.refresh(s,now+5*E.HOUR,()=>0);assert.deepEqual(E.archivedInstances(s),before);assert.deepEqual(s.breeding.timers,timers);
 assert.equal(E.pet(s,'old_fantasy_uid',now).reason,'missing');assert.equal(E.moveFish(s,'old_fantasy_uid','beach'),false);assert.equal(E.demoGrow(s,'old_fantasy_uid',now),false);
 const out=portableState(s);assert.deepEqual(out.fish_instances.slice(1),before);assert.deepEqual(prepareImport(JSON.stringify(out),now).state.fish_instances.slice(1),before);
});
test('v4 migration keeps a clone of the entire original; archived IDs never become a different species',()=>{
 const input=prior();input.schema_version=2;input.game='yoru-aquarium-web-2';delete input.breeding;delete input.daily.fed_by_tank;const before=structuredClone(input),out=prepareImport(input,now+100);
 assert.ok(out.ok);assert.equal(out.version,'v4');assert.deepEqual(input,before);assert.deepEqual(out.state.previous.original,before);assert.equal(out.state.fish_instances[1].species_id,'sp_039');assert.equal(out.state.fish_instances[2].species_id,'sp_030');
});
test('v3 migration retains the entire source and archives generic IDs instead of guessing',()=>{
 const old=prior();old.schema_version=1;old.game='yoru-aquarium-web-1';old.fish_instances=[{...old.fish_instances[1],species_id:'basic_01'}];old.dex.discovered=['basic_01'];old.dex.stages_recorded={basic_01:[0,1]};const before=structuredClone(old),out=prepareImport(old,now+100);
 assert.ok(out.ok);assert.equal(out.version,'v3');assert.deepEqual(out.state.legacy.original,before);assert.equal(out.state.fish_instances[0].species_id,'legacy_basic_01');assert.equal(E.currentDiscoveredCount(out.state),0);assert.equal(E.archivedDiscoveryCount(out.state),1);
});
test('explicit replacement has a one-deep recovery point and portable exports keep archive data',()=>{
 const old=prior(),newer=E.createInitial(now);E.discover(newer,idOfScientific('Orcinus orca'),'test',now,()=>.4);const next=withRecovery(newer,old,now);assert.deepEqual(next.importRecovery.original,old);const exported=portableState(next);assert.equal(exported.importRecovery,undefined);const restored=prepareImport(next.importRecovery.original,now);assert.ok(restored.ok);assert.deepEqual(E.archivedInstances(restored.state),E.archivedInstances(old));
});

test('archive + current catalog can exceed the old 1500 instance ceiling without blocking saves',()=>{
 const s=prior(),base=structuredClone(s.fish_instances[1]);
 s.fish_instances=Array.from({length:1601},(_,i)=>({...structuredClone(base),uid:`old_kept_${i}`}));
 const out=prepareImport(s,now);assert.ok(out.ok);assert.equal(out.fish,1601);assert.equal(out.unknown,1601);assert.equal(out.state.fish_instances[1600].uid,'old_kept_1600');
 s.fish_instances=Array.from({length:MAX_SAVED_INSTANCES+1},(_,i)=>({...base,uid:`too_many_${i}`}));assert.equal(prepareImport(s,now).ok,false);
});

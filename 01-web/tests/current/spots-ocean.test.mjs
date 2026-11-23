import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../engine.js';
import {CATALOG,DESTINATIONS,POOLS,compatibleRooms} from '../../catalog.js';
import {explorationPool,validExplorationSpot} from '../../exploration-spots.js';

test('six grouped exploration destinations cover all species',()=>{
 assert.deepEqual(DESTINATIONS.map(d=>d.id),['open-ocean','coastal','deep','river','lake','estuary']);
 for(const d of DESTINATIONS){assert.ok(explorationPool(d.id,null).length>0,d.id);assert.equal(validExplorationSpot(d.id,null),true);assert.equal(validExplorationSpot(d.id,'open'),false);}
 assert.equal(new Set(Object.values(POOLS).flat()).size,CATALOG.length);
 const s=E.createInitial(1000);assert.equal(E.startExplore(s,'coast',1000).ok,false);assert.equal(s.exploration.active,null);
 assert.ok(E.startExplore(s,'deep',1000).ok);
});
test('each species is offered only in a group corresponding to an appropriate habitat',()=>{
 const habitats={'open-ocean':['cold-sea','warm-sea','large-cold-sea','large-warm-sea'],coastal:['beach','reef','penguin','sea-lion'],deep:['deep'],river:['river','otter-room'],lake:['lake'],estuary:['estuary-tropical','estuary-north']};
 for(const [group,ids] of Object.entries(POOLS))for(const id of ids){const species=CATALOG.find(s=>s.id===id);assert.ok(compatibleRooms(species).some(r=>habitats[group].includes(r)),`${species.name} in ${group}`);}
});
test('2.15 in-progress destinations migrate and old fish remain unchanged',()=>{
 const map={'cold-sea':'open-ocean','warm-sea':'open-ocean','large-cold-sea':'open-ocean','large-warm-sea':'open-ocean',beach:'coastal',reef:'coastal','estuary-north':'estuary','estuary-tropical':'estuary'};
 for(const [old,current] of Object.entries(map)){const s=E.createInitial(1000);s.exploration.active={destination:old,started_at:1000,ends_at:5000,first:false,demo:true};const fish=structuredClone(s.fish_instances);const next=E.normalizeSave(s,2000);assert.equal(next.exploration.active.destination,current);assert.equal(next.exploration.active.ends_at,5000);assert.deepEqual(next.fish_instances,fish);}
});

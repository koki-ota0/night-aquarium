import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as THREE from 'three';
import {CATALOG} from '../../catalog.js';import {createSpeciesModel} from '../../species-models.js';import {MOTION_KEYS} from '../../motion-profiles.js';import {canServe} from '../../care-profiles.js';
const read=x=>JSON.parse(fs.readFileSync(new URL('../../data/expansion-216/'+x,import.meta.url),'utf8'));
test('curated candidate models are unique taxa, sourced, finite and integrated',()=>{
 const rows=read('curated-provisional.json'),ev=new Map(read('evidence.json').map(x=>[x.scientific,x]));assert.equal(rows.length,10);assert.equal(new Set(rows.map(x=>x.id)).size,rows.length);assert.equal(new Set(rows.map(x=>x.scientific)).size,rows.length);
 for(const sp of rows){assert.ok(CATALOG.some(x=>x.id===sp.id&&x.scientific===sp.scientific),sp.name);const tax=ev.get(sp.scientific).taxonomy;assert.deepEqual([tax.canonicalName,tax.status,tax.rank,tax.matchType],[sp.scientific,'ACCEPTED','SPECIES','EXACT']);assert.ok(sp.natural&&sp.feature&&sp.trivia&&sp.referenceUrl&&sp.referenceUnit&&sp.referenceCm>0);assert.ok(MOTION_KEYS.includes(sp.motion));assert.ok(canServe(sp,'auto'));const model=createSpeciesModel(sp);const size=new THREE.Box3().setFromObject(model.group).getSize(new THREE.Vector3());assert.ok([size.x,size.y,size.z].every(x=>Number.isFinite(x)&&x>0),sp.name);}
});
test('specialised candidate silhouettes are built',()=>{
 for(const name of ['Gigantura indica','Caulophryne jordani','Thunnus alalunga']){const sp=read('curated-provisional.json').find(x=>x.scientific===name),m=createSpeciesModel(sp);let found=false;m.group.traverse(o=>{if(o.name==='species-specific anatomy')found=true;});assert.ok(found,name);}
});

test('future 250 and 300 milestone saves remain importable without altering fish',async()=>{
 const E=await import('../../engine.js'),{prepareImport}=await import('../../save-transfer.js');const s=E.createInitial(1000),before=structuredClone(s.fish_instances);s.dex.awards=[250,300];s.pending=[{type:'award',threshold:250},{type:'award',threshold:300}];const r=prepareImport(s,1001);assert.ok(r.ok);assert.deepEqual(r.state.dex.awards,[250,300]);assert.deepEqual(r.state.fish_instances,before);
});

test('each new species has its proper tank, grouped exploration and stable save round-trip',async()=>{
 const E=await import('../../engine.js'),C=await import('../../catalog.js'),{prepareImport}=await import('../../save-transfer.js');const groups={deep:'deep',lake:'lake','estuary-tropical':'estuary','estuary-north':'estuary','cold-sea':'open-ocean'};
 for(const sp of read('curated-provisional.json')){const s=E.createInitial(1000),room=sp.candidateRooms[0];assert.deepEqual(C.compatibleRooms(sp),[room]);assert.ok(C.POOLS[groups[room]].includes(sp.id));const r=E.demoAdopt(s,sp.id,room,1000,()=>.5);assert.equal(r.type,'fish',sp.name);const saved=prepareImport(s,1100);assert.ok(saved.ok,sp.name);assert.equal(saved.state.fish_instances[0].species_id,sp.id);assert.equal(saved.state.fish_instances[0].room,room);}
});

test('synthetic 300-discovery save survives validation, including unknown future IDs',async()=>{
 const E=await import('../../engine.js'),{prepareImport}=await import('../../save-transfer.js');const s=E.createInitial(1000);s.dex.discovered=[...CATALOG.map(x=>x.id),...Array.from({length:300-CATALOG.length},(_,i)=>`future_test_${i}`)];s.dex.awards=[250,300];const r=prepareImport(s,1100);assert.ok(r.ok);assert.deepEqual(r.state.dex.discovered,s.dex.discovered);assert.deepEqual(r.state.dex.awards,[250,300]);
});

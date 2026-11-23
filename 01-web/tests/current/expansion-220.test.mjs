import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as THREE from 'three';
import * as E from '../../engine.js';import * as C from '../../catalog.js';import {createSpeciesModel} from '../../species-models.js';import {prepareImport} from '../../save-transfer.js';import {sampleMotion} from '../../motion-profiles.js';
const rows=JSON.parse(fs.readFileSync(new URL('../../data/expansion-216/curated-220.json',import.meta.url)));
test('seven reviewed jellies are unique, explorable, feedable and round-trip through saves',()=>{
 assert.equal(rows.filter(x=>x.shape==='moonJelly').length,7);for(const sp of rows.filter(x=>x.shape==='moonJelly')){const room=sp.candidateRooms[0],pool=room==='beach'?'coastal':'open-ocean';assert.ok(C.POOLS[pool].includes(sp.id),sp.name);const m=createSpeciesModel(sp),size=new THREE.Box3().setFromObject(m.group).getSize(new THREE.Vector3());assert.equal(m.kind,'jelly');assert.ok(size.x>0&&size.y>0&&size.z>0,sp.name);const s=E.createInitial(1000),r=E.demoAdopt(s,sp.id,room,1000,()=>.4);assert.equal(r.type,'fish');assert.ok(E.feed(s,1001,room,sp.water,'auto').fedUids.includes(r.uid));assert.ok(prepareImport(s,1200).ok);}
});
test('upside-down jelly has a stable bottom route and color jelly lacks long marginal tentacles',()=>{
 const up=rows.find(x=>x.design.jellyStyle==='upside'),blue=rows.find(x=>x.design.jellyStyle==='blubber');const f={uid:'bottom'};const a=sampleMotion(up,f,0),b=sampleMotion(up,f,30);assert.equal(up.motion,'sit');assert.equal(a.x,b.x);assert.ok(a.benthic);const model=createSpeciesModel(blue);assert.equal(model.parts.tentacles.length,8);
});

test('bottom species have dedicated models and belong to the correct exploration pool',()=>{
 for(const sp of rows.filter(s=>['isopod','gardenEel'].includes(s.shape))){const pool=sp.shape==='isopod'?'deep':'coastal';assert.ok(C.POOLS[pool].includes(sp.id));const model=createSpeciesModel(sp);const box=new THREE.Box3().setFromObject(model.group).getSize(new THREE.Vector3());assert.ok(box.x>0&&box.y>0&&box.z>0);assert.ok(sampleMotion(sp,{uid:'probe'},0).benthic);}
});

test('Japanese fresh-water animals are explorable and saved without changing older animals',()=>{
 for(const sp of rows.filter(s=>s.water==='fresh' && s.candidateRooms.includes('river'))){assert.ok(C.POOLS.river.includes(sp.id));let s=E.createInitial(1000);const r=E.demoAdopt(s,sp.id,'river',1000,()=>.4);assert.equal(r.type,'fish');assert.ok(E.feed(s,1001,'river','fresh','auto').fedUids.includes(r.uid));assert.ok(prepareImport(s,1200).ok);}
});

test('three semi-aquatic animals have independent compatible exhibits, exploration, and stable saves',()=>{
 for(const [shape,room,pool] of [['penguin','penguin','coastal'],['seaLion','sea-lion','coastal'],['smallOtter','otter-room','river']]){const sp=rows.find(s=>s.shape===shape);assert.deepEqual(C.compatibleRooms(sp),[room]);assert.ok(C.POOLS[pool].includes(sp.id));const s=E.createInitial(1000),r=E.demoAdopt(s,sp.id,room,1000,()=>.4);assert.equal(r.type,'fish');assert.ok(E.feed(s,1001,room,sp.water,'auto').fedUids.includes(r.uid));assert.ok(prepareImport(s,1200).ok);const size=new THREE.Box3().setFromObject(createSpeciesModel(sp).group).getSize(new THREE.Vector3());assert.ok(size.x>0&&size.y>0&&size.z>0);}
});

test('chambered nautilus has a shell model, exploration and compatible save',()=>{const sp=rows.find(s=>s.shape==='nautilus');assert.ok(C.POOLS.deep.includes(sp.id));assert.equal(createSpeciesModel(sp).parts.tentacles.length,12);const s=E.createInitial(1000),r=E.demoAdopt(s,sp.id,'deep',1000,()=>.4);assert.equal(r.type,'fish');assert.ok(prepareImport(s,1200).ok);});
test('every added species can be discovered normally, fed, partnered, bred in its own compatible exhibit and imported',()=>{
 for(const sp of rows){const room=sp.candidateRooms[0],s=E.createInitial(1700000000000),a=E.discover(s,sp.id,'test',1700000000001,()=>.2,room);assert.equal(a.type,'fish',sp.name);assert.equal(s.fish_instances[0].room,room);assert.ok(E.feed(s,1700000001000,room,sp.water,'auto').fedUids.includes(a.uid),sp.name);const mate=E.invitePartner(s,a.uid,1700000002000,()=>.8);assert.equal(mate.ok,true,sp.name);const tank=E.createBreedingTank(s,room,'繁殖');assert.ok(tank?.id,sp.name);assert.equal(E.moveFish(s,a.uid,tank.id),true,sp.name);assert.equal(E.moveFish(s,mate.uid,tank.id),true,sp.name);for(const f of s.fish_instances)f.growth=70;assert.equal(E.breedingPairs(s).length,1,sp.name);const loaded=prepareImport(s,1700000003000);assert.equal(loaded.ok,true,sp.name);assert.equal(loaded.state.fish_instances.length,2,sp.name);}
});

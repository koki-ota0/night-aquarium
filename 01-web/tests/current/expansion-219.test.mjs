import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as THREE from 'three';
import * as E from '../../engine.js';import * as C from '../../catalog.js';import {createSpeciesModel} from '../../species-models.js';import {canServe} from '../../care-profiles.js';import {prepareImport} from '../../save-transfer.js';import {sampleMotion} from '../../motion-profiles.js';
const rows=JSON.parse(fs.readFileSync(new URL('../../data/expansion-216/curated-219.json',import.meta.url)));
test('six documented additions are explorable, have distinct IDs and models, and survive care and save',()=>{
 assert.equal(rows.length,6);assert.deepEqual(rows.map(x=>x.candidateRooms[0]),['deep','deep','lake','lake','estuary-tropical','estuary-tropical']);
 for(const sp of rows){const room=sp.candidateRooms[0],pool=room==='estuary-tropical'?'estuary':room;assert.ok(C.POOLS[pool].includes(sp.id),sp.name);assert.deepEqual(C.compatibleRooms(sp),[room]);assert.ok(canServe(sp,'auto'));const box=new THREE.Box3().setFromObject(createSpeciesModel(sp).group).getSize(new THREE.Vector3());assert.ok([box.x,box.y,box.z].every(x=>Number.isFinite(x)&&x>0));let s=E.createInitial(1000);const r=E.demoAdopt(s,sp.id,room,1000,()=>.4);assert.equal(r.type,'fish');assert.ok(E.feed(s,1001,room,sp.water,'auto').fedUids.includes(r.uid));assert.ok(prepareImport(s,1200).ok);}
});
test('wider world makes roaming extend beyond the former limit and stay continuous',()=>{
 const sp=rows[0],fish={uid:'wide-probe'},opts={halfW:12,halfH:12,maxWidth:12,verticalScale:2,displayLength:1};let max=0,previous=sampleMotion(sp,fish,0,opts);
 for(let t=.1;t<100;t+=.1){const next=sampleMotion(sp,fish,t,opts);max=Math.max(max,Math.abs(next.x));assert.ok(Math.abs(next.x-previous.x)<.3);assert.ok(Math.abs(next.x)<12);previous=next;}
 assert.ok(max>5.1,`travel reaches ${max}`);
});

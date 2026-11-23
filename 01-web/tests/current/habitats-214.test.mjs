import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../engine.js';
import {CATALOG,POOLS,compatibleRooms} from '../../catalog.js';
import {prepareImport} from '../../save-transfer.js';
const bySci=n=>CATALOG.find(x=>x.scientific===n);
test('2.14 exploration destinations are individual habitats and reach all species',()=>{
 assert.equal(Object.keys(POOLS).length,6);assert.ok(POOLS.estuary.length>=4);assert.ok(POOLS['open-ocean'].length>9);
 assert.equal(new Set(Object.values(POOLS).flat()).size,CATALOG.length);
});
test('2.14 placement is restricted to compatible habitats',()=>{
 assert.deepEqual(compatibleRooms(bySci('Macropinna microstoma')),['deep']);
 assert.deepEqual(compatibleRooms(bySci('Rhincodon typus')),['large-warm-sea']);
 assert.deepEqual(compatibleRooms(bySci('Orcinus orca')),['large-cold-sea']);
 let s=E.createInitial(1000);s.settings.demo=true;s.settings.demo_showcase=true;
 const clown=bySci('Amphiprion ocellaris');const r=E.demoAdopt(s,clown.id,'reef',2000,()=>0.4);assert.equal(r.ok,true);
 const f=s.fish_instances.find(x=>x.uid===r.uid);assert.equal(E.moveFish(s,f.uid,'cold-sea'),false);assert.equal(E.moveFish(s,f.uid,'reef'),true);
});
test('2.14 tanks are unlimited and display pages hold at most 20',()=>{
 let s=E.createInitial(1000);s.settings.demo=true;s.settings.demo_showcase=true;
 for(const sp of CATALOG.filter(x=>compatibleRooms(x).includes('reef')).slice(0,30))E.discover(s,sp.id,'test',3000,()=>0.5,'reef');
 assert.ok(E.tankOccupancy(s,'reef')>=20);const pages=E.tankPages(s,'reef');assert.ok(pages.length>=2);assert.ok(pages.every(p=>p.length<=20));
});
test('2.14 breeding only happens in a created breeding tank',()=>{
 let s=E.createInitial(1000);s.settings.demo=true;s.settings.demo_showcase=true;
 const bt=E.createBreedingTank(s,'reef','繁殖テスト');assert.ok(bt);
 const sp=bySci('Amphiprion ocellaris');const a=E.discover(s,sp.id,'test',4000,()=>0.1,bt.id),b=E.discover(s,sp.id,'test',4000,()=>0.9,bt.id);
 const fa=s.fish_instances.find(x=>x.uid===a.uid),fb=s.fish_instances.find(x=>x.uid===b.uid);fa.sex='male';fb.sex='female';fa.growth=fb.growth=100;
 assert.equal(E.breedingPairs(s).length,1);
});
test('2.14 old sections migrate automatically to compatible rooms',()=>{
 let old=E.createInitial(1000);old.settings.demo=false;const whale=bySci('Rhincodon typus');
 old.fish_instances.push({uid:'f_old1',species_id:whale.id,stage:0,growth:0,size:1,hue_shift:0,affinity:0,room:'current',exhibit_section:'large',placed:true,light_seen:['moon'],obtained_at:1,growth_updated_at:1,sex:'female',care:{satiety:70,satiety_at:1,last_food:null,meals:0,journal:[]}});
 old.dex.discovered=[whale.id];const norm=E.normalizeSave(structuredClone(old),5000);
 assert.equal(norm.fish_instances[0].room,'large-warm-sea');assert.equal(prepareImport(old).ok,true);
});

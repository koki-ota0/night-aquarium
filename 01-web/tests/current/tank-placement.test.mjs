import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../engine.js';
import {CATALOG,compatibleRooms} from '../../catalog.js';
import {prepareImport} from '../../save-transfer.js';
const bySci=n=>CATALOG.find(x=>x.scientific===n);
test('2.14 placement rejects incompatible habitats and accepts compatible ones',()=>{
 const s=E.createInitial(1000);s.settings.demo=true;s.settings.demo_showcase=true;
 const deep=bySci('Macropinna microstoma');const r=E.discover(s,deep.id,'test',1000,()=>0.5,'deep');const f=s.fish_instances.find(x=>x.uid===r.uid);
 assert.equal(f.room,'deep');assert.equal(E.moveFish(s,f.uid,'warm-sea'),false);assert.equal(E.moveFish(s,f.uid,'deep'),true);
 assert.ok(prepareImport(s,2000).ok);
});
test('2.14 display pages partition owned fish with at most 20 per page',()=>{
 const s=E.createInitial(1000);
 for(const sp of CATALOG.filter(x=>compatibleRooms(x).includes('reef')&&x.kind!=='environment').slice(0,25))E.discover(s,sp.id,'test',1000,()=>0.5,'reef');
 const pages=E.tankPages(s,'reef');assert.equal(pages.flat().length,25);assert.ok(pages.every(p=>p.length<=20));assert.equal(pages.length,2);
 const uid=pages[0][0];assert.equal(E.assignFishPage(s,uid,'reef',1),true);assert.ok(E.tankPages(s,'reef')[1].includes(uid));
});
test('2.14 breeding tanks can be created up to five and host pairs',()=>{
 const s=E.createInitial(1000);
 for(let i=0;i<5;i++)assert.ok(E.createBreedingTank(s,'reef',`繁殖${i+1}`));
 assert.equal(E.createBreedingTank(s,'reef','六つ目'),null);
 assert.equal(s.breeding_tanks.length,5);
 const id=s.breeding_tanks[0].id;assert.equal(E.deleteBreedingTank(s,id),true);assert.equal(s.breeding_tanks.length,4);
});

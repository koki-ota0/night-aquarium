import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../engine.js';
import {CATALOG,compatibleRooms} from '../../catalog.js';
import {prepareImport} from '../../save-transfer.js';
test('new empty aquariums persist, receive fish, and survive save normalization',()=>{
 const s=E.createInitial(1000);s.settings.demo=true;
 assert.equal(E.addTankPage(s,'reef'),true);assert.deepEqual(E.tankPages(s,'reef'),[[],[]]);
 const sp=CATALOG.find(x=>x.kind!=='environment'&&compatibleRooms(x).includes('reef'));
 const r=E.discover(s,sp.id,'test',3000,()=>.5,'reef');
 assert.equal(E.assignFishPage(s,r.uid,'reef',1),true);assert.deepEqual(E.tankPages(s,'reef'),[[],[r.uid]]);
 const imported=prepareImport(structuredClone(s));assert.equal(imported.ok,true);
 const restored=E.normalizeSave(structuredClone(s),4000);assert.deepEqual(E.tankPages(restored,'reef'),[[],[r.uid]]);
 assert.equal(restored.fish_instances[0].uid,r.uid);
});
test('full target cannot drop the original fish or change an aquarium',()=>{
 const s=E.createInitial(1000);s.settings.demo=true;
 for(const sp of CATALOG.filter(x=>x.kind!=='environment'&&compatibleRooms(x).includes('reef')).slice(0,21))E.discover(s,sp.id,'test',3000,()=>.5,'reef');
 const pages=E.tankPages(s,'reef').map(a=>[...a]);assert.equal(pages[0].length,20);assert.equal(pages[1].length,1);
 assert.equal(E.assignFishPage(s,pages[1][0],'reef',0),false);assert.deepEqual(E.tankPages(s,'reef'),pages);
});

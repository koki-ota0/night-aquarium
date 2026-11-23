import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../engine.js';
import * as D from '../../demo-showcase.js';
import * as P from '../../progress.js';
import * as L from '../../decor-layout.js';
import {CATALOG,BY_ID,ROOMS,idOfScientific,roomSupports,preferredRoom,compatibleRooms} from '../../catalog.js';
import {prepareImport} from '../../save-transfer.js';
const t=1700000000000;
const id=name=>{const result=idOfScientific(name);assert.ok(result,name);return result;};
function add(s,name,room,n){const result=E.discover(s,id(name),'test',t+n,()=>.2+n*.001,room);assert.equal(result.type,'fish');return s.fish_instances.find(x=>x.uid===result.uid);}

test('2.14 eleven independent rooms match their water and all samples are accessible',()=>{
 const s=E.createInitial(t),before=structuredClone(s),samples=D.showcaseSamples(s);
 assert.equal(ROOMS.length,14);assert.deepEqual(ROOMS.map(r=>r.water),['marine','marine','marine','marine','marine','marine','marine','fresh','fresh','brackish','brackish','marine','marine','fresh']);
 assert.equal(samples.length,CATALOG.length);assert.equal(new Set(samples.map(x=>x.species_id)).size,CATALOG.length);
 for(const f of samples){const sp=BY_ID[f.species_id];assert.ok(compatibleRooms(sp).includes(f.room),sp.name);assert.ok(f.room.startsWith('estuary-')||roomSupports(f.room,E.waterGroup(sp)));assert.ok(D.waterDisplay(s,f.room,E.waterGroup(sp)).some(x=>x.uid===f.uid),sp.name);}
 for(const r of ROOMS)assert.equal(P.defaultWater(s,r.id),r.water);
 assert.equal(preferredRoom(BY_ID[id('Zostera marina')]),'beach');
 assert.equal(preferredRoom(BY_ID[id('Thunnus orientalis')]),'cold-sea');
 assert.ok(P.filterCatalog(s,{biome:'estuary-tropical'}).length>=1);
 assert.deepEqual(s,before);
});
test('2.14 tropical and northern brackish species live in separate rooms',()=>{
 const s=E.createInitial(t),archer=id('Toxotes jaculatrix'),flounder=id('Platichthys stellatus');
 const tropical=D.waterDisplay(s,'estuary-tropical','brackish'),north=D.waterDisplay(s,'estuary-north','brackish');
 assert.equal(tropical.length,15);assert.equal(tropical.filter(f=>f.species_id===archer).length,3);assert.equal(north.length,10);assert.ok(north.some(f=>f.species_id===flounder));
 const adopted=E.demoAdopt(s,archer,'estuary-tropical',t,()=>.5);assert.equal(adopted.type,'fish');assert.equal(D.showcaseSchool(s).length,0);assert.ok(prepareImport(s,t).ok);
 assert.ok(D.waterDisplay(s,'estuary-tropical','brackish').some(f=>f.uid===adopted.uid));
 let result=E.feed(s,t+5,'estuary-tropical','brackish','auto');assert.deepEqual(result.fedUids,[adopted.uid]);assert.equal(E.feedRemaining(s,'estuary-north','brackish'),2);
});
test('2.14 discoveries choose compatible rooms and moves reject incompatible habitats',()=>{
 const s=E.createInitial(t),fresh=BY_ID[id('Oryzias latipes')],brackish=BY_ID[id('Toxotes jaculatrix')],reef=BY_ID[id('Amphiprion ocellaris')];
 assert.equal(E.discoveryRoom(s,fresh),'river');assert.equal(E.discoveryRoom(s,brackish),'estuary-tropical');assert.equal(E.discoveryRoom(s,reef),'reef');
 const f=add(s,'Oryzias latipes','river',1),before=structuredClone(f);assert.equal(E.moveFish(s,f.uid,'deep'),false);assert.deepEqual(f,before);assert.equal(E.moveFish(s,f.uid,'lake'),true);assert.equal(f.room,'lake');
 const m=add(s,'Thunnus orientalis','cold-sea',2);assert.equal(E.moveFish(s,m.uid,'river'),false);assert.equal(E.moveFish(s,m.uid,'warm-sea'),false);assert.equal(m.room,'cold-sea');
 assert.ok(prepareImport(s,t+3).ok);
});
test('2.14 all room layout scopes are valid and round-trip',()=>{
 const s=E.createInitial(t);for(const r of ROOMS)for(const w of ['marine','fresh','brackish'])L.setDecorPosition(s,r.id,w,'plants',0,{x:1,z:1,rotation:0});
 const round=prepareImport(JSON.stringify(s),t);assert.equal(round.ok,true);assert.deepEqual(round.state.tank.layouts,s.tank.layouts);
});
test('2.14 old saved rooms migrate automatically without losing individuals',()=>{
 const s=E.createInitial(t);s.settings.demo_showcase=false;
 const tuna=add(s,'Thunnus orientalis','cold-sea',1);tuna.room='current';tuna.exhibit_section='warm';tuna.nickname='大切な子';
 const norm=E.normalizeSave(structuredClone(s),t+10);
 const moved=norm.fish_instances.find(f=>f.uid===tuna.uid);assert.equal(moved.room,'cold-sea');assert.equal(moved.nickname,'大切な子');assert.equal(moved.exhibit_section,undefined);
});

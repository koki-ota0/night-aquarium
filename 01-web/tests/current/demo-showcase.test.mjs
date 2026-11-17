import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../engine.js';
import * as Demo from '../../demo-showcase.js';
import * as P from '../../progress.js';
import {CATALOG,ROOMS,DESTINATIONS,BY_ID} from '../../catalog.js';
import {prepareImport,portableState} from '../../save-transfer.js';

const now=1700000000000;
test('demo tickets refill one at exactly five seconds, capped at three; normal mode remains three hours',()=>{
 const s=E.createInitial(now);s.exploration.stock=0;s.exploration.stock_updated_at=now;
 assert.equal(E.stockInterval(s),5000);assert.equal(E.nextStockMs(s,now),5000);
 assert.equal(E.refreshStock(s,now+4999),false);assert.equal(s.exploration.stock,0);
 assert.equal(E.refreshStock(s,now+5000),true);assert.equal(s.exploration.stock,1);
 assert.equal(E.refreshStock(s,now+10000),true);assert.equal(s.exploration.stock,2);
 assert.equal(E.refreshStock(s,now+15000),true);assert.equal(s.exploration.stock,3);
 E.refreshStock(s,now+50000);assert.equal(s.exploration.stock,3);
 s.settings.demo=false;assert.equal(E.stockInterval(s),3*E.HOUR);
});

test('all 200 demo entries and every room are available without adding or changing earned fish',()=>{
 const s=E.createInitial(now),initial=structuredClone(s),samples=Demo.showcaseSamples(s);
 assert.equal(samples.length,CATALOG.length);assert.equal(new Set(samples.map(f=>f.species_id)).size,CATALOG.length);assert.ok(samples.every(f=>f.showcase));
 assert.deepEqual(new Set(samples.map(f=>f.room)),new Set(ROOMS.map(x=>x.id)));
 for(const r of ROOMS)assert.equal(E.canEnterRoom(s,r.id),true,r.id);
 for(const d of DESTINATIONS)assert.equal(E.canExplore(s,d.id),true,d.id);
 for(const f of samples){assert.equal(f.room,Demo.showcaseRoom(BY_ID[f.species_id]));assert.ok(Demo.waterDisplay(s,f.room,E.waterGroup(BY_ID[f.species_id])).some(x=>x.uid===f.uid));}
 assert.deepEqual(s,initial,'the virtual showcase is read-only');
 assert.deepEqual(s.dex.discovered,[]);assert.deepEqual(s.fish_instances,[]);assert.ok(prepareImport(portableState(s)).ok);
});

test('demo preview excludes existing real fish, avoids UID collisions, and is removable without data loss',()=>{
 const s=E.createInitial(now),result=E.discover(s,'real_170','test',now,()=>.5);s.fish_instances[0].nickname='ほんもの';s.fish_instances[0].uid='showcase_sp_060';s.pending=[];
 const before=structuredClone(s),samples=Demo.showcaseSamples(s);assert.equal(samples.length,CATALOG.length-1);assert.ok(!samples.some(f=>f.species_id==='real_170'));
 assert.notEqual(samples.find(f=>f.species_id==='sp_060').uid,s.fish_instances[0].uid);
 assert.deepEqual(s,before);s.settings.demo_showcase=false;assert.equal(Demo.showcaseSamples(s).length,0);assert.equal(E.canEnterRoom(s,'deep'),false);assert.equal(E.canExplore(s,'deep'),false);
 assert.equal(s.fish_instances[0].nickname,'ほんもの');assert.equal(s.fish_instances[0].species_id,'real_170');
 s.settings.demo_showcase=true;s.settings.demo=false;assert.equal(Demo.showcaseSamples(s).length,0);assert.equal(E.canEnterRoom(s,'deep'),false);
});

test('showcase searches and size filters expose samples, but discovery filters count only real finds',()=>{
 const s=E.createInitial(now);E.discover(s,'real_170','test',now,()=>.5);s.pending=[];
 assert.ok(P.filterCatalog(s,{query:'シャチ'}).some(x=>x.id==='sp_060'));
 assert.ok(P.filterCatalog(s,{size:'giant',status:'unknown'}).some(x=>x.id==='sp_060'));
 assert.equal(P.filterCatalog(s,{status:'known'}).length,1);assert.equal(P.filterCatalog(s,{status:'unknown'}).length,CATALOG.length-1);
 assert.equal(P.filterCatalog(s,{size:'giant'}).length,21);assert.equal(P.filterCatalog(s,{size:'medium'}).length,82);assert.equal(P.filterCatalog(s,{size:'small'}).length,130);
 s.settings.demo_showcase=false;assert.deepEqual(P.filterCatalog(s,{query:'シャチ'}),[]);assert.deepEqual(P.filterCatalog(s,{size:'large'}),[]);
});

test('explicitly adopting a demo animal or environment adds only that individual, and normal mode cannot grant one',()=>{
 const s=E.createInitial(now),original=E.discover(s,'real_170','test',now,()=>.5);s.fish_instances[0].nickname='大切な子';s.pending=[];
 const result=E.demoAdopt(s,'sp_060','large-cold-sea',now,()=>.5);assert.equal(result.type,'fish');assert.equal(s.fish_instances.length,2);assert.equal(s.fish_instances[0].uid,original.uid);assert.equal(s.fish_instances[0].nickname,'大切な子');assert.ok(s.dex.discovered.includes('sp_060'));
 assert.equal(E.demoAdopt(s,'sp_060','large-cold-sea',now,()=>.5).reason,'owned');
 // A previously discovered environment with no remaining individual can be adopted, not converted to material.
 s.dex.discovered.push('real_160');const env=E.demoAdopt(s,'real_160','reef',now,()=>.5);assert.equal(env.type,'fish');assert.equal(s.fish_instances.find(f=>f.uid===env.uid).room,'reef');
 s.settings.demo=false;assert.equal(E.demoAdopt(s,'sp_058','reef',now,()=>.5).reason,'unavailable');assert.ok(prepareImport(s).ok);
});

test('a v2.5 save without the new setting imports with all original individuals intact',()=>{
 const s=E.createInitial(now),r=E.discover(s,'real_170','old',now,()=>.5);s.fish_instances[0].nickname='引き継ぎ';delete s.settings.demo_showcase;
 const result=prepareImport(s,now);assert.ok(result.ok);assert.equal(result.state.settings.demo_showcase,true);assert.equal(result.state.fish_instances[0].uid,r.uid);assert.equal(result.state.fish_instances[0].nickname,'引き継ぎ');assert.equal(result.state.dex.discovered.length,1);
});

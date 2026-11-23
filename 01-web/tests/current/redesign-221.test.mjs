import test from 'node:test';import assert from 'node:assert/strict';import {CATALOG,idOfScientific} from '../../catalog.js';import {dexGroup,compareDex,DEX_GROUPS} from '../../dex-order.js';import {createCreature} from '../../models.js';import {createSpeciesModel} from '../../species-models.js';import {createHabitats} from '../../habitats.js';import * as E from '../../engine.js';import {filterCatalog} from '../../progress.js';
const sp=n=>CATALOG.find(s=>s.scientific===n);
test('visitor categories are taxonomically appropriate and complete, ordered without mutating stable IDs or numbers',()=>{
 for(const [name,group] of [['Spheniscus magellanicus','bird'],['Zalophus californianus','mammal'],['Amblonyx cinereus','mammal'],['Andrias japonicus','amphibian'],['Heteroconger hassi','fish'],['Chrysaora pacifica','jelly'],['Cassiopea ornata','jelly'],['Bathynomus giganteus','invertebrate-mobile'],['Nautilus pompilius','invertebrate-mobile'],['Patiria pectinifera','invertebrate-mobile'],['Halocynthia roretzi','invertebrate-attached'],['Zostera marina','plant']])assert.equal(dexGroup(sp(name)),group,name);
 const old=CATALOG.map(x=>[x.id,x.number]),sorted=[...CATALOG].sort(compareDex);assert.deepEqual(CATALOG.map(x=>[x.id,x.number]),old);assert.equal(new Set(sorted.map(x=>x.id)).size,CATALOG.length);assert.ok(sorted.every(x=>DEX_GROUPS.some(g=>g.id===dexGroup(x))&&dexGroup(x)!=='other'));
 const indices=sorted.map(x=>DEX_GROUPS.findIndex(g=>g.id===dexGroup(x)));assert.deepEqual(indices,[...indices].sort((a,b)=>a-b));
 const s=E.createInitial(1000);for(const x of [sp('Cassiopea ornata'),sp('Spheniscus magellanicus')])assert.equal(filterCatalog(s,{query:String(x.number)})[0]?.id,x.id);
});
test('new jellies share the established solid bell voxel foundation yet preserve the species-specific silhouettes',()=>{
 const base=createCreature('jelly'),count=base.parts.bell.children.find(x=>x.isInstancedMesh).count;
 for(const x of CATALOG.filter(s=>s.design?.jellyStyle)){const m=createSpeciesModel(x);assert.equal(m.parts.bell.children.find(x=>x.isInstancedMesh).count,count,x.name);assert.equal(m.kind,'jelly');}
 assert.equal(createSpeciesModel(sp('Catostylus mosaicus')).parts.tentacles.length,8);const inverted=createSpeciesModel(sp('Cassiopea ornata'));assert.equal(inverted.group.children[0].rotation.z,Math.PI);
});
test('three exhibits have different species-specific features and independently visible scenery',()=>{
 const h=createHabitats();const expected=[['penguin','penguin nest burrow and coastal approach'],['sea-lion','sea lion rocky haulout dock and kelp'],['otter-room','otter den roots reeds and river stones']];for(const [id,name] of expected){assert.ok(h[id].children.some(x=>x.name===name),id);assert.ok(h[id].children.some(x=>x.name==='bank and waterline'));}
});

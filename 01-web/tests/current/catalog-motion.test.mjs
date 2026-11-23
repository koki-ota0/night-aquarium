import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {CATALOG,BY_ID,ARCHIVE_BY_ID,EVOLUTIONS,POOLS,DESTINATIONS,idFor,idOfScientific,poolWeight} from '../../catalog.js';
import {sizeClass,sizeClassLabel,visualLength,visualIndividualScale,classifyReferenceCm,SIZE_CLASSES} from '../../size-classes.js';
import {motionProfile,sampleMotion,MOTION_KEYS} from '../../motion-profiles.js';
import {createSpeciesModel} from '../../species-models.js';
import {careProfile,canEat,canServe} from '../../care-profiles.js';
import * as E from '../../engine.js';
import * as P from '../../progress.js';
const read=file=>JSON.parse(fs.readFileSync(new URL('../../'+file,import.meta.url),'utf8'));
const species=name=>BY_ID[idOfScientific(name)];
const t=1700000000000,rng=()=>.25;

test('the catalogue has unique accepted, documented real species and no evolutions',()=>{
 const taxonomy=read('data/gbif-taxonomy-2026-11-03.json'),refs=read('data/species-reference-extracts-2026-11-03.json');
 assert.equal(CATALOG.length,296);assert.equal(EVOLUTIONS.length,0);assert.equal(CATALOG.filter(s=>s.kind==='environment').length,14);assert.equal(CATALOG.filter(s=>s.kind==='basic').length,282);
 for(const field of ['id','scientific','name','number'])assert.equal(new Set(CATALOG.map(s=>s[field])).size,CATALOG.length,field);
 assert.deepEqual(CATALOG.map(s=>s.number),Array.from({length:CATALOG.length},(_,i)=>i+1));
 const staged=read('data/expansion-216/evidence.json');for(const s of CATALOG){const info=staged.find(x=>x.scientific===s.scientific);const t=taxonomy[s.scientific]||info?.taxonomy,r=refs[s.scientific]||(info?{usable:!!info.environment}:null);assert.ok(t&&r?.usable,s.name);assert.deepEqual([t.canonicalName,t.status,t.rank,t.matchType],[s.scientific,'ACCEPTED','SPECIES','EXACT']);assert.match(s.referenceUrl,/^https?:\/\//);assert.match(s.taxonomyUrl,/^https:\/\/www.gbif.org\/species\//);assert.ok(s.natural&&s.feature&&s.motionLabel);assert.ok(MOTION_KEYS.includes(s.motion),`${s.name}: missing motion ${s.motion}`);assert.equal(idFor(s.number),s.id);assert.equal(idOfScientific(s.scientific),s.id);}
});

test('corrected Japanese names are attached to their own scientific species, not recycled old IDs',()=>{
 for(const [name,japanese] of [['Chaetodon auriga','トゲチョウチョウウオ'],['Chaetodon lunula','チョウハン'],['Chaetodon trifascialis','ヤリカタギ'],['Chaetodon kleinii','ミゾレチョウチョウウオ'],['Chaetodon vagabundus','フウライチョウチョウウオ'],['Pterois antennata','ネッタイミノカサゴ'],['Valenciennea puellaris','オトメハゼ'],['Thalassoma lunare','オトメベラ'],['Melanocetus johnsonii','ペリカンアンコウ'],['Potamotrygon motoro','ポタモトリゴン・モトロ']])assert.equal(species(name).name,japanese);
 for(const id of ['sp_001','sp_002','sp_030','sp_039','sp_057','sp_090']){assert.equal(BY_ID[id],undefined,id);assert.ok(ARCHIVE_BY_ID[id],id);}
 assert.equal(species('Amphiprion clarkii').id,'real_170');assert.equal(species('Paracheirodon innesi').id,'sp_014');
});

test('all 200 entries are reachable by the 11 exploration pools and have positive weights',()=>{
 const ids=Object.values(POOLS).flat();assert.equal(new Set(ids).size,CATALOG.length);assert.deepEqual([...new Set(ids)].sort(),CATALOG.map(s=>s.id).sort());
 for(const d of DESTINATIONS){assert.ok(POOLS[d.id].length>0);for(const id of POOLS[d.id])assert.ok(poolWeight(BY_ID[id])>0,id);assert.equal(E.weightedPick(POOLS[d.id],()=>0),POOLS[d.id][0]);assert.equal(E.weightedPick(POOLS[d.id],()=>.999999),POOLS[d.id].at(-1));}
});

test('all 190 animal diet profiles are actionable; environment never feeds',()=>{
 for(const s of CATALOG){if(s.kind==='environment'){assert.equal(canServe(s,'auto'),false);continue;}assert.ok(s.food.length>0,s.name);assert.ok(canEat(s,careProfile(s).favorite),s.name);assert.ok(canServe(s,'auto'),s.name);assert.ok(s.referenceCm>0&&s.referenceUnit);}
});

test('200 individual models have finite nonzero 3D bounds, and moving parts follow silhouette families',()=>{
 for(const s of CATALOG){const model=createSpeciesModel(s);assert.ok(model.group.children.length,s.name);assert.equal(model.group.userData.speciesId,s.id);const b=new THREE.Box3().setFromObject(model.group),v=b.getSize(new THREE.Vector3());assert.ok([v.x,v.y,v.z].every(Number.isFinite),s.name);assert.ok(Math.max(v.x,v.y,v.z)>.01,s.name);}
 assert.equal(createSpeciesModel(species('Mobula birostris')).parts.wings.length,2);
 assert.equal(createSpeciesModel(species('Lagenorhynchus obliquidens')).parts.flippers.length,2);
 assert.ok(createSpeciesModel(species('Thunnus orientalis')).parts.tail);
 assert.ok(createSpeciesModel(species('Aurelia coerulea')).parts.bell);
});

test('all 200 thumbnails are embedded, uniquely keyed images',()=>{
 const thumbs=read('model-thumbs.json'),images=CATALOG.map(s=>thumbs[s.id]);assert.equal(Object.keys(thumbs).length,CATALOG.length);assert.ok(images.every(x=>/^data:image\/webp;base64,/.test(x)));assert.equal(new Set(images).size,CATALOG.length);
});

test('five size bands consistently follow each species reference dimension',()=>{
 const counts=Object.fromEntries(Object.keys(SIZE_CLASSES).map(k=>[k,CATALOG.filter(s=>sizeClass(s)===k).length]));assert.deepEqual(counts,{small:130,medium:82,large:44,giant:21,colossal:5});
 for(const [cm,category] of [[.1,'small'],[29.999,'small'],[30,'medium'],[99.999,'medium'],[100,'large'],[299.999,'large'],[300,'giant'],[799.999,'giant'],[800,'colossal'],[2500,'colossal']])assert.equal(classifyReferenceCm(cm),category,cm);
 assert.equal(classifyReferenceCm(0),null);assert.equal(classifyReferenceCm(NaN),null);
 assert.equal(sizeClass(species('Amphiprion clarkii')),'small');assert.equal(sizeClass(species('Thunnus orientalis')),'large');assert.equal(sizeClass(species('Heterodontus japonicus')),'large');assert.equal(sizeClass(species('Lagenorhynchus obliquidens')),'large');assert.equal(sizeClass(species('Orcinus orca')),'giant');assert.equal(sizeClass(species('Balaenoptera musculus')),'colossal');assert.equal(sizeClassLabel(species('Entacmaea quadricolor')),'環境種');
 for(const sp of CATALOG.filter(s=>s.kind!=='environment'))assert.equal(sizeClass(sp),classifyReferenceCm(sp.referenceCm),sp.name);
});

test('display scale is continuous and monotone, separates major examples, and compresses giant whales',()=>{
 const sorted=CATALOG.filter(s=>s.kind!=='environment').sort((a,b)=>a.referenceCm-b.referenceCm);
 for(let i=1;i<sorted.length;i++)assert.ok(visualLength(sorted[i])>=visualLength(sorted[i-1])-1e-12,sorted[i].name);
 for(const boundary of [30,100,300,800]){const a=visualLength({referenceCm:boundary-.0001}),b=visualLength({referenceCm:boundary+.0001});assert.ok(Math.abs(a-b)<.0001,'no boundary jump '+boundary);}
 const clown=visualLength(species('Amphiprion clarkii')),shark=visualLength(species('Heterodontus japonicus')),tuna=visualLength(species('Thunnus orientalis')),orca=visualLength(species('Orcinus orca')),whale=visualLength(species('Balaenoptera musculus'));
 assert.ok(tuna>shark*1.9);assert.ok(orca>tuna*1.5);assert.ok(whale>orca*1.45);assert.ok(whale/tuna<(2500/250)/3);assert.ok(clown>.7&&whale<=8.80);
 const baby=visualIndividualScale({size:.85,growth:0,parents:['a','b']}),adult=visualIndividualScale({size:1.15,growth:100});assert.ok(shark*baby>clown*adult*1.5);
 const stored={size:10,growth:0};assert.equal(visualIndividualScale(stored),1.05);assert.equal(stored.size,10);
});

test('additional reference-size checks match the catalogue and describe different measurement parts',()=>{
 const audit=read('data/size-reference-review-2026-11-03.json');assert.equal(audit.selected_checks.length,10);
 for(const x of audit.selected_checks){const s=species(x.scientific);assert.ok(s,x.scientific);assert.equal(s.referenceCm,x.game_reference_cm,x.scientific);assert.match(x.source,/^https:\/\//);}
 assert.equal(species('Portunus trituberculatus').referenceUnit,'甲幅');assert.equal(species('Macrocheira kaempferi').referenceUnit,'脚を広げた幅');assert.equal(species('Mastigias papua').referenceUnit,'傘の直径');assert.equal(species('Octopus cyanea').referenceUnit,'全長（腕を含む）');
});

test('behaviours are distinctive, bounded, smooth and deterministic for every species',()=>{
 for(const s of CATALOG){const f={uid:'probe_'+s.id};let last=null;for(let time=0;time<=25;time+=.25){const a=sampleMotion(s,f,time);assert.ok([a.x,a.y,a.z,a.dx].every(Number.isFinite),s.name);assert.ok(Math.abs(a.x)<=5.1&&a.y>=-4.2&&a.y<=4.1,s.name);if(last)assert.ok(Math.hypot(a.x-last.x,a.y-last.y,a.z-last.z)<1.5,s.name);last=a;}assert.deepEqual(sampleMotion(s,f,8),sampleMotion(s,f,8));}
 const fast=species('Thunnus orientalis'),rest=species('Orectolobus japonicus'),slug=species('Chromodoris annae'),jelly=species('Aurelia coerulea'),squid=species('Watasenia scintillans');
 assert.ok(motionProfile(fast).speed>motionProfile(slug).speed*5);assert.equal(motionProfile(rest).speed,0);assert.ok(motionProfile(rest).resting&&motionProfile(slug).benthic);assert.ok(motionProfile(jelly).vertical>1);assert.notEqual(motionProfile(squid),motionProfile(jelly));
 const range=(s,k)=>{const pts=Array.from({length:301},(_,i)=>sampleMotion(s,{uid:'same'},i/5)[k]);return Math.max(...pts)-Math.min(...pts)};
 assert.ok(range(fast,'x')>range(slug,'x'));assert.ok(range(jelly,'y')>range(slug,'y')*20);assert.equal(range(rest,'x'),0);
});

test('search and five size filters distinguish unknowns without modifying state',()=>{
 const s=E.createInitial(t),before=structuredClone(s);assert.equal(P.filterCatalog(s,{size:'giant'}).length,21);assert.ok(P.filterCatalog(s,{query:'シャチ'}).some(a=>a.scientific==='Orcinus orca'));assert.deepEqual(s,before);
 s.settings.demo_showcase=false;assert.deepEqual(P.filterCatalog(s,{query:'シャチ'}),[]);assert.deepEqual(P.filterCatalog(s,{size:'giant'}),[]);
 E.discover(s,idOfScientific('Orcinus orca'),'test',t,rng);assert.equal(P.filterCatalog(s,{size:'giant'}).length,1);assert.equal(P.filterCatalog(s,{query:'００１'}).length,1);
});

test('first exploration guarantees a real clownfish and awards depend only on current species',()=>{
 const s=E.createInitial(t);s.dex.discovered=['sp_030','sp_039','legacy_basic_01'];assert.equal(E.currentDiscoveredCount(s),0);assert.equal(E.archivedDiscoveryCount(s),3);
 assert.ok(E.startExplore(s,'open-ocean',t).ok);const r=E.refresh(s,t+30000,rng).result;assert.equal(r.id,idOfScientific('Amphiprion clarkii'));assert.equal(E.currentDiscoveredCount(s),1);assert.equal(s.fish_instances.length,1);
 for(const x of CATALOG.slice(1,10))E.discover(s,x.id,'test',t+30000,rng);assert.equal(E.currentDiscoveredCount(s),10);assert.ok(s.dex.awards.includes(10));
});

test('reviewed habitat and distinctive locomotion overrides are not lost during generation',()=>{
 const get=n=>BY_ID[idOfScientific(n)];
 assert.match(get('Trachemys scripta').natural,/北アメリカ/);assert.match(get('Hemicentrotus pulcherrimus').natural,/日本周辺/);
 assert.match(get('Enhydra lutris').natural,/沿岸/);assert.doesNotMatch(get('Enhydra lutris').natural,/深い海/);
 assert.match(get('Phoca vitulina').natural,/沿岸/);assert.doesNotMatch(get('Phoca vitulina').natural,/深い海/);
 assert.match(get('Phycodurus eques').natural,/オーストラリア南部/);assert.equal(get('Phycodurus eques').motion,'hover');
 assert.match(get('Mobula birostris').natural,/外洋/);assert.match(get('Balaenoptera musculus').natural,/世界各地/);
});
test('special anatomy remains distinct for whales, leatherbacks, eels and sea stars',()=>{
 const get=n=>createSpeciesModel(BY_ID[idOfScientific(n)]);
 const find=(m,fragment)=>{let found=false;m.group.traverse(o=>{if(o.name.includes(fragment))found=true;});return found;};
 assert.ok(find(get('Megaptera novaeangliae'),'baleen whale'));assert.ok(find(get('Balaenoptera musculus'),'baleen whale'));
 assert.ok(find(get('Dermochelys coriacea'),'ridged shell'));assert.ok(find(get('Eurypharynx pelecanoides'),'pouch mouth'));assert.ok(find(get('Lophius litulon'),'flattened benthic head'));
 assert.ok(find(get('Acanthaster planci'),'many-armed'));assert.ok(find(get('Linckia laevigata'),'five-armed'));
});

test('checked-in catalogue matches all 200 curated identities, shape, movement and appearance',()=>{
 const lines=fs.readFileSync(new URL('../../data/real-species-curation.tsv',import.meta.url),'utf8').split(/\r?\n/).filter(x=>x&&!x.startsWith('#'));
 assert.equal(lines.length,200);
 for(let i=0;i<lines.length;i++){
  const [id,name,scientific,zone,shape,motion,size,cm,color,pattern,accent,feature]=lines[i].split('|'),sp=CATALOG[i];
  assert.deepEqual([sp.id,sp.name,sp.scientific,sp.shape,sp.motion,sp.design.pattern],[id,name,scientific,shape,motion,pattern]);
  if(!['Heterodontus japonicus','Rhincodon typus','Mobula birostris','Pterois lunulata','Chromodoris annae'].includes(scientific))assert.equal(sp.feature,feature+'。');else assert.ok(sp.feature.length>5);
  assert.equal(sp.tint,parseInt(color,16));assert.equal(sp.design.accent,parseInt(accent,16));assert.equal(sp.sizeClass,size==='env'?null:size);if(size!=='env')assert.equal(sp.referenceCm,Number(cm));
 }
});

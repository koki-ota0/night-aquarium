import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {CATALOG,BY_ID,LEGACY_CATALOG} from '../catalog.js';
import {createSpeciesModel} from '../species-models.js';
import * as E from '../engine.js';
import * as P from '../progress.js';
import {SIZE_CLASSES,sizeClass,sizeClassLabel,visualLength,visualIndividualScale} from '../size-classes.js';

const expected={
 small:[11,13,14,15,18,19,22,23,24,25,26,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,61,62,77,84,87,88,91,92,93,94,95,99,100],
 medium:[12,17,20,21,28,29,56,58,67,70,71,74,75,76,79,80,81,82,83,89,90,96,97],
 large:[16,27,54,55,57,59,60,63,64,65,66,68,69,72,73,78,85,86,98]
};

test('all 100 official entries have the intended size or are explicitly excluded as environment',()=>{
 for(const [category,numbers] of Object.entries(expected)){
  assert.deepEqual(CATALOG.filter(s=>sizeClass(s)===category).map(s=>s.number),numbers,category);
 }
 assert.deepEqual(CATALOG.filter(s=>sizeClass(s)===null).map(s=>s.number),[1,2,3,4,5,6,7,8,9,10]);
 assert.equal(sizeClassLabel(BY_ID.sp_030),'小型');assert.equal(sizeClassLabel(BY_ID.sp_058),'中型');
 assert.equal(sizeClassLabel(BY_ID.sp_070),'中型');assert.equal(sizeClassLabel(BY_ID.sp_054),'大型');
 assert.equal(sizeClassLabel(BY_ID.sp_055),'大型');assert.equal(sizeClassLabel(BY_ID.sp_059),'大型');
 assert.equal(sizeClassLabel(BY_ID.sp_001),'環境種');
});

test('the example species have visibly different normalized lengths, with smaller within-class gradation',()=>{
 const small=visualLength(BY_ID.sp_030),medium=visualLength(BY_ID.sp_058),large=visualLength(BY_ID.sp_054);
 assert.ok(medium/small>1.7&&medium/small<2);assert.ok(large/medium>1.5);assert.ok(large/small>2.7&&large/small<3.2);
 assert.ok(visualLength(BY_ID.sp_011)<small);assert.ok(visualLength(BY_ID.sp_060)>visualLength(BY_ID.sp_057));
 for(const s of CATALOG.filter(s=>s.kind!=='environment')){
  const value=visualLength(s),band=SIZE_CLASSES[sizeClass(s)];assert.ok(value>=band.minLength-1e-12&&value<=band.maxLength+1e-12,s.name);
 }
});

test('normal +/-15 percent and birth growth never reverse the three categories within one tank page',()=>{
 const lengths=Object.fromEntries(Object.keys(expected).map(key=>[key,CATALOG.filter(s=>sizeClass(s)===key).map(visualLength)]));
 const minBaby=key=>Math.min(...lengths[key]) * visualIndividualScale({size:.85,growth:0,parents:['p1','p2']});
 const maxAdult=key=>Math.max(...lengths[key]) * visualIndividualScale({size:1.15,growth:100});
 assert.ok(minBaby('medium')>maxAdult('small'));assert.ok(minBaby('large')>maxAdult('medium'));
 assert.equal(visualIndividualScale({size:1,parents:['p1','p2'],growth:0}),.9);
 assert.equal(visualIndividualScale({size:1,parents:['p1','p2'],growth:100}),1);
 const old={size:10,growth:0,parents:[]},before=structuredClone(old);
 assert.equal(visualIndividualScale(old),1.15);assert.deepEqual(old,before,'old save is not rewritten');
 assert.equal(visualIndividualScale({size:.05}),.85);assert.equal(visualIndividualScale({}),1);
});

test('actual 3D bounding boxes normalize correctly for every official and legacy animal model',()=>{
 for(const sp of [...CATALOG.filter(s=>s.kind!=='environment'),...LEGACY_CATALOG]){
  const group=createSpeciesModel(sp).group;
  const dimensions=()=>new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());
  let d=dimensions(),major=Math.max(d.x,d.y,d.z,.001);assert.ok(Number.isFinite(major)&&major>0,sp.id);
  group.scale.multiplyScalar(visualLength(sp)/major);d=dimensions();major=Math.max(d.x,d.y,d.z);
  assert.ok(Math.abs(major-visualLength(sp))<1e-7,`${sp.id} ${sp.name}: ${major} vs ${visualLength(sp)}`);
 }
});

test('legacy models receive a display-only category based on preserved silhouettes',()=>{
 assert.equal(LEGACY_CATALOG.length,93);
 assert.equal(LEGACY_CATALOG.filter(s=>sizeClass(s)==='small').length,83);
 assert.equal(LEGACY_CATALOG.filter(s=>sizeClass(s)==='medium').length,10);
 assert.equal(LEGACY_CATALOG.filter(s=>sizeClass(s)===null).length,0);
 assert.equal(sizeClass({kind:'legacy',shape:'legacy',model:'unknown'}),null);
 assert.equal(sizeClassLabel({kind:'legacy',shape:'legacy',model:'unknown'}),'未設定');
});

test('size filters work with searches and never reveal undiscovered entries or environment species',()=>{
 const now=1700000000000,s=E.createInitial(now),rng=()=>.5;s.settings.demo_showcase=false;
 for(const id of ['sp_030','sp_058','sp_054','sp_001'])E.discover(s,id,'test',now,rng);
 const before=structuredClone(s);
 assert.deepEqual(P.filterCatalog(s,{size:'small'}).map(x=>x.id),['sp_030']);
 assert.deepEqual(P.filterCatalog(s,{size:'medium'}).map(x=>x.id),['sp_058']);
 assert.deepEqual(P.filterCatalog(s,{size:'large'}).map(x=>x.id),['sp_054']);
 assert.deepEqual(P.filterCatalog(s,{size:'large',query:'#60'}),[],'unknown orca must not leak through its size');
 assert.deepEqual(P.filterCatalog(s,{size:'large',status:'unknown'}),[]);
 assert.deepEqual(P.filterCatalog(s,{size:'small',biome:'淡水'}),[]);
 assert.deepEqual(P.filterCatalog(s,{size:'large',query:'カマ'}).map(x=>x.id),['sp_054']);
 assert.equal(P.filterCatalog(s,{size:'all'}).length,100);assert.deepEqual(s,before);
});

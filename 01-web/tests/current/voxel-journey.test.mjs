import test from 'node:test';
import assert from 'node:assert/strict';
import {VOYAGE_WORLDS,journeyShipPose} from '../../voxel-journey-scene.js';
import {BY_ID,idOfScientific} from '../../catalog.js';
import * as E from '../../engine.js';

test('four voxel worlds use existing real animals from their own destination',()=>{
 const keys=Object.keys(VOYAGE_WORLDS);assert.deepEqual(keys,['coast','fresh','reef','deep']);
 const all=[];
 for(const key of keys){const world=VOYAGE_WORLDS[key];assert.equal(world.animals.length,3);
  for(const scientific of world.animals){const id=idOfScientific(scientific),species=BY_ID[id];assert.ok(species,scientific);assert.notEqual(species.kind,'environment');assert.equal(species.location,key,scientific);all.push(scientific);}
 }
 assert.equal(new Set(all).size,12);
});

test('the submarine has a continuous outward and return route derived from progress',()=>{
 const start=journeyShipPose(0),out=journeyShipPose(.2),search=journeyShipPose(.75),home=journeyShipPose(1);
 assert.equal(start.stage,0);assert.equal(out.stage,1);assert.equal(search.stage,2);
 assert.ok(start.x<out.x&&out.x<search.x&&home.x<search.x);assert.equal(start.x,home.x);
 for(const transition of [.2,.75]){
  const a=journeyShipPose(transition-1e-6),b=journeyShipPose(transition+1e-6);
  assert.ok(Math.abs(a.x-b.x)<.0001,`route should not jump at ${transition}`);
  assert.ok(Math.abs(a.heading-b.heading)<.0002,`turn should not jump at ${transition}`);
 }
 for(let i=0;i<=100;i++){const p=journeyShipPose(i/100,3);assert.ok(p.x>=-1.1-1e-10&&p.x<=.77+1e-10);}
 assert.equal(journeyShipPose(-1).x,start.x);assert.equal(journeyShipPose(2).x,home.x);assert.equal(journeyShipPose(NaN).x,start.x);
 assert.notEqual(journeyShipPose(.4,0).y,journeyShipPose(.4,2).y,'normal motion bobs');
});

test('reduced motion freezes the diorama while retaining the actual phase',()=>{
 const a=journeyShipPose(.1,0,true),b=journeyShipPose(.9,100,true);
 assert.equal(a.x,b.x);assert.equal(a.y,b.y);assert.equal(a.heading,b.heading);assert.equal(a.tilt,b.tilt);
 assert.equal(a.stage,0);assert.equal(b.stage,2);
});

test('voxel presentation is independent of game save, timing and rewards',()=>{
 for(const dest of ['open-ocean','river','coastal','deep']){
  const s=E.createInitial(1000);assert.ok(E.startExplore(s,dest,1000).ok);const before=structuredClone(s);
  for(let f=0;f<=1;f+=.01)journeyShipPose(f,f*30);
  assert.deepEqual(s,before);
 }
});

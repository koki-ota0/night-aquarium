import test from 'node:test';
import assert from 'node:assert/strict';
import {feedingFrame,FEEDING_DURATION} from '../../feeding-effects.js';
import * as E from '../../engine.js';
import {idOfScientific} from '../../catalog.js';

test('the meal presentation follows fall, approach, bite and return without mutating game state',()=>{
 const s=E.createInitial(1000),r=E.discover(s,idOfScientific('Amphiprion clarkii'),'test',1000,()=>.4),before=structuredClone(s);
 const start=feedingFrame(0),fall=feedingFrame(.8),approach=feedingFrame(1.8),bite=feedingFrame(2.4),burst=feedingFrame(2.8),end=feedingFrame(FEEDING_DURATION);
 assert.equal(start.phase,'fall');assert.equal(start.fall,0);assert.ok(fall.fall>0&&fall.fall<1);assert.equal(approach.phase,'approach');assert.equal(approach.fall,1);
 assert.equal(bite.phase,'bite');assert.ok(bite.bite>0&&bite.bite<1);assert.ok(bite.pelletScale>0&&bite.pelletScale<1);assert.ok(burst.burstVisible);assert.equal(burst.pelletScale,0);
 assert.ok(approach.camera>.95);assert.equal(end.camera,0);assert.equal(end.approach,0);assert.equal(end.done,true);assert.deepEqual(s,before);assert.ok(r.ok);
});

test('individual food delays do not change the meal camera or touch eligibility',()=>{
 for(let i=0;i<=490;i++){
  const t=i/100,a=feedingFrame(t),b=feedingFrame(t,.24);
  assert.equal(a.camera,b.camera);assert.equal(a.cameraPan,b.cameraPan);assert.equal(a.approach,b.approach);assert.ok(a.fall>=b.fall);assert.ok(a.bite>=b.bite);assert.ok(a.cameraPan+1e-12>=a.camera,'pan leads zoom');
  for(const v of [a.fall,a.approach,a.bite,a.pelletScale,a.burst,a.camera,a.cameraPan])assert.ok(v>=0&&v<=1);
 }
});

test('old material count remains the same fungible inventory for growth, decor and partner',()=>{
 const t=1700000000000,s=E.createInitial(t),r=E.discover(s,idOfScientific('Amphiprion clarkii'),'test',t,()=>.3),f=s.fish_instances.find(x=>x.uid===r.uid);
 s.materials=3;assert.ok(E.useMaterial(s,f.uid,t).ok);assert.equal(f.growth,10);assert.equal(s.materials,2);
 assert.ok(E.unlockDecor(s,'rock'));assert.equal(s.materials,1);s.breeding.partnerGiftUsed=true;assert.ok(E.invitePartner(s,f.uid,t,()=>.6).ok);assert.equal(s.materials,0);
 s.exploration.has_explored=true;assert.ok(E.startExplore(s,'open-ocean',t).ok);const reward=E.finishExplore(s,s.exploration.active.ends_at,()=>.85);assert.equal(reward.type,'material');assert.equal(s.materials,1);assert.equal(s.pending[0].result.amount,1);
});

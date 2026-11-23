import test from 'node:test';
import assert from 'node:assert/strict';
import {journeyProgress,JOURNEY_STAGES} from '../../journey.js';
import * as E from '../../engine.js';

test('voyage progress is derived from the real saved timer and clamps safely',()=>{
 const a={started_at:1000,ends_at:11000};
 for(const [t,fraction,stage] of [[-100,0,0],[1000,0,0],[2999,.1999,0],[3000,.2,1],[6000,.5,1],[8499,.7499,1],[8500,.75,2],[11000,1,2],[90000,1,2]]){
  const p=journeyProgress(a,t);assert.ok(Math.abs(p.fraction-fraction)<1e-10);assert.equal(p.stage,stage);
 }
 assert.deepEqual(journeyProgress(null),{fraction:0,stage:0});assert.deepEqual(journeyProgress({started_at:'bad',ends_at:2},1),{fraction:0,stage:0});
 assert.equal(journeyProgress({started_at:4,ends_at:4},4).fraction,1);assert.equal(JOURNEY_STAGES.length,3);
});

test('voyage presentation progress cannot alter a save or reward',()=>{
 const s=E.createInitial(1000);E.startExplore(s,'cold-sea',1000);const before=structuredClone(s);
 for(const t of [1000,8000,15000,31000])journeyProgress(s.exploration.active,t);
 assert.deepEqual(s,before);
});

test('the large animal edge reservation keeps paths inside the available tank width',async()=>{
 const {sampleMotion}=await import('../../motion-profiles.js');
 for(const w of [4,5,6])for(const length of [1,3,5,7.25])for(let i=0;i<200;i++){
  const p=sampleMotion({id:'probe',motion:'fast'},{uid:'individual'},i/8,{halfW:w,displayLength:length});
  assert.ok(Math.abs(p.x)+Math.min(length*.5,w-.38)<=w-.20,`halfW=${w}, length=${length}, x=${p.x}`);
 }
});

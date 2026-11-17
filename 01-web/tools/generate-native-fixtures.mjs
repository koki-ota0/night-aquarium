import {writeFile} from 'node:fs/promises';
import * as E from '../engine.js';
import {CATALOG,EVOLUTIONS,BY_ID} from '../catalog.js';
const out=process.argv[2]||'../yoru-mobile/tests/crosscheck.json',t=1700000000000,rng=()=>.42;
const base=E.createInitial(t);for(const sp of CATALOG.filter(x=>x.kind!=='evolution'))E.discover(base,sp.id,'test',t,rng);base.pending=[];
const cases=[];
for(let scenario=0;scenario<4;scenario++){
 const s=structuredClone(base);s.tank.light=['moon','warm','blue','warm'][scenario];s.tank.quantities={plants:[0,1,3,5][scenario],rock:[0,1,2,3][scenario],sand:[0,1,2,3][scenario]};
 for(const [i,f] of s.fish_instances.entries()){
  f.growth=[0,39,40,100][scenario];f.light_seen=[['moon'],['moon','blue'],['blue'],['moon','blue','warm']][scenario];
  if(scenario===2&&i%2===0)f.room='beach';if(scenario===3&&BY_ID[f.species_id]?.kind==='environment'&&i%2===0)f.placed=false;
 }
 if(scenario===3)s.dex.discovered=CATALOG.map(x=>x.id);
 const expected=[];
 for(const evo of EVOLUTIONS){const parent=s.fish_instances.find(f=>f.species_id===evo.parentId),o=E.evolutionOptions(s,parent).find(x=>x.id===evo.id);
  expected.push({uid:parent.uid,id:evo.id,ready:o.ready,already:o.already,requirements:o.requirements.map(r=>({type:r.type,id:r.id||'',met:r.met,current:r.current??null,target:r.target??null}))});
 }
 cases.push({state:s,expected});
}
await writeFile(out,JSON.stringify({source:'web-2.3',cases}));console.log('Wrote',cases.length*EVOLUTIONS.length,'cross-engine expectations');

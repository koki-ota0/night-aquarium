// Read-only guidance derived from the existing game state. These helpers do
// not modify saves, award rewards, or expose names of undiscovered species.
import {AWARD_THRESHOLDS,CATALOG,BY_ID,ROOMS,EVOLUTIONS,roomWater,compatibleRooms} from './catalog.js';
import * as E from './engine.js';
import {sizeClass} from './size-classes.js';
import {showcaseEnabled} from './demo-showcase.js';

const clean=value=>String(value??'').normalize('NFKC').trim().toLowerCase();
const unclaimedParents=state=>{const known=new Set(state.dex.discovered);return new Set(EVOLUTIONS.filter(e=>!known.has(e.id)).map(e=>e.parentId));};
export function readySpeciesIds(state){
 const ready=new Set(),parents=unclaimedParents(state);
 for(const f of state.fish_instances){
  if(!parents.has(f.species_id)||ready.has(f.species_id)||!BY_ID[f.species_id]||BY_ID[f.species_id].kind==='environment')continue;
  if(E.evolutionOptions(state,f).some(option=>option.ready&&!option.already))ready.add(f.species_id);
 }
 return ready;
}

export function filterCatalog(state,{biome='すべて',status='all',query='',size='all'}={}){
 const known=new Set(state.dex.discovered),showcase=showcaseEnabled(state),q=clean(query),number=q.match(/^(?:#|no\.?\s*)?(\d{1,3})$/i),ready=status==='ready'?readySpeciesIds(state):null;
 const names=new Map();
 if(q&&!number)for(const f of state.fish_instances){if(f.nickname){const list=names.get(f.species_id)||[];list.push(clean(f.nickname));names.set(f.species_id,list);}}
 return CATALOG.filter(sp=>{
  const discovered=known.has(sp.id),visible=discovered||showcase;
  if(biome!=='すべて'&&(ROOMS.some(r=>r.id===biome)?!compatibleRooms(sp).includes(biome):sp.biome!==biome))return false;
  // Normal mode stays spoiler-safe; the explicit showcase opens all species.
  if(size!=='all'&&(!visible||sizeClass(sp)!==size))return false;
  if(status==='known'&&!discovered)return false;
  if(status==='unknown'&&discovered)return false;
  if(status==='ready'&&(!discovered||!ready.has(sp.id)))return false;
  if(!q)return true;
  if(number)return sp.number===Number(number[1]);
  // Search by name and nickname only after the species has been discovered.
  return visible&&(clean(sp.name).includes(q)||(sp.aliases||[]).some(name=>clean(name).includes(q))||(names.get(sp.id)||[]).some(name=>name.includes(q)));
 });
}

// Each gallery has one independent tank; water is an exhibit property, not a switch.
export function defaultWater(state,room){return roomWater(room)||'marine';}

export function nextSuggestion(state,now=Date.now()){
 const parents=unclaimedParents(state);
 for(const fish of state.fish_instances){
  const sp=BY_ID[fish.species_id];if(!parents.has(fish.species_id)||!sp||sp.kind==='environment'||fish.placed===false||!E.canEnterRoom(state,E.displayRoom(fish)))continue;
  const option=E.evolutionOptions(state,fish).find(o=>o.ready&&!o.already);
  if(option)return {kind:'evolution',uid:fish.uid};
 }
 const groups=new Map();
 for(const fish of state.fish_instances){
  const sp=BY_ID[fish.species_id],room=E.displayRoom(fish);if(!sp||sp.kind==='environment'||fish.placed===false||!E.canEnterRoom(state,room)||E.satietyAt(fish,now)>=20)continue;
  const water=E.waterGroup(sp),section=null,key=E.tankKey(room,water),remaining=E.feedRemaining(state,room,water);if(!remaining)continue;
  if(!groups.has(key))groups.set(key,{kind:'care',room,water,section,count:0,remaining,lowest:100});
  const group=groups.get(key);group.count++;group.lowest=Math.min(group.lowest,E.satietyAt(fish,now));
 }
 const needs=[...groups.values()].sort((a,b)=>b.count-a.count||a.lowest-b.lowest||ROOMS.findIndex(x=>x.id===a.room)-ROOMS.findIndex(x=>x.id===b.room));
 if(needs.length)return needs[0];
 const count=E.currentDiscoveredCount(state),next=AWARD_THRESHOLDS.find(n=>n>count&&n<=CATALOG.length);
 if(next)return {kind:'collection',count,next,remaining:next-count,exploring:!!state.exploration.active};
 return {kind:'complete',count};
}

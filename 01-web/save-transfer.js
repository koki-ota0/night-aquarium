// Validate untrusted files before they can replace local data. An import is
// prepared on a clone, never on the live state. No network or cloud is involved.
import * as E from './engine.js';
import {BY_ID,ROOMS,DESTINATIONS,parseTankId} from './catalog.js';
import {FOOD_BY_ID} from './care-profiles.js';
import {validExplorationSpot} from './exploration-spots.js';
import {LAYOUT_BOUNDS,validLayoutScope,validDecorSlot} from './decor-layout.js';

export const MAX_IMPORT_BYTES=5*1024*1024;
// 190 current animal species × 6 + environments + archived old individuals
// can exceed the previous 1,500 limit. Keep room for both generations.
export const MAX_SAVED_INSTANCES=4096;
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const finite=(n,min=-1e15,max=1e15)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
const integer=(n,min=0,max=1e9)=>finite(n,min,max)&&Number.isInteger(n);
const optional=(value,test)=>value===undefined||test(value);
const text=(x,max=200)=>typeof x==='string'&&x.length<=max;
// Prototype names must not be accepted as dictionary keys in the old engine.
const safeId=x=>text(x,150)&&x.length>0&&/^[A-Za-z0-9_\-:.]+$/.test(x)&&!(x in Object.prototype);
const listOf=(a,test,max)=>Array.isArray(a)&&a.length<=max&&a.every(test);
const roomIds=new Set([...ROOMS.map(x=>x.id),'current','beach','river','estuary']),destinationIds=new Set([...DESTINATIONS.map(x=>x.id),'coast','fresh','cold-sea','warm-sea','large-cold-sea','large-warm-sea','beach','reef','estuary-tropical','estuary-north']),lights=new Set(['moon','warm','blue']);
const validTankId=x=>!!parseTankId(x)||roomIds.has(x);
const bool=x=>typeof x==='boolean';
const has=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const stamp=x=>finite(x);
function validLayouts(layouts){
 // Keep all old scopes as well as the two new rooms; obsolete water scopes are
 // still valid historical layout data and must survive import/export.
 if(!object(layouts)||Object.keys(layouts).length>ROOMS.length*3)return false;
 for(const [scope,items] of Object.entries(layouts)){
  const parts=scope.split(':');if(parts.length!==2||!validLayoutScope(parts[0],parts[1])||!object(items)||Object.keys(items).length>11)return false;
  for(const [slot,p] of Object.entries(items)){
   const m=/^(plants|rock|sand):(\d+)$/.exec(slot);if(!m||!validDecorSlot(m[1],Number(m[2]))||!object(p))return false;
   if(!finite(p.x,LAYOUT_BOUNDS.minX,LAYOUT_BOUNDS.maxX)||!finite(p.z,LAYOUT_BOUNDS.minZ,LAYOUT_BOUNDS.maxZ)||!integer(p.rotation,0,315)||p.rotation%45!==0)return false;
  }
 }
 return true;
}
function validWelcome(w){
 if(w===null)return true;if(!object(w)||!stamp(w.since)||!stamp(w.at)||w.at<w.since)return false;
 return listOf(w.items,item=>{
  if(!object(item)||!['explore','birth','growth'].includes(item.kind))return false;
  if(!optional(item.uid,safeId)||!optional(item.species_id,safeId))return false;
  if(item.kind==='explore')return destinationIds.has(item.destination)&&optional(item.spot,x=>validExplorationSpot(item.destination,x))&&['fish','duplicate','material','decor'].includes(item.result_type)&&optional(item.decor,x=>['rock','sand'].includes(x));
  if(item.kind==='birth')return safeId(item.uid)&&integer(item.count,1,MAX_SAVED_INSTANCES);
  return safeId(item.uid)&&integer(item.stage,1,2);
 },3);
}

function validFish(f){
 if(!object(f)||!safeId(f.uid)||!safeId(f.species_id)||!validTankId(f.room))return false;
 if(!finite(f.growth,0,100)||!optional(f.size,x=>finite(x,.05,10))||!optional(f.hue_shift,x=>finite(x,-2,2)))return false;
 if(!optional(f.stage,x=>integer(x,0,2))||!optional(f.affinity,x=>integer(x))||!optional(f.nickname,x=>text(x,256)))return false;
 if(!optional(f.placed,bool)||!optional(f.obtained_at,stamp)||!optional(f.growth_updated_at,stamp))return false;
 if(!optional(f.light_seen,x=>listOf(x,id=>lights.has(id),3))||!optional(f.parents,x=>listOf(x,safeId,2)))return false;
 const sp=has(BY_ID,f.species_id)?BY_ID[f.species_id]:null;
 if(f.exhibit_section!==undefined&&!safeId(f.exhibit_section))return false;
 if(sp?.kind!=='environment'&&sp){
  if(!['male','female'].includes(f.sex)||!object(f.care))return false;
  const c=f.care;
  if(!finite(c.satiety,0,100)||!stamp(c.satiety_at)||!integer(c.meals)||!listOf(c.journal,j=>object(j)&&stamp(j.at)&&text(j.text,1000),50))return false;
  if(c.last_food!==null&&c.last_food!==undefined&&(!safeId(c.last_food)||!has(FOOD_BY_ID,c.last_food)))return false;
 }
 return true;
}
function validState(s){
 if(!E.validSave(s)||!integer(s.next_fish_id)||!integer(s.materials)||!bool(s.started)||!optional(s.last_seen,stamp))return false;
 if(!listOf(s.fish_instances,validFish,MAX_SAVED_INSTANCES)||new Set(s.fish_instances.map(f=>f.uid)).size!==s.fish_instances.length)return false;
 const d=s.dex;
 if(!object(d)||!listOf(d.discovered,safeId,4096)||new Set(d.discovered).size!==d.discovered.length||!object(d.stages_recorded))return false;
 if(Object.entries(d.stages_recorded).some(([key,stages])=>!safeId(key)||!listOf(stages,x=>integer(x,0,2),3)))return false;
 if(!listOf(d.synergies,x=>safeId(x),100)||!listOf(d.awards,x=>integer(x,0,300),100))return false;
 if(!listOf(d.moments,m=>object(m)&&safeId(m.key)&&stamp(m.at),100)||new Set(d.moments.map(m=>m.key)).size!==d.moments.length)return false;
 if(!validWelcome(s.welcome_back))return false;
 const tank=s.tank;
 if(!object(tank)||!lights.has(tank.light)||!listOf(tank.decor,safeId,100)||!listOf(tank.inventory,safeId,100)||!object(tank.quantities))return false;
 if(['plants','rock','sand'].some(k=>!finite(tank.quantities[k],0,100))||!validLayouts(tank.layouts))return false;
 const ex=s.exploration;
 if(!object(ex)||!integer(ex.stock,0,3)||!stamp(ex.stock_updated_at)||!optional(ex.has_explored,bool))return false;
 if(ex.active!==null&&ex.active!==undefined){const a=ex.active;if(!object(a)||!destinationIds.has(a.destination)||!stamp(a.started_at)||!stamp(a.ends_at)||!optional(a.first,bool)||!optional(a.demo,bool)||!optional(a.spot,x=>validExplorationSpot(a.destination,x)))return false;}
 const day=s.daily;
 if(!object(day)||!text(day.date,32)||!integer(day.fed_count)||!integer(day.feed_bonus,0,3)||!integer(day.pet_count,0,10)||!object(day.fed_by_tank)||!optional(day.today_fish_claimed,bool))return false;
 if(Object.entries(day.fed_by_tank).some(([key,n])=>!safeId(key)||!integer(n,0,1000)))return false;
 const settings=s.settings;
 if(!object(settings)||['demo','bgm','sfx','colorblind','demo_showcase'].some(k=>!bool(settings[k]))||!['soft','normal','bright'].includes(settings.brightness)||!['normal','large','larger'].includes(settings.text_size))return false;
 if(!object(s.tutorial)||['explore','discover','pet'].some(k=>!bool(s.tutorial[k])))return false;
 if(!object(s.breeding)||!bool(s.breeding.partnerGiftUsed)||!object(s.breeding.timers))return false;
 if(Object.entries(s.breeding.timers).some(([key,t])=>!text(key,500)||!object(t)||!safeId(t.male)||!safeId(t.female)||!stamp(t.next_at)||!finite(t.interval,1)||!bool(t.demo)||!optional(t.last_result,x=>x===null||['birth','rest','hungry','full','tank_full'].includes(x))))return false;
 if(!listOf(s.pending,p=>object(p)&&text(p.type,60)&&optional(p.spot,x=>destinationIds.has(p.destination)&&validExplorationSpot(p.destination,x))&&optional(p.threshold,x=>integer(x,0,300))&&optional(p.result,x=>object(x)&&optional(x.id,safeId)&&optional(x.uid,safeId)&&optional(x.type,y=>text(y,60))),500))return false;
 if(!listOf(s.events,x=>object(x),1000))return false;
 if(s.previous!==undefined&&(!object(s.previous)||!optional(s.previous.notice,bool)||!optional(s.previous.original,object)))return false;
 if(s.legacy!==undefined){const l=s.legacy;if(!object(l)||!optional(l.notice,bool)||!optional(l.original,object)||!optional(l.originalDiscovered,x=>integer(x))||!optional(l.officialMatched,x=>integer(x))||!optional(l.legacyInstances,x=>integer(x)))return false;}
 if(s.breeding_tanks!==undefined&&!listOf(s.breeding_tanks,t=>object(t)&&!!parseTankId(t.id)?.breeding&&parseTankId(t.id).habitat===t.habitat&&text(t.name||'',100),5))return false;
 if(s.tank_views!==undefined){if(!object(s.tank_views)||Object.keys(s.tank_views).length>100)return false;for(const [key,v] of Object.entries(s.tank_views)){if(!validTankId(key)||!object(v)||!Array.isArray(v.pages)||v.pages.length>1000||!integer(v.active||0,0,100000))return false;for(const pg of v.pages)if(!listOf(pg,safeId,20))return false;}}
 return true;
}

export function prepareImport(input,now=Date.now()){
 try{
  const raw=typeof input==='string'?JSON.parse(input):structuredClone(input);
  if(!object(raw)||!Array.isArray(raw.fish_instances)||raw.fish_instances.length>MAX_SAVED_INSTANCES||!raw.fish_instances.every(f=>object(f)&&safeId(f.uid)&&safeId(f.species_id)&&optional(f.sex,x=>x===null||x==='male'||x==='female')))return {ok:false,reason:'format'};
  if(!object(raw.dex)||!optional(raw.tank,object)||!optional(raw.tutorial,object)||!optional(raw.breeding,object))return {ok:false,reason:'format'};
  if(raw.schema_version!==1&&(!object(raw.exploration)||!object(raw.daily)||!object(raw.settings)))return {ok:false,reason:'format'};
  // normalizeSave is intentionally forgiving for old local saves. For an
  // untrusted file do not silently discard malformed collections instead.
  if(!optional(raw.pending,Array.isArray)||!optional(raw.events,Array.isArray)||!optional(raw.dex.stages_recorded,object)||!optional(raw.dex.synergies,Array.isArray)||!optional(raw.dex.moments,Array.isArray)||!optional(raw.dex.awards,Array.isArray))return {ok:false,reason:'format'};
  if(raw.tank&&(!optional(raw.tank.decor,Array.isArray)||!optional(raw.tank.inventory,Array.isArray)||!optional(raw.tank.quantities,object)||!optional(raw.tank.layouts,object)))return {ok:false,reason:'format'};
  if(!optional(raw.welcome_back,x=>x===null||object(x)))return {ok:false,reason:'format'};
  if(raw.daily&&!optional(raw.daily.fed_by_tank,object))return {ok:false,reason:'format'};
  if(raw.breeding&&!optional(raw.breeding.timers,object))return {ok:false,reason:'format'};
  if(raw.fish_instances.some(f=>!optional(f.parents,Array.isArray)||!optional(f.light_seen,Array.isArray)||!optional(f.care,object)||(f.care&&!optional(f.care.journal,Array.isArray))))return {ok:false,reason:'format'};
  let state,version;
  if(E.validSave(raw)){version='v5';state=E.normalizeSave(raw,now);}
  else if(E.validPrevious(raw)){version='v4';state=E.migratePrevious(raw,now);}
  else if(E.validLegacy(raw)){version='v3';state=E.migrateLegacy(raw,now);}
  else return {ok:false,reason:'format'};
  // Only the destination device's own pre-import state is eligible for undo.
  delete state.importRecovery;
  if(!validState(state))return {ok:false,reason:'content'};
  return {ok:true,state,version,fish:state.fish_instances.length,discovered:E.currentDiscoveredCount(state),archivedDiscovered:E.archivedDiscoveryCount(state),unknown:state.fish_instances.filter(f=>!has(BY_ID,f.species_id)).length};
 }catch(_){return {ok:false,reason:'format'};}
}

// A single localStorage.setItem of this value is atomic: if the write fails,
// the old save remains untouched. The snapshot is intentionally only one deep.
export function withRecovery(imported,current,now=Date.now()){
 const next=structuredClone(imported),original=structuredClone(current);
 delete next.importRecovery;delete original.importRecovery;
 next.importRecovery={at:now,original};return next;
}
export function portableState(state){const copy=structuredClone(state);delete copy.importRecovery;return copy;}

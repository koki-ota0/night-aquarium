import {AWARD_THRESHOLDS,CATALOG,OFFICIAL_BY_ID,BY_ID,EVOLUTIONS,POOLS,ROOMS,DESTINATIONS,LEGACY_ID_MAP,poolWeight,idOfScientific,preferredRoom,roomSupports,homeForWater,compatibleRooms,compatibleTankIds,isCompatibleTank,parseTankId,legacyTankCandidate} from './catalog.js';
import {AUTO_FOOD,FOOD_BY_ID,careProfile,canServe,resolvedFood} from './care-profiles.js';
import {explorationPool,validExplorationSpot} from './exploration-spots.js';
export const SAVE_KEY='yoru_aquarium_save_v5';
export const PREVIOUS_SAVE_KEY='yoru_aquarium_save_v4';
export const LEGACY_SAVE_KEY='yoru_aquarium_save_v3';
export const SCHEMA=3;
export const MAX_PER_SPECIES=6;
export const MAX_TANK_ANIMALS=Infinity;
export const MAX_DISPLAY_PER_PAGE=20;
export const MAX_BREEDING_TANKS=5;
// Historical IDs remain in the save but do not count towards the real 200.
export function currentDiscoveredCount(s){return new Set((s.dex?.discovered||[]).filter(id=>!!OFFICIAL_BY_ID[id])).size;}
export function archivedInstances(s){return (s.fish_instances||[]).filter(f=>!OFFICIAL_BY_ID[f.species_id]);}
export function archivedDiscoveryCount(s){return new Set((s.dex?.discovered||[]).filter(id=>!OFFICIAL_BY_ID[id])).size;}
export const BREED_CHANCE=.30;
export const BREED_NORMAL_INTERVAL=24*3600000;
export const BREED_DEMO_INTERVAL=60000;
export const DEMO_STOCK_INTERVAL=5000;
export const HOUR=3600000;
// Gentle pacing: a compatible meal adds 35, while hunger now falls by 1/hour.
export const SATIETY_DECAY_PER_HOUR=1;
// A modest preference, not a guarantee: the 80/15/5 outcome split stays intact.
export const UNDISCOVERED_WEIGHT_MULTIPLIER=1.5;
export const WELCOME_AFTER=3*HOUR;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function dayKey(now=Date.now()){const d=new Date(now);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function createInitial(now=Date.now()){return {
 schema_version:SCHEMA,game:'yoru-aquarium-web-3',last_seen:now,started:false,
 next_fish_id:0,fish_instances:[],dex:{discovered:[],stages_recorded:{},synergies:[],moments:[],awards:[]},
 tank:{light:'moon',decor:['plants'],inventory:['plants'],quantities:{plants:1,rock:0,sand:0},layouts:{}},
 exploration:{stock:3,stock_updated_at:now,active:null,has_explored:false},
 daily:{date:dayKey(now),fed_count:0,fed_by_tank:{},feed_bonus:0,today_fish_claimed:false,pet_count:0},
 breeding:{timers:{},partnerGiftUsed:false},breeding_tanks:[],tank_views:{},
 materials:0,pending:[],welcome_back:null,tutorial:{explore:false,discover:false,pet:false},
 settings:{demo:true,demo_showcase:true,bgm:false,sfx:true,brightness:'normal',text_size:'normal',colorblind:false},events:[]
};}
export function validSave(s){return !!s&&s.schema_version===SCHEMA&&s.game==='yoru-aquarium-web-3'&&Array.isArray(s.fish_instances)&&Array.isArray(s.dex?.discovered)&&!!s.exploration&&!!s.daily&&!!s.settings;}
export function validPrevious(s){return !!s&&s.schema_version===2&&s.game==='yoru-aquarium-web-2'&&Array.isArray(s.fish_instances)&&Array.isArray(s.dex?.discovered)&&!!s.exploration&&!!s.daily&&!!s.settings;}
export function migratePrevious(old,now=Date.now()){if(!validPrevious(old))return null;const s=structuredClone(old);s.schema_version=SCHEMA;s.game='yoru-aquarium-web-3';s.previous={original:structuredClone(old),importedAt:now,notice:true};return normalizeSave(s,now);}
export function validLegacy(s){return !!s&&s.schema_version===1&&s.game==='yoru-aquarium-web-1'&&Array.isArray(s.fish_instances)&&Array.isArray(s.dex?.discovered);}
export function migrateLegacy(old,now=Date.now()){
 if(!validLegacy(old))return null;
 const backup=structuredClone(old),s={...createInitial(now),...structuredClone(old)};
 s.schema_version=SCHEMA;s.game='yoru-aquarium-web-3';
 const counts={plants:old.tank?.decor?.includes('plants')?1:0,rock:old.tank?.decor?.includes('rock')?1:0,sand:0};
 s.tank={...createInitial(now).tank,...old.tank,quantities:counts};
 s.tank.inventory=[...new Set([...(old.tank?.inventory||[]),'plants'])];
 s.fish_instances=old.fish_instances.map(f=>({...f,species_id:LEGACY_ID_MAP[f.species_id]||`legacy_${f.species_id}`,placed:true,light_seen:[old.tank?.light||'moon']}));
 const mapped=old.dex.discovered.map(id=>LEGACY_ID_MAP[id]||`legacy_${id}`);
 const stages={};for(const [id,a] of Object.entries(old.dex.stages_recorded||{})){const mappedId=LEGACY_ID_MAP[id];if(mappedId)stages[mappedId]=[...new Set([...(stages[mappedId]||[]),...a])];}
 s.dex={...old.dex,discovered:[...new Set(mapped)],stages_recorded:stages,synergies:[],awards:(old.dex.awards||[]).filter(n=>n<=new Set(mapped).size)};
 s.tutorial={...createInitial(now).tutorial,...old.tutorial};s.settings={...createInitial(now).settings,...old.settings};
 s.pending=(old.pending||[]).map(p=>p.result?.id?{...p,result:{...p.result,id:LEGACY_ID_MAP[p.result.id]||`legacy_${p.result.id}`}}:p);
 s.events=Array.isArray(old.events)?old.events:[];
 s.legacy={original:backup,importedAt:now,originalDiscovered:(old.dex.discovered||[]).length,officialMatched:currentDiscoveredCount(s),legacyInstances:s.fish_instances.filter(f=>f.species_id.startsWith('legacy_')).length,notice:true};
 syncSynergy(s);return normalizeSave(s,now);
}
export function normalizeSave(s,now=Date.now()){
 const d=createInitial(now);s.settings={...d.settings,...s.settings};s.tank={...d.tank,...s.tank,quantities:{...d.tank.quantities,...s.tank?.quantities}};
 s.tutorial={...d.tutorial,...s.tutorial};s.pending=Array.isArray(s.pending)?s.pending:[];s.events=Array.isArray(s.events)?s.events:[];
 const hadTankCounts=!!s.daily?.fed_by_tank;s.daily={...d.daily,...s.daily};if(!hadTankCounts)s.daily.fed_by_tank=s.daily.fed_count?{'current:marine':s.daily.fed_count}:{};
 s.breeding={...d.breeding,...s.breeding,timers:{...(s.breeding?.timers||{})}};
 s.dex={...d.dex,...s.dex};s.dex.synergies??=[];s.dex.moments??=[];s.dex.awards??=[];s.dex.stages_recorded??={};s.welcome_back??=null;
 // Breeding tanks and display pages (2.14). IDs encode habitat: breed:<room>:<n>
 if(!Array.isArray(s.breeding_tanks))s.breeding_tanks=[];
 {const seen=new Set();s.breeding_tanks=s.breeding_tanks.filter(t=>{if(!t||typeof t!=='object')return false;const parsed=parseTankId(t.id);if(!parsed?.breeding||seen.has(t.id))return false;seen.add(t.id);t.habitat=parsed.habitat;t.name=typeof t.name==='string'&&t.name.trim()?t.name.trim().slice(0,24):'繁殖用水槽';return true;}).slice(0,MAX_BREEDING_TANKS);}
 if(!s.tank_views||typeof s.tank_views!=='object'||Array.isArray(s.tank_views))s.tank_views={};
 {const destMap={coast:'open-ocean',fresh:'river','cold-sea':'open-ocean','warm-sea':'open-ocean','large-cold-sea':'open-ocean','large-warm-sea':'open-ocean',beach:'coastal',reef:'coastal','estuary-tropical':'estuary','estuary-north':'estuary'};const fixDest=x=>{if(x&&destMap[x.destination])x.destination=destMap[x.destination];if(x)delete x.spot;};
  if(s.exploration?.active)fixDest(s.exploration.active);
  for(const item of s.welcome_back?.items||[])fixDest(item);
  for(const item of s.pending||[])fixDest(item);}
 // Unknown IDs are retained instead of silently destroying original data. They are shown in backup reports.
 s.fish_instances.forEach(f=>{
  if(!BY_ID[f.species_id])return; // archived creatures are kept byte-for-byte
  const sp=BY_ID[f.species_id];
  {const candidates=compatibleRooms(sp);let target=null;
   if(parseTankId(f.room)&&isCompatibleTank(sp,f.room,s))target=f.room;
   else {const legacy=legacyTankCandidate(sp,f.room,f.exhibit_section);if(legacy&&candidates.includes(legacy))target=legacy;else target=candidates.find(id=>canEnterRoomBasic(s,id))||candidates[0];}
   if(target)f.room=target;delete f.exhibit_section;
   if(sp.kind!=='environment')f.placed=true;}
  f.light_seen??=[s.tank.light];if(f.placed===undefined)f.placed=true;
  if(BY_ID[f.species_id]&&BY_ID[f.species_id].kind!=='environment'){
   if(!['male','female'].includes(f.sex))f.sex=stableSex(f.uid||f.species_id);
   f.care={satiety:70,satiety_at:now,last_food:null,meals:0,journal:[],...f.care};
   if(!Array.isArray(f.care.journal))f.care.journal=[];
  }
 });ensureTankViews(s);return s;
}
export function logEvent(s,name,params={},now=Date.now()){s.events.push({name,at:now,...params});if(s.events.length>150)s.events.splice(0,s.events.length-150);}
export function nextDaily(s,now){const day=dayKey(now);if(s.daily.date!==day){s.daily={date:day,fed_count:0,fed_by_tank:{},feed_bonus:0,today_fish_claimed:false,pet_count:0};return true;}return false;}
export function stockInterval(s){return s.settings.demo?DEMO_STOCK_INTERVAL:3*HOUR;}
export function refreshStock(s,now){const ex=s.exploration,interval=stockInterval(s);if(!Number.isFinite(ex.stock_updated_at)||ex.stock_updated_at>now)ex.stock_updated_at=now;if(ex.stock>=3){ex.stock=3;ex.stock_updated_at=now;return false;}const n=Math.floor((now-ex.stock_updated_at)/interval);if(n<=0)return false;ex.stock=Math.min(3,ex.stock+n);ex.stock_updated_at=ex.stock===3?now:ex.stock_updated_at+n*interval;return true;}
export function nextStockMs(s,now){return s.exploration.stock>=3?0:Math.max(0,stockInterval(s)-(now-s.exploration.stock_updated_at));}
export function refreshGrowth(s,now){let changed=false;for(const f of s.fish_instances){if(!BY_ID[f.species_id]||BY_ID[f.species_id].kind==='environment')continue;if(!Number.isFinite(f.growth_updated_at)||f.growth_updated_at>now){f.growth_updated_at=now;changed=true;continue;}const hours=Math.floor((now-f.growth_updated_at)/HOUR);if(hours>0){
 // Passive growth is gentle but pauses below satiety 20. Calculate the eligible
 // hours arithmetically so a long offline absence cannot create an unbounded loop.
 const care=f.care||{satiety:70,satiety_at:f.growth_updated_at},end=(care.satiety_at??f.growth_updated_at)+Math.max(0,((care.satiety??70)-20)/SATIETY_DECAY_PER_HOUR)*HOUR;
 const growingHours=Math.max(0,Math.min(hours,Math.floor((end-f.growth_updated_at)/HOUR)));f.growth=clamp((f.growth||0)+growingHours,0,100);f.growth_updated_at+=hours*HOUR;recordStage(s,f,now);changed=true;
 }}return changed;}
function stableSex(id){let h=2166136261;for(const c of String(id))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)%2?'male':'female';}
function note(f,text,now){if(!f.care)return;f.care.journal??=[];f.care.journal.unshift({at:now,text});f.care.journal=f.care.journal.slice(0,8);}
export function recordStage(s,f,now=Date.now()){if(!BY_ID[f.species_id])return;const stage=f.growth>=100?2:f.growth>=40?1:0,previous=f.stage;f.stage=stage;const a=s.dex.stages_recorded[f.species_id]??=[];if(!a.includes(stage))a.push(stage);if(Number.isFinite(previous)&&stage>previous)note(f,stage===2?'育成度がSになった':'育成度がAになった',now);}
function uid(now,rng){return 'f_'+Math.floor(now).toString(36)+'_'+Math.floor(rng()*1e8).toString(36);}
export function waterGroup(sp){return sp?.water==='fresh'?'fresh':sp?.water==='brackish'?'brackish':'marine';}
function canEnterRoomBasic(s,id){const r=ROOMS.find(r=>r.id===id);return !!r&&((s.settings?.demo&&s.settings.demo_showcase!==false)||currentDiscoveredCount(s)>=r.threshold);}
export function tankDefinition(s,id){const parsed=parseTankId(id);if(!parsed)return null;const base=ROOMS.find(r=>r.id===parsed.habitat);if(!base)return null;if(!parsed.breeding)return base;const custom=(s?.breeding_tanks||[]).find(t=>t.id===id);if(s&&!custom)return null;return {...base,id,name:custom?.name||'繁殖用水槽',short:custom?.name||'繁殖用水槽',breeding:true,habitat:parsed.habitat,theme:base.theme};}
export function allTanks(s){return [...ROOMS,...(s?.breeding_tanks||[]).map(t=>tankDefinition(s,t.id)).filter(Boolean)];}
export function createBreedingTank(s,habitat,name=''){if(!ROOMS.some(r=>r.id===habitat)||(s.breeding_tanks||[]).length>=MAX_BREEDING_TANKS)return null;s.breeding_tanks??=[];let n=1;while(s.breeding_tanks.some(t=>t.id===`breed:${habitat}:${n}`))n++;const tank={id:`breed:${habitat}:${n}`,habitat,name:String(name||'').trim().slice(0,24)||`繁殖用水槽 ${s.breeding_tanks.length+1}`};s.breeding_tanks.push(tank);ensureTankViews(s);return tank;}
export function deleteBreedingTank(s,id){const idx=(s.breeding_tanks||[]).findIndex(t=>t.id===id);if(idx<0)return false;const habitat=s.breeding_tanks[idx].habitat;s.breeding_tanks.splice(idx,1);for(const f of s.fish_instances){if(f.room===id&&BY_ID[f.species_id]){f.room=compatibleRooms(BY_ID[f.species_id]).includes(habitat)?habitat:preferredRoom(BY_ID[f.species_id]);}}delete s.tank_views?.[id];ensureTankViews(s);return true;}
export function ensureTankViews(s){
 s.tank_views??={};const byTank=new Map();
 for(const f of s.fish_instances){const sp=BY_ID[f.species_id];if(!sp||sp.kind==='environment'||f.placed===false)continue;const room=displayRoom(f);if(!byTank.has(room))byTank.set(room,[]);byTank.get(room).push(f.uid);}
 for(const key of Object.keys(s.tank_views)){const valid=tankDefinition(s,key);if(!valid)delete s.tank_views[key];else if(!byTank.has(key))byTank.set(key,[]);}
 for(const [room,uids] of byTank){const wanted=new Set(uids);let pages=Array.isArray(s.tank_views[room]?.pages)?s.tank_views[room].pages:[];
  pages=pages.map(pg=>[...new Set((Array.isArray(pg)?pg:[]).filter(uid=>wanted.has(uid)))]);
  const assigned=new Set(pages.flat());for(const uid of uids)if(!assigned.has(uid)){let pg=pages.find(x=>x.length<MAX_DISPLAY_PER_PAGE);if(!pg){pg=[];pages.push(pg);}pg.push(uid);assigned.add(uid);}
  pages=pages.flatMap(pg=>{if(!pg.length)return [[]];const out=[];for(let i=0;i<pg.length;i+=MAX_DISPLAY_PER_PAGE)out.push(pg.slice(i,i+MAX_DISPLAY_PER_PAGE));return out;});
  let active=Number.isInteger(s.tank_views[room]?.active)?s.tank_views[room].active:0;active=Math.max(0,Math.min(active,Math.max(0,pages.length-1)));
  s.tank_views[room]={pages,active};}
 return s.tank_views;
}
export function tankPages(s,room){ensureTankViews(s);return s.tank_views[room]?.pages||[];}
export function activeTankPage(s,room){const pages=tankPages(s,room);if(!pages.length)return [];const view=s.tank_views[room];return pages[Math.min(view.active||0,pages.length-1)]||[];}
export function setActivePage(s,room,index){const pages=tankPages(s,room);if(!pages.length)return false;s.tank_views[room].active=Math.max(0,Math.min(index,pages.length-1));return true;}
export function assignFishPage(s,uid,room,pageIndex){const f=s.fish_instances.find(x=>x.uid===uid);if(!f||displayRoom(f)!==room||!Number.isInteger(pageIndex)||pageIndex<0||pageIndex>=1000)return false;ensureTankViews(s);const view=s.tank_views[room]||(s.tank_views[room]={pages:[],active:0});const target=view.pages[pageIndex]||[];if(target.length>=MAX_DISPLAY_PER_PAGE&&!target.includes(uid))return false;while(view.pages.length<=pageIndex)view.pages.push([]);view.pages=view.pages.map(pg=>pg.filter(x=>x!==uid));view.pages[pageIndex].push(uid);ensureTankViews(s);return true;}
export function addTankPage(s,room){ensureTankViews(s);const view=s.tank_views[room]||(s.tank_views[room]={pages:[[]],active:0});if(!view.pages.length)view.pages.push([]);if(view.pages.length>=1000)return false;view.pages.push([]);view.active=view.pages.length-1;return true;}

// View old water-specific tanks in their new gallery without rewriting a
// single fish's saved room. Breeding groups, timestamps, old decoration
// coordinates and JSON exports keep their original keys and UIDs.
export function displayRoom(f){
 const sp=f&&BY_ID[f.species_id];if(!sp)return parseTankId(f?.room)?f.room:'cold-sea';
 if(parseTankId(f.room))return f.room;
 const legacy=legacyTankCandidate(sp,f.room,f.exhibit_section);
 return legacy&&compatibleRooms(sp).includes(legacy)?legacy:preferredRoom(sp);
}
export function fishSection(){return null;}
export function tankOccupancy(s,room){return s.fish_instances.filter(f=>{const sp=BY_ID[f.species_id];return sp&&sp.kind!=='environment'&&f.placed!==false&&displayRoom(f)===room;}).length;}
function roomWaterFor(room){return parseTankId(room)?ROOMS.find(r=>r.id===parseTankId(room).habitat)?.water||null:null;}
export function placementCheck(s,f,room){
 const sp=f&&BY_ID[f.species_id],def=tankDefinition(s,room);
 if(!f||!sp||!def)return {ok:false,reason:'missing'};
 if(!canEnterRoom(s,room))return {ok:false,reason:'locked'};
 if(!isCompatibleTank(sp,room,s))return {ok:false,reason:'habitat'};
 const same=f.placed!==false&&displayRoom(f)===room;
 return {ok:true,count:tankOccupancy(s,room),section:null,same};
}
export function discoveryRoom(s,sp){return compatibleRooms(sp).find(id=>canEnterRoom(s,id))||preferredRoom(sp);}
function createInstance(s,sp,origin,now,rng,room,options={}){
 s.next_fish_id=(s.next_fish_id||0)+1;
 const same=s.fish_instances.filter(f=>f.species_id===sp.id);
 const sex=sp.kind==='environment'?null:(options.sex||((same.length===1&&origin!=='birth')?(same[0].sex==='male'?'female':'male'):(rng()<.5?'male':'female')));
 const f={uid:uid(now,rng)+'_'+s.next_fish_id,species_id:sp.id,stage:0,growth:0,size:.85+rng()*.30,hue_shift:(rng()-.5)*.06,affinity:0,room,placed:true,light_seen:[s.tank.light],obtained_at:now,growth_updated_at:now};
 const display=displayRoom(f);
 if(sex){f.sex=sex;f.care={satiety:70,satiety_at:now,last_food:null,meals:0,journal:[]};note(f,origin==='birth'?'この水槽で誕生した':'水槽にお迎えした',now);}
 if(options.parents)f.parents=[...options.parents];
 s.fish_instances.push(f);ensureTankViews(s);recordStage(s,f,now);return f;
}
export function discover(s,id,origin='explore',now=Date.now(),rng=Math.random,room=null){if(!parseTankId(room))room=discoveryRoom(s,OFFICIAL_BY_ID[id]);
 const sp=OFFICIAL_BY_ID[id];if(!sp)return {ok:false,reason:'unknown'};
 const known=s.dex.discovered.includes(id),same=s.fish_instances.filter(f=>f.species_id===id);
 if(known&&((sp.kind==='environment'&&same.length>0)||same.length>=MAX_PER_SPECIES)){s.materials++;logEvent(s,'duplicate_converted',{species_id:id,origin},now);return {ok:true,type:'duplicate',id};}
 const f=createInstance(s,sp,origin,now,rng,room);
 if(!known){s.dex.discovered.push(id);logEvent(s,'dex_register',{species_id:id,count:currentDiscoveredCount(s)},now);}
 syncSynergy(s);s.tutorial.discover=true;logEvent(s,'fish_obtained',{species_id:id,origin,uid:f.uid},now);
 if(!known)for(const threshold of AWARD_THRESHOLDS.filter(n=>n<=CATALOG.length))if(currentDiscoveredCount(s)>=threshold&&!s.dex.awards.includes(threshold)){
  s.dex.awards.push(threshold);s.exploration.stock=Math.min(3,s.exploration.stock+1);s.daily.feed_bonus=Math.min(3,s.daily.feed_bonus+1);s.pending.push({type:'award',threshold});
 }
 return {ok:true,type:'fish',id,uid:f.uid,known,...(f.placed===false?{stored:true}:{})};
}
// In showcase mode the player may explicitly adopt a missing sample. Merely
// looking at samples never grants fish or changes the discovery record.
export function demoAdopt(s,id,room,now=Date.now(),rng=Math.random){
 if(!s.settings.demo||s.settings.demo_showcase===false||!OFFICIAL_BY_ID[id]||!canEnterRoom(s,room)||!isCompatibleTank(OFFICIAL_BY_ID[id],room,s))return {ok:false,reason:'unavailable'};
 if(s.fish_instances.some(f=>f.species_id===id))return {ok:false,reason:'owned'};
 return discover(s,id,'demo_adopt',now,rng,room);
}
export const ENV_ANEMONE=idOfScientific('Entacmaea quadricolor');
export const ENV_CARPET=idOfScientific('Stichodactyla gigantea');
export const ENV_FLOWER_CORAL=idOfScientific('Fimbriaphyllia ancora');
export const SYNERGY_PAIRS=[
 {key:'clown_anemone',env:ENV_ANEMONE,family:'clown',label:'クマノミとタマイタダキイソギンチャク',caption:'そっと、そばを通る時間'},
 {key:'slug_anemone',env:ENV_CARPET,family:'nudibranch',label:'ウミウシとハタゴイソギンチャク',caption:'水底の、ゆっくり散歩'},
 {key:'squid_ascidian',env:idOfScientific('Halocynthia roretzi'),family:'squid',label:'ホタルイカとマボヤ',caption:'小さな光が、近くを通る'},
 {key:'dugong_mussel',env:idOfScientific('Mytilus unguiculatus'),family:'dugong',label:'ジュゴンとイガイ',caption:'水底のそばで、ひと休み'},
];
export function activeSynergies(s){return SYNERGY_PAIRS.filter(p=>{
 const env=s.fish_instances.filter(f=>f.species_id===p.env&&f.placed!==false);
 return env.some(e=>s.fish_instances.some(f=>f.placed!==false&&f.room===e.room&&waterGroup(BY_ID[f.species_id])===waterGroup(BY_ID[e.species_id])&&fishSection(f)===fishSection(e)&&BY_ID[f.species_id]?.shape===p.family));
 }).map(p=>p.key);}
export function syncSynergy(s){let changed=false;for(const key of activeSynergies(s))if(!s.dex.synergies.includes(key)){s.dex.synergies.push(key);changed=true;}return changed;}
// Only the current room and water can create an observable scene. Optional
// visible IDs restrict the scene to the current 12-animal display page.
export function synergyPairsInTank(s,room,water,visibleIds=null){
 const visible=visibleIds?new Set(visibleIds):null,out=[];
 for(const p of SYNERGY_PAIRS){
  const envs=s.fish_instances.filter(f=>f.species_id===p.env&&f.room===room&&f.placed!==false&&waterGroup(BY_ID[f.species_id])===water&&(!visible||visible.has(f.uid)));
  for(const env of envs){const animal=s.fish_instances.find(f=>f.room===room&&f.placed!==false&&BY_ID[f.species_id]?.shape===p.family&&waterGroup(BY_ID[f.species_id])===water&&fishSection(f)===fishSection(env)&&(!visible||visible.has(f.uid)));
   if(animal){out.push({...p,room,water,envUid:env.uid,fishUid:animal.uid});break;}}
 }
 return out;
}
export function findSynergyLocation(s,key){
 if(!SYNERGY_PAIRS.some(p=>p.key===key))return null;
 for(const room of ROOMS)for(const water of ['marine','fresh','brackish']){
  if(!canEnterRoom(s,room.id))continue;const pair=synergyPairsInTank(s,room.id,water).find(p=>p.key===key);if(pair)return pair;
 }
 return null;
}
export function recordSynergyMoment(s,key,now=Date.now()){
 if(!SYNERGY_PAIRS.some(p=>p.key===key)||!activeSynergies(s).includes(key))return false;
 s.dex.moments??=[];if(s.dex.moments.some(m=>m.key===key))return false;
 s.dex.moments.push({key,at:now});logEvent(s,'synergy_moment',{key},now);return true;
}
function hasEnvironment(s,f,id){return s.fish_instances.some(e=>e.species_id===id&&e.placed!==false&&e.room===f.room&&waterGroup(BY_ID[e.species_id])===waterGroup(BY_ID[f.species_id])&&fishSection(e)===fishSection(f));}
export function conditionCounts(s,f){const counts={...s.tank.quantities};const keys={'草':'plants','砂':'sand'};for(const env of s.fish_instances){const sp=BY_ID[env.species_id],key=keys[sp?.tag];if(key&&sp?.kind==='environment'&&env.placed!==false&&env.room===f.room&&waterGroup(sp)===waterGroup(BY_ID[f.species_id])&&fishSection(env)===fishSection(f))counts[key]=(counts[key]||0)+1;}return counts;}
export function canEnterRoom(s,id){const parsed=parseTankId(id);if(!parsed)return false;if(parsed.breeding&&!(s.breeding_tanks||[]).some(t=>t.id===id))return false;return canEnterRoomBasic(s,parsed.habitat);}
export function canExplore(s,id){const d=DESTINATIONS.find(x=>x.id===id);return !!d&&((s.settings?.demo&&s.settings.demo_showcase!==false)||currentDiscoveredCount(s)>=d.unlock);}
export function startExplore(s,id,now=Date.now(),spot=null){
 nextDaily(s,now);refreshStock(s,now);const ex=s.exploration,d=DESTINATIONS.find(x=>x.id===id);
 if(!d)return {ok:false,reason:'unknown'};if(!validExplorationSpot(id,spot))return {ok:false,reason:'spot'};if(ex.active)return {ok:false,reason:'active'};if(!canExplore(s,id))return {ok:false,reason:'locked'};if(ex.stock<=0)return {ok:false,reason:'stock'};
 if(ex.stock===3)ex.stock_updated_at=now;ex.stock--;const first=!ex.has_explored;
 ex.active={destination:id,started_at:now,ends_at:now+(s.settings.demo?d.demo:d.time),first,demo:s.settings.demo};if(spot)ex.active.spot=spot;ex.has_explored=true;s.tutorial.explore=true;logEvent(s,'explore_start',{destination:id,...(spot?{spot}:{}),demo:s.settings.demo,first},now);return {ok:true,active:ex.active};
}
export function weightedPick(ids,rng=Math.random,weight=id=>poolWeight(BY_ID[id])){const total=ids.reduce((sum,id)=>sum+weight(id),0);let n=rng()*total;for(const id of ids){n-=weight(id);if(n<0)return id;}return ids.at(-1);}
export function explorationWeight(s,id){return poolWeight(BY_ID[id])*(s.dex.discovered.includes(id)?1:UNDISCOVERED_WEIGHT_MULTIPLIER);}
export function finishExplore(s,now=Date.now(),rng=Math.random){
 const ex=s.exploration,a=ex.active;if(!a||now<a.ends_at)return null;ex.active=null;let result;
 if(a.first){const id=idOfScientific('Amphiprion clarkii');result=discover(s,id,'first_exploration',now,rng,discoveryRoom(s,BY_ID[id]));}
 else {const roll=rng();if(roll<.8){const selected=explorationPool(a.destination,a.spot),pool=selected.length?selected:(POOLS[a.destination]||POOLS.coast),id=weightedPick(pool,rng,id=>explorationWeight(s,id));result=discover(s,id,'explore',now,rng,discoveryRoom(s,BY_ID[id]));}
  else if(roll<.95){s.materials++;result={ok:true,type:'material',amount:1};}
  else {const options=['rock','sand'].filter(x=>!s.tank.inventory.includes(x));if(options.length){const decor=options[Math.min(options.length-1,Math.floor(rng()*options.length))];s.tank.inventory.push(decor);result={ok:true,type:'decor',decor};}else{s.materials++;result={ok:true,type:'material',amount:1};}}
 }
 s.pending.unshift({type:'discovery',result,destination:a.destination,...(a.spot?{spot:a.spot}:{})});logEvent(s,'explore_claim',{destination:a.destination,...(a.spot?{spot:a.spot}:{}),result:result.type,id:result.id??null},now);return result;
}
export function refresh(s,now=Date.now(),rng=Math.random){const daily=nextDaily(s,now),stock=refreshStock(s,now),growth=refreshGrowth(s,now),result=finishExplore(s,now,rng),breeding=refreshBreeding(s,now,rng);s.last_seen=now;return {changed:daily||stock||growth||!!result||breeding,result};}
// Called only at a genuine app return, not during normal periodic ticks.
// All messages are built from the result actually resolved on this refresh.
export function refreshForReturn(s,now=Date.now(),rng=Math.random){
 const since=s.last_seen,away=!!s.started&&Number.isFinite(since)&&now>=since&&now-since>=WELCOME_AFTER;
 const oldFish=away?new Map(s.fish_instances.map(f=>[f.uid,{stage:(f.growth||0)>=100?2:(f.growth||0)>=40?1:0}])):null;
 const active=away&&s.exploration.active?{...s.exploration.active}:null;
 const result=refresh(s,now,rng);let welcomeCreated=false;
 if(away){
  const items=[];if(result.result&&active){const r=result.result,item={kind:'explore',destination:active.destination,result_type:r.type};
   if(active.spot)item.spot=active.spot;if(r.id)item.species_id=r.id;if(r.uid)item.uid=r.uid;if(r.decor)item.decor=r.decor;items.push(item);}
  const births=s.fish_instances.filter(f=>BY_ID[f.species_id]&&!oldFish.has(f.uid)&&Array.isArray(f.parents)&&f.parents.length>0);
  if(births.length)items.push({kind:'birth',uid:births[0].uid,count:births.length});
  const advanced=s.fish_instances.find(f=>{if(!BY_ID[f.species_id])return false;const old=oldFish.get(f.uid),stage=(f.growth||0)>=100?2:(f.growth||0)>=40?1:0;return old&&stage>old.stage;});
  if(advanced)items.push({kind:'growth',uid:advanced.uid,stage:advanced.growth>=100?2:1});
  // Do not erase an unread earlier report just because the next return was quiet.
  if(items.length||!s.welcome_back){s.welcome_back={since,at:now,items:items.slice(0,3)};welcomeCreated=true;}
 }
 return {...result,welcomeCreated};
}
export function tankKey(room='current',water='marine'){return `${room}:${water}`;}
// In the new river/estuary view several older tanks may be shown together.
// Keep every old feeding counter and use the strictest remaining limit; one
// shared meal increments each represented old tank, never granting free meals.
export function feedingScopes(s,room){return [room];}
export function feedRemaining(s,room='current',water='marine'){
 const limit=Math.min(5,2+s.daily.feed_bonus),count=s.daily.fed_by_tank?.[tankKey(room,water)]||0;
 return Math.max(0,limit-count);
}
export function satietyAt(f,now=Date.now()){if(!f.care)return 0;return Math.round(clamp((f.care.satiety??70)-Math.max(0,now-(f.care.satiety_at??now))/HOUR*SATIETY_DECAY_PER_HOUR,0,100));}
export function fishInTank(s,room,water,section=null){const estuary=(parseTankId(room)?.habitat||'').startsWith('estuary-');return s.fish_instances.filter(f=>BY_ID[f.species_id]&&displayRoom(f)===room&&BY_ID[f.species_id].kind!=='environment'&&f.placed!==false&&(estuary||waterGroup(BY_ID[f.species_id])===water)&&(!section||fishSection(f)===section));}
export function feed(s,now=Date.now(),room='cold-sea',water='marine',food='plankton',section=null,visibleUids=null){
 nextDaily(s,now);refreshGrowth(s,now);const allResidents=fishInTank(s,room,water,section);const residents=Array.isArray(visibleUids)?allResidents.filter(f=>visibleUids.includes(f.uid)):allResidents;if(!residents.length)return {ok:false,reason:'empty'};
 if(!FOOD_BY_ID[food]&&food!==AUTO_FOOD.id)return {ok:false,reason:'food'};if(feedRemaining(s,room,water)<=0)return {ok:false,reason:'limit'};
 const eaters=residents.filter(f=>canServe(BY_ID[f.species_id],food));if(!eaters.length)return {ok:false,reason:'incompatible'};
 s.daily.fed_by_tank??={};{const key=tankKey(room,water);s.daily.fed_by_tank[key]=(s.daily.fed_by_tank[key]||0)+1;}s.daily.fed_count++;
 const foods={};
 for(const f of eaters){const sp=BY_ID[f.species_id],actual=resolvedFood(sp,food),bonus=((sp.shape==='clown'&&hasEnvironment(s,f,ENV_ANEMONE))||(sp.shape==='nudibranch'&&hasEnvironment(s,f,ENV_CARPET))?1:0)+(hasEnvironment(s,f,ENV_FLOWER_CORAL)?1:0);
  // A mixed meal is convenient but deliberately earns the normal +8: manually
  // choosing a favorite still rewards the player with +12. Environment is extra.
  f.growth=clamp((f.growth||0)+(food!==AUTO_FOOD.id&&careProfile(sp).favorite===actual?12:8)+bonus,0,100);
  f.care??={satiety:70,satiety_at:now,last_food:null,meals:0,journal:[]};f.care.satiety=clamp(satietyAt(f,now)+35,0,100);f.care.satiety_at=now;f.care.last_food=actual;f.care.meals=(f.care.meals||0)+1;note(f,`${FOOD_BY_ID[actual].short}を食べた${food===AUTO_FOOD.id?'（おまかせ）':''}`,now);recordStage(s,f,now);
  Object.defineProperty(foods,f.uid,{value:actual,enumerable:true,configurable:true});
 }
 logEvent(s,'feed_tap',{room,water,food,matched:eaters.length,ignored:residents.length-eaters.length},now);
 return {ok:true,matched:eaters.length,ignored:residents.length-eaters.length,fedUids:eaters.map(f=>f.uid),foods};
}
export function renameFish(s,uid,value,now=Date.now()){
 const f=s.fish_instances.find(x=>x.uid===uid);if(!f||!BY_ID[f.species_id]||BY_ID[f.species_id].kind==='environment')return false;
 f.nickname=Array.from(String(value||'').trim()).slice(0,12).join('');note(f,f.nickname?'名前をつけてもらった':'名前を元に戻した',now);return true;
}
export function partnerCost(s,uid){const f=s.fish_instances.find(x=>x.uid===uid),sp=f&&BY_ID[f.species_id];if(!f||!sp||sp.kind==='environment'||f.placed===false||s.fish_instances.filter(x=>x.species_id===f.species_id).length!==1)return null;return s.breeding.partnerGiftUsed?1:0;}
export function invitePartner(s,uid,now=Date.now(),rng=Math.random){
 const f=s.fish_instances.find(x=>x.uid===uid),cost=partnerCost(s,uid);if(cost===null)return {ok:false,reason:'unavailable'};if(s.materials<cost)return {ok:false,reason:'materials'};
 s.materials-=cost;s.breeding.partnerGiftUsed=true;const sp=BY_ID[f.species_id],mate=createInstance(s,sp,'partner',now,rng,f.room,{sex:f.sex==='male'?'female':'male'});
 note(f,'お相手を迎えた',now);logEvent(s,'partner_invited',{species_id:sp.id,uid:mate.uid,cost},now);return {ok:true,uid:mate.uid};
}
export function breedKey(f){return `${displayRoom(f)}|${f.species_id}`;}
export function isBreedingTank(s,id){return !!parseTankId(id)?.breeding&&(s.breeding_tanks||[]).some(t=>t.id===id);}
export function closeRelatives(a,b){const ap=a.parents||[],bp=b.parents||[];return ap.includes(b.uid)||bp.includes(a.uid)||ap.some(uid=>bp.includes(uid));}
export function breedingPairs(s){
 const groups=new Map();for(const f of s.fish_instances){const sp=BY_ID[f.species_id];if(!sp||sp.kind==='environment'||f.placed===false||!isBreedingTank(s,displayRoom(f)))continue;const key=breedKey(f);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(f);}
 const result=[];for(const [key,all] of groups){const mature=all.filter(f=>(f.growth||0)>=40),males=mature.filter(f=>f.sex==='male'),females=mature.filter(f=>f.sex==='female');
  let male=null,female=null;for(const candidate of males){const other=females.find(x=>!closeRelatives(candidate,x));if(other){male=candidate;female=other;break;}}
  if(male&&female&&s.fish_instances.filter(f=>f.species_id===male.species_id).length<MAX_PER_SPECIES)result.push({key,male,female,all});}
 return result;
}
// Explain the same eligibility rules used by breedingPairs without changing any
// timer or rolling the random outcome. All counts are scoped exactly as the game.
export function breedingStatus(s,room,water,now=Date.now(),section=null){
 const groups=new Map(),pairs=new Map(breedingPairs(s).map(p=>[p.key,p]));
 for(const f of fishInTank(s,room,water,section)){const key=breedKey(f);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(f);}
 return [...groups].map(([key,all])=>{
  const globalCount=s.fish_instances.filter(f=>f.species_id===all[0].species_id).length,pair=pairs.get(key)||null;
  const males=all.filter(f=>f.sex==='male'),females=all.filter(f=>f.sex==='female');
  const matureM=males.filter(f=>(f.growth||0)>=40),matureF=females.filter(f=>(f.growth||0)>=40);
  let reason='ready';
  if(globalCount>=MAX_PER_SPECIES)reason='full';
  else if(all.length<2)reason='partner';
  else if(!males.length||!females.length)reason='sex';
  else if(!matureM.length||!matureF.length)reason='growth';
  else if(!pair)reason='relatives';
  else if(satietyAt(pair.male,now)<20||satietyAt(pair.female,now)<20)reason='hungry';
  return {key,speciesId:all[0].species_id,reason,count:all.length,globalCount,pair,subjectUid:all[0].uid};
 });
}
export function refreshBreeding(s,now=Date.now(),rng=Math.random){
 s.breeding??={timers:{},partnerGiftUsed:false};s.breeding.timers??={};let changed=false;
 const pairs=breedingPairs(s),eligible=new Set(pairs.map(p=>p.key));
 for(const key of Object.keys(s.breeding.timers)){const species=key.split('|').at(-1);if(BY_ID[species]&&!eligible.has(key)){delete s.breeding.timers[key];changed=true;}} // keep inactive archived timers
 for(const pair of pairs){let timer=s.breeding.timers[pair.key];
  if(!timer||timer.male!==pair.male.uid||timer.female!==pair.female.uid){const demo=!!s.settings.demo,interval=demo?BREED_DEMO_INTERVAL:BREED_NORMAL_INTERVAL;timer=s.breeding.timers[pair.key]={male:pair.male.uid,female:pair.female.uid,next_at:now+interval,interval,demo,last_result:null};changed=true;continue;}
  if(!Number.isFinite(timer.next_at)||!Number.isFinite(timer.interval)||timer.interval<=0){delete s.breeding.timers[pair.key];changed=true;continue;}
  let attempts=0;while(timer.next_at<=now&&attempts<7){const at=timer.next_at;timer.next_at+=timer.interval;attempts++;changed=true;
   const count=s.fish_instances.filter(f=>f.species_id===pair.male.species_id).length;
   if(count>=MAX_PER_SPECIES){timer.last_result='full';break;}
   if(satietyAt(pair.male,at)<20||satietyAt(pair.female,at)<20){timer.last_result='hungry';continue;}
   if(rng()<BREED_CHANCE){const sp=BY_ID[pair.male.species_id],child=createInstance(s,sp,'birth',at,rng,pair.male.room,{parents:[pair.male.uid,pair.female.uid]});
    timer.last_result='birth';note(pair.male,'赤ちゃんが生まれた',at);note(pair.female,'赤ちゃんが生まれた',at);
    logEvent(s,'birth',{species_id:sp.id,uid:child.uid,parents:child.parents},at);s.pending.push({type:'birth',result:{ok:true,type:'fish',id:sp.id,uid:child.uid}});
   }else timer.last_result='rest';
  }
  if(timer.next_at<=now)timer.next_at=now+timer.interval; // bound offline catch-up to seven checks
 }
 return changed;
}
export function skipBreedCheck(s,key,now=Date.now(),rng=Math.random){const timer=s.breeding?.timers?.[key];if(!timer||!timer.demo||!s.settings.demo)return false;timer.next_at=now;refreshBreeding(s,now,rng);return true;}
export function demoGrow(s,uid,now=Date.now()){const f=s.fish_instances.find(x=>x.uid===uid);if(!s.settings.demo||!f||!BY_ID[f.species_id]||BY_ID[f.species_id].kind==='environment')return false;f.growth=Math.max(f.growth,40);recordStage(s,f,now);return true;}
export function pet(s,uid,now=Date.now()){nextDaily(s,now);const f=s.fish_instances.find(f=>f.uid===uid);if(!f||!BY_ID[f.species_id])return {ok:false,reason:'missing'};if(s.daily.pet_count>=10)return {ok:false,reason:'limit'};s.daily.pet_count++;f.affinity=(f.affinity||0)+1;s.tutorial.pet=true;logEvent(s,'pet',{species_id:f.species_id},now);return {ok:true,affinity:f.affinity};}
export function todayFish(s,now=Date.now(),rng=Math.random){nextDaily(s,now);if(!s.tutorial.discover)return {ok:false,reason:'first'};if(s.daily.today_fish_claimed)return {ok:false,reason:'claimed'};const allowed=ROOMS.filter(r=>canEnterRoom(s,r.id)).flatMap(r=>r.biomes);const pool=CATALOG.filter(x=>x.kind!=='evolution'&&allowed.includes(x.biome)).map(x=>x.id);const id=weightedPick(pool,rng);s.daily.today_fish_claimed=true;const result=discover(s,id,'today',now,rng,discoveryRoom(s,BY_ID[id]));s.pending.unshift({type:'today',result});logEvent(s,'today_fish_claim',{species_id:id},now);return result;}
export function useMaterial(s,uid,now=Date.now()){const f=s.fish_instances.find(x=>x.uid===uid);if(!f||!BY_ID[f.species_id]||s.materials<1)return {ok:false};if(f.growth>=100)return {ok:false,reason:'max'};s.materials--;f.growth=clamp(f.growth+10,0,100);recordStage(s,f,now);logEvent(s,'growth_material',{species_id:f.species_id},now);return {ok:true};}
// One source of truth for both the evolution decision and the player-facing
// checklist. Multi-light rules use this individual's history; a single light
// instead requires the currently selected light, as in the original game.
export function evolutionRequirements(s,f,c){
 const out=[],counts=Object.keys(c.counts).length?conditionCounts(s,f):{},water=c.tag?waterGroup(BY_ID[f.species_id]):null;
 if(c.growth)out.push({type:'growth',current:f.growth||0,target:c.growth,met:(f.growth||0)>=c.growth});
 for(const id of c.lights){const mode=c.lights.length>1?'seen':'current',met=mode==='seen'?(f.light_seen||[]).includes(id):s.tank.light===id;out.push({type:'light',id,mode,current:s.tank.light,met});}
 for(const [id,target] of Object.entries(c.counts)){const current=counts[id]||0;out.push({type:'count',id,current,target,met:current>=target});}
 if(c.tag){const current=s.fish_instances.filter(x=>x.room===f.room&&x.placed!==false&&BY_ID[x.species_id]?.kind==='environment'&&BY_ID[x.species_id]?.tag===c.tag&&waterGroup(BY_ID[x.species_id])===water).length;out.push({type:'tag',id:c.tag,current,target:1,met:current>=1});}
 if(c.dex){const current=currentDiscoveredCount(s);out.push({type:'dex',current,target:c.dex,met:current>=c.dex});}
 if(c.synergies){const current=activeSynergies(s).length;out.push({type:'synergies',current,target:c.synergies,met:current>=c.synergies});}
 return out;
}
export function evolutionOptions(s,f){return EVOLUTIONS.filter(e=>e.parentId===f.species_id).map(e=>{
 const requirements=evolutionRequirements(s,f,e.condition),passes=type=>requirements.filter(x=>x.type===type).every(x=>x.met);
 const checks={hasGrowth:passes('growth'),hasLight:passes('light'),hasCounts:passes('count'),hasTag:passes('tag'),hasDex:passes('dex'),hasSynergies:passes('synergies')};
 return {...e,ready:Object.values(checks).every(Boolean),already:s.dex.discovered.includes(e.id),checks,requirements};
 });}
export function evolve(s,uid,targetId,now=Date.now(),rng=Math.random){const f=s.fish_instances.find(x=>x.uid===uid);if(!f)return {ok:false,reason:'missing'};const choice=evolutionOptions(s,f).find(e=>e.id===targetId);if(!choice||!choice.ready||choice.already)return {ok:false,reason:'condition'};const result=discover(s,targetId,'evolution',now,rng,f.room);if(result.type==='fish'){const child=s.fish_instances.find(x=>x.uid===result.uid);child.growth=Math.min(f.growth,40);child.size=f.size;child.hue_shift=f.hue_shift;recordStage(s,child,now);}logEvent(s,'evolution_trigger',{from:f.species_id,to:targetId},now);s.pending.unshift({type:'evolution',result});return result;}
export function setLight(s,id){if(!['moon','warm','blue'].includes(id))return false;s.tank.light=id;for(const f of s.fish_instances){if(!BY_ID[f.species_id])continue;f.light_seen??=[];if(!f.light_seen.includes(id))f.light_seen.push(id);}return true;}
export function setDecorQuantity(s,id,delta){if(!['plants','rock','sand'].includes(id)||!s.tank.inventory.includes(id))return false;const max=id==='plants'?5:3;s.tank.quantities[id]=clamp((s.tank.quantities[id]||0)+delta,0,max);s.tank.decor=['plants','rock','sand'].filter(k=>s.tank.quantities[k]>0);return true;}
export function unlockDecor(s,id){if(!['rock','sand'].includes(id)||s.tank.inventory.includes(id)||s.materials<1)return false;s.materials--;s.tank.inventory.push(id);return true;}
export function togglePlaced(s,uid){const f=s.fish_instances.find(x=>x.uid===uid);if(!f||BY_ID[f.species_id]?.kind!=='environment')return false;f.placed=f.placed===false;syncSynergy(s);return true;}
export function moveFish(s,uid,room){
 const f=s.fish_instances.find(x=>x.uid===uid),check=placementCheck(s,f,room);if(!check.ok)return false;
 const oldRoom=displayRoom(f);if(s.tank_views?.[oldRoom])s.tank_views[oldRoom].pages=(s.tank_views[oldRoom].pages||[]).map(pg=>pg.filter(x=>x!==uid));
 f.room=room;f.placed=true;delete f.exhibit_section;ensureTankViews(s);syncSynergy(s);return true;
}

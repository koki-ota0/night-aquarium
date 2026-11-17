// A read-only demonstration of missing species. These entries are display
// objects, never fish_instances: real discoveries, UIDs and care are untouched.
import {CATALOG,BY_ID,preferredRoom,POOLS,parseTankId} from './catalog.js';
import {waterGroup,displayRoom,fishSection} from './engine.js';

export function showcaseEnabled(state){return !!state.settings?.demo&&state.settings.demo_showcase!==false;}
export function showcaseRoom(species){if(species.scientific==='Phoca vitulina')return 'estuary-north';if(species.water==='fresh'&&POOLS.lake.includes(species.id))return 'lake';return preferredRoom(species);}
export function showcaseSamples(state){
 if(!showcaseEnabled(state))return [];
 // A put-away environment species still gets a labelled sample. Existing
 // owned individuals are never modified or replaced to fill the showcase.
 const represented=new Set(state.fish_instances.filter(f=>BY_ID[f.species_id]&&(f.placed!==false||BY_ID[f.species_id].kind!=='environment')).map(f=>f.species_id));
 const used=new Set(state.fish_instances.map(f=>f.uid));
 return CATALOG.filter(sp=>!represented.has(sp.id)).map(sp=>{
  let uid=`showcase_${sp.id}`;while(used.has(uid))uid+='_';used.add(uid);
  return {uid,species_id:sp.id,room:showcaseRoom(sp),placed:true,size:1,hue_shift:0,growth:0,affinity:0,showcase:true};
 });
}
// A small read-only school makes the tropical mangrove exhibit legible. The
// extra specimens are still the same real species, never earned individuals.
export function showcaseSchool(state,samples=showcaseSamples(state)){
 const base=samples.find(f=>BY_ID[f.species_id]?.scientific==='Toxotes jaculatrix');if(!base)return [];
 const used=new Set([...state.fish_instances,...samples].map(f=>f.uid));
 return [1,2].map(i=>{let uid=`${base.uid}_school${i}`;while(used.has(uid))uid+='_';used.add(uid);return {...base,uid,school:true};});
}
export function roomDisplay(state,room){
 const samples=showcaseSamples(state);
 return [...state.fish_instances.filter(f=>BY_ID[f.species_id]&&displayRoom(f)===room&&(f.placed!==false||BY_ID[f.species_id].kind==='environment')),...samples.filter(f=>f.room===room),...showcaseSchool(state,samples).filter(f=>f.room===room)];
}
export function waterDisplay(state,room,water,section=null){const estuary=(parseTankId(room)?.habitat||'').startsWith('estuary-');return roomDisplay(state,room).filter(f=>(estuary||waterGroup(BY_ID[f.species_id])===water)&&(!section||fishSection(f)===section));}
export function visibleAnimals(state,room,water,section=null){return waterDisplay(state,room,water,section).filter(f=>BY_ID[f.species_id].kind!=='environment');}
export function showcaseByUid(state,uid){const samples=showcaseSamples(state);return [...samples,...showcaseSchool(state,samples)].find(f=>f.uid===uid)||null;}

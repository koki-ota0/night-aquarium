// The current exhibit consists of documented, real species.
// IDs are stable identifiers, NOT the numbers shown in the new catalogue.
import rows from './data/real-catalog-data.json' with {type:'json'};
import expansion from './data/expansion-216/curated-provisional.json' with {type:'json'};
import reviewed from './data/expansion-216/reviewed-second.json' with {type:'json'};
import deepEstuary from './data/expansion-216/curated-217.json' with {type:'json'};
import expansion219 from './data/expansion-216/curated-219.json' with {type:'json'};
import expansion220 from './data/expansion-216/curated-220.json' with {type:'json'};
import expansion222 from './data/expansion-216/curated-222.json' with {type:'json'};
import expansion223 from './data/expansion-216/curated-223.json' with {type:'json'};
import expansion224 from './data/expansion-216/curated-224.json' with {type:'json'};
import expansion226 from './data/expansion-216/curated-226.json' with {type:'json'};
import expansion228 from './data/expansion-216/curated-228.json' with {type:'json'};
import expansion229 from './data/expansion-216/curated-229.json' with {type:'json'};
import previousRows from './catalog-data.json' with {type:'json'};
import legacyRows from './legacy-catalog.json' with {type:'json'};

export const AWARD_THRESHOLDS=[10,25,50,75,100,150,200,250,300];
export const LIGHTS={moon:'月',warm:'暖色',blue:'青'};
export const DECORS={plants:'水草',rock:'岩',sand:'砂'};
// Each exhibit is a separate tank with a fixed water type. The broad biome
// labels are suggestions, not claims that every species has identical needs.
export const ROOMS=[
 {id:'cold-sea',name:'冷たい海の水槽',short:'冷たい海',en:'COLD SEA',water:'marine',theme:'冷たい海',threshold:0,biomes:['外洋'],featured:'Thunnus orientalis'},
 {id:'warm-sea',name:'暖かい海の水槽',short:'暖かい海',en:'WARM SEA',water:'marine',theme:'暖かい海',threshold:0,biomes:['外洋'],featured:'Rhincodon typus'},
 {id:'large-cold-sea',name:'大型生物の海（冷）',short:'大型の海（冷）',en:'LARGE COLD SEA',water:'marine',theme:'冷たい海の大型生物',threshold:0,biomes:['外洋'],featured:'Balaenoptera musculus'},
 {id:'large-warm-sea',name:'大型生物の海（暖）',short:'大型の海（暖）',en:'LARGE WARM SEA',water:'marine',theme:'暖かい海の大型生物',threshold:0,biomes:['外洋'],featured:'Rhincodon typus'},
 {id:'beach',name:'砂浜の水槽',short:'砂浜',en:'SANDY SHORE',water:'marine',theme:'浅い砂の海底',threshold:10,biomes:['砂地'],featured:'Hemitrygon akajei'},
 {id:'reef',name:'サンゴ礁の水槽',short:'サンゴ礁',en:'CORAL REEF',water:'marine',theme:'光の届く浅海',threshold:30,biomes:['岩礁'],featured:'Amphiprion ocellaris'},
 {id:'deep',name:'深海の水槽',short:'深海',en:'THE DEEP',water:'marine',theme:'光の少ない海',threshold:60,biomes:['深海'],featured:'Macropinna microstoma'},
 {id:'river',name:'川の水槽',short:'川',en:'RIVER',water:'fresh',theme:'流れのある淡水',threshold:0,biomes:['淡水'],featured:'Paracheirodon innesi'},
 {id:'lake',name:'湖の水槽',short:'湖',en:'LAKE',water:'fresh',theme:'静かな淡水',threshold:0,biomes:['淡水'],featured:'Oryzias latipes'},
 {id:'estuary-tropical',name:'熱帯マングローブの水槽',short:'熱帯マングローブ',en:'TROPICAL MANGROVE',water:'brackish',theme:'熱帯の汽水',threshold:0,biomes:['淡水'],featured:'Toxotes jaculatrix'},
 {id:'estuary-north',name:'冷たい河口の水槽',short:'冷たい河口',en:'COLD ESTUARY',water:'brackish',theme:'冷たい汽水',threshold:0,biomes:['淡水'],featured:'Platichthys stellatus'},
 {id:'penguin',name:'ペンギンの展示室',short:'ペンギン',en:'PENGUIN COAST',water:'marine',theme:'海と岩の海岸',threshold:0,biomes:['外洋'],featured:'Spheniscus magellanicus'},
 {id:'sea-lion',name:'アシカの展示室',short:'アシカ',en:'SEA LION SHORE',water:'marine',theme:'海と岩場',threshold:0,biomes:['外洋'],featured:'Zalophus californianus'},
 {id:'otter-room',name:'カワウソの展示室',short:'カワウソ',en:'OTTER RIVER',water:'fresh',theme:'川辺と陸場',threshold:0,biomes:['淡水'],featured:'Amblonyx cinereus'}
];
export const ROOM_BY_ID=Object.fromEntries(ROOMS.map(r=>[r.id,r]));
export const roomWater=id=>ROOM_BY_ID[parseTankId(id)?.habitat||id]?.water||null;
export const isBreedingTankId=id=>typeof id==='string'&&id.startsWith('breed:');
export function parseTankId(id){
 if(typeof id==='string'&&Object.prototype.hasOwnProperty.call(ROOM_BY_ID,id))return {id,habitat:id,breeding:false};
 if(isBreedingTankId(id)){const habitat=id.split(':')[1];if(ROOM_BY_ID[habitat])return {id,habitat,breeding:true};}
 return null;
}
export const tankWater=id=>roomWater(id);
export const roomSupports=(id,water)=>roomWater(id)===water;
export const homeForWater=water=>water==='fresh'?'river':water==='brackish'?'estuary-tropical':'cold-sea';
const COASTAL_SHALLOW=new Set([
 'Zostera marina','Sargassum horneri','Halocynthia roretzi','Mytilus unguiculatus',
 'Heterodontus japonicus','Patiria pectinifera','Orectolobus japonicus',
 'Phycodurus eques','Hippocampus coronatus','Enhydra lutris',
 'Enteroctopus dofleini','Panulirus japonicus','Sepioteuthis lessoniana','Sepia officinalis',
 'Aurelia coerulea','Chrysaora pacifica','Cotylorhiza tuberculata','Phoca vitulina'
]);
export const OPEN_SEA_WARM=new Set([
 'Cheilopogon agoo','Mobula birostris','Tursiops truncatus','Chelonia mydas',
 'Rhincodon typus','Galeocerdo cuvier','Sphyrna mokarran',
 'Sphyrna lewini','Thunnus albacares','Katsuwonus pelamis','Istiophorus platypterus',
 'Makaira nigricans','Caretta caretta','Delphinus delphis'
]);
export const OPEN_SEA_COOL=new Set([
 'Lagenorhynchus obliquidens','Thunnus orientalis','Orcinus orca','Cetorhinus maximus',
 'Carcharodon carcharias','Prionace glauca','Isurus oxyrinchus','Mola mola',
 'Scomber japonicus','Seriola quinqueradiata','Trachurus japonicus','Engraulis japonicus',
 'Sardinops sagax','Xiphias gladius','Lampris guttatus',
 'Dermochelys coriacea','Megaptera novaeangliae','Balaenoptera musculus'
]);
export function temperatureRange(sp){
 if(OPEN_SEA_WARM.has(sp?.scientific))return 'warm';
 if(OPEN_SEA_COOL.has(sp?.scientific))return 'cool';
 const n=String(sp?.natural||'');
 if(n.includes('世界各地')||n.includes('世界中'))return 'both';
 if(n.includes('北西太平洋')||n.includes('北太平洋')||n.includes('北大西洋')||n.includes('北半球'))return 'cool';
 if(n.includes('インド')||n.includes('地中海')||n.includes('西太平洋')||n.includes('東シナ海'))return 'warm';
 if(n.includes('大西洋'))return 'warm';
 return 'both';
}
const NORTH_ESTUARY_EXTRA=new Set(['Anguilla japonica','Phoca vitulina','Oncorhynchus keta']);
export function temperatureRooms(sp){
 const range=temperatureRange(sp),large=Number(sp.referenceCm)>=300;
 const cold=large?'large-cold-sea':'cold-sea',warm=large?'large-warm-sea':'warm-sea';
 return range==='cool'?[cold]:range==='warm'?[warm]:[cold,warm];
}
export function compatibleRooms(sp){
 if(!sp)return [];
 if(Array.isArray(sp.candidateRooms))return sp.candidateRooms.filter(id=>Object.prototype.hasOwnProperty.call(ROOM_BY_ID,id));
 if(sp.kind==='environment'){
  if(sp.water==='fresh')return ['river','lake'];
  if(sp.biome==='岩礁')return ['reef'];
  return ['beach'];
 }
 if(sp.water==='fresh')return NORTH_ESTUARY_EXTRA.has(sp.scientific)?['river','lake','estuary-north']:['river','lake'];
 if(sp.water==='brackish')return sp.scientific==='Platichthys stellatus'?['estuary-north']:['estuary-tropical'];
 if(NORTH_ESTUARY_EXTRA.has(sp.scientific))return [...temperatureRooms(sp),'estuary-north'];
 if(sp.biome==='深海'||sp.location==='deep')return ['deep'];
 if(sp.biome==='岩礁')return ['reef'];
 if(sp.biome==='砂地'||COASTAL_SHALLOW.has(sp.scientific))return ['beach'];
 return temperatureRooms(sp);
}
export function compatibleTankIds(sp,state){
 const rooms=compatibleRooms(sp);
 const breeding=(state?.breeding_tanks||[]).filter(t=>rooms.includes(t.habitat)).map(t=>t.id);
 return [...rooms,...breeding];
}
export function isCompatibleTank(sp,tankId,state){
 const parsed=parseTankId(tankId);if(!parsed)return false;
 if(!compatibleRooms(sp).includes(parsed.habitat))return false;
 if(parsed.breeding&&state&&!(state.breeding_tanks||[]).some(t=>t.id===tankId))return false;
 return true;
}
export function preferredRoom(sp){return compatibleRooms(sp)[0]||'cold-sea';}
export function legacyExhibitSection(){return null;}
export function exhibitSection(){return null;}
export function legacyTankCandidate(sp,oldRoom,oldSection){
 if(oldRoom==='beach'||oldRoom==='reef'||oldRoom==='deep')return oldRoom;
 if(oldRoom==='river')return oldSection==='lake'?'lake':'river';
 if(oldRoom==='estuary')return oldSection==='cool'?'estuary-north':'estuary-tropical';
 if(oldRoom==='current'){
  if(oldSection==='cool')return 'cold-sea';
  if(oldSection==='warm')return 'warm-sea';
  if(oldSection==='large'){const rooms=compatibleRooms(sp);return rooms.find(id=>id.startsWith('large-'))||rooms[0];}
 }
 return null;
}
export const DESTINATIONS=[
 {id:'open-ocean',name:'外洋',en:'OPEN OCEAN',time:10800000,demo:30000,unlock:0,subtitle:'広い海へ',color:'#6bb6b4'},
 {id:'coastal',name:'沿岸',en:'COASTAL WATERS',time:14400000,demo:45000,unlock:0,subtitle:'光の届く海辺へ',color:'#6bb6b4'},
 {id:'deep',name:'深海',en:'THE DEEP',time:21600000,demo:60000,unlock:60,subtitle:'光の少ない海へ',color:'#6bb6b4'},
 {id:'river',name:'川',en:'RIVER',time:10800000,demo:30000,unlock:0,subtitle:'流れる水辺へ',color:'#6bb6b4'},
 {id:'lake',name:'湖',en:'LAKE',time:10800000,demo:30000,unlock:0,subtitle:'静かな水辺へ',color:'#6bb6b4'},
 {id:'estuary',name:'河口',en:'ESTUARY',time:10800000,demo:30000,unlock:0,subtitle:'海と川の出会う場所へ',color:'#6bb6b4'}
];
export const RARITY={common:{name:'コモン',symbol:'●'},rare:{name:'レア',symbol:'◆'},epic:{name:'エピック',symbol:'✦'},legendary:{name:'レジェンダリー',symbol:'⬟'},mythic:{name:'ミシック',symbol:'✺'}};
export const CATALOG=[...rows,...expansion,...reviewed,...deepEstuary,...expansion219,...expansion220,...expansion222,...expansion223,...expansion224,...expansion226,...expansion228,...expansion229];
export const OFFICIAL_BY_ID=Object.fromEntries(CATALOG.map(s=>[s.id,s]));
// Only active exhibit animals are in BY_ID. Old identities remain in saves,
// but cannot accidentally grow, breed, be re-identified or appear on display.
export const BY_ID=OFFICIAL_BY_ID;
export const idFor=n=>CATALOG.find(s=>s.number===n)?.id;
export const idOfScientific=name=>CATALOG.find(s=>s.scientific===name)?.id;
export const EVOLUTIONS=[]; // Deliberately none: species do not transform into other species.
export const BASE_IDS=CATALOG.map(s=>s.id);
const RIVER_EXPLORATION=new Set(['Elodea densa','Misgurnus anguillicaudatus','Mauremys japonica','Paracheirodon innesi','Cyprinus carpio','Carassius auratus','Danio rerio','Xiphophorus hellerii','Corydoras sterbai','Ancistrus cirrhosus','Pangasianodon hypophthalmus','Pangasianodon gigas','Scleropages formosus','Oncorhynchus mykiss','Oncorhynchus keta','Potamotrygon motoro']);
const LAKE_EXPLORATION=new Set(['Elodea densa','Oryzias latipes','Oryzias sakaizumii','Misgurnus anguillicaudatus','Mauremys japonica','Cyprinus carpio','Carassius auratus','Danio rerio','Trichogaster lalius','Poecilia reticulata','Corydoras paleatus','Atractosteus spatula','Oncorhynchus mykiss','Pygocentrus nattereri']);
const HABITAT_POOL=Object.fromEntries(['cold-sea','warm-sea','beach','reef','deep','river','lake','estuary-tropical','estuary-north','penguin','sea-lion','otter-room'].map(id=>[id,CATALOG.filter(s=>{
 if(s.candidateRooms)return s.candidateRooms.some(room=>id===room||(id==='cold-sea'&&room==='large-cold-sea')||(id==='warm-sea'&&room==='large-warm-sea'));
 if(id==='river')return s.water==='fresh'&&(RIVER_EXPLORATION.has(s.scientific)||!LAKE_EXPLORATION.has(s.scientific));
 if(id==='lake')return s.water==='fresh'&&LAKE_EXPLORATION.has(s.scientific);
 if(id==='cold-sea')return compatibleRooms(s).some(x=>x==='cold-sea'||x==='large-cold-sea');
 if(id==='warm-sea')return compatibleRooms(s).some(x=>x==='warm-sea'||x==='large-warm-sea');
 return compatibleRooms(s).includes(id);
}).map(s=>s.id)]));
const GROUPS={'open-ocean':['cold-sea','warm-sea'],coastal:['beach','reef','penguin','sea-lion'],deep:['deep'],river:['river','otter-room'],lake:['lake'],estuary:['estuary-tropical','estuary-north']};
export const POOLS=Object.fromEntries(Object.entries(GROUPS).map(([id,rooms])=>[id,[...new Set(rooms.flatMap(room=>HABITAT_POOL[room]))]]));
export const ARCHIVE_BY_ID=Object.fromEntries([
 ...previousRows.map(s=>({id:`sp_${String(s.number).padStart(3,'0')}`,name:s.name,kind:s.kind,previousNumber:s.number})).filter(s=>!OFFICIAL_BY_ID[s.id]),
 ...legacyRows.map(s=>({id:`legacy_${s.id}`,name:s.name,kind:'legacy',previousNumber:s.number}))
].map(s=>[s.id,s]));
// Legacy schema-1 IDs are prefixed, not matched by an ambiguous common name.
export const LEGACY_ID_MAP=Object.fromEntries(legacyRows.map(s=>[s.id,`legacy_${s.id}`]));
export const LEGACY_CATALOG=Object.values(ARCHIVE_BY_ID);
export function poolWeight(sp){return sp?.kind==='environment'?30:({common:40,rare:25,epic:15,legendary:5,mythic:1}[sp?.rarity]||1);}
// Retained as a compatibility helper for old reports; new species have no conditions.
export function conditionText(c){if(!c)return '';return c.raw||'';}

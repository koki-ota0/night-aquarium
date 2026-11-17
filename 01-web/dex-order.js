// Presentation order only. Species IDs, original catalogue numbers and saves never change.
// Coarse categories are deliberately visitor-friendly; within each category GBIF
// order/family/genus bring related animals together rather than sprite shapes.
import taxonomy from './data/dex-taxonomy-221.json' with {type:'json'};
const categories=[
 ['fish','魚'],['mammal','哺乳類'],['bird','鳥類'],['reptile','爬虫類'],['amphibian','両生類'],
 ['jelly','クラゲ'],['invertebrate-mobile','無脊椎動物｜泳ぐ・歩く仲間'],
 ['invertebrate-attached','無脊椎動物｜岩などに定着する仲間'],
 ['plant','水草・海藻'],['other','その他']
];
export const DEX_GROUPS=Object.freeze(categories.map(([id,label])=>Object.freeze({id,label})));
const rank=Object.fromEntries(categories.map(([id],i)=>[id,i]));
export function dexGroup(sp){
 const t=taxonomy[sp.id]||{},sh=sp.shape;
 if(sh==='penguin')return 'bird';
 if(t.class==='Amphibia'||sh==='giantSalamander')return 'amphibian';
 if(['seaTurtle','freshTurtle'].includes(sh))return 'reptile';
 if(['pacificDolphin','bottlenose','orca','dugong','humpback','blueWhale','seal','otter','seaLion','smallOtter'].includes(sh))return 'mammal';
 if(sh==='moonJelly')return 'jelly';
 // Visitor-oriented display groups, not a strict biological classification:
 // corals and tunicates are animals; seaweeds and plants are not.
 if(['Tracheophyta','Ochrophyta','Chlorophyta'].includes(t.phylum))return 'plant';
 if(t.phylum==='Cnidaria'||sh==='ascidian'||['Arthropoda','Mollusca','Echinodermata'].includes(t.phylum))return sp.kind==='environment'?'invertebrate-attached':'invertebrate-mobile';
 if(t.phylum==='Chordata')return 'fish';
 return 'other';
}
const cmp=(a,b)=>a<b?-1:a>b?1:0;
export function compareDex(a,b){
 const ta=taxonomy[a.id]||{},tb=taxonomy[b.id]||{};
 return rank[dexGroup(a)]-rank[dexGroup(b)]||cmp(ta.phylum||'',tb.phylum||'')||cmp(ta.order||'',tb.order||'')||cmp(ta.family||'',tb.family||'')||cmp(ta.genus||'',tb.genus||'')||cmp(a.scientific,b.scientific)||a.number-b.number;
}
export function groupLabel(id){return categories.find(x=>x[0]===id)?.[1]||'その他';}

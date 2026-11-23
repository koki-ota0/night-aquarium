// Visual personalities are derived from an individual's stable UID. They do
// not alter growth, rarity, diet, breeding, or the stored 3D model. Keeping the
// algorithm deterministic also makes it practical to reproduce in Flutter.
const PERSONALITIES=[
 {id:'gentle',label:'おっとり',description:'ゆったりとした動き',speed:.82,range:.88},
 {id:'curious',label:'好奇心旺盛',description:'少し広めに動く',speed:1.08,range:1.12},
 {id:'steady',label:'マイペース',description:'自分のリズムで動く',speed:.96,range:1.00},
];
export function stableHash(value){let h=2166136261;for(const c of String(value??''))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export function personalityFor(fish){return PERSONALITIES[stableHash(fish?.uid||fish?.species_id||'friend')%PERSONALITIES.length];}
export function speciesGesture(sp){return sp?.motionLabel?`この種類は「${sp.motionLabel}」動きをします。`:'それぞれのリズムで、ゆったり泳ぎます。';}

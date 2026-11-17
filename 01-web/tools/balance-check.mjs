// A small reproducible balance comparison, not a guarantee for any player.
// Both cases use the same 80% biological-result roll and existing pool weights.
import {BY_ID,POOLS,poolWeight} from '../catalog.js';
import {UNDISCOVERED_WEIGHT_MULTIPLIER} from '../engine.js';
function random(seed){let x=seed>>>0;return ()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296;};}
function uniqueInVisits(ids,visits,seed,multiplier){
 const rng=random(seed),seen=new Set();
 for(let i=0;i<visits;i++){
  if(rng()>=.8)continue;
  const weights=ids.map(id=>poolWeight(BY_ID[id])*(seen.has(id)?1:multiplier));
  let n=rng()*weights.reduce((a,b)=>a+b,0),index=0;
  while(index<weights.length-1&&(n-=weights[index])>=0)index++;
  seen.add(ids[index]);
 }
 return seen.size;
}
const trials=3000,visits=24;
console.log(`探索：各場所${visits}回、${trials}試行。獲得種数の平均（初回保証・今日の魚を除く）`);
for(const [name,ids] of Object.entries(POOLS)){
 let old=0,adjusted=0;for(let i=0;i<trials;i++){const seed=i+name.charCodeAt(0)*100000;old+=uniqueInVisits(ids,visits,seed,1);adjusted+=uniqueInVisits(ids,visits,seed,UNDISCOVERED_WEIGHT_MULTIPLIER);}
 console.log(`  ${name.padEnd(6)} ${String(ids.length).padStart(2)}候補: ${(old/trials).toFixed(2)} → ${(adjusted/trials).toFixed(2)}種`);
}
console.log('  行き先を分けると狙った種類に出会いやすくなる一方、繰り返すと重複も増えます。');
console.log('\n毎日1回給餌、初期おなか70。給餌直前のおなか（旧2/時 → 新1/時）');
let old=70,adjusted=70;for(let day=1;day<=5;day++){
 old=Math.max(0,old-48);adjusted=Math.max(0,adjusted-24);console.log(`  ${day}日目: ${old} → ${adjusted}`);old=Math.min(100,old+35);adjusted=Math.min(100,adjusted+35);
}
console.log('\n新規優遇は確定ではなく、この簡易試算は食性・給餌上限・繁殖30%の結果を予測しません。');

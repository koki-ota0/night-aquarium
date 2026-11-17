// Five reference-dimension bands for a readable game exhibit, not biological
// size categories. Every animal uses the same boundaries: the figure is an
// approximate species-level reference, not this individual animal's length.
export const SIZE_CLASSES=Object.freeze({
 small:Object.freeze({label:'小型',range:'30cm未満',minCm:0,maxCm:30}),
 medium:Object.freeze({label:'中型',range:'30cm以上〜1m未満',minCm:30,maxCm:100}),
 large:Object.freeze({label:'大型',range:'1m以上〜3m未満',minCm:100,maxCm:300}),
 giant:Object.freeze({label:'超大型',range:'3m以上〜8m未満',minCm:300,maxCm:800}),
 colossal:Object.freeze({label:'超巨大',range:'8m以上',minCm:800,maxCm:Infinity})
});
// Continuous log interpolation through hand-tuned display anchors. Adjacent
// sizes are never abruptly enlarged at a category boundary. The compression
// prevents a 25m whale from hiding a 14cm clownfish; these are NOT true ratios.
export const DISPLAY_ANCHORS=Object.freeze([
 Object.freeze([3,.50]),Object.freeze([30,.92]),Object.freeze([100,1.55]),
 Object.freeze([300,3.35]),Object.freeze([800,5.50]),Object.freeze([2500,8.80])
]);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function classifyReferenceCm(value){
 const cm=Number(value);if(!Number.isFinite(cm)||cm<=0)return null;
 return Object.keys(SIZE_CLASSES).find(key=>cm>=SIZE_CLASSES[key].minCm&&cm<SIZE_CLASSES[key].maxCm)||null;
}
export function sizeClass(sp){
 if(sp?.kind==='environment')return null;
 return classifyReferenceCm(sp?.referenceCm)||(SIZE_CLASSES[sp?.sizeClass]?sp.sizeClass:null);
}
export function sizeClassLabel(sp){const c=sizeClass(sp);return c?SIZE_CLASSES[c].label:sp?.kind==='environment'?'環境種':'未設定';}
export function visualLength(sp){
 const cm=Number(sp?.referenceCm);if(sp?.kind==='environment'||!Number.isFinite(cm)||cm<=0)return 1;
 if(cm<=DISPLAY_ANCHORS[0][0])return DISPLAY_ANCHORS[0][1];
 for(let i=1;i<DISPLAY_ANCHORS.length;i++){
  const [hiCm,hiLength]=DISPLAY_ANCHORS[i],[loCm,loLength]=DISPLAY_ANCHORS[i-1];
  if(cm<=hiCm){const t=(Math.log(cm)-Math.log(loCm))/(Math.log(hiCm)-Math.log(loCm));return loLength+(hiLength-loLength)*t;}
 }
 return DISPLAY_ANCHORS.at(-1)[1];
}
export function visualIndividualScale(f){
 // Retain saved variation unchanged, but limit its visual effect so that
 // inter-species scale remains readable; young animals gradually reach 1x.
 const variation=Number.isFinite(f?.size)?clamp(f.size,.95,1.05):1;
 const growth=Number.isFinite(f?.growth)?clamp(f.growth,0,100):0;
 return variation*(Array.isArray(f?.parents)&&f.parents.length>0?(.95+.05*growth/100):1);
}
export function formatReference(cm){
 const n=Number(cm);if(!Number.isFinite(n)||n<=0)return '不明';
 return n>=100?`${Number((n/100).toFixed(2))}m`:`${n}cm`;
}

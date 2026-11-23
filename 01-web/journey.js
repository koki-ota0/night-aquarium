// Pure presentation helpers. The voyage never influences the exploration roll,
// timers, save data, rewards or the first-exploration guarantee.
export const JOURNEY_STAGES=Object.freeze([
 Object.freeze({id:'outbound',label:'出発',caption:'水族館を出発。光の中をすすみます。'}),
 Object.freeze({id:'search',label:'探索',caption:'水の向こうを、ゆっくり探しています。'}),
 Object.freeze({id:'return',label:'帰り道',caption:'探索を終えて、水族館へ戻ります。'})
]);
export function journeyProgress(active,now=Date.now()){
 if(!active)return {fraction:0,stage:0};
 const start=Number(active.started_at),end=Number(active.ends_at);
 if(!Number.isFinite(start)||!Number.isFinite(end))return {fraction:0,stage:0};
 const fraction=end>start?Math.max(0,Math.min(1,(now-start)/(end-start))):(now>=end?1:0);
 return {fraction,stage:fraction<.20?0:fraction<.75?1:2};
}

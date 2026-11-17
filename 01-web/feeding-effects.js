// Presentation-only meal choreography. It never applies food, changes growth,
// selects eligible animals or touches the player's saved view or inventory.
export const FEEDING_DURATION=4.9;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const n=clamp(x);return n*n*(3-2*n);};
export function feedingFrame(seconds,delay=0){
 const t=Math.max(0,Number(seconds)||0),local=Math.max(0,t-Math.max(0,Number(delay)||0));
 const bite=smooth((local-2.05)/.68),burst=clamp((local-2.52)/.75);
 return {
  phase:t<1.65?'fall':t<2.15?'approach':t<3.05?'bite':'settle',
  fall:smooth(local/1.7),
  approach:smooth((t-.28)/1.65)*(1-smooth((t-3.0)/1.15)),
  bite,
  pelletScale:1-bite,
  burst,
  burstVisible:local>=2.52&&local<3.27,
  // Pan ahead of the zoom so a previously off-screen eater can enter frame.
  cameraPan:smooth((t-.15)/.65)*(1-smooth((t-3.60)/1.05)),
  camera:smooth((t-.45)/.80)*(1-smooth((t-3.60)/1.05)),
  done:t>=FEEDING_DURATION
 };
}

// Deterministic, smooth exhibit motion inspired by documented habitat and
// locomotion. These are artistic approximations, NOT measured animal speeds.
import {stableHash} from './personality.js';
const PROFILES=Object.freeze({
 fast:{speed:.72,range:1.00,layer:.65,vertical:.48,depth:.70},
 school:{speed:.50,range:.90,layer:.70,vertical:.42,depth:.65},
 roam:{speed:.31,range:.88,layer:.32,vertical:.48,depth:.62},
 reef:{speed:.37,range:.68,layer:-.08,vertical:.48,depth:.55},
 hover:{speed:.22,range:.38,layer:.00,vertical:.35,depth:.35},
 vertical:{speed:.20,range:.33,layer:.20,vertical:1.62,depth:.35},
 jelly:{speed:.15,range:.30,layer:.55,vertical:1.72,depth:.30},
 squid:{speed:.34,range:.72,layer:.25,vertical:1.05,depth:.45},
 glide:{speed:.25,range:.95,layer:.15,vertical:.65,depth:.55},
 mammal:{speed:.27,range:.95,layer:.80,vertical:.65,depth:.55},
 surface:{speed:.42,range:.88,layer:2.00,vertical:.22,depth:.45},
 dart:{speed:.56,range:.66,layer:-.15,vertical:.35,depth:.40},
 turtle:{speed:.20,range:.72,layer:.20,vertical:.52,depth:.44},
 snake:{speed:.32,range:.82,layer:-.45,vertical:.40,depth:.50},
 bottom:{speed:.16,range:.40,layer:-3.72,vertical:.045,depth:.32,benthic:true},
 breathing:{speed:.19,range:.38,layer:-3.72,vertical:.04,depth:.32,benthic:true},
 bottomGlide:{speed:.20,range:.60,layer:-3.70,vertical:.055,depth:.35,benthic:true},
 crawl:{speed:.095,range:.36,layer:-3.82,vertical:.015,depth:.30,benthic:true},
 burrow:{speed:.085,range:.18,layer:-3.82,vertical:.012,depth:.22,benthic:true},
 sit:{speed:0,range:0,layer:-3.79,vertical:.008,depth:0,benthic:true,resting:true},
 fixed:{speed:0,range:0,layer:-4.14,vertical:0,depth:0,stationary:true}
});
export function motionProfile(sp){return PROFILES[sp?.motion]||PROFILES.roam;}
// Width/height are half-extents in world units; displayLength reserves space at
// the edges, keeping the larger models in view. Time is continuous and no
// fish is assigned to a small cell around a fixed grid point.
export function sampleMotion(sp,fish,t,{halfW=5,halfH=5,displayLength=1,speed=1,range=1,maxWidth=5.1,verticalScale=1}={}){
 const cfg=motionProfile(sp),h=stableHash(fish?.uid||sp?.id||'fish'),q=stableHash(sp?.scientific||sp?.id||'species');
 const phase=(h%6283)/1000,phase2=((h>>>8)%6283)/1000,individual=.89+(q%23)/100;
 const w=cfg.speed*Math.max(.1,speed)*individual;
 // Reserve at least half of the longest display dimension at both edges.
 // The extra margin accommodates the slow turn and tail movement of giants.
 const radius=Math.min(displayLength*.55,Math.max(.1,halfW-.38));
 const room=Math.max(.08,Math.min(maxWidth,halfW-.30-radius));
 const amp=room*Math.min(1,cfg.range*Math.max(.5,range));
 // Keep surface species near the surface; distribute other individuals
 // through a broader mid-water band instead of stacking them on one line.
 const spread=sp?.motion==='surface'?.14:sp?.motion==='jelly'?.22:.36;
 const layerSpread=cfg.benthic?0:((h%9)-4)*spread;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const baseY=clamp((cfg.layer+layerSpread)*verticalScale,-Math.min(3.7,halfH-1),Math.max(-1,halfH-1.2));
 if(cfg.stationary)return {x:0,y:cfg.layer,z:0,dx:0,benthic:false,stationary:true};
 if(cfg.resting){const x=((h%1000)/999-.5)*room*1.25;return {x,y:cfg.layer,z:((h>>>12)%1000/999-.5)*.5,dx:0,benthic:true,resting:true};}
 // Two incommensurate waves make each route continuous and avoid a rigid grid.
 const wave=t*w+phase,wave2=t*w*.43+phase2;
 const x=amp*(.80*Math.sin(wave)+.20*Math.sin(wave2));
 const dx=amp*w*(.80*Math.cos(wave)+.086*Math.cos(wave2));
 const breath=sp?.motion==='breathing'?Math.pow(Math.max(0,Math.sin(t*.10+phase2)),12)*6.0:0;
 const y=cfg.benthic?cfg.layer+Math.sin(t*.55+phase)*cfg.vertical+breath:
   clamp(baseY+cfg.vertical*verticalScale*Math.sin(t*Math.max(.12,w*.64)+phase2),-Math.min(3.15,halfH-1),Math.max(-1,halfH-1));
 const z=cfg.depth*Math.sin(t*Math.max(.10,w*.52)+phase2);
 return {x,y,z,dx,benthic:!!cfg.benthic,stationary:false};
}
export const MOTION_KEYS=Object.keys(PROFILES);

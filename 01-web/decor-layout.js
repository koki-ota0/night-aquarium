// Per-room and per-water, purely visual arrangement. Item counts remain in
// tank.quantities and therefore keep their existing evolution semantics.
import {ROOMS,parseTankId} from './catalog.js';

export const DECOR_TYPES=['plants','rock','sand'];
export const DECOR_MAX={plants:5,rock:3,sand:3};
export const LAYOUT_BOUNDS={minX:-5.4,maxX:5.4,minZ:-2.7,maxZ:2.7};
const WATER=new Set(['marine','fresh','brackish']);
const ROOM=new Set(ROOMS.map(r=>r.id));
const DEFAULTS={
 plants:[[-5.1,-1.5],[-4.1,-2.1],[-2.6,-2.7],[1.7,-1.5],[3.2,-2.1]],
 rock:[[-4.8,-1.8],[-1.8,-2.6],[4.3,-1.4]],
 sand:[[-2.6,.1],[.3,.1],[3.5,.1]],
};
const PRESETS={
 wide:{
  plants:[[-4.7,-2.15],[-2.35,-2.15],[0,-2.15],[2.35,-2.15],[4.7,-2.15]],
  rock:[[-3.3,-.55],[0,-.55],[3.3,-.55]],
  sand:[[-2.7,1.35],[0,1.35],[2.7,1.35]],
 },
 cluster:{
  plants:[[-2.4,-2],[-1.2,-2],[0,-2],[1.2,-2],[2.4,-2]],
  rock:[[-1.5,-.5],[0,-.5],[1.5,-.5]],
  sand:[[-1.7,1.25],[0,1.25],[1.7,1.25]],
 },
};
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const round=n=>Math.round(n*100)/100;
export const layoutTankKey=(room,water)=>`${parseTankId(room)?.habitat||room}:${water}`;
export const decorItemKey=(type,index)=>`${type}:${index}`;
export function validLayoutScope(room,water){return !!parseTankId(room)&&WATER.has(water);}
export function validDecorSlot(type,index){return DECOR_TYPES.includes(type)&&Number.isInteger(index)&&index>=0&&index<DECOR_MAX[type];}
export function defaultDecorPosition(type,index){
 if(!validDecorSlot(type,index))return null;
 const [x,z]=DEFAULTS[type][index];return {x,z,rotation:0};
}
export function getDecorPosition(state,room,water,type,index){
 const fallback=defaultDecorPosition(type,index);if(!fallback||!validLayoutScope(room,water))return null;
 const p=state.tank?.layouts?.[layoutTankKey(room,water)]?.[decorItemKey(type,index)];
 if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.z)||!Number.isFinite(p.rotation))return fallback;
 return {x:round(clamp(p.x,LAYOUT_BOUNDS.minX,LAYOUT_BOUNDS.maxX)),z:round(clamp(p.z,LAYOUT_BOUNDS.minZ,LAYOUT_BOUNDS.maxZ)),rotation:((Math.round(p.rotation/45)*45)%360+360)%360};
}
export function visibleDecor(state,room,water){
 if(!validLayoutScope(room,water))return [];
 const out=[];for(const type of DECOR_TYPES){const count=clamp(Math.floor(Number(state.tank?.quantities?.[type])||0),0,DECOR_MAX[type]);
  for(let index=0;index<count;index++)out.push({type,index,...getDecorPosition(state,room,water,type,index)});
 }return out;
}
export function setDecorPosition(state,room,water,type,index,position){
 if(!validLayoutScope(room,water)||!validDecorSlot(type,index)||index>=(Number(state.tank?.quantities?.[type])||0))return false;
 if(!position||!Number.isFinite(position.x)||!Number.isFinite(position.z)||!Number.isFinite(position.rotation))return false;
 const next={x:round(clamp(position.x,LAYOUT_BOUNDS.minX,LAYOUT_BOUNDS.maxX)),z:round(clamp(position.z,LAYOUT_BOUNDS.minZ,LAYOUT_BOUNDS.maxZ)),rotation:((Math.round(position.rotation/45)*45)%360+360)%360};
 state.tank.layouts??={};const key=layoutTankKey(room,water);state.tank.layouts[key]??={};state.tank.layouts[key][decorItemKey(type,index)]=next;return true;
}
export function applyDecorPreset(state,room,water,preset){
 if(!validLayoutScope(room,water)||!['default','wide','cluster'].includes(preset))return false;
 state.tank.layouts??={};const key=layoutTankKey(room,water);
 if(preset==='default'){delete state.tank.layouts[key];return true;}
 // Keep positions for currently hidden slots too: reducing then increasing a
 // quantity should not unexpectedly shuffle the restored decoration.
 const map={};for(const type of DECOR_TYPES)for(let i=0;i<DECOR_MAX[type];i++){
  const [x,z]=PRESETS[preset][type][i];map[decorItemKey(type,i)]={x,z,rotation:0};
 }
 state.tank.layouts[key]=map;return true;
}

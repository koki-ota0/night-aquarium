// Exploration destinations are the individual exhibit habitats themselves.
// There are no grouped destinations or sub-spots.
import {POOLS} from './catalog.js';
export function spotsFor(){return [];}
export function explorationSpot(){return null;}
export function validExplorationSpot(destination,id){return (id==null||id==='')&&Object.prototype.hasOwnProperty.call(POOLS,destination);}
export function explorationPool(destination,id){
 if(id!=null&&id!=='')return [];
 return POOLS[destination]||[];
}
export function explorationName(){return null;}

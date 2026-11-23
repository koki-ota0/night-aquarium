// Export the actual Three.js voxel instances to an engine-neutral Flutter asset.
// Unlike export-mobile.mjs this preserves the pivots of independently animated parts.
// Run from night-aquarium after npm ci: node tools/export-flutter.mjs ../yoru-flutter/assets/models
import {mkdir, writeFile} from 'node:fs/promises';
import * as THREE from 'three';
import {CATALOG, LEGACY_CATALOG} from '../catalog.js';
import {createSpeciesModel} from '../species-models.js';
const out=process.argv[2] || '../yoru-flutter/assets/models';
await mkdir(out, {recursive:true});
const round=v=>Math.round(v*100000)/100000;
let total=0, movable=0, count=0;
for (const sp of [...CATALOG,...LEGACY_CATALOG]) {
  const model=createSpeciesModel(sp), root=model.group;
  root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const definitions=new Map();
  for (const [type,value] of Object.entries(model.parts || {})) {
    const entries=Array.isArray(value)?value:[value];
    entries.forEach((item,index)=>{
      const part=item?.group?.isObject3D?item.group:item;
      if (!part?.isObject3D) return;
      const position=new THREE.Vector3(); part.getWorldPosition(position);
      definitions.set(part,{type,index,side:item?.side ?? (index?1:-1),pivot:position});
    });
  }
  const parts=new Map();
  const body={type:'body',index:0,side:0,pivot:center.clone(),blocks:[]};
  parts.set('body',body);
  const local=new THREE.Matrix4(),world=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3(),color=new THREE.Color();
  let unsupported=[];
  root.traverse(node=>{
    if(node.isMesh&&!node.isInstancedMesh) {unsupported.push(node.name||node.type); return;}
    if(!node.isInstancedMesh)return;
    let ancestor=node, def;
    while(ancestor && !def){def=definitions.get(ancestor); ancestor=ancestor.parent;}
    const key=def?`${def.type}:${def.index}`:'body';
    if(!parts.has(key))parts.set(key,{...def,blocks:[]});
    const part=parts.get(key);
    for(let i=0;i<node.count;i++){
      node.getMatrixAt(i,local);world.multiplyMatrices(node.matrixWorld,local);world.decompose(p,q,s);node.getColorAt(i,color);
      part.blocks.push([round(p.x-part.pivot.x),round(p.y-part.pivot.y),round(p.z-part.pivot.z),round(s.x),round(s.y),round(s.z),round(q.x),round(q.y),round(q.z),round(q.w),color.getHex()]);
      total++;
    }
  });
  if(unsupported.length)throw new Error(`Unsupported model ${sp.id}: ${unsupported}`);
  const serialized=[...parts.values()].filter(p=>p.blocks.length).map(part=>({
    type:part.type,index:part.index,side:part.side,
    pivot:[round(part.pivot.x-center.x),round(part.pivot.y-center.y),round(part.pivot.z-center.z)],
    blocks:part.blocks,
  }));
  if(!serialized.length)throw new Error(`Empty model ${sp.id}`);
  movable+=serialized.filter(p=>p.type!=='body').length;
  await writeFile(`${out}/${sp.id}.json`, JSON.stringify({id:sp.id,extent:[round(size.x),round(size.y),round(size.z)],kind:model.kind||'other',parts:serialized}));
  count++;
}
console.log(`Exported ${count} Three.js models, ${total} blocks, ${movable} movable part groups.`);

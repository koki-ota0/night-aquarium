// Convert the exact Three.js voxel instances and assembled catalog to portable
// engine-neutral data. The runtime is Godot; no JavaScript is shipped in the app.
import {mkdir,writeFile} from 'node:fs/promises';
import * as THREE from 'three';
import {CATALOG,LEGACY_CATALOG} from '../catalog.js';
import {careProfile,FOODS} from '../care-profiles.js';
import {visualLength} from '../size-classes.js';
import {createSpeciesModel} from '../species-models.js';
const out=process.argv[2]||'../yoru-mobile/assets';
await mkdir(`${out}/models`,{recursive:true});
const catalog=CATALOG.map(sp=>({...sp,care:sp.kind==='environment'?null:careProfile(sp),visual_length:sp.kind==='environment'?1:visualLength(sp)}));
await writeFile(`${out}/catalog.json`,JSON.stringify(catalog));
const legacy=LEGACY_CATALOG.map(sp=>({...sp,care:careProfile(sp),visual_length:visualLength(sp)}));
await writeFile(`${out}/legacy.json`,JSON.stringify(legacy));
await writeFile(`${out}/foods.json`,JSON.stringify(FOODS));
const round=v=>Math.round(v*100000)/100000;
let total=0;
for(const sp of [...CATALOG,...LEGACY_CATALOG]){
 const root=createSpeciesModel(sp).group;root.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
 let blocks=[],unsupported=[];const local=new THREE.Matrix4(),world=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3(),c=new THREE.Color();
 root.traverse(node=>{
  if(node.isMesh&&!node.isInstancedMesh){unsupported.push(node.name||node.type);return;}
  if(!node.isInstancedMesh)return;
  for(let i=0;i<node.count;i++){
   node.getMatrixAt(i,local);world.multiplyMatrices(node.matrixWorld,local);world.decompose(p,q,s);node.getColorAt(i,c);
   blocks.push([round(p.x-center.x),round(p.y-center.y),round(p.z-center.z),round(s.x),round(s.y),round(s.z),round(q.x),round(q.y),round(q.z),round(q.w),c.getHex()]);
  }
 });
 if(unsupported.length)throw Error(`Unsupported non-instanced meshes for ${sp.id}: ${unsupported}`);
 if(!blocks.length)throw Error(`Empty model ${sp.id}`);
 total+=blocks.length;
 await writeFile(`${out}/models/${sp.id}.json`,JSON.stringify({id:sp.id,extent:[round(size.x),round(size.y),round(size.z)],blocks}));
}
console.log(`Exported ${catalog.length} official and ${legacy.length} legacy models; ${total} voxel instances.`);

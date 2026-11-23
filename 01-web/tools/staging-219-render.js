import * as THREE from 'three';
import CATALOG from '../data/expansion-216/curated-219.json' with {type:'json'};import {createSpeciesModel} from '../species-models.js';
const canvas=document.getElementById('render');
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(240,200,false);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;renderer.setClearColor(0,0);
const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xeaffff,0x506879,1.6));const key=new THREE.DirectionalLight(0xfff2df,2.2);key.position.set(-5,9,10);scene.add(key);const fill=new THREE.DirectionalLight(0x8ee7e6,.5);fill.position.set(7,4,-8);scene.add(fill);
const camera=new THREE.OrthographicCamera(-3,3,2.5,-2.5,.1,80);let current;
window.makeThumb=(index)=>{
 if(current){scene.remove(current);current.traverse(o=>{if(o.isInstancedMesh)o.dispose();});}
 const sp=CATALOG[index],model=createSpeciesModel(sp);current=model.group;scene.add(current);current.rotation.y=.24;current.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(current),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());current.position.sub(center);
 const overhead=['manta','stingray','flatfish','starfish','urchin','octopus'].includes(sp.shape);
 const dim=Math.max(size.x,size.y*(overhead?.85:1),size.z*(overhead?.8:.55),1);const h=dim*.62;camera.left=-h*1.2;camera.right=h*1.2;camera.top=h;camera.bottom=-h;camera.position.set(0,overhead?23:6.8,overhead?20:22);camera.lookAt(0,0,0);camera.updateProjectionMatrix();renderer.render(scene,camera);return canvas.toDataURL('image/webp',.84);
};
window.renderReady=true;
